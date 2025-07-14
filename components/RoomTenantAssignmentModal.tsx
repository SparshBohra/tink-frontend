 
import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { Tenant, Application, LeaseFormData, TenantFormData, Property, Room, Lease } from '../lib/types';
import { formatCurrency, phoneUtils } from '../lib/utils';

interface RoomTenantAssignmentModalProps {
  property: Property;
  room: Room;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function RoomTenantAssignmentModal({
  property,
  room,
  isOpen,
  onClose,
  onSave,
}: RoomTenantAssignmentModalProps) {
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
    monthly_rent: Number(room?.monthly_rent) || 0,
    security_deposit: Number(room?.monthly_rent) || 0,
  });
  const [activeTab, setActiveTab] = useState<'applications' | 'property-applications' | 'recommended' | 'draft-leases' | 'create'>('applications');
  const [newTenantForm, setNewTenantForm] = useState<TenantFormData>({
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingTenant, setCreatingTenant] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emergencyPhoneError, setEmergencyPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, property, room]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [applicationsResponse, tenantsResponse, leaseRes] = await Promise.all([
        apiClient.getApplications(), // Get ALL applications, not filtered by property
        apiClient.getTenants(),
        apiClient.getLeases(),
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
        app.property_ref === property.id && 
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
          .filter(app => app.property_ref === property.id)
          .map(app => app.tenant),
        ...allLeases
          .filter(lease => lease.property_ref === property.id && lease.status !== 'terminated')
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
      setError(err.message || 'Failed to load data');
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

  const validate = () => {
    if (!selectedTenant) {
      setError('Please select or create a tenant.');
      return false;
    }
    if (!leaseData.start_date || !leaseData.end_date) {
      setError('Start and end dates are required.');
      return false;
    }
    if (!leaseData.monthly_rent || leaseData.monthly_rent <= 0) {
      setError('A valid monthly rent is required.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    
    try {
      setSaving(true);
      setError(null);

      const currentUser = await apiClient.getProfile();

      const leasePayload: LeaseFormData = {
        tenant: selectedTenant!,
        room: room.id,
        start_date: leaseData.start_date!,
        end_date: leaseData.end_date!,
        monthly_rent: leaseData.monthly_rent!,
        security_deposit: leaseData.security_deposit || 0,
      };

      await apiClient.createLease(leasePayload);
      onSave();
      onClose();
    } catch (err: any) {
      let msg = err?.response?.data?.detail || err.message || 'Failed to assign tenant';
      if (err?.response?.data && typeof err.response.data === 'object') {
        msg = Object.values(err.response.data).flat().join(' ');
      }
      setError(msg);
    } finally {
      setSaving(false);
    }
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
    <div className="fixed top-[72px] left-0 right-0 bottom-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Assign Tenant to {room.name}
          </h3>
          <p className="text-sm text-gray-500">{property.name}</p>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && <div className="p-3 mb-4 text-red-800 bg-red-100 border border-red-200 rounded-md">{error}</div>}

          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-8 p-5 bg-gray-50 rounded-lg">
            <div className={`flex flex-col items-center ${selectedTenant ? 'text-green-600' : 'text-blue-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${selectedTenant ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
                1
              </div>
              <span className="text-sm font-medium mt-1">Select Tenant</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300 mx-4"></div>
            <div className={`flex flex-col items-center ${selectedTenant ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${selectedTenant ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                2
              </div>
              <span className="text-sm font-medium mt-1">Lease Details</span>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading tenant options...</p>
            </div>
          ) : (
            <>
              {/* Tenant Selection Tabs */}
              <div className="mb-8">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('applications')}
                    className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'applications'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    All Applications ({getTabCount('applications')})
                  </button>
                  <button
                    onClick={() => setActiveTab('property-applications')}
                    className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'property-applications'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Property Applications ({getTabCount('property-applications')})
                  </button>
                  <button
                    onClick={() => setActiveTab('recommended')}
                    className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'recommended'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Recommended ({getTabCount('recommended')})
                  </button>
                  <button
                    onClick={() => setActiveTab('draft-leases')}
                    className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'draft-leases'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Draft Leases ({getTabCount('draft-leases')})
                  </button>
                  <button
                    onClick={() => setActiveTab('create')}
                    className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'create'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    + Create New
                  </button>
                </div>

                <div className="min-h-[300px]">
                  {activeTab === 'applications' && (
                    <div>
                      <div className="mb-4">
                        <h4 className="text-base font-semibold text-gray-900">Applications for this Room</h4>
                        <p className="text-sm text-gray-600">Tenants who specifically applied for {room.name}</p>
                      </div>
                      <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                        {applications.length > 0 ? (
                          applications.map(application => {
                            const tenant = tenants.find(t => t.id === application.tenant);
                            if (!tenant) return null;
                            
                            const isSelected = selectedTenant === tenant.id && selectedSource === 'application';
                            
                            return (
                              <div
                                key={application.id}
                                onClick={() => handleTenantSelect(tenant.id, 'application')}
                                className={`flex items-center p-4 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
                                  isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="radio"
                                  checked={isSelected}
                                  onChange={() => handleTenantSelect(tenant.id, 'application')}
                                  className="mr-3 text-blue-600"
                                />
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">{tenant.full_name}</div>
                                  <div className="text-sm text-gray-600">{tenant.email}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    Applied: {new Date(application.application_date).toLocaleDateString()}
                                    {application.move_in_date && (
                                      <span> • Move-in: {new Date(application.move_in_date).toLocaleDateString()}</span>
                                    )}
                                    <span> • Budget: {formatCurrency(application.rent_budget)}</span>
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="ml-3 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-12 text-gray-500">
                            <p>No applications found for this specific room.</p>
                            <p className="text-sm mt-1">Try checking "Property Applications" for general property applications.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'property-applications' && (
                    <div>
                      <div className="mb-4">
                        <h4 className="text-base font-semibold text-gray-900">Property Applications</h4>
                        <p className="text-sm text-gray-600">Tenants who applied to this property but not specifically to {room.name}</p>
                      </div>
                      <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                        {propertyApplications.length > 0 ? (
                          propertyApplications.map(application => {
                            const tenant = tenants.find(t => t.id === application.tenant);
                            if (!tenant) return null;
                            
                            const isSelected = selectedTenant === tenant.id && selectedSource === 'application';
                            
                            return (
                              <div
                                key={application.id}
                                onClick={() => handleTenantSelect(tenant.id, 'application')}
                                className={`flex items-center p-4 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
                                  isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="radio"
                                  checked={isSelected}
                                  onChange={() => handleTenantSelect(tenant.id, 'application')}
                                  className="mr-3 text-blue-600"
                                />
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">{tenant.full_name}</div>
                                  <div className="text-sm text-gray-600">{tenant.email}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    Applied: {new Date(application.application_date).toLocaleDateString()}
                                    {application.move_in_date && (
                                      <span> • Move-in: {new Date(application.move_in_date).toLocaleDateString()}</span>
                                    )}
                                    <span> • Budget: {formatCurrency(application.rent_budget)}</span>
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="ml-3 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-12 text-gray-500">
                            <p>No property applications found.</p>
                            <p className="text-sm mt-1">Try checking "Recommended" for tenants with history at this property.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'recommended' && (
                    <div>
                      <div className="mb-4">
                        <h4 className="text-base font-semibold text-gray-900">Recommended Tenants</h4>
                        <p className="text-sm text-gray-600">Tenants with history at this property or recent applications</p>
                      </div>
                      <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                        {recommendedTenants.length > 0 ? (
                          recommendedTenants.map(tenant => {
                            const isSelected = selectedTenant === tenant.id && selectedSource === 'tenant';
                            
                            return (
                              <div
                                key={tenant.id}
                                onClick={() => handleTenantSelect(tenant.id, 'tenant')}
                                className={`flex items-center p-4 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
                                  isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="radio"
                                  checked={isSelected}
                                  onChange={() => handleTenantSelect(tenant.id, 'tenant')}
                                  className="mr-3 text-blue-600"
                                />
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">{tenant.full_name}</div>
                                  <div className="text-sm text-gray-600">{tenant.email}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    ID: {tenant.id}
                                    {tenant.phone && <span> • {tenant.phone}</span>}
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="ml-3 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-12 text-gray-500">
                            <p>No recommended tenants found.</p>
                            <p className="text-sm mt-1">Try checking "Draft Leases" or create a new tenant.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'draft-leases' && (
                    <div>
                      <div className="mb-4">
                        <h4 className="text-base font-semibold text-gray-900">Draft Leases</h4>
                        <p className="text-sm text-gray-600">Existing draft leases for this property that can be activated</p>
                      </div>
                      <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                        {draftLeases.length > 0 ? (
                          draftLeases.map(lease => {
                            const tenant = tenants.find(t => t.id === lease.tenant);
                            if (!tenant) return null;
                            
                            const isSelected = selectedTenant === tenant.id && selectedSource === 'draft';
                            
                            return (
                              <div
                                key={lease.id}
                                onClick={() => handleTenantSelect(tenant.id, 'draft')}
                                className={`flex items-center p-4 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
                                  isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="radio"
                                  checked={isSelected}
                                  onChange={() => handleTenantSelect(tenant.id, 'draft')}
                                  className="mr-3 text-blue-600"
                                />
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">{tenant.full_name}</div>
                                  <div className="text-sm text-gray-600">{tenant.email}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {new Date(lease.start_date).toLocaleDateString()} - {new Date(lease.end_date).toLocaleDateString()}
                                    <span> • Rent: {formatCurrency(lease.monthly_rent)}</span>
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="ml-3 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-12 text-gray-500">
                            <p>No draft leases found for this property.</p>
                            <p className="text-sm mt-1">Draft leases are created when applications are approved but not yet activated.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'create' && (
                    <div>
                      <div className="mb-4">
                        <h4 className="text-base font-semibold text-gray-900">Create New Tenant</h4>
                        <p className="text-sm text-gray-600">Create a new tenant profile and assign them to this room</p>
                      </div>
                      
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <div className="space-y-6">
                          <div>
                            <h5 className="text-sm font-semibold text-gray-900 mb-3">Basic Information</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name*</label>
                                <input
                                  type="text"
                                  value={newTenantForm.full_name}
                                  onChange={(e) => handleNewTenantFormChange('full_name', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Enter full name"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                                <input
                                  type="email"
                                  value={newTenantForm.email}
                                  onChange={(e) => handleNewTenantFormChange('email', e.target.value)}
                                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${emailError ? 'border-red-300' : 'border-gray-300'}`}
                                  placeholder="Enter email address"
                                  required
                                />
                                {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone*</label>
                                <input
                                  type="tel"
                                  value={newTenantForm.phone}
                                  onChange={(e) => handleNewTenantFormChange('phone', e.target.value)}
                                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${phoneError ? 'border-red-300' : 'border-gray-300'}`}
                                  placeholder="(555) 123-4567"
                                  required
                                />
                                {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                <input
                                  type="date"
                                  value={newTenantForm.date_of_birth}
                                  onChange={(e) => handleNewTenantFormChange('date_of_birth', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <h5 className="text-sm font-semibold text-gray-900 mb-3">Additional Information</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                <select
                                  value={newTenantForm.gender}
                                  onChange={(e) => handleNewTenantFormChange('gender', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Select gender</option>
                                  <option value="male">Male</option>
                                  <option value="female">Female</option>
                                  <option value="other">Other</option>
                                  <option value="prefer_not_to_say">Prefer not to say</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                                <input
                                  type="text"
                                  value={newTenantForm.occupation}
                                  onChange={(e) => handleNewTenantFormChange('occupation', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Enter occupation"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Employer</label>
                                <input
                                  type="text"
                                  value={newTenantForm.employer}
                                  onChange={(e) => handleNewTenantFormChange('employer', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Enter employer"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income</label>
                                <input
                                  type="number"
                                  value={newTenantForm.monthly_income}
                                  onChange={(e) => handleNewTenantFormChange('monthly_income', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Enter monthly income"
                                  step="0.01"
                                  min="0"
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <h5 className="text-sm font-semibold text-gray-900 mb-3">Emergency Contact</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                                <input
                                  type="text"
                                  value={newTenantForm.emergency_contact_name}
                                  onChange={(e) => handleNewTenantFormChange('emergency_contact_name', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Enter emergency contact name"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone</label>
                                <input
                                  type="tel"
                                  value={newTenantForm.emergency_contact_phone}
                                  onChange={(e) => handleNewTenantFormChange('emergency_contact_phone', e.target.value)}
                                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${emergencyPhoneError ? 'border-red-300' : 'border-gray-300'}`}
                                  placeholder="(555) 123-4567"
                                />
                                {emergencyPhoneError && <p className="text-red-500 text-xs mt-1">{emergencyPhoneError}</p>}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                                <select
                                  value={newTenantForm.emergency_contact_relationship}
                                  onChange={(e) => handleNewTenantFormChange('emergency_contact_relationship', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Select relationship</option>
                                  <option value="parent">Parent</option>
                                  <option value="spouse">Spouse</option>
                                  <option value="sibling">Sibling</option>
                                  <option value="friend">Friend</option>
                                  <option value="other">Other</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current Address</label>
                                <textarea
                                  value={newTenantForm.current_address}
                                  onChange={(e) => handleNewTenantFormChange('current_address', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Enter current address"
                                  rows={2}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={handleCreateNewTenant}
                              disabled={creatingTenant || !newTenantForm.full_name || !newTenantForm.email || !newTenantForm.phone}
                              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center"
                            >
                              {creatingTenant ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Creating Tenant...
                                </>
                              ) : (
                                'Create Tenant'
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Lease Details Section - Only show if tenant is selected */}
              {selectedTenant && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center mb-4 pb-3 border-b border-gray-200">
                    <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h4 className="text-base font-semibold text-gray-900">Lease Details</h4>
                  </div>
                  
                  {selectedTenantData && (
                    <div className="mb-6">
                      <div className="flex items-center bg-white p-4 rounded-lg border border-gray-200">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg mr-4">
                          {selectedTenantData.tenant?.full_name?.charAt(0) || 'T'}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{selectedTenantData.tenant?.full_name}</div>
                          <div className="text-sm text-gray-600">{selectedTenantData.tenant?.email}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {selectedSource === 'application' && selectedTenantData.application && (
                              <span>From Application • Applied {new Date(selectedTenantData.application.application_date).toLocaleDateString()}</span>
                            )}
                            {selectedSource === 'draft' && selectedTenantData.draftLease && (
                              <span>From Draft Lease • Created {new Date(selectedTenantData.draftLease.created_at).toLocaleDateString()}</span>
                            )}
                            {selectedSource === 'tenant' && <span>Recommended Tenant</span>}
                            {selectedSource === 'create' && <span>Newly Created</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date*</label>
                      <input
                        type="date"
                        value={leaseData.start_date || ''}
                        onChange={(e) => setLeaseData({...leaseData, start_date: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date*</label>
                      <input
                        type="date"
                        value={leaseData.end_date || ''}
                        onChange={(e) => setLeaseData({...leaseData, end_date: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent*</label>
                      <input
                        type="number"
                        value={leaseData.monthly_rent || ''}
                        onChange={(e) => setLeaseData({...leaseData, monthly_rent: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        step="0.01"
                        min="0"
                        required
                      />
                      {room.monthly_rent && (
                        <p className="text-xs text-gray-500 mt-1">Room base rent: {formatCurrency(Number(room.monthly_rent))}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit*</label>
                      <input
                        type="number"
                        value={leaseData.security_deposit || ''}
                        onChange={(e) => setLeaseData({...leaseData, security_deposit: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        step="0.01"
                        min="0"
                        required
                      />
                      {room.monthly_rent && (
                        <p className="text-xs text-gray-500 mt-1">Suggested: {formatCurrency(Number(room.monthly_rent))}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selectedTenant}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Lease...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Create Lease & Assign
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 