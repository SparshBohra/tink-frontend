// SquareFt Chrome Extension - Background Service Worker
// Handles authentication state and notifications

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://oubprrmcbyresbexpbuq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91YnBycm1jYnlyZXNiZXhwYnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NDQ2OTUsImV4cCI6MjA4NTIyMDY5NX0.fNPd81uplwNJsISZZpyk_od1HukPEAQkOUJvNZ0gRoU';

let supabase: SupabaseClient;

// Initialize Supabase
function initSupabase() {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      storageKey: 'squareft-extension-auth',
      storage: {
        getItem: async (key) => {
          const result = await chrome.storage.local.get(key);
          return result[key] || null;
        },
        setItem: async (key, value) => {
          await chrome.storage.local.set({ [key]: value });
        },
        removeItem: async (key) => {
          await chrome.storage.local.remove(key);
        },
      }
    }
  });
}

// Check for new emergency tickets and show notification
async function checkForEmergencyTickets() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Get organization_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', session.user.id)
      .single();

    if (!profile?.organization_id) return;

    // Get last check time
    const { lastEmergencyCheck } = await chrome.storage.local.get('lastEmergencyCheck');
    const lastCheck = lastEmergencyCheck || new Date(0).toISOString();

    // Check for new emergency tickets
    const { data: emergencyTickets } = await supabase
      .from('tickets')
      .select('id, ticket_number, title')
      .eq('organization_id', profile.organization_id)
      .eq('priority', 'emergency')
      .eq('status', 'triage')
      .gt('created_at', lastCheck)
      .order('created_at', { ascending: false })
      .limit(5);

    if (emergencyTickets && emergencyTickets.length > 0) {
      // Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: '🚨 Emergency Ticket',
        message: `${emergencyTickets.length} new emergency ticket(s) require attention`,
        priority: 2
      });

      // Update badge
      chrome.action.setBadgeText({ text: emergencyTickets.length.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
    }

    // Update last check time
    await chrome.storage.local.set({ lastEmergencyCheck: new Date().toISOString() });

  } catch (error) {
    console.error('Emergency check failed:', error);
  }
}

// Clear badge when popup is opened
chrome.action.onClicked.addListener(() => {
  chrome.action.setBadgeText({ text: '' });
});

// Check for emergencies periodically (every 5 minutes)
chrome.alarms.create('checkEmergencies', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkEmergencies') {
    checkForEmergencyTickets();
  }
});

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  initSupabase();
  console.log('SquareFt Extension installed');
});

// Initialize on startup
chrome.runtime.onStartup.addListener(() => {
  initSupabase();
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CLEAR_BADGE') {
    chrome.action.setBadgeText({ text: '' });
    sendResponse({ success: true });
  }
  return true;
});

// Initialize
initSupabase();
