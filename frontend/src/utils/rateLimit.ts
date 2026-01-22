/**
 * Rate limit utilities for handling 429 responses and implementing retry logic
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitterPercent?: number;
  onRetry?: (attempt: number, delay: number) => void;
}

export interface RateLimitInfo {
  isRateLimit: boolean;
  retryAfter?: number;
  message?: string;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 32000, // 32 seconds
  backoffMultiplier: 2,
  jitterPercent: 20, // ±20%
  onRetry: () => {},
};

/**
 * Calculate exponential backoff delay with jitter
 * @param attempt - Current retry attempt (1-indexed)
 * @param baseDelay - Base delay in milliseconds
 * @param multiplier - Exponential multiplier
 * @param maxDelay - Maximum delay cap
 * @param jitterPercent - Jitter percentage (0-100)
 * @returns Delay in milliseconds
 */
export function calculateBackoff(
  attempt: number,
  baseDelay: number = DEFAULT_OPTIONS.baseDelay,
  multiplier: number = DEFAULT_OPTIONS.backoffMultiplier,
  maxDelay: number = DEFAULT_OPTIONS.maxDelay,
  jitterPercent: number = DEFAULT_OPTIONS.jitterPercent
): number {
  // Calculate exponential delay: baseDelay * (multiplier ^ (attempt - 1))
  const exponentialDelay = baseDelay * Math.pow(multiplier, attempt - 1);

  // Cap at maxDelay
  const cappedDelay = Math.min(exponentialDelay, maxDelay);

  // Add jitter: random value between -jitterPercent% and +jitterPercent%
  const jitterRange = cappedDelay * (jitterPercent / 100);
  const jitter = (Math.random() * 2 - 1) * jitterRange;

  return Math.max(0, Math.floor(cappedDelay + jitter));
}

/**
 * Parse Retry-After header value
 * Supports both delay-seconds (integer) and HTTP-date formats
 * @param retryAfter - Retry-After header value
 * @returns Delay in milliseconds, or undefined if invalid
 */
export function parseRetryAfter(retryAfter: string | undefined): number | undefined {
  if (!retryAfter) {
    return undefined;
  }

  // Try parsing as integer (delay-seconds format)
  const seconds = parseInt(retryAfter, 10);
  if (!isNaN(seconds) && seconds > 0) {
    return seconds * 1000; // Convert to milliseconds
  }

  // Try parsing as HTTP-date format
  const date = new Date(retryAfter);
  if (!isNaN(date.getTime())) {
    const delay = date.getTime() - Date.now();
    return delay > 0 ? delay : undefined;
  }

  return undefined;
}

/**
 * Sleep utility for async/await
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is a rate limit error (429 status)
 * @param error - Error object from axios or other source
 * @returns True if error is a rate limit error
 */
export function isRateLimitError(error: any): boolean {
  return error?.response?.status === 429;
}

/**
 * Extract rate limit information from error
 * @param error - Error object
 * @returns Rate limit info including retry-after value
 */
export function extractRateLimitInfo(error: any): RateLimitInfo {
  if (!isRateLimitError(error)) {
    return { isRateLimit: false };
  }

  const retryAfter = parseRetryAfter(error.response?.headers?.['retry-after']);
  const message = error.response?.data?.detail ||
                  error.response?.data?.message ||
                  'Too many requests. Please try again later.';

  return {
    isRateLimit: true,
    retryAfter,
    message,
  };
}

/**
 * Retry a function with exponential backoff
 * @param fn - Async function to retry
 * @param options - Retry configuration options
 * @returns Result of the function
 * @throws Last error if all retries fail
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // If this was the last attempt, throw
      if (attempt > opts.maxRetries) {
        throw error;
      }

      // Check if it's a rate limit error
      const rateLimitInfo = extractRateLimitInfo(error);

      // Calculate delay
      let delay: number;
      if (rateLimitInfo.isRateLimit && rateLimitInfo.retryAfter) {
        // Use Retry-After header if available
        delay = Math.min(rateLimitInfo.retryAfter, opts.maxDelay);
      } else if (rateLimitInfo.isRateLimit || error?.response?.status >= 500) {
        // Retry on rate limits or server errors
        delay = calculateBackoff(
          attempt,
          opts.baseDelay,
          opts.backoffMultiplier,
          opts.maxDelay,
          opts.jitterPercent
        );
      } else {
        // Don't retry on client errors (4xx except 429)
        throw error;
      }

      // Call retry callback
      opts.onRetry(attempt, delay);

      // Wait before retrying
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}
