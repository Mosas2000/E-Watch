import type { ServiceStatus } from '../types/sla';

interface ServiceStatusBadgeProps {
  status: ServiceStatus;
  label?: string;
}

const STATUS_LABELS: Record<ServiceStatus, string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  'partial-outage': 'Partial Outage',
  'major-outage': 'Major Outage',
};

const STATUS_COLORS: Record<ServiceStatus, string> = {
  operational: '#2da44e',
  degraded: '#d4a72c',
  'partial-outage': '#db6d28',
  'major-outage': '#cf222e',
};

/**
 * Small badge displaying the current status of a service.
 */
export function ServiceStatusBadge({ status, label }: ServiceStatusBadgeProps) {
  return (
    <span
      className="service-status-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '2px 10px',
        borderRadius: '12px',
        fontSize: '0.8rem',
        fontWeight: 500,
        color: '#fff',
        backgroundColor: STATUS_COLORS[status],
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: '#fff',
          opacity: 0.8,
        }}
      />
      {label ?? STATUS_LABELS[status]}
    </span>
  );
}
