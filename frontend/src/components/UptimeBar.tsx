import type { HealthCheckResult } from '../types/sla';

interface UptimeBarProps {
  /** Recent check history, oldest first. */
  history: HealthCheckResult[];
  /** Number of segments to display. Defaults to 90. */
  segments?: number;
}

/**
 * Horizontal bar chart showing recent uptime status.
 * Each segment represents one health check result, colored by status.
 */
export function UptimeBar({ history, segments = 90 }: UptimeBarProps) {
  // Take the most recent N results
  const recent = history.slice(-segments);

  // Pad with empty segments if not enough data
  const padCount = segments - recent.length;
  const paddedItems = [
    ...Array.from({ length: padCount }, () => null),
    ...recent,
  ];

  return (
    <div
      className="uptime-bar"
      style={{
        display: 'flex',
        gap: '1px',
        height: '28px',
        width: '100%',
      }}
    >
      {paddedItems.map((item, index) => {
        let color = '#d0d7de';
        if (item) {
          switch (item.status) {
            case 'operational':
              color = '#2da44e';
              break;
            case 'degraded':
              color = '#d4a72c';
              break;
            case 'partial-outage':
              color = '#db6d28';
              break;
            case 'major-outage':
              color = '#cf222e';
              break;
          }
        }

        return (
          <div
            key={index}
            title={
              item
                ? `${new Date(item.timestamp).toLocaleString()} - ${item.status} (${item.responseTimeMs}ms)`
                : 'No data'
            }
            style={{
              flex: 1,
              backgroundColor: color,
              borderRadius: '2px',
              minWidth: '2px',
              cursor: 'default',
            }}
          />
        );
      })}
    </div>
  );
}
