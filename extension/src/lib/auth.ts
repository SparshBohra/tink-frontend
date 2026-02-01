import { supabase, DASHBOARD_URLS } from './supabase'
import { Profile, Organization } from '../types'

export interface AuthState {
  isAuthenticated: boolean
  loading: boolean
  profile: Profile | null
  organization: Organization | null
  organizationId: string | null
  error: string | null
}

// Active dashboard URL
let activeDashboardUrl = DASHBOARD_URLS.production

// Check if user is authenticated (uses extension's own session)
export const checkAuth = async (): Promise<AuthState> => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return {
        isAuthenticated: false,
        loading: false,
        profile: null,
        organization: null,
        organizationId: null,
        error: null // Don't show error, just show login
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
      error: null
    }
  }
}

// Sign out from extension
export const signOut = async (): Promise<void> => {
  await supabase.auth.signOut()
}

// Listen for auth state changes
export const onAuthStateChange = (callback: (isAuthenticated: boolean) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(!!session)
  })
}

// Set active dashboard URL
export const setActiveDashboardUrl = (isLocal: boolean) => {
  activeDashboardUrl = isLocal ? DASHBOARD_URLS.local : DASHBOARD_URLS.production
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
