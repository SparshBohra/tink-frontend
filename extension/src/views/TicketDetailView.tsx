import React, { useState } from 'react'
import { ExternalLink, ChevronDown } from 'lucide-react'
import { 
  TicketWithRelations, 
  TicketStatus, 
  TicketPriority,
  getPriorityDisplayName,
  getPriorityColor,
  getStatusDisplayName,
  getStatusColor,
  getCategoryDisplayName
} from '../types'
import { updateTicketStatus, updateTicketPriority, fetchTicketById } from '../lib/api'
import { openTicketInDashboard } from '../lib/auth'
import CopyableField from '../components/CopyableField'
import CategoryIcon from '../components/CategoryIcon'

interface TicketDetailViewProps {
  ticket: TicketWithRelations
  onBack: () => void
  onUpdate: (ticket: TicketWithRelations) => void
  showToast: (message: string) => void
}

const TicketDetailView: React.FC<TicketDetailViewProps> = ({
  ticket,
  onUpdate,
  showToast
}) => {
  const [updating, setUpdating] = useState(false)
  
  // Get first inbound message for source info
  const message = ticket.inbound_messages?.[0]
  
  // Handle status change
  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (newStatus === ticket.status || updating) return
    
    setUpdating(true)
    const success = await updateTicketStatus(ticket.id, newStatus)
    
    if (success) {
      const updated = await fetchTicketById(ticket.id)
      if (updated) {
        onUpdate(updated)
      }
    } else {
      showToast('Failed to update status')
    }
    setUpdating(false)
  }
  
  // Handle priority change
  const handlePriorityChange = async (newPriority: TicketPriority) => {
    if (newPriority === ticket.priority || updating) return
    
    setUpdating(true)
    const success = await updateTicketPriority(ticket.id, newPriority)
    
    if (success) {
      const updated = await fetchTicketById(ticket.id)
      if (updated) {
        onUpdate(updated)
      }
    } else {
      showToast('Failed to update priority')
    }
    setUpdating(false)
  }
  
  const priorityColor = getPriorityColor(ticket.priority)
  const statusColor = getStatusColor(ticket.status)
  
  // Get unit info
  const unitInfo = ticket.unit?.unit_number 
    ? `Unit ${ticket.unit.unit_number}`
    : ticket.ai_metadata?.unit_number 
      ? `Unit ${ticket.ai_metadata.unit_number}`
      : ticket.location_raw || null
  
  // Get sender info
  const senderName = message?.original_from_name || message?.sender_name || ticket.ai_metadata?.tenant_name
  const senderEmail = message?.original_from || message?.sender_email || ticket.ai_metadata?.tenant_email
  const senderPhone = message?.sender_phone || ticket.ai_metadata?.tenant_phone
  
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Title Section */}
        <div>
          <h2 className="text-base font-semibold text-slate-800 mb-1">
            {ticket.title || 'Maintenance Request'}
          </h2>
          {unitInfo && (
            <p className="text-sm text-slate-500">{unitInfo}</p>
          )}
        </div>
        
        {/* Status & Priority Dropdowns */}
        <div className="grid grid-cols-2 gap-3">
          {/* Priority */}
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
              Priority
            </label>
            <div className="relative">
              <select
                value={ticket.priority}
                onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                disabled={updating}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm font-medium rounded-lg border cursor-pointer disabled:opacity-50"
                style={{
                  backgroundColor: priorityColor.bg,
                  borderColor: priorityColor.border,
                  color: priorityColor.text
                }}
              >
                <option value="emergency">Emergency</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: priorityColor.text }} />
            </div>
          </div>
          
          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
              Status
            </label>
            <div className="relative">
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                disabled={updating}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm font-medium rounded-lg border cursor-pointer disabled:opacity-50"
                style={{
                  backgroundColor: statusColor.bg,
                  borderColor: statusColor.border,
                  color: statusColor.text
                }}
              >
                <option value="triage">Triage</option>
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: statusColor.text }} />
            </div>
          </div>
        </div>
        
        {/* Divider */}
        <hr className="border-slate-200" />
        
        {/* Copyable Fields */}
        <CopyableField 
          label="Category" 
          value={getCategoryDisplayName(ticket.category)}
          showToast={showToast}
        />
        
        <CopyableField 
          label="Description" 
          value={ticket.description}
          showToast={showToast}
        />
        
        {ticket.location_raw && (
          <CopyableField 
            label="Location" 
            value={ticket.location_raw}
            showToast={showToast}
          />
        )}
        
        {ticket.ai_metadata?.access_notes && (
          <CopyableField 
            label="Access Notes" 
            value={ticket.ai_metadata.access_notes}
            showToast={showToast}
          />
        )}
        
        {/* Source Details */}
        {(senderName || senderEmail || senderPhone) && (
          <>
            <hr className="border-slate-200" />
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Source Details
            </h3>
            
            {senderName && (
              <CopyableField 
                label="From" 
                value={senderName}
                showToast={showToast}
              />
            )}
            
            {senderEmail && (
              <CopyableField 
                label="Email" 
                value={senderEmail}
                showToast={showToast}
              />
            )}
            
            {senderPhone && (
              <CopyableField 
                label="Phone" 
                value={senderPhone}
                showToast={showToast}
              />
            )}
          </>
        )}
        
        {/* AI Metadata extras */}
        {ticket.ai_metadata?.yardi_fields?.problem_description && (
          <CopyableField 
            label="Yardi Problem Description" 
            value={ticket.ai_metadata.yardi_fields.problem_description}
            showToast={showToast}
          />
        )}
        
        {/* Received time */}
        {message?.received_at && (
          <CopyableField 
            label="Received" 
            value={new Date(message.received_at).toLocaleString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })}
            showToast={showToast}
          />
        )}
        
        {/* Open in Dashboard button */}
        <button
          onClick={() => openTicketInDashboard(ticket.id)}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <ExternalLink size={16} />
          Open in Dashboard
        </button>
      </div>
    </div>
  )
}

export default TicketDetailView
