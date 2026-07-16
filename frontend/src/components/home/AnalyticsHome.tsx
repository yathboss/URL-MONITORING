import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAnalyticsOverview } from '../../hooks/useAnalyticsOverview';
import { HeartbeatBar } from '../charts/HeartbeatBar';
import { SinglePanelSkeleton } from '../ui/Skeleton';
import { AnalyticsBucket, AnalyticsOverviewMonitor, ReportRange } from '../../types';

interface AnalyticsHomeProps {
  onAddMonitor: () => void;
  onInspect: (id: number) => void;
}

type StatusFilter = 'ALL' | 'UP' | 'WARN' | 'DOWN' | 'PENDING';

const RANGE_OPTIONS: Array<{ key: ReportRange; label: string }> = [
  { key: '24h', label: 'Last 24 hours' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
];

const STATUS_OPTIONS: StatusFilter[] = ['ALL', 'UP', 'WARN', 'DOWN', 'PENDING'];

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  UP: { color: '#1D9E75', bg: '#E8FBF5' },
  WARN: { color: '#BA7517', bg: '#FFF4DE' },
  DOWN: { color: '#E24B4A', bg: '#FFF0F0' },
  PENDING: { color: '#6B7280', bg: '#F3F4F6' },
};

const selectStyle: React.CSSProperties = {
  padding: '9px 12px',
  borderRadius: 10,
  border: '1px solid rgba(0,0,0,0.12)',
  background: '#fff',
  fontSize: 13.5,
  fontWeight: 600,
  cursor: 'pointer',
};

function formatDowntime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function MetricCard({ label, value, detail, tone = 'default' }: { label: string; value: string; detail: string; tone?: string }) {
  return (
    <motion.article className={`ops-metric-card tone-${tone}`} whileHover={{ y: -3 }} transition={{ duration: 0.18 }}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </motion.article>
  );
}

