// Content script: Squareft dashboard auth sync + work-order tab autofill handler.

import { applyYardiAutofillToDocument, isYardiFillTargetPage } from './lib/yardi-autofill'

const SUPABASE_PROJECT_REF = 'oubprrmcbyresbexpbuq'
const AUTH_STORAGE_KEY = `sb-${SUPABASE_PROJECT_REF}-auth-token`

function isLogoutPage(): boolean {
  const path = window.location.pathname
  const search = window.location.search
  return path.includes('/auth/logout') || search.includes('clear=true') || search.includes('logout=true')
}

function safeSendMessage(message: object) {
  try {
    if (typeof chrome === 'undefined' || !chrome.runtime?.id) return
    chrome.runtime.sendMessage(message).catch(() => {})
  } catch {
    // ignore
  }
}

function syncAuthToExtension() {
  if (isLogoutPage()) {
    console.log('[SquareFt] On logout page, skipping auth sync')
    return
  }
  try {
    const authData = localStorage.getItem(AUTH_STORAGE_KEY)
    if (authData) {
      const parsed = JSON.parse(authData)
      if (parsed?.access_token && parsed?.refresh_token) {
        safeSendMessage({
          type: 'SYNC_AUTH_FROM_DASHBOARD',
          accessToken: parsed.access_token,
          refreshToken: parsed.refresh_token,
          expiresAt: parsed.expires_at,
        })
      }
    }
  } catch {
    // ignore
  }
}

function checkForLogout() {
  if (isLogoutPage()) {
    console.log('[SquareFt] Logout page detected, notifying extension')
    safeSendMessage({ type: 'DASHBOARD_LOGOUT' })
  }
}

checkForLogout()
if (!isLogoutPage()) {
  syncAuthToExtension()
}

window.addEventListener('storage', (e) => {
  if (e.key === AUTH_STORAGE_KEY) {
    if (e.newValue && !isLogoutPage()) {
      syncAuthToExtension()
    } else if (!e.newValue) {
      safeSendMessage({ type: 'DASHBOARD_LOGOUT' })
    }
  }
})

if (!isLogoutPage()) {
  setTimeout(syncAuthToExtension, 1000)
}

declare global {
  interface Window {
    __SQFT_YARDI_MESSAGE_LISTENER__?: boolean
  }
}

/** Programmatic inject can run this file twice; avoid duplicate listeners / double fill. */
if (!window.__SQFT_YARDI_MESSAGE_LISTENER__) {
  window.__SQFT_YARDI_MESSAGE_LISTENER__ = true
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'SQFT_APPLY_AUTOFILL_IN_TAB') {
      ;(async () => {
        try {
          if (!isYardiFillTargetPage(location.href, document)) {
            sendResponse({ ok: false, error: 'not_fill_target' })
            return
          }
          applyYardiAutofillToDocument(document, message.payload)
          sendResponse({ ok: true })
        } catch (e) {
          sendResponse({ ok: false, error: String(e) })
        }
      })()
      return true
    }
    return false
  })
}
