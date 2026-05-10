import React, { useState, useEffect } from 'react'
import { ExternalLink, ChevronDown, Sparkles } from 'lucide-react'
import { 
  TicketWithRelations, 
  TicketStatus, 
  TicketPriority,
  getPriorityColor,
  getStatusColor,
  getCategoryDisplayName
} from '../types'
import { updateTicketStatus, updateTicketPriority, fetchTicketById } from '../lib/api'
import { openTicketInDashboard } from '../lib/auth'
import { buildYardiAutofillPayloadV1 } from '../lib/yardi-autofill-payload'
import CopyableField from '../components/CopyableField'

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
  const [targetTabReady, setTargetTabReady] = useState(false)
  const [autofillRunning, setAutofillRunning] = useState(false)

  useEffect(() => {
    let cancelled = false
    const refreshTarget = () => {
      try {
        if (typeof chrome === 'undefined' || !chrome.runtime?.id) {
          if (!cancelled) setTargetTabReady(false)
          return
        }
        chrome.runtime.sendMessage({ type: 'SQFT_YARDI_STATUS_QUERY' }, (response) => {
          if (cancelled) return
          if (chrome.runtime.lastError) {
            setTargetTabReady(false)
            return
          }
          setTargetTabReady(!!response?.yardiReady)
        })
      } catch {
        if (!cancelled) setTargetTabReady(false)
      }
    }
    refreshTarget()
    const interval = setInterval(refreshTarget, 2500)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])
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

  const autofillTooltip = targetTabReady
    ? 'Fill the open work-order tab with this ticket'
    : 'Open a work-order form tab (same browser) to enable autofill'

  const handleAutofillExternal = () => {
    if (!targetTabReady || autofillRunning) return
    setAutofillRunning(true)
    const payload = buildYardiAutofillPayloadV1(ticket)
    try {
      chrome.runtime.sendMessage(
        { type: 'SQFT_EXECUTE_YARDI_AUTOFILL', payload },
        (response) => {
          setAutofillRunning(false)
          if (chrome.runtime.lastError) {
            showToast(chrome.runtime.lastError.message || 'Autofill failed')
            return
          }
          if (response?.ok) {
            showToast('Autofill applied')
          } else {
            showToast((response?.error as string) || 'Autofill failed')
          }
        }
      )
    } catch (e) {
      setAutofillRunning(false)
      showToast(String(e))
    }
  }

  const priorityColor = getPriorityColor(ticket.priority)
  const statusColor = getStatusColor(ticket.status)

  const fillPreview = buildYardiAutofillPayloadV1(ticket)
  const meta = ticket.ai_metadata || {}
  const yf = meta.yardi_fields

  const briefDisplay =
    (typeof meta.brief_description === 'string' && meta.brief_description.trim()) ||
    (typeof yf?.brief_description === 'string' && yf.brief_description.trim()) ||
    (ticket.title || '').trim() ||
    ''

  const problemDisplay =
    (typeof meta.problem_description === 'string' && meta.problem_description.trim()) ||
    (typeof yf?.problem_description === 'string' && yf.problem_description.trim()) ||
    (ticket.description || '').trim() ||
    ''

  const yfProblemOnly = (typeof yf?.problem_description === 'string' && yf.problem_description.trim()) || ''
  const showLegacyYardiProblem =
    !!yfProblemOnly && yfProblemOnly !== problemDisplay.trim()

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

        {/* Match main app: brief + problem + category; autofill uses same payload as below */}
        {briefDisplay ? (
          <CopyableField label="Brief description" value={briefDisplay} showToast={showToast} />
        ) : (
          <p className="text-xs text-slate-500 mb-1">
            No brief on file — autofill will use the ticket title (trimmed to 35 chars) if available.
          </p>
        )}

        {problemDisplay ? (
          <CopyableField label="Description" value={problemDisplay} showToast={showToast} />
        ) : null}

        <CopyableField
          label="Category"
          value={getCategoryDisplayName(ticket.category)}
          showToast={showToast}
        />

        <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3 space-y-1">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Work order form (autofill)
          </p>
          <CopyableField label="Work order priority" value={fillPreview.priority} showToast={showToast} />
          <CopyableField label="Work order category" value={fillPreview.category || '—'} showToast={showToast} />
          {fillPreview.subcategory ? (
            <CopyableField label="Work order subcategory" value={fillPreview.subcategory} showToast={showToast} />
          ) : (
            <p className="text-xs text-slate-500 py-1">Subcategory — not set (optional)</p>
          )}
        </div>
        
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
        
        {showLegacyYardiProblem ? (
          <CopyableField
            label="Yardi problem description (legacy)"
            value={yfProblemOnly}
            showToast={showToast}
          />
        ) : null}
        
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
        
        {/* Work-order autofill — matches dashboard slate / primary button patterns */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-800">Autofill work order</p>
          <p className="text-xs text-slate-500 mt-1 mb-3 leading-snug">
            {targetTabReady
              ? 'A work-order form tab is open. Fills brief, full description, priority, category, and subcategory from the values above.'
              : 'Open your work-order form in another tab in this browser, then return here.'}
          </p>
          <button
            type="button"
            disabled={!targetTabReady || autofillRunning}
            title={autofillTooltip}
            onClick={handleAutofillExternal}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg border border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            <Sparkles size={18} className="shrink-0" />
            {autofillRunning ? 'Applying…' : 'Autofill open tab'}
          </button>
        </div>

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
