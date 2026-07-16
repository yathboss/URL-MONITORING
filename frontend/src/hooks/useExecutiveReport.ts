import { useCallback, useEffect, useState } from 'react';
import { getExecutiveReport, getApiErrorMessage } from '../api/client';
import { ExecutiveReport, ReportRange } from '../types';

export function useExecutiveReport(range: ReportRange) {
  const [report, setReport] = useState<ExecutiveReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getExecutiveReport(range);
      setReport(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load the report.'));
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  return { report, isLoading, error, refetch: fetchReport };
}
