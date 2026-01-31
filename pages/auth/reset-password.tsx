import { useState, useEffect } from 'react'
import Head from 'next/head'
import { supabase } from '../../lib/supabase'
import { Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Check if we have a valid session (from the recovery link)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setHasSession(true)
      }
      setChecking(false)
    }
    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) throw updateError

      setSuccess(true)
      
      // Sign out and redirect to login
      setTimeout(async () => {
        await supabase.auth.signOut()
        window.location.href = '/auth/login?reset=true'
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="container">
        <div className="card">
          <Loader2 size={40} className="spinner" />
          <p>Verifying...</p>
        </div>
        <style jsx>{`
          .container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
          }
          .card {
            background: white;
            padding: 48px;
            border-radius: 16px;
            text-align: center;
          }
          .card :global(.spinner) {
            color: #3b82f6;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (!hasSession) {
    return (
      <div className="container">
        <div className="card">
          <AlertCircle size={48} color="#ef4444" />
          <h2>Invalid Reset Link</h2>
          <p>This password reset link is invalid or has expired.</p>
          <a href="/auth/login" className="link">Back to Login</a>
        </div>
        <style jsx>{`
          .container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
          }
          .card {
            background: white;
            padding: 48px;
            border-radius: 16px;
            text-align: center;
            max-width: 400px;
          }
          h2 {
            margin: 16px 0 8px;
            color: #1e293b;
          }
          p {
            color: #64748b;
            margin-bottom: 24px;
          }
          .link {
            color: #3b82f6;
            text-decoration: none;
            font-weight: 600;
          }
        `}</style>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Reset Password - SquareFt</title>
      </Head>

      <div className="container">
        <div className="card">
          <div className="logo">
            <img src="/logo1.png" alt="SquareFt" className="logo-img" />
          </div>

          <h1>Reset Your Password</h1>
          <p className="subtitle">Enter your new password below</p>

          {success ? (
            <div className="success-box">
              <CheckCircle size={48} />
              <h3>Password Updated!</h3>
              <p>Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="error-box">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div className="input-group">
                <label>New Password</label>
                <div className="password-input">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label>Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? <Loader2 size={20} className="spinner" /> : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        .container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          padding: 20px;
        }

        .card {
          background: white;
          border-radius: 20px;
          padding: 48px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
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

        h1 {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 8px;
          text-align: center;
        }

        .subtitle {
          color: #64748b;
          text-align: center;
          margin: 0 0 32px;
        }

        .success-box {
          text-align: center;
          padding: 24px;
          color: #059669;
        }

        .success-box h3 {
          margin: 16px 0 8px;
        }

        .success-box p {
          color: #64748b;
        }

        .error-box {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          color: #dc2626;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .input-group {
          margin-bottom: 20px;
        }

        .input-group label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .input-group input {
          width: 100%;
          padding: 14px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 15px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .input-group input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .password-input {
          position: relative;
        }

        .password-input input {
          padding-right: 48px;
        }

        .toggle-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
        }

        .submit-btn {
          width: 100%;
          padding: 14px;
          background: #3b82f6;
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
          transition: background 0.2s;
        }

        .submit-btn:hover:not(:disabled) {
          background: #2563eb;
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
      `}</style>
    </>
  )
}
