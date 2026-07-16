import { motion } from 'framer-motion';
import {
  Activity,
  BellRing,
  Check,
  FileText,
  Globe,
  Mail,
  MessageSquare,
  ShieldCheck,
  Webhook,
  Wrench,
} from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1] as const;

function Row({ flip, children }: { flip?: boolean; children: React.ReactNode }) {
  return (
    <motion.div
      className={`lv2-feature-row${flip ? ' lv2-feature-row--flip' : ''}`}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.65, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li>
      <Check size={16} strokeWidth={2.5} />
      <span>{children}</span>
    </li>
  );
}

export function FeatureSections() {
  return (
    <section className="lv2-section" id="features">
      <div className="lv2-container">
        <div className="lv2-section-head">
          <h2>Everything a monitoring stack needs. Nothing it doesn't.</h2>
          <p>Four capabilities, one console — each one real, working, and verifiable in the product today.</p>
        </div>

        <Row>
          <div className="lv2-feature-copy">
            <div className="lv2-feature-eyebrow">UPTIME MONITORING</div>
            <h3>Checks every 30 seconds, verified before we page you</h3>
            <p>
              Every monitor is probed on its own schedule from a worker pool that scales to
              hundreds of URLs. A single blip never wakes you: a monitor is only marked DOWN
              after consecutive failed checks.
            </p>
            <ul className="lv2-feature-list">
              <Bullet>Configurable intervals — from 30 seconds up</Bullet>
              <Bullet>False-down protection with confirmation re-checks</Bullet>
              <Bullet>Latency, P95, TTFB, SSL expiry, and keyword checks</Bullet>
            </ul>
          </div>
          <div className="lv2-feature-visual" aria-hidden="true">
            <div className="lv2-visual-row">
              <span className="lv2-dot lv2-dot--up" /> api.yourapp.com <small>200 · 87ms</small>
            </div>
            <div className="lv2-visual-row">
              <span className="lv2-dot lv2-dot--up" /> www.yourapp.com <small>200 · 214ms</small>
            </div>
            <div className="lv2-visual-row">
              <span className="lv2-dot lv2-dot--warn" /> cdn.yourapp.com <small>retrying…</small>
            </div>
            <div className="lv2-visual-row">
              <span className="lv2-dot lv2-dot--up" /> status.yourapp.com <small>200 · 66ms</small>
            </div>
          </div>
        </Row>

        <Row flip>
          <div className="lv2-feature-copy">
            <div className="lv2-feature-eyebrow">ALERTING</div>
            <h3>Alerts where your team already is</h3>
            <p>
              The moment a monitor confirms DOWN — and again when it recovers — every enabled
              channel fires. Each delivery is logged, so you can prove an alert was sent.
            </p>
            <ul className="lv2-feature-list">
              <Bullet>Email via SMTP with rich HTML formatting</Bullet>
              <Bullet>Slack with rich Block Kit cards — color-coded by event</Bullet>
              <Bullet>Webhooks with custom headers and request methods</Bullet>
              <Bullet>One-click test sends from the UI</Bullet>
            </ul>
          </div>
          <div className="lv2-feature-visual" aria-hidden="true">
            <div className="lv2-visual-row"><Mail size={17} /> Email <small>SENT · 2s</small></div>
            <div className="lv2-visual-row"><MessageSquare size={17} /> Slack #ops <small>SENT · 1s</small></div>
            <div className="lv2-visual-row"><Webhook size={17} /> PagerBridge webhook <small>SENT · 1s</small></div>
            <div className="lv2-visual-row"><BellRing size={17} /> Recovery notice <small>queued</small></div>
          </div>
        </Row>

        <Row>
          <div className="lv2-feature-copy">
            <div className="lv2-feature-eyebrow">INCIDENTS &amp; REPORTS</div>
            <h3>From incident timeline to executive PDF</h3>
            <p>
              Incidents open and resolve themselves as monitors fail and recover. When someone
              asks "how reliable are we?", export the answer instead of assembling it.
            </p>
            <ul className="lv2-feature-list">
              <Bullet>Automatic incident lifecycle with acknowledgements and notes</Bullet>
              <Bullet>Executive uptime report across 24h–90d ranges</Bullet>
              <Bullet>One-click PDF export, per monitor or fleet-wide</Bullet>
            </ul>
          </div>
          <div className="lv2-feature-visual" aria-hidden="true">
            <div className="lv2-visual-row"><Activity size={17} /> Fleet uptime <small>99.98%</small></div>
            <div className="lv2-visual-row"><ShieldCheck size={17} /> Incidents resolved <small>12 this month</small></div>
            <div className="lv2-visual-row"><FileText size={17} /> executive-uptime-report.pdf <small>ready</small></div>
          </div>
        </Row>

        <Row flip>
          <div className="lv2-feature-copy">
            <div className="lv2-feature-eyebrow">STATUS PAGES &amp; MAINTENANCE</div>
            <h3>A public status page in one click</h3>
            <p>
              Give your users a live view of service health without giving them your dashboard.
              Planned maintenance windows keep scheduled work from reading as an outage.
            </p>
            <ul className="lv2-feature-list">
              <Bullet>Public page with per-monitor 90-day uptime</Bullet>
              <Bullet>Toggle any monitor public or hidden</Bullet>
              <Bullet>Maintenance windows announced up front</Bullet>
            </ul>
          </div>
          <div className="lv2-feature-visual" aria-hidden="true">
            <div className="lv2-visual-row"><Globe size={17} /> status.yourapp.com <small>all systems go</small></div>
            <div className="lv2-visual-row"><span className="lv2-dot lv2-dot--up" /> Public API <small>99.99% · 90d</small></div>
            <div className="lv2-visual-row"><Wrench size={17} /> DB upgrade window <small>Sat 02:00–03:00</small></div>
          </div>
        </Row>
      </div>
    </section>
  );
}
