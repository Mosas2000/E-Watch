/**
 * Utility to classify errors so the UI can show appropriate
 * messaging and recovery options.
 */

export type ErrorCategory =
  | 'network'
  | 'contract'
  | 'wallet'
  | 'validation'
  | 'timeout'
  | 'unknown';

/**
 * Inspect an error and return a category for UI decisions.
 */
export function classifyError(error: Error): ErrorCategory {
  const msg = error.message.toLowerCase();

  if (
    msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('econnrefused') ||
    msg.includes('failed to fetch') ||
    msg.includes('net::err')
  ) {
    return 'network';
  }

  if (
    msg.includes('contract') ||
    msg.includes('clarity') ||
    msg.includes('transaction') ||
    msg.includes('stacks')
  ) {
    return 'contract';
  }

  if (
    msg.includes('wallet') ||
    msg.includes('connect') ||
    msg.includes('authentication') ||
    msg.includes('sign')
  ) {
    return 'wallet';
  }

  if (
    msg.includes('invalid') ||
    msg.includes('required') ||
    msg.includes('validation') ||
    msg.includes('format')
  ) {
    return 'validation';
  }

  if (
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('deadline')
  ) {
    return 'timeout';
  }

  return 'unknown';
}

/**
 * Return a user-friendly message based on error category.
 */
export function getFriendlyMessage(category: ErrorCategory): string {
  switch (category) {
    case 'network':
      return 'A network error occurred. Please check your internet connection and try again.';
    case 'contract':
      return 'There was an issue communicating with the smart contract. The transaction may need to be retried.';
    case 'wallet':
      return 'A wallet connection issue occurred. Please make sure your wallet is connected and try again.';
    case 'validation':
      return 'The provided data is invalid. Please check your inputs and try again.';
    case 'timeout':
      return 'The request timed out. The network may be congested. Please try again shortly.';
    default:
      return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  }
}
