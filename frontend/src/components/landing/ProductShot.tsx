import { useState } from 'react';
import { Activity } from 'lucide-react';

export function ProductShot() {
  const [imageMissing, setImageMissing] = useState(false);

  return (
    <div className="lv2-shot">
      <div className="lv2-shot-chrome">
        <div className="lv2-shot-dots">
          <span /><span /><span />
        </div>
        <div className="lv2-shot-url">app.uptime-monitor.dev/dashboard</div>
      </div>
      {imageMissing ? (
        <div className="lv2-shot-fallback">
          <Activity size={32} strokeWidth={1.5} />
          <span>Dashboard preview</span>
        </div>
      ) : (
        <img
          src="/screenshot-dashboard.png"
          alt="Uptime Monitor dashboard showing the monitor fleet, latency, and uptime"
          loading="lazy"
          onError={() => setImageMissing(true)}
        />
      )}
    </div>
  );
}
