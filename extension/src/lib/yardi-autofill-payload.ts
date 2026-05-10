import type { TicketPriority, TicketWithRelations } from '../types'
import { getCategoryDisplayName } from '../types'

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

  const briefFromMeta =
    (typeof meta.brief_description === 'string' && meta.brief_description) ||
    (typeof yf?.brief_description === 'string' && yf.brief_description) ||
    ''

  const problemFromMeta =
    (typeof meta.problem_description === 'string' && meta.problem_description) ||
    (typeof yf?.problem_description === 'string' && yf.problem_description) ||
    ''

  const briefDescription = (briefFromMeta || ticket.title || '').slice(0, 35)
  const problemDescription =
    problemFromMeta ||
    ticket.description ||
    ticket.title ||
    ''

  const priority =
    (typeof yf?.priority === 'string' && yf.priority) || mapPriority(ticket.priority)

  const subcategory =
    (typeof yf?.subcategory === 'string' && yf.subcategory) ||
    (typeof meta.subcategory === 'string' && meta.subcategory) ||
    ''

  return {
    version: 1,
    briefDescription,
    problemDescription,
    category,
    priority,
    subcategory,
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
    unitLabel:
      ticket.unit?.unit_number ||
      (typeof meta.unit_number === 'string' && meta.unit_number) ||
      '',
  }
}
