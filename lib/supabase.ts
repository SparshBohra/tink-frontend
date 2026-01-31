import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase-types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Determine cookie domain for local development with subdomains
const getCookieDomain = () => {
  if (typeof window === 'undefined') return undefined
  const hostname = window.location.hostname
  // For localhost subdomains (e.g., app.localhost), use .localhost
  if (hostname.endsWith('.localhost') || hostname === 'localhost') {
    return '.localhost'
  }
  // For production, use the root domain
  const parts = hostname.split('.')
  if (parts.length >= 2) {
    return '.' + parts.slice(-2).join('.')
  }
  return undefined
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// Helper to get the current user's organization_id
export async function getOrganizationId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()
  
  return profile?.organization_id || null
}
