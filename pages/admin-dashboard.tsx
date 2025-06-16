import { useEffect, useState } from 'react';
import Head from 'next/head';
import Navigation from '../components/Navigation';
import DashboardLayout from '../components/DashboardLayout';
import MetricCard from '../components/MetricCard';
import SectionCard from '../components/SectionCard';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import Link from 'next/link';
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
        // Mock data for demonstration
        setStats({
          landlords: { total: 4, active: 4 },
          managers: { total: 3, active: 3 },
          properties: { total: 8, active: 8 },
          tenants: { total: 25 },
          revenue: { monthly: 45000, total: 540000 }
        });
        setLandlords([
          { id: 1, org_name: 'Premium Properties', owner_name: 'John Landlord', property_count: 3, manager_count: 2 },
          { id: 2, org_name: 'City Living', owner_name: 'Jane Estates', property_count: 5, manager_count: 1 }
        ]);
        setManagers([
          { id: 1, name: 'Sarah Manager', email: 'sarah@premium.com', landlord: 'Premium Properties' },
          { id: 2, name: 'Mike Johnson', email: 'mike@premium.com', landlord: 'Premium Properties' },
          { id: 3, name: 'David Chen', email: 'david@cityliving.com', landlord: 'City Living' }
        ]);
      } catch (err: any) {
        setError('Failed to load platform data.');
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
      <>
        <Navigation />
        <DashboardLayout
          title="Platform Administration"
          subtitle="Loading platform data..."
        >
          <div className="loading-indicator">
            <div className="loading-spinner" />
            <p>Fetching platform data...</p>
        </div>
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard - Tink Property Management</title>
      </Head>
      <Navigation />
      
      <DashboardLayout
        title="Platform Administration Dashboard"
        subtitle={`Welcome back, ${user?.full_name || user?.username}! You have administrative access to all platform features.`}
      >
        {error && <div className="alert alert-error">{error}</div>}

        {/* Platform Overview */}
        <SectionCard title="Platform Overview">
          <div className="metrics-grid">
            <MetricCard title="Total Landlords" value={stats?.landlords?.total || 0} subtitle={`Active: ${stats?.landlords?.active || 0}`} color="blue" />
            <MetricCard title="Total Managers" value={stats?.managers?.total || 0} subtitle={`Active: ${stats?.managers?.active || 0}`} color="green" />
            <MetricCard title="Total Properties" value={stats?.properties?.total || 0} subtitle="Across all landlords" color="amber" />
            <MetricCard title="Platform Revenue" value={stats?.revenue?.monthly || 0} isMonetary={true} subtitle={`Total: $${stats?.revenue?.total?.toLocaleString()}`} color="purple" />
          </div>
        </SectionCard>

        {/* Landlord Management */}
        <SectionCard title="Landlord Management">
          <DataTable
            columns={[
              { key: 'org_name', header: 'Organization' },
              { key: 'owner_name', header: 'Owner' },
              { key: 'property_count', header: 'Properties' },
              { key: 'manager_count', header: 'Managers' },
              { key: 'actions', header: 'Actions' }
            ]}
            data={landlords}
            renderRow={(landlord) => (
              <tr key={landlord.id}>
                <td style={{ textAlign: 'center' }}>{landlord.org_name}</td>
                <td style={{ textAlign: 'center' }}>{landlord.owner_name}</td>
                <td style={{ textAlign: 'center' }}>{landlord.property_count}</td>
                <td style={{ textAlign: 'center' }}>{landlord.manager_count}</td>
                <td style={{ textAlign: 'center' }}>
                  <div className="action-buttons">
                    <Link href="/landlords" className="btn btn-primary btn-sm">View Details</Link>
                    <Link href={`/managers?landlord=${landlord.id}`} className="btn btn-warning btn-sm">Assign Manager</Link>
                  </div>
                    </td>
                  </tr>
            )}
          />
        </SectionCard>

        {/* Manager Overview */}
        <SectionCard title="Manager Overview">
          <DataTable
            columns={[
              { key: 'name', header: 'Manager Name' },
              { key: 'email', header: 'Email' },
              { key: 'landlord', header: 'Works For' },
              { key: 'actions', header: 'Actions' }
            ]}
            data={managers}
            renderRow={(manager) => (
              <tr key={manager.id}>
                <td style={{ textAlign: 'center' }}>{manager.name}</td>
                <td style={{ textAlign: 'center' }}>{manager.email}</td>
                <td style={{ textAlign: 'center' }}>{manager.landlord}</td>
                <td style={{ textAlign: 'center' }}>
                  <div className="action-buttons">
                    <Link href="/managers" className="btn btn-primary btn-sm">View Details</Link>
                  </div>
                    </td>
                  </tr>
            )}
          />
        </SectionCard>

        {/* Quick Actions */}
        <SectionCard title="Quick Actions">
          <div className="quick-actions">
            <button className="btn btn-primary">Add New Landlord</button>
            <button className="btn btn-primary">Create Manager Account</button>
            <button className="btn btn-primary">Generate Platform Report</button>
            <button className="btn btn-warning">Platform Settings</button>
          </div>
        </SectionCard>
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
          to { transform: rotate(360deg); }
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: var(--spacing-lg);
        }
        .action-buttons {
          display: flex;
          gap: var(--spacing-xs);
          justify-content: center;
        }
        
        /* Center align table headers */
        :global(.data-table .table-header) {
          text-align: center;
        }
        .quick-actions {
          display: flex;
          gap: var(--spacing-md);
          flex-wrap: wrap;
        }
      `}</style>
    </>
  );
}

export default withAuth(AdminDashboard, ['admin']); 
 
 