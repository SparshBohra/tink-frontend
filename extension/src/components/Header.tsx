import React, { useState, useRef, useEffect } from 'react'
import { Settings, ExternalLink, ArrowLeft, Calendar, List, LogOut, ChevronDown } from 'lucide-react'
import { openDashboard, signOutAndClearDashboard } from '../lib/auth'
import { Organization, Profile } from '../types'

interface HeaderProps {
  organization: Organization | null
  profile: Profile | null
  activeTab: 'tickets' | 'calendar'
  onTabChange: (tab: 'tickets' | 'calendar') => void
  showBackButton?: boolean
  onBack?: () => void
  ticketNumber?: number
  onLogout?: () => void
}

const Header: React.FC<HeaderProps> = ({
  profile,
  activeTab,
  onTabChange,
  showBackButton,
  onBack,
  ticketNumber,
  onLogout
}) => {
  // Get first name from profile
  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const handleLogout = async () => {
    setShowMenu(false)
    await signOutAndClearDashboard()
    onLogout?.()
  }
  
  const handleOpenDashboard = () => {
    setShowMenu(false)
    openDashboard()
  }
  
  return (
    <header className="bg-white border-b border-slate-200 flex-shrink-0">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        {showBackButton ? (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Back</span>
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <img 
              src="/icons/icon48.png" 
              alt="SquareFt" 
              className="w-7 h-7"
            />
            <span className="font-medium text-slate-700">
              Welcome, <span className="font-semibold text-slate-800">{firstName}</span>
            </span>
          </div>
        )}
        
        {showBackButton && ticketNumber && (
          <span className="text-sm font-medium text-slate-700">
            #{ticketNumber}
          </span>
        )}
        
        {/* Settings Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-1 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Menu"
          >
            <Settings size={18} />
            <ChevronDown size={14} />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
              <button
                onClick={handleOpenDashboard}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ExternalLink size={16} className="text-slate-400" />
                Open Dashboard
              </button>
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Tabs - only show when not in detail view */}
      {!showBackButton && (
        <div className="flex border-t border-slate-100">
          <button
            onClick={() => onTabChange('tickets')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'tickets'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <List size={16} />
            Tickets
          </button>
          <button
            onClick={() => onTabChange('calendar')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'calendar'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Calendar size={16} />
            Calendar
          </button>
        </div>
      )}
    </header>
  )
}

export default Header
