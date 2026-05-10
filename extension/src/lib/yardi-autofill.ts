/**
 * Yardi Facility Manager + SquareFt mock page: detect fill targets and apply payload.
 * Kept in sync with `lib/yardi-autofill-payload.ts` (dashboard).
 */
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

function norm(s: string): string {
  return s.trim().toLowerCase()
}

export function isYardiFillTargetPage(href: string, doc: Document): boolean {
  try {
    const u = new URL(href)
    if (doc.querySelector('[data-squareft-yardi-mock="1"]')) {
      return true
    }
    if (
      (u.hostname === '127.0.0.1' || u.hostname === 'localhost') &&
      u.pathname.includes('yardi-work-order-mock')
    ) {
      return true
    }
    if (u.hostname.endsWith('elevate.cafe') && u.pathname.includes('facilitymanagernet')) {
      return true
    }
    const hasNgApp = doc.documentElement.getAttribute('data-ng-app') === 'app'
    const hasWorkOrderMarkers =
      !!doc.querySelector(
        '#textareaProblemDescription, textarea[name="problemDescription"], [id="textareaProblemDescription"]'
      ) && !!doc.querySelector('#headerLocation, h2.panel-title, [id="headerDescription"]')
    if (hasNgApp && hasWorkOrderMarkers) {
      return true
    }
    return false
  } catch {
    return false
  }
}

function setValueAndNotify(el: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  el.focus()
  el.value = value
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
  el.blur()
}

function pickSelectOptionByLabel(select: HTMLSelectElement, wanted: string): boolean {
  const w = norm(wanted)
  if (!w) return false
  for (const opt of Array.from(select.options)) {
    if (norm(opt.textContent || '') === w || norm(opt.value) === w) {
      select.value = opt.value
      select.dispatchEvent(new Event('input', { bubbles: true }))
      select.dispatchEvent(new Event('change', { bubbles: true }))
      return true
    }
  }
  for (const opt of Array.from(select.options)) {
    const t = norm(opt.textContent || '')
    if (t.includes(w) || w.includes(t)) {
      select.value = opt.value
      select.dispatchEvent(new Event('input', { bubbles: true }))
      select.dispatchEvent(new Event('change', { bubbles: true }))
      return true
    }
  }
  return false
}

function queryInput(
  doc: Document,
  selectors: string[]
): HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null {
  for (const sel of selectors) {
    const el = doc.querySelector(sel)
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
      return el
    }
  }
  return null
}

/** Apply autofill payload to the current document (main frame only). */
export function applyYardiAutofillToDocument(doc: Document, payload: YardiAutofillPayloadV1): void {
  const brief = queryInput(doc, ['#textBriefDescription', 'input[name="briefDescription"]'])
  if (brief && 'value' in brief) setValueAndNotify(brief as HTMLInputElement, payload.briefDescription)

  const prob = queryInput(doc, ['#textareaProblemDescription', 'textarea[name="problemDescription"]'])
  if (prob instanceof HTMLTextAreaElement) setValueAndNotify(prob, payload.problemDescription)

  const name = queryInput(doc, ['#textCallerName', 'input[name="callerName"]'])
  if (name instanceof HTMLInputElement) setValueAndNotify(name, payload.callerName)

  const phone = queryInput(doc, ['#textCallerPhone', 'input[name="callerPhone"]'])
  if (phone instanceof HTMLInputElement) setValueAndNotify(phone, payload.callerPhone)

  const email = queryInput(doc, ['#emailCallerEmail', 'input[name="emailinput"]'])
  if (email instanceof HTMLInputElement) setValueAndNotify(email, payload.callerEmail)

  const access = queryInput(doc, ['#textAccessNotes', 'textarea[name="accessNotes"]'])
  if (access instanceof HTMLTextAreaElement) setValueAndNotify(access, payload.accessNotes)

  const pri = doc.querySelector('#ddPriority, select[name="priority"]')
  if (pri instanceof HTMLSelectElement && payload.priority) {
    pickSelectOptionByLabel(pri, payload.priority) ||
      [...pri.options].some((o) => {
        if (o.value === payload.priority || o.textContent?.trim() === payload.priority) {
          pri.value = o.value
          pri.dispatchEvent(new Event('change', { bubbles: true }))
          return true
        }
        return false
      })
  }

  const cat = doc.querySelector('#ddCategory, select[name="category"]')
  if (cat instanceof HTMLSelectElement && payload.category) {
    pickSelectOptionByLabel(cat, payload.category)
  }

  const sub = doc.querySelector('#ddSubcategory, select[name="subcategory"]')
  if (sub instanceof HTMLSelectElement && payload.subcategory) {
    pickSelectOptionByLabel(sub, payload.subcategory)
  }

  const unit = queryInput(doc, ['#acUnit', 'input[name="unit"]'])
  if (unit instanceof HTMLInputElement && payload.unitLabel) {
    setValueAndNotify(unit, payload.unitLabel)
  }

  const loc = queryInput(doc, ['#acLocation', 'input[name="location"]'])
  if (loc instanceof HTMLInputElement && payload.locationHint) {
    setValueAndNotify(loc, payload.locationHint)
  }
}
