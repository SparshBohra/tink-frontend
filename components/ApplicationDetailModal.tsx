import React, { useState, useEffect } from 'react';
import { Application, Property, Room } from '../lib/types';
import { formatPriorityScore, getStatusDisplayText } from '../lib/applicationUtils';
import StatusBadge from './StatusBadge';

interface ApplicationDetailModalProps {
  isOpen: boolean;
  application: Application | null;
  properties: Property[];
  rooms: Room[];
  onClose: () => void;
  onApprove: (applicationId: number, propertyId: number) => void;
  onReject: (applicationId: number) => void;
  onAssignRoom: (application: Application) => void;
}

interface TimelineEvent {
  id: string;
  type: 'application_created' | 'status_changed' | 'priority_calculated' | 'conflict_detected' | 'room_recommended';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
}

const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  isOpen,
  application,
  properties,
  rooms,
  onClose,
  onApprove,
  onReject,
  onAssignRoom
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'analysis' | 'documents'>('overview');
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    if (application) {
      generateTimeline(application);
    }
  }, [application]);

  const generateTimeline = (app: Application) => {
    const events: TimelineEvent[] = [];

    // Application created
    events.push({
      id: 'created',
      type: 'application_created',
      title: 'Application Submitted',
      description: `${app.tenant_name} submitted their rental application`,
      timestamp: app.created_at,
      icon: '📝',
      color: '#3b82f6'
    });

    // Priority calculated
    if (app.priority_score) {
      events.push({
        id: 'priority',
        type: 'priority_calculated',
        title: 'Priority Score Calculated',
        description: `Assigned priority score of ${app.priority_score}/100 based on application criteria`,
        timestamp: app.created_at,
        icon: '📊',
        color: '#8b5cf6'
      });
    }

    // Conflicts detected
    if (app.has_conflicts) {
      events.push({
        id: 'conflict',
        type: 'conflict_detected',
        title: 'Conflict Detected',
        description: `Application conflicts with ${app.conflicting_applications?.length || 0} other applications`,
        timestamp: app.created_at,
        icon: '⚠️',
        color: '#f59e0b'
      });
    }

    // Room recommendations
    if (app.recommended_rooms && app.recommended_rooms.length > 0) {
      events.push({
        id: 'recommendations',
        type: 'room_recommended',
        title: 'Room Recommendations Generated',
        description: `${app.recommended_rooms.length} compatible rooms identified`,
        timestamp: app.created_at,
        icon: '🏠',
        color: '#10b981'
      });
    }

    // Status changes
    if (app.status !== 'pending') {
      events.push({
        id: 'status_change',
        type: 'status_changed',
        title: `Status Changed to ${getStatusDisplayText(app.status)}`,
        description: app.decision_notes || 'Status updated',
        timestamp: app.decision_date || app.updated_at,
        icon: app.status === 'approved' ? '✅' : app.status === 'rejected' ? '❌' : '🔄',
        color: app.status === 'approved' ? '#10b981' : app.status === 'rejected' ? '#ef4444' : '#6b7280'
      });
    }

    // Sort by timestamp
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    setTimeline(events);
  };

  const getProperty = () => {
    if (!application) return null;
    return properties.find(p => p.id === application.property_ref);
  };

  const getPropertyRooms = () => {
    if (!application) return [];
    return rooms.filter(room => room.property_ref === application.property_ref);
  };

  const getAvailableRooms = () => {
    return getPropertyRooms().filter(room => room.is_vacant);
  };

  const getRecommendedRooms = () => {
    if (!application?.recommended_rooms) return [];
    return application.recommended_rooms.map(roomId => 
      rooms.find(room => room.id === roomId)
    ).filter(Boolean);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    });
  };

  const getPriorityLevel = (score: number) => {
    if (score >= 90) return { level: 'Critical', color: '#dc2626' };
    if (score >= 80) return { level: 'High', color: '#f59e0b' };
    if (score >= 60) return { level: 'Medium', color: '#3b82f6' };
    return { level: 'Low', color: '#6b7280' };
  };

  const getUrgencyIndicator = (app: Application) => {
    const daysOld = app.days_pending || 0;
    if (daysOld > 14) return { text: 'Urgent', color: '#dc2626' };
    if (daysOld > 7) return { text: 'Attention Needed', color: '#f59e0b' };
    return { text: 'Normal', color: '#10b981' };
  };

  if (!isOpen || !application) return null;

  const property = getProperty();
  const availableRooms = getAvailableRooms();
  const recommendedRooms = getRecommendedRooms();
  const priorityLevel = getPriorityLevel(application.priority_score || 0);
  const urgencyIndicator = getUrgencyIndicator(application);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="application-detail-modal">
        <div className="modal-header">
          <div className="header-content">
            <div className="header-left">
              <h2 className="modal-title">Application Details</h2>
              <div className="applicant-main-info">
                <span className="applicant-name">{application.tenant_name}</span>
                <span className="applicant-email">{application.tenant_email}</span>
              </div>
            </div>
            <div className="header-right">
              <StatusBadge status={application.status} text={getStatusDisplayText(application.status)} />
            </div>
          </div>
          <button onClick={onClose} className="close-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-tabs">
            <button
              className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`tab-button ${activeTab === 'timeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              Timeline
            </button>
            <button
              className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
              onClick={() => setActiveTab('analysis')}
            >
              Analysis
            </button>
            <button
              className={`tab-button ${activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              Documents
            </button>
          </div>

          <div className="modal-content">
            {activeTab === 'overview' && (
              <div className="overview-tab">
                <div className="overview-grid">
                  <div className="main-column">
                    <div className="info-panel">
                      <h3 className="panel-title">Application Information</h3>
                      <div className="info-grid">
                        <div className="info-item">
                          <label>Property:</label>
                          <span>{property?.name || 'Unknown Property'}</span>
                        </div>
                        <div className="info-item">
                          <label>Applied Date:</label>
                          <span>{formatDate(application.created_at)}</span>
                        </div>
                        <div className="info-item">
                          <label>Desired Move-in:</label>
                          <span>{formatDate(application.desired_move_in_date || null)}</span>
                        </div>
                        <div className="info-item">
                          <label>Budget:</label>
                          <span>${application.rent_budget || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                          <label>Days Pending:</label>
                          <span>{application.days_pending || 0} days</span>
                        </div>
                        <div className="info-item">
                          <label>Last Updated:</label>
                          <span>{formatDate(application.updated_at || null)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="info-panel">
                      <h3 className="panel-title">Priority & Urgency</h3>
                      <div className="priority-section">
                        <div className="score-circle">
                          <div className="score-circle-inner">
                            <span className="score-value">{application.priority_score || 0}</span>
                            <span className="score-label">Priority</span>
                          </div>
                        </div>
                        <div className="priority-info">
                          <div className="priority-level" style={{ color: priorityLevel.color }}>
                            {priorityLevel.level}
                          </div>
                          <div className="urgency-indicator" style={{ color: urgencyIndicator.color }}>
                            {urgencyIndicator.text}
                          </div>
                        </div>
                      </div>
                      <div className="priority-breakdown">
                        <div className="breakdown-item">
                          <span className="breakdown-label">Budget Compatible:</span>
                          <span className={`breakdown-value ${application.is_budget_compatible ? 'positive' : 'negative'}`}>
                            {application.is_budget_compatible ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="breakdown-item">
                          <span className="breakdown-label">Match Score:</span>
                          <span className="breakdown-value">{application.match_score || 0}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="info-panel">
                      <h3 className="panel-title">Room Recommendations</h3>
                      <div className="recommendations-list">
                        {recommendedRooms.length > 0 ? (
                          recommendedRooms.map((room, index) => {
                            if (!room) return null;
                            return (
                              <div key={room.id} className="recommendation-item">
                                <div className="room-info">
                                  <div className="room-name">{room.name}</div>
                                  <div className="room-details">
                                    <span className="room-type">{room.room_type || 'Standard'}</span>
                                    <span className="room-rent">${typeof room.monthly_rent === 'string' ? parseFloat(room.monthly_rent) : (room.monthly_rent || 0)}/month</span>
                                  </div>
                                </div>
                                <div className="compatibility-badge">
                                  {Math.round(85 + (index * 5))}% Match
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="no-recommendations">
                            <p>No room recommendations available</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="info-panel">
                      <h3 className="panel-title">Conflicts & Issues</h3>
                      <div className="conflicts-section">
                        {application.has_conflicts ? (
                          <div className="conflict-alert">
                            <div className="conflict-icon">⚠️</div>
                            <div className="conflict-info">
                              <div className="conflict-title">Application Conflicts Detected</div>
                              <div className="conflict-description">
                                This application conflicts with {application.conflicting_applications?.length || 0} other applications
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="no-conflicts">
                            <div className="success-icon">✅</div>
                            <span>No conflicts detected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="sidebar-column">
                    <div className="info-panel">
                      <h3 className="panel-title">Priority Score Breakdown</h3>
                      <div className="score-breakdown">
                        <div className="score-item">
                          <span className="score-label">Days Pending (40%)</span>
                          <div className="score-bar">
                            <div className="score-fill" style={{ width: `${Math.min((application.days_pending || 0) * 10, 100)}%` }}></div>
                          </div>
                          <span className="score-value">{application.days_pending || 0} days</span>
                        </div>
                        <div className="score-item">
                          <span className="score-label">Budget Compatibility (30%)</span>
                          <div className="score-bar">
                            <div className="score-fill" style={{ width: application.is_budget_compatible ? '100%' : '0%' }}></div>
                          </div>
                          <span className="score-value">{application.is_budget_compatible ? 'Compatible' : 'Not Compatible'}</span>
                        </div>
                        <div className="score-item">
                          <span className="score-label">Room Match (20%)</span>
                          <div className="score-bar">
                            <div className="score-fill" style={{ width: `${application.match_score || 0}%` }}></div>
                          </div>
                          <span className="score-value">{application.match_score || 0}%</span>
                        </div>
                        <div className="score-item">
                          <span className="score-label">Urgency Level (10%)</span>
                          <div className="score-bar">
                            <div className="score-fill" style={{ width: `${Math.min((application.days_pending || 0) * 5, 100)}%` }}></div>
                          </div>
                          <span className="score-value">{urgencyIndicator.text}</span>
                        </div>
                      </div>
                    </div>

                    <div className="info-panel">
                      <h3 className="panel-title">Recommended Actions</h3>
                      <div className="recommendations">
                        {application.priority_score && application.priority_score >= 80 && (
                          <div className="recommendation high-priority">
                            <div className="recommendation-icon">🔥</div>
                            <div className="recommendation-content">
                              <div className="recommendation-title">High Priority - Immediate Action Required</div>
                              <div className="recommendation-description">
                                This application has a high priority score and should be processed immediately.
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {application.has_conflicts && (
                          <div className="recommendation conflict">
                            <div className="recommendation-icon">⚠️</div>
                            <div className="recommendation-content">
                              <div className="recommendation-title">Resolve Conflicts</div>
                              <div className="recommendation-description">
                                This application conflicts with other applications. Review and resolve conflicts.
                              </div>
                            </div>
                          </div>
                        )}

                        {availableRooms.length === 0 && (
                          <div className="recommendation no-rooms">
                            <div className="recommendation-icon">🏠</div>
                            <div className="recommendation-content">
                              <div className="recommendation-title">No Available Rooms</div>
                              <div className="recommendation-description">
                                There are no available rooms in the selected property.
                              </div>
                            </div>
                          </div>
                        )}

                        {!application.has_conflicts && availableRooms.length > 0 && application.is_budget_compatible && (
                          <div className="recommendation approve">
                            <div className="recommendation-icon">✅</div>
                            <div className="recommendation-content">
                              <div className="recommendation-title">Ready for Approval</div>
                              <div className="recommendation-description">
                                This application meets all criteria and can be approved.
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="timeline-tab">
                <h3 className="section-title">Application Timeline</h3>
                <div className="timeline-container">
                  {timeline.map((event, index) => (
                    <div key={event.id} className="timeline-item">
                      <div className="timeline-connector">
                        <div className="timeline-dot" style={{ backgroundColor: event.color }}>
                          <span className="timeline-icon">{event.icon}</span>
                        </div>
                        {index < timeline.length - 1 && <div className="timeline-line"></div>}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <h4 className="timeline-title">{event.title}</h4>
                          <span className="timeline-time">{formatDate(event.timestamp)}</span>
                        </div>
                        <p className="timeline-description">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'analysis' && (
              <div className="analysis-tab">
                <h3 className="section-title">Application Analysis</h3>
                <div className="analysis-grid">
                  <div className="analysis-section">
                    <h4 className="analysis-subtitle">Priority Score Breakdown</h4>
                    <div className="score-breakdown">
                      <div className="score-item">
                        <span className="score-label">Days Pending (40%)</span>
                        <div className="score-bar">
                          <div className="score-fill" style={{ width: `${Math.min((application.days_pending || 0) * 10, 100)}%` }}></div>
                        </div>
                        <span className="score-value">{application.days_pending || 0} days</span>
                      </div>
                      <div className="score-item">
                        <span className="score-label">Budget Compatibility (30%)</span>
                        <div className="score-bar">
                          <div className="score-fill" style={{ width: application.is_budget_compatible ? '100%' : '0%' }}></div>
                        </div>
                        <span className="score-value">{application.is_budget_compatible ? 'Compatible' : 'Not Compatible'}</span>
                      </div>
                      <div className="score-item">
                        <span className="score-label">Room Match (20%)</span>
                        <div className="score-bar">
                          <div className="score-fill" style={{ width: `${application.match_score || 0}%` }}></div>
                        </div>
                        <span className="score-value">{application.match_score || 0}%</span>
                      </div>
                      <div className="score-item">
                        <span className="score-label">Urgency Level (10%)</span>
                        <div className="score-bar">
                          <div className="score-fill" style={{ width: `${Math.min((application.days_pending || 0) * 5, 100)}%` }}></div>
                        </div>
                        <span className="score-value">{urgencyIndicator.text}</span>
                      </div>
                    </div>
                  </div>

                  <div className="analysis-section">
                    <h4 className="analysis-subtitle">Recommended Actions</h4>
                    <div className="recommendations">
                      {application.priority_score && application.priority_score >= 80 && (
                        <div className="recommendation high-priority">
                          <div className="recommendation-icon">🔥</div>
                          <div className="recommendation-content">
                            <div className="recommendation-title">High Priority - Immediate Action Required</div>
                            <div className="recommendation-description">
                              This application has a high priority score and should be processed immediately.
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {application.has_conflicts && (
                        <div className="recommendation conflict">
                          <div className="recommendation-icon">⚠️</div>
                          <div className="recommendation-content">
                            <div className="recommendation-title">Resolve Conflicts</div>
                            <div className="recommendation-description">
                              This application conflicts with other applications. Review and resolve conflicts.
                            </div>
                          </div>
                        </div>
                      )}

                      {availableRooms.length === 0 && (
                        <div className="recommendation no-rooms">
                          <div className="recommendation-icon">🏠</div>
                          <div className="recommendation-content">
                            <div className="recommendation-title">No Available Rooms</div>
                            <div className="recommendation-description">
                              There are no available rooms in the selected property.
                            </div>
                          </div>
                        </div>
                      )}

                      {!application.has_conflicts && availableRooms.length > 0 && application.is_budget_compatible && (
                        <div className="recommendation approve">
                          <div className="recommendation-icon">✅</div>
                          <div className="recommendation-content">
                            <div className="recommendation-title">Ready for Approval</div>
                            <div className="recommendation-description">
                              This application meets all criteria and can be approved.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="documents-tab">
                <h3 className="section-title">Documents & Attachments</h3>
                <div className="documents-section">
                  <div className="documents-placeholder">
                    <div className="placeholder-icon">📄</div>
                    <div className="placeholder-text">
                      <h4>No Documents Available</h4>
                      <p>Document management functionality will be available in a future update.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions">
          {application.status === 'pending' && (
            <>
              <button
                onClick={() => onApprove(application.id, application.property_ref)}
                className="action-btn approve"
                disabled={availableRooms.length === 0}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
                Approve Application
              </button>
              <button
                onClick={() => onAssignRoom(application)}
                className="action-btn assign"
                disabled={availableRooms.length === 0}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
                Assign Room
              </button>
              <button
                onClick={() => onReject(application.id)}
                className="action-btn reject"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                Reject Application
              </button>
            </>
          )}
          <button onClick={onClose} className="action-btn cancel">
            Close
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(31, 41, 55, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .application-detail-modal {
          background: #f7f8fa;
          border-radius: 12px;
          width: 95%;
          max-width: 950px;
          height: 90vh;
          max-height: 800px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .modal-header {
          padding: 20px 28px;
          border-bottom: 1px solid #e5e7eb;
          background: white;
          border-radius: 12px 12px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }

        .header-left {
          flex: 1;
        }

        .modal-title {
          font-size: 18px;
          font-weight: 600;
          color: #4b5563;
          margin: 0 0 12px 0;
        }
        
        .applicant-main-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .applicant-name {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
        }

        .applicant-email {
          font-size: 14px;
          color: #6b7280;
          background: #f3f4f6;
          padding: 4px 8px;
          border-radius: 6px;
        }
        
        .header-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          padding: 8px;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: #f3f4f6;
          color: #1f2937;
        }

        .modal-body {
          flex-grow: 1;
          overflow-y: auto;
          display: flex;
        }

        .modal-tabs {
          display: flex;
          flex-direction: column;
          border-right: 1px solid #e5e7eb;
          background: white;
          padding: 20px 0;
          flex-shrink: 0;
        }

        .tab-button {
          padding: 12px 24px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: #4b5563;
          border-left: 3px solid transparent;
          text-align: left;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tab-button:hover {
          color: #1f2937;
          background: #f8fafc;
        }

        .tab-button.active {
          color: #2563eb;
          background: #f0f5ff;
          border-left-color: #2563eb;
        }

        .modal-content {
          padding: 28px;
          flex-grow: 1;
          overflow-y: auto;
        }

        .content-title {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 24px;
        }
        
        .overview-grid, .analysis-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        
        .main-column {
          grid-column: span 2;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        .sidebar-column {
          grid-column: span 1;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .info-panel {
          background: white;
          border-radius: 8px;
          padding: 24px;
          border: 1px solid #e5e7eb;
        }
        
        .panel-title {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 20px 0;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px 24px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
        }

        .info-item label {
          font-weight: 500;
          color: #6b7280;
          font-size: 13px;
          margin-bottom: 4px;
        }

        .info-item span {
          color: #1f2937;
          font-size: 14px;
          font-weight: 600;
        }
        
        .priority-section {
          text-align: center;
        }
        
        .score-circle {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          margin: 0 auto 20px auto;
          position: relative;
        }
        
        .score-circle-inner {
          position: absolute;
          inset: 12px;
          background: white;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .score-value {
          font-size: 32px;
          font-weight: 700;
          color: #1f2937;
          line-height: 1;
        }

        .score-label {
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
        }
        
        .priority-info {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
        }
        
        .priority-level {
          font-size: 18px;
          font-weight: 600;
        }
        
        .urgency-indicator {
          font-size: 13px;
          font-weight: 600;
        }

        .priority-breakdown {
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .breakdown-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .breakdown-label {
          font-size: 14px;
          color: #374151;
        }

        .breakdown-value {
          font-size: 14px;
          font-weight: 600;
        }
        
        .positive { color: #16a34a; }
        .negative { color: #ef4444; }

        .no-recommendations, .no-conflicts {
          text-align: center;
          padding: 32px 20px;
          color: #6b7280;
          font-size: 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        
        .no-conflicts {
          color: #16a34a;
        }

        /* Timeline */
        .timeline-item {
          display: flex;
          gap: 20px;
        }
        
        .timeline-connector {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .timeline-dot {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .timeline-line {
          width: 2px;
          flex-grow: 1;
          background: #e5e7eb;
        }

        .timeline-content {
          padding-bottom: 28px;
        }

        /* Analysis Tab */
        .analysis-section {
          background: white;
          border-radius: 8px;
          padding: 24px;
          border: 1px solid #e5e7eb;
        }
        
        .score-item {
          margin-bottom: 20px;
        }
        
        .score-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .score-bar {
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .score-fill {
          height: 100%;
          border-radius: 4px;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 28px;
          border-top: 1px solid #e5e7eb;
          background: white;
          border-radius: 0 0 12px 12px;
          flex-shrink: 0;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: 1px solid transparent;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        
        .action-btn.approve {
          background: #10b981;
          color: white;
        }
        .action-btn.approve:hover { background: #059669; }

        .action-btn.assign {
          background: #2563eb;
          color: white;
        }
        .action-btn.assign:hover { background: #1d4ed8; }

        .action-btn.reject {
          background: #ef4444;
          color: white;
        }
        .action-btn.reject:hover { background: #dc2626; }
        
        .action-btn.cancel {
          background: white;
          color: #4b5563;
          border-color: #d1d5db;
        }
        .action-btn.cancel:hover { background: #f9fafb; }
      `}</style>
    </div>
  );
};

export default ApplicationDetailModal; 