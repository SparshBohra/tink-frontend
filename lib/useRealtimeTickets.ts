import { useState, useEffect, useCallback } from 'react'
import { Ticket } from './supabase-types'
import { fetchTickets, subscribeToTickets, TicketFilters, TicketSortOptions } from './ticket-service'

interface UseRealtimeTicketsOptions {
  organizationId: string | null
  filters?: TicketFilters
  sort?: TicketSortOptions
  enabled?: boolean
}

interface UseRealtimeTicketsResult {
  tickets: Ticket[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  newTicketCount: number
  clearNewTicketCount: () => void
}

/**
 * Hook for real-time ticket updates with Supabase
 * Automatically subscribes to INSERT and UPDATE events
 */
export function useRealtimeTickets({
  organizationId,
  filters,
  sort,
  enabled = true
}: UseRealtimeTicketsOptions): UseRealtimeTicketsResult {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newTicketCount, setNewTicketCount] = useState(0)

  // Load tickets
  const refresh = useCallback(async () => {
    if (!organizationId || !enabled) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const result = await fetchTickets(organizationId, filters, sort)
    
    if (result.error) {
      setError(result.error)
    } else {
      setTickets(result.tickets)
    }
    
    setLoading(false)
  }, [organizationId, filters, sort, enabled])

  // Initial load
  useEffect(() => {
    refresh()
  }, [refresh])

  // Real-time subscription
  useEffect(() => {
    if (!organizationId || !enabled) return

    const unsubscribe = subscribeToTickets(
      organizationId,
      // On INSERT
      (newTicket) => {
        // Check if ticket matches current filters
        if (filters?.status && filters.status !== 'all' && newTicket.status !== filters.status) {
          return
        }
        if (filters?.priority && filters.priority !== 'all' && newTicket.priority !== filters.priority) {
          return
        }

        setTickets(prev => {
          // Check if ticket already exists
          if (prev.some(t => t.id === newTicket.id)) {
            return prev.map(t => t.id === newTicket.id ? newTicket : t)
          }
          // Add to top with animation trigger
          return [{ ...newTicket, _isNew: true } as Ticket, ...prev]
        })
        
        setNewTicketCount(count => count + 1)
        
        // Clear "new" flag after animation
        setTimeout(() => {
          setTickets(prev => 
            prev.map(t => 
              t.id === newTicket.id ? { ...t, _isNew: undefined } as Ticket : t
            )
          )
        }, 3000)
      },
      // On UPDATE
      (updatedTicket) => {
        setTickets(prev => 
          prev.map(t => 
            t.id === updatedTicket.id ? updatedTicket : t
          )
        )
      }
    )

    return () => unsubscribe()
  }, [organizationId, filters, enabled])

  const clearNewTicketCount = useCallback(() => {
    setNewTicketCount(0)
  }, [])

  return {
    tickets,
    loading,
    error,
    refresh,
    newTicketCount,
    clearNewTicketCount
  }
}

// Play notification sound (optional)
export function playNotificationSound(): void {
  try {
    const audio = new Audio('/notification.mp3')
    audio.volume = 0.3
    audio.play().catch(() => {
      // Audio playback blocked by browser
    })
  } catch (err) {
    // Audio not supported
  }
}
