import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '../components/DashboardLayout';
import PropertyAssignmentModal from '../components/PropertyAssignmentModal';
import { useAuth, withAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';
import { ManagerWithProperties, ManagerFormData, Property } from '../lib/types';

function ManagersPage() {
  const { user, isAdmin, isLandlord } = useAuth();
  const router = useRouter();
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
  
  // Filter states
  const [filterByProperty, setFilterByProperty] = useState<number | null>(null);
  const [filterByLandlord, setFilterByLandlord] = useState<number | null>(null);
  const [landlords, setLandlords] = useState<any[]>([]);
  
  // Sorting states
  const [sortBy, setSortBy] = useState<string>('full_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
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

  // Handle URL parameters for filtering
  useEffect(() => {
    if (router.isReady && landlords.length > 0) {
      const { landlord, property, action } = router.query;
      
      // Auto-filter by landlord if coming from landlord page
      if (landlord && typeof landlord === 'string') {
        const landlordId = parseInt(landlord);
        if (!isNaN(landlordId)) {
          // Check if landlord exists in current data
          const landlordExists = landlords.find(l => l.id === landlordId);
          if (landlordExists) {
            setFilterByLandlord(landlordId);
            console.log('Auto-filtering by landlord ID:', landlordId, 'Name:', landlordExists.full_name);
          } else {
            console.warn('Landlord ID from URL not found in current data:', landlordId);
            // Still set the filter - it might be from API data that's not loaded yet
            setFilterByLandlord(landlordId);
          }
        }
      }
      
      // Auto-filter by property if specified
      if (property && typeof property === 'string') {
        const propertyId = parseInt(property);
        if (!isNaN(propertyId)) {
          setFilterByProperty(propertyId);
          console.log('Auto-filtering by property ID:', propertyId);
        }
      }
      
      // Handle action parameter (e.g., assign)
      if (action === 'assign') {
        setShowForm(true);
        console.log('Auto-opening manager creation form for assignment');
      }
    }
  }, [router.isReady, router.query, landlords]);

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
      const promises = [
        fetchManagers(profile),
        fetchProperties()
      ];
      
      // Fetch landlords for admin users (for filtering)
      if (isAdmin()) {
        promises.push(fetchLandlords());
      }
      
      await Promise.all(promises);
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async (currentLandlordProfile?: any) => {
    try {
      setError(null);
      
      let managersData: ManagerWithProperties[] = [];
      
      if (isAdmin()) {
        // Admin can see all managers with landlord information
        const response = await apiClient.getAllManagers();
        
        // Fetch all related data: relationships, landlords, and property assignments
        try {
          const [relationships, landlords, propertyAssignments, allProperties] = await Promise.all([
            apiClient.getManagerLandlordRelationships(),
            apiClient.getAllLandlords(),
            apiClient.getManagerPropertyAssignments(),
            apiClient.getProperties()
          ]);
          
          console.log('Fetched relationships:', relationships);
          console.log('Fetched landlords:', landlords);
          console.log('Fetched property assignments:', propertyAssignments);
          
          // Convert to ManagerWithProperties format and enhance with all related data
          managersData = (response || []).map((manager: any) => {
            const relationship = relationships.find(rel => rel.manager === manager.id);
            let landlordInfo = {};
            let assignedProperties: any[] = [];
            
            console.log(`Processing manager ${manager.full_name} (ID: ${manager.id})`);
            console.log('Found relationship:', relationship);
            
            // Get landlord information
            if (relationship) {
              const landlord = landlords.find(l => l.id === relationship.landlord);
              console.log('Found landlord:', landlord);
              if (landlord) {
                landlordInfo = {
                  landlord_id: landlord.id,
                  landlord_name: landlord.full_name,
                  landlord_org_name: landlord.org_name
                };
              }
            }
            
            // Get assigned properties for this manager
            const managerAssignments = propertyAssignments.filter(assignment => assignment.manager === manager.id);
            console.log(`Found ${managerAssignments.length} assignments for manager ${manager.id}`);
            
            assignedProperties = managerAssignments.map(assignment => {
              const property = allProperties.results?.find(p => p.id === assignment.property);
              return property ? {
                id: property.id,
                name: property.name,
                address: property.address,
                full_address: property.full_address,
                total_rooms: property.total_rooms,
                vacant_rooms: property.vacant_rooms
              } : null;
            }).filter(Boolean);
            
            const enhancedManager = {
              ...manager,
              ...landlordInfo,
              assigned_properties: assignedProperties,
              access_level: manager.role === 'admin' || manager.role === 'owner' ? 'full' : 
                           assignedProperties.length > 0 ? 'limited' : 'limited'
            };
            
            console.log('Enhanced manager:', enhancedManager);
            return enhancedManager;
          });
        } catch (relationshipError) {
          console.log('Could not fetch landlord relationships, using basic manager data:', relationshipError);
          // Fallback to basic manager data
          managersData = (response || []).map((manager: any) => ({
            ...manager,
            assigned_properties: [],
            access_level: manager.role === 'admin' ? 'full' : 'limited'
          }));
        }
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

  const fetchLandlords = async () => {
    try {
      const response = await apiClient.getAllLandlords();
      setLandlords(response || []);
    } catch (err: any) {
      console.error('Failed to fetch landlords:', err);
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
      return <span className="status-badge status-info">System Admin</span>;
    }
    if (manager.role === 'owner') {
      return <span className="status-badge status-success">Property Owner</span>;
    }
    
    // For regular managers, show their assignment status
    const propertyCount = manager.assigned_properties?.length || 0;
    
    if (propertyCount === 0) {
      return <span className="status-badge status-error">No Access</span>;
    }
    
    // Check if they have access to all landlord's properties
    if (manager.access_level === 'full') {
      return <span className="status-badge status-success">Full Access</span>;
    }
    
    return <span className="status-badge status-warning">{propertyCount} Properties</span>;
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
    
    const assignedProperties = manager.assigned_properties || [];
    if (assignedProperties.length === 0) {
      return <span className="text-muted">No Properties Assigned</span>;
    }
    
    const propertyNames = assignedProperties.map(p => p.name).join(', ');
    const displayText = assignedProperties.length > 2 
      ? `${assignedProperties.slice(0, 2).map(p => p.name).join(', ')} +${assignedProperties.length - 2} more`
      : propertyNames;
      
    return <span className="property-display" title={propertyNames}>{displayText}</span>;
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

  // Filter and sort managers
  const filteredAndSortedManagers = managers
    .filter(manager => {
      if (filterByProperty && manager.assigned_properties) {
        const hasProperty = manager.assigned_properties.some(prop => prop.id === filterByProperty);
        if (!hasProperty) return false;
      }
      
      if (filterByLandlord && manager.landlord_id) {
        if (manager.landlord_id !== filterByLandlord) return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'full_name':
          aValue = a.full_name || '';
          bValue = b.full_name || '';
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'landlord':
          aValue = a.landlord_name || '';
          bValue = b.landlord_name || '';
          break;
        case 'access_level':
          aValue = a.access_level || '';
          bValue = b.access_level || '';
          break;
        case 'properties':
          aValue = a.assigned_properties?.length || 0;
          bValue = b.assigned_properties?.length || 0;
          break;
        case 'status':
          aValue = a.is_active ? 1 : 0;
          bValue = b.is_active ? 1 : 0;
          break;
        default:
          aValue = a.full_name || '';
          bValue = b.full_name || '';
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
        return sortOrder === 'asc' ? comparison : -comparison;
      } else {
        const comparison = aValue - bValue;
        return sortOrder === 'asc' ? comparison : -comparison;
      }
    });

  const clearFilters = () => {
    setFilterByProperty(null);
    setFilterByLandlord(null);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        title="Loading managers..."
      >
        <div className="loading-indicator">
          <div className="loading-spinner" />
          <p>Fetching manager data...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Manage Team - Tink</title>
      </Head>
      <DashboardLayout title="">
        <div className="dashboard-container">
          {/* Custom Header */}
          <div className="dashboard-header">
            <div className="header-content">
              <div className="header-left">
                <h1 className="dashboard-title">{isAdmin() ? 'All Managers' : 'My Team'}</h1>
                <div className="subtitle-container">
                  <p className="welcome-message">
                    {isAdmin() ? 'Manage all property managers' : 'Manage your property management team with granular property access'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          
          {/* Manager List Section */}
          <div className="managers-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Manager List ({filteredAndSortedManagers.length})</h2>
                <p className="section-subtitle">
                  Showing {filteredAndSortedManagers.length} of {managers.length} managers
                </p>
              </div>
              <div className="section-actions">
                <button 
                  onClick={() => setShowForm(true)} 
                  className="btn btn-primary add-manager-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <line x1="19" y1="8" x2="19" y2="14"/>
                    <line x1="22" y1="11" x2="16" y2="11"/>
                  </svg>
                  Add Manager
                </button>
                <button onClick={fetchManagers} className="refresh-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10"/>
                    <polyline points="1 20 1 14 7 14"/>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
                
                {/* Filters */}
                <div className="filters-container">
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="propertyFilter">Filter by Property:</label>
                      <select 
                        id="propertyFilter"
                        value={filterByProperty || ''} 
                        onChange={(e) => setFilterByProperty(e.target.value ? Number(e.target.value) : null)}
                        className="form-input"
                      >
                        <option value="">All Properties</option>
                        {properties.map(property => (
                          <option key={property.id} value={property.id}>
                            {property.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {isAdmin() && (
                      <div className="form-group">
                        <label htmlFor="landlordFilter">Filter by Landlord:</label>
                        <select 
                          id="landlordFilter"
                          value={filterByLandlord || ''} 
                          onChange={(e) => setFilterByLandlord(e.target.value ? Number(e.target.value) : null)}
                          className="form-input"
                        >
                          <option value="">All Landlords</option>
                          {landlords.map(landlord => (
                            <option key={landlord.id} value={landlord.id}>
                              {landlord.full_name} ({landlord.org_name})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    <div className="form-group">
                      <button className="btn btn-secondary" onClick={clearFilters} style={{ alignSelf: 'flex-end' }}>Clear</button>
                    </div>
                  </div>
                </div>
                
                {filteredAndSortedManagers.length > 0 ? (
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th className="table-left" onClick={() => handleSort('full_name')}>Name {sortBy === 'full_name' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                          <th className="table-left" onClick={() => handleSort('email')}>Email {sortBy === 'email' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                          {isAdmin() && <th className="table-left" onClick={() => handleSort('landlord')}>Works Under {sortBy === 'landlord' && (sortOrder === 'asc' ? '▲' : '▼')}</th>}
                          <th className="table-center" onClick={() => handleSort('access_level')}>Access Level {sortBy === 'access_level' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                          <th className="table-left" onClick={() => handleSort('properties')}>Assigned Properties {sortBy === 'properties' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                          <th className="table-center" onClick={() => handleSort('status')}>Status {sortBy === 'status' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                          <th className="table-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAndSortedManagers.map((manager) => (
                          <tr key={manager.id}>
                            <td className="table-left">
                              <strong>{manager.full_name}</strong>
                            </td>
                            <td className="table-left">{manager.email}</td>
                            {isAdmin() && (
                              <td className="table-left">
                                {manager.role === 'owner' || manager.role === 'admin' ? (
                                  <span className="text-secondary">Platform Role</span>
                                ) : (
                                  <div>
                                    {manager.landlord_name ? (
                                      <>
                                        <strong>{manager.landlord_name}</strong>
                                        {manager.landlord_org_name && (
                                          <div className="text-small text-secondary">
                                            {manager.landlord_org_name}
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <span className="text-warning">No Landlord Assigned</span>
                                    )}
                                  </div>
                                )}
                              </td>
                            )}
                            <td className="table-center">
                              {getAccessLevelBadge(manager)}
                            </td>
                            <td className="table-left" style={{ maxWidth: '200px' }}>
                              {getPropertyList(manager)}
                            </td>
                            <td className="table-center">
                              <span className={`status-badge ${manager.is_active ? 'status-success' : 'status-error'}`}>
                                {manager.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="table-center">
                              <div className="table-actions">
                                <button 
                                  className="action-button warning small"
                                  onClick={() => handleEditManager(manager)}
                                >
                                  Edit
                                </button>
                                {manager.role === 'manager' && (
                                  <button 
                                    className="action-button info small"
                                    onClick={() => handleEditAssignments(manager)}
                                    title="Edit Property Assignments"
                                  >
                                    Assignments
                                  </button>
                                )}
                                <button 
                                  className="action-button danger small" 
                                  onClick={() => handleDeleteManager(manager.id, manager.full_name)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">
                    <h3>No Managers Found</h3>
                    <p>
                      {isAdmin() 
                        ? "No managers are registered on the platform." 
                        : "No managers have been assigned to your organization. Create your first manager to get started with team management."}
                    </p>
                  </div>
                )}
              </div>
          
          {/* Add/Edit Manager Form Modal */}
          {showForm && (
            <div className="modal-overlay" onClick={() => setShowForm(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2 className="modal-title">{editingManager ? 'Edit Manager' : 'Add New Manager'}</h2>
                  <button 
                    className="modal-close" 
                    onClick={() => {
                      setShowForm(false);
                      setEditingManager(null);
                      resetForm();
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
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
                        setEditingManager(null);
                        resetForm();
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
      
      {/* Property Assignment Modal */}
      {selectedManagerForAssignment && assignmentModalOpen && (
        <PropertyAssignmentModal
          manager={selectedManagerForAssignment!}
          isOpen={assignmentModalOpen}
          onClose={handleAssignmentModalClose}
          onSave={handleAssignmentModalSave}
        />
      )}
      
      <style jsx>{`
        .dashboard-container {
          width: 100%;
          padding: 16px 20px 20px 20px;
          background: #f8fafc;
          min-height: calc(100vh - 72px);
          box-sizing: border-box;
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
        
        /* Section Styling */
        .managers-section {
          background: white;
          border-radius: 6px;
          padding: 18px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          height: fit-content;
        }

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

        /* Refresh Button */
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

        /* Add Manager Button */
        .add-manager-btn {
          background: #6366f1;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .add-manager-btn:hover {
          background: #4f46e5;
          transform: translateY(-1px);
        }

        /* Modal Styles */
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

        .modal-content {
          background: white;
          border-radius: 8px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px 16px 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-title {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          color: #64748b;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .modal-close:hover {
          background: #f1f5f9;
          color: #1e293b;
        }

        .manager-form {
          padding: 20px 24px 24px 24px;
        }

        /* Filters */
        .filters-container {
          margin-bottom: 24px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-input {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: all 0.2s ease;
          background: white;
        }

        .form-input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        /* Table Styling */
        .table-container {
          overflow-x: auto;
          border-radius: 8px;
          border: none;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .data-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          background: white;
        }

        .data-table th {
          position: sticky;
          top: 0;
          background: #f8fafc;
          z-index: 2;
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
          padding: 12px 10px;
          border-bottom: 2px solid #e2e8f0;
          cursor: pointer;
        }
        
        .data-table th:hover {
          background: #f1f5f9;
        }

        .data-table td {
          padding: 16px 10px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 14px;
          color: #374151;
        }
        
        .data-table tr:last-child td {
          border-bottom: none;
        }
        
        .table-left {
          text-align: left !important;
        }
        
        .table-center {
          text-align: center !important;
        }

        /* Status Badge */
        .status-badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .status-badge.status-success {
          background: #dcfce7;
          color: #166534;
        }
        
        .status-badge.status-warning {
          background: #fef3c7;
          color: #92400e;
        }

        .status-badge.status-error {
          background: #fee2e2;
          color: #dc2626;
        }
        
        .status-badge.status-info {
          background: #dbeafe;
          color: #1e40af;
        }

        /* General Button Styling */
        .btn {
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          text-decoration: none;
          border: none;
        }
        
        .btn-primary {
          background: #6366f1;
          color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
          background: #4f46e5;
        }

        .btn-secondary {
          background: #f8fafc;
          color: #1e293b;
          border: 1px solid #e2e8f0;
        }

        .btn-secondary:hover {
          background: #f1f5f9;
          transform: translateY(-1px);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }

        .table-actions {
          display: flex;
          gap: 8px;
          justify-content: center;
        }
        
        .action-button.small {
          padding: 6px 10px;
          font-size: 12px;
        }
        
        .action-button.warning {
          background: #fef3c7;
          color: #92400e;
        }
        
        .action-button.info {
          background: #dbeafe;
          color: #1e40af;
        }
        
        .action-button.danger {
          background: #fee2e2;
          color: #dc2626;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #6b7280;
          font-size: 14px;
        }

        .empty-state h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        .empty-state p {
          font-size: 14px;
          margin: 0 0 20px 0;
        }

        /* Loading Indicator & Alerts */
        .alert { padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; }
        .alert-error { background-color: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
        .loading-indicator { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; text-align: center; }
        .loading-spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Responsive Design */
        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          
          .section-actions {
            flex-direction: column;
            gap: 8px;
          }
          
          .add-manager-btn,
          .refresh-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
}

export default withAuth(ManagersPage, ['admin', 'owner']); 
 