import { useRef, useState } from 'react';
import { ExecutiveReportMonitor, ReportRange } from '../../types';
import { useExecutiveReport } from '../../hooks/useExecutiveReport';
import { Badge } from '../ui/Badge';
import { DownloadIcon } from '../ui/Icons';
import { parseApiDate } from '../../utils/dates';
import { exportElementToPdf } from '../../utils/reportExport';

const RANGE_OPTIONS: Array<{ key: ReportRange; label: string }> = [
  { key: '24h', label: 'Last 24 hours' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
];

function formatLatency(value: number | null): string {
  return value === null ? '-' : `${Math.round(value)}ms`;
}

function formatDowntime(minutes: number): string {
  if (minutes === 0) return '0m';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function monitorRowCells(monitor: ExecutiveReportMonitor) {
  const noData = monitor.total_pings === 0;
  return (
    <>
      <td>
        <strong>{monitor.name}</strong>
        <div style={{ fontSize: 11, color: '#6B7280' }}>{monitor.web_address}</div>
      </td>
      <td className={monitor.current_status === 'UP' ? 'is-up' : monitor.current_status === 'DOWN' ? 'is-down' : ''}>
        {monitor.current_status}
      </td>
      <td>{noData ? 'no data' : `${monitor.uptime_pct.toFixed(2)}%`}</td>
      <td>{noData ? '-' : formatLatency(monitor.avg_response_time_ms)}</td>
      <td>{noData ? '-' : monitor.incident_count}</td>
      <td>{noData ? '-' : formatDowntime(monitor.total_downtime_minutes)}</td>
    </>
  );
}

export function ExecutiveReportPanel() {
  const [range, setRange] = useState<ReportRange>('7d');
  const { report, isLoading, error, refetch } = useExecutiveReport(range);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement | null>(null);

  const downloadPdf = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      await exportElementToPdf(reportRef.current, `executive-uptime-report-${range}`);
    } finally {
      setExporting(false);
    }
  };

  const rangeLabel = RANGE_OPTIONS.find((option) => option.key === range)?.label ?? range;
  const summary = report?.summary;
  const summaryCards = summary
    ? [
        { label: 'Overall uptime', value: `${summary.overall_uptime_pct.toFixed(2)}%` },
        { label: 'Avg latency', value: formatLatency(summary.avg_response_time_ms) },
        { label: 'Incidents', value: String(summary.total_incidents) },
        { label: 'Total downtime', value: formatDowntime(summary.total_downtime_minutes) },
        { label: 'Monitors', value: String(summary.monitor_count) },
        {
          label: 'Worst performer',
          value: summary.worst_performer
            ? `${summary.worst_performer.name} (${summary.worst_performer.uptime_pct.toFixed(2)}%)`
            : '-',
        },
      ]
    : [];

  return (
    <div className="ops-panel">
      <div className="ops-panel-header">
        <div>
          <p className="ops-kicker">Executive uptime report</p>
          <h3>Fleet-wide evidence, stakeholder-ready</h3>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            value={range}
            onChange={(event) => setRange(event.target.value as ReportRange)}
            aria-label="Report period"
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              border: '1px solid rgba(0,0,0,0.12)',
              background: '#fff',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {RANGE_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>{option.label}</option>
            ))}
          </select>
          <button
            type="button"
            className="primary"
            onClick={downloadPdf}
            disabled={exporting || isLoading || !report}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <DownloadIcon size={14} />
            {exporting ? 'Preparing PDF...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {isLoading && (
        <p className="report-empty-note" style={{ padding: '24px' }}>Building the report…</p>
      )}
      {!isLoading && error && (
        <div style={{ padding: 24 }}>
          <p className="report-empty-note">{error}</p>
          <button type="button" className="ops-ghost-button" onClick={refetch}>Retry</button>
        </div>
      )}
      {!isLoading && !error && report && report.monitors.length === 0 && (
        <p className="report-empty-note" style={{ padding: '24px' }}>
          No monitors yet — add your first monitor and the report will fill itself in.
        </p>
      )}

      {!isLoading && !error && report && report.monitors.length > 0 && (
        <div className="report-preview-shell" style={{ padding: 24 }}>
          <div className="monitor-report-page" ref={reportRef}>
            <header className="monitor-report-header">
              <div>
                <span className="report-brand-mark">Uptime Monitor</span>
                <h1>Executive uptime report</h1>
                <p>{rangeLabel} · {report.summary.monitor_count} monitors</p>
              </div>
              <div className="report-status-card">
                <span>Fleet uptime</span>
                <Badge
                  variant={report.summary.overall_uptime_pct >= 99 ? 'success' : report.summary.overall_uptime_pct >= 95 ? 'warning' : 'danger'}
                  label={`${report.summary.overall_uptime_pct.toFixed(2)}%`}
                />
              </div>
            </header>

            <div className="report-meta-row">
              <span>Generated {parseApiDate(report.generated_at).toLocaleString()}</span>
              <span>
                Period: {parseApiDate(report.period_start).toLocaleDateString()} – {parseApiDate(report.period_end).toLocaleDateString()}
              </span>
            </div>

            <section className="report-section">
              <div className="report-section-heading">
                <span>01</span>
                <h2>Fleet summary</h2>
              </div>
              <div className="report-summary-grid">
                {summaryCards.map((card) => (
                  <article key={card.label}>
                    <span>{card.label}</span>
                    <strong>{card.value}</strong>
                  </article>
                ))}
              </div>
            </section>

            <section className="report-section">
              <div className="report-section-heading">
                <span>02</span>
                <h2>Per-monitor breakdown</h2>
              </div>
              <table className="report-check-table">
                <thead>
                  <tr>
                    <th>Monitor</th>
                    <th>Status</th>
                    <th>Uptime</th>
                    <th>Avg latency</th>
                    <th>Incidents</th>
                    <th>Downtime</th>
                  </tr>
                </thead>
                <tbody>
                  {report.monitors.map((monitor) => (
                    <tr key={monitor.monitor_id}>{monitorRowCells(monitor)}</tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
