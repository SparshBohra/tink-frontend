import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { apiClient } from '../../lib/api';
import { Tenant, Lease, Application } from '../../lib/types';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import DataTable from '../../components/DataTable';
import EmptyState from '../../components/EmptyState';
import { formatCurrency } from '../../lib/utils';

export default function TenantDetails() {
  const router = useRouter();
  const { id } = router.query;
  const tenantId = typeof id === 'string' && !isNaN(Number(id)) ? Number(id) : null;
  
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [currentLease, setCurrentLease] = useState<Lease | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tenantId !== null) {
      fetchTenantData(tenantId);
    } else if (id) {
      setError('Invalid tenant ID.');
      setLoading(false);
    }
  }, [id]);

  const fetchTenantData = async (tid: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const tenantResponse = await apiClient.getTenant(tid);
      setTenant(tenantResponse);
      
      try {
        const leaseResponse = await apiClient.getTenantCurrentLease(tid);
        setCurrentLease(leaseResponse);
      } catch (e) {
        console.log('No active lease found for tenant');
      }
      
      try {
        const applicationsResponse = await apiClient.getTenantApplications(tid);
        setApplications(applicationsResponse || []);
      } catch (e) {
        console.log('No applications found for tenant');
      }
    } catch (error: any) {
      console.error('Failed to fetch tenant data:', error);
      setError(error?.message || 'Failed to load tenant data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Tenant - Tink Property Management</title>
        </Head>
        <DashboardLayout title="">
          <div className="dashboard-container">
            {/* Custom Header */}
            <div className="dashboard-header">
              <div className="header-content">
                <div className="header-left">
                  <h1 className="dashboard-title">Tenant Details</h1>
                  <div className="subtitle-container">
                    <p className="welcome-message">
                      Loading tenant information...
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
          <div className="loading-indicator">
            <div className="loading-spinner" />
            <p>Fetching tenant information...</p>
            </div>
          </div>
        </DashboardLayout>
      </>
    );
  }

  if (error || !tenant) {
    return (
      <>
        <Head>
          <title>Tenant Not Found - Tink Property Management</title>
        </Head>
        <DashboardLayout title="">
          <div className="dashboard-container">
            {/* Custom Header */}
            <div className="dashboard-header">
              <div className="header-content">
                <div className="header-left">
                  <h1 className="dashboard-title">Tenant Not Found</h1>
                  <div className="subtitle-container">
                    <p className="welcome-message">
                      Unable to load tenant details
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
          <div className="alert alert-error">
            <strong>Error:</strong> {error || 'Tenant not found'}
          </div>
          <div className="actions-container">
            <button onClick={() => router.back()} className="btn btn-secondary">
              ← Back
            </button>
            <Link href="/tenants" className="btn btn-primary">
              All Tenants
            </Link>
            </div>
          </div>
        </DashboardLayout>
      </>
    );
  }

  const applicationsTableData = applications.map(app => ({
    id: app.id,
    property: app.room ? `Property ${app.room}` : 'Unknown Property',
    room: app.room ? `Room ${app.room}` : 'Not specified',
    status: (
      <StatusBadge 
        status={app.status === 'approved' ? 'active' : app.status === 'pending' ? 'pending' : 'inactive'} 
        text={app.status.toUpperCase()}
      />
    ),
    date: app.created_at ? new Date(app.created_at).toLocaleDateString() : 'Unknown',
    actions: (
      <Link href={`/applications?tenant=${tenant.id}`} className="btn btn-primary btn-sm">
        View Details
      </Link>
    )
  }));

  const applicationsTableColumns = [
    { key: 'property', header: 'Property' },
    { key: 'room', header: 'Room' },
    { key: 'status', header: 'Status' },
    { key: 'date', header: 'Application Date' },
    { key: 'actions', header: 'Actions' }
  ];

  const renderApplicationRow = (rowData: any, index: number) => (
    <tr key={rowData.id}>
      <td style={{ textAlign: 'center' }}>{rowData.property}</td>
      <td style={{ textAlign: 'center' }}>{rowData.room}</td>
      <td style={{ textAlign: 'center' }}>{rowData.status}</td>
      <td style={{ textAlign: 'center' }}>{rowData.date}</td>
      <td style={{ textAlign: 'center' }}>{rowData.actions}</td>
    </tr>
  );

  return (
    <>
      <Head>
        <title>{tenant.full_name} - Tenant Details - Tink Property Management</title>
      </Head>
      <DashboardLayout title="">
        <div className="dashboard-container">
          {/* Custom Header */}
          <div className="dashboard-header">
            <div className="header-content">
              <div className="header-left">
                <h1 className="dashboard-title">{tenant.full_name}</h1>
                <div className="subtitle-container">
                  <p className="welcome-message">
                    Tenant ID: {tenant.id} • Member since {tenant.created_at ? new Date(tenant.created_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>
              <div className="header-right">
                <button onClick={() => router.back()} className="back-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7 7l-7-7 7-7"/></svg>
                  Back
                </button>
              </div>
            </div>
          </div>

          {/* Top Metrics Row */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-info"><h3 className="metric-title">Lease Status</h3><div className="metric-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg></div></div>
              </div>
              <div className="metric-content"><div className="metric-value">{currentLease ? 'Active' : 'None'}</div><div className="metric-subtitle">{currentLease ? 'Currently leasing' : 'No active lease'}</div></div>
            </div>
            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-info"><h3 className="metric-title">Monthly Rent</h3><div className="metric-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div></div>
              </div>
              <div className="metric-content"><div className="metric-value">{currentLease ? formatCurrency(currentLease.monthly_rent) : '$0'}</div><div className="metric-subtitle">Current rent amount</div></div>
            </div>
            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-info"><h3 className="metric-title">Applications</h3><div className="metric-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div></div>
              </div>
              <div className="metric-content"><div className="metric-value">{applications.length}</div><div className="metric-subtitle">Total applications submitted</div></div>
            </div>
          </div>

          {/* Main Content Layout */}
          <div className="main-content-grid">
            <div className="left-column">
              {/* Tenant Information */}
              <div className="info-section">
                <div className="section-header">
                  <div><h2 className="section-title">Tenant Information</h2><p className="section-subtitle">Contact details and personal information</p></div>
                  <div className="section-actions">
                    <button onClick={() => alert('Edit feature coming soon')} className="btn btn-secondary btn-sm">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit
                    </button>
                  </div>
                </div>
                <div className="info-grid">
                  <div className="info-item"><strong>Full Name</strong><div className="info-value">{tenant.full_name}</div></div>
                  <div className="info-item"><strong>Email Address</strong><div className="info-value"><a href={`mailto:${tenant.email}`}>{tenant.email}</a></div></div>
                  <div className="info-item"><strong>Phone Number</strong><div className="info-value"><a href={`tel:${tenant.phone}`}>{tenant.phone}</a></div></div>
                  <div className="info-item"><strong>Emergency Contact</strong><div className="info-value">{tenant.emergency_contact_name || 'Not provided'} {tenant.emergency_contact_phone && `(${tenant.emergency_contact_phone})`}</div></div>
                </div>
              </div>

              {/* Application History */}
              <div className="info-section">
                <div className="section-header">
                  <div><h2 className="section-title">Application History</h2><p className="section-subtitle">{applications.length} application{applications.length !== 1 ? 's' : ''} on record</p></div>
                </div>
                {applications.length > 0 ? (
                  <div className="applications-table-container">
                    <table className="applications-table">
                      <thead>
                        <tr>
                          <th className="table-left">Property</th><th className="table-center">Status</th><th className="table-center">Date</th><th className="table-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applications.map((app) => (
                          <tr key={app.id}>
                            <td className="table-left"><div className="property-name">{app.property_name || `Property #${app.property_ref}`}</div></td>
                            <td className="table-center"><StatusBadge status={app.status as any} /></td>
                            <td className="table-center"><div className="application-date">{new Date(app.created_at).toLocaleDateString()}</div></td>
                            <td className="table-center">
                              <Link href={`/applications?tenant=${tenant.id}`} className="manage-btn view-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState title="No Applications Found" description="This tenant hasn't submitted any rental applications yet." />
                )}
              </div>
            </div>

            <div className="right-column">
              {/* Current Housing */}
              <div className="info-section">
                <div className="section-header">
                  <div><h2 className="section-title">Current Housing</h2><p className="section-subtitle">Active lease and property information</p></div>
                </div>
                {currentLease ? (
                  <div className="info-grid">
                    <div className="info-item"><strong>Property</strong><div className="info-value">{currentLease.property_name || `Property #${currentLease.property_ref}`}</div></div>
                    <div className="info-item"><strong>Room</strong><div className="info-value">{currentLease.room_name || `Room #${currentLease.room}`}</div></div>
                    <div className="info-item"><strong>Monthly Rent</strong><div className="info-value">{formatCurrency(currentLease.monthly_rent)}</div></div>
                    <div className="info-item"><strong>Lease Period</strong><div className="info-value">{currentLease.start_date} to {currentLease.end_date}</div></div>
                  </div>
                ) : (
                  <EmptyState title="No Active Lease" description="This tenant is not currently assigned to any property." />
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>

      <style jsx>{`
        .dashboard-container { width: 100%; padding: 16px 20px 20px 20px; background: #f8fafc; min-height: calc(100vh - 72px); box-sizing: border-box; }
        .dashboard-header { margin-bottom: 24px; }
        .header-content { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
        .header-left { flex: 1; }
        .header-right { flex-shrink: 0; }
        .dashboard-title { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0 0 4px 0; line-height: 1.15; }
        .subtitle-container { min-height: 22px; }
        .welcome-message { font-size: 14px; color: #4b5563; margin: 0; line-height: 1.45; }
        .back-btn { background: #4f46e5; color: white; border: none; padding: 10px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s ease; text-decoration: none; }
        .back-btn:hover { background: #3730a3; transform: translateY(-1px); }
        .main-content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; align-items: flex-start; }
        .left-column, .right-column { display: flex; flex-direction: column; gap: 20px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
        .metric-card { background: white; border-radius: 6px; padding: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
        .metric-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
        .metric-info { display: flex; justify-content: space-between; align-items: center; width: 100%; }
        .metric-title { font-size: 11px; font-weight: 600; color: #64748b; margin: 0; }
        .metric-icon { width: 20px; height: 20px; color: #64748b; }
        .metric-content { margin-top: 8px; }
        .metric-value { font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 3px; line-height: 1; }
        .metric-subtitle { font-size: 11px; color: #64748b; }
        .info-section { background: white; border-radius: 6px; padding: 18px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; height: fit-content; }
        .section-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
        .section-title { font-size: 14px; font-weight: 700; color: #1e293b; margin: 0 0 3px 0; }
        .section-subtitle { font-size: 12px; color: #64748b; margin: 0; }
        .section-actions { display: flex; gap: 12px; align-items: center; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .info-item { padding: 12px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; }
        .info-item strong { display: block; color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .info-item .info-value { color: #1e293b; font-size: 14px; font-weight: 500; }
        .info-item a { color: #4f46e5; text-decoration: none; }
        .info-item a:hover { text-decoration: underline; }
        .applications-table-container { overflow-x: auto; }
        .applications-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .applications-table tbody tr:hover { background-color: #f9fafb; }
        .applications-table th { position: sticky; top: 0; background: #ffffff; z-index: 2; font-size: 12px; font-weight: 600; color: #9ca3af; padding: 12px 16px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb; text-align: left; }
        .applications-table td { padding: 12px 16px; vertical-align: middle; height: 48px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #374151; }
        .applications-table th.table-center, .applications-table td.table-center { text-align: center; }
        .property-name { font-weight: 500; color: #1e293b; }
        .application-date { font-size: 13px; color: #64748b; }
        .manage-btn { background: #4f46e5; color: white; border: none; padding: 6px 12px; border-radius: 5px; font-size: 12px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; transition: all 0.2s ease; text-decoration: none; }
        .manage-btn:hover { background: #3730a3; }
        .btn-secondary { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }
        .btn-secondary:hover { background: #e2e8f0; }
        .btn-sm { padding: 8px 12px; font-size: 12px; }
        .loading-indicator, .error-section { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; }
        .loading-spinner { width: 40px; height: 40px; border: 4px solid #e5e7eb; border-top-color: #4f46e5; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .alert { padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; font-weight: 500; }
        .alert-error { background: #fef2f2; border-color: #fecaca; color: #dc2626; }
      `}</style>
    </>
  );
} 