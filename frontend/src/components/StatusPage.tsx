import { useMemo } from 'react';
import type { HealthCheckResult } from '../types/sla';
import { useUptimeMonitor } from '../hooks/useUptimeMonitor';
import { ServiceStatusBadge } from './ServiceStatusBadge';
import { UptimeBar } from './UptimeBar';
import { IncidentTimeline } from './IncidentTimeline';
import { SlaComplianceCard } from './SlaComplianceCard';
import { SLA_TARGETS } from '../config/slaConfig';
import { getHistory } from '../services/uptimeMonitor';
import { evaluateCompliance } from '../services/slaComplianceService';
import { aggregateStatus } from '../services/healthCheckService';
import { formatUptime } from '../utils/uptimeCalculations';
import { calculateUptimeStats } from '../utils/uptimeCalculations';
import './StatusPage.css';

const SERVICE_NAMES: Record<string, string> = {
  'stacks-api': 'Stacks Node API',
  'contract-read': 'Contract Read',
  'explorer-api': 'Explorer API',
};

/**
 * Full status page showing service health, SLA compliance, and incidents.
 */
export function StatusPage() {
  const { serviceStatuses, activeIncidents, isRunning, manualCheck } =
    useUptimeMonitor();

  const services = useMemo(() => {
    return Object.keys(SERVICE_NAMES).map((key) => {
      const status = serviceStatuses.get(key) ?? 'operational';
      const history: HealthCheckResult[] = getHistory(key);
      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      const stats = calculateUptimeStats(key, history, thirtyDaysAgo, now);

      return {
        key,
        displayName: SERVICE_NAMES[key],
        status,
        history,
        stats,
      };
    });
  }, [serviceStatuses]);

  const complianceReports = useMemo(() => {
    return Object.values(SLA_TARGETS).map((target) => {
      const history = getHistory(target.serviceName);
      return evaluateCompliance(target, history);
    });
  }, [serviceStatuses]);

  const overallStatus = useMemo(() => {
    const latestResults = services
      .map((s) => s.history[s.history.length - 1])
      .filter(Boolean);
    return aggregateStatus(latestResults);
  }, [services]);

  return (
    <div className="status-page" style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>System Status</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ServiceStatusBadge status={overallStatus} />
          <button
            onClick={manualCheck}
            disabled={!isRunning}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #d0d7de',
              backgroundColor: '#f6f8fa',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      <section style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>Services</h3>
        {services.map((service) => (
          <div
            key={service.key}
            style={{
              padding: '12px 16px',
              border: '1px solid #d0d7de',
              borderRadius: '8px',
              marginBottom: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 500 }}>{service.displayName}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.8rem', color: '#656d76' }}>
                  {formatUptime(service.stats.uptimePercentage)} uptime
                </span>
                <ServiceStatusBadge status={service.status} />
              </div>
            </div>
            <UptimeBar history={service.history} />
          </div>
        ))}
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>SLA Compliance</h3>
        {complianceReports.map((report) => (
          <SlaComplianceCard key={report.target.serviceName} report={report} />
        ))}
      </section>

      {activeIncidents.length > 0 && (
        <section style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>Active Incidents</h3>
          <IncidentTimeline incidents={activeIncidents} />
        </section>
      )}
    </div>
  );
}
