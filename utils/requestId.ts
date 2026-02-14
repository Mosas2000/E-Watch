import { randomBytes } from 'crypto';

/**
 * Generate a unique request/operation ID for log correlation
 */
export function generateRequestId(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Create a context object with request ID
 */
export function createLogContext(requestId?: string, additionalContext?: any): any {
  return {
    requestId: requestId || generateRequestId(),
    timestamp: new Date().toISOString(),
    ...additionalContext,
  };
}

/**
 * Request ID store for async operations
 * Uses AsyncLocalStorage pattern (simplified version)
 */
class RequestIdStore {
  private storage = new Map<string, string>();

  set(key: string, requestId: string): void {
    this.storage.set(key, requestId);
  }

  get(key: string): string | undefined {
    return this.storage.get(key);
  }

  delete(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }
}

export const requestIdStore = new RequestIdStore();

/**
 * Wrap async function with request ID tracking
 */
export function withRequestId<T>(
  fn: (requestId: string) => Promise<T>,
  existingId?: string
): Promise<T> {
  const requestId = existingId || generateRequestId();
  return fn(requestId);
}

/**
 * Create a child logger context with request ID
 */
export function createChildContext(parentContext: any, operation: string): any {
  return {
    ...parentContext,
    operation,
    childId: generateRequestId().substring(0, 8),
  };
}
