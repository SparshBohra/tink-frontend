// Content script - runs on squareft.ai and localhost
// Syncs authentication state between dashboard and extension

const SUPABASE_PROJECT_REF = 'oubprrmcbyresbexpbuq'
const AUTH_STORAGE_KEY = `sb-${SUPABASE_PROJECT_REF}-auth-token`

// Check for auth in localStorage and sync to extension
function syncAuthToExtension() {
  try {
    const authData = localStorage.getItem(AUTH_STORAGE_KEY)
    
    if (authData) {
      const parsed = JSON.parse(authData)
      // Supabase stores session as { access_token, refresh_token, ... }
      if (parsed?.access_token && parsed?.refresh_token) {
        chrome.runtime.sendMessage({
          type: 'SYNC_AUTH_FROM_DASHBOARD',
          accessToken: parsed.access_token,
          refreshToken: parsed.refresh_token,
          expiresAt: parsed.expires_at
        }).catch(() => {
          // Extension might not be installed
        })
      }
    }
  } catch (err) {
    // Ignore errors
  }
}

// Check for logout
function checkForLogout() {
  try {
    if (window.location.search.includes('clear=true') || 
        window.location.search.includes('logout=true')) {
      chrome.runtime.sendMessage({ type: 'DASHBOARD_LOGOUT' }).catch(() => {})
    }
  } catch (err) {
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
      chrome.runtime.sendMessage({ type: 'DASHBOARD_LOGOUT' }).catch(() => {})
    }
  }
})

// Also sync after a short delay (in case of async login)
setTimeout(syncAuthToExtension, 1000)
