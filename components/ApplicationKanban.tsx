import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import StatusProgressIndicator from './StatusProgressIndicator';
import { Application } from '../lib/types';

interface ApplicationKanbanProps {
  applications: Application[];
  onReview: (application: Application) => void;
  onApprove: (applicationId: number, propertyId: number) => void;
  onQualify?: (applicationId: number) => void;
  onReject: (applicationId: number) => void;
  onAssignRoom: (application: Application) => void;
  onGenerateLease?: (application: Application) => void;
  onMessage?: (application: Application) => void;
  onSetupViewing?: (application: Application) => void;
  onRescheduleViewing?: (application: Application) => void;
  onActivateLease?: (application: Application) => void;
  onSkipViewing?: (applicationId: number) => void; /* New prop */
  onDelete?: (applicationId: number) => void; /* New prop for delete functionality */
  onSendToTenant?: (application: Application) => void;
  onEditLease?: (application: Application) => void;
  onDownloadLease?: (application: Application) => void;
  getPropertyName: (propertyId: number) => string;
  formatDate: (date: string | null) => string;
  extraActions?: React.ReactNode;
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
  sortSettings: Record<string, 'default' | 'date' | 'name'>;
  toggleSort: (columnTitle: string) => void;
  getSortIcon: (sortType: 'default' | 'date' | 'name') => React.ReactNode;
  getSortLabel: (sortType: 'default' | 'date' | 'name') => string;
}

type Column = { keys: string[]; title: string };

const STATUS_COLUMNS: Column[] = [
  { keys: ['pending', 'rejected'], title: 'Pending Review' },
  { keys: ['approved', 'viewing_scheduled'], title: 'Shortlisted' },
  { keys: ['viewing_completed', 'processing', 'room_assigned'], title: 'Generate Lease' },
  { keys: ['lease_ready', 'lease_created', 'lease_signed'], title: 'Lease Process' },
  { keys: ['moved_in', 'active'], title: 'Active Tenants' },
];

// Helper function to get card colors based on status (matching StatusBadge colors)
const getCardColorClass = (status: string) => {
  switch (status.toLowerCase()) {
    case 'moved_in':
    case 'active':
      return 'card-success'; // Dark green for moved in/active
    
    case 'approved':
      return 'card-success-light'; // Light green for shortlisted/approved
    
    case 'success':
    case 'completed':
    case 'paid':
    case 'lease_signed':
      return 'card-success';
    
    case 'warning':
    case 'pending':
    case 'in progress':
    case 'in review':
    case 'awaiting':
      return 'card-warning';
    
    case 'error':
    case 'rejected':
    case 'failed':
    case 'overdue':
    case 'cancelled':
    case 'withdrawn':
      return 'card-error';
    
    case 'info':
    case 'new':
    case 'processing':
    case 'draft':
    case 'viewing_scheduled':
      return 'card-info';

    case 'primary':
    case 'room_assigned':
    case 'lease_created':
      return 'card-primary';

    case 'secondary':
    case 'viewing_completed':
      return 'card-secondary';
    
    default:
      return 'card-neutral';
  }
};

// Helper function to check if application can be deleted
const canDeleteApplication = (status: string) => {
  const protectedStatuses = ['lease_created', 'lease_signed', 'moved_in', 'active'];
  return !protectedStatuses.includes(status);
};

