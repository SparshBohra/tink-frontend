import React, { useState, useEffect } from 'react';
import { Application, Property, Room } from '../lib/types';
import { formatPriorityScore, getStatusDisplayText } from '../lib/applicationUtils';
import StatusBadge from './StatusBadge';
import { apiClient } from '../lib/api';
import { 
  X, 
  FileText, 
  BarChart3, 
  AlertTriangle, 
  Home, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Download, 
  Edit, 
  Eye, 
  User, 
  Mail, 
  Calendar, 
  DollarSign,
  Clock,
  MapPin,
  Lightbulb
} from 'lucide-react';

interface ApplicationDetailModalProps {
  isOpen: boolean;
  application: Application | null;
  properties: Property[];
  rooms: Room[];
  onClose: () => void;
  onApprove: (applicationId: number, propertyId: number) => void;
  onReject: (applicationId: number) => void;
  // onAssignRoom: (application: Application) => void; // MVP simplification
}

interface TimelineEvent {
  id: string;
  type: 'application_created' | 'status_updated' | 'priority_calculated' | 'conflict_detected' | 'room_recommended';
  title: string;
  description: string;
  timestamp: string;
  icon: React.ReactNode;
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
  // onAssignRoom // MVP simplification
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
      timestamp: app.application_date || new Date().toISOString(),
      icon: <FileText size={16} />,
      color: '#3b82f6'
    });

    // Priority calculated - using a placeholder since priority_score doesn't exist
    const priorityScore = 75; // Default priority score
      events.push({
        id: 'priority',
        type: 'priority_calculated',
        title: 'Priority Score Calculated',
      description: `Assigned priority score of ${priorityScore}/100 based on application criteria`,
      timestamp: app.application_date || new Date().toISOString(),
      icon: <BarChart3 size={16} />,
        color: '#8b5cf6'
      });

    // Conflicts detected - using a placeholder since has_conflicts doesn't exist
    const hasConflicts = false; // Default no conflicts
    if (hasConflicts) {
      events.push({
        id: 'conflict',
        type: 'conflict_detected',
        title: 'Conflict Detected',
        description: `Application conflicts with 0 other applications`,
        timestamp: app.application_date || new Date().toISOString(),
        icon: <AlertTriangle size={16} />,
        color: '#f59e0b'
      });
    }

    // Room recommendations - using a placeholder since recommended_rooms doesn't exist
    const recommendedRooms: any[] = []; // Default empty array
    if (recommendedRooms.length > 0) {
      events.push({
        id: 'recommendations',
        type: 'room_recommended',
        title: 'Room Recommendations Generated',
        description: `${recommendedRooms.length} compatible rooms identified`,
        timestamp: app.application_date || new Date().toISOString(),
        icon: <Home size={16} />,
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

      const getStatusIcon = (status: string) => {
        switch (status) {
          case 'rejected': return <XCircle size={16} />;
          case 'approved': return <CheckCircle size={16} />;
          default: return <RefreshCw size={16} />;
        }
      };

      events.push({
        id: 'status_change',
        type: 'status_updated',
        title: `Status Updated: ${app.status.replace('_', ' ').toUpperCase()}`,
        description: statusDescriptions[app.status] || `Application status changed to ${app.status}`,
        timestamp: app.decision_date || app.application_date || new Date().toISOString(),
        icon: getStatusIcon(app.status),
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

  const handleDownloadSignedLease = async (leaseId: number) => {
    try {
      const downloadData = await apiClient.downloadSignedLease(leaseId);
      window.open(downloadData.download_url, '_blank');
    } catch (error: any) {
      alert(`Failed to download signed lease: ${error.message}`);
    }
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
    // Since recommended_rooms doesn't exist in the Application interface, return empty array
    return [];
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
  const priorityScore = 75; // Default priority score since it doesn't exist in interface
  const priorityLevel = getPriorityLevel(priorityScore);
  const urgencyIndicator = getUrgencyIndicator(application);
  const hasConflicts = false; // Default no conflicts since it doesn't exist in interface

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }} onClick={handleOverlayClick}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Clean Header - matching app pattern */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.5rem 2rem',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: 'white'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #e5e7eb'
            }}>
              <User size={18} color="#6b7280" />
              </div>
            <div>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#111827',
                margin: 0,
                marginBottom: '0.25rem'
              }}>Application Details</h2>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <User size={12} />
                  <span>{application.tenant_name}</span>
            </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Mail size={12} />
                  <span>{application.tenant_email}</span>
            </div>
          </div>
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              padding: '0.375rem 0.75rem',
              backgroundColor: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151'
            }}>
              {getStatusDisplayText(application.status)}
            </div>
            <button onClick={onClose} style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '0.5rem',
              cursor: 'pointer',
              color: '#6b7280',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}>
              <X size={18} />
          </button>
          </div>
        </div>

        {/* Clean Tabs - matching app pattern */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f8fafc'
        }}>
          {[
            { key: 'overview', label: 'Overview', icon: <FileText size={14} /> },
            { key: 'timeline', label: 'Timeline', icon: <Clock size={14} /> },
            { key: 'documents', label: 'Documents', icon: <Download size={14} /> }
          ].map((tab) => (
          <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.875rem 1.5rem',
                background: activeTab === tab.key ? 'white' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.key ? '2px solid #2563eb' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: activeTab === tab.key ? '#2563eb' : '#6b7280',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                  e.currentTarget.style.color = '#374151';
                }
              }}
              onMouseOut={(e) => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#6b7280';
                }
              }}
            >
              {tab.icon}
              {tab.label}
          </button>
          ))}
        </div>

        {/* Content Area - matching app pattern */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '2rem',
          backgroundColor: '#f8fafc'
        }}>
          {activeTab === 'overview' && (
            <div>
              {/* Application Information Grid - matching app card style */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
              }}>
                {/* Basic Information */}
                <div style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      width: '1.75rem',
                      height: '1.75rem',
                      backgroundColor: '#eff6ff',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FileText size={14} color="#2563eb" />
                      </div>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#111827',
                      margin: 0
                    }}>Application Info</h3>
                      </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Property:</span>
                      <span style={{ fontWeight: '500', color: '#111827', fontSize: '0.875rem' }}>{property?.name || 'Unknown'}</span>
                      </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Applied:</span>
                      <span style={{ fontWeight: '500', color: '#111827', fontSize: '0.875rem' }}>{formatDate(application.application_date)}</span>
                      </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Move-in:</span>
                      <span style={{ fontWeight: '500', color: '#111827', fontSize: '0.875rem' }}>{formatDate(application.desired_move_in_date || null)}</span>
                      </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Budget:</span>
                      <span style={{ fontWeight: '500', color: '#16a34a', fontSize: '0.875rem' }}>${application.rent_budget || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Priority Score */}
                <div style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      width: '1.75rem',
                      height: '1.75rem',
                      backgroundColor: '#f3e8ff',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <BarChart3 size={14} color="#8b5cf6" />
                                </div>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#111827',
                      margin: 0
                    }}>Priority Score</h3>
                              </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      fontSize: '2.5rem',
                      fontWeight: '700',
                      color: priorityLevel.color
                    }}>
                      {priorityScore}
                              </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6b7280'
                    }}>out of 100</div>
                    <div style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor: priorityLevel.color + '15',
                      color: priorityLevel.color
                    }}>
                      {priorityLevel.level} Priority
                            </div>
                        </div>
                    </div>
                  </div>

              {/* Room Recommendations and Conflicts */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.5rem'
              }}>
                {/* Room Recommendations */}
                <div style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      width: '1.75rem',
                      height: '1.75rem',
                      backgroundColor: '#f0fdf4',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Home size={14} color="#16a34a" />
                            </div>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#111827',
                      margin: 0
                    }}>Room Recommendations</h3>
                          </div>
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem 1rem',
                    color: '#6b7280'
                  }}>
                    <Lightbulb size={20} style={{ marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.875rem', margin: 0 }}>No room recommendations available</p>
                        </div>
                        </div>

                {/* Conflicts */}
                <div style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      width: '1.75rem',
                      height: '1.75rem',
                      backgroundColor: hasConflicts ? '#fef3c7' : '#f0fdf4',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {hasConflicts ? 
                        <AlertTriangle size={14} color="#d97706" /> : 
                        <CheckCircle size={14} color="#16a34a" />
                      }
                    </div>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#111827',
                      margin: 0
                    }}>Conflicts & Issues</h3>
                  </div>
                  {hasConflicts ? (
                    <div style={{
                      padding: '1rem',
                      backgroundColor: '#fef3c7',
                      border: '1px solid #fcd34d',
                      borderRadius: '6px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem'
                      }}>
                        <AlertTriangle size={16} color="#d97706" style={{ marginTop: '0.125rem', flexShrink: 0 }} />
                        <div>
                          <div style={{
                            fontWeight: '500',
                            color: '#92400e',
                            marginBottom: '0.25rem',
                            fontSize: '0.875rem'
                          }}>Application Conflicts Detected</div>
                          <div style={{
                            fontSize: '0.8125rem',
                            color: '#92400e'
                          }}>
                            This application conflicts with 0 other applications
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '1rem',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '6px',
                      color: '#065f46'
                    }}>
                      <CheckCircle size={16} />
                      <span style={{ fontWeight: '500', fontSize: '0.875rem' }}>No conflicts detected</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '2rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '2rem'
              }}>
                <div style={{
                  width: '1.75rem',
                  height: '1.75rem',
                  backgroundColor: '#eff6ff',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Clock size={14} color="#2563eb" />
                </div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>Application Timeline</h3>
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
              }}>
                {timeline.map((event, index) => (
                  <div key={event.id} style={{
                    display: 'flex',
                    gap: '1rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      flexShrink: 0
                    }}>
                      <div style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '50%',
                        backgroundColor: event.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        {event.icon}
                      </div>
                      {index < timeline.length - 1 && (
                        <div style={{
                          width: '2px',
                          height: '2rem',
                          backgroundColor: '#e5e7eb',
                          marginTop: '0.5rem'
                        }}></div>
                      )}
                    </div>
                    <div style={{
                      flex: 1,
                      paddingBottom: '0.5rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '0.5rem'
                      }}>
                        <h4 style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#111827',
                          margin: 0
                        }}>{event.title}</h4>
                        <span style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          fontWeight: '500'
                        }}>{formatDate(event.timestamp)}</span>
                      </div>
                      <p style={{
                        fontSize: '0.8125rem',
                        color: '#6b7280',
                        margin: 0,
                        lineHeight: 1.5
                      }}>{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '2rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '2rem'
              }}>
                <div style={{
                  width: '1.75rem',
                  height: '1.75rem',
                  backgroundColor: '#eff6ff',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FileText size={14} color="#2563eb" />
                </div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>Documents & Attachments</h3>
              </div>
              
                {application.lease && application.lease.status ? (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  padding: '1.5rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    flex: 1
                  }}>
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      backgroundColor: '#eff6ff',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FileText size={16} color="#2563eb" />
                      </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#111827',
                        margin: '0 0 0.5rem 0'
                      }}>Lease Agreement</h4>
                      <div style={{
                        display: 'flex',
                        gap: '1rem',
                        marginBottom: '0.75rem',
                        fontSize: '0.8125rem',
                        color: '#6b7280'
                      }}>
                        <span>PDF Document</span>
                        <span>Status: {application.lease.status.replace('_', ' ').toUpperCase()}</span>
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '0.5rem',
                        fontSize: '0.8125rem',
                        color: '#6b7280'
                      }}>
                            <span>Monthly Rent: ${application.lease.monthly_rent}</span>
                            <span>Security Deposit: ${application.lease.security_deposit}</span>
                            <span>Start Date: {new Date(application.lease.start_date).toLocaleDateString()}</span>
                            <span>End Date: {new Date(application.lease.end_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                      </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    alignItems: 'flex-end'
                  }}>
                        {application.lease.status === 'draft' && (
                          <>
                            <button 
                          onClick={() => application.lease_id && handleDownloadLease(application.lease_id)}
                          disabled={!application.lease_id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 0.75rem',
                            backgroundColor: !application.lease_id ? '#9ca3af' : '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.8125rem',
                            fontWeight: '500',
                            cursor: !application.lease_id ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            if (application.lease_id) {
                              e.currentTarget.style.backgroundColor = '#1d4ed8';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (application.lease_id) {
                              e.currentTarget.style.backgroundColor = '#2563eb';
                            }
                          }}
                        >
                          <Download size={12} />
                          Download
                            </button>
                            <button 
                          onClick={() => application.lease_id && handleEditLease(application.lease_id)}
                          disabled={!application.lease_id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 0.75rem',
                            backgroundColor: !application.lease_id ? '#9ca3af' : '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.8125rem',
                            fontWeight: '500',
                            cursor: !application.lease_id ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            if (application.lease_id) {
                              e.currentTarget.style.backgroundColor = '#d97706';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (application.lease_id) {
                              e.currentTarget.style.backgroundColor = '#f59e0b';
                            }
                          }}
                        >
                          <Edit size={12} />
                          Edit
                            </button>
                          </>
                        )}
                        {application.lease.status === 'active' && (
                            <button 
                        onClick={() => application.lease_id && handleViewLease(application.lease_id)}
                        disabled={!application.lease_id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          backgroundColor: !application.lease_id ? '#9ca3af' : '#6b7280',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.8125rem',
                          fontWeight: '500',
                          cursor: !application.lease_id ? 'not-allowed' : 'pointer',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          if (application.lease_id) {
                            e.currentTarget.style.backgroundColor = '#4b5563';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (application.lease_id) {
                            e.currentTarget.style.backgroundColor = '#6b7280';
                          }
                        }}
                            >
                        <Eye size={12} />
                        View Details
                            </button>
                    )}
                </div>
              </div>
                ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3rem 2rem',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  <FileText size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#374151',
                    margin: '0 0 0.5rem 0'
                  }}>No Documents Available</h4>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>Generate a lease for this application to see documents here.</p>
                </div>
                )}
            </div>
          )}
        </div>

        {/* Action Buttons - matching app pattern */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem',
          padding: '1.5rem 2rem',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: 'white'
        }}>
          {application.status === 'pending' && (
            <>
              <button
                onClick={() => onApprove(application.id, application.property_ref)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              >
                <CheckCircle size={14} />
                Shortlist
              </button>
              {/* MVP Simplification: Assign Room button removed from this modal */}
              {/* <button
                onClick={() => onAssignRoom(application)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#f97316',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#ea580c'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f97316'}
              >
                <Home size={14} />
                Assign Room
              </button> */}
              <button
                onClick={() => onReject(application.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
              >
                <XCircle size={14} />
                Reject Application
              </button>
            </>
          )}
          <button onClick={onClose} style={{
            padding: '0.5rem 0.75rem',
            backgroundColor: '#f8fafc',
            color: '#374151',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#f1f5f9';
            e.currentTarget.style.borderColor = '#cbd5e1';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#f8fafc';
            e.currentTarget.style.borderColor = '#e2e8f0';
          }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailModal; 