import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ProductShot } from './ProductShot';

interface HeroProps {
  onStart: () => void;
}

const EASE = [0.16, 1, 0.3, 1] as const;

export function Hero({ onStart }: HeroProps) {
  return (
    <header className="lv2-hero" id="top">
      <div className="lv2-container">
        <motion.span
          className="lv2-kicker"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          URL MONITORING, DONE RIGHT
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: EASE }}
        >
          Know your site is down <em>before your users do.</em>
        </motion.h1>
        <motion.p
          className="lv2-hero-sub"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.16, ease: EASE }}
        >
          Monitor hundreds of URLs with checks as fast as every 30 seconds. Instant email,
          Slack, and webhook alerts, incident timelines, executive reports, and a public
          status page — free.
        </motion.p>
        <motion.div
          className="lv2-hero-ctas"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.24, ease: EASE }}
        >
          <button type="button" className="lv2-btn lv2-btn--primary lv2-btn--large" onClick={onStart}>
            Start monitoring free
          </button>
          <Link to="/status" className="lv2-btn lv2-btn--ghost lv2-btn--large">
            See the live demo
          </Link>
        </motion.div>
        <motion.p
          className="lv2-trust-line"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.34, ease: EASE }}
        >
          No credit card — set up your first monitor in under a minute.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: EASE }}
        >
          <ProductShot />
        </motion.div>
      </div>
    </header>
  );
}
