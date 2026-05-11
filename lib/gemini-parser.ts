// ===================================================================
// Gemini AI Parser for Maintenance Tickets
// Uses Google's Gemini API to extract structured data from messages
// ===================================================================

import { TicketPriority, TicketCategory, AIMetadata } from './supabase-types'
import { clampBriefDescription } from './brief-clamp'

/**
 * Email/SMS from phones and macOS often use curly apostrophes (U+2019) instead of ASCII (').
 * Our keyword safety net and regex expect ASCII; Gemini also parses more reliably after normalize.
 */
export function normalizeInboundMessageText(raw: string): string {
  return raw
    .replace(/[\u2018\u2019\u201A\u2032]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
}

// Environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

// Parser result interface
export interface GeminiParseResult {
  success: boolean
  data?: ParsedTicketData
  error?: string
  raw_response?: string
  confidence?: number
}

// Work-order form labels (match internal mock / common PM dropdowns)
export const WORK_ORDER_PRIORITY_LABELS = ['Urgent - ASAP', 'Same Day', 'Non-Urgent'] as const
export type WorkOrderPriorityLabel = (typeof WORK_ORDER_PRIORITY_LABELS)[number]

export const WORK_ORDER_CATEGORY_LABELS = [
  'Access Card',
  'Administrative',
  'Building',
  'Capital Work',
  'Electrical',
  'HVAC',
  'Plumbing',
  'General',
] as const

function workOrderPriorityToInternal(label: string): TicketPriority {
  const s = label.trim()
  if (s === 'Urgent - ASAP') return 'emergency'
  if (s === 'Same Day') return 'high'
  return 'medium'
}

function normalizeWorkOrderPriorityLabel(raw: string | undefined, fallbackInternal: TicketPriority): WorkOrderPriorityLabel {
  const s = (raw || '').trim()
  if (WORK_ORDER_PRIORITY_LABELS.includes(s as WorkOrderPriorityLabel)) return s as WorkOrderPriorityLabel
  return internalPriorityToWorkOrderLabel(fallbackInternal)
}

function normalizeWorkOrderCategoryLabel(raw: string | undefined): string {
  const s = (raw || '').trim()
  const found = WORK_ORDER_CATEGORY_LABELS.find((x) => x.toLowerCase() === s.toLowerCase())
  if (found) return found
  return 'General'
}

function workOrderCategoryToInternal(label: string): TicketCategory {
  const x = label.trim().toLowerCase()
  if (x === 'plumbing') return 'plumbing'
  if (x === 'hvac') return 'hvac'
  if (x === 'electrical') return 'electrical'
  if (x === 'access card') return 'access_control'
  if (x === 'administrative' || x === 'building' || x === 'capital work') return 'general'
  return 'general'
}

function internalPriorityToWorkOrderLabel(p: TicketPriority): WorkOrderPriorityLabel {
  if (p === 'emergency') return 'Urgent - ASAP'
  if (p === 'high') return 'Same Day'
  return 'Non-Urgent'
}

// Structured ticket data from Gemini
export interface ParsedTicketData {
  title: string
  description: string
  priority: TicketPriority
  category: TicketCategory
  confidence: number // 0-1 score
  reasoning: string // Why Gemini chose this priority/category
  is_maintenance_related: boolean // NEW: Is this actually a maintenance request?
  message_type: 'maintenance' | 'spam' | 'personal' | 'marketing' | 'automated' | 'unclear' // NEW: Type of message
  /** ≤35 chars, headline for work-order "Brief Description" — only facts from the message */
  brief_description: string
  /** ≤4000 chars, work-order "Description" / problem detail — only facts from the message, no inventions */
  problem_description: string
  /** Dropdown label for external work-order systems */
  work_order_priority: WorkOrderPriorityLabel
  work_order_category: string
  /** Short issue label (e.g. Leak, No heat) or null if not clear from the message */
  work_order_subcategory: string | null
  extracted_data: {
    tenant_name?: string | null
    tenant_phone?: string | null
    tenant_email?: string | null
    unit_number?: string | null
    property_name?: string | null
    access_notes?: string | null
    subcategory?: string | null
  }
}

// Build the Gemini prompt
function buildPrompt(rawMessage: string): string {
  const catList = WORK_ORDER_CATEGORY_LABELS.join(' | ')
  const priList = WORK_ORDER_PRIORITY_LABELS.join(' | ')

  return `You are a maintenance ticket parser for property management. Classify the message and extract ONLY what is supported by the text. Never invent symptoms, locations, unit numbers, or tenant details.

**CRITICAL**: Return ONLY valid JSON. No markdown, no code blocks, no text outside JSON.

**Required JSON Structure:**
{
  "is_maintenance_related": boolean,
  "message_type": "maintenance|spam|personal|marketing|automated|unclear",
  "brief_description": "string, maximum 35 characters — one short headline for a work-order 'Brief Description' field (e.g. 'Kitchen sink leak', 'No heat unit 4B'). Use only facts stated or clearly implied in the message.",
  "problem_description": "string, maximum 4000 characters — full 'Description' / problem narrative for the maintenance team. Paraphrase and organize ONLY information present in the message (who, what, where in the message, urgency as stated). If something is unknown, omit it — do NOT guess or fabricate.",
  "work_order_priority": "${priList}",
  "work_order_category": "string — MUST be exactly one of: ${catList}",
  "work_order_subcategory": "string or null — short specific issue ONLY if clear from the message (e.g. 'Leak', 'No heat', 'Clogged drain'); otherwise null",
  "title": "string (max 100 chars, legacy list title — may match brief_description or slightly longer)",
  "description": "string (legacy full text — should match problem_description unless you need a tiny bridge for non-maintenance)",
  "priority": "emergency|high|medium|low",
  "category": "hvac|heating|cooling|plumbing|electrical|appliance|access_control|pest|general",
  "confidence": number (0.0-1.0),
  "reasoning": "string (1-2 sentences)",
  "extracted_data": {
    "tenant_name": "string or null",
    "tenant_phone": "string or null",
    "tenant_email": "string or null",
    "unit_number": "string or null — only if explicitly in the message",
    "property_name": "string or null — only if explicitly in the message",
    "access_notes": "string or null",
    "subcategory": "string or null — may mirror work_order_subcategory"
  }
}

**Anti-hallucination (mandatory):**
- Do not add equipment, rooms, or failures that are not in the message.
- Do not invent property names, building names, or unit numbers.
- If the message is vague ("something is broken"), brief_description and problem_description should stay vague — do not fill in a fake cause.
- work_order_category: pick the closest label from the allowed list; use "General" if none fits.
- work_order_priority: use "${priList}" semantics — urgent life/safety or severe active damage → "Urgent - ASAP"; serious but not immediate → "Same Day"; routine or minor → "Non-Urgent".

**Align priority field with work_order_priority:**
- "Urgent - ASAP" ↔ priority "emergency"
- "Same Day" ↔ priority "high"
- "Non-Urgent" ↔ priority "medium" or "low" (use "low" only for clearly cosmetic/routine items)

**Align category with work_order_category** (examples):
- Plumbing issues → plumbing + work_order_category "Plumbing"
- HVAC / AC / heat (not electrical-only) → hvac/heating/cooling + "HVAC"
- Lights, breakers, outlets → electrical + "Electrical"
- Keys, fobs, badges → access_control + "Access Card"

**Message types:** maintenance | spam | personal | marketing | automated | unclear

**is_maintenance_related — critical rules (reduce false negatives):**
- Set **true** if the message describes **any** physical issue with the property or building needing facilities attention — whether in a **unit or a common area** (hallway, stairs, lobby, entrance, garage, exterior door, shared lighting, etc.).
- Examples that MUST be maintenance: lights or bulbs out; doors, locks, or latches not working; leaks; no water; HVAC problems; pests; damage; appliances not working; trip hazards; anything asking for **repair, fix, or someone to look at** a building/system problem.
- **Polite or casual wording** ("Hi team", "just wanted to report", "thanks") does **not** make it non-maintenance. **message_type** can still be \`maintenance\`.
- **Multiple issues in one message** (e.g. hallway light out AND front door not latching) — set **is_maintenance_related: true**, \`message_type: "maintenance"\`, and include **both** problems in problem_description (and a brief_description that summarizes the combined request within 35 chars if needed, e.g. "Hallway light and front door").
- Set **false** only when there is **no** facility/maintenance problem: spam, pure marketing, unrelated personal chat with no building issue, automated newsletters, or messages with zero actionable property concern.

**If is_maintenance_related is false:** still output brief_description and problem_description summarizing the message honestly; set work_order_priority to "Non-Urgent", work_order_category to "General", work_order_subcategory to null.

---
**MESSAGE TO PARSE:**
${normalizeInboundMessageText(rawMessage)}
---

**JSON OUTPUT:**`
}

// Parse Gemini's response and handle edge cases (exported for unit tests)
export function parseGeminiResponse(rawResponse: string): ParsedTicketData | null {
  const cleanedResponse = rawResponse.trim()

  /** Gemini often wraps JSON in ```json ... ``` but may omit the closing fence or use ```JSON. */
  function extractFencedOrRaw(s: string): string {
    const t = s.trim()
    const openMatch = /```(?:json)?\s*/i.exec(t)
    if (!openMatch || openMatch.index === undefined) return t
    let body = t.slice(openMatch.index + openMatch[0].length)
    const close = body.indexOf('```')
    if (close !== -1) body = body.slice(0, close)
    return body.trim()
  }

  function tryParseJsonObject(jsonStr: string): ParsedTicketData | null {
    try {
      return validateAndNormalizeData(JSON.parse(jsonStr))
    } catch {
      return null
    }
  }

  const unfenced = extractFencedOrRaw(cleanedResponse)
  const fromFence = tryParseJsonObject(unfenced)
  if (fromFence) return fromFence

  const direct = tryParseJsonObject(cleanedResponse)
  if (direct) return direct

  try {
    const firstBrace = cleanedResponse.indexOf('{')
    const lastBrace = cleanedResponse.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const sliced = cleanedResponse.substring(firstBrace, lastBrace + 1)
      const fromBraces = tryParseJsonObject(sliced)
      if (fromBraces) return fromBraces
    }
  } catch {
    // fall through
  }

  console.error('Failed to parse Gemini response as structured JSON')
  console.error('Raw response length:', rawResponse.length)
  console.error('First 200 chars:', rawResponse.substring(0, 200))

  const jsonMatch1 = cleanedResponse.match(/```json\s*([\s\S]*?)\s*```/)
  if (jsonMatch1) {
    const parsed = tryParseJsonObject(jsonMatch1[1].trim())
    if (parsed) return parsed
  }

  const jsonMatch2 = cleanedResponse.match(/```\s*([\s\S]*?)\s*```/)
  if (jsonMatch2) {
    const parsed = tryParseJsonObject(jsonMatch2[1].trim())
    if (parsed) return parsed
  }

  const jsonMatch3 = cleanedResponse.match(/\{[\s\S]*\}/)
  if (jsonMatch3) {
    const parsed = tryParseJsonObject(jsonMatch3[0])
    if (parsed) return parsed
  }

  console.error('All parsing strategies failed')
  return null
}

