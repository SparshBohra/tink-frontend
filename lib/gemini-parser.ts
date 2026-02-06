// ===================================================================
// Gemini AI Parser for Maintenance Tickets
// Uses Google's Gemini API to extract structured data from messages
// ===================================================================

import { TicketPriority, TicketCategory, AIMetadata } from './supabase-types'

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
  return `You are a maintenance ticket parser for property management. Your job is to determine if a message is a legitimate maintenance request and extract structured data.

**CRITICAL**: Return ONLY valid JSON. No markdown formatting, no code blocks, no explanations outside the JSON.

**Required JSON Structure:**
{
  "is_maintenance_related": boolean (true if this is a legitimate maintenance/repair request),
  "message_type": "maintenance|spam|personal|marketing|automated|unclear",
  "title": "string (max 100 chars, brief summary)",
  "description": "string (full problem description)",
  "priority": "emergency|high|medium|low",
  "category": "hvac|heating|cooling|plumbing|electrical|appliance|access_control|pest|general",
  "confidence": number (0.0-1.0, how confident you are in the categorization),
  "reasoning": "string (1-2 sentences explaining your classification)",
  "extracted_data": {
    "tenant_name": "string or null",
    "tenant_phone": "string or null (format: +1234567890 if found)",
    "tenant_email": "string or null",
    "unit_number": "string or null (e.g., 'Unit 5', 'Apt 302', '2B')",
    "property_name": "string or null",
    "access_notes": "string or null (any instructions about accessing the unit)",
    "subcategory": "string or null (specific issue like 'no heat', 'clogged drain')"
  }
}

**Message Type Classification:**
- **maintenance**: Legitimate maintenance, repair, or issue request
- **spam**: Advertisements, scams, phishing, mass marketing
- **personal**: Personal conversations, non-business messages, social chatter
- **marketing**: Business promotions, newsletters, vendor outreach
- **automated**: System notifications, auto-replies, out-of-office messages
- **unclear**: Cannot determine (very short messages, cryptic content)

**SPAM Indicators:**
- Marketing language ("Buy now", "Limited offer", "Click here")
- Cryptocurrency, get-rich-quick schemes
- Suspicious links or requests for personal info
- Mass email templates
- Unrelated to property management

**NON-MAINTENANCE Indicators:**
- Social conversations ("How are you?", "Thanks!", "See you later")
- Vendor quotes/invoices (unless reporting an issue)
- General questions about rent, lease, amenities
- Meeting requests, scheduling
- Auto-replies and system notifications

**MAINTENANCE Indicators:**
- Reports of broken items, issues, problems
- Requests for repairs or fixes
- Safety concerns
- Urgent situations (leaks, no heat, etc.)
- References to appliances, systems, building issues

**Priority Classification Rules** (only if is_maintenance_related = true):
- **emergency**: Life/safety issues or total system failures
  * No heat in winter (below 50°F outside)
  * No AC in extreme heat (above 90°F)
  * Flooding, water gushing, sewage backup
  * Gas leak, fire hazard, carbon monoxide
  * Total power outage
  * Locked out with no entry method
  * Broken/unsafe stairs, collapsed ceiling
  
- **high**: Major inconvenience but not life-threatening
  * No hot water (heat works)
  * AC broken in summer (not extreme heat)
  * Refrigerator/freezer broken (food spoilage)
  * Major leak (not flooding but significant)
  * Broken locks, security concerns
  * Partial power outage (some circuits work)
  * Heating/AC partially working but inadequate
  
- **medium**: Moderate issues affecting quality of life
  * Appliance malfunctions (dishwasher, stove, microwave)
  * Minor leaks (dripping faucet, slow drain)
  * Pest sightings (roaches, mice, bedbugs)
  * HVAC making noise but still working
  * Broken windows (not security issue)
  * Light fixtures out
  
- **low**: Cosmetic or non-urgent issues
  * Paint/drywall damage
  * Cabinet/door adjustments
  * Routine maintenance requests
  * Aesthetic improvements
  * Minor cosmetic repairs

**Category Guidelines** (only if is_maintenance_related = true):
- **hvac**: General heating/cooling issues, thermostats, vents
- **heating**: Specifically no heat or furnace problems
- **cooling**: Specifically no AC or cooling problems  
- **plumbing**: Water leaks, drains, toilets, sinks, pipes
- **electrical**: Power, outlets, lights, breakers
- **appliance**: Refrigerator, stove, dishwasher, washer/dryer
- **access_control**: Locks, keys, gates, garage doors
- **pest**: Bugs, rodents, pest control issues
- **general**: Everything else or unclear category

**Important Rules:**
- If is_maintenance_related = false, still provide title/description but priority/category are less important
- Be conservative - if unsure if it's maintenance, mark as unclear or personal
- Short messages like "Thanks" or "OK" are personal, not maintenance
- Vendor emails offering services are marketing, not maintenance
- Only mark as maintenance if they're reporting an actual problem/issue

**Extraction Tips:**
- Unit numbers: Look for "Apt", "Unit", "Suite", numbers with letters like "2B"
- Names: Usually at start/end of message or in signature
- Phone/email: Standard formats
- Access: Key location, gate codes, entry instructions
- Be conservative with confidence - if unsure, lower the score

---
**MESSAGE TO PARSE:**
${rawMessage}
---

**JSON OUTPUT:**`
}

