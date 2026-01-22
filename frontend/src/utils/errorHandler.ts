/**
 * Standardized error message extraction with rate limit awareness
 */

import { isRateLimitError } from './rateLimit';

/**
 * Extract user-friendly error message from error object
 * Provides special handling for rate limit errors (429)
 * @param error - Error object from axios or other source
 * @returns User-friendly error message
 */
export function extractErrorMessage(error: any): string {
  // Check for rate limit error first
  if (isRateLimitError(error)) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  // Extract from axios error response
  if (error?.response?.data) {
    // Try common error message fields
    if (error.response.data.detail) {
      return error.response.data.detail;
    }
    if (error.response.data.message) {
      return error.response.data.message;
    }
    if (error.response.data.error) {
      return error.response.data.error;
    }
    // If data is a string, use it directly
    if (typeof error.response.data === 'string') {
      return error.response.data;
    }
  }

  // Fall back to error message
  if (error?.message) {
    return error.message;
  }

  // Default fallback
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Check if error message indicates a rate limit
 * Useful for checking error strings from various sources
 * @param message - Error message string
 * @returns True if message indicates rate limiting
 */
export function isRateLimitMessage(message: string): boolean {
  const rateLimitKeywords = [
    'rate limit',
    'too many requests',
    'throttled',
    '429',
  ];

  const lowerMessage = message.toLowerCase();
  return rateLimitKeywords.some(keyword => lowerMessage.includes(keyword));
}
