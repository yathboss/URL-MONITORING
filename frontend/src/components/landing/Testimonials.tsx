import { motion } from 'framer-motion';

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

export function Testimonials() {
  return (
    <section className="lv2-section">
      <div className="lv2-container">
        <div className="lv2-section-head">
          <h2>Built with the people who run it</h2>
          <p>What the teams using it during the pilot keep telling us.</p>
        </div>
        <motion.div
          className="lv2-quotes"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {QUOTES.map((item) => (
            <blockquote className="lv2-quote" key={item.quote}>
              <p>“{item.quote}”</p>
              <footer>
                <strong>{item.author}</strong>
                {item.role}
              </footer>
            </blockquote>
          ))}
        </motion.div>
        <p className="lv2-quotes-caption">From our pilot users</p>
      </div>
    </section>
  );
}
