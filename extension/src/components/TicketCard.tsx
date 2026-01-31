import React from 'react'
import { ChevronRight } from 'lucide-react'
import { 
  TicketWithRelations, 
  getPriorityColor, 
  getCategoryDisplayName,
  formatRelativeTime
} from '../types'
import CategoryIcon from './CategoryIcon'

interface TicketCardProps {
  ticket: TicketWithRelations
  onClick: () => void
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket, onClick }) => {
  const priorityColor = getPriorityColor(ticket.priority)
  
  // Get unit info
  const unitInfo = ticket.unit?.unit_number 
    ? `Unit ${ticket.unit.unit_number}`
    : ticket.ai_metadata?.unit_number 
      ? `Unit ${ticket.ai_metadata.unit_number}`
      : ticket.location_raw || null
  
  return (
    <button
      onClick={onClick}
      className="w-full bg-white border border-slate-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all text-left group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Title and number */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-slate-400">#{ticket.ticket_number}</span>
            <span 
              className="text-xs font-semibold px-1.5 py-0.5 rounded"
              style={{ 
                backgroundColor: priorityColor.bg, 
                color: priorityColor.text,
                border: `1px solid ${priorityColor.border}`
              }}
            >
              {ticket.priority.toUpperCase()}
            </span>
          </div>
          
          {/* Title */}
          <h3 className="text-sm font-medium text-slate-800 truncate mb-1.5">
            {ticket.title || ticket.description?.slice(0, 60) || 'No title'}
          </h3>
          
          {/* Category and unit */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CategoryIcon category={ticket.category} size={14} />
            <span className="font-medium">{getCategoryDisplayName(ticket.category)}</span>
            {unitInfo && (
              <>
                <span className="text-slate-300">•</span>
                <span>{unitInfo}</span>
              </>
            )}
          </div>
          
          {/* Time */}
          <div className="text-xs text-slate-400 mt-1.5">
            {formatRelativeTime(ticket.created_at)}
          </div>
        </div>
        
        {/* Arrow */}
        <ChevronRight 
          size={18} 
          className="text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-2" 
        />
      </div>
    </button>
  )
}

export default TicketCard
