/**
 * Request cache with TTL expiration
 *
 * Caches the results of async operations keyed by a string identifier.
 * Stale entries are evicted on access so memory does not grow unbounded.
 *
 * Designed for read-only contract queries where the same event data
 * is unlikely to change within a short window. Prevents redundant
 * network calls when a user searches for the same event ID twice.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class RequestCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly ttlMs: number;
  private readonly maxEntries: number;

  /**
   * @param ttlMs - Time-to-live in milliseconds. Defaults to 30 seconds.
   * @param maxEntries - Maximum number of entries before oldest is evicted.
   */
  constructor(ttlMs = 30_000, maxEntries = 100) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
  }

  /**
   * Retrieve a cached value if it exists and has not expired.
   * Returns undefined for cache misses or expired entries.
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data;
  }

  /**
   * Store a value in the cache. If the cache is full, the oldest
   * entry is evicted to make room.
   */
  set(key: string, data: T): void {
    // Evict oldest entry if at capacity
    if (this.cache.size >= this.maxEntries && !this.cache.has(key)) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  /**
   * Check whether a non-expired entry exists for the given key.
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Remove a specific entry from the cache.
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Remove all entries from the cache.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Return the number of non-expired entries currently cached.
   */
  get size(): number {
    // Evict expired entries on access
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
    return this.cache.size;
  }
}
