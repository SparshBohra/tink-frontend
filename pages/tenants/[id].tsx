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
            ← Back
          </button>
                <Link href="/tenants" className="all-tenants-btn">
            All Tenants
          </Link>
              </div>
            </div>
        </div>

          {/* Main Content Layout */}
          <div className="main-content-grid">
            <div className="left-column">
              {/* Top Metrics Row */}
        <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-header">
                    <div className="metric-info">
                      <h3 className="metric-title">Lease Status</h3>
                      <div className="metric-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                          <polyline points="9,22 9,12 15,12 15,22"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="metric-content">
                    <div className="metric-value">{currentLease ? 'Active' : 'None'}</div>
                    <div className="metric-subtitle">{currentLease ? 'Currently leasing' : 'No active lease'}</div>
                    <div className="metric-progress">
                      <span className="metric-label">Status</span>
                      <span className={`metric-change ${currentLease ? 'positive' : 'neutral'}`}>
                        {currentLease ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-header">
                    <div className="metric-info">
                      <h3 className="metric-title">Monthly Rent</h3>
                      <div className="metric-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="1" x2="12" y2="23"/>
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="metric-content">
                    <div className="metric-value">
                      {currentLease ? formatCurrency(currentLease.monthly_rent) : '$0'}
                    </div>
                    <div className="metric-subtitle">Current rent amount</div>
                    <div className="metric-progress">
                      <span className="metric-label">Per month</span>
                      <span className="metric-change positive">
                        {currentLease ? 'Due monthly' : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-header">
                    <div className="metric-info">
                      <h3 className="metric-title">Applications</h3>
                      <div className="metric-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14,2 14,8 20,8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="metric-content">
                    <div className="metric-value">{applications.length}</div>
                    <div className="metric-subtitle">Total applications</div>
                    <div className="metric-progress">
                      <span className="metric-label">Submitted</span>
                      <span className="metric-change positive">
                        {applications.filter(app => app.status === 'approved').length} approved
                      </span>
                    </div>
                  </div>
                </div>
        </div>

        {/* Tenant Information */}
              <div className="tenant-info-section">
                <div className="section-header">
                  <div>
                    <h2 className="section-title">Tenant Information ({Object.keys(tenant).length} details)</h2>
                    <p className="section-subtitle">Contact details and personal information</p>
                  </div>
                  <div className="section-actions">
                    <button
                      onClick={() => alert('Edit feature coming soon')}
                      className="refresh-btn"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Edit Details
                    </button>
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
                    <h2 className="section-title">Application History ({applications.length})</h2>
                    <p className="section-subtitle">{applications.length} application{applications.length !== 1 ? 's' : ''} on record</p>
                  </div>
                </div>
          {applications.length > 0 ? (
                  <div className="applications-scroll-container">
                    <div className="applications-table-container">
                      <table className="applications-table">
                        <thead>
                          <tr>
                            <th className="table-left">Property</th>
                            <th className="table-left">Room</th>
                            <th className="table-center">Status</th>
                            <th className="table-center">Date</th>
                            <th className="table-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {applications.map((app) => (
                            <tr key={app.id}>
                              <td className="table-left">
                                <div className="property-name">
                                  {app.room ? `Property ${app.room}` : 'Unknown Property'}
                                </div>
                              </td>
                              <td className="table-left">
                                <div className="room-name">
                                  {app.room ? `Room ${app.room}` : 'Not specified'}
                                </div>
                              </td>
                              <td className="table-center">
                                <StatusBadge 
                                  status={app.status === 'approved' ? 'active' : app.status === 'pending' ? 'pending' : 'inactive'} 
                                  text={app.status.toUpperCase()}
                                />
                              </td>
                              <td className="table-center">
                                <div className="application-date">
                                  {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'Unknown'}
                                </div>
                              </td>
                              <td className="table-center">
                                <Link href={`/applications?tenant=${tenant.id}`} className="view-btn">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                  </svg>
                                  View Details
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                    </div>
                    <h3>No Applications Found</h3>
                    <p>This tenant hasn't submitted any rental applications yet.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="right-column">
              {/* Quick Actions Section */}
              <div className="quick-actions-section">
                <div className="section-header">
                  <div>
                    <h2 className="section-title">Quick Actions</h2>
                    <p className="section-subtitle">Common tenant management tasks</p>
                  </div>
                </div>
                
          <div className="actions-grid">
                  <Link href={`/applications?tenant=${tenant.id}`} className="action-card blue">
                    <div className="action-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                    </div>
                    <div className="action-content">
                      <h3 className="action-title">View Applications</h3>
                      <p className="action-subtitle">See all applications</p>
                    </div>
            </Link>

                  <a href={`mailto:${tenant.email}`} className="action-card green">
                    <div className="action-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </div>
                    <div className="action-content">
                      <h3 className="action-title">Send Email</h3>
                      <p className="action-subtitle">Contact tenant directly</p>
                    </div>
                  </a>

                  <button 
                    onClick={() => alert('Create lease feature coming soon')}
                    className="action-card purple"
                  >
                    <div className="action-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9,22 9,12 15,12 15,22"/>
                      </svg>
                    </div>
                    <div className="action-content">
                      <h3 className="action-title">Create Lease</h3>
                      <p className="action-subtitle">Set up new lease</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Contact Information */}
              <div className="contact-section">
                <div className="section-header">
                  <div>
                    <h2 className="section-title">Contact Information</h2>
                    <p className="section-subtitle">Quick contact details</p>
                  </div>
                </div>
                
                <div className="contact-grid">
                  <div className="contact-card">
                    <div className="contact-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </div>
                    <div className="contact-content">
                      <h4 className="contact-title">Email</h4>
                      <p className="contact-description">{tenant.email}</p>
                      <a href={`mailto:${tenant.email}`} className="contact-btn">Send Email</a>
                    </div>
                  </div>
                  
                  <div className="contact-card">
                    <div className="contact-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                    </div>
                    <div className="contact-content">
                      <h4 className="contact-title">Phone</h4>
                      <p className="contact-description">{tenant.phone}</p>
                      <a href={`tel:${tenant.phone}`} className="contact-btn">Call Now</a>
                    </div>
                  </div>

                  {tenant.emergency_contact_name && (
                    <div className="contact-card">
                      <div className="contact-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      </div>
                      <div className="contact-content">
                        <h4 className="contact-title">Emergency Contact</h4>
                        <p className="contact-description">{tenant.emergency_contact_name}</p>
                        {tenant.emergency_contact_phone && (
                          <a href={`tel:${tenant.emergency_contact_phone}`} className="contact-btn">
                            Call Emergency
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
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

        /* Main Layout Grid */
        .main-content-grid {
          display: grid;
          grid-template-columns: 2.5fr 1fr;
          gap: 24px;
          align-items: flex-start;
        }

        .left-column, .right-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Metrics Grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .metric-card {
          background: white;
          border-radius: 6px;
          padding: 14px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .metric-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .metric-title {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          margin: 0;
        }

        .metric-icon {
          width: 20px;
          height: 20px;
          color: #64748b;
        }

        .metric-content {
          margin-top: 8px;
        }

        .metric-value {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 3px;
          line-height: 1;
        }

        .metric-subtitle {
          font-size: 11px;
          color: #64748b;
          margin-bottom: 10px;
        }

        .metric-progress {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .metric-label {
          font-size: 12px;
          color: #64748b;
        }

        .metric-change {
          font-size: 12px;
          font-weight: 600;
        }

        .metric-change.positive {
          color: #10b981;
        }

        .metric-change.neutral {
          color: #64748b;
        }

        /* Section Styling */
        .tenant-info-section,
        .housing-section,
        .applications-section,
        .quick-actions-section,
        .contact-section {
          background: white;
          border-radius: 6px;
          padding: 18px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          height: fit-content;
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

        .section-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .refresh-btn {
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
          padding: 10px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .refresh-btn:hover {
          background: #e2e8f0;
          transform: translateY(-1px);
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
        
        /* Applications Table */
        .applications-scroll-container {
          overflow-y: auto;
          max-height: 500px;
        }

        .applications-scroll-container::-webkit-scrollbar {
          width: 6px;
        }

        .applications-scroll-container::-webkit-scrollbar-track {
          background: rgba(226, 232, 240, 0.3);
          border-radius: 3px;
        }

        .applications-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }

        .applications-table-container {
          width: 100%;
          overflow-x: auto;
          border-radius: 8px;
          background: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .applications-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }

        .applications-table th {
          position: sticky;
          top: 0;
          background: #f8fafc;
          z-index: 2;
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
          padding: 12px 10px;
          border-bottom: 2px solid #e2e8f0;
        }

        .applications-table td {
          font-size: 14px;
          padding: 16px 10px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .applications-table tr:last-child td {
          border-bottom: none;
        }

        .property-name,
        .room-name {
          font-weight: 500;
          color: #374151;
        }
        
        .application-date {
          font-size: 13px;
          color: #64748b;
        }

        .view-btn {
          background: #f0f0f0;
          color: #000000;
          border: 1px solid #e2e8f0;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;
          text-decoration: none;
          margin: 0 auto;
        }

        .view-btn:hover {
          background: #e2e8f0;
          transform: translateY(-1px);
        }

        .view-btn svg {
          stroke: #000000;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #64748b;
        }

        .empty-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 16px;
          color: #cbd5e1;
        }

        .empty-state h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        .empty-state p {
          font-size: 14px;
          margin: 0 0 20px 0;
        }

        /* Quick Actions */
        .actions-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .action-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 5px;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .action-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .action-card.blue {
          background: #eff6ff;
          border-color: #dbeafe;
        }

        .action-card.green {
          background: #f0fdf4;
          border-color: #dcfce7;
        }

        .action-card.purple {
          background: #faf5ff;
          border-color: #e9d5ff;
        }

        .action-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .action-card.blue .action-icon {
          background: #3b82f6;
          color: white;
        }

        .action-card.green .action-icon {
          background: #10b981;
          color: white;
        }

        .action-card.purple .action-icon {
          background: #8b5cf6;
          color: white;
        }

        .action-content {
          flex: 1;
        }

        .action-title {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 3px 0;
        }

        .action-subtitle {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        /* Contact Section */
        .contact-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .contact-card {
          display: flex;
          gap: 12px;
          padding: 12px;
          border-radius: 5px;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
          background: #f9fafb;
        }
        
        .contact-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          border-color: #cbd5e1;
        }
        
        .contact-icon {
          width: 36px;
          height: 36px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: #e5e7eb;
          color: #4b5563;
        }
        
        .contact-content {
          flex: 1;
        }
        
        .contact-title {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 3px 0;
        }
        
        .contact-description {
          font-size: 12px;
          color: #64748b;
          margin: 0 0 8px 0;
        }
        
        .contact-btn {
          background: none;
          border: 1px solid #d1d5db;
          color: #374151;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-block;
        }
        
        .contact-btn:hover {
          background: #e5e7eb;
          border-color: #9ca3af;
        }

        /* Utility classes for alignment */
        .table-left { text-align: left !important; }
        .table-right { text-align: right !important; }
        .table-center { text-align: center !important; }

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
        @media (max-width: 1200px) {
          .main-content-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }

        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

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

          .applications-table-container {
            overflow-x: scroll;
          }

          .applications-table th,
          .applications-table td {
            padding: 12px 8px;
            font-size: 12px;
          }

          .section-actions {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>
    </>
  );
} 