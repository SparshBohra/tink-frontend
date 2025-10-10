import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import PropertyDeletionModal from '../../components/PropertyDeletionModal';
import PropertyTenantAssignmentModal from '../../components/PropertyTenantAssignmentModal';
import { useRouter } from 'next/router';
import { withAuth } from '../../lib/auth-context';
import { apiClient } from '../../lib/api';
import { Property, Room, Lease } from '../../lib/types';
import { Building, Users, Home, BarChart3, Calendar, Plus, FileText, RefreshCw, MoreHorizontal, Eye, Edit, Trash2, Download, Zap } from 'lucide-react';

function Properties() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]); // Paginated properties for display
  const [allProperties, setAllProperties] = useState<Property[]>([]); // Full dataset for calculations
  const [propertyRooms, setPropertyRooms] = useState<{ [key: number]: Room[] }>({});
  const [propertyLeases, setPropertyLeases] = useState<{ [key: number]: Lease[] }>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 10; // Load 10 properties at a time
  
  // Lazy loading state for detailed data
  const [loadedPropertyDetails, setLoadedPropertyDetails] = useState<Set<number>>(new Set());
  
  // Modal states
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

  // Initial load
  useEffect(() => {
    fetchProperties(1, true);
  }, []);

  // Re-sort when sort option changes
  useEffect(() => {
    if (allProperties.length > 0) {
      const sortedAll = applySort(allProperties, sortOption);
      setAllProperties(sortedAll);
      
      // Re-paginate with new sort order
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const pageProperties = sortedAll.slice(0, endIndex); // Show all loaded pages so far
      setProperties(pageProperties);
      setHasNextPage(endIndex < sortedAll.length);
    }
  }, [sortOption, allProperties.length, currentPage]);

  // Fetch properties with client-side pagination
  const fetchProperties = async (page: number = 1, replace: boolean = false) => {
    try {
      if (page === 1) {
      setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      
      console.log(`Fetching properties page ${page}...`);
      
      // Since backend doesn't support pagination yet, we fetch all and implement client-side pagination
      const response = await apiClient.getProperties();
      
      console.log('Properties response:', response);
      
      const allPropertiesData = response.results || [];
      const sorted = applySort(allPropertiesData, sortOption);
      
      // Store full dataset for calculations
      setAllProperties(sorted);
      
      // Implement client-side pagination
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const pageProperties = sorted.slice(startIndex, endIndex);
      
      if (replace || page === 1) {
        setProperties(pageProperties);
        setCurrentPage(1);
      } else {
        setProperties(prev => [...prev, ...pageProperties]);
        setCurrentPage(page);
      }
      
      setTotalCount(sorted.length);
      setHasNextPage(endIndex < sorted.length);
      
      // Load detailed data for all properties immediately
      const propertyIds = pageProperties.map(p => p.id);
      await Promise.all(propertyIds.map(id => loadPropertyDetails(id)));
      
      console.log(`Loaded ${pageProperties.length} properties for page ${page}, total: ${sorted.length}, hasNext: ${endIndex < sorted.length}`);
      
    } catch (error: any) {
      console.error('Failed to fetch properties:', error);
      setError(error?.message || 'Failed to load properties data');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load more properties (infinite scroll)
  const loadMoreProperties = useCallback(() => {
    if (!loadingMore && hasNextPage) {
      fetchProperties(currentPage + 1, false);
    }
  }, [loadingMore, hasNextPage, currentPage]);

  // Lazy load detailed data for a specific property
  const loadPropertyDetails = useCallback(async (propertyId: number) => {
    if (loadedPropertyDetails.has(propertyId)) {
      return; // Already loaded
    }

    try {
      console.log(`Loading detailed data for property ${propertyId}...`);
      
      const [rooms, leases] = await Promise.all([
        apiClient.getPropertyRooms(propertyId),
        apiClient.getLeases({ property: propertyId })
      ]);
      
      setPropertyRooms(prev => ({
        ...prev,
        [propertyId]: rooms
      }));
      
      setPropertyLeases(prev => ({
        ...prev,
        [propertyId]: leases.results || []
      }));
      
      setLoadedPropertyDetails(prev => new Set([...prev, propertyId]));
      
      console.log(`Loaded details for property ${propertyId}: ${rooms.length} rooms, ${leases.results?.length || 0} leases`);
      
    } catch (err) {
      console.error(`Failed to fetch details for property ${propertyId}:`, err);
      // Set empty arrays so we don't keep trying to load
      setPropertyRooms(prev => ({ ...prev, [propertyId]: [] }));
      setPropertyLeases(prev => ({ ...prev, [propertyId]: [] }));
      setLoadedPropertyDetails(prev => new Set([...prev, propertyId]));
    }
  }, [loadedPropertyDetails]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasNextPage && !loadingMore) {
          loadMoreProperties();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    const sentinel = document.getElementById('properties-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [hasNextPage, loadingMore, loadMoreProperties]);

  // Refresh all data
  const refreshData = async () => {
    setLoadedPropertyDetails(new Set());
    setPropertyRooms({});
    setPropertyLeases({});
    await fetchProperties(1, true);
  };

  // Get property stats with lazy loading
  const getPropertyStats = (property: Property) => {
    const rooms = propertyRooms[property.id] || [];
    const leases = propertyLeases[property.id] || [];
    
    // If we haven't loaded details yet, use the property's own fields
    if (!loadedPropertyDetails.has(property.id)) {
      return {
        totalRooms: property.total_rooms || 0,
        vacantRooms: property.vacant_rooms || 0,
        occupiedRooms: (property.total_rooms || 0) - (property.vacant_rooms || 0),
        occupancyRate: property.total_rooms > 0 ? Math.round(((property.total_rooms - property.vacant_rooms) / property.total_rooms) * 100) : 0,
        activeLeases: 0, // We don't have this data yet
        isDetailLoaded: false
      };
    }
    
    // Use backend occupancy data instead of filtering room status
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.reduce((sum, room) => sum + (room.current_occupancy || 0), 0);
    const vacantRooms = Math.max(0, totalRooms - occupiedRooms);
    const activeLeases = leases.filter(lease => lease.status === 'active').length;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
    
    return {
      totalRooms,
      occupiedRooms,
      vacantRooms,
      occupancyRate,
      activeLeases,
      isDetailLoaded: true
    };
  };

  // Calculate portfolio summary from full dataset
  const portfolioStats = allProperties.reduce((acc, property) => {
    const stats = getPropertyStats(property);
    return {
      totalRooms: acc.totalRooms + stats.totalRooms,
      occupiedRooms: acc.occupiedRooms + stats.occupiedRooms,
      vacantRooms: acc.vacantRooms + stats.vacantRooms
    };
  }, { totalRooms: 0, occupiedRooms: 0, vacantRooms: 0 });
  
  const totalRooms = portfolioStats.totalRooms;
  const totalVacantRooms = portfolioStats.vacantRooms;
  const occupiedRooms = portfolioStats.occupiedRooms;
  const overallOccupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const handleCreateListing = () => {
    // If there's a selected property, pass it to the listings page to pre-select it
    if (selectedProperty) {
      router.push(`/listings?property=${selectedProperty.id}&create=true`);
    } else {
      router.push('/listings?create=true');
    }
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
      await fetchProperties(1, true);
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
          router.push(`/properties/${propertyId}`);
    setActiveDropdown(null);
  };

  const handleTenantAssignmentSave = async () => {
    // Refresh the data after tenant assignment
    await fetchProperties(1, true);
    setShowTenantAssignModal(false);
    setSelectedPropertyForAssign(null);
  };

  const handleCloseTenantAssignModal = () => {
    setShowTenantAssignModal(false);
    setSelectedPropertyForAssign(null);
  };

  // Check if a property can have tenants assigned
  const canAssignTenant = (property: Property) => {
    // Can assign tenant if property has vacant rooms or is per-property rental
    return property.rent_type === 'per_property' || (property.vacant_rooms && property.vacant_rooms > 0);
  };

  // Download properties report
  const downloadPropertiesReport = () => {
    const csvData = [
      ['Property Name', 'Type', 'Address', 'Total Rooms', 'Vacant Rooms', 'Occupancy Rate', 'Effective Rent'],
      ...properties.map(property => {
        const stats = getPropertyStats(property);
        return [
          property.name,
          property.property_type,
          property.full_address,
          stats.totalRooms.toString(),
          stats.vacantRooms.toString(),
          `${stats.occupancyRate}%`,
          property.effective_rent ? `$${property.effective_rent}` : 'N/A'
        ];
      })
    ];
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date().toISOString().split('T')[0];
    a.download = `tink-properties-report-${today}.csv`;
    a.click();
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
        <LoadingSpinner />
        
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
        <title>Property Management - SquareFt</title>
      </Head>
      
      <div className="dashboard-container">
        {/* Custom Header */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: '1.5rem',
          transition: 'all 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}>
          <div style={{
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              backgroundColor: '#2563eb',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Building style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{
                fontSize: '1.875rem',
                fontWeight: '700',
                color: '#111827',
                margin: 0,
                marginBottom: '0.25rem'
              }}>Property Management</h1>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>
                <Calendar style={{ width: '1rem', height: '1rem' }} />
                  Manage all properties, rooms, and occupancy across your portfolio
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {[
            {
              title: 'Total Properties',
              value: totalCount,
              subtitle: 'Active portfolio',
              icon: Building,
              bgColor: '#eff6ff',
              iconColor: '#2563eb'
            },
            {
              title: 'Total Rooms',
              value: totalRooms,
              subtitle: `${occupiedRooms} occupied`,
              icon: Home,
              bgColor: '#f0fdf4',
              iconColor: '#16a34a'
            },
            {
              title: 'Vacant Rooms',
              value: totalVacantRooms,
              subtitle: 'Available for rent',
              icon: Users,
              bgColor: '#fff7ed',
              iconColor: '#ea580c'
            },
            {
              title: 'Occupancy Rate',
              value: `${overallOccupancyRate}%`,
              subtitle: 'Portfolio performance',
              icon: BarChart3,
              bgColor: '#faf5ff',
              iconColor: '#9333ea'
            }
          ].map((metric, index) => (
            <div key={index} style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  margin: 0
                }}>{metric.title}</h3>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  backgroundColor: metric.bgColor,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <metric.icon style={{ width: '1.25rem', height: '1.25rem', color: metric.iconColor }} />
                </div>
              </div>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#111827',
                lineHeight: 1,
                marginBottom: '0.5rem'
              }}>{metric.value}</div>
              <div style={{
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>{metric.subtitle}</div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          alignItems: 'start'
        }}>
          {/* Properties Section - 3/4 width */}
          <div style={{
            gridColumn: 'span 3',
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
              <div>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#111827',
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>Properties ({totalCount})</h2>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: 0
                  }}>Manage property details, rooms, and occupancy status</p>
              </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                <select
                  value={sortOption}
                  onChange={e => setSortOption(e.target.value as 'name' | 'latest')}
                    style={{
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                  title="Sort properties"
                >
                  <option value="latest">Latest Added</option>
                  <option value="name">Name A–Z</option>
                </select>
                  <button 
                    onClick={() => fetchProperties()} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                  >
                    <RefreshCw style={{ width: '1rem', height: '1rem' }} />
                  Refresh
                </button>
                  <button 
                    onClick={() => router.push('/properties/add')} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#16a34a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                  >
                    <Plus style={{ width: '1rem', height: '1rem' }} />
                  Add Property
                </button>
                </div>
              </div>
            </div>

            {properties.length === 0 ? (
              <div className="empty-properties-state">
                <div className="empty-state-content">
                  <div className="empty-state-icon">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 21h18"/>
                    <path d="M5 21V7l8-4v18"/>
                    <path d="M19 21V11l-6-4"/>
                  </svg>
                </div>
                  <h3 className="empty-state-title">No Properties Yet</h3>
                  <p className="empty-state-description">
                    Start building your property portfolio by adding your first property.
                    <br />
                    Manage tenants, rooms, and rental income all in one place.
                  </p>
                  <div className="empty-state-actions">
                    <button onClick={() => router.push('/properties/add')} className="btn btn-primary">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14"/>
                      </svg>
                  Add Your First Property
                </button>
                    <button onClick={() => router.push('/inventory')} className="btn btn-secondary">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9,22 9,12 15,12 15,22"/>
                      </svg>
                      View Inventory
                </button>
                  </div>
                  <div className="empty-state-help">
                    <div className="help-cards">
                      <div className="help-card">
                        <h4>🏠 Property Types</h4>
                        <p>Add houses, apartments, condos, or commercial properties to your portfolio.</p>
                      </div>
                      <div className="help-card">
                        <h4>👥 Tenant Management</h4>
                        <p>Track occupancy, collect rent, and manage tenant relationships easily.</p>
                      </div>
                      <div className="help-card">
                        <h4>📊 Analytics</h4>
                        <p>Monitor performance, occupancy rates, and revenue across all properties.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                padding: '1.5rem',
                overflowX: 'auto'
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse'
                }}>
                    <thead>
                      <tr>
                      <th style={{
                        textAlign: 'left',
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '1px solid #e5e7eb'
                      }}>Property</th>
                      <th style={{
                        textAlign: 'left',
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '1px solid #e5e7eb'
                      }}>Address</th>
                      <th style={{
                        textAlign: 'left',
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '1px solid #e5e7eb'
                      }}>Rooms</th>
                      <th style={{
                        textAlign: 'center',
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '1px solid #e5e7eb'
                      }}>Occupancy</th>
                      <th style={{
                        textAlign: 'center',
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '1px solid #e5e7eb'
                      }}>Effective Rent</th>
                      <th style={{
                        textAlign: 'center',
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '1px solid #e5e7eb'
                      }}>Security Deposit</th>
                      <th style={{
                        textAlign: 'center',
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '1px solid #e5e7eb'
                      }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {properties.map((property) => {
                        const stats = getPropertyStats(property);
                        
                        return (
                          <tr 
                            key={property.id}
                          style={{
                            borderBottom: '1px solid #f3f4f6'
                          }}
                        >
                          <td style={{
                            textAlign: 'left',
                            padding: '0.75rem',
                            borderBottom: '1px solid #f3f4f6'
                          }}>
                            <div 
                                onClick={() => router.push(`/properties/${property.id}`)}
                              style={{ 
                                cursor: 'pointer',
                                fontWeight: '600',
                                color: '#111827',
                                marginBottom: '0.25rem'
                              }}
                              >
                                {property.name}
                              </div>
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#6b7280'
                            }}>{property.property_type}</div>
                            </td>
                          <td style={{
                            textAlign: 'left',
                            padding: '0.75rem',
                            borderBottom: '1px solid #f3f4f6',
                            color: '#374151'
                          }}>{property.full_address}</td>
                          <td style={{
                            textAlign: 'left',
                            padding: '0.75rem',
                            borderBottom: '1px solid #f3f4f6'
                          }}>
                            <div>
                                {stats.isDetailLoaded ? (
                                  <>
                                  <div style={{
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    color: '#111827',
                                    marginBottom: '0.125rem'
                                  }}>{stats.totalRooms} total</div>
                                  <div style={{
                                    fontSize: '0.75rem',
                                    color: '#6b7280'
                                  }}>{stats.vacantRooms} vacant</div>
                                  </>
                                ) : (
                                <div>
                                  <div style={{
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    color: '#111827',
                                    marginBottom: '0.125rem'
                                  }}>{stats.totalRooms} total</div>
                                  <div style={{
                                    fontSize: '0.75rem',
                                    color: '#9ca3af'
                                  }}>Loading...</div>
                                  </div>
                                )}
                              </div>
                            </td>
                          <td style={{
                            textAlign: 'center',
                            padding: '0.75rem',
                            borderBottom: '1px solid #f3f4f6'
                          }}>
                              {stats.isDetailLoaded ? (
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                              <span className={`status-badge ${
                                stats.occupancyRate < 50 ? 'low' : 
                                stats.occupancyRate < 80 ? 'good' : 'excellent'
                              }`}>
                                {stats.occupancyRate < 50 ? 'Low' : 
                                 stats.occupancyRate < 80 ? 'Good' : 'Excellent'} ({stats.occupancyRate}%)
                              </span>
                            </div>
                              ) : (
                                <span className="status-badge loading">Loading...</span>
                              )}
                            </td>
                          <td style={{
                            textAlign: 'center',
                            padding: '0.75rem',
                            borderBottom: '1px solid #f3f4f6'
                          }}>
                              {property.effective_rent !== undefined && property.effective_rent !== null ? `$${property.effective_rent}` : '-'}
                            </td>
                          <td style={{
                            textAlign: 'center',
                            padding: '0.75rem',
                            borderBottom: '1px solid #f3f4f6'
                          }}>
                              {property.effective_security_deposit !== undefined && property.effective_security_deposit !== null ? `$${property.effective_security_deposit}` : '-'}
                            </td>
                          <td style={{
                            textAlign: 'center',
                            padding: '0.75rem',
                            borderBottom: '1px solid #f3f4f6'
                          }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                                <div>
                                  <button 
                                    onClick={() => router.push(`/properties/${property.id}`)} 
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      padding: '0.5rem 0.75rem',
                                      backgroundColor: '#2563eb',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '6px',
                                      fontSize: '0.875rem',
                                      fontWeight: '500',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                                  >
                                    Manage
                                      </button>
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
            )}
          </div>

          {/* Quick Actions Section - 1/4 width */}
          <div style={{
            gridColumn: 'span 1',
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            height: 'fit-content',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#111827',
                margin: 0,
                marginBottom: '0.25rem'
              }}>Quick Actions</h2>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                margin: 0
              }}>Frequently used actions</p>
            </div>
            
            <div style={{
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {[
                {
                  title: 'Add Property',
                  subtitle: 'Register New Property',
                  icon: Plus,
                  bgColor: '#eff6ff',
                  iconColor: '#2563eb',
                  action: () => router.push('/properties/add')
                },
                {
                  title: 'Review Applications',
                  subtitle: 'Process Tenant Applications',
                  icon: FileText,
                  bgColor: '#f0fdf4',
                  iconColor: '#16a34a',
                  action: () => router.push('/applications')
                },
                {
                  title: 'Manage Tenants',
                  subtitle: 'View and Manage Tenants',
                  icon: Users,
                  bgColor: '#fff7ed',
                  iconColor: '#ea580c',
                  action: () => router.push('/tenants')
                },
                {
                  title: 'Generate Reports',
                  subtitle: 'Create Financial Reports',
                  icon: Download,
                  bgColor: '#faf5ff',
                  iconColor: '#9333ea',
                  action: downloadPropertiesReport
                }
              ].map((action, index) => (
                <div key={index}
                  onClick={action.action}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    backgroundColor: action.bgColor,
                    borderRadius: '8px',
                    border: `1px solid ${action.bgColor}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <action.icon style={{ width: '1.25rem', height: '1.25rem', color: action.iconColor }} />
                </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#111827',
                      margin: 0,
                      marginBottom: '0.125rem'
                    }}>{action.title}</h3>
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      margin: 0
                    }}>{action.subtitle}</p>
                </div>
              </div>
              ))}
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
        <PropertyTenantAssignmentModal
          property={selectedPropertyForAssign}
          isOpen={showTenantAssignModal}
          onClose={handleCloseTenantAssignModal}
          onSave={handleTenantAssignmentSave}
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

        /* Enhanced Empty State */
        .empty-properties-state {
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

        /* Lazy loading and pagination styles */
        .scroll-sentinel {
          padding: 20px;
          text-align: center;
        }

        .loading-more {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #6b7280;
          font-size: 14px;
        }

        .loading-spinner-small {
          width: 20px;
          height: 20px;
          border: 2px solid #e5e7eb;
          border-top-color: #4f46e5;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .end-of-list {
          color: #9ca3af;
          font-size: 14px;
          font-style: italic;
        }

        .rooms-loading {
          font-size: 12px;
          color: #9ca3af;
          font-style: italic;
        }

        .loading-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .status-badge.loading {
          background: #f3f4f6;
          color: #9ca3af;
          font-style: italic;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
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

        /* Dark mode dropdown styles */
        :global(.dark-mode) .dropdown-menu {
          background: #1a1a1a !important;
          border-color: #333333 !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
        }

        :global(.dark-mode) .dropdown-item {
          color: #e2e8f0 !important;
        }

        :global(.dark-mode) .dropdown-item:hover {
          background-color: #2a2a2a !important;
        }

        :global(.dark-mode) .dropdown-item svg {
          color: #9ca3af !important;
        }

        /* Action Buttons */
        .action-buttons {
          display: flex;
          gap: 4px;
          justify-content: center;
          align-items: center;
        }

        .dropdown-container {
          position: relative;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          min-width: 160px;
          padding: 4px 0;
          margin-top: 4px;
        }

        .dropdown-item {
          width: 100%;
          padding: 8px 12px;
          border: none;
          background: none;
          text-align: left;
          cursor: pointer;
          font-size: 14px;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background-color 0.2s ease;
        }

        .dropdown-item:hover {
          background-color: #f3f4f6;
        }

        .dropdown-item svg {
          width: 16px;
          height: 16px;
          color: #6b7280;
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