import React, { useState, useEffect, useCallback } from 'react'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { fetchTickets, TicketFilters, TicketSortOptions } from '../lib/api'
import { TicketWithRelations, TicketPriority } from '../types'
import FilterBar from '../components/FilterBar'
import TicketCard from '../components/TicketCard'

interface TicketListViewProps {
  organizationId: string
  onTicketSelect: (ticket: TicketWithRelations) => void
  showToast: (message: string) => void
}

const TicketListView: React.FC<TicketListViewProps> = ({
  organizationId,
  onTicketSelect,
  showToast
}) => {
  const [tickets, setTickets] = useState<TicketWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all')
  const [sortField, setSortField] = useState<'created_at' | 'priority'>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  
  // Load tickets
  const loadTickets = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)
      
      const filters: TicketFilters = {
        priority: priorityFilter,
        search: searchQuery
      }
      
      const sort: TicketSortOptions = {
        field: sortField,
        direction: sortDirection
      }
      
      const data = await fetchTickets(organizationId, filters, sort)
      setTickets(data)
      
      if (isRefresh) {
        showToast('Refreshed')
      }
    } catch (err) {
      console.error('Error loading tickets:', err)
      setError('Failed to load tickets')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [organizationId, priorityFilter, searchQuery, sortField, sortDirection, showToast])
  
  // Initial load
  useEffect(() => {
    loadTickets()
  }, [loadTickets])
  
  // Handle sort change
  const handleSortChange = (field: 'created_at' | 'priority', direction: 'asc' | 'desc') => {
    setSortField(field)
    setSortDirection(direction)
  }
  
  // Handle refresh
  const handleRefresh = () => {
    loadTickets(true)
  }
  
  return (
    <div className="flex flex-col h-full">
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
      />
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-500">
            <AlertCircle size={24} className="text-red-400 mb-2" />
            <p className="text-sm">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-2 text-xs text-blue-500 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400">
            <p className="text-sm">No tickets found</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => onTicketSelect(ticket)}
            />
          ))
        )}
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-t border-slate-200 text-xs text-slate-500">
        <span>{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</span>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1 text-slate-400 hover:text-blue-500 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>
    </div>
  )
}

export default TicketListView
