/**
 * Governance contract configuration.
 * Keep this separate from the event contract config so the two
 * modules can evolve independently.
 */

export const GOVERNANCE_CONFIG = {
  address: 'SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T',
  name: 'governance',
  votingDurationBlocks: 1008,
  quorum: 5,
} as const;

/**
 * Approximate block time used to estimate voting deadlines in the UI.
 */
export const BLOCK_TIME_MINUTES = 10;

/**
 * Convert a block height difference to a human-readable time string.
 */
export function blocksToTimeString(blocks: number): string {
  const totalMinutes = blocks * BLOCK_TIME_MINUTES;
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);

  if (days > 0 && hours > 0) return `${days}d ${hours}h`;
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  return `${totalMinutes}m`;
}
