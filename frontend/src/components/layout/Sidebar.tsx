import React from 'react'

export function Sidebar() {
  const sidebarStyles: React.CSSProperties = {
    width: 250,
    backgroundColor: '#1F2937',
    color: 'white',
    padding: 24,
    height: '100vh',
    display: 'flex',
    flexDirection: 'column'
  }

  const titleStyles: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 32
  }

  const navItemStyles: React.CSSProperties = {
    padding: '12px 0',
    fontSize: 14,
    cursor: 'pointer',
    color: '#D1D5DB'
  }

  return (
    <div style={sidebarStyles}>
      <div style={titleStyles}>Uptime Monitor</div>
      <nav>
        <div style={navItemStyles}>Dashboard</div>
        <div style={navItemStyles}>Settings</div>
      </nav>
    </div>
  )
}
