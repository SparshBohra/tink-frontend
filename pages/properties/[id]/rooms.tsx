import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { apiClient } from '../../../lib/api';
import { Property, Room, Tenant, Lease } from '../../../lib/types';
import Navigation from '../../../components/Navigation';
import DashboardLayout from '../../../components/DashboardLayout';
import MetricCard from '../../../components/MetricCard';
import SectionCard from '../../../components/SectionCard';
import DataTable from '../../../components/DataTable';
import StatusBadge from '../../../components/StatusBadge';
import EmptyState from '../../../components/EmptyState';
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

  if (loading) {
    return (
      <>
        <Navigation />
        <DashboardLayout
          title="Property Rooms"
          subtitle="Loading property details..."
        >
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
            <p>Fetching property and room information...</p>
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

  if (error || !property) {
    return (
      <>
        <Navigation />
        <DashboardLayout
          title="Property Not Found"
          subtitle="Unable to load property details"
        >
          <div className="alert alert-error">
            <strong>Error:</strong> {error || 'Property not found'}
          </div>
          <div className="actions-container">
            <Link href="/properties" className="btn btn-secondary">
              Back to Properties
            </Link>
          </div>
        </DashboardLayout>
      </>
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
      rent: lease ? (
        <strong>{formatCurrency(lease.monthly_rent)}</strong>
      ) : (
        <span style={{ color: 'var(--gray-600)' }}>-</span>
      ),
      type: 'Standard Room',
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
              <Link href="/applications">
                <button className="btn btn-success btn-sm">
                  Find Tenant
                </button>
              </Link>
              <button 
                onClick={() => alert('Room editing feature coming soon!')}
                className="btn btn-warning btn-sm"
              >
                Edit Room
              </button>
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
      <Navigation />
      
      <DashboardLayout
        title={property.name}
        subtitle={property.full_address}
      >
        {error && <div className="alert alert-error">{error}</div>}
        
        {/* Back Button */}
        <div className="actions-container" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <button 
            onClick={() => router.back()}
            className="btn btn-secondary"
          >
            Back
          </button>
        </div>

        {/* Property Stats */}
        <div className="metrics-grid">
          <MetricCard 
            title="Total Rooms" 
            value={stats.totalRooms}
            color="blue"
          />
          
          <MetricCard 
            title="Occupied" 
            value={stats.occupiedRooms}
            color="green"
          />
          
          <MetricCard 
            title="Vacant" 
            value={stats.vacantRooms}
            color="amber"
          />
          
          <MetricCard 
            title="Occupancy Rate" 
            value={`${stats.occupancyRate}%`}
            color="purple"
          />
          
          <MetricCard 
            title="Monthly Revenue" 
            value={formatCurrency(totalRevenue)}
            color="amber"
          />
        </div>

        {/* Property Information */}
        <SectionCard
          title="Property Information"
          subtitle="Basic property details and overview"
        >
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
              <strong>Total Rooms:</strong><br />
              {stats.totalRooms} rooms
            </div>
            <div className="info-item">
              <strong>Landlord:</strong><br />
              {property.landlord_name || 'Not specified'}
            </div>
          </div>
        </SectionCard>

        {/* Rooms List */}
        <SectionCard
          title="Room Details"
          subtitle="Overview of all rooms in this property"
        >
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
        </SectionCard>

        {/* Quick Actions */}
        <SectionCard
          title="Quick Actions"
          subtitle="Common property management tasks"
        >
          <div className="actions-grid">
            <Link href={`/properties/${id}/add-room`} className="btn btn-success">
              Add New Room
            </Link>
            <Link href={`/applications?property=${id}`} className="btn btn-primary">
              Review Applications for This Property
            </Link>
            <Link href="/inventory" className="btn btn-secondary">
              Manage Inventory
            </Link>
            <Link href="/leases" className="btn btn-primary">
              View Leases
            </Link>
            <Link href="/properties" className="btn btn-secondary">
              All Properties
            </Link>
          </div>
        </SectionCard>
      </DashboardLayout>

      <style jsx>{`
        .property-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--spacing-lg);
        }
        
        .info-item {
          padding: var(--spacing-md);
          background: var(--gray-50);
          border-radius: var(--border-radius);
          border: 1px solid var(--gray-200);
        }
        
        .actions-grid {
          display: flex;
          gap: var(--spacing-md);
          flex-wrap: wrap;
        }
        
        .btn-sm {
          padding: var(--spacing-xs) var(--spacing-sm);
          font-size: var(--font-size-sm);
        }
      `}</style>
    </>
  );
} 