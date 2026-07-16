import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
import '../../styles/home-showcase.css';

interface HomeShowcaseProps {
  onAddMonitor: () => void;
}

const EASE = [0.22, 1, 0.36, 1] as const;

function Row({ flip, children }: { flip?: boolean; children: React.ReactNode }) {
  return (
    <motion.div
      className={`hs-feature-row${flip ? ' hs-feature-row--flip' : ''}`}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li>
      <Check size={15} strokeWidth={2.5} />
      <span>{children}</span>
    </li>
  );
}

const STATS: Array<[string, string]> = [
  ['30s', 'fastest check interval'],
  ['2,880', 'checks per monitor per day'],
  ['90-day', 'reporting history'],
  ['3', 'alert channel types'],
];

const QUOTES = [
  {
    quote:
      'We pointed it at 20 endpoints and it caught a staging outage the same afternoon — before anyone on the team noticed.',
    author: 'Early user',
    role: 'DevOps engineer',
  },
  {
    quote:
      'The false-down protection is the part I trust most. It re-checks before paging, so when an alert fires I know it’s real.',
    author: 'Pilot team lead',
    role: 'Platform engineering',
  },
  {
    quote:
      'Exec asked for an uptime number in a meeting. I exported the PDF report and had it in front of them in under a minute.',
    author: 'Early user',
    role: 'Engineering manager',
  },
];

