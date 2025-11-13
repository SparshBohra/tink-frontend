import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth-context';
import { apiRequest } from '../lib/api';
import { PropertyListing } from '../lib/types';
import NewListingModal from './NewListingModal';
import { 
  Home, 
  CheckCircle, 
  XCircle, 
  FileText, 
  AlertTriangle, 
  Plus, 
  RefreshCw, 
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Grid,
  List,
  Filter,
  Loader
} from 'lucide-react';

interface ListingsDashboardProps {}

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingListing, setEditingListing] = useState<any>(null);
  const [loadingListingForEdit, setLoadingListingForEdit] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'panel' | 'list'>('panel');
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState<'name' | 'latest'>('latest');

  useEffect(() => {
    if (user) {
      fetchListings();
      fetchProperties();
    }
  }, [user]);

  // Handle URL parameters for property filtering and auto-open create modal
  useEffect(() => {
    if (router.isReady) {
      const { property, create } = router.query;
      console.log('URL parameter processing:', { property, create, isReady: router.isReady, query: router.query });
      
      // Handle property filtering
      if (property && typeof property === 'string') {
        const propertyId = parseInt(property);
        console.log('Parsed property ID from URL:', propertyId);
        if (!isNaN(propertyId)) {
          setSelectedProperty(propertyId);
        }
      }
      
      // Handle auto-opening create modal
      if (create === 'true') {
        console.log('Auto-opening create modal from URL parameter');
        setShowCreateModal(true);
        // Clean up URL parameter after opening modal
        router.replace(router.pathname + (property ? `?property=${property}` : ''), undefined, { shallow: true });
      }
    }
  }, [router.isReady, router.query]);

  // Sort listings
  const applySort = (list: PropertyListing[], option: 'name' | 'latest') => {
    const cloned = [...list];
    if (option === 'latest') {
      return cloned.sort((a, b) => {
        const ad = new Date(a.created_at || '').getTime() || 0;
        const bd = new Date(b.created_at || '').getTime() || 0;
        return bd - ad;
      });
    }
    return cloned.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  };

  // Filter and sort listings when property filter or sort option changes
  useEffect(() => {
    console.log('Filtering effect triggered:', { selectedProperty, listingsCount: listings.length });
    
    let filtered = listings;
    if (selectedProperty) {
      filtered = listings.filter(listing => listing.property_ref === selectedProperty);
    }
    
    const sorted = applySort(filtered, sortOption);
    setFilteredListings(sorted);
  }, [listings, selectedProperty, sortOption]);

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

  const handleEditListing = async (listingId: number) => {
    setLoadingListingForEdit(true);
    setActiveDropdown(null); // Close dropdown
    
    try {
      // Fetch full listing data for editing
      // apiRequest already returns parsed JSON, not a Response object
      const fullListingData = await apiRequest(`/properties/listings/${listingId}/`, {
        method: 'GET',
      });
      setEditingListing(fullListingData);
      setShowEditModal(true);
    } catch (err: any) {
      console.error('Failed to fetch listing for editing:', err);
      setError(err.message || 'Failed to load listing for editing.');
    } finally {
      setLoadingListingForEdit(false);
    }
  };

  const handleEditListingSuccess = async () => {
    setShowEditModal(false);
    setEditingListing(null);
    // Refresh listings to get updated data
    await fetchListings();
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

  const handleManageClick = (e: React.MouseEvent, listingId: number) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === listingId ? null : listingId);
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

  const metrics = getMetrics();

  if (loading) {
    return (
      <div style={{
        width: '100%',
        padding: '2rem',
        backgroundColor: '#f8fafc',
        minHeight: 'calc(100vh - 72px)',
        boxSizing: 'border-box'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '5rem 1.5rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '4px solid #e5e7eb',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '1.5rem'
          }} />
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 0.5rem 0'
          }}>
            Loading Property Listings...
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: 0
          }}>
            Please wait while we fetch your listings
          </p>
        </div>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      padding: '1.5rem',
      backgroundColor: '#f8fafc',
      minHeight: 'calc(100vh - 72px)',
      boxSizing: 'border-box'
    }}>
      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <XCircle style={{ width: '1.25rem', height: '1.25rem', color: '#dc2626' }} />
          <span style={{ color: '#dc2626', fontSize: '0.875rem', fontWeight: '500' }}>
          {error}
          </span>
        </div>
      )}

      {/* Header Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '1.5rem',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            backgroundColor: '#dbeafe',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Home style={{ width: '1.5rem', height: '1.5rem', color: '#2563eb' }} />
          </div>
          <div>
            <h1 style={{
              fontSize: '1.875rem',
              fontWeight: '700',
              color: '#111827',
              margin: '0 0 0.25rem 0'
            }}>
              Property Listings
            </h1>
            <p style={{
              fontSize: '1rem',
              color: '#6b7280',
              margin: 0
            }}>
              Manage all property listings and tenant applications across your portfolio
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {[
          {
            title: 'Total Listings',
            value: metrics.totalListings,
            subtitle: 'Active portfolio',
            icon: <Home style={{ width: '1.25rem', height: '1.25rem' }} />,
            color: '#2563eb',
            bgColor: '#dbeafe'
          },
          {
            title: 'Active Listings',
            value: metrics.activeListings,
            subtitle: `${metrics.inactiveListings} inactive`,
            icon: <CheckCircle style={{ width: '1.25rem', height: '1.25rem' }} />,
            color: '#059669',
            bgColor: '#d1fae5'
          },
          {
            title: 'Total Applications',
            value: metrics.totalApplications,
            subtitle: 'Applications received',
            icon: <FileText style={{ width: '1.25rem', height: '1.25rem' }} />,
            color: '#7c3aed',
            bgColor: '#e9d5ff'
          },
          {
            title: 'Application Rate',
            value: metrics.totalListings > 0 ? (metrics.totalApplications / metrics.totalListings).toFixed(1) : '0',
            subtitle: 'Per listing average',
            icon: <AlertTriangle style={{ width: '1.25rem', height: '1.25rem' }} />,
            color: '#ea580c',
            bgColor: '#fed7aa'
          }
        ].map((metric, index) => (
          <div key={index} style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h3 style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#6b7280',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.025em'
              }}>
                {metric.title}
              </h3>
              <div style={{
                backgroundColor: metric.bgColor,
                borderRadius: '8px',
                padding: '0.5rem',
                color: metric.color
              }}>
                {metric.icon}
              </div>
            </div>
            <div style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '0.25rem',
              lineHeight: 1
            }}>
              {metric.value}
          </div>
            <div style={{
              fontSize: '0.875rem',
              color: '#6b7280'
            }}>
              {metric.subtitle}
            </div>
          </div>
        ))}
      </div>

      {/* Listings Management Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        {/* Section Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#111827',
              margin: '0 0 0.25rem 0'
            }}>
              Manage Listings
            </h2>
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              margin: 0
            }}>
              View and manage all your property listings
              {selectedProperty && (
                <span style={{ color: '#2563eb', fontWeight: '500' }}>
                  {' '}• Filtered by {properties.find(p => p.id === selectedProperty)?.name || 'Selected Property'}
                </span>
              )}
            </p>
          </div>
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            {/* View Toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '2px'
            }}>
              <button
                onClick={() => setViewMode('panel')}
                style={{
                  padding: '0.5rem',
                  backgroundColor: viewMode === 'panel' ? '#2563eb' : 'transparent',
                  color: viewMode === 'panel' ? 'white' : '#6b7280',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Grid style={{ width: '1rem', height: '1rem' }} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '0.5rem',
                  backgroundColor: viewMode === 'list' ? '#2563eb' : 'transparent',
                  color: viewMode === 'list' ? 'white' : '#6b7280',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <List style={{ width: '1rem', height: '1rem' }} />
              </button>
            </div>

            {/* Property Filter */}
            <select
              value={selectedProperty || ''}
              onChange={handlePropertyFilterChange}
              style={{
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: 'white',
                fontSize: '0.875rem',
                color: '#374151',
                cursor: 'pointer',
                minWidth: '160px'
              }}
            >
              <option value="">All Properties</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>

            {/* Sort Select */}
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value as 'name' | 'latest')}
              style={{
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: 'white',
                fontSize: '0.875rem',
                color: '#374151',
                cursor: 'pointer'
              }}
            >
              <option value="latest">Latest Added</option>
              <option value="name">Name A–Z</option>
            </select>

            {/* Refresh Button */}
            <button 
              onClick={fetchListings}
              disabled={isRefreshing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isRefreshing ? 0.6 : 1
              }}
              onMouseOver={(e) => !isRefreshing && (e.currentTarget.style.backgroundColor = '#e5e7eb')}
              onMouseOut={(e) => !isRefreshing && (e.currentTarget.style.backgroundColor = '#f3f4f6')}
            >
              <RefreshCw style={{ 
                width: '1rem', 
                height: '1rem',
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
              }} />
              Refresh
            </button>

            {/* Create Listing Button */}
            <button 
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#1d4ed8';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Plus style={{ width: '1rem', height: '1rem' }} />
              Create Listing
            </button>
          </div>
        </div>

        {/* Listings Content */}
        {filteredListings.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem 1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ maxWidth: '32rem' }}>
              <div style={{
                width: '5rem',
                height: '5rem',
                backgroundColor: '#f3f4f6',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem auto'
              }}>
                <Home style={{ width: '2rem', height: '2rem', color: '#9ca3af' }} />
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#111827',
                margin: '0 0 0.5rem 0'
              }}>
                {selectedProperty ? 'No Listings for This Property' : 'No Property Listings Yet'}
              </h3>
              <p style={{
                fontSize: '1rem',
                color: '#6b7280',
                lineHeight: 1.6,
                margin: '0 0 2rem 0'
              }}>
                {selectedProperty 
                  ? `No listings found for ${properties.find(p => p.id === selectedProperty)?.name || 'this property'}. Create a listing to start accepting applications.`
                  : 'Start building your listing portfolio by creating your first property listing. Manage applications, visibility, and tenant interest all in one place.'
                }
              </p>
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                >
                  <Plus style={{ width: '1rem', height: '1rem' }} />
                  {selectedProperty ? 'Create Listing for This Property' : 'Create Your First Listing'}
                </button>
                <button 
                  onClick={() => router.push('/properties')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'white',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <Home style={{ width: '1rem', height: '1rem' }} />
                  View Properties
                </button>
              </div>
            </div>
          </div>
        ) : viewMode === 'panel' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '1.5rem'
          }}>
            {filteredListings.map((listing) => (
              <div key={listing.id} style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1.5rem',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 25px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = '#2563eb';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#111827',
                      margin: '0 0 0.25rem 0',
                      lineHeight: 1.3
                    }}>
                      {listing.title}
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      margin: 0
                    }}>
                      {listing.property_name}
                    </p>
                  </div>
                  <span style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.025em',
                    backgroundColor: listing.is_active ? '#d1fae5' : '#fef2f2',
                    color: listing.is_active ? '#065f46' : '#dc2626'
                  }}>
                      {listing.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: 0,
                    lineHeight: 1.4
                  }}>
                    {listing.description ? listing.description.substring(0, 120) + '...' : 'No description available'}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '1.5rem',
                  marginBottom: '1rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#9ca3af',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: '0.025em'
                    }}>
                      Applications
                    </span>
                    <span style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#111827'
                    }}>
                      {listing.application_count || 0}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#9ca3af',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: '0.025em'
                    }}>
                      Views
                    </span>
                    <span style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#111827'
                    }}>
                      {listing.view_count || 0}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#9ca3af',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: '0.025em'
                    }}>
                      Created
                    </span>
                    <span style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#111827'
                    }}>
                      {new Date(listing.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={() => handleViewPublicListing(listing.public_slug)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: 'white',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    <Eye style={{ width: '0.875rem', height: '0.875rem' }} />
                    View
                  </button>
                  <button
                    onClick={() => handleEditListing(listing.id)}
                    disabled={loadingListingForEdit}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: loadingListingForEdit ? '#f3f4f6' : 'white',
                      color: loadingListingForEdit ? '#9ca3af' : '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      cursor: loadingListingForEdit ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      if (!loadingListingForEdit) {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!loadingListingForEdit) {
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    {loadingListingForEdit ? (
                      <>
                        <Loader style={{ width: '0.875rem', height: '0.875rem', animation: 'spin 1s linear infinite' }} />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Edit style={{ width: '0.875rem', height: '0.875rem' }} />
                        Edit
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleToggleActive(listing.id, listing.is_active)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: listing.is_active ? '#f59e0b' : '#059669',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = listing.is_active ? '#d97706' : '#047857';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = listing.is_active ? '#f59e0b' : '#059669';
                    }}
                  >
                    {listing.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteListing(listing.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                  >
                    <Trash2 style={{ width: '0.875rem', height: '0.875rem' }} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.875rem'
            }}>
                <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{
                    padding: '0.75rem',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    Listing
                  </th>
                  <th style={{
                    padding: '0.75rem',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    Property
                  </th>
                  <th style={{
                    padding: '0.75rem',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    Status
                  </th>
                  <th style={{
                    padding: '0.75rem',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    Applications
                  </th>
                  <th style={{
                    padding: '0.75rem',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    Views
                  </th>
                  <th style={{
                    padding: '0.75rem',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    Created
                  </th>
                  <th style={{
                    padding: '0.75rem',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    Actions
                  </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredListings.map((listing) => (
                  <tr key={listing.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '1rem 0.75rem' }}>
                      <div>
                        <div style={{
                          fontWeight: '600',
                          color: '#111827',
                          marginBottom: '0.25rem'
                        }}>
                          {listing.title}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#6b7280'
                        }}>
                          {listing.description ? listing.description.substring(0, 60) + '...' : 'No description'}
                        </div>
                        </div>
                      </td>
                    <td style={{ padding: '1rem 0.75rem', color: '#374151' }}>
                      {listing.property_name}
                    </td>
                    <td style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: listing.is_active ? '#d1fae5' : '#fef2f2',
                        color: listing.is_active ? '#065f46' : '#dc2626'
                      }}>
                          {listing.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    <td style={{ padding: '1rem 0.75rem', textAlign: 'center', fontWeight: '600' }}>
                      {listing.application_count || 0}
                      </td>
                    <td style={{ padding: '1rem 0.75rem', textAlign: 'center', fontWeight: '600' }}>
                      {listing.view_count || 0}
                      </td>
                    <td style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>
                        {new Date(listing.created_at).toLocaleDateString()}
                      </td>
                    <td style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                            <button 
                              onClick={(e) => handleManageClick(e, listing.id)} 
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            padding: '0.5rem 0.75rem',
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <MoreHorizontal style={{ width: '1rem', height: '1rem' }} />
                              Manage
                            </button>
                            
                            {activeDropdown === listing.id && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '0.25rem',
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            zIndex: 10,
                            minWidth: '160px'
                          }}>
                                <button 
                                  onClick={() => handleViewPublicListing(listing.public_slug)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                width: '100%',
                                padding: '0.75rem 1rem',
                                backgroundColor: 'transparent',
                                color: '#374151',
                                border: 'none',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s ease',
                                textAlign: 'left'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Eye style={{ width: '1rem', height: '1rem' }} />
                                  View Public
                                </button>
                                
                                <button 
                                  onClick={() => handleEditListing(listing.id)}
                                  disabled={loadingListingForEdit}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                width: '100%',
                                padding: '0.75rem 1rem',
                                backgroundColor: 'transparent',
                                color: loadingListingForEdit ? '#9ca3af' : '#374151',
                                border: 'none',
                                fontSize: '0.875rem',
                                cursor: loadingListingForEdit ? 'not-allowed' : 'pointer',
                                transition: 'background-color 0.2s ease',
                                textAlign: 'left'
                              }}
                              onMouseOver={(e) => {
                                if (!loadingListingForEdit) {
                                  e.currentTarget.style.backgroundColor = '#f9fafb';
                                }
                              }}
                              onMouseOut={(e) => {
                                if (!loadingListingForEdit) {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }
                              }}
                            >
                              {loadingListingForEdit ? (
                                <>
                                  <Loader style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
                                  Loading...
                                </>
                              ) : (
                                <>
                                  <Edit style={{ width: '1rem', height: '1rem' }} />
                                  Edit Listing
                                </>
                              )}
                                </button>
                                
                                <button 
                                  onClick={() => handleToggleActive(listing.id, listing.is_active)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                width: '100%',
                                padding: '0.75rem 1rem',
                                backgroundColor: 'transparent',
                                color: '#374151',
                                border: 'none',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s ease',
                                textAlign: 'left'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <CheckCircle style={{ width: '1rem', height: '1rem' }} />
                                  {listing.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                                
                                <button 
                                  onClick={() => handleDeleteListing(listing.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                width: '100%',
                                padding: '0.75rem 1rem',
                                backgroundColor: 'transparent',
                                color: '#dc2626',
                                border: 'none',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s ease',
                                textAlign: 'left',
                                borderTop: '1px solid #f3f4f6'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Trash2 style={{ width: '1rem', height: '1rem' }} />
                                  Delete
                                </button>
                              </div>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
        )}
      </div>

      {/* Create Listing Modal */}
      {showCreateModal && (
        <NewListingModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchListings}
          selectedPropertyId={selectedProperty}
        />
      )}

      {/* Edit Listing Modal */}
      {showEditModal && editingListing && (
        <NewListingModal
          onClose={() => {
            setShowEditModal(false);
            setEditingListing(null);
          }}
          onSuccess={handleEditListingSuccess}
          editMode={true}
          existingListing={editingListing}
          property_name={editingListing?.property_details?.name || editingListing?.property_name}
        />
      )}

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 