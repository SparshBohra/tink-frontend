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
import PropertyTenantAssignmentModal from '../../../components/PropertyTenantAssignmentModal';
import NewApplicationModal from '../../../components/NewApplicationModal';

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
  const [propertyAssignmentModalOpen, setPropertyAssignmentModalOpen] = useState(false);
  const [isNewApplicationModalOpen, setIsNewApplicationModalOpen] = useState(false);

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

  const getRoomName = (roomId: number) => {
    const room = rooms.find(r => r.id === roomId);
    return room ? room.name : `Room #${roomId}`;
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

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTotalRevenue = () => {
    return rooms.reduce((total, room) => {
      const lease = getRoomOccupancy(room.id);
      return total + (lease ? lease.monthly_rent : 0);
    }, 0);
  };

  const getPropertyLevelLease = () => {
    const today = new Date();
    return leases.find(l => {
      const isProp = l.property_ref === property!.id && (!l.room || l.room === 0);
      if (!isProp) return false;
      // consider lease current/future if end_date missing or in future
      const leaseEnd = l.end_date ? new Date(l.end_date) : undefined;
      const stillValid = !leaseEnd || leaseEnd >= today;
      return stillValid;
    });
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

  const openPropertyAssignment = () => {
    if (rooms.length > 0) {
      alert('This property has rooms. Please remove all rooms before assigning a tenant to the entire property.');
      return;
    }
    setPropertyAssignmentModalOpen(true);
  };

  const closePropertyAssignment = () => setPropertyAssignmentModalOpen(false);

  const handlePropertyAssignmentSave = async () => {
    await fetchPropertyData();
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
            Manage
          </button>
          <button
            onClick={() => handleDeleteRoom(rowData.roomId, rowData.name)}
            className="delete-btn"
            title="Delete Room"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
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
                  <p className="welcome-message">{property.full_address}</p>
                </div>
              </div>
              <div className="header-right">
                <button onClick={() => router.back()} className="btn btn-secondary">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7 7l-7-7 7-7"/></svg>
                   Back
                </button>
                <button 
                  onClick={() => setIsNewApplicationModalOpen(true)} 
                  className="btn btn-primary"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  New Application
                </button>
                <Link href={`/properties/${property.id}/edit`} className="btn btn-secondary">
                  Edit Property
                </Link>
                {rooms.length === 0 && !getPropertyLevelLease() && (
                  <button
                    className="btn btn-secondary"
                    onClick={openPropertyAssignment}
                  >
                    Assign Tenant
                  </button>
                )}
              </div>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {/* Top Metrics Row */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-info">
                  <h3 className="metric-title">Total Rooms</h3>
                  <div className="metric-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 21h18"/>
                      <path d="M5 21V7l8-4v18"/>
                      <path d="M19 21V11l-6-4"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="metric-content">
                <div className="metric-value">{rooms.length}</div>
                <div className="metric-subtitle">Total units</div>
                <div className="metric-progress">
                  <span className="metric-label">{stats.vacantRooms} vacant</span>
                  <span className="metric-change positive">+{rooms.length > 0 ? '1' : '0'}</span>
                </div>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-info">
                  <h3 className="metric-title">Current Occupancy</h3>
                  <div className="metric-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="metric-content">
                <div className="metric-value">{stats.occupiedRooms}</div>
                <div className="metric-subtitle">Active tenants</div>
                <div className="metric-progress">
                  <span className="metric-label">{stats.occupancyRate}% occupied</span>
                  <span className="metric-change positive">+5%</span>
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
                  <span className="metric-label">95% of target</span>
                  <span className="metric-change positive">+12%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="main-content">
            <div className="content-grid">
              <div className="left-column">
                {/* Room Details Section */}
                <div className="section-card">
                  <div className="section-header">
                    <h2 className="section-title">Room Details ({rooms.length})</h2>
                    <div className="section-actions">
                      <Link href={`/properties/${property.id}/add-room`} className="btn btn-secondary">
                        Add New Room
                      </Link>
                    </div>
                  </div>
                  {rooms.length > 0 ? (
                    <DataTable columns={roomsTableColumns} data={roomsTableData} renderRow={renderRoomRow} />
                  ) : (
                    <EmptyState
                      title="No Rooms Found"
                      description="No rooms have been added to this property yet."
                      action={
                        <Link href={`/properties/${property.id}/add-room`} className="btn btn-primary">
                          Add New Room
                        </Link>
                      }
                    />
                  )}
                </div>

                {/* Property History Section */}
                <div className="section-card">
                  <div className="section-header">
                    <h2 className="section-title">Property History</h2>
                  </div>
                  <DataTable
                    columns={[
                      { key: 'tenant', header: 'Tenant' },
                      { key: 'unit', header: 'Unit' },
                      { key: 'move_in', header: 'Move In' },
                      { key: 'move_out', header: 'Move Out' },
                      { key: 'status', header: 'Status' },
                    ]}
                    data={leases.map(l => ({
                      tenant: getTenantName(l.tenant),
                      unit: l.room ? getRoomName(l.room) : '— Whole Property —',
                      move_in: formatDate(l.start_date),
                      move_out: l.end_date ? formatDate(l.end_date) : '-',
                      status: l.status,
                    }))}
                    renderRow={(row: any) => (
                      <tr>
                        <td>{row.tenant}</td>
                        <td>{row.unit}</td>
                        <td>{row.move_in}</td>
                        <td>{row.move_out}</td>
                        <td>
                          <span className={`status-badge ${row.status.toLowerCase()}`}>{row.status}</span>
                        </td>
                      </tr>
                    )}
                  />
                </div>
              </div>

              <div className="right-column">
                {/* Property Information Section */}
                <div className="property-info-section">
                  <div className="section-header">
                    <div>
                      <h2 className="section-title">Property Information</h2>
                      <p className="section-subtitle">Basic property details and configuration</p>
                    </div>
                  </div>
                  
                  <div className="info-cards-grid">
                    <div className="info-card">
                      <div className="info-header">
                        <div className="info-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                        </div>
                        <h3 className="info-title">Address</h3>
                      </div>
                      <p className="info-value">{property.full_address}</p>
                    </div>
                    
                    <div className="info-card">
                      <div className="info-header">
                        <div className="info-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            <polyline points="9,22 9,12 15,12 15,22"/>
                          </svg>
                        </div>
                        <h3 className="info-title">Property Type</h3>
                      </div>
                      <p className="info-value">{(() => {
                        if (rooms.length === 0 && getPropertyLevelLease()) {
                          return 'Single Lease House';
                        }
                        return property.property_type === 'coliving' ? 'Co-living' : 'Residential';
                      })()}</p>
                    </div>
                    
                    <div className="info-card">
                      <div className="info-header">
                        <div className="info-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                        </div>
                        <h3 className="info-title">Landlord</h3>
                      </div>
                      <p className="info-value">{property.landlord_name}</p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions Card */}
                <div className="info-card">
                  <h3 className="card-title">Quick Actions</h3>
                  <p className="card-subtitle">Frequently used actions</p>
                  <div className="actions-grid">
                      <Link href={`/properties/${property.id}/add-room`} className="action-item orange">
                          <div className="action-icon">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14m-7-7h14"/></svg>
                          </div>
                          <div className="action-text">
                            <h4>Add New Room</h4>
                            <p>Create a new room in this property</p>
                          </div>
                      </Link>
                      <Link href="/applications" className="action-item purple">
                           <div className="action-icon">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                           </div>
                           <div className="action-text">
                            <h4>Review Applications</h4>
                            <p>Process rental applications</p>
                          </div>
                      </Link>
                      <Link href="/leases" className="action-item blue">
                          <div className="action-icon">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                          </div>
                          <div className="action-text">
                            <h4>View Leases</h4>
                            <p>Manage lease agreements</p>
                          </div>
                      </Link>
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

      {property && (
        <PropertyTenantAssignmentModal
          property={property}
          isOpen={propertyAssignmentModalOpen}
          onClose={closePropertyAssignment}
          onSave={handlePropertyAssignmentSave}
        />
      )}

      {isNewApplicationModalOpen && (
        <NewApplicationModal onClose={() => setIsNewApplicationModalOpen(false)} />
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
          display: flex;
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

        .btn {
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;
          text-decoration: none;
          border: none;
        }

        .btn-primary {
          background: #4f46e5;
          color: white;
        }

        .btn-primary:hover {
          background: #3730a3;
        }

        .btn-secondary {
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }

        .btn-secondary:hover {
          background: #e2e8f0;
        }

        /* Metrics Grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
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
          text-transform: uppercase;
          letter-spacing: 0.5px;
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
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .content-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          align-items: flex-start;
        }
        
        .left-column, .right-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .right-column {
          position: sticky;
          top: 24px;
        }
        
        .section-card {
            background: white;
            border-radius: 8px;
            padding: 24px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
            border: 1px solid #e2e8f0;
        }
        
        .card-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 4px;
        }
        .card-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0 0 20px;
        }
        
        .actions-grid { 
          display: flex; 
          flex-direction: column; 
          gap: 12px; 
        }
        .action-item {
            display: flex;
            align-items: center;
            padding: 16px;
            border-radius: 12px;
            text-decoration: none;
            color: inherit;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            border: 1px solid transparent;
        }
        .action-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .action-icon {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 16px;
        }
        .action-icon svg {
            width: 20px;
            height: 20px;
            color: white;
        }
        .action-text h4 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 2px 0;
        }
        .action-text p {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .action-item.blue { background-color: #eff6ff; border-color: #dbeafe; }
        .action-item.blue .action-icon { background-color: #3b82f6; }
        .action-item.blue h4 { color: #2563eb; }
        
        .action-item.purple { background-color: #f5f3ff; border-color: #e0dfff; }
        .action-item.purple .action-icon { background-color: #8b5cf6; }
        .action-item.purple h4 { color: #7c3aed; }

        .action-item.orange { background-color: #fff7ed; border-color: #ffedd5; }
        .action-item.orange .action-icon { background-color: #f97316; }
        .action-item.orange h4 { color: #ea580c; }
      `}</style>
    </>
  );
}

