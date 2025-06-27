import { useState, useEffect } from 'react';
import Head from 'next/head';
import Navigation from '../components/Navigation';
import DashboardLayout from '../components/DashboardLayout';
import MetricCard from '../components/MetricCard';
import SectionCard from '../components/SectionCard';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { useAuth, withAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';

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
  const [showForm, setShowForm] = useState(false);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [formData, setFormData] = useState<ManagerFormData>({
    full_name: '',
    email: '',
    username: '',
    password: ''
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let managersData: Manager[] = [];
      
      if (isAdmin()) {
        // Admin can see all managers
        const response = await apiClient.getAllManagers();
        managersData = response || [];
      } else if (isLandlord()) {
        // Landlords can see their assigned managers
        const response = await apiClient.getManagers();
        managersData = response.results || [];
      }
      
      setManagers(managersData);
    } catch (err: any) {
      console.error('Failed to fetch managers:', err);
      setError(err?.message || 'Failed to load managers');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignManager = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      setError(null);
      
      if (editingManager) {
        // Update existing manager
        await apiClient.updateManager(editingManager.id, {
          full_name: formData.full_name,
          email: formData.email,
        });
      } else {
        // Create new manager assignment logic would go here
        console.log('Creating new manager:', formData);
      }
      
      setShowForm(false);
      setEditingManager(null);
      setFormData({ full_name: '', email: '', username: '', password: '' });
      await fetchManagers();
      
    } catch (err: any) {
      setError(err?.message || 'Failed to save manager');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditManager = (manager: Manager) => {
    setEditingManager(manager);
    setFormData({
      full_name: manager.full_name,
      email: manager.email,
      username: manager.username,
      password: '' // Don't populate password for security
    });
    setShowForm(true);
  };

  const handleDeleteManager = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete manager "${name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setError(null);
      await apiClient.deleteManager(id);
      await fetchManagers();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete manager');
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <DashboardLayout
          title={isAdmin() ? 'All Managers' : 'My Team'}
          subtitle="Loading managers..."
        >
          <div className="loading-indicator">
            <div className="loading-spinner" />
            <p>Fetching manager data...</p>
          </div>
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Manage Team - Tink</title>
      </Head>
      <Navigation />
      <DashboardLayout
        title={isAdmin() ? 'All Managers' : 'My Team'}
        subtitle={isAdmin() ? 'Manage all property managers' : 'Manage your property management team'}
      >
        {error && <div className="alert alert-error">{error}</div>}
        
        <SectionCard>
          <div className="actions-container">
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              {isAdmin() ? 'Create Manager' : 'Assign Manager'}
            </button>
            <button className="btn btn-secondary" onClick={fetchManagers}>Refresh</button>
          </div>
        </SectionCard>

        {showForm && (
          <SectionCard title={editingManager ? 'Edit Manager' : 'Assign New Manager'}>
            <form onSubmit={handleAssignManager} className="manager-form">
              <div className="form-group">
                <label htmlFor="full_name">Full Name</label>
                <input
                  type="text"
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              
              {!editingManager && (
                <>
                  <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                      type="text"
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                </>
              )}
              
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Saving...' : (editingManager ? 'Update Manager' : 'Assign Manager')}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingManager(null);
                    setFormData({ full_name: '', email: '', username: '', password: '' });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </SectionCard>
        )}

        <SectionCard title="Manager List">
          {managers.length > 0 ? (
            <DataTable
              columns={[
                { key: 'full_name', header: 'Name' },
                { key: 'email', header: 'Email' },
                { key: 'status', header: 'Status' },
                { key: 'date_joined', header: 'Date Joined' },
                { key: 'actions', header: 'Actions' },
              ]}
              data={managers}
              renderRow={(manager) => (
                <tr key={manager.id}>
                  <td style={{ textAlign: 'center' }}>{manager.full_name}</td>
                  <td style={{ textAlign: 'center' }}>{manager.email}</td>
                  <td style={{ textAlign: 'center' }}>
                    <StatusBadge 
                      status={manager.is_active ? 'success' : 'error'} 
                      text={manager.is_active ? 'Active' : 'Inactive'} 
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {manager.date_joined ? new Date(manager.date_joined).toLocaleDateString() : 'N/A'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-warning btn-sm"
                        onClick={() => handleEditManager(manager)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-error btn-sm" 
                        onClick={() => handleDeleteManager(manager.id, manager.full_name)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            />
          ) : (
            <EmptyState 
              title="No Managers Found" 
              description={isAdmin() ? "No managers are registered on the platform." : "No managers have been assigned to your organization."} 
            />
          )}
        </SectionCard>
      </DashboardLayout>
      
      <style jsx>{`
        .actions-container { 
          display: flex; 
          gap: var(--spacing-md); 
          margin-bottom: var(--spacing-lg);
        }
        
        .manager-form { 
          max-width: 500px;
        }
        
        .form-group {
          margin-bottom: var(--spacing-md);
        }
        
        .form-group label {
          display: block;
          margin-bottom: var(--spacing-xs);
          font-weight: 600;
        }
        
        .form-group input {
          width: 100%;
          padding: var(--spacing-sm);
          border: 1px solid var(--gray-300);
          border-radius: var(--radius-sm);
        }
        
        .form-actions { 
          display: flex; 
          gap: var(--spacing-md); 
          margin-top: var(--spacing-lg); 
        }
        
        .action-buttons { 
          display: flex; 
          gap: var(--spacing-xs); 
          justify-content: center; 
        }
        
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
        
        .alert {
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          margin-bottom: var(--spacing-lg);
        }
        
        .alert-error {
          background-color: var(--error-red-light);
          color: var(--error-red-dark);
          border: 1px solid var(--error-red);
        }
        
        /* Center align table headers */
        :global(.data-table .table-header) {
          text-align: center;
        }
      `}</style>
    </>
  );
}

export default withAuth(ManagersPage, ['admin', 'owner']); 
 