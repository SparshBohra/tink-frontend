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
        // Mock data for demonstration
          setStats({
          properties: { total: 3, occupied: 2, vacant: 1 },
          rooms: { total: 15, occupied: 12, vacant: 3, occupancy_rate: 80 },
          tenants: { total: 12, active: 12 },
          revenue: { monthly: 15000, projected_annual: 180000 },
          managers: { total: 2, active: 2 }
        });
        setProperties([
          { id: 1, name: 'Sunnyvale Apartments', full_address: '123 Main St, Sunnyvale', total_rooms: 5, vacant_rooms: 1 },
          { id: 2, name: 'Downtown Lofts', full_address: '456 Market St, Cityville', total_rooms: 10, vacant_rooms: 2 }
        ]);
        setRecentApplications([
          { id: 1, tenant_name: 'Alice Johnson', property_name: 'Sunnyvale Apartments', status: 'pending' },
          { id: 2, tenant_name: 'Bob Williams', property_name: 'Downtown Lofts', status: 'pending' }
        ]);
      } catch (err: any) {
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
        subtitle={`Managing properties for ${user?.org_name || 'your organization'}.`}
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
                  <Link href={`/properties/${p.id}`} className="btn btn-secondary btn-sm">Manage</Link>
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
                { key: 'tenant_name', header: 'Applicant' },
                { key: 'property_name', header: 'Property' },
                { key: 'status', header: 'Status' },
                { key: 'actions', header: 'Actions' },
              ]}
              data={recentApplications}
              renderRow={(app) => (
                <tr key={app.id}>
                  <td>{app.tenant_name}</td>
                  <td>{app.property_name}</td>
                  <td><span className="status-badge status-pending">{app.status}</span></td>
                  <td>
                    <Link href="/applications" className="btn btn-secondary btn-sm">Review</Link>
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
            <Link href="/applications" className="btn btn-secondary">Review Applications</Link>
            <Link href="/tenants" className="btn btn-secondary">Manage Tenants</Link>
            <Link href="/managers" className="btn btn-secondary">Manage Team</Link>
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
      `}</style>
    </>
  );
}

export default withAuth(LandlordDashboard, ['owner']); 