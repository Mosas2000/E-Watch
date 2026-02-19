import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Label used in logs to identify which boundary caught the error */
  name?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Generic error boundary that catches rendering errors in its
 * subtree and displays a fallback UI instead of crashing the
 * entire application.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const label = this.props.name || 'ErrorBoundary';
    console.error(`[${label}] Component error:`, error);
    console.error(`[${label}] Component stack:`, errorInfo.componentStack);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary-fallback" role="alert">
          <h3>Something went wrong</h3>
          <p>This section encountered an unexpected error.</p>
          <button onClick={this.handleRetry} className="btn-retry">
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
