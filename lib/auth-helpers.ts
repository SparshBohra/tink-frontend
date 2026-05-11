export function slugifyOrgName(name: string): string {
  const s = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return s || 'org'
}

export function formatPhoneE164US(phone: string | null | undefined): string | undefined {
  if (!phone?.trim()) return undefined
  const trimmed = phone.trim()
  let digits = trimmed.replace(/\D/g, '')
  if (digits && !digits.startsWith('1') && digits.length === 10) {
    digits = '1' + digits
  }
  if (!digits) return undefined
  return trimmed.startsWith('+') ? trimmed : `+${digits}`
}
