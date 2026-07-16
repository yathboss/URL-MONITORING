import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useBugReports } from '../../hooks/useBugReports';
import { getApiErrorMessage } from '../../api/client';
import { Badge } from '../ui/Badge';
import { Toast } from '../ui/Toast';
import { timeAgo } from '../../utils/dates';
import { BugReport, BugReportPayload, BugStatus } from '../../types';
import { BugReportModal } from './BugReportModal';

const STATUS_OPTIONS: BugStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];

function severityVariant(severity: BugReport['severity']) {
  if (severity === 'HIGH') return 'danger' as const;
  if (severity === 'MEDIUM') return 'warning' as const;
  return 'neutral' as const;
}

function statusVariant(status: BugStatus) {
  if (status === 'RESOLVED') return 'success' as const;
  if (status === 'IN_PROGRESS') return 'warning' as const;
  return 'danger' as const;
}

function statusLabel(status: BugStatus) {
  return status === 'IN_PROGRESS' ? 'IN PROGRESS' : status;
}

export function BugReportsView() {
  const { isAdmin } = useAuth();
  const { reports, isLoading, error, submit, updateStatus, remove, refetch } = useBugReports();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleSave = async (payload: BugReportPayload) => {
    setIsSaving(true);
    try {
      await submit(payload);
      setToast('Bug report submitted. Thank you!');
    } catch (err) {
      setToast(getApiErrorMessage(err, 'Could not submit the report.'));
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (report: BugReport, status: BugStatus) => {
    try {
      await updateStatus(report.id, status);
      setToast(`"${report.title}" moved to ${statusLabel(status)}.`);
    } catch (err) {
      setToast(getApiErrorMessage(err, 'Could not update the report.'));
    }
  };

  const handleDelete = async (report: BugReport) => {
    try {
      await remove(report.id);
      setToast('Report deleted.');
    } catch (err) {
      setToast(getApiErrorMessage(err, 'Could not delete the report.'));
    }
  };

  return (
    <div className="ops-panel">
      <div className="ops-panel-header">
        <div>
          <p className="ops-kicker">Quality signal</p>
          <h3>{isAdmin ? 'Bug reports — triage queue' : 'Your bug reports'}</h3>
        </div>
        <button
          type="button"
          className="primary"
          onClick={() => setIsModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <i className="ti ti-bug" /> Report a bug
        </button>
      </div>

      {isLoading && <p className="report-empty-note" style={{ padding: 24 }}>Loading reports…</p>}
      {!isLoading && error && (
        <div style={{ padding: 24 }}>
          <p className="report-empty-note">{error}</p>
          <button type="button" className="ops-ghost-button" onClick={refetch}>Retry</button>
        </div>
      )}
      {!isLoading && !error && reports.length === 0 && (
        <p className="report-empty-note" style={{ padding: 24 }}>
          {isAdmin
            ? 'No bugs reported yet — quiet skies.'
            : 'Nothing reported yet. Spotted something broken? Hit "Report a bug".'}
        </p>
      )}

      {!isLoading && !error && reports.length > 0 && (
        <div className="ops-simple-rows">
          {reports.map((report) => (
            <article
              key={report.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 16,
                padding: '16px 24px',
                borderBottom: '1px solid #f3f4f6',
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Badge variant={severityVariant(report.severity)} label={report.severity} />
                  <strong style={{ fontSize: '0.95rem', color: '#111827' }}>{report.title}</strong>
                  {report.area && (
                    <span
                      style={{
                        fontSize: 11,
                        color: '#6B7280',
                        border: '1px solid #E5E7EB',
                        borderRadius: 999,
                        padding: '1px 8px',
                      }}
                    >
                      {report.area}
                    </span>
                  )}
                </div>
                <p style={{ margin: '6px 0 4px', fontSize: '0.85rem', color: '#4B5563', whiteSpace: 'pre-wrap' }}>
                  {report.description}
                </p>
                <small style={{ color: '#9CA3AF' }}>
                  {timeAgo(report.created_at)}
                  {isAdmin && ` · ${report.reporter_email ?? 'deleted user'}`}
                </small>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                {isAdmin ? (
                  <>
                    <select
                      value={report.status}
                      onChange={(e) => handleStatusChange(report, e.target.value as BugStatus)}
                      aria-label={`Status of ${report.title}`}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        border: '1px solid rgba(0,0,0,0.12)',
                        background: '#fff',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{statusLabel(status)}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="ops-table-action"
                      style={{ color: '#E24B4A' }}
                      onClick={() => handleDelete(report)}
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <Badge variant={statusVariant(report.status)} label={statusLabel(report.status)} />
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <BugReportModal
            isSaving={isSaving}
            onSave={handleSave}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </AnimatePresence>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
