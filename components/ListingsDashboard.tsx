import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth-context';
import { apiRequest } from '../lib/api';
import { PropertyListing } from '../lib/types';
import NewListingModal from './NewListingModal';

interface ListingsDashboardProps {}

// SVG Icon Components
const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22,4 12,14.01 9,11.01"/>
  </svg>
);

const XCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

const FileTextIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
  </svg>
);

const AlertTriangleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23,4 23,10 17,10"/>
    <polyline points="1,20 1,14 7,14"/>
    <path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10m22,4L18.36,18.36A9,9,0,0,1,3.51,15"/>
  </svg>
);

export default function ListingsDashboard(props: ListingsDashboardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<PropertyListing[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchListings();
      fetchProperties();
    }
  }, [user]);

  // Handle URL parameters for property filtering
  useEffect(() => {
    if (router.isReady) {
      const { property } = router.query;
      console.log('URL parameter processing:', { property, isReady: router.isReady, query: router.query });
      if (property && typeof property === 'string') {
        const propertyId = parseInt(property);
        console.log('Parsed property ID from URL:', propertyId);
        if (!isNaN(propertyId)) {
          setSelectedProperty(propertyId);
        }
      }
    }
  }, [router.isReady, router.query]);

  // Filter listings when property filter changes
  useEffect(() => {
    console.log('Filtering effect triggered:', { selectedProperty, listingsCount: listings.length });
    if (selectedProperty) {
      const filtered = listings.filter(listing => {
        console.log('Checking listing:', { listingId: listing.id, property_ref: listing.property_ref, selectedProperty, types: { property_ref: typeof listing.property_ref, selectedProperty: typeof selectedProperty } });
        // Handle both string and number comparison
        const listingPropertyRef = typeof listing.property_ref === 'string' ? parseInt(listing.property_ref) : listing.property_ref;
        return listingPropertyRef === selectedProperty;
      });
      console.log('Filtered listings:', filtered.length);
      setFilteredListings(filtered);
    } else {
      setFilteredListings(listings);
    }
  }, [listings, selectedProperty]);

  const fetchListings = async () => {
    try {
      setError(null);
      setIsRefreshing(true);
      const response = await apiRequest('/properties/listings/', {
        method: 'GET',
      });
      // Handle both array response and paginated response with results property
      const listingsData = Array.isArray(response) ? response : (response.results || []);
      
      // Normalize the data to ensure consistent field names
      const normalizedListings = listingsData.map((listing: any) => ({
        ...listing,
        // Normalize status field - handle both 'status' and 'is_active' fields
        is_active: listing.is_active !== undefined ? listing.is_active : listing.status === 'active'
      }));
      
      console.log('Fetched listings:', normalizedListings.map((l: any) => ({ id: l.id, property_ref: l.property_ref, title: l.title })));
      setListings(normalizedListings);
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError('Failed to fetch listings. Please try again.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await apiRequest('/properties/', {
        method: 'GET',
      });
      const propertiesData = Array.isArray(response) ? response : (response.results || []);
      console.log('Fetched properties:', propertiesData.map((p: any) => ({ id: p.id, name: p.name })));
      setProperties(propertiesData);
    } catch (err) {
      console.error('Error fetching properties:', err);
    }
  };

  const handleCreateListing = async (listingData: any) => {
    try {
      const response = await apiRequest('/properties/listings/', {
        method: 'POST',
        body: JSON.stringify(listingData),
      });
      
      // Normalize the response data to ensure consistent field names
      const normalizedListing = {
        ...response,
        is_active: response.is_active !== undefined ? response.is_active : response.status === 'active'
      };
      
      setListings(prev => [normalizedListing, ...prev]);
      setShowCreateModal(false);
      
      // Refresh listings to ensure we have the latest data
      setTimeout(() => {
        fetchListings();
      }, 500);
      
      // Show success message
      // You might want to add a toast notification here
      
    } catch (err) {
      console.error('Error creating listing:', err);
      throw err; // Re-throw to let the modal handle the error
    }
  };

  const handleToggleActive = async (listingId: number, isActive: boolean) => {
    try {
      // Send both boolean and status string for maximum compatibility with backend expectations
      await apiRequest(`/properties/listings/${listingId}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          is_active: !isActive,
          status: !isActive ? 'active' : 'inactive',
        }),
      });

      // Immediately refresh listings from the server to ensure we have the persisted state
      await fetchListings();
    } catch (err) {
      console.error('Error toggling listing:', err);
      setError('Failed to update listing. Please try again.');
    }
  };

  const handleDeleteListing = async (listingId: number) => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }

    try {
      await apiRequest(`/properties/listings/${listingId}/`, {
        method: 'DELETE',
      });
      
      setListings(prev => prev.filter(listing => listing.id !== listingId));
    } catch (err) {
      console.error('Error deleting listing:', err);
      setError('Failed to delete listing. Please try again.');
    }
  };

  const handleViewPublicListing = (slug: string) => {
    window.open(`/listings/${slug}`, '_blank');
  };

  const handleEditListing = (listingId: number) => {
    // Navigate to edit page (to be implemented)
    router.push(`/listings/edit/${listingId}`);
  };

  const getMetrics = () => {
    const totalListings = filteredListings.length;
    const activeListings = filteredListings.filter(l => l.is_active).length;
    const inactiveListings = totalListings - activeListings;
    const totalApplications = filteredListings.reduce((sum, l) => sum + (l.application_count || 0), 0);
    
    return {
      totalListings,
      activeListings,
      inactiveListings,
      totalApplications,
    };
  };

  const handlePropertyFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const propertyId = value ? parseInt(value) : null;
    console.log('Property filter change:', { value, propertyId, selectedProperty, listings: listings.length });
    setSelectedProperty(propertyId);
    
    // Update URL without full page reload
    if (propertyId) {
      router.push(`/listings?property=${propertyId}`, undefined, { shallow: true });
    } else {
      router.push('/listings', undefined, { shallow: true });
    }
  };

  const metrics = getMetrics();

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h3>Loading Property Listings...</h3>
          <p>Please wait while we fetch your listings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* No Listings Alert Banner */}
      {listings.length === 0 && (
        <div className="alert-banner">
          <div className="alert-content">
            <div className="alert-icon">
              <AlertTriangleIcon />
            </div>
            <div className="alert-text">
              <strong>Get Started:</strong> Create your first property listing to start accepting tenant applications and grow your rental business.
            </div>
            <div className="alert-actions">
              <button 
                onClick={() => setShowCreateModal(true)}
                className="alert-btn primary"
              >
                <PlusIcon />
                Create Listing
              </button>
              <button 
                onClick={() => router.push('/properties')}
                className="alert-btn secondary"
              >
                View Properties
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="error-banner">
          <div className="error-content">
            <XCircleIcon />
            <span>{error}</span>
            <button onClick={fetchListings} className="retry-btn">
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-info">
              <h3 className="metric-title">Total Listings</h3>
              <div className="metric-icon">
                <HomeIcon />
              </div>
            </div>
          </div>
          <div className="metric-content">
            <div className="metric-value">{metrics.totalListings}</div>
            <div className="metric-subtitle">property listings</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-info">
              <h3 className="metric-title">Active Listings</h3>
              <div className="metric-icon">
                <CheckCircleIcon />
              </div>
            </div>
          </div>
          <div className="metric-content">
            <div className="metric-value">{metrics.activeListings}</div>
            <div className="metric-subtitle">accepting applications</div>
            <div className="metric-progress">
              {metrics.totalListings > 0 && (
                <span className="metric-change positive">
                  {Math.round((metrics.activeListings / metrics.totalListings) * 100)}% active
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-info">
              <h3 className="metric-title">Inactive Listings</h3>
              <div className="metric-icon">
                <XCircleIcon />
              </div>
            </div>
          </div>
          <div className="metric-content">
            <div className="metric-value">{metrics.inactiveListings}</div>
            <div className="metric-subtitle">not accepting applications</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-info">
              <h3 className="metric-title">Total Applications</h3>
              <div className="metric-icon">
                <FileTextIcon />
              </div>
            </div>
          </div>
          <div className="metric-content">
            <div className="metric-value">{metrics.totalApplications}</div>
            <div className="metric-subtitle">applications received</div>
            {metrics.totalListings > 0 && (
              <div className="metric-progress">
                <span className="metric-change neutral">
                  {(metrics.totalApplications / metrics.totalListings).toFixed(1)} avg per listing
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="listings-section">
        <div className="section-header">
          <div className="section-title-group">
            <h2 className="section-title">Manage Listings</h2>
            <p className="section-subtitle">
              View and manage all your property listings
              {selectedProperty && (
                <span className="filter-indicator">
                  {' '}• Filtered by {properties.find(p => p.id === selectedProperty)?.name || 'Selected Property'}
                </span>
              )}
            </p>
          </div>
          <div className="section-actions">
            <div className="filter-controls">
              <select
                value={selectedProperty || ''}
                onChange={handlePropertyFilterChange}
                className="property-filter-select"
              >
                <option value="">All Properties</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={fetchListings}
              disabled={isRefreshing}
              className="refresh-btn"
            >
              <RefreshIcon />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <PlusIcon />
              Create Listing
            </button>
          </div>
        </div>

        {filteredListings.length === 0 ? (
          <div className="empty-listings-state">
            <div className="empty-state-content">
              <div className="empty-state-icon">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
              </div>
              <h3 className="empty-state-title">
                {selectedProperty ? 'No Listings for This Property' : 'No Property Listings Yet'}
              </h3>
              <p className="empty-state-description">
                {selectedProperty 
                  ? `No listings found for ${properties.find(p => p.id === selectedProperty)?.name || 'this property'}. Create a listing to start accepting applications.`
                  : 'Create your first property listing to start accepting applications from tenants. Listings help you reach more potential tenants and streamline your rental process.'
                }
              </p>
              <div className="empty-state-actions">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-primary"
                >
                  <PlusIcon />
                  {selectedProperty ? 'Create Listing for This Property' : 'Create Your First Listing'}
                </button>
                <button
                  onClick={() => router.push('/properties')}
                  className="btn btn-secondary"
                >
                  <HomeIcon />
                  View Properties
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="listings-grid">
            {filteredListings.map((listing) => (
              <div key={listing.id} className="listing-card">
                <div className="listing-card-header">
                  <div className="listing-info">
                    <h3 className="listing-title">{listing.title}</h3>
                    <p className="listing-property">{listing.property_name}</p>
                  </div>
                  <div className="listing-status">
                    <span className={`status-badge ${listing.is_active ? 'active' : 'inactive'}`}>
                      {listing.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="listing-description">
                  <p>{listing.description ? listing.description.substring(0, 120) + '...' : 'No description available'}</p>
                </div>

                <div className="listing-metrics">
                  <div className="listing-metric">
                    <span className="metric-label">Applications</span>
                    <span className="metric-value">{listing.application_count || 0}</span>
                  </div>
                  <div className="listing-metric">
                    <span className="metric-label">Views</span>
                    <span className="metric-value">{listing.view_count || 0}</span>
                  </div>
                  <div className="listing-metric">
                    <span className="metric-label">Created</span>
                    <span className="metric-value">
                      {new Date(listing.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="listing-actions">
                  <button
                    onClick={() => handleViewPublicListing(listing.public_slug)}
                    className="btn btn-sm btn-secondary"
                    title="View public listing"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    View
                  </button>
                  <button
                    onClick={() => handleEditListing(listing.id)}
                    className="btn btn-sm btn-secondary"
                    title="Edit listing"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(listing.id, listing.is_active)}
                    className={`btn btn-sm ${listing.is_active ? 'btn-warning' : 'btn-success'}`}
                    title={listing.is_active ? 'Deactivate listing' : 'Activate listing'}
                  >
                    {listing.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteListing(listing.id)}
                    className="btn btn-sm btn-danger"
                    title="Delete listing"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3,6 5,6 21,6"/>
                      <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Listing Modal */}
      {showCreateModal && (
        <NewListingModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchListings}
        />
      )}

      <style jsx>{`
        .dashboard-container {
          width: 100%;
          padding: 20px;
          background: var(--gray-50);
          min-height: calc(100vh - 72px);
          box-sizing: border-box;
        }

        /* Alert Banner */
        .alert-banner {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border: 2px solid var(--primary-blue);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
        }

        .alert-content {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .alert-icon {
          color: var(--primary-blue);
          flex-shrink: 0;
        }

        .alert-text {
          flex: 1;
          min-width: 200px;
          color: var(--primary-blue-dark);
          font-size: 15px;
          line-height: 1.4;
        }

        .alert-text strong {
          font-weight: 600;
        }

        .alert-actions {
          display: flex;
          gap: 12px;
          flex-shrink: 0;
        }

        .alert-btn {
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .alert-btn.primary {
          background: var(--primary-blue);
          color: white;
        }

        .alert-btn.primary:hover {
          background: var(--primary-blue-dark);
          transform: translateY(-1px);
        }

        .alert-btn.secondary {
          background: white;
          color: var(--primary-blue);
          border: 1px solid var(--primary-blue);
        }

        .alert-btn.secondary:hover {
          background: var(--primary-blue-light);
        }

        /* Error Banner */
        .error-banner {
          background: var(--error-red-light);
          border: 1px solid var(--error-red);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .error-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          color: var(--error-red-dark);
          font-size: 14px;
          font-weight: 500;
        }

        .retry-btn {
          background: var(--error-red);
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .retry-btn:hover {
          background: var(--error-red-dark);
        }

        /* Loading State */
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 24px;
          text-align: center;
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid var(--gray-200);
          border-top-color: var(--primary-blue);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 24px;
        }

        .loading-state h3 {
          font-size: 20px;
          font-weight: 600;
          color: var(--gray-900);
          margin: 0 0 8px 0;
        }

        .loading-state p {
          font-size: 14px;
          color: var(--gray-600);
          margin: 0;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Metrics Grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }

        .metric-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid var(--gray-200);
          transition: all 0.2s ease;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .metric-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .metric-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--gray-700);
          margin: 0;
        }

        .metric-icon {
          color: var(--gray-500);
        }

        .metric-content {
          margin-top: 8px;
        }

        .metric-value {
          font-size: 32px;
          font-weight: 700;
          color: var(--gray-900);
          margin-bottom: 4px;
          line-height: 1;
        }

        .metric-subtitle {
          font-size: 14px;
          color: var(--gray-600);
          margin-bottom: 8px;
        }

        .metric-progress {
          margin-top: 8px;
        }

        .metric-change {
          font-size: 12px;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .metric-change.positive {
          background: var(--success-green-light);
          color: var(--success-green-dark);
        }

        .metric-change.neutral {
          background: var(--gray-100);
          color: var(--gray-600);
        }

        /* Listings Section */
        .listings-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid var(--gray-200);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .section-title-group {
          flex: 1;
        }

        .section-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--gray-900);
          margin: 0 0 4px 0;
        }

        .section-subtitle {
          font-size: 14px;
          color: var(--gray-600);
          margin: 0;
        }

        .section-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .refresh-btn {
          background: var(--gray-100);
          color: var(--gray-600);
          border: 1px solid var(--gray-200);
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .refresh-btn:hover {
          background: var(--gray-200);
          transform: translateY(-1px);
        }

        .refresh-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Enhanced Empty State */
        .empty-listings-state {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          min-height: 500px;
        }

        .empty-state-content {
          text-align: center;
          max-width: 600px;
        }

        .empty-state-icon {
          margin: 0 auto 32px auto;
          width: 80px;
          height: 80px;
          color: var(--gray-300);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .empty-state-title {
          font-size: 28px;
          font-weight: 700;
          color: var(--gray-900);
          margin: 0 0 16px 0;
        }

        .empty-state-description {
          font-size: 16px;
          color: var(--gray-600);
          line-height: 1.6;
          margin: 0 0 32px 0;
        }

        .empty-state-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 40px;
        }

        .empty-state-help {
          margin-top: 32px;
        }

        .help-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-top: 24px;
        }

        .help-card {
          background: var(--gray-50);
          border: 1px solid var(--gray-200);
          border-radius: 8px;
          padding: 16px;
          text-align: left;
        }

        .help-card h4 {
          font-size: 14px;
          font-weight: 600;
          color: var(--gray-900);
          margin: 0 0 8px 0;
        }

        .help-card p {
          font-size: 13px;
          color: var(--gray-600);
          margin: 0;
          line-height: 1.4;
        }

        /* Listings Grid */
        .listings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .listing-card {
          background: var(--gray-50);
          border: 2px solid var(--gray-200);
          border-radius: 12px;
          padding: 20px;
          transition: all 0.2s ease;
        }

        .listing-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 25px rgba(0, 0, 0, 0.1);
          border-color: var(--primary-blue);
        }

        .listing-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .listing-info {
          flex: 1;
        }

        .listing-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--gray-900);
          margin: 0 0 4px 0;
          line-height: 1.3;
        }

        .listing-property {
          font-size: 14px;
          color: var(--gray-600);
          margin: 0;
        }

        .listing-status {
          flex-shrink: 0;
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-badge.active {
          background: var(--success-green-light);
          color: var(--success-green-dark);
        }

        .status-badge.inactive {
          background: var(--error-red-light);
          color: var(--error-red-dark);
        }

        .listing-description {
          margin-bottom: 16px;
        }

        .listing-description p {
          font-size: 14px;
          color: var(--gray-600);
          margin: 0;
          line-height: 1.4;
        }

        .listing-metrics {
          display: flex;
          gap: 20px;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--gray-200);
        }

        .listing-metric {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .metric-label {
          font-size: 12px;
          color: var(--gray-500);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .listing-metric .metric-value {
          font-size: 16px;
          font-weight: 600;
          color: var(--gray-900);
        }

        .listing-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* Button Styles */
        .btn {
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;
          text-decoration: none;
          border: none;
        }

        .btn-primary {
          background: var(--primary-blue);
          color: white;
        }

        .btn-primary:hover {
          background: var(--primary-blue-dark);
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: white;
          color: var(--gray-700);
          border: 1px solid var(--gray-300);
        }

        .btn-secondary:hover {
          background: var(--gray-50);
          border-color: var(--gray-400);
          transform: translateY(-1px);
        }

        .btn-sm {
          padding: 8px 12px;
          font-size: 12px;
        }

        .btn-success {
          background: var(--success-green);
          color: white;
        }

        .btn-success:hover {
          background: var(--success-green-dark);
          transform: translateY(-1px);
        }

        .btn-warning {
          background: #f59e0b;
          color: white;
        }

        .btn-warning:hover {
          background: #d97706;
          transform: translateY(-1px);
        }

        .btn-danger {
          background: var(--error-red);
          color: white;
        }

        .btn-danger:hover {
          background: var(--error-red-dark);
          transform: translateY(-1px);
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 16px;
          }

          .alert-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .alert-actions {
            width: 100%;
            justify-content: flex-end;
          }

          .section-header {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }

          .section-actions {
            width: 100%;
            justify-content: space-between;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .listings-grid {
            grid-template-columns: 1fr;
          }

          .help-cards {
            grid-template-columns: 1fr;
          }

          .empty-state-actions {
            flex-direction: column;
            align-items: center;
          }

          .empty-state-actions .btn {
            width: 100%;
            max-width: 280px;
          }
        }

        /* Filter Controls */
        .filter-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .property-filter-select {
          padding: 8px 12px;
          border: 1px solid var(--gray-300);
          border-radius: 6px;
          background: white;
          color: var(--gray-700);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 180px;
        }

        .property-filter-select:hover {
          border-color: var(--gray-400);
        }

        .property-filter-select:focus {
          outline: none;
          border-color: var(--primary-blue);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .filter-indicator {
          color: var(--primary-blue);
          font-weight: 500;
        }
      `}</style>
    </div>
  );
} 