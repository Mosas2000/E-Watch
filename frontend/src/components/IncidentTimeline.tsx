import type { Incident } from '../types/sla';
import { formatDuration } from '../utils/uptimeCalculations';
import { incidentDuration } from '../services/incidentService';

interface IncidentTimelineProps {
  incidents: Incident[];
}

const STATE_LABELS: Record<string, string> = {
  investigating: 'Investigating',
  identified: 'Identified',
  monitoring: 'Monitoring',
  resolved: 'Resolved',
};

const SEVERITY_COLORS: Record<string, string> = {
  low: '#54aeff',
  medium: '#d4a72c',
  high: '#db6d28',
  critical: '#cf222e',
};

/**
 * Display a chronological timeline of incidents with their status updates.
 */
export function IncidentTimeline({ incidents }: IncidentTimelineProps) {
  if (incidents.length === 0) {
    return (
      <div className="incident-timeline-empty" style={{ padding: '16px 0', color: '#656d76' }}>
        No incidents to display.
      </div>
    );
  }

  return (
    <div className="incident-timeline">
      {incidents.map((incident) => (
        <div
          key={incident.id}
          className="incident-card"
          style={{
            border: '1px solid #d0d7de',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '12px',
            borderLeft: `4px solid ${SEVERITY_COLORS[incident.severity]}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem' }}>
              {incident.id}: {incident.title}
            </h4>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: '10px',
                backgroundColor: SEVERITY_COLORS[incident.severity],
                color: '#fff',
                fontWeight: 500,
              }}
            >
              {incident.severity}
            </span>
          </div>

          <div style={{ fontSize: '0.85rem', color: '#656d76', marginBottom: '8px' }}>
            Duration: {formatDuration(incidentDuration(incident))}
            {' | '}
            Status: {STATE_LABELS[incident.state] ?? incident.state}
          </div>

          <div style={{ fontSize: '0.85rem', color: '#656d76', marginBottom: '4px' }}>
            Affected: {incident.affectedServices.join(', ')}
          </div>

          {incident.updates.length > 0 && (
            <div style={{ marginTop: '12px', borderTop: '1px solid #eaeef2', paddingTop: '8px' }}>
              {incident.updates.map((update, idx) => (
                <div key={idx} style={{ fontSize: '0.8rem', marginBottom: '6px', paddingLeft: '12px', borderLeft: '2px solid #d0d7de' }}>
                  <span style={{ color: '#656d76' }}>
                    {new Date(update.timestamp).toLocaleTimeString()}
                  </span>
                  {' - '}
                  <strong>{STATE_LABELS[update.state] ?? update.state}:</strong>{' '}
                  {update.message}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
