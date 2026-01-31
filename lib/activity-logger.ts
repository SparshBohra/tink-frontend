import { supabase } from './supabase'

// Action categories
export type ActionCategory = 
  | 'auth'
  | 'navigation'
  | 'ticket'
  | 'settings'
  | 'search'
  | 'filter'

// Specific action types
export type ActionType =
  // Auth
  | 'auth.login'
  | 'auth.login_failed'
  | 'auth.logout'
  | 'auth.signup'
  | 'auth.signup_confirmed'
  | 'auth.magic_link_sent'
  | 'auth.password_reset_requested'
  | 'auth.password_reset_completed'
  // Navigation
  | 'navigation.page_view'
  | 'navigation.modal_open'
  | 'navigation.modal_close'
  | 'navigation.tab_switch'
  // Ticket actions
  | 'ticket.view'
  | 'ticket.list_view'
  | 'ticket.update_priority'
  | 'ticket.update_status'
  | 'ticket.add_note'
  | 'ticket.edit_note'
  | 'ticket.delete_note'
  | 'ticket.copy_field'
  // Settings
  | 'settings.open'
  | 'settings.update_profile'
  | 'settings.update_organization'
  | 'settings.change_password'
  // Search & Filter
  | 'search.query'
  | 'filter.priority'
  | 'filter.status'
  | 'filter.clear'
  | 'sort.change'
  | 'group.change'
  | 'group.toggle'
  | 'refresh.data'

interface LogData {
  [key: string]: any
}

interface ActivityLogEntry {
  user_id: string | null
  organization_id: string | null
  action_type: ActionType
  action_category: ActionCategory
  action_description: string
  action_data: LogData
  page_url: string
  user_agent: string
}

class ActivityLogger {
  private userId: string | null = null
  private organizationId: string | null = null
  private queue: ActivityLogEntry[] = []
  private isProcessing = false
  private batchTimeout: NodeJS.Timeout | null = null
  private readonly BATCH_DELAY = 1000 // 1 second delay for batching
  private readonly MAX_BATCH_SIZE = 10

  // Set user context (call after login)
  setUser(userId: string | null, organizationId: string | null) {
    this.userId = userId
    this.organizationId = organizationId
  }

  // Clear user context (call on logout)
  clearUser() {
    this.userId = null
    this.organizationId = null
  }

  // Get category from action type
  private getCategoryFromAction(actionType: ActionType): ActionCategory {
    return actionType.split('.')[0] as ActionCategory
  }

