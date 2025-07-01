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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', alignItems: 'center' }}>
          {lease ? (
            <>
              <Link href={{ pathname: '/tenants/[id]', query: { id: lease.tenant } }}>
                <button className="btn btn-primary btn-sm">
                  View Tenant
                </button>
              </Link>
              <Link href={`/inventory?room=${room.id}`}>
                <button className="btn btn-secondary btn-sm">
                  Inventory
                </button>
              </Link>
            </>
          ) : (
            <>
              <button 
                className="btn btn-success btn-sm"
                onClick={() => handleAssignTenant(room)}
              >
                Assign Tenant
              </button>
              <Link href="/applications">
                <button className="btn btn-info btn-sm">
                  View Applications
                </button>
              </Link>
              <Link href={`/properties/${property.id}/edit-room/${room.id}`}>
                <button className="btn btn-warning btn-sm">
                  Edit Room
                </button>
              </Link>
            </>
          )}
        </div>
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

          {/* Metrics Cards */}
          <div className="metrics-row">
            <div className="metric-card">
              <div className="metric-content">
                <div className="metric-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9,22 9,12 15,12 15,22"/>
                  </svg>
                </div>
                <div className="metric-info">
                  <h3 className="metric-title">Total Rooms</h3>
                  <div className="metric-value">{stats.totalRooms}</div>
                  <p className="metric-subtitle">Rooms in property</p>
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-content">
                <div className="metric-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div className="metric-info">
                  <h3 className="metric-title">Current Occupancy</h3>
                  <div className="metric-value">{stats.occupiedRooms}</div>
                  <p className="metric-subtitle">{stats.occupancyRate}% occupied</p>
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-content">
                <div className="metric-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </div>
                <div className="metric-info">
                  <h3 className="metric-title">Monthly Revenue</h3>
                  <div className="metric-value">{formatCurrency(totalRevenue)}</div>
                  <p className="metric-subtitle">From all rooms</p>
                </div>
              </div>
            </div>
          </div>

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

          {/* Rooms List */}
          <div className="rooms-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Room Details ({rooms.length})</h2>
                <p className="section-subtitle">Overview of all rooms in this property</p>
              </div>
            </div>
            {rooms.length > 0 ? (
              <DataTable 
                columns={roomsTableColumns}
                data={roomsTableData}
                renderRow={renderRoomRow}
              />
            ) : (
              <EmptyState 
                title="No Rooms Found"
                description="No rooms have been added to this property yet."
                action={
                  <Link href={`/properties/${id}/add-room`} className="btn btn-primary">
                    Add New Room
                  </Link>
                }
              />
            )}
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
              <Link href={`/properties/${id}/add-room`} className="btn btn-primary">
                Add New Room
              </Link>
              <Link href={`/applications?property=${id}`} className="btn btn-secondary">
                Review Applications
              </Link>
              <Link href="/inventory" className="btn btn-secondary">
                Manage Inventory
              </Link>
              <Link href="/leases" className="btn btn-secondary">
                View Leases
              </Link>
              <Link href="/properties" className="btn btn-secondary">
                All Properties
              </Link>
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

        /* Section Styling */
        .property-info-section,
        .rooms-section,
        .quick-actions-section {
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
        
        /* Actions Grid */
        .actions-grid {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
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
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 16px;
          }

          .header-content {
            flex-direction: column;
            gap: 16px;
          }

          .metrics-row {
            grid-template-columns: 1fr;
            gap: 16px;
            margin-bottom: 20px;
          }

          .metric-card {
            padding: 16px;
          }

          .metric-content {
            gap: 12px;
          }

          .metric-icon {
            width: 36px;
            height: 36px;
          }

          .metric-icon svg {
            width: 18px;
            height: 18px;
          }

          .metric-value {
            font-size: 20px;
          }

          .property-info-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .actions-grid {
            flex-direction: column;
          }
        }

        /* Metrics Cards */
        .metrics-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .metric-card {
          background: white;
          border-radius: 8px;
          padding: 18px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .metric-content {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .metric-icon {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          background: #f3f4f6;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6366f1;
        }

        .metric-icon svg {
          width: 20px;
          height: 20px;
        }

        .metric-info {
          flex: 1;
          min-width: 0;
        }

        .metric-title {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          margin: 0 0 4px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .metric-value {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 4px 0;
          line-height: 1.1;
        }

        .metric-subtitle {
          font-size: 12px;
          color: #9ca3af;
          margin: 0;
          line-height: 1.3;
        }
      `}</style>
    </>
  );
} 