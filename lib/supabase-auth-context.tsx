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

      // ALWAYS CREATE NEW ORGANIZATION FOR EACH SIGNUP
      // No org matching - each user gets their own organization
      console.log('=== SIGNUP SUCCESS ===')
      console.log('User ID:', authData.user.id)
      console.log('Creating: new organization, profile, org_contacts')
      
      // Create new organization
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
      
      // Create profile with the new organization
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: email.toLowerCase(),
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
      
      // Create org_contacts entry if phone provided
      if (phone) {
        await supabase
          .from('org_contacts')
          .insert({
            organization_id: newOrg.id,
            contact_type: 'phone',
            contact_value: phone,
            owner_name: fullName,
            created_at: new Date().toISOString()
          })
      }
      
      // Set state
      setProfile(newProfile as any)
      setUser(authData.user)
      setSession(authData.session)
      setOrganization(newOrg as any)
      
      // Log successful signup
      activityLogger.logSignup()

      // Redirect to dashboard
      window.location.href = '/dashboard/tickets'
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
