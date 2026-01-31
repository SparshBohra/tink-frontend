import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './supabase-types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client with SSR support
// This stores PKCE code verifier in cookies instead of localStorage
// which works better with SSR and cross-tab scenarios
export const supabase = createBrowserClient<Database>(
  supabaseUrl, 
  supabaseAnonKey
)

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
