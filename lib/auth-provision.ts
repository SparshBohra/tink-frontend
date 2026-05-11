import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

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

/**
 * Create organization + profile + org_contacts when auth.users exists but public.profile was wiped.
 */
export async function provisionProfileForUser(
  user: User,
  opts: { fullName: string; orgName?: string; phone?: string | null }
): Promise<{ created: boolean; error?: string }> {
  const email = user.email?.toLowerCase()
  if (!email) return { created: false, error: 'missing_email' }

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (existing) return { created: false }

  const displayName = (opts.fullName || '').trim() || email.split('@')[0]
  const orgTitle =
    (opts.orgName && opts.orgName.trim()) || `${displayName}'s Organization`
  const baseSlug = slugifyOrgName(orgTitle)
  const slug = `${baseSlug}-${user.id.replace(/-/g, '').slice(0, 12)}`

  const { data: newOrg, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: orgTitle,
      slug,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .select()
    .single()

  if (orgError || !newOrg) {
    console.error('provisionProfileForUser org error:', orgError)
    return { created: false, error: orgError?.message || 'org_failed' }
  }

  const orgId = (newOrg as { id: string }).id
  const phoneE164 = formatPhoneE164US(opts.phone ?? null)

  const { error: profileError } = await supabase.from('profiles').insert({
    id: user.id,
    email,
    full_name: displayName,
    organization_id: orgId,
    role: 'admin',
    phone: phoneE164 || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as never)

  if (profileError) {
    console.error('provisionProfileForUser profile error:', profileError)
    return { created: false, error: profileError.message }
  }

  const contacts: Record<string, unknown>[] = [
    {
      organization_id: orgId,
      contact_type: 'email',
      contact_value: email,
      label: `${displayName} - Email`,
      is_verified: true,
      created_by: user.id,
    },
  ]
  if (phoneE164) {
    contacts.push({
      organization_id: orgId,
      contact_type: 'phone',
      contact_value: phoneE164,
      label: `${displayName} - Phone`,
      is_verified: true,
      created_by: user.id,
    })
  }

  const { error: contactsError } = await supabase.from('org_contacts').insert(contacts as never)
  if (contactsError) {
    console.warn('provisionProfileForUser org_contacts warning:', contactsError)
  }

  return { created: true }
}
