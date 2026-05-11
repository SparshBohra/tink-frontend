import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { slugifyOrgName, formatPhoneE164US } from './auth-helpers'

export { slugifyOrgName, formatPhoneE164US }

/**
 * Create organization + profile + org_contacts when auth.users exists but public.profile was wiped.
 * Uses POST /api/auth/provision-profile (service role) so RLS cannot block inserts.
 */
export async function provisionProfileForUser(
  user: User,
  opts: { fullName: string; orgName?: string; phone?: string | null },
  accessToken?: string | null
): Promise<{ created: boolean; error?: string }> {
  let token = accessToken?.trim() || null
  if (!token) {
    const { data: { session } } = await supabase.auth.getSession()
    token = session?.access_token || null
  }
  if (!token) {
    return { created: false, error: 'no_session' }
  }

  const base =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || ''

  if (!base) {
    return { created: false, error: 'no_origin' }
  }

  try {
    const r = await fetch(`${base}/api/auth/provision-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fullName: opts.fullName,
        orgName: opts.orgName,
        phone: opts.phone ?? undefined,
      }),
    })

    const json = (await r.json().catch(() => ({}))) as {
      created?: boolean
      reason?: string
      error?: string
    }

    if (!r.ok) {
      return { created: false, error: json.error || `provision_http_${r.status}` }
    }

    if (json.reason === 'already_exists') {
      return { created: false }
    }

    return { created: !!json.created }
  } catch (e) {
    console.error('provisionProfileForUser fetch error:', e)
    return { created: false, error: String(e) }
  }
}
