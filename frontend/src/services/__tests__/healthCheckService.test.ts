import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aggregateStatus } from '../healthCheckService';
import type { HealthCheckResult, ServiceStatus } from '../../types/sla';

function makeResult(status: ServiceStatus): HealthCheckResult {
  return {
    endpoint: 'https://example.com',
    status,
    responseTimeMs: 100,
    timestamp: Date.now(),
    statusCode: 200,
    errorMessage: null,
  };
}

describe('aggregateStatus', () => {
  it('should return operational when all checks pass', () => {
    const results = [makeResult('operational'), makeResult('operational')];
    expect(aggregateStatus(results)).toBe('operational');
  });

  it('should return operational for empty results', () => {
    expect(aggregateStatus([])).toBe('operational');
  });

  it('should return the worst status from mixed results', () => {
    const results = [
      makeResult('operational'),
      makeResult('degraded'),
      makeResult('operational'),
    ];
    expect(aggregateStatus(results)).toBe('degraded');
  });

  it('should return major-outage when any check has major-outage', () => {
    const results = [
      makeResult('operational'),
      makeResult('major-outage'),
      makeResult('degraded'),
    ];
    expect(aggregateStatus(results)).toBe('major-outage');
  });

  it('should return partial-outage when worst is partial-outage', () => {
    const results = [
      makeResult('operational'),
      makeResult('partial-outage'),
    ];
    expect(aggregateStatus(results)).toBe('partial-outage');
  });
});
