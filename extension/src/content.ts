// Content script: Squareft dashboard auth sync + bridge for Yardi autofill UI + fill handler on Yardi/mock pages.

import { applyYardiAutofillToDocument, isYardiFillTargetPage } from './lib/yardi-autofill'

const SUPABASE_PROJECT_REF = 'oubprrmcbyresbexpbuq'
const AUTH_STORAGE_KEY = `sb-${SUPABASE_PROJECT_REF}-auth-token`

function isLogoutPage(): boolean {
  const path = window.location.pathname
  const search = window.location.search
  return path.includes('/auth/logout') || search.includes('clear=true') || search.includes('logout=true')
}

function isSquareftHost(): boolean {
  const h = window.location.hostname
  return (
    h === 'squareft.ai' ||
    h === 'app.squareft.ai' ||
    h === 'www.squareft.ai' ||
    h === 'localhost' ||
    h === '127.0.0.1'
  )
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

function injectYardiBridge(): void {
  document.addEventListener('sqft:yardi-status-request', () => {
    try {
      if (typeof chrome === 'undefined' || !chrome.runtime?.id) {
        document.dispatchEvent(
          new CustomEvent('sqft:yardi-status', {
            bubbles: true,
            detail: { extension: false, yardiReady: false },
          })
        )
        return
      }
      chrome.runtime.sendMessage({ type: 'SQFT_YARDI_STATUS_QUERY' }, (response) => {
        if (chrome.runtime.lastError) {
          document.dispatchEvent(
            new CustomEvent('sqft:yardi-status', {
              bubbles: true,
              detail: { extension: false, yardiReady: false },
            })
          )
          return
        }
        document.dispatchEvent(
          new CustomEvent('sqft:yardi-status', {
            bubbles: true,
            detail: {
              extension: true,
              yardiReady: !!response?.yardiReady,
            },
          })
        )
      })
    } catch {
      document.dispatchEvent(
        new CustomEvent('sqft:yardi-status', {
          bubbles: true,
          detail: { extension: false, yardiReady: false },
        })
      )
    }
  })

  document.addEventListener('sqft:yardi-autofill-request', (ev) => {
    const detail = (ev as CustomEvent).detail
    if (!detail?.payload) return
    try {
      if (typeof chrome === 'undefined' || !chrome.runtime?.id) {
        document.dispatchEvent(
          new CustomEvent('sqft:yardi-autofill-result', {
            bubbles: true,
            detail: { ok: false, error: 'no_extension' },
          })
        )
        return
      }
      chrome.runtime.sendMessage(
        { type: 'SQFT_EXECUTE_YARDI_AUTOFILL', payload: detail.payload },
        (response) => {
          if (chrome.runtime.lastError) {
            document.dispatchEvent(
              new CustomEvent('sqft:yardi-autofill-result', {
                bubbles: true,
                detail: { ok: false, error: chrome.runtime.lastError.message },
              })
            )
            return
          }
          document.dispatchEvent(
            new CustomEvent('sqft:yardi-autofill-result', {
              bubbles: true,
              detail: response || { ok: false, error: 'empty_response' },
            })
          )
        }
      )
    } catch (e) {
      document.dispatchEvent(
        new CustomEvent('sqft:yardi-autofill-result', {
          bubbles: true,
          detail: { ok: false, error: String(e) },
        })
      )
    }
  })
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

if (isSquareftHost() && !isLogoutPage()) {
  injectYardiBridge()
}

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
