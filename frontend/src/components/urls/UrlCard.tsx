import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PingResult, URLItem } from '../../types';
import { StatusDot } from '../ui/StatusDot';
import { Badge } from '../ui/Badge';
import { EditUrlModal } from './EditUrlModal';
import styles from './UrlCard.module.css';

interface UrlCardProps {
  url: URLItem;
  onDelete: (id: number) => void;
  onEdit: (url: URLItem) => void;
  lastPing?: PingResult | null;
}

function timeAgo(isoString: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatInterval(seconds: number): string {
  if (seconds === 30) return '30s';
  if (seconds === 60) return '1m';
  if (seconds === 300) return '5m';
  if (seconds === 1800) return '30m';
  if (seconds === 3600) return '1h';
  if (seconds === 21600) return '6h';
  if (seconds === 43200) return '12h';
  if (seconds === 86400) return '1d';
  if (seconds === 259200) return '3d';
  return `${seconds}s`;
}

export function UrlCard({ url, onDelete, onEdit, lastPing }: UrlCardProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [flashStatus, setFlashStatus] = useState<'UP' | 'DOWN' | null>(null);
  const previousStatus = useRef(url.status);
  const navigate = useNavigate();

  useEffect(() => {
    let timer: number;
    if (isConfirming) {
      timer = window.setTimeout(() => setIsConfirming(false), 4000);
    }
    return () => window.clearTimeout(timer);
  }, [isConfirming]);

  useEffect(() => {
    if (previousStatus.current !== url.status && url.status !== 'PENDING') {
      setFlashStatus(url.status);
      const timer = window.setTimeout(() => setFlashStatus(null), 600);
      previousStatus.current = url.status;
      return () => window.clearTimeout(timer);
    }

    previousStatus.current = url.status;
    return undefined;
  }, [url.status]);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isConfirming) {
      onDelete(url.id);
    } else {
      setIsConfirming(true);
    }
  };

  const getBadgeVariant = (status: string) => {
    if (status === 'UP') return 'success';
    if (status === 'DOWN') return 'danger';
    return 'neutral';
  };

  return (
    <div 
      className={styles.card} 
      onClick={() => navigate(`/urls/${url.id}`)}
      style={{
        cursor: 'pointer',
        borderColor: flashStatus === 'UP' ? '#1D9E75' : flashStatus === 'DOWN' ? '#E24B4A' : undefined,
      }}
    >
      <div className={styles.header}>
        <div className={styles.name}>{url.name}</div>
        <StatusDot status={url.status} />
      </div>
      
      <div className={styles.address}>
        <div className={styles.addressRow}>
          <span className={styles.label}>URL:</span>
          <span>{url.web_address}</span>
        </div>
        <div className={styles.addressRow}>
          <span className={styles.label}>Status:</span>
          <Badge variant={getBadgeVariant(url.status)} label={url.status} />
        </div>
      </div>
      
      <div className={styles.footer}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className={styles.time}>Added: {timeAgo(url.created_at)} &middot; Int: {formatInterval(url.ping_interval_seconds || 30)}</div>
          {lastPing && (
            <Badge
              variant={lastPing.status === 'UP' ? 'neutral' : 'danger'}
              label={lastPing.status === 'UP' && lastPing.latency_ms !== null ? `${lastPing.latency_ms}ms` : 'timeout'}
            />
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isConfirming ? (
            <>
              <button 
                className={styles.actionBtn} 
                style={{ border: 'none', background: 'transparent', color: '#6B7280' }}
                onClick={(e) => { e.stopPropagation(); setIsConfirming(false); }}
              >
                cancel
              </button>
              <button className={`${styles.actionBtn} ${styles.deleteMode}`} onClick={handleDeleteClick}>
                Confirm?
              </button>
            </>
          ) : (
            <>
              <button 
                className={styles.actionBtn} 
                onClick={(e) => { e.stopPropagation(); setShowEditModal(true); }}
              >
                Edit
              </button>
              <button className={`${styles.actionBtn} ${styles.deleteMode}`} onClick={handleDeleteClick}>
                Delete
              </button>
            </>
          )}
        </div>
      </div>
      {showEditModal && (
        <div onClick={(e) => e.stopPropagation()}>
          <EditUrlModal 
            url={url} 
            onClose={() => setShowEditModal(false)} 
            onSuccess={(updated) => { setShowEditModal(false); onEdit(updated); }} 
          />
        </div>
      )}
    </div>
  );
}
