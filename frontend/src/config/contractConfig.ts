/**
 * Contract Configuration
 *
 * Centralized contract addressing for v1 and v2 contracts.
 * Toggle the active contract version by changing CONTRACT_VERSION.
 * The frontend service layer reads from this module to determine
 * which contract to call.
 */

export const CONTRACT_VERSION = 1 as const;

export const V1_CONTRACT = {
  address: "SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T",
  name: "ewatch",
  version: 1,
} as const;

export const V2_CONTRACT = {
  address: "SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T",
  name: "ewatch-v2",
  version: 2,
} as const;

/**
 * Returns the contract config for the active version.
 * Switch CONTRACT_VERSION above to change the target.
 */
export function getActiveContract() {
  return CONTRACT_VERSION === 2 ? V2_CONTRACT : V1_CONTRACT;
}

/**
 * Returns the contract config for a specific version.
 * Useful for migration scripts that need to reference both.
 */
export function getContractByVersion(version: 1 | 2) {
  return version === 2 ? V2_CONTRACT : V1_CONTRACT;
}
