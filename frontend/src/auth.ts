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

/**
 * Return the STX address of the currently signed-in user, or null
 * when no session is active. Prefers the mainnet address if available.
 */
export function getUserAddress(): string | null {
  if (!userSession.isUserSignedIn()) {
    return null;
  }

  try {
    const userData = userSession.loadUserData();
    const profile = userData.profile;
    const stxAddress =
      profile?.stxAddress?.mainnet || profile?.stxAddress?.testnet || null;
    return stxAddress;
  } catch {
    return null;
  }
}
