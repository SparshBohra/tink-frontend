import { useEffect } from 'react'

// Settings is now a modal accessible from the TopBar dropdown
// This page redirects to the dashboard

export default function SettingsRedirect() {
  useEffect(() => {
    window.location.href = '/dashboard/tickets'
  }, [])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#f8fafc'
    }}>
      <div style={{ textAlign: 'center', color: '#64748b' }}>
        <p>Redirecting...</p>
      </div>
    </div>
  )
}
