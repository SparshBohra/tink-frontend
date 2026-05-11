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

/** Supabase returns identities: [] when the email already exists in auth.users (signup no-op). */
function isDuplicateAuthSignupUser(user: User): boolean {
  return Array.isArray(user.identities) && user.identities.length === 0
}

function authErrorIndicatesUserExists(err: AuthError): boolean {
  const msg = (err.message || '').toLowerCase()
  return (
    msg.includes('already registered') ||
    msg.includes('already exists') ||
    msg.includes('user already') ||
    (err as { code?: string }).code === 'user_already_exists'
  )
}

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
  const router = useRouter()

  // Fetch user profile and organization with timeout
  const fetchUserData = async (userId: string) => {
    try {
      // Add timeout to prevent infinite loading
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      
      // Simple query first - just get profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      clearTimeout(timeout)

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError)
        return
      }

      if (profileData) {
        setProfile(profileData as Profile)
        activityLogger.setUser(userId, profileData.organization_id)
        
        // Fetch organization separately if exists
        if (profileData.organization_id) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', profileData.organization_id)
            .single()
          
          if (orgData) {
            setOrganization(orgData as Organization)
          }
        }
      }
    } catch (err) {
      console.error('Error fetching user data:', err)
      // Don't block on error - let page load anyway
    }
  }

  // Initialize auth state - SIMPLE version
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Skip if on logout page
        if (window.location.pathname.includes('/auth/logout')) {
          setLoading(false)
          return
        }
        
        // Get session
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        
        if (currentSession) {
          setSession(currentSession)
          setUser(currentSession.user)
          
          // Fetch user data (don't await - let it load in background)
          fetchUserData(currentSession.user.id)
        }
      } catch (err) {
        console.error('Error initializing auth:', err)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes - SIMPLE version
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event)
        
        if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
          setProfile(null)
          setOrganization(null)
          return
        }
        
        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (newSession?.user) {
          fetchUserData(newSession.user.id)
        } else {
          setProfile(null)
          setOrganization(null)
        }
      }
    )
    
    // Listen for storage changes (for extension sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes('auth-token') && e.newValue === null) {
        // Token removed - logged out (possibly from extension)
        setSession(null)
        setUser(null)
        setProfile(null)
        setOrganization(null)
      }
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('storage', handleStorageChange)
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
    const emailLower = email.toLowerCase().trim()

    const provisionNewOrgAndProfile = async (user: User, session: Session | null) => {
      console.log('=== SIGNUP: creating organization, profile, org_contacts ===', user.id)

      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgName || `${fullName}'s Organization`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (orgError) {
        console.error('Error creating organization:', orgError)
        throw new Error('Failed to create organization')
      }

      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: emailLower,
          full_name: fullName,
          organization_id: newOrg.id,
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (profileError) {
        console.error('Error creating profile:', profileError)
        throw new Error('Failed to create profile')
      }

      if (phone) {
        await supabase.from('org_contacts').insert({
          organization_id: newOrg.id,
          contact_type: 'phone',
          contact_value: phone,
          owner_name: fullName,
          created_at: new Date().toISOString()
        })
      }

      setProfile(newProfile as Profile)
      setUser(user)
      setSession(session)
      setOrganization(newOrg as Organization)
      activityLogger.logSignup(emailLower)
      window.location.href = '/dashboard/tickets'
    }

    /**
     * auth.users row still exists (e.g. DB reset cleared public.* only) but profiles may be empty.
     * Sign in with the password from this form and create org/profile if missing.
     */
    const tryRecoverOrphanAuthUser = async (): Promise<boolean> => {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailLower,
        password
      })
      if (signInError || !signInData.session) {
        if (signInError) console.warn('Signup recovery sign-in:', signInError.message)
        return false
      }

      const { data: profileRow } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', signInData.user.id)
        .maybeSingle()

      if (profileRow) {
        setSession(signInData.session)
        setUser(signInData.user)
        await fetchUserData(signInData.user.id)
        window.location.href = '/dashboard/tickets'
        return true
      }

      console.log('=== SIGNUP RECOVERY: provisioning org/profile for existing auth user ===')
      await provisionNewOrgAndProfile(signInData.user, signInData.session)
      return true
    }

    try {
      setLoading(true)
      setError(null)

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', emailLower)
        .maybeSingle()

      if (existingProfile) {
        setError('An account with this email already exists. Please sign in instead.')
        setLoading(false)
        return null
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailLower,
        password,
        options: {
          data: {
            full_name: fullName,
            org_name: orgName,
            phone: phone
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`
        }
      })

      if (authError) {
        if (authErrorIndicatesUserExists(authError) && (await tryRecoverOrphanAuthUser())) {
          return { requiresConfirmation: false }
        }
        throw authError
      }

      if (!authData.user) throw new Error('User creation failed')

      if (isDuplicateAuthSignupUser(authData.user)) {
        if (await tryRecoverOrphanAuthUser()) {
          return { requiresConfirmation: false }
        }
        setError(
          'This email is already registered in Supabase Auth. Use the same password as before to finish setup, sign in, use Forgot password, or delete the user under Dashboard → Authentication → Users.'
        )
        return null
      }

      await provisionNewOrgAndProfile(authData.user, authData.session)
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
      await supabase.auth.signOut()
      setSession(null)
      setUser(null)
      setProfile(null)
      setOrganization(null)
      window.location.href = '/auth/login'
    } catch (err) {
      console.error('Sign out error:', err)
      window.location.href = '/auth/login'
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
