import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import StatusProgressIndicator from './StatusProgressIndicator';
import { Application } from '../lib/types';

interface ApplicationKanbanProps {
  applications: Application[];
  onReview: (application: Application) => void;
  onApprove: (applicationId: number, propertyId: number) => void;
  onReject: (applicationId: number) => void;
  onAssignRoom: (application: Application) => void;
  onGenerateLease?: (application: Application) => void;
  onMessage?: (application: Application) => void;
  onSetupViewing?: (application: Application) => void;
  onActivateLease?: (application: Application) => void;
  getPropertyName: (propertyId: number) => string;
  formatDate: (date: string | null) => string;
}

interface ViewToggleProps {
  currentView: 'kanban' | 'list';
  onViewChange: (view: 'kanban' | 'list') => void;
}

function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="view-toggle">
      <button 
        className={`view-btn ${currentView === 'kanban' ? 'active' : ''}`}
        onClick={() => onViewChange('kanban')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
        </svg>
        Kanban
      </button>
      <button 
        className={`view-btn ${currentView === 'list' ? 'active' : ''}`}
        onClick={() => onViewChange('list')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="8" y1="6" x2="21" y2="6"/>
          <line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/>
          <line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        List
      </button>
    </div>
  );
}

interface ApplicationListViewProps extends ApplicationKanbanProps {
  grouped: Record<string, Application[]>;
}

