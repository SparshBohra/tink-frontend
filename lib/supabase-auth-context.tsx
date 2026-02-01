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
  signUp: (email: string, password: string, fullName: string, orgName?: string) => Promise<void>
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

  // Fetch user profile and organization
  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError)
      }

      if (profileData) {
        setProfile(profileData as Profile)

        // Set activity logger user context
        activityLogger.setUser(userId, profileData.organization_id)

        // Fetch organization if profile has one
        if (profileData.organization_id) {
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', profileData.organization_id)
            .single()

          if (orgError && orgError.code !== 'PGRST116') {
            console.error('Error fetching organization:', orgError)
          }

          if (orgData) {
            setOrganization(orgData as Organization)
          }
        }
      }
    } catch (err) {
      console.error('Error fetching user data:', err)
    }
  }

  // Initialize auth state with timeout
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 10000)
        )
        
        const sessionPromise = supabase.auth.getSession()
        
        const result = await Promise.race([sessionPromise, timeoutPromise]) as any
        const currentSession = result?.data?.session
        
        if (currentSession) {
          setSession(currentSession)
          setUser(currentSession.user)
          await fetchUserData(currentSession.user.id)
        }
      } catch (err) {
        console.error('Error initializing auth:', err)
        // On timeout or error, just show login - don't stay stuck
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event)
        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (newSession?.user) {
          await fetchUserData(newSession.user.id)
        } else {
          setProfile(null)
          setOrganization(null)
        }

        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
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
  const signUp = async (email: string, password: string, fullName: string, orgName?: string) => {
    try {
      setLoading(true)
      setError(null)

      // Create auth user with email redirect to login page
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            org_name: orgName // Store for profile creation after confirmation
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')

      // Check if email confirmation is required
      // If session is null, email confirmation is pending
      if (!authData.session) {
        // Don't redirect - let the signup page show the confirmation message
        // Profile will be created after email confirmation
        return { requiresConfirmation: true, email }
      }

      // If we get here, email confirmation is disabled - create profile immediately
      let orgId: string | null = null
      
      if (orgName) {
        const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: orgName,
            slug: slug
          })
          .select()
          .single()

        if (orgError) {
          console.error('Error creating organization:', orgError)
        } else {
          orgId = orgData.id
        }
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: email,
          full_name: fullName,
          organization_id: orgId,
          role: 'pm'
        })

      if (profileError) {
        console.error('Error creating profile:', profileError)
      }

      // Use window.location for reliable redirect
      window.location.href = '/dashboard/tickets'
      return { requiresConfirmation: false }
    } catch (err) {
      console.error('Sign up error:', err)
      setError(handleAuthError(err))
      throw err
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

      if (authError) throw authError

      if (data.user) {
        await fetchUserData(data.user.id)
        // Log successful login
        activityLogger.logLogin('password')
        // Use window.location for reliable redirect
        window.location.href = '/dashboard/tickets'
      }
    } catch (err) {
      console.error('Sign in error:', err)
      const errorMsg = handleAuthError(err)
      setError(errorMsg)
      // Log failed login
      activityLogger.logLoginFailed(errorMsg)
      throw err
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

      if (authError) throw authError
      
      // Log magic link sent
      activityLogger.logMagicLinkSent(email)
    } catch (err) {
      console.error('Magic link error:', err)
      setError(handleAuthError(err))
      throw err
    } finally {
      setLoading(false)
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

      if (authError) throw authError
      
      // Log password reset requested
      activityLogger.logPasswordResetRequested(email)
    } catch (err) {
      console.error('Password reset error:', err)
      setError(handleAuthError(err))
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      setError(null)
      // Don't set loading=true - just sign out immediately

      // Try to log logout but don't wait too long (1 second max)
      try {
        const logPromise = Promise.all([
          activityLogger.logLogout(),
          activityLogger.flush()
        ])
        await Promise.race([
          logPromise,
          new Promise(resolve => setTimeout(resolve, 1000))
        ])
      } catch {
        // Ignore logging errors during signout
      }
      
      // Clear logger user context
      activityLogger.clearUser()
      
      // Clear state immediately
      setUser(null)
      setSession(null)
      setProfile(null)
      setOrganization(null)
      setLoading(false)

      // Sign out from Supabase (don't wait)
      supabase.auth.signOut().catch(console.error)

      // Redirect immediately
      window.location.href = '/auth/login'
    } catch (err) {
      console.error('Sign out error:', err)
      setError(handleAuthError(err))
      setLoading(false)
      // Still redirect even on error
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
