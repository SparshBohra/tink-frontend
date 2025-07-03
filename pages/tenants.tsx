import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import DashboardLayout from '../components/DashboardLayout';
import { withAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';
import { Tenant, TenantFormData, Application, Lease } from '../lib/types';

function Tenants() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState<TenantFormData>({
    full_name: '',
    email: '',
    phone: '',
    emergency_contact_name: '',
    emergency_contact_phone: ''
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching tenants...');
      const response = await apiClient.getTenants();
      console.log('Tenants response:', response);
      setTenants(response.results || []);
      console.log('Tenants set:', response.results?.length || 0, 'tenants');
    } catch (error: any) {
      console.error('Fetch tenants error:', error);
      setError(error?.message || 'Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      setSuccess(null);
      
      if (editingTenant) {
        // Update existing tenant
        const updatedTenant = await apiClient.updateTenant(editingTenant.id, formData);
        setTenants(tenants.map(t => t.id === editingTenant.id ? updatedTenant : t));
        setSuccess(`Tenant "${updatedTenant.full_name}" updated successfully!`);
      } else {
        // Create new tenant
        const newTenant = await apiClient.createTenant(formData);
        setTenants([...tenants, newTenant]);
        setSuccess(`Tenant "${newTenant.full_name}" created successfully!`);
      }
      
      // Reset form
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        emergency_contact_name: '',
        emergency_contact_phone: ''
      });
      setShowForm(false);
      setEditingTenant(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error: any) {
      setError(error?.message || 'Failed to save tenant');
    }
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({
      full_name: tenant.full_name,
      email: tenant.email,
      phone: tenant.phone,
      emergency_contact_name: tenant.emergency_contact_name || '',
      emergency_contact_phone: tenant.emergency_contact_phone || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (tenantId: number) => {
    if (!confirm('Are you sure you want to delete this tenant?')) return;
    
    try {
      setError(null);
      await apiClient.deleteTenant(tenantId);
      setTenants(tenants.filter(t => t.id !== tenantId));
    } catch (error: any) {
      setError(error?.message || 'Failed to delete tenant');
    }
  };

  const handleViewApplications = async (tenantId: number) => {
    try {
      const applications = await apiClient.getTenantApplications(tenantId);
      const tenant = tenants.find(t => t.id === tenantId);
      
      if (applications.length === 0) {
        const createNew = confirm(
          `${tenant?.full_name} has no applications yet.\n\nWould you like to create a new application for them?`
        );
        if (createNew) {
          window.location.href = '/applications';
        }
      } else {
        const appDetails = applications.map(app => 
          `• Property ID: ${app.property_ref} - Status: ${app.status.toUpperCase()}`
        ).join('\n');
        
        const viewAll = confirm(
          `${tenant?.full_name} has ${applications.length} application(s):\n\n${appDetails}\n\nView all applications on the Applications page?`
        );
        if (viewAll) {
          window.location.href = '/applications';
        }
      }
    } catch (error: any) {
      setError(error?.message || 'Failed to load applications');
    }
  };

  const handleViewCurrentLease = async (tenantId: number) => {
    try {
      const lease = await apiClient.getTenantCurrentLease(tenantId);
      const tenant = tenants.find(t => t.id === tenantId);
      
      if (lease) {
        const daysUntilExpiry = Math.ceil((new Date(lease.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        const isExpiringSoon = daysUntilExpiry <= 90;
        
        const leaseInfo = `Current lease for ${tenant?.full_name}:\n\n` +
          `Property ID: ${lease.property_ref}\n` +
          `Room ID: ${lease.room}\n` +
          `Rent: $${lease.monthly_rent}/month\n` +
          `Lease Period: ${lease.start_date} to ${lease.end_date}\n` +
          `Days until expiry: ${daysUntilExpiry}\n` +
          `${isExpiringSoon ? '\n⚠️ EXPIRING SOON - Consider renewal!' : ''}`;
        
        const viewLeases = confirm(`${leaseInfo}\n\nView all leases on the Leases page?`);
        if (viewLeases) {
          window.location.href = '/leases';
        }
      } else {
        const createLease = confirm(
          `${tenant?.full_name} has no active lease.\n\nWould you like to check their applications or create a new lease?`
        );
        if (createLease) {
          window.location.href = '/applications';
        }
      }
    } catch (error: any) {
      setError(error?.message || 'Failed to load lease information');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  };

  const downloadTenantsReport = () => {
    const csvData = [
      ['ID', 'Full Name', 'Email', 'Phone', 'Emergency Contact', 'Emergency Phone', 'Created At'],
      ...tenants.map(tenant => [
        tenant.id.toString(),
        tenant.full_name,
        tenant.email,
        tenant.phone,
        tenant.emergency_contact_name || '',
        tenant.emergency_contact_phone || '',
        formatDate(tenant.created_at)
      ])
    ];
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tink-tenants-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const downloadContactList = () => {
    const csvData = [
      ['Name', 'Email', 'Phone', 'Emergency Contact', 'Emergency Phone'],
      ...tenants.map(tenant => [
        tenant.full_name,
        tenant.email,
        tenant.phone,
        tenant.emergency_contact_name || '',
        tenant.emergency_contact_phone || ''
      ])
    ];
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tink-tenant-contacts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getTenantMetrics = () => {
    const total = tenants.length;
    // Since we don't have lease status in the basic Tenant type, we'll show simplified metrics
    const active = tenants.length; // All tenants are considered "active" if they exist
    const pending = 0; // We'd need to fetch applications separately to get this
    
    return {
      totalCount: total,
      activeCount: active,
      pendingCount: pending
    };
  };

  if (loading) {
    return (
      <DashboardLayout 
        title="Tenant Management"
        subtitle="Manage active tenants across all properties"
      >
        <div className="loading-state">
          <div className="loading-spinner">Loading tenants...</div>
        </div>
        
        <style jsx>{`
          .loading-state {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 400px;
          }
          
          .loading-spinner {
            font-size: 18px;
            color: var(--gray-600);
          }
        `}</style>
      </DashboardLayout>
    );
  }

  const metrics = getTenantMetrics();

  return (
    <DashboardLayout title="">
      <Head>
        <title>Tenant Management - Tink Property Management</title>
      </Head>
      
      <div className="dashboard-container">
        {/* Custom Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="dashboard-title">Tenant Management</h1>
              <div className="subtitle-container">
                <p className="welcome-message">
                  Manage active tenants across all properties
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="error-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {error}
          </div>
        )}
        
        {success && (
          <div className="success-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
            {success}
          </div>
        )}
        
        {/* Main Content Layout */}
        <div className="main-content-grid">
          <div className="left-column">
            {/* Top Metrics Row */}
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-header">
                  <div className="metric-info">
                    <h3 className="metric-title">Total Tenants</h3>
                    <div className="metric-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="metric-content">
                  <div className="metric-value">{metrics.totalCount}</div>
                  <div className="metric-subtitle">Registered in system</div>
                  <div className="metric-progress">
                    <span className="metric-label">Active accounts</span>
                    <span className="metric-change positive">+{metrics.totalCount > 0 ? '1' : '0'}</span>
                  </div>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-header">
                  <div className="metric-info">
                    <h3 className="metric-title">Active Tenants</h3>
                    <div className="metric-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="8.5" cy="7" r="4"/>
                        <path d="M20 8v6"/>
                        <path d="M23 11h-6"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="metric-content">
                  <div className="metric-value">{metrics.activeCount}</div>
                  <div className="metric-subtitle">In the system</div>
                  <div className="metric-progress">
                    <span className="metric-label">Currently active</span>
                    <span className="metric-change positive">+2</span>
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
                  <div className="metric-value">{metrics.pendingCount}</div>
                  <div className="metric-subtitle">Check Applications page</div>
                  <div className="metric-progress">
                    <span className="metric-label">Pending review</span>
                    <span className="metric-change positive">+{metrics.pendingCount > 0 ? '1' : '0'}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Tenants Section */}
            <div className="tenants-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">All Tenants ({tenants.length})</h2>
                  <p className="section-subtitle">{tenants.length} tenant(s) registered in the system</p>
                </div>
                <div className="section-actions">
                  <button 
                    onClick={() => fetchTenants()}
                    className="refresh-btn"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 4 23 10 17 10"/>
                      <polyline points="1 20 1 14 7 14"/>
                      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                    </svg>
                    Refresh
                  </button>
                  <button 
                    onClick={downloadTenantsReport}
                    className="download-btn"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7,10 12,15 17,10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download Report
                  </button>
                  <button 
                    className="register-btn"
                    onClick={() => {
                      setEditingTenant(null);
                      setFormData({
                        full_name: '',
                        email: '',
                        phone: '',
                        emergency_contact_name: '',
                        emergency_contact_phone: ''
                      });
                      setShowForm(true);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Register New Tenant
                  </button>
                </div>
              </div>

              {/* Tenant Form */}
              {showForm && (
                <div className="tenant-form-section">
                  <div className="form-header">
                    <h3 className="form-title">
                      {editingTenant ? "Edit Tenant" : "Register New Tenant"}
                    </h3>
                    <p className="form-subtitle">
                      {editingTenant ? `Updating information for ${editingTenant.full_name}` : "Add a new tenant to the system"}
                    </p>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="tenant-form">
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="full_name" className="form-label">
                          Full Name *
                        </label>
                        <input
                          id="full_name"
                          name="full_name"
                          type="text"
                          value={formData.full_name}
                          onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                          required
                          className="form-input"
                          placeholder="John Doe"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="email" className="form-label">
                          Email Address *
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          required
                          className="form-input"
                          placeholder="john.doe@example.com"
                        />
                      </div>
                        
                      <div className="form-group">
                        <label htmlFor="phone" className="form-label">
                          Phone Number *
                        </label>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          required
                          className="form-input"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="emergency_contact_name" className="form-label">
                          Emergency Contact Name
                        </label>
                        <input
                          id="emergency_contact_name"
                          name="emergency_contact_name"
                          type="text"
                          value={formData.emergency_contact_name || ''}
                          onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                          className="form-input"
                          placeholder="Jane Doe"
                        />
                      </div>
                        
                      <div className="form-group">
                        <label htmlFor="emergency_contact_phone" className="form-label">
                          Emergency Contact Phone
                        </label>
                        <input
                          id="emergency_contact_phone"
                          name="emergency_contact_phone"
                          type="tel"
                          value={formData.emergency_contact_phone || ''}
                          onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                          className="form-input"
                          placeholder="+1 (555) 987-6543"
                        />
                      </div>
                    </div>

                    <div className="form-actions">
                      <button 
                        type="submit"
                        className="save-btn"
                      >
                        {editingTenant ? 'Update Tenant' : 'Save Tenant'}
                      </button>
                        
                      <button 
                        type="button"
                        className="cancel-btn"
                        onClick={() => setShowForm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {tenants.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <h3>No tenants registered</h3>
                  <p>Start by registering your first tenant in the system.</p>
                  <button 
                    className="empty-action-btn"
                    onClick={() => {
                      setEditingTenant(null);
                      setFormData({
                        full_name: '',
                        email: '',
                        phone: '',
                        emergency_contact_name: '',
                        emergency_contact_phone: ''
                      });
                      setShowForm(true);
                    }}
                  >
                    Register New Tenant
                  </button>
                </div>
              ) : (
                <div className="tenants-scroll-container">
                  <div className="tenants-table-container">
                    <table className="tenants-table">
                      <thead>
                        <tr>
                          <th className="table-left">Tenant</th>
                          <th className="table-left">Contact Information</th>
                          <th className="table-left">Emergency Contact</th>
                          <th className="table-center">Created</th>
                          <th className="table-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tenants.map((tenant) => (
                          <tr key={tenant.id}>
                            <td className="table-left">
                              <Link href={`/tenants/${tenant.id}`} className="tenant-name-link">
                                <div className="tenant-name">{tenant.full_name}</div>
                              </Link>
                              <div className="tenant-id">ID: {tenant.id}</div>
                            </td>
                              
                            <td className="table-left">
                              <div className="tenant-contact">
                                <div className="tenant-phone">{tenant.phone}</div>
                                <div className="tenant-email">{tenant.email}</div>
                              </div>
                            </td>
                              
                            <td className="table-left">
                              {tenant.emergency_contact_name ? (
                                <div>
                                  <div className="emergency-name">{tenant.emergency_contact_name}</div>
                                  <div className="emergency-phone">{tenant.emergency_contact_phone || 'No phone'}</div>
                                </div>
                              ) : (
                                <span className="text-muted">Not provided</span>
                              )}
                            </td>

                            <td className="table-center">
                              <div className="tenant-date">
                                <span className="date-highlight">
                                  {formatDate(tenant.created_at)}
                                </span>
                              </div>
                            </td>
                              
                            <td className="table-center">
                              <button onClick={() => router.push(`/tenants/${tenant.id}`)} className="manage-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 20h9"/>
                                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                                </svg>
                                Manage
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
                <div 
                  className="action-card blue"
                  onClick={() => {
                    setEditingTenant(null);
                    setFormData({
                      full_name: '',
                      email: '',
                      phone: '',
                      emergency_contact_name: '',
                      emergency_contact_phone: ''
                    });
                    setShowForm(true);
                  }}
                >
                  <div className="action-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="8.5" cy="7" r="4"/>
                      <path d="M20 8v6"/>
                      <path d="M23 11h-6"/>
                    </svg>
                  </div>
                  <div className="action-content">
                    <h3 className="action-title">Register Tenant</h3>
                    <p className="action-subtitle">Add new tenant to system</p>
                  </div>
                </div>

                <div className="action-card green" onClick={downloadTenantsReport}>
                  <div className="action-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7,10 12,15 17,10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  </div>
                  <div className="action-content">
                    <h3 className="action-title">Download Report</h3>
                    <p className="action-subtitle">Export tenant data to CSV</p>
                  </div>
                </div>

                <div className="action-card purple" onClick={downloadContactList}>
                  <div className="action-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  </div>
                  <div className="action-content">
                    <h3 className="action-title">Contact List</h3>
                    <p className="action-subtitle">Download contact information</p>
                  </div>
                </div>

                <div className="action-card blue" onClick={() => window.location.href = '/applications'}>
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
                    <p className="action-subtitle">Manage tenant applications</p>
                  </div>
                </div>
              </div>
            </div>
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

        .subtitle-container {
          min-height: 22px;
        }

        .welcome-message {
          font-size: 14px;
          color: #4b5563;
          margin: 0;
          line-height: 1.45;
        }

        /* Error and Success Banners */
        .error-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
        }

        .success-banner {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #16a34a;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
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

        /* Section Headers */
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

        /* Section Styling */
        .tenants-section,
        .quick-actions-section {
          background: white;
          border-radius: 6px;
          padding: 18px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          height: fit-content;
        }

        /* Button Styles */
        .refresh-btn,
        .download-btn,
        .register-btn,
        .save-btn,
        .cancel-btn,
        .edit-btn,
        .applications-btn,
        .lease-btn,
        .delete-btn,
        .empty-action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
          cursor: pointer;
          border: 1px solid transparent;
          text-decoration: none;
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

        .download-btn {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .download-btn:hover {
          background: #3730a3;
          transform: translateY(-1px);
        }

        .register-btn {
          background: #4f46e5;
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
        }
        
        .register-btn:hover {
          background: #3730a3;
          transform: translateY(-1px);
        }

        .save-btn {
          background: #10b981;
          color: white;
          border-color: #10b981;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .save-btn:hover {
          background: #059669;
        }

        .cancel-btn {
          background: #f8fafc;
          color: #475569;
          border: 1px solid #e2e8f0;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .cancel-btn:hover {
          background: #f1f5f9;
        }

        .edit-btn {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 5px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .edit-btn:hover {
          background: #3730a3;
          transform: translateY(-1px);
        }

        .applications-btn {
          background: #10b981;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 5px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .applications-btn:hover {
          background: #059669;
          transform: translateY(-1px);
        }

        .lease-btn {
          background: #475569;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 5px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .lease-btn:hover {
          background: #1e293b;
          transform: translateY(-1px);
        }

        .delete-btn {
          background: #ef4444;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 5px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .delete-btn:hover {
          background: #dc2626;
          transform: translateY(-1px);
        }

        .empty-action-btn {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: all 0.2s ease;
        }

        .empty-action-btn:hover {
          background: #3730a3;
          transform: translateY(-1px);
        }

        /* Form Styling */
        .tenant-form-section {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .form-header {
          margin-bottom: 20px;
        }

        .form-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .form-subtitle {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-label {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 6px;
        }

        .form-input {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
          transition: border-color 0.2s ease;
          background: white;
        }

        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        /* Table Styling */
        .tenants-scroll-container {
          overflow-y: auto;
          max-height: 600px;
        }

        .tenants-scroll-container::-webkit-scrollbar {
          width: 6px;
        }

        .tenants-scroll-container::-webkit-scrollbar-track {
          background: rgba(226, 232, 240, 0.3);
          border-radius: 3px;
        }

        .tenants-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }

        .tenants-table-container {
          width: 100%;
          overflow-x: auto;
          border-radius: 8px;
          background: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .tenants-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        
        .tenants-table tbody tr {
          transition: background-color 0.2s ease;
        }

        .tenants-table tbody tr:hover {
          background-color: #f9fafb;
        }

        .tenants-table th {
          position: sticky;
          top: 0;
          background: #ffffff;
          z-index: 2;
          font-size: 12px;
          font-weight: 600;
          color: #9ca3af;
          padding: 12px 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #e5e7eb;
          text-align: left;
        }

        .tenants-table td {
          padding: 12px 16px;
          vertical-align: middle;
          height: 48px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
          color: #374151;
        }
        
        .table-left {
          text-align: left !important;
        }

        .table-center {
          text-align: center !important;
        }

        .tenant-name {
          color: #1e293b;
          margin-bottom: 2px;
        }

        .tenant-name-link {
          text-decoration: none;
          color: inherit;
        }

        .tenant-name-link:hover .tenant-name {
          color: #3b82f6;
        }

        .tenant-id {
          font-size: 11px;
          color: #94a3b8;
        }

        .tenant-phone {
          font-weight: 500;
          color: #1e293b;
        }

        .tenant-email {
          font-size: 11px;
          color: #64748b;
        }

        .emergency-name {
          color: #1e293b;
        }

        .emergency-phone {
          font-size: 11px;
          color: #64748b;
        }

        .text-muted {
          color: #94a3b8;
          font-style: italic;
        }

        .tenant-date {
          font-size: 12px;
          color: #64748b;
        }

        .date-highlight {
          background-color: #f1f5f9;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
          color: #334155;
        }

        .action-buttons {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .manage-btn {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 5px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;
          text-decoration: none;
          margin: 0 auto;
        }

        .manage-btn:hover {
          background: #3730a3;
          transform: translateY(-1px);
        }

        .manage-btn svg {
          stroke: white;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 48px 24px;
        }

        .empty-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 16px;
          color: #cbd5e1;
        }

        .empty-state h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        .empty-state p {
          font-size: 13px;
          color: #64748b;
          margin: 0 0 20px 0;
        }

        /* Quick Actions Grid */
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
          margin: 0 0 2px 0;
        }

        .action-subtitle {
          font-size: 12px;
          color: #64748b;
          margin: 0;
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
            padding: 24px 16px;
          }

          .header-content {
            flex-direction: column;
            gap: 16px;
          }
          
          .dashboard-title {
            font-size: 28px;
          }
          
          .welcome-message {
            font-size: 14px;
          }
          
          .metric-card {
            padding: 16px;
          }
          
          .metric-value {
            font-size: 24px;
          }
          
          .tenants-section,
          .quick-actions-section {
            padding: 16px;
          }

          .tenants-table-container {
            overflow-x: scroll;
          }

          .tenants-table th,
          .tenants-table td {
            padding: 12px 8px;
            font-size: 12px;
          }

          .section-actions {
            flex-direction: column;
            gap: 8px;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .dashboard-container {
            padding: 16px;
          }

          .dashboard-title {
            font-size: 24px;
          }

          .welcome-message {
            font-size: 13px;
          }

          .section-header {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }
        }

        /* Dark Mode Styles */
        :global(.dark-mode) .dashboard-container { background: transparent; }
        :global(.dark-mode) .metric-card, 
        :global(.dark-mode) .tenants-section, 
        :global(.dark-mode) .quick-actions-section,
        :global(.dark-mode) .action-card {
          background: #111111 !important;
          border: 1px solid #333333 !important;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4) !important;
        }
        :global(.dark-mode) .metric-card:hover,
        :global(.dark-mode) .action-card:hover {
          background: #222222 !important;
          border-color: #ffffff !important;
        }
        :global(.dark-mode) .tenants-table th {
          background-color: #1a1a1a !important;
          border-bottom: 1px solid #333333 !important;
        }
        :global(.dark-mode) .tenants-table td {
          background-color: #111111 !important;
          border-bottom: 1px solid #333333 !important;
        }
        :global(.dark-mode) .tenants-table tbody tr:hover {
          background-color: #222222 !important;
        }
        :global(.dark-mode) .refresh-btn {
            background: #1a1a1a !important;
            border: 1px solid #333333 !important;
        }
        :global(.dark-mode) .refresh-btn:hover {
            background: #2a2a2a !important;
            border-color: #ffffff !important;
        }
        :global(.dark-mode) .empty-action-btn,
        :global(.dark-mode) .register-btn {
            background: #3b82f6 !important;
            border: none !important;
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2) !important;
        }
        :global(.dark-mode) .empty-action-btn:hover,
        :global(.dark-mode) .register-btn:hover {
            background: #2563eb !important;
            box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3) !important;
        }
        :global(.dark-mode) .download-btn {
            background: #1a1a1a !important;
            border: 1px solid #333333 !important;
            color: #10b981 !important;
        }
        :global(.dark-mode) .download-btn:hover {
            background: #2a2a2a !important;
            border-color: #ffffff !important;
        }
        :global(.dark-mode) .action-card.blue .action-icon { background: rgba(59, 130, 246, 0.3); }
        :global(.dark-mode) .action-card.green .action-icon { background: rgba(34, 197, 94, 0.3); }
        :global(.dark-mode) .action-card.purple .action-icon { background: rgba(139, 92, 246, 0.3); }

        :global(.dark-mode) .tenant-form-section { background: #1a1a1a !important; }
        :global(.dark-mode) .form-header { border-bottom-color: #333333 !important; }
        :global(.dark-mode) .form-input {
          background: #1a1a1a !important;
          border-color: #4b5563 !important;
          color: #d1d5db !important;
        }
        :global(.dark-mode) .form-input:focus { border-color: #3b82f6 !important; }
        :global(.dark-mode) .form-actions { border-top-color: #333333 !important; }
        :global(.dark-mode) .date-highlight {
          background-color: #334155;
          color: #e2e8f0;
        }
      `}</style>
    </DashboardLayout>
  );
}

export default withAuth(Tenants); 