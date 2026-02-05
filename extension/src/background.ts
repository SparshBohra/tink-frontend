// SquareFt Extension - Background Service Worker
// Opens side panel and updates badge count

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://oubprrmcbyresbexpbuq.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91YnBycm1jYnlyZXNiZXhwYnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NDQ2OTUsImV4cCI6MjA4NTIyMDY5NX0.fNPd81uplwNJsISZZpyk_od1HukPEAQkOUJvNZ0gRoU'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id })
  }
})

// Update badge with triage ticket count
async function updateBadge(): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      chrome.action.setBadgeText({ text: '' })
      return
    }
    
    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', session.user.id)
      .single()
    
    if (!profile?.organization_id) {
      chrome.action.setBadgeText({ text: '' })
      return
    }
    
    // Count triage tickets
    const { count, error } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id)
      .eq('status', 'triage')
    
    if (error) {
      console.error('Error fetching ticket count:', error)
      return
    }
    
    // Update badge
    if (count && count > 0) {
      chrome.action.setBadgeText({ text: count.toString() })
      chrome.action.setBadgeBackgroundColor({ color: '#dc2626' }) // Red
    } else {
      chrome.action.setBadgeText({ text: '' })
    }
  } catch (err) {
    console.error('Badge update error:', err)
  }
}

// Update badge on install
chrome.runtime.onInstalled.addListener(() => {
  updateBadge()
})

// Update badge periodically (every 5 minutes)
chrome.alarms.create('updateBadge', { periodInMinutes: 5 })

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updateBadge') {
    updateBadge()
  }
})

// Note: onClicked is already handled above to open side panel

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'UPDATE_BADGE') {
    updateBadge().then(() => sendResponse({ success: true }))
    return true
  }
  
  // Sync auth from dashboard content script
  if (message.type === 'SYNC_AUTH_FROM_DASHBOARD') {
    const { accessToken, refreshToken } = message
    if (accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      }).then(() => {
        console.log('Auth synced from dashboard')
        updateBadge()
        sendResponse({ success: true })
      }).catch((err) => {
        console.error('Failed to sync auth:', err)
        sendResponse({ success: false })
      })
      return true
    }
  }
  
  // Dashboard logout - clear extension session too
  if (message.type === 'DASHBOARD_LOGOUT') {
    console.log('Dashboard logout detected - clearing extension session')
    supabase.auth.signOut().then(() => {
      chrome.action.setBadgeText({ text: '' })
      sendResponse({ success: true })
    })
    return true
  }
})

// Initial badge update
updateBadge()
