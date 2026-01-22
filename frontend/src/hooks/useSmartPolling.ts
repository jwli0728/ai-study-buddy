import { useEffect, useRef, useState } from 'react';

export interface UseSmartPollingOptions {
  baseInterval: number;
  maxInterval?: number;
  backoffMultiplier?: number;
  onPoll: () => Promise<void>;
  enabled: boolean;
}

/**
 * Smart polling hook with adaptive backoff
 *
 * Features:
 * - Backs off on errors (including rate limits)
 * - Resets to base interval on success
 * - Pauses when browser tab is hidden
 * - Automatic cleanup on unmount
 *
 * @param options - Polling configuration
 * @returns Current interval and error count
 */
export function useSmartPolling(options: UseSmartPollingOptions) {
  const {
    baseInterval,
    maxInterval = 30000, // Default max: 30 seconds
    backoffMultiplier = 2,
    onPoll,
    enabled,
  } = options;

  const [currentInterval, setCurrentInterval] = useState(baseInterval);
  const [errorCount, setErrorCount] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef(true);

  // Track if tab is visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;

      // Resume polling immediately when tab becomes visible
      if (!document.hidden && enabled) {
        schedulePoll(currentInterval);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, currentInterval]);

  const schedulePoll = (delay: number) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Only schedule if enabled and tab is visible
    if (!enabled || !isVisibleRef.current) {
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        await onPoll();

        // Success - reset to base interval
        if (currentInterval !== baseInterval) {
          setCurrentInterval(baseInterval);
        }
        if (errorCount > 0) {
          setErrorCount(0);
        }

        // Schedule next poll at base interval
        schedulePoll(baseInterval);
      } catch (error) {
        // Error - back off exponentially
        const newErrorCount = errorCount + 1;
        setErrorCount(newErrorCount);

        const newInterval = Math.min(
          baseInterval * Math.pow(backoffMultiplier, newErrorCount),
          maxInterval
        );
        setCurrentInterval(newInterval);

        console.warn(
          `[Smart Polling] Error during poll (${newErrorCount} consecutive errors). ` +
          `Backing off to ${newInterval}ms`
        );

        // Schedule next poll with backoff
        schedulePoll(newInterval);
      }
    }, delay);
  };

  // Main polling effect
  useEffect(() => {
    if (enabled) {
      // Start polling immediately
      schedulePoll(0);
    }

    // Cleanup on unmount or when disabled
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [enabled, baseInterval, maxInterval, backoffMultiplier, onPoll]);

  const reset = () => {
    setCurrentInterval(baseInterval);
    setErrorCount(0);
  };

  return {
    currentInterval,
    errorCount,
    reset,
  };
}
