import { useState } from 'react';
import { AnalyticsBucket } from '../../types';
import { parseApiDate } from '../../utils/dates';

interface HeartbeatBarProps {
  buckets: AnalyticsBucket[];
  bucketMinutes: number;
}

function segmentColor(bucket: AnalyticsBucket): string {
  if (bucket.total === 0) return 'rgba(0, 0, 0, 0.07)';
  if (bucket.up === bucket.total) return '#1D9E75';
  if (bucket.up === 0) return '#F56565';
  return '#BA7517';
}

function bucketLabel(bucket: AnalyticsBucket, bucketMinutes: number): string {
  const start = parseApiDate(bucket.t);
  const timeLabel =
    bucketMinutes < 1440
      ? start.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : start.toLocaleDateString([], { month: 'short', day: 'numeric' });
  if (bucket.total === 0) return `${timeLabel} — no checks`;
  const pct = ((bucket.up / bucket.total) * 100).toFixed(1);
  const latency = bucket.avg_ms === null ? '' : ` · ${Math.round(bucket.avg_ms)}ms`;
  return `${timeLabel} — ${bucket.up}/${bucket.total} up (${pct}%)${latency}`;
}

export function HeartbeatBar({ buckets, bucketMinutes }: HeartbeatBarProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 120 }}>
      <div style={{ display: 'flex', gap: 2, alignItems: 'center', height: 26 }}>
        {buckets.map((bucket, index) => (
          <span
            key={bucket.t}
            onMouseEnter={() => setHovered(index)}
            onMouseLeave={() => setHovered(null)}
            style={{
              flex: 1,
              height: hovered === index ? 26 : 20,
              minWidth: 3,
              borderRadius: 3,
              background: segmentColor(bucket),
              transition: 'height 0.12s ease',
              cursor: 'default',
            }}
          />
        ))}
      </div>
      {hovered !== null && buckets[hovered] && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: `${(hovered / Math.max(buckets.length - 1, 1)) * 100}%`,
            transform: 'translateX(-50%)',
            background: '#111827',
            color: '#fff',
            fontSize: 12,
            padding: '6px 10px',
            borderRadius: 8,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 10,
            boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
          }}
        >
          {bucketLabel(buckets[hovered], bucketMinutes)}
        </div>
      )}
    </div>
  );
}
