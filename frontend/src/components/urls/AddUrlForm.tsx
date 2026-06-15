import { useState, FormEvent, useEffect, ClipboardEvent } from 'react';
import { AddURLPayload } from '../../types';

interface AddUrlFormProps {
  onAdd: (payload: AddURLPayload) => Promise<void> | void;
  isLoading: boolean;
}

export function AddUrlForm({ onAdd, isLoading }: AddUrlFormProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [interval, setIntervalVal] = useState(30);
  const [touchedName, setTouchedName] = useState(false);
  const [touchedUrl, setTouchedUrl] = useState(false);
  const [wasAdded, setWasAdded] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    if (!touchedName) return;
    if (!name.trim()) setNameError('Name is required');
    else if (name.length > 100) setNameError('Name must be under 100 characters');
    else setNameError(null);
  }, [name, touchedName]);

  useEffect(() => {
    if (!touchedUrl) return;
    if (!url.trim()) setUrlError('URL is required');
    else if (!/^https?:\/\/.+\..+/.test(url)) setUrlError('Must be a valid HTTP/HTTPS URL');
    else setUrlError(null);
  }, [url, touchedUrl]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouchedName(true);
    setTouchedUrl(true);

    const isValidUrl = /^https?:\/\/.+\..+/.test(url);
    if (!name.trim() || name.length > 100 || !isValidUrl) return;

    try {
      await onAdd({ name: name.trim(), web_address: url.trim(), ping_interval_seconds: interval });
    } catch {
      return;
    }

    setName('');
    setUrl('');
    setTouchedName(false);
    setTouchedUrl(false);
    setWasAdded(true);
    window.setTimeout(() => setWasAdded(false), 2000);
  };

  const handleUrlPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pastedText = event.clipboardData.getData('text').trim();
    if (name.trim() || !/^https?:\/\//.test(pastedText)) return;

    try {
      setName(new URL(pastedText).hostname);
    } catch {
      return;
    }
  };

  const hasErrors = nameError !== null || urlError !== null;

  return (
    <form className="monitor-form" onSubmit={handleSubmit}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label htmlFor="site-name">Site name</label>
        <input
          id="site-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouchedName(true)}
          placeholder="My Website"
        />
        {nameError && touchedName && <div className="field-error">{nameError}</div>}
      </div>

      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label htmlFor="site-url">URL</label>
        <input
          id="site-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={() => setTouchedUrl(true)}
          onPaste={handleUrlPaste}
          placeholder="https://example.com"
        />
        {urlError && touchedUrl && <div className="field-error">{urlError}</div>}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label htmlFor="ping-interval">Ping interval</label>
        <select
          id="ping-interval"
          value={interval}
          onChange={(e) => setIntervalVal(Number(e.target.value))}
          style={{
            padding: '10px 14px',
            borderRadius: 6,
            border: '1px solid rgba(0, 0, 0, 0.1)',
            backgroundColor: '#FCFCFC',
            fontSize: '15px',
            color: '#111827',
            outline: 'none',
          }}
        >
          <option value={30}>30 seconds</option>
          <option value={60}>1 minute</option>
          <option value={300}>5 minutes</option>
          <option value={1800}>30 minutes</option>
          <option value={3600}>1 hour</option>
          <option value={21600}>6 hours</option>
          <option value={43200}>12 hours</option>
          <option value={86400}>1 day</option>
          <option value={259200}>3 days</option>
        </select>
      </div>

      <div style={{ marginTop: 24 }}>
        <button
          type="submit"
          disabled={isLoading || hasErrors}
          className="primary"
          style={{ color: wasAdded ? '#D8F8EA' : undefined, backgroundColor: wasAdded ? '#1D9E75' : undefined }}
        >
          {wasAdded ? 'Added' : isLoading ? 'Adding...' : 'Start monitoring'}
        </button>
      </div>
    </form>
  );
}
