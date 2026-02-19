import type {
  Incident,
  IncidentSeverity,
  IncidentState,
  IncidentUpdate,
} from '../types/sla';

let nextIncidentId = 1;

/**
 * Create a new incident record.
 */
export function createIncident(
  title: string,
  severity: IncidentSeverity,
  affectedServices: string[],
  description: string,
): Incident {
  const id = `INC-${String(nextIncidentId++).padStart(4, '0')}`;

  return {
    id,
    title,
    severity,
    state: 'investigating',
    affectedServices,
    startedAt: Date.now(),
    acknowledgedAt: null,
    resolvedAt: null,
    description,
    updates: [
      {
        timestamp: Date.now(),
        state: 'investigating',
        message: description,
      },
    ],
  };
}

/**
 * Add a status update to an existing incident and transition its state.
 */
export function updateIncident(
  incident: Incident,
  state: IncidentState,
  message: string,
): Incident {
  const update: IncidentUpdate = {
    timestamp: Date.now(),
    state,
    message,
  };

  const updated: Incident = {
    ...incident,
    state,
    updates: [...incident.updates, update],
  };

  if (state === 'identified' && !incident.acknowledgedAt) {
    updated.acknowledgedAt = Date.now();
  }

  if (state === 'resolved') {
    updated.resolvedAt = Date.now();
  }

  return updated;
}

/**
 * Calculate the duration of an incident in milliseconds.
 * Returns the elapsed time since the incident started if still active,
 * or the total duration if already resolved.
 */
export function incidentDuration(incident: Incident): number {
  const end = incident.resolvedAt ?? Date.now();
  return end - incident.startedAt;
}

/**
 * Calculate Mean Time To Acknowledge across a set of resolved incidents.
 */
export function meanTimeToAcknowledge(incidents: Incident[]): number | null {
  const acknowledged = incidents.filter((i) => i.acknowledgedAt !== null);
  if (acknowledged.length === 0) return null;

  const total = acknowledged.reduce(
    (sum, i) => sum + (i.acknowledgedAt! - i.startedAt),
    0,
  );
  return Math.round(total / acknowledged.length);
}

/**
 * Calculate Mean Time To Resolve across a set of resolved incidents.
 */
export function meanTimeToResolve(incidents: Incident[]): number | null {
  const resolved = incidents.filter((i) => i.resolvedAt !== null);
  if (resolved.length === 0) return null;

  const total = resolved.reduce(
    (sum, i) => sum + (i.resolvedAt! - i.startedAt),
    0,
  );
  return Math.round(total / resolved.length);
}
