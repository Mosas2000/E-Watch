/**
 * Throttle utility
 *
 * Ensures the provided function is called at most once per specified
 * interval. Unlike debounce, throttle fires immediately on the first
 * call and then ignores subsequent calls until the interval elapses.
 *
 * Useful for submit buttons, scroll handlers, and any action where
 * the first invocation should execute immediately but repeated rapid
 * calls should be suppressed.
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  intervalMs: number,
): T & { cancel: () => void } {
  let lastCallTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const throttled = (...args: Parameters<T>) => {
    const now = Date.now();
    const elapsed = now - lastCallTime;

    if (elapsed >= intervalMs) {
      lastCallTime = now;
      fn(...args);
    } else if (timeoutId === null) {
      // Schedule a trailing call so the last invocation is not lost
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        timeoutId = null;
        fn(...args);
      }, intervalMs - elapsed);
    }
  };

  throttled.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return throttled as T & { cancel: () => void };
}
