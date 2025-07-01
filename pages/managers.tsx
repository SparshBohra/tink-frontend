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
          
          {/* Team Metrics */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-info">
                  <h3 className="metric-title">Total Managers</h3>
                  <div className="metric-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="metric-content">
                <div className="metric-value">{managers.length}</div>
                <div className="metric-subtitle">Active team members</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-info">
                  <h3 className="metric-title">Active Managers</h3>
                  <div className="metric-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="metric-content">
                <div className="metric-value">{managers.filter(m => m.is_active).length}</div>
                <div className="metric-subtitle">Currently active</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-info">
                  <h3 className="metric-title">Full Access</h3>
                  <div className="metric-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 15L8 11L16 11L12 15Z" fill="currentColor"/>
                      <path d="M17 8L12 3L7 8H17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="metric-content">
                <div className="metric-value">{managers.filter(m => m.access_level === 'full' || m.role === 'admin' || m.role === 'owner').length}</div>
                <div className="metric-subtitle">With full access</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-info">
                  <h3 className="metric-title">Properties Covered</h3>
                  <div className="metric-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="metric-content">
                <div className="metric-value">{properties.length}</div>
                <div className="metric-subtitle">Total properties</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="action-cards-grid">
            <div className="action-card" onClick={() => setShowForm(true)}>
              <div className="action-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="action-content">
                <h3 className="action-title">{isAdmin() ? 'Create Manager' : 'Add Manager'}</h3>
                <p className="action-description">Add a new team member</p>
              </div>
            </div>

            <div className="action-card" onClick={fetchManagers}>
              <div className="action-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 4V10H7M23 20V14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M22.99 14A9 9 0 0 1 18.36 18.36L23 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="action-content">
                <h3 className="action-title">Refresh Data</h3>
                <p className="action-description">Update team information</p>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="section-card">
            <h2 className="section-title">Filters & Sorting</h2>
            <div className="filters-container">
              <div className="filter-group">
                <label htmlFor="propertyFilter">Filter by Property:</label>
                <select 
                  id="propertyFilter"
                  value={filterByProperty || ''} 
                  onChange={(e) => setFilterByProperty(e.target.value ? Number(e.target.value) : null)}
                  className="filter-select"
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
                <div className="filter-group">
                  <label htmlFor="landlordFilter">Filter by Landlord:</label>
                  <select 
                    id="landlordFilter"
                    value={filterByLandlord || ''} 
                    onChange={(e) => setFilterByLandlord(e.target.value ? Number(e.target.value) : null)}
                    className="filter-select"
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

              <div className="filter-group">
                <label htmlFor="sortBy">Sort by:</label>
                <select 
                  id="sortBy"
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="filter-select"
                >
                  <option value="full_name">Name</option>
                  <option value="email">Email</option>
                  {isAdmin() && <option value="landlord">Landlord</option>}
                  <option value="access_level">Access Level</option>
                  <option value="properties">Property Count</option>
                  <option value="status">Status</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="sortOrder">Order:</label>
                <select 
                  id="sortOrder"
                  value={sortOrder} 
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="filter-select"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>

              <div className="filter-actions">
                <button 
                  className="action-button secondary" 
                  onClick={clearFilters}
                  disabled={!filterByProperty && !filterByLandlord}
                >
                  Clear Filters
                </button>
                <span className="filter-count">
                  Showing {filteredAndSortedManagers.length} of {managers.length} managers
                  {(filterByProperty || filterByLandlord) && ' (filtered)'}
                  {sortBy !== 'full_name' && ` (sorted by ${sortBy})`}
                </span>
                {(router.query.landlord || router.query.property || router.query.action) && (
                  <div className="url-filter-notice">
                    <span className="notice-icon">🔗</span>
                    <span className="notice-text">
                      {router.query.action === 'assign' && 'Ready to assign manager to landlord'}
                      {router.query.landlord && !router.query.action && (() => {
                        const landlordId = parseInt(router.query.landlord as string);
                        const landlord = landlords.find(l => l.id === landlordId);
                        return `Filtered by landlord: ${landlord ? `${landlord.full_name} (${landlord.org_name})` : `ID ${landlordId}`}`;
                      })()}
                      {router.query.property && (() => {
                        const propertyId = parseInt(router.query.property as string);
                        const property = properties.find(p => p.id === propertyId);
                        return `Filtered by property: ${property ? property.name : `ID ${propertyId}`}`;
                      })()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {showForm && (
            <div className="section-card">
              <h2 className="section-title">{editingManager ? 'Edit Manager' : 'Add New Manager'}</h2>
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
                  <button type="submit" className="action-button primary" disabled={formLoading}>
                    {formLoading ? 'Saving...' : (editingManager ? 'Update Manager' : 'Create Manager')}
                  </button>
                  <button 
                    type="button" 
                    className="action-button secondary" 
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
            </div>
          )}

          <div className="section-card">
            <h2 className="section-title">Manager List</h2>
            {filteredAndSortedManagers.length > 0 ? (
              <div className="table-container">
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        {isAdmin() && <th>Works Under</th>}
                        <th>Access Level</th>
                        <th>Assigned Properties</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedManagers.map((manager) => (
                        <tr key={manager.id}>
                          <td>
                            <strong>{manager.full_name}</strong>
                          </td>
                          <td>{manager.email}</td>
                          {isAdmin() && (
                            <td>
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
                          <td>
                            {getAccessLevelBadge(manager)}
                          </td>
                          <td style={{ maxWidth: '200px' }}>
                            {getPropertyList(manager)}
                          </td>
                          <td>
                            <span className={`status-badge ${manager.is_active ? 'status-success' : 'status-error'}`}>
                              {manager.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
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
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="empty-title">No Managers Found</h3>
                <p className="empty-description">
                  {isAdmin() 
                    ? "No managers are registered on the platform." 
                    : "No managers have been assigned to your organization. Create your first manager to get started with team management."}
                </p>
              </div>
            )}
          </div>
        </div>
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

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        @media (max-width: 1200px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: 1fr;
          }
        }

        .metric-card {
          background: white;
          border-radius: 6px;
          padding: 14px;
          border: 1px solid #e5e7eb;
          transition: all 0.2s ease;
        }

        .metric-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .metric-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .metric-title {
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          margin: 0;
        }

        .metric-icon {
          color: #9ca3af;
          opacity: 0.7;
        }

        .metric-content {
          text-align: left;
        }

        .metric-value {
          font-size: 28px;
          font-weight: 700;
          color: #111827;
          line-height: 1;
          margin-bottom: 4px;
        }

        .metric-subtitle {
          font-size: 12px;
          color: #9ca3af;
          margin: 0;
        }

        .action-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .action-card {
          background: white;
          border-radius: 6px;
          padding: 16px;
          border: 1px solid #e5e7eb;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .action-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border-color: #d1d5db;
        }

        .action-icon {
          width: 32px;
          height: 32px;
          background: #f3f4f6;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          flex-shrink: 0;
        }

        .action-content {
          flex: 1;
        }

        .action-title {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 2px 0;
        }

        .action-description {
          font-size: 12px;
          color: #6b7280;
          margin: 0;
        }

        .section-card {
          background: white;
          border-radius: 6px;
          padding: 20px;
          border: 1px solid #e5e7eb;
          margin-bottom: 24px;
        }

        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 16px 0;
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
        
        .table-actions { 
          display: flex; 
          gap: 8px;
          justify-content: center; 
        }

        .table-container {
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          overflow: hidden;
        }

        .table-scroll {
          overflow-x: auto;
          max-height: 600px;
          overflow-y: auto;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .data-table thead {
          background: #f9fafb;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .data-table th {
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
          white-space: nowrap;
        }

        .data-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #f3f4f6;
          vertical-align: middle;
        }

        .data-table tr:hover {
          background: #f9fafb;
        }

        .empty-state {
          text-align: center;
          padding: 48px 24px;
          color: #6b7280;
        }

        .empty-icon {
          margin: 0 auto 16px;
          opacity: 0.5;
        }

        .empty-title {
          font-size: 18px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 8px 0;
        }

        .empty-description {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }

        .text-small {
          font-size: 0.875rem;
        }

        .text-secondary {
          color: #6b7280;
        }

        .text-warning {
          color: #d97706;
          font-weight: 500;
          font-style: italic;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .status-success {
          background: #d1fae5;
          color: #065f46;
        }

        .status-error {
          background: #fee2e2;
          color: #991b1b;
        }

        .status-warning {
          background: #fef3c7;
          color: #92400e;
        }

        .status-info {
          background: #dbeafe;
          color: #1e40af;
        }

        .filters-container {
          display: flex;
          gap: 16px;
          align-items: end;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 200px;
        }

        .filter-group label {
          font-weight: 600;
          color: #374151;
          font-size: 0.9rem;
        }

        .filter-select {
          padding: 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 0.9rem;
          background: white;
        }

        .filter-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .filter-actions {
          display: flex;
          flex-direction: column;
          gap: 4px;
          align-items: flex-start;
        }

        .filter-count {
          font-size: 0.85rem;
          color: #6b7280;
          font-style: italic;
        }

        .action-button {
          padding: 10px 14px;
          border: none;
          border-radius: 4px;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .action-button.small {
          padding: 6px 10px;
          font-size: 12px;
        }

        .action-button.primary {
          background: #3b82f6;
          color: white;
        }

        .action-button.primary:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .action-button.secondary {
          background: #6b7280;
          color: white;
        }

        .action-button.secondary:hover:not(:disabled) {
          background: #4b5563;
          transform: translateY(-1px);
        }

        .action-button.warning {
          background: #f59e0b;
          color: white;
        }

        .action-button.warning:hover:not(:disabled) {
          background: #d97706;
          transform: translateY(-1px);
        }

        .action-button.info {
          background: #06b6d4;
          color: white;
        }

        .action-button.info:hover:not(:disabled) {
          background: #0891b2;
          transform: translateY(-1px);
        }

        .action-button.danger {
          background: #dc2626;
          color: white;
        }

        .action-button.danger:hover:not(:disabled) {
          background: #b91c1c;
          transform: translateY(-1px);
        }

        .action-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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

        :global(.dark-mode) .dashboard-container {
          color: #f3f4f6;
        }

        :global(.dark-mode) .metric-card {
          background: #1f2937;
          border-color: #374151;
        }

        :global(.dark-mode) .metric-title {
          color: #d1d5db;
        }

        :global(.dark-mode) .metric-value {
          color: #f9fafb;
        }

        :global(.dark-mode) .metric-subtitle {
          color: #9ca3af;
        }

        :global(.dark-mode) .action-card {
          background: #1f2937;
          border-color: #374151;
        }

        :global(.dark-mode) .action-icon {
          background: #374151;
          color: #d1d5db;
        }

        :global(.dark-mode) .action-title {
          color: #f9fafb;
        }

        :global(.dark-mode) .action-description {
          color: #d1d5db;
        }

        :global(.dark-mode) .section-card {
          background: #1f2937;
          border-color: #374151;
        }

        :global(.dark-mode) .section-title {
          color: #f9fafb;
        }

        :global(.dark-mode) .data-table {
          color: #f3f4f6;
        }

        :global(.dark-mode) .data-table thead {
          background: #374151;
        }

        :global(.dark-mode) .data-table th {
          color: #f9fafb;
          border-color: #4b5563;
        }

        :global(.dark-mode) .data-table td {
          border-color: #374151;
        }

        :global(.dark-mode) .data-table tr:hover {
          background: #374151;
        }

        :global(.dark-mode) .table-container {
          border-color: #374151;
        }

        :global(.dark-mode) .empty-title {
          color: #f9fafb;
        }

        :global(.dark-mode) .empty-description {
          color: #d1d5db;
        }

        .url-filter-notice {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background-color: #fef3c7;
          border-radius: 0.375rem;
          margin-top: 1rem;
        }

        .notice-icon {
          font-size: 1.2rem;
          color: #d97706;
        }

        .notice-text {
          font-size: 0.875rem;
          color: #6b7280;
        }
      `}</style>
    </>
  );
}

export default withAuth(ManagersPage, ['admin', 'owner']); 
 