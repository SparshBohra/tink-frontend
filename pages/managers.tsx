import { useState, useEffect } from 'react';
import Head from 'next/head';
import Navigation from '../components/Navigation';
import DashboardLayout from '../components/DashboardLayout';
import MetricCard from '../components/MetricCard';
import SectionCard from '../components/SectionCard';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import PropertyAssignmentModal from '../components/PropertyAssignmentModal';
import { useAuth, withAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';
import { ManagerWithProperties, ManagerFormData, Property } from '../lib/types';

function ManagersPage() {
  const { user, isAdmin, isLandlord } = useAuth();
  const [managers, setManagers] = useState<ManagerWithProperties[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [landlordProfile, setLandlordProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingManager, setEditingManager] = useState<ManagerWithProperties | null>(null);
  const [showPropertySelection, setShowPropertySelection] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedManagerForAssignment, setSelectedManagerForAssignment] = useState<ManagerWithProperties | null>(null);
  const [formData, setFormData] = useState<ManagerFormData>({
    full_name: '',
    email: '',
    username: '',
    password: '',
    password_confirm: '',
    property_ids: [],
    access_all_properties: false
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      let profile = null;
      
      // Fetch landlord profile first for non-admin users
      if (isLandlord()) {
        try {
          profile = await apiClient.getLandlordProfile();
          setLandlordProfile(profile);
          console.log('Fetched landlord profile:', profile);
        } catch (err) {
          console.error('Failed to fetch landlord profile:', err);
        }
      }
      
      // Then fetch managers and properties (pass profile to avoid race condition)
      await Promise.all([
        fetchManagers(profile),
        fetchProperties()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async (currentLandlordProfile?: any) => {
    try {
      setError(null);
      
      let managersData: ManagerWithProperties[] = [];
      
      if (isAdmin()) {
        // Admin can see all managers
        const response = await apiClient.getAllManagers();
        // Convert to ManagerWithProperties format for admin users
        managersData = (response || []).map((manager: any) => ({
          ...manager,
          assigned_properties: [],
          access_level: manager.role === 'admin' ? 'full' : 'limited'
        }));
      } else if (isLandlord()) {
        // Landlords can see only their assigned managers
        try {
          const allManagers = await apiClient.getManagersWithProperties();
          console.log('Fetched all managers:', allManagers);
          
          // Filter to only show users with role="manager" for landlords
          managersData = (allManagers || []).filter((manager: any) => 
            manager.role === 'manager'
          );
          
          console.log('Filtered managers for landlord (role=manager only):', managersData);
        } catch (err: any) {
          console.error('Failed to fetch managers with properties:', err);
          // Fallback: try to get managers by landlord ID if we have the profile
          const profileToUse = currentLandlordProfile || landlordProfile;
          if (profileToUse?.id) {
            try {
              const fallbackManagers = await apiClient.getManagersForLandlord(profileToUse.id);
              managersData = (fallbackManagers || [])
                .filter((manager: any) => manager.role === 'manager')
                .map((manager: any) => ({
                  ...manager,
                  assigned_properties: [],
                  access_level: 'limited'
                }));
            } catch (fallbackErr) {
              console.error('Fallback manager fetch also failed:', fallbackErr);
              managersData = [];
            }
          }
        }
      }
      
      setManagers(managersData);
    } catch (err: any) {
      console.error('Failed to fetch managers:', err);
      setError(err?.message || 'Failed to load managers');
      setManagers([]);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await apiClient.getProperties();
      setProperties(response.results || []);
    } catch (err: any) {
      console.error('Failed to fetch properties:', err);
    }
  };

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      setError(null);
      
      // Validate password confirmation for new managers
      if (!editingManager && formData.password !== formData.password_confirm) {
        setError('Password and confirm password do not match');
        setFormLoading(false);
        return;
      }
      
      if (editingManager) {
        // Update existing manager
        await apiClient.updateManager(editingManager.id, {
          full_name: formData.full_name,
          email: formData.email,
        });
      } else {
        // Create new manager with property assignments
        // Use landlord profile ID instead of user ID
        const landlordId = landlordProfile?.id;
        if (!landlordId) {
          throw new Error('Landlord profile not found. Please refresh the page and try again.');
        }
        
        const managerData: ManagerFormData = {
          ...formData,
          landlord_id: landlordId
        };
        
        await apiClient.createManagerWithProperties(managerData);
      }
      
      setShowForm(false);
      setShowPropertySelection(false);
      setEditingManager(null);
      resetForm();
      await fetchManagers();
      
    } catch (err: any) {
      setError(err?.message || 'Failed to save manager');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditManager = (manager: ManagerWithProperties) => {
    setEditingManager(manager);
    setFormData({
      full_name: manager.full_name,
      email: manager.email,
      username: manager.username,
      password: '',
      property_ids: manager.assigned_properties?.map(p => p.id) || [],
      access_all_properties: manager.access_level === 'full'
    });
    setShowForm(true);
  };

  const handleDeleteManager = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete manager "${name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setError(null);
      await apiClient.deleteManager(id);
      await fetchManagers();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete manager');
    }
  };

  const handlePropertySelection = (propertyId: number) => {
    const currentIds = formData.property_ids || [];
    if (currentIds.includes(propertyId)) {
      setFormData({
        ...formData,
        property_ids: currentIds.filter(id => id !== propertyId)
      });
    } else {
      setFormData({
        ...formData,
        property_ids: [...currentIds, propertyId]
      });
    }
  };

  const handleSelectAllProperties = () => {
    if (formData.access_all_properties) {
      setFormData({
        ...formData,
        access_all_properties: false,
        property_ids: []
      });
    } else {
      setFormData({
        ...formData,
        access_all_properties: true,
        property_ids: properties.map(p => p.id)
      });
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      username: '',
      password: '',
      password_confirm: '',
      property_ids: [],
      access_all_properties: false
    });
  };

  const getAccessLevelBadge = (manager: ManagerWithProperties) => {
    if (manager.role === 'admin') {
      return <StatusBadge status="info" text="System Admin" />;
    }
    if (manager.role === 'owner') {
      return <StatusBadge status="success" text="Property Owner" />;
    }
    if (manager.access_level === 'full') {
      return <StatusBadge status="success" text="Full Access" />;
    }
    const propertyCount = manager.assigned_properties?.length || 0;
    const totalProperties = properties.length;
    return <StatusBadge status="warning" text={`${propertyCount} of ${totalProperties} Properties`} />;
  };

  const getPropertyList = (manager: ManagerWithProperties) => {
    if (manager.role === 'admin') {
      return <span className="text-muted">All System Access</span>;
    }
    if (manager.role === 'owner') {
      return <span className="text-muted">All Owned Properties</span>;
    }
    if (manager.access_level === 'full') {
      return <span className="text-muted">All Properties</span>;
    }
    const propertyNames = manager.assigned_properties?.map(p => p.name).join(', ') || 'None';
    return <span className="property-display" title={propertyNames}>{propertyNames}</span>;
  };

  const handleEditAssignments = (manager: ManagerWithProperties) => {
    setSelectedManagerForAssignment(manager);
    setAssignmentModalOpen(true);
  };

  const handleAssignmentModalClose = () => {
    setAssignmentModalOpen(false);
    setSelectedManagerForAssignment(null);
  };

  const handleAssignmentModalSave = async () => {
    await fetchManagers(); // Refresh the managers list
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <DashboardLayout
          title={isAdmin() ? 'All Managers' : 'My Team'}
          subtitle="Loading managers..."
        >
          <div className="loading-indicator">
            <div className="loading-spinner" />
            <p>Fetching manager data...</p>
          </div>
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Manage Team - Tink</title>
      </Head>
      <Navigation />
      <DashboardLayout
        title={isAdmin() ? 'All Managers' : 'My Team'}
        subtitle={isAdmin() ? 'Manage all property managers' : 'Manage your property management team with granular property access'}
      >
        {error && <div className="alert alert-error">{error}</div>}
        
        {/* Manager Overview Metrics */}
        <SectionCard title="Team Overview">
          <div className="metrics-grid">
            <MetricCard 
              title="Total Managers" 
              value={managers.filter(m => m.role === 'manager').length} 
              color="blue" 
            />
            <MetricCard 
              title="Full Access" 
              value={managers.filter(m => m.role === 'manager' && m.access_level === 'full').length} 
              color="green" 
            />
            <MetricCard 
              title="Limited Access" 
              value={managers.filter(m => m.role === 'manager' && m.access_level === 'limited').length} 
              color="amber" 
            />
            <MetricCard 
              title="Properties" 
              value={properties.length} 
              subtitle="Available for assignment"
              color="purple" 
            />
          </div>
        </SectionCard>
        
        <SectionCard>
          <div className="actions-container">
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              {isAdmin() ? 'Create Manager' : 'Add Manager'}
            </button>
            <button className="btn btn-secondary" onClick={fetchManagers}>Refresh</button>
          </div>
        </SectionCard>

        {showForm && (
          <SectionCard title={editingManager ? 'Edit Manager' : 'Add New Manager'}>
            <form onSubmit={handleCreateManager} className="manager-form">
              <div className="form-group">
                <label htmlFor="full_name">Full Name</label>
                <input
                  type="text"
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              
              {!editingManager && (
                <>
                  <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                      type="text"
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="password_confirm">Confirm Password</label>
                    <input
                      type="password"
                      id="password_confirm"
                      value={formData.password_confirm || ''}
                      onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
                      required
                    />
                  </div>

                  {/* Property Access Selection */}
                  <div className="form-group">
                    <label className="access-main-label">
                      <span className="label-icon">🏢</span>
                      Property Access
                    </label>
                    <div className="property-access-section">
                      <div className="access-option-card">
                        <label className="access-toggle">
                          <input
                            type="checkbox"
                            checked={formData.access_all_properties}
                            onChange={handleSelectAllProperties}
                          />
                          <div className="toggle-content">
                            <div className="toggle-header">
                              <span className="toggle-icon">🌟</span>
                              <span className="toggle-title">Full Access</span>
                            </div>
                            <p className="toggle-description">Manager can access all properties in your portfolio</p>
                          </div>
                        </label>
                      </div>
                      
                      {!formData.access_all_properties && (
                        <div className="property-selection">
                          <div className="selection-header">
                            <span className="selection-icon">🎯</span>
                            <h4>Select Specific Properties</h4>
                            <p className="selection-subtitle">Choose which properties this manager can access</p>
                          </div>
                          <div className="property-grid">
                            {properties.map(property => (
                              <div key={property.id} className="property-card">
                                <label className="property-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={formData.property_ids?.includes(property.id) || false}
                                    onChange={() => handlePropertySelection(property.id)}
                                  />
                                  <div className="property-info">
                                    <div className="property-name">{property.name}</div>
                                    <div className="property-address">{property.full_address || property.address}</div>
                                    <div className="property-stats">
                                      <span className="room-count">{property.total_rooms} rooms</span>
                                      {property.vacant_rooms > 0 && (
                                        <span className="vacant-badge">{property.vacant_rooms} vacant</span>
                                      )}
                                    </div>
                                  </div>
                                </label>
                              </div>
                            ))}
                          </div>
                          {properties.length === 0 && (
                            <div className="empty-properties">
                              <span className="empty-icon">🏠</span>
                              <p>No properties available. Create properties first to assign them to managers.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
              
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Saving...' : (editingManager ? 'Update Manager' : 'Create Manager')}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowForm(false);
                    setShowPropertySelection(false);
                    setEditingManager(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </SectionCard>
        )}

        <SectionCard title="Manager List">
          {managers.length > 0 ? (
            <DataTable
              columns={[
                { key: 'full_name', header: 'Name' },
                { key: 'email', header: 'Email' },
                { key: 'access_level', header: 'Access Level' },
                { key: 'properties', header: 'Assigned Properties' },
                { key: 'status', header: 'Status' },
                { key: 'actions', header: 'Actions' },
              ]}
              data={managers}
              renderRow={(manager) => (
                <tr key={manager.id}>
                  <td style={{ textAlign: 'center' }}>
                    <strong>{manager.full_name}</strong>
                  </td>
                  <td style={{ textAlign: 'center' }}>{manager.email}</td>
                <td style={{ textAlign: 'center' }}>
                    {getAccessLevelBadge(manager)}
                  </td>
                  <td style={{ textAlign: 'center', maxWidth: '200px' }}>
                    {getPropertyList(manager)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <StatusBadge 
                      status={manager.is_active ? 'success' : 'error'} 
                      text={manager.is_active ? 'Active' : 'Inactive'} 
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-warning btn-sm"
                        onClick={() => handleEditManager(manager)}
                      >
                        Edit
                      </button>
                      {manager.role === 'manager' && (
                        <button 
                          className="btn btn-info btn-sm"
                          onClick={() => handleEditAssignments(manager)}
                          title="Edit Property Assignments"
                        >
                          Assignments
                        </button>
                      )}
                      <button 
                        className="btn btn-error btn-sm" 
                        onClick={() => handleDeleteManager(manager.id, manager.full_name)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            />
          ) : (
            <EmptyState 
              title="No Managers Found" 
              description={isAdmin() ? "No managers are registered on the platform." : "No managers have been assigned to your organization. Create your first manager to get started with team management."} 
            />
          )}
        </SectionCard>
      </DashboardLayout>
      
      {/* Property Assignment Modal */}
      {selectedManagerForAssignment && (
        <PropertyAssignmentModal
          manager={selectedManagerForAssignment}
          isOpen={assignmentModalOpen}
          onClose={handleAssignmentModalClose}
          onSave={handleAssignmentModalSave}
        />
      )}
      
      <style jsx>{`
        .actions-container { 
          display: flex; 
          gap: 1rem; 
          margin-bottom: 1.5rem;
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .manager-form { 
          max-width: 600px;
        }
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #374151;
        }
        
        .form-group input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 1rem;
        }
        
        .form-group input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .property-access-section {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.5rem;
          margin-top: 0.5rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
        }

        /* Professional Property Access Styling */
        .access-main-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.1rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1rem;
        }

        .label-icon {
          font-size: 1.2rem;
        }

        .access-option-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
          transition: all 0.3s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .access-option-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
          transform: translateY(-1px);
        }

        .access-toggle {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          cursor: pointer;
          width: 100%;
        }

        .access-toggle input[type="checkbox"] {
          width: 18px;
          height: 18px;
          margin-top: 2px;
          cursor: pointer;
          accent-color: #3b82f6;
        }

        .toggle-content {
          flex: 1;
        }

        .toggle-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .toggle-icon {
          font-size: 1.1rem;
        }

        .toggle-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1f2937;
        }

        .toggle-description {
          color: #6b7280;
          font-size: 0.9rem;
          margin: 0;
          line-height: 1.4;
        }

        .property-selection {
          background: white;
          border: 2px dashed #cbd5e1;
          border-radius: 10px;
          padding: 1.5rem;
        }

        .selection-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .selection-icon {
          font-size: 2rem;
          display: block;
          margin-bottom: 0.5rem;
        }

        .selection-header h4 {
          margin: 0 0 0.5rem 0;
          color: #1f2937;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .selection-subtitle {
          color: #6b7280;
          font-size: 0.9rem;
          margin: 0;
        }

        .property-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1rem;
          max-height: 300px;
          overflow-y: auto;
          padding: 0.5rem;
        }

        .property-card {
          background: white;
          border: 2px solid #f1f5f9;
          border-radius: 8px;
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .property-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
          transform: translateY(-2px);
        }

        .property-checkbox {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem;
          cursor: pointer;
          width: 100%;
        }

        .property-checkbox input[type="checkbox"] {
          width: 16px;
          height: 16px;
          margin-top: 2px;
          cursor: pointer;
          accent-color: #3b82f6;
        }

        .property-info {
          flex: 1;
        }

        .property-name {
          font-weight: 600;
          color: #1f2937;
          font-size: 0.95rem;
          margin-bottom: 0.25rem;
        }

        .property-address {
          color: #6b7280;
          font-size: 0.85rem;
          line-height: 1.3;
          margin-bottom: 0.5rem;
        }

        .property-stats {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .room-count {
          background: #f3f4f6;
          color: #374151;
          padding: 0.125rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .vacant-badge {
          background: #fef3c7;
          color: #d97706;
          padding: 0.125rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .empty-properties {
          text-align: center;
          padding: 2rem;
          color: #6b7280;
        }

        .empty-icon {
          font-size: 3rem;
          display: block;
          margin-bottom: 0.5rem;
          opacity: 0.7;
        }

        .text-muted {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .property-display {
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .form-actions { 
          display: flex; 
          gap: 1rem; 
          margin-top: 1.5rem; 
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
        }
        
        .action-buttons { 
          display: flex; 
          gap: 0.5rem; 
          justify-content: center; 
        }
        
        .loading-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        .alert {
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
        }
        
        .alert-error {
          background-color: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        /* Button styles */
        .btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 0.375rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-block;
        }

        .btn-primary {
          background-color: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background-color: #2563eb;
        }

        .btn-secondary {
          background-color: #6b7280;
          color: white;
        }
        
        .btn-secondary:hover {
          background-color: #4b5563;
        }

        .btn-warning {
          background-color: #f59e0b;
          color: white;
        }

        .btn-warning:hover {
          background-color: #d97706;
        }

        .btn-info {
          background-color: #06b6d4;
          color: white;
        }

        .btn-info:hover {
          background-color: #0891b2;
        }

        .btn-error {
          background-color: #dc2626;
          color: white;
        }

        .btn-error:hover {
          background-color: #b91c1c;
        }

        .btn-sm {
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
}

export default withAuth(ManagersPage, ['admin', 'owner']); 
 