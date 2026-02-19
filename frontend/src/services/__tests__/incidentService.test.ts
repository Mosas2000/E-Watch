import { describe, it, expect } from 'vitest';
import {
  createIncident,
  updateIncident,
  incidentDuration,
  meanTimeToAcknowledge,
  meanTimeToResolve,
} from '../incidentService';
import type { Incident } from '../../types/sla';

describe('createIncident', () => {
  it('should create an incident with investigating state', () => {
    const incident = createIncident(
      'API outage',
      'high',
      ['stacks-api'],
      'API not responding',
    );

    expect(incident.title).toBe('API outage');
    expect(incident.severity).toBe('high');
    expect(incident.state).toBe('investigating');
    expect(incident.affectedServices).toEqual(['stacks-api']);
    expect(incident.resolvedAt).toBeNull();
    expect(incident.updates).toHaveLength(1);
  });

  it('should generate unique incident IDs', () => {
    const a = createIncident('Test A', 'low', ['a'], 'desc');
    const b = createIncident('Test B', 'low', ['b'], 'desc');
    expect(a.id).not.toBe(b.id);
  });
});

describe('updateIncident', () => {
  it('should add a status update and transition state', () => {
    const incident = createIncident('Test', 'medium', ['api'], 'desc');
    const updated = updateIncident(incident, 'identified', 'Root cause found');

    expect(updated.state).toBe('identified');
    expect(updated.updates).toHaveLength(2);
    expect(updated.acknowledgedAt).not.toBeNull();
  });

  it('should set resolvedAt when state is resolved', () => {
    const incident = createIncident('Test', 'high', ['api'], 'desc');
    const resolved = updateIncident(incident, 'resolved', 'Fixed');

    expect(resolved.state).toBe('resolved');
    expect(resolved.resolvedAt).not.toBeNull();
  });

  it('should not overwrite acknowledgedAt on subsequent updates', () => {
    const incident = createIncident('Test', 'medium', ['api'], 'desc');
    const step1 = updateIncident(incident, 'identified', 'Found');
    const ackTime = step1.acknowledgedAt;

    const step2 = updateIncident(step1, 'monitoring', 'Watching');
    expect(step2.acknowledgedAt).toBe(ackTime);
  });
});

describe('incidentDuration', () => {
  it('should return elapsed time for active incidents', () => {
    const incident = createIncident('Test', 'low', ['api'], 'desc');
    const duration = incidentDuration(incident);
    expect(duration).toBeGreaterThanOrEqual(0);
    expect(duration).toBeLessThan(1000);
  });

  it('should return total time for resolved incidents', () => {
    const incident = createIncident('Test', 'low', ['api'], 'desc');
    const resolved = updateIncident(incident, 'resolved', 'Done');
    const duration = incidentDuration(resolved);
    expect(duration).toBeGreaterThanOrEqual(0);
  });
});

describe('meanTimeToAcknowledge', () => {
  it('should return null when no incidents have been acknowledged', () => {
    const incident = createIncident('Test', 'low', ['api'], 'desc');
    expect(meanTimeToAcknowledge([incident])).toBeNull();
  });

  it('should calculate average MTTA across acknowledged incidents', () => {
    const a = createIncident('A', 'low', ['api'], 'desc');
    const b = createIncident('B', 'low', ['api'], 'desc');
    const ackA = updateIncident(a, 'identified', 'Found');
    const ackB = updateIncident(b, 'identified', 'Found');

    const result = meanTimeToAcknowledge([ackA, ackB]);
    expect(result).not.toBeNull();
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

describe('meanTimeToResolve', () => {
  it('should return null when no incidents are resolved', () => {
    const incident = createIncident('Test', 'low', ['api'], 'desc');
    expect(meanTimeToResolve([incident])).toBeNull();
  });

  it('should calculate average MTTR across resolved incidents', () => {
    const a = createIncident('A', 'low', ['api'], 'desc');
    const resolved = updateIncident(a, 'resolved', 'Done');

    const result = meanTimeToResolve([resolved]);
    expect(result).not.toBeNull();
    expect(result).toBeGreaterThanOrEqual(0);
  });
});
