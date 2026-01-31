// SquareFt Chrome Extension - Popup Script
// Displays recent triage tickets for property managers

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://oubprrmcbyresbexpbuq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91YnBycm1jYnlyZXNiZXhwYnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NDQ2OTUsImV4cCI6MjA4NTIyMDY5NX0.fNPd81uplwNJsISZZpyk_od1HukPEAQkOUJvNZ0gRoU';
const DASHBOARD_URL = 'https://squareft.ai/dashboard/tickets';

// Types
interface Ticket {
  id: string;
  ticket_number: number;
  title: string | null;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  category: string | null;
  status: string;
  created_at: string;
}

interface Profile {
  id: string;
  organization_id: string | null;
  full_name: string | null;
}

// State
let supabase: SupabaseClient;
let organizationId: string | null = null;
let tickets: Ticket[] = [];
let isLoading = true;
let error: string | null = null;

// Initialize Supabase client
function initSupabase() {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      storageKey: 'squareft-extension-auth',
      storage: {
        getItem: (key) => chrome.storage.local.get(key).then(result => result[key] || null),
        setItem: (key, value) => chrome.storage.local.set({ [key]: value }),
        removeItem: (key) => chrome.storage.local.remove(key),
      }
    }
  });
}

// Check authentication
async function checkAuth(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return false;
    }

    // Get user profile to get organization_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', session.user.id)
      .single();

    if (profile?.organization_id) {
      organizationId = profile.organization_id;
      return true;
    }

    return false;
  } catch (err) {
    console.error('Auth check failed:', err);
    return false;
  }
}

// Fetch tickets
async function fetchTickets(): Promise<void> {
  if (!organizationId) {
    error = 'No organization found';
    return;
  }

  try {
    const { data, error: fetchError } = await supabase
      .from('tickets')
      .select('id, ticket_number, title, description, priority, category, status, created_at')
      .eq('organization_id', organizationId)
      .eq('status', 'triage')
      .order('created_at', { ascending: false })
      .limit(5);

    if (fetchError) {
      error = fetchError.message;
      return;
    }

    tickets = data || [];
    error = null;
  } catch (err) {
    console.error('Fetch tickets failed:', err);
    error = 'Failed to load tickets';
  }
}

// Copy to clipboard
async function copyToClipboard(text: string, buttonElement: HTMLElement): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    buttonElement.classList.add('copied');
    buttonElement.textContent = '✓ Copied';
    
    setTimeout(() => {
      buttonElement.classList.remove('copied');
      buttonElement.innerHTML = '<span>📋</span> Copy';
    }, 2000);
  } catch (err) {
    console.error('Copy failed:', err);
  }
}

// Format time ago
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

// Get category icon
function getCategoryIcon(category: string | null): string {
  if (!category) return '📋';
  
  const icons: Record<string, string> = {
    hvac: '❄️',
    heating: '❄️',
    cooling: '🌡️',
    plumbing: '🔧',
    electrical: '⚡',
    appliance: '🔌',
    access_control: '🔑',
    pest: '🐛',
    general: '📋'
  };
  
  return icons[category.toLowerCase()] || '📋';
}

// Get priority color class
function getPriorityClass(priority: string): string {
  return priority.toLowerCase();
}

// Render functions
function renderHeader(): string {
  return `
    <div class="header">
      <div class="logo">
        <div class="logo-icon">✨</div>
        <span class="logo-text">SquareFt</span>
      </div>
      <div class="header-actions">
        <button class="refresh-btn" id="refreshBtn" title="Refresh">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 11-3-6.7"/>
            <path d="M21 3v6h-6"/>
          </svg>
        </button>
      </div>
    </div>
  `;
}

function renderAuthRequired(): string {
  return `
    ${renderHeader()}
    <div class="auth-required">
      <h2>Sign in Required</h2>
      <p>Please sign in to view your maintenance tickets</p>
      <a href="${DASHBOARD_URL}" target="_blank" class="login-btn">
        Open Dashboard
      </a>
    </div>
  `;
}

