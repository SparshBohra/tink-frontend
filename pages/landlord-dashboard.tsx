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

import { DashboardStats } from '../lib/types';

function LandlordDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
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
        
        // Fetch real dashboard statistics
        const dashboardStats = await apiClient.getDashboardStats();
        setStats(dashboardStats);
        
        // Fetch real properties data
        const propertiesResponse = await apiClient.getProperties();
        setProperties(propertiesResponse.results || []);
        
        // Fetch recent applications
        const applicationsResponse = await apiClient.getApplications();
        const recentApps = (applicationsResponse.results || [])
          .filter(app => app.status === 'pending')
          .slice(0, 5); // Show only recent 5 applications
        setRecentApplications(recentApps);
        
      } catch (err: any) {
        console.error('Failed to fetch business data:', err);
        setError('Failed to load business data.');
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
      <>
        <Navigation />
        <DashboardLayout
          title="Business Dashboard"
          subtitle="Loading your business data..."
        >
          <div className="loading-indicator">
            <div className="loading-spinner" />
            <p>Fetching business data...</p>
        </div>
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Landlord Dashboard - Tink</title>
      </Head>
      <Navigation />
      
      <DashboardLayout
        title="Business Dashboard"
        subtitle={`Managing properties for your organization.`}
      >
        {error && <div className="alert alert-error">{error}</div>}

        {/* Business Overview */}
        <SectionCard title="Business Overview">
          <div className="metrics-grid">
            <MetricCard title="My Properties" value={stats?.properties?.total || 0} subtitle={`${stats?.properties?.vacant || 0} vacant`} color="blue" />
            <MetricCard title="Total Rooms" value={stats?.rooms?.total || 0} subtitle={`${stats?.rooms?.occupancy_rate?.toFixed(1) || '0'}% occupancy`} color="purple" />
            <MetricCard title="Active Tenants" value={stats?.tenants?.active || 0} subtitle="Across all properties" color="green" />
            <MetricCard title="Monthly Revenue" value={stats?.revenue?.monthly || 0} isMonetary={true} subtitle={`Projected Annual: $${stats?.revenue?.projected_annual?.toLocaleString()}`} color="amber" />
          </div>
        </SectionCard>

        {/* Properties Overview */}
        <SectionCard 
          title="My Properties"
          action={<Link href="/properties/add" className="btn btn-primary">Add Property</Link>}
        >
          <div className="properties-grid">
            {properties.map(p => (
              <div key={p.id} className="property-card">
                <h3>{p.name}</h3>
                <p>{p.full_address}</p>
                <div className="property-stats">
                  <span>Rooms: {p.total_rooms}</span>
                  <span>Vacant: {p.vacant_rooms}</span>
                </div>
                <div className="action-buttons">
                  <Link href={`/properties/${p.id}`} className="btn btn-primary btn-sm">Manage</Link>
                </div>
              </div>
            ))}
          </div>
          {properties.length === 0 && (
            <EmptyState title="No properties found" description="Add your first property to get started." />
          )}
        </SectionCard>

        {/* Recent Applications */}
        <SectionCard title="Recent Applications">
            {recentApplications.length > 0 ? (
            <DataTable
              columns={[
                { key: 'tenant', header: 'Applicant ID' },
                { key: 'room', header: 'Room ID' },
                { key: 'status', header: 'Status' },
                { key: 'actions', header: 'Actions' },
              ]}
              data={recentApplications}
              renderRow={(app) => (
                <tr key={app.id}>
                  <td style={{ textAlign: 'center' }}>Tenant {app.tenant}</td>
                  <td style={{ textAlign: 'center' }}>Room {app.room}</td>
                  <td style={{ textAlign: 'center' }}><span className="status-badge status-pending">{app.status}</span></td>
                  <td style={{ textAlign: 'center' }}>
                    <Link href="/applications" className="btn btn-primary btn-sm">Review</Link>
                      </td>
                    </tr>
              )}
            />
            ) : (
            <EmptyState title="No pending applications" description="All applications have been reviewed." />
            )}
        </SectionCard>

        {/* Quick Actions */}
        <SectionCard title="Quick Actions">
          <div className="quick-actions">
            <Link href="/properties/add" className="btn btn-primary">Add New Property</Link>
            <Link href="/applications" className="btn btn-primary">Review Applications</Link>
            <Link href="/tenants" className="btn btn-primary">Manage Tenants</Link>
            <Link href="/managers" className="btn btn-primary">Manage Team</Link>
          </div>
        </SectionCard>
      </DashboardLayout>
      
      <style jsx>{`
        /* Other styles */
        .loading-indicator { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--spacing-xl); }
        .loading-spinner { width: 40px; height: 40px; border: 4px solid var(--gray-200); border-top-color: var(--primary-blue); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: var(--spacing-md); }
        @keyframes spin { to { transform: rotate(360deg); } }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--spacing-lg); }
        .properties-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--spacing-lg); }
        .property-card { background: var(--gray-50); padding: var(--spacing-lg); border-radius: var(--radius-md); border: 1px solid var(--gray-100); }
        .property-stats { display: flex; justify-content: space-between; margin: var(--spacing-md) 0; }
        .action-buttons { display: flex; gap: var(--spacing-xs); }
        .quick-actions { display: flex; gap: var(--spacing-md); flex-wrap: wrap; }
        .status-badge { padding: 4px 8px; border-radius: 12px; font-size: 12px; }
        .status-pending { background-color: var(--warning-amber-light); color: var(--warning-amber-dark); }
        
        /* Center align table headers */
        :global(.data-table .table-header) {
          text-align: center;
        }
      `}</style>
    </>
  );
}

export default withAuth(LandlordDashboard, ['owner']); 