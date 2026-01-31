import { supabase } from './supabase'
import { TicketWithRelations, TicketStatus, TicketPriority } from '../types'

export interface TicketFilters {
  status?: TicketStatus | 'all'
  priority?: TicketPriority | 'all'
  search?: string
}

export interface TicketSortOptions {
  field: 'created_at' | 'priority' | 'status' | 'ticket_number'
  direction: 'asc' | 'desc'
}

// Priority order for sorting
const PRIORITY_ORDER: Record<TicketPriority, number> = {
  emergency: 0,
  high: 1,
  medium: 2,
  low: 3
}

// Fetch tickets for organization
export const fetchTickets = async (
  organizationId: string,
  filters?: TicketFilters,
  sort?: TicketSortOptions
): Promise<TicketWithRelations[]> => {
  try {
    let query = supabase
      .from('tickets')
      .select(`
        *,
        property:properties(*),
        unit:units(*),
        inbound_messages(*)
      `)
      .eq('organization_id', organizationId)
    
    // Apply filters
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }
    
    if (filters?.priority && filters.priority !== 'all') {
      query = query.eq('priority', filters.priority)
    }
    
    // Apply sorting
    const sortField = sort?.field || 'created_at'
    const sortDirection = sort?.direction || 'desc'
    
    if (sortField === 'priority') {
      // For priority, we'll sort client-side
      query = query.order('created_at', { ascending: false })
    } else {
      query = query.order(sortField, { ascending: sortDirection === 'asc' })
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching tickets:', error)
      throw error
    }
    
    let tickets = (data || []) as TicketWithRelations[]
    
    // Client-side search filter
    if (filters?.search) {
      const search = filters.search.toLowerCase()
      tickets = tickets.filter(t => 
        t.title?.toLowerCase().includes(search) ||
        t.description?.toLowerCase().includes(search) ||
        t.ticket_number.toString().includes(search) ||
        t.category?.toLowerCase().includes(search)
      )
    }
    
    // Client-side priority sorting
    if (sortField === 'priority') {
      tickets.sort((a, b) => {
        const orderA = PRIORITY_ORDER[a.priority] ?? 99
        const orderB = PRIORITY_ORDER[b.priority] ?? 99
        return sortDirection === 'asc' ? orderA - orderB : orderB - orderA
      })
    }
    
    return tickets
  } catch (err) {
    console.error('fetchTickets error:', err)
    return []
  }
}

// Fetch single ticket by ID
export const fetchTicketById = async (ticketId: string): Promise<TicketWithRelations | null> => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        property:properties(*),
        unit:units(*),
        inbound_messages(*)
      `)
      .eq('id', ticketId)
      .single()
    
    if (error) {
      console.error('Error fetching ticket:', error)
      return null
    }
    
    return data as TicketWithRelations
  } catch (err) {
    console.error('fetchTicketById error:', err)
    return null
  }
}

// Update ticket status
export const updateTicketStatus = async (
  ticketId: string,
  status: TicketStatus
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', ticketId)
    
    if (error) {
      console.error('Error updating status:', error)
      return false
    }
    
    return true
  } catch (err) {
    console.error('updateTicketStatus error:', err)
    return false
  }
}

// Update ticket priority
export const updateTicketPriority = async (
  ticketId: string,
  priority: TicketPriority
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('tickets')
      .update({ priority, updated_at: new Date().toISOString() })
      .eq('id', ticketId)
    
    if (error) {
      console.error('Error updating priority:', error)
      return false
    }
    
    return true
  } catch (err) {
    console.error('updateTicketPriority error:', err)
    return false
  }
}

// Get ticket stats
export const getTicketStats = async (organizationId: string): Promise<{
  total: number
  triage: number
  open: number
  emergency: number
}> => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('status, priority')
      .eq('organization_id', organizationId)
    
    if (error) {
      console.error('Error fetching stats:', error)
      return { total: 0, triage: 0, open: 0, emergency: 0 }
    }
    
    const tickets = data || []
    return {
      total: tickets.length,
      triage: tickets.filter(t => t.status === 'triage').length,
      open: tickets.filter(t => t.status === 'open').length,
      emergency: tickets.filter(t => t.priority === 'emergency').length
    }
  } catch (err) {
    console.error('getTicketStats error:', err)
    return { total: 0, triage: 0, open: 0, emergency: 0 }
  }
}
