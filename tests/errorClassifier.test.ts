import { describe, it, expect } from 'vitest';
import {
  classifyError,
  getFriendlyMessage,
} from '../frontend/src/utils/errorClassifier';

describe('classifyError', () => {
  it('classifies network errors', () => {
    expect(classifyError(new Error('Failed to fetch'))).toBe('network');
    expect(classifyError(new Error('ECONNREFUSED'))).toBe('network');
    expect(classifyError(new Error('net::ERR_CONNECTION_RESET'))).toBe('network');
  });

  it('classifies contract errors', () => {
    expect(classifyError(new Error('Contract call failed'))).toBe('contract');
    expect(classifyError(new Error('Clarity evaluation error'))).toBe('contract');
    expect(classifyError(new Error('Transaction rejected'))).toBe('contract');
  });

  it('classifies wallet errors', () => {
    expect(classifyError(new Error('Wallet not connected'))).toBe('wallet');
    expect(classifyError(new Error('Authentication required'))).toBe('wallet');
    expect(classifyError(new Error('User refused to sign'))).toBe('wallet');
  });

  it('classifies validation errors', () => {
    expect(classifyError(new Error('Invalid input format'))).toBe('validation');
    expect(classifyError(new Error('Field required'))).toBe('validation');
  });

  it('classifies timeout errors', () => {
    expect(classifyError(new Error('Request timed out'))).toBe('timeout');
    expect(classifyError(new Error('Deadline exceeded'))).toBe('timeout');
  });

  it('returns unknown for unrecognized errors', () => {
    expect(classifyError(new Error('some random error'))).toBe('unknown');
    expect(classifyError(new Error(''))).toBe('unknown');
  });
});

describe('getFriendlyMessage', () => {
  it('returns distinct messages for each category', () => {
    const categories = [
      'network',
      'contract',
      'wallet',
      'validation',
      'timeout',
      'unknown',
    ] as const;

    const messages = categories.map(getFriendlyMessage);

    // All messages should be unique strings
    const unique = new Set(messages);
    expect(unique.size).toBe(categories.length);

    // Each message should be a non-empty string
    messages.forEach((msg) => {
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(10);
    });
  });

  it('network message mentions connection', () => {
    const msg = getFriendlyMessage('network');
    expect(msg.toLowerCase()).toContain('network');
  });

  it('unknown message is generic', () => {
    const msg = getFriendlyMessage('unknown');
    expect(msg.toLowerCase()).toContain('unexpected');
  });
});
