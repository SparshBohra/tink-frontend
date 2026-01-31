// SquareFt Extension - Types (copied from dashboard)

// Organization - Property management company
export interface Organization {
  id: string
  name: string
  slug: string | null
  created_at: string
}

// Profile - User profile linked to auth.users
export interface Profile {
  id: string
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

// Ticket Category Type
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
  | string

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

// Ticket with related data
export interface TicketWithRelations extends Ticket {
  property?: Property | null
  unit?: Unit | null
  inbound_messages?: InboundMessage[]
}

// Inbound Message Source Type
export type MessageSource = 'email' | 'sms'

// Inbound Message
export interface InboundMessage {
  id: string
  organization_id: string
  ticket_id: string | null
  source: MessageSource
  sender_email: string | null
  sender_name: string | null
  sender_phone: string | null
  forwarder_email: string | null
  forwarder_name: string | null
  original_from: string | null
  original_from_name: string | null
  raw_subject: string | null
  raw_body: string | null
  raw_headers: Record<string, unknown> | null
  received_at: string | null
  processed_at: string
}

// Helper functions
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
  if (!category) return 'clipboard'
  
  const icons: Record<string, string> = {
    hvac: 'snowflake',
    heating: 'thermometer',
    cooling: 'thermometer',
    plumbing: 'wrench',
    electrical: 'zap',
    appliance: 'plug',
    access_control: 'key',
    pest: 'bug',
    general: 'clipboard'
  }
  return icons[category.toLowerCase()] || 'clipboard'
}

export const getPriorityColor = (priority: TicketPriority): { bg: string; text: string; border: string; className: string } => {
  const colors: Record<TicketPriority, { bg: string; text: string; border: string; className: string }> = {
    emergency: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', className: 'priority-emergency' },
    high: { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa', className: 'priority-high' },
    medium: { bg: '#fefce8', text: '#ca8a04', border: '#fef08a', className: 'priority-medium' },
    low: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', className: 'priority-low' }
  }
  return colors[priority] || colors.medium
}

export const getStatusColor = (status: TicketStatus): { bg: string; text: string; border: string; className: string } => {
  const colors: Record<TicketStatus, { bg: string; text: string; border: string; className: string }> = {
    triage: { bg: '#fef3c7', text: '#d97706', border: '#fcd34d', className: 'status-triage' },
    open: { bg: '#dbeafe', text: '#2563eb', border: '#93c5fd', className: 'status-open' },
    assigned: { bg: '#e0e7ff', text: '#4f46e5', border: '#a5b4fc', className: 'status-in_progress' },
    completed: { bg: '#d1fae5', text: '#059669', border: '#6ee7b7', className: 'status-resolved' },
    cancelled: { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db', className: 'status-closed' }
  }
  return colors[status] || colors.triage
}

// Format relative time
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
