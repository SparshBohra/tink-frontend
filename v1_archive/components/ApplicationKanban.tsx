import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import StatusProgressIndicator from './StatusProgressIndicator';
import { Application, Property, Room } from '../lib/types'; // Assuming Property is exported from types
import { apiClient } from '../lib/api';
import AssignToPropertyModal from './AssignToPropertyModal';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  Calendar, 
  ArrowUpDown, 
  SortAsc, 
  Users, 
  Eye, 
  UserCheck, 
  X, 
  Play, 
  FileCheck, 
  Home, 
  Edit, 
  Send, 
  Download, 
  Trash2,
  LogOut
} from 'lucide-react';

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
  onMoveOut?: (application: Application) => void; /* New prop for move-out functionality */
  onAssignToProperty?: (application: Application) => void; /* New prop for direct assignment to property */
  onBackToPending?: (applicationId: number) => void; /* New prop to revert to pending */
  getPropertyName: (propertyId: number) => string;
  formatDate: (date: string | null) => string;
  extraActions?: React.ReactNode;
  // Add setters and refresh function for fallback handlers
  setIsAssignModalOpen?: (isOpen: boolean) => void;
  setSelectedApplicationForAssignment?: (application: Application | null) => void;
  onRefresh?: () => void;
}

type Column = { keys: string[]; title: string };

