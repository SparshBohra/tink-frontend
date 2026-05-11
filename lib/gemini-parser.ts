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

const MAX_INBOUND_ISSUES = 5

/** One distinct maintenance item — may share tenant/unit context via parent ParsedTicketData.extracted_data */
export interface ParsedMaintenanceIssue {
  title: string
  description: string
  priority: TicketPriority
  category: TicketCategory
  confidence: number
  reasoning: string
  brief_description: string
  problem_description: string
  work_order_priority: WorkOrderPriorityLabel
  work_order_category: string
  work_order_subcategory: string | null
}

// Structured ticket data from Gemini
export interface ParsedTicketData {
  title: string
  description: string
  priority: TicketPriority
  category: TicketCategory
  confidence: number // 0-1 score (mean across issues when split)
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
  /** Normalized maintenance items (always length ≥ 1 after parse). Use for multi-ticket creation. */
  issues: ParsedMaintenanceIssue[]
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

function syncRootFromIssues(parsed: ParsedTicketData, issues: ParsedMaintenanceIssue[]) {
  const head = issues[0]
  parsed.brief_description = head.brief_description
  parsed.problem_description = head.problem_description
  parsed.title = head.title
  parsed.description = head.description
  parsed.priority = head.priority
  parsed.category = head.category
  parsed.work_order_priority = head.work_order_priority
  parsed.work_order_category = head.work_order_category
  parsed.work_order_subcategory = head.work_order_subcategory
  parsed.confidence =
    issues.reduce((a, i) => a + i.confidence, 0) / Math.max(issues.length, 1)
}

function normalizeSingleIssue(iss: any, isMaintenance: boolean): ParsedMaintenanceIssue {
  let brief =
    typeof iss.brief_description === 'string'
      ? clampBriefDescription(iss.brief_description.trim(), 35)
      : ''
  let problem =
    typeof iss.problem_description === 'string' ? iss.problem_description.trim().slice(0, 4000) : ''

  if (!brief && typeof iss.title === 'string') {
    brief = clampBriefDescription(iss.title.trim(), 35)
  }
  if (!problem && typeof iss.description === 'string') {
    problem = iss.description.trim().slice(0, 4000)
  }
  if (!brief) {
    brief = clampBriefDescription((problem || 'Maintenance').trim(), 35) || 'Maintenance'
  }
  if (!problem) {
    problem = brief
  }

  const titleFromModel = typeof iss.title === 'string' && iss.title.trim() ? iss.title.trim() : ''
  const title = titleFromModel
    ? clampBriefDescription(titleFromModel, 100)
    : clampBriefDescription(problem, 100)
  const description =
    typeof iss.description === 'string' && iss.description.trim()
      ? iss.description.trim().slice(0, 8000)
      : problem

  const validPriorities: TicketPriority[] = ['low', 'medium', 'high', 'emergency']
  let priority: TicketPriority = validPriorities.includes(iss.priority) ? iss.priority : 'medium'

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
  let category: TicketCategory = validCategories.includes(iss.category) ? iss.category : 'general'

  const workPri = normalizeWorkOrderPriorityLabel(
    typeof iss.work_order_priority === 'string' ? iss.work_order_priority : undefined,
    priority
  )
  const workCat = normalizeWorkOrderCategoryLabel(
    typeof iss.work_order_category === 'string' ? iss.work_order_category : undefined
  )
  let woPri = workPri
  let woCat = workCat

  const sub =
    iss.work_order_subcategory !== undefined && iss.work_order_subcategory !== null
      ? String(iss.work_order_subcategory).trim() || null
      : null
  const woSub = sub && sub.length > 120 ? sub.slice(0, 120) : sub

  if (isMaintenance) {
    priority = workOrderPriorityToInternal(woPri)
    category = workOrderCategoryToInternal(woCat)
  } else {
    if (!validPriorities.includes(priority)) priority = 'medium'
    if (!validCategories.includes(category)) category = 'general'
  }

  if (typeof iss.confidence !== 'number' || iss.confidence < 0 || iss.confidence > 1) {
    iss.confidence = 0.5
  }
  const confidence = iss.confidence as number

  const reasoning = typeof iss.reasoning === 'string' ? iss.reasoning : ''

  return {
    brief_description: brief,
    problem_description: problem,
    title,
    description,
    priority,
    category,
    work_order_priority: woPri,
    work_order_category: woCat,
    work_order_subcategory: woSub,
    confidence,
    reasoning,
  }
}

// Build the Gemini prompt
function buildPrompt(rawMessage: string): string {
  const catList = WORK_ORDER_CATEGORY_LABELS.join(' | ')
  const priList = WORK_ORDER_PRIORITY_LABELS.join(' | ')

  return `You are a maintenance ticket parser for property management. Classify the message and extract ONLY what is supported by the text. Never invent symptoms, locations, unit numbers, or tenant details.

**CRITICAL**: Return ONLY valid JSON. No markdown, no code blocks, no text outside JSON.

**brief_description (work-order "Brief Description", hard max 35 characters) & title (list headline, hard max 100 characters):**
- **Count characters carefully** (including spaces and punctuation). \`brief_description\` MUST be **35 characters or fewer**; \`title\` MUST be **100 or fewer**.
- **Never end mid-word.** The last visible character must be a **complete word** or allowed punctuation (e.g. period). Bad: "...door not latch" / "...not latchi" / "light &" — Good: "...door latch", "Hall light + door", "Hallway light and door".
- **If several issues** (e.g. hallway light + door) do not both fit in 35 chars: shorten with **natural abbreviations** or **"+" / "and"** between short nouns, or **drop the less critical** issue in the brief only (keep **both** in \`problem_description\`). Example: "Hall light + door latch" / "2nd fl hall light, door".
- **title** should be a clear list headline (can be slightly longer than \`brief_description\`); same rules — **no truncated words**, stay ≤100 chars. Put full detail in \`problem_description\`, not in \`title\`.

**Required JSON Structure:**
{
  "is_maintenance_related": boolean,
  "message_type": "maintenance|spam|personal|marketing|automated|unclear",
  "reasoning": "string — 1-2 sentences for the whole message (not per-issue)",
  "extracted_data": {
    "tenant_name": "string or null",
    "tenant_phone": "string or null",
    "tenant_email": "string or null",
    "unit_number": "string or null — only if explicitly in the message",
    "property_name": "string or null — only if explicitly in the message",
    "access_notes": "string or null",
    "subcategory": "string or null — optional; usually mirror the first issue's work_order_subcategory if relevant"
  },
  "issues": [
    {
      "brief_description": "string — max 35 chars for THIS issue only, same word-boundary rules as above",
      "problem_description": "string, max 4000 — narrative for THIS issue only (you may repeat tenant name/unit from the message for clarity)",
      "work_order_priority": "${priList}",
      "work_order_category": "string — MUST be exactly one of: ${catList}",
      "work_order_subcategory": "string or null — short specific issue ONLY if clear for this item (e.g. 'Bulb out', 'Door latch'); otherwise null",
      "title": "string — max 100 chars for this issue",
      "description": "string — should match this issue's problem_description",
      "priority": "emergency|high|medium|low",
      "category": "hvac|heating|cooling|plumbing|electrical|appliance|access_control|pest|general",
      "confidence": number (0.0-1.0),
      "reasoning": "string — one short sentence for this issue's category/priority choice"
    }
  ]
}

**\`issues\` array (required):**
- Always include **at least one** object. Use **one object per distinct maintenance problem** (different place, system, or repair need).
- Example: **2nd-floor hallway light out** → one issue with work_order_category **Electrical** and category **electrical**; **front door not latching** → a **second** issue with work_order_category **Building** (or **General** only if Building is a poor fit) — **do not** blend unrelated problems into a single issue or force one shared "General" category when two different trades apply.
- Cap at **5** issues; if the tenant lists more, group the least urgent or omit with an honest note only in the last issue's text (still no fabrication).
- **Single problem** → exactly **one** entry in \`issues\`.
- **Legacy:** You may also include root-level \`brief_description\`, \`problem_description\`, etc. (omit \`issues\`) and the parser will treat that as one issue — **prefer the \`issues\` array** for all new output.

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
- **Multiple issues in one message** (e.g. hallway light out AND front door not latching) — set **is_maintenance_related: true**, \`message_type: "maintenance"\`, and output **separate objects in \`issues\`** — each with its **own** \`brief_description\`, \`problem_description\`, \`category\`, and \`work_order_category\` (do not merge into one combined issue).
- Set **false** only when there is **no** facility/maintenance problem: spam, pure marketing, unrelated personal chat with no building issue, automated newsletters, or messages with zero actionable property concern.

**If is_maintenance_related is false:** still output \`issues\` with one (or more) entries summarizing the message honestly; for each issue set work_order_priority to "Non-Urgent", work_order_category to "General", work_order_subcategory to null.

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

  const isMaint = !!parsed.is_maintenance_related

  let rawIssues: any[] = []
  if (Array.isArray(parsed.issues) && parsed.issues.length > 0) {
    rawIssues = parsed.issues.slice(0, MAX_INBOUND_ISSUES)
  }

  const issues: ParsedMaintenanceIssue[] =
    rawIssues.length > 0
      ? rawIssues.map((iss) => normalizeSingleIssue(iss, isMaint))
      : [normalizeSingleIssue(parsed, isMaint)]

  if (!issues.length) {
    throw new Error('No issues in Gemini response')
  }

  const out = parsed as ParsedTicketData
  out.issues = issues
  syncRootFromIssues(out, issues)

  if (issues[0].work_order_subcategory && !parsed.extracted_data.subcategory) {
    parsed.extracted_data.subcategory = issues[0].work_order_subcategory
  }

  const validTypes = ['maintenance', 'spam', 'personal', 'marketing', 'automated', 'unclear']
  if (!validTypes.includes(parsed.message_type)) {
    parsed.message_type = 'unclear'
  }

  if (!isMaint) {
    console.log(`Non-maintenance message detected: ${parsed.message_type}`)
  }

  if (!parsed.reasoning || typeof parsed.reasoning !== 'string') {
    parsed.reasoning = ''
  }

  return out
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
      for (const issue of parsedData.issues) {
        const workPri = normalizeWorkOrderPriorityLabel(issue.work_order_priority, issue.priority)
        const workCat = normalizeWorkOrderCategoryLabel(issue.work_order_category)
        issue.work_order_priority = workPri
        issue.work_order_category = workCat
        issue.priority = workOrderPriorityToInternal(workPri)
        issue.category = workOrderCategoryToInternal(workCat)
      }
      syncRootFromIssues(parsedData, parsedData.issues)
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

/** One ticket's AI metadata when the inbound message was split into multiple issues */
export function toAIMetadataForIssue(
  parsed: ParsedTicketData,
  issue: ParsedMaintenanceIssue,
  issueIndex: number,
  issueTotal: number
): AIMetadata {
  const sub =
    issue.work_order_subcategory ||
    parsed.extracted_data.subcategory ||
    undefined

  const reasoningParts = [parsed.reasoning?.trim(), issue.reasoning?.trim()].filter(Boolean)
  const combined = reasoningParts.join(' · ')
  const gemini_reasoning =
    issueTotal > 1 ? `[Issue ${issueIndex + 1}/${issueTotal}] ${combined}`.trim() : combined

  const meta: AIMetadata = {
    brief_description: issue.brief_description,
    problem_description: issue.problem_description,
    subcategory: typeof sub === 'string' ? sub : undefined,
    access_notes: parsed.extracted_data.access_notes || undefined,
    tenant_name: parsed.extracted_data.tenant_name || undefined,
    tenant_phone: parsed.extracted_data.tenant_phone || undefined,
    tenant_email: parsed.extracted_data.tenant_email || undefined,
    unit_number: parsed.extracted_data.unit_number || undefined,
    property_name: parsed.extracted_data.property_name || undefined,
    confidence_score: issue.confidence,
    parsed_at: new Date().toISOString(),
    gemini_reasoning,
    yardi_fields: {
      brief_description: issue.brief_description,
      problem_description: issue.problem_description,
      priority: issue.work_order_priority,
      category: issue.work_order_category,
      subcategory: typeof sub === 'string' ? sub : undefined,
    },
  }

  if (issueTotal > 1) {
    meta.inbound_split = { issue_index: issueIndex + 1, issue_total: issueTotal }
  }

  return meta
}

// Convert ParsedTicketData to AIMetadata format for database (first issue; use toAIMetadataForIssue when saving split tickets)
export function toAIMetadata(parsed: ParsedTicketData): AIMetadata {
  const first = parsed.issues?.[0]
  if (!first) {
    return toAIMetadataForIssue(parsed, normalizeSingleIssue(parsed, !!parsed.is_maintenance_related), 0, 1)
  }
  return toAIMetadataForIssue(parsed, first, 0, parsed.issues.length)
}
