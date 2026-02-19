import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  reportError,
  getRecentErrors,
  clearErrorBuffer,
} from '../frontend/src/services/errorReportingService';

// Stub window and import.meta.env for Node test environment
beforeEach(() => {
  clearErrorBuffer();
});

describe('errorReportingService', () => {
  it('captures an error report with correct fields', () => {
    const error = new Error('test failure');
    reportError(error, '<ComponentStack>', 'dashboard');

    const errors = getRecentErrors();
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('test failure');
    expect(errors[0].boundary).toBe('dashboard');
    expect(errors[0].componentStack).toBe('<ComponentStack>');
    expect(errors[0].timestamp).toBeGreaterThan(0);
  });

  it('stores multiple errors in order', () => {
    reportError(new Error('first'), undefined, 'a');
    reportError(new Error('second'), undefined, 'b');
    reportError(new Error('third'), undefined, 'c');

    const errors = getRecentErrors();
    expect(errors).toHaveLength(3);
    expect(errors[0].message).toBe('first');
    expect(errors[2].message).toBe('third');
  });

  it('limits buffer size to MAX_BUFFER', () => {
    for (let i = 0; i < 60; i++) {
      reportError(new Error(`err-${i}`), undefined, 'bulk');
    }

    const errors = getRecentErrors();
    expect(errors.length).toBeLessThanOrEqual(50);
    // Oldest entries should have been evicted
    expect(errors[0].message).toBe('err-10');
  });

  it('clearErrorBuffer empties the buffer', () => {
    reportError(new Error('leftover'), undefined, 'test');
    expect(getRecentErrors()).toHaveLength(1);

    clearErrorBuffer();
    expect(getRecentErrors()).toHaveLength(0);
  });

  it('returns a copy of the buffer, not a reference', () => {
    reportError(new Error('a'), undefined, 'x');
    const copy = getRecentErrors();
    copy.push({
      message: 'fake',
      boundary: 'fake',
      timestamp: 0,
      url: '',
    });

    expect(getRecentErrors()).toHaveLength(1);
  });

  it('records userAddress when provided', () => {
    reportError(
      new Error('with address'),
      undefined,
      'wallet',
      'SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T',
    );

    const errors = getRecentErrors();
    expect(errors[0].userAddress).toBe(
      'SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T',
    );
  });
});
