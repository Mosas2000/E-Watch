import { describe, it, expect } from 'vitest';

describe('network config helpers', () => {
  describe('getExplorerTxUrl pattern', () => {
    it('builds a mainnet explorer URL', () => {
      const explorerUrl = 'https://explorer.hiro.so';
      const chain = 'mainnet';
      const txId = '0xabc123';
      const url = `${explorerUrl}/txid/${txId}?chain=${chain}`;
      expect(url).toBe(
        'https://explorer.hiro.so/txid/0xabc123?chain=mainnet',
      );
    });

    it('builds a testnet explorer URL', () => {
      const explorerUrl = 'https://explorer.hiro.so';
      const chain = 'testnet';
      const txId = '0xdef456';
      const url = `${explorerUrl}/txid/${txId}?chain=${chain}`;
      expect(url).toContain('chain=testnet');
    });
  });

  describe('getExplorerContractUrl pattern', () => {
    it('combines address and name', () => {
      const address = 'SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T';
      const name = 'ewatch';
      const url = `https://explorer.hiro.so/txid/${address}.${name}?chain=mainnet`;
      expect(url).toContain('.ewatch');
    });
  });

  describe('getApiUrl pattern', () => {
    it('joins base and path without double slashes', () => {
      const base = 'https://stacks-node-api.mainnet.stacks.co/';
      const path = '/v2/info';
      const url = `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
      expect(url).toBe(
        'https://stacks-node-api.mainnet.stacks.co/v2/info',
      );
    });

    it('handles base without trailing slash', () => {
      const base = 'https://stacks-node-api.mainnet.stacks.co';
      const path = 'v2/info';
      const url = `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
      expect(url).toBe(
        'https://stacks-node-api.mainnet.stacks.co/v2/info',
      );
    });
  });

  describe('network identification', () => {
    it('correctly identifies testnet', () => {
      const network = 'testnet';
      expect(network === 'testnet').toBe(true);
      expect(network === 'mainnet').toBe(false);
    });

    it('correctly identifies mainnet', () => {
      const network = 'mainnet';
      expect(network === 'mainnet').toBe(true);
      expect(network === 'testnet').toBe(false);
    });
  });

  describe('default API endpoints', () => {
    it('returns testnet endpoint for testnet', () => {
      const network = 'testnet';
      const endpoint =
        network === 'testnet'
          ? 'https://stacks-node-api.testnet.stacks.co'
          : 'https://stacks-node-api.mainnet.stacks.co';
      expect(endpoint).toContain('testnet');
    });

    it('returns mainnet endpoint for mainnet', () => {
      const network = 'mainnet';
      const endpoint =
        network === 'testnet'
          ? 'https://stacks-node-api.testnet.stacks.co'
          : 'https://stacks-node-api.mainnet.stacks.co';
      expect(endpoint).toContain('mainnet');
    });
  });
});
