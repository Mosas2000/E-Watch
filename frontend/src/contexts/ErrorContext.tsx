import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ErrorEntry {
  id: string;
  error: Error;
  source: string;
  timestamp: number;
}

interface ErrorContextValue {
  errors: ErrorEntry[];
  addError: (error: Error, source: string) => void;
  dismissError: (id: string) => void;
  clearAll: () => void;
  hasErrors: boolean;
}

const ErrorContext = createContext<ErrorContextValue | null>(null);

let nextId = 1;

/**
 * Provides a shared error state across the application.
 * Components can push errors into context from event handlers
 * or effects, and other parts of the UI can display them.
 */
export function ErrorProvider({ children }: { children: ReactNode }) {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);

  const addError = useCallback((error: Error, source: string) => {
    const entry: ErrorEntry = {
      id: `err-${nextId++}`,
      error,
      source,
      timestamp: Date.now(),
    };
    setErrors((prev) => [...prev, entry]);
  }, []);

  const dismissError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setErrors([]);
  }, []);

  return (
    <ErrorContext.Provider
      value={{
        errors,
        addError,
        dismissError,
        clearAll,
        hasErrors: errors.length > 0,
      }}
    >
      {children}
    </ErrorContext.Provider>
  );
}

/**
 * Access the shared error context.
 */
export function useErrorContext(): ErrorContextValue {
  const ctx = useContext(ErrorContext);
  if (!ctx) {
    throw new Error('useErrorContext must be used within an ErrorProvider');
  }
  return ctx;
}
