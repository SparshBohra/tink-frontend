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
                <h1 className="dashboard-title">👤 {tenant.full_name}</h1>
                <div className="subtitle-container">
                  <p className="welcome-message">
                    Tenant ID: {tenant.id} • Member since {tenant.created_at ? new Date(tenant.created_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>
              <div className="header-right">
                <button onClick={() => router.back()} className="back-btn">
                  ← Back
                </button>
                <Link href="/tenants" className="all-tenants-btn">
                  All Tenants
                </Link>
              </div>
            </div>
          </div>

          {/* Tenant Information */}
          <div className="tenant-info-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Tenant Information</h2>
                <p className="section-subtitle">Contact details and personal information</p>
              </div>
            </div>
            <div className="tenant-info-grid">
              <div className="info-item">
                <strong>Full Name:</strong><br />
                {tenant.full_name}
              </div>
              <div className="info-item">
                <strong>Email:</strong><br />
                <a href={`mailto:${tenant.email}`}>{tenant.email}</a>
              </div>
              <div className="info-item">
                <strong>Phone:</strong><br />
                <a href={`tel:${tenant.phone}`}>{tenant.phone}</a>
              </div>
              <div className="info-item">
                <strong>Emergency Contact:</strong><br />
                {tenant.emergency_contact_name ? (
                  <>
                    {tenant.emergency_contact_name}
                    {tenant.emergency_contact_phone && (
                      <><br /><a href={`tel:${tenant.emergency_contact_phone}`}>{tenant.emergency_contact_phone}</a></>
                    )}
                  </>
                ) : (
                  'Not provided'
                )}
              </div>
              <div className="info-item">
                <strong>Current Address:</strong><br />
                {tenant.current_address || 'Not provided'}
              </div>
              <div className="info-item">
                <strong>Member Since:</strong><br />
                {tenant.created_at ? new Date(tenant.created_at).toLocaleDateString() : 'Unknown'}
              </div>
            </div>
            <div className="actions-grid" style={{ marginTop: '20px' }}>
              <button
                onClick={() => alert('Edit feature coming soon')}
                className="btn btn-primary"
              >
                ✏️ Edit Details
              </button>
              <a href={`mailto:${tenant.email}`} className="btn btn-secondary">
                ✉️ Send Email
              </a>
            </div>
          </div>

          {/* Current Housing */}
          <div className="housing-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Current Housing</h2>
                <p className="section-subtitle">Active lease and property information</p>
              </div>
            </div>
            {currentLease ? (
              <div className="lease-info-grid">
                <div className="info-item">
                  <strong>Property:</strong><br />
                  Property ID: {currentLease.property_ref || 'Unknown'}
                  {currentLease.property_ref && (
                    <><br /><Link href={`/properties/${currentLease.property_ref}/rooms`}>View Property</Link></>
                  )}
                </div>
                <div className="info-item">
                  <strong>Room:</strong><br />
                  Room ID: {currentLease.room}
                </div>
                <div className="info-item">
                  <strong>Monthly Rent:</strong><br />
                  {formatCurrency(currentLease.monthly_rent)}
                </div>
                <div className="info-item">
                  <strong>Security Deposit:</strong><br />
                  {formatCurrency(currentLease.security_deposit)}
                </div>
                <div className="info-item">
                  <strong>Lease Period:</strong><br />
                  {currentLease.start_date} to {currentLease.end_date}
                </div>
                <div className="info-item">
                  <strong>Status:</strong><br />
                  <StatusBadge status="active" text="Active Lease" />
                </div>
              </div>
            ) : (
              <EmptyState 
                title="No Active Lease"
                description="This tenant is not currently assigned to any property."
                action={
                  <button
                    onClick={() => alert('Create lease feature coming soon')}
                    className="btn btn-primary"
                  >
                    ➕ Create New Lease
                  </button>
                }
              />
            )}
          </div>

          {/* Applications History */}
          <div className="applications-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Application History</h2>
                <p className="section-subtitle">{applications.length} application{applications.length !== 1 ? 's' : ''} on record</p>
              </div>
            </div>
            {applications.length > 0 ? (
              <DataTable 
                columns={applicationsTableColumns}
                data={applicationsTableData}
                renderRow={renderApplicationRow}
              />
            ) : (
              <EmptyState 
                title="No Applications Found"
                description="This tenant hasn't submitted any rental applications yet."
              />
            )}
          </div>

          {/* Quick Actions */}
          <div className="quick-actions-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Quick Actions</h2>
                <p className="section-subtitle">Common tenant management tasks</p>
              </div>
            </div>
            <div className="actions-grid">
              <Link href={`/applications?tenant=${tenant.id}`} className="btn btn-primary">
                View Applications
              </Link>
              <Link href="/leases" className="btn btn-secondary">
                All Leases
              </Link>
              <Link href="/tenants" className="btn btn-secondary">
                All Tenants
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>

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

        .header-right {
          flex-shrink: 0;
          display: flex;
          gap: 12px;
        }

        .dashboard-title {
          font-size: 22px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
          line-height: 1.15;
        }

        .subtitle-container {
          min-height: 22px;
        }

        .welcome-message {
          font-size: 14px;
          color: #4b5563;
          margin: 0;
          line-height: 1.45;
        }

        .back-btn,
        .all-tenants-btn {
          background: #6366f1;
          color: white;
          border: none;
          padding: 10px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .back-btn:hover,
        .all-tenants-btn:hover {
          background: #4f46e5;
          transform: translateY(-1px);
        }

        /* Section Styling */
        .tenant-info-section,
        .housing-section,
        .applications-section,
        .quick-actions-section {
          background: white;
          border-radius: 6px;
          padding: 18px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
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
        
        /* Info Grid */
        .tenant-info-grid, 
        .lease-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }
        
        .info-item {
          padding: 14px;
          background: #f8fafc;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
        }

        .info-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .info-item strong {
          color: #1e293b;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .info-item a {
          color: #6366f1;
          text-decoration: none;
          font-weight: 500;
        }
        
        .info-item a:hover {
          text-decoration: underline;
        }
        
        /* Actions Grid */
        .actions-grid {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        /* Button Styling */
        .btn {
          padding: 12px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          text-decoration: none;
          border: none;
        }

        .btn-primary {
          background: #6366f1;
          color: white;
        }

        .btn-primary:hover {
          background: #4f46e5;
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: #f8fafc;
          color: #1e293b;
          border: 1px solid #e2e8f0;
        }

        .btn-secondary:hover {
          background: #f1f5f9;
          transform: translateY(-1px);
        }

        .btn-sm {
          padding: 8px 12px;
          font-size: 12px;
        }
        
        .actions-container {
          margin-bottom: 20px;
        }
        
        /* Loading State */
        .loading-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          text-align: center;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Alert Styling */
        .alert {
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          font-size: 14px;
        }
        
        .alert-error {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 16px;
          }

          .header-content {
            flex-direction: column;
            gap: 16px;
          }

          .header-right {
            align-self: flex-start;
          }

          .tenant-info-grid, 
          .lease-info-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .actions-grid {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
} 