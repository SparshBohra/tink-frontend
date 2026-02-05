import React, { useState, useEffect } from 'react'
import { LogIn, Mail, Lock, Loader2, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { openDashboard } from '../lib/auth'
import { syncSessionToDashboard, restoreSessionFromDashboard } from '../lib/auth-sync'

interface LoginViewProps {
  onLoginSuccess: () => void
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingDashboard, setCheckingDashboard] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Try to restore session from dashboard on mount
  useEffect(() => {
    const checkDashboardSession = async () => {
      try {
        const restored = await restoreSessionFromDashboard()
        if (restored) {
          onLoginSuccess()
          return
        }
      } catch (err) {
        console.log('No dashboard session to restore')
      }
      setCheckingDashboard(false)
    }
    
    checkDashboardSession()
  }, [onLoginSuccess])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please enter email and password')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (data.session) {
        // Sync session to dashboard so user doesn't need to login again there
        try {
          await syncSessionToDashboard({
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresAt: data.session.expires_at || (Date.now() / 1000 + 3600)
          })
        } catch (syncErr) {
          console.log('Failed to sync to dashboard:', syncErr)
        }
        
        onLoginSuccess()
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Show loading while checking dashboard session
  if (checkingDashboard) {
    return (
      <div className="flex flex-col h-full bg-slate-50 items-center justify-center">
        <Loader2 size={24} className="animate-spin text-blue-600 mb-2" />
        <p className="text-sm text-slate-500">Checking login status...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-center py-6 border-b border-slate-200 bg-white">
        <img 
          src="icons/icon48.png" 
          alt="SquareFt" 
          className="w-10 h-10 mr-2"
        />
        <span className="font-semibold text-xl text-slate-800">SquareFt</span>
      </div>

      {/* Login Form */}
      <div className="flex-1 flex flex-col justify-center px-6">
        <h2 className="text-lg font-semibold text-slate-800 text-center mb-1">
          Sign in to continue
        </h2>
        <p className="text-sm text-slate-500 text-center mb-6">
          Access your maintenance tickets
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn size={16} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-200">
          <button
            onClick={openDashboard}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ExternalLink size={14} />
            Open full dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginView
