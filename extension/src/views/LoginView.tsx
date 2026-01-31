import React from 'react'
import { LogIn, AlertCircle } from 'lucide-react'
import { openDashboardLogin } from '../lib/auth'

interface LoginViewProps {
  error?: string | null
}

const LoginView: React.FC<LoginViewProps> = ({ error }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 bg-slate-50">
      {/* Logo */}
      <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
        <span className="text-white font-bold text-2xl">S</span>
      </div>
      
      <h1 className="text-xl font-semibold text-slate-800 mb-2">
        Welcome to SquareFt
      </h1>
      
      <p className="text-sm text-slate-500 text-center mb-6">
        Sign in to access your maintenance tickets
      </p>
      
      {error && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg mb-4 text-sm text-red-600">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      
      <button
        onClick={openDashboardLogin}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md"
      >
        <LogIn size={18} />
        Sign in on Dashboard
      </button>
      
      <p className="text-xs text-slate-400 text-center mt-6">
        You'll be redirected to the SquareFt dashboard to sign in.
        <br />
        Then come back here to view your tickets.
      </p>
    </div>
  )
}

export default LoginView
