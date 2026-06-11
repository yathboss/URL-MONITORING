import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface ToastProps {
  message: string
  onDismiss: () => void
}

export function Toast({ message, onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onDismiss()
    }, 5000)

    return () => clearTimeout(timer)
  }, [onDismiss])

  if (!isVisible) return null

  const toastStyles: React.CSSProperties = {
    position: 'fixed',
    bottom: 24,
    right: 24,
    backgroundColor: 'white',
    border: '1px solid #E24B4A',
    borderRadius: 12,
    padding: 16,
    maxWidth: 360,
    fontSize: 14,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    animation: 'fadeIn 200ms ease-in-out',
    zIndex: 9999
  }

  const closeButtonStyles: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 18,
    color: '#999',
    padding: 0,
    width: 20,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  }

  return createPortal(
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      <div style={toastStyles}>
        <span>{message}</span>
        <button style={closeButtonStyles} onClick={onDismiss} aria-label="Close">
          ×
        </button>
      </div>
    </>,
    document.body
  )
}
