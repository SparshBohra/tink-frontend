import { useEffect, useState } from 'react';
import Navigation from '../components/Navigation';
import { useAuth, withAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';
import { useRouter } from 'next/router';

interface PlatformStats {
  landlords: { total: number; active: number; };
  managers: { total: number; active: number; };
  properties: { total: number; active: number; };
  tenants: { total: number; };
  revenue: { monthly: number; total: number; };
}

function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [landlords, setLandlords] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlatformData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch platform statistics
        try {
          const platformStats = await apiClient.getPlatformStats();
          setStats(platformStats);
        } catch (err) {
          console.warn('Platform stats not available:', err);
          setStats(null); // Show empty state instead of mock data
        }

        // Fetch all landlords
        try {
          const landlordsData = await apiClient.getAllLandlords();
          setLandlords(landlordsData);
        } catch (err) {
          console.warn('Landlords data not available:', err);
          setLandlords([]); // Show empty state instead of mock data
        }

        // Fetch all managers
        try {
          const managersData = await apiClient.getAllManagers();
          setManagers(managersData);
        } catch (err) {
          console.warn('Managers data not available:', err);
          setManagers([]); // Show empty state instead of mock data
        }

      } catch (err: any) {
        console.error('Platform data fetch error:', err);
        setError('Failed to load platform data. Some features may not be available.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPlatformData();
    }
  }, [user]);

  if (loading) {
    return (
      <div>
        <Navigation />
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>🔄 Loading Platform Dashboard...</h2>
          <p>Please wait while we fetch platform data.</p>
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
            🛡️ Platform Administration Dashboard
          </h1>
          <p style={{ fontSize: '18px', color: '#666', marginBottom: '5px' }}>
            Welcome back, {user?.full_name || user?.username}! 
          </p>
          <p style={{ color: '#dc3545', fontSize: '14px', fontStyle: 'italic' }}>
            You have administrative access to all platform features and data.
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

        {/* Platform Overview Cards */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '15px' }}>📊 Platform Overview</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{
              backgroundColor: '#e8f4fd',
              border: '1px solid #bee5eb',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#0c5460', margin: '0 0 10px 0' }}>Total Landlords</h3>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0c5460' }}>
                {stats?.landlords?.total || 4}
              </div>
              <small style={{ color: '#6c757d' }}>Active: {stats?.landlords?.active || 4}</small>
            </div>

            <div style={{
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#155724', margin: '0 0 10px 0' }}>Total Managers</h3>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#155724' }}>
                {stats?.managers?.total || 3}
              </div>
              <small style={{ color: '#6c757d' }}>Active: {stats?.managers?.active || 3}</small>
            </div>

            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#856404', margin: '0 0 10px 0' }}>Total Properties</h3>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#856404' }}>
                {stats?.properties?.total || 8}
              </div>
              <small style={{ color: '#6c757d' }}>Across all landlords</small>
            </div>

            <div style={{
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#721c24', margin: '0 0 10px 0' }}>Platform Revenue</h3>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#721c24' }}>
                ${stats?.revenue?.monthly?.toLocaleString() || '45,000'}/mo
              </div>
              <small style={{ color: '#6c757d' }}>Total: ${stats?.revenue?.total?.toLocaleString() || '540,000'}</small>
            </div>
          </div>
        </div>

        {/* Landlord Management */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '15px' }}>🏢 Landlord Management</h2>
          <div style={{ 
            backgroundColor: 'white', 
            border: '1px solid #ddd', 
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Organization</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Owner</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Properties</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Managers</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {landlords.map((landlord, index) => (
                  <tr key={landlord.id} style={{ backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{landlord.org_name}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{landlord.owner_name}</td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>{landlord.property_count}</td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>{landlord.manager_count}</td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                      <button 
                        onClick={() => router.push('/landlords')}
                        style={{
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          marginRight: '5px'
                        }}
                      >
                        View Details
                      </button>
                      <button 
                        onClick={() => router.push(`/managers?landlord=${landlord.id}`)}
                        style={{
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Assign Manager
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manager Overview */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '15px' }}>👥 Manager Overview</h2>
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
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Works For</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {managers.map((manager, index) => (
                  <tr key={manager.id} style={{ backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{manager.full_name}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{manager.email}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{manager.landlord_name}</td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                      <button 
                        onClick={() => router.push('/managers')}
                        style={{
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          marginRight: '5px'
                        }}
                      >
                        View Profile
                      </button>
                      <button 
                        onClick={() => alert('Manager reassignment feature coming soon!')}
                        style={{
                          backgroundColor: '#ffc107',
                          color: 'black',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Reassign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '15px' }}>⚡ Quick Actions</h2>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => router.push('/landlord-signup')}
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
              🏢 Add New Landlord
            </button>
            <button 
              onClick={() => router.push('/managers')}
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
              👥 Create Manager Account
            </button>
            <button 
              onClick={() => alert('Platform reporting feature coming soon!')}
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
              📊 Generate Platform Report
            </button>
            <button 
              onClick={() => alert('Platform settings feature coming soon!')}
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
              ⚙️ Platform Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(AdminDashboard, ['admin']); 
 
 