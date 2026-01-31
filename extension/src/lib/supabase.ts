import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://oubprrmcbyresbexpbuq.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91YnBycm1jYnlyZXNiZXhwYnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NDQ2OTUsImV4cCI6MjA4NTIyMDY5NX0.fNPd81uplwNJsISZZpyk_od1HukPEAQkOUJvNZ0gRoU'

// Dashboard URLs - extension checks both for auth
export const DASHBOARD_URLS = {
  local: 'http://localhost:3000',
  production: 'https://squareft.ai'
}

// Primary dashboard URL for opening links (will be set dynamically based on which has auth)
export let DASHBOARD_URL = DASHBOARD_URLS.production

// Update dashboard URL based on which environment has auth
export const setDashboardUrl = (url: string) => {
  DASHBOARD_URL = url
}

let supabaseInstance: SupabaseClient | null = null

export const getSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  }
  return supabaseInstance
}

export const supabase = getSupabase()
