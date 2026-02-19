import { useErrorContext } from '../contexts/ErrorContext';

/**
 * Renders a stack of dismissible error notifications from ErrorContext.
 * Place once near the root of the component tree so it picks up
 * errors added from anywhere in the app.
 */
export function ErrorToast() {
  const { errors, dismissError, clearAll } = useErrorContext();

  if (errors.length === 0) return null;

  return (
    <div className="error-toast-container" role="log" aria-label="Error notifications">
      {errors.length > 1 && (
        <button
          className="error-toast-clear"
          onClick={clearAll}
          type="button"
        >
          Clear all ({errors.length})
        </button>
      )}
      {errors.map((entry) => (
        <div key={entry.id} className="error-toast" role="alert">
          <div className="error-toast-body">
            <span className="error-toast-source">{entry.source}</span>
            <p className="error-toast-message">{entry.error.message}</p>
          </div>
          <button
            className="error-toast-dismiss"
            onClick={() => dismissError(entry.id)}
            aria-label="Dismiss"
            type="button"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
