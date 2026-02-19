import { describe, it, expect } from 'vitest';
import { evaluateCompliance, complianceLabel } from '../slaComplianceService';
import type { HealthCheckResult, SlaTarget } from '../../types/sla';

const DAY_MS = 24 * 60 * 60 * 1000;

function makeTarget(overrides: Partial<SlaTarget> = {}): SlaTarget {
  return {
    serviceName: 'test-service',
    targetUptime: 99.0,
    maxResponseMs: 3000,
    checkIntervalMs: 300_000,
    evaluationWindowMs: 30 * DAY_MS,
    ...overrides,
  };
}

function makeResult(
  timestamp: number,
  status: 'operational' | 'major-outage' = 'operational',
  responseTimeMs = 100,
): HealthCheckResult {
  return {
    endpoint: 'https://example.com',
    status,
    responseTimeMs,
    timestamp,
    statusCode: status === 'operational' ? 200 : null,
    errorMessage: status === 'major-outage' ? 'timeout' : null,
  };
}

describe('evaluateCompliance', () => {
  it('should report compliant when all checks pass under response threshold', () => {
    const now = Date.now();
    const target = makeTarget();
    const results = Array.from({ length: 100 }, (_, i) =>
      makeResult(now - i * 300_000, 'operational', 200),
    );

    const report = evaluateCompliance(target, results);
    expect(report.isCompliant).toBe(true);
    expect(report.uptimeGap).toBeGreaterThanOrEqual(0);
    expect(report.responseGap).toBeGreaterThan(0);
  });

  it('should report non-compliant when uptime is below target', () => {
    const now = Date.now();
    const target = makeTarget({ targetUptime: 99.0 });

    // 50% failure rate
    const results = Array.from({ length: 100 }, (_, i) =>
      makeResult(
        now - i * 300_000,
        i % 2 === 0 ? 'operational' : 'major-outage',
      ),
    );

    const report = evaluateCompliance(target, results);
    expect(report.isCompliant).toBe(false);
    expect(report.uptimeGap).toBeLessThan(0);
  });

  it('should report non-compliant when response time exceeds max', () => {
    const now = Date.now();
    const target = makeTarget({ maxResponseMs: 100 });
    const results = Array.from({ length: 10 }, (_, i) =>
      makeResult(now - i * 300_000, 'operational', 500),
    );

    const report = evaluateCompliance(target, results);
    expect(report.isCompliant).toBe(false);
    expect(report.responseGap).toBeLessThan(0);
  });

  it('should return compliant for empty history', () => {
    const target = makeTarget();
    const report = evaluateCompliance(target, []);
    expect(report.isCompliant).toBe(true);
  });
});

describe('complianceLabel', () => {
  it('should return Meeting SLA for compliant reports', () => {
    const target = makeTarget();
    const now = Date.now();
    const results = [makeResult(now, 'operational', 100)];
    const report = evaluateCompliance(target, results);
    expect(complianceLabel(report)).toBe('Meeting SLA');
  });

  it('should describe uptime issue when only uptime fails', () => {
    const target = makeTarget({ targetUptime: 99.0 });
    const now = Date.now();
    const results = Array.from({ length: 100 }, (_, i) =>
      makeResult(
        now - i * 300_000,
        i % 2 === 0 ? 'operational' : 'major-outage',
        50,
      ),
    );
    const report = evaluateCompliance(target, results);
    expect(complianceLabel(report)).toBe('Uptime below target');
  });
});
