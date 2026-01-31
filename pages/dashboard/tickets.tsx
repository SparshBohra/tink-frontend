import React, { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useSupabaseAuth, withSupabaseAuth } from '../../lib/supabase-auth-context'
import { 
  TicketWithRelations, 
  TicketStatus, 
  TicketPriority,
  getPriorityDisplayName,
  getPriorityColor,
  getStatusColor,
  getCategoryDisplayName
} from '../../lib/supabase-types'
import CategoryIcon from '../../components/CategoryIcon'
import { 
  fetchTickets,
  fetchTicketById,
  updateTicketStatus, 
  getTicketStats,
  subscribeToTickets,
  TicketFilters,
  TicketSortOptions
} from '../../lib/ticket-service'
import DashboardLayout from '../../components/DashboardLayout'
import FullCalendar from '../../components/FullCalendar'
import TicketDetailModal from '../../components/TicketDetailModal'
import { 
  Inbox, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Calendar as CalendarIcon,
  List,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  Mail,
  MessageSquare
} from 'lucide-react'

// Priority order for proper sorting (most urgent first)
const PRIORITY_ORDER: Record<TicketPriority, number> = {
  emergency: 0,
  high: 1,
  medium: 2,
  low: 3
}

function TicketsPage() {
  const { organizationId, profile } = useSupabaseAuth()
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'tickets' | 'calendar'>('tickets')

  const [tickets, setTickets] = useState<TicketWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({ total: 0, triage: 0, open: 0, completed: 0, emergency: 0 })
  
  // Filters and sorting
  const [filters, setFilters] = useState<TicketFilters>({ status: 'all', priority: 'all' })
  const [sort, setSort] = useState<TicketSortOptions>({ field: 'created_at', direction: 'desc' })
  const [searchQuery, setSearchQuery] = useState('')
  const [groupBy, setGroupBy] = useState<'category' | 'source' | 'status' | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  
  // Modal state
  const [selectedTicket, setSelectedTicket] = useState<TicketWithRelations | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Toast
  const [copyToast, setCopyToast] = useState<string | null>(null)

  // Load cached data
  useEffect(() => {
    if (organizationId) {
      const cachedTickets = localStorage.getItem(`tickets_${organizationId}`)
      const cachedStats = localStorage.getItem(`stats_${organizationId}`)
      
      if (cachedTickets) {
        setTickets(JSON.parse(cachedTickets))
        setLoading(false)
      }
      
      if (cachedStats) {
        setStats(JSON.parse(cachedStats))
      }
    }
  }, [organizationId])

  const loadData = useCallback(async () => {
    if (!organizationId) return
    
    // Only set loading if we don't have data
    if (tickets.length === 0) setLoading(true)
    setError(null)
    
    try {
      const [ticketsResult, statsResult] = await Promise.all([
        fetchTickets(organizationId, { ...filters, search: searchQuery }, sort),
        getTicketStats(organizationId)
      ])
      
      if (ticketsResult.error) {
        setError(ticketsResult.error)
      } else {
        setTickets(ticketsResult.tickets as TicketWithRelations[])
        localStorage.setItem(`tickets_${organizationId}`, JSON.stringify(ticketsResult.tickets))
      }
      
      if (!statsResult.error) {
        setStats(statsResult)
        localStorage.setItem(`stats_${organizationId}`, JSON.stringify(statsResult))
      }
    } catch (err) {
      setError('Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }, [organizationId, filters, sort, searchQuery])

  useEffect(() => {
    if (activeTab === 'tickets') {
      loadData()
    }
  }, [loadData, activeTab])

  // Real-time subscription
  useEffect(() => {
    if (!organizationId) return

    const unsubscribe = subscribeToTickets(
      organizationId,
      (newTicket) => {
        setTickets(prev => {
          const updated = [newTicket as TicketWithRelations, ...prev]
          localStorage.setItem(`tickets_${organizationId}`, JSON.stringify(updated))
          return updated
        })
        setStats(prev => ({
          ...prev,
          total: prev.total + 1,
          [newTicket.status]: prev[newTicket.status as keyof typeof prev] + 1,
          ...(newTicket.priority === 'emergency' ? { emergency: prev.emergency + 1 } : {})
        }))
      },
      (updatedTicket) => {
        setTickets(prev => {
          const updated = prev.map(t => t.id === updatedTicket.id ? (updatedTicket as TicketWithRelations) : t)
          localStorage.setItem(`tickets_${organizationId}`, JSON.stringify(updated))
          return updated
        })
      }
    )

    return () => unsubscribe()
  }, [organizationId])

  const handleTicketClick = async (ticket: TicketWithRelations) => {
    // Fetch full ticket data with complete inbound_messages
    if (organizationId) {
      const result = await fetchTicketById(ticket.id, organizationId)
      if (result.ticket && !result.error) {
        setSelectedTicket(result.ticket)
      } else {
        // Fallback to ticket from list if fetch fails
        setSelectedTicket(ticket)
      }
    } else {
      setSelectedTicket(ticket)
    }
    setIsModalOpen(true)
  }

  const handleModalUpdate = (updatedTicket: TicketWithRelations) => {
    setTickets(prev => {
      const updated = prev.map(t => t.id === updatedTicket.id ? updatedTicket : t)
      localStorage.setItem(`tickets_${organizationId}`, JSON.stringify(updated))
      return updated
    })
    if (selectedTicket && selectedTicket.status !== updatedTicket.status) {
      getTicketStats(organizationId!).then(res => !res.error && setStats(res))
    }
  }

  const handleStatusChange = async (e: React.MouseEvent, ticketId: string, newStatus: TicketStatus) => {
    e.stopPropagation()
    if (!organizationId) return
    
    const result = await updateTicketStatus(ticketId, organizationId, newStatus)
    if (result.success) {
      setTickets(prev => {
        const updated = prev.map(t => 
          t.id === ticketId ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t
        )
        localStorage.setItem(`tickets_${organizationId}`, JSON.stringify(updated))
        return updated
      })
      getTicketStats(organizationId).then(res => !res.error && setStats(res))
    }
  }

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return `${diffDays}d ago`
  }

  const formatDateTime = (dateString: string): { day: string; date: string; time: string } => {
    const date = new Date(dateString)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return {
      day: days[date.getDay()],
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    }
  }

  // Handle column sorting with proper priority ordering
  const handleSort = (field: 'created_at' | 'priority' | 'status' | 'ticket_number') => {
    if (sort.field === field) {
      // Toggle direction
      setSort({ field, direction: sort.direction === 'desc' ? 'asc' : 'desc' })
    } else {
      // New field, default to desc (most recent/urgent first)
      setSort({ field, direction: 'desc' })
    }
  }

  // Handle grouping
  const handleGroup = (field: 'category' | 'source' | 'status') => {
    if (groupBy === field) {
      // Ungroup if clicking the same field
      setGroupBy(null)
      setCollapsedGroups(new Set())
    } else {
      // Group by the selected field
      setGroupBy(field)
      setCollapsedGroups(new Set()) // Reset collapsed groups when changing group field
    }
  }

  // Toggle group collapse/expand
  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey)
      } else {
        newSet.add(groupKey)
      }
      return newSet
    })
  }

  // Handle refresh - reset everything and reload
  const handleRefresh = () => {
    // Reset filters
    setFilters({ status: 'all', priority: 'all' })
    // Reset sort to most recent first
    setSort({ field: 'created_at', direction: 'desc' })
    // Reset grouping
    setGroupBy(null)
    setCollapsedGroups(new Set())
    // Clear search
    setSearchQuery('')
    // Reload data (will happen automatically via useEffect when filters/sort change)
  }

  // Sort tickets client-side for proper priority ordering
  const sortedTickets = [...tickets].sort((a, b) => {
    const direction = sort.direction === 'asc' ? 1 : -1
    
    switch (sort.field) {
      case 'priority':
        return (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]) * direction
      case 'created_at':
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * direction
      case 'ticket_number':
        return ((a.ticket_number || 0) - (b.ticket_number || 0)) * direction
      case 'status':
        return a.status.localeCompare(b.status) * direction
      default:
        return 0
    }
  })

  // Group tickets if grouping is enabled
  const getGroupedTickets = () => {
    if (!groupBy) return null

    const groups: Record<string, TicketWithRelations[]> = {}

    sortedTickets.forEach(ticket => {
      let key: string
      
      if (groupBy === 'category') {
        key = ticket.category || 'Uncategorized'
      } else if (groupBy === 'source') {
        key = ticket.inbound_messages?.[0]?.source || 'email'
      } else if (groupBy === 'status') {
        key = ticket.status
      } else {
        key = 'Other'
      }

      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(ticket)
    })

    return groups
  }

  const groupedTickets = getGroupedTickets()

  // Handle stat card clicks - toggle filter
  const handleStatClick = (type: 'status' | 'priority', value: string) => {
    if (type === 'status') {
      setFilters(prev => ({
        ...prev,
        status: prev.status === value ? 'all' : value as TicketStatus | 'all'
      }))
    } else {
      setFilters(prev => ({
        ...prev,
        priority: prev.priority === value ? 'all' : value as TicketPriority | 'all'
      }))
    }
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sort.field !== field) return <ArrowUpDown size={14} className="sort-icon inactive" />
    return sort.direction === 'desc' 
      ? <ChevronDown size={14} className="sort-icon active" />
      : <ChevronUp size={14} className="sort-icon active" />
  }

  return (
    <DashboardLayout title="" subtitle="">
      <Head>
        <title>Dashboard - SquareFt</title>
      </Head>

      <div className="page-container">
        {/* Page Header */}
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">Welcome, {profile?.full_name?.split(' ')[0] || 'there'}!</h1>
            <p className="page-subtitle">Keep your work orders streamlined</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tabs-wrapper">
          <div className="tabs-container">
            <button 
              className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
              onClick={() => setActiveTab('tickets')}
            >
              <List size={18} />
              Tickets
            </button>
            <button 
              className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
              onClick={() => setActiveTab('calendar')}
            >
              <CalendarIcon size={18} />
              Calendar
            </button>
          </div>
        </div>

        {activeTab === 'tickets' ? (
          <div className="dashboard-content fade-in">
            {/* Glassy Stats Row */}
            <div className="stats-row">
              <div className={`stat-card triage ${filters.status === 'triage' ? 'active' : ''}`} onClick={() => handleStatClick('status', 'triage')}>
                <div className="stat-icon-bg">
                  <Clock size={24} />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{stats.triage}</div>
                  <div className="stat-label">Inbox</div>
                </div>
              </div>

              <div className={`stat-card open ${filters.status === 'open' ? 'active' : ''}`} onClick={() => handleStatClick('status', 'open')}>
                <div className="stat-icon-bg">
                  <Inbox size={24} />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{stats.open}</div>
                  <div className="stat-label">Open</div>
                </div>
              </div>

              <div className={`stat-card completed ${filters.status === 'completed' ? 'active' : ''}`} onClick={() => handleStatClick('status', 'completed')}>
                <div className="stat-icon-bg">
                  <CheckCircle size={24} />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{stats.completed}</div>
                  <div className="stat-label">Completed</div>
                </div>
              </div>

              {stats.emergency > 0 && (
                <div className={`stat-card emergency ${filters.priority === 'emergency' ? 'active' : ''}`} onClick={() => handleStatClick('priority', 'emergency')}>
                  <div className="stat-icon-bg pulse">
                    <AlertTriangle size={24} />
                  </div>
                  <div className="stat-info">
                    <div className="stat-value text-red">{stats.emergency}</div>
                    <div className="stat-label">Emergency</div>
                  </div>
                </div>
              )}
            </div>

            {/* Main Table Card */}
            <div className="main-card glass-panel">
              <div className="card-header">
                <div className="search-box">
                  <Search size={16} />
                  <input 
                    type="text" 
                    placeholder="Search tickets..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="actions-wrapper">
                  <button className="filter-btn">
                    <Filter size={16} />
                    <select 
                      value={filters.priority || 'all'} 
                      onChange={(e) => setFilters({ ...filters, priority: e.target.value as TicketPriority | 'all' })}
                    >
                      <option value="all">All Priorities</option>
                      <option value="emergency">Emergency</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </button>
                  <button className="refresh-btn" onClick={handleRefresh}>
                    <RefreshCw size={16} className={loading ? 'spinning' : ''} />
                  </button>
                </div>
              </div>

              <div className="table-wrapper">
                <table className="tickets-table">
                  <thead>
                    <tr>
                      <th width="80" className="sortable" onClick={() => handleSort('ticket_number')}>
                        <span className="th-content">ID <SortIcon field="ticket_number" /></span>
                      </th>
                      <th width="80" className={`center-header groupable ${groupBy === 'source' ? 'grouped' : ''}`} onClick={() => handleGroup('source')}>
                        Source {groupBy === 'source' && <span className="group-indicator">(Grouped)</span>}
                      </th>
                      <th width="140" className={`center-header groupable ${groupBy === 'category' ? 'grouped' : ''}`} onClick={() => handleGroup('category')}>
                        Category {groupBy === 'category' && <span className="group-indicator">(Grouped)</span>}
                      </th>
                      <th width="30%">Subject</th>
                      <th width="120" className="sortable center-header" onClick={() => handleSort('priority')}>
                        <span className="th-content">Priority <SortIcon field="priority" /></span>
                      </th>
                      <th width="120" className={`center-header groupable ${groupBy === 'status' ? 'grouped' : ''}`} onClick={() => handleGroup('status')}>
                        Status {groupBy === 'status' && <span className="group-indicator">(Grouped)</span>}
                      </th>
                      <th width="160" className="sortable" onClick={() => handleSort('created_at')}>
                        <span className="th-content">Created <SortIcon field="created_at" /></span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && tickets.length === 0 ? (
                      <tr><td colSpan={7} className="loading-cell">
                        <RefreshCw size={24} className="spinning" />
                        <p>Loading tickets...</p>
                      </td></tr>
                    ) : sortedTickets.length === 0 ? (
                      <tr><td colSpan={7} className="empty-cell">No tickets found</td></tr>
                    ) : groupedTickets ? (
                      // Render grouped tickets
                      Object.entries(groupedTickets).map(([groupKey, groupTickets]) => {
                        const renderTicketRow = (ticket: TicketWithRelations) => {
                          const isEmergency = ticket.priority === 'emergency'
                          const { day, date, time } = formatDateTime(ticket.created_at)
                          const source = ticket.inbound_messages?.[0]?.source || 'email'
                          
                          return (
                            <tr 
                              key={ticket.id} 
                              onClick={() => handleTicketClick(ticket)}
                              className={`ticket-row ${isEmergency ? 'emergency-row' : ''}`}
                            >
                              <td className="id-cell">#{ticket.ticket_number}</td>
                              <td className="source-cell">
                                <span className={`source-icon ${source}`}>
                                  {source === 'sms' ? <MessageSquare size={18} /> : <Mail size={18} />}
                                </span>
                              </td>
                              <td className="category-cell">
                                <CategoryIcon category={ticket.category} size="md" />
                              </td>
                              <td className="subject-cell">
                                <div className="subject-text">{ticket.title || 'Untitled'}</div>
                                {ticket.description && (
                                  <div className="subject-sub">{ticket.description.substring(0, 50)}...</div>
                                )}
                              </td>
                              <td className="priority-cell">
                                <span className={`priority-tag ${ticket.priority}`}>
                                  {getPriorityDisplayName(ticket.priority)}
                                </span>
                              </td>
                              <td className="status-cell" onClick={(e) => e.stopPropagation()}>
                                <span className={`status-tag ${ticket.status}`}>
                                  {ticket.status === 'triage' ? 'Inbox' : ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                                </span>
                              </td>
                              <td className="time-cell">
                                <div className="time-main">{day}, {date}</div>
                                <div className="time-secondary">{time}</div>
                                <div className="time-ago">{formatTimeAgo(ticket.created_at)}</div>
                              </td>
                            </tr>
                          )
                        }

                        // Group header
                        let groupLabel = groupKey
                        if (groupBy === 'category') {
                          groupLabel = groupKey !== 'Uncategorized' ? getCategoryDisplayName(groupKey as any) : 'Uncategorized'
                        } else if (groupBy === 'source') {
                          groupLabel = groupKey === 'email' ? 'Email' : 'SMS'
                        } else if (groupBy === 'status') {
                          groupLabel = groupKey === 'triage' ? 'Inbox' : groupKey.charAt(0).toUpperCase() + groupKey.slice(1)
                        }

                        const isCollapsed = collapsedGroups.has(groupKey)

                        return (
                          <React.Fragment key={groupKey}>
                            <tr 
                              className="group-header-row"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleGroup(groupKey)
                              }}
                            >
                              <td colSpan={7} className="group-header">
                                <div className="group-header-content">
                                  {isCollapsed ? (
                                    <ChevronRight size={14} className="group-chevron" />
                                  ) : (
                                    <ChevronDown size={14} className="group-chevron" />
                                  )}
                                  <strong>{groupLabel}</strong>
                                  <span className="group-count">({groupTickets.length})</span>
                                </div>
                              </td>
                            </tr>
                            {!isCollapsed && groupTickets.map(renderTicketRow)}
                          </React.Fragment>
                        )
                      })
                    ) : (
                      // Render ungrouped tickets
                      sortedTickets.map((ticket) => {
                        const isEmergency = ticket.priority === 'emergency'
                        const { day, date, time } = formatDateTime(ticket.created_at)
                        const source = ticket.inbound_messages?.[0]?.source || 'email'
                        
                        return (
                          <tr 
                            key={ticket.id} 
                            onClick={() => handleTicketClick(ticket)}
                            className={`ticket-row ${isEmergency ? 'emergency-row' : ''}`}
                          >
                            <td className="id-cell">#{ticket.ticket_number}</td>
                            <td className="source-cell">
                              <span className={`source-icon ${source}`}>
                                {source === 'sms' ? <MessageSquare size={18} /> : <Mail size={18} />}
                              </span>
                            </td>
                            <td className="category-cell">
                              <CategoryIcon category={ticket.category} size="md" />
                            </td>
                            <td className="subject-cell">
                              <div className="subject-text">{ticket.title || 'Untitled'}</div>
                              {ticket.description && (
                                <div className="subject-sub">{ticket.description.substring(0, 50)}...</div>
                              )}
                            </td>
                            <td className="priority-cell">
                              <span className={`priority-tag ${ticket.priority}`}>
                                {getPriorityDisplayName(ticket.priority)}
                              </span>
                            </td>
                            <td className="status-cell" onClick={(e) => e.stopPropagation()}>
                              <span className={`status-tag ${ticket.status}`}>
                                {ticket.status === 'triage' ? 'Inbox' : ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                              </span>
                            </td>
                            <td className="time-cell">
                              <div className="time-main">{day}, {date}</div>
                              <div className="time-secondary">{time}</div>
                              <div className="time-ago">{formatTimeAgo(ticket.created_at)}</div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="dashboard-content fade-in h-full">
            <FullCalendar />
          </div>
        )}
      </div>

      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onUpdate={handleModalUpdate}
          organizationId={organizationId}
        />
      )}

      {copyToast && (
        <div className="toast">
          <CheckCircle size={14} /> {copyToast}
        </div>
      )}

      <style jsx>{`
        .page-container {
          max-width: 1600px;
          margin: 0 auto;
          padding: 0 48px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          height: 100%;
        }

        /* Page Header */
        .page-header {
          padding: 40px 0 16px 0;
        }

        .header-content {
          text-align: center;
        }

        .page-title {
          font-size: 36px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 8px 0;
          letter-spacing: -0.03em;
        }

        .page-subtitle {
          font-size: 16px;
          color: #64748b;
          margin: 0;
        }

        /* Tabs Wrapper - Centered */
        .tabs-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 8px;
        }

        /* Tabs */
        .tabs-container {
          display: flex;
          gap: 6px;
          padding: 5px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          border-radius: 14px;
          width: fit-content;
          border: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 24px;
          border: none;
          background: transparent;
          color: #64748b;
          font-weight: 600;
          font-size: 14px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .tab-btn:hover {
          color: #3b82f6;
          background: rgba(255, 255, 255, 0.5);
        }

        .tab-btn.active {
          background: white;
          color: #0f172a;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          transform: scale(1.02);
        }

        .dashboard-content {
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .dashboard-content.h-full {
          height: 100%;
        }

        /* Stats Cards */
        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 24px;
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
          display: flex;
          align-items: center;
          gap: 20px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          border-color: rgba(255, 255, 255, 0.9);
        }

        .stat-card.active {
          border-color: #3b82f6;
          background: white;
        }

        .stat-icon-bg {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease;
        }

        .stat-card:hover .stat-icon-bg {
          transform: scale(1.1) rotate(5deg);
        }

        .stat-card.triage .stat-icon-bg { background: #fffbeb; color: #d97706; }
        .stat-card.open .stat-icon-bg { background: #eff6ff; color: #2563eb; }
        .stat-card.completed .stat-icon-bg { background: #ecfdf5; color: #059669; }
        .stat-card.emergency .stat-icon-bg { background: #fef2f2; color: #dc2626; }

        .stat-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1;
          letter-spacing: -0.03em;
        }

        .stat-label {
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Glass Panel (Main Card) */
        .glass-panel {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-height: 600px;
        }

        .card-header {
          padding: 20px 28px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.6);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          background: rgba(255, 255, 255, 0.4);
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 0 14px;
          height: 42px;
          flex: 1;
          max-width: 360px;
          transition: all 0.2s;
        }

        .search-box:focus-within {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .search-box svg {
          color: #94a3b8;
          flex-shrink: 0;
        }

        .search-box input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
          background: transparent;
          color: #0f172a;
        }

        .search-box input::placeholder {
          color: #94a3b8;
        }

        .actions-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .filter-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 0 14px;
          height: 42px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-btn:hover {
          border-color: #cbd5e1;
        }

        .filter-btn svg {
          color: #64748b;
          flex-shrink: 0;
        }

        .filter-btn select {
          border: none;
          outline: none;
          background: transparent;
          font-size: 14px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          appearance: none;
          padding-right: 4px;
        }

        .refresh-btn {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .refresh-btn:hover {
          border-color: #cbd5e1;
          color: #3b82f6;
        }

        /* Table */
        .table-wrapper {
          flex: 1;
          overflow: auto;
        }

        .tickets-table {
          width: 100%;
          border-collapse: collapse;
        }

        .tickets-table th {
          text-align: left;
          padding: 20px 32px;
          background: rgba(248, 250, 252, 0.5);
          border-bottom: 1px solid rgba(226, 232, 240, 0.6);
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }

        .tickets-table th.center-header {
          text-align: center;
        }

        .tickets-table th.center-header .th-content {
          justify-content: center;
        }

        .tickets-table td {
          padding: 20px 32px;
          border-bottom: 1px solid rgba(241, 245, 249, 0.6);
          vertical-align: middle;
        }

        .ticket-row {
          cursor: pointer;
          transition: all 0.15s;
        }

        .ticket-row:hover {
          background: rgba(248, 250, 252, 0.9);
        }

        .ticket-row.emergency-row {
          background: linear-gradient(90deg, rgba(254, 226, 226, 0.5) 0%, rgba(255, 255, 255, 0) 40%);
          border-left: 3px solid #dc2626;
        }

        .ticket-row.emergency-row:hover {
          background: linear-gradient(90deg, rgba(254, 226, 226, 0.8) 0%, rgba(248, 250, 252, 0.9) 40%);
        }

        .id-cell {
          font-family: 'SF Mono', monospace;
          font-weight: 600;
          color: #3b82f6;
          font-size: 13px;
        }

        .source-cell {
          vertical-align: middle;
          text-align: center;
        }

        .category-cell {
          vertical-align: middle;
          text-align: center;
        }

        .priority-cell {
          vertical-align: middle;
          text-align: center;
        }

        .status-cell {
          vertical-align: middle;
          text-align: center;
        }

        .source-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          padding: 6px;
        }

        .source-icon.email {
          background: #3b82f6;
          color: white;
        }

        .source-icon.sms {
          background: #10b981;
          color: white;
        }

        .subject-cell {
          padding-right: 16px;
        }

        .subject-text {
          font-weight: 600;
          color: #0f172a;
          font-size: 15px;
          margin-bottom: 4px;
        }

        .subject-sub {
          font-size: 13px;
          color: #94a3b8;
        }

        .priority-tag {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          height: 28px;
        }

        .priority-tag.emergency {
          background: #dc2626;
          color: white;
        }

        .priority-tag.high {
          background: #f97316;
          color: white;
        }

        .priority-tag.medium {
          background: #fbbf24;
          color: #78350f;
        }

        .priority-tag.low {
          background: #e2e8f0;
          color: #64748b;
        }

        .status-tag {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          height: 28px;
        }

        .status-tag.triage {
          background: #eab308;
          color: white;
        }

        .status-tag.open {
          background: #3b82f6;
          color: white;
        }

        .status-tag.assigned {
          background: #8b5cf6;
          color: white;
        }

        .status-tag.completed {
          background: #22c55e;
          color: white;
        }

        .status-tag.cancelled {
          background: #64748b;
          color: white;
        }

        .time-cell {
          font-size: 12px;
          vertical-align: middle;
        }

        .time-main {
          color: #475569;
          font-weight: 500;
          line-height: 1.4;
        }

        .time-secondary {
          color: #475569;
          font-weight: 400;
          font-size: 11px;
          margin-top: 2px;
          line-height: 1.4;
        }

        .time-ago {
          color: #94a3b8;
          font-size: 11px;
          margin-top: 2px;
          line-height: 1.4;
        }

        .sortable {
          cursor: pointer;
          user-select: none;
          transition: color 0.15s;
        }

        .sortable:hover {
          color: #3b82f6;
        }

        .groupable {
          cursor: pointer;
          user-select: none;
          transition: all 0.15s;
          position: relative;
        }

        .groupable:hover {
          background-color: rgba(59, 130, 246, 0.05);
        }

        .groupable.grouped {
          background-color: rgba(59, 130, 246, 0.1);
          font-weight: 700;
        }

        .group-indicator {
          font-size: 10px;
          color: #3b82f6;
          margin-left: 6px;
          font-weight: 600;
        }

        .group-header-row {
          background-color: #f8fafc;
          cursor: pointer;
          transition: background-color 0.15s;
        }

        .group-header-row:hover {
          background-color: #f1f5f9;
        }

        .group-header {
          padding: 12px 32px !important;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-top: 2px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
          width: 100%;
        }

        .group-header-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .group-chevron {
          color: #64748b;
          flex-shrink: 0;
        }

        .group-header strong {
          color: #1e293b;
        }

        .group-count {
          color: #64748b;
          font-weight: 500;
          margin-left: 4px;
        }

        .th-content {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        }

        :global(.sort-icon) {
          display: inline-flex;
          flex-shrink: 0;
        }

        :global(.sort-icon.inactive) {
          opacity: 0.3;
        }

        :global(.sort-icon.active) {
          color: #3b82f6;
        }

        .loading-cell, .empty-cell {
          text-align: center;
          padding: 80px;
          color: #94a3b8;
        }

        .loading-cell p {
          margin-top: 16px;
          font-weight: 600;
        }

        /* Animations */
        .fade-in {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .pulse {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        :global(.spinning) { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </DashboardLayout>
  )
}

export default withSupabaseAuth(TicketsPage)