export function HomeShowcase({ onAddMonitor }: HomeShowcaseProps) {
  const navigate = useNavigate();

  return (
    <div className="hs-page">
      <motion.section
        className="hs-hero"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <span className="hs-kicker">UPTIME MONITOR PLATFORM</span>
        <h1>
          Know your site is down <em>before your users do.</em>
        </h1>
        <p className="hs-hero-sub">
          Monitor your websites, APIs, and infrastructure with checks as fast as every 30
          seconds — instant email, Slack, and webhook alerts, incident timelines, executive
          reports, and a public status page.
        </p>
        <div className="hs-hero-actions">
          <button type="button" className="primary start-monitor-button" onClick={onAddMonitor}>
            <i className="ti ti-plus" aria-hidden="true" /> Add a monitor
          </button>
          <button type="button" className="ops-ghost-button" onClick={() => navigate('/monitors')}>
            <i className="ti ti-radar-2" aria-hidden="true" /> View your fleet
          </button>
        </div>
      </motion.section>

      <section>
        <div className="hs-section-head">
          <h2>Everything a monitoring stack needs. Nothing it doesn't.</h2>
          <p>Four capabilities, one console — each one live in this workspace right now.</p>
        </div>

        <Row>
          <div className="hs-feature-copy">
            <div className="hs-feature-eyebrow">UPTIME MONITORING</div>
            <h3>Checks every 30 seconds, verified before we page you</h3>
            <p>
              Every monitor is probed on its own schedule from a worker pool that scales to
              hundreds of URLs. A single blip never wakes you: a monitor is only marked DOWN
              after consecutive failed checks.
            </p>
            <ul className="hs-feature-list">
              <Bullet>Configurable intervals — from 30 seconds up</Bullet>
              <Bullet>False-down protection with confirmation re-checks</Bullet>
              <Bullet>Latency, P95, TTFB, SSL expiry, and keyword checks</Bullet>
            </ul>
          </div>
          <div className="hs-feature-visual" aria-hidden="true">
            <div className="hs-visual-row">
              <span className="hs-dot hs-dot--up" /> api.yourapp.com <small>200 · 87ms</small>
            </div>
            <div className="hs-visual-row">
              <span className="hs-dot hs-dot--up" /> www.yourapp.com <small>200 · 214ms</small>
            </div>
            <div className="hs-visual-row">
              <span className="hs-dot hs-dot--warn" /> cdn.yourapp.com <small>retrying…</small>
            </div>
            <div className="hs-visual-row">
              <span className="hs-dot hs-dot--up" /> status.yourapp.com <small>200 · 66ms</small>
            </div>
          </div>
        </Row>

        <Row flip>
          <div className="hs-feature-copy">
            <div className="hs-feature-eyebrow">ALERTING</div>
            <h3>Alerts where your team already is</h3>
            <p>
              The moment a monitor confirms DOWN — and again when it recovers — every enabled
              channel fires. Each delivery is logged, so you can prove an alert was sent.
            </p>
            <ul className="hs-feature-list">
              <Bullet>Email via SMTP with rich HTML formatting</Bullet>
              <Bullet>Slack with rich Block Kit cards — color-coded by event</Bullet>
              <Bullet>Webhooks with custom headers and request methods</Bullet>
              <Bullet>One-click test sends from the Alerts tab</Bullet>
            </ul>
          </div>
          <div className="hs-feature-visual" aria-hidden="true">
            <div className="hs-visual-row"><Mail size={16} /> Email <small>SENT · 2s</small></div>
            <div className="hs-visual-row"><MessageSquare size={16} /> Slack #ops <small>SENT · 1s</small></div>
            <div className="hs-visual-row"><Webhook size={16} /> Custom webhook <small>SENT · 1s</small></div>
            <div className="hs-visual-row"><BellRing size={16} /> Recovery notice <small>queued</small></div>
          </div>
        </Row>

        <Row>
          <div className="hs-feature-copy">
            <div className="hs-feature-eyebrow">INCIDENTS &amp; REPORTS</div>
            <h3>From incident timeline to executive PDF</h3>
            <p>
              Incidents open and resolve themselves as monitors fail and recover. When someone
              asks "how reliable are we?", export the answer instead of assembling it.
            </p>
            <ul className="hs-feature-list">
              <Bullet>Automatic incident lifecycle with acknowledgements and notes</Bullet>
              <Bullet>Executive uptime report across 24h–90d ranges</Bullet>
              <Bullet>One-click PDF export, per monitor or fleet-wide</Bullet>
            </ul>
          </div>
          <div className="hs-feature-visual" aria-hidden="true">
            <div className="hs-visual-row"><Activity size={16} /> Fleet uptime <small>99.98%</small></div>
            <div className="hs-visual-row"><ShieldCheck size={16} /> Incidents resolved <small>12 this month</small></div>
            <div className="hs-visual-row"><FileText size={16} /> executive-uptime-report.pdf <small>ready</small></div>
          </div>
        </Row>

        <Row flip>
          <div className="hs-feature-copy">
            <div className="hs-feature-eyebrow">STATUS PAGES &amp; MAINTENANCE</div>
            <h3>A public status page in one click</h3>
            <p>
              Give your users a live view of service health without giving them your dashboard.
              Planned maintenance windows keep scheduled work from reading as an outage.
            </p>
            <ul className="hs-feature-list">
              <Bullet>Public page with per-monitor 90-day uptime</Bullet>
              <Bullet>Toggle any monitor public or hidden</Bullet>
              <Bullet>Maintenance windows announced up front</Bullet>
            </ul>
          </div>
          <div className="hs-feature-visual" aria-hidden="true">
            <div className="hs-visual-row"><Globe size={16} /> status.yourapp.com <small>all systems go</small></div>
            <div className="hs-visual-row"><span className="hs-dot hs-dot--up" /> Public API <small>99.99% · 90d</small></div>
            <div className="hs-visual-row"><Wrench size={16} /> DB upgrade window <small>Sat 02:00–03:00</small></div>
          </div>
        </Row>
      </section>

      <motion.section
        className="hs-stats"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.55, ease: EASE }}
      >
        {STATS.map(([value, label]) => (
          <div className="hs-stat" key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </motion.section>

      <section>
        <div className="hs-section-head">
          <h2>Built with the people who run it</h2>
          <p>What the teams using it during the pilot keep telling us.</p>
        </div>
        <motion.div
          className="hs-quotes"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55, ease: EASE }}
        >
          {QUOTES.map((item) => (
            <blockquote className="hs-quote" key={item.quote}>
              <p>“{item.quote}”</p>
              <footer>
                <strong>{item.author}</strong>
                {item.role}
              </footer>
            </blockquote>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