function renderStats(): string {
  const triageCount = tickets.length;
  const emergencyCount = tickets.filter(t => t.priority === 'emergency').length;

  return `
    <div class="stats-bar">
      <div class="stat">
        <div class="stat-icon triage">📥</div>
        <div>
          <div class="stat-value">${triageCount}</div>
          <div class="stat-label">Triage</div>
        </div>
      </div>
      ${emergencyCount > 0 ? `
        <div class="stat">
          <div class="stat-icon emergency">⚠️</div>
          <div>
            <div class="stat-value">${emergencyCount}</div>
            <div class="stat-label">Emergency</div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderTicketCard(ticket: Ticket): string {
  const isEmergency = ticket.priority === 'emergency';
  const description = ticket.description || ticket.title || 'No description';
  
  return `
    <div class="ticket-card ${isEmergency ? 'emergency' : ''}" data-id="${ticket.id}">
      <div class="ticket-header">
        <span class="ticket-number">#${ticket.ticket_number}</span>
        <span class="ticket-priority ${getPriorityClass(ticket.priority)}">
          ${isEmergency ? '⚠️ ' : ''}${ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
        </span>
      </div>
      <div class="ticket-title">${ticket.title || 'Untitled'}</div>
      <div class="ticket-category">
        ${getCategoryIcon(ticket.category)} ${ticket.category || 'General'} • ${formatTimeAgo(ticket.created_at)}
      </div>
      <div class="ticket-actions">
        <button class="copy-btn" data-copy="${description.replace(/"/g, '&quot;')}">
          <span>📋</span> Copy
        </button>
      </div>
    </div>
  `;
}

function renderTicketList(): string {
  if (tickets.length === 0) {
    return `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 15C21 15.5 20.8 16 20.4 16.4C20 16.8 19.5 17 19 17H7L3 21V5C3 4.5 3.2 4 3.6 3.6C4 3.2 4.5 3 5 3H19C19.5 3 20 3.2 20.4 3.6C20.8 4 21 4.5 21 5V15Z"/>
        </svg>
        <h3>All caught up!</h3>
        <p>No tickets in triage right now</p>
      </div>
    `;
  }

  return `
    <div class="tickets-section">
      <div class="section-title">Recent Triage Tickets</div>
      <div class="ticket-list">
        ${tickets.map(renderTicketCard).join('')}
      </div>
    </div>
  `;
}

function renderFooter(): string {
  return `
    <div class="footer">
      <a href="${DASHBOARD_URL}" target="_blank" class="open-dashboard-btn">
        Open Full Dashboard →
      </a>
    </div>
  `;
}

function renderError(): string {
  return `
    ${renderHeader()}
    <div class="error-state">
      <p>⚠️ ${error}</p>
      <button class="retry-btn" id="retryBtn">Try Again</button>
    </div>
  `;
}

function renderLoading(): string {
  return `
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading tickets...</p>
    </div>
  `;
}

function render(): void {
  const root = document.getElementById('root');
  if (!root) return;

  if (isLoading) {
    root.innerHTML = renderLoading();
    return;
  }

  if (!organizationId) {
    root.innerHTML = renderAuthRequired();
    return;
  }

  if (error) {
    root.innerHTML = renderError();
    attachEventListeners();
    return;
  }

  root.innerHTML = `
    ${renderHeader()}
    ${renderStats()}
    ${renderTicketList()}
    ${renderFooter()}
  `;

  attachEventListeners();
}

function attachEventListeners(): void {
  // Refresh button
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.classList.add('spinning');
      await fetchTickets();
      render();
    });
  }

  // Retry button
  const retryBtn = document.getElementById('retryBtn');
  if (retryBtn) {
    retryBtn.addEventListener('click', async () => {
      error = null;
      isLoading = true;
      render();
      await init();
    });
  }

  // Copy buttons
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const button = e.currentTarget as HTMLElement;
      const text = button.dataset.copy || '';
      copyToClipboard(text, button);
    });
  });

  // Ticket cards (open in dashboard)
  document.querySelectorAll('.ticket-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't navigate if clicking on copy button
      if ((e.target as HTMLElement).closest('.copy-btn')) return;
      
      const ticketId = (card as HTMLElement).dataset.id;
      if (ticketId) {
        window.open(`${DASHBOARD_URL}/${ticketId}`, '_blank');
      }
    });
  });
}

// Initialize
async function init(): Promise<void> {
  initSupabase();
  
  const isAuthenticated = await checkAuth();
  
  if (isAuthenticated) {
    await fetchTickets();
  }
  
  isLoading = false;
  render();
}

// Run on load
document.addEventListener('DOMContentLoaded', init);
