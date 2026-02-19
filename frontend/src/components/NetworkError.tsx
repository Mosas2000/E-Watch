interface NetworkErrorProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * Dedicated component for network/connectivity errors.
 * Shown when API calls or blockchain queries fail due to
 * network issues rather than application logic errors.
 */
export function NetworkError({
  message = 'Unable to reach the network. Please check your connection and try again.',
  onRetry,
}: NetworkErrorProps) {
  return (
    <div className="network-error" role="alert" aria-live="polite">
      <div className="network-error-icon" aria-hidden="true">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      </div>
      <p className="network-error-message">{message}</p>
      {onRetry && (
        <button
          className="btn-retry"
          onClick={onRetry}
          type="button"
        >
          Retry
        </button>
      )}
    </div>
  );
}
