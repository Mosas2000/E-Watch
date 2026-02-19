import { ReactNode } from 'react';

interface ErrorMessageProps {
  error: Error | null;
  onDismiss?: () => void;
  className?: string;
  children?: ReactNode;
}

/**
 * Inline error message component for displaying non-fatal errors
 * from event handlers, network calls, or form validation.
 *
 * Unlike ErrorBoundary (which replaces its entire subtree),
 * ErrorMessage renders alongside its siblings.
 */
export function ErrorMessage({
  error,
  onDismiss,
  className = '',
  children,
}: ErrorMessageProps) {
  if (!error) return null;

  return (
    <div
      className={`error-message ${className}`.trim()}
      role="alert"
      aria-live="assertive"
    >
      <span className="error-message-icon" aria-hidden="true">
        !
      </span>
      <div className="error-message-body">
        <p className="error-message-text">
          {children || error.message || 'An unexpected error occurred.'}
        </p>
      </div>
      {onDismiss && (
        <button
          className="error-message-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss error"
          type="button"
        >
          &times;
        </button>
      )}
    </div>
  );
}
