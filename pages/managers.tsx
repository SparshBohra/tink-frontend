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
                    {isAdmin() ? 'Manage all property managers across the platform' : 'Manage your property management team members and their assignments'}
                  </p>
                </div>
              </div>
            </div>
          </div>

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
          
          {/* Main Content */}
          <div className="main-content">
          {/* Manager List Section */}
          <div className="managers-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Manager List ({filteredAndSortedManagers.length})</h2>
                <p className="section-subtitle">
                    Manage team members and their property assignments. {filteredAndSortedManagers.length} of {managers.length} total managers shown.
                </p>
              </div>
              <div className="section-actions">
                  <button onClick={fetchManagers} className="refresh-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 4 23 10 17 10"/>
                      <polyline points="1 20 1 14 7 14"/>
                      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                    </svg>
                    Refresh
                  </button>
                <button 
                  onClick={() => setShowForm(true)} 
                    className="view-all-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <line x1="19" y1="8" x2="19" y2="14"/>
                    <line x1="22" y1="11" x2="16" y2="11"/>
                  </svg>
                  Add Manager
                </button>
              </div>
            </div>
                
              {/* Filter Section */}
              <div className="filter-section">
                <div className="filter-dropdown-container">
                      <select 
                        value={filterByProperty || ''} 
                        onChange={(e) => setFilterByProperty(e.target.value ? Number(e.target.value) : null)}
                    className="filter-dropdown"
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
                  <div className="filter-dropdown-container">
                        <select 
                          value={filterByLandlord || ''} 
                          onChange={(e) => setFilterByLandlord(e.target.value ? Number(e.target.value) : null)}
                      className="filter-dropdown"
                        >
                          <option value="">All Landlords</option>
                          {landlords.map(landlord => (
                            <option key={landlord.id} value={landlord.id}>
                          {landlord.full_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                {(filterByLandlord || filterByProperty) && (
                  <button className="clear-filters-btn" onClick={clearFilters}>
                    Clear Filters
                  </button>
                )}
                    </div>
                
              {filteredAndSortedManagers.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <line x1="19" y1="8" x2="19" y2="14"/>
                      <line x1="22" y1="11" x2="16" y2="11"/>
                    </svg>
                  </div>
                  <h3>No managers found</h3>
                  <p>
                    {isAdmin() 
                      ? "No managers match your current filters. Try adjusting your search criteria." 
                      : "No managers have been assigned to your organization. Create your first manager to get started with team management."}
                  </p>
                </div>
              ) : (
                <div className="applications-scroll-container">
                  <div className="applications-table-container">
                    <table className="applications-table">
                      <thead>
                        <tr>
                          <th className="table-left" onClick={() => handleSort('full_name')}>
                            Manager
                            {sortBy === 'full_name' && <span className="sort-icon">{sortOrder === 'asc' ? ' ▲' : ' ▼'}</span>}
                          </th>
                          {isAdmin() && (
                            <th className="table-left" onClick={() => handleSort('landlord')}>
                              Works Under
                              {sortBy === 'landlord' && <span className="sort-icon">{sortOrder === 'asc' ? ' ▲' : ' ▼'}</span>}
                            </th>
                          )}
                          <th className="table-left" onClick={() => handleSort('properties')}>
                            Assigned Properties
                            {sortBy === 'properties' && <span className="sort-icon">{sortOrder === 'asc' ? ' ▲' : ' ▼'}</span>}
                          </th>
                          <th className="table-center" onClick={() => handleSort('access_level')}>
                            Access Level
                            {sortBy === 'access_level' && <span className="sort-icon">{sortOrder === 'asc' ? ' ▲' : ' ▼'}</span>}
                          </th>
                          <th className="table-center" onClick={() => handleSort('status')}>
                            Status
                            {sortBy === 'status' && <span className="sort-icon">{sortOrder === 'asc' ? ' ▲' : ' ▼'}</span>}
                          </th>
                          <th className="table-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAndSortedManagers.map((manager) => (
                          <tr key={manager.id}>
                            <td className="table-left">
                              <div className="applicant-name">{manager.full_name}</div>
                              <div className="applicant-email">{manager.email}</div>
                            </td>
                            {isAdmin() && (
                              <td className="table-left">
                                {manager.role === 'owner' || manager.role === 'admin' ? (
                                  <div className="property-name">Platform Role</div>
                                ) : (
                                  <div>
                                    {manager.landlord_name ? (
                                      <>
                                        <div className="property-name">{manager.landlord_name}</div>
                                        {manager.landlord_org_name && (
                                          <div className="property-vacancy">
                                            {manager.landlord_org_name}
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <div className="property-vacancy">No Landlord Assigned</div>
                                    )}
                                  </div>
                                )}
                              </td>
                            )}
                            <td className="table-left">
                              <div className="app-details">
                                {manager.assigned_properties && manager.assigned_properties.length > 0 ? (
                                  <>
                                    {manager.assigned_properties.slice(0, 2).map((property, index) => (
                                      <div key={property.id} className="property-name">
                                        {property.name}
                                      </div>
                                    ))}
                                    {manager.assigned_properties.length > 2 && (
                                      <div className="property-vacancy">
                                        +{manager.assigned_properties.length - 2} more properties
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="property-vacancy">No assignments</div>
                                )}
                              </div>
                            </td>
                            <td className="table-center">
                              {getAccessLevelBadge(manager)}
                            </td>
                            <td className="table-center">
                              <span style={{
                                background: manager.is_active ? '#dcfce7' : '#fee2e2',
                                color: manager.is_active ? '#16a34a' : '#dc2626',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 500,
                                textTransform: 'capitalize',
                                display: 'inline-block'
                              }}>
                                {manager.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="table-center">
                              <div className="action-buttons">
                                <button 
                                  className="manage-btn view-btn"
                                  onClick={() => handleEditManager(manager)}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 20h9"/>
                                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                                  </svg>
                                  Edit
                                </button>
                                {manager.role === 'manager' && (
                                  <button 
                                    className="manage-btn approve-btn"
                                    onClick={() => handleEditAssignments(manager)}
                                    title="Edit Property Assignments"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                      <polyline points="9 22 9 12 15 12 15 22"/>
                                    </svg>
                                    Assign
                                  </button>
                                )}
                                <button 
                                  className="manage-btn reject-btn" 
                                  onClick={() => handleDeleteManager(manager.id, manager.full_name)}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2v2"/>
                                    <line x1="10" y1="11" x2="10" y2="17"/>
                                    <line x1="14" y1="11" x2="14" y2="17"/>
                                  </svg>
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  </div>
                )}
            </div>
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

        /* Error Banner */
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

        /* Main Content */
        .main-content {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        
        /* Section Styling */
        .managers-section {
          background: white;
          border-radius: 6px;
          padding: 18px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          margin-bottom: 20px;
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

        /* Filter Section */
        .filter-section {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f1f5f9;
        }

        /* Filter Dropdown */
        .filter-dropdown-container {
          position: relative;
        }

        .filter-dropdown {
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
          padding: 10px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 140px;
        }

        .filter-dropdown:hover {
          background: #e2e8f0;
        }

        .clear-filters-btn {
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
          padding: 10px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .clear-filters-btn:hover {
          background: #e2e8f0;
          transform: translateY(-1px);
        }

        /* Button Styles */
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

        /* Primary action button from applications page */
        .view-all-btn {
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
          text-decoration: none;
        }

        .view-all-btn:hover {
          background: #3730a3;
          transform: translateY(-1px);
        }

        /* Table Styling - Applications Page Standard */
        .applications-scroll-container {
          overflow-y: auto;
          max-height: 500px;
        }

        .applications-scroll-container::-webkit-scrollbar {
          width: 6px;
        }

        .applications-scroll-container::-webkit-scrollbar-track {
          background: rgba(226, 232, 240, 0.3);
          border-radius: 3px;
        }

        .applications-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }

        .applications-table-container {
          width: 100%;
          overflow-x: auto;
          border-radius: 8px;
          background: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .applications-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        /* Add hover effect for table rows */
        .applications-table tbody tr {
          transition: background-color 0.2s ease;
        }

        .applications-table tbody tr:hover {
          background-color: #f9fafb;
        }

        /* Table headers - Applications Page Standard */
        .applications-table th {
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
          cursor: pointer;
        }

        .applications-table th:hover {
          color: #6b7280;
        }

        .sort-icon {
          font-size: 10px;
          color: #4f46e5;
        }

        /* Table cells - Applications Page Standard */
        .applications-table td {
          padding: 12px 16px;
          vertical-align: middle;
          height: 48px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
          color: #374151;
        }

        /* Center align specific columns */
        .applications-table th.table-center,
        .applications-table td.table-center {
          text-align: center !important;
        }

        .applications-table th.table-left,
        .applications-table td.table-left {
          text-align: left !important;
        }

        .applicant-name {
          color: #1e293b;
          margin-bottom: 4px;
        }

        .applicant-email {
          font-size: 12px;
          color: #64748b;
        }

        .property-name {
          color: #1e293b;
          margin-bottom: 4px;
        }

        .property-vacancy {
          font-size: 12px;
          color: #64748b;
        }

        .app-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
        }

        .app-details > div {
          color: #64748b;
        }

        .detail-label {
          font-weight: 600;
          color: #374151;
          margin-right: 4px;
        }

        .action-buttons {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          justify-content: center;
        }

        /* Applications Page Button Standard */
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
          gap: 4px;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .manage-btn:hover {
          background: #3730a3;
          transform: translateY(-1px);
        }

        .manage-btn.approve-btn {
          background: #10b981;
        }

        .manage-btn.approve-btn:hover {
          background: #059669;
        }

        .manage-btn.reject-btn {
          background: #ef4444;
        }

        .manage-btn.reject-btn:hover {
          background: #dc2626;
        }

        .manage-btn.view-btn {
          background: #4f46e5;
        }

        .manage-btn.view-btn:hover {
          background: #3730a3;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #64748b;
        }

        .empty-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 16px;
          color: #cbd5e1;
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
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .modal-close:hover {
          background: #f1f5f9;
          color: #1e293b;
        }

        .manager-form {
          padding: 24px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 6px;
        }

        .form-group input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .form-group input:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }

        .btn {
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .btn-primary {
          background: #4f46e5;
          color: white;
        }
        
        .btn-primary:hover {
          background: #3730a3;
        }

        .btn-primary:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }

        .btn-secondary:hover {
          background: #e2e8f0;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
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
          
          .managers-section {
            padding: 16px;
          }

          .applications-table-container {
            overflow-x: scroll;
          }

          .applications-table th,
          .applications-table td {
            padding: 12px 8px;
            font-size: 12px;
          }

          .section-actions {
            flex-direction: column;
            gap: 8px;
          }

          .section-header {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }

          .filter-section {
            flex-direction: column;
            gap: 8px;
            align-items: stretch;
          }

          .filter-dropdown {
            min-width: auto;
            width: 100%;
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
        }

        /* Dark Mode Styles */
        :global(.dark-mode) .dashboard-container { background: transparent; }
        :global(.dark-mode) .managers-section {
          background: #111111 !important;
          border: 1px solid #333333 !important;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4) !important;
        }
        :global(.dark-mode) .applications-table th {
          background-color: #1a1a1a !important;
          border-bottom: 1px solid #333333 !important;
        }
        :global(.dark-mode) .applications-table td {
          background-color: #111111 !important;
          border-bottom: 1px solid #333333 !important;
        }
        :global(.dark-mode) .applications-table tbody tr:hover {
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
        :global(.dark-mode) .view-all-btn {
          background: #3b82f6 !important;
          border: none !important;
        }
        :global(.dark-mode) .view-all-btn:hover {
          background: #2563eb !important;
        }
        :global(.dark-mode) .filter-dropdown {
          background: #1a1a1a !important;
          border: 1px solid #333333 !important;
          color: #e2e8f0 !important;
        }
        :global(.dark-mode) .filter-dropdown:hover {
          background: #2a2a2a !important;
          border-color: #ffffff !important;
        }
        :global(.dark-mode) .manage-btn {
          color: #ffffff !important;
        }
        :global(.dark-mode) .error-banner {
          background: rgba(239, 68, 68, 0.1) !important;
          border-color: rgba(239, 68, 68, 0.3) !important;
          color: #ef4444 !important;
        }
        :global(.dark-mode) .modal-content {
          background: #1a1a1a !important;
          border: 1px solid #333333 !important;
        }
        :global(.dark-mode) .modal-header {
          border-bottom: 1px solid #333333 !important;
        }
        :global(.dark-mode) .form-group input {
          background: #111111 !important;
          border: 1px solid #333333 !important;
          color: #e2e8f0 !important;
        }
        :global(.dark-mode) .form-group input:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
        }
        :global(.dark-mode) .form-actions {
          border-top: 1px solid #333333 !important;
        }
        :global(.dark-mode) .btn-secondary {
          background: #1a1a1a !important;
          border: 1px solid #333333 !important;
          color: #e2e8f0 !important;
        }
        :global(.dark-mode) .btn-secondary:hover {
          background: #2a2a2a !important;
          border-color: #ffffff !important;
        }
        :global(.dark-mode) .filter-dropdown:hover {
          background: #2a2a2a !important;
          border-color: #ffffff !important;
        }
        :global(.dark-mode) .clear-filters-btn {
          background: #1a1a1a !important;
          border: 1px solid #333333 !important;
          color: #e2e8f0 !important;
        }
        :global(.dark-mode) .clear-filters-btn:hover {
          background: #2a2a2a !important;
          border-color: #ffffff !important;
        }
        :global(.dark-mode) .filter-section {
          border-bottom: 1px solid #333333 !important;
        }
      `}</style>
    </>
  );
}

export default withAuth(ManagersPage, ['admin', 'owner']); 
 