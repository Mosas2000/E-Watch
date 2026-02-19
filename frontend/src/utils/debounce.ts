/**
 * Debounce utility
 *
 * Delays invoking the provided function until after the specified wait
 * time has elapsed since the last invocation. Useful for search inputs
 * where you want to wait for the user to stop typing before firing a
 * request.
 *
 * Returns a wrapper function with a .cancel() method to abort any
 * pending invocation.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  waitMs: number,
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      fn(...args);
    }, waitMs);
  };

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced as T & { cancel: () => void };
}
