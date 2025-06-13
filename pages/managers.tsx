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
    // Mock data for demonstration
    const mockManagers: Manager[] = [
      { id: 1, username: 'sarah_manager', email: 'sarah@example.com', full_name: 'Sarah Manager', role: 'manager', is_active: true, date_joined: '2023-05-10' },
      { id: 2, username: 'mike_p', email: 'mike.p@example.com', full_name: 'Mike Peterson', role: 'manager', is_active: true, date_joined: '2023-08-15' },
      { id: 3, username: 'inactive_manager', email: 'inactive@example.com', full_name: 'Inactive Manager', role: 'manager', is_active: false, date_joined: '2022-01-20' },
    ];
    setManagers(mockManagers);
    setLoading(false);
  }, []);

  const handleAssignManager = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic for assigning manager
  };
  const handleDeleteManager = (id: number, name: string) => { /* ... */ };

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
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>Assign Manager</button>
            <button className="btn btn-secondary">Refresh</button>
          </div>
        </SectionCard>

        {showForm && (
          <SectionCard title="Assign New Manager">
            <form onSubmit={handleAssignManager} className="manager-form">
              {/* Form fields */}
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Assigning...' : 'Assign Manager'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </SectionCard>
        )}

        <SectionCard title="Manager List">
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
                <td>{manager.full_name}</td>
                <td>{manager.email}</td>
                <td>
                  <StatusBadge status={manager.is_active ? 'success' : 'error'} text={manager.is_active ? 'Active' : 'Inactive'} />
                </td>
                <td>{manager.date_joined}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn btn-secondary btn-sm">Edit</button>
                    <button className="btn btn-error btn-sm" onClick={() => handleDeleteManager(manager.id, manager.full_name)}>Delete</button>
                  </div>
                      </td>
                    </tr>
            )}
          />
        </SectionCard>
      </DashboardLayout>
      <style jsx>{`
        .actions-container { display: flex; gap: var(--spacing-md); }
        .manager-form { /* Add form styling here */ }
        .form-actions { display: flex; gap: var(--spacing-md); margin-top: var(--spacing-lg); }
        .action-buttons { display: flex; gap: var(--spacing-xs); }
      `}</style>
    </>
  );
}

export default withAuth(ManagersPage, ['admin', 'owner']); 
 