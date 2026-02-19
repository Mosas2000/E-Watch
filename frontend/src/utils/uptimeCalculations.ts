import type { HealthCheckResult, UptimeStats } from '../types/sla';

/**
 * Calculate the p-th percentile from a sorted array of numbers.
 * Uses linear interpolation between closest ranks.
 */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];

  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Calculate uptime statistics from a list of health check results
 * within the specified time window.
 */
export function calculateUptimeStats(
  serviceName: string,
  results: HealthCheckResult[],
  windowStartMs: number,
  windowEndMs: number,
): UptimeStats {
  const windowResults = results.filter(
    (r) => r.timestamp >= windowStartMs && r.timestamp <= windowEndMs,
  );

  const totalChecks = windowResults.length;
  const successfulChecks = windowResults.filter(
    (r) => r.status === 'operational' || r.status === 'degraded',
  ).length;
  const failedChecks = totalChecks - successfulChecks;
  const uptimePercentage =
    totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 100;

  const responseTimes = windowResults
    .map((r) => r.responseTimeMs)
    .sort((a, b) => a - b);

  const averageResponseMs =
    responseTimes.length > 0
      ? Math.round(
          responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length,
        )
      : 0;

  return {
    serviceName,
    uptimePercentage: Math.round(uptimePercentage * 100) / 100,
    totalChecks,
    successfulChecks,
    failedChecks,
    averageResponseMs,
    p95ResponseMs: Math.round(percentile(responseTimes, 95)),
    p99ResponseMs: Math.round(percentile(responseTimes, 99)),
    windowStartMs,
    windowEndMs,
  };
}

/**
 * Format an uptime percentage for display (e.g. "99.95%").
 */
export function formatUptime(percentage: number): string {
  return `${percentage.toFixed(2)}%`;
}

/**
 * Format a duration in milliseconds to a human-readable string.
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.round((ms % 3_600_000) / 60_000);
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}
