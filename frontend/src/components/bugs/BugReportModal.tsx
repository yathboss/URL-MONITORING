import { useEffect, useState, FormEvent, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { BugReportPayload, BugSeverity } from '../../types';

interface BugReportModalProps {
  isSaving: boolean;
  onSave: (payload: BugReportPayload) => Promise<void> | void;
  onClose: () => void;
}

const SEVERITIES: Array<{ key: BugSeverity; label: string; hint: string }> = [
  { key: 'LOW', label: 'Low', hint: 'Cosmetic or minor annoyance' },
  { key: 'MEDIUM', label: 'Medium', hint: 'Something is wrong but there is a workaround' },
  { key: 'HIGH', label: 'High', hint: 'Blocks me from using a feature' },
];

const AREAS = [
  'Home',
  'Monitors',
  'Incidents',
  'Status pages',
  'Maintenance',
  'Alerts',
  'Reports',
  'Integrations',
  'Settings',
  'Other',
];

export function BugReportModal({ isSaving, onSave, onClose }: BugReportModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<BugSeverity>('MEDIUM');
  const [area, setArea] = useState<string>('Other');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const titleValid = title.trim().length > 0 && title.trim().length <= 200;
  const descriptionValid = description.trim().length > 0 && description.trim().length <= 5000;
  const isValid = titleValid && descriptionValid;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        severity,
        area,
      });
      onClose();
    } catch {
      // parent surfaces the error via toast
    }
  };

  return (
    <motion.div
      className="add-url-modal-backdrop"
      role="presentation"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <motion.div
        className="add-url-modal-panel step-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bug-modal-title"
        onClick={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="add-url-modal-header">
          <div>
            <p className="landing-kicker modal-kicker">
              <i className="ti ti-bug"></i> REPORT A BUG
            </p>
            <h2 id="bug-modal-title">Something broken? Tell us.</h2>
            <p className="modal-subtitle">Your report goes straight to the admins for triage.</p>
          </div>
          <button type="button" className="add-url-modal-close" onClick={onClose} aria-label="Close">
            x
          </button>
        </div>

        <form className="monitor-form step-modal-form" onSubmit={handleSubmit}>
          <div className="modal-section">
            <div className="modal-section-header">
              <div className="step-badge">1</div>
              <h3>What happened?</h3>
            </div>
            <div className="modal-section-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="monitor-field">
                <label htmlFor="bug-title">Title <span className="req">*</span></label>
                <div className="input-with-icon">
                  <i className="ti ti-alert-triangle"></i>
                  <input
                    id="bug-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Latency chart shows no data"
                    maxLength={200}
                  />
                </div>
                {touched && !titleValid && <div className="field-error">A title is required (max 200 chars).</div>}
              </div>

              <div className="monitor-field">
                <label htmlFor="bug-description">Description <span className="req">*</span></label>
                <textarea
                  id="bug-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What did you do, what did you expect, and what happened instead?"
                  rows={5}
                  maxLength={5000}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid rgba(0,0,0,0.12)',
                    fontFamily: 'inherit',
                    fontSize: 14,
                    resize: 'vertical',
                  }}
                />
                {touched && !descriptionValid && (
                  <div className="field-error">A description is required (max 5000 chars).</div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-section">
            <div className="modal-section-header">
              <div className="step-badge">2</div>
              <h3>How bad is it?</h3>
            </div>
            <div className="modal-section-body" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {SEVERITIES.map((option) => (
                <button
                  type="button"
                  key={option.key}
                  onClick={() => setSeverity(option.key)}
                  aria-pressed={severity === option.key}
                  style={{
                    flex: 1,
                    minWidth: 140,
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: `2px solid ${severity === option.key ? '#FF7F50' : 'rgba(0,0,0,0.1)'}`,
                    background: severity === option.key ? 'rgba(255,127,80,0.08)' : '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontWeight: 600,
                  }}
                >
                  {option.label}
                  <small style={{ display: 'block', fontWeight: 400, color: '#6B7280', marginTop: 4 }}>
                    {option.hint}
                  </small>
                </button>
              ))}
            </div>
          </div>

          <div className="modal-section">
            <div className="modal-section-header">
              <div className="step-badge">3</div>
              <h3>Where did it happen?</h3>
            </div>
            <div className="modal-section-body">
              <div className="monitor-field" style={{ maxWidth: 280 }}>
                <label htmlFor="bug-area">Section of the app</label>
                <select
                  id="bug-area"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(0,0,0,0.12)',
                    background: '#fff',
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  {AREAS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="step-modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={isSaving} className="primary save-monitor-btn">
              {isSaving ? 'Sending...' : 'Submit report'} <i className="ti ti-arrow-right"></i>
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
