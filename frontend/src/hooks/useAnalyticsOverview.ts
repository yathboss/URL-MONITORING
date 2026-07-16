import { useCallback, useEffect, useRef, useState } from 'react';
import { getAnalyticsOverview, getApiErrorMessage } from '../api/client';
import { AnalyticsOverview, ReportRange } from '../types';

export function useAnalyticsOverview(range: ReportRange) {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasData = useRef(false);

  const fetchOverview = useCallback(async () => {
    // Skeleton only before the very first payload; background refreshes keep
    // the previous data on screen so heartbeats don't flicker.
    if (!hasData.current) setIsLoading(true);
    try {
      const data = await getAnalyticsOverview(range);
      setOverview(data);
      setError(null);
      hasData.current = true;
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load analytics.'));
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void fetchOverview();
    const onFocus = () => void fetchOverview();
    window.addEventListener('focus', onFocus);
    const interval = window.setInterval(() => void fetchOverview(), 60000);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.clearInterval(interval);
    };
  }, [fetchOverview]);

  return { overview, isLoading, error, refetch: fetchOverview };
}
