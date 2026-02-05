import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/router'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { Profile, Organization } from './supabase-types'
import { activityLogger } from './activity-logger'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  organization: Organization | null
  organizationId: string | null
  loading: boolean
  error: string | null
  
  // Auth methods
  signUp: (email: string, password: string, fullName: string, orgName?: string, phone?: string) => Promise<{ requiresConfirmation?: boolean; email?: string } | null>
  signIn: (email: string, password: string) => Promise<void>
  signInWithMagicLink: (email: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  signOut: () => Promise<void>
  
  // Data refresh
  refreshProfile: () => Promise<void>
  
  // State helpers
  isAuthenticated: boolean
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function SupabaseAuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  // Fetch user profile and organization - optimized with single query
  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile with organization in a single query using join
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('id', userId)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError)
        return
      }

      if (profileData) {
        // Extract organization from nested result
        const { organization, ...profile } = profileData
        setProfile(profile as Profile)
        
        if (organization) {
          setOrganization(organization as Organization)
        }

        // Set activity logger user context
        activityLogger.setUser(userId, profile.organization_id)
      }
    } catch (err) {
      console.error('Error fetching user data:', err)
    }
  }

  // Initialize auth state with timeout
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if we're on a logout/clear page - if so, don't restore session
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search)
          const isLogoutFlag = localStorage.getItem('squareft_logging_out') === 'true'
          const isLogoutRequest = urlParams.get('clear') === 'true' || 
                                   urlParams.get('logout') === 'true' ||
                                   urlParams.get('reload') === 'done' ||
                                   window.location.pathname.includes('/auth/logout') ||
                                   isLogoutFlag
          
          if (isLogoutRequest) {
            // On logout page with clear params - don't try to restore session
            console.log('Logout request detected, skipping session restore')
            setIsLoggingOut(true)
            setLoading(false)
            return
          }
          
          // Clear any stale logout flag if we're on login page (fresh start)
          if (window.location.pathname === '/auth/login' && !urlParams.get('clear') && !urlParams.get('logout')) {
            localStorage.removeItem('squareft_logging_out')
          }
        }
        
        // For auth pages, skip the session check to show form immediately
        const isAuthPage = window.location.pathname.startsWith('/auth/')
        if (isAuthPage) {
          // Just check if session exists, don't fetch user data
          const { data: { session: currentSession } } = await supabase.auth.getSession()
          if (currentSession) {
            setSession(currentSession)
            setUser(currentSession.user)
            // On auth pages with session, redirect to dashboard
            if (window.location.pathname === '/auth/login') {
              window.location.href = '/dashboard/tickets'
              return
            }
          }
          setLoading(false)
          return
        }
        
        // For dashboard/other pages, fetch full user data
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        
        if (currentSession) {
          setSession(currentSession)
          setUser(currentSession.user)
          await fetchUserData(currentSession.user.id)
        }
      } catch (err) {
        console.error('Error initializing auth:', err)
        // On error, just show login - don't stay stuck
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event, 'isLoggingOut:', isLoggingOut)
        
        // Check if we're on a logout page or actively logging out - don't restore session
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search)
          const isLogoutFlag = localStorage.getItem('squareft_logging_out') === 'true'
          const isLogoutRequest = urlParams.get('clear') === 'true' || 
                                   urlParams.get('logout') === 'true' ||
                                   urlParams.get('reload') === 'done' ||
                                   window.location.pathname.includes('/auth/logout') ||
                                   isLogoutFlag
          
          if (isLogoutRequest || isLoggingOut) {
            console.log('Logout in progress - ignoring auth state change:', event)
            setSession(null)
            setUser(null)
            setProfile(null)
            setOrganization(null)
            setLoading(false)
            return
          }
        }
        
        // Handle SIGNED_OUT event - redirect to login
        if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
          setProfile(null)
          setOrganization(null)
          setLoading(false)
          // Redirect to login if not already there
          if (!window.location.pathname.includes('/auth/')) {
            window.location.href = '/auth/login'
          }
          return
        }
        
        // Only process SIGNED_IN if not logging out
        if (event === 'SIGNED_IN' && isLoggingOut) {
          console.log('Ignoring SIGNED_IN during logout')
          return
        }
        
        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (newSession?.user) {
          // For auth pages, don't block on user data
          const isAuthPage = window.location.pathname.startsWith('/auth/')
          if (isAuthPage) {
            setLoading(false)
          } else {
            // For dashboard, wait for user data
            await fetchUserData(newSession.user.id)
            setLoading(false)
          }
        } else {
          setProfile(null)
          setOrganization(null)
          setLoading(false)
        }
      }
    )
    
    // Listen for cross-tab logout via storage events
    const handleStorageChange = (e: StorageEvent) => {
      // Supabase stores auth in localStorage with key pattern sb-*-auth-token
      if (e.key?.includes('auth-token') && e.newValue === null) {
        console.log('Cross-tab logout detected via storage')
        setSession(null)
        setUser(null)
        setProfile(null)
        setOrganization(null)
        // Redirect to login
        if (!window.location.pathname.includes('/auth/')) {
          window.location.href = '/auth/login'
        }
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Listen for cross-tab logout via BroadcastChannel (more reliable)
    let bc: BroadcastChannel | null = null
    try {
      bc = new BroadcastChannel('squareft_auth')
      bc.onmessage = (event) => {
        if (event.data?.type === 'LOGOUT') {
          console.log('Cross-tab logout detected via BroadcastChannel')
          setSession(null)
          setUser(null)
          setProfile(null)
          setOrganization(null)
          // Redirect to login
          if (!window.location.pathname.includes('/auth/')) {
            window.location.href = '/auth/login'
          }
        }
      }
    } catch (e) {
      console.log('BroadcastChannel not supported')
    }

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('storage', handleStorageChange)
      if (bc) bc.close()
    }
  }, [])

  const clearError = () => setError(null)

  const handleAuthError = (err: AuthError | Error | unknown): string => {
    if (err instanceof Error) {
      return err.message
    }
    return 'An unexpected error occurred'
  }

  // Sign up with email/password
  const signUp = async (email: string, password: string, fullName: string, orgName?: string, phone?: string) => {
    try {
      setLoading(true)
      setError(null)

      // First, check if a profile with this email already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email.toLowerCase())
        .maybeSingle()
      
      if (existingProfile) {
        setError('An account with this email already exists. Please sign in instead.')
        setLoading(false)
        return null
      }

      // Create auth user with email redirect to login page
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            org_name: orgName, // Store for profile creation after confirmation
            phone: phone // Store phone for org_contacts creation
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')

      // Check if user already exists
      // Supabase returns user with empty identities for existing confirmed users
      // For existing unconfirmed users, it returns the existing user without creating a new one
      const isExistingUser = authData.user.identities && authData.user.identities.length === 0
      
      if (isExistingUser) {
        // User already exists and is confirmed
        setError('An account with this email already exists. Please sign in instead, or use "Forgot password" to reset your password.')
        setLoading(false)
        return null
      }

      // EMAIL CONFIRMATION IS DISABLED IN SUPABASE
      // Proceed directly to create all data regardless of session state
      console.log('=== SIGNUP: Creating user data ===')
      console.log('User ID:', authData.user.id)
      console.log('Full Name:', fullName)
      console.log('Org Name:', orgName)
      console.log('Phone:', phone)
      console.log('Session present:', !!authData.session)
      
      // Small delay to ensure auth is fully established
      await new Promise(resolve => setTimeout(resolve, 500))
      
      let orgId: string | null = null
      const errors: string[] = []
      
      // STEP 1: Create organization if provided
      if (orgName) {
        const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        console.log('SIGNUP Step 1: Creating organization with slug:', slug)
        
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: orgName,
            slug: slug
          })
          .select()
          .single()

        if (orgError) {
          console.error('SIGNUP ERROR: Failed to create organization:', orgError)
          errors.push(`Org creation failed: ${orgError.message}`)
          
          // Try to check if org with this slug exists and use it
          const { data: existingOrg } = await supabase
            .from('organizations')
            .select('id')
            .eq('slug', slug)
            .single()
          
          if (existingOrg) {
            console.log('SIGNUP: Using existing organization:', existingOrg.id)
            orgId = existingOrg.id
          }
        } else if (orgData) {
          orgId = orgData.id
          console.log('SIGNUP SUCCESS: Created organization:', orgId)
        }
      }

      // STEP 2: Create or update profile FIRST (before org_contacts due to FK constraint)
      console.log('SIGNUP Step 2: Creating/updating profile...')
      const { data: existingProfileCheck, error: checkError } = await supabase
        .from('profiles')
        .select('id, full_name, organization_id')
        .eq('id', authData.user.id)
        .maybeSingle()

      if (checkError) {
        console.log('SIGNUP: Profile check error (may be normal):', checkError)
      }

      if (existingProfileCheck) {
        console.log('SIGNUP: Profile already exists, updating it:', existingProfileCheck)
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            email: email,
            full_name: fullName,
            organization_id: orgId || existingProfileCheck.organization_id,
            phone: phone || null,
            role: 'pm'
          })
          .eq('id', authData.user.id)
        
        if (updateError) {
          console.error('SIGNUP ERROR: Failed to update profile:', updateError)
          errors.push(`Profile update failed: ${updateError.message}`)
        } else {
          console.log('SIGNUP SUCCESS: Profile updated')
        }
      } else {
        // Create new profile
        console.log('SIGNUP: Creating new profile with id:', authData.user.id)
        const { error: profileError, data: newProfile } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: email,
            full_name: fullName,
            organization_id: orgId,
            phone: phone || null,
            role: 'pm'
          })
          .select()
          .single()

        if (profileError) {
          console.error('SIGNUP ERROR: Failed to create profile:', profileError)
          errors.push(`Profile creation failed: ${profileError.message}`)
        } else {
          console.log('SIGNUP SUCCESS: Profile created:', newProfile)
        }
      }

      // STEP 3: Create org_contacts AFTER profile exists (due to FK on created_by)
      if (orgId) {
        console.log('SIGNUP Step 3: Creating org_contacts...')
        const contactsToCreate: any[] = [
          {
            organization_id: orgId,
            contact_type: 'email',
            contact_value: email.toLowerCase(),
            label: `${fullName} - Email`,
            is_verified: false,
            created_by: authData.user.id
          }
        ]
        
        if (phone) {
          contactsToCreate.push({
            organization_id: orgId,
            contact_type: 'phone',
            contact_value: phone,
            label: `${fullName} - Phone`,
            is_verified: false,
            created_by: authData.user.id
          })
        }
        
        console.log('SIGNUP: Org contacts to create:', contactsToCreate.length)
        const { error: contactsError, data: contactsData } = await supabase
          .from('org_contacts')
          .insert(contactsToCreate)
          .select()
        
        if (contactsError) {
          console.error('SIGNUP ERROR: Failed to create org contacts:', contactsError)
          errors.push(`Org contacts failed: ${contactsError.message}`)
        } else {
          console.log('SIGNUP SUCCESS: Org contacts created:', contactsData?.length)
        }
      } else {
        console.log('SIGNUP: Skipping org_contacts (no orgId)')
      }
      
      // Log any errors that occurred
      if (errors.length > 0) {
        console.error('SIGNUP ERRORS:', errors)
        // Show errors to user for debugging
        if (typeof window !== 'undefined') {
          console.warn('SIGNUP ERRORS (visible):', errors.join(', '))
        }
      }

      // Step 4: Verify the profile was created correctly
      const { data: verifyProfile, error: verifyError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()
      
      console.log('Profile verification:', verifyProfile, verifyError)

      // Step 5: Update local state before redirect
      if (verifyProfile) {
        setProfile(verifyProfile as any)
        setUser(authData.user)
        setSession(authData.session)
        
        if (verifyProfile.organization_id) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', verifyProfile.organization_id)
            .single()
          
          if (orgData) {
            setOrganization(orgData as any)
          }
        }
      }

      // Use window.location for reliable redirect
      // Add a timestamp to force reload if needed
      window.location.href = '/dashboard/tickets?signup=success&t=' + Date.now()
      return { requiresConfirmation: false }
    } catch (err) {
      console.error('Sign up error:', err)
      setError(handleAuthError(err))
      return null
    } finally {
      setLoading(false)
    }
  }

  // Sign in with email/password
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        const errorMsg = handleAuthError(authError)
        setError(errorMsg)
        activityLogger.logLoginFailed(errorMsg)
        setLoading(false)
        return // Don't throw - let UI handle the error state
      }

      if (data.user && data.session) {
        // Set session and user
        setSession(data.session)
        setUser(data.user)
        
        // Log successful login
        activityLogger.logLogin('password')
        
        // Fetch user data before redirect so dashboard has it
        await fetchUserData(data.user.id)
        
        // Redirect to dashboard
        window.location.href = '/dashboard/tickets'
      } else {
        setLoading(false)
      }
    } catch (err) {
      console.error('Sign in error:', err)
      const errorMsg = handleAuthError(err)
      setError(errorMsg)
      activityLogger.logLoginFailed(errorMsg)
      setLoading(false)
      // Don't throw - let UI handle the error state
    } finally {
      setLoading(false)
    }
  }

  // Sign in with magic link
  const signInWithMagicLink = async (email: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?type=magiclink`
        }
      })

      if (authError) {
        setError(handleAuthError(authError))
        setLoading(false)
        return false
      }
      
      // Log magic link sent
      activityLogger.logMagicLinkSent(email)
      setLoading(false)
      return true
    } catch (err) {
      console.error('Magic link error:', err)
      setError(handleAuthError(err))
      setLoading(false)
      return false
    }
  }

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`
      })

      if (authError) {
        setError(handleAuthError(authError))
        setLoading(false)
        return false
      }
      
      // Log password reset requested
      activityLogger.logPasswordResetRequested(email)
      setLoading(false)
      return true
    } catch (err) {
      console.error('Password reset error:', err)
      setError(handleAuthError(err))
      setLoading(false)
      return false
    }
  }

  // Sign out - aggressive clear of all auth state
  const signOut = async () => {
    try {
      setError(null)
      setLoading(true)
      setIsLoggingOut(true)
      
      // Set a localStorage flag to persist across page loads
      localStorage.setItem('squareft_logging_out', 'true')

      // Use the dedicated logout route for a clean exit
      window.location.href = '/auth/logout'
    } catch (err) {
      console.error('Sign out error:', err)
      window.location.href = '/auth/logout'
    }
  }

  // Refresh profile data
  const refreshProfile = async () => {
    if (user?.id) {
      await fetchUserData(user.id)
    }
  }

  const value: AuthContextType = {
    user,
    session,
    profile,
    organization,
    organizationId: profile?.organization_id || null,
    loading,
    error,
    signUp,
    signIn,
    signInWithMagicLink,
    resetPassword,
    signOut,
    refreshProfile,
    isAuthenticated: !!user && !!session,
    clearError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useSupabaseAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider')
  }
  return context
}

// HOC for protected routes
export function withSupabaseAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  const AuthenticatedComponent = (props: P) => {
    const { isAuthenticated, loading } = useSupabaseAuth()

    useEffect(() => {
      if (!loading && !isAuthenticated) {
        window.location.href = '/auth/login'
      }
    }, [isAuthenticated, loading])

    if (loading) {
      return (
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: '#f8fafc'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div className="loading-spinner" style={{
              width: 40,
              height: 40,
              border: '3px solid #e5e7eb',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>Loading...</p>
          </div>
          <style jsx>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )
    }

    if (!isAuthenticated) {
      return null
    }

    return <WrappedComponent {...props} />
  }

  AuthenticatedComponent.displayName = `withSupabaseAuth(${WrappedComponent.displayName || WrappedComponent.name})`
  
  return AuthenticatedComponent
}
