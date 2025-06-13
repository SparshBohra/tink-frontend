import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import Link from 'next/link';
import { withAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';
import { Property, Room } from '../lib/types';

function Properties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [propertiesResponse, roomsResponse] = await Promise.all([
        apiClient.getProperties(),
        apiClient.getRooms()
      ]);

      setProperties(propertiesResponse.results || []);
      setRooms(roomsResponse.results || []);
    } catch (error: any) {
      console.error('Failed to fetch properties data:', error);
      setError(error?.message || 'Failed to load properties data');
    } finally {
      setLoading(false);
    }
  };

  const getPropertyStats = (propertyId: number) => {
    const propertyRooms = rooms.filter(room => room.property_ref === propertyId);
    const occupiedRooms = propertyRooms.filter(room => !room.is_vacant);
    const vacantRooms = propertyRooms.filter(room => room.is_vacant);
    const occupancyRate = propertyRooms.length > 0 ? 
      Math.round((occupiedRooms.length / propertyRooms.length) * 100) : 0;
    
    return {
      totalRooms: propertyRooms.length,
      occupiedRooms: occupiedRooms.length,
      vacantRooms: vacantRooms.length,
      occupancyRate
    };
  };

  const downloadPropertiesReport = () => {
    const csvData = [
      ['Property Name', 'Address', 'Total Rooms', 'Occupied', 'Vacant', 'Occupancy Rate'],
      ...properties.map(property => {
        const stats = getPropertyStats(property.id);
        return [
          property.name,
          property.full_address,
          stats.totalRooms.toString(),
          stats.occupiedRooms.toString(),
          stats.vacantRooms.toString(),
          `${stats.occupancyRate}%`
        ];
      })
    ];
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tink-properties-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div>
        <Navigation />
        <h1>Loading Properties...</h1>
        <p>Fetching property data from the server...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navigation />
        <h1>Properties Error</h1>
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

  // Calculate portfolio summary
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(room => !room.is_vacant).length;
  const vacantRooms = rooms.filter(room => room.is_vacant).length;
  const overallOccupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  return (
    <div>
      <Navigation />
      <h1>🏠 Properties Portfolio</h1>
      <p>Manage your properties and track occupancy across your portfolio.</p>
      
      {/* Portfolio Summary Cards */}
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
          <h3 style={{margin: '0 0 10px 0', color: '#27ae60'}}>Total Properties</h3>
          <div style={{fontSize: '32px', fontWeight: 'bold', color: '#27ae60'}}>{properties.length}</div>
        </div>
        
        <div style={{
          border: '1px solid #ddd', 
          padding: '20px', 
          borderRadius: '8px', 
          backgroundColor: '#f8f9fa',
          textAlign: 'center'
        }}>
          <h3 style={{margin: '0 0 10px 0', color: '#3498db'}}>Total Rooms</h3>
          <div style={{fontSize: '32px', fontWeight: 'bold', color: '#3498db'}}>{totalRooms}</div>
        </div>
        
        <div style={{
          border: '1px solid #ddd', 
          padding: '20px', 
          borderRadius: '8px', 
          backgroundColor: '#f8f9fa',
          textAlign: 'center'
        }}>
          <h3 style={{margin: '0 0 10px 0', color: '#e74c3c'}}>Vacant Rooms</h3>
          <div style={{fontSize: '32px', fontWeight: 'bold', color: '#e74c3c'}}>{vacantRooms}</div>
        </div>
        
        <div style={{
          border: '1px solid #ddd', 
          padding: '20px', 
          borderRadius: '8px', 
          backgroundColor: '#f8f9fa',
          textAlign: 'center'
        }}>
          <h3 style={{margin: '0 0 10px 0', color: '#f39c12'}}>Occupancy Rate</h3>
          <div style={{fontSize: '32px', fontWeight: 'bold', color: '#f39c12'}}>{overallOccupancyRate}%</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{marginBottom: '20px'}}>
        <Link href="/properties/add">
          <button style={{
            backgroundColor: '#28a745', 
            color: 'white', 
            padding: '10px 15px', 
            border: 'none', 
            borderRadius: '5px',
            marginRight: '10px',
            cursor: 'pointer'
          }}
        >
          ➕ Register New Property
        </button>
        </Link>
        <button 
          onClick={downloadPropertiesReport}
          style={{
            backgroundColor: '#28a745', 
            color: 'white', 
            padding: '10px 15px', 
            border: 'none', 
            borderRadius: '5px',
            marginRight: '10px',
            cursor: 'pointer'
          }}
        >
          📊 Download Report
          </button>
        <button 
          onClick={fetchData}
          style={{
            backgroundColor: '#6c757d', 
            color: 'white', 
            padding: '10px 15px', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🔄 Refresh
          </button>
        </div>

      {/* Properties Table */}
      <div style={{marginBottom: '30px'}}>
        <h2>📋 Properties Overview</h2>
        {properties.length > 0 ? (
          <table border={1} style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{backgroundColor: '#f8f9fa'}}>
                <th style={{padding: '12px', textAlign: 'left'}}>Property</th>
                <th style={{padding: '12px', textAlign: 'center'}}>Rooms</th>
                <th style={{padding: '12px', textAlign: 'center'}}>Occupancy</th>
                <th style={{padding: '12px', textAlign: 'center'}}>Status</th>
                <th style={{padding: '12px', textAlign: 'center'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map(property => {
                const stats = getPropertyStats(property.id);
                const needsAttention = stats.occupancyRate < 80;
                
              return (
                  <tr key={property.id} style={{
                    backgroundColor: needsAttention ? '#fff3cd' : 'white'
                  }}>
                    <td style={{padding: '12px'}}>
                      <div>
                        <strong style={{fontSize: '16px'}}>{property.name}</strong>
                        <br />
                        <small style={{color: '#666'}}>{property.full_address}</small>
                        {property.landlord_name && (
                          <>
                    <br />
                            <small style={{color: '#888'}}>Landlord: {property.landlord_name}</small>
                          </>
                        )}
                      </div>
                  </td>
                    <td style={{padding: '12px', textAlign: 'center'}}>
                      <div style={{fontSize: '18px', fontWeight: 'bold'}}>{stats.totalRooms}</div>
                      <small style={{color: '#666'}}>
                        {stats.occupiedRooms} occupied, {stats.vacantRooms} vacant
                      </small>
                  </td>
                    <td style={{padding: '12px', textAlign: 'center'}}>
                      <div style={{
                        fontSize: '18px', 
                        fontWeight: 'bold',
                        color: stats.occupancyRate >= 90 ? '#27ae60' : 
                               stats.occupancyRate >= 70 ? '#f39c12' : '#e74c3c'
                      }}>
                        {stats.occupancyRate}%
                      </div>
                      <div style={{
                        width: '100px',
                        height: '8px',
                        backgroundColor: '#e0e0e0',
                        borderRadius: '4px',
                        margin: '5px auto',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${stats.occupancyRate}%`,
                          height: '100%',
                          backgroundColor: stats.occupancyRate >= 90 ? '#27ae60' : 
                                         stats.occupancyRate >= 70 ? '#f39c12' : '#e74c3c',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </td>
                    <td style={{padding: '12px', textAlign: 'center'}}>
                      {stats.vacantRooms > 0 ? (
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          backgroundColor: '#fff3cd',
                          color: '#856404'
                        }}>
                          {stats.vacantRooms} vacant
                        </span>
                      ) : (
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          backgroundColor: '#d4edda',
                          color: '#155724'
                        }}>
                          Fully occupied
                        </span>
                    )}
                  </td>
                    <td style={{padding: '12px', textAlign: 'center'}}>
                      <div style={{display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap'}}>
                    <Link href={`/properties/${property.id}/rooms`}>
                          <button style={{
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}>
                            🏠 View Rooms
                          </button>
                        </Link>
                        {stats.vacantRooms > 0 && (
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
                              📋 Fill Rooms
                            </button>
                    </Link>
                        )}
                      </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        ) : (
          <div style={{
            textAlign: 'center', 
            padding: '40px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px'
          }}>
            <h3>No Properties Found</h3>
            <p>Add your first property to get started with property management.</p>
            <button style={{
              backgroundColor: '#28a745',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}>
              + Add Property
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{marginTop: '30px'}}>
        <h2>⚡ Quick Actions</h2>
        <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
          <Link href="/applications">
            <button style={{
              backgroundColor: '#e74c3c', 
              color: 'white', 
              padding: '12px 20px', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              📋 Review Applications
            </button>
          </Link>
          <Link href="/tenants">
            <button style={{
              backgroundColor: '#3498db', 
              color: 'white', 
              padding: '12px 20px', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              👥 Manage Tenants
            </button>
          </Link>
          <Link href="/leases">
            <button style={{
              backgroundColor: '#f39c12', 
              color: 'white', 
              padding: '12px 20px', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              📜 View Leases
            </button>
          </Link>
          <Link href="/inventory">
            <button style={{
              backgroundColor: '#9b59b6', 
              color: 'white', 
              padding: '12px 20px', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              📦 Check Inventory
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
} 

export default withAuth(Properties, ['admin', 'owner', 'manager']);