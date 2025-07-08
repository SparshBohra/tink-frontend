// A comment to force re-linting
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import DashboardLayout from '../components/DashboardLayout';
import { withAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';
import { Application, Property, Room } from '../lib/types';
import ApplicationKanban from '../components/ApplicationKanban';

interface ConflictResolution {
  applicationId: number;
  action: 'approve' | 'reject' | 'assign_room';
  roomId?: number;
  reason?: string;
}
import NewApplicationModal from '../components/NewApplicationModal';
import ConflictResolutionModal from '../components/ConflictResolutionModal';
import RoomAssignmentModal from '../components/RoomAssignmentModal';
import PropertyRoomManagement from '../components/PropertyRoomManagement';
import ApplicationDetailModal from '../components/ApplicationDetailModal';
import ImprovedLeaseGenerationModal from '../components/ImprovedLeaseGenerationModal';

function Applications() {
  const router = useRouter();
  const { property: propertyIdParam } = router.query;
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRoomAssignmentModalOpen, setIsRoomAssignmentModalOpen] = useState(false);
  const [selectedApplicationForAssignment, setSelectedApplicationForAssignment] = useState<Application | null>(null);
  const [isPropertyRoomManagementOpen, setIsPropertyRoomManagementOpen] = useState(false);
  const [selectedPropertyForManagement, setSelectedPropertyForManagement] = useState<Property | null>(null);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [conflictingApplications, setConflictingApplications] = useState<Application[]>([]);
  const [isApplicationDetailOpen, setIsApplicationDetailOpen] = useState(false);
  const [selectedApplicationForDetail, setSelectedApplicationForDetail] = useState<Application | null>(null);
  const [isLeaseGenerationOpen, setIsLeaseGenerationOpen] = useState(false);
  const [selectedApplicationForLease, setSelectedApplicationForLease] = useState<Application | null>(null);
  const [selectedRoomForLease, setSelectedRoomForLease] = useState<Room | null>(null);

  useEffect(() => {
    fetchData();
  }, []);
  
  useEffect(() => {
    // Apply property filter from URL if present
    if (propertyIdParam && !selectedProperty) {
      const propertyId = parseInt(propertyIdParam as string);
      if (!isNaN(propertyId)) {
        setSelectedProperty(propertyId);
      }
    }
  }, [propertyIdParam, selectedProperty]);
  
  useEffect(() => {
    // Filter applications whenever the filter or data changes
    if (selectedProperty) {
      setFilteredApplications(applications.filter(app => app.property_ref === selectedProperty));
    } else {
      setFilteredApplications(applications);
    }
  }, [applications, selectedProperty]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [applicationsResponse, propertiesResponse, roomsResponse] = await Promise.all([
        apiClient.getApplications(),
        apiClient.getProperties(),
        apiClient.getRooms()
      ]);

      const apps = applicationsResponse.results || [];
      setApplications(apps);
      setFilteredApplications(apps);
      setProperties(propertiesResponse.results || []);
      setRooms(roomsResponse.results || []);
    } catch (error: unknown) {
      console.error('Failed to fetch applications data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load applications data');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePropertyFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const propertyId = value ? parseInt(value) : null;
    setSelectedProperty(propertyId);
    
    // Update URL without full page reload
    if (propertyId) {
      router.push(`/applications?property=${propertyId}`, undefined, { shallow: true });
    } else {
      router.push('/applications', undefined, { shallow: true });
    }
  };

  const getPropertyName = (propertyId: number) => {
    const property = properties.find(p => p.id === propertyId);
    return property ? property.name : 'Unknown Property';
  };

  const getPropertyDetails = (propertyId: number) => {
    const property = properties.find(p => p.id === propertyId);
    const propertyRooms = rooms.filter(room => room.property_ref === propertyId);
    const vacantRooms = propertyRooms.filter(room => room.is_vacant);
    const occupiedRooms = propertyRooms.filter(room => !room.is_vacant);
    
    return {
      property,
      totalRooms: propertyRooms.length,
      vacantRooms: vacantRooms.length,
      occupiedRooms: occupiedRooms.length,
      vacantRoomsList: vacantRooms
    };
  };

  const handleQuickApprove = async (applicationId: number, propertyId: number) => {
    const propertyDetails = getPropertyDetails(propertyId);
    if (propertyDetails.vacantRooms > 0) {
      const application = applications.find(app => app.id === applicationId);
      if (!application) {
        alert('Application not found');
        return;
      }

      // Get the first available room
      const availableRoom = propertyDetails.vacantRoomsList[0];
      
      // Calculate lease dates
      const startDate = application.desired_move_in_date || new Date().toISOString().split('T')[0];
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1); // 1 year lease
      
      try {
        await apiClient.decideApplication(applicationId, {
          decision: 'approve',
          start_date: startDate,
          end_date: endDate.toISOString().split('T')[0],
          monthly_rent: parseFloat(String(application.rent_budget || '1000')),
          security_deposit: parseFloat(String(application.rent_budget || '1000')) * 2,
          decision_notes: `Quick approved and assigned to ${availableRoom.name}`
        });
        fetchData(); // Refresh data
        alert(`✅ Application approved!\n\nTenant: ${application.tenant_name}\nRoom: ${availableRoom.name}\nLease created successfully!`);
      } catch (error: unknown) {
        console.error('Approval error:', error);
        alert(`❌ Failed to approve application: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      alert('Cannot approve - no vacant rooms in this property');
    }
  };

  const handleReject = async (applicationId: number) => {
    try {
      await apiClient.decideApplication(applicationId, {
        decision: 'reject',
        decision_notes: 'Rejected via dashboard'
      });
      fetchData(); // Refresh data
      alert('Application rejected');
    } catch (error: unknown) {
      alert(`Failed to reject application: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { style: React.CSSProperties; text: string } } = {
      pending: { 
        style: { background: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, textTransform: 'capitalize', display: 'inline-block' },
        text: 'Pending' 
      },
      approved: { 
        style: { background: '#dcfce7', color: '#16a34a', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, textTransform: 'capitalize', display: 'inline-block' },
        text: 'Approved' 
      },
      rejected: { 
        style: { background: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, textTransform: 'capitalize', display: 'inline-block' },
        text: 'Rejected' 
      }
    };
    const badge = badges[status] || badges.pending;
    return <span style={badge.style}>{badge.text}</span>;
  };

  const handleRoomAssignment = (applicationId: number, roomId: number, roomInfo: unknown) => {
    // Implementation of handleRoomAssignment
    console.log('Room assignment:', applicationId, roomId, roomInfo);
    setIsRoomAssignmentModalOpen(false);
    setSelectedApplicationForAssignment(null);
    fetchData();
  };

  const openLeaseGenerationModal = (application: Application, room: Room) => {
    setSelectedApplicationForLease(application);
    setSelectedRoomForLease(room);
    setIsLeaseGenerationOpen(true);
  };

  const handleLeaseGenerated = (leaseData: { applicationId: number; tenantName: string; roomName: string; leaseStartDate: string; leaseEndDate: string }) => {
    // Update application status to lease_created
    setApplications(prevApps => 
      prevApps.map(app => 
        app.id === leaseData.applicationId 
          ? { ...app, status: 'lease_created' }
          : app
      )
    );
    
    // Show success message
    alert(`✅ Lease generated successfully!\n\nTenant: ${leaseData.tenantName}\nRoom: ${leaseData.roomName}\nLease Period: ${leaseData.leaseStartDate} to ${leaseData.leaseEndDate}`);
  };

  // Filter applications by status
  const pendingApplications = filteredApplications.filter(app => app.status === 'pending');
  const reviewedApplications = filteredApplications.filter(app => app.status !== 'pending');

  const downloadApplicationsReport = () => {
    const csvData = [
      ['Applicant Name', 'Email', 'Property', 'Status', 'Applied Date', 'Days Pending'],
      ...applications.map(app => [
        app.tenant_name || `Tenant ID: ${app.tenant}`,
        app.tenant_email || 'N/A',
        getPropertyName(app.property_ref),
          app.status.toUpperCase(),
        app.created_at.split('T')[0],
        (app.days_pending || 0).toString()
      ])
    ];
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date().toISOString().split('T')[0];
    a.download = `tink-applications-report-${today}.csv`;
    a.click();
  };

  const openRoomAssignmentModal = (application: Application) => {
    setSelectedApplicationForAssignment(application);
    setIsRoomAssignmentModalOpen(true);
  };

  const openPropertyRoomManagement = (property: Property) => {
    setSelectedPropertyForManagement(property);
    setIsPropertyRoomManagementOpen(true);
  };

  const openApplicationDetail = (application: Application) => {
    setSelectedApplicationForDetail(application);
    setIsApplicationDetailOpen(true);
  };

  const handleConflictResolution = (resolutions: ConflictResolution[]) => {
    // Implementation of handleConflictResolution
    console.log('Conflict resolutions:', resolutions);
    setIsConflictModalOpen(false);
    setConflictingApplications([]);
    fetchData();
  };

  const getApproveButtonTooltip = (propertyId: number) => {
    const propertyDetails = getPropertyDetails(propertyId);
    const propertyName = getPropertyName(propertyId);
    
    if (propertyDetails.vacantRooms === 0) {
      return `Cannot approve - no vacant rooms available in ${propertyName}. Click "Room Management" to add rooms or manage room availability.`;
    }
    return `Quick approve and automatically assign to available room in ${propertyName} (${propertyDetails.vacantRooms} vacant rooms available)`;
  };

  const getLeaseButtonTooltip = (app: Application) => {
    const availableRooms = rooms.filter(room => 
      room.property_ref === app.property_ref && room.is_vacant
    );
    
    if (availableRooms.length === 0) {
      return 'Cannot generate lease - no available rooms in this property';
    }
    return `Generate lease document for ${app.tenant_name} - ${availableRooms.length} room(s) available`;
  };

  const handleGenerateLease = (app: Application) => {
    const availableRooms = rooms.filter(room => room.property_ref === app.property_ref && room.is_vacant);
    if (availableRooms.length > 0) {
      openLeaseGenerationModal(app, availableRooms[0]);
    } else {
      alert('No available rooms for lease generation');
    }
  };

  const handleMessage = (app: Application) => {
    // Navigate to communication page with this applicant
    router.push(`/communication?applicant=${app.id}&tenant=${app.tenant_name}`);
  };

  const handleSetupViewing = (app: Application) => {
    alert(`Setting up viewing for ${app.tenant_name || `Applicant #${app.id}`} at ${getPropertyName(app.property_ref)}`);
  };

  const handleActivateLease = async (app: Application) => {
    try {
      // This would activate the lease and change status to 'active' or 'moved_in'
      // For now, we'll just simulate the activation
      await apiClient.decideApplication(app.id, {
        decision: 'approve', // This might need to be a different endpoint in real implementation
        decision_notes: 'Lease activated via dashboard'
      });
      fetchData(); // Refresh data
      alert(`✅ Lease activated for ${app.tenant_name || `Applicant #${app.id}`}!`);
    } catch (error: unknown) {
      console.error('Lease activation error:', error);
      alert(`❌ Failed to activate lease: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        title="Applications Review"
        subtitle="Loading applications data..."
      >
        <div className="loading-state">
          <div className="loading-spinner">Loading applications...</div>
        </div>
        
        <style jsx>{`
          .loading-state {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 400px;
          }
          
          .loading-spinner {
            font-size: 18px;
            color: var(--gray-600);
          }
        `}</style>
      </DashboardLayout>
    );
  }

  // Calculate metrics
  const metrics = {
    total: filteredApplications.length,
    pending: pendingApplications.length,
    approved: filteredApplications.filter(app => app.status === 'approved').length,
    rejected: filteredApplications.filter(app => app.status === 'rejected').length,
    active: filteredApplications.filter(app => ['moved_in', 'active'].includes(app.status)).length,
    conversionRate: filteredApplications.length > 0 ? 
      Math.round((filteredApplications.filter(app => ['approved', 'lease_created', 'moved_in', 'active'].includes(app.status)).length / filteredApplications.length) * 100) : 0,
    avgDaysPending: filteredApplications.length > 0 ?
      Math.round(filteredApplications.reduce((sum, app) => sum + (app.days_pending || 0), 0) / filteredApplications.length) : 0,
  };

  return (
    <DashboardLayout title="">
      <Head>
        <title>Applications Review - Tink Property Management</title>
      </Head>
      
      <div className="dashboard-container">
        {/* Custom Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="dashboard-title">Applications Review</h1>
              <div className="subtitle-container">
                <p className="welcome-message">
                  Review and decide on rental applications. Approved tenants must be assigned to rooms and moved in.
                </p>
              </div>
            </div>
            <div className="header-right">
              <button onClick={() => setIsModalOpen(true)} className="view-all-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                New Application
              </button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="error-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {error}
          </div>
        )}
        
        {/* Top Metrics Row */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-info">
                <h3 className="metric-title">Total Applications</h3>
                <div className="metric-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="metric-content">
              <div className="metric-value">{metrics.total}</div>
              <div className="metric-subtitle">Total received</div>
              <div className="metric-progress">
                <span className="metric-label">All time</span>
                <span className="metric-change positive">+{metrics.total > 0 ? '1' : '0'}</span>
              </div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-info">
                <h3 className="metric-title">Pending Review</h3>
                <div className="metric-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="metric-content">
              <div className="metric-value">{metrics.pending}</div>
              <div className="metric-subtitle">Awaiting decision</div>
              <div className="metric-progress">
                <span className="metric-label">Needs review</span>
                <span className="metric-change positive">+{metrics.pending > 0 ? '1' : '0'}</span>
              </div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-info">
                <h3 className="metric-title">Approved</h3>
                <div className="metric-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="metric-content">
              <div className="metric-value">{metrics.approved}</div>
              <div className="metric-subtitle">Successfully approved</div>
              <div className="metric-progress">
                <span className="metric-label">Approval rate</span>
                <span className="metric-change positive">+{metrics.approved > 0 ? '1' : '0'}</span>
              </div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-info">
                <h3 className="metric-title">Conversion Rate</h3>
                <div className="metric-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 17l6-6 4 4 8-8"/>
                    <path d="M21 7l-5 5v-4h-4"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="metric-content">
              <div className="metric-value">{metrics.conversionRate}%</div>
              <div className="metric-subtitle">Applications to tenants</div>
              <div className="metric-progress">
                <span className="metric-label">Success rate</span>
                <span className="metric-change positive">+{metrics.conversionRate > 50 ? '↗' : metrics.conversionRate > 25 ? '→' : '↘'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Kanban Board View */}
        <ApplicationKanban
          applications={filteredApplications}
          onReview={openApplicationDetail}
          onApprove={handleQuickApprove}
          onReject={handleReject}
          onAssignRoom={openRoomAssignmentModal}
          onGenerateLease={handleGenerateLease}
          onMessage={handleMessage}
          onSetupViewing={handleSetupViewing}
          onActivateLease={handleActivateLease}
          getPropertyName={getPropertyName}
          formatDate={formatDate}
        />

        {/* Main Content */}
        <div className="main-content">
          {/* Pending Applications Section */}
          <div className="pending-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Pending Applications ({pendingApplications.length})</h2>
                <p className="section-subtitle">These applications are waiting for your decision. Quick decisions help fill vacant rooms faster.</p>
              </div>
              <div className="section-actions">
                <button 
                  onClick={fetchData} 
                  className="refresh-btn"
                  title="Refresh applications data to get the latest information"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10"/>
                    <polyline points="1 20 1 14 7 14"/>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                  </svg>
                  Refresh
                </button>
                <button 
                  onClick={downloadApplicationsReport} 
                  className="view-all-btn"
                  title="Download a comprehensive report of all applications with analytics and insights"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <path d="M12 15V3"/>
                  </svg>
                  Download Report
                </button>
                <button 
                  onClick={() => router.push('/tenants')} 
                  className="view-all-btn"
                  title="View all tenants, their lease details, and rental history"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  View All Tenants
                </button>
                <button 
                  onClick={() => {
                    const property = properties.find(p => p.id === selectedProperty);
                    if (property) {
                      openPropertyRoomManagement(property);
                    } else if (properties.length > 0) {
                      openPropertyRoomManagement(properties[0]);
                    }
                  }} 
                  className="view-all-btn room-management-btn"
                  title="Manage room availability, pricing, and assignments across all properties"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9,22 9,12 15,12 15,22"/>
                  </svg>
                  Room Management
                </button>
              </div>
            </div>
            
            {/* Filter Dropdown */}
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px' }}>
              <label htmlFor="property-filter" style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>Filter:</label>
              <select
                id="property-filter"
                value={selectedProperty || ''}
                onChange={handlePropertyFilterChange}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 14 }}
              >
                <option value="">All Properties</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.name} ({getPropertyDetails(property.id).vacantRooms} vacant rooms)
                  </option>
                ))}
              </select>
            </div>

            {pendingApplications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <h3>No pending applications</h3>
                <p>All caught up! There are no applications waiting for review.</p>
              </div>
            ) : (
              <div className="applications-scroll-container">
                <div className="applications-table-container">
                  <table className="applications-table">
                    <thead>
                      <tr>
                        <th className="table-left">Applicant</th>
                        <th className="table-left">Property</th>
                        <th className="table-left">Details</th>
                        <th className="table-center">Status</th>
                        <th className="table-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingApplications.map((app) => (
                        <tr key={app.id}>
                          <td className="table-left">
                            <div 
                              className="applicant-name clickable-name" 
                              onClick={() => openApplicationDetail(app)}
                              title={`View ${app.tenant_name}'s application details`}
                            >
                              {app.tenant_name}
                            </div>
                            <div className="applicant-email">{app.tenant_email}</div>
                          </td>
                          <td className="table-left">
                            <div 
                              className="property-name clickable-property" 
                              onClick={() => router.push(`/properties/${app.property_ref}/rooms`)}
                              title={`View ${getPropertyName(app.property_ref)} property details and room management`}
                            >
                              {getPropertyName(app.property_ref)}
                            </div>
                            <div className="property-vacancy">
                              {getPropertyDetails(app.property_ref).vacantRooms} vacant rooms
                            </div>
                          </td>
                          <td className="table-left">
                            <div className="app-details">
                              <div><span className="detail-label">Applied:</span> <span className="date-highlight">{formatDate(app.created_at)}</span></div>
                              <div><span className="detail-label">Budget:</span> ${app.rent_budget || 'Not specified'}/mo</div>
                              <div><span className="detail-label">Move-in:</span> <span className="date-highlight">{formatDate(app.desired_move_in_date || null)}</span></div>
                            </div>
                          </td>
                          <td className="table-center">
                            {getStatusBadge(app.status)}
                            {(app.days_pending ?? 0) > 5 && (
                              <div className="pending-days">
                                {app.days_pending} days
                              </div>
                            )}
                          </td>
                          <td className="table-center">
                            <div className="action-buttons">
                              <button 
                                onClick={() => handleQuickApprove(app.id, app.property_ref)}
                                className="manage-btn approve-btn"
                                disabled={getPropertyDetails(app.property_ref).vacantRooms === 0}
                                title={getApproveButtonTooltip(app.property_ref)}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="20,6 9,17 4,12"/>
                                </svg>
                                Approve
                              </button>
                              <button 
                                onClick={() => handleReject(app.id)}
                                className="manage-btn reject-btn"
                                title={`Reject ${app.tenant_name}'s application. This action cannot be undone.`}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10"/>
                                  <line x1="15" y1="9" x2="9" y2="15"/>
                                  <line x1="9" y1="9" x2="15" y2="15"/>
                                </svg>
                                Reject
                              </button>
                              <button 
                                onClick={() => openApplicationDetail(app)}
                                className="manage-btn detail-btn"
                                title={`View detailed information about ${app.tenant_name}'s application including timeline, analysis, and documents`}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                  <polyline points="14,2 14,8 20,8"/>
                                  <line x1="16" y1="13" x2="8" y2="13"/>
                                  <line x1="16" y1="17" x2="8" y2="17"/>
                                </svg>
                                View Application
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Processed Applications Section */}
          <div className="processed-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Processed Applications ({reviewedApplications.length})</h2>
                <p className="section-subtitle">Applications that have already been reviewed and processed</p>
              </div>
            </div>

            {reviewedApplications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <h3>No processed applications</h3>
                <p>There are no previously reviewed applications in the system.</p>
              </div>
            ) : (
              <div className="applications-scroll-container">
                <div className="applications-table-container">
                  <table className="applications-table">
                    <thead>
                      <tr>
                        <th className="table-left">Applicant</th>
                        <th className="table-left">Property</th>
                        <th className="table-left">Details</th>
                        <th className="table-center">Status</th>
                        <th className="table-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviewedApplications.map((app) => (
                        <tr key={app.id}>
                          <td className="table-left">
                            <div 
                              className="applicant-name clickable-name" 
                              onClick={() => {
                                if (app.status === 'approved') {
                                  router.push(`/tenants/${app.tenant}`);
                                } else {
                                  openApplicationDetail(app);
                                }
                              }}
                              title={app.status === 'approved' ? `View ${app.tenant_name}'s tenant profile` : `View ${app.tenant_name}'s application details`}
                            >
                              {app.tenant_name}
                            </div>
                            <div className="applicant-email">{app.tenant_email}</div>
                          </td>
                          <td className="table-left">
                            <div 
                              className="property-name clickable-property" 
                              onClick={() => router.push(`/properties/${app.property_ref}/rooms`)}
                              title={`View ${getPropertyName(app.property_ref)} property details and room management`}
                            >
                              {getPropertyName(app.property_ref)}
                            </div>
                          </td>
                          <td className="table-left">
                            <div className="app-details">
                              <div><span className="detail-label">Applied:</span> <span className="date-highlight">{formatDate(app.created_at)}</span></div>
                              <div><span className="detail-label">Decided:</span> <span className="date-highlight">{formatDate(app.decision_date || null)}</span></div>
                              <div className="decision-notes">
                                <span className="detail-label">Notes:</span> {app.decision_notes || 'No notes'}
                              </div>
                            </div>
                          </td>
                          <td className="table-center">
                            {getStatusBadge(app.status)}
                          </td>
                          <td className="table-center">
                            <div className="action-buttons">
                              {app.status === 'approved' && (
                                <button 
                                  onClick={() => router.push(`/tenants/${app.tenant}`)} 
                                  className="manage-btn view-btn"
                                  title={`View ${app.tenant_name}'s tenant profile, lease details, and rental history`}
                                >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                  <circle cx="12" cy="12" r="3"/>
                                </svg>
                                  View Tenant
                              </button>
                              )}
                              <button 
                                onClick={() => openApplicationDetail(app)}
                                className="manage-btn detail-btn"
                                title={`View detailed information about ${app.tenant_name}'s application including timeline, analysis, and documents`}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                  <polyline points="14,2 14,8 20,8"/>
                                  <line x1="16" y1="13" x2="8" y2="13"/>
                                  <line x1="16" y1="17" x2="8" y2="17"/>
                                </svg>
                                View Application
                              </button>
                              {app.status === 'approved' && (
                                <button 
                                  onClick={() => handleGenerateLease(app)}
                                  className="manage-btn lease-btn"
                                  title={getLeaseButtonTooltip(app)}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14,2 14,8 20,8"/>
                                    <line x1="16" y1="13" x2="8" y2="13"/>
                                    <line x1="16" y1="17" x2="8" y2="17"/>
                                    <line x1="12" y1="18" x2="12" y2="22"/>
                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                  </svg>
                                  Generate Lease
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && <NewApplicationModal onClose={() => setIsModalOpen(false)} />}

      {isConflictModalOpen && (
        <ConflictResolutionModal
          conflictingApplications={conflictingApplications}
          availableRooms={rooms.filter(room => room.is_vacant)}
          properties={properties}
          onClose={() => setIsConflictModalOpen(false)}
          onResolveConflict={handleConflictResolution}
        />
      )}

      {isRoomAssignmentModalOpen && selectedApplicationForAssignment && (
        <RoomAssignmentModal
          application={selectedApplicationForAssignment}
          availableRooms={rooms.filter(room => room.is_vacant)}
          properties={properties}
          onClose={() => {
            setIsRoomAssignmentModalOpen(false);
            setSelectedApplicationForAssignment(null);
          }}
          onAssignRoom={handleRoomAssignment}
        />
      )}

      {isPropertyRoomManagementOpen && (
        <PropertyRoomManagement
          isOpen={isPropertyRoomManagementOpen}
          selectedProperty={selectedPropertyForManagement}
          applications={applications}
          onClose={() => {
            setIsPropertyRoomManagementOpen(false);
            setSelectedPropertyForManagement(null);
          }}
          onRoomUpdate={fetchData}
        />
      )}

      {isApplicationDetailOpen && selectedApplicationForDetail && (
        <ApplicationDetailModal
          isOpen={isApplicationDetailOpen}
          application={selectedApplicationForDetail}
          properties={properties}
          rooms={rooms}
          onClose={() => {
            setIsApplicationDetailOpen(false);
            setSelectedApplicationForDetail(null);
          }}
          onApprove={handleQuickApprove}
          onReject={handleReject}
          onAssignRoom={openRoomAssignmentModal}
        />
      )}

      {isLeaseGenerationOpen && selectedApplicationForLease && selectedRoomForLease && (
        <ImprovedLeaseGenerationModal
          isOpen={isLeaseGenerationOpen}
          application={selectedApplicationForLease}
          room={selectedRoomForLease}
          properties={properties}
          onClose={() => {
            setIsLeaseGenerationOpen(false);
            setSelectedApplicationForLease(null);
            setSelectedRoomForLease(null);
          }}
          onLeaseGenerated={handleLeaseGenerated}
        />
      )}

      <style jsx>{`
        .dashboard-container {
          width: 100%;
          padding: 16px 20px 20px 20px;
          background: #f8fafc;
          min-height: calc(100vh - 72px);
          box-sizing: border-box;
        }

        /* Custom Header */
        .dashboard-header {
          margin-bottom: 24px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }

        .header-left {
          flex: 1;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dashboard-title {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
          line-height: 1.15;
        }

        .subtitle-container {
          min-height: 22px;
        }

        .welcome-message {
          font-size: 14px;
          color: #4b5563;
          margin: 0;
          line-height: 1.45;
        }

        /* Error Banner */
        .error-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
        }

        /* Metrics Grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }

        .metric-card {
          background: white;
          border-radius: 6px;
          padding: 14px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .metric-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .metric-title {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          margin: 0;
        }

        .metric-icon {
          width: 20px;
          height: 20px;
          color: #64748b;
        }

        .metric-content {
          margin-top: 8px;
        }

        .metric-value {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 3px;
          line-height: 1;
        }

        .metric-subtitle {
          font-size: 11px;
          color: #64748b;
          margin-bottom: 10px;
        }

        .metric-progress {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .metric-label {
          font-size: 12px;
          color: #64748b;
        }

        .metric-change {
          font-size: 12px;
          font-weight: 600;
        }

        .metric-change.positive {
          color: #10b981;
        }

        /* Main Content */
        .main-content {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }

        /* Section Styling */
        .pending-section,
        .processed-section {
          background: white;
          border-radius: 6px;
          padding: 18px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          margin-bottom: 20px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 3px 0;
        }

        .section-subtitle {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        .section-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        /* Button Styles */
        .new-application-btn {
          background-color: var(--primary-500, #8A2BE2);
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .new-application-btn:hover {
          background-color: var(--primary-600, #7A1DD1);
        }

        .refresh-btn {
          background-color: #fff;
          color: var(--gray-700, #4a5568);
          border: 1px solid #e2e8f0;
          padding: 10px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .refresh-btn:hover {
          background: #e2e8f0;
          transform: translateY(-1px);
        }

        /* Primary action button from manager-dashboard */
        .view-all-btn {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .view-all-btn:hover {
          background: #3730a3;
          transform: translateY(-1px);
        }

        /* Table Styling - Manager Dashboard Standard */
        .applications-scroll-container {
          overflow-y: auto;
          max-height: 500px;
        }

        .applications-scroll-container::-webkit-scrollbar {
          width: 6px;
        }

        .applications-scroll-container::-webkit-scrollbar-track {
          background: rgba(226, 232, 240, 0.3);
          border-radius: 3px;
        }

        .applications-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }

        .applications-table-container {
          width: 100%;
          overflow-x: auto;
          border-radius: 8px;
          background: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .applications-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        /* Add hover effect for table rows */
        .applications-table tbody tr {
          transition: background-color 0.2s ease;
        }

        .applications-table tbody tr:hover {
          background-color: #f9fafb;
        }

        /* Table headers - Manager Dashboard Standard */
        .applications-table th {
          position: sticky;
          top: 0;
          background: #ffffff;
          z-index: 2;
          font-size: 12px;
          font-weight: 600;
          color: #9ca3af;
          padding: 12px 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #e5e7eb;
          text-align: left;
        }

        /* Table cells - Manager Dashboard Standard */
        .applications-table td {
          padding: 12px 16px;
          vertical-align: middle;
          height: 48px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
          color: #374151;
        }

        /* Center align specific columns */
        .applications-table th.table-center,
        .applications-table td.table-center {
          text-align: center !important;
        }

        .applications-table th.table-left,
        .applications-table td.table-left {
          text-align: left !important;
        }

        .applicant-name {
          color: #1e293b;
          margin-bottom: 4px;
        }

        .applicant-email {
          font-size: 14px;
          color: #6b7280;
        }

        .clickable-name {
          cursor: pointer;
          transition: color 0.2s ease;
          border-radius: 4px;
          padding: 2px 4px;
          margin: -2px -4px;
        }

        .clickable-name:hover {
          color: #3b82f6;
          background: #eff6ff;
        }

        .clickable-property {
          cursor: pointer;
          transition: color 0.2s ease;
          border-radius: 4px;
          padding: 2px 4px;
          margin: -2px -4px;
        }

        .clickable-property:hover {
          color: #059669;
          background: #ecfdf5;
        }

        .property-name {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .property-vacancy {
          font-size: 12px;
          color: #64748b;
        }

        .app-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
        }

        .app-details > div {
          color: #64748b;
        }

        .detail-label {
          font-weight: 600;
          color: #374151;
          margin-right: 4px;
        }

        .decision-notes {
          font-style: normal;
          color: #64748b;
          margin-top: 0;
          font-size: 12px;
        }

        .date-highlight {
          background-color: #f1f5f9;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
          color: #334155;
        }

        .pending-days {
          font-size: 12px;
          color: #d97706;
          font-weight: 500;
          margin-top: 4px;
        }

        .action-buttons {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          justify-content: center;
        }

        /* Status Badges - Manager Dashboard Standard */
        .status-badge {
        }

        .status-badge.status-pending {
        }

        .status-badge.status-approved {
        }

        .status-badge.status-rejected {
        }

        /* Manager Dashboard Button Standard */
        .manage-btn {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 5px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .manage-btn:hover {
          background: #3730a3;
          transform: translateY(-1px);
        }

        .manage-btn.approve-btn {
          background: #10b981;
        }

        .manage-btn.approve-btn:hover {
          background: #059669;
        }

        .manage-btn.approve-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .manage-btn.reject-btn {
          background: #ef4444;
        }

        .manage-btn.reject-btn:hover {
          background: #dc2626;
        }

        .manage-btn.view-btn {
          background: #4f46e5;
        }

        .manage-btn.view-btn:hover {
          background: #3730a3;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #64748b;
        }

        .empty-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 16px;
          color: #cbd5e1;
        }

        .empty-state h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        .empty-state p {
          font-size: 14px;
          margin: 0 0 20px 0;
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 24px 16px;
          }

          .header-content {
            flex-direction: column;
            gap: 16px;
          }
          
          .dashboard-title {
            font-size: 28px;
          }
          
          .welcome-message {
            font-size: 14px;
          }
          
          .metric-card {
            padding: 16px;
          }
          
          .metric-value {
            font-size: 24px;
          }
          
          .pending-section,
          .processed-section {
            padding: 16px;
          }

          .applications-table-container {
            overflow-x: scroll;
          }

          .applications-table th,
          .applications-table td {
            padding: 12px 8px;
            font-size: 12px;
          }

          .section-actions {
            flex-direction: column;
            gap: 8px;
          }
        }

        @media (max-width: 480px) {
          .dashboard-container {
            padding: 16px;
          }

          .dashboard-title {
            font-size: 24px;
          }

          .welcome-message {
            font-size: 13px;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .section-header {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }
        }

        /* Dark Mode Styles */
        :global(.dark-mode) .dashboard-container { background: transparent; }
        :global(.dark-mode) .metric-card, 
        :global(.dark-mode) .pending-section, 
        :global(.dark-mode) .processed-section {
          background: #111111 !important;
          border: 1px solid #333333 !important;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4) !important;
        }
        :global(.dark-mode) .metric-card:hover {
          background: #222222 !important;
          border-color: #ffffff !important;
        }
        :global(.dark-mode) .applications-table th {
          background-color: #1a1a1a !important;
          border-bottom: 1px solid #333333 !important;
        }
        :global(.dark-mode) .applications-table td {
          background-color: #111111 !important;
          border-bottom: 1px solid #333333 !important;
        }
        :global(.dark-mode) .applications-table tbody tr:hover {
          background-color: #222222 !important;
        }
        :global(.dark-mode) .refresh-btn {
            background: #1a1a1a !important;
            border: 1px solid #333333 !important;
        }
        :global(.dark-mode) .refresh-btn:hover {
            background: #2a2a2a !important;
            border-color: #ffffff !important;
        }
        :global(.dark-mode) .view-all-btn {
            background: #3b82f6 !important;
            border: none !important;
        }
        :global(.dark-mode) .view-all-btn:hover {
            background: #2563eb !important;
        }
        :global(.dark-mode) .status-badge.status-pending { 
          background: rgba(249, 115, 22, 0.3); 
          color: #ffffff !important;
        }
        :global(.dark-mode) .status-badge.status-approved { 
          background: rgba(34, 197, 94, 0.3); 
          color: #ffffff !important;
        }
        :global(.dark-mode) .status-badge.status-rejected { 
          background: rgba(239, 68, 68, 0.3); 
          color: #ffffff !important;
        }
        :global(.dark-mode) .manage-btn {
            color: #ffffff !important;
        }
        :global(.dark-mode) .error-banner {
          background: rgba(239, 68, 68, 0.1) !important;
          border-color: rgba(239, 68, 68, 0.3) !important;
          color: #ef4444 !important;
        }
        :global(.dark-mode) .date-highlight {
          background-color: #334155;
          color: #e2e8f0;
        }
        :global(.dark-mode) .detail-label {
          color: #d1d5db;
        }

        .property-room-btn {
          background: #059669 !important;
        }

        .property-room-btn:hover {
          background: #047857 !important;
        }

        .detail-btn {
          background: #8b5cf6 !important;
        }

        .detail-btn:hover {
          background: #7c3aed !important;
        }

        .lease-btn {
          background: #059669 !important;
        }

        .lease-btn:hover {
          background: #047857 !important;
        }
      `}</style>
    </DashboardLayout>
  );
}

export default withAuth(Applications, ['admin', 'owner', 'manager']);