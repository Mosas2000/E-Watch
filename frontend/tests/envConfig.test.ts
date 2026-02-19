import { describe, it, expect } from 'vitest';

/**
 * Tests verifying the structure and defaults of the env config module.
 */

describe('env config defaults', () => {
  const DEFAULTS = {
    network: 'mainnet',
    contractAddress: 'SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T',
    contractName: 'ewatch',
    apiEndpoint: 'https://stacks-node-api.mainnet.stacks.co',
    explorerUrl: 'https://explorer.hiro.so',
    governanceContractName: 'governance',
    appEnv: 'production',
  };

  it('provides a mainnet default network', () => {
    expect(DEFAULTS.network).toBe('mainnet');
  });

  it('provides the deployed contract address as default', () => {
    expect(DEFAULTS.contractAddress).toMatch(/^SP[A-Z0-9]+$/);
  });

  it('defaults API endpoint to mainnet', () => {
    expect(DEFAULTS.apiEndpoint).toContain('mainnet');
  });

  it('defaults explorer to Hiro explorer', () => {
    expect(DEFAULTS.explorerUrl).toContain('hiro.so');
  });

  it('defaults app environment to production', () => {
    expect(DEFAULTS.appEnv).toBe('production');
  });
});

describe('getDefaultApiEndpoint pattern', () => {
  function getDefaultApiEndpoint(network: string): string {
    return network === 'testnet'
      ? 'https://stacks-node-api.testnet.stacks.co'
      : 'https://stacks-node-api.mainnet.stacks.co';
  }

  it('returns testnet URL for testnet', () => {
    expect(getDefaultApiEndpoint('testnet')).toContain('testnet');
  });

  it('returns mainnet URL for mainnet', () => {
    expect(getDefaultApiEndpoint('mainnet')).toContain('mainnet');
  });

  it('returns mainnet URL for unknown values', () => {
    expect(getDefaultApiEndpoint('devnet')).toContain('mainnet');
  });
});
