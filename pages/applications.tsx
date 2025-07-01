import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import DashboardLayout from '../components/DashboardLayout';
import Link from 'next/link';
import { withAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';
import { Application, Property, Room } from '../lib/types';

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
    } catch (error: any) {
      console.error('Failed to fetch applications data:', error);
      setError(error?.message || 'Failed to load applications data');
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

  const getVacantRoomsForProperty = (propertyId: number) => {
    return rooms.filter(room => room.property_ref === propertyId && room.is_vacant);
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
      } catch (error: any) {
        console.error('Approval error:', error);
        alert(`❌ Failed to approve application: ${error.message || 'Unknown error'}`);
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
    } catch (error: any) {
      alert(`Failed to reject application: ${error.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { className: 'status-pending', text: 'Pending' },
      approved: { className: 'status-approved', text: 'Approved' },
      rejected: { className: 'status-rejected', text: 'Rejected' }
    };
    const badge = badges[status as keyof typeof badges] || badges.pending;
    return <span className={`status-badge ${badge.className}`}>{badge.text}</span>;
  };

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
                <h3 className="metric-title">Rejected</h3>
                <div className="metric-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="metric-content">
              <div className="metric-value">{metrics.rejected}</div>
              <div className="metric-subtitle">Not approved</div>
              <div className="metric-progress">
                <span className="metric-label">Rejection rate</span>
                <span className="metric-change positive">+{metrics.rejected > 0 ? '1' : '0'}</span>
              </div>
            </div>
          </div>
        </div>

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
                <button onClick={fetchData} className="refresh-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10"/>
                    <polyline points="1 20 1 14 7 14"/>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                  </svg>
                  Refresh Data
                </button>
                <button onClick={downloadApplicationsReport} className="download-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download Report
                </button>
                <Link href="/tenants" className="view-tenants-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  View All Tenants
                </Link>
              </div>
            </div>
            
            <div className="filters-container">
              <div className="filter-group">
                <label htmlFor="property-filter" className="filter-label">Filter by Property:</label>
                <select 
                  id="property-filter"
                  value={selectedProperty || ''}
                  onChange={handlePropertyFilterChange}
                  className="form-select"
                >
                  <option value="">All Properties</option>
                  {properties.map(property => (
                    <option key={property.id} value={property.id}>
                      {property.name} ({getPropertyDetails(property.id).vacantRooms} vacant rooms)
                    </option>
                  ))}
                </select>
              </div>
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
                            <div className="applicant-name">{app.tenant_name}</div>
                            <div className="applicant-email">{app.tenant_email}</div>
                          </td>
                          <td className="table-left">
                            <div className="property-name">{getPropertyName(app.property_ref)}</div>
                            <div className="property-vacancy">
                              {getPropertyDetails(app.property_ref).vacantRooms} vacant rooms
                            </div>
                          </td>
                          <td className="table-left">
                            <div className="app-details">
                              <div>Applied: {app.created_at.split('T')[0]}</div>
                              <div>Budget: ${app.rent_budget || 'Not specified'}/mo</div>
                              <div>Move-in: {app.desired_move_in_date || 'Flexible'}</div>
                            </div>
                          </td>
                          <td className="table-center">
                            {getStatusBadge(app.status)}
                            {app.days_pending > 5 && (
                              <div className="pending-days">
                                {app.days_pending} days
                              </div>
                            )}
                          </td>
                          <td className="table-center">
                            <div className="action-buttons">
                              <button 
                                onClick={() => handleQuickApprove(app.id, app.property_ref)}
                                className="approve-btn"
                                disabled={getPropertyDetails(app.property_ref).vacantRooms === 0}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="20,6 9,17 4,12"/>
                                </svg>
                                Quick Approve
                              </button>
                              <button 
                                onClick={() => handleReject(app.id)}
                                className="reject-btn"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10"/>
                                  <line x1="15" y1="9" x2="9" y2="15"/>
                                  <line x1="9" y1="9" x2="15" y2="15"/>
                                </svg>
                                Reject
                              </button>
                              <Link href={`/tenants/${app.tenant}`} className="view-tenant-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                  <circle cx="12" cy="12" r="3"/>
                                </svg>
                                View Tenant
                              </Link>
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
                            <div className="applicant-name">{app.tenant_name}</div>
                            <div className="applicant-email">{app.tenant_email}</div>
                          </td>
                          <td className="table-left">
                            <div className="property-name">{getPropertyName(app.property_ref)}</div>
                          </td>
                          <td className="table-left">
                            <div className="app-details">
                              <div>Applied: {app.created_at.split('T')[0]}</div>
                              <div>Decided: {app.decision_date?.split('T')[0] || 'N/A'}</div>
                              <div className="decision-notes">{app.decision_notes || 'No notes'}</div>
                            </div>
                          </td>
                          <td className="table-center">
                            {getStatusBadge(app.status)}
                          </td>
                          <td className="table-center">
                            <Link href={`/tenants/${app.tenant}`} className="view-tenant-btn">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                              View Tenant
                            </Link>
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

        .dashboard-title {
          font-size: 22px;
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
          font-weight: 500;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .metric-change.positive {
          background: #dcfce7;
          color: #16a34a;
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
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          background: white;
        }

        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 2px 0;
        }

        .section-subtitle {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }

        .section-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* Button Styles */
        .refresh-btn,
        .download-btn,
        .view-tenants-btn,
        .approve-btn,
        .reject-btn,
        .view-tenant-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
          cursor: pointer;
          border: 1px solid transparent;
          text-decoration: none;
        }

        .refresh-btn {
          background: #f8fafc;
          color: #475569;
          border-color: #e2e8f0;
        }

        .refresh-btn:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .download-btn {
          background: #ecfdf5;
          color: #059669;
          border-color: #a7f3d0;
        }

        .download-btn:hover {
          background: #d1fae5;
        }

        .view-tenants-btn {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .view-tenants-btn:hover {
          background: #2563eb;
          border-color: #2563eb;
        }

        .approve-btn {
          background: #d1fae5;
          color: #059669;
          border-color: #a7f3d0;
          font-size: 12px;
          padding: 4px 8px;
        }

        .approve-btn:hover {
          background: #bbf7d0;
        }

        .approve-btn:disabled {
          background: #f3f4f6;
          color: #9ca3af;
          border-color: #e5e7eb;
          cursor: not-allowed;
        }

        .reject-btn {
          background: #fee2e2;
          color: #dc2626;
          border-color: #fca5a5;
          font-size: 12px;
          padding: 4px 8px;
        }

        .reject-btn:hover {
          background: #fecaca;
        }

        .view-tenant-btn {
          background: #dbeafe;
          color: #2563eb;
          border-color: #93c5fd;
          font-size: 12px;
          padding: 4px 8px;
        }

        .view-tenant-btn:hover {
          background: #bfdbfe;
        }

        /* Filters */
        .filters-container {
          padding: 20px;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .filter-label {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
        }

        .form-select {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
          min-width: 250px;
          background: white;
          transition: border-color 0.2s ease;
        }

        .form-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        /* Table Styling */
        .applications-scroll-container {
          overflow-x: auto;
        }

        .applications-table-container {
          min-width: 1000px;
        }

        .applications-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .applications-table th {
          background: #f8fafc;
          color: #475569;
          font-weight: 600;
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
          font-size: 12px;
        }

        .applications-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        .applications-table tbody tr:hover {
          background: #f8fafc;
        }

        .table-left {
          text-align: left;
        }

        .table-center {
          text-align: center;
        }

        .applicant-name {
          font-weight: 500;
          color: #1e293b;
          margin-bottom: 2px;
        }

        .applicant-email {
          font-size: 11px;
          color: #64748b;
        }

        .property-name {
          font-weight: 500;
          color: #1e293b;
          margin-bottom: 2px;
        }

        .property-vacancy {
          font-size: 11px;
          color: #64748b;
        }

        .app-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 11px;
          color: #64748b;
        }

        .decision-notes {
          font-style: italic;
          color: #64748b;
          margin-top: 4px;
          font-size: 11px;
        }

        .pending-days {
          font-size: 11px;
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

        /* Status Badges */
        .status-badge {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
        }

        .status-pending {
          background: #fef3c7;
          color: #d97706;
        }

        .status-approved {
          background: #d1fae5;
          color: #059669;
        }

        .status-rejected {
          background: #fee2e2;
          color: #dc2626;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 48px 24px;
        }

        .empty-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 16px;
          color: #cbd5e1;
        }

        .empty-state h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        .empty-state p {
          font-size: 13px;
          color: #64748b;
          margin: 0 0 20px 0;
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 12px 16px;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .section-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .action-buttons {
            flex-direction: column;
            gap: 4px;
          }

          .filter-group {
            flex-direction: column;
            align-items: stretch;
          }
        }

        @media (max-width: 480px) {
          .section-header {
            padding: 12px 16px;
          }

          .applications-table th,
          .applications-table td {
            padding: 8px 12px;
          }
        }
      `}</style>
    </DashboardLayout>
  );
} 

export default withAuth(Applications);