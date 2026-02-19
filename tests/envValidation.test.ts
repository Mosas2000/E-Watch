import { describe, it, expect } from 'vitest';
import {
  isValidNetwork,
  isValidAppEnv,
  isValidContractAddress,
  isValidUrl,
} from '../frontend/src/utils/envValidation';

describe('isValidNetwork', () => {
  it('accepts mainnet', () => {
    expect(isValidNetwork('mainnet')).toBe(true);
  });

  it('accepts testnet', () => {
    expect(isValidNetwork('testnet')).toBe(true);
  });

  it('rejects unknown network names', () => {
    expect(isValidNetwork('devnet')).toBe(false);
    expect(isValidNetwork('')).toBe(false);
    expect(isValidNetwork('Mainnet')).toBe(false);
  });
});

describe('isValidAppEnv', () => {
  it('accepts valid environments', () => {
    expect(isValidAppEnv('development')).toBe(true);
    expect(isValidAppEnv('staging')).toBe(true);
    expect(isValidAppEnv('production')).toBe(true);
  });

  it('rejects invalid environments', () => {
    expect(isValidAppEnv('prod')).toBe(false);
    expect(isValidAppEnv('dev')).toBe(false);
    expect(isValidAppEnv('')).toBe(false);
  });
});

describe('isValidContractAddress', () => {
  it('accepts valid SP mainnet addresses', () => {
    expect(
      isValidContractAddress('SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T'),
    ).toBe(true);
  });

  it('accepts valid ST testnet addresses', () => {
    expect(
      isValidContractAddress('ST31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQAE5SE2'),
    ).toBe(true);
  });

  it('rejects short addresses', () => {
    expect(isValidContractAddress('SP123')).toBe(false);
  });

  it('rejects empty strings', () => {
    expect(isValidContractAddress('')).toBe(false);
  });
});

describe('isValidUrl', () => {
  it('accepts valid https URLs', () => {
    expect(isValidUrl('https://stacks-node-api.mainnet.stacks.co')).toBe(true);
  });

  it('accepts valid http URLs', () => {
    expect(isValidUrl('http://localhost:3999')).toBe(true);
  });

  it('rejects plain strings', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
  });

  it('rejects empty strings', () => {
    expect(isValidUrl('')).toBe(false);
  });
});
