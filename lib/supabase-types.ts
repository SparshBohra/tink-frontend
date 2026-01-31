// SquareFt Phase 1 - Supabase Database Types
// Based on the schema provided for the maintenance triage dashboard

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization
        Insert: Omit<Organization, 'id' | 'created_at'>
        Update: Partial<Omit<Organization, 'id'>>
      }
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id'>>
      }
      properties: {
        Row: Property
        Insert: Omit<Property, 'id' | 'created_at'>
        Update: Partial<Omit<Property, 'id'>>
      }
      units: {
        Row: Unit
        Insert: Omit<Unit, 'id' | 'created_at'>
        Update: Partial<Omit<Unit, 'id'>>
      }
      tickets: {
        Row: Ticket
        Insert: Omit<Ticket, 'id' | 'created_at' | 'updated_at' | 'ticket_number'>
        Update: Partial<Omit<Ticket, 'id' | 'ticket_number'>>
      }
      inbound_messages: {
        Row: InboundMessage
        Insert: Omit<InboundMessage, 'id' | 'processed_at'>
        Update: Partial<Omit<InboundMessage, 'id'>>
      }
    }
  }
}

// Organization - Property management company
export interface Organization {
  id: string
  name: string
  slug: string | null
  created_at: string
}

// Profile - User profile linked to auth.users
export interface Profile {
  id: string // Same as auth.users.id
  organization_id: string | null
  full_name: string | null
  email: string | null
  role: 'pm' | 'admin'
  created_at: string
}

// Property - A building/property managed by an organization
export interface Property {
  id: string
  organization_id: string
  name: string
  address: string | null
  created_at: string
}

// Unit - Individual unit within a property
export interface Unit {
  id: string
  property_id: string | null
  organization_id: string | null
  unit_number: string
  current_tenant_email: string | null
  created_at: string
}

// Ticket Status Type
export type TicketStatus = 'triage' | 'open' | 'assigned' | 'completed' | 'cancelled'

// Ticket Priority Type
export type TicketPriority = 'low' | 'medium' | 'high' | 'emergency'

// Ticket Category Type (common categories for maintenance)
export type TicketCategory = 
  | 'hvac' 
  | 'plumbing' 
  | 'electrical' 
  | 'appliance' 
  | 'access_control' 
  | 'pest' 
  | 'general'
  | 'heating'
  | 'cooling'
  | string // Allow custom categories

// AI Metadata - Parsed data from LLM
export interface AIMetadata {
  subcategory?: string
  access_notes?: string
  tenant_name?: string
  tenant_phone?: string
  tenant_email?: string
  unit_number?: string
  property_name?: string
  yardi_fields?: {
    problem_description?: string
    priority?: string
    category?: string
    subcategory?: string
    location?: string
    access_instructions?: string
    [key: string]: string | undefined
  }
  confidence_score?: number
  parsed_at?: string
  [key: string]: unknown
}

// Ticket - Main maintenance request
export interface Ticket {
  id: string
  organization_id: string
  ticket_number: number
  status: TicketStatus
  priority: TicketPriority
  category: TicketCategory | null
  title: string | null
  description: string | null
  location_raw: string | null
  ai_metadata: AIMetadata
  property_id: string | null
  unit_id: string | null
  created_at: string
  updated_at: string
}

// Ticket with related data (for display)
export interface TicketWithRelations extends Ticket {
  property?: Property | null
  unit?: Unit | null
  inbound_messages?: InboundMessage[]
}

// Inbound Message Source Type
export type MessageSource = 'email' | 'sms'

// Inbound Message - Original email/SMS that created the ticket
export interface InboundMessage {
  id: string
  organization_id: string
  ticket_id: string | null
  source: MessageSource
  sender_email: string | null
  sender_name: string | null // Name of the sender
  sender_phone: string | null // For SMS messages
  forwarder_email: string | null // Email that forwarded the message
  forwarder_name: string | null // Name of the person who forwarded
  original_from: string | null // Original sender email (if forwarded)
  original_from_name: string | null // Original sender name (if forwarded)
  raw_subject: string | null
  raw_body: string | null
  raw_headers: Record<string, unknown> | null
  received_at: string | null // When the message was originally received
  processed_at: string
}

// Helper functions for display
export const getStatusDisplayName = (status: TicketStatus): string => {
  const names: Record<TicketStatus, string> = {
    triage: 'Triage',
    open: 'Open',
    assigned: 'Assigned',
    completed: 'Completed',
    cancelled: 'Cancelled'
  }
  return names[status] || status
}

export const getPriorityDisplayName = (priority: TicketPriority): string => {
  const names: Record<TicketPriority, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    emergency: 'Emergency'
  }
  return names[priority] || priority
}

export const getCategoryDisplayName = (category: TicketCategory | null): string => {
  if (!category) return 'General'
  
  const names: Record<string, string> = {
    hvac: 'HVAC',
    plumbing: 'Plumbing',
    electrical: 'Electrical',
    appliance: 'Appliance',
    access_control: 'Access Control',
    pest: 'Pest Control',
    general: 'General',
    heating: 'Heating',
    cooling: 'Cooling'
  }
  return names[category.toLowerCase()] || category
}

export const getCategoryIcon = (category: TicketCategory | null): string => {
  if (!category) return '📋'
  
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
  }
  return icons[category.toLowerCase()] || '📋'
}

export const getPriorityColor = (priority: TicketPriority): { bg: string; text: string; border: string } => {
  const colors: Record<TicketPriority, { bg: string; text: string; border: string }> = {
    emergency: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    high: { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
    medium: { bg: '#fefce8', text: '#ca8a04', border: '#fef08a' },
    low: { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' }
  }
  return colors[priority] || colors.medium
}

export const getStatusColor = (status: TicketStatus): { bg: string; text: string; border: string } => {
  const colors: Record<TicketStatus, { bg: string; text: string; border: string }> = {
    triage: { bg: '#fef3c7', text: '#d97706', border: '#fcd34d' },
    open: { bg: '#dbeafe', text: '#2563eb', border: '#93c5fd' },
    assigned: { bg: '#e0e7ff', text: '#4f46e5', border: '#a5b4fc' },
    completed: { bg: '#d1fae5', text: '#059669', border: '#6ee7b7' },
    cancelled: { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' }
  }
  return colors[status] || colors.triage
}
