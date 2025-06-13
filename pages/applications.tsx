import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navigation from '../components/Navigation';
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
      <div>
        <Navigation />
        <h1>Loading Applications...</h1>
        <p>Fetching application data from the server...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navigation />
        <h1>Applications Error</h1>
        <div style={{ 
          color: 'red', 
          border: '1px solid red', 
          padding: '15px', 
          marginBottom: '20px',
          backgroundColor: '#ffebee'
        }}>
          <strong>Error:</strong> {error}
        </div>
        <button 
          onClick={fetchData}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <h1>📋 Applications Review</h1>
      <p>Review and decide on rental applications. Approved tenants must be assigned to rooms and moved in.</p>
      
      {/* Property Filter */}
      <div style={{marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px'}}>
        <label style={{fontWeight: 'bold'}}>Filter by Property:</label>
        <select 
          value={selectedProperty || ''}
          onChange={handlePropertyFilterChange}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            minWidth: '250px'
          }}
        >
          <option value="">All Properties</option>
          {properties.map(property => (
            <option key={property.id} value={property.id}>
              {property.name} ({getPropertyDetails(property.id).vacantRooms} vacant rooms)
            </option>
          ))}
        </select>
        
        {selectedProperty && (
          <button
            onClick={() => {
              setSelectedProperty(null);
              router.push('/applications', undefined, { shallow: true });
            }}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear Filter
          </button>
        )}
      </div>
      
      {selectedProperty && (
        <div style={{backgroundColor: '#e8f5e8', padding: '15px', borderRadius: '5px', marginBottom: '20px'}}>
          <strong>🔍 Filtered:</strong> Showing applications for <strong>{getPropertyName(selectedProperty)}</strong>
          {getPropertyDetails(selectedProperty).vacantRooms > 0 ? (
            <span> ({getPropertyDetails(selectedProperty).vacantRooms} vacant rooms available)</span>
          ) : (
            <span style={{color: '#dc3545'}}> (No vacant rooms available)</span>
          )}
        </div>
      )}
      
      {pendingApplications.length > 0 && (
        <div style={{backgroundColor: '#e8f5e8', padding: '15px', borderRadius: '5px', marginBottom: '20px'}}>
          <strong>💡 Quick Tip:</strong> Green rows mean you can approve and assign rooms immediately. Each approval adds revenue.
        </div>
      )}

      <section>
        <h2>⏰ Pending Applications ({pendingApplications.length})</h2>
        <p><em>These applications are waiting for your decision. Quick decisions help fill vacant rooms faster.</em></p>
        
        {pendingApplications.length > 0 ? (
          <table border={1} style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead>
              <tr style={{backgroundColor: '#f8f9fa'}}>
                <th style={{padding: '10px', textAlign: 'left'}}>Applicant</th>
                <th style={{padding: '10px', textAlign: 'left'}}>Property Applied</th>
                <th style={{padding: '10px', textAlign: 'center'}}>Vacant Rooms</th>
                <th style={{padding: '10px', textAlign: 'center'}}>Applied Date</th>
                <th style={{padding: '10px', textAlign: 'center'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingApplications.map(application => {
                const propertyDetails = getPropertyDetails(application.property_ref);
                const canQuickApprove = propertyDetails.vacantRooms > 0;
              
              return (
                <tr key={application.id} style={{backgroundColor: canQuickApprove ? '#e8f5e8' : '#fff3cd'}}>
                    <td style={{padding: '10px'}}>
                      <Link href={{ pathname: '/tenants/[id]', query: { id: application.tenant } }}>
                        <strong style={{ color: '#007bff', cursor: 'pointer' }}>
                          {application.tenant_name || `Tenant ID: ${application.tenant}`}
                        </strong>
                      </Link>
                      <br />
                      <small>{application.tenant_email || 'N/A'}</small>
                      <br />
                      <small>Budget: ${application.rent_budget || 'Not specified'}</small>
                      <br />
                      <small style={{color: '#666'}}>Days pending: {application.days_pending || 0}</small>
                      {application.message && (
                        <>
                    <br />
                          <small style={{color: '#888', fontStyle: 'italic'}}>"{application.message}"</small>
                        </>
                      )}
                  </td>
                    <td style={{padding: '10px'}}>
                      <strong>{propertyDetails.property?.name || 'Unknown Property'}</strong>
                    <br />
                      <small>{propertyDetails.property?.full_address || ''}</small>
                    <br />
                      <small style={{color: '#666'}}>
                        {propertyDetails.totalRooms} total rooms, {propertyDetails.occupiedRooms} occupied
                      </small>
                  </td>
                    <td style={{padding: '10px', textAlign: 'center'}}>
                    {canQuickApprove ? (
                        <div>
                          <span style={{color: 'green', fontWeight: 'bold'}}>
                            ✅ {propertyDetails.vacantRooms} available
                          </span>
                        <br />
                          <small style={{color: '#666'}}>
                            {propertyDetails.vacantRoomsList.slice(0, 2).map(room => room.name).join(', ')}
                            {propertyDetails.vacantRooms > 2 && ` +${propertyDetails.vacantRooms - 2} more`}
                        </small>
                        </div>
                      ) : (
                        <div>
                          <span style={{color: 'red', fontWeight: 'bold'}}>❌ None available</span>
                          <br />
                          <small style={{color: '#666'}}>
                            {propertyDetails.totalRooms === 0 ? 
                              'No rooms in property' : 
                              `All ${propertyDetails.totalRooms} rooms occupied`
                            }
                          </small>
                          <br />
                          <small style={{color: '#e74c3c'}}>
                            Consider other properties or wait for vacancy
                          </small>
                        </div>
                    )}
                  </td>
                    <td style={{padding: '10px', textAlign: 'center'}}>
                      {application.created_at.split('T')[0]}
                    </td>
                    <td style={{padding: '10px', textAlign: 'center'}}>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center'}}>
                    {canQuickApprove ? (
                      <>
                        <button 
                              onClick={() => handleQuickApprove(application.id, application.property_ref)}
                              style={{
                                backgroundColor: '#28a745', 
                                color: 'white',
                                border: 'none',
                                padding: '8px 12px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                borderRadius: '4px',
                                fontWeight: 'bold'
                              }}
                            >
                              ✅ Approve & Assign
                            </button>
                            <Link href={`/properties/${application.property_ref}/rooms`}>
                              <button style={{
                                backgroundColor: '#007bff', 
                                color: 'white',
                                border: 'none',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                borderRadius: '4px'
                              }}>
                                🏠 View Rooms
                        </button>
                            </Link>
                      </>
                    ) : (
                          <>
                            <Link href="/properties">
                              <button style={{
                                backgroundColor: '#f39c12', 
                                color: 'white',
                                border: 'none',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                borderRadius: '4px'
                              }}>
                                🔍 Find Alternative
                              </button>
                            </Link>
                            <small style={{color: '#e74c3c', fontWeight: 'bold', textAlign: 'center'}}>
                              ⚠️ No rooms available
                            </small>
                          </>
                        )}
                    <button 
                      onClick={() => handleReject(application.id)}
                          style={{
                            backgroundColor: '#dc3545', 
                            color: 'white',
                            border: 'none',
                            padding: '6px 10px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            borderRadius: '4px'
                          }}
                    >
                      ❌ Reject
                    </button>
                      </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        ) : (
          <p><em>🎉 No pending applications! All caught up.</em></p>
        )}
      </section>

      {reviewedApplications.length > 0 && (
        <section style={{marginTop: '30px'}}>
          <h2>📊 Reviewed Applications ({reviewedApplications.length})</h2>
          <table border={1} style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead>
              <tr style={{backgroundColor: '#f8f9fa'}}>
                <th style={{padding: '10px', textAlign: 'left'}}>Applicant</th>
                <th style={{padding: '10px', textAlign: 'left'}}>Property</th>
                <th style={{padding: '10px', textAlign: 'center'}}>Status</th>
                <th style={{padding: '10px', textAlign: 'center'}}>Date</th>
            </tr>
          </thead>
          <tbody>
            {reviewedApplications.map(application => (
              <tr key={application.id}>
                  <td style={{padding: '10px'}}>
                    <Link href={{ pathname: '/tenants/[id]', query: { id: application.tenant } }}>
                      {application.tenant_name || `Tenant ID: ${application.tenant}`}
                    </Link>
                  </td>
                  <td style={{padding: '10px'}}>
                    {getPropertyName(application.property_ref)}
                  </td>
                  <td style={{padding: '10px', textAlign: 'center'}}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '3px',
                      fontSize: '12px',
                      backgroundColor: application.status === 'approved' ? '#d4edda' : '#f8d7da',
                      color: application.status === 'approved' ? '#155724' : '#721c24'
                    }}>
                      {application.status.toUpperCase()}
                  </span>
                </td>
                  <td style={{padding: '10px', textAlign: 'center'}}>
                    {application.created_at.split('T')[0]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      )}

      <section style={{marginTop: '30px'}}>
        <h2>📊 Quick Actions</h2>
        <div style={{display: 'flex', gap: '10px', marginBottom: '10px'}}>
          <button 
            onClick={downloadApplicationsReport} 
            style={{
              backgroundColor: '#28a745', 
              color: 'white', 
              padding: '8px 12px', 
              border: 'none', 
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            📥 Download Applications Report
          </button>
          <button 
            onClick={fetchData}
            style={{
              backgroundColor: '#6c757d', 
              color: 'white', 
              padding: '8px 12px', 
              border: 'none', 
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            🔄 Refresh Data
          </button>
        </div>
        
        <div style={{marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px'}}>
          <h4>📈 Summary</h4>
          <p><strong>Total Applications:</strong> {applications.length}</p>
          <p><strong>Pending Review:</strong> {pendingApplications.length}</p>
          <p><strong>Approved:</strong> {applications.filter(app => app.status === 'approved').length}</p>
          <p><strong>Rejected:</strong> {applications.filter(app => app.status === 'rejected').length}</p>
        </div>
      </section>
    </div>
  );
} 

export default withAuth(Applications, ['admin', 'owner', 'manager']);