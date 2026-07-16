import { motion } from 'framer-motion';

const STATS: Array<[string, string]> = [
  ['30s', 'fastest check interval'],
  ['2,880', 'checks per monitor per day'],
  ['90-day', 'reporting history'],
  ['3', 'alert channel types'],
];

export function StatsBand() {
  return (
    <section className="lv2-stats" id="stats">
      <div className="lv2-container">
        <motion.div
          className="lv2-stats-grid"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {STATS.map(([value, label]) => (
            <div className="lv2-stat" key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
