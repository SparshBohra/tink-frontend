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
    if (property?.rent_type === 'per_property') {
      const lease = getPropertyLevelLease();
      const totalRooms = 1; // The whole property is one "room"
      const occupiedRooms = lease ? 1 : 0;
      const vacantRooms = lease ? 0 : 1;
      const occupancyRate = lease ? '100.0' : '0.0';
      return { totalRooms, occupiedRooms, vacantRooms, occupancyRate };
    }
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
    if (property?.rent_type === 'per_property') {
      const lease = getPropertyLevelLease();
      return lease ? lease.monthly_rent : 0;
    }
    return rooms.reduce((total, room) => {
      const lease = getRoomOccupancy(room.id);
      return total + (lease ? lease.monthly_rent : 0);
    }, 0);
  };

  const getPropertyLevelLease = () => {
    if (!property) return null;
    const today = new Date();
    return leases.find(l => {
      const isProp = l.property_ref === property.id && (!l.room || l.room === 0);
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
        property_id: property.id, 
        platforms: selectedPlatforms.join(','),
        room_id: selectedRoom ? selectedRoom.id : undefined
      });
      setListingSuccess(`Successfully listed on ${selectedPlatforms.join(', ')}.`);
    } catch (err: any) {
      setError(err.message || 'Failed to create listing.');
    } finally {
      setListingLoading(false);
    }
  };

  const openPropertyAssignment = () => {
    if (property?.rent_type === 'per_property') {
    setPropertyAssignmentModalOpen(true);
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

  if (loading) return <DashboardLayout><div className="loading-state">Loading property details...</div></DashboardLayout>;
  if (error) return <DashboardLayout><div className="error-state">Error: {error}</div></DashboardLayout>;
  if (!property) return <DashboardLayout><div className="empty-state">Property not found.</div></DashboardLayout>;

  const { totalRooms, occupiedRooms, vacantRooms, occupancyRate } = getOccupancyStats();
  const totalRevenue = getTotalRevenue();
  const propertyLevelLease = getPropertyLevelLease();

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
                <StatusBadge status={lease ? 'occupied' : 'vacant'} />
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
                    {lease ? (
                        <Link href={`/leases/${lease.id}`} className="btn-action view">View Lease</Link>
                    ) : (
                        <button onClick={() => handleAssignTenant(room)} className="btn-action assign">Assign Tenant</button>
                    )}
                    <div className="more-actions">
                        <button className="btn-action more">•••</button>
                        <div className="dropdown-menu">
                            <Link href={`/properties/${id}/edit-room/${room.id}`}>Edit Room</Link>
                            <button onClick={() => handleDeleteRoom(room.id, room.name)} className="delete">Delete Room</button>
        </div>
                    </div>
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
    <DashboardLayout>
      <Head>
        <title>{property.name} - Rooms | Tink</title>
      </Head>
      <div className="property-rooms-page">
        {/* Header */}
        <div className="page-header">
              <div className="header-left">
                <button onClick={() => router.push('/properties')} className="back-button">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>
                </button>
                <div>
                    <h1 className="page-title">{property.name}</h1>
                    <p className="page-subtitle">{property.full_address}</p>
                </div>
              </div>
              <div className="header-right">
                <button className="btn btn-secondary" onClick={() => setIsNewApplicationModalOpen(true)}>New Application</button>
                <Link href={`/properties/${property.id}/edit`} className="btn btn-primary">Edit Property</Link>
            </div>
          </div>

        {/* Metrics */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                  <h3 className="metric-title">Total Rooms</h3>
                    <div className="metric-icon" style={{background: '#ede9fe'}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
                  </div>
                <div className="metric-value">{totalRooms}</div>
                <div className="metric-footer">
                    <span className="footer-item">{vacantRooms} vacant</span>
                    <span className="footer-item">{occupiedRooms} occupied</span>
                </div>
              </div>
            <div className="metric-card">
              <div className="metric-header">
                  <h3 className="metric-title">Current Occupancy</h3>
                    <div className="metric-icon" style={{background: '#dcfce7'}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
                  </div>
                <div className="metric-value">{occupancyRate}%</div>
                <div className="metric-footer">
                    <span className="footer-item">{occupiedRooms} active tenants</span>
                </div>
              </div>
            <div className="metric-card">
              <div className="metric-header">
                  <h3 className="metric-title">Monthly Revenue</h3>
                    <div className="metric-icon" style={{background: '#dbeafe'}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
                  </div>
                <div className="metric-value">{formatCurrency(totalRevenue)}</div>
                <div className="metric-footer">
                    <span className="footer-item">from all rooms</span>
              </div>
            </div>
          </div>

            <div className="content-grid">
              <div className="left-column">
                {/* Room Details Section */}
                {property.rent_type === 'per_room' && (
                    <div className="card">
                        <div className="card-header">
                            <div>
                                <h2 className="card-title">Room Details ({rooms.length})</h2>
                                <p className="card-subtitle">Overview of all rooms in this property</p>
                    </div>
                            <Link href={`/properties/${id}/add-room`} className="btn btn-primary">Add New Room</Link>
                  </div>
                  {rooms.length > 0 ? (
                            <DataTable
                                columns={[
                                    { header: 'Room Name', key: 'name' },
                                    { header: 'Status', key: 'status' },
                                    { header: 'Tenant', key: 'tenant' },
                                    { header: 'Rent', key: 'rent' },
                                    { header: 'Actions', key: 'actions', style: { textAlign: 'right', paddingRight: '24px' } },
                                ]}
                                data={rooms}
                                renderRow={renderRoomRow}
                            />
                  ) : (
                    <EmptyState
                      title="No Rooms Found"
                      description="No rooms have been added to this property yet."
                                actionText="Add New Room"
                                onAction={() => router.push(`/properties/${id}/add-room`)}
                    />
                  )}
                </div>
                )}
                
                {/* Property-level lease Section */}
                {property.rent_type === 'per_property' && (
                  <div className="card">
                    <div className="card-header">
                      <div>
                        <h2 className="card-title">Lease Details</h2>
                        <p className="card-subtitle">This property is leased as a whole unit.</p>
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
                          <span className="item-value"><StatusBadge status={propertyLevelLease.status as any} /></span>
                        </div>
                      </div>
                    ) : (
                      <EmptyState
                        title="No Active Lease"
                        description="This property is currently vacant."
                        actionText="Assign Tenant"
                        onAction={openPropertyAssignment}
                      />
                    )}
                  </div>
                )}


                {/* Property History Section */}
                <div className="card">
                    <div className="card-header">
                        <div>
                            <h2 className="card-title">Property History</h2>
                            <p className="card-subtitle">Tenant and rent collection history</p>
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
                    </div>
                    {activeHistoryTab === 'tenant' && (
                        leases.length > 0 ? (
                  <DataTable
                    columns={[
                                    { header: 'Tenant', key: 'tenant' },
                                    { header: 'Unit', key: 'unit' },
                                    { header: 'Move In', key: 'move_in' },
                                    { header: 'Move Out', key: 'move_out' },
                                    { header: 'Status', key: 'status' },
                                ]}
                                data={leases}
                                renderRow={renderTenantHistoryRow}
                            />
                        ) : (
                            <EmptyState
                                title="No Tenant History"
                                description="No leases have been recorded for this property yet."
                            />
                        )
                    )}
                    {activeHistoryTab === 'rent' && (
                        <EmptyState
                            title="Rent Collection History Coming Soon"
                            description="This feature is under development."
                        />
                    )}
                </div>
              </div>

              <div className="right-column">
                {/* Property Information Section */}
                <div className="card">
                    <div className="card-header no-border">
                    <div>
                            <h2 className="card-title">Property Information</h2>
                            <p className="card-subtitle">Basic property details and configuration</p>
                    </div>
                  </div>
                    <div className="info-grid">
                        <div className="info-item">
                            <div className="info-icon-wrapper"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
                            <div>
                                <h4 className="info-label">Address</h4>
                      <p className="info-value">{property.full_address}</p>
                    </div>
                        </div>
                        <div className="info-item">
                            <div className="info-icon-wrapper"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
                            <div>
                                <h4 className="info-label">Property Type</h4>
                                <p className="info-value">{property.rent_type === 'per_property' ? 'Single Lease House' : 'Co-living / Per Room'}</p>
                      </div>
                    </div>
                        <div className="info-item">
                            <div className="info-icon-wrapper"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                            <div>
                                <h4 className="info-label">Landlord</h4>
                      <p className="info-value">{property.landlord_name}</p>
                            </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions Card */}
                <div className="card">
                    <div className="card-header no-border">
                       <div>
                            <h2 className="card-title">Quick Actions</h2>
                            <p className="card-subtitle">Common property management tasks</p>
                          </div>
                    </div>
                    <div className="quick-actions-grid">
                        <Link href={`/properties/${property.id}/add-room`} className="quick-action-item">
                            <div className="quick-action-icon" style={{background: '#eff6ff', color: '#3b82f6'}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14m-7-7h14"/></svg></div>
                            <div className="quick-action-text">
                            <h4>Add New Room</h4>
                            <p>Create a new room in this property</p>
                          </div>
                      </Link>
                        <button onClick={() => setIsNewApplicationModalOpen(true)} className="quick-action-item">
                           <div className="quick-action-icon" style={{background: '#f0fdf4', color: '#22c55e'}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
                           <div className="quick-action-text">
                            <h4>Review Applications</h4>
                            <p>Check pending applications</p>
                          </div>
                        </button>
                        <Link href="/inventory" className="quick-action-item">
                          <div className="quick-action-icon" style={{background: '#faf5ff', color: '#a855f7'}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg></div>
                           <div className="quick-action-text">
                            <h4>Manage Inventory</h4>
                            <p>Track property items</p>
                          </div>
                        </Link>
                        <Link href="/leases" className="quick-action-item">
                           <div className="quick-action-icon" style={{background: '#fffbeb', color: '#f59e0b'}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m10.4 12.6 2.8 2.8-2.8 2.8"/></svg></div>
                           <div className="quick-action-text">
                            <h4>View Leases</h4>
                            <p>Manage lease agreements</p>
                          </div>
                      </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

      {assignmentModalOpen && selectedRoomForAssignment && (
        <TenantAssignmentModal
          roomId={selectedRoomForAssignment.id}
          onClose={handleAssignmentModalClose}
          onSave={handleAssignmentModalSave}
        />
      )}

      {propertyAssignmentModalOpen && property && (
        <PropertyTenantAssignmentModal
          propertyId={property.id}
          onClose={closePropertyAssignment}
          onSave={handlePropertyAssignmentSave}
        />
      )}

      {isNewApplicationModalOpen && (
        <NewApplicationModal onClose={() => setIsNewApplicationModalOpen(false)} />
      )}

      {showDeleteModal && roomToDelete && (
        <div className="delete-modal-backdrop">
          <div className="delete-modal-container">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete room "{roomToDelete.name}"? This action cannot be undone.</p>
            <div className="delete-modal-actions">
              <button onClick={cancelDeleteRoom} className="btn btn-secondary" disabled={deleteLoading}>
                Cancel
              </button>
              <button onClick={confirmDeleteRoom} className="btn btn-danger" disabled={deleteLoading}>
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .property-rooms-page {
          padding: 24px;
          background-color: #f8fafc;
          min-height: 100vh;
        }
        :global(.dark-mode) .property-rooms-page {
            background-color: #0d1117;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }
        .header-left {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        .back-button {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 50%;
            width: 40px;
            height: 40px;
          display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: #475569;
        }
        :global(.dark-mode) .back-button {
            background-color: #161b22;
            border-color: #30363d;
            color: #c9d1d9;
        }
        .page-title {
            font-size: 24px;
          font-weight: 700;
            margin: 0;
          color: #1e293b;
        }
        :global(.dark-mode) .page-title {
            color: #f0f6fc;
        }
        .page-subtitle {
          font-size: 14px;
            color: #64748b;
          margin: 0;
        }
        :global(.dark-mode) .page-subtitle {
            color: #8b949e;
        }
        .header-right {
            display: flex;
            gap: 12px;
        }
        .btn {
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
            transition: all 0.2s;
        }
        .btn-primary {
            background-color: #4f46e5;
          color: white;
        }
        .btn-secondary {
            background-color: white;
            color: #475569;
          border: 1px solid #e2e8f0;
        }
        :global(.dark-mode) .btn-secondary {
            background-color: #21262d;
            color: #c9d1d9;
            border-color: #30363d;
        }
        .metrics-grid {
          display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
          margin-bottom: 20px;
        }
        .metric-card {
          background: white;
          border-radius: 6px;
          padding: 14px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
        }
        .metric-card:hover {
          transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        :global(.dark-mode) .metric-card {
            background-color: #161b22;
            border-color: #30363d;
        }
        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
            margin-bottom: 8px;
        }
        .metric-title {
          font-size: 11px;
          font-weight: 600;
            color: #475569;
          margin: 0;
        }
        :global(.dark-mode) .metric-title {
            color: #8b949e;
        }
        .metric-icon {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .metric-value {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
        }
        :global(.dark-mode) .metric-value {
            color: #f0f6fc;
        }
        .metric-footer {
          font-size: 12px;
          color: #64748b;
            display: flex;
            gap: 12px;
            margin-top: 8px;
        }
        :global(.dark-mode) .metric-footer {
            color: #8b949e;
        }
        
        .content-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          align-items: flex-start;
        }
        .card {
            background: white;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            overflow: hidden;
            margin-bottom: 24px;
        }
        :global(.dark-mode) .card {
            background-color: #161b22;
            border-color: #30363d;
        }
        .card-header {
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #e2e8f0;
        }
        .card-header.no-border {
            border-bottom: none;
            padding-bottom: 12px;
        }
        :global(.dark-mode) .card-header {
            border-color: #30363d;
        }
        .card-title {
          font-size: 18px;
          font-weight: 600;
            margin: 0;
            color: #1e293b;
        }
        :global(.dark-mode) .card-title {
            color: #f0f6fc;
        }
        .card-subtitle {
          font-size: 14px;
          color: #64748b;
            margin: 4px 0 0;
        }
        :global(.dark-mode) .card-subtitle {
            color: #8b949e;
        }
        
        /* Table Styles */
        .room-row td { padding: 16px 20px; vertical-align: middle; }
        .room-name { font-weight: 600; color: #1e293b; }
        .room-type { font-size: 12px; color: #64748b; }
        :global(.dark-mode) .room-name { color: #f0f6fc; }
        :global(.dark-mode) .room-type { color: #8b949e; }
        .tenant-info { display: flex; align-items: center; gap: 8px; }
        .tenant-avatar { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 12px; }
        .action-buttons { display: flex; justify-content: flex-end; align-items: center; gap: 8px; }
        .btn-action { font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
        .btn-action.assign { background: #eff6ff; color: #3b82f6; }
        .btn-action.view { background: #f0fdf4; color: #22c55e; }
        .more-actions { position: relative; }
        .dropdown-menu { display: none; position: absolute; right: 0; top: 100%; background: white; border: 1px solid #e2e8f0; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10; padding: 4px; }
        .more-actions:hover .dropdown-menu { display: block; }
        .dropdown-menu button, .dropdown-menu a { display: block; width: 100%; text-align: left; padding: 8px 12px; font-size: 14px; background: none; border: none; cursor: pointer; }
        .dropdown-menu a { text-decoration: none; color: #1e293b; }
        .dropdown-menu button.delete { color: #ef4444; }

        /* History Tabs */
        .history-tabs { display: flex; gap: 4px; background: #f1f5f9; padding: 4px; border-radius: 6px; }
        :global(.dark-mode) .history-tabs { background: #21262d; }
        .tab-btn { background: transparent; border: none; padding: 6px 12px; border-radius: 4px; font-size: 14px; font-weight: 600; color: #475569; cursor: pointer; }
        :global(.dark-mode) .tab-btn { color: #8b949e; }
        .tab-btn.active { background: white; color: #1e293b; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        :global(.dark-mode) .tab-btn.active { background: #30363d; color: #f0f6fc; }
        .history-row td { padding: 12px 20px; font-size: 14px; }
        
        /* Right Column */
        .info-grid { display: flex; flex-direction: column; gap: 16px; padding: 20px; }
        .info-item { display: flex; align-items: flex-start; gap: 12px; }
        .info-icon-wrapper { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; color: #64748b; flex-shrink: 0; }
        :global(.dark-mode) .info-icon-wrapper { background: #21262d; color: #8b949e; }
        .info-label { font-size: 12px; color: #64748b; margin: 0; }
        :global(.dark-mode) .info-label { color: #8b949e; }
        .info-value { font-size: 14px; font-weight: 500; margin: 2px 0 0; color: #1e293b; }
        :global(.dark-mode) .info-value { color: #f0f6fc; }
        
        .quick-actions-grid { display: flex; flex-direction: column; gap: 12px; padding: 20px; }
        .quick-action-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; background: #f8fafc; cursor: pointer; text-decoration: none; border: 1px solid #f8fafc; }
        :global(.dark-mode) .quick-action-item { background: #21262d; border-color: #21262d; }
        .quick-action-item:hover { border-color: #e2e8f0; }
        :global(.dark-mode) .quick-action-item:hover { border-color: #30363d; }
        .quick-action-icon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .quick-action-text h4 { font-size: 14px; font-weight: 600; color: #1e293b; margin: 0 0 2px; }
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
        @media (max-width: 1024px) {
            .content-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
            .metrics-grid { grid-template-columns: 1fr; }
            .page-header { flex-direction: column; align-items: flex-start; gap: 16px; }
            .header-right { width: 100%; }
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
        
        /* ... rest of the modal styles */
      `}</style>
    </DashboardLayout>
  );
}

