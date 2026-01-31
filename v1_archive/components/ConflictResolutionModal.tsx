import React, { useState } from 'react';
import { Application, Room, Property } from '../lib/types';
import { calculateRoomCompatibility } from '../lib/applicationUtils';
import StatusBadge from './StatusBadge';

interface ConflictResolutionModalProps {
  conflictingApplications: Application[];
  availableRooms: Room[];
  properties: Property[];
  onClose: () => void;
  onResolveConflict: (resolutions: ConflictResolution[]) => void;
}

interface ConflictResolution {
  applicationId: number;
  action: 'approve' | 'reject' | 'assign_room';
  roomId?: number;
  reason?: string;
}

export default function ConflictResolutionModal({
  conflictingApplications,
  availableRooms,
  properties,
  onClose,
  onResolveConflict
}: ConflictResolutionModalProps) {
  const [resolutions, setResolutions] = useState<ConflictResolution[]>([]);
  const [selectedAction, setSelectedAction] = useState<'auto' | 'manual'>('auto');

  const getPropertyName = (propertyId: number) => {
    const property = properties.find(p => p.id === propertyId);
    return property ? property.name : 'Unknown Property';
  };

  const getRecommendedAction = (application: Application): ConflictResolution => {
    const priorityScore = application.priority_score || 0;
    const propertyRooms = availableRooms.filter(room => room.property_ref === application.property_ref);
    
    if (priorityScore >= 80 && propertyRooms.length > 0) {
      const bestRoom = propertyRooms
        .map(room => ({
          ...room,
          compatibility: calculateRoomCompatibility(application, room)
        }))
        .sort((a, b) => b.compatibility - a.compatibility)[0];
      
      return {
        applicationId: application.id,
        action: 'assign_room',
        roomId: bestRoom.id,
        reason: `High priority (${priorityScore}) - Best room match (${Math.round(bestRoom.compatibility)}% compatibility)`
      };
    } else if (priorityScore >= 60) {
      return {
        applicationId: application.id,
        action: 'approve',
        reason: `Medium priority (${priorityScore}) - Approve for manual room assignment`
      };
    } else {
      return {
        applicationId: application.id,
        action: 'reject',
        reason: `Low priority (${priorityScore}) - Reject to resolve conflict`
      };
    }
  };

  const handleAutoResolve = () => {
    const autoResolutions = conflictingApplications.map(app => getRecommendedAction(app));
    setResolutions(autoResolutions);
  };

  const handleManualAction = (applicationId: number, action: 'approve' | 'reject' | 'assign_room', roomId?: number) => {
    setResolutions(prev => {
      const existing = prev.find(r => r.applicationId === applicationId);
      if (existing) {
        return prev.map(r => 
          r.applicationId === applicationId 
            ? { ...r, action, roomId, reason: `Manual ${action}` }
            : r
        );
      } else {
        return [...prev, { applicationId, action, roomId, reason: `Manual ${action}` }];
      }
    });
  };

  const handleSubmit = () => {
    if (resolutions.length === 0) {
      alert('Please select actions for all conflicting applications');
      return;
    }
    onResolveConflict(resolutions);
  };

  const getResolutionForApp = (applicationId: number): ConflictResolution | undefined => {
    return resolutions.find(r => r.applicationId === applicationId);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large-modal">
        <div className="modal-header">
          <h2>Resolve Application Conflicts</h2>
          <button onClick={onClose} className="modal-close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="conflict-summary">
            <p>
              <strong>{conflictingApplications.length} applications</strong> are competing for rooms in the same properties.
              Choose how to resolve these conflicts:
            </p>
          </div>

          <div className="resolution-options">
            <div className="option-buttons">
              <button 
                className={`option-btn ${selectedAction === 'auto' ? 'active' : ''}`}
                onClick={() => setSelectedAction('auto')}
              >
                Auto-Resolve (Recommended)
              </button>
              <button 
                className={`option-btn ${selectedAction === 'manual' ? 'active' : ''}`}
                onClick={() => setSelectedAction('manual')}
              >
                Manual Resolution
              </button>
            </div>

            {selectedAction === 'auto' && (
              <div className="auto-resolution">
                <p>Automatically resolve conflicts based on priority scores and room compatibility.</p>
                <button onClick={handleAutoResolve} className="auto-resolve-btn">
                  Generate Recommendations
                </button>
              </div>
            )}
          </div>

          <div className="applications-list">
            {conflictingApplications.map((app) => {
              const resolution = getResolutionForApp(app.id);
              const recommended = getRecommendedAction(app);
              
              return (
                <div key={app.id} className="application-conflict-card">
                  <div className="app-info">
                    <div className="app-header">
                      <h4>{app.tenant_name}</h4>
                      <StatusBadge status={app.status} />
                    </div>
                    <div className="app-details">
                      <div><strong>Property:</strong> {getPropertyName(app.property_ref)}</div>
                      <div><strong>Budget:</strong> ${app.rent_budget || 'Not specified'}/mo</div>
                      <div><strong>Priority Score:</strong> {app.priority_score || 0}</div>
                      <div><strong>Move-in:</strong> {app.desired_move_in_date || 'Not specified'}</div>
                    </div>
                  </div>

                  <div className="resolution-section">
                    <div className="recommended-action">
                      <h5>Recommended Action:</h5>
                      <div className="recommendation">
                        <span className={`action-badge action-${recommended.action}`}>
                          {recommended.action.replace('_', ' ').toUpperCase()}
                        </span>
                        {recommended.reason && <p className="reason">{recommended.reason}</p>}
                      </div>
                    </div>

                    {selectedAction === 'manual' && (
                      <div className="manual-actions">
                        <h5>Manual Actions:</h5>
                        <div className="action-buttons">
                          <button 
                            className={`action-btn approve ${resolution?.action === 'approve' ? 'selected' : ''}`}
                            onClick={() => handleManualAction(app.id, 'approve')}
                          >
                            Approve
                          </button>
                          <button 
                            className={`action-btn reject ${resolution?.action === 'reject' ? 'selected' : ''}`}
                            onClick={() => handleManualAction(app.id, 'reject')}
                          >
                            Reject
                          </button>
                          {availableRooms.filter(room => room.property_ref === app.property_ref).length > 0 && (
                            <select 
                              className="room-select"
                              value={resolution?.roomId || ''}
                              onChange={(e) => {
                                const roomId = parseInt(e.target.value);
                                if (roomId) {
                                  handleManualAction(app.id, 'assign_room', roomId);
                                }
                              }}
                            >
                              <option value="">Assign to Room</option>
                              {availableRooms
                                .filter(room => room.property_ref === app.property_ref)
                                .map(room => (
                                  <option key={room.id} value={room.id}>
                                    {room.name} - ${room.monthly_rent}/mo
                                  </option>
                                ))}
                            </select>
                          )}
                        </div>
                      </div>
                    )}

                    {resolution && (
                      <div className="selected-resolution">
                        <h5>Selected Resolution:</h5>
                        <div className="resolution-display">
                          <span className={`action-badge action-${resolution.action}`}>
                            {resolution.action.replace('_', ' ').toUpperCase()}
                          </span>
                          {resolution.reason && <p className="reason">{resolution.reason}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            className="btn-primary"
            disabled={resolutions.length === 0}
          >
            Apply Resolutions ({resolutions.length})
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
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h2 {
          margin: 0;
          color: #1f2937;
        }

        .modal-close {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
          padding: 4px;
        }

        .modal-body {
          padding: 20px;
        }

        .conflict-summary {
          margin-bottom: 20px;
          padding: 16px;
          background: #fef3c7;
          border-radius: 6px;
          border: 1px solid #f59e0b;
        }

        .resolution-options {
          margin-bottom: 20px;
        }

        .option-buttons {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .option-btn {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .option-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .auto-resolution {
          padding: 16px;
          background: #f3f4f6;
          border-radius: 6px;
        }

        .auto-resolve-btn {
          padding: 8px 16px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          margin-top: 8px;
        }

        .applications-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .application-conflict-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          background: #fafafa;
        }

        .app-info {
          margin-bottom: 16px;
        }

        .app-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .app-header h4 {
          margin: 0;
          color: #1f2937;
        }

        .app-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          font-size: 14px;
          color: #6b7280;
        }

        .resolution-section {
          border-top: 1px solid #e5e7eb;
          padding-top: 16px;
        }

        .recommended-action,
        .manual-actions,
        .selected-resolution {
          margin-bottom: 16px;
        }

        .recommended-action h5,
        .manual-actions h5,
        .selected-resolution h5 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #374151;
        }

        .action-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .action-approve {
          background: #dcfce7;
          color: #16a34a;
        }

        .action-reject {
          background: #fee2e2;
          color: #dc2626;
        }

        .action-assign_room {
          background: #dbeafe;
          color: #2563eb;
        }

        .reason {
          margin: 4px 0 0 0;
          font-size: 12px;
          color: #6b7280;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .action-btn {
          padding: 6px 12px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .action-btn.approve.selected {
          background: #16a34a;
          color: white;
          border-color: #16a34a;
        }

        .action-btn.reject.selected {
          background: #dc2626;
          color: white;
          border-color: #dc2626;
        }

        .room-select {
          padding: 6px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 12px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .btn-secondary {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-primary {
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
} 