// Parse Gemini's response and handle edge cases
function parseGeminiResponse(rawResponse: string): ParsedTicketData | null {
  // Clean up the response first
  let cleanedResponse = rawResponse.trim()
  
  try {
    // Try direct JSON parse first
    const parsed = JSON.parse(cleanedResponse)
    return validateAndNormalizeData(parsed)
  } catch (error) {
    console.error('Failed to parse Gemini response directly:', error)
    console.error('Raw response length:', rawResponse.length)
    console.error('First 200 chars:', rawResponse.substring(0, 200))
    
    // Strategy 1: Try to extract JSON from markdown code block
    const jsonMatch1 = cleanedResponse.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonMatch1) {
      try {
        console.log('Found JSON in markdown code block, attempting parse...')
        const parsed = JSON.parse(jsonMatch1[1].trim())
        return validateAndNormalizeData(parsed)
      } catch (e) {
        console.error('Failed to parse JSON from markdown block')
      }
    }
    
    // Strategy 2: Try to extract JSON from generic code block
    const jsonMatch2 = cleanedResponse.match(/```\s*([\s\S]*?)\s*```/)
    if (jsonMatch2) {
      try {
        console.log('Found content in generic code block, attempting parse...')
        const parsed = JSON.parse(jsonMatch2[1].trim())
        return validateAndNormalizeData(parsed)
      } catch (e) {
        console.error('Failed to parse JSON from generic code block')
      }
    }
    
    // Strategy 3: Look for JSON object anywhere in the response
    const jsonMatch3 = cleanedResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch3) {
      try {
        console.log('Found JSON-like content, attempting parse...')
        const parsed = JSON.parse(jsonMatch3[0])
        return validateAndNormalizeData(parsed)
      } catch (e) {
        console.error('Failed to parse extracted JSON-like content')
      }
    }
    
    // Strategy 4: Try to remove any leading/trailing text before/after JSON
    try {
      const firstBrace = cleanedResponse.indexOf('{')
      const lastBrace = cleanedResponse.lastIndexOf('}')
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const jsonContent = cleanedResponse.substring(firstBrace, lastBrace + 1)
        console.log('Extracted JSON by brace positions, attempting parse...')
        const parsed = JSON.parse(jsonContent)
        return validateAndNormalizeData(parsed)
      }
    } catch (e) {
      console.error('Failed to parse JSON by brace extraction')
    }
    
    console.error('All parsing strategies failed')
    return null
  }
}

// Helper function to validate and normalize parsed data
function validateAndNormalizeData(parsed: any): ParsedTicketData {
  // Validate required fields
  if (parsed.is_maintenance_related === undefined || 
      !parsed.message_type ||
      !parsed.title || 
      !parsed.description) {
    throw new Error('Missing required fields in Gemini response')
  }
  
  // If not maintenance related, confidence should be lower and we don't care about priority/category accuracy
  if (!parsed.is_maintenance_related) {
    console.log(`Non-maintenance message detected: ${parsed.message_type}`)
  }
  
  // Validate priority (only important if maintenance-related)
  const validPriorities: TicketPriority[] = ['low', 'medium', 'high', 'emergency']
  if (!validPriorities.includes(parsed.priority)) {
    console.warn(`Invalid priority: ${parsed.priority}, defaulting to medium`)
    parsed.priority = 'medium'
  }
  
  // Validate category (only important if maintenance-related)
  const validCategories: TicketCategory[] = [
    'hvac', 'heating', 'cooling', 'plumbing', 'electrical', 
    'appliance', 'access_control', 'pest', 'general'
  ]
  if (!validCategories.includes(parsed.category)) {
    console.warn(`Invalid category: ${parsed.category}, defaulting to general`)
    parsed.category = 'general'
  }
  
  // Validate message_type
  const validTypes = ['maintenance', 'spam', 'personal', 'marketing', 'automated', 'unclear']
  if (!validTypes.includes(parsed.message_type)) {
    console.warn(`Invalid message_type: ${parsed.message_type}, defaulting to unclear`)
    parsed.message_type = 'unclear'
  }
  
  // Ensure confidence is between 0 and 1
  if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
    parsed.confidence = 0.5 // Default to moderate confidence
  }
  
  // Ensure extracted_data exists
  if (!parsed.extracted_data) {
    parsed.extracted_data = {}
  }
  
  return parsed as ParsedTicketData
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
              maxOutputTokens: 2048,
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
  
  // Limit message length (Gemini has token limits)
  const truncatedMessage = rawMessage.slice(0, 10000)
  
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
  return {
    subcategory: parsed.extracted_data.subcategory || undefined,
    access_notes: parsed.extracted_data.access_notes || undefined,
    tenant_name: parsed.extracted_data.tenant_name || undefined,
    tenant_phone: parsed.extracted_data.tenant_phone || undefined,
    tenant_email: parsed.extracted_data.tenant_email || undefined,
    unit_number: parsed.extracted_data.unit_number || undefined,
    property_name: parsed.extracted_data.property_name || undefined,
    confidence_score: parsed.confidence,
    parsed_at: new Date().toISOString(),
    gemini_reasoning: parsed.reasoning
  }
}
