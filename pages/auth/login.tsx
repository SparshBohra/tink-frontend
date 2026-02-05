import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSupabaseAuth } from '../../lib/supabase-auth-context'
import { Mail, Lock, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

export default function Login() {
  const router = useRouter()
  const { signIn, signInWithMagicLink, resetPassword, isAuthenticated, loading, error, clearError } = useSupabaseAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [resetLinkSent, setResetLinkSent] = useState(false)
  const [authMode, setAuthMode] = useState<'password' | 'magic'>('password')
  const [showEmailNotConfirmed, setShowEmailNotConfirmed] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [forceShowForm, setForceShowForm] = useState(false)
  const clearedRef = useRef(false)

  useEffect(() => {
    clearError()
    
    // Check for URL params
    const urlParams = new URLSearchParams(window.location.search)
    const isClearRequest = urlParams.get('clear') === 'true' || urlParams.get('logout') === 'true'
    const isReloadDone = urlParams.get('reload') === 'done'
    
    // If this is a clear/logout request or we just reloaded after clear
    if (isClearRequest || isReloadDone) {
      // Force show the form immediately - don't wait for auth context
      setForceShowForm(true)
      
      // Clear storage on every clear request (not just once)
      if (isClearRequest) {
        // Clear all storage synchronously
        try {
          localStorage.clear()
          sessionStorage.clear()
          
          // Clear all cookies
          document.cookie.split(';').forEach(c => {
            document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/')
          })
          
          // Clear IndexedDB
          try {
            indexedDB.deleteDatabase('supabase-auth-token')
          } catch (e) {
            // Ignore
          }
        } catch (e) {
          console.log('Storage clear error:', e)
        }
        
        // Force reload to completely reset React state
        if (!clearedRef.current) {
          clearedRef.current = true
          setToast({ message: 'Signed out successfully.', type: 'info' })
          // Force a full page reload to clear all React state
          window.location.replace('/auth/login?reload=done')
          return
        }
      }
    }
    
    if (urlParams.get('confirmed') === 'true') {
      setToast({ message: 'Email confirmed! You can now sign in.', type: 'success' })
      window.history.replaceState({}, '', '/auth/login')
    }
    if (urlParams.get('reset') === 'true') {
      setToast({ message: 'Password reset successful! Sign in with your new password.', type: 'success' })
      window.history.replaceState({}, '', '/auth/login')
    }
  }, [])

  useEffect(() => {
    // Only redirect to dashboard if:
    // 1. Not loading
    // 2. Is authenticated
    // 3. NOT a force show form situation (logout/clear)
    if (!loading && isAuthenticated && !forceShowForm) {
      window.location.replace('/dashboard/tickets')
    }
  }, [loading, isAuthenticated, forceShowForm])

  // Watch for email not confirmed errors
  useEffect(() => {
    if (error?.toLowerCase().includes('email not confirmed')) {
      setShowEmailNotConfirmed(true)
    }
  }, [error])

  // Show loading while auth state is being checked
  // BUT skip loading screen if forceShowForm is true (user is logging out)
  if (loading && !forceShowForm) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#3b82f6' }} />
          <p style={{ color: '#64748b', marginTop: 12 }}>Loading...</p>
        </div>
        <style jsx global>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    )
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setShowEmailNotConfirmed(false)
    setIsSubmitting(true)
    await signIn(email, password)
    setIsSubmitting(false)
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting || !email) return

    setIsSubmitting(true)
    const success = await signInWithMagicLink(email)
    if (success) {
      setMagicLinkSent(true)
    }
    setIsSubmitting(false)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting || !email) return

    setIsSubmitting(true)
    const success = await resetPassword(email)
    if (success) {
      setResetLinkSent(true)
      setShowForgotPassword(false)
    }
    setIsSubmitting(false)
  }

  // Only show "Welcome back" redirect screen if authenticated AND not forcing form display
  if (isAuthenticated && !forceShowForm) {
    return (
      <>
        <Head>
          <title>Redirecting... - SquareFt</title>
        </Head>
        <div className="auth-container">
          <div className="auth-card">
            <div className="redirect-content">
              <Loader2 size={32} className="spinner" />
              <h2>Welcome back!</h2>
              <p>Redirecting to dashboard...</p>
            </div>
          </div>
        </div>
        <style jsx>{`
          .auth-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 20px;
          }
          .auth-card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
            padding: 48px;
            width: 100%;
            max-width: 400px;
            text-align: center;
          }
          .redirect-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
          }
          .redirect-content :global(.spinner) {
            color: #3b82f6;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          h2 {
            font-size: 20px;
            font-weight: 600;
            color: #1e293b;
            margin: 0;
          }
          p {
            font-size: 14px;
            color: #64748b;
            margin: 0;
          }
        `}</style>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Login - SquareFt</title>
      </Head>
      
      <div className="auth-container">
        <div className="auth-card">
          {/* Header */}
          <div className="auth-header">
            <div className="logo">
              <img src="/logo1.png" alt="SquareFt" className="logo-img" />
            </div>
            <h1>Welcome back</h1>
            <p>Sign in to your maintenance triage dashboard</p>
          </div>

          {/* Magic Link Success */}
          {magicLinkSent && (
            <div className="success-message">
              <Mail size={20} />
              <div>
                <strong>Check your email!</strong>
                <p>We sent a magic link to {email}</p>
              </div>
            </div>
          )}

          {/* Password Reset Link Sent */}
          {resetLinkSent && (
            <div className="success-message">
              <Mail size={20} />
              <div>
                <strong>Password reset email sent!</strong>
                <p>Check your inbox for a link to reset your password.</p>
              </div>
            </div>
          )}

          {/* Email Not Confirmed Warning */}
          {showEmailNotConfirmed && (
            <div className="warning-message">
              <AlertCircle size={20} />
              <div>
                <strong>Email not confirmed</strong>
                <p>Please check your email and click the confirmation link before signing in.</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && !showEmailNotConfirmed && (
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Auth Mode Toggle */}
          <div className="auth-mode-toggle">
            <button
              type="button"
              className={`toggle-btn ${authMode === 'password' ? 'active' : ''}`}
              onClick={() => setAuthMode('password')}
            >
              Password
            </button>
            <button
              type="button"
              className={`toggle-btn ${authMode === 'magic' ? 'active' : ''}`}
              onClick={() => setAuthMode('magic')}
            >
              Magic Link
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={authMode === 'password' ? handlePasswordLogin : handleMagicLink}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {authMode === 'password' && (
              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="password">Password</label>
                  <button 
                    type="button" 
                    className="forgot-link"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            )}

            {/* Forgot Password Modal */}
            {showForgotPassword && (
              <div className="forgot-modal-overlay" onClick={() => setShowForgotPassword(false)}>
                <div className="forgot-modal" onClick={e => e.stopPropagation()}>
                  <h3>Reset Password</h3>
                  <p>Enter your email and we'll send you a link to reset your password.</p>
                  <form onSubmit={handleForgotPassword}>
                    <div className="input-wrapper">
                      <Mail size={18} className="input-icon" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        required
                      />
                    </div>
                    <div className="modal-buttons">
                      <button type="button" className="cancel-btn" onClick={() => setShowForgotPassword(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="send-btn" disabled={isSubmitting || !email}>
                        {isSubmitting ? <Loader2 size={16} className="spinner" /> : 'Send Reset Link'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="submit-btn"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  {authMode === 'password' ? 'Signing in...' : 'Sending link...'}
                </>
              ) : (
                authMode === 'password' ? 'Sign In' : 'Send Magic Link'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link href="/auth/signup">Create one</Link>
            </p>
          </div>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className={`toast toast-${toast.type}`}>
            {toast.type === 'success' && <CheckCircle size={18} />}
            {toast.type === 'error' && <AlertCircle size={18} />}
            {toast.type === 'info' && <Mail size={18} />}
            <span>{toast.message}</span>
          </div>
        )}
      </div>

      <style jsx>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 20px;
        }

        .auth-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
          padding: 48px;
          width: 100%;
          max-width: 440px;
        }

        .auth-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .logo {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }

        .logo :global(.logo-img) {
          height: 60px;
          width: auto;
        }

        .auth-header h1 {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        .auth-header p {
          color: #64748b;
          font-size: 15px;
          margin: 0;
        }

        .success-message {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 10px;
          padding: 16px;
          margin-bottom: 24px;
          color: #166534;
        }

        .success-message strong {
          display: block;
          margin-bottom: 4px;
        }

        .success-message p {
          margin: 0;
          font-size: 14px;
          color: #15803d;
        }

        .warning-message {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: #fffbeb;
          border: 1px solid #fef3c7;
          border-radius: 10px;
          padding: 16px;
          margin-bottom: 24px;
          color: #92400e;
        }

        .warning-message strong {
          display: block;
          margin-bottom: 4px;
        }

        .warning-message p {
          margin: 0;
          font-size: 14px;
          color: #a16207;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 24px;
          color: #991b1b;
          font-size: 14px;
        }

        .auth-mode-toggle {
          display: flex;
          background: #f1f5f9;
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 24px;
        }

        .toggle-btn {
          flex: 1;
          padding: 10px;
          border: none;
          background: transparent;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }

        .toggle-btn.active {
          background: white;
          color: #1e293b;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .label-row label {
          margin-bottom: 0;
        }

        .forgot-link {
          background: none;
          border: none;
          color: #3b82f6;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          padding: 0;
        }

        .forgot-link:hover {
          text-decoration: underline;
        }

        .forgot-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 20px;
        }

        .forgot-modal {
          background: white;
          border-radius: 16px;
          padding: 32px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        }

        .forgot-modal h3 {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 8px;
        }

        .forgot-modal p {
          color: #64748b;
          font-size: 14px;
          margin: 0 0 20px;
        }

        .modal-buttons {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }

        .cancel-btn {
          flex: 1;
          padding: 12px;
          background: #f1f5f9;
          color: #475569;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .send-btn {
          flex: 1;
          padding: 12px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .send-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .input-wrapper {
          position: relative;
        }

        .input-wrapper :global(.input-icon) {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .input-wrapper input {
          width: 100%;
          padding: 12px 14px 12px 44px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 15px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .input-wrapper input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .input-wrapper input:disabled {
          background: #f8fafc;
          cursor: not-allowed;
        }

        .submit-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: transform 0.2s, box-shadow 0.2s;
          margin-top: 8px;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .submit-btn :global(.spinner) {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .auth-footer {
          text-align: center;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
        }

        .auth-footer p {
          color: #64748b;
          font-size: 14px;
          margin: 0;
        }

        .auth-footer a {
          color: #3b82f6;
          font-weight: 600;
          text-decoration: none;
        }

        .auth-footer a:hover {
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .auth-card {
            padding: 32px 24px;
          }
        }

        /* Toast */
        .toast {
          position: fixed;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          animation: slideDown 0.3s ease, fadeOut 0.3s ease 4s forwards;
        }

        .toast-success {
          background: #10b981;
          color: white;
        }

        .toast-error {
          background: #ef4444;
          color: white;
        }

        .toast-info {
          background: #3b82f6;
          color: white;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; visibility: hidden; }
        }
      `}</style>
    </>
  )
}
