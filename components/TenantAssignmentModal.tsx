import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { Tenant, Application, Room, LeaseFormData, ApplicationFormData } from '../lib/types';
import { formatCurrency } from '../lib/utils';

interface TenantAssignmentModalProps {
  room: Room;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function TenantAssignmentModal({ 
  room, 
  isOpen, 
  onClose, 
  onSave 
}: TenantAssignmentModalProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<number | null>(null);
  const [leaseData, setLeaseData] = useState<Partial<LeaseFormData>>({
    start_date: '',
    end_date: '',
    monthly_rent: room.monthly_rent ? Number(room.monthly_rent) : 0,
    security_deposit: room.security_deposit ? Number(room.security_deposit) : 0
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tenants' | 'applications' | 'create'>('applications');
  const [newTenantForm, setNewTenantForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    occupation: '',
    employer: '',
    monthly_income: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    current_address: ''
  });
  const [creatingTenant, setCreatingTenant] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, room.property_ref]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch pending applications for this property
      const applicationsResponse = await apiClient.getApplications({ 
        property: room.property_ref,
        status: 'pending'
      });
      setApplications(applicationsResponse.results || []);
      
      // Fetch all tenants
      const tenantsResponse = await apiClient.getTenants();
      setTenants(tenantsResponse.results || []);
      
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleTenantSelect = (tenantId: number) => {
    setSelectedTenant(tenantId);
  };

  const handleNewTenantFormChange = (field: string, value: string) => {
    setNewTenantForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateNewTenant = async () => {
    try {
      setCreatingTenant(true);
      setError(null);
      
      // Validate required fields
      if (!newTenantForm.full_name.trim()) {
        setError('Full name is required');
        return;
      }
      if (!newTenantForm.email.trim()) {
        setError('Email is required');
        return;
      }
      if (!newTenantForm.phone.trim()) {
        setError('Phone number is required');
        return;
      }
      
      // Create the new tenant
      const tenantData = {
        ...newTenantForm,
        monthly_income: newTenantForm.monthly_income ? parseFloat(newTenantForm.monthly_income) : null
      };
      
      const newTenant = await apiClient.createTenant(tenantData);
      
      // Add the new tenant to the local state
      setTenants(prev => [...prev, newTenant]);
      
      // Select the newly created tenant
      setSelectedTenant(newTenant.id);
      
      // Switch back to the tenants tab
      setActiveTab('tenants');
      
      // Reset the form
      setNewTenantForm({
        full_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        gender: '',
        occupation: '',
        employer: '',
        monthly_income: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relationship: '',
        current_address: ''
      });
      
    } catch (err: any) {
      console.error('Error creating tenant:', err);
      setError(err?.message || 'Failed to create tenant');
    } finally {
      setCreatingTenant(false);
    }
  };

  const handleLeaseDataChange = (field: keyof LeaseFormData, value: string | number) => {
    setLeaseData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getSelectedTenantData = () => {
    if (!selectedTenant) return null;
    
    // Check if selected tenant is from applications
    const application = applications.find(app => app.tenant === selectedTenant);
    if (application) {
      return {
        type: 'application',
        tenant: tenants.find(t => t.id === selectedTenant),
        application
      };
    }
    
    // Otherwise it's just a regular tenant
    return {
      type: 'tenant',
      tenant: tenants.find(t => t.id === selectedTenant),
      application: null
    };
  };

  const validateLeaseData = () => {
    if (!selectedTenant) {
      setError('Please select a tenant');
      return false;
    }
    
    if (!leaseData.start_date) {
      setError('Please enter a lease start date');
      return false;
    }
    
    if (!leaseData.end_date) {
      setError('Please enter a lease end date');
      return false;
    }
    
    if (new Date(leaseData.end_date) <= new Date(leaseData.start_date)) {
      setError('End date must be after start date');
      return false;
    }
    
    if (!leaseData.monthly_rent || leaseData.monthly_rent <= 0) {
      setError('Please enter a valid monthly rent');
      return false;
    }
    
    if (leaseData.security_deposit === undefined || leaseData.security_deposit < 0) {
      setError('Please enter a valid security deposit');
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateLeaseData()) {
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      // Check if tenant already has an application for this property
      let application = applications.find(app => app.tenant === selectedTenant);
      
      // If no application exists, create one first
      if (!application) {
        // Calculate lease duration in months
        const startDate = new Date(leaseData.start_date!);
        const endDate = new Date(leaseData.end_date!);
        const leaseDurationMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                                   (endDate.getMonth() - startDate.getMonth());
        
        const applicationData: ApplicationFormData = {
          tenant: selectedTenant!,
          property_ref: room.property_ref,
          room: room.id,
          desired_move_in_date: leaseData.start_date!,
          desired_lease_duration: leaseDurationMonths,
          rent_budget: leaseData.monthly_rent!,
          message: `Application created automatically for room assignment to ${room.name}`,
          special_requests: ''
        };
        
        application = await apiClient.createApplication(applicationData);
      }
      
      // Now approve the application to create the lease
      await apiClient.decideApplication(application.id, {
        decision: 'approve',
        start_date: leaseData.start_date!,
        end_date: leaseData.end_date!,
        monthly_rent: leaseData.monthly_rent!,
        security_deposit: leaseData.security_deposit!,
        decision_notes: `Lease created via direct tenant assignment to ${room.name}`
      });
      
      onSave();
      onClose();
      
    } catch (err: any) {
      console.error('Error creating lease:', err);
      setError(err?.message || 'Failed to assign tenant');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const selectedTenantData = getSelectedTenantData();

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Assign Tenant to {room.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          
          <div className="room-info">
            <h3>{room.name}</h3>
            <p className="text-muted">{room.property_name}</p>
            <div className="room-details">
              <span>Type: {room.room_type || 'Standard'}</span> • 
              <span>Capacity: {room.max_capacity}</span> • 
              <span>Floor: {room.floor || 'N/A'}</span>
            </div>
          </div>

          {loading ? (
            <div className="loading-indicator">
              <div className="loading-spinner" />
              <p>Loading tenants and applications...</p>
            </div>
          ) : (
            <>
              {/* Tenant Selection Tabs */}
              <div className="tab-container">
                <div className="tab-buttons">
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
                    + Create New Tenant
                  </button>
                </div>
                
                <div className="tab-content">
                  {activeTab === 'applications' ? (
                    <div className="tenant-list">
                      {applications.length > 0 ? (
                        applications.map(application => {
                          const tenant = tenants.find(t => t.id === application.tenant);
                          if (!tenant) return null;
                          
                          return (
                            <label key={application.id} className="tenant-item">
                              <input
                                type="radio"
                                name="selectedTenant"
                                value={tenant.id}
                                checked={selectedTenant === tenant.id}
                                onChange={() => handleTenantSelect(tenant.id)}
                              />
                              <div className="tenant-details">
                                <strong>{tenant.full_name}</strong>
                                <p className="text-muted">{tenant.email}</p>
                                <small className="application-info">
                                  Applied: {new Date(application.application_date).toLocaleDateString()}
                                  {application.move_in_date && (
                                    <> • Desired Move-in: {new Date(application.move_in_date).toLocaleDateString()}</>
                                  )}
                                </small>
                              </div>
                            </label>
                          );
                        })
                      ) : (
                        <div className="empty-applications">
                          <p className="text-muted">No pending applications for this property.</p>
                          <small className="text-muted">
                            You can still select from all tenants to create an application automatically.
                          </small>
                        </div>
                      )}
                    </div>
                  ) : activeTab === 'tenants' ? (
                    <div className="tenant-list">
                      {tenants.map(tenant => (
                        <label key={tenant.id} className="tenant-item">
                          <input
                            type="radio"
                            name="selectedTenant"
                            value={tenant.id}
                            checked={selectedTenant === tenant.id}
                            onChange={() => handleTenantSelect(tenant.id)}
                          />
                          <div className="tenant-details">
                            <strong>{tenant.full_name}</strong>
                            <p className="text-muted">{tenant.email}</p>
                            <small className="text-muted">ID: {tenant.id}</small>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    /* Create New Tenant Form */
                    <div className="create-tenant-form">
                      <div className="form-section">
                        <h4>Basic Information</h4>
                        <div className="form-grid">
                          <div className="form-group">
                            <label className="form-label">Full Name*</label>
                            <input
                              type="text"
                              value={newTenantForm.full_name}
                              onChange={(e) => handleNewTenantFormChange('full_name', e.target.value)}
                              className="form-input"
                              placeholder="Enter full name"
                              required
                            />
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label">Email*</label>
                            <input
                              type="email"
                              value={newTenantForm.email}
                              onChange={(e) => handleNewTenantFormChange('email', e.target.value)}
                              className="form-input"
                              placeholder="Enter email address"
                              required
                            />
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label">Phone*</label>
                            <input
                              type="tel"
                              value={newTenantForm.phone}
                              onChange={(e) => handleNewTenantFormChange('phone', e.target.value)}
                              className="form-input"
                              placeholder="Enter phone number"
                              required
                            />
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label">Date of Birth</label>
                            <input
                              type="date"
                              value={newTenantForm.date_of_birth}
                              onChange={(e) => handleNewTenantFormChange('date_of_birth', e.target.value)}
                              className="form-input"
                            />
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label">Gender</label>
                            <select
                              value={newTenantForm.gender}
                              onChange={(e) => handleNewTenantFormChange('gender', e.target.value)}
                              className="form-input"
                            >
                              <option value="">Select gender</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                              <option value="prefer_not_to_say">Prefer not to say</option>
                            </select>
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label">Occupation</label>
                            <input
                              type="text"
                              value={newTenantForm.occupation}
                              onChange={(e) => handleNewTenantFormChange('occupation', e.target.value)}
                              className="form-input"
                              placeholder="Enter occupation"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="form-section">
                        <h4>Employment & Financial</h4>
                        <div className="form-grid">
                          <div className="form-group">
                            <label className="form-label">Employer</label>
                            <input
                              type="text"
                              value={newTenantForm.employer}
                              onChange={(e) => handleNewTenantFormChange('employer', e.target.value)}
                              className="form-input"
                              placeholder="Enter employer name"
                            />
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label">Monthly Income</label>
                            <input
                              type="number"
                              value={newTenantForm.monthly_income}
                              onChange={(e) => handleNewTenantFormChange('monthly_income', e.target.value)}
                              className="form-input"
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="form-section">
                        <h4>Emergency Contact</h4>
                        <div className="form-grid">
                          <div className="form-group">
                            <label className="form-label">Emergency Contact Name</label>
                            <input
                              type="text"
                              value={newTenantForm.emergency_contact_name}
                              onChange={(e) => handleNewTenantFormChange('emergency_contact_name', e.target.value)}
                              className="form-input"
                              placeholder="Enter emergency contact name"
                            />
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label">Emergency Contact Phone</label>
                            <input
                              type="tel"
                              value={newTenantForm.emergency_contact_phone}
                              onChange={(e) => handleNewTenantFormChange('emergency_contact_phone', e.target.value)}
                              className="form-input"
                              placeholder="Enter emergency contact phone"
                            />
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label">Relationship</label>
                            <input
                              type="text"
                              value={newTenantForm.emergency_contact_relationship}
                              onChange={(e) => handleNewTenantFormChange('emergency_contact_relationship', e.target.value)}
                              className="form-input"
                              placeholder="e.g., Parent, Spouse, Friend"
                            />
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label">Current Address</label>
                            <textarea
                              value={newTenantForm.current_address}
                              onChange={(e) => handleNewTenantFormChange('current_address', e.target.value)}
                              className="form-input"
                              placeholder="Enter current address"
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="create-tenant-actions">
                        <button 
                          className="btn btn-primary"
                          onClick={handleCreateNewTenant}
                          disabled={creatingTenant}
                        >
                          {creatingTenant ? 'Creating Tenant...' : 'Create & Select Tenant'}
                        </button>
                        <button 
                          className="btn btn-secondary"
                          onClick={() => setActiveTab('tenants')}
                          disabled={creatingTenant}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Lease Details Form */}
              {selectedTenant && (
                <div className="lease-form-section">
                  <h4>Lease Details</h4>
                  
                  {selectedTenantData && (
                    <div className="selected-tenant-summary">
                      <strong>Selected: {selectedTenantData.tenant?.full_name}</strong>
                      {selectedTenantData.application && (
                        <span className="application-badge">From Application</span>
                      )}
                    </div>
                  )}
                  
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Start Date*</label>
                      <input
                        type="date"
                        value={leaseData.start_date || ''}
                        onChange={(e) => handleLeaseDataChange('start_date', e.target.value)}
                        className="form-input"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">End Date*</label>
                      <input
                        type="date"
                        value={leaseData.end_date || ''}
                        onChange={(e) => handleLeaseDataChange('end_date', e.target.value)}
                        className="form-input"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Monthly Rent*</label>
                      <input
                        type="number"
                        value={leaseData.monthly_rent || ''}
                        onChange={(e) => handleLeaseDataChange('monthly_rent', parseFloat(e.target.value) || 0)}
                        className="form-input"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        required
                      />
                      {room.monthly_rent && (
                        <small className="form-help">
                          Room base rent: {formatCurrency(Number(room.monthly_rent))}
                        </small>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Security Deposit*</label>
                      <input
                        type="number"
                        value={leaseData.security_deposit || ''}
                        onChange={(e) => handleLeaseDataChange('security_deposit', parseFloat(e.target.value) || 0)}
                        className="form-input"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        required
                      />
                      {room.security_deposit && (
                        <small className="form-help">
                          Room base deposit: {formatCurrency(Number(room.security_deposit))}
                        </small>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSave}
            disabled={saving || loading || !selectedTenant}
          >
{saving ? 'Assigning Tenant...' : 'Create Lease & Assign'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: var(--radius-lg);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          max-width: 700px;
          width: 95%;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--gray-200);
        }

        .modal-header h2 {
          margin: 0;
          flex: 1;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          padding: var(--spacing-xs);
          color: var(--gray-500);
        }

        .modal-close:hover {
          color: var(--gray-700);
        }

        .modal-body {
          padding: var(--spacing-lg);
          overflow-y: auto;
          flex: 1;
        }

        .room-info {
          margin-bottom: var(--spacing-lg);
          padding-bottom: var(--spacing-md);
          border-bottom: 1px solid var(--gray-200);
        }

        .room-info h3 {
          margin: 0 0 var(--spacing-xs) 0;
        }

        .room-details {
          margin-top: var(--spacing-sm);
          color: var(--gray-600);
          font-size: 0.875rem;
        }

        .tab-container {
          margin-bottom: var(--spacing-lg);
        }

        .tab-buttons {
          display: flex;
          border-bottom: 1px solid var(--gray-200);
          margin-bottom: var(--spacing-md);
        }

        .tab-button {
          background: none;
          border: none;
          padding: var(--spacing-md) var(--spacing-lg);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          font-weight: 500;
          color: var(--gray-600);
        }

        .tab-button:hover {
          color: var(--gray-900);
        }

        .tab-button.active {
          color: var(--primary-blue);
          border-bottom-color: var(--primary-blue);
        }

        .tenant-list {
          display: grid;
          gap: var(--spacing-sm);
          max-height: 250px;
          overflow-y: auto;
        }

        .tenant-item {
          display: flex;
          align-items: flex-start;
          gap: var(--spacing-sm);
          padding: var(--spacing-md);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s;
        }

        .tenant-item:hover {
          background-color: var(--gray-50);
          border-color: var(--primary-blue);
        }

        .tenant-item input[type="radio"] {
          margin-top: 2px;
        }

        .tenant-details {
          flex: 1;
        }

        .tenant-details strong {
          display: block;
          margin-bottom: var(--spacing-xs);
        }

        .tenant-details p {
          margin: 0 0 var(--spacing-xs) 0;
        }

        .application-info {
          display: block;
          color: var(--success-green-dark);
          font-weight: 500;
        }

        .lease-form-section {
          margin-top: var(--spacing-lg);
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--gray-200);
        }

        .lease-form-section h4 {
          margin: 0 0 var(--spacing-md) 0;
        }

        .selected-tenant-summary {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-md);
          padding: var(--spacing-sm) var(--spacing-md);
          background-color: var(--success-green-light);
          border-radius: var(--radius-sm);
        }

        .application-badge {
          background-color: var(--primary-blue);
          color: white;
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 600;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-md);
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-label {
          font-weight: 600;
          margin-bottom: var(--spacing-xs);
          color: var(--gray-700);
        }

        .form-input {
          padding: var(--spacing-sm);
          border: 1px solid var(--gray-300);
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--primary-blue);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-help {
          margin-top: var(--spacing-xs);
          color: var(--gray-600);
          font-size: 0.75rem;
        }

        .text-muted {
          color: var(--gray-600);
        }

        .empty-applications {
          text-align: center;
          padding: var(--spacing-lg);
        }

        .empty-applications p {
          margin-bottom: var(--spacing-xs);
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-md);
          padding: var(--spacing-lg);
          border-top: 1px solid var(--gray-200);
        }

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

        .alert {
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          margin-bottom: var(--spacing-lg);
        }

        .alert-error {
          background-color: var(--error-red-light);
          color: var(--error-red-dark);
          border: 1px solid var(--error-red);
        }

        .create-tenant-form {
          max-height: 400px;
          overflow-y: auto;
          padding: var(--spacing-md);
        }

        .form-section {
          margin-bottom: var(--spacing-lg);
          padding-bottom: var(--spacing-md);
          border-bottom: 1px solid var(--gray-200);
        }

        .form-section:last-of-type {
          border-bottom: none;
        }

        .form-section h4 {
          margin: 0 0 var(--spacing-md) 0;
          color: var(--gray-700);
          font-size: 1rem;
          font-weight: 600;
        }

        .create-tenant-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-md);
          margin-top: var(--spacing-lg);
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--gray-200);
        }

        .tab-button {
          white-space: nowrap;
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          
          .tab-buttons {
            overflow-x: auto;
            white-space: nowrap;
          }
          
          .modal-content {
            width: 98%;
            margin: 1%;
          }
        }
      `}</style>
    </div>
  );
} 