import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { apiClient } from '../../../lib/api';
import { Tenant, TenantFormData, Property, Room } from '../../../lib/types';
import DashboardLayout from '../../../components/DashboardLayout';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { phoneUtils } from '../../../lib/utils';
import USPhoneInput, { validateUSPhone, getUSPhoneError, toE164Format } from '../../../components/USPhoneInput';

export default function EditTenant() {
  const router = useRouter();
  const { id } = router.query;
  const tenantId = typeof id === 'string' && !isNaN(Number(id)) ? Number(id) : null;
  
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState<TenantFormData>({
    full_name: '',
    email: '',
    phone: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    current_address: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    if (tenantId !== null) {
      fetchTenant();
    } else if (id) {
      setError('Invalid tenant ID.');
      setLoading(false);
    }
  }, [id, tenantId]);

  const fetchTenant = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const tenantData = await apiClient.getTenant(tenantId!);
      setTenant(tenantData);
      
      // Pre-populate form with existing data
      setFormData({
        full_name: tenantData.full_name || '',
        email: tenantData.email || '',
        phone: tenantData.phone || '',
        emergency_contact_name: tenantData.emergency_contact_name || '',
        emergency_contact_phone: tenantData.emergency_contact_phone || '',
        current_address: tenantData.current_address || ''
      });
    } catch (error: any) {
      console.error('Failed to fetch tenant:', error);
      setError(error?.message || 'Failed to load tenant data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhoneChange = (value: string) => {
    setFormData(prev => ({ ...prev, phone: value }));
    const phoneErrorMsg = getUSPhoneError(value);
    setPhoneError(phoneErrorMsg);
  };

  const handleEmergencyPhoneChange = (value: string) => {
    setFormData(prev => ({ ...prev, emergency_contact_phone: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tenantId) {
      setError('Invalid tenant ID');
      return;
    }

    // Validate required fields
    if (!formData.full_name || !formData.email || !formData.phone) {
      setError('Please fill in all required fields (Full Name, Email, Phone)');
      return;
    }

    // Validate phone number
    if (phoneError) {
      setError('Please fix the phone number error');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      // Prepare data for API
      const updateData: Partial<TenantFormData> = {
        full_name: formData.full_name,
        email: formData.email,
        phone: toE164Format(formData.phone),
        emergency_contact_name: formData.emergency_contact_name || undefined,
        emergency_contact_phone: formData.emergency_contact_phone ? toE164Format(formData.emergency_contact_phone) : undefined,
        current_address: formData.current_address || undefined
      };

      await apiClient.updateTenant(tenantId, updateData);
      setSuccess('Tenant updated successfully!');
      
      // Redirect to tenant details page after success
      setTimeout(() => {
        router.push(`/tenants/${tenantId}`);
      }, 2000);

    } catch (error: any) {
      console.error('Failed to update tenant:', error);
      setError(error?.message || 'Failed to update tenant');
    } finally {
      setSubmitting(false);
    }
  };

    if (loading) {
    return (
      <>
        <Head>
          <title>Edit Tenant - Tink Property Management</title>
        </Head>
        <DashboardLayout title="">
          <div className="dashboard-container">
            <div className="dashboard-header">
              <div className="header-content">
                <div className="header-left">
                  <h1 className="dashboard-title">Edit Tenant</h1>
                  <div className="subtitle-container">
                    <p className="welcome-message">Loading tenant information...</p>
                  </div>
                </div>
              </div>
            </div>
            <LoadingSpinner message="Loading tenant data..." />
          </div>
        </DashboardLayout>
      </>
    );
  }

  if (error && !tenant) {
    return (
      <>
        <Head>
          <title>Tenant Not Found - Tink Property Management</title>
        </Head>
        <DashboardLayout title="">
          <div className="dashboard-container">
            <div className="dashboard-header">
              <div className="header-content">
                <div className="header-left">
                  <h1 className="dashboard-title">Edit Tenant</h1>
                  <div className="subtitle-container">
                    <p className="welcome-message">Unable to load tenant data</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="alert alert-error">
              <strong>Error:</strong> {error}
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

  return (
    <>
      <Head>
        <title>Edit Tenant: {tenant?.full_name} - Tink Property Management</title>
      </Head>
      <DashboardLayout title="">
        <div className="dashboard-container" style={{ padding: '16px 20px 20px 20px' }}>
          <div className="dashboard-header">
            <div className="header-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div className="header-left">
                <h1 className="dashboard-title">Edit Tenant: {tenant?.full_name}</h1>
                <p className="welcome-message">Update tenant information</p>
              </div>
              <div className="header-actions">
                <button onClick={() => router.back()} className="back-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5m7 7l-7-7 7-7"/></svg>
                  <span>Back</span>
                </button>
              </div>
            </div>
          </div>

          <div className="main-content-grid">
            <div className="left-column">
              {error && (
                <div className="alert alert-error">
                  <strong>Error:</strong> {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success">
                  <strong>Success:</strong> {success}
                </div>
              )}

              <div style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '30px',
                marginBottom: '20px',
                backgroundColor: '#f8f9fa'
              }}>
                <form onSubmit={handleSubmit}>
                  <h2 style={{ marginBottom: '20px', color: '#333' }}>Tenant Information</h2>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        required
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '4px',
                          border: '1px solid #ddd'
                        }}
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '4px',
                          border: '1px solid #ddd'
                        }}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Phone *
                    </label>
                    <USPhoneInput
                      name="phone"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      required
                      error={phoneError}
                    />
                  </div>

                  <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', marginTop: '25px', color: '#333' }}>
                    Emergency Contact Information
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Emergency Contact Name
                      </label>
                      <input
                        type="text"
                        name="emergency_contact_name"
                        value={formData.emergency_contact_name}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '4px',
                          border: '1px solid #ddd'
                        }}
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Emergency Contact Phone
                      </label>
                      <USPhoneInput
                        name="emergency_contact_phone"
                        value={formData.emergency_contact_phone || ''}
                        onChange={handleEmergencyPhoneChange}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '30px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Current Address
                    </label>
                    <textarea
                      name="current_address"
                      value={formData.current_address}
                      onChange={handleChange}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <Link href={`/tenants/${tenantId}`} className="btn btn-secondary">
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={submitting || !!phoneError}
                      className={`btn ${submitting || phoneError ? 'btn-disabled' : 'btn-primary'}`}
                    >
                      {submitting ? 'Updating...' : 'Update Tenant'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            <div className="right-column">
              {/* Future content can be added here */}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
