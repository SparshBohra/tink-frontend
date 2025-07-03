import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { apiClient } from '../../../lib/api';
import { Property, Room, Tenant, Lease } from '../../../lib/types';
import Navigation from '../../../components/Navigation';
import DashboardLayout from '../../../components/DashboardLayout';
import DataTable from '../../../components/DataTable';
import StatusBadge from '../../../components/StatusBadge';
import EmptyState from '../../../components/EmptyState';
import TenantAssignmentModal from '../../../components/TenantAssignmentModal';
import { formatCurrency } from '../../../lib/utils';

export default function PropertyRooms() {
  const router = useRouter();
  const { id } = router.query;
  const [property, setProperty] = useState<Property | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedRoomForAssignment, setSelectedRoomForAssignment] = useState<Room | null>(null);

  useEffect(() => {
    if (id) {
      fetchPropertyData();
    }
  }, [id]);

  const fetchPropertyData = async () => {
    try {
      setLoading(true);
      const propertyId = parseInt(id as string);

      // Fetch property details
      const propertyData = await apiClient.getProperty(propertyId);
      setProperty(propertyData);

      // Fetch rooms for this property
      const roomsData = await apiClient.getPropertyRooms(propertyId);
      setRooms(roomsData);

      // Fetch tenants and leases for reference
      const tenantsResponse = await apiClient.getTenants();
      setTenants(tenantsResponse.results || []);
      
      const leasesResponse = await apiClient.getLeases();
      setLeases(leasesResponse.results || []);

    } catch (err: any) {
      setError(err.message || 'Failed to fetch property data');
    } finally {
      setLoading(false);
    }
  };

  const getTenantName = (tenantId: number) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? tenant.full_name : `Tenant ${tenantId}`;
  };

  const getRoomOccupancy = (roomId: number) => {
    const activeLease = leases.find(lease => 
      lease.room === roomId && (lease.is_active || lease.status === 'active')
    );
    return activeLease;
  };

  const getOccupancyStats = () => {
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(room => getRoomOccupancy(room.id)).length;
    const vacantRooms = totalRooms - occupiedRooms;
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms * 100).toFixed(1) : '0';
    
    return { totalRooms, occupiedRooms, vacantRooms, occupancyRate };
  };

  const getTotalRevenue = () => {
    return rooms.reduce((total, room) => {
      const lease = getRoomOccupancy(room.id);
      return total + (lease ? lease.monthly_rent : 0);
    }, 0);
  };

  const handleAssignTenant = (room: Room) => {
    setSelectedRoomForAssignment(room);
    setAssignmentModalOpen(true);
  };

  const handleAssignmentModalClose = () => {
    setAssignmentModalOpen(false);
    setSelectedRoomForAssignment(null);
  };

  const handleAssignmentModalSave = async () => {
    await fetchPropertyData(); // Refresh the room data
    setAssignmentModalOpen(false);
    setSelectedRoomForAssignment(null);
  };

  if (loading) {
    return (
      <DashboardLayout title="">
        <div className="dashboard-container">
          {/* Custom Header */}
          <div className="dashboard-header">
            <div className="header-content">
              <div className="header-left">
                <h1 className="dashboard-title">Property Rooms</h1>
                <div className="subtitle-container">
                  <p className="welcome-message">
                    Loading property details...
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
            <p>Fetching property and room information...</p>
          </div>
          </div>
        
        <style jsx>{`
          .loading-indicator {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 48px 24px;
            text-align: center;
          }
          
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #e2e8f0;
            border-top-color: #6366f1;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          }
          
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </DashboardLayout>
    );
  }

  if (error || !property) {
    return (
      <DashboardLayout title="">
        <div className="dashboard-container">
          {/* Custom Header */}
          <div className="dashboard-header">
            <div className="header-content">
              <div className="header-left">
                <h1 className="dashboard-title">Property Not Found</h1>
                <div className="subtitle-container">
                  <p className="welcome-message">
                    Unable to load property details
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="alert alert-error">
            <strong>Error:</strong> {error || 'Property not found'}
          </div>
          <div className="actions-container">
            <Link href="/properties" className="btn btn-secondary">
              Back to Properties
            </Link>
          </div>
          </div>
        </DashboardLayout>
    );
  }

  const stats = getOccupancyStats();
  const totalRevenue = getTotalRevenue();

  const roomsTableData = rooms.map(room => {
    const lease = getRoomOccupancy(room.id);
    const isOccupied = !!lease;
    
    return {
      id: room.id,
      room: (
        <div>
          <strong>{room.name}</strong>
          {room.floor && (
            <>
              <br />
              <small style={{ color: 'var(--gray-600)' }}>Floor {room.floor}</small>
            </>
          )}
        </div>
      ),
      status: (
        <StatusBadge 
          status={isOccupied ? 'active' : 'pending'} 
          text={isOccupied ? 'Occupied' : 'Vacant'}
        />
      ),
      tenant: lease ? (
        <div>
          <Link href={{ pathname: '/tenants/[id]', query: { id: lease.tenant } }}>
            <strong style={{ color: 'var(--primary-blue)', cursor: 'pointer' }}>
              {getTenantName(lease.tenant)}
            </strong>
          </Link>
          <br />
          <small style={{ color: 'var(--gray-600)' }}>
            Lease: {lease.start_date} to {lease.end_date}
          </small>
        </div>
      ) : (
        <em style={{ color: 'var(--gray-600)' }}>Available for rent</em>
      ),
      rent: room.monthly_rent ? (
        <div>
          <strong>{formatCurrency(Number(room.monthly_rent))}</strong>
          {lease && lease.monthly_rent !== Number(room.monthly_rent) && (
            <>
              <br />
              <small style={{ color: 'var(--gray-600)' }}>
                Lease: {formatCurrency(lease.monthly_rent)}
              </small>
            </>
          )}
        </div>
      ) : lease ? (
        <strong>{formatCurrency(lease.monthly_rent)}</strong>
      ) : (
        <span style={{ color: 'var(--gray-600)' }}>Not set</span>
      ),
      type: room.room_type || 'Standard',
      actions: (
        <button onClick={() => router.push(`/properties/${property.id}/edit-room/${room.id}`)} className="manage-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          Manage
        </button>
      )
    };
  });

  const roomsTableColumns = [
    { key: 'room', header: 'Room' },
    { key: 'status', header: 'Status' },
    { key: 'tenant', header: 'Current Tenant' },
    { key: 'rent', header: 'Monthly Rent' },
    { key: 'type', header: 'Room Type' },
    { key: 'actions', header: 'Actions' }
  ];

  const renderRoomRow = (rowData: any, index: number) => (
    <tr key={rowData.id}>
      <td>{rowData.room}</td>
      <td style={{ textAlign: 'center' }}>{rowData.status}</td>
      <td>{rowData.tenant}</td>
      <td style={{ textAlign: 'center' }}>{rowData.rent}</td>
      <td style={{ textAlign: 'center' }}>{rowData.type}</td>
      <td style={{ textAlign: 'center' }}>{rowData.actions}</td>
    </tr>
  );

  return (
    <>
      <Head>
        <title>{property.name} - Rooms - Tink Property Management</title>
      </Head>
      
      <DashboardLayout title="">
        <div className="dashboard-container">
          {/* Custom Header */}
          <div className="dashboard-header">
            <div className="header-content">
              <div className="header-left">
                <h1 className="dashboard-title">{property.name}</h1>
                <div className="subtitle-container">
                  <p className="welcome-message">
                    {property.full_address}
                  </p>
                </div>
              </div>
              <div className="header-right">
          <button 
            onClick={() => router.back()}
                  className="back-btn"
          >
                  ← Back
          </button>
              </div>
            </div>
        </div>

          {error && <div className="alert alert-error">{error}</div>}

          {/* Main Content Layout */}
          <div className="main-content-grid">
            <div className="left-column">
              {/* Metrics Cards */}
        <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-header">
                    <div className="metric-info">
                      <h3 className="metric-title">Total Rooms</h3>
                      <div className="metric-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                          <polyline points="9,22 9,12 15,12 15,22"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="metric-content">
                    <div className="metric-value">{stats.totalRooms}</div>
                    <div className="metric-subtitle">Rooms in property</div>
                    <div className="metric-progress">
                      <span className="metric-label">Total units</span>
                      <span className="metric-change positive">+{stats.totalRooms > 0 ? '1' : '0'}</span>
                    </div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <div className="metric-info">
                      <h3 className="metric-title">Current Occupancy</h3>
                      <div className="metric-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="metric-content">
                    <div className="metric-value">{stats.occupiedRooms}</div>
                    <div className="metric-subtitle">{stats.occupancyRate}% occupied</div>
                    <div className="metric-progress">
                      <span className="metric-label">Occupancy rate</span>
                      <span className="metric-change positive">+2</span>
                    </div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <div className="metric-info">
                      <h3 className="metric-title">Monthly Revenue</h3>
                      <div className="metric-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="1" x2="12" y2="23"/>
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="metric-content">
                    <div className="metric-value">{formatCurrency(totalRevenue)}</div>
                    <div className="metric-subtitle">From all rooms</div>
                    <div className="metric-progress">
                      <span className="metric-label">Monthly income</span>
                      <span className="metric-change positive">+1</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rooms List */}
              <div className="rooms-section">
                <div className="section-header">
                  <div>
                    <h2 className="section-title">Room Details ({rooms.length})</h2>
                    <p className="section-subtitle">Overview of all rooms in this property</p>
                  </div>
                  <div className="section-actions">
                    <button 
                      onClick={() => fetchPropertyData()}
                      className="refresh-btn"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23 4 23 10 17 10"/>
                        <polyline points="1 20 1 14 7 14"/>
                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                      </svg>
                      Refresh
                    </button>
                  </div>
                </div>
                {rooms.length > 0 ? (
                  <div className="rooms-scroll-container">
                    <div className="rooms-table-container">
                      <table className="rooms-table">
                        <thead>
                          <tr>
                            <th className="table-left">Room</th>
                            <th className="table-center">Status</th>
                            <th className="table-left">Current Tenant</th>
                            <th className="table-center">Monthly Rent</th>
                            <th className="table-center">Room Type</th>
                            <th className="table-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {roomsTableData.map((rowData, index) => (
                            <tr key={rowData.id}>
                              <td className="table-left">{rowData.room}</td>
                              <td className="table-center">{rowData.status}</td>
                              <td className="table-left">{rowData.tenant}</td>
                              <td className="table-center">{rowData.rent}</td>
                              <td className="table-center">{rowData.type}</td>
                              <td className="table-center">{rowData.actions}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9,22 9,12 15,12 15,22"/>
                      </svg>
                    </div>
                    <h3>No Rooms Found</h3>
                    <p>No rooms have been added to this property yet.</p>
                    <Link href={`/properties/${id}/add-room`} className="empty-action-btn">
                      Add New Room
                    </Link>
                  </div>
                )}
              </div>
        </div>

            <div className="right-column">
        {/* Property Information */}
              <div className="property-info-section">
                <div className="section-header">
                  <div>
                    <h2 className="section-title">Property Information</h2>
                    <p className="section-subtitle">Basic property details and overview</p>
                  </div>
                </div>
          <div className="property-info-grid">
            <div className="info-item">
              <strong>Address:</strong><br />
              {property.full_address}
            </div>
            <div className="info-item">
              <strong>Property Type:</strong><br />
              {property.property_type || 'Not specified'}
            </div>
            <div className="info-item">
              <strong>Landlord:</strong><br />
              {property.landlord_name || 'Not specified'}
            </div>
          </div>
              </div>

        {/* Quick Actions */}
              <div className="quick-actions-section">
                <div className="section-header">
                  <div>
                    <h2 className="section-title">Quick Actions</h2>
                    <p className="section-subtitle">Common property management tasks</p>
                  </div>
                </div>
                
          <div className="actions-grid">
                  <div className="action-card blue" onClick={() => window.location.href = `/properties/${id}/add-room`}>
                    <div className="action-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
          </div>
                    <div className="action-content">
                      <h3 className="action-title">Add New Room</h3>
                      <p className="action-subtitle">Create a new room in this property</p>
                    </div>
                  </div>

                  <div className="action-card green" onClick={() => window.location.href = `/applications?property=${id}`}>
                    <div className="action-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                    </div>
                    <div className="action-content">
                      <h3 className="action-title">Review Applications</h3>
                      <p className="action-subtitle">Check pending applications</p>
                    </div>
                  </div>

                  <div className="action-card purple" onClick={() => window.location.href = '/inventory'}>
                    <div className="action-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                        <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                        <line x1="12" y1="22.08" x2="12" y2="12"/>
                      </svg>
                    </div>
                    <div className="action-content">
                      <h3 className="action-title">Manage Inventory</h3>
                      <p className="action-subtitle">Track property items</p>
                    </div>
                  </div>

                  <div className="action-card blue" onClick={() => window.location.href = '/leases'}>
                    <div className="action-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                    </div>
                    <div className="action-content">
                      <h3 className="action-title">View Leases</h3>
                      <p className="action-subtitle">Manage lease agreements</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>

      {/* Tenant Assignment Modal */}
      {selectedRoomForAssignment && (
        <TenantAssignmentModal
          room={selectedRoomForAssignment}
          isOpen={assignmentModalOpen}
          onClose={handleAssignmentModalClose}
          onSave={handleAssignmentModalSave}
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
          flex-shrink: 0;
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

        .back-btn {
          background: #6366f1;
          color: white;
          border: none;
          padding: 10px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .back-btn:hover {
          background: #4f46e5;
          transform: translateY(-1px);
        }

        /* Main Layout Grid */
        .main-content-grid {
          display: grid;
          grid-template-columns: 2.5fr 1fr;
          gap: 24px;
          align-items: flex-start;
        }

        .left-column, .right-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Metrics Grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
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

        /* Section Styling */
        .property-info-section,
        .rooms-section,
        .quick-actions-section {
          background: white;
          border-radius: 6px;
          padding: 18px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          height: fit-content;
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
        
        /* Property Info Grid */
        .property-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }
        
        .info-item {
          padding: 14px;
          background: #f8fafc;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
        }

        .info-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .info-item strong {
          color: #1e293b;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        /* Refresh Button */
        .refresh-btn {
          background: #f8fafc;
          color: #64748b;
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

        /* Table Styling */
        .rooms-scroll-container {
          overflow-y: auto;
          max-height: 600px;
        }

        .rooms-scroll-container::-webkit-scrollbar {
          width: 6px;
        }

        .rooms-scroll-container::-webkit-scrollbar-track {
          background: rgba(226, 232, 240, 0.3);
          border-radius: 3px;
        }

        .rooms-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }

        .rooms-table-container {
          width: 100%;
          overflow-x: auto;
          border-radius: 8px;
          background: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .rooms-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }

        .rooms-table th {
          position: sticky;
          top: 0;
          background: #f8fafc;
          z-index: 2;
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
          padding: 12px 10px;
          border-bottom: 2px solid #e2e8f0;
        }

        .rooms-table td {
          font-size: 14px;
          padding: 16px 10px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .rooms-table tr:last-child td {
          border-bottom: none;
        }

        .table-left {
          text-align: left !important;
        }

        .table-center {
          text-align: center !important;
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

        .empty-action-btn {
          background: #6366f1;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: all 0.2s ease;
        }

        .empty-action-btn:hover {
          background: #4f46e5;
          transform: translateY(-1px);
        }

        /* Actions Grid */
        .actions-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .action-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 5px;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .action-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .action-card.blue {
          background: #eff6ff;
          border-color: #dbeafe;
        }

        .action-card.green {
          background: #f0fdf4;
          border-color: #dcfce7;
        }

        .action-card.purple {
          background: #faf5ff;
          border-color: #e9d5ff;
        }

        .action-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .action-card.blue .action-icon {
          background: #3b82f6;
          color: white;
        }

        .action-card.green .action-icon {
          background: #10b981;
          color: white;
        }

        .action-card.purple .action-icon {
          background: #8b5cf6;
          color: white;
        }

        .action-content {
          flex: 1;
        }

        .action-title {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 3px 0;
        }

        .action-subtitle {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        /* Button Styling */
        .btn {
          padding: 12px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          text-decoration: none;
          border: none;
        }

        .btn-primary {
          background: #6366f1;
          color: white;
        }

        .btn-primary:hover {
          background: #4f46e5;
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: #f8fafc;
          color: #1e293b;
          border: 1px solid #e2e8f0;
        }

        .btn-secondary:hover {
          background: #f1f5f9;
          transform: translateY(-1px);
        }

        .btn-success {
          background: #10b981;
          color: white;
        }

        .btn-success:hover {
          background: #059669;
          transform: translateY(-1px);
        }

        .btn-info {
          background: #3b82f6;
          color: white;
        }

        .btn-info:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .btn-warning {
          background: #f59e0b;
          color: white;
        }

        .btn-warning:hover {
          background: #d97706;
          transform: translateY(-1px);
        }
        
        .btn-sm {
          padding: 8px 12px;
          font-size: 12px;
        }

        .actions-container {
          margin-bottom: 20px;
        }

        /* Alert Styling */
        .alert {
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          font-size: 14px;
        }
        
        .alert-error {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
        }

        /* Loading Indicator */
        .loading-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          text-align: center;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .main-content-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }

        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

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
          
          .property-info-section,
          .rooms-section,
          .quick-actions-section {
            padding: 16px;
          }

          .rooms-table-container {
            overflow-x: scroll;
          }

          .rooms-table th,
          .rooms-table td {
            padding: 12px 8px;
            font-size: 12px;
          }

          .section-actions {
            flex-direction: column;
            gap: 8px;
          }

          .property-info-grid {
            grid-template-columns: 1fr;
            gap: 12px;
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

          .section-header {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }
        }

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
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;
          text-decoration: none;
          margin: 0 auto;
        }

        .manage-btn:hover {
          background: #3730a3;
          transform: translateY(-1px);
        }

        .manage-btn svg {
          stroke: white;
        }

        /* Dark Mode Styles */
        :global(.dark-mode) .dashboard-container {
          background: #0a0a0a !important;
        }

        :global(.dark-mode) .dashboard-title,
        :global(.dark-mode) .welcome-message,
        :global(.dark-mode) .section-title {
          color: #ffffff !important;
        }

        :global(.dark-mode) .section-subtitle {
          color: #94a3b8 !important;
        }

        :global(.dark-mode) .metric-card,
        :global(.dark-mode) .property-info-section,
        :global(.dark-mode) .rooms-section,
        :global(.dark-mode) .quick-actions-section {
          background: #1a1a1a !important;
          border: 1px solid #333333 !important;
        }

        :global(.dark-mode) .metric-title,
        :global(.dark-mode) .metric-icon {
          color: #94a3b8 !important;
        }

        :global(.dark-mode) .metric-value {
          color: #ffffff !important;
        }

        :global(.dark-mode) .metric-subtitle,
        :global(.dark-mode) .metric-label {
          color: #94a3b8 !important;
        }

        :global(.dark-mode) .info-item {
          background: #111111 !important;
          border: 1px solid #333333 !important;
        }

        :global(.dark-mode) .info-item strong {
          color: #ffffff !important;
        }

        :global(.dark-mode) .action-card.blue {
          background: rgba(59, 130, 246, 0.1) !important;
          border-color: rgba(59, 130, 246, 0.3) !important;
        }

        :global(.dark-mode) .action-card.green {
          background: rgba(16, 185, 129, 0.1) !important;
          border-color: rgba(16, 185, 129, 0.3) !important;
        }

        :global(.dark-mode) .action-card.purple {
          background: rgba(139, 92, 246, 0.1) !important;
          border-color: rgba(139, 92, 246, 0.3) !important;
        }

        :global(.dark-mode) .action-title {
          color: #ffffff !important;
        }

        :global(.dark-mode) .action-subtitle {
          color: #94a3b8 !important;
        }

        :global(.dark-mode) .refresh-btn {
          background: #1a1a1a !important;
          color: #e2e8f0 !important;
          border: 1px solid #333333 !important;
        }

        :global(.dark-mode) .refresh-btn:hover {
          background: #222222 !important;
        }

        :global(.dark-mode) .rooms-table-container {
          background: #1a1a1a !important;
        }

        :global(.dark-mode) .rooms-table th {
          background: #111111 !important;
          color: #ffffff !important;
          border-bottom: 2px solid #333333 !important;
        }

        :global(.dark-mode) .rooms-table td {
          color: #e2e8f0 !important;
          border-bottom: 1px solid #333333 !important;
        }

        :global(.dark-mode) .empty-state h3 {
          color: #ffffff !important;
        }

        :global(.dark-mode) .empty-state {
          color: #94a3b8 !important;
        }

        :global(.dark-mode) .empty-icon {
          color: #4b5563 !important;
        }

        :global(.dark-mode) .btn-secondary {
          background: #1a1a1a !important;
          color: #e2e8f0 !important;
          border: 1px solid #333333 !important;
        }

        :global(.dark-mode) .btn-secondary:hover {
          background: #222222 !important;
        }

        :global(.dark-mode) .alert-error {
          background: rgba(239, 68, 68, 0.1) !important;
          border: 1px solid rgba(239, 68, 68, 0.3) !important;
          color: #ef4444 !important;
        }

        :global(.dark-mode) .loading-indicator {
          color: #e2e8f0 !important;
        }

      `}</style>
    </>
  );
} 