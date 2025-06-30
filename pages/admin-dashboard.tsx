import { useEffect, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth, withAuth } from '../lib/auth-context';
import Link from 'next/link';

// Define interfaces for data structures
interface PlatformStats {
  landlords: { total: number; active: number; };
  managers: { total: number; active: number; };
  properties: { total: number; active: number; };
  tenants: { total: number; };
  revenue: { monthly: number; total: number; };
}

interface Landlord {
  id: number;
  org_name: string;
  owner_name: string;
  property_count: number;
  manager_count: number;
}

interface Manager {
  id: number;
  name: string;
  email: string;
  landlord: string;
}

// Reusable Icon component for metrics
const MetricIcon = ({ path, ...props }) => (
  <svg
    width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round"
    {...props}
  >
    {path}
  </svg>
);

function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlatformData = async () => {
      try {
        setLoading(true);
        setError(null);
        // Using mock data as before
        setStats({
          landlords: { total: 4, active: 4 },
          managers: { total: 3, active: 3 },
          properties: { total: 8, active: 8 },
          tenants: { total: 25 },
          revenue: { monthly: 45000, total: 540000 }
        });
        setLandlords([
          { id: 1, org_name: 'Premium Properties', owner_name: 'John Landlord', property_count: 3, manager_count: 2 },
          { id: 2, org_name: 'City Living', owner_name: 'Jane Estates', property_count: 5, manager_count: 1 },
          { id: 3, org_name: 'Urban Dwellings', owner_name: 'Sam Urban', property_count: 2, manager_count: 1 },
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
  
  const today = new Date();
  const weekday = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateString = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <DashboardLayout title="Platform Administration">
        <div className="loading-container">
          <p>Loading Platform Data...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="">
      <Head>
        <title>Admin Dashboard - Tink</title>
      </Head>
      
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="dashboard-title">Platform Administration</h1>
              <p className="welcome-message">
                Welcome back, {user?.full_name || 'Admin'}! Here is the platform overview.
              </p>
            </div>
            <div className="header-right">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>{weekday}</span>
                <span style={{ fontSize: '17px', color: '#334155', fontWeight: 600 }}>{dateString}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="metrics-grid">
          {stats && (
            <>
              <div className="analytics-card">
                  <div className="analytics-header">
                      <h3 className="analytics-title">Total Landlords</h3>
                      <div className="analytics-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
                  </div>
                  <p className="analytics-value">{stats.landlords.total}</p>
                  <div className="analytics-footer">
                      <span className="analytics-subtitle">{stats.landlords.active} active</span>
                      <span className="analytics-change positive"></span>
                  </div>
              </div>
              <div className="analytics-card">
                  <div className="analytics-header">
                      <h3 className="analytics-title">Total Managers</h3>
                      <div className="analytics-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                  </div>
                  <p className="analytics-value">{stats.managers.total}</p>
                  <div className="analytics-footer">
                      <span className="analytics-subtitle">{stats.managers.active} active</span>
                      <span className="analytics-change positive"></span>
                  </div>
              </div>
              <div className="analytics-card">
                  <div className="analytics-header">
                      <h3 className="analytics-title">Total Properties</h3>
                      <div className="analytics-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
                  </div>
                  <p className="analytics-value">{stats.properties.total}</p>
                  <div className="analytics-footer">
                      <span className="analytics-subtitle">across all landlords</span>
                      <span className="analytics-change positive"></span>
                  </div>
              </div>
              <div className="analytics-card">
                  <div className="analytics-header">
                      <h3 className="analytics-title">Monthly Revenue</h3>
                      <div className="analytics-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22m5-18H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6" /></svg></div>
                  </div>
                  <p className="analytics-value">${stats.revenue.monthly.toLocaleString()}</p>
                  <div className="analytics-footer">
                      <span className="analytics-subtitle">Total: ${stats.revenue.total.toLocaleString()}</span>
                      <span className="analytics-change positive"></span>
                  </div>
              </div>
            </>
          )}
        </div>
        
        {/* Main Content Area */}
        <div className="properties-section" style={{ marginTop: 0 }}>
            <div className="section-header">
              <div>
                <h2 className="section-title">Landlord Management</h2>
                <p className="section-subtitle">Oversee all landlord accounts on the platform</p>
              </div>
              <Link href="/landlords" className="view-all-btn">View All</Link>
                  </div>
            <div className="properties-table-container">
              <table className="properties-table">
                <thead>
                  <tr>
                    <th>Organization</th>
                    <th>Owner</th>
                    <th>Properties</th>
                    <th>Managers</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {landlords.map(l => (
                    <tr key={l.id}>
                      <td>{l.org_name}</td>
                      <td>{l.owner_name}</td>
                      <td>{l.property_count}</td>
                      <td>{l.manager_count}</td>
                      <td>
                        <button className="manage-btn">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
        <div className="properties-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Manager Overview</h2>
                <p className="section-subtitle">Oversee all manager accounts</p>
              </div>
              <Link href="/managers" className="view-all-btn">View All</Link>
                  </div>
            <div className="properties-table-container">
              <table className="properties-table">
                <thead>
                  <tr>
                    <th>Manager Name</th>
                    <th>Email</th>
                    <th>Works For</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {managers.map(m => (
                    <tr key={m.id}>
                      <td>{m.name}</td>
                      <td>{m.email}</td>
                      <td>{m.landlord}</td>
                      <td>
                        <button className="manage-btn">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </div>
          </div>

      <style jsx>{`
        .dashboard-container {
          width: 100%;
          padding: 16px 20px 20px 20px;
          background: #f8fafc;
          min-height: calc(100vh - 72px);
          box-sizing: border-box;
        }

        /* Custom Header */
        .dashboard-header {
          margin-bottom: 24px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }

        .header-left {
          flex: 1;
        }

        .dashboard-title {
          font-size: 22px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
          line-height: 1.15;
        }

        .welcome-message {
          font-size: 14px;
          color: #64748b;
          margin: 0;
          line-height: 1.45;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .header-right {
          flex-shrink: 0;
        }

        /* Metrics Grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 20px;
        }

        .analytics-card {
          background: white;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.2s ease;
        }
        .analytics-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .analytics-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }
        .analytics-title {
            font-size: 14px;
            color: #4b5563;
            font-weight: 500;
            margin: 0;
        }
        .analytics-icon svg {
            color: #64748b;
        }
        .analytics-value {
            font-size: 32px;
            font-weight: 700;
            color: #1e293b;
            margin: 0;
            line-height: 1;
        }
        .analytics-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 16px;
            font-size: 13px;
            color: #64748b;
        }
        .analytics-subtitle {
            margin: 0;
        }
        .analytics-change.positive {
            color: #10b981;
            font-weight: 600;
        }
        
        .properties-section {
          background: white;
          border-radius: 6px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          margin-top: 32px;
          margin-bottom: 20px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 3px 0;
        }

        .section-subtitle {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        .view-all-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .view-all-btn:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .properties-table-container {
          width: 100%;
          overflow-x: auto;
          max-height: 350px;
          border-radius: 8px;
          background: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .properties-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }
        
        .properties-table th, .properties-table td {
          padding: 12px 16px;
          text-align: center;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: middle;
        }

        .properties-table th {
          position: sticky;
          top: 0;
          background: #f8fafc;
          z-index: 2;
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
          border-bottom: 2px solid #e2e8f0;
        }

        .properties-table td {
          font-size: 14px;
          color: #334155;
        }
        
        .manage-btn {
          background-color: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: #334155;
          padding: 8px 14px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .manage-btn:hover {
            background-color: #e2e8f0;
        }

        /* Dark Mode Styles */
        :global(.dark-mode) .dashboard-container { background: transparent; }
        :global(.dark-mode) .header-right span { color: #a1a1aa !important; }
        :global(.dark-mode) .analytics-card,
        :global(.dark-mode) .properties-section {
          background: #111111 !important;
          border: 1px solid #333333 !important;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4) !important;
        }
        :global(.dark-mode) .analytics-card:hover {
          background: #222222 !important;
          border-color: #555555 !important;
        }
        :global(.dark-mode) .analytics-title,
        :global(.dark-mode) .analytics-icon svg,
        :global(.dark-mode) .analytics-subtitle,
        :global(.dark-mode) .analytics-footer {
          color: #a1a1aa !important;
        }
        :global(.dark-mode) .analytics-value {
          color: #ffffff !important;
        }
        :global(.dark-mode) .analytics-change.positive {
          color: #4ade80 !important;
        }
        :global(.dark-mode) .properties-table th {
          background-color: #1a1a1a !important;
          border-bottom: 1px solid #333333 !important;
        }
        :global(.dark-mode) .properties-table td {
          background-color: #111111 !important;
          border-bottom: 1px solid #333333 !important;
        }
        :global(.dark-mode) .properties-table-container {
          background: #111111;
        }
        :global(.dark-mode) .properties-table tbody tr:hover td {
          background-color: #222222 !important;
        }
        :global(.dark-mode) .view-all-btn {
            background: #3b82f6 !important;
            border: 1px solid #3b82f6 !important;
        }
        :global(.dark-mode) .view-all-btn:hover {
            background: #2563eb !important;
            border-color: #2563eb !important;
        }
        :global(.dark-mode) .manage-btn {
            background-color: #374151 !important;
            border-color: #4b5563 !important;
            color: #f3f4f6 !important;
        }
        :global(.dark-mode) .manage-btn svg {
            stroke: #f3f4f6 !important;
        }
        :global(.dark-mode) .manage-btn:hover {
            background-color: #4b5563 !important;
        }
      `}</style>
    </DashboardLayout>
  );
}

export default withAuth(AdminDashboard, ['admin']); 
 
 