const STATUS_COLUMNS: Column[] = [
  { keys: ['pending', 'rejected'], title: 'Pending' },
  { keys: ['approved', 'viewing_scheduled', 'viewing_completed', 'processing', 'room_assigned'], title: 'Shortlisted' },
  { keys: ['moved_in', 'active'], title: 'Active' },
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
  onMoveOut,
  onAssignToProperty: parentOnAssignToProperty, // Rename to avoid conflict
  onBackToPending: parentOnBackToPending, // Rename to avoid conflict
  getPropertyName,
  formatDate,
  extraActions,
  // Destructure new props
  setIsAssignModalOpen,
  setSelectedApplicationForAssignment,
  onRefresh,
}: ApplicationKanbanProps) {
  const [sortSettings, setSortSettings] = useState<Record<string, 'default' | 'date' | 'name'>>({});
  const [isLocalAssignModalOpen, setIsLocalAssignModalOpen] = useState(false);
  const [selectedAppForAssignment, setSelectedAppForAssignment] = useState<Application | null>(null);
  const [selectedPropertyForAssignment, setSelectedPropertyForAssignment] = useState<Property | null>(null);

  // Log received props for debugging
  console.log('🔵 ApplicationKanban received props:', {
    setIsAssignModalOpen: typeof setIsAssignModalOpen,
    setSelectedApplicationForAssignment: typeof setSelectedApplicationForAssignment,
    onRefresh: typeof onRefresh,
    parentOnAssignToProperty: typeof parentOnAssignToProperty,
    parentOnBackToPending: typeof parentOnBackToPending
  });

  // Fallback handler for when props aren't passed correctly by Next.js dev server
  const onAssignToProperty = async (application: Application) => {
    console.log('TEMP HANDLER: Assigning to property', application);
    if (parentOnAssignToProperty) {
      parentOnAssignToProperty(application);
    } else if (setSelectedApplicationForAssignment && setIsAssignModalOpen) {
      // Fallback logic to open the modal directly
      console.log('Opening modal via fallback handlers');
      setSelectedApplicationForAssignment(application);
      setIsAssignModalOpen(true);
    } else {
      // Use local modal as fallback
      console.log('Opening local assignment modal for', application.id);
      try {
        const propData = await apiClient.getProperty(application.property_ref);
        setSelectedPropertyForAssignment(propData);
        setSelectedAppForAssignment(application);
        setIsLocalAssignModalOpen(true);
      } catch (error) {
        console.error('Failed to fetch property details for modal:', error);
        alert('Could not load property details to open assignment modal.');
      }
    }
  };

  const handleLocalAssignSubmit = async (data: { rent: number; deposit: number; startDate: string; endDate: string }) => {
    if (!selectedAppForAssignment) return;
    try {
      await apiClient.updateApplication(selectedAppForAssignment.id, {
        status: 'moved_in',
        decision_notes: `Assigned to property. Rent: ${data.rent}, Deposit: ${data.deposit}, Term: ${data.startDate} to ${data.endDate}`
      } as any);
      
      setIsLocalAssignModalOpen(false);
      setSelectedAppForAssignment(null);
      setSelectedPropertyForAssignment(null); // Clear property data after assignment
      if (onRefresh) onRefresh();
      alert('Tenant assigned successfully!');
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const onBackToPending = async (applicationId: number) => {
    console.log('TEMP HANDLER: Moving back to pending', applicationId);
    if (parentOnBackToPending) {
      parentOnBackToPending(applicationId);
    } else {
      // Fallback logic with auto-refresh
      if (confirm('Are you sure you want to move this application back to Pending?')) {
        try {
          await apiClient.updateApplication(applicationId, { status: 'pending' } as any);
          if (onRefresh) {
            onRefresh(); // Refresh the data in the parent component automatically
          }
          // No alert - just refresh silently
        } catch (error: any) {
          alert(`Error: ${error.message}`);
        }
      }
    }
  };

  // Sorting function
  const sortApplications = (apps: Application[], sortType: 'default' | 'date' | 'name') => {
    if (sortType === 'default') {
      return apps; // Return original order
    }
    
    return [...apps].sort((a, b) => {
      if (sortType === 'date') {
        // Sort by applied date (newest first)
        return new Date(b.application_date).getTime() - new Date(a.application_date).getTime();
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
      case 'Pending':
        return 'New applications waiting for initial review and decision';
      case 'Shortlisted':
        return 'Approved applicants ready for viewing or direct assignment to property';
      case 'Active':
        return 'Tenants assigned to properties and actively renting';
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
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      marginBottom: '2rem',
      transition: 'all 0.2s ease'
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
    }}>
      {/* Modern Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '2rem'
      }}>
        <div>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#111827',
            margin: '0 0 0.25rem 0'
          }}>
            Application Journey Board
          </h2>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: 0,
            lineHeight: 1.5
          }}>
            Track each applicant's progress from initial review to becoming an active tenant. 
            Drag applications through stages or use action buttons to advance them in the rental process.
          </p>
        </div>
        {extraActions && (
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center'
          }}>
            {extraActions}
          </div>
        )}
      </div>
      
      {/* Modern Kanban Board */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        overflowX: 'auto'
      }}>
        {STATUS_COLUMNS.map((col) => (
          <div key={col.title} style={{
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            minHeight: '400px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#ffffff',
              borderRadius: '8px 8px 0 0',
              minHeight: '120px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#111827'
                }}>
                  {col.title} ({grouped[col.title]?.length || 0})
                </span>
                <button
                  onClick={() => toggleSort(col.title)}
                  title={getSortLabel(sortSettings[col.title] || 'default')}
                  style={{
                    padding: '0.25rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: '#6b7280',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                    e.currentTarget.style.color = '#374151';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#6b7280';
                  }}
                >
                  {getSortIcon(sortSettings[col.title] || 'default')}
                </button>
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                lineHeight: 1.4,
                flex: 1
              }}>
                {getStageDescription(col.title)}
              </div>
            </div>
            <div style={{
              padding: '1rem',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {(grouped[col.title] || []).length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem 1rem',
                  color: '#9ca3af',
                  fontSize: '0.875rem',
                  fontStyle: 'italic'
                }}>
                  No items
                </div>
              ) : (
                grouped[col.title].map((app) => (
                  <div key={app.id} style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    padding: '1rem',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.75rem'
                    }}>
                      <div 
                        onClick={() => onReview(app)}
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#111827',
                          cursor: 'pointer',
                          transition: 'color 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.color = '#2563eb'}
                        onMouseOut={(e) => e.currentTarget.style.color = '#111827'}
                      >
                        {app.tenant_name || `Applicant #${app.id}`}
                      </div>
                      <StatusBadge status={app.status} small />
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <Home style={{ width: '0.75rem', height: '0.75rem' }} />
                      {getPropertyName(app.property_ref)}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      marginBottom: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <Calendar style={{ width: '0.75rem', height: '0.75rem' }} />
                      Applied: {formatDate(app.application_date)}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: '#1e40af',
                      marginBottom: '1rem',
                      padding: '0.5rem',
                      backgroundColor: '#eff6ff',
                      borderRadius: '6px',
                      border: '1px solid #bfdbfe',
                      textAlign: 'center',
                      boxShadow: '0 1px 2px rgba(59, 130, 246, 0.1)'
                    }}>
                      {app.status === 'pending' && 'Awaiting Review'}
                      {app.status === 'rejected' && 'Application Rejected'}
                      {app.status === 'approved' && 'Shortlisted'}
                      {app.status === 'viewing_scheduled' && 'Viewing Scheduled'}
                      {app.status === 'viewing_completed' && 'Viewing Completed'}
                      {app.status === 'processing' && 'Ready for Assignment'}
                      {app.status === 'room_assigned' && 'Room Assigned'}
                      {app.status === 'moved_in' && 'Active Tenant'}
                      {app.status === 'active' && 'Active Tenant'}
                    </div>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      marginTop: 'auto'
                    }}>
                      {/* Pending actions */}
                      {app.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => onReview(app)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              padding: '0.375rem 0.75rem',
                              backgroundColor: '#2563eb',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                          >
                            <Eye style={{ width: '0.75rem', height: '0.75rem' }} />
                            Review
                          </button>
                          <button 
                            onClick={() => onQualify && onQualify(app.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              padding: '0.375rem 0.75rem',
                              backgroundColor: '#059669',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#047857'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                          >
                            <UserCheck style={{ width: '0.75rem', height: '0.75rem' }} />
                            Shortlist
                          </button>
                          <button 
                            onClick={() => onReject(app.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              padding: '0.375rem 0.75rem',
                              backgroundColor: '#dc2626',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                          >
                            <X style={{ width: '0.75rem', height: '0.75rem' }} />
                            Reject
                          </button>
                        </>
                      )}

                      {/* Rejected actions - can be accepted again */}
                      {app.status === 'rejected' && (
                        <>
                          <button 
                            onClick={() => onQualify && onQualify(app.id)}
                            title="Restore application to pending status for fresh review"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              padding: '0.375rem 0.75rem',
                              backgroundColor: '#059669',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#047857'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                          >
                            <CheckCircle style={{ width: '0.75rem', height: '0.75rem' }} />
                            Undo
                          </button>
                          <button 
                            onClick={() => onReview(app)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              padding: '0.375rem 0.75rem',
                              backgroundColor: '#2563eb',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                          >
                            <Eye style={{ width: '0.75rem', height: '0.75rem' }} />
                            Review Details
                          </button>
                        </>
                      )}

                      {/* Shortlisted actions - approved, viewing_scheduled, viewing_completed, processing, room_assigned */}
                      {app.status === 'approved' && (
                        <>
                          <button className="btn-sm primary" onClick={() => onSetupViewing && onSetupViewing(app)}>
                            Schedule Viewing
                          </button>
                          <button 
                            className="btn-sm success" 
                            onClick={() => onAssignToProperty(app)}
                            title="Assign tenant directly to property"
                          >
                            <Home style={{ width: '0.75rem', height: '0.75rem' }} />
                            Assign to Property
                          </button>
                          <button 
                            className="btn-sm secondary" 
                            onClick={() => onBackToPending(app.id)}
                            title="Revert application to pending status"
                          >
                            Back to Pending
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
                          <button 
                            className="btn-sm success" 
                            onClick={() => onAssignToProperty(app)}
                            title="Assign tenant directly to property"
                          >
                            <Home style={{ width: '0.75rem', height: '0.75rem' }} />
                            Assign to Property
                          </button>
                          <button 
                            className="btn-sm secondary" 
                            onClick={() => onBackToPending(app.id)}
                            title="Revert application to pending status"
                          >
                            Back to Pending
                          </button>
                        </>
                      )}

                      {/* Viewing Complete and other shortlisted statuses */}
                      {(app.status === 'viewing_completed' || app.status === 'processing' || app.status === 'room_assigned') && (
                        <>
                          <button 
                            className="btn-sm success" 
                            onClick={() => onAssignToProperty(app)}
                            title="Assign tenant directly to property"
                          >
                            <Home style={{ width: '0.75rem', height: '0.75rem' }} />
                            Assign to Property
                          </button>
                          <button 
                            className="btn-sm secondary" 
                            onClick={() => onBackToPending(app.id)}
                            title="Revert application to pending status"
                          >
                            Back to Pending
                          </button>
                          {app.status === 'room_assigned' && (
                            <button className="btn-sm secondary" onClick={() => onAssignRoom(app)}>
                              Change Room
                            </button>
                          )}
                        </>
                      )}

                      {/* Active Tenants actions */}
                      {(app.status === 'moved_in' || app.status === 'active') && (
                        <>
                        <button className="btn-sm primary" onClick={() => onReview(app)}>
                          View Details
                          </button>
                          {app.status === 'moved_in' && onMoveOut && (
                            <button className="btn-sm btn-error" onClick={() => onMoveOut(app)}>
                              <LogOut size={12} />
                              Move Out
                        </button>
                          )}
                        </>
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
          background: rgba(79, 70, 229, 0.1);
          border-color: #4f46e5;
          transform: scale(1.05);
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

      {/* Local Assignment Modal Fallback */}
      {selectedAppForAssignment && (
        <AssignToPropertyModal
          isOpen={isLocalAssignModalOpen}
          onClose={() => {
            setIsLocalAssignModalOpen(false);
            setSelectedAppForAssignment(null);
            setSelectedPropertyForAssignment(null);
          }}
          onSave={handleLocalAssignSubmit}
          application={selectedAppForAssignment}
          property={selectedPropertyForAssignment}
        />
      )}
    </div>
  );
} 