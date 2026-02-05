import React, { useState, useEffect, useCallback } from 'react'
import { checkAuth, AuthState, onAuthStateChange } from './lib/auth'
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
  const doAuthCheck = useCallback(async () => {
    setAuthState(prev => ({ ...prev, loading: true }))
    const state = await checkAuth()
    setAuthState(state)
  }, [])
  
  useEffect(() => {
    doAuthCheck()
    
    // Listen for auth state changes (logout sync)
    const { data: { subscription } } = onAuthStateChange((isAuthenticated) => {
      if (!isAuthenticated) {
        // User logged out - reset state
        setAuthState({
          isAuthenticated: false,
          loading: false,
          profile: null,
          organization: null,
          organizationId: null,
          error: null
        })
        setCurrentView('list')
        setSelectedTicket(null)
      }
    })
    
    return () => {
      subscription.unsubscribe()
    }
  }, [doAuthCheck])
  
  // Handle successful login
  const handleLoginSuccess = useCallback(() => {
    doAuthCheck()
  }, [doAuthCheck])
  
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
    showToast('Updated')
  }, [showToast])
  
  // Handle logout from header
  const handleLogout = useCallback(() => {
    setAuthState({
      isAuthenticated: false,
      loading: false,
      profile: null,
      organization: null,
      organizationId: null,
      error: null
    })
    setCurrentView('list')
    setSelectedTicket(null)
  }, [])
  
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
  
  // Not authenticated - show login form
  if (!authState.isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />
  }
  
  return (
    <div className="flex flex-col h-full bg-slate-50">
      <Header 
        organization={authState.organization}
        profile={authState.profile}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        showBackButton={currentView === 'detail'}
        onBack={handleBack}
        ticketNumber={selectedTicket?.ticket_number}
        onLogout={handleLogout}
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
