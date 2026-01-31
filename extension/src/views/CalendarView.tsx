import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { fetchTickets } from '../lib/api'
import { TicketWithRelations, getPriorityColor } from '../types'
import { openDashboard } from '../lib/auth'

interface CalendarViewProps {
  organizationId: string
}

const CalendarView: React.FC<CalendarViewProps> = ({ organizationId }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [tickets, setTickets] = useState<TicketWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  // Load tickets for the month
  useEffect(() => {
    const loadTickets = async () => {
      setLoading(true)
      const data = await fetchTickets(organizationId)
      setTickets(data)
      setLoading(false)
    }
    loadTickets()
  }, [organizationId])
  
  // Get days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  
  // Create calendar grid
  const days: (number | null)[] = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }
  
  // Get tickets for today
  const today = new Date()
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year
  const todayDate = today.getDate()
  
  const todaysTickets = tickets.filter(t => {
    const ticketDate = new Date(t.created_at)
    return ticketDate.getDate() === todayDate &&
           ticketDate.getMonth() === month &&
           ticketDate.getFullYear() === year
  })
  
  // Get ticket count for a day
  const getTicketCountForDay = (day: number): number => {
    return tickets.filter(t => {
      const ticketDate = new Date(t.created_at)
      return ticketDate.getDate() === day &&
             ticketDate.getMonth() === month &&
             ticketDate.getFullYear() === year
    }).length
  }
  
  // Navigate months
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }
  
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }
  
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
  
  return (
    <div className="flex flex-col h-full overflow-y-auto p-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={18} className="text-slate-600" />
        </button>
        <h2 className="text-sm font-semibold text-slate-800">
          {monthName}
        </h2>
        <button
          onClick={nextMonth}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronRight size={18} className="text-slate-600" />
        </button>
      </div>
      
      {/* Calendar Grid */}
      <div className="bg-white rounded-lg border border-slate-200 p-3 mb-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-center text-xs font-medium text-slate-400 py-1">
              {day}
            </div>
          ))}
        </div>
        
        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            if (day === null) {
              return <div key={i} className="aspect-square" />
            }
            
            const isToday = isCurrentMonth && day === todayDate
            const ticketCount = getTicketCountForDay(day)
            
            return (
              <div
                key={i}
                className={`aspect-square flex flex-col items-center justify-center text-xs rounded-md relative ${
                  isToday 
                    ? 'bg-blue-600 text-white font-semibold' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {day}
                {ticketCount > 0 && (
                  <div className={`absolute bottom-0.5 w-1 h-1 rounded-full ${
                    isToday ? 'bg-white' : 'bg-blue-500'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Today's Tickets */}
      <div className="flex-1">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Today's Tickets ({todaysTickets.length})
        </h3>
        
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : todaysTickets.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">
            No tickets today
          </p>
        ) : (
          <div className="space-y-2">
            {todaysTickets.slice(0, 5).map(ticket => {
              const priorityColor = getPriorityColor(ticket.priority)
              return (
                <div
                  key={ticket.id}
                  className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg text-sm"
                >
                  <span className="text-slate-400">#{ticket.ticket_number}</span>
                  <span className="flex-1 truncate text-slate-700">
                    {ticket.title || 'Maintenance Request'}
                  </span>
                  <span
                    className="text-xs font-medium px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: priorityColor.bg,
                      color: priorityColor.text
                    }}
                  >
                    {ticket.priority.toUpperCase()}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      {/* View Full Calendar */}
      <button
        onClick={openDashboard}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors mt-4"
      >
        <ExternalLink size={16} />
        View Full Calendar
      </button>
    </div>
  )
}

export default CalendarView
