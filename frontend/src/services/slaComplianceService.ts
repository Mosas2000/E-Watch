import type {
  HealthCheckResult,
  SlaComplianceReport,
  SlaTarget,
} from '../types/sla';
import { calculateUptimeStats } from '../utils/uptimeCalculations';

/**
 * Evaluate whether a service is meeting its SLA targets
 * based on historical health check results.
 */
export function evaluateCompliance(
  target: SlaTarget,
  results: HealthCheckResult[],
): SlaComplianceReport {
  const now = Date.now();
  const windowStart = now - target.evaluationWindowMs;

  const stats = calculateUptimeStats(
    target.serviceName,
    results,
    windowStart,
    now,
  );

  const uptimeGap = stats.uptimePercentage - target.targetUptime;
  const responseGap = target.maxResponseMs - stats.averageResponseMs;

  const isCompliant =
    stats.uptimePercentage >= target.targetUptime &&
    stats.averageResponseMs <= target.maxResponseMs;

  return {
    target,
    stats,
    isCompliant,
    uptimeGap: Math.round(uptimeGap * 100) / 100,
    responseGap: Math.round(responseGap),
    generatedAt: now,
  };
}

/**
 * Determine the overall compliance status label for display.
 */
export function complianceLabel(report: SlaComplianceReport): string {
  if (report.isCompliant) {
    return 'Meeting SLA';
  }

  if (report.uptimeGap < 0 && report.responseGap < 0) {
    return 'Uptime and response time below target';
  }

  if (report.uptimeGap < 0) {
    return 'Uptime below target';
  }

  return 'Response time above target';
}