const ApplicationListView: React.FC<ApplicationListViewProps> = ({
  grouped,
  onReview,
  onApprove,
  onQualify,
  onReject,
  onAssignRoom,
  onGenerateLease,
  onMessage,
  onSetupViewing,
  onActivateLease,
  onSkipViewing,
  onDelete,
  getPropertyName,
  formatDate,
  sortSettings,
  toggleSort,
  getSortIcon,
  getSortLabel,
}) => {
  const getStageDescription = (title: string): string => {
    switch (title) {
      case 'Pending Review':
        return 'New applications waiting for initial screening and approval decision';
      case 'Shortlisted':
        return 'Shortlisted applicants ready for property viewing scheduling and completion';
      case 'Generate Lease':
        return 'Viewing completed - ready for lease generation (room assignment can be edited during lease creation)';
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
            <div className="list-header-content">
              <div className="list-header-text">
            <h3 className="list-section-title">
              {col.title} ({grouped[col.title]?.length || 0})
            </h3>
            <p className="list-section-description">
              {getStageDescription(col.title)}
            </p>
              </div>
              <button
                className="sort-toggle-btn"
                onClick={() => toggleSort(col.title)}
                title={getSortLabel(sortSettings[col.title] || 'default')}
              >
                {getSortIcon(sortSettings[col.title] || 'default')}
              </button>
            </div>
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
                              <button className="btn-sm success" onClick={() => onQualify && onQualify(app.id)}>
                                Shortlist
                              </button>
                              <button className="btn-sm btn-error" onClick={() => onReject(app.id)}>
                                Reject
                              </button>
                            </>
                          )}

                          {/* Rejected actions */}
                          {app.status === 'rejected' && (
                            <>
                              <button 
                                className="btn-sm success" 
                                onClick={() => onQualify && onQualify(app.id)}
                                title="Restore application to pending status for fresh review"
                              >
                                Undo
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
                              <button 
                                className="btn-sm secondary" 
                                onClick={() => onSkipViewing && onSkipViewing(app.id)}
                                title="Skip viewing and move directly to room assignment"
                              >
                                Skip Viewing
                              </button>
                            </>
                          )}

                          {/* Viewing Scheduled actions */}
                          {app.status === 'viewing_scheduled' && (
                            <>
                              <button className="btn-sm success" onClick={() => onSetupViewing && onSetupViewing(app)}>
                                Complete Viewing
                              </button>
                              <button className="btn-sm secondary" onClick={() => onRescheduleViewing && onRescheduleViewing(app)}>
                                Reschedule
                              </button>
                            </>
                          )}

                          {/* Viewing Complete actions */}
                          {(app.status === 'viewing_completed' || app.status === 'processing') && (
                            <>
                              <button 
                                className="btn-sm success" 
                                onClick={() => {
                                  console.log('Generate Lease button clicked for app:', app);
                                  onGenerateLease && onGenerateLease(app);
                                }}
                              >
                                Generate Lease
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
                              {/* Show different buttons based on lease status */}
                              {app.lease?.status === 'draft' && (
                                <>
                                  <button className="btn-sm success" onClick={() => onSendToTenant && onSendToTenant(app)}>
                                    Send to Tenant
                                  </button>
                                  <button className="btn-sm secondary" onClick={() => onEditLease && onEditLease(app)}>
                                    Edit Lease
                                  </button>
                                  <button className="btn-sm outline" onClick={() => onDownloadLease && onDownloadLease(app)}>
                                    Download Lease
                                  </button>
                                </>
                              )}
                              {app.lease?.status === 'sent_to_tenant' && (
                                <div className="status-text">
                                  📤 Sent to Tenant - Awaiting Signature
                                </div>
                              )}
                              {app.lease?.status === 'signed' && (
                                <button className="btn-sm success" onClick={() => onActivateLease && onActivateLease(app)}>
                                  Activate Lease
                                </button>
                              )}
                              {app.lease?.status === 'active' && (
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

                          {/* Delete button - available if application can be deleted */}
                          {canDeleteApplication(app.status) && onDelete && (
                            <button 
                              className="btn-sm btn-error" 
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete the application from ${app.tenant_name || `Applicant #${app.id}`}? This action cannot be undone.`)) {
                                  onDelete(app.id);
                                }
                              }}
                              title="Delete application"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3,6 5,6 21,6"/>
                                <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                                <line x1="10" y1="11" x2="10" y2="17"/>
                                <line x1="14" y1="11" x2="14" y2="17"/>
                              </svg>
                              Delete
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
};

export default function ApplicationKanban({
  applications,
  onReview,
  onApprove,
  onQualify,
  onReject,
  onAssignRoom,
  onGenerateLease,
  onMessage,
  onSetupViewing,
  onRescheduleViewing,
  onActivateLease,
  onSkipViewing,
  onDelete,
  onSendToTenant,
  onEditLease,
  onDownloadLease,
  getPropertyName,
  formatDate,
  extraActions,
}: ApplicationKanbanProps) {
  const [currentView, setCurrentView] = useState<'kanban' | 'list'>('kanban');
  const [sortSettings, setSortSettings] = useState<Record<string, 'default' | 'date' | 'name'>>({});

  // Sorting function
  const sortApplications = (apps: Application[], sortType: 'default' | 'date' | 'name') => {
    if (sortType === 'default') {
      return apps; // Return original order
    }
    
    return [...apps].sort((a, b) => {
      if (sortType === 'date') {
        // Sort by applied date (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortType === 'name') {
        // Sort by tenant name alphabetically
        const nameA = (a.tenant_name || `Applicant #${a.id}`).toLowerCase();
        const nameB = (b.tenant_name || `Applicant #${b.id}`).toLowerCase();
        return nameA.localeCompare(nameB);
      }
      return 0;
    });
  };

  // Toggle sort for a specific column
  const toggleSort = (columnTitle: string) => {
    setSortSettings(prev => {
      const currentSort = prev[columnTitle] || 'default';
      const nextSort = currentSort === 'default' ? 'date' : 
                      currentSort === 'date' ? 'name' : 'default';
      return { ...prev, [columnTitle]: nextSort };
    });
  };

  // Get sort icon for display
  const getSortIcon = (sortType: 'default' | 'date' | 'name') => {
    switch (sortType) {
      case 'date':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        );
      case 'name':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 19H9"/>
            <path d="M12 17V5"/>
            <path d="M8 8l4-4 4 4"/>
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="7 13 12 18 17 13"></polyline>
            <polyline points="7 11 12 6 17 11"></polyline>
          </svg>
        );
    }
  };

  // Get sort label for tooltip
  const getSortLabel = (sortType: 'default' | 'date' | 'name') => {
    switch (sortType) {
      case 'date':
        return 'Sorted by Applied Date';
      case 'name':
        return 'Sorted by Tenant Name';
      default:
        return 'Default Order';
    }
  };

  // Helper function to get stage descriptions
  const getStageDescription = (title: string): string => {
    switch (title) {
      case 'Pending Review':
        return 'New applications waiting for initial screening and approval decision';
      case 'Shortlisted':
        return 'Shortlisted applicants ready for property viewing scheduling and completion';
      case 'Generate Lease':
        return 'Viewing completed - ready for lease generation (room assignment can be edited during lease creation)';
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

  // Apply sorting to each column
  STATUS_COLUMNS.forEach((col) => {
    const sortType = sortSettings[col.title] || 'default';
    grouped[col.title] = sortApplications(grouped[col.title], sortType);
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
        {extraActions && (
          <div className="header-actions">
            {extraActions}
          </div>
        )}
        <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
      </div>
      
      {/* Render Current View */}
      {currentView === 'kanban' ? (
        <div className="kanban-board">
          {STATUS_COLUMNS.map((col) => (
            <div key={col.title} className="kanban-column">
              <div className="kanban-column-header">
                <div className="column-header-content">
                  <span className="column-title">
                {col.title} ({grouped[col.title]?.length || 0})
                  </span>
                  <button
                    className="sort-toggle-btn"
                    onClick={() => toggleSort(col.title)}
                    title={getSortLabel(sortSettings[col.title] || 'default')}
                  >
                    {getSortIcon(sortSettings[col.title] || 'default')}
                  </button>
                </div>
                <div className="stage-description">
                  {getStageDescription(col.title)}
                </div>
              </div>
              <div className="kanban-column-body">
                {(grouped[col.title] || []).length === 0 ? (
                  <div className="kanban-empty">No items</div>
                ) : (
                  grouped[col.title].map((app) => (
                    <div key={app.id} className={`kanban-card ${getCardColorClass(app.status)}`}>
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
                        {app.status === 'approved' && 'Shortlisted'}
                        {app.status === 'rejected' && 'Application Rejected'}
                        {app.status === 'viewing_scheduled' && 'Viewing Scheduled'}
                        {app.status === 'viewing_completed' && 'Viewing Completed'}
                        {app.status === 'processing' && 'Processing Application'}
                        {app.status === 'room_assigned' && 'Room Assigned'}
                        {app.status === 'lease_ready' && 'Lease Ready'}
                        {app.status === 'lease_created' && (
                              app.lease?.status === 'draft' ? 'Draft Lease Created' :
                              app.lease?.status === 'sent_to_tenant' ? 'Sent to Tenant' :
                              app.lease?.status === 'signed' ? 'Lease Signed' :
                              app.lease?.status === 'active' ? 'Lease Active' :
                              'Lease Generated'
                            )}
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
                            <button className="btn-sm success" onClick={() => onQualify && onQualify(app.id)}>
                              Shortlist
                            </button>
                            <button className="btn-sm btn-error" onClick={() => onReject(app.id)}>
                              Reject
                            </button>
                          </>
                        )}

                        {/* Rejected actions - can be accepted again */}
                        {app.status === 'rejected' && (
                          <>
                            <button 
                              className="btn-sm success" 
                              onClick={() => onQualify && onQualify(app.id)}
                              title="Restore application to pending status for fresh review"
                            >
                              Undo
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
                            <button 
                              className="btn-sm secondary" 
                              onClick={() => onSkipViewing && onSkipViewing(app.id)}
                              title="Skip viewing and move directly to room assignment"
                            >
                              Skip Viewing
                            </button>
                          </>
                        )}

                        {/* Viewing Scheduled actions */}
                        {app.status === 'viewing_scheduled' && (
                          <>
                            <button className="btn-sm success" onClick={() => onSetupViewing && onSetupViewing(app)}>
                              Complete Viewing
                            </button>
                            <button className="btn-sm secondary" onClick={() => onRescheduleViewing && onRescheduleViewing(app)}>
                              Reschedule
                            </button>
                          </>
                        )}

                        {/* Viewing Complete actions */}
                        {(app.status === 'viewing_completed' || app.status === 'processing') && (
                          <>
                            <button 
                              className="btn-sm success" 
                              onClick={() => onGenerateLease && onGenerateLease(app)}
                              title="Generate lease for this applicant (room assignment can be edited during lease generation)"
                            >
                              Generate Lease
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
                            {/* Show different buttons based on lease status */}
                            {app.lease?.status === 'draft' && (
                              <>
                                <button className="btn-sm success" onClick={() => onSendToTenant && onSendToTenant(app)}>
                                  Send to Tenant
                                </button>
                                <button className="btn-sm secondary" onClick={() => onEditLease && onEditLease(app)}>
                                  Edit Lease
                                </button>
                                <button className="btn-sm outline" onClick={() => onDownloadLease && onDownloadLease(app)}>
                                  Download Lease
                                </button>
                              </>
                            )}
                            {app.lease?.status === 'sent_to_tenant' && (
                              <div className="status-text">
                                📤 Sent to Tenant - Awaiting Signature
                              </div>
                            )}
                            {app.lease?.status === 'signed' && (
                              <button className="btn-sm success" onClick={() => onActivateLease && onActivateLease(app)}>
                                Activate Lease
                              </button>
                            )}
                            {app.lease?.status === 'active' && (
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

                        {/* Delete button - available if application can be deleted */}
                        {canDeleteApplication(app.status) && onDelete && (
                          <button 
                            className="btn-sm btn-error" 
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete the application from ${app.tenant_name || `Applicant #${app.id}`}? This action cannot be undone.`)) {
                                onDelete(app.id);
                              }
                            }}
                            title="Delete application"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3,6 5,6 21,6"/>
                              <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                              <line x1="10" y1="11" x2="10" y2="17"/>
                              <line x1="14" y1="11" x2="14" y2="17"/>
                            </svg>
                            Delete
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
          onSkipViewing={onSkipViewing}
          onDelete={onDelete}
          getPropertyName={getPropertyName}
          formatDate={formatDate}
          sortSettings={sortSettings}
          toggleSort={toggleSort}
          getSortIcon={getSortIcon}
          getSortLabel={getSortLabel}
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

        .header-actions {
          display: flex;
          gap: 14px;
          margin-right: 24px; /* space before the view toggle */
          margin-left: 20px;  /* space after title */
        }

        .view-toggle {
          display: flex;
          background: #f1f5f9;
          border-radius: 8px;
          padding: 2px;
          gap: 2px;
          border: 1px solid #e2e8f0;
        }

        .view-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border: none;
          background: transparent;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .view-btn:hover {
          background: rgba(255, 255, 255, 0.9);
          color: #374151;
        }

        .view-btn.active {
          background: #4f46e5;
          color: #ffffff;
          box-shadow: 0 2px 6px rgba(79, 70, 229, 0.25);
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
        .column-header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .column-title {
          font-size: 14px;
          font-weight: 700;
          color: #334155;
          letter-spacing: 0.025em;
        }
        .sort-toggle-btn {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 4px 8px;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.18s ease;
          display: flex;
          align-items: center;
          gap: 4px;
          min-width: 32px;
          height: 24px;
          justify-content: center;
        }
        .sort-toggle-btn:hover {
          background: rgba(255, 255, 255, 0.9);
          color: #374151;
          border-color: #cbd5e1;
          transform: translateY(-1px);
        }
        .sort-toggle-btn:active {
          transform: translateY(0);
        }
        .sort-toggle-btn.active {
          background: #4f46e5;
          color: #ffffff;
          box-shadow: 0 2px 6px rgba(79, 70, 229, 0.25);
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
        
        /* Card color variants based on status */
        .kanban-card.card-success {
          border-color: rgba(16, 185, 129, 0.4);
        }
        .kanban-card.card-success:hover {
          border-color: #059669;
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.2);
        }
        
        .kanban-card.card-success-light {
          border-color: rgba(16, 185, 129, 0.2);
        }
        .kanban-card.card-success-light:hover {
          border-color: #10b981;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.12);
        }
        
        .kanban-card.card-warning {
          border-color: rgba(245, 158, 11, 0.3);
        }
        .kanban-card.card-warning:hover {
          border-color: #f59e0b;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
        }
        
        .kanban-card.card-error {
          border-color: rgba(239, 68, 68, 0.3);
        }
        .kanban-card.card-error:hover {
          border-color: #ef4444;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
        }
        
        .kanban-card.card-info {
          border-color: rgba(139, 92, 246, 0.3);
        }
        .kanban-card.card-info:hover {
          border-color: #8b5cf6;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
        }
        
        .kanban-card.card-primary {
          border-color: rgba(59, 130, 246, 0.3);
        }
        .kanban-card.card-primary:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }
        
        .kanban-card.card-secondary {
          border-color: rgba(6, 182, 212, 0.3);
        }
        .kanban-card.card-secondary:hover {
          border-color: #06b6d4;
          box-shadow: 0 4px 12px rgba(6, 182, 212, 0.15);
        }
        
        .kanban-card.card-neutral {
          border-color: rgba(107, 114, 128, 0.3);
        }
        .kanban-card.card-neutral:hover {
          border-color: #6b7280;
          box-shadow: 0 4px 12px rgba(107, 114, 128, 0.15);
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

        .list-header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .list-header-text {
          flex: 1;
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
        .btn-sm.btn-error {
          background: #ef4444;
          color: white;
        }
        .btn-sm.btn-error:hover {
          background: #dc2626;
          transform: translateY(-1px);
        }
        .btn-sm.outline {
          background: #f8fafc;
          color: #4f46e5;
          border: 1px solid #e2e8f0;
        }
        
        .btn-sm.outline:hover {
          background: #e2e8f0;
        }
      `}</style>
    </div>
  );
} 