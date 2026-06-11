import React from 'react'

interface StatusDotProps {
  status: 'UP' | 'DOWN' | 'PENDING'
}

export function StatusDot({ status }: StatusDotProps) {
  const statusColors: Record<string, string> = {
    UP: '#10B981',
    DOWN: '#EF4444',
    PENDING: '#9CA3AF'
  }

  const dotStyles: React.CSSProperties = {
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: statusColors[status],
    marginRight: 4
  }

  return <span style={dotStyles} />
}
