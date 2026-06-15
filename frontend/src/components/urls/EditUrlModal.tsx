import { useState, FormEvent, useEffect } from 'react';
import { updateUrl } from '../../api/client';
import { URLItem } from '../../types';

interface EditUrlModalProps {
  url: URLItem | null;
  onClose: () => void;
  onSuccess: (updatedUrl: URLItem) => void;
}

export function EditUrlModal({ url, onClose, onSuccess }: EditUrlModalProps) {
  const [name, setName] = useState('');
  const [webAddress, setWebAddress] = useState('');
  const [interval, setIntervalVal] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (url) {
      setName(url.name);
      setWebAddress(url.web_address);
      setIntervalVal(url.ping_interval_seconds || 30);
    }
  }, [url]);

  if (!url) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const updated = await updateUrl(url.id, {
        name: name !== url.name ? name : undefined,
        web_address: webAddress !== url.web_address ? webAddress : undefined,
        ping_interval_seconds: interval !== url.ping_interval_seconds ? interval : undefined
      });
      onSuccess(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to update URL');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#FFFFFF', padding: 32, borderRadius: 12,
        width: '100%', maxWidth: 420, boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 24px 0', fontSize: 20, color: '#111827' }}>Edit URL</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#4B5563' }}>Name</label>
            <input 
              value={name} 
              onChange={e => setName(e.target.value)}
              placeholder="e.g. My Website"
              required
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#4B5563' }}>Web Address</label>
            <input 
              value={webAddress} 
              onChange={e => setWebAddress(e.target.value)}
              placeholder="https://example.com"
              type="url"
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="ping-interval-edit" style={{ fontSize: 13, fontWeight: 500, color: '#4B5563' }}>Ping interval</label>
            <select
              id="ping-interval-edit"
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

          {error && <div style={{ color: '#F56565', fontSize: 13 }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
            <button 
              type="button" 
              className="outline-button" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
