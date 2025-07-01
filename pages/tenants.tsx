import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import DashboardLayout from '../components/DashboardLayout';
import { withAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';
import { Tenant, TenantFormData, Application, Lease } from '../lib/types';

function Tenants() {
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
        tenant.created_at
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

        {/* Main Content */}
        <div className="main-content">
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
                              {new Date(tenant.created_at).toLocaleDateString()}
                            </div>
                          </td>
                            
                          <td className="table-center">
                            <div className="action-buttons">
                              <button 
                                onClick={() => handleEdit(tenant)} 
                                className="edit-btn"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 20h9"/>
                                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                                </svg>
                                Edit
                              </button>
                              
                              <button 
                                onClick={() => handleViewApplications(tenant.id)}
                                className="applications-btn"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                  <polyline points="14,2 14,8 20,8"/>
                                </svg>
                                Applications
                              </button>
                            
                              <button
                                onClick={() => handleViewCurrentLease(tenant.id)}
                                className="lease-btn"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                  <polyline points="14,2 14,8 20,8"/>
                                  <line x1="16" y1="13" x2="8" y2="13"/>
                                  <line x1="16" y1="17" x2="8" y2="17"/>
                                </svg>
                                Lease
                              </button>
                            
                              <button 
                                onClick={() => handleDelete(tenant.id)}
                                className="delete-btn"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3,6 5,6 21,6"/>
                                  <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                                </svg>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

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

              <Link href="/applications" className="action-card blue">
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
              </Link>
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
        }

        /* Metrics Grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
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
          font-weight: 500;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .metric-change.positive {
          background: #dcfce7;
          color: #16a34a;
        }

        /* Main Content */
        .main-content {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }

        /* Section Styling */
        .tenants-section,
        .quick-actions-section {
          background: white;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          background: white;
        }

        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 2px 0;
        }

        .section-subtitle {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }

        .section-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
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
          color: #475569;
          border-color: #e2e8f0;
        }

        .refresh-btn:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .download-btn {
          background: #ecfdf5;
          color: #059669;
          border-color: #a7f3d0;
        }

        .download-btn:hover {
          background: #d1fae5;
        }

        .register-btn {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .register-btn:hover {
          background: #2563eb;
          border-color: #2563eb;
        }

        .save-btn {
          background: #10b981;
          color: white;
          border-color: #10b981;
        }

        .save-btn:hover {
          background: #059669;
        }

        .cancel-btn {
          background: #f8fafc;
          color: #475569;
          border-color: #e2e8f0;
        }

        .cancel-btn:hover {
          background: #f1f5f9;
        }

        .edit-btn {
          background: #fef3c7;
          color: #d97706;
          border-color: #fed7aa;
          font-size: 12px;
          padding: 4px 8px;
        }

        .edit-btn:hover {
          background: #fde68a;
        }

        .applications-btn {
          background: #dbeafe;
          color: #2563eb;
          border-color: #93c5fd;
          font-size: 12px;
          padding: 4px 8px;
        }

        .applications-btn:hover {
          background: #bfdbfe;
        }

        .lease-btn {
          background: #f3e8ff;
          color: #7c3aed;
          border-color: #c4b5fd;
          font-size: 12px;
          padding: 4px 8px;
        }

        .lease-btn:hover {
          background: #e9d5ff;
        }

        .delete-btn {
          background: #fee2e2;
          color: #dc2626;
          border-color: #fca5a5;
          font-size: 12px;
          padding: 4px 8px;
        }

        .delete-btn:hover {
          background: #fecaca;
        }

        .empty-action-btn {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
          padding: 8px 16px;
          font-size: 14px;
        }

        .empty-action-btn:hover {
          background: #2563eb;
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
          overflow-x: auto;
        }

        .tenants-table-container {
          min-width: 800px;
        }

        .tenants-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .tenants-table th {
          background: #f8fafc;
          color: #475569;
          font-weight: 600;
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
          font-size: 12px;
        }

        .tenants-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        .tenants-table tbody tr:hover {
          background: #f8fafc;
        }

        .table-left {
          text-align: left;
        }

        .table-center {
          text-align: center;
        }

        .tenant-name {
          font-weight: 500;
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
          font-weight: 500;
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
          font-size: 11px;
          color: #64748b;
        }

        .action-buttons {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          justify-content: center;
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
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          padding: 20px;
        }

        .action-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s ease;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
        }

        .action-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-color: #cbd5e1;
        }

        .action-card.blue {
          border-left: 3px solid #3b82f6;
        }

        .action-card.green {
          border-left: 3px solid #10b981;
        }

        .action-card.purple {
          border-left: 3px solid #8b5cf6;
        }

        .action-icon {
          width: 32px;
          height: 32px;
          background: #f8fafc;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          flex-shrink: 0;
        }

        .action-card.blue .action-icon {
          background: #dbeafe;
          color: #3b82f6;
        }

        .action-card.green .action-icon {
          background: #d1fae5;
          color: #10b981;
        }

        .action-card.purple .action-icon {
          background: #e9d5ff;
          color: #8b5cf6;
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
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 12px 16px;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .section-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .action-buttons {
            flex-direction: column;
            gap: 4px;
          }

          .actions-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .section-header {
            padding: 12px 16px;
          }

          .tenants-table th,
          .tenants-table td {
            padding: 8px 12px;
          }

          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}

export default withAuth(Tenants); 