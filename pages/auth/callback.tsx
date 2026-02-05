import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../../lib/supabase'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Processing...')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get query params
        const urlParams = new URLSearchParams(window.location.search)
        const queryType = urlParams.get('type')
        const code = urlParams.get('code') // PKCE flow code
        const tokenHash = urlParams.get('token_hash') // Email confirmation token
        const errorParam = urlParams.get('error')
        const errorDescription = urlParams.get('error_description')
        
        // Handle errors from Supabase
        if (errorParam) {
          setStatus('error')
          setMessage(errorDescription || errorParam || 'Authentication failed')
          return
        }

        // Get the session from the URL hash (legacy flow - Supabase puts tokens in hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const hashType = hashParams.get('type')
        
        // Determine the auth type (from hash or query)
        const type = hashType || queryType
        
        console.log('Auth callback:', { type, hasCode: !!code, hasTokenHash: !!tokenHash, hasAccessToken: !!accessToken })

        // Email confirmation with token_hash (doesn't need PKCE verifier)
        if (tokenHash && type) {
          setMessage('Verifying email...')
          
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as any // signup, recovery, email_change, etc.
          })
          
          if (verifyError) {
            console.error('Token verification error:', verifyError)
            setStatus('error')
            setMessage(verifyError.message || 'Failed to verify email')
            return
          }

          if (data.user) {
            await createProfileIfNeeded(data.user)
          }
          
          // For signup confirmation, redirect to login
          if (type === 'signup' || type === 'email') {
            setStatus('success')
            setMessage('Email confirmed! Redirecting to login...')
            await supabase.auth.signOut()
            setTimeout(() => {
              window.location.href = '/auth/login?confirmed=true'
            }, 1500)
            return
          }
          
          // For other types, go to dashboard
          setStatus('success')
          setMessage('Verified! Redirecting...')
          setTimeout(() => {
            window.location.href = '/dashboard/tickets'
          }, 1000)
          return
        }

        // PKCE Flow: Exchange code for session
        if (code) {
          setMessage('Verifying authentication...')
          
          try {
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
            
            if (exchangeError) {
              // If PKCE verifier not found, handle based on the auth type
              if (exchangeError.message.includes('PKCE') || exchangeError.message.includes('code verifier')) {
                console.log('PKCE verifier not found - handling based on type:', type)
                
                if (type === 'recovery') {
                  // Password reset - can't proceed without session
                  setStatus('error')
                  setMessage('Reset link expired. Please request a new password reset.')
                  return
                }
                
                if (type === 'magiclink') {
                  // Magic link - can't proceed without session
                  setStatus('error')
                  setMessage('Magic link expired. Please request a new one.')
                  return
                }
                
                // For signup/email confirmation, redirect to login
                setStatus('success')
                setMessage('Email verified! Please sign in.')
                setTimeout(() => {
                  window.location.href = '/auth/login?confirmed=true'
                }, 1500)
                return
              }
              
              console.error('Code exchange error:', exchangeError)
              setStatus('error')
              setMessage(exchangeError.message || 'Failed to verify authentication')
              return
            }

            if (data.user) {
              await createProfileIfNeeded(data.user)
            }
            
            // Handle based on type
            if (type === 'recovery') {
              setStatus('success')
              setMessage('Verified! Redirecting to reset password...')
              setTimeout(() => {
                window.location.href = '/auth/reset-password'
              }, 1000)
              return
            }
            
            if (type === 'signup') {
              setStatus('success')
              setMessage('Email confirmed! Redirecting to login...')
              await supabase.auth.signOut()
              setTimeout(() => {
                window.location.href = '/auth/login?confirmed=true'
              }, 1500)
              return
            }
            
            setStatus('success')
            setMessage('Login successful! Redirecting to dashboard...')
            
            setTimeout(() => {
              window.location.href = '/dashboard/tickets'
            }, 1000)
            return
          } catch (err: any) {
            // Fallback for PKCE errors
            if (err?.message?.includes('PKCE') || err?.message?.includes('code verifier')) {
              setStatus('success')
              setMessage('Email verified! Please sign in.')
              setTimeout(() => {
                window.location.href = '/auth/login?confirmed=true'
              }, 1500)
              return
            }
            throw err
          }
        }

        // Legacy Flow: If we have tokens in hash, set the session
        if (accessToken && refreshToken) {
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (setSessionError) {
            console.error('Set session error:', setSessionError)
            setStatus('error')
            setMessage(setSessionError.message)
            return
          }

          // Handle based on type
          switch (type) {
            case 'signup':
            case 'email_change':
              // Email confirmation - create profile and redirect to login
              if (data.user) {
                await createProfileIfNeeded(data.user)
              }
              
              setStatus('success')
              setMessage('Email confirmed! Redirecting to login...')
              
              // Sign out and redirect to login
              await supabase.auth.signOut()
              
              setTimeout(() => {
                window.location.href = '/auth/login?confirmed=true'
              }, 1500)
              return

            case 'recovery':
              // Password reset - redirect to password reset page
              setStatus('success')
              setMessage('Verified! Redirecting to reset password...')
              
              setTimeout(() => {
                window.location.href = '/auth/reset-password'
              }, 1500)
              return

            case 'magiclink':
              // Magic link login - ensure profile exists and redirect to dashboard
              if (data.user) {
                await createProfileIfNeeded(data.user)
              }
              
              setStatus('success')
              setMessage('Login successful! Redirecting to dashboard...')
              
              setTimeout(() => {
                window.location.href = '/dashboard/tickets'
              }, 1000)
              return

            case 'invite':
              // Team invite - redirect to dashboard
              setStatus('success')
              setMessage('Invite accepted! Redirecting...')
              
              setTimeout(() => {
                window.location.href = '/dashboard/tickets'
              }, 1500)
              return

            default:
              // Unknown type but we have a session - go to dashboard
              setStatus('success')
              setMessage('Login successful! Redirecting...')
              
              setTimeout(() => {
                window.location.href = '/dashboard/tickets'
              }, 1000)
              return
          }
        }

        // No code or tokens in URL - check for existing session
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Auth callback error:', error)
          setStatus('error')
          setMessage(error.message || 'Authentication failed')
          return
        }

        if (session) {
          setStatus('success')
          setMessage('Already logged in! Redirecting...')
          
          setTimeout(() => {
            window.location.href = '/dashboard/tickets'
          }, 1000)
        } else {
          // No session and no tokens - invalid link
          setStatus('error')
          setMessage('Invalid or expired authentication link. Please try again.')
        }
      } catch (err) {
        console.error('Callback error:', err)
        setStatus('error')
        setMessage('An unexpected error occurred')
      }
    }

    // Helper to create profile if it doesn't exist
    const createProfileIfNeeded = async (user: any) => {
      try {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!existingProfile) {
          const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || ''
          const orgName = user.user_metadata?.org_name || ''
          
          // Create organization if provided
          let orgId: string | null = null
          if (orgName) {
            const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
            const { data: orgData } = await supabase
              .from('organizations')
              .insert({ name: orgName, slug })
              .select()
              .single()
            orgId = orgData?.id || null
          }

          // Create profile
          await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              full_name: fullName,
              organization_id: orgId,
              role: 'pm'
            })
        }
      } catch (err) {
        console.error('Error creating profile:', err)
      }
    }

    handleCallback()
  }, [router])

  return (
    <>
      <Head>
        <title>Verifying Login - SquareFt</title>
      </Head>

      <div className="callback-container">
        <div className="callback-card">
          {status === 'loading' && (
            <>
              <Loader2 size={48} className="icon spinner" />
              <h2>{message}</h2>
              <p>Please wait...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle size={48} className="icon success" />
              <h2>{message}</h2>
              <p>Taking you to your dashboard</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle size={48} className="icon error" />
              <h2>Authentication Failed</h2>
              <p>{message}</p>
              <button onClick={() => window.location.href = '/auth/login'} className="retry-btn">
                Try Again
              </button>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .callback-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 20px;
        }

        .callback-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
          padding: 48px;
          text-align: center;
          max-width: 400px;
          width: 100%;
        }

        .callback-card :global(.icon) {
          margin-bottom: 24px;
        }

        .callback-card :global(.spinner) {
          color: #3b82f6;
          animation: spin 1s linear infinite;
        }

        .callback-card :global(.success) {
          color: #10b981;
        }

        .callback-card :global(.error) {
          color: #ef4444;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        h2 {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        p {
          color: #64748b;
          font-size: 15px;
          margin: 0;
        }

        .retry-btn {
          margin-top: 24px;
          padding: 12px 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .retry-btn:hover {
          background: #2563eb;
        }
      `}</style>
    </>
  )
}
