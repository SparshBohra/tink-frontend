/**
 * Match Twilio "From" numbers to org_contacts.contact_value, which may be stored
 * as +1..., digits-only, or other user-entered shapes.
 */
export function phoneLookupVariants(raw: string): string[] {
  const t = (raw || '').trim()
  if (!t) return []

  const digits = t.replace(/\D/g, '')
  const out = new Set<string>()

  out.add(t)
  if (digits.length >= 10) {
    const last10 = digits.slice(-10)
    out.add(last10)
    out.add(`+1${last10}`)
    out.add(`1${last10}`)
    if (digits.length === 11 && digits.startsWith('1')) {
      out.add(`+${digits}`)
    }
    if (digits.length === 10) {
      out.add(`+${digits}`)
    }
  }
  return [...out].filter(Boolean)
}
