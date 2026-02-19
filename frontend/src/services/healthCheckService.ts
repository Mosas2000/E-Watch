import type { HealthCheckResult, ServiceStatus } from '../types/sla';
import { DEGRADED_THRESHOLD_MS } from '../config/slaConfig';

/**
 * Perform a health check against the given endpoint.
 * Returns a structured result indicating status, latency, and any error.
 */
export async function checkEndpoint(
  endpoint: string,
): Promise<HealthCheckResult> {
  const start = performance.now();
  let statusCode: number | null = null;
  let errorMessage: string | null = null;
  let status: ServiceStatus = 'operational';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(endpoint, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    statusCode = response.status;

    if (!response.ok) {
      status = 'major-outage';
      errorMessage = `HTTP ${statusCode}`;
    }
  } catch (err: unknown) {
    status = 'major-outage';

    if (err instanceof DOMException && err.name === 'AbortError') {
      errorMessage = 'Request timed out after 10s';
    } else if (err instanceof Error) {
      errorMessage = err.message;
    } else {
      errorMessage = 'Unknown error';
    }
  }

  const responseTimeMs = Math.round(performance.now() - start);

  // Mark as degraded when response is successful but slow
  if (status === 'operational' && responseTimeMs > DEGRADED_THRESHOLD_MS) {
    status = 'degraded';
  }

  return {
    endpoint,
    status,
    responseTimeMs,
    timestamp: Date.now(),
    statusCode,
    errorMessage,
  };
}

/**
 * Determine the worst status among a list of check results.
 * Used to compute an aggregate service status from individual checks.
 */
export function aggregateStatus(
  results: HealthCheckResult[],
): ServiceStatus {
  if (results.length === 0) {
    return 'operational';
  }

  const statusPriority: Record<ServiceStatus, number> = {
    'major-outage': 3,
    'partial-outage': 2,
    degraded: 1,
    operational: 0,
  };

  let worst: ServiceStatus = 'operational';
  for (const r of results) {
    if (statusPriority[r.status] > statusPriority[worst]) {
      worst = r.status;
    }
  }

  return worst;
}
