import { useEffect, useMemo, useRef } from 'react';
import { throttle } from '../utils/throttle';

/**
 * React hook that returns a throttled version of the callback.
 *
 * The throttled function is stable across renders and is automatically
 * cancelled on unmount to prevent orphaned timer callbacks.
 *
 * Usage:
 *   const throttledRefresh = useThrottle(() => {
 *     refreshData();
 *   }, 5000);
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  intervalMs: number,
): T & { cancel: () => void } {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttled = useMemo(
    () =>
      throttle((...args: Parameters<T>) => {
        callbackRef.current(...args);
      }, intervalMs) as T & { cancel: () => void },
    [intervalMs],
  );

  useEffect(() => {
    return () => throttled.cancel();
  }, [throttled]);

  return throttled;
}
