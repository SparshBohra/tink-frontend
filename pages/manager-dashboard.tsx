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
        // Mock data for demonstration
        setStats({
          assigned_properties: { total: 2 },
          rooms: { total: 15, occupied: 12, vacant: 3 },
          tenants: { total: 12, active: 12 },
          applications: { pending: 3 },
          tasks: { pending: 5, completed_today: 2 }
        });
        setPendingTasks([
          { id: 1, title: 'Room inspection - Room 3A', property: 'Downtown Coliving', priority: 'high', due_date: '2024-01-16' },
          { id: 2, title: 'Fix kitchen sink', property: 'University House', priority: 'medium', due_date: '2024-01-17' },
        ]);
        setRecentApplications([
          { id: 1, tenant_name: 'Charlie Davis', property_name: 'Downtown Coliving', status: 'pending' },
        ]);
      } catch (err: any) {
        setError('Failed to load manager data.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchManagerData();
    }
  }, [user]);

  if (loading) {
    return (
      <>
        <Navigation />
        <DashboardLayout
          title="Manager Dashboard"
          subtitle="Loading your tasks and assignments..."
        >
          <div className="loading-indicator">
            <div className="loading-spinner" />
            <p>Fetching data...</p>
        </div>
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Manager Dashboard - Tink</title>
      </Head>
      <Navigation />
      
      <DashboardLayout
        title="Manager Dashboard"
        subtitle="Property management operations and tenant services."
      >
        {error && <div className="alert alert-error">{error}</div>}

        {/* Overview */}
        <SectionCard title="Today's Overview">
          <div className="metrics-grid">
            <MetricCard title="Assigned Properties" value={stats?.assigned_properties?.total || 0} color="blue" />
            <MetricCard title="Pending Tasks" value={stats?.tasks?.pending || 0} subtitle={`${stats?.tasks?.completed_today || 0} completed today`} color="amber" />
            <MetricCard title="Active Tenants" value={stats?.tenants?.active || 0} color="green" />
            <MetricCard title="Pending Applications" value={stats?.applications?.pending || 0} color="purple" />
          </div>
        </SectionCard>

        {/* Pending Tasks */}
        <SectionCard 
          title="Pending Tasks"
          action={<Link href="/tasks/add" className="btn btn-primary">Add Task</Link>}
        >
          {pendingTasks.length > 0 ? (
            <DataTable
              columns={[
                { key: 'title', header: 'Task' },
                { key: 'property', header: 'Property' },
                { key: 'priority', header: 'Priority' },
                { key: 'due_date', header: 'Due Date' },
                { key: 'actions', header: 'Actions' },
              ]}
              data={pendingTasks}
              renderRow={(task) => (
                <tr key={task.id}>
                  <td style={{ textAlign: 'center' }}>{task.title}</td>
                  <td style={{ textAlign: 'center' }}>{task.property}</td>
                  <td style={{ textAlign: 'center' }}><span className={`status-badge status-${task.priority}`}>{task.priority}</span></td>
                  <td style={{ textAlign: 'center' }}>{task.due_date}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn btn-success btn-sm">Complete</button>
                  </td>
                </tr>
              )}
            />
          ) : (
            <EmptyState title="No pending tasks" description="All tasks are completed. Great job!" />
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
                  <td style={{ textAlign: 'center' }}>{app.tenant_name}</td>
                  <td style={{ textAlign: 'center' }}>{app.property_name}</td>
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
            <Link href="/applications" className="btn btn-primary">Review Applications</Link>
            <Link href="/leases" className="btn btn-primary">Manage Leases</Link>
            <Link href="/tenants" className="btn btn-primary">Contact Tenants</Link>
            <Link href="/inventory" className="btn btn-primary">Check Inventory</Link>
          </div>
        </SectionCard>
      </DashboardLayout>
      
      <style jsx>{`
        /* Minimal styles */
        .loading-indicator { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--spacing-xl); }
        .loading-spinner { width: 40px; height: 40px; border: 4px solid var(--gray-200); border-top-color: var(--primary-blue); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: var(--spacing-md); }
        @keyframes spin { to { transform: rotate(360deg); } }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--spacing-lg); }
        .quick-actions { display: flex; gap: var(--spacing-md); flex-wrap: wrap; }
        .status-badge { padding: 4px 8px; border-radius: 12px; font-size: 12px; text-transform: capitalize; }
        .status-high { background-color: var(--error-red-light); color: var(--error-red-dark); }
        .status-medium { background-color: var(--warning-amber-light); color: var(--warning-amber-dark); }
        .status-low { background-color: var(--success-green-light); color: var(--success-green-dark); }
        .status-pending { background-color: var(--info-purple-light); color: var(--info-purple-dark); }
        
        /* Center align table headers */
        :global(.data-table .table-header) {
          text-align: center;
        }
      `}</style>
    </>
  );
}

export default withAuth(ManagerDashboard, ['manager']); 