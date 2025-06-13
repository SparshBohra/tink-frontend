import { useEffect, useState } from 'react';
import Navigation from '../components/Navigation';
import { useAuth, withAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';
import { useRouter } from 'next/router';

interface BusinessStats {
  properties: { total: number; occupied: number; vacant: number; };
  rooms: { total: number; occupied: number; vacant: number; occupancy_rate: number; };
  tenants: { total: number; active: number; };
  revenue: { monthly: number; projected_annual: number; };
  managers: { total: number; active: number; };
}

function LandlordDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch business statistics
        try {
          const dashboardStats = await apiClient.getDashboardStats();
          
          // Get real application counts
          const applicationsResponse = await apiClient.getApplications({ status: 'pending' });
          const pendingCount = applicationsResponse.results?.length || 0;
          
          setStats({
            properties: { 
              total: dashboardStats.total_properties || 0, 
              occupied: dashboardStats.total_properties - dashboardStats.available_rooms || 0, 
              vacant: dashboardStats.available_rooms || 0 
            },
            rooms: { 
              total: dashboardStats.total_rooms || 0, 
              occupied: dashboardStats.occupied_rooms || 0, 
              vacant: dashboardStats.available_rooms || 0, 
              occupancy_rate: dashboardStats.occupancy_rate || 0 
            },
            tenants: { total: dashboardStats.total_tenants || 0, active: dashboardStats.total_tenants || 0 },
            revenue: { monthly: dashboardStats.monthly_revenue || 0, projected_annual: (dashboardStats.monthly_revenue || 0) * 12 },
            managers: { total: 0, active: 0 }
          });
        } catch (err) {
          console.warn('Business stats not available:', err);
          setStats(null); // Show empty state instead of mock data
        }

        // Fetch properties
        try {
          const propertiesResponse = await apiClient.getProperties();
          setProperties(propertiesResponse.results || []);
        } catch (err) {
          console.warn('Properties not available:', err);
          setProperties([]); // Show empty state instead of mock data
        }

        // Fetch managers
        try {
          const managersData = await apiClient.getManagersForLandlord(user?.id || 1);
          setManagers(managersData || []);
        } catch (err) {
          console.warn('Managers not available:', err);
          setManagers([]); // Show empty state instead of mock data
        }

        // Fetch recent applications
        try {
          const applicationsResponse = await apiClient.getApplications({ status: 'pending' });
          setRecentApplications(applicationsResponse.results?.slice(0, 3) || []);
        } catch (err) {
          console.warn('Applications not available:', err);
          setRecentApplications([]); // Show empty state instead of mock data
        }

      } catch (err: any) {
        console.error('Business data fetch error:', err);
        setError('Failed to load business data. Some features may not be available.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchBusinessData();
    }
  }, [user]);

  if (loading) {
    return (
      <div>
        <Navigation />
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>🔄 Loading Business Dashboard...</h2>
          <p>Please wait while we fetch your business data.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <div style={{ padding: '20px' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ color: '#2c3e50', marginBottom: '10px' }}>
            💰 Business Dashboard
          </h1>
          <p style={{ fontSize: '18px', color: '#666', marginBottom: '5px' }}>
            Welcome back, {user?.full_name || user?.username}! 
          </p>
          <p style={{ color: '#f39c12', fontSize: '14px', fontStyle: 'italic' }}>
            Managing properties for {user?.org_name || 'your organization'}.
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            color: '#856404',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            <strong>⚠️ Notice:</strong> {error}
          </div>
        )}

        {/* Business Overview Cards */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '15px' }}>📊 Business Overview</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{
              backgroundColor: '#e8f4fd',
              border: '1px solid #bee5eb',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#0c5460', margin: '0 0 10px 0' }}>My Properties</h3>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0c5460' }}>
                {stats?.properties?.total || 0}
              </div>
              <small style={{ color: '#6c757d' }}>
                {stats?.properties?.occupied || 0} occupied, {stats?.properties?.vacant || 0} vacant
              </small>
            </div>

            <div style={{
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#155724', margin: '0 0 10px 0' }}>Total Rooms</h3>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#155724' }}>
                {stats?.rooms?.total || 0}
              </div>
              <small style={{ color: '#6c757d' }}>
                {stats?.rooms?.occupancy_rate?.toFixed(1) || '0'}% occupancy rate
              </small>
            </div>

            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#856404', margin: '0 0 10px 0' }}>Active Tenants</h3>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#856404' }}>
                {stats?.tenants?.active || 0}
              </div>
              <small style={{ color: '#6c757d' }}>Across all properties</small>
            </div>

            <div style={{
              backgroundColor: '#d1ecf1',
              border: '1px solid #bee5eb',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#0c5460', margin: '0 0 10px 0' }}>Monthly Revenue</h3>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0c5460' }}>
                ${stats?.revenue?.monthly?.toLocaleString() || '0'}
              </div>
              <small style={{ color: '#6c757d' }}>
                Projected Annual: ${stats?.revenue?.projected_annual?.toLocaleString() || '0'}
              </small>
            </div>
          </div>
        </div>

        {/* Properties Overview */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ color: '#2c3e50', margin: 0 }}>🏠 My Properties</h2>
            <button 
              onClick={() => router.push('/properties/add')}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              + Add Property
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {properties.map((property) => (
              <div key={property.id} style={{
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h3 style={{ color: '#2c3e50', margin: '0 0 10px 0' }}>{property.name}</h3>
                <p style={{ color: '#666', fontSize: '14px', margin: '0 0 10px 0' }}>{property.full_address}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <span style={{ fontSize: '14px' }}>
                    <strong>Rooms:</strong> {property.total_rooms}
                  </span>
                  <span style={{ fontSize: '14px', color: property.vacant_rooms > 0 ? '#dc3545' : '#28a745' }}>
                    <strong>Vacant:</strong> {property.vacant_rooms}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => router.push(`/properties/${property.id}`)}
                    style={{
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      flex: 1
                    }}
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => router.push(`/properties/${property.id}/rooms`)}
                    style={{
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      flex: 1
                    }}
                  >
                    Manage Rooms
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Management */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ color: '#2c3e50', margin: 0 }}>👥 My Team</h2>
            <button style={{
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}>
              + Hire Manager
            </button>
          </div>
          <div style={{ 
            backgroundColor: 'white', 
            border: '1px solid #ddd', 
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Manager Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Properties</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {managers.length > 0 ? managers.map((manager, index) => (
                  <tr key={manager.id} style={{ backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{manager.full_name}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{manager.email}</td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>{manager.assigned_properties || 'All'}</td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                      <span style={{
                        backgroundColor: manager.status === 'active' ? '#28a745' : '#6c757d',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}>
                        {manager.status?.toUpperCase() || 'ACTIVE'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                      <button style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        marginRight: '5px'
                      }}>
                        View Profile
                      </button>
                      <button style={{
                        backgroundColor: '#ffc107',
                        color: 'black',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}>
                        Reassign
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                      No managers assigned yet. Hire your first manager to help manage your properties.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Applications */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '15px' }}>📋 Recent Applications</h2>
          <div style={{ 
            backgroundColor: 'white', 
            border: '1px solid #ddd', 
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            {recentApplications.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Applicant</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Property</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApplications.map((application, index) => (
                    <tr key={application.id} style={{ backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{application.tenant_name}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{application.property_name}</td>
                      <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                        <span style={{
                          backgroundColor: '#ffc107',
                          color: 'black',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: 'bold'
                        }}>
                          PENDING
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                        {new Date(application.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                        <button style={{
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          marginRight: '5px'
                        }}>
                          Approve
                        </button>
                        <button style={{
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}>
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                No recent applications. Applications will appear here when tenants apply for your properties.
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '15px' }}>⚡ Quick Actions</h2>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => router.push('/properties/add')}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🏠 Add New Property
            </button>
            <button 
              onClick={() => router.push('/managers')}
              style={{
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              👥 Hire Manager
            </button>
            <button 
              onClick={() => alert('Business analytics feature coming soon!')}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              📊 Business Analytics
            </button>
            <button 
              onClick={() => alert('Financial reports feature coming soon!')}
              style={{
                backgroundColor: '#6f42c1',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              💰 Financial Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(LandlordDashboard, ['owner']); 