/**
 * Fallback UIs for specific sections of the application.
 * Each fallback explains what happened and offers a recovery action.
 */

interface FallbackProps {
  onRetry?: () => void;
  message?: string;
}

export const DashboardFallback = ({ onRetry }: FallbackProps) => (
  <div className="error-fallback error-fallback-dashboard" role="alert">
    <h3>Dashboard Unavailable</h3>
    <p>
      The event dashboard could not be loaded. This is usually caused by a
      temporary network issue or an unexpected response from the blockchain.
    </p>
    {onRetry && (
      <button onClick={onRetry} className="btn-retry">
        Reload Dashboard
      </button>
    )}
  </div>
);

export const RegistrationFallback = ({ onRetry }: FallbackProps) => (
  <div className="error-fallback error-fallback-registration" role="alert">
    <h3>Registration Form Error</h3>
    <p>
      The event registration form ran into a problem. Your data has not been
      submitted. Please try again.
    </p>
    {onRetry && (
      <button onClick={onRetry} className="btn-retry">
        Reset Form
      </button>
    )}
  </div>
);

export const WalletFallback = ({ onRetry }: FallbackProps) => (
  <div className="error-fallback error-fallback-wallet" role="alert">
    <h3>Wallet Connection Failed</h3>
    <p>
      There was an error connecting to your wallet. Make sure the Hiro
      wallet extension is installed and try again.
    </p>
    {onRetry && (
      <button onClick={onRetry} className="btn-retry">
        Reconnect Wallet
      </button>
    )}
  </div>
);

export const ContractFallback = ({ onRetry }: FallbackProps) => (
  <div className="error-fallback error-fallback-contract" role="alert">
    <h3>Contract Interaction Error</h3>
    <p>
      The smart contract call failed. The Stacks network may be congested or
      the contract might be temporarily unreachable.
    </p>
    {onRetry && (
      <button onClick={onRetry} className="btn-retry">
        Retry
      </button>
    )}
  </div>
);

export const AppFallback = () => (
  <div className="error-fallback error-fallback-app" role="alert">
    <h2>Application Error</h2>
    <p>
      E-Watch encountered an unexpected error. Try refreshing the page. If
      the problem persists, please open an issue on GitHub.
    </p>
    <button
      onClick={() => window.location.reload()}
      className="btn-retry"
    >
      Refresh Page
    </button>
  </div>
);
