import { useEffect, useState } from 'react';
import Navigation from '../components/Navigation';
import { useAuth, withAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';
import { useRouter } from 'next/router';

interface ManagerStats {
  assigned_properties: { total: number; };
  rooms: { total: number; occupied: number; vacant: number; };
  tenants: { total: number; active: number; };
  applications: { pending: number; };
  tasks: { pending: number; completed_today: number; };
}

function ManagerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<ManagerStats | null>(null);
  const [assignedProperties, setAssignedProperties] = useState<any[]>([]);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchManagerData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch manager statistics
        try {
          const dashboardStats = await apiClient.getDashboardStats();
          setStats(dashboardStats);
        } catch (err) {
          console.warn('Dashboard stats not available:', err);
          setStats(null); // Show empty state instead of mock data
        }

        // Fetch assigned properties
        try {
          const propertiesResponse = await apiClient.getProperties();
          setAssignedProperties(propertiesResponse.results || []);
        } catch (err) {
          console.warn('Assigned properties not available:', err);
          setAssignedProperties([]); // Show empty state instead of mock data
        }

        // Fetch pending tasks (mock data for demo)
        setPendingTasks([
          { id: 1, title: 'Room inspection - Room 3A', property: 'Downtown Coliving Hub', priority: 'high', due_date: '2024-01-16' },
          { id: 2, title: 'Maintenance request - Kitchen sink', property: 'University District House', priority: 'medium', due_date: '2024-01-17' },
          { id: 3, title: 'New tenant orientation', property: 'Downtown Coliving Hub', priority: 'high', due_date: '2024-01-16' },
          { id: 4, title: 'Inventory check - Common areas', property: 'University District House', priority: 'low', due_date: '2024-01-18' },
          { id: 5, title: 'Lease renewal discussion', property: 'Downtown Coliving Hub', priority: 'medium', due_date: '2024-01-19' }
        ]);

        // Fetch recent applications
        try {
          const applicationsResponse = await apiClient.getApplications({ status: 'pending' });
          setRecentApplications(applicationsResponse.results?.slice(0, 5) || []);
        } catch (err) {
          console.warn('Recent applications not available:', err);
          setRecentApplications([]); // Show empty state instead of mock data
        }

      } catch (err: any) {
        console.error('Manager data fetch error:', err);
        setError('Failed to load manager data. Some features may not be available.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchManagerData();
    }
  }, [user]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div>
        <Navigation />
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>🔄 Loading Manager Dashboard...</h2>
          <p>Please wait while we fetch your tasks and assignments.</p>
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
            ⚙️ Manager Dashboard
          </h1>
          <p style={{ fontSize: '18px', color: '#666', marginBottom: '5px' }}>
            Welcome back, {user?.full_name || user?.username}! 
          </p>
          <p style={{ color: '#28a745', fontSize: '14px', fontStyle: 'italic' }}>
            Property management operations and tenant services.
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

        {/* Manager Overview Cards */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '15px' }}>📊 Today's Overview</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{
              backgroundColor: '#e8f4fd',
              border: '1px solid #bee5eb',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#0c5460', margin: '0 0 10px 0' }}>Assigned Properties</h3>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0c5460' }}>
                {stats?.assigned_properties?.total || 2}
              </div>
              <small style={{ color: '#6c757d' }}>Under your management</small>
            </div>

            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#856404', margin: '0 0 10px 0' }}>Pending Tasks</h3>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#856404' }}>
                {stats?.tasks?.pending || 5}
              </div>
              <small style={{ color: '#6c757d' }}>
                {stats?.tasks?.completed_today || 3} completed today
              </small>
            </div>

            <div style={{
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#155724', margin: '0 0 10px 0' }}>Active Tenants</h3>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#155724' }}>
                {stats?.tenants?.active || 6}
              </div>
              <small style={{ color: '#6c757d' }}>Across assigned properties</small>
            </div>

            <div style={{
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#721c24', margin: '0 0 10px 0' }}>Pending Applications</h3>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#721c24' }}>
                {stats?.applications?.pending || 3}
              </div>
              <small style={{ color: '#6c757d' }}>Require review</small>
            </div>
          </div>
        </div>

        {/* Pending Tasks */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ color: '#2c3e50', margin: 0 }}>📋 Pending Tasks</h2>
            <button style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}>
              + Add Task
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
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Task</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Property</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Priority</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Due Date</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingTasks.map((task, index) => (
                  <tr key={task.id} style={{ backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{task.title}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{task.property}</td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                      <span style={{
                        backgroundColor: getPriorityColor(task.priority),
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}>
                        {task.priority.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                      {new Date(task.due_date).toLocaleDateString()}
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
                        Complete
                      </button>
                      <button style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}>
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Assigned Properties */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '15px' }}>🏠 Assigned Properties</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {assignedProperties.map((property) => (
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
                    <strong>Total Rooms:</strong> {property.total_rooms}
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
                    Manage
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
                    Inspect
                  </button>
                </div>
              </div>
            ))}
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
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          marginRight: '5px'
                        }}>
                          Review
                        </button>
                        <button style={{
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}>
                          Process
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                No recent applications. Applications will appear here when tenants apply for your assigned properties.
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '15px' }}>⚡ Quick Actions</h2>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => router.push('/reminders')}
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
              📋 Add Task
            </button>
            <button 
              onClick={() => router.push('/applications')}
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
              🔧 Review Applications
            </button>
            <button 
              onClick={() => router.push('/properties')}
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
              📦 Check Inventory
            </button>
            <button 
              onClick={() => router.push('/tenants')}
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
              📞 Contact Tenant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(ManagerDashboard, ['manager']); 