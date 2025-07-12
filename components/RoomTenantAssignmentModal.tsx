
import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { Tenant, Application, LeaseFormData, TenantFormData, Property, Room } from '../lib/types';
import { phoneUtils } from '../lib/utils';

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
  const [selectedTenant, setSelectedTenant] = useState<number | null>(null);
  const [leaseData, setLeaseData] = useState<Partial<LeaseFormData>>({
    start_date: '',
    end_date: '',
    monthly_rent: Number(room?.monthly_rent) || 0,
    security_deposit: Number(room?.monthly_rent) || 0,
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

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, property, room]);

  const fetchData = async () => {
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
      
      setTenants(availableTenants);
      setApplications(appRes.results?.filter(app => !app.room || app.room === room.id) || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
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

  const handleCreateNewTenant = async () => {
    if (!newTenantForm.full_name || !newTenantForm.email) {
      setError('Name and email are required.');
      return;
    }
    
    try {
      setSaving(true);
      const tenant = await apiClient.createTenant({
        ...newTenantForm,
        phone: newTenantForm.phone ? phoneUtils.toE164Format(newTenantForm.phone) : '',
      });
      setTenants(prev => [tenant, ...prev]);
      setSelectedTenant(tenant.id);
      setActiveTab('tenants');
      setNewTenantForm({ full_name: '', email: '', phone: '' });
    } catch (e:any) {
      setError(e.message || 'Failed to create tenant.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl transform transition-all">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Assign Tenant to {room.name}
          </h3>
          <p className="text-sm text-gray-500">{property.name}</p>
        </div>

        <div className="p-6">
          {error && <div className="p-3 mb-4 text-red-800 bg-red-100 border border-red-200 rounded-md">{error}</div>}

          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6">
                  <button onClick={() => setActiveTab('applications')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'applications' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                    Applications ({applications.length})
                  </button>
                  <button onClick={() => setActiveTab('tenants')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'tenants' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                    Existing Tenants ({tenants.length})
                  </button>
                  <button onClick={() => setActiveTab('create')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'create' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                    Create New Tenant
                  </button>
                </nav>
              </div>

              <div className="py-5">
                {activeTab === 'applications' && (
                  <div className="max-h-60 overflow-y-auto">
                    {applications.map(app => (
                      <div key={app.id} onClick={() => setSelectedTenant(app.tenant)} className={`p-3 rounded-lg cursor-pointer ${selectedTenant === app.tenant ? 'bg-indigo-100' : 'hover:bg-gray-50'}`}>
                        <p className="font-semibold">{tenants.find(t => t.id === app.tenant)?.full_name}</p>
                        <p className="text-sm text-gray-600">{tenants.find(t => t.id === app.tenant)?.email}</p>
                      </div>
                    ))}
                    {applications.length === 0 && <p className="text-center text-gray-500 py-4">No pending applications for this property.</p>}
                  </div>
                )}
                
                {activeTab === 'tenants' && (
                  <div className="max-h-60 overflow-y-auto">
                    {tenants.map(t => (
                      <div key={t.id} onClick={() => setSelectedTenant(t.id)} className={`p-3 rounded-lg cursor-pointer ${selectedTenant === t.id ? 'bg-indigo-100' : 'hover:bg-gray-50'}`}>
                        <p className="font-semibold">{t.full_name}</p>
                        <p className="text-sm text-gray-600">{t.email}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'create' && (
                  <div className="space-y-4">
                    <input type="text" placeholder="Full Name" value={newTenantForm.full_name} onChange={e => setNewTenantForm({...newTenantForm, full_name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                    <input type="email" placeholder="Email" value={newTenantForm.email} onChange={e => setNewTenantForm({...newTenantForm, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                    <input type="tel" placeholder="Phone (optional)" value={newTenantForm.phone} onChange={e => setNewTenantForm({...newTenantForm, phone: phoneUtils.formatPhoneNumber(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                    <button onClick={handleCreateNewTenant} disabled={saving} className="w-full px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
                      {saving ? 'Creating...' : 'Create & Select Tenant'}
                    </button>
                  </div>
                )}
              </div>
              
              <div className="pt-5 border-t">
                <h4 className="text-md font-medium text-gray-800 mb-3">Lease Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input type="date" placeholder="Start Date" value={leaseData.start_date || ''} onChange={e => setLeaseData({...leaseData, start_date: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-md" />
                  <input type="date" placeholder="End Date" value={leaseData.end_date || ''} onChange={e => setLeaseData({...leaseData, end_date: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-md" />
                  <input type="number" placeholder="Monthly Rent" value={leaseData.monthly_rent || ''} onChange={e => setLeaseData({...leaseData, monthly_rent: parseFloat(e.target.value)})} className="px-3 py-2 border border-gray-300 rounded-md" />
                  <input type="number" placeholder="Security Deposit" value={leaseData.security_deposit || ''} onChange={e => setLeaseData({...leaseData, security_deposit: parseFloat(e.target.value)})} className="px-3 py-2 border border-gray-300 rounded-md" />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 text-right space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !selectedTenant} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300">
            {saving ? 'Saving...' : 'Assign Tenant & Create Lease'}
          </button>
        </div>
      </div>
    </div>
  );
} 