// Helper function to validate and normalize parsed data
function validateAndNormalizeData(parsed: any): ParsedTicketData {
  if (parsed.is_maintenance_related === undefined || !parsed.message_type) {
    throw new Error('Missing required fields in Gemini response')
  }

  if (!parsed.extracted_data) {
    parsed.extracted_data = {}
  }

  // New fields with legacy backfill (brief: 35 chars max for Yardi — break on word boundary)
  let brief =
    typeof parsed.brief_description === 'string'
      ? clampBriefDescription(parsed.brief_description.trim(), 35)
      : ''
  let problem =
    typeof parsed.problem_description === 'string'
      ? parsed.problem_description.trim().slice(0, 4000)
      : ''

  if (!brief && typeof parsed.title === 'string') {
    brief = clampBriefDescription(parsed.title.trim(), 35)
  }
  if (!problem && typeof parsed.description === 'string') {
    problem = parsed.description.trim().slice(0, 4000)
  }
  if (!brief) {
    brief = clampBriefDescription((problem || 'Maintenance').trim(), 35) || 'Maintenance'
  }
  if (!problem) {
    problem = brief
  }

  parsed.brief_description = brief
  parsed.problem_description = problem
  const titleFromModel = typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : ''
  parsed.title = titleFromModel
    ? clampBriefDescription(titleFromModel, 100)
    : clampBriefDescription(problem, 100)
  parsed.description = (typeof parsed.description === 'string' && parsed.description.trim())
    ? parsed.description.trim().slice(0, 8000)
    : problem

  const validPriorities: TicketPriority[] = ['low', 'medium', 'high', 'emergency']
  if (!validPriorities.includes(parsed.priority)) {
    parsed.priority = 'medium'
  }
  const validCategories: TicketCategory[] = [
    'hvac',
    'heating',
    'cooling',
    'plumbing',
    'electrical',
    'appliance',
    'access_control',
    'pest',
    'general',
  ]
  if (!validCategories.includes(parsed.category)) {
    parsed.category = 'general'
  }

  const workPri = normalizeWorkOrderPriorityLabel(
    typeof parsed.work_order_priority === 'string' ? parsed.work_order_priority : undefined,
    parsed.priority as TicketPriority
  )
  const workCat = normalizeWorkOrderCategoryLabel(
    typeof parsed.work_order_category === 'string' ? parsed.work_order_category : undefined
  )
  parsed.work_order_priority = workPri
  parsed.work_order_category = workCat

  if (parsed.is_maintenance_related) {
    parsed.priority = workOrderPriorityToInternal(workPri)
    parsed.category = workOrderCategoryToInternal(workCat)
  }

  const sub =
    parsed.work_order_subcategory !== undefined && parsed.work_order_subcategory !== null
      ? String(parsed.work_order_subcategory).trim() || null
      : null
  parsed.work_order_subcategory = sub && sub.length > 120 ? sub.slice(0, 120) : sub
  if (parsed.work_order_subcategory && !parsed.extracted_data.subcategory) {
    parsed.extracted_data.subcategory = parsed.work_order_subcategory
  }

  const validTypes = ['maintenance', 'spam', 'personal', 'marketing', 'automated', 'unclear']
  if (!validTypes.includes(parsed.message_type)) {
    parsed.message_type = 'unclear'
  }

  if (!parsed.is_maintenance_related) {
    console.log(`Non-maintenance message detected: ${parsed.message_type}`)
    // Do not overwrite work_order_* here: the model may still output useful labels for queue review,
    // and coercing is_maintenance_related=true later needs those fields if the model was only wrong on the boolean.
  }

  if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
    parsed.confidence = 0.5
  }

  if (!parsed.reasoning || typeof parsed.reasoning !== 'string') {
    parsed.reasoning = ''
  }

  return parsed as ParsedTicketData
}

