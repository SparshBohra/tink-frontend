import { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '../components/DashboardLayout';
import PropertyDeletionModal from '../components/PropertyDeletionModal';
import { useRouter } from 'next/router';
import { withAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';
import { Property } from '../lib/types';

function Properties() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showListingModal, setShowListingModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [listingLoading, setListingLoading] = useState(false);
  const [listingSuccess, setListingSuccess] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<{ id: number; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [showTenantAssignModal, setShowTenantAssignModal] = useState(false);
  const [selectedPropertyForAssign, setSelectedPropertyForAssign] = useState<Property | null>(null);
  const [sortOption, setSortOption] = useState<'name' | 'latest'>('latest');

  const applySort = (list: Property[], option: 'name' | 'latest') => {
    const cloned = [...list];
    if (option === 'latest') {
      return cloned.sort((a, b) => {
        const ad = new Date((a.created_at || a.updated_at) ?? '').getTime() || 0;
        const bd = new Date((b.created_at || b.updated_at) ?? '').getTime() || 0;
        return bd - ad;
      });
    }
    return cloned.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Re-sort when sort option changes, but only if there are properties
    if (properties.length > 0) {
      setProperties(prev => applySort(prev, sortOption));
    }
  }, [sortOption]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const propertiesResponse = await apiClient.getProperties();
      const sorted = applySort(propertiesResponse.results || [], sortOption);
      setProperties(sorted);
    } catch (error: any) {
      console.error('Failed to fetch properties data:', error);
      setError(error?.message || 'Failed to load properties data');
    } finally {
      setLoading(false);
    }
  };

  const getPropertyStats = (property: Property) => {
    const totalRooms = property.total_rooms || 0;
    const vacantRooms = property.vacant_rooms || 0;
    const occupiedRooms = totalRooms - vacantRooms;
    const occupancyRate = totalRooms > 0 ? 
      Math.round((occupiedRooms / totalRooms) * 100) : 0;
    
    return {
      totalRooms,
      occupiedRooms,
      vacantRooms,
      occupancyRate
    };
  };

  const downloadPropertiesReport = () => {
    const csvData = [
      ['Property Name', 'Address', 'Total Rooms', 'Occupied', 'Vacant', 'Occupancy Rate'],
      ...properties.map(property => {
        const stats = getPropertyStats(property);
        return [
          property.name,
          property.full_address,
          stats.totalRooms.toString(),
          stats.occupiedRooms.toString(),
          stats.vacantRooms.toString(),
          `${stats.occupancyRate}%`
        ];
      })
    ];
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tink-properties-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Calculate portfolio summary
  const totalRooms = properties.reduce((sum, property) => sum + (property.total_rooms || 0), 0);
  const totalVacantRooms = properties.reduce((sum, property) => sum + (property.vacant_rooms || 0), 0);
  const occupiedRooms = totalRooms - totalVacantRooms;
  const overallOccupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const handleCreateListing = () => {
    setShowListingModal(true);
  };

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const submitListing = async () => {
    if (!selectedProperty || selectedPlatforms.length === 0) {
      setError('Please select a property and at least one platform.');
      return;
    }

    setListingLoading(true);
    setError(null);

    try {
      // Simulate API call to create listings
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setListingSuccess(`Successfully created listings for "${selectedProperty.name}" on ${selectedPlatforms.join(', ')}`);
      
      // Reset form
      setSelectedProperty(null);
      setSelectedPlatforms([]);
      
      // Close modal after showing success
      setTimeout(() => {
        setShowListingModal(false);
        setListingSuccess(null);
      }, 3000);
      
    } catch (err: any) {
      setError('Failed to create listings. Please try again.');
    } finally {
      setListingLoading(false);
    }
  };

  const listingPlatforms = [
    { 
      id: 'zillow', 
      name: 'Zillow', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 12h3v8h6v-6h2v6h6v-8h3L12 2z" fill="#006AFF"/>
        </svg>
      )
    },
    { 
      id: 'apartments', 
      name: 'Apartments.com', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="16" rx="2" fill="#FF6B35"/>
          <rect x="6" y="7" width="3" height="3" fill="white"/>
          <rect x="10.5" y="7" width="3" height="3" fill="white"/>
          <rect x="15" y="7" width="3" height="3" fill="white"/>
          <rect x="6" y="11" width="3" height="3" fill="white"/>
          <rect x="10.5" y="11" width="3" height="3" fill="white"/>
          <rect x="15" y="11" width="3" height="3" fill="white"/>
          <rect x="8" y="15" width="8" height="3" fill="white"/>
        </svg>
      )
    },
    { 
      id: 'craigslist', 
      name: 'Craigslist', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="20" height="20" rx="2" fill="#00AB44"/>
          <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">CL</text>
        </svg>
      )
    },
    { 
      id: 'facebook', 
      name: 'Facebook Marketplace', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#1877F2"/>
          <path d="M15.5 8.5H13.5C13.2 8.5 13 8.7 13 9V11H15.5C15.6 11 15.7 11.1 15.7 11.2L15.4 13.2C15.4 13.3 15.3 13.4 15.2 13.4H13V19.5C13 19.8 12.8 20 12.5 20H10.5C10.2 20 10 19.8 10 19.5V13.4H8.5C8.2 13.4 8 13.2 8 12.9V10.9C8 10.6 8.2 10.4 8.5 10.4H10V8.5C10 6.6 11.6 5 13.5 5H15.5C15.8 5 16 5.2 16 5.5V7.5C16 7.8 15.8 8 15.5 8V8.5Z" fill="white"/>
        </svg>
      )
    },
    { 
      id: 'trulia', 
      name: 'Trulia', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#53B50A"/>
          <path d="M12 6L8 10v8h2v-6h4v6h2v-8l-4-4z" fill="white"/>
        </svg>
      )
    },
    { 
      id: 'rentals', 
      name: 'Rentals.com', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="20" height="20" rx="2" fill="#E31E24"/>
          <path d="M7 8h10v2H7V8zm0 3h10v2H7v-2zm0 3h7v2H7v-2z" fill="white"/>
          <circle cx="17" cy="15" r="1" fill="white"/>
        </svg>
      )
    }
  ];

  const handleDeleteProperty = (propertyId: number, propertyName: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      setSelectedProperty(property);
    setShowDeleteModal(true);
    }
  };

  const handleDeleteComplete = async () => {
    try {
      // Refresh the property data
      await fetchData();
      setSelectedProperty(null);
      setError(null);
    } catch (err: any) {
      console.error('Failed to refresh data after deletion:', err);
      setError(err.message || 'Failed to refresh data');
    }
  };

  const cancelDeleteProperty = () => {
    setShowDeleteModal(false);
    setSelectedProperty(null);
    setDeleteLoading(false);
  };

  const handleManageClick = (e: React.MouseEvent, propertyId: number) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === propertyId ? null : propertyId);
  };

  const handleAssignTenant = (property: Property) => {
    setSelectedPropertyForAssign(property);
    setShowTenantAssignModal(true);
    setActiveDropdown(null);
  };

  const handleManageProperty = (propertyId: number) => {
    router.push(`/properties/${propertyId}/rooms`);
    setActiveDropdown(null);
  };

  const handleCloseTenantAssignModal = () => {
    setShowTenantAssignModal(false);
    setSelectedPropertyForAssign(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null);
    };
    
    if (activeDropdown !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeDropdown]);

  if (loading) {
    return (
      <DashboardLayout
        title="Property Management"
        subtitle="Loading property data..."
      >
        <div className="loading-indicator">
          <div className="loading-spinner"></div>
          <p>Fetching property data...</p>
        </div>
        
        <style jsx>{`
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
        `}</style>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="">
      <Head>
        <title>Property Management - Tink Property Management</title>
      </Head>
      
      <div className="dashboard-container">
        {/* Custom Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="dashboard-title">Property Management</h1>
              <div className="subtitle-container">
                <p className="welcome-message">
                  Manage all properties, rooms, and occupancy across your portfolio
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
        
        {/* Top Metrics Row */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-info">
                <h3 className="metric-title">Total Properties</h3>
                <div className="metric-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 21h18"/>
                    <path d="M5 21V7l8-4v18"/>
                    <path d="M19 21V11l-6-4"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="metric-content">
              <div className="metric-value">{properties.length}</div>
              <div className="metric-subtitle">Active portfolio</div>
              <div className="metric-progress">
                <span className="metric-label">Properties managed</span>
                <span className="metric-change positive">+{properties.length > 0 ? '1' : '0'}</span>
              </div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-info">
                <h3 className="metric-title">Total Rooms</h3>
                <div className="metric-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 21h18"/>
                    <path d="M5 21V7l8-4v18"/>
                    <path d="M19 21V11l-6-4"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="metric-content">
              <div className="metric-value">{totalRooms}</div>
              <div className="metric-subtitle">{occupiedRooms} occupied</div>
              <div className="metric-progress">
                <span className="metric-label">{overallOccupancyRate}% occupied</span>
                <span className="metric-change positive">+{totalRooms > 0 ? '2' : '0'}</span>
              </div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-info">
                <h3 className="metric-title">Vacant Rooms</h3>
                <div className="metric-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="metric-content">
              <div className="metric-value">{totalVacantRooms}</div>
              <div className="metric-subtitle">Available for rent</div>
              <div className="metric-progress">
                <span className="metric-label">Ready to lease</span>
                <span className="metric-change positive">-1</span>
              </div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-info">
                <h3 className="metric-title">Occupancy Rate</h3>
                <div className="metric-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10"/>
                    <line x1="12" y1="20" x2="12" y2="4"/>
                    <line x1="6" y1="20" x2="6" y2="14"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="metric-content">
              <div className="metric-value">{overallOccupancyRate}%</div>
              <div className="metric-subtitle">Portfolio performance</div>
              <div className="metric-progress">
                <span className="metric-label">
                  {overallOccupancyRate >= 90 ? 'Excellent' : overallOccupancyRate >= 75 ? 'Good' : 'Needs attention'}
                </span>
                <span className="metric-change positive">+3%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* Properties Section */}
          <div className="properties-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Properties ({properties.length})</h2>
                <p className="section-subtitle">Manage property details, rooms, and occupancy status</p>
              </div>
              <div className="section-actions">
                <select
                  value={sortOption}
                  onChange={e => setSortOption(e.target.value as 'name' | 'latest')}
                  className="sort-select"
                  title="Sort properties"
                >
                  <option value="latest">Latest Added</option>
                  <option value="name">Name A–Z</option>
                </select>
                <button onClick={() => fetchData()} className="refresh-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10"/>
                    <polyline points="1 20 1 14 7 14"/>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                  </svg>
                  Refresh
                </button>
                <button onClick={() => router.push('/properties/add')} className="create-property-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add Property
                </button>
              </div>
            </div>

            {properties.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 21h18"/>
                    <path d="M5 21V7l8-4v18"/>
                    <path d="M19 21V11l-6-4"/>
                  </svg>
                </div>
                <h3>No properties found</h3>
                <p>Start by adding your first property to manage tenants and rooms.</p>
                <button onClick={() => router.push('/properties/add')} className="empty-action-btn">
                  Add Your First Property
                </button>
              </div>
            ) : (
              <div className="properties-scroll-container">
                <div className="properties-table-container">
                  <table className="properties-table">
                    <thead>
                      <tr>
                        <th className="table-left">Property</th>
                        <th className="table-left">Address</th>
                        <th className="table-center">Rooms</th>
                        <th className="table-center">Occupancy</th>
                        <th className="table-center">Effective Rent</th>
                        <th className="table-center">Security Deposit</th>
                        <th className="table-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {properties.map((property) => {
                        const stats = getPropertyStats(property);
                        return (
                          <tr key={property.id}>
                            <td className="table-left">
                              <div 
                                className="property-name clickable-property-name"
                                onClick={() => router.push(`/properties/${property.id}/rooms`)}
                                style={{ cursor: 'pointer' }}
                              >
                                {property.name}
                              </div>
                              <div className="property-type">{property.property_type}</div>
                            </td>
                            <td className="table-left">{property.full_address}</td>
                            <td className="table-center">
                              <div className="rooms-cell">
                                <div className="rooms-total">{stats.totalRooms} total</div>
                                <div className="rooms-vacant">{stats.vacantRooms} vacant</div>
                              </div>
                            </td>
                            <td className="table-center">
                              <span className={`status-badge ${
                                stats.occupancyRate < 50 ? 'low' : 
                                stats.occupancyRate < 80 ? 'good' : 'excellent'
                              }`}>
                                {stats.occupancyRate < 50 ? 'Low' : 
                                 stats.occupancyRate < 80 ? 'Good' : 'Excellent'} ({stats.occupancyRate}%)
                              </span>
                            </td>
                            <td className="table-center">
                              {property.effective_rent !== undefined && property.effective_rent !== null ? `$${property.effective_rent}` : '-'}
                            </td>
                            <td className="table-center">
                              {property.effective_security_deposit !== undefined && property.effective_security_deposit !== null ? `$${property.effective_security_deposit}` : '-'}
                            </td>
                            <td className="table-center">
                              <div className="action-buttons">
                                <div className="manage-dropdown-container">
                                  <button 
                                    onClick={(e) => handleManageClick(e, property.id)} 
                                    className="manage-btn"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M12 20h9"/>
                                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                                    </svg>
                                    Manage
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '4px' }}>
                                      <polyline points="6,9 12,15 18,9"/>
                                    </svg>
                                  </button>
                                  
                                  {activeDropdown === property.id && (
                                    <div className="manage-dropdown">
                                      <button 
                                        onClick={() => handleAssignTenant(property)}
                                        className="dropdown-item"
                                      >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                          <circle cx="12" cy="7" r="4"/>
                                        </svg>
                                        Assign Tenant
                                      </button>
                                      <button 
                                        onClick={() => handleManageProperty(property.id)}
                                        className="dropdown-item"
                                      >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <path d="M3 21h18"/>
                                          <path d="M5 21V7l8-4v18"/>
                                          <path d="M19 21V11l-6-4"/>
                                        </svg>
                                        Manage Property
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <button 
                                  onClick={() => handleDeleteProperty(property.id, property.name)} 
                                  className="icon-btn delete-icon-btn"
                                  title="Delete property"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3,6 5,6 21,6"/>
                                    <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                                    <line x1="10" y1="11" x2="10" y2="17"/>
                                    <line x1="14" y1="11" x2="14" y2="17"/>
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions Section */}
          <div className="quick-actions-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Quick Actions</h2>
                <p className="section-subtitle">Frequently used actions</p>
              </div>
            </div>
            
            <div className="actions-grid">
              <div className="action-card blue" onClick={() => router.push('/properties/add')}>
                <div className="action-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </div>
                <div className="action-content">
                  <h3 className="action-title">Add Property</h3>
                  <p className="action-subtitle">Register New Property</p>
                </div>
              </div>

              <div className="action-card blue" onClick={() => router.push('/applications')}>
                <div className="action-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <div className="action-content">
                  <h3 className="action-title">Review Applications</h3>
                  <p className="action-subtitle">Process Tenant Applications</p>
                </div>
              </div>

              <div className="action-card green" onClick={() => router.push('/tenants')}>
                <div className="action-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div className="action-content">
                  <h3 className="action-title">Manage Tenants</h3>
                  <p className="action-subtitle">View and Manage Tenants</p>
                </div>
              </div>

              <div className="action-card purple" onClick={downloadPropertiesReport}>
                <div className="action-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10"/>
                    <line x1="12" y1="20" x2="12" y2="4"/>
                    <line x1="6" y1="20" x2="6" y2="14"/>
                  </svg>
                </div>
                <div className="action-content">
                  <h3 className="action-title">Generate Reports</h3>
                  <p className="action-subtitle">Create Financial Reports</p>
                </div>
              </div>

              <div className="action-card orange" onClick={handleCreateListing}>
                <div className="action-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7"/>
                    <path d="M16 2v4"/>
                    <path d="M8 2v4"/>
                    <path d="M3 10h18"/>
                    <path d="M15 19l2 2 4-4"/>
                  </svg>
                </div>
                <div className="action-content">
                  <h3 className="action-title">Create Listing</h3>
                  <p className="action-subtitle">Post to Zillow, Apartments.com, etc.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showListingModal && (
        <div className="listing-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create Property Listing</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowListingModal(false);
                  setSelectedProperty(null);
                  setSelectedPlatforms([]);
                  setError(null);
                  setListingSuccess(null);
                }}
              >
                ×
              </button>
            </div>

            {error && (
              <div className="modal-error">
                {error}
              </div>
            )}

            {listingSuccess && (
              <div className="modal-success">
                {listingSuccess}
              </div>
            )}

            <div className="modal-section">
              <h3>Select Property</h3>
              <select 
                value={selectedProperty?.id || ''} 
                onChange={(e) => {
                  const property = properties.find(p => p.id === parseInt(e.target.value));
                  setSelectedProperty(property || null);
                }}
                className="property-select"
              >
                <option value="">Choose a property...</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.name} - {property.full_address}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-section">
              <h3>Select Platforms</h3>
              <div className="platform-grid">
                {listingPlatforms.map((platform) => (
                  <label key={platform.id} className="platform-card">
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(platform.id)}
                      onChange={() => handlePlatformToggle(platform.id)}
                    />
                    <div className="platform-info">
                      <span className="platform-icon">{platform.icon}</span>
                      <span className="platform-name">{platform.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => {
                  setShowListingModal(false);
                  setSelectedProperty(null);
                  setSelectedPlatforms([]);
                  setError(null);
                  setListingSuccess(null);
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button 
                onClick={submitListing} 
                className="submit-btn"
                disabled={listingLoading || !selectedProperty || selectedPlatforms.length === 0}
              >
                {listingLoading ? 'Creating Listings...' : 'Create Listings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Property Deletion Modal */}
      {showDeleteModal && selectedProperty && (
        <PropertyDeletionModal
          property={selectedProperty}
          isOpen={showDeleteModal}
          onClose={cancelDeleteProperty}
          onDelete={handleDeleteComplete}
        />
      )}

      {/* Tenant Assignment Modal */}
      {showTenantAssignModal && selectedPropertyForAssign && (
        <div className="tenant-assign-modal">
          <div className="modal-content tenant-assign-modal-content">
            <div className="modal-header">
              <h2>Assign Tenant to {selectedPropertyForAssign.name}</h2>
              <button 
                className="modal-close"
                onClick={handleCloseTenantAssignModal}
              >
                ×
              </button>
            </div>

            <div className="modal-section">
              <p>This feature will be implemented to assign tenants to specific rooms in the property.</p>
              <p><strong>Property:</strong> {selectedPropertyForAssign.name}</p>
              <p><strong>Address:</strong> {selectedPropertyForAssign.full_address}</p>
              <p><strong>Total Rooms:</strong> {selectedPropertyForAssign.total_rooms}</p>
              <p><strong>Vacant Rooms:</strong> {selectedPropertyForAssign.vacant_rooms}</p>
            </div>

            <div className="modal-actions">
              <button 
                onClick={handleCloseTenantAssignModal}
                className="cancel-btn"
              >
                Close
              </button>
              <button 
                onClick={() => router.push(`/properties/${selectedPropertyForAssign.id}/rooms`)}
                className="assign-btn"
              >
                Go to Rooms
              </button>
            </div>
          </div>
        </div>
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

        /* Metrics Grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }

        .metric-card {
          background: white;
          border-radius: 6px;
          padding: 14px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          margin: 0;
        }

        .metric-icon {
          width: 20px;
          height: 20px;
          color: #64748b;
        }

        .metric-content {
          margin-top: 8px;
        }

        .metric-value {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 3px;
          line-height: 1;
        }

        .metric-subtitle {
          font-size: 11px;
          color: #64748b;
          margin-bottom: 10px;
        }

        .metric-progress {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .metric-label {
          font-size: 12px;
          color: #64748b;
        }

        .metric-change {
          font-size: 12px;
          font-weight: 600;
        }

        .metric-change.positive {
          color: #10b981;
        }

        /* Main Content */
        .main-content {
          display: grid;
          grid-template-columns: 2.5fr 0.8fr;
          gap: 20px;
        }

        /* Section Headers */
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

        /* Properties Section */
        .properties-section {
          background: white;
          border-radius: 6px;
          padding: 18px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          height: fit-content;
        }

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

        .create-property-btn {
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
          gap: 8px;
          transition: all 0.2s ease;
        }

        .create-property-btn:hover {
          background: #3730a3;
          transform: translateY(-1px);
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

        .empty-action-btn {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: inline-block;
          transition: all 0.2s ease;
        }

        .empty-action-btn:hover {
          background: #3730a3;
          transform: translateY(-1px);
        }

        /* Properties Table */
        .properties-scroll-container {
          overflow-y: auto;
          max-height: 500px;
        }

        .properties-scroll-container::-webkit-scrollbar {
          width: 6px;
        }

        .properties-scroll-container::-webkit-scrollbar-track {
          background: rgba(226, 232, 240, 0.3);
          border-radius: 3px;
        }

        .properties-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }

        .properties-table-container {
          width: 100%;
          overflow-x: auto;
          border-radius: 8px;
          background: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .properties-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        
        .properties-table tbody tr {
          transition: background-color 0.2s ease;
        }

        .properties-table tbody tr:hover {
          background-color: #f9fafb;
        }

        .properties-table th {
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
        }

        .properties-table td {
          padding: 12px 16px;
          vertical-align: middle;
          height: 48px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
          color: #374151;
        }

        .property-name {
          color: #1e293b;
          margin-bottom: 4px;
        }

        .clickable-property-name {
          color: #4f46e5;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .clickable-property-name:hover {
          color: #3730a3;
          text-decoration: underline;
        }

        .property-type {
          font-size: 12px;
          color: #64748b;
          text-transform: capitalize;
        }

        .rooms-cell {
          text-align: center;
        }

        .rooms-total {
          font-weight: 500;
          color: #1e293b;
          margin-bottom: 2px;
        }

        .rooms-vacant {
          font-size: 12px;
          color: #64748b;
        }

        .status-badge {
          padding: 6px 8px;
          border-radius: 5px;
          font-size: 12px;
          font-weight: 500;
          text-align: center;
          display: inline-block;
        }

        .status-badge.low {
          background: #fee2e2;
          color: #dc2626;
          min-width: 85px;
        }

        .status-badge.good {
          background: #fef3c7;
          color: #d97706;
          min-width: 85px;
        }

        .status-badge.excellent {
          background: #dcfce7;
          color: #16a34a;
          min-width: 120px;
        }

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
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;
          text-decoration: none;
          margin: 0 auto;
        }

        .manage-btn:hover {
          background: #3730a3;
          transform: translateY(-1px);
        }

        .manage-btn svg {
          stroke: white;
        }

        /* Quick Actions Section */
        .quick-actions-section {
          background: white;
          border-radius: 6px;
          padding: 18px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          height: fit-content;
        }

        .actions-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .action-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 5px;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          width: 100%;
          box-sizing: border-box;
        }

        .action-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .action-card.blue {
          background: #eff6ff;
          border-color: #dbeafe;
        }

        .action-card.green {
          background: #f0fdf4;
          border-color: #dcfce7;
        }

        .action-card.purple {
          background: #faf5ff;
          border-color: #e9d5ff;
        }

        .action-card.orange {
          background: #fef3c7;
          border-color: #fed7aa;
        }

        .action-card.orange .action-icon {
          background: #fed7aa;
          color: #ea580c;
        }

        .action-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .action-card.blue .action-icon {
          background: #3b82f6;
          color: white;
        }

        .action-card.green .action-icon {
          background: #10b981;
          color: white;
        }

        .action-card.purple .action-icon {
          background: #8b5cf6;
          color: white;
        }

        .action-content {
          flex: 1;
        }

        .action-title {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 3px 0;
        }

        .action-subtitle {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        /* Utility classes for alignment */
        .table-left { text-align: left !important; }
        .table-right { text-align: right !important; }
        .table-center { text-align: center !important; }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .main-content {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }

        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }

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
          
          .metric-card {
            padding: 16px;
          }
          
          .metric-value {
            font-size: 24px;
          }
          
          .properties-section,
          .quick-actions-section {
            padding: 16px;
          }

          .properties-table-container {
            overflow-x: scroll;
          }

          .properties-table th,
          .properties-table td {
            padding: 12px 8px;
            font-size: 12px;
          }

          .section-actions {
            flex-direction: column;
            gap: 8px;
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

          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .section-header {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }
        }

        /* Dark Mode Styles */
        :global(.dark-mode) .dashboard-container { background: transparent; }
        :global(.dark-mode) .metric-card, 
        :global(.dark-mode) .properties-section, 
        :global(.dark-mode) .quick-actions-section,
        :global(.dark-mode) .action-card {
          background: #111111 !important;
          border: 1px solid #333333 !important;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4) !important;
        }
        :global(.dark-mode) .metric-card:hover,
        :global(.dark-mode) .action-card:hover {
          background: #222222 !important;
          border-color: #ffffff !important;
        }
        :global(.dark-mode) .properties-table th {
          background-color: #1a1a1a !important;
          border-bottom: 1px solid #333333 !important;
        }
        :global(.dark-mode) .properties-table td {
          background-color: #111111 !important;
          border-bottom: 1px solid #333333 !important;
        }
        :global(.dark-mode) .properties-table tbody tr:hover {
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
        :global(.dark-mode) .create-property-btn,
        :global(.dark-mode) .empty-action-btn {
            background: #3b82f6 !important;
            border: none !important;
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2) !important;
        }
        :global(.dark-mode) .create-property-btn:hover,
        :global(.dark-mode) .empty-action-btn:hover {
            background: #2563eb !important;
            box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3) !important;
        }
        :global(.dark-mode) .status-badge {
            color: #ffffff !important;
        }
        :global(.dark-mode) .status-badge.low { background: rgba(239, 68, 68, 0.3); }
        :global(.dark-mode) .status-badge.good { background: rgba(249, 115, 22, 0.3); }
        :global(.dark-mode) .status-badge.excellent { background: rgba(34, 197, 94, 0.3); }
        :global(.dark-mode) .action-card.blue .action-icon { background: rgba(59, 130, 246, 0.3); }
        :global(.dark-mode) .action-card.green .action-icon { background: rgba(34, 197, 94, 0.3); }
        :global(.dark-mode) .action-card.purple .action-icon { background: rgba(139, 92, 246, 0.3); }
        :global(.dark-mode) .action-card.orange .action-icon { background: rgba(249, 115, 22, 0.3); }
        :global(.dark-mode) .manage-btn {
            background-color: #f0f0f0 !important;
            color: #000000 !important;
        }
        :global(.dark-mode) .manage-btn svg {
            stroke: #000000 !important;
        }
        :global(.dark-mode) .error-banner {
          background: rgba(239, 68, 68, 0.1) !important;
          border-color: rgba(239, 68, 68, 0.3) !important;
          color: #ef4444 !important;
        }
        :global(.dark-mode) .clickable-property-name {
          color: #6366f1 !important;
        }
        :global(.dark-mode) .clickable-property-name:hover {
          color: #8b5cf6 !important;
        }

        /* Listing Modal */
        .listing-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          padding: 20px;
          border-radius: 8px;
          width: 80%;
          max-width: 600px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 16px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
        }

        .modal-error,
        .modal-success {
          margin-bottom: 20px;
          padding: 12px;
          border-radius: 6px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          font-size: 14px;
          font-weight: 500;
        }

        .modal-section {
          margin-bottom: 20px;
        }

        .modal-section h3 {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .property-select {
          width: 100%;
          padding: 10px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
          color: #374151;
        }

        .platform-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .platform-card {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .platform-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .platform-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .platform-icon {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .platform-name {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }

        .modal-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .cancel-btn {
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .submit-btn {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .submit-btn:hover:not(:disabled) {
          background: #3730a3;
        }

        .submit-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }

        .cancel-btn:hover {
          background: #e2e8f0;
        }

        .modal-success {
          background: #f0fdf4 !important;
          border: 1px solid #dcfce7 !important;
          color: #16a34a !important;
        }

        /* Dark mode modal styles */
        :global(.dark-mode) .modal-content {
          background: #1a1a1a !important;
          color: #ffffff !important;
        }

        :global(.dark-mode) .property-select {
          background: #111111 !important;
          border-color: #333333 !important;
          color: #ffffff !important;
        }

        :global(.dark-mode) .platform-card {
          background: #111111 !important;
          border-color: #333333 !important;
        }

        :global(.dark-mode) .platform-name {
          color: #ffffff !important;
        }

        :global(.dark-mode) .modal-close {
          color: #94a3b8 !important;
        }

        :global(.dark-mode) .cancel-btn {
          background: #1a1a1a !important;
          color: #e2e8f0 !important;
          border-color: #333333 !important;
        }

        :global(.dark-mode) .cancel-btn:hover {
          background: #222222 !important;
        }

        /* Action Buttons */
        .action-buttons {
          display: flex;
          gap: 4px;
          justify-content: center;
          align-items: center;
        }

        /* Icon Button Styles */
        .icon-btn {
          background: none;
          border: none;
          padding: 8px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          width: 32px;
          height: 32px;
        }

        .delete-icon-btn {
          color: #dc2626;
          background: #fef2f2;
          border: 1px solid #fecaca;
        }

        .delete-icon-btn:hover {
          background: #fee2e2;
          color: #b91c1c;
          transform: translateY(-1px);
        }

        /* Delete Modal */
        .delete-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .delete-modal-content {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .modal-title-section {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .warning-icon {
          width: 48px;
          height: 48px;
          background: #fee2e2;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #dc2626;
          flex-shrink: 0;
        }

        .delete-modal-content .modal-header h2 {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 4px 0;
        }

        .delete-modal-content .modal-header p {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .delete-message {
          font-size: 14px;
          color: #374151;
          line-height: 1.5;
          margin: 0;
        }

        .delete-message strong {
          color: #1f2937;
          font-weight: 600;
        }

        .delete-confirm-btn {
          background: #dc2626;
          color: white;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .delete-confirm-btn:hover:not(:disabled) {
          background: #b91c1c;
        }

        .delete-confirm-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .loading-spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid #ffffff40;
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .sort-select { padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; margin-right: 12px; }
        .sort-select:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
      `}</style>
    </DashboardLayout>
  );
}

export default withAuth(Properties);