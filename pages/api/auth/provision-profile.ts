import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../../lib/supabase-types'
import { slugifyOrgName, formatPhoneE164US } from '../../../lib/auth-helpers'

/**
 * Creates organization + profile + org_contacts for the JWT subject.
 * Uses service role so RLS cannot block first-time signup inserts.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error('provision-profile: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    return res.status(500).json({ error: 'server_misconfigured' })
  }

  const authHeader = req.headers.authorization
  const token =
    typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : null

  if (!token) {
    return res.status(401).json({ error: 'missing_bearer_token' })
  }

  const admin = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const {
    data: { user },
    error: userErr,
  } = await admin.auth.getUser(token)

  if (userErr || !user) {
    return res.status(401).json({ error: 'invalid_token' })
  }

  const email = user.email?.toLowerCase()
  if (!email) {
    return res.status(400).json({ error: 'missing_email' })
  }

  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (existing) {
    return res.status(200).json({ created: false, reason: 'already_exists' })
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const meta = user.user_metadata || {}

  const fullName =
    (typeof body.fullName === 'string' && body.fullName.trim()) ||
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.fullName === 'string' && meta.fullName) ||
    email.split('@')[0] ||
    'User'

  const orgName =
    (typeof body.orgName === 'string' && body.orgName.trim()) ||
    (typeof meta.org_name === 'string' && meta.org_name) ||
    (typeof meta.orgName === 'string' && meta.orgName) ||
    undefined

  const phoneRaw =
    (typeof body.phone === 'string' && body.phone) ||
    (typeof meta.phone === 'string' && meta.phone) ||
    null

  const displayName = fullName.trim() || email.split('@')[0]
  const orgTitle = orgName || `${displayName}'s Organization`
  const baseSlug = slugifyOrgName(orgTitle)
  const slug = `${baseSlug}-${user.id.replace(/-/g, '').slice(0, 12)}`

  const { data: newOrg, error: orgError } = await admin
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
    console.error('provision-profile org error:', orgError)
    return res.status(500).json({ error: orgError?.message || 'org_failed' })
  }

  const orgId = (newOrg as { id: string }).id
  const phoneE164 = formatPhoneE164US(phoneRaw)

  const { error: profileError } = await admin.from('profiles').insert({
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
    console.error('provision-profile profile error:', profileError)
    return res.status(500).json({ error: profileError.message })
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

  const { error: contactsError } = await admin.from('org_contacts').insert(contacts as never)
  if (contactsError) {
    console.warn('provision-profile org_contacts warning:', contactsError)
  }

  return res.status(200).json({ created: true })
}
