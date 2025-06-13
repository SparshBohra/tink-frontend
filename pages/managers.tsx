import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';
import { withAuth } from '../lib/auth-context';
import Navigation from '../components/Navigation';

interface Manager {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  date_joined?: string;
}

interface ManagerFormData {
  full_name: string;
  email: string;
  username: string;
  password: string;
  landlord_id?: number;
}

function ManagersPage() {
  const { user, isAdmin, isLandlord } = useAuth();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [formData, setFormData] = useState<ManagerFormData>({
    full_name: '',
    email: '',
    username: '',
    password: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [newManagerCredentials, setNewManagerCredentials] = useState<{
    username: string;
    password: string;
    full_name: string;
  } | null>(null);
  const [landlordId, setLandlordId] = useState<number | null>(null);

  useEffect(() => {
    fetchManagers();
  }, []);

  // Fetch landlord profile to get landlordId for owners
  useEffect(() => {
    const init = async () => {
      if (isLandlord()) {
        try {
          const profile = await apiClient.getLandlordProfile();
          if (profile && profile.id) {
            setLandlordId(profile.id);
          }
        } catch (err) {
          console.error('Failed to fetch landlord profile:', err);
        }
      }
    };
    init();
  }, [isLandlord]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchManagers();
    } else if (user?.role === 'owner' && landlordId) {
      fetchManagers();
    }
  }, [user, landlordId]);

  const fetchManagers = async () => {
    try {
      setLoading(true);
      let managersData: Manager[] = [];
      
      if (user?.role === 'admin') {
        // Admin can see all managers
        managersData = await apiClient.getAllManagers();
      } else if (user?.role === 'owner' && landlordId) {
        managersData = await apiClient.getManagersForLandlord(landlordId);
      }
      
      setManagers(managersData);
    } catch (error) {
      console.error('Failed to fetch managers:', error);
      setError('Failed to load managers. Please check your permissions.');
      setManagers([]); // Show empty state instead of mock data
    } finally {
      setLoading(false);
    }
  };

  const handleAssignManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      setFormLoading(true);
      setError(null);

      // Generate a secure password if not provided
      const password = formData.password || generateSecurePassword();
      
      const managerData = {
        ...formData,
        password
      };

      let newManager: Manager;
      
      if (user?.role === 'owner' && landlordId) {
        // Landlord creates manager for their business
        newManager = await apiClient.inviteManager(landlordId, managerData);
      } else {
        // Admin creates manager for selected landlord
        if (!formData.landlord_id) {
          alert('Please provide landlord ID to assign manager');
          return;
        }
        newManager = await apiClient.inviteManager(formData.landlord_id, managerData);
      }

      // Store credentials for sharing
      setNewManagerCredentials({
        username: managerData.username,
        password: password,
        full_name: managerData.full_name
      });

      // Reset form and refresh list
      setFormData({
        full_name: '',
        email: '',
        username: '',
        password: ''
      });
      setShowAssignForm(false);
      await fetchManagers();

    } catch (error: any) {
      console.error('Failed to create manager:', error);
      setError(error.message || 'Failed to create manager account');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteManager = async (managerId: number, managerName: string) => {
    if (!confirm(`Are you sure you want to delete manager "${managerName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiClient.deleteManager(managerId);
      await fetchManagers();
    } catch (error: any) {
      console.error('Failed to delete manager:', error);
      setError(error.message || 'Failed to delete manager');
    }
  };

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const getLoginTemplate = (credentials: { username: string; password: string; full_name: string }) => {
    return `Hi ${credentials.full_name},

Your Tink Property Management account has been created!

Login Details:
• Website: ${window.location.origin}/login
• Username: ${credentials.username}
• Password: ${credentials.password}

Please log in and change your password after your first login.

Best regards,
${user?.full_name || 'Your Team'}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Login details copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy to clipboard. Please copy manually.');
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '18px', color: '#666' }}>Loading managers...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '30px',
          borderBottom: '2px solid #e9ecef',
          paddingBottom: '15px'
        }}>
          <div>
            <h1 style={{ margin: '0', color: '#2c3e50', fontSize: '28px' }}>
              👥 {user?.role === 'admin' ? 'All Managers' : 'My Team'}
            </h1>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '16px' }}>
              {user?.role === 'admin' 
                ? 'Manage all property managers across the platform' 
                : 'Manage your property management team'
              }
            </p>
          </div>
          <button
            onClick={() => setShowAssignForm(true)}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            ➕ Assign Manager
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}

        {/* New Manager Credentials Modal */}
        {newManagerCredentials && (
          <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <h3 style={{ color: '#28a745', marginBottom: '20px' }}>
                ✅ Manager Account Created Successfully!
              </h3>
              
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontFamily: 'monospace',
                fontSize: '14px',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {getLoginTemplate(newManagerCredentials)}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => copyToClipboard(getLoginTemplate(newManagerCredentials))}
                  style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  📋 Copy Details
                </button>
                <button
                  onClick={() => setNewManagerCredentials(null)}
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Manager Form Modal */}
        {showAssignForm && (
          <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '90%'
            }}>
              <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>
                ➕ Assign New Manager
              </h3>
              
              <form onSubmit={handleAssignManager}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '16px'
                    }}
                    placeholder="Enter manager's full name"
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '16px'
                    }}
                    placeholder="manager@example.com"
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Username *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '16px'
                    }}
                    placeholder="Choose a username"
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Password (optional)
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '16px'
                    }}
                    placeholder="Leave blank to auto-generate"
                  />
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    If left blank, a secure password will be generated automatically
                  </small>
                </div>

                {user?.role === 'admin' && (
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Landlord ID *
                    </label>
                    <input
                      type="number"
                      value={formData.landlord_id || ''}
                      onChange={(e) => setFormData({...formData, landlord_id: Number(e.target.value)})}
                      required
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '16px'
                      }}
                      placeholder="Enter landlord ID"
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowAssignForm(false)}
                    disabled={formLoading}
                    style={{
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    style={{
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: formLoading ? 'not-allowed' : 'pointer',
                      opacity: formLoading ? 0.7 : 1
                    }}
                  >
                    {formLoading ? 'Creating...' : 'Create Manager'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Managers List */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {managers.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>👥</div>
              <h3>No Managers Assigned</h3>
              <p>Click "Assign Manager" to add your first team member.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>
                      Manager
                    </th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>
                      Contact
                    </th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>
                      Status
                    </th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>
                      Joined
                    </th>
                    <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {managers.map((manager) => (
                    <tr key={manager.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '15px' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                            {manager.full_name}
                          </div>
                          <div style={{ fontSize: '14px', color: '#666' }}>
                            @{manager.username}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ color: '#666' }}>
                          {manager.email}
                        </div>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{
                          backgroundColor: manager.is_active ? '#d4edda' : '#f8d7da',
                          color: manager.is_active ? '#155724' : '#721c24',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {manager.is_active ? '✅ Active' : '❌ Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '15px', color: '#666' }}>
                        {manager.date_joined 
                          ? new Date(manager.date_joined).toLocaleDateString()
                          : 'N/A'
                        }
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleDeleteManager(manager.id, manager.full_name)}
                          style={{
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                          title="Delete Manager"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div style={{
          marginTop: '30px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}>
          <div style={{
            backgroundColor: '#e8f5e8',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
              {managers.filter(m => m.is_active).length}
            </div>
            <div style={{ color: '#666', fontSize: '14px' }}>Active Managers</div>
          </div>
          
          <div style={{
            backgroundColor: '#fff3cd',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#856404' }}>
              {managers.length}
            </div>
            <div style={{ color: '#666', fontSize: '14px' }}>Total Managers</div>
          </div>
        </div>
      </div>
    </>
  );
}

export default withAuth(ManagersPage, ['admin', 'owner']); 
 