import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '../components/Navigation';
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

  if (loading) {
    return (
      <div>
        <Navigation />
        <h1>Loading Tenants...</h1>
        <p>Fetching tenant data from the server...</p>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <h1>👥 Tenant Management</h1>
      
      {error && (
        <div style={{ 
          color: 'red', 
          border: '1px solid red', 
          padding: '10px', 
          marginBottom: '20px',
          backgroundColor: '#ffebee'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div style={{ 
          color: 'green', 
          border: '1px solid green', 
          padding: '10px', 
          marginBottom: '20px',
          backgroundColor: '#e8f5e8'
        }}>
          <strong>Success:</strong> {success}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{marginBottom: '20px'}}>
        <Link href="/tenants/add">
          <button style={{
            backgroundColor: '#28a745',
            color: 'white',
            padding: '10px 15px',
            border: 'none',
            marginRight: '10px',
            cursor: 'pointer'
          }}>
            ➕ Register New Tenant
          </button>
        </Link>
        <button 
          onClick={fetchTenants}
          disabled={loading}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            padding: '10px 15px',
            border: 'none',
            marginRight: '10px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          🔄 Refresh
        </button>
        <button 
          onClick={downloadTenantsReport}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            padding: '10px 15px',
            border: 'none',
            marginRight: '10px',
            cursor: 'pointer'
          }}
        >
          📊 Download Report
        </button>
        <button 
          onClick={downloadContactList}
          style={{
            backgroundColor: '#17a2b8',
            color: 'white',
            padding: '10px 15px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          📞 Download Contacts
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div style={{
          border: '1px solid #ddd',
          padding: '20px',
          marginBottom: '20px',
          backgroundColor: '#f8f9fa'
        }}>
          <h2>{editingTenant ? 'Edit Tenant' : 'Add New Tenant'}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{marginBottom: '15px'}}>
              <label>Full Name:</label>
              <br />
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                required
                style={{width: '100%', padding: '8px'}}
              />
            </div>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px'}}>
              <div>
                <label>Email:</label>
                <br />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  style={{width: '100%', padding: '8px'}}
                />
              </div>
              <div>
                <label>Phone:</label>
                <br />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                  style={{width: '100%', padding: '8px'}}
                />
              </div>
            </div>

            <div style={{marginBottom: '15px'}}>
              <label>Date of Birth:</label>
              <br />
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                required
                style={{padding: '8px'}}
              />
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px'}}>
              <div>
                <label>Emergency Contact Name:</label>
                <br />
                <input
                  type="text"
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                  required
                  style={{width: '100%', padding: '8px'}}
                />
              </div>
              <div>
                <label>Emergency Contact Phone:</label>
                <br />
                <input
                  type="tel"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                  required
                  style={{width: '100%', padding: '8px'}}
                />
              </div>
            </div>

            <div>
              <button 
                type="submit"
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  marginRight: '10px',
                  cursor: 'pointer'
                }}
              >
                {editingTenant ? 'Update Tenant' : 'Create Tenant'}
              </button>
              <button 
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingTenant(null);
                  setFormData({
                    full_name: '',
                    email: '',
                    phone: '',
                    date_of_birth: '',
                    emergency_contact_name: '',
                    emergency_contact_phone: ''
                  });
                }}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tenants Table */}
      <h2>All Tenants ({tenants?.length || 0})</h2>
      {tenants && tenants.length > 0 ? (
        <table border={1} style={{width: '100%', borderCollapse: 'collapse'}}>
        <thead>
            <tr style={{backgroundColor: '#f8f9fa'}}>
              <th style={{padding: '10px', textAlign: 'left'}}>Name</th>
              <th style={{padding: '10px', textAlign: 'left'}}>Email</th>
              <th style={{padding: '10px', textAlign: 'left'}}>Phone</th>
              <th style={{padding: '10px', textAlign: 'left'}}>Current Property</th>
              <th style={{padding: '10px', textAlign: 'left'}}>Current Room</th>
              <th style={{padding: '10px', textAlign: 'center'}}>Application Status</th>
              <th style={{padding: '10px', textAlign: 'center'}}>Lease Status</th>
              <th style={{padding: '10px', textAlign: 'center'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
            {tenants.map(tenant => (
            <tr key={tenant.id}>
                <td style={{padding: '10px'}}>
                  <strong>{tenant.full_name}</strong>
                  <br />
                  <small>ID: {tenant.id}</small>
                </td>
                <td style={{padding: '10px'}}>{tenant.email}</td>
                <td style={{padding: '10px'}}>{tenant.phone}</td>
                <td style={{padding: '10px'}}>
                  {tenant.current_property_name || <em>Not assigned</em>}
                </td>
                <td style={{padding: '10px'}}>
                  {tenant.current_room_name || <em>Not assigned</em>}
                </td>
                <td style={{padding: '10px', textAlign: 'center'}}>
                  {tenant.current_application_status ? (
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '3px',
                      fontSize: '12px',
                      backgroundColor: tenant.current_application_status === 'approved' ? '#d4edda' : 
                                     tenant.current_application_status === 'pending' ? '#fff3cd' : '#f8d7da',
                      color: tenant.current_application_status === 'approved' ? '#155724' : 
                             tenant.current_application_status === 'pending' ? '#856404' : '#721c24'
                    }}>
                      {tenant.current_application_status.toUpperCase()}
                    </span>
                  ) : (
                    <em>No application</em>
                  )}
                </td>
                <td style={{padding: '10px', textAlign: 'center'}}>
                  {tenant.current_lease_status ? (
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '3px',
                      fontSize: '12px',
                      backgroundColor: tenant.current_lease_status === 'active' ? '#d4edda' : '#f8d7da',
                      color: tenant.current_lease_status === 'active' ? '#155724' : '#721c24'
                    }}>
                      {tenant.current_lease_status.toUpperCase()}
                    </span>
                  ) : (
                    <em>No lease</em>
                  )}
                </td>
                <td style={{padding: '10px', textAlign: 'center'}}>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center'}}>
                    <Link href={{ pathname: '/tenants/[id]', query: { id: tenant.id } }}>
                      <button style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        borderRadius: '4px',
                        minWidth: '80px'
                      }}>
                        👤 View Details
                      </button>
                    </Link>
                    <button 
                      onClick={() => handleEdit(tenant)}
                      style={{
                        backgroundColor: '#ffc107',
                        color: 'black',
                        border: 'none',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        borderRadius: '4px',
                        minWidth: '80px'
                      }}
                    >
                      ✏️ Edit
                    </button>
                    
                    {tenant.current_lease_status === 'active' ? (
                      <Link href="/leases">
                        <button style={{
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          borderRadius: '4px',
                          minWidth: '80px'
                        }}>
                          📜 View Lease
                        </button>
                      </Link>
                    ) : tenant.current_application_status === 'pending' ? (
                      <Link href="/applications">
                        <button style={{
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          borderRadius: '4px',
                          minWidth: '80px'
                        }}>
                          📋 View App
                </button>
                      </Link>
                    ) : (
                      <Link href="/applications">
                        <button style={{
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          borderRadius: '4px',
                          minWidth: '80px'
                        }}>
                          ➕ New App
                </button>
                      </Link>
                    )}
                    
                    <button 
                      onClick={() => handleDelete(tenant.id)}
                      style={{
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        borderRadius: '4px',
                        minWidth: '80px'
                      }}
                    >
                      🗑️ Delete
                </button>
                  </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      ) : (
        <p>No tenants found. Add your first tenant using the button above.</p>
      )}

      {/* API Status */}
      <div style={{marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px'}}>
        <h4>🔌 API Status</h4>
        <p><strong>Backend:</strong> http://54.224.252.101/api/tenants/</p>
        <p><strong>Total Tenants:</strong> {tenants?.length || 0}</p>
        <p><em>Real-time data from your Django backend</em></p>
      </div>
    </div>
  );
}

export default withAuth(Tenants, ['admin', 'owner', 'manager']); 