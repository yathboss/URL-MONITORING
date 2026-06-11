import { useState, useEffect } from 'react';
import { URLItem, AddURLPayload } from '../types';
import { getUrls as apiGetUrls, addUrl as apiAddUrl, deleteUrl as apiDeleteUrl } from '../api/client';

export function useUrls() {
  const [urls, setUrls] = useState<URLItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    apiGetUrls()
      .then((data) => {
        if (mounted) {
          setUrls(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message);
          setIsLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const addUrl = async (payload: AddURLPayload): Promise<void> => {
    setIsLoading(true);
    try {
      const newUrl = await apiAddUrl(payload);
      setUrls((prev) => [...prev, newUrl]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUrl = async (id: number): Promise<void> => {
    try {
      await apiDeleteUrl(id);
      setUrls((prev) => prev.filter((u) => u.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const clearError = () => setError(null);

  return { urls, isLoading, error, addUrl, deleteUrl, clearError };
}