  // Generate human-readable description
  private generateDescription(actionType: ActionType, data: LogData): string {
    switch (actionType) {
      // Auth
      case 'auth.login':
        return `User logged in${data.method ? ` via ${data.method}` : ''}`
      case 'auth.login_failed':
        return `Login attempt failed: ${data.reason || 'Unknown reason'}`
      case 'auth.logout':
        return 'User logged out'
      case 'auth.signup':
        return 'User signed up'
      case 'auth.signup_confirmed':
        return 'Email confirmed, account activated'
      case 'auth.magic_link_sent':
        return `Magic link sent to ${data.email || 'email'}`
      case 'auth.password_reset_requested':
        return `Password reset requested for ${data.email || 'email'}`
      case 'auth.password_reset_completed':
        return 'Password reset completed'
      
      // Navigation
      case 'navigation.page_view':
        return `Viewed page: ${data.page || data.url || 'unknown'}`
      case 'navigation.modal_open':
        return `Opened modal: ${data.modal || 'unknown'}`
      case 'navigation.modal_close':
        return `Closed modal: ${data.modal || 'unknown'}`
      case 'navigation.tab_switch':
        return `Switched to tab: ${data.tab || 'unknown'}`
      
      // Tickets
      case 'ticket.view':
        return `Viewed ticket #${data.ticket_number || data.ticket_id || 'unknown'}`
      case 'ticket.list_view':
        return `Viewed ticket list (${data.count || 0} tickets)`
      case 'ticket.update_priority':
        return `Changed priority from ${data.old_value || 'unknown'} to ${data.new_value || 'unknown'} on ticket #${data.ticket_number || ''}`
      case 'ticket.update_status':
        return `Changed status from ${data.old_value || 'unknown'} to ${data.new_value || 'unknown'} on ticket #${data.ticket_number || ''}`
      case 'ticket.add_note':
        return `Added note to ticket #${data.ticket_number || data.ticket_id || ''}`
      case 'ticket.edit_note':
        return `Edited note on ticket #${data.ticket_number || data.ticket_id || ''}`
      case 'ticket.delete_note':
        return `Deleted note from ticket #${data.ticket_number || data.ticket_id || ''}`
      case 'ticket.copy_field':
        return `Copied ${data.field || 'field'} from ticket #${data.ticket_number || ''}`
      
      // Settings
      case 'settings.open':
        return 'Opened settings'
      case 'settings.update_profile':
        return `Updated profile: ${data.fields?.join(', ') || 'details'}`
      case 'settings.update_organization':
        return `Updated organization: ${data.fields?.join(', ') || 'details'}`
      case 'settings.change_password':
        return 'Changed password'
      
      // Search & Filter
      case 'search.query':
        return `Searched for: "${data.query || ''}"`
      case 'filter.priority':
        return `Filtered by priority: ${data.value || 'all'}`
      case 'filter.status':
        return `Filtered by status: ${data.value || 'all'}`
      case 'filter.clear':
        return 'Cleared all filters'
      case 'sort.change':
        return `Sorted by ${data.field || 'unknown'} (${data.direction || 'asc'})`
      case 'group.change':
        return `Grouped by ${data.field || 'none'}`
      case 'group.toggle':
        return `${data.expanded ? 'Expanded' : 'Collapsed'} group: ${data.group || 'unknown'}`
      case 'refresh.data':
        return 'Refreshed data'
      
      default:
        return actionType
    }
  }

  // Main logging method
  async log(actionType: ActionType, data: LogData = {}) {
    // Don't log if we're on server side
    if (typeof window === 'undefined') return

    const entry: ActivityLogEntry = {
      user_id: this.userId,
      organization_id: this.organizationId,
      action_type: actionType,
      action_category: this.getCategoryFromAction(actionType),
      action_description: this.generateDescription(actionType, data),
      action_data: {
        ...data,
        timestamp: new Date().toISOString()
      },
      page_url: window.location.href,
      user_agent: navigator.userAgent
    }

    this.queue.push(entry)
    this.scheduleBatch()
  }

  // Schedule batch processing
  private scheduleBatch() {
    // If already scheduled, don't reschedule
    if (this.batchTimeout) return

    // If queue is at max, process immediately
    if (this.queue.length >= this.MAX_BATCH_SIZE) {
      this.processBatch()
      return
    }

    // Otherwise schedule for later
    this.batchTimeout = setTimeout(() => {
      this.processBatch()
    }, this.BATCH_DELAY)
  }

