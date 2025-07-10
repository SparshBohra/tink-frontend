import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { Tenant, Application, ApplicationFormData, Property, LeaseFormData, TenantFormData } from '../lib/types';
import { phoneUtils } from '../lib/utils';

interface PropertyTenantAssignmentModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function PropertyTenantAssignmentModal({
  property,
  isOpen,
  onClose,
  onSave,
}: PropertyTenantAssignmentModalProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<number | null>(null);
  const [leaseData, setLeaseData] = useState<Partial<LeaseFormData>>({
    start_date: '',
    end_date: '',
    monthly_rent: Number(property?.monthly_rent) || 0,
    security_deposit: Number(property?.monthly_rent) || 0,
  });
  const [activeTab, setActiveTab] = useState<'applications' | 'tenants' | 'create'>('applications');
  const [newTenantForm, setNewTenantForm] = useState<TenantFormData>({
    full_name: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update lease data when property changes
  useEffect(() => {
    if (property) {
      setLeaseData(prev => ({
        ...prev,
        monthly_rent: Number(property.monthly_rent) || 0,
        security_deposit: Number(property.monthly_rent) || 0,
      }));
    }
  }, [property]);

  useEffect(() => {
    if (isOpen && property) {
      fetchData();
    }
  }, [isOpen, property]);

  const fetchData = async () => {
    if (!property) return;
    
    try {
      setLoading(true);
      const [tenantRes, appRes, leaseRes] = await Promise.all([
        apiClient.getTenants(),
        apiClient.getApplications({ status: 'pending', property: property.id }),
        apiClient.getLeases(),
      ]);

      const allTenants = tenantRes.results || [];
      const leases = leaseRes.results || [];
      const tenantsWithLeases = new Set(
        leases
          .filter(lease => lease.status === 'active' || lease.status === 'draft')
          .map(lease => lease.tenant)
      );

      const availableTenants = allTenants.filter(tenant => !tenantsWithLeases.has(tenant.id));
      
      setTenants(allTenants);
      setFilteredTenants(availableTenants);
      setApplications(appRes.results || []);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    if (!selectedTenant) {
      setError('Please create or select a tenant first.');
      return false;
    }
    if (!leaseData.start_date || !leaseData.end_date) {
      setError('Please enter start & end dates');
      return false;
    }
    if (!leaseData.monthly_rent || leaseData.monthly_rent <= 0) {
      setError('Please enter a valid rent');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!property?.id) {
      setError('Property information is missing. Please try again.');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);

      // Ensure we have an application linking tenant & property
      let app = applications.find(a => a.tenant === selectedTenant);
      if (!app) {
        const start = new Date(leaseData.start_date!);
        const end = new Date(leaseData.end_date!);
        const durationMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

        const appPayload: ApplicationFormData = {
          tenant: selectedTenant!,
          property_ref: property.id,
          room: undefined,
          status: 'lease_created',
          desired_move_in_date: leaseData.start_date!,
          desired_lease_duration: durationMonths,
          rent_budget: leaseData.monthly_rent!,
          message: `Auto-generated application for property ${property?.name || 'Property'}`,
          special_requests: '',
        };
        app = await apiClient.createApplication(appPayload);
      }

      // Current user id
      const currentUser = await apiClient.getProfile();

      const leasePayload: LeaseFormData = {
        tenant: selectedTenant!,
        start_date: leaseData.start_date!,
        end_date: leaseData.end_date!,
        monthly_rent: leaseData.monthly_rent!,
        security_deposit: leaseData.security_deposit!,
        property_ref: property.id,
        application: app.id,
        created_by: currentUser.id,
      } as any;

      const lease = await apiClient.createLease(leasePayload as any);

      // Link the lease back to the application so later activation works
      try {
        await apiClient.updateApplication(app.id, { lease: lease.id, status: 'lease_created' } as any);
      } catch (linkErr) {
        console.warn('Failed to link lease to application', linkErr);
      }

      onSave();
      onClose();
    } catch (err: any) {
      console.error('Failed to assign tenant:', err);
      let msg = err?.response?.data?.detail || err.message || 'Failed to assign tenant';
      // flatten backend error dict if present
      if (err?.response?.data && typeof err.response.data === 'object') {
        msg = Object.values(err.response.data).flat().join(' ');
      }
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Button disabled helper
  const assignDisabled = saving || !selectedTenant;

  const handleNewTenantFormChange = (field: keyof TenantFormData, value: string) => {
    setNewTenantForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateNewTenant = async () => {
    if (!newTenantForm.full_name || !newTenantForm.email) {
      setError('Name and email are required for new tenant');
      return;
    }
    
    // Validate phone number if provided
    if (newTenantForm.phone && !phoneUtils.validatePhoneNumber(newTenantForm.phone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    
    try {
      setSaving(true);
      
      // Format phone number for API (E.164 format)
      const tenantData = {
        full_name: newTenantForm.full_name,
        email: newTenantForm.email,
        phone: newTenantForm.phone ? phoneUtils.toE164Format(newTenantForm.phone) : '',
      };
      
      const tenant = await apiClient.createTenant(tenantData);
      setTenants(prev => [...prev, tenant]);
      setError(null);
      setSelectedTenant(tenant.id);
      setActiveTab('tenants');
      setNewTenantForm({ full_name: '', email: '', phone: '' });
    } catch (e:any) {
      console.error('Failed to create tenant:', e);
      
      // Handle specific API errors
      if (e?.response?.data) {
        const errorData = e.response.data;
        if (errorData.phone) {
          setError(`Phone number error: ${Array.isArray(errorData.phone) ? errorData.phone.join(', ') : errorData.phone}`);
        } else if (errorData.email) {
          setError(`Email error: ${Array.isArray(errorData.email) ? errorData.email.join(', ') : errorData.email}`);
        } else {
          setError(e.message || 'Failed to create tenant');
        }
      } else {
        setError(e.message || 'Failed to create tenant');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Assign Tenant to {property?.name || 'Property'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}

          {loading ? (
            <div className="loading-indicator">
              <div className="loading-spinner" />
              <p>Loading tenants and applications…</p>
            </div>
          ) : (
            <>
              <div className="tab-buttons" style={{ marginBottom: 12 }}>
                <button
                  className={`tab-button ${activeTab === 'applications' ? 'active' : ''}`}
                  onClick={() => setActiveTab('applications')}
                >
                  Applications ({applications.length})
                </button>
                <button
                  className={`tab-button ${activeTab === 'tenants' ? 'active' : ''}`}
                  onClick={() => setActiveTab('tenants')}
                >
                  All Tenants ({tenants.length})
                </button>
                <button
                  className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
                  onClick={() => setActiveTab('create')}
                >
                  Create New Tenant
                </button>
              </div>

              {activeTab === 'applications' ? (
                <div className="tenant-list">
                  {applications.length === 0 && <p className="text-muted">No pending applications for this property.</p>}
                  {applications.map(app => {
                    const t = tenants.find(tt => tt.id === app.tenant);
                    if (!t) return null;
                    return (
                      <label key={app.id} className="tenant-item">
                        <input
                          type="radio"
                          name="selTenant"
                          value={t.id}
                          checked={selectedTenant === t.id}
                          onChange={() => setSelectedTenant(t.id)}
                        />
                        <div className="tenant-details">
                          <strong>{t.full_name}</strong>
                          <p className="text-muted">{t.email}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : activeTab === 'tenants' ? (
                <div className="tenant-list">
                  {tenants.map(t => (
                    <label key={t.id} className="tenant-item">
                      <input
                        type="radio"
                        name="selTenant"
                        value={t.id}
                        checked={selectedTenant === t.id}
                        onChange={() => setSelectedTenant(t.id)}
                      />
                      <div className="tenant-details">
                        <strong>{t.full_name}</strong>
                        <p className="text-muted">{t.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="create-tenant-form">
                  <h4>Create New Tenant</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Full Name*</label>
                      <input
                        type="text"
                        value={newTenantForm.full_name}
                        onChange={e => handleNewTenantFormChange('full_name', e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email*</label>
                      <input
                        type="email"
                        value={newTenantForm.email}
                        onChange={e => handleNewTenantFormChange('email', e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input
                        type="text"
                        value={newTenantForm.phone}
                        onChange={e => {
                          const formattedPhone = phoneUtils.formatPhoneNumber(e.target.value);
                          handleNewTenantFormChange('phone', formattedPhone);
                        }}
                        className="form-input"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-primary" onClick={handleCreateNewTenant} disabled={saving}>
                      {saving ? 'Creating…' : 'Create Tenant'}
                    </button>
                    <button className="btn btn-secondary" onClick={() => setActiveTab('tenants')} disabled={saving}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Lease details */}
              <div className="lease-form" style={{ marginTop: 16 }}>
                <h4>Lease Details</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Start Date*</label>
                    <input
                      type="date"
                      value={leaseData.start_date || ''}
                      onChange={e => setLeaseData(prev => ({ ...prev, start_date: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date*</label>
                    <input
                      type="date"
                      value={leaseData.end_date || ''}
                      onChange={e => setLeaseData(prev => ({ ...prev, end_date: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monthly Rent*</label>
                    <input
                      type="number"
                      value={leaseData.monthly_rent || ''}
                      onChange={e => setLeaseData(prev => ({ ...prev, monthly_rent: parseFloat(e.target.value) }))}
                      className="form-input"
                      min={0}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Security Deposit*</label>
                    <input
                      type="number"
                      value={leaseData.security_deposit || ''}
                      onChange={e => setLeaseData(prev => ({ ...prev, security_deposit: parseFloat(e.target.value) }))}
                      className="form-input"
                      min={0}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-primary" onClick={handleSave} disabled={assignDisabled}>
                  {saving ? 'Saving…' : 'Assign Tenant'}
                </button>
                <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Basic styles (reuse or extend your existing modal styles) */}
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: #fff;
          width: 720px;
          max-width: 95%;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          overflow: hidden;
        }
        .modal-header {
          padding: 16px 24px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .modal-body {
          padding: 24px;
          max-height: 75vh;
          overflow-y: auto;
        }
        .modal-footer {
          margin-top: 24px;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .lease-form .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .tenant-list {
          max-height: 220px;
          overflow-y: auto;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 8px;
        }
        .tenant-item {
          display: flex;
          gap: 8px;
          padding: 6px;
          border-radius: 4px;
          cursor: pointer;
        }
        .tenant-item:hover {
          background: #f3f4f6;
        }
        .tenant-details {
          flex: 1;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .form-label {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }
        .form-input {
          padding: 8px 10px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
        }
        .create-tenant-form .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
      `}</style>
    </div>
  );
} 