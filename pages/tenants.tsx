import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
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
          title="Registered Tenants" 
          value={metrics.activeCount}
          subtitle="In the system"
          color="green"
        />
        
        <MetricCard 
          title="Applications" 
          value={metrics.pendingCount}
          subtitle="Check Applications page"
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

      {/* Tenants List */}
      <SectionCard title="All Tenants" subtitle={`${tenants.length} tenant(s) registered in the system`}>
        {tenants.length === 0 ? (
          <EmptyState 
            title="No tenants registered"
            description="Start by registering your first tenant in the system."
            actionText="Register New Tenant"
            onAction={() => {
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
          />
        ) : (
          <DataTable
            headers={['Tenant', 'Contact Information', 'Emergency Contact', 'Created', 'Actions']}
            data={tenants.map(tenant => (
              <tr key={tenant.id}>
                <td className="tenant-name-cell">
                  <Link href={`/tenants/${tenant.id}`} className="tenant-name-link">
                    <div className="tenant-name">{tenant.full_name}</div>
                  </Link>
                  <div className="tenant-id">ID: {tenant.id}</div>
                </td>
                  
                <td>
                  <div className="tenant-contact">
                    <div>{tenant.phone}</div>
                    <div className="tenant-email">{tenant.email}</div>
                  </div>
                </td>
                  
                <td>
                  {tenant.emergency_contact_name ? (
                    <div>
                      <div>{tenant.emergency_contact_name}</div>
                      <div className="tenant-emergency-phone">{tenant.emergency_contact_phone || 'No phone'}</div>
                    </div>
                  ) : (
                    <span className="text-muted">Not provided</span>
                  )}
                </td>

                <td>
                  <div className="tenant-date">
                    {new Date(tenant.created_at).toLocaleDateString()}
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
            ))}
          />
        )}
      </SectionCard>
      
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
          transition: color 0.2s ease;
        }
        
        .tenant-name-link {
          text-decoration: none;
          color: inherit;
          display: inline-block;
          border-radius: 4px;
          padding: 2px 4px;
          margin: -2px -4px;
          transition: background-color 0.2s ease;
        }
        
        .tenant-name-link:hover {
          background-color: var(--primary-blue-light, #eff6ff);
          text-decoration: none;
        }
        
        .tenant-name-link:hover .tenant-name {
          color: var(--primary-blue);
          cursor: pointer;
        }
        
        .tenant-id {
          font-size: var(--text-small);
          color: var(--gray-400);
        }
        
        .tenant-email {
          font-size: var(--text-small);
          color: var(--gray-600);
        }
        
        .tenant-emergency-phone {
          font-size: var(--text-small);
          color: var(--gray-600);
        }

        .tenant-date {
          font-size: var(--text-small);
          color: var(--gray-600);
        }
        
        .action-buttons {
          display: flex;
          gap: var(--spacing-xs);
          flex-wrap: wrap;
          justify-content: center;
        }
        
        .action-buttons .btn {
          padding: 6px 12px;
          font-size: var(--text-small);
        }
        
        /* Explicit center alignment for all table cell content */
        .tenant-name-cell {
          text-align: center;
        }
        
        .tenant-contact {
          text-align: center;
        }
        
        /* Ensure all table content is centered */
        :global(.data-table td) {
          text-align: center !important;
        }
        
        :global(.data-table td > *) {
          text-align: center;
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
    </DashboardLayout>
  );
}

export default withAuth(Tenants); 