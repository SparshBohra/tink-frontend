import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import DashboardLayout from '../components/DashboardLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth, withAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';
import { Tenant, TenantFormData, Application, Lease, Property, Room } from '../lib/types';
import ApplicationDetailModal from '../components/ApplicationDetailModal';
import { phoneUtils } from '../lib/utils';
import USPhoneInput, { validateUSPhone, getUSPhoneError, toE164Format } from '../components/USPhoneInput';

function Tenants() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<{ id: number; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Application Detail Modal State
  const [isApplicationDetailOpen, setIsApplicationDetailOpen] = useState(false);
  const [selectedApplicationForDetail, setSelectedApplicationForDetail] = useState<Application | null>(null);
  

  
  // Phone validation states
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emergencyPhoneError, setEmergencyPhoneError] = useState<string | null>(null);

  useEffect(() => {
    fetchTenants();
    fetchPropertiesAndRooms();
  }, []);

  const fetchPropertiesAndRooms = async () => {
    try {
      const [propertiesResponse, roomsResponse] = await Promise.all([
        apiClient.getProperties(),
        apiClient.getRooms()
      ]);
      setProperties(propertiesResponse.results || []);
      setRooms(roomsResponse.results || []);
    } catch (error: any) {
      console.error('Failed to fetch properties and rooms:', error);
    }
  };

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
      
      // Format phone numbers to E.164 format for API
      const apiFormData = {
        ...formData,
        phone: formData.phone ? phoneUtils.toE164Format(formData.phone) : '',
        emergency_contact_phone: formData.emergency_contact_phone ? phoneUtils.toE164Format(formData.emergency_contact_phone) : ''
      };
      
      if (editingTenant) {
        // Update existing tenant
        const updatedTenant = await apiClient.updateTenant(editingTenant.id, apiFormData);
        setTenants(tenants.map(t => t.id === editingTenant.id ? updatedTenant : t));
        setSuccess(`Tenant "${updatedTenant.full_name}" updated successfully!`);
      } else {
        // Create new tenant
        const newTenant = await apiClient.createTenant(apiFormData);
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
      console.error('Failed to save tenant:', error);
      
      // Handle specific API errors
      if (error?.response?.data) {
        const errorData = error.response.data;
        if (errorData.phone) {
          setError(`Phone number error: ${Array.isArray(errorData.phone) ? errorData.phone.join(', ') : errorData.phone}`);
        } else if (errorData.emergency_contact_phone) {
          setError(`Emergency phone error: ${Array.isArray(errorData.emergency_contact_phone) ? errorData.emergency_contact_phone.join(', ') : errorData.emergency_contact_phone}`);
        } else if (errorData.email) {
          setError(`Email error: ${Array.isArray(errorData.email) ? errorData.email.join(', ') : errorData.email}`);
        } else {
      setError(error?.message || 'Failed to save tenant');
        }
      } else {
        setError(error?.message || 'Failed to save tenant');
      }
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

  const handleDeleteTenant = (tenantId: number, tenantName: string) => {
    setTenantToDelete({ id: tenantId, name: tenantName });
    setShowDeleteModal(true);
  };

  const confirmDeleteTenant = async () => {
    if (!tenantToDelete) return;

    setDeleteLoading(true);
    setError(null);

    try {
      // Call API to delete tenant
      await apiClient.deleteTenant(tenantToDelete.id);
      
      // Remove tenant from state
      setTenants(tenants.filter(t => t.id !== tenantToDelete.id));
      
      // Close modal and reset state
      setShowDeleteModal(false);
      setTenantToDelete(null);
      setError(null);
      
    } catch (err: any) {
      console.error('Failed to delete tenant:', err);
      setError(err.message || 'Failed to delete tenant. Please try again.');
      setShowDeleteModal(false);
      setTenantToDelete(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDeleteTenant = () => {
    setShowDeleteModal(false);
    setTenantToDelete(null);
    setDeleteLoading(false);
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
      } else if (applications.length === 1) {
        // Single application - open detail modal directly
        setSelectedApplicationForDetail(applications[0]);
        setIsApplicationDetailOpen(true);
      } else {
        // Multiple applications - show selection dialog
        const appList = applications.map((app, index) => 
          `${index + 1}. Property: ${getPropertyName(app.property_ref)} - Status: ${app.status.toUpperCase()} - Applied: ${new Date(app.application_date).toLocaleDateString()}`
        ).join('\n');
        
        const selection = prompt(
          `${tenant?.full_name} has ${applications.length} applications:\n\n${appList}\n\nEnter the number (1-${applications.length}) to view details, or press Cancel to go to Applications page:`
        );
        
        if (selection) {
          const index = parseInt(selection) - 1;
          if (index >= 0 && index < applications.length) {
            setSelectedApplicationForDetail(applications[index]);
            setIsApplicationDetailOpen(true);
          } else {
            alert('Invalid selection. Please enter a number between 1 and ' + applications.length);
          }
        } else {
          window.location.href = '/applications';
        }
      }
    } catch (error: any) {
      setError(error?.message || 'Failed to load applications');
    }
  };

  const getPropertyName = (propertyId: number) => {
    const property = properties.find(p => p.id === propertyId);
    return property ? property.name : `Property #${propertyId}`;
  };

  const openApplicationDetail = (application: Application) => {
    setSelectedApplicationForDetail(application);
    setIsApplicationDetailOpen(true);
  };

  // Dummy handlers for ApplicationDetailModal
  const handleQuickApprove = async (applicationId: number, propertyId: number) => {
    alert('Approval functionality not available from tenants page. Please use the Applications page.');
  };

  const handleReject = async (applicationId: number) => {
    alert('Rejection functionality not available from tenants page. Please use the Applications page.');
  };

  const handleAssignRoom = (application: Application) => {
    alert('Room assignment functionality not available from tenants page. Please use the Applications page.');
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
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  const metrics = getTenantMetrics();

  return (
    <DashboardLayout title="">
      <Head>
        <title>People Management - Tink Property Management</title>
      </Head>
      
      <div className="dashboard-container">
        {/* Modern Title Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: '2rem',
          transition: 'all 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}>
          <div style={{
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                backgroundColor: '#2563eb',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div>
                <h1 style={{
                  fontSize: '1.875rem',
                  fontWeight: '700',
                  color: '#111827',
                  margin: 0,
                  marginBottom: '0.25rem'
                }}>Tenant Management</h1>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#6b7280'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  </svg>
                  Manage tenants across all properties
              </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.75rem',
                  color: '#9ca3af',
                  marginTop: '0.25rem'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  {tenants.length} {tenants.length === 1 ? 'tenant' : 'tenants'} total
                </div>
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <button 
                onClick={() => {
                  fetchTenants();
                  fetchPropertiesAndRooms();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 4v6h6"/>
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                </svg>
                Refresh
              </button>
              <button
                onClick={() => setShowForm(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#2563eb',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14"/>
                  <path d="M5 12h14"/>
                </svg>
                Add Tenant
              </button>
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
            {/* Top Metrics Row (3 cards left) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1.5rem',
              marginBottom: '0.75rem'
            }}>
              {[
                {
                  title: 'Total Tenants',
                  value: metrics.totalCount,
                  subtitle: 'Registered in system',
                  label: 'Active accounts',
                  change: `+${metrics.totalCount > 0 ? '1' : '0'}`,
                  changeType: 'positive',
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                  </svg>,
                  color: '#2563eb',
                  bgColor: '#dbeafe'
                },
                {
                  title: 'Active Tenants',
                  value: metrics.activeCount,
                  subtitle: 'Currently active',
                  label: 'In the system',
                  change: '+2',
                  changeType: 'positive',
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="8.5" cy="7" r="4"/>
                        <path d="M20 8v6"/>
                        <path d="M23 11h-6"/>
                  </svg>,
                  color: '#059669',
                  bgColor: '#d1fae5'
                },
                {
                  title: 'Applications',
                  value: metrics.pendingCount,
                  subtitle: 'Pending review',
                  label: 'Check Applications page',
                  change: `+${metrics.pendingCount > 0 ? '1' : '0'}`,
                  changeType: 'positive',
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>,
                  color: '#ea580c',
                  bgColor: '#fed7aa'
                }
              ].map((metric, index) => (
                <div key={index} style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <h3 style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      margin: 0,
                      textTransform: 'uppercase',
                      letterSpacing: '0.025em'
                    }}>
                      {metric.title}
                    </h3>
                    <div style={{
                      backgroundColor: metric.bgColor,
                      borderRadius: '8px',
                      padding: '0.5rem',
                      color: metric.color
                    }}>
                      {metric.icon}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#111827',
                    marginBottom: '0.25rem',
                    lineHeight: 1
                  }}>
                    {metric.value}
                </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    marginBottom: '0.5rem'
                  }}>
                    {metric.subtitle}
                  </div>
                  <div style={{ height: '0.25rem' }}></div>
              </div>
              ))}
            </div>
            {/* Tenants Section */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#111827',
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>All Tenants ({tenants.length})</h2>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: 0
                  }}>{tenants.length} tenant(s) registered in the system</p>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <button 
                    onClick={() => fetchTenants()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f1f5f9';
                      e.currentTarget.style.borderColor = '#cbd5e1';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 4v6h6"/>
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                    </svg>
                    Refresh
                  </button>
                  <button 
                    onClick={downloadTenantsReport}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7,10 12,15 17,10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download Report
                  </button>
                  <button 
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
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: '#16a34a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14"/>
                      <path d="M5 12h14"/>
                    </svg>
                    Register New Tenant
                  </button>
                </div>
              </div>

              {/* Tenant Form */}
              {showForm && (
                <div style={{
                  padding: '1.5rem',
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: '#f8fafc'
                }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#111827',
                      margin: 0,
                      marginBottom: '0.25rem'
                    }}>
                      {editingTenant ? "Edit Tenant" : "Register New Tenant"}
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      margin: 0
                    }}>
                      {editingTenant ? `Updating information for ${editingTenant.full_name}` : "Add a new tenant to the system"}
                    </p>
                  </div>
                  
                  <form onSubmit={handleSubmit} style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                          Full Name *
                        </label>
                        <input
                          name="full_name"
                          type="text"
                          value={formData.full_name}
                          onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                          required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '0.875rem'
                        }}
                          placeholder="John Doe"
                        />
                      </div>
                      
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                          Email Address *
                        </label>
                        <input
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '0.875rem'
                        }}
                          placeholder="john.doe@example.com"
                        />
                      </div>
                        
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                          Phone Number *
                        </label>
                        <USPhoneInput
                          name="phone"
                          value={formData.phone}
                          onChange={(value) => {
                            setFormData({...formData, phone: value});
                            const phoneErrorMsg = getUSPhoneError(value);
                            setPhoneError(phoneErrorMsg);
                          }}
                          required
                          error={phoneError}
                          placeholder="(555) 123-4567"
                        />
                        {formData.phone && !phoneError && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#16a34a',
                          marginTop: '0.25rem'
                        }}>
                            ✓ Valid phone number
                          </div>
                        )}
                      </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                          Emergency Contact Name
                        </label>
                        <input
                          name="emergency_contact_name"
                          type="text"
                          value={formData.emergency_contact_name || ''}
                          onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '0.875rem'
                        }}
                          placeholder="Jane Doe"
                        />
                      </div>
                        
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                          Emergency Contact Phone
                        </label>
                        <USPhoneInput
                          name="emergency_contact_phone"
                          value={formData.emergency_contact_phone || ''}
                          onChange={(value) => {
                            setFormData({...formData, emergency_contact_phone: value});
                            
                            // Only validate if there's a value (emergency phone is optional)
                            if (value.trim()) {
                              const phoneErrorMsg = getUSPhoneError(value);
                              setEmergencyPhoneError(phoneErrorMsg);
                            } else {
                              setEmergencyPhoneError(null);
                            }
                          }}
                          error={emergencyPhoneError}
                          placeholder="(555) 987-6543"
                        />
                        {formData.emergency_contact_phone && !emergencyPhoneError && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#16a34a',
                          marginTop: '0.25rem'
                        }}>
                            ✓ Valid phone number
                          </div>
                        )}
                      </div>
                  </form>

                  <div style={{
                    display: 'flex',
                    gap: '0.75rem'
                  }}>
                      <button 
                        type="submit"
                      onClick={handleSubmit}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                      >
                        {editingTenant ? 'Update Tenant' : 'Save Tenant'}
                      </button>
                        
                      <button 
                        type="button"
                        onClick={() => setShowForm(false)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#f8fafc',
                        color: '#374151',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#f1f5f9';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                      >
                        Cancel
                      </button>
                    </div>
                </div>
              )}

              {tenants.length === 0 ? (
                <div style={{
                  padding: '3rem',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  <div style={{
                    width: '3rem',
                    height: '3rem',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem'
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#374151',
                    margin: '0 0 0.5rem'
                  }}>No tenants registered</h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: 0
                  }}>Start by registering your first tenant in the system.</p>
                  <button 
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
                    style={{
                      marginTop: '1rem',
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                  >
                    Register New Tenant
                  </button>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse'
                  }}>
                      <thead>
                      <tr style={{ backgroundColor: '#f8fafc' }}>
                        <th style={{
                          padding: '0.75rem 1rem',
                          textAlign: 'left',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#374151',
                          borderBottom: '1px solid #e5e7eb'
                        }}>Tenant</th>
                        <th style={{
                          padding: '0.75rem 1rem',
                          textAlign: 'left',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#374151',
                          borderBottom: '1px solid #e5e7eb'
                        }}>Contact Information</th>
                        <th style={{
                          padding: '0.75rem 1rem',
                          textAlign: 'left',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#374151',
                          borderBottom: '1px solid #e5e7eb'
                        }}>Emergency Contact</th>
                        <th style={{
                          padding: '0.75rem 1rem',
                          textAlign: 'center',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#374151',
                          borderBottom: '1px solid #e5e7eb'
                        }}>Created</th>
                        <th style={{
                          padding: '0.75rem 1rem',
                          textAlign: 'center',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#374151',
                          borderBottom: '1px solid #e5e7eb'
                        }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tenants.map((tenant) => (
                        <tr key={tenant.id} style={{
                          borderBottom: '1px solid #f3f4f6',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <td style={{
                            padding: '1rem',
                            textAlign: 'left',
                            borderBottom: '1px solid #f3f4f6'
                          }}>
                            <Link href={`/tenants/${tenant.id}`}>
                              <div style={{
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                color: '#374151',
                                cursor: 'pointer',
                                marginBottom: '0.25rem',
                                transition: 'color 0.2s ease'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.color = '#1f2937'}
                              onMouseOut={(e) => e.currentTarget.style.color = '#374151'}>
                                {tenant.full_name}
                              </div>
                              </Link>
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#6b7280'
                            }}>ID: {tenant.id}</div>
                            </td>
                              
                          <td style={{
                            padding: '1rem',
                            textAlign: 'left',
                            borderBottom: '1px solid #f3f4f6'
                          }}>
                            <div style={{
                              fontSize: '0.875rem',
                              color: '#374151',
                              marginBottom: '0.25rem'
                            }}>{phoneUtils.displayPhoneNumber(tenant.phone)}</div>
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#6b7280'
                            }}>{tenant.email}</div>
                            </td>
                              
                          <td style={{
                            padding: '1rem',
                            textAlign: 'left',
                            borderBottom: '1px solid #f3f4f6'
                          }}>
                              {tenant.emergency_contact_name ? (
                                <div>
                                <div style={{
                                  fontSize: '0.875rem',
                                  color: '#374151',
                                  marginBottom: '0.25rem'
                                }}>{tenant.emergency_contact_name}</div>
                                <div style={{
                                  fontSize: '0.75rem',
                                  color: '#6b7280'
                                }}>{tenant.emergency_contact_phone ? phoneUtils.displayPhoneNumber(tenant.emergency_contact_phone) : 'No phone'}</div>
                                </div>
                              ) : (
                              <span style={{
                                fontSize: '0.875rem',
                                color: '#9ca3af',
                                fontStyle: 'italic'
                              }}>Not provided</span>
                              )}
                            </td>

                          <td style={{
                            padding: '1rem',
                            textAlign: 'center',
                            borderBottom: '1px solid #f3f4f6'
                          }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'center'
                            }}>
                              <span style={{
                                backgroundColor: '#f3f4f6',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                color: '#374151'
                              }}>
                                  {formatDate(tenant.created_at)}
                                </span>
                              </div>
                            </td>
                              
                          <td style={{
                            padding: '1rem',
                            textAlign: 'center',
                            borderBottom: '1px solid #f3f4f6'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem'
                            }}>
                              <button 
                                onClick={() => router.push(`/tenants/${tenant.id}`)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.375rem',
                                  padding: '0.5rem 0.875rem',
                                  backgroundColor: '#2563eb',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '0.8125rem',
                                  fontWeight: '500',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                  </svg>
                                  Manage
                                </button>
                                <button 
                                  onClick={() => handleDeleteTenant(tenant.id, tenant.full_name)} 
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '2.25rem',
                                  height: '2.25rem',
                                  backgroundColor: '#fef2f2',
                                  color: '#dc2626',
                                  border: '1px solid #fecaca',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.backgroundColor = '#fee2e2';
                                  e.currentTarget.style.borderColor = '#fca5a5';
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.backgroundColor = '#fef2f2';
                                  e.currentTarget.style.borderColor = '#fecaca';
                                }}
                                  title="Delete tenant"
                                >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M3 6h18"/>
                                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
              )}
            </div>
          </div>

          <div className="right-column">
            {/* Quick Actions Section (acts as 4th card) */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              height: 'fit-content',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
            }}>
              <div style={{
                marginBottom: '1.5rem'
              }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#111827',
                  margin: '0 0 0.25rem 0'
                }}>
                  Quick Actions
                </h2>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: 0
                }}>
                  Common tenant management tasks
                </p>
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {[
                  {
                    title: 'Register Tenant',
                    subtitle: 'Add new tenant to system',
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="8.5" cy="7" r="4"/>
                      <path d="M20 8v6"/>
                      <path d="M23 11h-6"/>
                    </svg>,
                    color: 'blue',
                    onClick: () => {
                    setEditingTenant(null);
                    setFormData({
                      full_name: '',
                      email: '',
                      phone: '',
                      emergency_contact_name: '',
                      emergency_contact_phone: ''
                    });
                    setShowForm(true);
                    }
                  },
                  {
                    title: 'Download Report',
                    subtitle: 'Export tenant data to CSV',
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7,10 12,15 17,10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>,
                    color: 'green',
                    onClick: downloadTenantsReport
                  },
                  {
                    title: 'Contact List',
                    subtitle: 'Download contact information',
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>,
                    color: 'purple',
                    onClick: downloadContactList
                  },
                  {
                    title: 'View Applications',
                    subtitle: 'Review tenant applications',
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>,
                    color: 'orange',
                    onClick: () => router.push('/applications')
                  }
                ].map((action, index) => (
                  <div 
                    key={index} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '1rem',
                      backgroundColor: action.color === 'blue' ? '#eff6ff' : 
                                       action.color === 'green' ? '#f0fdf4' : 
                                       action.color === 'orange' ? '#fff7ed' : '#faf5ff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={action.onClick}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = action.color === 'blue' ? '#dbeafe' : 
                                                             action.color === 'green' ? '#dcfce7' : 
                                                             action.color === 'orange' ? '#fed7aa' : '#e9d5ff';
                      e.currentTarget.style.borderColor = action.color === 'blue' ? '#2563eb' : 
                                                          action.color === 'green' ? '#059669' : 
                                                          action.color === 'orange' ? '#ea580c' : '#7c3aed';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = action.color === 'blue' ? '#eff6ff' : 
                                                             action.color === 'green' ? '#f0fdf4' : 
                                                             action.color === 'orange' ? '#fff7ed' : '#faf5ff';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  >
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      backgroundColor: action.color === 'blue' ? '#dbeafe' : 
                                       action.color === 'green' ? '#d1fae5' : 
                                       action.color === 'orange' ? '#fed7aa' : '#e9d5ff',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: action.color === 'blue' ? '#2563eb' : 
                             action.color === 'green' ? '#059669' : 
                             action.color === 'orange' ? '#ea580c' : '#7c3aed'
                    }}>
                      {action.icon}
                  </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#111827',
                        margin: '0 0 0.125rem 0'
                      }}>
                        {action.title}
                      </h3>
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        margin: 0
                      }}>
                        {action.subtitle}
                      </p>
                  </div>
                </div>
                ))}
              </div>
            </div>
          </div>
        </div>


      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && tenantToDelete && (
        <div className="delete-modal">
          <div className="modal-content delete-modal-content">
            <div className="modal-header">
              <div className="modal-title-section">
                <div className="warning-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                    <path d="M12 9v4"/>
                    <path d="m12 17 .01 0"/>
                  </svg>
                </div>
                <div>
                  <h2>Delete Tenant</h2>
                  <p>This action cannot be undone</p>
                </div>
              </div>
            </div>

            <div className="modal-section">
              <p className="delete-message">
                Are you sure you want to delete <strong>"{tenantToDelete.name}"</strong>? 
                This will permanently remove the tenant and all associated data.
              </p>
            </div>

            <div className="modal-actions">
              <button 
                onClick={cancelDeleteTenant}
                className="cancel-btn"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteTenant} 
                className="delete-confirm-btn"
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <div className="loading-spinner-small"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3,6 5,6 21,6"/>
                      <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                      <line x1="10" y1="11" x2="10" y2="17"/>
                      <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                    Delete Tenant
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .dashboard-container {
          width: 100%;
          padding: 16px 20px 20px 20px;
          background: #f8fafc;
          min-height: calc(100vh - 72px);
          box-sizing: border-box;
        }

        .tab-navigation {
          margin: 20px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .tab-list {
          display: flex;
          gap: 0;
        }

        .tab-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: none;
          border: none;
          color: #6b7280;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s ease;
        }

        .tab-button:hover {
          color: #374151;
          background: #f9fafb;
        }

        .tab-button.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
          background: white;
        }

        .tab-count {
          background: #e5e7eb;
          color: #6b7280;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          min-width: 20px;
          text-align: center;
        }

        .tab-button.active .tab-count {
          background: #dbeafe;
          color: #3b82f6;
        }

        .vendors-section {
          padding: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .vendors-table-container {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .vendors-table {
          width: 100%;
          border-collapse: collapse;
        }

        .vendors-table th,
        .vendors-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }

        .vendors-table th {
          background: #f9fafb;
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }

        .vendor-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .vendor-name {
          font-weight: 600;
          color: #111827;
        }

        .vendor-id {
          font-size: 12px;
          color: #6b7280;
        }

        .vendor-type-badge {
          display: inline-block;
          padding: 4px 8px;
          background: #dbeafe;
          color: #1e40af;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .vendor-contact {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 13px;
        }

        .contact-person {
          font-weight: 500;
          color: #374151;
        }

        .contact-email {
          color: #6b7280;
        }

        .contact-phone {
          color: #6b7280;
        }

        .expense-amount {
          font-weight: 600;
          color: #059669;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-badge.active {
          background: #d1fae5;
          color: #065f46;
        }

        .status-badge.inactive {
          background: #fee2e2;
          color: #991b1b;
        }

        .create-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .create-btn:hover {
          background: #2563eb;
        }

        .edit-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: #f3f4f6;
          color: #374151;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: background 0.2s ease;
          margin-right: 8px;
        }

        .edit-btn:hover {
          background: #e5e7eb;
        }

        .delete-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px;
          background: #fee2e2;
          color: #dc2626;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .delete-btn:hover {
          background: #fecaca;
        }

        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 40px;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .empty-icon {
          margin: 0 auto 16px;
          color: #9ca3af;
        }

        .empty-state h3 {
          margin: 0 0 8px 0;
          color: #374151;
          font-size: 18px;
          font-weight: 600;
        }

        .empty-state p {
          margin: 0 0 24px 0;
          color: #6b7280;
          font-size: 14px;
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

        /* Metrics Grid - aligns with 3:1 layout */
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
          grid-template-columns: 3fr 1fr;
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

        /* Action Buttons */
        .action-buttons {
          display: flex;
          gap: 4px;
          justify-content: center;
          align-items: center;
        }

        /* Icon Button Styles */
        .icon-btn {
          background: none;
          border: none;
          padding: 8px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          width: 32px;
          height: 32px;
        }

        .delete-icon-btn {
          color: #dc2626;
          background: #fef2f2;
          border: 1px solid #fecaca;
        }

        .delete-icon-btn:hover {
          background: #fee2e2;
          color: #b91c1c;
          transform: translateY(-1px);
        }

        /* Delete Modal */
        .delete-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .delete-modal-content {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          padding: 20px;
        }

        .modal-title-section {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .warning-icon {
          width: 48px;
          height: 48px;
          background: #fee2e2;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #dc2626;
          flex-shrink: 0;
        }

        .delete-modal-content .modal-header h2 {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 4px 0;
        }

        .delete-modal-content .modal-header p {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .modal-section {
          margin: 20px 0;
        }

        .delete-message {
          font-size: 14px;
          color: #374151;
          line-height: 1.5;
          margin: 0;
        }

        .delete-message strong {
          color: #1f2937;
          font-weight: 600;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 20px;
        }

        .delete-confirm-btn {
          background: #dc2626;
          color: white;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .delete-confirm-btn:hover:not(:disabled) {
          background: #b91c1c;
        }

        .delete-confirm-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .loading-spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid #ffffff40;
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Vendor Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .vendor-form-modal {
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          padding: 0;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 24px 0;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 24px;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #111827;
        }

        .close-btn {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
        }

        .close-btn:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .vendor-form {
          padding: 0 24px 24px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 6px;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s ease;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #374151;
        }

        .checkbox-label input[type="checkbox"] {
          width: 16px;
          height: 16px;
          margin: 0;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }

        .submit-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .submit-btn:hover {
          background: #2563eb;
        }

        .submit-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .delete-modal-content {
          width: 100%;
          max-width: 500px;
        }

        .modal-title-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .warning-icon {
          color: #f59e0b;
        }

        .modal-section {
          padding: 0 24px 24px;
        }

        .delete-message {
          color: #374151;
          font-size: 14px;
          line-height: 1.5;
          margin: 0;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 0 24px 24px;
        }

        .delete-confirm-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #dc2626;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .delete-confirm-btn:hover {
          background: #b91c1c;
        }

        .delete-confirm-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .loading-spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          
          .modal-overlay {
            padding: 10px;
          }
          
          .vendor-form-modal {
            max-height: 95vh;
          }
        }
      `}</style>
      
      {/* Application Detail Modal */}
      {isApplicationDetailOpen && selectedApplicationForDetail && (
        <ApplicationDetailModal
          isOpen={isApplicationDetailOpen}
          application={selectedApplicationForDetail}
          properties={properties}
          rooms={rooms}
          onClose={() => {
            setIsApplicationDetailOpen(false);
            setSelectedApplicationForDetail(null);
          }}
          onApprove={handleQuickApprove}
          onReject={handleReject}
          onAssignRoom={handleAssignRoom}
        />
      )}




    </DashboardLayout>
  );
}

export default withAuth(Tenants); 