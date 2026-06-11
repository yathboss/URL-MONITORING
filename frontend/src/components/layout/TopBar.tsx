import React from 'react'

export function TopBar() {
  const topBarStyles: React.CSSProperties = {
    backgroundColor: 'white',
    borderBottom: '1px solid #E5E7EB',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }

  const titleStyles: React.CSSProperties = {
    fontSize: 20,
    fontWeight: 600,
    color: '#1F2937'
  }

  const userInfoStyles: React.CSSProperties = {
    fontSize: 14,
    color: '#6B7280'
  }

  return (
    <div style={topBarStyles}>
      <div style={titleStyles}>URL Monitoring Dashboard</div>
      <div style={userInfoStyles}>development</div>
    </div>
  )
}