  // Process queued logs
  private async processBatch() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }

    if (this.queue.length === 0 || this.isProcessing) return

    this.isProcessing = true
    const batch = this.queue.splice(0, this.MAX_BATCH_SIZE)

    try {
      const { error } = await supabase
        .from('activity_logs')
        .insert(batch)

      if (error) {
        console.error('[ActivityLogger] Failed to save logs:', error)
        // Re-queue failed entries (at the front)
        this.queue.unshift(...batch)
      }
    } catch (err) {
      console.error('[ActivityLogger] Exception saving logs:', err)
      // Re-queue failed entries
      this.queue.unshift(...batch)
    } finally {
      this.isProcessing = false
      
      // If there are more items, schedule another batch
      if (this.queue.length > 0) {
        this.scheduleBatch()
      }
    }
  }

  // Force flush all queued logs (call on page unload)
  async flush() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }

    if (this.queue.length === 0) return

    // Use sendBeacon for reliability on page unload
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      // For now, just process normally since Supabase doesn't support beacon
      await this.processBatch()
    } else {
      await this.processBatch()
    }
  }

  // Convenience methods for common actions
  
  // Auth
  logLogin(method: 'password' | 'magic_link' = 'password') {
    return this.log('auth.login', { method })
  }

  logLoginFailed(reason: string) {
    return this.log('auth.login_failed', { reason })
  }

  logLogout() {
    return this.log('auth.logout', {})
  }

  logSignup(email: string) {
    return this.log('auth.signup', { email })
  }

  logSignupConfirmed() {
    return this.log('auth.signup_confirmed', {})
  }

  logMagicLinkSent(email: string) {
    return this.log('auth.magic_link_sent', { email })
  }

  logPasswordResetRequested(email: string) {
    return this.log('auth.password_reset_requested', { email })
  }

  logPasswordResetCompleted() {
    return this.log('auth.password_reset_completed', {})
  }

  // Navigation
  logPageView(page: string, additionalData: LogData = {}) {
    return this.log('navigation.page_view', { page, ...additionalData })
  }

  logModalOpen(modal: string, additionalData: LogData = {}) {
    return this.log('navigation.modal_open', { modal, ...additionalData })
  }

  logModalClose(modal: string) {
    return this.log('navigation.modal_close', { modal })
  }

  logTabSwitch(tab: string) {
    return this.log('navigation.tab_switch', { tab })
  }

  // Tickets
  logTicketView(ticketId: string, ticketNumber: number) {
    return this.log('ticket.view', { ticket_id: ticketId, ticket_number: ticketNumber })
  }

  logTicketListView(count: number, filters: LogData = {}) {
    return this.log('ticket.list_view', { count, filters })
  }

  logPriorityChange(ticketId: string, ticketNumber: number, oldValue: string, newValue: string) {
    return this.log('ticket.update_priority', { 
      ticket_id: ticketId, 
      ticket_number: ticketNumber,
      old_value: oldValue, 
      new_value: newValue 
    })
  }

  logStatusChange(ticketId: string, ticketNumber: number, oldValue: string, newValue: string) {
    return this.log('ticket.update_status', { 
      ticket_id: ticketId, 
      ticket_number: ticketNumber,
      old_value: oldValue, 
      new_value: newValue 
    })
  }

  logNoteAdd(ticketId: string, ticketNumber: number) {
    return this.log('ticket.add_note', { ticket_id: ticketId, ticket_number: ticketNumber })
  }

  logNoteEdit(ticketId: string, ticketNumber: number) {
    return this.log('ticket.edit_note', { ticket_id: ticketId, ticket_number: ticketNumber })
  }

  logNoteDelete(ticketId: string, ticketNumber: number) {
    return this.log('ticket.delete_note', { ticket_id: ticketId, ticket_number: ticketNumber })
  }

  logCopyField(field: string, ticketNumber?: number) {
    return this.log('ticket.copy_field', { field, ticket_number: ticketNumber })
  }

  // Settings
  logSettingsOpen() {
    return this.log('settings.open', {})
  }

  logProfileUpdate(fields: string[]) {
    return this.log('settings.update_profile', { fields })
  }

  logOrganizationUpdate(fields: string[]) {
    return this.log('settings.update_organization', { fields })
  }

  logPasswordChange() {
    return this.log('settings.change_password', {})
  }

  // Search & Filter
  logSearch(query: string) {
    return this.log('search.query', { query })
  }

  logPriorityFilter(value: string) {
    return this.log('filter.priority', { value })
  }

  logStatusFilter(value: string) {
    return this.log('filter.status', { value })
  }

  logFilterClear() {
    return this.log('filter.clear', {})
  }

  logSortChange(field: string, direction: 'asc' | 'desc') {
    return this.log('sort.change', { field, direction })
  }

  logGroupChange(field: string | null) {
    return this.log('group.change', { field })
  }

  logGroupToggle(group: string, expanded: boolean) {
    return this.log('group.toggle', { group, expanded })
  }

  logRefresh() {
    return this.log('refresh.data', {})
  }
}

// Singleton instance
export const activityLogger = new ActivityLogger()

// Hook for React components to use the logger with user context
export function useActivityLogger() {
  return activityLogger
}
