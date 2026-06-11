import React from 'react'
import { useUrls } from '../../hooks/useUrls'
import { AddUrlForm } from '../urls/AddUrlForm'
import { UrlList } from '../urls/UrlList'
import { Toast } from '../ui/Toast'

export function Dashboard() {
  const { urls, isLoading, error, addUrl, deleteUrl, clearError } = useUrls()

  const loadingSkeletonContainerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  }

  const skeletonCardStyles: React.CSSProperties = {
    height: 120,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    animation: 'pulse 1.5s ease-in-out infinite'
  }

  const dashboardStyles: React.CSSProperties = {
    flex: 1,
    padding: 24
  }

  return (
    <div style={dashboardStyles}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24, color: '#1F2937' }}>
        Monitor Your URLs
      </h1>

      <AddUrlForm onAdd={addUrl} isLoading={isLoading} />

      {isLoading && urls.length === 0 ? (
        <div style={loadingSkeletonContainerStyles}>
          {[1, 2, 3].map(i => (
            <div key={i} style={skeletonCardStyles} />
          ))}
        </div>
      ) : (
        <UrlList urls={urls} onDelete={deleteUrl} />
      )}

      {error && <Toast message={error} onDismiss={clearError} />}
    </div>
  )
}
