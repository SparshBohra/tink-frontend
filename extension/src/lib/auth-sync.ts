// Auth sync utilities - share session between extension and dashboard
// Uses chrome.cookies API to set auth cookies on dashboard domain

import { supabase, DASHBOARD_URLS } from './supabase'

const SUPABASE_PROJECT_REF = 'oubprrmcbyresbexpbuq'

// Cookie names that Supabase uses
const ACCESS_TOKEN_COOKIE = `sb-${SUPABASE_PROJECT_REF}-auth-token`

interface SessionTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

// Set auth cookies on dashboard domain after extension login
export async function syncSessionToDashboard(session: SessionTokens): Promise<void> {
  const domains = [
    'squareft.ai',
    'app.squareft.ai', 
    '.squareft.ai'
  ]
  
  // Create the cookie value (Supabase stores as base64 JSON array)
  const cookieValue = btoa(JSON.stringify([
    session.accessToken,
    session.refreshToken,
    null,
    null,
    null
  ]))
  
  // Set cookie on each domain
  for (const domain of domains) {
    try {
      await chrome.cookies.set({
        url: `https://${domain.replace(/^\./, '')}`,
        name: ACCESS_TOKEN_COOKIE,
        value: cookieValue,
        path: '/',
        secure: true,
        sameSite: 'lax',
        expirationDate: session.expiresAt
      })
      console.log(`Auth cookie set for ${domain}`)
    } catch (err) {
      console.log(`Failed to set cookie for ${domain}:`, err)
    }
  }
  
  // Also try localhost for development
  try {
    await chrome.cookies.set({
      url: 'http://localhost:3000',
      name: ACCESS_TOKEN_COOKIE,
      value: cookieValue,
      path: '/',
      secure: false,
      sameSite: 'lax',
      expirationDate: session.expiresAt
    })
    console.log('Auth cookie set for localhost')
  } catch (err) {
    console.log('Failed to set cookie for localhost:', err)
  }
}

// Clear auth cookies from dashboard domain on extension logout
export async function clearDashboardSession(): Promise<void> {
  const urls = [
    'https://squareft.ai',
    'https://app.squareft.ai',
    'http://localhost:3000'
  ]
  
  for (const url of urls) {
    try {
      await chrome.cookies.remove({
        url,
        name: ACCESS_TOKEN_COOKIE
      })
    } catch (err) {
      // Ignore errors
    }
  }
}

// Read auth from dashboard cookies (for initial sync)
export async function getSessionFromDashboard(): Promise<SessionTokens | null> {
  const urls = [
    'https://app.squareft.ai',
    'https://squareft.ai',
    'http://localhost:3000'
  ]
  
  for (const url of urls) {
    try {
      const cookie = await chrome.cookies.get({
        url,
        name: ACCESS_TOKEN_COOKIE
      })
      
      if (cookie?.value) {
        // Decode the cookie value
        const decoded = JSON.parse(atob(cookie.value))
        if (Array.isArray(decoded) && decoded[0] && decoded[1]) {
          return {
            accessToken: decoded[0],
            refreshToken: decoded[1],
            expiresAt: cookie.expirationDate || (Date.now() / 1000 + 3600)
          }
        }
      }
    } catch (err) {
      // Try next URL
    }
  }
  
  return null
}

// Attempt to restore session from dashboard cookies
export async function restoreSessionFromDashboard(): Promise<boolean> {
  try {
    const tokens = await getSessionFromDashboard()
    
    if (tokens) {
      // Set the session in extension's Supabase client
      const { error } = await supabase.auth.setSession({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken
      })
      
      if (!error) {
        console.log('Session restored from dashboard cookies')
        return true
      }
    }
  } catch (err) {
    console.error('Failed to restore session from dashboard:', err)
  }
  
  return false
}
