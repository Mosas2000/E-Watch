import type { SlaTarget } from '../types/sla';

/**
 * Default SLA targets for each monitored service.
 * These are evaluated against rolling 30-day windows unless overridden.
 */

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const FIVE_MINUTES_MS = 5 * 60 * 1000;

export const SLA_TARGETS: Record<string, SlaTarget> = {
  'stacks-api': {
    serviceName: 'stacks-api',
    targetUptime: 99.5,
    maxResponseMs: 3000,
    checkIntervalMs: FIVE_MINUTES_MS,
    evaluationWindowMs: THIRTY_DAYS_MS,
  },
  'contract-read': {
    serviceName: 'contract-read',
    targetUptime: 99.0,
    maxResponseMs: 5000,
    checkIntervalMs: FIVE_MINUTES_MS,
    evaluationWindowMs: THIRTY_DAYS_MS,
  },
  'explorer-api': {
    serviceName: 'explorer-api',
    targetUptime: 99.0,
    maxResponseMs: 4000,
    checkIntervalMs: FIVE_MINUTES_MS,
    evaluationWindowMs: THIRTY_DAYS_MS,
  },
};

/** Maximum number of health check results to retain per service. */
export const MAX_HISTORY_SIZE = 8640; // 30 days at 5-minute intervals

/** Number of consecutive failures before an incident is raised. */
export const FAILURE_THRESHOLD = 3;

/** Number of consecutive successes before an incident is auto-resolved. */
export const RECOVERY_THRESHOLD = 3;

/** Response time (ms) above which a check is marked as degraded. */
export const DEGRADED_THRESHOLD_MS = 2000;
