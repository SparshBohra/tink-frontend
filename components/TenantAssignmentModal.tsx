import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { Tenant, Application, Room, LeaseFormData, ApplicationFormData } from '../lib/types';
import { formatCurrency, phoneUtils } from '../lib/utils';

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
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
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
  const [skipApplication, setSkipApplication] = useState(false);
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
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emergencyPhoneError, setEmergencyPhoneError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, room.property_ref]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [applicationsResponse, tenantsResponse, leaseRes] = await Promise.all([
        apiClient.getApplications({ 
          property: room.property_ref,
          status: 'pending'
        }),
        apiClient.getTenants(),
        apiClient.getLeases()
      ]);

      setApplications(applicationsResponse.results || []);
      
      const allTenants = tenantsResponse.results || [];
      const leases = leaseRes.results || [];
      const tenantsWithLeases = new Set(
        leases
          .filter(lease => lease.status === 'active' || lease.status === 'draft')
          .map(lease => lease.tenant)
      );

      const availableTenants = allTenants.filter(tenant => !tenantsWithLeases.has(tenant.id));
      
      setTenants(allTenants);
      setFilteredTenants(availableTenants);
      
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
    if (field === 'phone') {
      const formattedPhone = phoneUtils.formatPhoneNumber(value);
      setNewTenantForm(prev => ({
        ...prev,
        [field]: formattedPhone
      }));
      
      const phoneErrorMsg = phoneUtils.getPhoneErrorMessage(formattedPhone);
      setPhoneError(phoneErrorMsg);
    } else if (field === 'emergency_contact_phone') {
      const formattedPhone = phoneUtils.formatPhoneNumber(value);
      setNewTenantForm(prev => ({
        ...prev,
        [field]: formattedPhone
      }));
      
      // Only validate if there's a value (emergency phone is optional)
      if (formattedPhone.trim()) {
        const phoneErrorMsg = phoneUtils.getPhoneErrorMessage(formattedPhone);
        setEmergencyPhoneError(phoneErrorMsg);
      } else {
        setEmergencyPhoneError(null);
      }
    } else {
      setNewTenantForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
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
      
      // Validate phone number format
      if (phoneError) {
        setError(`Phone number error: ${phoneError}`);
        return;
      }
      
      // Validate emergency phone if provided
      if (newTenantForm.emergency_contact_phone && emergencyPhoneError) {
        setError(`Emergency phone number error: ${emergencyPhoneError}`);
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newTenantForm.email)) {
        setError('Please enter a valid email address');
        return;
      }
      
      // Create the new tenant - only include fields that are supported by the API
      const tenantData = {
        full_name: newTenantForm.full_name,
        email: newTenantForm.email,
        phone: newTenantForm.phone ? phoneUtils.toE164Format(newTenantForm.phone) : '',
        emergency_contact_name: newTenantForm.emergency_contact_name || undefined,
        emergency_contact_phone: newTenantForm.emergency_contact_phone ? phoneUtils.toE164Format(newTenantForm.emergency_contact_phone) : undefined,
        current_address: newTenantForm.current_address || undefined
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
      
      // Provide more specific error messages
      if (err.message.includes('Email') || err.message.includes('email')) {
        setError('Email address is already in use or invalid. Please use a different email.');
      } else if (err.message.includes('Phone') || err.message.includes('phone')) {
        setError('Phone number is already in use or invalid. Please use a different phone number.');
      } else if (err.message.includes('required')) {
        setError('Please fill in all required fields (Name, Email, Phone).');
      } else if (err.message.includes('permission')) {
        setError('You do not have permission to create tenants. Please contact your administrator.');
      } else {
        setError(err?.message || 'Failed to create tenant. Please check your information and try again.');
      }
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
    
    const startDate = new Date(leaseData.start_date);
    const endDate = new Date(leaseData.end_date);
    
    if (endDate <= startDate) {
      setError('End date must be after start date');
      return false;
    }
    
    // Check if start date is not too far in the past
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    if (startDate < oneYearAgo) {
      setError('Start date cannot be more than 1 year in the past');
      return false;
    }
    
    const rentAmount = Number(leaseData.monthly_rent);
    if (!rentAmount || rentAmount <= 0) {
      setError('Please enter a valid monthly rent amount greater than 0');
      return false;
    }
    
    if (rentAmount > 50000) {
      setError('Monthly rent seems unusually high. Please verify the amount.');
      return false;
    }
    
    const depositAmount = Number(leaseData.security_deposit);
    if (depositAmount < 0) {
      setError('Security deposit cannot be negative');
      return false;
    }
    
    return true;
  };

  // Alternative direct lease creation method
  const createDirectLease = async () => {
    try {
      console.log('Creating direct lease...');
      
      const currentUser = await apiClient.getProfile();

      // For a direct lease, we still need to create a placeholder application
      const applicationData: ApplicationFormData = {
        tenant: selectedTenant!,
        property_ref: room.property_ref,
        room: room.id,
        status: 'lease_created',
        desired_move_in_date: leaseData.start_date!,
        desired_lease_duration: 12, // Default duration
        rent_budget: Number(leaseData.monthly_rent) || 0,
        message: "Direct lease creation by manager.",
        special_requests: "Direct lease creation.",
      };
      const application = await apiClient.createApplication(applicationData);

      const directLeaseData = {
        tenant: selectedTenant!,
        room: room.id,
        property_ref: room.property_ref,
        start_date: leaseData.start_date!,
        end_date: leaseData.end_date!,
        monthly_rent: Number(leaseData.monthly_rent!),
        security_deposit: Number(leaseData.security_deposit!),
        status: 'active',
        application: application.id,
        created_by: currentUser.id,
      };
      
      console.log('Direct lease data:', directLeaseData);
      const lease = await apiClient.createLease(directLeaseData as any);
      console.log('Direct lease created successfully:', lease);

      // link lease to application
      try {
        await apiClient.updateApplication(application.id, { lease: lease.id, status: 'lease_created' } as any);
      } catch (linkErr) {
        console.warn('Failed to link lease to application', linkErr);
      }
      
      return lease;
    } catch (error) {
      console.error('Direct lease creation failed:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    // Explicitly re-validate that a tenant is selected before any action.
    if (selectedTenant === null) {
      setError("No tenant selected. Please select or create a tenant before creating a lease.");
      return;
    }
    
    if (!validateLeaseData()) {
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      console.log('Starting tenant assignment process...');
      console.log('Selected tenant:', selectedTenant);
      console.log('Room:', room);
      console.log('Lease data:', leaseData);
      
      // If skip application is enabled, create lease directly
      if (skipApplication) {
        console.log('Skipping application process, creating lease directly');
        await createDirectLease();
        onSave();
        onClose();
        return;
      }
      
      // Check if tenant already has an application for this property/room
      let application = applications.find(app => 
        app.tenant === selectedTenant && 
        (app.room === room.id || app.property_ref === room.property_ref)
      );
      
      // If no application exists, create one first
      if (!application) {
        // Calculate lease duration in months more accurately
        const startDate = new Date(leaseData.start_date!);
        const endDate = new Date(leaseData.end_date!);
        
        // Calculate months between dates
        let leaseDurationMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12;
        leaseDurationMonths += endDate.getMonth() - startDate.getMonth();
        
        // Ensure minimum 1 month duration
        if (leaseDurationMonths <= 0) {
          leaseDurationMonths = 1;
        }
        
        // Ensure rent budget is a valid number
        const rentBudget = Number(leaseData.monthly_rent) || 0;
        if (rentBudget <= 0) {
          setError('Monthly rent must be greater than 0');
          return;
        }
        
        const applicationData: ApplicationFormData = {
          tenant: selectedTenant!,
          property_ref: room.property_ref,
          room: room.id,
          status: 'lease_created',
          desired_move_in_date: leaseData.start_date!,
          desired_lease_duration: leaseDurationMonths,
          rent_budget: rentBudget,
          message: `Application created automatically for room assignment to ${room.name}`,
          special_requests: 'Direct assignment by property manager'
        };
        
        console.log('Creating application with data:', applicationData);
        application = await apiClient.createApplication(applicationData);
        console.log('Application created successfully:', application);

        await createDirectLease();
      }
      
      // Now approve the application to create the lease
      const decisionData = {
        decision: 'approve' as const,
        start_date: leaseData.start_date!,
        end_date: leaseData.end_date!,
        monthly_rent: Number(leaseData.monthly_rent!),
        security_deposit: Number(leaseData.security_deposit!),
        decision_notes: `Lease created via direct tenant assignment to ${room.name}`
      };
      
      console.log('Approving application with decision data:', decisionData);
      
      try {
        await apiClient.decideApplication(application.id, decisionData);
        console.log('Application approved successfully');
      } catch (decisionError: any) {
        console.warn('Application decision failed, trying direct lease creation:', decisionError);
        
        // If application decision fails, try creating lease directly
        await createDirectLease();
        console.log('Direct lease created as fallback');
      }
      
      onSave();
      onClose();
      
    } catch (err: any) {
      console.error('Error in tenant assignment:', err);
      console.error('Error details:', err.response?.data);
      
      // Provide more specific error messages
      if (err.message?.includes('Invalid application data')) {
        setError('Application validation failed. Please check that all fields are filled correctly and the tenant is valid.');
      } else if (err.response?.status === 500) {
        setError('Server error occurred. Please try again or contact support if the issue persists.');
      } else if (err.response?.status === 400) {
        const errorDetails = err.response?.data?.detail || err.response?.data?.message;
        setError(`Validation error: ${errorDetails || err.message}`);
      } else {
        setError(err?.message || 'Failed to assign tenant. Please try again.');
      }
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

          {/* Step Indicator */}
          <div className="step-indicator">
            <div className={`step ${selectedTenant ? 'completed' : 'active'}`}>
              <div className="step-number">1</div>
              <div className="step-label">Select or Create Tenant</div>
            </div>
            <div className="step-divider"></div>
            <div className={`step ${selectedTenant ? 'active' : 'inactive'}`}>
              <div className="step-number">2</div>
              <div className="step-label">Create Lease</div>
            </div>
          </div>

          {loading ? (
            <div className="loading-indicator">
              <div className="loading-spinner" />
              <p>Loading tenants and applications...</p>
            </div>
          ) : (
            <>
              {/* Assignment Options */}
              <div className="assignment-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={skipApplication}
                    onChange={(e) => setSkipApplication(e.target.checked)}
                  />
                  <span>Skip application process and create lease directly</span>
                </label>
                <small className="text-muted">
                  {skipApplication 
                    ? 'Lease will be created immediately without going through application approval.' 
                    : 'An application will be created first, then automatically approved to create the lease.'
                  }
                </small>
              </div>

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
                      {filteredTenants.map(tenant => (
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
                      <div className="create-tenant-header">
                        <div className="info-banner">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 16v-4"/>
                            <path d="M12 8h.01"/>
                          </svg>
                          <div>
                            <strong>Create New Tenant</strong>
                            <p>Fill out the form below to create a new tenant. After creation, the tenant will be automatically selected for lease assignment.</p>
                          </div>
                        </div>
                      </div>
                      
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
                              className={`form-input ${phoneError ? 'error' : ''}`}
                              placeholder="(555) 123-4567"
                              required
                            />
                            {phoneError && (
                              <div className="field-error">
                                {phoneError}
                              </div>
                            )}
                            {newTenantForm.phone && !phoneError && (
                              <div className="field-success">
                                ✓ Valid phone number
                              </div>
                            )}
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
                              className={`form-input ${emergencyPhoneError ? 'error' : ''}`}
                              placeholder="(555) 987-6543"
                            />
                            {emergencyPhoneError && (
                              <div className="field-error">
                                {emergencyPhoneError}
                              </div>
                            )}
                            {newTenantForm.emergency_contact_phone && !emergencyPhoneError && (
                              <div className="field-success">
                                ✓ Valid phone number
                              </div>
                            )}
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
                          className="btn btn-secondary"
                          onClick={() => setActiveTab('tenants')}
                          disabled={creatingTenant}
                        >
                          Cancel
                        </button>
                        <button 
                          className="btn btn-success create-tenant-btn"
                          onClick={handleCreateNewTenant}
                          disabled={creatingTenant}
                        >
                          {creatingTenant ? (
                            <>
                              <div className="btn-spinner"></div>
                              Creating Tenant...
                            </>
                          ) : (
                            <>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                                <line x1="12" y1="2" x2="12" y2="6"/>
                                <line x1="10" y1="4" x2="14" y2="4"/>
                              </svg>
                              Create New Tenant
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Lease Details Form */}
              {selectedTenant && (
                <div className="lease-form-section">
                  <div className="section-header-with-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                  <h4>Lease Details</h4>
                  </div>
                  
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
            className="btn btn-primary create-lease-btn" 
            onClick={handleSave}
            disabled={saving || loading || !selectedTenant}
          >
            {saving ? (
              <>
                <div className="btn-spinner"></div>
                Assigning Tenant...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
                Create Lease & Assign
              </>
            )}
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
          max-width: 900px;
          width: 95%;
          max-height: 95vh;
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
          max-height: 500px;
          overflow-y: auto;
          padding: var(--spacing-md);
        }

        .create-tenant-header {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .info-banner {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .info-banner svg {
          color: #3b82f6;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .info-banner strong {
          color: #1e40af;
          font-size: 14px;
          display: block;
          margin-bottom: 4px;
        }

        .info-banner p {
          color: #1e40af;
          font-size: 13px;
          margin: 0;
          line-height: 1.4;
        }

        .field-error {
          color: #dc2626;
          font-size: 12px;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .field-success {
          color: #16a34a;
          font-size: 12px;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .form-input.error {
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
        }

        .form-input.success {
          border-color: #16a34a;
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
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

        .create-tenant-btn {
          background: #16a34a !important;
          color: white !important;
          border: none !important;
          padding: 12px 20px !important;
          border-radius: 8px !important;
          font-weight: 600 !important;
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          transition: all 0.2s ease !important;
          box-shadow: 0 2px 4px rgba(22, 163, 74, 0.2) !important;
        }

        .create-tenant-btn:hover:not(:disabled) {
          background: #15803d !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 8px rgba(22, 163, 74, 0.3) !important;
        }

        .create-tenant-btn:disabled {
          background: #9ca3af !important;
          cursor: not-allowed !important;
          transform: none !important;
          box-shadow: none !important;
        }

        .create-lease-btn {
          background: #3b82f6 !important;
          color: white !important;
          border: none !important;
          padding: 12px 20px !important;
          border-radius: 8px !important;
          font-weight: 600 !important;
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          transition: all 0.2s ease !important;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2) !important;
        }

        .create-lease-btn:hover:not(:disabled) {
          background: #2563eb !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3) !important;
        }

        .create-lease-btn:disabled {
          background: #9ca3af !important;
          cursor: not-allowed !important;
          transform: none !important;
          box-shadow: none !important;
        }

        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
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

        .assignment-options {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          cursor: pointer;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .checkbox-label input[type="checkbox"] {
          margin-right: 8px;
          transform: scale(1.2);
        }

        .checkbox-label span {
          color: #495057;
        }

        .text-muted {
          color: #6c757d;
          font-size: 14px;
          line-height: 1.4;
        }

        .step-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 24px 0;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .step {
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .step-number {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .step-label {
          font-weight: 500;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .step-divider {
          width: 40px;
          height: 2px;
          background: #dee2e6;
          margin: 0 16px;
          border-radius: 1px;
        }

        .step.active .step-number {
          background: #3b82f6;
          color: white;
        }

        .step.active .step-label {
          color: #3b82f6;
        }

        .step.completed .step-number {
          background: #16a34a;
          color: white;
        }

        .step.completed .step-label {
          color: #16a34a;
        }

        .step.inactive .step-number {
          background: #e9ecef;
          color: #6c757d;
        }

        .step.inactive .step-label {
          color: #6c757d;
        }

        .section-header-with-icon {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e9ecef;
        }

        .section-header-with-icon svg {
          color: #3b82f6;
        }

        .section-header-with-icon h4 {
          margin: 0;
          color: #1f2937;
          font-size: 16px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
} 