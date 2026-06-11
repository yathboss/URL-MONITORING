import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'danger' | 'neutral'
}

export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    success: {
      backgroundColor: '#D1FAE5',
      color: '#047857',
      border: '1px solid #A7F3D0'
    },
    danger: {
      backgroundColor: '#FEE2E2',
      color: '#DC2626',
      border: '1px solid #FECACA'
    },
    neutral: {
      backgroundColor: '#F3F4F6',
      color: '#6B7280',
      border: '1px solid #E5E7EB'
    }
  }

  const badgeStyles: React.CSSProperties = {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
    ...variantStyles[variant]
  }

  return <span style={badgeStyles}>{children}</span>
}