function ApplicationListView({
  grouped,
  onReview,
  onApprove,
  onReject,
  onAssignRoom,
  onGenerateLease,
  onMessage,
  onSetupViewing,
  onActivateLease,
  getPropertyName,
  formatDate,
}: ApplicationListViewProps) {
  const getStageDescription = (title: string): string => {
    switch (title) {
      case 'Pending Review':
        return 'New applications waiting for initial screening and approval decision';
      case 'Qualified':
        return 'Approved applicants ready for property viewing scheduling';
      case 'Viewing Process':
        return 'Property viewings scheduled, in progress, or completed - ready for room assignment';
      case 'Lease Process':
        return 'Room assigned and lease documents in preparation, generation, or signing process';
      case 'Active Tenants':
        return 'Completed applications - active tenants';
      default:
        return '';
    }
  };

  return (
    <div className="list-view-container">
      {STATUS_COLUMNS.map((col) => (
        <div key={col.title} className="list-section">
          <div className="list-section-header">
            <h3 className="list-section-title">
              {col.title} ({grouped[col.title]?.length || 0})
            </h3>
            <p className="list-section-description">
              {getStageDescription(col.title)}
            </p>
          </div>
          
          {(grouped[col.title] || []).length === 0 ? (
            <div className="list-empty">
              <p>No applications in this stage</p>
            </div>
          ) : (
            <div className="list-table-container">
              <table className="list-table">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Property</th>
                    <th>Applied Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped[col.title].map((app) => (
                    <tr key={app.id} className="list-row">
                      <td className="applicant-cell">
                        <div className="applicant-info">
                          <div className="applicant-name-list">
                            {app.tenant_name || `Applicant #${app.id}`}
                          </div>
                          {app.tenant_email && (
                            <div className="applicant-email">
                              {app.tenant_email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="property-cell">
                        {getPropertyName(app.property_ref)}
                      </td>
                      <td className="date-cell">
                        {formatDate(app.created_at)}
                      </td>
                      <td className="status-cell">
                        <StatusBadge status={app.status} small />
                      </td>
                      <td className="actions-cell">
                        <div className="list-actions">
                          {/* Pending actions */}
                          {app.status === 'pending' && (
                            <>
                              <button className="btn-sm primary" onClick={() => onReview(app)}>
                                Review
                              </button>
                              <button className="btn-sm success" onClick={() => onApprove(app.id, app.property_ref)}>
                                Approve
                              </button>
                              <button className="btn-sm btn-error" onClick={() => onReject(app.id)}>
                                Reject
                              </button>
                            </>
                          )}

                          {/* Rejected actions */}
                          {app.status === 'rejected' && (
                            <>
                              <button className="btn-sm success" onClick={() => onApprove(app.id, app.property_ref)}>
                                Accept
                              </button>
                              <button className="btn-sm primary" onClick={() => onReview(app)}>
                                Review Details
                              </button>
                            </>
                          )}

                          {/* Qualified actions */}
                          {app.status === 'approved' && (
                            <button className="btn-sm primary" onClick={() => onSetupViewing && onSetupViewing(app)}>
                              Schedule Viewing
                            </button>
                          )}

                          {/* Viewing Scheduled actions */}
                          {app.status === 'viewing_scheduled' && (
                            <>
                              <button className="btn-sm success" onClick={() => onSetupViewing && onSetupViewing(app)}>
                                Complete Viewing
                              </button>
                              <button className="btn-sm secondary" onClick={() => onSetupViewing && onSetupViewing(app)}>
                                Reschedule
                              </button>
                            </>
                          )}

                          {/* Viewing Complete actions */}
                          {(app.status === 'viewing_completed' || app.status === 'processing') && (
                            <>
                              <button className="btn-sm primary" onClick={() => onAssignRoom(app)}>
                                Assign Room
                              </button>
                              <button className="btn-sm secondary" onClick={() => onReject(app.id)}>
                                Reject
                              </button>
                            </>
                          )}

                          {/* Room Assigned actions */}
                          {app.status === 'room_assigned' && (
                            <>
                              <button className="btn-sm success" onClick={() => onGenerateLease && onGenerateLease(app)}>
                                Generate Lease
                              </button>
                              <button className="btn-sm secondary" onClick={() => onAssignRoom(app)}>
                                Change Room
                              </button>
                            </>
                          )}

                          {/* Lease Process actions */}
                          {(app.status === 'lease_created' || app.status === 'lease_signed') && (
                            <>
                              <button className="btn-sm primary" onClick={() => onReview(app)}>
                                View Lease
                              </button>
                              {app.status === 'lease_created' && (
                                <button className="btn-sm success" onClick={() => onActivateLease && onActivateLease(app)}>
                                  Send to Tenant
                                </button>
                              )}
                              {app.status === 'lease_signed' && (
                                <button className="btn-sm success" onClick={() => onActivateLease && onActivateLease(app)}>
                                  Schedule Move-in
                                </button>
                              )}
                            </>
                          )}

                          {/* Active Tenants actions */}
                          {(app.status === 'moved_in' || app.status === 'active') && (
                            <button className="btn-sm primary" onClick={() => onReview(app)}>
                              View Details
                            </button>
                          )}

                          {/* Message button */}
                          {app.status !== 'rejected' && (
                            <button className="btn-sm message" onClick={() => onMessage && onMessage(app)}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                              </svg>
                              Message
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

type Column = { keys: string[]; title: string };

const STATUS_COLUMNS: Column[] = [
  { keys: ['pending', 'rejected'], title: 'Pending Review' },
  { keys: ['approved'], title: 'Qualified' },
  { keys: ['viewing_scheduled', 'viewing_completed', 'processing'], title: 'Viewing Process' },
  { keys: ['room_assigned', 'lease_ready', 'lease_created', 'lease_signed'], title: 'Lease Process' },
  { keys: ['moved_in', 'active'], title: 'Active Tenants' },
];

export default function ApplicationKanban({
  applications,
  onReview,
  onApprove,
  onReject,
  onAssignRoom,
  onGenerateLease,
  onMessage,
  onSetupViewing,
  onActivateLease,
  getPropertyName,
  formatDate,
}: ApplicationKanbanProps) {
  const [currentView, setCurrentView] = useState<'kanban' | 'list'>('kanban');

  // Helper function to get stage descriptions
  const getStageDescription = (title: string): string => {
    switch (title) {
      case 'Pending Review':
        return 'New applications waiting for initial screening and approval decision';
      case 'Qualified':
        return 'Approved applicants ready for property viewing scheduling';
      case 'Viewing Process':
        return 'Property viewings scheduled, in progress, or completed - ready for room assignment';
      case 'Lease Process':
        return 'Room assigned and lease documents in preparation, generation, or signing process';
      case 'Active Tenants':
        return 'Completed applications - active tenants';
      default:
        return '';
    }
  };

  // Map each column to list of applications
  const grouped: Record<string, Application[]> = {};
  STATUS_COLUMNS.forEach((col) => {
    grouped[col.title] = [];
  });

  applications.forEach((app) => {
    const column = STATUS_COLUMNS.find((c) => c.keys.includes(app.status));
    const key = column ? column.title : 'Unmapped';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(app);
  });

  return (
    <div className="kanban-container">
      {/* Header with View Toggle */}
      <div className="kanban-header">
        <div className="header-content">
          <h2 className="kanban-title">Application Journey Board</h2>
          <p className="kanban-description">
            Track each applicant&apos;s progress from initial review to becoming an active tenant. 
            Drag applications through stages or use action buttons to advance them in the rental process.
          </p>
        </div>
        <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
      </div>
      
      {/* Render Current View */}
      {currentView === 'kanban' ? (
        <div className="kanban-board">
          {STATUS_COLUMNS.map((col) => (
            <div key={col.title} className="kanban-column">
              <div className="kanban-column-header">
                {col.title} ({grouped[col.title]?.length || 0})
                <div className="stage-description">
                  {getStageDescription(col.title)}
                </div>
              </div>
              <div className="kanban-column-body">
                {(grouped[col.title] || []).length === 0 ? (
                  <div className="kanban-empty">No items</div>
                ) : (
                  grouped[col.title].map((app) => (
                    <div key={app.id} className="kanban-card">
                      <div className="card-top">
                        <div className="applicant-name" onClick={() => onReview(app)}>
                          {app.tenant_name || `Applicant #${app.id}`}
                        </div>
                        <StatusBadge status={app.status} small />
                      </div>
                      <div className="app-prop">{getPropertyName(app.property_ref)}</div>
                      <div className="app-dates">Applied: {formatDate(app.created_at)}</div>
                      <div className="app-status-text">
                        {app.status === 'pending' && 'Awaiting Review'}
                        {app.status === 'approved' && 'Approved - Viewing Needed'}
                        {app.status === 'rejected' && 'Application Rejected'}
                        {app.status === 'viewing_scheduled' && 'Viewing Scheduled'}
                        {app.status === 'viewing_completed' && 'Viewing Completed'}
                        {app.status === 'processing' && 'Processing Application'}
                        {app.status === 'room_assigned' && 'Room Assigned'}
                        {app.status === 'lease_ready' && 'Lease Ready'}
                        {app.status === 'lease_created' && 'Lease Generated'}
                        {app.status === 'lease_signed' && 'Lease Signed'}
                        {app.status === 'moved_in' && 'Tenant Moved In'}
                        {app.status === 'active' && 'Active Tenant'}
                      </div>
                      <div className="kanban-actions">
                        {/* Pending actions */}
                        {app.status === 'pending' && (
                          <>
                            <button className="btn-sm primary" onClick={() => onReview(app)}>
                              Review
                            </button>
                            <button className="btn-sm success" onClick={() => onApprove(app.id, app.property_ref)}>
                              Approve
                            </button>
                            <button className="btn-sm btn-error" onClick={() => onReject(app.id)}>
                              Reject
                            </button>
                          </>
                        )}

                        {/* Rejected actions - can be accepted again */}
                        {app.status === 'rejected' && (
                          <>
                            <button className="btn-sm success" onClick={() => onApprove(app.id, app.property_ref)}>
                              Accept
                            </button>
                            <button className="btn-sm primary" onClick={() => onReview(app)}>
                              Review Details
                            </button>
                          </>
                        )}

                        {/* Qualified actions */}
                        {app.status === 'approved' && (
                          <>
                            <button className="btn-sm primary" onClick={() => onSetupViewing && onSetupViewing(app)}>
                              Schedule Viewing
                            </button>
                          </>
                        )}

                        {/* Viewing Scheduled actions */}
                        {app.status === 'viewing_scheduled' && (
                          <>
                            <button className="btn-sm success" onClick={() => onSetupViewing && onSetupViewing(app)}>
                              Complete Viewing
                            </button>
                            <button className="btn-sm secondary" onClick={() => onSetupViewing && onSetupViewing(app)}>
                              Reschedule
                            </button>
                          </>
                        )}

                        {/* Viewing Complete actions */}
                        {(app.status === 'viewing_completed' || app.status === 'processing') && (
                          <>
                            <button className="btn-sm primary" onClick={() => onAssignRoom(app)}>
                              Assign Room
                            </button>
                            <button className="btn-sm secondary" onClick={() => onReject(app.id)}>
                              Reject
                            </button>
                          </>
                        )}

                        {/* Room Assigned actions */}
                        {app.status === 'room_assigned' && (
                          <>
                            <button className="btn-sm success" onClick={() => onGenerateLease && onGenerateLease(app)}>
                              Generate Lease
                            </button>
                            <button className="btn-sm secondary" onClick={() => onAssignRoom(app)}>
                              Change Room
                            </button>
                          </>
                        )}

                        {/* Lease Process actions */}
                        {(app.status === 'lease_created' || app.status === 'lease_signed') && (
                          <>
                            <button className="btn-sm primary" onClick={() => onReview(app)}>
                              View Lease
                            </button>
                            {app.status === 'lease_created' && (
                              <button className="btn-sm success" onClick={() => onActivateLease && onActivateLease(app)}>
                                Send to Tenant
                              </button>
                            )}
                            {app.status === 'lease_signed' && (
                              <button className="btn-sm success" onClick={() => onActivateLease && onActivateLease(app)}>
                                Schedule Move-in
                              </button>
                            )}
                          </>
                        )}

                        {/* Active Tenants actions */}
                        {(app.status === 'moved_in' || app.status === 'active') && (
                          <button className="btn-sm primary" onClick={() => onReview(app)}>
                            View Details
                          </button>
                        )}

                        {/* Message button - available on all cards except rejected */}
                        {app.status !== 'rejected' && (
                          <button className="btn-sm message" onClick={() => onMessage && onMessage(app)}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                            Message
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ApplicationListView
          applications={applications}
          grouped={grouped}
          onReview={onReview}
          onApprove={onApprove}
          onReject={onReject}
          onAssignRoom={onAssignRoom}
          onGenerateLease={onGenerateLease}
          onMessage={onMessage}
          onSetupViewing={onSetupViewing}
          onActivateLease={onActivateLease}
          getPropertyName={getPropertyName}
          formatDate={formatDate}
        />
      )}

      {/* Styles */}
      <style jsx>{`
        .kanban-container {
          width: 100%;
          margin-top: 8px;
        }
        
        .kanban-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          padding: 20px 24px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        
        .header-content {
          flex: 1;
          margin-right: 24px;
        }
        
        .kanban-title {
          font-size: 22px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 8px 0;
          letter-spacing: -0.025em;
        }
        
        .kanban-description {
          font-size: 14px;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
          max-width: 650px;
        }

        .view-toggle {
          display: flex;
          background: #f1f5f9;
          border-radius: 8px;
          padding: 2px;
          gap: 2px;
        }

        .view-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border: none;
          background: transparent;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .view-btn:hover {
          background: rgba(255, 255, 255, 0.8);
          color: #374151;
        }

        .view-btn.active {
          background: white;
          color: #1e293b;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .kanban-board {
          display: flex;
          gap: 18px;
          padding: 0 0 20px 0;
          margin: 0;
          width: 100%;
          box-sizing: border-box;
        }
        .kanban-column {
          flex: 1;
          min-width: 0;
          background: rgba(248, 250, 252, 0.6);
          backdrop-filter: blur(8px);
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          max-height: 75vh;
          transition: all 0.2s ease;
        }
        .kanban-column:hover {
          background: rgba(248, 250, 252, 0.9);
          border-color: #cbd5e1;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        }
        .kanban-column-header {
          padding: 18px 20px;
          font-size: 14px;
          font-weight: 700;
          border-bottom: 1px solid #e2e8f0;
          text-transform: uppercase;
          color: #334155;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95));
          border-radius: 10px 10px 0 0;
          letter-spacing: 0.025em;
        }
        .stage-description {
          font-size: 12px;
          font-weight: 400;
          color: #64748b;
          text-transform: none;
          margin-top: 6px;
          line-height: 1.3;
          letter-spacing: 0;
        }
        .kanban-column-body {
          padding: 16px;
          overflow-y: auto;
          flex: 1;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }
        .kanban-column-body::-webkit-scrollbar {
          width: 6px;
        }
        .kanban-column-body::-webkit-scrollbar-track {
          background: transparent;
        }
        .kanban-column-body::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .kanban-column-body::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .kanban-empty {
          font-size: 14px;
          color: #94a3b8;
          padding: 32px 16px;
          text-align: center;
          font-style: italic;
          background: rgba(248, 250, 252, 0.5);
          border-radius: 8px;
          border: 2px dashed #e2e8f0;
          margin: 8px 0;
        }
        .kanban-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: all 0.2s ease;
          cursor: pointer;
          min-height: 140px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        .kanban-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
          transform: translateY(-1px);
        }
        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 8px;
        }
        .applicant-name {
          font-weight: 600;
          color: #1e293b;
          font-size: 15px;
          line-height: 1.4;
          cursor: pointer;
          flex: 1;
          margin: 0;
        }
        .applicant-name:hover {
          color: #3b82f6;
        }
        .app-prop {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
          margin: 0 0 6px 0;
          line-height: 1.3;
        }
        .app-dates {
          font-size: 12px;
          color: #94a3b8;
          margin: 0 0 8px 0;
        }
        .app-status-text {
          font-size: 12px;
          color: #4f46e5;
          font-weight: 500;
          padding: 6px 10px;
          background: rgba(79, 70, 229, 0.08);
          border-radius: 6px;
          border: 1px solid rgba(79, 70, 229, 0.2);
          text-align: center;
          margin: 4px 0;
        }
        .kanban-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: auto;
          padding-top: 12px;
          border-top: 1px solid #f1f5f9;
        }

        /* List View Styles */
        .list-view-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .list-section {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }

        .list-section-header {
          padding: 20px 24px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95));
          border-bottom: 1px solid #e2e8f0;
        }

        .list-section-title {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 6px 0;
          letter-spacing: -0.025em;
        }

        .list-section-description {
          font-size: 13px;
          color: #64748b;
          margin: 0;
          line-height: 1.4;
        }

        .list-empty {
          padding: 40px 24px;
          text-align: center;
          color: #94a3b8;
          font-style: italic;
        }

        .list-table-container {
          overflow-x: auto;
        }

        .list-table {
          width: 100%;
          border-collapse: collapse;
        }

        .list-table th {
          background: #f8fafc;
          padding: 12px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #e5e7eb;
        }

        .list-table td {
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: top;
        }

        .list-row:hover {
          background: #f8fafc;
        }

        .applicant-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .applicant-name-list {
          font-weight: 600;
          color: #1e293b;
          font-size: 14px;
        }

        .applicant-email {
          font-size: 12px;
          color: #64748b;
        }

        .property-cell {
          font-weight: 500;
          color: #374151;
        }

        .date-cell {
          font-size: 13px;
          color: #6b7280;
        }

        .list-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        /* Button Styles */
        .btn-sm {
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          text-decoration: none;
        }
        .btn-sm.primary {
          background: #3b82f6;
          color: white;
        }
        .btn-sm.primary:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }
        .btn-sm.success {
          background: #10b981;
          color: white;
        }
                .btn-sm.success:hover {
          background: #059669;
          transform: translateY(-1px);
        }
        .btn-sm.secondary {
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }
        .btn-sm.secondary:hover {
          background: #f1f5f9;
          color: #475569;
          transform: translateY(-1px);
        }
        .btn-sm.message {
          background: #f3f4f6;
          color: #6b7280;
          border: 1px solid #d1d5db;
        }
        .btn-sm.message:hover {
          background: #e5e7eb;
          color: #374151;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
} 