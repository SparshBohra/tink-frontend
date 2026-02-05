import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSupabaseAuth } from '../../lib/supabase-auth-context'
import { Mail, Lock, User, Building2, Loader2, CheckCircle } from 'lucide-react'

export default function Signup() {
  const router = useRouter()
  const { signUp, isAuthenticated, loading, error, clearError } = useSupabaseAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [confirmationSent, setConfirmationSent] = useState(false)
  const [confirmationEmail, setConfirmationEmail] = useState('')

  useEffect(() => {
    clearError()
  }, [])

  useEffect(() => {
    if (!loading && isAuthenticated) {
      window.location.href = '/dashboard/tickets'
    }
  }, [loading, isAuthenticated])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    // Validation
    setValidationError(null)

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match')
      return
    }

    setIsSubmitting(true)
    const result = await signUp(email, password, fullName, orgName || undefined)
    
    // Check if email confirmation is required
    if (result?.requiresConfirmation) {
      setConfirmationSent(true)
      setConfirmationEmail(email)
    }
    setIsSubmitting(false)
  }

  if (isAuthenticated) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="text-center">
            <h2>Already logged in</h2>
            <p>Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show confirmation message after signup
  if (confirmationSent) {
    return (
      <>
        <Head>
          <title>Check Your Email - SquareFt</title>
        </Head>
        
        <div className="auth-container">
          <div className="auth-card confirmation-card">
            <div className="confirmation-content">
              <div className="confirmation-icon">
                <Mail size={48} />
              </div>
              <h1>Check your email</h1>
              <p className="confirmation-text">
                We've sent a confirmation link to
              </p>
              <p className="confirmation-email">{confirmationEmail}</p>
              <p className="confirmation-instructions">
                Click the link in the email to verify your account and start using SquareFt.
              </p>
              
              <div className="confirmation-tips">
                <div className="tip">
                  <CheckCircle size={16} />
                  <span>Check your spam folder if you don't see it</span>
                </div>
                <div className="tip">
                  <CheckCircle size={16} />
                  <span>The link expires in 24 hours</span>
                </div>
              </div>

              <div className="confirmation-footer">
                <p>Already confirmed?</p>
                <Link href="/auth/login" className="login-link">
                  Go to Login
                </Link>
              </div>
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
            max-width: 480px;
          }

          .confirmation-card {
            text-align: center;
          }

          .confirmation-content {
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .confirmation-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #dbeafe, #e0e7ff);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #3b82f6;
            margin-bottom: 24px;
            animation: pulse 2s infinite;
          }

          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }

          h1 {
            font-size: 24px;
            font-weight: 700;
            color: #1e293b;
            margin: 0 0 12px 0;
          }

          .confirmation-text {
            font-size: 15px;
            color: #64748b;
            margin: 0;
          }

          .confirmation-email {
            font-size: 16px;
            font-weight: 600;
            color: #3b82f6;
            margin: 4px 0 16px 0;
          }

          .confirmation-instructions {
            font-size: 14px;
            color: #64748b;
            line-height: 1.6;
            margin: 0 0 24px 0;
            max-width: 320px;
          }

          .confirmation-tips {
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 16px;
            background: #f8fafc;
            border-radius: 10px;
            width: 100%;
            margin-bottom: 24px;
          }

          .tip {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: #64748b;
          }

          .tip :global(svg) {
            color: #10b981;
            flex-shrink: 0;
          }

          .confirmation-footer {
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            width: 100%;
          }

          .confirmation-footer p {
            font-size: 14px;
            color: #64748b;
            margin: 0 0 8px 0;
          }

          .login-link {
            color: #3b82f6;
            font-weight: 600;
            text-decoration: none;
            font-size: 14px;
          }

          .login-link:hover {
            text-decoration: underline;
          }
        `}</style>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Sign Up - SquareFt</title>
      </Head>
      
      <div className="auth-container">
        <div className="auth-card">
          {/* Header */}
          <div className="auth-header">
            <div className="logo">
              <img src="/logo1.png" alt="SquareFt" className="logo-img" />
            </div>
            <h1>Create your account</h1>
            <p>Start triaging maintenance requests with AI</p>
          </div>

          {/* Error Messages */}
          {(error || validationError) && (
            <div className="error-message">
              <strong>Error:</strong> {error || validationError}
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSignup}>
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Smith"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

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

            <div className="form-group">
              <label htmlFor="orgName">Organization Name (Optional)</label>
              <div className="input-wrapper">
                <Building2 size={18} className="input-icon" />
                <input
                  id="orgName"
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Golden Gate Property Management"
                  disabled={isSubmitting}
                />
              </div>
              <span className="form-hint">Leave blank to join an existing organization later</span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="submit-btn"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link href="/auth/login">Sign in</Link>
            </p>
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
          max-width: 480px;
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

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 24px;
          color: #991b1b;
          font-size: 14px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .form-hint {
          display: block;
          font-size: 12px;
          color: #94a3b8;
          margin-top: 6px;
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

          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  )
}
