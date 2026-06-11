import React, { useState } from 'react'
import { URLItem } from '../../types/index'
import { StatusDot } from '../ui/StatusDot'
import { Badge } from '../ui/Badge'

function timeAgo(isoString: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

interface UrlCardProps {
  url: URLItem
  onDelete: (id: number) => Promise<void>
}

export function UrlCard({ url, onDelete }: UrlCardProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteClick = () => {
    setIsConfirming(true)
    const timer = setTimeout(() => {
      setIsConfirming(false)
    }, 4000)
    return () => clearTimeout(timer)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(url.id)
    } finally {
      setIsDeleting(false)
      setIsConfirming(false)
    }
  }

  const cardStyles: React.CSSProperties = {
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: 16,
    backgroundColor: 'white',
    marginBottom: 12
  }

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  }

  const urlInfoStyles: React.CSSProperties = {
    flex: 1
  }

  const urlAddressStyles: React.CSSProperties = {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    wordBreak: 'break-all' as const
  }

  const nameStyles: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 600,
    color: '#1F2937',
    marginBottom: 8
  }

  const metaStyles: React.CSSProperties = {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12
  }

  const statusBadgeStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 4
  }

  const timeStyles: React.CSSProperties = {
    fontSize: 12,
    color: '#9CA3AF'
  }

  const buttonContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: 8,
    alignItems: 'center'
  }

  const buttonStyles: React.CSSProperties = {
    backgroundColor: isConfirming ? '#FEE2E2' : '#F3F4F6',
    border: '1px solid #E5E7EB',
    borderRadius: 4,
    padding: '6px 12px',
    fontSize: 12,
    cursor: 'pointer',
    color: isConfirming ? '#DC2626' : '#374151'
  }

  const cancelLinkStyles: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: '#6B7280',
    cursor: 'pointer',
    fontSize: 12,
    textDecoration: 'underline',
    padding: 0
  }

  const statusVariant = url.status === 'UP' ? 'success' : url.status === 'DOWN' ? 'danger' : 'neutral'

  return (
    <div style={cardStyles}>
      <div style={headerStyles}>
        <div style={urlInfoStyles}>
          <div style={nameStyles}>{url.name}</div>
          <div style={urlAddressStyles}>{url.web_address}</div>
          <div style={metaStyles}>
            <div style={statusBadgeStyles}>
              <StatusDot status={url.status} />
              <Badge variant={statusVariant}>{url.status}</Badge>
            </div>
            <div style={timeStyles}>Created {timeAgo(url.created_at)}</div>
          </div>
        </div>
      </div>
      <div style={buttonContainerStyles}>
        {isConfirming ? (
          <>
            <button
              style={buttonStyles}
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Confirm?'}
            </button>
            <button
              style={cancelLinkStyles}
              onClick={() => setIsConfirming(false)}
              disabled={isDeleting}
            >
              cancel
            </button>
          </>
        ) : (
          <button style={buttonStyles} onClick={handleDeleteClick}>
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
