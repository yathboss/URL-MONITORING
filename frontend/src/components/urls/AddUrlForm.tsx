import { useState, FormEvent, useEffect } from 'react';
import { AddURLPayload } from '../../types';

interface AddUrlFormProps {
  onAdd: (payload: AddURLPayload) => void;
  isLoading: boolean;
}

export function AddUrlForm({ onAdd, isLoading }: AddUrlFormProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [touchedName, setTouchedName] = useState(false);
  const [touchedUrl, setTouchedUrl] = useState(false);
  
  const [nameError, setNameError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    if (touchedName) {
      if (!name.trim()) setNameError('Name is required');
      else if (name.length > 100) setNameError('Name must be under 100 characters');
      else setNameError(null);
    }
  }, [name, touchedName]);

  useEffect(() => {
    if (touchedUrl) {
      if (!url.trim()) setUrlError('URL is required');
      else if (!/^https?:\/\/.+\..+/.test(url)) setUrlError('Must be a valid HTTP/HTTPS URL');
      else setUrlError(null);
    }
  }, [url, touchedUrl]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouchedName(true);
    setTouchedUrl(true);
    
    const isValidUrl = /^https?:\/\/.+\..+/.test(url);
    if (!name.trim() || name.length > 100 || !isValidUrl) return;

    onAdd({ name: name.trim(), web_address: url.trim() });
    setName('');
    setUrl('');
    setTouchedName(false);
    setTouchedUrl(false);
  };

  const hasErrors = nameError !== null || urlError !== null;

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
        padding: 24,
        backgroundColor: '#fafafa',
        border: '1px solid #e0e0e0',
        borderRadius: 8,
        marginBottom: 24,
      }}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label htmlFor="site-name" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
          Site name
        </label>
        <input
          id="site-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouchedName(true)}
          placeholder="My Website"
        />
        {nameError && touchedName && <div style={{ color: '#d93025', fontSize: 12 }}>{nameError}</div>}
      </div>

      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label htmlFor="site-url" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
          URL
        </label>
        <input
          id="site-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={() => setTouchedUrl(true)}
          placeholder="https://example.com"
        />
        {urlError && touchedUrl && <div style={{ color: '#d93025', fontSize: 12 }}>{urlError}</div>}
      </div>

      <div style={{ marginTop: 24 }}>
        <button type="submit" disabled={isLoading || hasErrors} className="primary">
          {isLoading ? 'Adding...' : 'Start monitoring'}
        </button>
      </div>
    </form>
  );
}
