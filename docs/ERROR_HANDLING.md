# Error Handling Architecture

This document describes the error boundary and error handling system
used across the E-Watch frontend application.

## Overview

React error boundaries prevent a single component failure from
crashing the entire application. The E-Watch error system layers
several mechanisms on top of React's built-in error boundaries:

1. **ErrorBoundary** -- class component that catches render-time
   errors in its subtree.
2. **Section fallbacks** -- contextual fallback UIs per section
   (wallet, dashboard, registration, etc.).
3. **ErrorMessage** -- inline error display for non-fatal errors
   from event handlers and async operations.
4. **ErrorToast** -- dismissible toast notifications via shared
   ErrorContext.
5. **useErrorHandler** -- hook for catching errors in event
   handlers, effects, and async code.
6. **Global handlers** -- window-level listeners for uncaught
   errors and unhandled promise rejections.
7. **Error reporting service** -- centralized logging and future
   remote-reporting integration point.

## Component hierarchy

```
<ErrorBoundary boundary="app-root" fallback={<AppFallback />}>
  <AppProvider>
    <ErrorProvider>
      <ErrorBoundary boundary="wallet" fallback={<WalletFallback />}>
        <WalletConnect />
      </ErrorBoundary>
      <ErrorBoundary boundary="registration" fallback={<RegistrationFallback />}>
        <EventRegistration />
      </ErrorBoundary>
      <ErrorBoundary boundary="dashboard" fallback={<DashboardFallback />}>
        <EventDashboard />
      </ErrorBoundary>
      <ErrorToast />
    </ErrorProvider>
  </AppProvider>
</ErrorBoundary>
```

## Files

| File | Purpose |
|------|---------|
| `components/ErrorBoundary.tsx` | Core class-based error boundary |
| `components/ErrorFallbacks.tsx` | Section-specific fallback UIs |
| `components/ErrorMessage.tsx` | Inline dismissible error display |
| `components/ErrorToast.tsx` | Toast notifications from ErrorContext |
| `components/NetworkError.tsx` | Network connectivity error state |
| `contexts/ErrorContext.tsx` | Shared error state provider |
| `hooks/useErrorHandler.ts` | Async/sync error capture hook |
| `services/errorReportingService.ts` | Centralized error logging |
| `utils/globalErrorHandlers.ts` | Window-level error listeners |

## Usage

### Wrapping a section with an error boundary

```tsx
import { ErrorBoundary } from './components/ErrorBoundary';
import { DashboardFallback } from './components/ErrorFallbacks';

<ErrorBoundary boundary="dashboard" fallback={<DashboardFallback />}>
  <EventDashboard />
</ErrorBoundary>
```

### Handling async errors in components

```tsx
import { useErrorHandler } from '../hooks/useErrorHandler';
import { ErrorMessage } from './ErrorMessage';

function MyComponent() {
  const { error, handleAsync, clearError } = useErrorHandler();

  const loadData = () => {
    handleAsync(fetchSomeData());
  };

  return (
    <div>
      <ErrorMessage error={error} onDismiss={clearError} />
      <button onClick={loadData}>Load</button>
    </div>
  );
}
```

### Pushing errors to the toast system

```tsx
import { useErrorContext } from '../contexts/ErrorContext';

function SomeComponent() {
  const { addError } = useErrorContext();

  const doSomething = async () => {
    try {
      await riskyOperation();
    } catch (err) {
      addError(err instanceof Error ? err : new Error(String(err)), 'SomeComponent');
    }
  };
}
```

## Error reporting

All errors caught by `ErrorBoundary.componentDidCatch` are routed
through `reportError()` in `errorReportingService.ts`. In
development mode, errors are logged to the browser console with
grouping. The in-memory buffer keeps the last 50 errors for
debugging.

To integrate a remote service (Sentry, LogRocket, etc.), add the
send call inside `reportError()`.

## Testing

- `tests/errorReporting.test.ts` -- service unit tests
- `frontend/tests/errorBoundary.test.ts` -- boundary logic tests
- `frontend/tests/useErrorHandler.test.ts` -- hook pattern tests
