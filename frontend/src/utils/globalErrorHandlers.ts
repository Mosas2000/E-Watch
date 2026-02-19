import { reportError } from '../services/errorReportingService';

/**
 * Registers global handlers for uncaught errors and unhandled
 * promise rejections. These act as the last line of defense for
 * errors that escape React error boundaries (e.g. errors in
 * setTimeout callbacks, event listeners attached directly to
 * the DOM, etc.).
 *
 * Call once at application startup (e.g. in main.tsx).
 */
export function registerGlobalErrorHandlers(): void {
  window.addEventListener('error', (event: ErrorEvent) => {
    // Ignore cross-origin script errors with no useful info
    if (!event.error) return;

    reportError(
      event.error instanceof Error
        ? event.error
        : new Error(event.message || 'Uncaught error'),
      undefined,
      'window.onerror',
    );
  });

  window.addEventListener(
    'unhandledrejection',
    (event: PromiseRejectionEvent) => {
      const error =
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason) || 'Unhandled promise rejection');

      reportError(error, undefined, 'unhandledrejection');
    },
  );
}
