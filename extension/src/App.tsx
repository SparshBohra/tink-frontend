import React, { useState, useEffect, useCallback } from 'react'
import { checkAuth, AuthState } from './lib/auth'
import { TicketWithRelations } from './types'
import Header from './components/Header'
import Toast from './components/Toast'
import LoginView from './views/LoginView'
import TicketListView from './views/TicketListView'
import TicketDetailView from './views/TicketDetailView'
import CalendarView from './views/CalendarView'

type View = 'list' | 'detail' | 'calendar'
type Tab = 'tickets' | 'calendar'

function App() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    loading: true,
    profile: null,
    organization: null,
    organizationId: null,
    error: null
  })
  
  const [currentView, setCurrentView] = useState<View>('list')
  const [activeTab, setActiveTab] = useState<Tab>('tickets')
  const [selectedTicket, setSelectedTicket] = useState<TicketWithRelations | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  
  // Check authentication on mount
  useEffect(() => {
    const init = async () => {
      const state = await checkAuth()
      setAuthState(state)
    }
    init()
  }, [])
  
  // Show toast message
  const showToast = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }, [])
  
  // Handle ticket selection
  const handleTicketSelect = useCallback((ticket: TicketWithRelations) => {
    setSelectedTicket(ticket)
    setCurrentView('detail')
  }, [])
  
  // Handle back navigation
  const handleBack = useCallback(() => {
    setSelectedTicket(null)
    setCurrentView('list')
  }, [])
  
  // Handle tab change
  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab)
    if (tab === 'tickets') {
      setCurrentView('list')
    } else {
      setCurrentView('calendar')
    }
    setSelectedTicket(null)
  }, [])
  
  // Handle ticket update (refresh after status/priority change)
  const handleTicketUpdate = useCallback((updatedTicket: TicketWithRelations) => {
    setSelectedTicket(updatedTicket)
    showToast('Ticket updated')
  }, [showToast])
  
  // Loading state
  if (authState.loading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    )
  }
  
  // Not authenticated
  if (!authState.isAuthenticated) {
    return <LoginView error={authState.error} />
  }
  
  return (
    <div className="flex flex-col h-full bg-slate-50">
      <Header 
        organization={authState.organization}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        showBackButton={currentView === 'detail'}
        onBack={handleBack}
        ticketNumber={selectedTicket?.ticket_number}
      />
      
      <main className="flex-1 overflow-hidden">
        {currentView === 'list' && (
          <TicketListView
            organizationId={authState.organizationId!}
            onTicketSelect={handleTicketSelect}
            showToast={showToast}
          />
        )}
        
        {currentView === 'detail' && selectedTicket && (
          <TicketDetailView
            ticket={selectedTicket}
            onBack={handleBack}
            onUpdate={handleTicketUpdate}
            showToast={showToast}
          />
        )}
        
        {currentView === 'calendar' && (
          <CalendarView organizationId={authState.organizationId!} />
        )}
      </main>
      
      {toast && <Toast message={toast} />}
    </div>
  )
}

export default App
