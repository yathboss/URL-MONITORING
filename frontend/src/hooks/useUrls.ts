import { useEffect, useState, useCallback } from 'react'
import { URLItem, AddURLPayload } from '../types/index'
import { getUrls, addUrl, deleteUrl } from '../api/client'

export function useUrls() {
  const [urls, setUrls] = useState<URLItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUrls = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getUrls()
        setUrls(data)
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch URLs'
        setError(errorMsg)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUrls()
  }, [])

  const handleAddUrl = useCallback(async (payload: AddURLPayload): Promise<void> => {
    setIsLoading(true)
    setError(null)
    try {
      const newUrl = await addUrl(payload)
      setUrls(prev => [...prev, newUrl])
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to add URL')
      }
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleDeleteUrl = useCallback(async (id: number): Promise<void> => {
    try {
      await deleteUrl(id)
      setUrls(prev => prev.filter(u => u.id !== id))
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete URL'
      setError(errorMsg)
      throw err
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    urls,
    isLoading,
    error,
    addUrl: handleAddUrl,
    deleteUrl: handleDeleteUrl,
    clearError
  }
}
