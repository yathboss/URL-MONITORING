import React from 'react'
import { URLItem } from '../../types/index'
import { UrlCard } from './UrlCard'

interface UrlListProps {
  urls: URLItem[]
  onDelete: (id: number) => Promise<void>
}

export function UrlList({ urls, onDelete }: UrlListProps) {
  if (urls.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>
        <p>No URLs being monitored yet. Add one to get started!</p>
      </div>
    )
  }

  return (
    <div>
      {urls.map(url => (
        <UrlCard key={url.id} url={url} onDelete={onDelete} />
      ))}
    </div>
  )
}
