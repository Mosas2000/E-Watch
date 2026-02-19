import type { SlaComplianceReport } from '../types/sla';
import { formatUptime } from '../utils/uptimeCalculations';
import { complianceLabel } from '../services/slaComplianceService';

interface SlaComplianceCardProps {
  report: SlaComplianceReport;
}

/**
 * Card displaying SLA compliance status for a single service.
 */
export function SlaComplianceCard({ report }: SlaComplianceCardProps) {
  const borderColor = report.isCompliant ? '#2da44e' : '#cf222e';
  const bgColor = report.isCompliant ? '#dafbe1' : '#ffebe9';

  return (
    <div
      className="sla-compliance-card"
      style={{
        border: `1px solid ${borderColor}`,
        borderRadius: '8px',
        padding: '16px',
        backgroundColor: bgColor,
        marginBottom: '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, fontSize: '0.95rem' }}>
          {report.target.serviceName}
        </h4>
        <span
          style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: report.isCompliant ? '#1a7f37' : '#cf222e',
          }}
        >
          {complianceLabel(report)}
        </span>
      </div>

      <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
        <div>
          <span style={{ color: '#656d76' }}>Uptime: </span>
          <strong>{formatUptime(report.stats.uptimePercentage)}</strong>
          <span style={{ color: '#656d76' }}> / {formatUptime(report.target.targetUptime)}</span>
        </div>
        <div>
          <span style={{ color: '#656d76' }}>Avg Response: </span>
          <strong>{report.stats.averageResponseMs}ms</strong>
          <span style={{ color: '#656d76' }}> / {report.target.maxResponseMs}ms</span>
        </div>
        <div>
          <span style={{ color: '#656d76' }}>P95: </span>
          <strong>{report.stats.p95ResponseMs}ms</strong>
        </div>
        <div>
          <span style={{ color: '#656d76' }}>P99: </span>
          <strong>{report.stats.p99ResponseMs}ms</strong>
        </div>
        <div>
          <span style={{ color: '#656d76' }}>Checks: </span>
          <strong>{report.stats.successfulChecks}</strong>
          <span style={{ color: '#656d76' }}> / {report.stats.totalChecks}</span>
        </div>
        <div>
          <span style={{ color: '#656d76' }}>Failed: </span>
          <strong>{report.stats.failedChecks}</strong>
        </div>
      </div>
    </div>
  );
}
