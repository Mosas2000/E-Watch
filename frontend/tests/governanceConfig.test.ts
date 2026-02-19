import { describe, it, expect } from 'vitest';
import {
  GOVERNANCE_CONFIG,
  blocksToTimeString,
  BLOCK_TIME_MINUTES,
} from '../src/config/governanceConfig';

describe('governanceConfig', () => {
  it('has a valid contract address prefix', () => {
    expect(GOVERNANCE_CONFIG.address.startsWith('SP')).toBe(true);
  });

  it('has a contract name set', () => {
    expect(GOVERNANCE_CONFIG.name).toBe('governance');
  });

  it('sets the quorum to five', () => {
    expect(GOVERNANCE_CONFIG.quorum).toBe(5);
  });

  it('uses a 1008-block voting duration', () => {
    expect(GOVERNANCE_CONFIG.votingDurationBlocks).toBe(1008);
  });
});

describe('blocksToTimeString', () => {
  it('returns minutes for very short durations', () => {
    expect(blocksToTimeString(3)).toBe('30m');
  });

  it('returns hours when less than a day', () => {
    expect(blocksToTimeString(12)).toBe('2h');
  });

  it('returns days and hours for mixed durations', () => {
    expect(blocksToTimeString(150)).toBe('1d 1h');
  });

  it('returns days for full-day multiples', () => {
    expect(blocksToTimeString(144)).toBe('1d');
  });

  it('handles zero blocks', () => {
    expect(blocksToTimeString(0)).toBe('0m');
  });
});
