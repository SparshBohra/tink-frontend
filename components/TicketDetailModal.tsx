import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  MapPin, 
  Mail, 
  MessageSquare, 
  Bot, 
  AlertTriangle, 
  CheckCircle,
  Copy,
  Building2,
  Hash,
  Calendar,
  Save,
  Trash2,
  Edit2
} from 'lucide-react';
import { 
  TicketWithRelations, 
  TicketStatus, 
  TicketPriority,
  getCategoryDisplayName,
  getPriorityColor
} from '../lib/supabase-types';
import CategoryIcon from './CategoryIcon';
import { updateTicketStatus, updateTicketPriority } from '../lib/ticket-service';
import CopyButton from './CopyButton';
import { activityLogger } from '../lib/activity-logger';

interface Note {
  id: string;
  text: string;
  created_at: string;
}

interface TicketDetailModalProps {
  ticket: TicketWithRelations;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedTicket: TicketWithRelations) => void;
  organizationId: string | null;
}

export default function TicketDetailModal({ 
  ticket: initialTicket, 
  isOpen, 
  onClose, 
  onUpdate,
  organizationId 
}: TicketDetailModalProps) {
  const [ticket, setTicket] = useState<TicketWithRelations>(initialTicket);
  const [updating, setUpdating] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [notesList, setNotesList] = useState<Note[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setTicket(initialTicket);
    // Load notes list from localStorage
    const savedNotes = localStorage.getItem(`ticket_notes_list_${initialTicket.id}`);
    if (savedNotes) {
      try {
        setNotesList(JSON.parse(savedNotes));
      } catch {
        setNotesList([]);
      }
    } else {
      setNotesList([]);
    }
    setNoteInput('');
    setEditingNoteId(null);
  }, [initialTicket]);

  if (!isOpen) return null;

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!organizationId) {
      showError('No organization found');
      return;
    }
    if (updating) return;
    
    const oldStatus = ticket.status;
    setUpdating(true);
    setErrorMessage(null);
    
    console.log('Updating status:', { ticketId: ticket.id, organizationId, newStatus });
    const result = await updateTicketStatus(ticket.id, organizationId, newStatus);
    
    if (result.success) {
      const updated = { ...ticket, status: newStatus, updated_at: new Date().toISOString() };
      setTicket(updated);
      onUpdate(updated);
      showSuccess('Status updated');
      // Log status change
      activityLogger.logStatusChange(ticket.id, ticket.ticket_number, oldStatus, newStatus);
    } else {
      console.error('Status update failed:', result.error);
      showError(result.error || 'Failed to update status');
    }
    setUpdating(false);
  };

  const handlePriorityChange = async (newPriority: TicketPriority) => {
    if (!organizationId) {
      showError('No organization found');
      return;
    }
    if (updating) return;
    
    const oldPriority = ticket.priority;
    setUpdating(true);
    setErrorMessage(null);
    
    console.log('Updating priority:', { ticketId: ticket.id, organizationId, newPriority });
    const result = await updateTicketPriority(ticket.id, organizationId, newPriority);
    
    if (result.success) {
      const updated = { ...ticket, priority: newPriority, updated_at: new Date().toISOString() };
      setTicket(updated);
      onUpdate(updated);
      showSuccess('Priority updated');
      // Log priority change
      activityLogger.logPriorityChange(ticket.id, ticket.ticket_number, oldPriority, newPriority);
    } else {
      console.error('Priority update failed:', result.error);
      showError(result.error || 'Failed to update priority');
    }
    setUpdating(false);
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setErrorMessage(null);
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setSuccessMessage(null);
    setTimeout(() => setErrorMessage(null), 3000);
  };

  // Notes functions
  const saveNotesToStorage = (notes: Note[]) => {
    localStorage.setItem(`ticket_notes_list_${ticket.id}`, JSON.stringify(notes));
  };

  const handleAddNote = () => {
    if (!noteInput.trim()) return;
    const newNote: Note = {
      id: Date.now().toString(),
      text: noteInput.trim(),
      created_at: new Date().toISOString()
    };
    const updated = [newNote, ...notesList];
    setNotesList(updated);
    saveNotesToStorage(updated);
    setNoteInput('');
    showSuccess('Note added');
    activityLogger.logNoteAdd(ticket.id, ticket.ticket_number);
  };

  const handleDeleteNote = (noteId: string) => {
    const updated = notesList.filter(n => n.id !== noteId);
    setNotesList(updated);
    saveNotesToStorage(updated);
    showSuccess('Note deleted');
    activityLogger.logNoteDelete(ticket.id, ticket.ticket_number);
  };

  const handleStartEdit = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingText(note.text);
  };

  const handleSaveEdit = (noteId: string) => {
    if (!editingText.trim()) return;
    const updated = notesList.map(n => 
      n.id === noteId ? { ...n, text: editingText.trim() } : n
    );
    setNotesList(updated);
    saveNotesToStorage(updated);
    setEditingNoteId(null);
    setEditingText('');
    showSuccess('Note updated');
    activityLogger.logNoteEdit(ticket.id, ticket.ticket_number);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingText('');
  };

  const formatNoteDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const priorityColors = getPriorityColor(ticket.priority);
  const formatDate = (d: string | null | undefined) => {
    if (!d) return null;
    const date = new Date(d);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleString('en-US', { 
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <div className="header-left">
            <CategoryIcon category={ticket.category} showLabel={false} size="lg" />
            <div>
              <h2>{ticket.ticket_number} {ticket.title || 'Untitled Ticket'}</h2>
              <div className="subtitle-row">
                <span className="subtitle">{getCategoryDisplayName(ticket.category)}</span>
                {ticket.property?.name ? (
                  <span className="subtitle"> • {ticket.property.name}</span>
                ) : ticket.location_raw ? (
                  <span className="subtitle"> • {ticket.location_raw}</span>
                ) : null}
              </div>
              {/* Sender info from inbound message */}
              {ticket.inbound_messages && ticket.inbound_messages[0] && (
                <div className="sender-info">
                  {ticket.inbound_messages[0].source === 'sms' ? <MessageSquare size={12} /> : <Mail size={12} />}
                  <span>
                    {ticket.inbound_messages[0].sender_name || 
                     ticket.inbound_messages[0].sender_email || 
                     ticket.inbound_messages[0].sender_phone || 
                     'Unknown sender'}
                  </span>
                </div>
              )}
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="main-column">
            {/* Status Bar */}
            <div className="status-bar">
              <div className="status-group">
                <label>Priority</label>
                <select 
                  value={ticket.priority}
                  onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
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
              
              <div className="status-group">
                <label>Status</label>
                <select 
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                  className="status-select"
                >
                  <option value="triage">Triage</option>
                  <option value="open">Open</option>
                  <option value="assigned">Assigned</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {successMessage && (
                <div className="success-badge">
                  <CheckCircle size={14} /> {successMessage}
                </div>
              )}
              {errorMessage && (
                <div className="error-badge">
                  <AlertTriangle size={14} /> {errorMessage}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="section">
              <div className="section-title">
                <h3>Description</h3>
                <CopyButton text={ticket.description || ''} label="Description" size="sm" />
              </div>
              <div className="description-box">
                {ticket.description || 'No description provided.'}
              </div>
            </div>

            {/* AI Metadata */}
            {ticket.ai_metadata && Object.keys(ticket.ai_metadata).length > 0 && (
              <div className="section">
                <h3><Bot size={16} /> AI Extraction</h3>
                <div className="ai-grid">
                  {Object.entries(ticket.ai_metadata).map(([key, value]) => {
                    if (!value || key === 'yardi_fields' || typeof value === 'object') return null;
                    return (
                      <div key={key} className="ai-item">
                        <span className="label">{key.replace(/_/g, ' ')}</span>
                        <span className="value">{String(value)}</span>
                        <CopyButton text={String(value)} label={key} size="sm" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Messages */}
            {ticket.inbound_messages && ticket.inbound_messages.length > 0 && (
              <div className="section">
                <h3><MessageSquare size={16} /> Original Message</h3>
                {ticket.inbound_messages.map(msg => (
                  <div key={msg.id} className="message-card">
                    <div className="msg-header">
                      <span className="source">{msg.source?.toUpperCase()}</span>
                      <span className="sender">{msg.sender_name || msg.sender_email || msg.sender_phone}</span>
                      {formatDate(msg.received_at || msg.processed_at) && (
                        <span className="time">{formatDate(msg.received_at || msg.processed_at)}</span>
                      )}
                    </div>
                    <div className="msg-body">
                      {msg.raw_body ? (
                        msg.raw_body
                      ) : (
                        <span className="no-content">No message content available</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="side-column">
            {/* Ticket Details */}
            <div className="side-card">
              <h3>Ticket Details</h3>
              <div className="meta-row">
                <Hash size={14} /> <span>{ticket.ticket_number}</span>
              </div>
              <div className="meta-row">
                <Clock size={14} /> <span>Created {formatDate(ticket.created_at)}</span>
              </div>
              {ticket.location_raw && (
                <div className="meta-row">
                  <MapPin size={14} /> <span>{ticket.location_raw}</span>
                </div>
              )}
              {ticket.unit && (
                <div className="meta-row">
                  <Building2 size={14} /> <span>Unit {ticket.unit.unit_number}</span>
                </div>
              )}
            </div>

            {/* Source Info */}
            {ticket.inbound_messages && ticket.inbound_messages.length > 0 && (
              <div className="side-card">
                <h3>Message Source</h3>
                {ticket.inbound_messages.map(msg => {
                  const isEmail = msg.source === 'email';
                  const hasForwarder = msg.forwarder_name || msg.forwarder_email;
                  const hasOriginal = msg.original_from || msg.original_from_name;
                  
                  return (
                    <div key={msg.id} className="source-block">
                      {/* Sender Name */}
                      {msg.sender_name && (
                        <div className="source-row">
                          <span className="source-label">From</span>
                          <span 
                            className="source-value source-name source-copyable"
                            onClick={() => {
                              navigator.clipboard.writeText(msg.sender_name || '');
                              showSuccess('Name copied');
                            }}
                            title="Click to copy name"
                          >
                            {msg.sender_name}
                          </span>
                        </div>
                      )}
                      
                      {/* Fallback: No name, show contact with FROM label */}
                      {!msg.sender_name && (isEmail ? msg.sender_email : msg.sender_phone) && (
                        <div className="source-row">
                          <span className="source-label">From</span>
                          <span 
                            className="source-value source-contact source-copyable"
                            onClick={() => {
                              const text = isEmail ? msg.sender_email : msg.sender_phone;
                              if (text) {
                                navigator.clipboard.writeText(text);
                                showSuccess(`${isEmail ? 'Email' : 'Phone'} copied`);
                              }
                            }}
                            title={`Click to copy ${isEmail ? 'email' : 'phone'}`}
                          >
                            {isEmail ? msg.sender_email : msg.sender_phone}
                          </span>
                        </div>
                      )}
                      
                      {/* Source Type */}
                      <div className="source-row">
                        <span className="source-label">Type</span>
                        <span className="source-value source-type-value">
                          {isEmail ? <Mail size={14} /> : <MessageSquare size={14} />}
                          <span>{isEmail ? 'Email' : 'SMS'}</span>
                        </span>
                      </div>
                      
                      {/* Contact Info (Email/Phone) - Under TYPE */}
                      {(isEmail ? msg.sender_email : msg.sender_phone) && (
                        <div className="source-row">
                          <span className="source-label"></span>
                          <span 
                            className="source-value source-contact source-copyable"
                            onClick={() => {
                              const text = isEmail ? msg.sender_email : msg.sender_phone;
                              if (text) {
                                navigator.clipboard.writeText(text);
                                showSuccess(`${isEmail ? 'Email' : 'Phone'} copied`);
                              }
                            }}
                            title={`Click to copy ${isEmail ? 'email' : 'phone'}`}
                          >
                            {isEmail ? msg.sender_email : msg.sender_phone}
                          </span>
                        </div>
                      )}
                      
                      {/* Subject (email only) */}
                      {isEmail && msg.raw_subject && (
                        <div className="source-row">
                          <span className="source-label">Subject</span>
                          <span className="source-value source-truncate">{msg.raw_subject}</span>
                        </div>
                      )}
                      
                      {/* Received Time */}
                      {formatDate(msg.received_at || msg.processed_at) && (
                        <div className="source-row">
                          <span className="source-label">Received</span>
                          <span className="source-value">{formatDate(msg.received_at || msg.processed_at)}</span>
                        </div>
                      )}
                      
                      {/* Forwarding Info */}
                      {hasForwarder && (
                        <>
                          <div className="source-divider"></div>
                          {msg.forwarder_name && (
                            <div className="source-row">
                              <span className="source-label">Forwarded by</span>
                              <span 
                                className="source-value source-name source-copyable"
                                onClick={() => {
                                  navigator.clipboard.writeText(msg.forwarder_name || '');
                                  showSuccess('Name copied');
                                }}
                                title="Click to copy name"
                              >
                                {msg.forwarder_name}
                              </span>
                            </div>
                          )}
                          {msg.forwarder_email && (
                            <div className="source-row">
                              <span className="source-label"></span>
                              <span 
                                className="source-value source-contact source-copyable"
                                onClick={() => {
                                  if (msg.forwarder_email) {
                                    navigator.clipboard.writeText(msg.forwarder_email);
                                    showSuccess('Email copied');
                                  }
                                }}
                                title="Click to copy email"
                              >
                                {msg.forwarder_email}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* Original Sender */}
                      {hasOriginal && (
                        <>
                          {msg.original_from_name && (
                            <div className="source-row">
                              <span className="source-label">Original from</span>
                              <span 
                                className="source-value source-name source-copyable"
                                onClick={() => {
                                  navigator.clipboard.writeText(msg.original_from_name || '');
                                  showSuccess('Name copied');
                                }}
                                title="Click to copy name"
                              >
                                {msg.original_from_name}
                              </span>
                            </div>
                          )}
                          {msg.original_from && (
                            <div className="source-row">
                              <span className="source-label"></span>
                              <span 
                                className="source-value source-contact source-copyable"
                                onClick={() => {
                                  navigator.clipboard.writeText(msg.original_from);
                                  showSuccess('Email copied');
                                }}
                                title="Click to copy email"
                              >
                                {msg.original_from}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Notes Section */}
            <div className="side-card notes-card">
              <h3>Notes</h3>
              <textarea 
                className="notes-input" 
                placeholder="Add a note..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddNote();
                  }
                }}
              />
              <button className="save-notes-btn" onClick={handleAddNote} disabled={!noteInput.trim()}>
                <Save size={14} /> Add Note
              </button>
              
              {/* Notes List */}
              {notesList.length > 0 && (
                <div className="notes-list">
                  {notesList.map(note => (
                    <div key={note.id} className="note-item">
                      {editingNoteId === note.id ? (
                        <div className="note-edit">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            autoFocus
                          />
                          <div className="note-edit-actions">
                            <button onClick={() => handleSaveEdit(note.id)} className="save-edit-btn">Save</button>
                            <button onClick={handleCancelEdit} className="cancel-edit-btn">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="note-content" onDoubleClick={() => handleStartEdit(note)}>
                            <p>{note.text}</p>
                            <span className="note-date">{formatNoteDate(note.created_at)}</span>
                          </div>
                          <button className="note-delete-btn" onClick={() => handleDeleteNote(note.id)}>
                            <X size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
          padding-top: 80px;
        }

        .modal-content {
          background: white;
          width: 90%;
          max-width: 900px;
          max-height: calc(100vh - 120px);
          border-radius: 16px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          background: white;
        }

        .header-left {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .header-left h2 {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px 0;
        }

        .subtitle-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
        }

        .subtitle {
          color: #64748b;
          font-size: 14px;
        }

        .sender-info {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 6px;
          font-size: 13px;
          color: #475569;
        }

        .sender-info svg {
          color: #3b82f6;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .modal-body {
          flex: 1;
          overflow-y: auto;
          display: grid;
          grid-template-columns: 1fr 280px;
          background: #f8fafc;
        }

        .main-column {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .status-bar {
          display: flex;
          gap: 16px;
          align-items: flex-end;
          background: white;
          padding: 16px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .status-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .status-group label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          color: #64748b;
          letter-spacing: 0.5px;
        }

        .status-group select {
          padding: 8px 32px 8px 12px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          min-width: 140px;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 12px;
        }

        .success-badge {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 6px;
          color: #059669;
          font-size: 13px;
          font-weight: 500;
          background: #d1fae5;
          padding: 6px 12px;
          border-radius: 20px;
        }

        .error-badge {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 6px;
          color: #dc2626;
          font-size: 13px;
          font-weight: 500;
          background: #fee2e2;
          padding: 6px 12px;
          border-radius: 20px;
        }

        .section {
          background: white;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .section h3 {
          font-size: 15px;
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 16px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .section-title h3 {
          margin: 0;
        }

        .description-box {
          color: #334155;
          line-height: 1.6;
          white-space: pre-wrap;
          font-size: 15px;
        }

        .ai-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }

        .ai-item {
          background: #f8fafc;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .ai-item .label {
          display: block;
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .ai-item .value {
          font-size: 14px;
          color: #0f172a;
          font-weight: 500;
        }

        .message-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
        }

        .msg-header {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #64748b;
          margin-bottom: 8px;
        }

        .msg-header .source {
          text-transform: uppercase;
          font-weight: 600;
          color: #3b82f6;
        }

        .msg-body {
          font-size: 14px;
          color: #334155;
          white-space: pre-wrap;
          line-height: 1.6;
        }

        .msg-body .no-content {
          color: #94a3b8;
          font-style: italic;
        }

        .side-column {
          padding: 24px;
          border-left: 1px solid #e2e8f0;
          background: white;
          display: flex;
          flex-direction: column;
          gap: 24px;
          min-width: 0; /* Allow flex item to shrink */
          overflow: hidden; /* Prevent overflow */
        }

        .side-card {
          min-width: 0; /* Allow flex item to shrink */
          overflow: hidden; /* Prevent overflow */
        }

        .side-card h3 {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 12px 0;
        }

        .notes-input {
          width: 100%;
          height: 120px;
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          resize: none;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .notes-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .save-notes-btn {
          width: 100%;
          padding: 8px;
          background: #f1f5f9;
          border: none;
          border-radius: 6px;
          color: #475569;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 13px;
          transition: all 0.2s;
        }

        .save-notes-btn:hover:not(:disabled) {
          background: #3b82f6;
          color: white;
        }

        .save-notes-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .notes-card {
          max-height: 400px;
          overflow-y: auto;
        }

        .notes-list {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .note-item {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .note-content {
          flex: 1;
          cursor: pointer;
        }

        .note-content p {
          margin: 0 0 4px 0;
          font-size: 13px;
          color: #334155;
          line-height: 1.4;
        }

        .note-date {
          font-size: 11px;
          color: #94a3b8;
        }

        .note-delete-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }

        .note-delete-btn:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        .note-edit {
          flex: 1;
        }

        .note-edit textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #3b82f6;
          border-radius: 6px;
          font-size: 13px;
          resize: none;
          min-height: 60px;
        }

        .note-edit-actions {
          display: flex;
          gap: 8px;
          margin-top: 6px;
        }

        .save-edit-btn {
          padding: 4px 10px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
        }

        .cancel-edit-btn {
          padding: 4px 10px;
          background: #f1f5f9;
          color: #64748b;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
        }

        .meta-row {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748b;
          font-size: 13px;
          padding: 8px 0;
          border-bottom: 1px solid #f1f5f9;
          flex-wrap: wrap;
        }

        .meta-row:last-child {
          border-bottom: none;
        }

        .meta-row svg {
          color: #94a3b8;
          flex-shrink: 0;
        }

        .meta-label {
          font-weight: 600;
          color: #475569;
          font-size: 11px;
          text-transform: uppercase;
        }

        .meta-value {
          color: #334155;
          font-weight: 500;
          word-break: break-word;
        }

        .meta-value.truncate {
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .source-block {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .source-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 8px;
          min-width: 0; /* Allow flex container to shrink */
        }

        .source-label {
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          min-width: 70px;
          flex-shrink: 0;
          padding-top: 2px;
        }

        .source-value {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #334155;
          flex: 1;
          min-width: 0; /* Allow flex item to shrink */
        }

        .source-type-value {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .source-type-value svg {
          color: #64748b;
          flex-shrink: 0;
        }

        .source-name {
          font-weight: 600;
          color: #1e293b;
        }

        .source-contact {
          color: #64748b;
          font-size: 12px;
          word-break: break-all; /* Prevent overflow */
          overflow-wrap: break-word;
        }

        .source-copyable {
          cursor: pointer;
          position: relative;
          padding: 2px 4px;
          border-radius: 4px;
          transition: background-color 0.15s;
          word-break: break-all;
          overflow-wrap: break-word;
        }

        .source-copyable:hover {
          background-color: #f1f5f9;
        }

        .source-copyable:hover::after {
          content: 'Click to copy';
          position: absolute;
          bottom: 100%;
          left: 0;
          background: #1e293b;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          white-space: nowrap;
          z-index: 10;
          margin-bottom: 4px;
          pointer-events: none;
        }

        .source-copyable:hover::before {
          content: '';
          position: absolute;
          bottom: calc(100% - 4px);
          left: 8px;
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 4px solid #1e293b;
          z-index: 10;
          pointer-events: none;
        }

        .source-truncate {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
          min-width: 0;
        }

        .source-divider {
          height: 1px;
          background: #e2e8f0;
          margin: 4px 0;
        }

        @media (max-width: 768px) {
          .modal-body {
            grid-template-columns: 1fr;
          }
          
          .side-column {
            border-left: none;
            border-top: 1px solid #e2e8f0;
          }
        }
      `}</style>
    </div>
  );
}
