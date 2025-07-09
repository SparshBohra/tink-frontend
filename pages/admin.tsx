import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '../components/DashboardLayout';
import Navigation from '../components/Navigation';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth, withAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';

interface Landlord {
  id: number;
  username: string;
  email: string;
  full_name: string;
  org_name?: string;
  contact_email?: string;
  is_active: boolean;
  created_at?: string;
  primary_managers?: any[];
}

interface Manager {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  date_joined?: string;
  landlord_id?: number;
}

function AdminPanel() {
  const { user } = useAuth();
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [allManagers, setAllManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'landlords' | 'managers' | 'system'>('landlords');

  useEffect(() => {
    if (user?.role !== 'admin') return;
    fetchAdminData();
  }, [user]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all landlords
      try {
        const landlordsResponse = await apiClient.getLandlords();
        setLandlords(landlordsResponse.results || []);
      } catch (err) {
        console.warn('Failed to fetch landlords:', err);
      }

      // Fetch all managers using the correct admin method
      try {
        const managersResponse = await apiClient.getAllManagers();
        setAllManagers(managersResponse || []);
      } catch (err) {
        console.warn('Failed to fetch managers:', err);
        // Set empty array instead of trying with landlord ID
        setAllManagers([]);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLandlord = async (landlordId: number) => {
    if (!confirm('Are you sure you want to delete this landlord? This will also affect all their properties and managers.')) return;
    
    try {
      await apiClient.deleteLandlord(landlordId);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete landlord');
    }
  };

  const handleViewLandlord = (landlord: Landlord) => {
    alert(`Landlord Details:\n\nName: ${landlord.full_name}\nOrganization: ${landlord.org_name || 'N/A'}\nEmail: ${landlord.email}\nStatus: ${landlord.is_active ? 'Active' : 'Inactive'}\nUsername: ${landlord.username}`);
  };

  const handleViewManager = (manager: Manager) => {
    alert(`Manager Details:\n\nName: ${manager.full_name}\nEmail: ${manager.email}\nUsername: ${manager.username}\nStatus: ${manager.is_active ? 'Active' : 'Inactive'}\nLandlord ID: ${manager.landlord_id || 'N/A'}\nJoined: ${manager.date_joined ? new Date(manager.date_joined).toLocaleDateString() : 'N/A'}`);
  };

  if (user?.role !== 'admin') {
    return (
      <div>
        <Navigation />
        <div style={{ padding: '20px' }}>
          <h1>🚫 Access Denied</h1>
          <p>This page is only accessible to system administrators.</p>
          <p>Your current role: <strong>{user?.role || 'Unknown'}</strong></p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ color: '#2c3e50', marginBottom: '10px' }}>
            🛡️ Admin Panel - Platform Management
          </h1>
          <p style={{ color: '#666', fontSize: '16px' }}>
            Welcome, {user?.full_name || user?.username}! You have full administrative access to the Tink platform.
          </p>
          <p style={{ color: '#e74c3c', fontSize: '14px', fontStyle: 'italic' }}>
            Manage landlords, oversee all properties, and monitor platform health.
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{ marginBottom: '20px', borderBottom: '2px solid #eee' }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <button
              onClick={() => setActiveTab('landlords')}
              style={{
                padding: '10px 20px',
                border: 'none',
                backgroundColor: activeTab === 'landlords' ? '#007bff' : 'transparent',
                color: activeTab === 'landlords' ? 'white' : '#666',
                borderBottom: activeTab === 'landlords' ? '2px solid #007bff' : 'none',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🏢 Landlords ({landlords.length})
            </button>
            <button
              onClick={() => setActiveTab('managers')}
              style={{
                padding: '10px 20px',
                border: 'none',
                backgroundColor: activeTab === 'managers' ? '#007bff' : 'transparent',
                color: activeTab === 'managers' ? 'white' : '#666',
                borderBottom: activeTab === 'managers' ? '2px solid #007bff' : 'none',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              👥 All Managers ({allManagers.length})
            </button>
            <button
              onClick={() => setActiveTab('system')}
              style={{
                padding: '10px 20px',
                border: 'none',
                backgroundColor: activeTab === 'system' ? '#007bff' : 'transparent',
                color: activeTab === 'system' ? 'white' : '#666',
                borderBottom: activeTab === 'system' ? '2px solid #007bff' : 'none',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ⚙️ System Health
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div style={{ color: 'red', padding: '20px', border: '1px solid red', marginBottom: '20px' }}>
            <strong>Error:</strong> {error}
          </div>
        ) : (
          <>
            {/* Landlords Tab */}
            {activeTab === 'landlords' && (
              <div>
                <h2>🏢 Platform Landlords</h2>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                  Manage all landlords on the platform. Each landlord can have multiple properties and managers.
                </p>
                
                {landlords.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <h3>No landlords found</h3>
                    <p>No landlords are currently registered on the platform.</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>ID</th>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Organization</th>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Contact Email</th>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Managers</th>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Created</th>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {landlords.map(landlord => (
                        <tr key={landlord.id}>
                          <td style={{ padding: '12px', border: '1px solid #ddd' }}>{landlord.id}</td>
                          <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                            <strong>{landlord.org_name}</strong>
                          </td>
                          <td style={{ padding: '12px', border: '1px solid #ddd' }}>{landlord.email}</td>
                          <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                            {landlord.primary_managers?.length || 0} managers
                          </td>
                          <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                            {landlord.created_at ? new Date(landlord.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                            <button
                              onClick={() => handleDeleteLandlord(landlord.id)}
                              style={{
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                padding: '5px 10px',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              🗑️ Delete
                            </button>
                            <button
                              onClick={() => handleViewLandlord(landlord)}
                              style={{
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                padding: '5px 10px',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                marginLeft: '5px'
                              }}
                            >
                              🔍 View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Managers Tab */}
            {activeTab === 'managers' && (
              <div>
                <h2>👥 All Platform Managers</h2>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                  Overview of all managers across all landlords on the platform.
                </p>
                
                {allManagers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <h3>No managers found</h3>
                    <p>No managers are currently registered on the platform.</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>ID</th>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Name</th>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Email</th>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Username</th>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Landlord</th>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allManagers.map(manager => (
                        <tr key={manager.id}>
                          <td style={{ padding: '12px', border: '1px solid #ddd' }}>{manager.id}</td>
                          <td style={{ padding: '12px', border: '1px solid #ddd' }}>{manager.full_name}</td>
                          <td style={{ padding: '12px', border: '1px solid #ddd' }}>{manager.email}</td>
                          <td style={{ padding: '12px', border: '1px solid #ddd' }}>{manager.username}</td>
                          <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                            Landlord ID: {manager.landlord_id || 'N/A'}
                          </td>
                          <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                            <button
                              onClick={() => handleViewManager(manager)}
                              style={{
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                padding: '5px 10px',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              🔍 View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* System Health Tab */}
            {activeTab === 'system' && (
              <div>
                <h2>⚙️ System Health & Monitoring</h2>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                  Platform statistics and health monitoring.
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  <div style={{
                    backgroundColor: '#d4edda',
                    border: '1px solid #c3e6cb',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center'
                  }}>
                    <h3 style={{ color: '#155724', margin: '0 0 10px 0' }}>Total Landlords</h3>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#155724' }}>
                      {landlords.length}
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: '#cce5ff',
                    border: '1px solid #99d6ff',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center'
                  }}>
                    <h3 style={{ color: '#004085', margin: '0 0 10px 0' }}>Total Managers</h3>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#004085' }}>
                      {allManagers.length}
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffeaa7',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center'
                  }}>
                    <h3 style={{ color: '#856404', margin: '0 0 10px 0' }}>Platform Status</h3>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#856404' }}>
                      🟢 Operational
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <h3>🔧 Admin Actions</h3>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button style={{
                      padding: '10px 20px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}>
                      📊 Export Platform Data
                    </button>
                    <button style={{
                      padding: '10px 20px',
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}>
                      🔄 Refresh System Cache
                    </button>
                    <button style={{
                      padding: '10px 20px',
                      backgroundColor: '#6f42c1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}>
                      📧 Send Platform Notifications
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default withAuth(AdminPanel, ['admin']); 