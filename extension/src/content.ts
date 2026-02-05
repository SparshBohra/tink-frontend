// Content script - runs on squareft.ai and localhost
// Syncs authentication state between dashboard and extension

const SUPABASE_PROJECT_REF = 'oubprrmcbyresbexpbuq'
const AUTH_STORAGE_KEY = `sb-${SUPABASE_PROJECT_REF}-auth-token`

// Check if we're on a logout page
function isLogoutPage(): boolean {
  const path = window.location.pathname
  const search = window.location.search
  return path.includes('/auth/logout') || 
         search.includes('clear=true') || 
         search.includes('logout=true')
}

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
  // Don't sync auth on logout pages
  if (isLogoutPage()) {
    console.log('[SquareFt] On logout page, skipping auth sync')
    return
  }
  
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

// Check for logout and notify extension
function checkForLogout() {
  if (isLogoutPage()) {
    console.log('[SquareFt] Logout page detected, notifying extension')
    safeSendMessage({ type: 'DASHBOARD_LOGOUT' })
  }
}

// Run on page load
checkForLogout() // Check logout FIRST
if (!isLogoutPage()) {
  syncAuthToExtension()
}

// Listen for storage changes (login/logout on dashboard)
window.addEventListener('storage', (e) => {
  if (e.key === AUTH_STORAGE_KEY) {
    if (e.newValue && !isLogoutPage()) {
      syncAuthToExtension()
    } else if (!e.newValue) {
      // Token removed - user logged out
      safeSendMessage({ type: 'DASHBOARD_LOGOUT' })
    }
  }
})

// Also sync after a short delay (in case of async login) - but not on logout pages
if (!isLogoutPage()) {
  setTimeout(syncAuthToExtension, 1000)
}
