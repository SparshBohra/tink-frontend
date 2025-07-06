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
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showListingModal, setShowListingModal] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [listingLoading, setListingLoading] = useState(false);
  const [listingSuccess, setListingSuccess] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<{ id: number; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeHistoryTab, setActiveHistoryTab] = useState<'tenant' | 'rent'>('tenant');

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

  const handleCreateListing = () => {
    setShowListingModal(true);
  };

  const handleDeleteRoom = (roomId: number, roomName: string) => {
    setRoomToDelete({ id: roomId, name: roomName });
    setShowDeleteModal(true);
  };

  const confirmDeleteRoom = async () => {
    if (!roomToDelete) return;

    setDeleteLoading(true);
    setError(null);

    try {
      // Check if room is occupied before deleting
      const lease = getRoomOccupancy(roomToDelete.id);
      if (lease) {
        setError('Cannot delete an occupied room. Please end the lease first.');
        setShowDeleteModal(false);
        setRoomToDelete(null);
        setDeleteLoading(false);
        return;
      }

      // Call API to delete room
      await apiClient.deleteRoom(roomToDelete.id);
      
      // Refresh the room data
      await fetchPropertyData();
      
      // Close modal and reset state
      setShowDeleteModal(false);
      setRoomToDelete(null);
      setError(null);
      
    } catch (err: any) {
      console.error('Failed to delete room:', err);
      setError(err.message || 'Failed to delete room. Please try again.');
      setShowDeleteModal(false);
      setRoomToDelete(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDeleteRoom = () => {
    setShowDeleteModal(false);
    setRoomToDelete(null);
    setDeleteLoading(false);
  };

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const submitListing = async () => {
    if (selectedPlatforms.length === 0) {
      setError('Please select at least one platform.');
      return;
    }

    if (!property) {
      setError('Property information not available.');
      return;
    }

    setListingLoading(true);
    setError(null);

    try {
      // Simulate API call to create listings
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setListingSuccess(`Successfully created listings for "${property.name}" on ${selectedPlatforms.join(', ')}`);
      
      // Reset form
      setSelectedPlatforms([]);
      
      // Close modal after showing success
      setTimeout(() => {
        setShowListingModal(false);
        setListingSuccess(null);
      }, 3000);
      
    } catch (err: any) {
      setError('Failed to create listings. Please try again.');
    } finally {
      setListingLoading(false);
    }
  };

  const listingPlatforms = [
    { 
      id: 'zillow', 
      name: 'Zillow', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 12h3v8h6v-6h2v6h6v-8h3L12 2z" fill="#006AFF"/>
        </svg>
      )
    },
    { 
      id: 'apartments', 
      name: 'Apartments.com', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="16" rx="2" fill="#FF6B35"/>
          <rect x="6" y="7" width="3" height="3" fill="white"/>
          <rect x="10.5" y="7" width="3" height="3" fill="white"/>
          <rect x="15" y="7" width="3" height="3" fill="white"/>
          <rect x="6" y="11" width="3" height="3" fill="white"/>
          <rect x="10.5" y="11" width="3" height="3" fill="white"/>
          <rect x="15" y="11" width="3" height="3" fill="white"/>
          <rect x="8" y="15" width="8" height="3" fill="white"/>
        </svg>
      )
    },
    { 
      id: 'craigslist', 
      name: 'Craigslist', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="20" height="20" rx="2" fill="#00AB44"/>
          <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">CL</text>
        </svg>
      )
    },
    { 
      id: 'facebook', 
      name: 'Facebook Marketplace', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#1877F2"/>
          <path d="M15.5 8.5H13.5C13.2 8.5 13 8.7 13 9V11H15.5C15.6 11 15.7 11.1 15.7 11.2L15.4 13.2C15.4 13.3 15.3 13.4 15.2 13.4H13V19.5C13 19.8 12.8 20 12.5 20H10.5C10.2 20 10 19.8 10 19.5V13.4H8.5C8.2 13.4 8 13.2 8 12.9V10.9C8 10.6 8.2 10.4 8.5 10.4H10V8.5C10 6.6 11.6 5 13.5 5H15.5C15.8 5 16 5.2 16 5.5V7.5C16 7.8 15.8 8 15.5 8V8.5Z" fill="white"/>
        </svg>
      )
    },
    { 
      id: 'trulia', 
      name: 'Trulia', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#53B50A"/>
          <path d="M12 6L8 10v8h2v-6h4v6h2v-8l-4-4z" fill="white"/>
        </svg>
      )
    },
    { 
      id: 'rentals', 
      name: 'Rentals.com', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="20" height="20" rx="2" fill="#E31E24"/>
          <path d="M7 8h10v2H7V8zm0 3h10v2H7v-2zm0 3h7v2H7v-2z" fill="white"/>
          <circle cx="17" cy="15" r="1" fill="white"/>
        </svg>
      )
    }
  ];

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
      name: room.name,
      floor: room.floor,
      status: isOccupied ? 'occupied' : 'vacant',
      tenantName: lease ? getTenantName(lease.tenant) : null,
      tenantId: lease ? lease.tenant : null,
      leaseStart: lease ? lease.start_date : null,
      leaseEnd: lease ? lease.end_date : null,
      baseRent: room.monthly_rent,
      leaseRent: lease ? lease.monthly_rent : null,
      roomType: room.room_type || 'Standard',
      roomId: room.id
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
      <td className="table-left">
        <div 
          className="applicant-name clickable-room-name"
          onClick={() => router.push(`/properties/${property.id}/edit-room/${rowData.roomId}`)}
          style={{ cursor: 'pointer' }}
        >
          {rowData.name}
        </div>
        {rowData.floor && (
          <div className="applicant-email">Floor {rowData.floor}</div>
        )}
      </td>
      <td className="table-center">
        <span style={{
          background: rowData.status === 'occupied' ? '#dcfce7' : '#fef3c7',
          color: rowData.status === 'occupied' ? '#16a34a' : '#d97706',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 500,
          textTransform: 'capitalize',
          display: 'inline-block'
        }}>
          {rowData.status === 'occupied' ? 'Occupied' : 'Vacant'}
        </span>
      </td>
      <td className="table-left">
        {rowData.tenantName ? (
          <div>
            <div className="property-name">{rowData.tenantName}</div>
            <div className="property-vacancy">{rowData.leaseEnd ? `Lease ends: ${rowData.leaseEnd}` : ''}</div>
          </div>
        ) : (
          <div className="property-vacancy">Available for rent</div>
        )}
      </td>
      <td className="table-center">
        <div className="app-details">
          {rowData.baseRent ? (
            <>
              <div><span className="detail-label">Base:</span> {formatCurrency(Number(rowData.baseRent))}</div>
              {rowData.leaseRent && (
                <div className="property-vacancy">{formatCurrency(Number(rowData.leaseRent))}</div>
              )}
            </>
          ) : (
            <div className="property-vacancy">Not set</div>
          )}
        </div>
      </td>
      <td className="table-center">
        <span style={{
          background: '#f1f5f9',
          color: '#334155',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 500,
          textTransform: 'capitalize',
          display: 'inline-block'
        }}>
          {rowData.roomType}
        </span>
      </td>
      <td className="table-center">
        <div className="action-buttons">
          <button 
            onClick={() => router.push(`/properties/${property.id}/edit-room/${rowData.roomId}`)} 
            className="manage-btn view-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            Manage
          </button>
        </div>
      </td>
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
                  onClick={handleCreateListing}
                  className="create-listing-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7"/>
                    <path d="M16 2v4"/>
                    <path d="M8 2v4"/>
                    <path d="M3 10h18"/>
                    <path d="M15 19l2 2 4-4"/>
                  </svg>
                  Create Listing
                </button>
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
                              <td className="table-left">
                                <div 
                                  className="applicant-name clickable-room-name"
                                  onClick={() => router.push(`/properties/${property.id}/edit-room/${rowData.roomId}`)}
                                  style={{ cursor: 'pointer' }}
                                >
                                  {rowData.name}
                                </div>
                                {rowData.floor && (
                                  <div className="applicant-email">Floor {rowData.floor}</div>
                                )}
                              </td>
                              <td className="table-center">
                                <span style={{
                                  background: rowData.status === 'occupied' ? '#dcfce7' : '#fef3c7',
                                  color: rowData.status === 'occupied' ? '#16a34a' : '#d97706',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  textTransform: 'capitalize',
                                  display: 'inline-block'
                                }}>
                                  {rowData.status === 'occupied' ? 'Occupied' : 'Vacant'}
                                </span>
                              </td>
                              <td className="table-left">
                                {rowData.tenantName ? (
                                  <div>
                                    <div className="property-name">{rowData.tenantName}</div>
                                    <div className="property-vacancy">{rowData.leaseEnd ? `Lease ends: ${rowData.leaseEnd}` : ''}</div>
                                  </div>
                                ) : (
                                  <div className="property-vacancy">Available for rent</div>
                                )}
                              </td>
                              <td className="table-center">
                                <div className="app-details">
                                  {rowData.baseRent ? (
                                    <>
                                      <div><span className="detail-label">Base:</span> {formatCurrency(Number(rowData.baseRent))}</div>
                                      {rowData.leaseRent && (
                                        <div className="property-vacancy">{formatCurrency(Number(rowData.leaseRent))}</div>
                                      )}
                                    </>
                                  ) : (
                                    <div className="property-vacancy">Not set</div>
                                  )}
                                </div>
                              </td>
                              <td className="table-center">
                                <span style={{
                                  background: '#f1f5f9',
                                  color: '#334155',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  textTransform: 'capitalize',
                                  display: 'inline-block'
                                }}>
                                  {rowData.roomType}
                                </span>
                              </td>
                              <td className="table-center">
                                <div className="action-buttons">
                                  <button 
                                    onClick={() => router.push(`/properties/${property.id}/edit-room/${rowData.roomId}`)} 
                                    className="manage-btn view-btn"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M12 20h9"/>
                                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                                    </svg>
                                    Manage
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteRoom(rowData.roomId, rowData.name)} 
                                    className="icon-btn delete-icon-btn"
                                    title="Delete room"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="3,6 5,6 21,6"/>
                                      <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                                      <line x1="10" y1="11" x2="10" y2="17"/>
                                      <line x1="14" y1="11" x2="14" y2="17"/>
                                    </svg>
                                  </button>
                                </div>
                              </td>
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

              {/* Property History Section */}
              <div className="history-section">
                <div className="section-header">
                  <div>
                    <h2 className="section-title">Property History</h2>
                    <p className="section-subtitle">Tenant and rent collection history</p>
                  </div>
                  <div className="section-actions">
                    <select className="filter-select">
                      <option value="all">All History</option>
                      <option value="tenants">Tenant History</option>
                      <option value="rent">Rent History</option>
                    </select>
                  </div>
                </div>

                <div className="history-tabs">
                  <button 
                    className={`tab-btn ${activeHistoryTab === 'tenant' ? 'active' : ''}`}
                    onClick={() => setActiveHistoryTab('tenant')}
                  >
                    Tenant History
                  </button>
                  <button 
                    className={`tab-btn ${activeHistoryTab === 'rent' ? 'active' : ''}`}
                    onClick={() => setActiveHistoryTab('rent')}
                  >
                    Rent Collection
                  </button>
                </div>

                <div className="history-content">
                  {/* Tenant History */}
                  <div className="tenant-history" style={{ display: activeHistoryTab === 'tenant' ? 'block' : 'none' }}>
                    <div className="history-table-container">
                      <table className="history-table">
                        <thead>
                          <tr>
                            <th>Tenant</th>
                            <th>Room</th>
                            <th>Move In</th>
                            <th>Move Out</th>
                            <th>Duration</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>
                              <div className="tenant-info">
                                <div className="tenant-avatar">JS</div>
                                <div>
                                  <div className="tenant-name">John Smith</div>
                                  <div className="tenant-email">john.smith@email.com</div>
                                </div>
                              </div>
                            </td>
                            <td>Room 2A</td>
                            <td>Jan 15, 2024</td>
                            <td>-</td>
                            <td>11 months</td>
                            <td><span className="status-badge active">Current</span></td>
                          </tr>
                          <tr>
                            <td>
                              <div className="tenant-info">
                                <div className="tenant-avatar">MJ</div>
                                <div>
                                  <div className="tenant-name">Maria Johnson</div>
                                  <div className="tenant-email">maria.j@email.com</div>
                                </div>
                              </div>
                            </td>
                            <td>Room 1B</td>
                            <td>Sep 1, 2023</td>
                            <td>Dec 31, 2023</td>
                            <td>4 months</td>
                            <td><span className="status-badge completed">Moved Out</span></td>
                          </tr>
                          <tr>
                            <td>
                              <div className="tenant-info">
                                <div className="tenant-avatar">RW</div>
                                <div>
                                  <div className="tenant-name">Robert Wilson</div>
                                  <div className="tenant-email">r.wilson@email.com</div>
                                </div>
                              </div>
                            </td>
                            <td>Room 3C</td>
                            <td>Jun 1, 2023</td>
                            <td>Aug 15, 2023</td>
                            <td>2.5 months</td>
                            <td><span className="status-badge completed">Moved Out</span></td>
                          </tr>
                          <tr>
                            <td>
                              <div className="tenant-info">
                                <div className="tenant-avatar">LB</div>
                                <div>
                                  <div className="tenant-name">Lisa Brown</div>
                                  <div className="tenant-email">lisa.brown@email.com</div>
                                </div>
                              </div>
                            </td>
                            <td>Room 2A</td>
                            <td>Mar 1, 2023</td>
                            <td>May 30, 2023</td>
                            <td>3 months</td>
                            <td><span className="status-badge completed">Moved Out</span></td>
                          </tr>
                          <tr>
                            <td>
                              <div className="tenant-info">
                                <div className="tenant-avatar">DM</div>
                                <div>
                                  <div className="tenant-name">David Miller</div>
                                  <div className="tenant-email">d.miller@email.com</div>
                                </div>
                              </div>
                            </td>
                            <td>Room 1A</td>
                            <td>Jan 1, 2023</td>
                            <td>Feb 28, 2023</td>
                            <td>2 months</td>
                            <td><span className="status-badge terminated">Early Termination</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Rent Collection History */}
                  <div className="rent-history" style={{ display: activeHistoryTab === 'rent' ? 'block' : 'none' }}>
                    <div className="rent-summary-cards">
                      <div className="summary-card collected">
                        <div className="summary-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        </div>
                        <div className="summary-content">
                          <div className="summary-value">$28,400</div>
                          <div className="summary-label">Total Collected</div>
                        </div>
                      </div>

                      <div className="summary-card pending">
                        <div className="summary-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12,6 12,12 16,14"/>
                          </svg>
                        </div>
                        <div className="summary-content">
                          <div className="summary-value">$2,200</div>
                          <div className="summary-label">Pending</div>
                        </div>
                      </div>

                      <div className="summary-card overdue">
                        <div className="summary-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                          </svg>
                        </div>
                        <div className="summary-content">
                          <div className="summary-value">$800</div>
                          <div className="summary-label">Overdue</div>
                        </div>
                      </div>
                    </div>

                    <div className="history-table-container">
                      <table className="history-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Tenant</th>
                            <th>Room</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Method</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Dec 15, 2024</td>
                            <td>
                              <div className="tenant-info">
                                <div className="tenant-avatar">JS</div>
                                <span>John Smith</span>
                              </div>
                            </td>
                            <td>Room 2A</td>
                            <td className="amount-cell">$1,200</td>
                            <td><span className="status-badge collected">Collected</span></td>
                            <td>Bank Transfer</td>
                          </tr>
                          <tr>
                            <td>Nov 15, 2024</td>
                            <td>
                              <div className="tenant-info">
                                <div className="tenant-avatar">JS</div>
                                <span>John Smith</span>
                              </div>
                            </td>
                            <td>Room 2A</td>
                            <td className="amount-cell">$1,200</td>
                            <td><span className="status-badge collected">Collected</span></td>
                            <td>Credit Card</td>
                          </tr>
                          <tr>
                            <td>Oct 15, 2024</td>
                            <td>
                              <div className="tenant-info">
                                <div className="tenant-avatar">JS</div>
                                <span>John Smith</span>
                              </div>
                            </td>
                            <td>Room 2A</td>
                            <td className="amount-cell">$1,200</td>
                            <td><span className="status-badge collected">Collected</span></td>
                            <td>ACH</td>
                          </tr>
                          <tr>
                            <td>Dec 1, 2023</td>
                            <td>
                              <div className="tenant-info">
                                <div className="tenant-avatar">MJ</div>
                                <span>Maria Johnson</span>
                              </div>
                            </td>
                            <td>Room 1B</td>
                            <td className="amount-cell">$1,100</td>
                            <td><span className="status-badge collected">Collected</span></td>
                            <td>Bank Transfer</td>
                          </tr>
                          <tr>
                            <td>Nov 1, 2023</td>
                            <td>
                              <div className="tenant-info">
                                <div className="tenant-avatar">MJ</div>
                                <span>Maria Johnson</span>
                              </div>
                            </td>
                            <td>Room 1B</td>
                            <td className="amount-cell">$1,100</td>
                            <td><span className="status-badge pending">Late Payment</span></td>
                            <td>Cash</td>
                          </tr>
                          <tr>
                            <td>Aug 1, 2023</td>
                            <td>
                              <div className="tenant-info">
                                <div className="tenant-avatar">RW</div>
                                <span>Robert Wilson</span>
                              </div>
                            </td>
                            <td>Room 3C</td>
                            <td className="amount-cell">$1,350</td>
                            <td><span className="status-badge overdue">Partial Payment</span></td>
                            <td>Bank Transfer</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
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
                    <strong>Address:</strong>
                    <div className="info-value">{property.full_address}</div>
                  </div>
                  <div className="info-item">
                    <strong>Property Type:</strong>
                    <div className="info-value">{property.property_type || 'Not specified'}</div>
                  </div>
                  <div className="info-item">
                    <strong>Landlord:</strong>
                    <div className="info-value">{property.landlord_name || 'Not specified'}</div>
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

      {/* Listing Modal */}
      {showListingModal && (
        <div className="listing-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create Property Listing</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowListingModal(false);
                  setSelectedPlatforms([]);
                  setError(null);
                  setListingSuccess(null);
                }}
              >
                ×
              </button>
            </div>

            {error && (
              <div className="modal-error">
                {error}
              </div>
            )}

            {listingSuccess && (
              <div className="modal-success">
                {listingSuccess}
              </div>
            )}

            <div className="modal-section">
              <h3>Property: {property?.name}</h3>
              <p className="property-address">{property?.full_address}</p>
            </div>

            <div className="modal-section">
              <h3>Select Platforms</h3>
              <div className="platform-grid">
                {listingPlatforms.map((platform) => (
                  <label key={platform.id} className="platform-card">
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(platform.id)}
                      onChange={() => handlePlatformToggle(platform.id)}
                    />
                    <div className="platform-info">
                      <span className="platform-icon">{platform.icon}</span>
                      <span className="platform-name">{platform.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => {
                  setShowListingModal(false);
                  setSelectedPlatforms([]);
                  setError(null);
                  setListingSuccess(null);
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button 
                onClick={submitListing} 
                className="submit-btn"
                disabled={listingLoading || selectedPlatforms.length === 0}
              >
                {listingLoading ? 'Creating Listings...' : 'Create Listings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && roomToDelete && (
        <div className="delete-modal">
          <div className="modal-content delete-modal-content">
            <div className="modal-header">
              <div className="modal-title-section">
                <div className="warning-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                    <path d="M12 9v4"/>
                    <path d="m12 17 .01 0"/>
                  </svg>
                </div>
                <div>
                  <h2>Delete Room</h2>
                  <p>This action cannot be undone</p>
                </div>
              </div>
            </div>

            <div className="modal-section">
              <p className="delete-message">
                Are you sure you want to delete <strong>"{roomToDelete.name}"</strong>? 
                This will permanently remove the room and all associated data.
              </p>
            </div>

            <div className="modal-actions">
              <button 
                onClick={cancelDeleteRoom}
                className="cancel-btn"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteRoom} 
                className="delete-confirm-btn"
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <div className="loading-spinner-small"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3,6 5,6 21,6"/>
                      <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                      <line x1="10" y1="11" x2="10" y2="17"/>
                      <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                    Delete Room
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
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
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .back-btn:hover {
          background: #e2e8f0;
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
          grid-template-columns: 1fr;
          gap: 12px;
        }
        
        .info-item {
          padding: 16px 18px;
          background: #ffffff;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .info-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          border-color: #d1d5db;
        }
        
        .info-item strong {
          display: block;
          color: #6b7280;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 8px;
          line-height: 1;
        }

        .info-item .info-value {
          color: #1f2937;
          font-size: 15px;
          font-weight: 500;
          line-height: 1.4;
          margin: 0;
        }

        .info-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%);
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .info-item:hover::before {
          opacity: 1;
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
        .applications-scroll-container {
          overflow-y: auto;
          max-height: 600px;
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
          border-collapse: separate;
          border-spacing: 0;
        }

        /* Add hover effect for table rows */
        .applications-table tbody tr {
          transition: background-color 0.2s ease;
        }

        .applications-table tbody tr:hover {
          background-color: #f9fafb;
        }

        /* Table headers - Applications Page Standard */
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

        /* Table cells - Applications Page Standard */
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
          font-size: 12px;
          color: #64748b;
        }

        .property-name {
          color: #1e293b;
          margin-bottom: 4px;
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

        .action-buttons {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          justify-content: center;
        }

        /* Applications Page Button Standard */
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

        .manage-btn.view-btn {
          background: #4f46e5;
        }

        .manage-btn.view-btn:hover {
          background: #3730a3;
        }

        .manage-btn.delete-btn {
          background: #dc2626;
        }

        .manage-btn.delete-btn:hover {
          background: #b91c1c;
        }

        /* Icon Button Styles */
        .icon-btn {
          background: none;
          border: none;
          padding: 8px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          width: 32px;
          height: 32px;
        }

        .delete-icon-btn {
          color: #dc2626;
          background: #fef2f2;
          border: 1px solid #fecaca;
        }

        .delete-icon-btn:hover {
          background: #fee2e2;
          color: #b91c1c;
          transform: translateY(-1px);
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

        .clickable-room-name {
          color: #4f46e5;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .clickable-room-name:hover {
          color: #3730a3;
          text-decoration: underline;
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

        :global(.dark-mode) .applications-table-container {
          background: #1a1a1a !important;
        }

        :global(.dark-mode) .applications-table th {
          background: #111111 !important;
          color: #ffffff !important;
          border-bottom: 2px solid #333333 !important;
        }

        :global(.dark-mode) .applications-table td {
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

        :global(.dark-mode) .clickable-room-name {
          color: #6366f1 !important;
        }

        :global(.dark-mode) .clickable-room-name:hover {
          color: #8b5cf6 !important;
        }

        /* Listing Modal */
        .listing-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .modal-content {
          background: white;
          padding: 20px;
          border-radius: 8px;
          width: 80%;
          max-width: 600px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }

        .modal-error,
        .modal-success {
          margin-bottom: 20px;
        }

        .modal-section {
          margin-bottom: 20px;
        }

        .modal-section h3 {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        .property-address {
          font-size: 12px;
          color: #64748b;
        }

        .platform-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .platform-card {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          border: 1px solid #e2e8f0;
          border-radius: 5px;
          cursor: pointer;
        }

        .platform-card input {
          margin-right: 8px;
        }

        .platform-info {
          flex: 1;
        }

        .platform-icon {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .platform-name {
          font-size: 12px;
          font-weight: 500;
          color: #1e293b;
        }

        .modal-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .cancel-btn,
        .submit-btn {
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
        }

        .cancel-btn {
          background: #f8fafc;
          color: #64748b;
        }

        .cancel-btn:hover {
          background: #f1f5f9;
        }

        .submit-btn {
          background: #6366f1;
          color: white;
        }

        .submit-btn:hover {
          background: #4f46e5;
        }

        .submit-btn:disabled {
          background: #e2e8f0;
          cursor: not-allowed;
        }

        /* Delete Modal */
        .delete-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .delete-modal-content {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .modal-title-section {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .warning-icon {
          width: 48px;
          height: 48px;
          background: #fee2e2;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #dc2626;
          flex-shrink: 0;
        }

        .delete-modal-content .modal-header h2 {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 4px 0;
        }

        .delete-modal-content .modal-header p {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .delete-message {
          font-size: 14px;
          color: #374151;
          line-height: 1.5;
          margin: 0;
        }

        .delete-message strong {
          color: #1f2937;
          font-weight: 600;
        }

        .delete-confirm-btn {
          background: #dc2626;
          color: white;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .delete-confirm-btn:hover:not(:disabled) {
          background: #b91c1c;
        }

        .delete-confirm-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .loading-spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid #ffffff40;
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        /* Header Buttons */
        .create-listing-btn {
          background: #f97316;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .create-listing-btn:hover {
          background: #ea580c;
          transform: translateY(-1px);
        }

        .back-btn {
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .back-btn:hover {
          background: #e2e8f0;
        }

        /* Fixed Height Scrollable Containers */
        .rooms-section {
          background: white;
          border-radius: 6px;
          padding: 18px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          height: 400px;
          display: flex;
          flex-direction: column;
        }

        .rooms-scroll-container {
          flex: 1;
          overflow-y: auto;
          margin-top: 16px;
        }

        .rooms-table-container {
          overflow-x: auto;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
        }

        .rooms-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        .rooms-table th {
          background: #f8fafc;
          color: #64748b;
          font-weight: 600;
          padding: 12px 8px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .rooms-table td {
          padding: 12px 8px;
          border-bottom: 1px solid #f1f5f9;
          color: #374151;
        }

        .rooms-table tbody tr:hover {
          background: #f8fafc;
        }

        /* History Section */
        .history-section {
          background: white;
          border-radius: 6px;
          padding: 18px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          height: 400px;
          display: flex;
          flex-direction: column;
        }

        .history-tabs {
          display: flex;
          gap: 2px;
          margin-bottom: 16px;
          border-bottom: 1px solid #e2e8f0;
        }

        .tab-btn {
          background: none;
          border: none;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s ease;
        }

        .tab-btn.active {
          color: #4f46e5;
          border-bottom-color: #4f46e5;
        }

        .tab-btn:hover {
          color: #4f46e5;
          background: #f8fafc;
        }

        .history-content {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .tenant-history,
        .rent-history {
          flex: 1;
          overflow-y: auto;
        }

        .history-table-container {
          overflow-x: auto;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          flex: 1;
        }

        .history-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        .history-table th {
          background: #f8fafc;
          color: #64748b;
          font-weight: 600;
          padding: 12px 8px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .history-table td {
          padding: 12px 8px;
          border-bottom: 1px solid #f1f5f9;
          color: #374151;
        }

        .history-table tbody tr:hover {
          background: #f8fafc;
        }

        .tenant-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tenant-avatar {
          width: 28px;
          height: 28px;
          border-radius: 4px;
          background: #e0e7ff;
          color: #6366f1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .tenant-name {
          font-weight: 600;
          color: #1f2937;
          font-size: 13px;
        }

        .tenant-email {
          color: #6b7280;
          font-size: 11px;
          margin-top: 2px;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-badge.active {
          background: #dcfce7;
          color: #16a34a;
        }

        .status-badge.completed {
          background: #dbeafe;
          color: #2563eb;
        }

        .status-badge.terminated {
          background: #fee2e2;
          color: #dc2626;
        }

        .status-badge.collected {
          background: #dcfce7;
          color: #16a34a;
        }

        .status-badge.pending {
          background: #fef3c7;
          color: #d97706;
        }

        .status-badge.overdue {
          background: #fee2e2;
          color: #dc2626;
        }

        .rent-summary-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .summary-card {
          background: white;
          border-radius: 6px;
          padding: 16px;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .summary-card.collected {
          border-color: #16a34a;
          background: #f0fdf4;
        }

        .summary-card.pending {
          border-color: #d97706;
          background: #fffbeb;
        }

        .summary-card.overdue {
          border-color: #dc2626;
          background: #fef2f2;
        }

        .summary-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .summary-card.collected .summary-icon {
          background: #dcfce7;
          color: #16a34a;
        }

        .summary-card.pending .summary-icon {
          background: #fef3c7;
          color: #d97706;
        }

        .summary-card.overdue .summary-icon {
          background: #fee2e2;
          color: #dc2626;
        }

        .summary-content {
          flex: 1;
        }

        .summary-value {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 4px 0;
        }

        .summary-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
          margin: 0;
        }

        .amount-cell {
          font-weight: 600;
          color: #1f2937;
        }
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 2px;
        }

        .tenant-email {
          font-size: 10px;
          color: #64748b;
        }

        .amount-cell {
          font-weight: 600;
          color: #1e293b;
        }

        .status-badge.active {
          background: #dcfce7;
          color: #16a34a;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-badge.completed {
          background: #e0e7ff;
          color: #6366f1;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-badge.terminated {
          background: #fee2e2;
          color: #dc2626;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-badge.collected {
          background: #dcfce7;
          color: #16a34a;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-badge.pending {
          background: #fef3c7;
          color: #d97706;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-badge.overdue {
          background: #fee2e2;
          color: #dc2626;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .rent-summary-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }

        .summary-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s ease;
        }

        .summary-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .summary-icon {
          width: 36px;
          height: 36px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .summary-card.collected .summary-icon {
          background: #dcfce7;
          color: #16a34a;
        }

        .summary-card.pending .summary-icon {
          background: #fef3c7;
          color: #d97706;
        }

        .summary-card.overdue .summary-icon {
          background: #fee2e2;
          color: #dc2626;
        }

        .summary-content {
          flex: 1;
        }

        .summary-value {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 2px;
        }

        .summary-label {
          font-size: 11px;
          color: #64748b;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filter-select {
          padding: 6px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          font-size: 12px;
          color: #64748b;
          background: white;
        }

        /* Dark Mode Styles for History Section */
        :global(.dark-mode) .history-section {
          background: #1a1a1a !important;
          border-color: #333333 !important;
        }

        :global(.dark-mode) .tab-btn {
          color: #94a3b8 !important;
        }

        :global(.dark-mode) .tab-btn.active {
          color: #6366f1 !important;
        }

        :global(.dark-mode) .tab-btn:hover {
          color: #6366f1 !important;
          background: #111111 !important;
        }

        :global(.dark-mode) .history-table-container {
          background: #1a1a1a !important;
          border-color: #333333 !important;
        }

        :global(.dark-mode) .history-table th {
          background: #111111 !important;
          color: #94a3b8 !important;
          border-color: #333333 !important;
        }

        :global(.dark-mode) .history-table td {
          color: #e2e8f0 !important;
          border-color: #333333 !important;
        }

        :global(.dark-mode) .history-table tbody tr:hover {
          background: #222222 !important;
        }

        :global(.dark-mode) .tenant-name {
          color: #ffffff !important;
        }

        :global(.dark-mode) .tenant-email {
          color: #94a3b8 !important;
        }

        :global(.dark-mode) .amount-cell {
          color: #ffffff !important;
        }

        :global(.dark-mode) .summary-card {
          background: #1a1a1a !important;
          border-color: #333333 !important;
        }

        :global(.dark-mode) .summary-value {
          color: #ffffff !important;
        }

        :global(.dark-mode) .summary-label {
          color: #94a3b8 !important;
        }

        :global(.dark-mode) .filter-select {
          background: #1a1a1a !important;
          border-color: #333333 !important;
          color: #94a3b8 !important;
        }

        :global(.dark-mode) .status-badge.active {
          background: rgba(34, 197, 94, 0.3) !important;
          color: #22c55e !important;
        }

        :global(.dark-mode) .status-badge.completed {
          background: rgba(99, 102, 241, 0.3) !important;
          color: #a5b4fc !important;
        }

        :global(.dark-mode) .status-badge.terminated {
          background: rgba(239, 68, 68, 0.3) !important;
          color: #ef4444 !important;
        }

        :global(.dark-mode) .status-badge.collected {
          background: rgba(34, 197, 94, 0.3) !important;
          color: #22c55e !important;
        }

        :global(.dark-mode) .status-badge.pending {
          background: rgba(245, 158, 11, 0.3) !important;
          color: #f59e0b !important;
        }

        :global(.dark-mode) .status-badge.overdue {
          background: rgba(239, 68, 68, 0.3) !important;
          color: #ef4444 !important;
        }

      `}</style>
    </>
  );
} 