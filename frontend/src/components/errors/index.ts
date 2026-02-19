/**
 * Public API for the error handling system.
 * Import from this barrel file for a cleaner interface.
 */

export { ErrorBoundary } from './ErrorBoundary';
export {
  DashboardFallback,
  RegistrationFallback,
  WalletFallback,
  ContractFallback,
  AppFallback,
} from './ErrorFallbacks';
export { ErrorMessage } from './ErrorMessage';
export { ErrorToast } from './ErrorToast';
export { NetworkError } from './NetworkError';
