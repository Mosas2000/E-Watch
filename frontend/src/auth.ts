import { AppConfig, UserSession } from '@stacks/connect';

const appConfig = new AppConfig(['store_write', 'publish_data']);
export const userSession = new UserSession({ appConfig });

/**
 * Check whether the current user has an active authenticated session.
 * Convenience wrapper to keep auth checks consistent across modules.
 */
export function isAuthenticated(): boolean {
  return userSession.isUserSignedIn();
}
