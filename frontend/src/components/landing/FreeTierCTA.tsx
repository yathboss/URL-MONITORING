import { motion } from 'framer-motion';

interface FreeTierCTAProps {
  onStart: () => void;
}

export function FreeTierCTA({ onStart }: FreeTierCTAProps) {
  return (
    <section className="lv2-section">
      <div className="lv2-container">
        <motion.div
          className="lv2-cta"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2>Start free. Monitors, alerts, and status pages included.</h2>
          <p>No card required — your first monitor is live in under a minute.</p>
          <button type="button" className="lv2-btn lv2-btn--primary lv2-btn--large" onClick={onStart}>
            Start monitoring free
          </button>
        </motion.div>
      </div>
    </section>
  );
}
