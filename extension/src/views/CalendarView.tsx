import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink, ArrowLeft } from 'lucide-react'
import { fetchTickets } from '../lib/api'
import { TicketWithRelations, getPriorityColor, formatRelativeTime } from '../types'
import { openDashboard } from '../lib/auth'

interface CalendarViewProps {
  organizationId: string
}

const CalendarView: React.FC<CalendarViewProps> = ({ organizationId }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [tickets, setTickets] = useState<TicketWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  // Load tickets
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
  
  // Get tickets for a specific day
  const getTicketsForDay = (day: number): TicketWithRelations[] => {
    return tickets.filter(t => {
      const ticketDate = new Date(t.created_at)
      return ticketDate.getDate() === day &&
             ticketDate.getMonth() === month &&
             ticketDate.getFullYear() === year
    })
  }
  
  // Today's info
  const today = new Date()
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year
  const todayDate = today.getDate()
  
  // Selected day tickets
  const selectedDayTickets = selectedDate 
    ? getTicketsForDay(selectedDate.getDate())
    : []
  
  // Navigate months
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDate(null)
  }
  
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDate(null)
  }
  
  // Handle day click
  const handleDayClick = (day: number) => {
    setSelectedDate(new Date(year, month, day))
  }
  
  // Go back to calendar
  const handleBackToCalendar = () => {
    setSelectedDate(null)
  }
  
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
  
  // If a day is selected, show day detail view
  if (selectedDate) {
    const selectedDay = selectedDate.getDate()
    const dayName = selectedDate.toLocaleString('default', { weekday: 'long', month: 'long', day: 'numeric' })
    
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-200 bg-white">
          <button
            onClick={handleBackToCalendar}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">{dayName}</h2>
            <p className="text-xs text-slate-500">{selectedDayTickets.length} ticket{selectedDayTickets.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        
        {/* Tickets for selected day */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center h-20">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : selectedDayTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <p className="text-sm">No tickets on this day</p>
            </div>
          ) : (
            selectedDayTickets.map(ticket => {
              const priorityColor = getPriorityColor(ticket.priority)
              return (
                <div
                  key={ticket.id}
                  className="bg-white border border-slate-200 rounded-lg p-3"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs text-slate-400">#{ticket.ticket_number}</span>
                    <span
                      className="text-xs font-semibold px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: priorityColor.bg,
                        color: priorityColor.text
                      }}
                    >
                      {ticket.priority.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-slate-800 mb-1">
                    {ticket.title || 'Maintenance Request'}
                  </h3>
                  <p className="text-xs text-slate-500 mb-2 line-clamp-2">
                    {ticket.description || 'No description'}
                  </p>
                  <div className="text-xs text-slate-400">
                    {formatRelativeTime(ticket.created_at)}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col h-full overflow-y-auto p-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} className="text-slate-600" />
        </button>
        <h2 className="text-base font-semibold text-slate-800">
          {monthName}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronRight size={20} className="text-slate-600" />
        </button>
      </div>
      
      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-3">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
            <div key={i} className="text-center text-xs font-medium text-slate-400 py-2">
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
            const dayTickets = getTicketsForDay(day)
            const ticketCount = dayTickets.length
            const hasEmergency = dayTickets.some(t => t.priority === 'emergency')
            
            return (
              <button
                key={i}
                onClick={() => handleDayClick(day)}
                className={`aspect-square flex flex-col items-center justify-center text-sm rounded-lg relative transition-all hover:bg-slate-50 ${
                  isToday 
                    ? 'bg-blue-600 text-white font-semibold hover:bg-blue-700' 
                    : 'text-slate-700'
                }`}
              >
                <span>{day}</span>
                {ticketCount > 0 && (
                  <span 
                    className={`absolute bottom-1 text-[10px] font-bold px-1 rounded ${
                      isToday 
                        ? 'text-white/80' 
                        : hasEmergency 
                          ? 'text-red-600' 
                          : 'text-blue-600'
                    }`}
                  >
                    {ticketCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Today's Summary */}
      <div className="flex-1">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Today ({getTicketsForDay(todayDate).length} tickets)
        </h3>
        
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : getTicketsForDay(todayDate).length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">
            No tickets today
          </p>
        ) : (
          <div className="space-y-2">
            {getTicketsForDay(todayDate).slice(0, 5).map(ticket => {
              const priorityColor = getPriorityColor(ticket.priority)
              return (
                <div
                  key={ticket.id}
                  className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg text-sm"
                >
                  <span className="text-slate-400 text-xs">#{ticket.ticket_number}</span>
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
            {getTicketsForDay(todayDate).length > 5 && (
              <p className="text-xs text-slate-400 text-center py-2">
                +{getTicketsForDay(todayDate).length - 5} more
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* View Full Calendar */}
      <button
        onClick={openDashboard}
        className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors mt-4"
      >
        <ExternalLink size={16} />
        View Full Dashboard
      </button>
    </div>
  )
}

export default CalendarView
