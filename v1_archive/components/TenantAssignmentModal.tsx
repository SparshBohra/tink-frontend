import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { Tenant, Application, Room, LeaseFormData, ApplicationFormData, Lease } from '../lib/types';
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
  const [applications, setApplications] = useState<Application[]>([]);
  const [propertyApplications, setPropertyApplications] = useState<Application[]>([]);
  const [draftLeases, setDraftLeases] = useState<Lease[]>([]);
  const [recommendedTenants, setRecommendedTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<number | null>(null);
  const [selectedSource, setSelectedSource] = useState<'application' | 'draft' | 'tenant' | 'create' | null>(null);
  const [leaseData, setLeaseData] = useState<Partial<LeaseFormData>>({
    start_date: '',
    end_date: '',
    monthly_rent: room.monthly_rent ? Number(room.monthly_rent) : 0,
    security_deposit: room.security_deposit ? Number(room.security_deposit) : 0
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'applications' | 'property-applications' | 'recommended' | 'draft-leases' | 'create'>('applications');
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
  const [emailError, setEmailError] = useState<string | null>(null);

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
        apiClient.getApplications(), // Get ALL applications, not filtered by property
        apiClient.getTenants(),
        apiClient.getLeases()
      ]);

      const allApplications = applicationsResponse.results || [];
      const allTenants = tenantsResponse.results || [];
      const allLeases = leaseRes.results || [];
      
      // Filter out tenants with active leases
      const tenantsWithActiveLeases = new Set(
        allLeases
          .filter(lease => lease.status === 'active' || lease.is_active)
          .map(lease => lease.tenant)
      );

      const availableTenants = allTenants.filter(tenant => !tenantsWithActiveLeases.has(tenant.id));
      
      // Get ALL applications (not just for this property/room)
      const allAvailableApplications = allApplications.filter(app => 
        ['pending', 'approved', 'viewing_completed'].includes(app.status)
      );
      
      // Get applications for this property (but not specific room)
      const propertyApps = allApplications.filter(app => 
        app.property_ref === room.property_ref && 
        (!app.room || app.room !== room.id) &&
        ['pending', 'approved', 'viewing_completed'].includes(app.status)
      );
      
      // Get ALL draft leases (not just for this property)
      const allDraftLeases = allLeases.filter(lease => 
        lease.status === 'draft'
      );
      
      // Get recommended tenants (those with recent applications or good history)
      const recommendedTenantIds = new Set([
        ...allApplications
          .filter(app => app.property_ref === room.property_ref)
          .map(app => app.tenant),
        ...allLeases
          .filter(lease => lease.property_ref === room.property_ref && lease.status !== 'terminated')
          .map(lease => lease.tenant)
      ]);
      
      const recommended = availableTenants.filter(tenant => 
        recommendedTenantIds.has(tenant.id)
      );
      
      setApplications(allAvailableApplications);
      setPropertyApplications(propertyApps);
      setDraftLeases(allDraftLeases);
      setRecommendedTenants(recommended);
      setTenants(availableTenants);
      
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleTenantSelect = (tenantId: number, source: 'application' | 'draft' | 'tenant' | 'create') => {
    setSelectedTenant(tenantId);
    setSelectedSource(source);
    setError(null);
  };

  // Email validation utility
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleNewTenantFormChange = (field: string, value: string) => {
    if (field === 'phone') {
      const formattedPhone = phoneUtils.formatPhoneNumber(value);
      setNewTenantForm(prev => ({
        ...prev,
        [field]: formattedPhone
      }));
      
      if (value && !phoneUtils.validatePhoneNumber(value)) {
        setPhoneError('Please enter a valid phone number');
      } else {
        setPhoneError(null);
      }
    } else if (field === 'emergency_contact_phone') {
      const formattedPhone = phoneUtils.formatPhoneNumber(value);
      setNewTenantForm(prev => ({
        ...prev,
        [field]: formattedPhone
      }));
      
      if (value && !phoneUtils.validatePhoneNumber(value)) {
        setEmergencyPhoneError('Please enter a valid emergency contact phone number');
      } else {
        setEmergencyPhoneError(null);
      }
    } else if (field === 'email') {
      setNewTenantForm(prev => ({
        ...prev,
        [field]: value
      }));
      
      if (value && !validateEmail(value)) {
        setEmailError('Please enter a valid email address');
      } else {
        setEmailError(null);
      }
    } else {
      setNewTenantForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleCreateNewTenant = async () => {
    if (!newTenantForm.full_name || !newTenantForm.email || !newTenantForm.phone) {
      setError('Please fill in all required fields (Name, Email, Phone)');
        return;
      }
      
    if (!validateEmail(newTenantForm.email)) {
      setEmailError('Please enter a valid email address');
      setError('Please fix the email format before creating tenant');
        return;
      }
      
    if (phoneError || emergencyPhoneError || emailError) {
      setError('Please fix validation errors before creating tenant');
        return;
      }
      
    try {
      setCreatingTenant(true);
      setError(null);
      
      const tenantData = {
        full_name: newTenantForm.full_name,
        email: newTenantForm.email,
        phone: phoneUtils.toE164Format(newTenantForm.phone),
        date_of_birth: newTenantForm.date_of_birth || undefined,
        gender: newTenantForm.gender || undefined,
        occupation: newTenantForm.occupation || undefined,
        employer: newTenantForm.employer || undefined,
        monthly_income: newTenantForm.monthly_income ? parseFloat(newTenantForm.monthly_income) : undefined,
        emergency_contact_name: newTenantForm.emergency_contact_name || undefined,
        emergency_contact_phone: newTenantForm.emergency_contact_phone ? phoneUtils.toE164Format(newTenantForm.emergency_contact_phone) : undefined,
        emergency_contact_relationship: newTenantForm.emergency_contact_relationship || undefined,
        current_address: newTenantForm.current_address || undefined
      };
      
      const newTenant = await apiClient.createTenant(tenantData);
      
      // Add to available tenants list
      setTenants(prev => [...prev, newTenant]);
      
      // Select the newly created tenant
      setSelectedTenant(newTenant.id);
      setSelectedSource('create');
      
      // Reset form
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
      
      // Reset error states
      setEmailError(null);
      setPhoneError(null);
      setEmergencyPhoneError(null);
      
      // Switch to lease details step
      setActiveTab('applications');
      
    } catch (err: any) {
      console.error('Error creating tenant:', err);
      
      // Handle specific error types
      if (err?.response?.status === 400) {
        const errorData = err.response.data;
        
        // Handle field-specific validation errors
        if (errorData?.email) {
          setEmailError(Array.isArray(errorData.email) ? errorData.email[0] : errorData.email);
          setError('Please fix the email validation error');
        } else if (errorData?.phone) {
          setPhoneError(Array.isArray(errorData.phone) ? errorData.phone[0] : errorData.phone);
          setError('Please fix the phone number validation error');
        } else if (errorData?.detail) {
          setError(errorData.detail);
        } else if (errorData?.non_field_errors) {
          setError(Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors[0] : errorData.non_field_errors);
      } else {
          setError('Please check your input and try again');
        }
      } else if (err?.response?.status === 409) {
        setError('A tenant with this email already exists');
      } else {
        setError(err?.message || 'Failed to create tenant. Please try again.');
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
    
    if (selectedSource === 'application') {
      const app = applications.find(a => a.tenant === selectedTenant) || 
                   propertyApplications.find(a => a.tenant === selectedTenant);
      const tenant = tenants.find(t => t.id === selectedTenant);
      return { tenant, application: app };
    } else if (selectedSource === 'draft') {
      const lease = draftLeases.find(l => l.tenant === selectedTenant);
      const tenant = tenants.find(t => t.id === selectedTenant);
      return { tenant, draftLease: lease };
    } else {
      const tenant = tenants.find(t => t.id === selectedTenant);
      return { tenant };
    }
  };

  const validateLeaseData = () => {
    if (!selectedTenant) {
      setError('Please select a tenant first');
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
      setError('Please enter a valid monthly rent amount');
      return false;
    }
    
    if (!leaseData.security_deposit || leaseData.security_deposit < 0) {
      setError('Please enter a valid security deposit amount');
      return false;
    }
    
    return true;
  };

  const createDirectLease = async () => {
    try {
      console.log('Creating direct lease...');
      
      const currentUser = await apiClient.getProfile();

      // Find an existing application for this tenant on this property, otherwise create one.
      let application = applications.find(app => app.tenant === selectedTenant && app.property_ref === room.property_ref) ||
                       propertyApplications.find(app => app.tenant === selectedTenant && app.property_ref === room.property_ref);

      if (!application) {
        console.log("No existing application found. Creating a new one.");
        const applicationData: ApplicationFormData = {
          tenant: selectedTenant!,
          property_ref: room.property_ref,
          room: room.id,
          desired_move_in_date: leaseData.start_date!,
          desired_lease_duration: 12, // Default duration
          rent_budget: Number(leaseData.monthly_rent) || 0,
          message: "Direct lease creation by manager.",
          special_requests: "Direct lease creation.",
        };
        application = await apiClient.createApplication(applicationData);
        console.log("New application created:", application);
      } else {
        console.log("Found existing application:", application);
      }
      
      if (!application) {
          throw new Error("Fatal: Could not find or create an application.");
      }

      const directLeaseData = {
        tenant: selectedTenant!,
        room: room.id,
        property_ref: room.property_ref,
        start_date: leaseData.start_date!,
        end_date: leaseData.end_date!,
        monthly_rent: Number(leaseData.monthly_rent!),
        security_deposit: Number(leaseData.security_deposit!),
        status: 'draft',
        application: application.id,
        created_by: currentUser.id,
        is_active: false,
      };
      
      console.log('Direct lease data:', directLeaseData);
      const lease = await apiClient.createLease(directLeaseData as any);
      console.log('Direct lease created successfully:', lease);
      
      // link lease to application
      try {
        console.log(`Updating application ${application.id} with lease ${lease.id}`);
        await apiClient.updateApplication(application.id, { 
            lease: lease.id, 
            status: 'lease_created',
            room: room.id 
        } as any);
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
      
      console.log('Starting tenant assignment process for room...');
      await createDirectLease();
      
      onSave();
      onClose();
      
    } catch (err: any) {
      console.error('Error in tenant assignment:', err);
      console.error('Error details:', err.response?.data);
      
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

  const getTenantName = (tenantId: number) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? tenant.full_name : `Tenant ${tenantId}`;
  };

  const getTabCount = (tab: string) => {
    switch (tab) {
      case 'applications':
        return applications.length;
      case 'property-applications':
        return propertyApplications.length;
      case 'recommended':
        return recommendedTenants.length;
      case 'draft-leases':
        return draftLeases.length;
      default:
        return 0;
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
              <span>Rent: {formatCurrency(Number(room.monthly_rent))}</span>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="step-indicator">
            <div className={`step ${selectedTenant ? 'completed' : 'active'}`}>
              <div className="step-number">1</div>
              <div className="step-label">Select Tenant</div>
            </div>
            <div className="step-divider"></div>
            <div className={`step ${selectedTenant ? 'active' : 'inactive'}`}>
              <div className="step-number">2</div>
              <div className="step-label">Lease Details</div>
            </div>
          </div>

          {loading ? (
            <div className="loading-indicator">
              <div className="loading-spinner" />
              <p>Loading tenant options...</p>
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
                    All Applications ({getTabCount('applications')})
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'property-applications' ? 'active' : ''}`}
                    onClick={() => setActiveTab('property-applications')}
                  >
                    Property Applications ({getTabCount('property-applications')})
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'recommended' ? 'active' : ''}`}
                    onClick={() => setActiveTab('recommended')}
                  >
                    Recommended ({getTabCount('recommended')})
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'draft-leases' ? 'active' : ''}`}
                    onClick={() => setActiveTab('draft-leases')}
                  >
                    Draft Leases ({getTabCount('draft-leases')})
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
                    onClick={() => setActiveTab('create')}
                  >
                    + Create New
                  </button>
                </div>
                
                <div className="tab-content">
                  {activeTab === 'applications' && (
                    <div className="tenant-selection-section">
                      <div className="section-header">
                        <h4>All Applications</h4>
                        <p className="text-muted">All pending and approved applications across all properties</p>
                      </div>
                    <div className="tenant-list">
                      {applications.length > 0 ? (
                        applications.map(application => {
                          const tenant = tenants.find(t => t.id === application.tenant);
                          if (!tenant) return null;
                            
                            const isSelected = selectedTenant === tenant.id && selectedSource === 'application';
                          
                          return (
                              <div
                                key={application.id} 
                                className={`tenant-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleTenantSelect(tenant.id, 'application')}
                              >
                                <div className="tenant-radio">
                              <input
                                type="radio"
                                name="selectedTenant"
                                    checked={isSelected}
                                    onChange={() => handleTenantSelect(tenant.id, 'application')}
                              />
                                </div>
                              <div className="tenant-details">
                                  <div className="tenant-name">{tenant.full_name}</div>
                                  <div className="tenant-email">{tenant.email}</div>
                                  <div className="application-info">
                                    <span className="application-date">Applied: {new Date(application.application_date).toLocaleDateString()}</span>
                                  {application.move_in_date && (
                                      <span className="move-in-date">• Move-in: {new Date(application.move_in_date).toLocaleDateString()}</span>
                                  )}
                                    <span className="budget">• Budget: {formatCurrency(application.rent_budget)}</span>
                              </div>
                                </div>
                                <div className="selection-indicator">
                                  {isSelected && <div className="selected-checkmark">✓</div>}
                                </div>
                              </div>
                          );
                        })
                      ) : (
                          <div className="empty-state">
                            <p>No applications found for this specific room.</p>
                            <small>Try checking "Property Applications" for general property applications.</small>
                        </div>
                      )}
                    </div>
                    </div>
                  )}

                  {activeTab === 'property-applications' && (
                    <div className="tenant-selection-section">
                      <div className="section-header">
                        <h4>Property Applications</h4>
                        <p className="text-muted">Tenants who applied to this property but not specifically to {room.name}</p>
                      </div>
                    <div className="tenant-list">
                        {propertyApplications.length > 0 ? (
                          propertyApplications.map(application => {
                            const tenant = tenants.find(t => t.id === application.tenant);
                            if (!tenant) return null;
                            
                            const isSelected = selectedTenant === tenant.id && selectedSource === 'application';
                            
                            return (
                              <div
                                key={application.id} 
                                className={`tenant-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleTenantSelect(tenant.id, 'application')}
                              >
                                <div className="tenant-radio">
                          <input
                            type="radio"
                            name="selectedTenant"
                                    checked={isSelected}
                                    onChange={() => handleTenantSelect(tenant.id, 'application')}
                          />
                                </div>
                          <div className="tenant-details">
                                  <div className="tenant-name">{tenant.full_name}</div>
                                  <div className="tenant-email">{tenant.email}</div>
                                  <div className="application-info">
                                    <span className="application-date">Applied: {new Date(application.application_date).toLocaleDateString()}</span>
                                    {application.move_in_date && (
                                      <span className="move-in-date">• Move-in: {new Date(application.move_in_date).toLocaleDateString()}</span>
                                    )}
                                    <span className="budget">• Budget: {formatCurrency(application.rent_budget)}</span>
                          </div>
                    </div>
                                <div className="selection-indicator">
                                  {isSelected && <div className="selected-checkmark">✓</div>}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="empty-state">
                            <p>No property applications found.</p>
                            <small>Try checking "Recommended" for tenants with history at this property.</small>
                          </div>
                        )}
                        </div>
                      </div>
                  )}

                  {activeTab === 'recommended' && (
                    <div className="tenant-selection-section">
                      <div className="section-header">
                        <h4>Recommended Tenants</h4>
                        <p className="text-muted">Tenants with history at this property or recent applications</p>
                      </div>
                      <div className="tenant-list">
                        {recommendedTenants.length > 0 ? (
                          recommendedTenants.map(tenant => {
                            const isSelected = selectedTenant === tenant.id && selectedSource === 'tenant';
                            
                            return (
                              <div
                                key={tenant.id} 
                                className={`tenant-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleTenantSelect(tenant.id, 'tenant')}
                              >
                                <div className="tenant-radio">
                                  <input
                                    type="radio"
                                    name="selectedTenant"
                                    checked={isSelected}
                                    onChange={() => handleTenantSelect(tenant.id, 'tenant')}
                                  />
                                </div>
                                <div className="tenant-details">
                                  <div className="tenant-name">{tenant.full_name}</div>
                                  <div className="tenant-email">{tenant.email}</div>
                                  <div className="tenant-info">
                                    <span className="tenant-id">ID: {tenant.id}</span>
                                    {tenant.phone && <span className="tenant-phone">• {tenant.phone}</span>}
                                  </div>
                                </div>
                                <div className="selection-indicator">
                                  {isSelected && <div className="selected-checkmark">✓</div>}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="empty-state">
                            <p>No recommended tenants found.</p>
                            <small>Try checking "Draft Leases" or create a new tenant.</small>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'draft-leases' && (
                    <div className="tenant-selection-section">
                      <div className="section-header">
                        <h4>Draft Leases</h4>
                        <p className="text-muted">All existing draft leases across all properties that can be activated</p>
                      </div>
                      <div className="tenant-list">
                        {draftLeases.length > 0 ? (
                          draftLeases.map(lease => {
                            const tenant = tenants.find(t => t.id === lease.tenant);
                            if (!tenant) return null;
                            
                            const isSelected = selectedTenant === tenant.id && selectedSource === 'draft';
                            
                            return (
                              <div
                                key={lease.id} 
                                className={`tenant-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleTenantSelect(tenant.id, 'draft')}
                              >
                                <div className="tenant-radio">
                                  <input
                                    type="radio"
                                    name="selectedTenant"
                                    checked={isSelected}
                                    onChange={() => handleTenantSelect(tenant.id, 'draft')}
                                  />
                                </div>
                                <div className="tenant-details">
                                  <div className="tenant-name">{tenant.full_name}</div>
                                  <div className="tenant-email">{tenant.email}</div>
                                  <div className="lease-info">
                                    <span className="lease-dates">{new Date(lease.start_date).toLocaleDateString()} - {new Date(lease.end_date).toLocaleDateString()}</span>
                                    <span className="lease-rent">• Rent: {formatCurrency(lease.monthly_rent)}</span>
                                  </div>
                                </div>
                                <div className="selection-indicator">
                                  {isSelected && <div className="selected-checkmark">✓</div>}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="empty-state">
                            <p>No draft leases found for this property.</p>
                            <small>Draft leases are created when applications are approved but not yet activated.</small>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'create' && (
                    <div className="create-tenant-section">
                      <div className="section-header">
                        <h4>Create New Tenant</h4>
                        <p className="text-muted">Create a new tenant profile and assign them to this room</p>
                      </div>
                      
                      <div className="create-tenant-form">
                      <div className="form-section">
                          <h5>Basic Information</h5>
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
                                className={`form-input ${emailError ? 'error' : ''}`}
                              placeholder="Enter email address"
                              required
                            />
                              {emailError && <div className="field-error">{emailError}</div>}
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
                          </div>
                          </div>
                          
                        <div className="form-section">
                          <h5>Additional Information</h5>
                          <div className="form-grid">
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
                      
                          <div className="form-group">
                            <label className="form-label">Employer</label>
                            <input
                              type="text"
                              value={newTenantForm.employer}
                              onChange={(e) => handleNewTenantFormChange('employer', e.target.value)}
                              className="form-input"
                                placeholder="Enter employer"
                            />
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label">Monthly Income</label>
                            <input
                              type="number"
                              value={newTenantForm.monthly_income}
                              onChange={(e) => handleNewTenantFormChange('monthly_income', e.target.value)}
                              className="form-input"
                                placeholder="Enter monthly income"
                              step="0.01"
                              min="0"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="form-section">
                          <h5>Emergency Contact</h5>
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
                                placeholder="(555) 123-4567"
                            />
                            {emergencyPhoneError && (
                              <div className="field-error">
                                {emergencyPhoneError}
                              </div>
                            )}
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label">Relationship</label>
                              <select
                              value={newTenantForm.emergency_contact_relationship}
                              onChange={(e) => handleNewTenantFormChange('emergency_contact_relationship', e.target.value)}
                              className="form-input"
                              >
                                <option value="">Select relationship</option>
                                <option value="parent">Parent</option>
                                <option value="spouse">Spouse</option>
                                <option value="sibling">Sibling</option>
                                <option value="friend">Friend</option>
                                <option value="other">Other</option>
                              </select>
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
                      
                        <div className="form-actions">
                        <button 
                            type="button"
                          onClick={handleCreateNewTenant}
                            disabled={creatingTenant || !newTenantForm.full_name || !newTenantForm.email || !newTenantForm.phone}
                            className="btn btn-primary"
                        >
                          {creatingTenant ? (
                            <>
                              <div className="btn-spinner"></div>
                              Creating Tenant...
                            </>
                          ) : (
                              'Create Tenant'
                          )}
                        </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Lease Details Section - Only show if tenant is selected */}
              {selectedTenant && (
                <div className="lease-details-section">
                  <div className="section-header-with-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10,9 9,9 8,9"/>
                    </svg>
                  <h4>Lease Details</h4>
                  </div>
                  
                  {selectedTenantData && (
                    <div className="selected-tenant-summary">
                      <div className="tenant-summary-card">
                        <div className="tenant-avatar">
                          {selectedTenantData.tenant?.full_name?.charAt(0) || 'T'}
                        </div>
                        <div className="tenant-summary-info">
                          <div className="tenant-summary-name">{selectedTenantData.tenant?.full_name}</div>
                          <div className="tenant-summary-email">{selectedTenantData.tenant?.email}</div>
                          {selectedSource === 'application' && selectedTenantData.application && (
                            <div className="tenant-summary-source">From Application • Applied {new Date(selectedTenantData.application.application_date).toLocaleDateString()}</div>
                          )}
                          {selectedSource === 'draft' && selectedTenantData.draftLease && (
                            <div className="tenant-summary-source">From Draft Lease • Created {new Date(selectedTenantData.draftLease.created_at).toLocaleDateString()}</div>
                          )}
                          {selectedSource === 'tenant' && (
                            <div className="tenant-summary-source">Recommended Tenant</div>
                          )}
                          {selectedSource === 'create' && (
                            <div className="tenant-summary-source">Newly Created</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="lease-form">
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
                Creating Lease...
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
          top: 72px;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          width: 90%;
          max-width: 900px;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f9fafb;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #111827;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6b7280;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .modal-close:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }

        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          background: #f9fafb;
        }

        .room-info {
          background: #f8fafc;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          border: 1px solid #e2e8f0;
        }

        .room-info h3 {
          margin: 0 0 4px 0;
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
        }

        .room-info .text-muted {
          color: #64748b;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .room-details {
          display: flex;
          gap: 16px;
          font-size: 14px;
          color: #475569;
        }

        .step-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 32px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 8px;
        }

        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .step-number {
          width: 32px;
          height: 32px;
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
          width: 60px;
          height: 2px;
          background: #dee2e6;
          margin: 0 20px;
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
          background: #10b981;
          color: white;
        }

        .step.completed .step-label {
          color: #10b981;
        }

        .step.inactive .step-number {
          background: #e5e7eb;
          color: #9ca3af;
        }

        .step.inactive .step-label {
          color: #9ca3af;
        }

        .loading-indicator {
          text-align: center;
          padding: 40px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .tab-container {
          margin-bottom: 32px;
        }

        .tab-buttons {
          display: flex;
          gap: 2px;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 8px;
          margin-bottom: 24px;
          overflow-x: auto;
        }

        .tab-button {
          background: none;
          border: none;
          padding: 12px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          color: #64748b;
        }

        .tab-button:hover {
          background: #e2e8f0;
          color: #475569;
        }

        .tab-button.active {
          background: white;
          color: #1e293b;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .tab-content {
          min-height: 200px;
        }

        .tenant-selection-section {
          margin-bottom: 24px;
        }

        .section-header {
          margin-bottom: 16px;
        }

        .section-header h4 {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
        }

        .section-header .text-muted {
          color: #64748b;
          font-size: 14px;
          margin: 0;
        }

        .tenant-list {
          max-height: 300px;
          overflow-y: auto;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
        }

        .tenant-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tenant-item:last-child {
          border-bottom: none;
        }

        .tenant-item:hover {
          background: #f8fafc;
        }

        .tenant-item.selected {
          background: #eff6ff;
          border-color: #3b82f6;
        }

        .tenant-radio input[type="radio"] {
          margin: 0;
          accent-color: #3b82f6;
        }

        .tenant-details {
          flex: 1;
        }

        .tenant-name {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .tenant-email {
          color: #64748b;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .application-info, .lease-info, .tenant-info {
          font-size: 13px;
          color: #6b7280;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .selection-indicator {
          width: 24px;
          display: flex;
          justify-content: center;
        }

        .selected-checkmark {
          width: 20px;
          height: 20px;
          background: #10b981;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #6b7280;
        }

        .empty-state p {
          margin: 0 0 8px 0;
          font-size: 16px;
        }

        .empty-state small {
          font-size: 14px;
          color: #9ca3af;
        }

        .create-tenant-section {
          margin-bottom: 24px;
        }

        .create-tenant-form {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 24px;
        }

        .form-section {
          margin-bottom: 24px;
        }

        .form-section:last-child {
          margin-bottom: 0;
        }

        .form-section h5 {
          margin: 0 0 16px 0;
          font-size: 15px;
          font-weight: 600;
          color: #374151;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .form-input, .form-input select, .form-input textarea {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-input.error {
          border-color: #ef4444;
        }

        .form-input.error:focus {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .field-error {
          color: #ef4444;
          font-size: 12px;
          margin-top: 4px;
        }

        .form-help {
          color: #6b7280;
          font-size: 12px;
          margin-top: 4px;
        }

        .form-actions {
          margin-top: 24px;
          display: flex;
          justify-content: flex-end;
        }

        .lease-details-section {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 24px;
          margin-top: 24px;
        }

        .section-header-with-icon {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e2e8f0;
        }

        .section-header-with-icon svg {
          color: #3b82f6;
        }

        .section-header-with-icon h4 {
          margin: 0;
          color: #1e293b;
          font-size: 16px;
          font-weight: 600;
        }

        .selected-tenant-summary {
          margin-bottom: 24px;
        }

        .tenant-summary-card {
          display: flex;
          align-items: center;
          gap: 16px;
          background: white;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .tenant-avatar {
          width: 48px;
          height: 48px;
          background: #3b82f6;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 18px;
        }

        .tenant-summary-info {
          flex: 1;
        }

        .tenant-summary-name {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .tenant-summary-email {
          color: #64748b;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .tenant-summary-source {
          color: #6b7280;
          font-size: 13px;
        }

        .lease-form .form-grid {
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        }

        .btn {
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .alert {
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .alert-error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .text-muted {
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .modal-content {
            width: 95%;
            max-height: 95vh;
          }
          
          .form-grid {
            grid-template-columns: 1fr;
          }
          
          .tab-buttons {
            flex-direction: column;
            gap: 4px;
          }
          
          .room-details {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
} 