/**
 * Narrow override when the model false-negates obvious maintenance (common-area + multi-issue + polite tone).
 * Only upgrades when multiple facility/issue cues appear — not a single vague word.
 */
export function looksLikeDefiniteMaintenanceText(rawMessage: string): boolean {
  const t = normalizeInboundMessageText(rawMessage).toLowerCase()
  if (t.length < 15) return false

  const issueVerbs =
    /\b(broken|leak|leaking|drip|dripping|flood|clog|out\b|not working|not cooling|not heating|doesn'?t work|won'?t|not latching|isn'?t latching|latching|no water|repair|fix(ed)?|inspect|beep|beeping|chirp|chirping|noise|noisy|grinding|stuck)\b/.test(
      t
    )
  const facilityNouns =
    /\b(light|bulb|lightbulb|light bulb|door|lock|latch|tap|faucet|sink|toilet|heat|furnace|ac\b|hvac|pipe|window|ceiling|hallway|stairs|elevator|garage|lobby|entrance|smoke detector|smoke alarm)\b/.test(
      t
    )
  const requestCue =
    /\b(report|request|can (someone|you)|please (send|fix|have)|need(s)?\s+(a |this |it )?fix|maintenance)\b/.test(t)

  if (issueVerbs && facilityNouns) return true
  if (facilityNouns && requestCue && /\b(unit|apt|apartment|\#\d+)\b/.test(t)) return true
  return false
}

// Helper function to call Gemini API with retry logic
async function callGeminiWithRetry(
  prompt: string,
  maxRetries: number = 2
): Promise<{ success: boolean; generatedText?: string; error?: string; rawResult?: any }> {
  let lastError: string = ''
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000) // Exponential backoff: 1s, 2s, 4s (max 5s)
      console.log(`Retrying Gemini API call (attempt ${attempt + 1}/${maxRetries + 1}) after ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.1, // Low temperature for consistent, structured output
              topK: 1,
              topP: 0.95,
              maxOutputTokens: 8192,
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_NONE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_NONE"
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_NONE"
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_NONE"
              }
            ]
          })
        }
      )
      
      if (!response.ok) {
        const errorText = await response.text()
        lastError = `Gemini API error: ${response.status} - ${errorText}`
        
        // Retry on 5xx errors or rate limits
        if (response.status >= 500 || response.status === 429) {
          console.warn(`Retryable error: ${lastError}`)
          continue
        }
        
        // Don't retry on 4xx errors (except 429)
        return { success: false, error: lastError }
      }
      
      const result = await response.json()
      
      // Extract text from Gemini response
      const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text
      
      if (!generatedText) {
        lastError = 'No text generated by Gemini'
        return { 
          success: false, 
          error: lastError,
          rawResult: result
        }
      }
      
      // Success!
      return { success: true, generatedText }
      
    } catch (error: any) {
      lastError = error.message || 'Unknown error calling Gemini API'
      console.error(`Gemini API call failed (attempt ${attempt + 1}):`, lastError)
      
      // Continue to retry on network errors
      if (attempt < maxRetries) {
        continue
      }
    }
  }
  
  // All retries exhausted
  return { success: false, error: `Failed after ${maxRetries + 1} attempts: ${lastError}` }
}

// Main parsing function
export async function parseMaintenanceRequest(
  rawMessage: string,
  messageSource: 'email' | 'sms' = 'email'
): Promise<GeminiParseResult> {
  // Validate inputs
  if (!GEMINI_API_KEY) {
    return {
      success: false,
      error: 'GEMINI_API_KEY not configured'
    }
  }
  
  if (!rawMessage || rawMessage.trim().length === 0) {
    return {
      success: false,
      error: 'Empty message provided'
    }
  }
  
  // Limit message length (Gemini has token limits); normalize smart punctuation first
  const truncatedMessage = normalizeInboundMessageText(rawMessage).trim().slice(0, 10000)
  
  try {
    const prompt = buildPrompt(truncatedMessage)
    
    // Call Gemini API with retry logic
    const apiResult = await callGeminiWithRetry(prompt, 2)
    
    if (!apiResult.success || !apiResult.generatedText) {
      return {
        success: false,
        error: apiResult.error || 'Failed to get response from Gemini',
        raw_response: apiResult.rawResult ? JSON.stringify(apiResult.rawResult) : undefined
      }
    }
    
    // Parse the structured data
    const parsedData = parseGeminiResponse(apiResult.generatedText)
    
    if (!parsedData) {
      return {
        success: false,
        error: 'Failed to parse Gemini response as valid JSON',
        raw_response: apiResult.generatedText
      }
    }

    if (!parsedData.is_maintenance_related && looksLikeDefiniteMaintenanceText(truncatedMessage)) {
      console.warn(
        '[gemini-parser] Coercing is_maintenance_related=true (keyword safety net). Model had:',
        parsedData.message_type,
        parsedData.reasoning?.slice(0, 120)
      )
      parsedData.is_maintenance_related = true
      parsedData.message_type = 'maintenance'
      const workPri = normalizeWorkOrderPriorityLabel(parsedData.work_order_priority, parsedData.priority)
      const workCat = normalizeWorkOrderCategoryLabel(parsedData.work_order_category)
      parsedData.work_order_priority = workPri
      parsedData.work_order_category = workCat
      parsedData.priority = workOrderPriorityToInternal(workPri)
      parsedData.category = workOrderCategoryToInternal(workCat)
    }

    // Success!
    return {
      success: true,
      data: parsedData,
      confidence: parsedData.confidence,
      raw_response: apiResult.generatedText
    }
    
  } catch (error: any) {
    console.error('Error in parseMaintenanceRequest:', error)
    return {
      success: false,
      error: error.message || 'Unknown error in parsing flow'
    }
  }
}

// Convert ParsedTicketData to AIMetadata format for database
export function toAIMetadata(parsed: ParsedTicketData): AIMetadata {
  const sub =
    parsed.work_order_subcategory ||
    parsed.extracted_data.subcategory ||
    undefined

  return {
    brief_description: parsed.brief_description,
    problem_description: parsed.problem_description,
    subcategory: typeof sub === 'string' ? sub : undefined,
    access_notes: parsed.extracted_data.access_notes || undefined,
    tenant_name: parsed.extracted_data.tenant_name || undefined,
    tenant_phone: parsed.extracted_data.tenant_phone || undefined,
    tenant_email: parsed.extracted_data.tenant_email || undefined,
    unit_number: parsed.extracted_data.unit_number || undefined,
    property_name: parsed.extracted_data.property_name || undefined,
    confidence_score: parsed.confidence,
    parsed_at: new Date().toISOString(),
    gemini_reasoning: parsed.reasoning,
    yardi_fields: {
      brief_description: parsed.brief_description,
      problem_description: parsed.problem_description,
      priority: parsed.work_order_priority,
      category: parsed.work_order_category,
      subcategory: typeof sub === 'string' ? sub : undefined,
    },
  }
}
