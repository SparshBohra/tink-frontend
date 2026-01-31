import { supabase } from './supabase'
import { 
  Ticket, 
  TicketWithRelations, 
  TicketStatus, 
  TicketPriority,
  InboundMessage,
  MessageSource
} from './supabase-types'

export interface TicketFilters {
  status?: TicketStatus | 'all'
  priority?: TicketPriority | 'all'
  category?: string | 'all'
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

// Status order for sorting
const STATUS_ORDER: Record<TicketStatus, number> = {
  triage: 0,
  open: 1,
  assigned: 2,
  completed: 3,
  cancelled: 4
}

/**
 * Fetch tickets for an organization with optional filters
 */
export async function fetchTickets(
  organizationId: string,
  filters?: TicketFilters,
  sort?: TicketSortOptions,
  limit?: number
): Promise<{ tickets: TicketWithRelations[]; error: string | null }> {
  try {
    let query = supabase
      .from('tickets')
      .select('*, inbound_messages(id, source, sender_name, sender_email, sender_phone, raw_body, raw_subject, received_at, processed_at, forwarder_email, forwarder_name, original_from, original_from_name)')
      .eq('organization_id', organizationId)

    // Apply filters
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters?.priority && filters.priority !== 'all') {
      query = query.eq('priority', filters.priority)
    }

    if (filters?.category && filters.category !== 'all') {
      query = query.eq('category', filters.category)
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location_raw.ilike.%${filters.search}%`)
    }

    // Apply sorting
    if (sort) {
      query = query.order(sort.field, { ascending: sort.direction === 'asc' })
    } else {
      // Default: newest first
      query = query.order('created_at', { ascending: false })
    }

    // Apply limit
    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching tickets:', error)
      return { tickets: [], error: error.message }
    }

    // Client-side sorting for priority/status if needed
    let tickets = (data as TicketWithRelations[]) || []

    if (sort?.field === 'priority') {
      tickets = tickets.sort((a, b) => {
        const orderA = PRIORITY_ORDER[a.priority]
        const orderB = PRIORITY_ORDER[b.priority]
        return sort.direction === 'asc' ? orderA - orderB : orderB - orderA
      })
    }

    if (sort?.field === 'status') {
      tickets = tickets.sort((a, b) => {
        const orderA = STATUS_ORDER[a.status]
        const orderB = STATUS_ORDER[b.status]
        return sort.direction === 'asc' ? orderA - orderB : orderB - orderA
      })
    }

    return { tickets, error: null }
  } catch (err) {
    console.error('Unexpected error fetching tickets:', err)
    return { tickets: [], error: 'Failed to fetch tickets' }
  }
}

/**
 * Fetch a single ticket with related data
 */
export async function fetchTicketById(
  ticketId: string,
  organizationId: string
): Promise<{ ticket: TicketWithRelations | null; error: string | null }> {
  try {
    // Fetch ticket
    const { data: ticketData, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .eq('organization_id', organizationId)
      .single()

    if (ticketError) {
      console.error('Error fetching ticket:', ticketError)
      return { ticket: null, error: ticketError.message }
    }

    const ticket = ticketData as Ticket

    // Fetch related inbound messages
    const { data: messagesData } = await supabase
      .from('inbound_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('processed_at', { ascending: false })

    // Fetch property if exists
    let property = null
    if (ticket.property_id) {
      const { data: propertyData } = await supabase
        .from('properties')
        .select('*')
        .eq('id', ticket.property_id)
        .single()
      property = propertyData
    }

    // Fetch unit if exists
    let unit = null
    if (ticket.unit_id) {
      const { data: unitData } = await supabase
        .from('units')
        .select('*')
        .eq('id', ticket.unit_id)
        .single()
      unit = unitData
    }

    const ticketWithRelations: TicketWithRelations = {
      ...ticket,
      property,
      unit,
      inbound_messages: (messagesData as InboundMessage[]) || []
    }

    return { ticket: ticketWithRelations, error: null }
  } catch (err) {
    console.error('Unexpected error fetching ticket:', err)
    return { ticket: null, error: 'Failed to fetch ticket' }
  }
}

/**
 * Update ticket status (Human-in-the-loop)
 */
export async function updateTicketStatus(
  ticketId: string,
  organizationId: string,
  newStatus: TicketStatus
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('tickets')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error updating ticket status:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (err) {
    console.error('Unexpected error updating ticket:', err)
    return { success: false, error: 'Failed to update ticket' }
  }
}

/**
 * Update ticket priority
 */
export async function updateTicketPriority(
  ticketId: string,
  organizationId: string,
  newPriority: TicketPriority
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('tickets')
      .update({ 
        priority: newPriority,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error updating ticket priority:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (err) {
    console.error('Unexpected error updating ticket:', err)
    return { success: false, error: 'Failed to update ticket' }
  }
}

/**
 * Get ticket statistics for dashboard
 */
export async function getTicketStats(
  organizationId: string
): Promise<{
  total: number
  triage: number
  open: number
  completed: number
  emergency: number
  error: string | null
}> {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('status, priority')
      .eq('organization_id', organizationId)

    if (error) {
      return { total: 0, triage: 0, open: 0, completed: 0, emergency: 0, error: error.message }
    }

    const tickets = data as Pick<Ticket, 'status' | 'priority'>[]

    return {
      total: tickets.length,
      triage: tickets.filter(t => t.status === 'triage').length,
      open: tickets.filter(t => t.status === 'open').length,
      completed: tickets.filter(t => t.status === 'completed').length,
      emergency: tickets.filter(t => t.priority === 'emergency').length,
      error: null
    }
  } catch (err) {
    console.error('Error fetching stats:', err)
    return { total: 0, triage: 0, open: 0, completed: 0, emergency: 0, error: 'Failed to fetch stats' }
  }
}

/**
 * Subscribe to real-time ticket updates
 */
export function subscribeToTickets(
  organizationId: string,
  onInsert: (ticket: Ticket) => void,
  onUpdate: (ticket: Ticket) => void
) {
  const channel = supabase
    .channel(`tickets-${organizationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'tickets',
        filter: `organization_id=eq.${organizationId}`
      },
      (payload) => {
        onInsert(payload.new as Ticket)
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'tickets',
        filter: `organization_id=eq.${organizationId}`
      },
      (payload) => {
        onUpdate(payload.new as Ticket)
      }
    )
    .subscribe()

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel)
  }
}
