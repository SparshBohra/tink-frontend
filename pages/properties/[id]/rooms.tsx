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
import { formatCurrency } from '../../../lib/utils';
import PropertyTenantAssignmentModal from '../../../components/PropertyTenantAssignmentModal';
import NewListingModal from '../../../components/NewListingModal';
import { calculatePropertyRevenue, getOccupancyStats as getOccupancyStatsUtil, formatRevenue } from '../../../lib/revenueCalculator';
import RentTypeConversionWizard from '../../../components/RentTypeConversionWizard';
import RoomCountEditor from '../../../components/RoomCountEditor';
import RoomDeletionModal from '../../../components/RoomDeletionModal';

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
  const [conversionWizardOpen, setConversionWizardOpen] = useState(false);
  const [roomCountEditorOpen, setRoomCountEditorOpen] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  // This single useEffect handles both initial data fetching and the refresh after creation.
  useEffect(() => {
    // We wait until the router is ready and provides the `id`.
    if (id) {
      const urlParams = new URLSearchParams(window.location.search);
      const justCreated = urlParams.get('created') === 'true';

      const fetchData = () => {
      fetchPropertyData();
        // If we just created, clean the URL param to prevent re-fetching on manual refresh
        if (justCreated) {
          router.replace(`/properties/${id}/rooms`, undefined, { shallow: true });
        }
      };

      if (justCreated) {
        // Delay fetch slightly to allow for potential database replication lag
        const timer = setTimeout(fetchData, 500);
        return () => clearTimeout(timer);
      } else {
        fetchPropertyData();
      }
    }
  }, [id]); // Dependency on `id` ensures this runs when the router is ready.

  const fetchPropertyData = async () => {
    // Add guard here to prevent running with an invalid ID
    if (!id || typeof id !== 'string') {
      console.warn("fetchPropertyData called without a valid ID.");
      return;
    }

    try {
      setLoading(true);
      const propertyId = parseInt(id as string);

      console.log('Fetching data for property ID:', propertyId);

      const propertyData = await apiClient.getProperty(propertyId);
      console.log('Property data:', propertyData);
      setProperty(propertyData);

      const roomsData = await apiClient.getPropertyRooms(propertyId);
      console.log('Rooms data:', roomsData);
      setRooms(roomsData);

      const tenantsResponse = await apiClient.getTenants();
      setTenants(tenantsResponse.results || []);
      
      const leasesResponse = await apiClient.getLeases();
      setLeases(leasesResponse.results || []);

    } catch (err: any) {
      console.error('Error fetching property data:', err);
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
    const relevantLease = leases.find(lease => 
      lease.room === roomId && (lease.status === 'active' || lease.status === 'draft' || lease.is_active)
    );
    return relevantLease;
  };

  const getPropertyOccupancyStats = () => {
    if (!property) return { totalRooms: 0, occupiedRooms: 0, vacantRooms: 0, occupancyRate: '0.0' };
    
    const stats = getOccupancyStatsUtil(property, leases, rooms);
    return {
      totalRooms: stats.totalUnits,
      occupiedRooms: stats.occupiedUnits,
      vacantRooms: stats.vacantUnits,
      occupancyRate: stats.occupancyRate
    };
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
    if (!property) return 0;
    
    const calculation = calculatePropertyRevenue(property, leases, rooms);
    return calculation.monthlyRevenue;
  };

  const getPropertyLevelLease = () => {
    if (!property) return null;
    const today = new Date();
    return leases.find(l => {
      const isProp = l.property_ref === property.id && (!l.room || l.room === 0);
      if (!isProp) return false;
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
    await fetchPropertyData();
    setAssignmentModalOpen(false);
    setSelectedRoomForAssignment(null);
  };

  const handleConversionComplete = async (updatedProperty: Property) => {
    setProperty(updatedProperty);
    await fetchPropertyData();
    setConversionWizardOpen(false);
  };

  const handleRoomCountUpdate = async (updatedRooms: Room[]) => {
    setRooms(updatedRooms);
    await fetchPropertyData();
    setRoomCountEditorOpen(false);
  };

  const handleCreateListing = () => {
    setShowListingModal(true);
  };

  const handleDeleteRoom = (roomId: number, roomName: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      setSelectedRoom(room);
    setShowDeleteModal(true);
    }
  };

  const handleDeleteComplete = async () => {
    try {
      await fetchPropertyData();
      setSelectedRoom(null);
      setError(null);
    } catch (err: any) {
      console.error('Failed to refresh data after room deletion:', err);
      setError(err.message || 'Failed to refresh data');
    }
  };

  const cancelDeleteRoom = () => {
    setShowDeleteModal(false);
    setSelectedRoom(null);
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
    if (!property) {
      setError('Property not loaded.');
      return;
    }
    if (selectedPlatforms.length === 0) {
      setError('Please select at least one platform.');
      return;
    }
    setListingLoading(true);
    setError(null);
        setListingSuccess(null);
    try {
      await apiClient.createListing({ 
        property_ref: property.id,
        title: `${property.name} - Room Listing`,
        description: `Available rooms in ${property.name}`,
        listing_type: 'rooms',
        available_rooms: selectedRoom ? [selectedRoom.id] : [],
        application_form_config: {
          steps: {
            basic_info: { enabled: true, mandatory: true },
            contact_info: { enabled: true, mandatory: true }
          }
        }
      });
      setListingSuccess(`Successfully listed on ${selectedPlatforms.join(', ')}.`);
    } catch (err: any) {
      setError(err.message || 'Failed to create listing.');
    } finally {
      setListingLoading(false);
    }
  };

  const openPropertyAssignment = () => {
    console.log('openPropertyAssignment called', { property: property, rent_type: property?.rent_type });
    if (property?.rent_type === 'per_property') {
      console.log('Opening property assignment modal');
    setPropertyAssignmentModalOpen(true);
    } else {
      console.log('Property assignment not available - rent_type is not per_property');
    }
  };

  const closePropertyAssignment = () => setPropertyAssignmentModalOpen(false);

  const handlePropertyAssignmentSave = async () => {
    await fetchPropertyData();
    closePropertyAssignment();
  };
  
  const listingPlatforms = [
    { id: 'zumper', name: 'Zumper' },
  ];

  if (loading) return <DashboardLayout title="Loading"><div className="loading-state">Loading property details...</div></DashboardLayout>;
  if (error) return <DashboardLayout title="Error"><div className="error-state">{error}</div></DashboardLayout>;
  if (!property) return <DashboardLayout title="Not Found"><EmptyState title="Property Not Found" description="The property you are looking for does not exist." /></DashboardLayout>;

  const { totalRooms, occupiedRooms, vacantRooms, occupancyRate } = getPropertyOccupancyStats();
  const totalRevenue = getTotalRevenue();
  const propertyLevelLease = getPropertyLevelLease();

  const propertyHistoryLeases = showAllHistory
    ? leases
    : leases.filter(l => property && l.property_ref === property.id);

  const renderRoomRow = (rowData: any, index: number) => {
    const room = rowData as Room;
    const lease = getRoomOccupancy(room.id);

    return (
        <tr key={room.id} className="room-row">
            <td>
                <Link href={`/properties/${id}/edit-room/${room.id}`}>
                    <div className="room-name">{room.name}</div>
                    <div className="room-type">{room.room_type}</div>
                </Link>
      </td>
            <td>
                {lease ? (
                  <StatusBadge
                    status={lease.status}
                    text={
                      lease.status === 'draft' ? 'Draft Lease' :
                      lease.status === 'active' ? 'Occupied' :
                      lease.status
                    }
                  />
                ) : (
                  <StatusBadge status="vacant" text="Vacant" />
                )}
      </td>
            <td>
                {lease ? (
                    <div className="tenant-info">
                        <span className="tenant-avatar" style={{ backgroundColor: '#E0E7FF' }}>{getTenantName(lease.tenant).charAt(0)}</span>
                        {getTenantName(lease.tenant)}
          </div>
        ) : (
                    <span className="unassigned">-</span>
        )}
      </td>
            <td>{lease ? formatCurrency(lease.monthly_rent) : '-'}</td>
            <td>
                <div className="action-buttons">
                    <button 
                        onClick={() => handleAssignTenant(room)} 
                        className="btn-action assign"
                        title="Assign Tenant"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                    </button>
                    <button 
                        onClick={() => router.push(`/properties/${id}/edit-room/${room.id}`)}
                        className="btn-action edit"
                        title="Edit Room"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button 
                        onClick={() => handleDeleteRoom(room.id, room.name)} 
                        className="btn-action delete"
                        title="Delete Room"
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
    );
  };
  
  const renderTenantHistoryRow = (lease: Lease, index: number) => (
    <tr key={lease.id} className="history-row">
      <td>{getTenantName(lease.tenant)}</td>
      <td>{lease.room ? getRoomName(lease.room) : '— Whole Property —'}</td>
      <td>{formatDate(lease.start_date)}</td>
      <td>{formatDate(lease.end_date)}</td>
      <td>
        <StatusBadge status={lease.status as 'active' | 'inactive' | 'ended' || 'active'} />
      </td>
    </tr>
  );

  return (
    <DashboardLayout
      title={property.name}
      subtitle={property.full_address}
      icon={
        <button onClick={() => router.push('/properties')} className="back-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5m7-7l-7 7 7 7" />
          </svg>
        </button>
      }
    >
      <Head>
        <title>{property.name} - Rooms | Tink</title>
      </Head>
      <div className="dashboard-container">
        {/* No Rooms Alert Banner */}
        {rooms.length === 0 && property.rent_type === 'per_room' && (
          <div className="alert-banner">
            <div className="alert-content">
              <div className="alert-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div className="alert-text">
                <strong>Setup Required:</strong> This property needs rooms to be added before you can assign tenants or collect rent.
              </div>
              <div className="alert-actions">
                <button 
                  onClick={() => router.push(`/properties/${property.id}/add-room`)}
                  className="alert-btn primary"
                >
                  Add Room
                </button>
                <button 
                  onClick={() => setRoomCountEditorOpen(true)}
                  className="alert-btn secondary"
                >
                  Add Multiple
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid Layout matching tenants page */}
        <div className="main-content-grid">
          <div className="left-column">
            {/* Compact Metrics Grid */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                  <div className="metric-info">
                  <h3 className="metric-title">Total Rooms</h3>
                    <div className="metric-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                  </div>
                  </div>
                </div>
                <div className="metric-content">
                <div className="metric-value">{totalRooms}</div>
                  <div className="metric-subtitle">in this property</div>
                  <div className="metric-progress">
                    <span className="metric-label">{vacantRooms} vacant</span>
                    <span className="metric-change neutral">{occupiedRooms} occupied</span>
                </div>
              </div>
              </div>

            <div className="metric-card">
              <div className="metric-header">
                  <div className="metric-info">
                    <h3 className="metric-title">Occupancy Rate</h3>
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
                <div className="metric-value">{occupancyRate}%</div>
                  <div className="metric-subtitle">current occupancy</div>
                  <div className="metric-progress">
                    <span className="metric-label">{occupiedRooms} tenants</span>
                    <span className="metric-change positive">active</span>
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
                  <div className="metric-subtitle">from all rooms</div>
                  <div className="metric-progress">
                    <span className="metric-label">monthly income</span>
                    <span className="metric-change positive">stable</span>
                  </div>
              </div>
            </div>
          </div>

            {/* Room Management Section */}
                {property.rent_type === 'per_room' && (
              <div className="section-card">
                <div className="section-header">
                  <div className="section-title-group">
                    <h2 className="section-title">Room Management</h2>
                    <p className="section-subtitle">{rooms.length} rooms in this property</p>
                    </div>
                  <Link href={`/properties/${id}/add-room`} className="btn btn-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add New Room
                  </Link>
                  </div>
                  {rooms.length > 0 ? (
                  <div className="rooms-table-container">
                            <DataTable
                                columns={[
                                    { header: 'Room Name', key: 'name' },
                                    { header: 'Status', key: 'status' },
                                    { header: 'Tenant', key: 'tenant' },
                                    { header: 'Rent', key: 'rent' },
                                    { header: 'Actions', key: 'actions' },
                                ]}
                                data={rooms}
                                renderRow={renderRoomRow}
                            />
                  </div>
                  ) : (
                    <div className="empty-rooms-state">
                      <div className="empty-state-content">
                        <div className="empty-state-icon">
                          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            <polyline points="9 22 9 12 15 12 15 22"/>
                          </svg>
                        </div>
                        <h3 className="empty-state-title">No Rooms Found</h3>
                        <p className="empty-state-description">
                          This property is configured for per-room renting, but no rooms have been added yet.
                          <br />
                          Get started by adding rooms to enable tenant assignments and rent collection.
                        </p>
                        <div className="empty-state-actions">
                          <button 
                            onClick={() => router.push(`/properties/${property.id}/add-room`)} 
                            className="btn btn-primary"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 5v14m-7-7h14"/>
                            </svg>
                            Add Single Room
                        </button>
                          <button 
                            onClick={() => setRoomCountEditorOpen(true)} 
                            className="btn btn-secondary"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                            </svg>
                            Add Multiple Rooms
                          </button>
                        </div>
                        <div className="empty-state-help">
                          <p className="help-text">
                            💡 <strong>Tip:</strong> Use "Add Multiple Rooms" to quickly create several rooms at once with different types and rent amounts.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                )}
                
                {/* Property-level lease Section */}
                {property.rent_type === 'per_property' && (
              <div className="section-card">
                <div className="section-header">
                  <div className="section-title-group">
                    <h2 className="section-title">Lease Details</h2>
                    <p className="section-subtitle">This property is leased as a whole unit</p>
                      </div>
                      {!propertyLevelLease && (
                        <button onClick={openPropertyAssignment} className="btn btn-primary">
                          Assign Tenant
                        </button>
                      )}
                    </div>
                    {propertyLevelLease ? (
                      <div className="lease-details">
                        <div className="lease-detail-item">
                          <span className="item-label">Tenant</span>
                          <span className="item-value tenant-name">{getTenantName(propertyLevelLease.tenant)}</span>
                        </div>
                        <div className="lease-detail-item">
                          <span className="item-label">Rent</span>
                          <span className="item-value">{formatCurrency(propertyLevelLease.monthly_rent)}/mo</span>
                        </div>
                        <div className="lease-detail-item">
                          <span className="item-label">Lease Dates</span>
                          <span className="item-value">{formatDate(propertyLevelLease.start_date)} - {formatDate(propertyLevelLease.end_date)}</span>
                        </div>
                        <div className="lease-detail-item">
                          <span className="item-label">Status</span>
                          <span className="item-value">
                            <StatusBadge
                              status={propertyLevelLease.status as any}
                              text={
                                propertyLevelLease.status === 'draft' ? 'Draft Lease' :
                                propertyLevelLease.status === 'active' ? 'Occupied' :
                                (propertyLevelLease.status.charAt(0).toUpperCase() + propertyLevelLease.status.slice(1))
                              }
                            />
                          </span>
                        </div>
                      </div>
                    ) : (
                      <EmptyState
                        title="No Active Lease"
                        description="This property is currently vacant."
                        action={
                          <button onClick={openPropertyAssignment} className="btn btn-primary">
                            Assign Tenant
                          </button>
                        }
                      />
                    )}
                  </div>
                )}

                {/* Property History Section */}
            <div className="section-card">
              <div className="section-header">
                <div className="section-title-group">
                  <h2 className="section-title">Property History</h2>
                  <p className="section-subtitle">Tenant and rent collection history</p>
                  </div>
                        <div className="history-controls">
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
                          <div className="toggle-switch">
                            <input 
                              id="history-toggle"
                              type="checkbox" 
                              checked={showAllHistory} 
                              onChange={(e) => setShowAllHistory(e.target.checked)} 
                            />
                            <label htmlFor="history-toggle">Show all properties</label>
                          </div>
                        </div>
                    </div>
                    {activeHistoryTab === 'tenant' && (
                        propertyHistoryLeases.length > 0 ? (
                  <div className="history-table-container">
                  <DataTable
                    columns={[
                                    { header: 'Tenant', key: 'tenant' },
                                    { header: 'Unit', key: 'unit' },
                                    { header: 'Move In', key: 'move_in' },
                                    { header: 'Move Out', key: 'move_out' },
                                    { header: 'Status', key: 'status' },
                                ]}
                                data={propertyHistoryLeases}
                                renderRow={renderTenantHistoryRow}
                            />
                  </div>
                        ) : (
                            <EmptyState
                                title="No Tenant History"
                                description="No leases have been recorded for this property yet."
                            />
                        )
                    )}
                    {activeHistoryTab === 'rent' && (
                        <EmptyState
                            title="Rent Collection History"
                            description="This feature is under development."
                        />
                    )}
                </div>
              </div>

              <div className="right-column">
            {/* Quick Actions Section */}
            <div className="quick-actions-section">
              <div className="section-header">
                    <div>
                  <h2 className="section-title">Quick Actions</h2>
                  <p className="section-subtitle">Frequently used actions</p>
                    </div>
                      <div className="header-actions">
                          <button className="btn btn-primary" onClick={() => setIsNewApplicationModalOpen(true)}>
                              Create Listing
                          </button>
                          <button className="btn btn-secondary" onClick={() => router.push(`/listings?property=${property.id}`)}>
                              View Listings
                          </button>
                          <Link href={`/properties/${property.id}/edit`} className="btn btn-secondary">
                              Edit Property
                          </Link>
                      </div>
                  </div>
              
              <div className="actions-grid">
                {property.rent_type === 'per_room' && (
                <div 
                    className={`action-card blue ${rooms.length === 0 ? 'highlighted' : ''}`}
                  onClick={() => router.push(`/properties/${property.id}/add-room`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="action-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14m-7-7h14"/>
                    </svg>
                    </div>
                  <div className="action-content">
                    <h3 className="action-title">Add New Room</h3>
                      <p className="action-subtitle">{rooms.length === 0 ? 'Start by creating your first room' : 'Create a new room'}</p>
                        </div>
                      </div>
                )}
                
                <div 
                  className="action-card purple"
                  onClick={() => setConversionWizardOpen(true)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="action-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                    </svg>
                    </div>
                  <div className="action-content">
                    <h3 className="action-title">Convert Rent Type</h3>
                    <p className="action-subtitle">Change pricing model</p>
                            </div>
                    </div>

                {property.rent_type === 'per_room' && (
                <div 
                    className={`action-card green ${rooms.length === 0 ? 'highlighted' : ''}`}
                  onClick={() => setRoomCountEditorOpen(true)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="action-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7"/>
                      <rect x="14" y="3" width="7" height="7"/>
                      <rect x="14" y="14" width="7" height="7"/>
                      <rect x="3" y="14" width="7" height="7"/>
                    </svg>
                  </div>
                  <div className="action-content">
                      <h3 className="action-title">{rooms.length === 0 ? 'Add Multiple Rooms' : 'Manage Rooms'}</h3>
                      <p className="action-subtitle">{rooms.length === 0 ? 'Quickly create several rooms at once' : 'Edit room structure'}</p>
                  </div>
                </div>
                )}

                <div 
                  className="action-card orange"
                  onClick={() => setIsNewApplicationModalOpen(true)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="action-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9,22 9,12 15,12 15,22"/>
                    </svg>
                          </div>
                  <div className="action-content">
                    <h3 className="action-title">Create Listing</h3>
                    <p className="action-subtitle">List property</p>
                  </div>
                </div>

                <div 
                  className="action-card blue"
                  onClick={() => router.push(`/listings?property=${property.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="action-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                  </div>
                  <div className="action-content">
                    <h3 className="action-title">View Listings</h3>
                    <p className="action-subtitle">See property listings</p>
                    </div>
                          </div>

                <div 
                  className="action-card blue"
                  onClick={() => router.push('/inventory')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="action-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <line x1="9" y1="3" x2="9" y2="21"/>
                      <line x1="15" y1="3" x2="15" y2="21"/>
                    </svg>
                          </div>
                  <div className="action-content">
                    <h3 className="action-title">Manage Inventory</h3>
                    <p className="action-subtitle">Track items</p>
                          </div>
                          </div>

                <div 
                  className="action-card green"
                  onClick={() => router.push('/leases')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="action-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                          </div>
                  <div className="action-content">
                    <h3 className="action-title">View Leases</h3>
                    <p className="action-subtitle">Manage agreements</p>
                          </div>
                  </div>
                </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="content-grid">
  
          {/* Sidebar */}
          <div className="sidebar">
            {/* Property Details Section Removed */}
              </div>
            </div>
          </div>

      {assignmentModalOpen && selectedRoomForAssignment && (
        <PropertyTenantAssignmentModal
          property={property}
          room={selectedRoomForAssignment}
          isOpen={assignmentModalOpen}
          onClose={handleAssignmentModalClose}
          onSave={handleAssignmentModalSave}
        />
      )}

      {propertyAssignmentModalOpen && property && (
        <PropertyTenantAssignmentModal
          property={property}
          isOpen={propertyAssignmentModalOpen}
          onClose={closePropertyAssignment}
          onSave={handlePropertyAssignmentSave}
        />
      )}

      {isNewApplicationModalOpen && (
        <NewListingModal onClose={() => setIsNewApplicationModalOpen(false)} onSuccess={() => setIsNewApplicationModalOpen(false)} />
      )}

      {/* Conversion Wizard */}
      {conversionWizardOpen && property && (
        <RentTypeConversionWizard
          property={property}
          rooms={rooms}
          leases={leases}
          tenants={tenants}
          isOpen={conversionWizardOpen}
          onClose={() => setConversionWizardOpen(false)}
          onComplete={(updatedProperty) => {
            setProperty(updatedProperty);
            setConversionWizardOpen(false);
            fetchPropertyData();
          }}
        />
      )}

      {/* Room Count Editor Modal */}
      {roomCountEditorOpen && property && (
        <div className="modal-overlay" onClick={() => setRoomCountEditorOpen(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Room Management</h2>
              <button onClick={() => setRoomCountEditorOpen(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <RoomCountEditor
                property={property}
                rooms={rooms}
                leases={leases}
                tenants={tenants}
                onUpdate={(updatedRooms) => {
                  setRooms(updatedRooms);
                  setRoomCountEditorOpen(false);
                  fetchPropertyData();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedRoom && property && (
        <RoomDeletionModal
          room={selectedRoom}
          property={property}
          leases={leases}
          tenants={tenants}
          isOpen={showDeleteModal}
          onClose={cancelDeleteRoom}
          onDelete={handleDeleteComplete}
        />
      )}

      <style jsx>{`
        .dashboard-container {
          padding: 0;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          min-height: 100vh;
          font-family: 'Inter', system-ui, sans-serif;
        }
        :global(.dark-mode) .dashboard-container {
          background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
        }

        /* Header Styles */
        .dashboard-header {
          background: transparent;
          backdrop-filter: none;
          border-bottom: none;
          padding: 24px 32px;
          position: relative;
          z-index: 100;
        }
        :global(.dark-mode) .dashboard-header {
          background: transparent;
          border-bottom: none;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
            align-items: center;
        }

        .header-left {
            display: flex;
            align-items: center;
          gap: 20px;
        }

        .back-button {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 8px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #64748b;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          margin-right: 16px;
        }
        .back-button:hover {
          background: #f8fafc;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        :global(.dark-mode) .back-button {
          background: rgba(22, 27, 34, 0.9);
          border-color: rgba(48, 54, 61, 0.8);
          color: #8b949e;
        }
        :global(.dark-mode) .back-button:hover {
          background: #21262d;
        }

        .dashboard-title {
          font-size: 32px;
          font-weight: 800;
          background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
            margin: 0;
          letter-spacing: -0.02em;
        }
        :global(.dark-mode) .dashboard-title {
          background: linear-gradient(135deg, #f0f6fc 0%, #c9d1d9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .subtitle-container {
          margin-top: 4px;
        }

        .welcome-message {
          font-size: 15px;
            color: #64748b;
          margin: 0;
          font-weight: 500;
          letter-spacing: 0.01em;
        }
        :global(.dark-mode) .welcome-message {
            color: #8b949e;
        }

        .message-text {
          display: inline-block;
        }

        .header-right {
            display: flex;
          align-items: center;
            gap: 12px;
        }

        .btn {
          padding: 12px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.9);
            color: #475569;
          border: 1px solid rgba(226, 232, 240, 0.8);
        }
        .btn-secondary:hover {
          background: #f8fafc;
        }
        :global(.dark-mode) .btn-secondary {
          background: rgba(33, 38, 45, 0.9);
            color: #c9d1d9;
          border-color: rgba(48, 54, 61, 0.8);
        }
        :global(.dark-mode) .btn-secondary:hover {
          background: #21262d;
        }
        /* Main Content Grid Layout */
        .main-content-grid {
          display: grid;
          grid-template-columns: 2.5fr 1fr;
          gap: 24px;
          align-items: flex-start;
          padding: 16px 32px 32px;
        }

        .left-column, .right-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Compact Metrics Grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
            gap: 16px;
        }

        /* Quick Actions Section */
        .quick-actions-section {
          background: white;
          border-radius: 6px;
          padding: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          height: fit-content;
          display: flex;
          flex-direction: column;
        }
        :global(.dark-mode) .quick-actions-section {
          background: #1a1a1a;
          border-color: #333333;
        }

        .quick-actions-section .section-header {
          margin-bottom: 12px;
        }

        .quick-actions-section .section-title {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 3px 0;
        }
        :global(.dark-mode) .quick-actions-section .section-title {
          color: #f0f6fc;
        }

        .quick-actions-section .section-subtitle {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }
        :global(.dark-mode) .quick-actions-section .section-subtitle {
          color: #8b949e;
        }

        .actions-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
          justify-content: flex-start;
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
          color: inherit;
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

        .action-card.orange {
          background: #fff7ed;
          border-color: #fed7aa;
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

        .action-card.orange .action-icon {
          background: #f97316;
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

        /* Dark mode for action cards */
        :global(.dark-mode) .action-card {
          background: #111111 !important;
          border: 1px solid #333333 !important;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4) !important;
        }
        :global(.dark-mode) .action-card:hover {
          background: #222222 !important;
          border-color: #ffffff !important;
        }
        :global(.dark-mode) .action-title {
          color: #f0f6fc !important;
        }
        :global(.dark-mode) .action-subtitle {
          color: #8b949e !important;
        }
        :global(.dark-mode) .action-card.blue .action-icon { background: rgba(59, 130, 246, 0.3); }
        :global(.dark-mode) .action-card.green .action-icon { background: rgba(34, 197, 94, 0.3); }
        :global(.dark-mode) .action-card.purple .action-icon { background: rgba(139, 92, 246, 0.3); }
        :global(.dark-mode) .action-card.orange .action-icon { background: rgba(249, 115, 22, 0.3); }

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
        :global(.dark-mode) .metric-card {
          background: #111111;
          border-color: #333333;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
        }
        :global(.dark-mode) .metric-card:hover {
          background: #222222;
          border-color: #ffffff;
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
        :global(.dark-mode) .metric-title {
            color: #8b949e;
        }

        .metric-icon {
          width: 20px;
          height: 20px;
          color: #64748b;
        }
        :global(.dark-mode) .metric-icon {
          color: #8b949e;
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
        :global(.dark-mode) .metric-value {
            color: #f0f6fc;
        }

        .metric-subtitle {
          font-size: 11px;
          color: #64748b;
          margin-bottom: 10px;
        }
        :global(.dark-mode) .metric-subtitle {
          color: #8b949e;
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
        :global(.dark-mode) .metric-label {
            color: #8b949e;
        }
        
        .metric-change {
          font-size: 12px;
          font-weight: 600;
        }
        .metric-change.positive {
          color: #10b981;
        }
        .metric-change.neutral {
          color: #64748b;
        }
        :global(.dark-mode) .metric-change.positive {
          color: #4ade80;
        }

        .main-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        /* Section Cards */
        .section-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(226, 232, 240, 0.6);
          border-radius: 6px;
            overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        }
        :global(.dark-mode) .section-card {
          background: rgba(22, 27, 34, 0.9);
          border-color: rgba(48, 54, 61, 0.6);
        }

        .section-header {
          padding: 24px 28px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.6);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        :global(.dark-mode) .section-header {
          border-bottom-color: rgba(48, 54, 61, 0.6);
        }

        .section-title-group {
          flex: 1;
        }

        .section-title {
          font-size: 20px;
          font-weight: 700;
            color: #1e293b;
          margin: 0 0 4px 0;
          letter-spacing: -0.01em;
        }
        :global(.dark-mode) .section-title {
            color: #f0f6fc;
        }

        .section-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0;
          font-weight: 500;
        }
        :global(.dark-mode) .section-subtitle {
            color: #8b949e;
        }
        
        .rooms-table-container,
        .history-table-container {
          width: 100%;
          overflow-x: auto;
          border-radius: 6px;
          background: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .rooms-table-container :global(.data-table),
        .history-table-container :global(.data-table) {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        
        .rooms-table-container :global(.data-table tbody tr),
        .history-table-container :global(.data-table tbody tr) {
          transition: background-color 0.2s ease;
        }

        .rooms-table-container :global(.data-table tbody tr:hover),
        .history-table-container :global(.data-table tbody tr:hover) {
          background-color: #f9fafb;
        }

        .rooms-table-container :global(.data-table th),
        .history-table-container :global(.data-table th) {
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

        .rooms-table-container :global(.data-table td),
        .history-table-container :global(.data-table td) {
          padding: 12px 16px;
          vertical-align: middle;
          height: 48px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
          color: #374151;
        }

        :global(.dark-mode) .rooms-table-container,
        :global(.dark-mode) .history-table-container {
          background: #1a1a1a;
          border-color: #333333;
        }

        :global(.dark-mode) .rooms-table-container :global(.data-table th),
        :global(.dark-mode) .history-table-container :global(.data-table th) {
          background: #1a1a1a;
          color: #9ca3af;
          border-color: #333333;
        }

        :global(.dark-mode) .rooms-table-container :global(.data-table td),
        :global(.dark-mode) .history-table-container :global(.data-table td) {
          color: #e5e7eb;
          border-color: #333333;
        }

        :global(.dark-mode) .rooms-table-container :global(.data-table tbody tr:hover),
        :global(.dark-mode) .history-table-container :global(.data-table tbody tr:hover) {
          background-color: #2a2a2a;
        }

        /* Action Buttons */
        .action-buttons {
          display: flex;
          gap: 8px;
          align-items: center;
          justify-content: center;
        }

        .btn-action {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          background: transparent;
          color: #64748b;
        }

        .btn-action:hover {
          transform: scale(1.1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .btn-action.assign {
          background: #eff6ff;
          color: #3b82f6;
        }

        .btn-action.assign:hover {
          background: #dbeafe;
          color: #2563eb;
        }

        .btn-action.edit {
          background: #f0fdf4;
          color: #22c55e;
        }

        .btn-action.edit:hover {
          background: #dcfce7;
          color: #16a34a;
        }

        .btn-action.delete {
          background: #fef2f2;
          color: #ef4444;
        }

        .btn-action.delete:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        :global(.dark-mode) .btn-action {
          background: rgba(255, 255, 255, 0.1);
          color: #8b949e;
        }

        :global(.dark-mode) .btn-action.assign {
          background: rgba(59, 130, 246, 0.2);
          color: #60a5fa;
        }

        :global(.dark-mode) .btn-action.assign:hover {
          background: rgba(59, 130, 246, 0.3);
          color: #3b82f6;
        }

        :global(.dark-mode) .btn-action.edit {
          background: rgba(34, 197, 94, 0.2);
          color: #4ade80;
        }

        :global(.dark-mode) .btn-action.edit:hover {
          background: rgba(34, 197, 94, 0.3);
          color: #22c55e;
        }

        :global(.dark-mode) .btn-action.delete {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
        }

        :global(.dark-mode) .btn-action.delete:hover {
          background: rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }


        .action-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s ease;
          cursor: pointer;
          border: 1px solid rgba(226, 232, 240, 0.6);
          background: rgba(248, 250, 252, 0.5);
        }
        .action-item:hover {
          background: rgba(248, 250, 252, 0.8);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        }
        :global(.dark-mode) .action-item {
          border-color: rgba(48, 54, 61, 0.6);
          background: rgba(33, 38, 45, 0.5);
        }
        :global(.dark-mode) .action-item:hover {
          background: rgba(33, 38, 45, 0.8);
        }

        .action-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .action-icon.blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .action-icon.purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
        .action-icon.green { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
        .action-icon.orange { background: rgba(249, 115, 22, 0.1); color: #f97316; }
        .action-icon.violet { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
        .action-icon.yellow { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

        .action-content {
          flex: 1;
          min-width: 0;
        }

        .action-title {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 2px 0;
        }
        :global(.dark-mode) .action-title {
          color: #f0f6fc;
        }

        .action-subtitle {
          display: block;
          font-size: 11px;
          color: #64748b;
          margin: 0;
          font-weight: 500;
        }
        :global(.dark-mode) .action-subtitle {
          color: #8b949e;
        }

        .header-right-actions {
          position: absolute;
          top: 20px;
          right: 20px;
          display: flex;
          gap: 12px;
          z-index: 100;
        }

        .header-actions {
          display: flex;
          gap: 10px;
          margin-left: auto;
          flex-wrap: nowrap;
        }
        .header-actions .btn {
          white-space: nowrap;
        }

        .header-right-actions {
          display: none;
        }

        /* History Tabs */
        .history-controls { display: flex; align-items: center; gap: 24px; }
        .history-tabs { display: flex; gap: 4px; background: #f1f5f9; padding: 4px; border-radius: 6px; }
        :global(.dark-mode) .history-tabs { background: #21262d; }
        .tab-btn { background: transparent; border: none; padding: 6px 12px; border-radius: 4px; font-size: 14px; font-weight: 600; color: #475569; cursor: pointer; }
        :global(.dark-mode) .tab-btn { color: #8b949e; }
        .tab-btn.active { background: white; color: #1e293b; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        :global(.dark-mode) .tab-btn.active { background: #30363d; color: #f0f6fc; }
        .history-row td { padding: 12px 20px; font-size: 14px; }
        .toggle-switch { display: flex; align-items: center; gap: 8px; }
        .toggle-switch label { font-size: 14px; font-weight: 500; color: #64748b; cursor: pointer; user-select: none;}
        :global(.dark-mode) .toggle-switch label { color: #8b949e; }
        .toggle-switch input {
          cursor: pointer;
        }
        
        /* Right Column */
        .info-grid { display: flex; flex-direction: column; gap: 16px; padding: 20px; }
        .info-item { display: flex; align-items: flex-start; gap: 12px; }
        .info-icon-wrapper { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; color: #64748b; flex-shrink: 0; }
        :global(.dark-mode) .info-icon-wrapper { background: #21262d; color: #8b949e; }
        .info-label { font-size: 12px; color: #64748b; margin: 0; }
        :global(.dark-mode) .info-label { color: #8b949e; }
        .info-value { font-size: 14px; font-weight: 500; margin: 2px 0 0; color: #1e293b; }
        :global(.dark-mode) .info-value { color: #f0f6fc; }
        
        .quick-actions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
        .quick-action-item { display: flex; align-items: center; gap: 12px; padding: 16px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; text-decoration: none; color: inherit; transition: all 0.2s ease; cursor: pointer; }
        :global(.dark-mode) .quick-action-item { background: #21262d; border-color: #21262d; }
        .quick-action-item:hover { border-color: #cbd5e1; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
        .quick-action-icon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .quick-action-text h4 { font-size: 14px; font-weight: 600; color: #1e293b; margin: 0 0 4px 0; }
        .quick-action-text p { font-size: 12px; color: #64748b; margin: 0; }
        :global(.dark-mode) .quick-action-text h4 { color: #f0f6fc; }
        :global(.dark-mode) .quick-action-text p { color: #8b949e; }
        .quick-action-item button { all: unset; }

        /* Lease Details */
        .lease-details { padding: 20px; }
        .lease-detail-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
        .lease-detail-item:last-child { border: none; }
        :global(.dark-mode) .lease-detail-item { border-color: #30363d; }
        .item-label { font-weight: 500; color: #64748b; }
        .item-value { font-weight: 600; color: #1e293b; }
        .item-value.tenant-name { color: #4f46e5; }
        :global(.dark-mode) .item-label { color: #8b949e; }
        :global(.dark-mode) .item-value { color: #f0f6fc; }
        :global(.dark-mode) .item-value.tenant-name { color: #7c66f9; }

        /* Responsive */
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
            .page-header { flex-direction: column; align-items: flex-start; gap: 16px; }
            .header-right { width: 100%; }
          .quick-actions-section { padding: 16px; }
          .main-content-grid {
            padding: 24px 16px;
          }
        }
        
        /* ... (existing styles for modals, etc.) */
        .loading-state, .error-state, .empty-state {
          text-align: center;
          padding: 40px;
        }
        .error-state { color: #dc2626; }
        .delete-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.6);
            display: flex;
            justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .delete-modal-container {
          background: white;
          padding: 24px;
          border-radius: 8px;
          width: 90%;
          max-width: 400px;
          text-align: center;
        }
        .delete-modal-container h3 {
          margin-top: 0;
          font-size: 18px;
        }
        .delete-modal-actions {
          margin-top: 24px;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .btn-danger {
            background-color: #dc2626;
            color: white;
        }
        
        .delete-modal-actions button.btn-danger:hover {
          background-color: #dc2626;
        }

        /* Modal Styles for Room Count Editor */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-container {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 900px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h2 {
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          color: #64748b;
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .modal-close:hover {
          background: #f1f5f9;
          color: #1e293b;
        }

        .modal-body {
          padding: 24px;
          max-height: calc(90vh - 80px);
          overflow-y: auto;
        }

        /* Enhanced Quick Actions */
        .quick-actions-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 0 4px;
        }

        .quick-action-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s ease;
          cursor: pointer;
          width: 100%;
          box-sizing: border-box;
          min-height: 60px;
        }

        .quick-action-item:hover {
          border-color: #cbd5e1;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        :global(.dark-mode) .quick-action-item {
          background: #21262d;
          border-color: #30363d;
          color: #c9d1d9;
        }

        :global(.dark-mode) .quick-action-item:hover {
          border-color: #444c56;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .quick-action-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .quick-action-text {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .quick-action-text h4 {
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
          line-height: 1.3;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .quick-action-text p {
          font-size: 11px;
          color: #64748b;
          margin: 0;
          line-height: 1.4;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        :global(.dark-mode) .quick-action-text h4 {
          color: #f0f6fc;
        }

        :global(.dark-mode) .quick-action-text p {
          color: #8b949e;
        }

        /* Enhanced Empty State Styles */
        .empty-rooms-state {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          min-height: 400px;
        }

        .empty-state-content {
          text-align: center;
          max-width: 480px;
        }

        .empty-state-icon {
          margin: 0 auto 24px auto;
          width: 64px;
          height: 64px;
          color: #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .empty-state-title {
          font-size: 24px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 16px 0;
        }

        .empty-state-description {
          font-size: 16px;
          color: #64748b;
          line-height: 1.6;
          margin: 0 0 32px 0;
        }

        .empty-state-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }

        .empty-state-actions .btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 500;
          border-radius: 8px;
          transition: all 0.2s ease;
          text-decoration: none;
          border: none;
          cursor: pointer;
        }

        .empty-state-actions .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .empty-state-actions .btn-primary:hover {
          background: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .empty-state-actions .btn-secondary {
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .empty-state-actions .btn-secondary:hover {
          background: #f9fafb;
          border-color: #9ca3af;
          transform: translateY(-1px);
        }

        .empty-state-help {
          background: #f0f9ff;
          border: 1px solid #e0f2fe;
          border-radius: 8px;
          padding: 16px;
          margin-top: 24px;
        }

        .help-text {
          font-size: 14px;
          color: #0369a1;
          margin: 0;
          line-height: 1.5;
        }

        .help-text strong {
          font-weight: 600;
        }

        /* Highlighted Action Cards */
        .action-card.highlighted {
          border: 2px solid #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
          transform: translateY(-2px);
        }

        .action-card.highlighted .action-title {
          color: #1e40af;
        }

        .action-card.highlighted .action-subtitle {
          color: #3b82f6;
        }

        /* Alert Banner */
        .alert-banner {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 1px solid #f59e0b;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.1);
        }

        .alert-content {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .alert-icon {
          color: #d97706;
          flex-shrink: 0;
        }

        .alert-text {
          flex: 1;
          min-width: 200px;
          color: #92400e;
          font-size: 14px;
          line-height: 1.4;
        }

        .alert-text strong {
          font-weight: 600;
        }

        .alert-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }

        .alert-btn {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .alert-btn.primary {
          background: #d97706;
          color: white;
        }

        .alert-btn.primary:hover {
          background: #b45309;
        }

        .alert-btn.secondary {
          background: white;
          color: #d97706;
          border: 1px solid #d97706;
        }

        .alert-btn.secondary:hover {
          background: #fef3c7;
        }

        @media (max-width: 640px) {
          .empty-rooms-state {
            padding: 40px 16px;
            min-height: 300px;
          }

          .empty-state-title {
            font-size: 20px;
          }

          .empty-state-description {
            font-size: 14px;
          }

          .empty-state-actions {
            flex-direction: column;
            align-items: center;
          }

          .empty-state-actions .btn {
            width: 100%;
            max-width: 280px;
            justify-content: center;
          }

          .alert-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .alert-actions {
            width: 100%;
            justify-content: flex-end;
          }
        }

        @media (max-width: 1024px) {
          .content-grid {
            grid-template-columns: 1fr;
          }
          
          .quick-actions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 12px;
          }
          
          .quick-action-item {
            padding: 16px;
            min-height: 70px;
          }
          
          .quick-action-icon {
            width: 40px;
            height: 40px;
          }
          
          .quick-action-text h4 {
            font-size: 14px;
          }
          
          .quick-action-text p {
            font-size: 12px;
          }
        }

        @media (max-width: 768px) {
          .quick-actions-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          
          .quick-action-item {
            padding: 16px;
            min-height: auto;
          }
          
          .quick-action-text h4 {
            font-size: 15px;
          }
          
          .quick-action-text p {
            font-size: 13px;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}

