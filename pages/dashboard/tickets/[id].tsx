import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSupabaseAuth, withSupabaseAuth } from '../../../lib/supabase-auth-context'
import { 
  TicketWithRelations, 
  TicketStatus, 
  TicketPriority,
  getCategoryIcon,
  getCategoryDisplayName,
  getPriorityDisplayName,
  getPriorityColor,
  getStatusDisplayName,
  getStatusColor
} from '../../../lib/supabase-types'
import { 
  fetchTicketById, 
  updateTicketStatus,
  updateTicketPriority
} from '../../../lib/ticket-service'
import DashboardLayout from '../../../components/DashboardLayout'
import CopyButton from '../../../components/CopyButton'
import { 
  ArrowLeft, 
  Clock, 
  MapPin,
  Mail,
  MessageSquare,
  Bot,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Building2,
  Hash
} from 'lucide-react'

function TicketDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const { organizationId } = useSupabaseAuth()
  
  const [ticket, setTicket] = useState<TicketWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !organizationId) return
    
    const loadTicket = async () => {
      setLoading(true)
      setError(null)
      
      const result = await fetchTicketById(id as string, organizationId)
      
      if (result.error) {
        setError(result.error)
      } else {
        setTicket(result.ticket)
      }
      
      setLoading(false)
    }
    
    loadTicket()
  }, [id, organizationId])

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket || !organizationId || updating) return
    
    setUpdating(true)
    const result = await updateTicketStatus(ticket.id, organizationId, newStatus)
    
    if (result.success) {
      setTicket({ ...ticket, status: newStatus, updated_at: new Date().toISOString() })
      setSuccessMessage('Status updated successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    }
    
    setUpdating(false)
  }

  const handlePriorityChange = async (newPriority: TicketPriority) => {
    if (!ticket || !organizationId || updating) return
    
    setUpdating(true)
    const result = await updateTicketPriority(ticket.id, organizationId, newPriority)
    
    if (result.success) {
      setTicket({ ...ticket, priority: newPriority, updated_at: new Date().toISOString() })
      setSuccessMessage('Priority updated successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    }
    
    setUpdating(false)
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (loading) {
    return (
      <DashboardLayout title="Loading...">
        <div className="loading-container">
          <RefreshCw size={32} className="spinning" />
          <p>Loading ticket details...</p>
        </div>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 100px 20px;
            color: #64748b;
          }
          .loading-container :global(.spinning) {
            animation: spin 1s linear infinite;
            color: #3b82f6;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          p { margin-top: 16px; }
        `}</style>
      </DashboardLayout>
    )
  }

  if (error || !ticket) {
    return (
      <DashboardLayout title="Error">
        <div className="error-container">
          <AlertTriangle size={48} />
          <h2>Ticket not found</h2>
          <p>{error || 'Unable to load ticket details'}</p>
          <Link href="/dashboard/tickets" className="back-link">
            <ArrowLeft size={18} />
            Back to tickets
          </Link>
        </div>
        <style jsx>{`
          .error-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 100px 20px;
            color: #64748b;
            text-align: center;
          }
          h2 { color: #1e293b; margin: 16px 0 8px; }
          .back-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-top: 24px;
            padding: 10px 20px;
            background: #3b82f6;
            color: white;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
          }
        `}</style>
      </DashboardLayout>
    )
  }

  const priorityColors = getPriorityColor(ticket.priority)
  const statusColors = getStatusColor(ticket.status)

  return (
    <DashboardLayout title={`Ticket #${ticket.ticket_number}`}>
      <Head>
        <title>Ticket #{ticket.ticket_number} - SquareFt</title>
      </Head>

      <div className="ticket-detail">
        {/* Header */}
        <div className="header">
          <Link href="/dashboard/tickets" className="back-btn">
            <ArrowLeft size={18} />
            Back
          </Link>
          
          <div className="header-content">
            <div className="header-left">
              <span className="category-icon">{getCategoryIcon(ticket.category)}</span>
              <div>
                <h1>Ticket #{ticket.ticket_number}</h1>
                <span className="category-label">{getCategoryDisplayName(ticket.category)}</span>
              </div>
            </div>
            
            <div className="header-right">
              <div className="control-group">
                <label>Priority</label>
                <select
                  value={ticket.priority}
                  onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                  disabled={updating}
                  style={{ 
                    background: priorityColors.bg, 
                    color: priorityColors.text,
                    borderColor: priorityColors.border
                  }}
                >
                  <option value="emergency">Emergency</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              
              <div className="control-group">
                <label>Status</label>
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                  disabled={updating}
                  style={{ 
                    background: statusColors.bg, 
                    color: statusColors.text,
                    borderColor: statusColors.border
                  }}
                >
                  <option value="triage">Triage</option>
                  <option value="open">Open</option>
                  <option value="assigned">Assigned</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="success-toast">
            <CheckCircle size={18} />
            {successMessage}
          </div>
        )}

        <div className="content-grid">
          {/* Main Content */}
          <div className="main-content">
            {/* Title & Description */}
            <div className="section">
              <div className="section-header">
                <h2>Problem Description</h2>
                <CopyButton 
                  text={ticket.description || ticket.title || ''} 
                  label="Description"
                />
              </div>
              <div className="field-value large">
                {ticket.title && <p className="title-text">{ticket.title}</p>}
                {ticket.description && <p className="description-text">{ticket.description}</p>}
                {!ticket.title && !ticket.description && <p className="empty">No description provided</p>}
              </div>
            </div>

            {/* Location */}
            {ticket.location_raw && (
              <div className="section">
                <div className="section-header">
                  <h2><MapPin size={18} /> Location</h2>
                  <CopyButton text={ticket.location_raw} label="Location" />
                </div>
                <div className="field-value">
                  {ticket.location_raw}
                </div>
              </div>
            )}

            {/* AI Metadata */}
            {ticket.ai_metadata && Object.keys(ticket.ai_metadata).length > 0 && (
              <div className="section ai-section">
                <div className="section-header">
                  <h2><Bot size={18} /> AI Parsed Fields</h2>
                </div>
                <div className="ai-fields">
                  {Object.entries(ticket.ai_metadata).map(([key, value]) => {
                    if (!value || key === 'yardi_fields') return null
                    
                    const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value)
                    
                    return (
                      <div key={key} className="ai-field">
                        <span className="field-label">{displayKey}</span>
                        <div className="field-value-row">
                          <span className="field-value">{displayValue}</span>
                          <CopyButton text={displayValue} label={displayKey} size="sm" />
                        </div>
                      </div>
                    )
                  })}

                  {/* Yardi Fields */}
                  {ticket.ai_metadata.yardi_fields && (
                    <div className="yardi-section">
                      <h3>Yardi Voyager Fields</h3>
                      {Object.entries(ticket.ai_metadata.yardi_fields).map(([key, value]) => {
                        if (!value) return null
                        
                        const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                        
                        return (
                          <div key={key} className="ai-field yardi-field">
                            <span className="field-label">{displayKey}</span>
                            <div className="field-value-row">
                              <span className="field-value">{value}</span>
                              <CopyButton text={value} label={displayKey} size="sm" />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Original Messages */}
            {ticket.inbound_messages && ticket.inbound_messages.length > 0 && (
              <div className="section">
                <div className="section-header">
                  <h2><MessageSquare size={18} /> Original Message{ticket.inbound_messages.length > 1 ? 's' : ''}</h2>
                </div>
                <div className="messages-list">
                  {ticket.inbound_messages.map((msg) => (
                    <div key={msg.id} className="message-card">
                      <div className="message-header">
                        <span className={`source-badge ${msg.source}`}>
                          {msg.source === 'email' ? <Mail size={14} /> : <MessageSquare size={14} />}
                          {msg.source}
                        </span>
                        {msg.sender_email && <span className="sender">{msg.sender_email}</span>}
                        <span className="time">{formatDate(msg.processed_at)}</span>
                      </div>
                      {msg.raw_subject && (
                        <div className="message-subject">
                          <strong>Subject:</strong> {msg.raw_subject}
                          <CopyButton text={msg.raw_subject} label="Subject" size="sm" />
                        </div>
                      )}
                      {msg.raw_body && (
                        <div className="message-body">
                          {msg.raw_body}
                          <CopyButton text={msg.raw_body} label="Message body" size="sm" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="sidebar">
            {/* Metadata */}
            <div className="sidebar-card">
              <h3>Details</h3>
              <div className="meta-list">
                <div className="meta-item">
                  <Hash size={16} />
                  <span className="meta-label">Ticket #</span>
                  <span className="meta-value">{ticket.ticket_number}</span>
                </div>
                <div className="meta-item">
                  <Clock size={16} />
                  <span className="meta-label">Created</span>
                  <span className="meta-value">{formatDate(ticket.created_at)}</span>
                </div>
                <div className="meta-item">
                  <Clock size={16} />
                  <span className="meta-label">Updated</span>
                  <span className="meta-value">{formatDate(ticket.updated_at)}</span>
                </div>
                {ticket.property && (
                  <div className="meta-item">
                    <Building2 size={16} />
                    <span className="meta-label">Property</span>
                    <span className="meta-value">{ticket.property.name}</span>
                  </div>
                )}
                {ticket.unit && (
                  <div className="meta-item">
                    <Hash size={16} />
                    <span className="meta-label">Unit</span>
                    <span className="meta-value">{ticket.unit.unit_number}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="sidebar-card">
              <h3>Quick Actions</h3>
              <div className="actions">
                <button 
                  className="action-btn primary"
                  onClick={() => handleStatusChange('open')}
                  disabled={ticket.status === 'open' || updating}
                >
                  Mark as Open
                </button>
                <button 
                  className="action-btn success"
                  onClick={() => handleStatusChange('completed')}
                  disabled={ticket.status === 'completed' || updating}
                >
                  Mark Completed
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .ticket-detail {
          max-width: 1200px;
          margin: 0 auto;
        }

        /* Header */
        .header {
          margin-bottom: 24px;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: #f1f5f9;
          color: #475569;
          border-radius: 8px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 16px;
          transition: all 0.2s;
        }

        .back-btn:hover {
          background: #e2e8f0;
          color: #1e293b;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 20px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .category-icon {
          font-size: 40px;
        }

        .header-left h1 {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .category-label {
          font-size: 14px;
          color: #64748b;
        }

        .header-right {
          display: flex;
          gap: 16px;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .control-group label {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .control-group select {
          padding: 8px 12px;
          border: 1px solid;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          min-width: 130px;
        }

        /* Success Toast */
        .success-toast {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #d1fae5;
          border: 1px solid #a7f3d0;
          border-radius: 8px;
          color: #065f46;
          font-size: 14px;
          margin-bottom: 24px;
        }

        /* Content Grid */
        .content-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 24px;
        }

        /* Section */
        .section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          border: 1px solid #e2e8f0;
          margin-bottom: 20px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-header h2 {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .field-value {
          color: #475569;
          line-height: 1.6;
        }

        .field-value.large {
          font-size: 15px;
        }

        .title-text {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 12px 0;
        }

        .description-text {
          margin: 0;
          white-space: pre-wrap;
        }

        .empty {
          color: #94a3b8;
          font-style: italic;
        }

        /* AI Section */
        .ai-section {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }

        .ai-fields {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ai-field {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 12px 16px;
          background: white;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .field-label {
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          min-width: 140px;
        }

        .field-value-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          justify-content: flex-end;
        }

        .field-value-row .field-value {
          text-align: right;
          font-size: 14px;
          color: #1e293b;
        }

        .yardi-section {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }

        .yardi-section h3 {
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
          margin: 0 0 12px 0;
        }

        .yardi-field {
          background: #fffbeb;
          border-color: #fef3c7;
        }

        /* Messages */
        .messages-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .message-card {
          background: #f8fafc;
          border-radius: 8px;
          padding: 16px;
        }

        .message-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .source-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .source-badge.email {
          background: #dbeafe;
          color: #2563eb;
        }

        .source-badge.sms {
          background: #d1fae5;
          color: #059669;
        }

        .sender {
          font-size: 14px;
          color: #1e293b;
        }

        .time {
          font-size: 13px;
          color: #94a3b8;
          margin-left: auto;
        }

        .message-subject {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #475569;
          margin-bottom: 12px;
        }

        .message-body {
          font-size: 14px;
          color: #475569;
          line-height: 1.6;
          white-space: pre-wrap;
          background: white;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          position: relative;
        }

        /* Sidebar */
        .sidebar {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .sidebar-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          border: 1px solid #e2e8f0;
        }

        .sidebar-card h3 {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 16px 0;
        }

        .meta-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: #64748b;
        }

        .meta-label {
          flex: 1;
        }

        .meta-value {
          font-weight: 500;
          color: #1e293b;
        }

        .actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .action-btn {
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-btn.primary {
          background: #3b82f6;
          color: white;
        }

        .action-btn.primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .action-btn.success {
          background: #10b981;
          color: white;
        }

        .action-btn.success:hover:not(:disabled) {
          background: #059669;
        }

        @media (max-width: 1024px) {
          .content-grid {
            grid-template-columns: 1fr;
          }

          .sidebar {
            flex-direction: row;
            flex-wrap: wrap;
          }

          .sidebar-card {
            flex: 1;
            min-width: 280px;
          }
        }

        @media (max-width: 640px) {
          .header-content {
            flex-direction: column;
          }

          .header-right {
            width: 100%;
            justify-content: flex-start;
          }
        }
      `}</style>
    </DashboardLayout>
  )
}

export default withSupabaseAuth(TicketDetailPage)
