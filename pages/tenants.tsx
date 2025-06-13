import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Navigation from '../components/Navigation';
import DashboardLayout from '../components/DashboardLayout';
import SectionCard from '../components/SectionCard';
import EmptyState from '../components/EmptyState';
import DataTable from '../components/DataTable';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';
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
    date_of_birth: '',
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
        date_of_birth: '',
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
      date_of_birth: tenant.date_of_birth || '',
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
          `• ${app.property_name || 'Unknown Property'} - Status: ${app.status.toUpperCase()}`
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
          `Property: ${lease.property_name}\n` +
          `Room: ${lease.room_name}\n` +
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
      ['ID', 'Full Name', 'Email', 'Phone', 'Date of Birth', 'Emergency Contact', 'Emergency Phone', 'Current Property', 'Current Room', 'Application Status', 'Lease Status'],
      ...tenants.map(tenant => [
        tenant.id.toString(),
        tenant.full_name,
          tenant.email,
          tenant.phone,
        tenant.date_of_birth || '',
        tenant.emergency_contact_name || '',
        tenant.emergency_contact_phone || '',
        tenant.current_property_name || 'Not assigned',
        tenant.current_room_name || 'Not assigned',
        tenant.current_application_status || 'No application',
        tenant.current_lease_status || 'No lease'
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
      ['Name', 'Phone', 'Email', 'Emergency Contact', 'Emergency Phone', 'Property', 'Room'],
      ...tenants.map(tenant => [
        tenant.full_name,
          tenant.phone,
          tenant.email,
        tenant.emergency_contact_name || '',
        tenant.emergency_contact_phone || '',
        tenant.current_property_name || 'Not assigned',
        tenant.current_room_name || 'Not assigned'
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

  // Count tenants by status
  const getTenantMetrics = () => {
    const activeCount = tenants.filter(t => t.current_lease_status === 'active').length;
    const pendingCount = tenants.filter(t => t.current_application_status === 'pending').length;
    const totalCount = tenants.length;
    
    return { activeCount, pendingCount, totalCount };
  };
  
  const metrics = getTenantMetrics();

  if (loading) {
    return (
      <>
        <Navigation />
        <DashboardLayout
          title="Tenant Management"
          subtitle="Loading tenant data..."
        >
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
            <p>Fetching tenant data...</p>
      </div>
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
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Tenant Management - Tink Property Management</title>
      </Head>
      <Navigation />
      
      <DashboardLayout
        title="Tenant Management"
        subtitle="Manage active tenants across all properties"
      >
        {/* Alerts */}
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        
        {/* Metrics */}
        <div className="metrics-grid">
          <MetricCard 
            title="Total Tenants" 
            value={metrics.totalCount}
            color="blue"
          />
          
          <MetricCard 
            title="Active Tenants" 
            value={metrics.activeCount}
            subtitle="With current leases"
            color="green"
          />
          
          <MetricCard 
            title="Pending Applications" 
            value={metrics.pendingCount}
            color="amber"
          />
        </div>

        {/* Actions */}
        <SectionCard>
          <div className="actions-container">
        <button 
              className="btn btn-primary"
              onClick={() => {
                setEditingTenant(null);
                setFormData({
                  full_name: '',
                  email: '',
                  phone: '',
                  date_of_birth: '',
                  emergency_contact_name: '',
                  emergency_contact_phone: ''
                });
                setShowForm(true);
              }}
            >
              Register New Tenant
            </button>
            
            <button 
              className="btn btn-secondary"
              onClick={() => fetchTenants()}
        >
              Refresh
        </button>
            
        <button 
              className="btn btn-secondary"
          onClick={downloadTenantsReport}
            >
              Download Report
        </button>
            
        <button 
              className="btn btn-secondary"
          onClick={downloadContactList}
            >
              Download Contacts
        </button>
      </div>
        </SectionCard>

        {/* Tenant Form */}
      {showForm && (
          <SectionCard 
            title={editingTenant ? "Edit Tenant" : "Register New Tenant"}
            subtitle={editingTenant ? `Updating information for ${editingTenant.full_name}` : "Add a new tenant to the system"}
          >
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
                  <label htmlFor="date_of_birth" className="form-label">
                    Date of Birth
                  </label>
              <input
                    id="date_of_birth"
                    name="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                    className="form-input"
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
                  value={formData.emergency_contact_name}
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
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                    className="form-input"
                    placeholder="+1 (555) 987-6543"
                />
              </div>
            </div>

              <div className="form-actions">
              <button 
                type="submit"
                  className="btn btn-primary"
              >
                  {editingTenant ? 'Update Tenant' : 'Save Tenant'}
              </button>
                
              <button 
                type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
          </SectionCard>
      )}

        {/* Tenant List */}
        <SectionCard
          title="All Tenants"
          subtitle={`${tenants.length} ${tenants.length === 1 ? 'tenant' : 'tenants'} registered in the system`}
        >
          {tenants.length === 0 ? (
            <EmptyState
              title="No tenants found"
              description="There are no tenants registered in the system yet."
              action={
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setEditingTenant(null);
                    setShowForm(true);
                  }}
                >
                  Register First Tenant
                </button>
              }
            />
          ) : (
            <DataTable
              columns={[
                { key: 'name', header: 'Tenant', width: '25%' },
                { key: 'contact', header: 'Contact Information', width: '20%' },
                { key: 'property', header: 'Current Property', width: '20%' },
                { key: 'status', header: 'Status', width: '15%' },
                { key: 'actions', header: 'Actions', width: '20%' }
              ]}
              data={tenants}
              renderRow={(tenant, index) => (
            <tr key={tenant.id}>
                  <td className="tenant-name-cell">
                    <div className="tenant-name">{tenant.full_name}</div>
                    <div className="tenant-id">ID: {tenant.id}</div>
                </td>
                  
                  <td>
                    <div className="tenant-contact">
                      <div>{tenant.phone}</div>
                      <div className="tenant-email">{tenant.email}</div>
                    </div>
                </td>
                  
                  <td>
                    {tenant.current_property_name ? (
                      <div>
                        <div>{tenant.current_property_name}</div>
                        <div className="tenant-room">{tenant.current_room_name || 'Room not assigned'}</div>
                      </div>
                    ) : (
                      <span className="text-muted">Not assigned</span>
                  )}
                </td>
                  
                  <td>
                    <div className="tenant-statuses">
                      {tenant.current_lease_status && (
                        <StatusBadge status={tenant.current_lease_status} />
                      )}
                      
                      {tenant.current_application_status && (
                        <StatusBadge status={tenant.current_application_status} />
                      )}
                      
                      {!tenant.current_lease_status && !tenant.current_application_status && (
                        <StatusBadge status="neutral" text="No active status" />
                  )}
                    </div>
                </td>
                  
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => handleEdit(tenant)} 
                        className="btn btn-secondary"
                      >
                        Edit
                      </button>
                      
                    <button 
                        onClick={() => handleViewApplications(tenant.id)}
                        className="btn btn-secondary"
                    >
                        Applications
                    </button>
                    
                      <button
                        onClick={() => handleViewCurrentLease(tenant.id)}
                        className="btn btn-secondary"
                      >
                        Lease
                </button>
                    
                    <button 
                      onClick={() => handleDelete(tenant.id)}
                        className="btn btn-error"
                    >
                        Delete
                </button>
                  </div>
              </td>
            </tr>
              )}
            />
          )}
        </SectionCard>
      </DashboardLayout>
      
      <style jsx>{`
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
        }
        
        .actions-container {
          display: flex;
          gap: var(--spacing-md);
          flex-wrap: wrap;
        }
        
        .tenant-form {
          width: 100%;
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
        }
        
        .form-actions {
          display: flex;
          gap: var(--spacing-md);
          justify-content: flex-end;
        }
        
        .tenant-name {
          font-weight: 500;
          color: var(--gray-900);
        }
        
        .tenant-id {
          font-size: var(--text-small);
          color: var(--gray-400);
        }
        
        .tenant-email {
          font-size: var(--text-small);
          color: var(--gray-600);
        }
        
        .tenant-room {
          font-size: var(--text-small);
          color: var(--gray-600);
        }
        
        .tenant-statuses {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }
        
        .action-buttons {
          display: flex;
          gap: var(--spacing-xs);
          flex-wrap: wrap;
        }
        
        .action-buttons .btn {
          padding: 6px 12px;
          font-size: var(--text-small);
        }
        
        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          
          .action-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}

export default withAuth(Tenants); 