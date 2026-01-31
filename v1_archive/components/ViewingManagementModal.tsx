import React, { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { ApplicationViewing } from '../lib/types';

interface ViewingManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewingManagementModal({
  isOpen,
  onClose,
}: ViewingManagementModalProps) {
  const [viewings, setViewings] = useState<ApplicationViewing[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rescheduleModal, setRescheduleModal] = useState<{
    isOpen: boolean;
    viewing: ApplicationViewing | null;
  }>({ isOpen: false, viewing: null });
  const [rescheduleData, setRescheduleData] = useState({
    scheduled_date: '',
    scheduled_time: '',
    viewing_notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchViewings();
    }
  }, [isOpen]);

  const fetchViewings = async () => {
    try {
      setLoading(true);
      setError(null);
      const allViewings = await apiClient.getAllViewings();
      setViewings(allViewings);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch viewings');
      console.error('Failed to fetch viewings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateViewingStatus = async (
    viewingId: number, 
    status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled',
    notes?: string
  ) => {
    try {
      setUpdating(viewingId);
      await apiClient.updateViewingStatus(viewingId, { status, notes });
      
      // Update local state
      setViewings(prev => 
        prev.map(viewing => 
          viewing.id === viewingId 
            ? { ...viewing, status }
            : viewing
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update viewing');
      console.error('Failed to update viewing:', err);
    } finally {
      setUpdating(null);
    }
  };

  const openRescheduleModal = (viewing: ApplicationViewing) => {
    setRescheduleModal({ isOpen: true, viewing });
    setRescheduleData({
      scheduled_date: viewing.scheduled_date,
      scheduled_time: viewing.scheduled_time,
      viewing_notes: viewing.viewing_notes || ''
    });
  };

  const closeRescheduleModal = () => {
    setRescheduleModal({ isOpen: false, viewing: null });
    setRescheduleData({
      scheduled_date: '',
      scheduled_time: '',
      viewing_notes: ''
    });
  };

  const handleReschedule = async () => {
    if (!rescheduleModal.viewing) return;
    
    try {
      setUpdating(rescheduleModal.viewing.id);
      await apiClient.updateViewingStatus(rescheduleModal.viewing.id, {
        status: 'scheduled',
        scheduled_date: rescheduleData.scheduled_date,
        scheduled_time: rescheduleData.scheduled_time,
        notes: rescheduleData.viewing_notes
      });
      
      // Update local state
      setViewings(prev => 
        prev.map(viewing => 
          viewing.id === rescheduleModal.viewing!.id 
            ? { 
                ...viewing, 
                status: 'scheduled' as const,
                scheduled_date: rescheduleData.scheduled_date,
                scheduled_time: rescheduleData.scheduled_time,
                viewing_notes: rescheduleData.viewing_notes
              }
            : viewing
        )
      );
      
      closeRescheduleModal();
    } catch (err: any) {
      setError(err.message || 'Failed to reschedule viewing');
      console.error('Failed to reschedule viewing:', err);
    } finally {
      setUpdating(null);
    }
  };

  const formatDateTime = (date: string, time: string) => {
    const datetime = new Date(`${date}T${time}`);
    return {
      date: datetime.toLocaleDateString(),
      time: datetime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'status-scheduled';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      case 'rescheduled': return 'status-rescheduled';
      default: return 'status-default';
    }
  };

  // Organize viewings by status
  const scheduledViewings = viewings.filter(v => v.status === 'scheduled');
  const completedViewings = viewings.filter(v => v.status === 'completed');
  const cancelledRescheduledViewings = viewings.filter(v => 
    v.status === 'cancelled' || v.status === 'rescheduled'
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content viewing-management-modal">
        <div className="modal-header">
          <h2>Viewing Management</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
            <button onClick={() => setError(null)} className="alert-close">×</button>
          </div>
        )}

        <div className="modal-body">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading viewings...</p>
            </div>
          ) : (
            <div className="viewing-categories">
              
              {/* Scheduled Viewings */}
              <div className="viewing-category">
                <div className="category-header">
                  <h3>📅 Scheduled ({scheduledViewings.length})</h3>
                </div>
                <div className="viewing-list">
                  {scheduledViewings.length === 0 ? (
                    <div className="empty-state">No scheduled viewings</div>
                  ) : (
                    scheduledViewings.map(viewing => {
                      const { date, time } = formatDateTime(viewing.scheduled_date, viewing.scheduled_time);
                      return (
                        <div key={viewing.id} className="viewing-item">
                          <div className="viewing-info">
                            <div className="viewing-header">
                              <span className="tenant-name">{viewing.tenant_name || 'Unknown Tenant'}</span>
                              <span className={`status-badge ${getStatusColor(viewing.status)}`}>
                                {viewing.status}
                              </span>
                            </div>
                            <div className="viewing-details">
                              <div className="detail-row">
                                <span className="label">Property:</span>
                                <span>{viewing.property_name || 'Unknown Property'}</span>
                              </div>
                              {viewing.room_name && (
                                <div className="detail-row">
                                  <span className="label">Room:</span>
                                  <span>{viewing.room_name}</span>
                                </div>
                              )}
                              <div className="detail-row">
                                <span className="label">Date & Time:</span>
                                <span>{date} at {time}</span>
                              </div>
                              <div className="detail-row">
                                <span className="label">Contact:</span>
                                <span>{viewing.contact_person} ({viewing.contact_phone})</span>
                              </div>
                            </div>
                          </div>
                          <div className="viewing-actions">
                            <button
                              onClick={() => updateViewingStatus(viewing.id, 'completed')}
                              disabled={updating === viewing.id}
                              className="btn btn-sm btn-success"
                            >
                              {updating === viewing.id ? '...' : 'Complete'}
                            </button>
                            <button
                              onClick={() => updateViewingStatus(viewing.id, 'cancelled')}
                              disabled={updating === viewing.id}
                              className="btn btn-sm btn-danger"
                            >
                              {updating === viewing.id ? '...' : 'Cancel'}
                            </button>
                            <button
                              onClick={() => openRescheduleModal(viewing)}
                              disabled={updating === viewing.id}
                              className="btn btn-sm btn-warning"
                            >
                              {updating === viewing.id ? '...' : 'Reschedule'}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Completed Viewings */}
              <div className="viewing-category">
                <div className="category-header">
                  <h3>✅ Completed ({completedViewings.length})</h3>
                </div>
                <div className="viewing-list">
                  {completedViewings.length === 0 ? (
                    <div className="empty-state">No completed viewings</div>
                  ) : (
                    completedViewings.map(viewing => {
                      const { date, time } = formatDateTime(viewing.scheduled_date, viewing.scheduled_time);
                      return (
                        <div key={viewing.id} className="viewing-item completed">
                          <div className="viewing-info">
                            <div className="viewing-header">
                              <span className="tenant-name">{viewing.tenant_name || 'Unknown Tenant'}</span>
                              <span className={`status-badge ${getStatusColor(viewing.status)}`}>
                                {viewing.status}
                              </span>
                            </div>
                            <div className="viewing-details">
                              <div className="detail-row">
                                <span className="label">Property:</span>
                                <span>{viewing.property_name || 'Unknown Property'}</span>
                              </div>
                              {viewing.room_name && (
                                <div className="detail-row">
                                  <span className="label">Room:</span>
                                  <span>{viewing.room_name}</span>
                                </div>
                              )}
                              <div className="detail-row">
                                <span className="label">Completed:</span>
                                <span>{date} at {time}</span>
                              </div>
                              <div className="detail-row">
                                <span className="label">Contact:</span>
                                <span>{viewing.contact_person} ({viewing.contact_phone})</span>
                              </div>
                              {viewing.outcome && (
                                <div className="detail-row">
                                  <span className="label">Outcome:</span>
                                  <span className={`outcome-${viewing.outcome}`}>{viewing.outcome}</span>
                                </div>
                              )}
                              {viewing.tenant_feedback && (
                                <div className="detail-row">
                                  <span className="label">Tenant Feedback:</span>
                                  <span className="feedback-text">{viewing.tenant_feedback}</span>
                                </div>
                              )}
                              {viewing.landlord_notes && (
                                <div className="detail-row">
                                  <span className="label">Your Assessment:</span>
                                  <span className="notes-text">{viewing.landlord_notes}</span>
                                </div>
                              )}
                              {viewing.next_action && (
                                <div className="detail-row">
                                  <span className="label">Next Action:</span>
                                  <span className="action-text">{viewing.next_action}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Cancelled/Rescheduled Viewings */}
              <div className="viewing-category">
                <div className="category-header">
                  <h3>❌ Cancelled / Rescheduled ({cancelledRescheduledViewings.length})</h3>
                </div>
                <div className="viewing-list">
                  {cancelledRescheduledViewings.length === 0 ? (
                    <div className="empty-state">No cancelled or rescheduled viewings</div>
                  ) : (
                    cancelledRescheduledViewings.map(viewing => {
                      const { date, time } = formatDateTime(viewing.scheduled_date, viewing.scheduled_time);
                      return (
                        <div key={viewing.id} className="viewing-item cancelled">
                          <div className="viewing-info">
                            <div className="viewing-header">
                              <span className="tenant-name">{viewing.tenant_name || 'Unknown Tenant'}</span>
                              <span className={`status-badge ${getStatusColor(viewing.status)}`}>
                                {viewing.status}
                              </span>
                            </div>
                            <div className="viewing-details">
                              <div className="detail-row">
                                <span className="label">Property:</span>
                                <span>{viewing.property_name || 'Unknown Property'}</span>
                              </div>
                              {viewing.room_name && (
                                <div className="detail-row">
                                  <span className="label">Room:</span>
                                  <span>{viewing.room_name}</span>
                                </div>
                              )}
                              <div className="detail-row">
                                <span className="label">Original Date:</span>
                                <span>{date} at {time}</span>
                              </div>
                              <div className="detail-row">
                                <span className="label">Contact:</span>
                                <span>{viewing.contact_person} ({viewing.contact_phone})</span>
                              </div>
                            </div>
                          </div>
                          {viewing.status === 'rescheduled' && (
                            <div className="viewing-actions">
                              <button
                                onClick={() => updateViewingStatus(viewing.id, 'scheduled')}
                                disabled={updating === viewing.id}
                                className="btn btn-sm btn-primary"
                              >
                                {updating === viewing.id ? '...' : 'Reactivate'}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={fetchViewings} className="btn btn-secondary" disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button onClick={onClose} className="btn btn-primary">
            Close
          </button>
        </div>

        {/* Reschedule Modal */}
        {rescheduleModal.isOpen && (
          <div className="reschedule-modal-overlay">
            <div className="reschedule-modal">
              <div className="reschedule-header">
                <h3>Reschedule Viewing</h3>
                <button onClick={closeRescheduleModal} className="close-btn">×</button>
              </div>
              
              <div className="reschedule-body">
                <div className="current-info">
                  <p><strong>Tenant:</strong> {rescheduleModal.viewing?.tenant_name}</p>
                  <p><strong>Property:</strong> {rescheduleModal.viewing?.property_name}</p>
                  {rescheduleModal.viewing?.room_name && (
                    <p><strong>Room:</strong> {rescheduleModal.viewing.room_name}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>New Date:</label>
                  <input
                    type="date"
                    value={rescheduleData.scheduled_date}
                    onChange={(e) => setRescheduleData(prev => ({
                      ...prev,
                      scheduled_date: e.target.value
                    }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>New Time:</label>
                  <input
                    type="time"
                    value={rescheduleData.scheduled_time}
                    onChange={(e) => setRescheduleData(prev => ({
                      ...prev,
                      scheduled_time: e.target.value
                    }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Notes (optional):</label>
                  <textarea
                    value={rescheduleData.viewing_notes}
                    onChange={(e) => setRescheduleData(prev => ({
                      ...prev,
                      viewing_notes: e.target.value
                    }))}
                    className="form-textarea"
                    rows={3}
                    placeholder="Reason for rescheduling or additional notes..."
                  />
                </div>
              </div>

              <div className="reschedule-footer">
                <button 
                  onClick={closeRescheduleModal} 
                  className="btn btn-secondary"
                  disabled={updating === rescheduleModal.viewing?.id}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleReschedule} 
                  className="btn btn-primary"
                  disabled={!rescheduleData.scheduled_date || !rescheduleData.scheduled_time || updating === rescheduleModal.viewing?.id}
                >
                  {updating === rescheduleModal.viewing?.id ? 'Rescheduling...' : 'Reschedule'}
                </button>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: flex-start; /* Changed from center to flex-start */
            justify-content: center;
            z-index: 9999; /* Increased z-index */
            padding-top: 80px; /* Add top padding to account for top bar */
          }

          .viewing-management-modal {
            width: 90%;
            max-width: 1000px; /* Reduced from 1200px */
            max-height: calc(85vh - 80px); /* Subtract top bar height */
            overflow-y: auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
            position: relative; /* Added for z-index context */
            margin-top: 20px; /* Additional margin for breathing room */
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px 30px;
            border-bottom: 1px solid #e2e8f0;
          }

          .modal-header h2 {
            margin: 0;
            color: #1f2937;
            font-size: 24px;
            font-weight: 600;
          }

          .close-btn {
            background: none;
            border: none;
            font-size: 28px;
            color: #6b7280;
            cursor: pointer;
            padding: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background-color 0.2s;
          }

          .close-btn:hover {
            background: #f3f4f6;
          }

          .modal-body {
            padding: 24px 30px; /* Reduced vertical padding */
          }

          .loading-state {
            text-align: center;
            padding: 60px 20px;
          }

          .spinner {
            width: 40px;
            height: 40px;
            margin: 0 auto 16px;
            border: 3px solid #f3f4f6;
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          .viewing-categories {
            display: flex;
            flex-direction: column;
            gap: 32px;
          }

          .viewing-category {
            background: #f8fafc;
            border-radius: 12px;
            padding: 24px;
          }

          .category-header {
            margin-bottom: 20px;
          }

          .category-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .viewing-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .viewing-item {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            transition: box-shadow 0.2s;
          }

          .viewing-item:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          }

          .viewing-item.completed {
            background: #f0fdf4;
            border-color: #bbf7d0;
          }

          .viewing-item.cancelled {
            background: #fef2f2;
            border-color: #fecaca;
          }

          .viewing-info {
            flex: 1;
          }

          .viewing-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          }

          .tenant-name {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
          }

          .status-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
            text-transform: capitalize;
          }

          .status-scheduled {
            background: #dbeafe;
            color: #1d4ed8;
          }

          .status-completed {
            background: #dcfce7;
            color: #166534;
          }

          .status-cancelled {
            background: #fee2e2;
            color: #dc2626;
          }

          .status-rescheduled {
            background: #fef3c7;
            color: #d97706;
          }

          .viewing-details {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .detail-row {
            display: flex;
            gap: 8px;
            font-size: 14px;
          }

          .label {
            font-weight: 500;
            color: #6b7280;
            min-width: 80px;
          }

          .outcome-positive {
            color: #059669;
            font-weight: 500;
            text-transform: capitalize;
          }

          .outcome-negative {
            color: #dc2626;
            font-weight: 500;
            text-transform: capitalize;
          }

          .outcome-neutral {
            color: #6b7280;
            font-weight: 500;
            text-transform: capitalize;
          }

          .viewing-actions {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-left: 20px;
          }

          .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
          }

          .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .btn-sm {
            padding: 6px 12px;
            font-size: 13px;
          }

          .btn-success {
            background: #059669;
            color: white;
          }

          .btn-success:hover:not(:disabled) {
            background: #047857;
          }

          .btn-danger {
            background: #dc2626;
            color: white;
          }

          .btn-danger:hover:not(:disabled) {
            background: #b91c1c;
          }

          .btn-warning {
            background: #d97706;
            color: white;
          }

          .btn-warning:hover:not(:disabled) {
            background: #b45309;
          }

          .btn-primary {
            background: #3b82f6;
            color: white;
          }

          .btn-primary:hover:not(:disabled) {
            background: #2563eb;
          }

          .btn-secondary {
            background: #f3f4f6;
            color: #374151;
            border: 1px solid #d1d5db;
          }

          .btn-secondary:hover:not(:disabled) {
            background: #e5e7eb;
          }

          .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: #6b7280;
            font-style: italic;
          }

          /* Reschedule Modal Styles */
          .reschedule-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1001;
          }

          .reschedule-modal {
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          }

          .reschedule-header {
            padding: 20px;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .reschedule-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
          }

          .reschedule-body {
            padding: 20px;
          }

          .current-info {
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
          }

          .current-info p {
            margin: 5px 0;
            font-size: 14px;
          }

          .form-group {
            margin-bottom: 16px;
          }

          .form-group label {
            display: block;
            margin-bottom: 6px;
            font-weight: 500;
            color: #374151;
          }

          .form-input, .form-textarea {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
          }

          .form-input:focus, .form-textarea:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          .form-textarea {
            resize: vertical;
            min-height: 80px;
          }

          .reschedule-footer {
            padding: 20px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: flex-end;
            gap: 12px;
          }

          .alert {
            padding: 12px 16px;
            border-radius: 6px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .alert-error {
            background: #fef2f2;
            color: #b91c1c;
            border: 1px solid #fecaca;
          }

          .alert-close {
            background: none;
            border: none;
            color: inherit;
            cursor: pointer;
            font-size: 18px;
            padding: 0;
            margin-left: 12px;
          }

          .modal-footer {
            padding: 20px 30px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: flex-end;
            gap: 12px;
          }

          /* Completion detail styling */
          .feedback-text, .notes-text, .action-text {
            font-style: italic;
            color: #6b7280;
            line-height: 1.4;
            margin-top: 4px;
            padding: 8px 12px;
            background: #f9fafb;
            border-radius: 6px;
            border-left: 3px solid #e5e7eb;
            word-break: break-word;
          }

          .feedback-text {
            border-left-color: #3b82f6;
            background: #eff6ff;
          }

          .notes-text {
            border-left-color: #10b981;
            background: #ecfdf5;
          }

          .action-text {
            border-left-color: #f59e0b;
            background: #fffbeb;
            font-weight: 500;
          }

          @media (max-width: 768px) {
            .viewing-management-modal {
              width: 95%;
              max-height: 90vh; /* Adjusted for smaller screens */
            }

            .viewing-item {
              flex-direction: column;
              gap: 16px;
            }

            .viewing-actions {
              flex-direction: row;
              margin-left: 0;
            }

            .modal-header {
              padding: 20px;
            }

            .modal-body {
              padding: 16px; /* Reduced for smaller screens */
            }
          }
        `}</style>
      </div>
    </div>
  );
} 