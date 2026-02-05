// Content script - runs on squareft.ai and localhost
// Syncs authentication state between dashboard and extension

const SUPABASE_PROJECT_REF = 'oubprrmcbyresbexpbuq'
const AUTH_STORAGE_KEY = `sb-${SUPABASE_PROJECT_REF}-auth-token`

// Safe message sender - handles cases where extension context is invalidated
function safeSendMessage(message: any) {
  try {
    // Check if chrome.runtime is available and connected
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) {
      return
    }
    chrome.runtime.sendMessage(message).catch(() => {
      // Extension might not be installed or context invalidated
    })
  } catch {
    // Silently ignore - extension context might be invalidated
  }
}

// Check for auth in localStorage and sync to extension
function syncAuthToExtension() {
  try {
    const authData = localStorage.getItem(AUTH_STORAGE_KEY)
    
    if (authData) {
      const parsed = JSON.parse(authData)
      // Supabase stores session as { access_token, refresh_token, ... }
      if (parsed?.access_token && parsed?.refresh_token) {
        safeSendMessage({
          type: 'SYNC_AUTH_FROM_DASHBOARD',
          accessToken: parsed.access_token,
          refreshToken: parsed.refresh_token,
          expiresAt: parsed.expires_at
        })
      }
    }
  } catch {
    // Ignore errors
  }
}

// Check for logout
function checkForLogout() {
  try {
    if (window.location.search.includes('clear=true') || 
        window.location.search.includes('logout=true')) {
      safeSendMessage({ type: 'DASHBOARD_LOGOUT' })
    }
  } catch {
    // Ignore
  }
}

// Run on page load
syncAuthToExtension()
checkForLogout()

// Listen for storage changes (login/logout on dashboard)
window.addEventListener('storage', (e) => {
  if (e.key === AUTH_STORAGE_KEY) {
    if (e.newValue) {
      syncAuthToExtension()
    } else {
      // Token removed - user logged out
      safeSendMessage({ type: 'DASHBOARD_LOGOUT' })
    }
  }
})

// Also sync after a short delay (in case of async login)
setTimeout(syncAuthToExtension, 1000)
