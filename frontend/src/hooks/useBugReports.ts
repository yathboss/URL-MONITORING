import { useCallback, useEffect, useState } from 'react';
import {
  deleteBugReport,
  getBugReports,
  submitBugReport,
  updateBugReport,
} from '../api/client';
import { BugReport, BugReportPayload, BugStatus } from '../types';

export function useBugReports() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      const data = await getBugReports();
      setReports(data);
      setError(null);
    } catch {
      setError('Could not load bug reports.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  const submit = useCallback(async (payload: BugReportPayload) => {
    const created = await submitBugReport(payload);
    setReports((previous) => [created, ...previous]);
    return created;
  }, []);

  const updateStatus = useCallback(async (id: number, status: BugStatus) => {
    const updated = await updateBugReport(id, status);
    setReports((previous) => previous.map((report) => (report.id === id ? updated : report)));
    return updated;
  }, []);

  const remove = useCallback(async (id: number) => {
    await deleteBugReport(id);
    setReports((previous) => previous.filter((report) => report.id !== id));
  }, []);

  return { reports, isLoading, error, submit, updateStatus, remove, refetch: fetchReports };
}
