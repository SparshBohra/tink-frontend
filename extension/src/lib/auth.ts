import { supabase, DASHBOARD_URLS, setDashboardUrl } from './supabase'
import { Profile, Organization } from '../types'

export interface AuthState {
  isAuthenticated: boolean
  loading: boolean
  profile: Profile | null
  organization: Organization | null
  organizationId: string | null
  error: string | null
}

// Active dashboard URL (set after checking which one has auth)
let activeDashboardUrl = DASHBOARD_URLS.production

// Try to get auth token from a specific URL's cookies
const getAuthFromUrl = async (url: string): Promise<string | null> => {
  try {
    const cookies = await chrome.cookies.getAll({ url })
    
    // Look for Supabase auth cookies
    for (const cookie of cookies) {
      if (cookie.name.includes('auth-token') || cookie.name.includes('sb-')) {
        if (cookie.name.endsWith('-auth-token')) {
          try {
            const parsed = JSON.parse(decodeURIComponent(cookie.value))
            if (parsed.access_token) {
              return parsed.access_token
            }
          } catch {
            // Not JSON, continue
          }
        }
      }
    }
    return null
  } catch (err) {
    console.error('Error reading cookies from', url, err)
    return null
  }
}

// Try to get auth token from either dashboard (local first, then production)
const getAuthFromDashboardCookies = async (): Promise<{ token: string | null, url: string }> => {
  // Try localhost first (for development)
  const localToken = await getAuthFromUrl(DASHBOARD_URLS.local)
  if (localToken) {
    return { token: localToken, url: DASHBOARD_URLS.local }
  }
  
  // Try production
  const prodToken = await getAuthFromUrl(DASHBOARD_URLS.production)
  if (prodToken) {
    return { token: prodToken, url: DASHBOARD_URLS.production }
  }
  
  return { token: null, url: DASHBOARD_URLS.production }
}

// Check if user is authenticated
export const checkAuth = async (): Promise<AuthState> => {
  try {
    // First check if we already have a session
    let { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // If no session, try to get from dashboard cookies (checks both local and prod)
    if (!session) {
      const { token, url } = await getAuthFromDashboardCookies()
      if (token) {
        // Set the active dashboard URL based on where we found auth
        activeDashboardUrl = url
        setDashboardUrl(url)
        
        // Try to set the session from the token
        const { data, error } = await supabase.auth.setSession({
          access_token: token,
          refresh_token: ''
        })
        if (!error && data.session) {
          session = data.session
        }
      }
    }
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return {
        isAuthenticated: false,
        loading: false,
        profile: null,
        organization: null,
        organizationId: null,
        error: sessionError.message
      }
    }
    
    if (!session) {
      return {
        isAuthenticated: false,
        loading: false,
        profile: null,
        organization: null,
        organizationId: null,
        error: null
      }
    }
    
    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    if (profileError || !profile) {
      console.error('Profile error:', profileError)
      return {
        isAuthenticated: true,
        loading: false,
        profile: null,
        organization: null,
        organizationId: null,
        error: 'Failed to load profile'
      }
    }
    
    // Fetch organization
    let organization: Organization | null = null
    if (profile.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .single()
      organization = org
    }
    
    return {
      isAuthenticated: true,
      loading: false,
      profile: profile as Profile,
      organization,
      organizationId: profile.organization_id,
      error: null
    }
  } catch (err) {
    console.error('Auth check error:', err)
    return {
      isAuthenticated: false,
      loading: false,
      profile: null,
      organization: null,
      organizationId: null,
      error: 'Authentication check failed'
    }
  }
}

// Get the current active dashboard URL
export const getActiveDashboardUrl = (): string => activeDashboardUrl

// Open dashboard login in new tab
export const openDashboardLogin = (): void => {
  chrome.tabs.create({ url: `${activeDashboardUrl}/auth/login` })
}

// Open dashboard settings in new tab
export const openDashboardSettings = (): void => {
  chrome.tabs.create({ url: `${activeDashboardUrl}/dashboard/tickets` })
}

// Open specific ticket in dashboard
export const openTicketInDashboard = (ticketId: string): void => {
  chrome.tabs.create({ url: `${activeDashboardUrl}/dashboard/tickets?ticket=${ticketId}` })
}

// Open full dashboard
export const openDashboard = (): void => {
  chrome.tabs.create({ url: `${activeDashboardUrl}/dashboard/tickets` })
}
