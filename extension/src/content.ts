// Content script - runs on squareft.ai and localhost to sync auth with extension

// Check for Supabase auth in localStorage and send to extension
function checkAndSyncAuth() {
  try {
    // Look for Supabase auth token in localStorage
    const keys = Object.keys(localStorage)
    for (const key of keys) {
      if (key.includes('supabase') && key.includes('auth')) {
        const value = localStorage.getItem(key)
        if (value) {
          try {
            const parsed = JSON.parse(value)
            if (parsed.access_token) {
              // Send to extension background
              chrome.runtime.sendMessage({
                type: 'SYNC_AUTH',
                token: parsed.access_token,
                refreshToken: parsed.refresh_token,
                expiresAt: parsed.expires_at
              })
              return
            }
          } catch {
            // Not JSON
          }
        }
      }
    }
    
    // No auth found - tell extension user is logged out
    chrome.runtime.sendMessage({ type: 'AUTH_CLEARED' })
  } catch (err) {
    console.error('Auth sync error:', err)
  }
}

// Run on page load
checkAndSyncAuth()

// Also listen for storage changes (login/logout)
window.addEventListener('storage', (e) => {
  if (e.key?.includes('supabase') && e.key?.includes('auth')) {
    checkAndSyncAuth()
  }
})

// Check periodically (in case of auth refresh)
setInterval(checkAndSyncAuth, 30000)
