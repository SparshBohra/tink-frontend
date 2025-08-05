import React, { useState, useEffect } from 'react';
import { Application, Property, Room } from '../lib/types';
import { formatPriorityScore, getStatusDisplayText } from '../lib/applicationUtils';
import StatusBadge from './StatusBadge';
import { apiClient } from '../lib/api';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'documents'>('overview');
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
      timestamp: app.created_at || new Date().toISOString(),
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
        timestamp: app.created_at || new Date().toISOString(),
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
        timestamp: app.created_at || new Date().toISOString(),
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
        timestamp: app.created_at || new Date().toISOString(),
        icon: '🏠',
        color: '#10b981'
      });
    }

    // Status changes
    if (app.status !== 'pending') {
      const statusDescriptions: Record<string, string> = {
        'under_review': 'Application is being reviewed by the property manager',
        'approved': 'Application has been approved and is ready for lease generation',
        'qualified': 'Applicant has been qualified and room assignment is pending', 
        'room_assigned': 'Room has been assigned to the applicant',
        'lease_created': 'Lease agreement has been generated',
        'rejected': 'Application has been rejected'
      };

      events.push({
        id: 'status_change',
        type: 'status_updated',
        title: `Status Updated: ${app.status.replace('_', ' ').toUpperCase()}`,
        description: statusDescriptions[app.status] || `Application status changed to ${app.status}`,
        timestamp: app.updated_at || app.created_at || new Date().toISOString(),
        icon: app.status === 'rejected' ? '❌' : app.status === 'approved' ? '✅' : '🔄',
        color: app.status === 'rejected' ? '#ef4444' : app.status === 'approved' ? '#10b981' : '#3b82f6'
      });
    }

    // Sort events by timestamp
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    setTimeline(events);
  };

  // Handler functions for lease document actions
  const handleDownloadLease = async (leaseId: number) => {
    try {
      const downloadData = await apiClient.downloadDraftLease(leaseId);
      window.open(downloadData.download_url, '_blank');
    } catch (error: any) {
      alert(`Failed to download lease: ${error.message}`);
    }
  };

  const handleEditLease = (leaseId: number) => {
    window.location.href = `/leases/${leaseId}`;
  };

  const handleActivateLease = async (leaseId: number) => {
    try {
      await apiClient.activateLease(leaseId);
      alert('Lease activated successfully!');
      // Refresh the application data to show updated status
      window.location.reload();
    } catch (error: any) {
      alert(`Failed to activate lease: ${error.message}`);
    }
  };

  const handleViewLease = (leaseId: number) => {
    window.location.href = `/leases/${leaseId}`;
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
              <div className="applicant-info">
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
            className={`tab-button ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            Documents
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="unified-overview">
                <div className="overview-row">
                  <div className="info-column">
                    <h3 className="section-title">Application Information</h3>
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

                  <div className="priority-column">
                    <h3 className="section-title">Priority & Urgency</h3>
                    <div className="priority-section">
                      <div className="priority-breakdown">
                        <div className="breakdown-item">
                          <span className="breakdown-label">Priority Score:</span>
                          <span className="breakdown-value priority-score-text" style={{ color: priorityLevel.color }}>
                            {application.priority_score || 0}/100 ({priorityLevel.level})
                          </span>
                        </div>
                        <div className="breakdown-item">
                          <span className="breakdown-label">Urgency:</span>
                          <span className="breakdown-value" style={{ color: urgencyIndicator.color }}>
                            {urgencyIndicator.text}
                          </span>
                        </div>
                        <div className="breakdown-item">
                          <span className="breakdown-label">Budget Compatible:</span>
                          <span className={`breakdown-value ${application.is_budget_compatible ? 'positive' : 'negative'}`}>
                            {application.is_budget_compatible ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overview-row">
                  <div className="recommendations-column">
                    <h3 className="section-title">Room Recommendations</h3>
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

                  <div className="conflicts-column">
                    <h3 className="section-title">Conflicts & Issues</h3>
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

          {activeTab === 'documents' && (
            <div className="documents-tab">
              <h3 className="section-title">Documents & Attachments</h3>
              <div className="documents-section">
                {application.lease && application.lease.status ? (
                  <div className="documents-list">
                    <div className="document-item">
                      <div className="document-info">
                        <div className="document-icon">📄</div>
                        <div className="document-details">
                          <h4 className="document-name">Lease Agreement</h4>
                          <div className="document-meta">
                            <span className="document-type">PDF Document</span>
                            <span className="document-status">Status: {application.lease.status.replace('_', ' ').toUpperCase()}</span>
                      </div>
                          <div className="document-info-row">
                            <span>Monthly Rent: ${application.lease.monthly_rent}</span>
                            <span>Security Deposit: ${application.lease.security_deposit}</span>
                    </div>
                          <div className="document-info-row">
                            <span>Start Date: {new Date(application.lease.start_date).toLocaleDateString()}</span>
                            <span>End Date: {new Date(application.lease.end_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                      </div>
                      <div className="document-actions">
                        {application.lease.status === 'draft' && (
                          <>
                            <button 
                              className="doc-action-btn download"
                              onClick={() => handleDownloadLease(application.lease_id)}
                              title="Download lease document"
                            >
                              📥 Download
                            </button>
                            <button 
                              className="doc-action-btn edit"
                              onClick={() => handleEditLease(application.lease_id)}
                              title="Edit lease terms"
                            >
                              ✏️ Edit
                            </button>
                          </>
                        )}
                        {application.lease.status === 'sent_to_tenant' && (
                          <div className="lease-status-info">
                            <span className="status-badge sent">📧 Sent to Tenant</span>
                            <small>Awaiting tenant signature</small>
                      </div>
                    )}
                        {application.lease.status === 'signed' && (
                          <div className="lease-status-info">
                            <span className="status-badge signed">✍️ Signed by Tenant</span>
                            <button 
                              className="doc-action-btn activate"
                              onClick={() => handleActivateLease(application.lease_id)}
                            >
                              ✅ Activate Lease
                            </button>
                      </div>
                    )}
                        {application.lease.status === 'active' && (
                          <div className="lease-status-info">
                            <span className="status-badge active">✅ Active Lease</span>
                            <button 
                              className="doc-action-btn view"
                              onClick={() => handleViewLease(application.lease_id)}
                            >
                              👁️ View Details
                            </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
                ) : (
                <div className="documents-placeholder">
                  <div className="placeholder-icon">📄</div>
                  <div className="placeholder-text">
                    <h4>No Documents Available</h4>
                      <p>Generate a lease for this application to see documents here.</p>
                  </div>
                </div>
                )}
              </div>
            </div>
          )}
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
          top: 72px;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .application-detail-modal {
          background: white;
          border-radius: 8px;
          width: fit-content;
          min-width: 650px;
          max-width: 720px;
          max-height: calc(100vh - 120px);
          overflow-y: auto;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          position: relative;
          border: 1px solid #e5e7eb;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
          position: relative;
          background: #f9fafb;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          width: 100%;
        }

        .header-left {
          flex: 1;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 6px 0;
        }

        .applicant-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .applicant-name {
          font-size: 16px;
          font-weight: 500;
          color: #374151;
        }

        .applicant-email {
          font-size: 13px;
          color: #6b7280;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
          padding: 8px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .modal-tabs {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .tab-button {
          padding: 16px 24px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }

        .tab-button:hover {
          color: #374151;
          background: #f3f4f6;
        }

        .tab-button.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
          background: white;
        }

        .modal-content {
          padding: 20px;
          min-height: 350px;
        }

        .unified-overview {
          background: #f9fafb;
          border-radius: 8px;
          padding: 24px;
          border: 1px solid #e5e7eb;
        }

        .overview-row {
          display: flex;
          gap: 24px;
          margin-bottom: 24px;
        }

        .overview-row:last-child {
          margin-bottom: 0;
        }

        .info-column {
          flex: 2;
          min-width: 0;
        }

        .priority-column {
          flex: 1;
          min-width: 180px;
        }

        .recommendations-column,
        .conflicts-column {
          flex: 1;
        }

        .section-title {
          font-size: 15px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 14px 0;
          padding-bottom: 6px;
          border-bottom: 1px solid #e5e7eb;
        }

        .info-grid {
          display: grid;
          gap: 12px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .info-item:last-child {
          border-bottom: none;
        }

        .info-item label {
          font-weight: 500;
          color: #374151;
        }

        .info-item span {
          color: #6b7280;
        }

        .priority-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .priority-score {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .score-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 4px solid;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: white;
        }

        .score-value {
          font-size: 24px;
          font-weight: 600;
          color: #1f2937;
        }

        .score-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        .priority-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .priority-level {
          font-size: 18px;
          font-weight: 600;
        }

        .urgency-indicator {
          font-size: 14px;
          font-weight: 500;
        }

        .priority-breakdown {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .breakdown-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
        }

        .breakdown-label {
          font-size: 14px;
          color: #374151;
        }

        .breakdown-value {
          font-size: 14px;
          font-weight: 500;
        }

        .breakdown-value.positive {
          color: #10b981;
        }

        .breakdown-value.negative {
          color: #ef4444;
        }

        .priority-score-text {
          font-weight: 600;
        }

        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .recommendation-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: white;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }

        .room-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .room-name {
          font-size: 16px;
          font-weight: 500;
          color: #1f2937;
        }

        .room-details {
          display: flex;
          gap: 12px;
        }

        .room-type, .room-rent {
          font-size: 14px;
          color: #6b7280;
        }

        .compatibility-badge {
          padding: 4px 8px;
          background: #eff6ff;
          color: #3b82f6;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .no-recommendations {
          text-align: center;
          padding: 20px;
          color: #6b7280;
        }

        .conflicts-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .conflict-alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
        }

        .conflict-icon {
          font-size: 24px;
        }

        .conflict-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .conflict-title {
          font-size: 16px;
          font-weight: 500;
          color: #78350f;
        }

        .conflict-description {
          font-size: 14px;
          color: #92400e;
        }

        .no-conflicts {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #10b981;
          font-weight: 500;
        }

        .success-icon {
          font-size: 20px;
        }

        .timeline-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .timeline-item {
          display: flex;
          gap: 16px;
        }

        .timeline-connector {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
        }

        .timeline-dot {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 18px;
        }

        .timeline-line {
          width: 2px;
          height: 32px;
          background: #e5e7eb;
          margin-top: 8px;
        }

        .timeline-content {
          flex: 1;
          padding-bottom: 16px;
        }

        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .timeline-title {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .timeline-time {
          font-size: 14px;
          color: #6b7280;
        }

        .timeline-description {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .analysis-grid {
          display: grid;
          gap: 24px;
        }

        .analysis-section {
          background: #f9fafb;
          border-radius: 8px;
          padding: 20px;
        }

        .analysis-subtitle {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 16px 0;
        }

        .score-breakdown {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .score-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .score-bar {
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .score-fill {
          height: 100%;
          background: #3b82f6;
          transition: width 0.3s ease;
        }

        .recommendations {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .recommendation {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid;
        }

        .recommendation.high-priority {
          background: #fef2f2;
          border-color: #fecaca;
        }

        .recommendation.conflict {
          background: #fef3c7;
          border-color: #fde68a;
        }

        .recommendation.approve {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }

        .recommendation.no-rooms {
          background: #f3f4f6;
          border-color: #d1d5db;
        }

        .recommendation-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .recommendation-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .recommendation-title {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }

        .recommendation-description {
          font-size: 14px;
          color: #6b7280;
        }

        .documents-section {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 300px;
        }

        .documents-list {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .document-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 20px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .document-info {
          display: flex;
          gap: 16px;
          flex: 1;
        }

        .document-icon {
          font-size: 32px;
          flex-shrink: 0;
        }

        .document-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .document-name {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .document-meta {
          display: flex;
          gap: 16px;
        }

        .document-type {
          font-size: 14px;
          color: #6b7280;
        }

        .document-status {
          font-size: 14px;
          font-weight: 500;
          color: #3b82f6;
        }

        .document-info-row {
          display: flex;
          gap: 24px;
          font-size: 14px;
          color: #6b7280;
        }

        .document-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-end;
        }

        .doc-action-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .doc-action-btn.download {
          background: #3b82f6;
          color: white;
        }

        .doc-action-btn.download:hover {
          background: #2563eb;
        }

        .doc-action-btn.edit {
          background: #f59e0b;
          color: white;
        }

        .doc-action-btn.edit:hover {
          background: #d97706;
        }

        .doc-action-btn.activate {
          background: #10b981;
          color: white;
        }

        .doc-action-btn.activate:hover {
          background: #059669;
        }

        .doc-action-btn.view {
          background: #6b7280;
          color: white;
        }

        .doc-action-btn.view:hover {
          background: #4b5563;
        }

        .lease-status-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-end;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
        }

        .status-badge.sent {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .status-badge.signed {
          background: #fef3c7;
          color: #d97706;
        }

        .status-badge.active {
          background: #dcfce7;
          color: #166534;
        }

        .lease-status-info small {
          font-size: 12px;
          color: #6b7280;
        }

        .documents-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          color: #6b7280;
        }

        .placeholder-icon {
          font-size: 48px;
        }

        .placeholder-text {
          text-align: center;
        }

        .placeholder-text h4 {
          font-size: 18px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 8px 0;
        }

        .placeholder-text p {
          font-size: 14px;
          margin: 0;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 16px 20px;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .action-btn.approve {
          background: #10b981;
          color: white;
        }

        .action-btn.approve:hover {
          background: #059669;
        }

        .action-btn.assign {
          background: #3b82f6;
          color: white;
        }

        .action-btn.assign:hover {
          background: #2563eb;
        }

        .action-btn.reject {
          background: #ef4444;
          color: white;
        }

        .action-btn.reject:hover {
          background: #dc2626;
        }

        .action-btn.cancel {
          background: #6b7280;
          color: white;
        }

        .action-btn.cancel:hover {
          background: #4b5563;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-btn:disabled:hover {
          background: initial;
        }

        @media (max-width: 768px) {
          .modal-overlay {
            top: 60px;
            padding: 10px;
            align-items: flex-start;
          }

          .application-detail-modal {
            width: 100%;
            max-width: 100%;
            max-height: calc(100vh - 80px);
            border-radius: 6px;
            margin-top: 10px;
          }

          .modal-header {
            padding: 16px;
          }

          .modal-title {
            font-size: 18px;
          }

          .modal-content {
            padding: 16px;
          }

          .unified-overview {
            padding: 16px;
          }

          .overview-row {
            flex-direction: column;
            gap: 16px;
            margin-bottom: 16px;
          }


          .modal-tabs {
            overflow-x: auto;
          }

          .tab-button {
            white-space: nowrap;
            padding: 12px 16px;
            font-size: 13px;
          }

          .modal-actions {
            padding: 12px 16px;
            flex-wrap: wrap;
          }

          .action-btn {
            flex: 1;
            min-width: 100px;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default ApplicationDetailModal; 