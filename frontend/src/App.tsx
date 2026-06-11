import React from 'react'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import { Dashboard } from './pages/Dashboard'

function App() {
  const appStyles: React.CSSProperties = {
    display: 'flex',
    height: '100vh'
  }

  const mainStyles: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#F9FAFB'
  }

  return (
    <div style={appStyles}>
      <Sidebar />
      <div style={mainStyles}>
        <TopBar />
        <Dashboard />
      </div>
    </div>
  )
}

export default App
