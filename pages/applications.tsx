import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navigation from '../components/Navigation';
import DashboardLayout from '../components/DashboardLayout';
import SectionCard from '../components/SectionCard';
import DataTable from '../components/DataTable';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
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
      <>
        <Navigation />
        <DashboardLayout
          title="Applications Review"
          subtitle="Loading applications data..."
        >
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
            <p>Fetching application data...</p>
      </div>
        </DashboardLayout>
        
        <style jsx>{`
          .loading-indicator {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-xl);
  }
          
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid var(--gray-200);
            border-top-color: var(--primary-blue);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: var(--spacing-md);
          }
          
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </>
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
    <>
      <Head>
        <title>Applications Review - Tink Property Management</title>
      </Head>
      <Navigation />
      
      <DashboardLayout
        title="Applications Review"
        subtitle="Review and decide on rental applications. Approved tenants must be assigned to rooms and moved in."
      >
        {error && <div className="alert alert-error">{error}</div>}
        
        {/* Metrics */}
        <div className="metrics-grid">
          <MetricCard 
            title="Total Applications" 
            value={metrics.total}
            color="blue"
          />
          
          <MetricCard 
            title="Pending Review" 
            value={metrics.pending}
            subtitle="Waiting for decision"
            color={metrics.pending > 0 ? "amber" : "gray"}
          />
          
          <MetricCard 
            title="Approved" 
            value={metrics.approved}
            color="green"
          />
          
          <MetricCard 
            title="Rejected" 
            value={metrics.rejected}
            color="gray"
          />
        </div>
        
        {/* Filters & Actions */}
        <SectionCard>
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
            
            <div className="actions-group">
              <button 
                onClick={fetchData}
                className="btn btn-secondary"
              >
                Refresh Data
              </button>
              
          <button
                onClick={downloadApplicationsReport}
                className="btn btn-secondary"
              >
                Download Report
          </button>
            </div>
      </div>
        </SectionCard>
        
        {/* Pending Applications */}
        <SectionCard
          title={`Pending Applications (${pendingApplications.length})`}
          subtitle="These applications are waiting for your decision. Quick decisions help fill vacant rooms faster."
        >
          {pendingApplications.length === 0 ? (
            <EmptyState
              title="No pending applications"
              description="All caught up! There are no applications waiting for review."
            />
          ) : (
            <DataTable
              columns={[
                { key: 'tenant', header: 'Applicant', width: '20%' },
                { key: 'property', header: 'Property', width: '20%' },
                { key: 'details', header: 'Details', width: '30%' },
                { key: 'status', header: 'Status', width: '10%' },
                { key: 'actions', header: 'Actions', width: '20%' }
              ]}
              data={pendingApplications}
              renderRow={(app) => (
                <tr key={app.id}>
                  <td>
                    <div className="applicant-name">{app.tenant_name}</div>
                    <div className="applicant-email">{app.tenant_email}</div>
                  </td>
                  
                  <td>
                    <div className="property-name">{getPropertyName(app.property_ref)}</div>
                    <div className="property-vacancy">
                      {getPropertyDetails(app.property_ref).vacantRooms} vacant rooms
        </div>
                  </td>
                  
                  <td>
                    <div className="app-details">
                      <div>Applied: {app.created_at.split('T')[0]}</div>
                      <div>Budget: ${app.rent_budget || 'Not specified'}/mo</div>
                      <div>Move-in: {app.desired_move_in_date || 'Flexible'}</div>
                    </div>
                  </td>
                  
                  <td>
                    <StatusBadge status={app.status} />
                    {app.days_pending > 5 && (
                      <div className="pending-days">
                        {app.days_pending} days
                        </div>
                    )}
                  </td>
                  
                  <td>
                    <div className="action-buttons">
                        <button 
                        onClick={() => handleQuickApprove(app.id, app.property_ref)}
                        className="btn btn-success"
                        disabled={getPropertyDetails(app.property_ref).vacantRooms === 0}
                            >
                        Quick Approve
                            </button>
                      
                    <button 
                        onClick={() => handleReject(app.id)}
                        className="btn btn-error"
                    >
                        Reject
                    </button>
                      </div>
                  </td>
                </tr>
              )}
            />
          )}
        </SectionCard>
        
        {/* Previously Reviewed Applications */}
        <SectionCard
          title={`Processed Applications (${reviewedApplications.length})`}
          subtitle="Applications that have already been reviewed and processed"
        >
          {reviewedApplications.length === 0 ? (
            <EmptyState
              title="No processed applications"
              description="There are no previously reviewed applications in the system."
            />
          ) : (
            <DataTable
              columns={[
                { key: 'tenant', header: 'Applicant', width: '20%' },
                { key: 'property', header: 'Property', width: '20%' },
                { key: 'details', header: 'Details', width: '30%' },
                { key: 'status', header: 'Status', width: '15%' },
                { key: 'actions', header: 'Actions', width: '15%' }
              ]}
              data={reviewedApplications}
              renderRow={(app) => (
                <tr key={app.id}>
                  <td>
                    <div className="applicant-name">{app.tenant_name}</div>
                    <div className="applicant-email">{app.tenant_email}</div>
                  </td>
                  
                  <td>
                    <div className="property-name">{getPropertyName(app.property_ref)}</div>
                  </td>
                  
                  <td>
                    <div className="app-details">
                      <div>Applied: {app.created_at.split('T')[0]}</div>
                      <div>Decided: {app.decision_date?.split('T')[0] || 'N/A'}</div>
                      <div className="decision-notes">{app.decision_notes || 'No notes'}</div>
                    </div>
                  </td>
                  
                  <td>
                    <StatusBadge status={app.status} />
                </td>
                  
                  <td>
                    <Link href={`/tenants`} className="btn btn-secondary">
                      View Tenant
                    </Link>
                </td>
              </tr>
              )}
            />
          )}
        </SectionCard>
      </DashboardLayout>
      
      <style jsx>{`
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
        }
        
        .filters-container {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--spacing-md);
        }
        
        .filter-group {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }
        
        .filter-label {
          font-weight: 500;
          color: var(--gray-700);
        }
        
        .form-select {
          padding: var(--spacing-sm) var(--spacing-md);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-sm);
          min-width: 250px;
          font-size: var(--text-body);
        }
        
        .actions-group {
          display: flex;
          gap: var(--spacing-md);
        }
        
        .applicant-name {
          font-weight: 500;
          color: var(--gray-900);
        }
        
        .applicant-email,
        .property-vacancy {
          font-size: var(--text-small);
          color: var(--gray-600);
        }
        
        .app-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: var(--text-small);
        }
        
        .decision-notes {
          font-style: italic;
          color: var(--gray-600);
          margin-top: 4px;
        }
        
        .pending-days {
          font-size: var(--text-small);
          color: var(--warning-amber);
          font-weight: 500;
          margin-top: var(--spacing-xs);
        }
        
        .action-buttons {
          display: flex;
          gap: var(--spacing-xs);
          flex-direction: column;
        }
        
        @media (min-width: 768px) {
          .action-buttons {
            flex-direction: row;
          }
        }
      `}</style>
    </>
  );
} 

export default withAuth(Applications);