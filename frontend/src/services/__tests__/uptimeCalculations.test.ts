import { describe, it, expect } from 'vitest';
import {
  calculateUptimeStats,
  formatUptime,
  formatDuration,
} from '../../utils/uptimeCalculations';
import type { HealthCheckResult } from '../../types/sla';

function makeResult(
  overrides: Partial<HealthCheckResult> = {},
): HealthCheckResult {
  return {
    endpoint: 'https://example.com',
    status: 'operational',
    responseTimeMs: 100,
    timestamp: Date.now(),
    statusCode: 200,
    errorMessage: null,
    ...overrides,
  };
}

describe('calculateUptimeStats', () => {
  const now = Date.now();
  const windowStart = now - 60_000;

  it('should return 100% uptime with all operational checks', () => {
    const results = [
      makeResult({ timestamp: now - 30_000, responseTimeMs: 80 }),
      makeResult({ timestamp: now - 20_000, responseTimeMs: 120 }),
      makeResult({ timestamp: now - 10_000, responseTimeMs: 100 }),
    ];

    const stats = calculateUptimeStats('test', results, windowStart, now);
    expect(stats.uptimePercentage).toBe(100);
    expect(stats.totalChecks).toBe(3);
    expect(stats.failedChecks).toBe(0);
  });

  it('should count degraded as successful', () => {
    const results = [
      makeResult({ timestamp: now - 20_000, status: 'degraded', responseTimeMs: 2500 }),
      makeResult({ timestamp: now - 10_000, status: 'operational', responseTimeMs: 100 }),
    ];

    const stats = calculateUptimeStats('test', results, windowStart, now);
    expect(stats.successfulChecks).toBe(2);
    expect(stats.uptimePercentage).toBe(100);
  });

  it('should calculate correct percentage with failures', () => {
    const results = [
      makeResult({ timestamp: now - 30_000, status: 'operational' }),
      makeResult({ timestamp: now - 20_000, status: 'major-outage' }),
      makeResult({ timestamp: now - 10_000, status: 'operational' }),
      makeResult({ timestamp: now - 5_000, status: 'major-outage' }),
    ];

    const stats = calculateUptimeStats('test', results, windowStart, now);
    expect(stats.uptimePercentage).toBe(50);
    expect(stats.failedChecks).toBe(2);
  });

  it('should exclude results outside the time window', () => {
    const results = [
      makeResult({ timestamp: now - 120_000 }), // outside window
      makeResult({ timestamp: now - 10_000 }),
    ];

    const stats = calculateUptimeStats('test', results, windowStart, now);
    expect(stats.totalChecks).toBe(1);
  });

  it('should return 100% uptime when no results exist', () => {
    const stats = calculateUptimeStats('test', [], windowStart, now);
    expect(stats.uptimePercentage).toBe(100);
    expect(stats.totalChecks).toBe(0);
  });

  it('should calculate average response time', () => {
    const results = [
      makeResult({ timestamp: now - 20_000, responseTimeMs: 100 }),
      makeResult({ timestamp: now - 10_000, responseTimeMs: 200 }),
    ];

    const stats = calculateUptimeStats('test', results, windowStart, now);
    expect(stats.averageResponseMs).toBe(150);
  });
});

describe('formatUptime', () => {
  it('should format percentage with two decimal places', () => {
    expect(formatUptime(99.95)).toBe('99.95%');
    expect(formatUptime(100)).toBe('100.00%');
    expect(formatUptime(0)).toBe('0.00%');
  });
});

describe('formatDuration', () => {
  it('should format milliseconds', () => {
    expect(formatDuration(500)).toBe('500ms');
  });

  it('should format seconds', () => {
    expect(formatDuration(3500)).toBe('3.5s');
  });

  it('should format minutes', () => {
    expect(formatDuration(120_000)).toBe('2m');
  });

  it('should format hours and minutes', () => {
    expect(formatDuration(5_400_000)).toBe('1h 30m');
  });

  it('should format hours only when no remaining minutes', () => {
    expect(formatDuration(7_200_000)).toBe('2h');
  });
});
