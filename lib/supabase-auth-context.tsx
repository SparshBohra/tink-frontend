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
        // Check if we're on a logout/clear page - if so, don't restore session
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search)
          const isLogoutRequest = urlParams.get('clear') === 'true' || 
                                   urlParams.get('logout') === 'true' ||
                                   urlParams.get('reload') === 'done'
          
          if (isLogoutRequest && window.location.pathname.includes('/auth/login')) {
            // On logout page with clear params - don't try to restore session
            console.log('Logout request detected, skipping session restore')
            setLoading(false)
            return
          }
        }
        
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
        
        // Check if we're on a logout page - don't restore session
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search)
          const isLogoutRequest = urlParams.get('clear') === 'true' || 
                                   urlParams.get('logout') === 'true' ||
                                   urlParams.get('reload') === 'done'
          
          if (isLogoutRequest && window.location.pathname.includes('/auth/login')) {
            console.log('On logout page - ignoring auth state change')
            setSession(null)
            setUser(null)
            setProfile(null)
            setOrganization(null)
            setLoading(false)
            return
          }
        }
        
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

      // Check if email confirmation is required
      // If session is null, email confirmation is pending
      if (!authData.session) {
        // This is a new signup or existing unconfirmed user
        // Try to resend confirmation email
        try {
          const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email: email,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`
            }
          })
          
          if (resendError) {
            console.log('Resend error (might be rate limited):', resendError.message)
          }
        } catch (e) {
          console.log('Resend failed:', e)
        }
        
        // Don't redirect - let the signup page show the confirmation message
        // Profile will be created after email confirmation
        return { requiresConfirmation: true, email }
      }

      // If we get here, email confirmation is disabled - create profile immediately
      console.log('=== Creating profile immediately (no email confirmation) ===')
      console.log('User ID:', authData.user.id)
      console.log('Full Name:', fullName)
      console.log('Org Name:', orgName)
      console.log('Phone:', phone)
      
      let orgId: string | null = null
      
      // Step 1: Create organization if provided
      if (orgName) {
        const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        console.log('Creating organization with slug:', slug)
        
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
          // Try to check if org with this slug exists and use it
          const { data: existingOrg } = await supabase
            .from('organizations')
            .select('id')
            .eq('slug', slug)
            .single()
          
          if (existingOrg) {
            console.log('Using existing organization:', existingOrg.id)
            orgId = existingOrg.id
          }
        } else {
          orgId = orgData.id
          console.log('Created organization:', orgId)
        }
        
        // Step 2: Create org_contacts if we have an org
        if (orgId) {
          const contactsToCreate = [
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
          
          console.log('Creating org contacts:', contactsToCreate.length)
          const { error: contactsError } = await supabase
            .from('org_contacts')
            .insert(contactsToCreate)
          
          if (contactsError) {
            console.error('Error creating org contacts:', contactsError)
          } else {
            console.log('Org contacts created successfully')
          }
        }
      }

      // Step 3: Check if profile already exists (could be created by Supabase trigger)
      const { data: profileExists } = await supabase
        .from('profiles')
        .select('id, full_name, organization_id')
        .eq('id', authData.user.id)
        .single()

      if (profileExists) {
        console.log('Profile already exists, updating it:', profileExists)
        // Update existing profile with the correct data
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            email: email,
            full_name: fullName,
            organization_id: orgId || profileExists.organization_id,
            phone: phone || null,
            role: 'pm'
          })
          .eq('id', authData.user.id)
        
        if (updateError) {
          console.error('Error updating existing profile:', updateError)
        } else {
          console.log('Profile updated successfully')
        }
      } else {
        // Create new profile
        console.log('Creating new profile')
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: email,
            full_name: fullName,
            organization_id: orgId,
            phone: phone || null,
            role: 'pm'
          })

        if (profileError) {
          console.error('Error creating profile:', profileError)
        } else {
          console.log('Profile created successfully')
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
      activityLogger.logLoginFailed(errorMsg)
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
      
      // Clear logger (don't wait)
      try {
        activityLogger.logLogout()
        activityLogger.clearUser()
      } catch {
        // Ignore
      }
      
      // Clear all state immediately
      setUser(null)
      setSession(null)
      setProfile(null)
      setOrganization(null)
      setLoading(false)

      // Sign out from Supabase
      try {
        await supabase.auth.signOut({ scope: 'global' })
      } catch {
        // Ignore errors
      }

      // Force clear all storage
      try {
        localStorage.clear()
        sessionStorage.clear()
        // Clear cookies
        document.cookie.split(';').forEach(c => {
          document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/')
        })
      } catch {
        // Ignore
      }

      // Redirect with clear param to ensure clean state
      window.location.href = '/auth/login?clear=true'
    } catch (err) {
      console.error('Sign out error:', err)
      // Force redirect anyway
      window.location.href = '/auth/login?clear=true'
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
