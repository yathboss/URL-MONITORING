import { useState, FormEvent, useEffect, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { AlertChannel, AlertChannelPayload, AlertChannelType, WebhookMethod } from '../../types';

const WEBHOOK_METHODS: WebhookMethod[] = ['POST', 'GET', 'PUT', 'PATCH'];

interface AlertChannelModalProps {
  channel?: AlertChannel | null;
  isSaving: boolean;
  onSave: (payload: AlertChannelPayload) => Promise<void> | void;
  onClose: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/.+/;
const SLACK_RE = /^https:\/\/hooks\.slack\.com\/.+/;
const HEADER_KEY_RE = /^[A-Za-z0-9-]+$/;

const TYPE_META: Record<AlertChannelType, { label: string; icon: string; subtitle: string }> = {
  EMAIL: { label: 'Email', icon: 'ti-mail', subtitle: 'Send to an inbox' },
  SLACK: { label: 'Slack', icon: 'ti-brand-slack', subtitle: 'Slack Incoming Webhook' },
  WEBHOOK: { label: 'Webhook', icon: 'ti-webhook', subtitle: 'Discord or generic JSON' },
};

const DEST_META: Record<AlertChannelType, { label: string; icon: string; placeholder: string; error: string }> = {
  EMAIL: {
    label: 'Email address',
    icon: 'ti-at',
    placeholder: 'you@example.com',
    error: 'Enter a valid email address.',
  },
  SLACK: {
    label: 'Slack webhook URL',
    icon: 'ti-brand-slack',
    placeholder: 'https://hooks.slack.com/services/T.../B.../...',
    error: 'Enter a Slack incoming webhook URL (hooks.slack.com).',
  },
  WEBHOOK: {
    label: 'Webhook URL',
    icon: 'ti-link',
    placeholder: 'https://discord.com/api/webhooks/...',
    error: 'Enter a valid http(s) URL.',
  },
};

interface HeaderRow {
  key: string;
  value: string;
}

function headersToRows(headers?: Record<string, string> | null): HeaderRow[] {
  if (!headers) return [];
  return Object.entries(headers).map(([key, value]) => ({ key, value }));
}

export function AlertChannelModal({ channel, isSaving, onSave, onClose }: AlertChannelModalProps) {
  const isEdit = Boolean(channel);
  const [channelType, setChannelType] = useState<AlertChannelType>(channel?.channel_type ?? 'EMAIL');
  const [name, setName] = useState(channel?.name ?? '');
  const [destination, setDestination] = useState(channel?.destination ?? '');
  const [notifyOnDown, setNotifyOnDown] = useState(channel?.notify_on_down ?? true);
  const [notifyOnRecovery, setNotifyOnRecovery] = useState(channel?.notify_on_recovery ?? true);
  const [headerRows, setHeaderRows] = useState<HeaderRow[]>(headersToRows(channel?.headers));
  const [httpMethod, setHttpMethod] = useState<WebhookMethod>(channel?.http_method ?? 'POST');
  const [touched, setTouched] = useState(false);

  const updateHeaderRow = (index: number, field: keyof HeaderRow, value: string) => {
    setHeaderRows((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };
  const removeHeaderRow = (index: number) => {
    setHeaderRows((rows) => rows.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const trimmedDestination = destination.trim();
  const destinationValid =
    channelType === 'EMAIL'
      ? EMAIL_RE.test(trimmedDestination)
      : channelType === 'SLACK'
        ? SLACK_RE.test(trimmedDestination)
        : URL_RE.test(trimmedDestination);
  const nameValid = name.trim().length > 0 && name.trim().length <= 100;
  // A row is invalid only when partially filled or the key has illegal characters.
  const headersValid =
    channelType === 'EMAIL' ||
    headerRows.every((row) => {
      const key = row.key.trim();
      const value = row.value.trim();
      if (!key && !value) return true;
      return HEADER_KEY_RE.test(key) && value.length > 0;
    });
  const isValid = nameValid && destinationValid && headersValid;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    const headers: Record<string, string> = {};
    if (channelType === 'WEBHOOK') {
      for (const row of headerRows) {
        const key = row.key.trim();
        if (key) headers[key] = row.value.trim();
      }
    }
    try {
      await onSave({
        channel_type: channelType,
        name: name.trim(),
        destination: destination.trim(),
        headers,
        http_method: channelType === 'WEBHOOK' ? httpMethod : 'POST',
        notify_on_down: notifyOnDown,
        notify_on_recovery: notifyOnRecovery,
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
        aria-labelledby="alert-modal-title"
        onClick={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="add-url-modal-header">
          <div>
            <p className="landing-kicker modal-kicker">
              <i className="ti ti-bell"></i> {isEdit ? 'EDIT CHANNEL' : 'NEW CHANNEL'}
            </p>
            <h2 id="alert-modal-title">{isEdit ? 'Edit alert channel' : 'Add alert channel'}</h2>
            <p className="modal-subtitle">Get notified the moment one of your monitors goes down or recovers.</p>
          </div>
          <button type="button" className="add-url-modal-close" onClick={onClose} aria-label="Close">
            x
          </button>
        </div>

        <form className="monitor-form step-modal-form" onSubmit={handleSubmit}>
          <div className="modal-section">
            <div className="modal-section-header">
              <div className="step-badge">1</div>
              <h3>Channel type</h3>
            </div>
            <div className="modal-section-body">
              <div style={{ display: 'flex', gap: 12 }}>
                {(['EMAIL', 'SLACK', 'WEBHOOK'] as AlertChannelType[]).map((type) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => setChannelType(type)}
                    aria-pressed={channelType === type}
                    style={{
                      flex: 1,
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: `2px solid ${channelType === type ? '#FF7F50' : 'rgba(0,0,0,0.1)'}`,
                      background: channelType === type ? 'rgba(255,127,80,0.08)' : '#fff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: 600,
                    }}
                  >
                    <i className={`ti ${TYPE_META[type].icon}`} style={{ marginRight: 8 }}></i>
                    {TYPE_META[type].label}
                    <small style={{ display: 'block', fontWeight: 400, color: '#6B7280', marginTop: 4 }}>
                      {TYPE_META[type].subtitle}
                    </small>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-section">
            <div className="modal-section-header">
              <div className="step-badge">2</div>
              <h3>Details</h3>
            </div>
            <div className="modal-section-body inputs-row">
              <div className="monitor-field site-name-field">
                <label htmlFor="channel-name">Label <span className="req">*</span></label>
                <div className="input-with-icon">
                  <i className="ti ti-tag"></i>
                  <input
                    id="channel-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={channelType === 'EMAIL' ? 'My inbox' : 'Ops Discord'}
                  />
                </div>
                {touched && !nameValid && <div className="field-error">A label is required.</div>}
              </div>

              <div className="monitor-field site-url-field">
                <label htmlFor="channel-destination">
                  {DEST_META[channelType].label} <span className="req">*</span>
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {channelType === 'WEBHOOK' && (
                    <select
                      value={httpMethod}
                      onChange={(e) => setHttpMethod(e.target.value as WebhookMethod)}
                      aria-label="Request method"
                      style={{
                        flexShrink: 0,
                        padding: '0 10px',
                        borderRadius: 10,
                        border: '1px solid rgba(0,0,0,0.12)',
                        background: '#fff',
                        fontWeight: 700,
                        fontSize: 13,
                        color: '#111827',
                        cursor: 'pointer',
                      }}
                    >
                      {WEBHOOK_METHODS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  )}
                  <div className="input-with-icon" style={{ flex: 1 }}>
                    <i className={`ti ${DEST_META[channelType].icon}`}></i>
                    <input
                      id="channel-destination"
                      type={channelType === 'EMAIL' ? 'email' : 'url'}
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder={DEST_META[channelType].placeholder}
                    />
                  </div>
                </div>
                {touched && !destinationValid && (
                  <div className="field-error">{DEST_META[channelType].error}</div>
                )}
                {channelType === 'SLACK' && (
                  <small style={{ display: 'block', marginTop: 6, color: '#6B7280' }}>
                    Create one at api.slack.com/apps → your app → Incoming Webhooks → Add New Webhook.
                  </small>
                )}
              </div>
            </div>
          </div>

          {channelType === 'WEBHOOK' && (
            <div className="modal-section">
              <div className="modal-section-header">
                <div className="step-badge">3</div>
                <h3>Custom headers <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: 13 }}>(optional)</span></h3>
              </div>
              <div className="modal-section-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>
                  Key/value pairs sent with every webhook request — e.g. <code>Authorization</code> or{' '}
                  <code>X-API-Key</code> so the receiving server can verify it's really us.
                </p>
                {headerRows.map((row, index) => (
                  <div key={index} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div className="monitor-field" style={{ flex: 1 }}>
                      <div className="input-with-icon">
                        <i className="ti ti-key"></i>
                        <input
                          type="text"
                          value={row.key}
                          onChange={(e) => updateHeaderRow(index, 'key', e.target.value)}
                          placeholder="Key (e.g. X-API-Key)"
                          aria-label={`Header ${index + 1} key`}
                        />
                      </div>
                    </div>
                    <div className="monitor-field" style={{ flex: 1.4 }}>
                      <div className="input-with-icon">
                        <i className="ti ti-forms"></i>
                        <input
                          type="text"
                          value={row.value}
                          onChange={(e) => updateHeaderRow(index, 'value', e.target.value)}
                          placeholder="Value (e.g. my-secret-token)"
                          aria-label={`Header ${index + 1} value`}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeHeaderRow(index)}
                      aria-label={`Remove header ${index + 1}`}
                      style={{
                        border: '1px solid rgba(0,0,0,0.1)',
                        background: '#fff',
                        borderRadius: 10,
                        padding: '10px 12px',
                        cursor: 'pointer',
                        color: '#EF4444',
                      }}
                    >
                      <i className="ti ti-trash"></i>
                    </button>
                  </div>
                ))}
                {touched && !headersValid && (
                  <div className="field-error">
                    Each header needs a name (letters, digits, dashes) and a value.
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setHeaderRows((rows) => [...rows, { key: '', value: '' }])}
                  disabled={headerRows.length >= 20}
                  style={{
                    alignSelf: 'flex-start',
                    border: '1px dashed rgba(0,0,0,0.2)',
                    background: 'transparent',
                    borderRadius: 10,
                    padding: '8px 14px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    color: '#374151',
                  }}
                >
                  <i className="ti ti-plus" style={{ marginRight: 6 }}></i> Add header
                </button>
              </div>
            </div>
          )}

          <div className="modal-section">
            <div className="modal-section-header">
              <div className="step-badge">{channelType === 'WEBHOOK' ? 4 : 3}</div>
              <h3>When to notify</h3>
            </div>
            <div className="modal-section-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={notifyOnDown} onChange={(e) => setNotifyOnDown(e.target.checked)} />
                <span>Notify when a monitor goes <strong>DOWN</strong></span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={notifyOnRecovery} onChange={(e) => setNotifyOnRecovery(e.target.checked)} />
                <span>Notify when a monitor <strong>recovers</strong></span>
              </label>
            </div>
          </div>

          <div className="step-modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={isSaving} className="primary save-monitor-btn">
              {isSaving ? 'Saving...' : isEdit ? 'Save changes' : 'Add channel'} <i className="ti ti-arrow-right"></i>
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
