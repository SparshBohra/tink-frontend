import React from 'react'
import { Settings, ExternalLink, ArrowLeft, Calendar, List } from 'lucide-react'
import { openDashboard, openDashboardSettings } from '../lib/auth'
import { Organization } from '../types'

interface HeaderProps {
  organization: Organization | null
  activeTab: 'tickets' | 'calendar'
  onTabChange: (tab: 'tickets' | 'calendar') => void
  showBackButton?: boolean
  onBack?: () => void
  ticketNumber?: number
}

const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  showBackButton,
  onBack,
  ticketNumber
}) => {
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
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-semibold text-slate-800">SquareFt</span>
          </div>
        )}
        
        {showBackButton && ticketNumber && (
          <span className="text-sm font-medium text-slate-700">
            #{ticketNumber}
          </span>
        )}
        
        <div className="flex items-center gap-2">
          <button
            onClick={openDashboardSettings}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Settings (opens dashboard)"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={openDashboard}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Open Dashboard"
          >
            <ExternalLink size={18} />
          </button>
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
