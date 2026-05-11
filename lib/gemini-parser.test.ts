import { describe, it, expect, vi } from 'vitest'
import {
  looksLikeDefiniteMaintenanceText,
  parseGeminiResponse,
  toAIMetadata,
  type ParsedTicketData,
} from './gemini-parser'

/** Tenant-style messages — realistic, not exaggerated */
const KEYWORD_SAFETY_NET_SHOULD_MATCH: string[] = [
  // Original problematic case: common-area + polite + two issues
  `Hi team, naman from Unit 25. Just wanted to report that the lightbulb in the 2nd-floor hallway is out, and it's pretty dark by the stairs. Also, the front heavy door isn't latching shut properly. Thanks!`,

  `Hi, this is Maria in unit 12. The kitchen faucet has been dripping for two days. Can someone take a look?`,

  `Unit 9 — no water at all from the bathroom tap this morning. Please send maintenance when you can.`,

  `The elevator in our building made a loud grinding noise and stopped between floors for a minute. Worried it's unsafe.`,

  `Garage door opener doesn't work half the time. I'm in unit 303.`,

  `Smoke detector in the hallway near unit 15 keeps beeping even after I changed the battery.`,

  `AC in unit 4B is not cooling — thermostat is set to 68 but it's almost 80 inside.`,
]

const KEYWORD_SAFETY_NET_SHOULD_NOT_MATCH: string[] = [
  `Hey! Are we still meeting for coffee on Saturday?`,

  `Can you email me a copy of last month's rent receipt for my records?`,

  `Quick question — what's the guest parking policy overnight?`,

  `Love the new landscaping by the entrance, looks great.`,

  `The Italian place down the street has amazing pasta`, // no building issue

  `Reminder: book club is moved to 7pm`, // tenant chatter

  `Just wanted to say thanks for the holiday party`,

  `The light at the end of the tunnel idiom isn't about our hallway`, // joke / no real issue verbs with facility in maintenance sense — "light" alone + no issue

  `I'm giving my 60-day notice — my last day will be August 31.`, // admin, not a repair request
]

function minimalModelJson(overrides: Partial<ParsedTicketData> & Record<string, unknown>): string {
  const base = {
    is_maintenance_related: true,
    message_type: 'maintenance',
    brief_description: 'Test brief',
    problem_description: 'Test problem body with enough detail.',
    work_order_priority: 'Non-Urgent',
    work_order_category: 'General',
    work_order_subcategory: null,
    title: 'Test brief',
    description: 'Test problem body with enough detail.',
    priority: 'medium',
    category: 'general',
    confidence: 0.9,
    reasoning: 'Synthetic fixture for tests.',
    extracted_data: {
      tenant_name: 'Sam',
      unit_number: '12',
      tenant_phone: null,
      tenant_email: null,
      property_name: null,
      access_notes: null,
      subcategory: null,
    },
  }
  return JSON.stringify({ ...base, ...overrides })
}

describe('looksLikeDefiniteMaintenanceText', () => {
  it('matches common tenant maintenance phrasing', () => {
    for (const text of KEYWORD_SAFETY_NET_SHOULD_MATCH) {
      expect(looksLikeDefiniteMaintenanceText(text), text.slice(0, 80)).toBe(true)
    }
  })

  it('does not match everyday non-maintenance messages', () => {
    for (const text of KEYWORD_SAFETY_NET_SHOULD_NOT_MATCH) {
      expect(looksLikeDefiniteMaintenanceText(text), text.slice(0, 80)).toBe(false)
    }
  })
})

describe('parseGeminiResponse', () => {
  it('normalizes multi-issue maintenance JSON from the model', () => {
    const raw = minimalModelJson({
      brief_description: 'Hallway light and front door',
      problem_description:
        'Tenant reports hallway light is out on floor 2 and front door does not latch properly.',
      work_order_category: 'Electrical',
      work_order_priority: 'Same Day',
      priority: 'high',
      category: 'electrical',
      extracted_data: {
        tenant_name: 'Naman',
        unit_number: '25',
        tenant_phone: null,
        tenant_email: null,
        property_name: null,
        access_notes: null,
        subcategory: null,
      },
    })
    const parsed = parseGeminiResponse(raw)
    expect(parsed).not.toBeNull()
    expect(parsed!.is_maintenance_related).toBe(true)
    expect(parsed!.brief_description.length).toBeLessThanOrEqual(35)
    expect(parsed!.work_order_category).toBe('Electrical')
    expect(parsed!.category).toBe('electrical')
    expect(parsed!.priority).toBe('high')
  })

  it('clears work-order fields when not maintenance', () => {
    const raw = minimalModelJson({
      is_maintenance_related: false,
      message_type: 'personal',
      work_order_category: 'Plumbing',
      work_order_priority: 'Urgent - ASAP',
      work_order_subcategory: 'Leak',
    })
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    try {
      const parsed = parseGeminiResponse(raw)
      expect(parsed).not.toBeNull()
      expect(parsed!.is_maintenance_related).toBe(false)
      expect(parsed!.work_order_priority).toBe('Non-Urgent')
      expect(parsed!.work_order_category).toBe('General')
      expect(parsed!.work_order_subcategory).toBeNull()
    } finally {
      logSpy.mockRestore()
    }
  })

  it('parses JSON wrapped in markdown fence', () => {
    const inner = minimalModelJson({
      brief_description: 'Leak under kitchen sink',
      problem_description: 'Water pooling under sink when dishwasher runs.',
      category: 'plumbing',
      work_order_category: 'Plumbing',
    })
    const wrapped = `Here is the result:\n\`\`\`json\n${inner}\n\`\`\`\n`
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    try {
      const parsed = parseGeminiResponse(wrapped)
      expect(parsed).not.toBeNull()
      expect(parsed!.brief_description).toContain('sink')
      expect(parsed!.work_order_category).toBe('Plumbing')
    } finally {
      errSpy.mockRestore()
      logSpy.mockRestore()
    }
  })
})

describe('toAIMetadata', () => {
  it('maps yardi_fields from parsed output', () => {
    const parsed = parseGeminiResponse(
      minimalModelJson({
        brief_description: 'No hot water',
        problem_description: 'Shower only runs cold in unit 7.',
        work_order_subcategory: 'No hot water',
      })
    )!
    const meta = toAIMetadata(parsed)
    expect(meta.brief_description).toBe('No hot water')
    expect(meta.yardi_fields?.subcategory).toBe('No hot water')
    expect(meta.yardi_fields?.category).toBe('General')
  })
})
