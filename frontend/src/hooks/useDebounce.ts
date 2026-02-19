import { useEffect, useMemo, useRef } from 'react';
import { debounce } from '../utils/debounce';

/**
 * React hook that returns a debounced version of the callback.
 *
 * The debounced function is stable across renders (same reference)
 * and is automatically cancelled on unmount to prevent state updates
 * on unmounted components.
 *
 * Usage:
 *   const debouncedSearch = useDebounce((query: string) => {
 *     searchAPI(query);
 *   }, 300);
 */
export function useDebounce<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delayMs: number,
): T & { cancel: () => void } {
  const callbackRef = useRef(callback);

  // Keep the ref current so the debounced wrapper always calls
  // the latest version of the callback without recreating itself
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debounced = useMemo(
    () =>
      debounce((...args: Parameters<T>) => {
        callbackRef.current(...args);
      }, delayMs) as T & { cancel: () => void },
    [delayMs],
  );

  // Cancel on unmount
  useEffect(() => {
    return () => debounced.cancel();
  }, [debounced]);

  return debounced;
}
