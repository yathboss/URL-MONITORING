import { Link } from 'react-router-dom';

interface LandingNavProps {
  onStart: () => void;
}

export function LandingNav({ onStart }: LandingNavProps) {
  return (
    <nav className="lv2-nav">
      <div className="lv2-container lv2-nav-inner">
        <a href="#top" className="lv2-brand">
          <span className="lv2-brand-mark">U</span>
          Uptime Monitor
        </a>
        <div className="lv2-nav-links">
          <a href="#features">Features</a>
          <a href="#stats">Stats</a>
          <a href="#faq">FAQ</a>
          <a href="#contact">Contact</a>
        </div>
        <div className="lv2-nav-actions">
          <Link to="/login" className="lv2-btn lv2-btn--ghost">Sign in</Link>
          <button type="button" className="lv2-btn lv2-btn--primary" onClick={onStart}>
            Start free
          </button>
        </div>
      </div>
    </nav>
  );
}
