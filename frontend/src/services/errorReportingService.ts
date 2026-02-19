/**
 * Error reporting service.
 *
 * Centralizes error capture so it can be routed to a remote
 * service (Sentry, LogRocket, etc.) later without touching
 * every error boundary.
 */

export interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  boundary: string;
  timestamp: number;
  userAddress?: string;
  url: string;
}

// In-memory buffer for recent errors, useful for debugging
const errorBuffer: ErrorReport[] = [];
const MAX_BUFFER = 50;

/**
 * Record an error caught by an error boundary.
 */
export function reportError(
  error: Error,
  componentStack: string | undefined,
  boundary: string,
  userAddress?: string,
): void {
  const report: ErrorReport = {
    message: error.message,
    stack: error.stack,
    componentStack: componentStack || undefined,
    boundary,
    timestamp: Date.now(),
    userAddress,
    url: window.location.href,
  };

  // Store in buffer
  errorBuffer.push(report);
  if (errorBuffer.length > MAX_BUFFER) {
    errorBuffer.shift();
  }

  // Log to console in development
  if (import.meta.env.DEV) {
    console.group(`Error Report [${boundary}]`);
    console.error('Message:', report.message);
    if (report.componentStack) {
      console.error('Component Stack:', report.componentStack);
    }
    console.groupEnd();
  }

  // Future: send to remote error tracking service
  // sendToSentry(report);
  // sendToLogRocket(report);
}

/**
 * Get the recent error buffer for display in a debug panel.
 */
export function getRecentErrors(): ErrorReport[] {
  return [...errorBuffer];
}

/**
 * Clear the error buffer.
 */
export function clearErrorBuffer(): void {
  errorBuffer.length = 0;
}