function LatencySparkline({ buckets }: { buckets: AnalyticsBucket[] }) {
  const points = buckets.map((b) => b.avg_ms);
  const valid = points.filter((v): v is number => v !== null);
  if (valid.length < 2) return <div style={{ width: 90, height: 24 }} />;
  const max = Math.max(...valid);
  const min = Math.min(...valid);
  const spread = Math.max(max - min, 1);
  const coords = points
    .map((v, i) => {
      if (v === null) return null;
      const x = (i / Math.max(points.length - 1, 1)) * 88 + 1;
      const y = 21 - ((v - min) / spread) * 18;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .filter(Boolean)
    .join(' ');
  return (
    <svg width={90} height={24} aria-hidden="true">
      <polyline points={coords} fill="none" stroke="#FF7F50" strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  );
}

function MonitorFavicon({ url }: { url: string }) {
  const [error, setError] = useState(false);
  let domain = '';
  try {
    domain = new URL(url).hostname;
  } catch {
    return null;
  }
  if (error) return null;
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
      alt=""
      width={16}
      height={16}
      style={{ borderRadius: 3, flexShrink: 0 }}
      onError={() => setError(true)}
    />
  );
}

export function AnalyticsHome({ onAddMonitor, onInspect }: AnalyticsHomeProps) {
  const [range, setRange] = useState<ReportRange>('7d');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const { overview, isLoading, error, refetch } = useAnalyticsOverview(range);

  const filtered = useMemo<AnalyticsOverviewMonitor[]>(() => {
    if (!overview) return [];
    const term = search.trim().toLowerCase();
    return overview.monitors.filter((monitor) => {
      if (statusFilter !== 'ALL' && monitor.current_status !== statusFilter) return false;
      if (term && !monitor.name.toLowerCase().includes(term) && !monitor.web_address.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [overview, search, statusFilter]);

  if (isLoading) return <SinglePanelSkeleton rows={6} />;

  if (error && !overview) {
    return (
      <div className="ops-panel" style={{ padding: 32, textAlign: 'center' }}>
        <p style={{ color: '#6B7280' }}>{error}</p>
        <button type="button" className="ops-ghost-button" onClick={refetch}>Retry</button>
      </div>
    );
  }

  if (!overview) return null;
  const s = overview.summary;

  return (
    <>
      <div className="ops-toolbar" style={{ alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ marginRight: 'auto' }}>
          <p className="ops-kicker">Analytics</p>
          <h1 style={{ margin: 0, fontSize: 26 }}>Fleet overview</h1>
        </div>
        <button
          type="button"
          className="primary"
          onClick={onAddMonitor}
          style={{ padding: '7px 12px', fontSize: 12.5, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5 }}
        >
          <i className="ti ti-plus" aria-hidden="true" /> Add monitor
        </button>
      </div>

      <section className="ops-metric-grid">
        <MetricCard label="Monitors" value={String(s.monitor_count)} detail={`${filtered.length} shown`} />
        <MetricCard
          label="Fleet uptime"
          value={`${s.overall_uptime_pct.toFixed(2)}%`}
          detail={`Real, over ${RANGE_OPTIONS.find((o) => o.key === range)?.label.toLowerCase()}`}
          tone={s.overall_uptime_pct >= 99 ? 'good' : s.overall_uptime_pct >= 95 ? 'warn' : 'bad'}
        />
        <MetricCard
          label="Incidents"
          value={String(s.total_incidents)}
          detail={`${formatDowntime(s.total_downtime_minutes)} total downtime`}
          tone={s.total_incidents ? 'warn' : 'good'}
        />
        <MetricCard
          label="Avg latency"
          value={s.avg_response_time_ms === null ? '-' : `${Math.round(s.avg_response_time_ms)}ms`}
          detail={s.worst_performer ? `Worst: ${s.worst_performer.name} (${s.worst_performer.uptime_pct.toFixed(1)}%)` : 'Across successful checks'}
        />
      </section>

      <div className="ops-panel">
        <div className="ops-panel-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p className="ops-kicker">Monitors</p>
            <h3>Uptime heartbeat</h3>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or URL…"
              aria-label="Search monitors"
              style={{ ...selectStyle, cursor: 'text', fontWeight: 500, minWidth: 190 }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              aria-label="Filter by status"
              style={selectStyle}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>{status === 'ALL' ? 'All statuses' : status}</option>
              ))}
            </select>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as ReportRange)}
              aria-label="Time range"
              style={selectStyle}
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {overview.monitors.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>
            <p style={{ marginBottom: 14 }}>No monitors yet — add your first one to light up this page.</p>
            <button type="button" className="primary" onClick={onAddMonitor}>
              <i className="ti ti-plus" aria-hidden="true" /> Add monitor
            </button>
          </div>
        )}
        {overview.monitors.length > 0 && filtered.length === 0 && (
          <p style={{ padding: 28, textAlign: 'center', color: '#6B7280' }}>
            No monitors match the current filters.
          </p>
        )}

        <div>
          {filtered.map((monitor) => {
            const style = STATUS_STYLE[monitor.current_status] ?? STATUS_STYLE.PENDING;
            return (
              <article
                key={monitor.monitor_id}
                onClick={() => onInspect(monitor.monitor_id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  padding: '13px 24px',
                  borderBottom: '1px solid #f3f4f6',
                  cursor: 'pointer',
                }}
              >
                <span
                  className="ops-status-pill"
                  style={{ color: style.color, backgroundColor: style.bg, borderColor: style.color, flexShrink: 0, width: 68, textAlign: 'center' }}
                >
                  {monitor.current_status}
                </span>
                <div style={{ width: 190, flexShrink: 0, minWidth: 0 }}>
                  <strong style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <MonitorFavicon url={monitor.web_address} /> {monitor.name}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: '#9CA3AF', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {monitor.web_address}
                  </span>
                </div>
                <HeartbeatBar buckets={monitor.buckets} bucketMinutes={overview.bucket_minutes} />
                <div style={{ width: 78, flexShrink: 0, textAlign: 'right' }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: monitor.uptime_pct >= 99 ? '#1D9E75' : monitor.uptime_pct >= 95 ? '#BA7517' : '#E24B4A' }}>
                    {monitor.total_pings === 0 ? '—' : `${monitor.uptime_pct.toFixed(2)}%`}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>uptime</span>
                </div>
                <div style={{ width: 66, flexShrink: 0, textAlign: 'right' }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#374151' }}>
                    {monitor.avg_response_time_ms === null ? '—' : `${Math.round(monitor.avg_response_time_ms)}ms`}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>avg</span>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <LatencySparkline buckets={monitor.buckets} />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}
