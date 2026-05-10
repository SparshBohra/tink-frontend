import type { TicketPriority, TicketWithRelations } from './supabase-types'
import { getCategoryDisplayName } from './supabase-types'

/** Payload sent from dashboard → extension → Yardi / mock tab (versioned for forward compatibility). */
export interface YardiAutofillPayloadV1 {
  version: 1
  briefDescription: string
  problemDescription: string
  category: string
  priority: string
  subcategory: string
  callerName: string
  callerPhone: string
  callerEmail: string
  accessNotes: string
  locationHint: string
  propertyName: string
  unitLabel: string
}

function mapPriority(p: TicketPriority): string {
  switch (p) {
    case 'emergency':
      return 'Urgent - ASAP'
    case 'high':
      return 'Same Day'
    default:
      return 'Non-Urgent'
  }
}

export function buildYardiAutofillPayloadV1(ticket: TicketWithRelations): YardiAutofillPayloadV1 {
  const meta = ticket.ai_metadata || {}
  const yf = meta.yardi_fields
  const first = ticket.inbound_messages?.[0]

  const callerName =
    (typeof meta.tenant_name === 'string' && meta.tenant_name) ||
    first?.sender_name ||
    first?.original_from_name ||
    first?.forwarder_name ||
    ''

  const callerEmail =
    (typeof meta.tenant_email === 'string' && meta.tenant_email) ||
    first?.sender_email ||
    first?.original_from ||
    ''

  const callerPhone =
    (typeof meta.tenant_phone === 'string' && meta.tenant_phone) ||
    first?.sender_phone ||
    ''

  const category =
    (typeof yf?.category === 'string' && yf.category) ||
    getCategoryDisplayName(ticket.category) ||
    ''

  const problemDescription =
    ticket.description ||
    (typeof yf?.problem_description === 'string' && yf.problem_description) ||
    ticket.title ||
    ''

  return {
    version: 1,
    briefDescription: (ticket.title || '').slice(0, 35),
    problemDescription,
    category,
    priority: mapPriority(ticket.priority),
    subcategory: (typeof yf?.subcategory === 'string' && yf.subcategory) || (typeof meta.subcategory === 'string' && meta.subcategory) || '',
    callerName,
    callerPhone,
    callerEmail,
    accessNotes:
      (typeof yf?.access_instructions === 'string' && yf.access_instructions) ||
      (typeof meta.access_notes === 'string' && meta.access_notes) ||
      '',
    locationHint:
      ticket.location_raw ||
      (typeof yf?.location === 'string' && yf.location) ||
      '',
    propertyName:
      ticket.property?.name ||
      (typeof meta.property_name === 'string' && meta.property_name) ||
      '',
    unitLabel: ticket.unit?.unit_number || (typeof meta.unit_number === 'string' && meta.unit_number) || '',
  }
}
