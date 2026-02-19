/**
 * Rate limiter for API endpoint protection
 *
 * Tracks invocation timestamps and rejects calls that exceed the
 * configured rate. Uses a sliding window approach: only invocations
 * within the last windowMs milliseconds are counted toward the limit.
 *
 * Designed for client-side enforcement to prevent accidental API
 * abuse independent of server-side limits.
 */

export class RateLimiter {
  private timestamps: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  /**
   * @param maxRequests - Maximum calls allowed within the window. Defaults to 10.
   * @param windowMs - Sliding window duration in milliseconds. Defaults to 60000 (1 minute).
   */
  constructor(maxRequests = 10, windowMs = 60_000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check whether a new request is allowed under the current rate.
   * If allowed, records the timestamp and returns true.
   * If the limit is exceeded, returns false without recording.
   */
  tryAcquire(): boolean {
    this.evictExpired();

    if (this.timestamps.length >= this.maxRequests) {
      return false;
    }

    this.timestamps.push(Date.now());
    return true;
  }

  /**
   * Returns the number of milliseconds until the next request will
   * be allowed. Returns 0 if a request is allowed immediately.
   */
  getRetryAfterMs(): number {
    this.evictExpired();

    if (this.timestamps.length < this.maxRequests) {
      return 0;
    }

    const oldestInWindow = this.timestamps[0];
    return oldestInWindow + this.windowMs - Date.now();
  }

  /**
   * Number of remaining requests allowed in the current window.
   */
  get remaining(): number {
    this.evictExpired();
    return Math.max(0, this.maxRequests - this.timestamps.length);
  }

  /**
   * Reset the limiter, clearing all recorded timestamps.
   */
  reset(): void {
    this.timestamps = [];
  }

  private evictExpired(): void {
    const cutoff = Date.now() - this.windowMs;
    while (this.timestamps.length > 0 && this.timestamps[0] < cutoff) {
      this.timestamps.shift();
    }
  }
}
