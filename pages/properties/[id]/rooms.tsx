import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { apiClient } from '../../../lib/api';
import { Property, Room, Tenant, Lease } from '../../../lib/types';
import Navigation from '../../../components/Navigation';
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
      <div>
        <Navigation />
        <h1>Loading Property Details...</h1>
        <p>Fetching property and room information...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div>
        <Navigation />
        <h1>Property Not Found</h1>
        <div style={{ 
          color: 'red', 
          border: '1px solid red', 
          padding: '15px', 
          marginBottom: '20px',
          backgroundColor: '#ffebee'
        }}>
          <strong>Error:</strong> {error || 'Property not found'}
        </div>
        <Link href="/properties">
          <button style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}>
            ← Back to Properties
          </button>
        </Link>
      </div>
    );
  }

  const stats = getOccupancyStats();
  const totalRevenue = getTotalRevenue();

  return (
    <div>
      <Navigation />
      
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <button style={{
          padding: '8px 16px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '15px'
        }}
        onClick={() => router.back()}
        >
          ← Back
        </button>
        <h1>🏠 {property.name}</h1>
        <p style={{ color: '#666', fontSize: '16px' }}>{property.full_address}</p>
      </div>

      {/* Property Stats */}
      <div style={{
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '15px', 
        marginBottom: '30px'
      }}>
        <div style={{
          border: '1px solid #ddd', 
          padding: '20px', 
          borderRadius: '8px', 
          backgroundColor: '#f8f9fa',
          textAlign: 'center'
        }}>
          <h3 style={{margin: '0 0 10px 0', color: '#007bff'}}>Total Rooms</h3>
          <div style={{fontSize: '32px', fontWeight: 'bold', color: '#007bff'}}>{stats.totalRooms}</div>
        </div>
        
        <div style={{
          border: '1px solid #ddd', 
          padding: '20px', 
          borderRadius: '8px', 
          backgroundColor: '#f8f9fa',
          textAlign: 'center'
        }}>
          <h3 style={{margin: '0 0 10px 0', color: '#28a745'}}>Occupied</h3>
          <div style={{fontSize: '32px', fontWeight: 'bold', color: '#28a745'}}>{stats.occupiedRooms}</div>
        </div>
        
        <div style={{
          border: '1px solid #ddd', 
          padding: '20px', 
          borderRadius: '8px', 
          backgroundColor: '#f8f9fa',
          textAlign: 'center'
        }}>
          <h3 style={{margin: '0 0 10px 0', color: '#dc3545'}}>Vacant</h3>
          <div style={{fontSize: '32px', fontWeight: 'bold', color: '#dc3545'}}>{stats.vacantRooms}</div>
        </div>
        
        <div style={{
          border: '1px solid #ddd', 
          padding: '20px', 
          borderRadius: '8px', 
          backgroundColor: '#f8f9fa',
          textAlign: 'center'
        }}>
          <h3 style={{margin: '0 0 10px 0', color: '#6f42c1'}}>Occupancy Rate</h3>
          <div style={{fontSize: '32px', fontWeight: 'bold', color: '#6f42c1'}}>{stats.occupancyRate}%</div>
        </div>
        
        <div style={{
          border: '1px solid #ddd', 
          padding: '20px', 
          borderRadius: '8px', 
          backgroundColor: '#f8f9fa',
          textAlign: 'center'
        }}>
          <h3 style={{margin: '0 0 10px 0', color: '#fd7e14'}}>Monthly Revenue</h3>
          <div style={{fontSize: '32px', fontWeight: 'bold', color: '#fd7e14'}}>{formatCurrency(totalRevenue)}</div>
        </div>
      </div>

      {/* Property Details */}
      <div style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        backgroundColor: '#f8f9fa'
      }}>
        <h2>🏢 Property Information</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div>
            <strong>Address:</strong><br />
            {property.full_address}
          </div>
          <div>
            <strong>Property Type:</strong><br />
            {property.property_type || 'Not specified'}
          </div>
          <div>
            <strong>Total Rooms:</strong><br />
            {stats.totalRooms} rooms
          </div>
          <div>
            <strong>Landlord:</strong><br />
            {property.landlord_name || 'Not specified'}
          </div>
        </div>
      </div>

      {/* Rooms List */}
      <div style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h2>🚪 Room Details</h2>
        {rooms.length > 0 ? (
          <table border={1} style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Room</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Current Tenant</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Monthly Rent</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Room Type</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map(room => {
                const lease = getRoomOccupancy(room.id);
                const isOccupied = !!lease;
              
              return (
                  <tr key={room.id} style={{ backgroundColor: isOccupied ? '#d4edda' : '#fff3cd' }}>
                    <td style={{ padding: '12px' }}>
                      <div>
                        <strong>{room.name}</strong>
                        {room.floor && (
                          <>
                        <br />
                            <small style={{ color: '#666' }}>Floor {room.floor}</small>
                          </>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        backgroundColor: isOccupied ? '#28a745' : '#ffc107',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {isOccupied ? '✅ Occupied' : '🟡 Vacant'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {lease ? (
                        <div>
                          <Link href={{ pathname: '/tenants/[id]', query: { id: lease.tenant } }}>
                            <strong style={{ color: '#007bff', cursor: 'pointer' }}>
                              {getTenantName(lease.tenant)}
                            </strong>
                          </Link>
                          <br />
                          <small style={{ color: '#666' }}>
                            Lease: {lease.start_date} to {lease.end_date}
                          </small>
                      </div>
                    ) : (
                        <em style={{ color: '#666' }}>Available for rent</em>
                    )}
                  </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {lease ? (
                        <strong>{formatCurrency(lease.monthly_rent)}</strong>
                      ) : (
                        <span style={{ color: '#666' }}>-</span>
                      )}
                    </td>
                                         <td style={{ padding: '12px', textAlign: 'center' }}>
                       Standard Room
                     </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' }}>
                        {lease ? (
                          <>
                            <Link href={{ pathname: '/tenants/[id]', query: { id: lease.tenant } }}>
                              <button style={{
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}>
                                👤 View Tenant
                              </button>
                            </Link>
                            <Link href={`/inventory?room=${room.id}`}>
                              <button style={{
                                backgroundColor: '#9b59b6',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}>
                                📦 Inventory
                        </button>
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link href="/applications">
                              <button style={{
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}>
                                📋 Find Tenant
                              </button>
                            </Link>
                            <button 
                              onClick={() => alert('Room editing feature coming soon!')}
                              style={{
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              ✏️ Edit Room
                            </button>
                          </>
                        )}
                      </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        ) : (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No rooms found for this property.</p>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <h2>⚡ Quick Actions</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link href={`/properties/${id}/add-room`}>
            <button style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              🚪 Add New Room
            </button>
          </Link>
          <Link href={`/applications?property=${id}`}>
            <button style={{
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              📋 Review Applications for This Property
            </button>
          </Link>
          <Link href="/inventory">
            <button style={{
              backgroundColor: '#9b59b6',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              📦 Manage Inventory
            </button>
          </Link>
          <Link href="/leases">
            <button style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              📜 View Leases
            </button>
          </Link>
          <Link href="/properties">
            <button style={{
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              🏢 All Properties
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
} 