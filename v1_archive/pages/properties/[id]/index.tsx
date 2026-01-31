import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { apiClient } from '../../../lib/api';
import { Property, Room, Tenant, Lease } from '../../../lib/types';
import Navigation from '../../../components/Navigation';
import DashboardLayout from '../../../components/DashboardLayout';
import DataTable from '../../../components/DataTable';
import StatusBadge from '../../../components/StatusBadge';
import EmptyState from '../../../components/EmptyState';
import { formatCurrency } from '../../../lib/utils';
import PropertyTenantAssignmentModal from '../../../components/PropertyTenantAssignmentModal';
import NewListingModal from '../../../components/NewListingModal';
import { calculatePropertyRevenue, getOccupancyStats as getOccupancyStatsUtil, formatRevenue } from '../../../lib/revenueCalculator';
import RentTypeConversionWizard from '../../../components/RentTypeConversionWizard';
import RoomCountEditor from '../../../components/RoomCountEditor';
import RoomDeletionModal from '../../../components/RoomDeletionModal';
import EditPropertyModal from '../../../components/EditPropertyModal';
import EditRoomModal from '../../../components/EditRoomModal';
import ApplicationDetailModal from '../../../components/ApplicationDetailModal';
import StagedImage from '../../../components/StagedImage';
import { 
  ArrowLeft, 
  Building, 
  Home, 
  Users, 
  DollarSign, 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  FileText, 
  List,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Settings,
  RefreshCw,
  MoreHorizontal,
  Wand2,
  X,
  Check,
  Loader,
  ChevronDown,
  ExternalLink,
  Download,
  RotateCcw
} from 'lucide-react';
import { getMediaUrl } from '../../../lib/utils';
import JSZip from 'jszip';

// Small helper component for labeled values in the Property Details section
const DetailItem = ({ label, value }: { label: string; value: any }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280' }}>{label}</div>
    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#111827' }}>{value ?? '—'}</div>
  </div>
);

export default function PropertyDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [property, setProperty] = useState<Property | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedRoomForAssignment, setSelectedRoomForAssignment] = useState<Room | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showListingModal, setShowListingModal] = useState(false);
  const [showListingFlow, setShowListingFlow] = useState(false);
  const [availableFrom, setAvailableFrom] = useState<string>('');
  const [selectedRoomsForListing, setSelectedRoomsForListing] = useState<number[]>([]);
  const [creatingListing, setCreatingListing] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [listingLoading, setListingLoading] = useState(false);
  const [listingSuccess, setListingSuccess] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<{ id: number; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeHistoryTab, setActiveHistoryTab] = useState<'tenant' | 'rent' | 'price'>('tenant');
  const [propertyAssignmentModalOpen, setPropertyAssignmentModalOpen] = useState(false);
  const [isNewApplicationModalOpen, setIsNewApplicationModalOpen] = useState(false);
  const [conversionWizardOpen, setConversionWizardOpen] = useState(false);
  const [roomCountEditorOpen, setRoomCountEditorOpen] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [showEditPropertyModal, setShowEditPropertyModal] = useState(false);
  const [showEditRoomModal, setShowEditRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isTenantDetailModalOpen, setIsTenantDetailModalOpen] = useState(false);
  const [selectedTenantForDetail, setSelectedTenantForDetail] = useState<any>(null);
  const [selectedApplicationForDetail, setSelectedApplicationForDetail] = useState<any>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [isStaging, setIsStaging] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [propertyListings, setPropertyListings] = useState<any[]>([]);
  const [showManageListingDropdown, setShowManageListingDropdown] = useState(false);
  const [showEditListingModal, setShowEditListingModal] = useState(false);
  const [editingListing, setEditingListing] = useState<any>(null);
  const [loadingListingForEdit, setLoadingListingForEdit] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  // Store staged images separately - keyed by image index
  const [stagedImages, setStagedImages] = useState<{[key: number]: string}>({});
  // Track which version (original or staged) the user is viewing - keyed by image index
  const [viewPreferences, setViewPreferences] = useState<{[key: number]: boolean}>({});
  // Download state
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [stagingImageIndex, setStagingImageIndex] = useState<number | null>(null);

  // Load view preferences from localStorage when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined' && id) {
      try {
        const savedPreferences = localStorage.getItem(`property-${id}-viewPreferences`);
        if (savedPreferences) {
          setViewPreferences(JSON.parse(savedPreferences));
        }
      } catch (err) {
        console.error('Failed to load view preferences from localStorage:', err);
      }
    }
  }, [id]);

  // Save view preferences to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && id && Object.keys(viewPreferences).length > 0) {
      try {
        localStorage.setItem(`property-${id}-viewPreferences`, JSON.stringify(viewPreferences));
      } catch (err) {
        console.error('Failed to save view preferences to localStorage:', err);
      }
    }
  }, [viewPreferences, id]);

  // This single useEffect handles both initial data fetching and the refresh after creation.
  useEffect(() => {
    // We wait until the router is ready and provides the `id`.
    if (id) {
      const urlParams = new URLSearchParams(window.location.search);
      const justCreated = urlParams.get('created') === 'true';

      const fetchData = () => {
      fetchPropertyData();
        // If we just created, clean the URL param to prevent re-fetching on manual refresh
        if (justCreated) {
          router.replace(`/properties/${id}`, undefined, { shallow: true });
        }
      };

      if (justCreated) {
        // Delay fetch slightly to allow for potential database replication lag
        const timer = setTimeout(fetchData, 500);
        return () => clearTimeout(timer);
      } else {
        fetchPropertyData();
      }
    }
  }, [id]); // Dependency on `id` ensures this runs when the router is ready.

  // Refresh listings when page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && id && property) {
        // Refresh listings when user comes back to the page
        const refreshListings = async () => {
          try {
            const listingsResponse = await apiClient.getListings();
            const allListings = listingsResponse.results || [];
            const propertyId = typeof id === 'string' ? parseInt(id) : id;
            const updatedPropertyListings = allListings.filter((listing: any) => {
              const listingPropertyId = typeof listing.property_ref === 'object' 
                ? listing.property_ref?.id 
                : listing.property_ref;
              return listingPropertyId === propertyId;
            });
            setPropertyListings(updatedPropertyListings);
          } catch (err) {
            console.error('Error refreshing listings on visibility change:', err);
          }
        };
        refreshListings();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [id, property]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showManageListingDropdown) {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-manage-listing-dropdown]')) {
          setShowManageListingDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showManageListingDropdown]);

  // Set default history tab based on available data
  useEffect(() => {
    if (!property) return;

    const hasPriceHistory = Array.isArray((property as any).price_history) && 
                           (property as any).price_history.length > 0;
    
    const propertyId = typeof id === 'string' ? parseInt(id) : id;
    const hasTenantHistory = leases && leases.length > 0 && 
                            leases.some((lease: any) => {
                              const leasePropertyId = typeof lease.property_ref === 'object' 
                                ? lease.property_ref?.id 
                                : lease.property_ref;
                              return leasePropertyId === propertyId;
                            });

    // If both available, default to tenant history
    if (hasPriceHistory && hasTenantHistory) {
      setActiveHistoryTab('tenant');
    }
    // If only price history available, default to price
    else if (hasPriceHistory && !hasTenantHistory) {
      setActiveHistoryTab('price');
    }
    // If only tenant history available, default to tenant
    else if (!hasPriceHistory && hasTenantHistory) {
      setActiveHistoryTab('tenant');
    }
    // Otherwise, keep default (tenant)
  }, [property, leases, id]);

  const fetchPropertyData = async () => {
    // Add guard here to prevent running with an invalid ID
    if (!id || typeof id !== 'string') {
      console.warn("fetchPropertyData called without a valid ID.");
      return;
    }

    try {
      setLoading(true);
      const propertyId = parseInt(id as string);

      console.log('Fetching data for property ID:', propertyId);

      const propertyData = await apiClient.getProperty(propertyId);
      console.log('Property data:', propertyData);
      setProperty(propertyData);
      
      // Load staged images from property data - preserve original URLs
      if (propertyData && (propertyData as any).images) {
        const staged: {[key: number]: string} = {};
        (propertyData as any).images.forEach((img: any, idx: number) => {
          // If image is an object with staged_url, store it
          if (typeof img === 'object' && img?.staged_url) {
            staged[idx] = img.staged_url;
          }
        });
        setStagedImages(staged);
      }

      const roomsData = await apiClient.getPropertyRooms(propertyId);
      console.log('Rooms data:', roomsData);
      setRooms(roomsData);

      const tenantsResponse = await apiClient.getTenants();
      setTenants(tenantsResponse.results || []);
      
      const leasesResponse = await apiClient.getLeases();
      setLeases(leasesResponse.results || []);

      // Fetch listings for this property
      try {
        const listingsResponse = await apiClient.getListings();
        const allListings = listingsResponse.results || [];
        console.log('All listings:', allListings.map((l: any) => ({ id: l.id, property_ref: l.property_ref, title: l.title })));
        const propertyListings = allListings.filter((listing: any) => {
          // Handle both number and object property_ref
          const listingPropertyId = typeof listing.property_ref === 'object' 
            ? listing.property_ref?.id 
            : listing.property_ref;
          return listingPropertyId === propertyId;
        });
        console.log(`Found ${propertyListings.length} listings for property ${propertyId}:`, propertyListings.map((l: any) => ({ id: l.id, title: l.title })));
        setPropertyListings(propertyListings);
      } catch (err) {
        console.error('Error fetching listings:', err);
        // Don't fail the whole page if listings fail
      }

    } catch (err: any) {
      console.error('Error fetching property data:', err);
      setError(err.message || 'Failed to fetch property data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch payment history for the property
  const fetchPaymentHistory = async () => {
    if (!property) return;
    
    setPaymentLoading(true);
    try {
      const response = await apiClient.getPaymentHistory({ page_size: 50 });
      // Filter payments for this specific property
      const propertyPayments = response.payments?.filter(payment => 
        payment.property_name === property.name
      ) || [];
      setPaymentHistory(propertyPayments);
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
      setPaymentHistory([]);
    } finally {
      setPaymentLoading(false);
    }
  };

  // Fetch payment history when property is loaded or rent tab is selected
  useEffect(() => {
    if (property && activeHistoryTab === 'rent') {
      fetchPaymentHistory();
    }
  }, [property, activeHistoryTab]);

  const getTenantName = (tenantId: number) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? tenant.full_name : `Tenant ${tenantId}`;
  };

  // Render payment history row
  const renderPaymentHistoryRow = (payment: any) => {
  return (
      <tr key={payment.id}>
        <td>
          <div className="tenant-info">
            <div className="tenant-avatar">
              {payment.tenant_name ? payment.tenant_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'UK'}
            </div>
            <span>{payment.tenant_name || 'Unknown Tenant'}</span>
          </div>
        </td>
        <td>{formatCurrency(payment.amount_dollars || 0)}</td>
        <td>{new Date(payment.payment_date).toLocaleDateString('en-US', { 
          year: 'numeric', month: 'short', day: 'numeric' 
        })}</td>
        <td>
          {payment.rent_period_start ? 
            `${new Date(payment.rent_period_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : 
            'N/A'
          }
        </td>
        <td>
          <StatusBadge
            status={payment.status === 'succeeded' ? 'active' : 
                   payment.status === 'pending' ? 'pending' : 'failed'}
            text={payment.status === 'succeeded' ? 'Paid' : 
                  payment.status === 'pending' ? 'Pending' : 'Failed'}
          />
        </td>
        <td>{payment.description || 'Rent Payment'}</td>
      </tr>
    );
  };

  const getRoomName = (roomId: number) => {
    const room = rooms.find(r => r.id === roomId);
    return room ? room.name : `Room #${roomId}`;
  };

  const getRoomOccupancy = (roomId: number) => {
    const relevantLease = leases.find(lease => 
      lease.room === roomId && (lease.status === 'active' || lease.status === 'draft')
    );
    return relevantLease;
  };

  const getPropertyOccupancyStats = () => {
    if (!property) return { totalRooms: 0, occupiedRooms: 0, vacantRooms: 0, occupancyRate: '0.0' };
    
    // For per_property rent type, don't count "rooms" - it's about the whole property
    if (property.rent_type === 'per_property') {
      const propertyLease = getPropertyLevelLease();
      const isOccupied = propertyLease && propertyLease.status === 'active';
      
      return {
        totalRooms: 1, // The whole property counts as 1 unit
        occupiedRooms: isOccupied ? 1 : 0,
        vacantRooms: isOccupied ? 0 : 1,
        occupancyRate: isOccupied ? '100.0' : '0.0'
      };
    }
    
    // For per_room rent type, use backend occupancy data instead of counting leases
    const totalRooms = rooms.length || property.total_rooms || 0;
    const occupiedRooms = rooms.reduce((sum, room) => sum + (room.current_occupancy || 0), 0);
    const vacantRooms = Math.max(0, totalRooms - occupiedRooms);
    const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : '0.0';
    
    return {
      totalRooms,
      occupiedRooms,
      vacantRooms,
      occupancyRate
    };
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTotalRevenue = () => {
    if (!property) return 0;
    
    const calculation = calculatePropertyRevenue(property, leases, rooms);
    return calculation.monthlyRevenue;
  };

  const getPropertyLevelLease = () => {
    if (!property) return null;
    const today = new Date();
    return leases.find(l => {
      const isProp = l.property_ref === property.id && (!l.room || l.room === 0);
      if (!isProp) return false;
      const leaseEnd = l.end_date ? new Date(l.end_date) : undefined;
      const stillValid = !leaseEnd || leaseEnd >= today;
      return stillValid;
    });
  };

  const handleAssignTenant = (room: Room) => {
    setSelectedRoomForAssignment(room);
    setAssignmentModalOpen(true);
  };

  const handleAssignmentModalClose = () => {
    setAssignmentModalOpen(false);
    setSelectedRoomForAssignment(null);
  };

  const handleAssignmentModalSave = async () => {
    await fetchPropertyData();
    setAssignmentModalOpen(false);
    setSelectedRoomForAssignment(null);
  };

  const handleConversionComplete = async (updatedProperty: Property) => {
    setProperty(updatedProperty);
    await fetchPropertyData();
    setConversionWizardOpen(false);
  };

  const handleRoomCountUpdate = async (updatedRooms: Room[]) => {
    setRooms(updatedRooms);
    await fetchPropertyData();
    setRoomCountEditorOpen(false);
  };

  // Get the first active listing for this property
  const getFirstListing = () => {
    if (!propertyListings || propertyListings.length === 0 || !property) return null;
    
    // Filter listings that match this property
    const propertyId = property.id;
    const matchingListings = propertyListings.filter((l: any) => {
      const listingPropertyId = typeof l.property_ref === 'object' 
        ? l.property_ref?.id 
        : l.property_ref;
      return listingPropertyId === propertyId;
    });
    
    if (matchingListings.length === 0) return null;
    
    // Prefer active listings, otherwise return the first one
    const activeListing = matchingListings.find((l: any) => l.status === 'active' || l.is_active);
    return activeListing || matchingListings[0];
  };

  const handleCreateListing = () => {
    const existingListing = getFirstListing();
    if (existingListing) {
      // If listing exists, open the public listing page in a new tab
      window.open(`/listings/${existingListing.public_slug || existingListing.id}`, '_blank');
    } else {
      // Otherwise, show create flow
      setShowListingFlow(true);
      // Initialize available_from to today's date
      const today = new Date().toISOString().split('T')[0];
      setAvailableFrom(today);
      // Initialize selected rooms to all available rooms if per_room
      if (property?.rent_type === 'per_room') {
        setSelectedRoomsForListing(rooms.map(r => r.id));
      }
    }
  };

  const handleViewTenantDetails = async (tenant: any) => {
    try {
      // Fetch tenant's applications to show in detail modal
      const applications = await apiClient.getTenantApplications(tenant.id);
      if (applications && applications.length > 0) {
        setSelectedApplicationForDetail(applications[0]);
        setSelectedTenantForDetail(tenant);
        setIsTenantDetailModalOpen(true);
      } else {
        alert('No application found for this tenant.');
      }
    } catch (error: any) {
      console.error('Failed to fetch tenant applications:', error);
      alert('Could not load tenant details.');
    }
  };

  const handleEditListing = async () => {
    const existingListing = getFirstListing();
    if (!existingListing) return;
    
    setLoadingListingForEdit(true);
    setShowManageListingDropdown(false);
    
    try {
      // Fetch full listing data for editing
      const fullListingData = await apiClient.getListing(existingListing.id);
      setEditingListing(fullListingData);
      setShowEditListingModal(true);
    } catch (err: any) {
      console.error('Failed to fetch listing for editing:', err);
      setError(err.message || 'Failed to load listing for editing.');
    } finally {
      setLoadingListingForEdit(false);
    }
  };

  const handleEditListingSuccess = async (refreshedListing?: any) => {
    setShowEditListingModal(false);
    setEditingListing(null);
    // Refresh property data to get updated images (including staged images)
    if (property?.id) {
      try {
        const refreshedProperty = await apiClient.getProperty(property.id);
        setProperty(refreshedProperty);
        console.log('✅ Refreshed property data after listing edit');
      } catch (err) {
        console.error('Failed to refresh property data:', err);
      }
    }
    // Refresh listings to get updated data (including newly uploaded media)
    try {
      const listingsResponse = await apiClient.getListings();
      const allListings = listingsResponse.results || [];
      const propertyId = property?.id;
      if (propertyId) {
        const updatedPropertyListings = allListings.filter((listing: any) => {
          const listingPropertyId = typeof listing.property_ref === 'object' 
            ? listing.property_ref?.id 
            : listing.property_ref;
          return listingPropertyId === propertyId;
        });
        setPropertyListings(updatedPropertyListings);
      }
    } catch (err) {
      console.error('Error refreshing listings after edit:', err);
    }
    await fetchPropertyData();
  };

  // Upload property media (images/videos)
  const handleUploadPropertyMedia = async (files: FileList | null) => {
    if (!property || !files || files.length === 0) return;
    try {
      setUploadingMedia(true);
      const fileArr = Array.from(files);
      await apiClient.uploadPropertyMedia(property.id, fileArr);
      // Refresh property data to get new images/videos
      await fetchPropertyData();
    } catch (e) {
      console.error('Failed to upload property media', e);
      alert('Failed to upload files. Please try again.');
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Download single image
  const handleDownloadImage = async (imageUrl: string, index: number) => {
    try {
      const mediaUrl = getMediaUrl(imageUrl);
      const response = await fetch(mediaUrl, {
        mode: 'cors',
        credentials: 'omit'
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const propertyName = property?.name || `property-${property?.id || 'unknown'}`;
      const sanitizedName = propertyName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      link.download = `${sanitizedName}-image-${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
      alert('Failed to download image. Please try again.');
    }
  };

  // Download all images (original + staged) as ZIP
  const handleDownloadAll = async () => {
    if (!property || !(property as any).images || (property as any).images.length === 0) return;
    
    setIsDownloadingAll(true);
    try {
      const zip = new JSZip();
      const imagePromises: Promise<void>[] = [];
      const images = (property as any).images;
      const propertyName = property?.name || `property-${property?.id || 'unknown'}`;
      const sanitizedName = propertyName.replace(/[^a-z0-9]/gi, '-').toLowerCase();

      images.forEach((img: any, idx: number) => {
        const imageNumber = idx + 1;
        const originalUrl = typeof img === 'string' ? img : (img?.originalUrl || img?.url || '');
        
        // Add original image
        imagePromises.push(
          (async () => {
            try {
              const mediaUrl = getMediaUrl(originalUrl);
              const response = await fetch(mediaUrl, {
                mode: 'cors',
                credentials: 'omit'
              });
              if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.status}`);
              }
              const blob = await response.blob();
              let extension = 'jpg';
              if (blob.type) {
                if (blob.type.includes('png')) extension = 'png';
                else if (blob.type.includes('webp')) extension = 'webp';
                else if (blob.type.includes('gif')) extension = 'gif';
                else if (blob.type.includes('jpeg')) extension = 'jpg';
              }
              zip.file(`${sanitizedName}-image-${imageNumber}-original.${extension}`, blob);
            } catch (error) {
              console.error(`Failed to fetch original image ${imageNumber}:`, error);
            }
          })()
        );

        // Add staged image if it exists
        const stagedUrl = stagedImages[idx];
        if (stagedUrl) {
          imagePromises.push(
            (async () => {
              try {
                let blob: Blob;
                if (stagedUrl.startsWith('data:image/')) {
                  const response = await fetch(stagedUrl);
                  if (!response.ok) throw new Error(`Failed to convert base64 image: ${response.status}`);
                  blob = await response.blob();
                } else {
                  const mediaUrl = getMediaUrl(stagedUrl);
                  const response = await fetch(mediaUrl, {
                    mode: 'cors',
                    credentials: 'omit'
                  });
                  if (!response.ok) {
                    throw new Error(`Failed to fetch staged image: ${response.status}`);
                  }
                  blob = await response.blob();
                }
                let extension = 'jpg';
                if (blob.type) {
                  if (blob.type.includes('png')) extension = 'png';
                  else if (blob.type.includes('webp')) extension = 'webp';
                  else if (blob.type.includes('gif')) extension = 'gif';
                  else if (blob.type.includes('jpeg')) extension = 'jpg';
                }
                zip.file(`${sanitizedName}-image-${imageNumber}-staged.${extension}`, blob);
              } catch (error) {
                console.error(`Failed to fetch staged image ${imageNumber}:`, error);
              }
            })()
          );
        }
      });

      await Promise.all(imagePromises);
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${sanitizedName}-images-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download all images:', error);
      alert('Failed to download images. Please try again.');
    } finally {
      setIsDownloadingAll(false);
    }
  };

  // Get staged images from property (only kept ones) - use stagedImages state
  const getStagedImages = () => {
    if (!property || !(property as any).images) return [];
    const images = (property as any).images;
    // Return staged URLs from state, preserving original order
    return images
      .map((img: any, idx: number) => {
        // Use staged URL if available, otherwise original
        if (stagedImages[idx]) {
          return stagedImages[idx];
        }
        const originalUrl = typeof img === 'string' ? img : (img?.originalUrl || img?.url);
        return originalUrl;
      })
      .filter((url: string) => url && url.trim() !== '');
  };

  const handleCreateListingSubmit = async () => {
    if (!property) return;
    
    if (!availableFrom) {
      setError('Please select an available from date.');
      return;
    }

    if (property.rent_type === 'per_room' && selectedRoomsForListing.length === 0) {
      setError('Please select at least one room.');
      return;
    }

    setCreatingListing(true);
    setError(null);

    try {
      // Get staged images
      const stagedImages = getStagedImages();
      
      // Get description from property
      const description = (property as any).description || '';
      
      // Build listing data
      const listingData: any = {
        property_ref: property.id,
        title: property.name,
        description: description,
        listing_type: property.rent_type === 'per_room' ? 'rooms' : 'whole_property',
        available_from: availableFrom,
        application_form_config: {
          steps: {
            basic_info: { enabled: true, mandatory: true },
            contact_info: { enabled: true, mandatory: true }
          },
          global_settings: {
            application_fee: 0,
            minimum_income_ratio: 3,
            required_documents: [],
            allow_save_and_continue: true,
            mobile_optimized: true
          }
        }
      };

      // Add rooms if per_room
      if (property.rent_type === 'per_room') {
        listingData.available_rooms = selectedRoomsForListing;
      }

      // Create listing
      const newListing = await apiClient.createListing(listingData);
      
      // Upload images if we have staged images
      if (stagedImages.length > 0 && newListing.id) {
        // Note: Image upload would happen here via separate API call if needed
        // For now, images are stored in property and can be referenced
      }

      // Immediately add the new listing to state so button updates right away
      setPropertyListings(prev => {
        // Check if listing already exists (shouldn't, but just in case)
        const exists = prev.some((l: any) => l.id === newListing.id);
        if (!exists) {
          return [...prev, { ...newListing, property_ref: property.id }];
        }
        return prev;
      });

      // Refresh listings to update the button BEFORE redirecting
      try {
        const listingsResponse = await apiClient.getListings();
        const allListings = listingsResponse.results || [];
        const propertyId = property.id;
        const updatedPropertyListings = allListings.filter((listing: any) => {
          // Handle both number and object property_ref
          const listingPropertyId = typeof listing.property_ref === 'object' 
            ? listing.property_ref?.id 
            : listing.property_ref;
          return listingPropertyId === propertyId;
        });
        console.log(`Refreshed: Found ${updatedPropertyListings.length} listings for property ${propertyId}`);
        setPropertyListings(updatedPropertyListings);
      } catch (err) {
        console.error('Error refreshing listings:', err);
        // State already updated with new listing above, so button will still show correctly
      }
      
      // Update state immediately so button shows correctly if user stays on page
      setListingSuccess('Listing created successfully!');
      setShowListingFlow(false);
      setCreatingListing(false); // Hide loading overlay immediately
      
      // Open in new tab immediately
      window.open(`/listings/${newListing.public_slug || newListing.id}`, '_blank');
    } catch (err: any) {
      console.error('Failed to create listing:', err);
      setError(err.message || 'Failed to create listing. Please try again.');
      setCreatingListing(false);
    }
  };

  const handleDeleteRoom = (roomId: number, roomName: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      setSelectedRoom(room);
    setShowDeleteModal(true);
    }
  };

  const handleDeleteComplete = async () => {
    try {
      await fetchPropertyData();
      setSelectedRoom(null);
      setError(null);
    } catch (err: any) {
      console.error('Failed to refresh data after room deletion:', err);
      setError(err.message || 'Failed to refresh data');
    }
  };

  const cancelDeleteRoom = () => {
    setShowDeleteModal(false);
    setSelectedRoom(null);
    setDeleteLoading(false);
  };

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const submitListing = async () => {
    if (!property) {
      setError('Property not loaded.');
      return;
    }
    if (selectedPlatforms.length === 0) {
      setError('Please select at least one platform.');
      return;
    }
    setListingLoading(true);
    setError(null);
        setListingSuccess(null);
    try {
      await apiClient.createListing({ 
        property_ref: property.id,
        title: `${property.name} - Room Listing`,
        description: `Available rooms in ${property.name}`,
        listing_type: 'rooms',
        available_rooms: selectedRoom ? [selectedRoom.id] : [],
        application_form_config: {
          steps: {
            basic_info: { enabled: true, mandatory: true },
            contact_info: { enabled: true, mandatory: true }
          }
        }
      });
      setListingSuccess(`Successfully listed on ${selectedPlatforms.join(', ')}.`);
    } catch (err: any) {
      setError(err.message || 'Failed to create listing.');
    } finally {
      setListingLoading(false);
    }
  };

  const openPropertyAssignment = () => {
    console.log('openPropertyAssignment called', { property: property, rent_type: property?.rent_type });
    if (property?.rent_type === 'per_property') {
      console.log('Opening property assignment modal');
    setPropertyAssignmentModalOpen(true);
    } else {
      console.log('Property assignment not available - rent_type is not per_property');
    }
  };

  const closePropertyAssignment = () => setPropertyAssignmentModalOpen(false);

  const handlePropertyAssignmentSave = async () => {
    await fetchPropertyData();
    closePropertyAssignment();
  };
  
  const listingPlatforms = [
    { id: 'zumper', name: 'Zumper' },
  ];

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, fallbackUrl?: string) => {
    if (fallbackUrl && e.currentTarget.src !== fallbackUrl) {
      e.currentTarget.src = fallbackUrl;
    } else {
      // Optional: hide image or show a placeholder if both fail
      e.currentTarget.style.display = 'none';
    }
  };

  if (loading) return <DashboardLayout title="Loading"><div className="loading-state">Loading property details...</div></DashboardLayout>;
  if (error) return <DashboardLayout title="Error"><div className="error-state">{error}</div></DashboardLayout>;
  if (!property) return <DashboardLayout title="Not Found"><EmptyState title="Property Not Found" description="The property you are looking for does not exist." /></DashboardLayout>;

  const { totalRooms, occupiedRooms, vacantRooms, occupancyRate } = getPropertyOccupancyStats();
  const totalRevenue = getTotalRevenue();
  const propertyLevelLease = getPropertyLevelLease();

  const propertyHistoryLeases = showAllHistory
    ? leases
    : leases.filter(l => property && l.property_ref === property.id);

  const renderRoomRow = (rowData: any, index: number) => {
    const room = rowData as Room;
    const lease = getRoomOccupancy(room.id);
    
    // Use backend occupancy data to determine actual status
    const isActuallyOccupied = (room.current_occupancy || 0) > 0;

    return (
        <tr key={room.id} className="room-row">
            <td style={{ textAlign: 'left' }}>
                <button 
                  onClick={() => {
                    setEditingRoom(room);
                    setShowEditRoomModal(true);
                  }}
                  className="room-link"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                >
                    <div className="room-name">{room.name}</div>
                    <div className="room-type">{room.room_type}</div>
                </button>
      </td>
            <td style={{ textAlign: 'center' }}>
                {isActuallyOccupied ? (
                  <StatusBadge
                    status="occupied"
                    text="Occupied"
                  />
                ) : lease?.status === 'draft' ? (
                  <StatusBadge
                    status="draft"
                    text="Draft Lease"
                  />
                ) : (
                  <StatusBadge status="vacant" text="Vacant" />
                )}
      </td>
            <td style={{ textAlign: 'center' }}>
                {isActuallyOccupied && lease ? (
                    <div className="tenant-info" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <span className="tenant-avatar" style={{ backgroundColor: '#E0E7FF' }}>
                            {getTenantName(lease.tenant).charAt(0)}
              </span>
                        <Link href={`/tenants/${lease.tenant}`} className="tenant-link">
                            {getTenantName(lease.tenant)}
                        </Link>
            </div>
                ) : lease?.status === 'draft' ? (
                    <div className="tenant-info draft" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <span className="tenant-avatar" style={{ backgroundColor: '#FEF3C7' }}>
                            {getTenantName(lease.tenant).charAt(0)}
                        </span>
                        <Link href={`/tenants/${lease.tenant}`} className="tenant-link">
                            {getTenantName(lease.tenant)} (Draft)
                        </Link>
          </div>
        ) : (
                    <span className="unassigned">-</span>
        )}
      </td>
            <td style={{ textAlign: 'center' }}>{lease ? formatCurrency(lease.monthly_rent) : '-'}</td>
            <td style={{ textAlign: 'center' }}>
                <div className="action-buttons">
                    <button 
                        onClick={() => handleAssignTenant(room)} 
                        className="btn-action assign"
                        title="Assign Tenant"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                    </button>
                    <button 
                        onClick={() => {
                          setEditingRoom(room);
                          setShowEditRoomModal(true);
                        }}
                        className="btn-action edit"
                        title="Edit Room"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button 
                        onClick={() => handleDeleteRoom(room.id, room.name)} 
                        className="btn-action delete"
                        title="Delete Room"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3,6 5,6 21,6"/>
                            <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1-2,2h4a2,2,0,0,1,2,2V6"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                    </button>
        </div>
            </td>
        </tr>
    );
  };
  
  const renderTenantHistoryRow = (lease: Lease, index: number) => (
    <tr key={lease.id} className="history-row">
      <td>
        <Link href={`/tenants/${lease.tenant}`} className="tenant-link">
          {getTenantName(lease.tenant)}
        </Link>
      </td>
      <td>
        {lease.room ? (
          <button 
            onClick={() => {
              const room = rooms.find(r => r.id === lease.room);
              if (room) {
                setEditingRoom(room);
                setShowEditRoomModal(true);
              }
            }}
            className="room-link"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', textDecoration: 'underline' }}
          >
            {getRoomName(lease.room)}
          </button>
        ) : (
          '— Whole Property —'
        )}
      </td>
      <td>{formatDate(lease.start_date)}</td>
      <td>{formatDate(lease.end_date)}</td>
      <td>
        <StatusBadge status={lease.status as 'active' | 'inactive' | 'ended' || 'active'} />
      </td>
    </tr>
  );

  // Dynamic quick actions based on occupancy status
  const getQuickActions = () => {
    const { occupiedRooms, totalRooms } = getPropertyOccupancyStats();
    const hasActiveTenants = occupiedRooms > 0;
    const hasVacantRooms = occupiedRooms < totalRooms;
    const isPerRoom = property?.rent_type === 'per_room';
    const isPerProperty = property?.rent_type === 'per_property';
    
    // Define all possible actions
    const allActions = {
      // Listing/Marketing actions (high priority when vacant)
      createListing: {
        title: getFirstListing() ? 'View Listing' : 'Create Listing',
        subtitle: getFirstListing() ? 'View public listing page' : (isPerProperty ? 'List entire property' : 'List available rooms'),
        icon: (
          getFirstListing() ? (
            <Eye width={20} height={20} />
          ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9,22 9,12 15,12 15,22"/>
          </svg>
          )
        ),
        color: 'orange',
        onClick: handleCreateListing,
        priority: hasVacantRooms ? 1 : 8,
        condition: false
      },
      viewListings: {
        title: 'View Listings',
        subtitle: 'See active listings',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
        ),
        color: 'blue',
        onClick: () => router.push(`/listings?property=${property.id}`),
        priority: 2
      },
      // Application management actions
      viewApplications: {
        title: 'View Applications',
        subtitle: 'Review tenant applications',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        ),
        color: 'purple',
        onClick: () => router.push('/applications'),
        priority: 3
      },
      // Tenant management actions (high priority when tenants are active)
      manageTenants: {
        title: 'Manage Tenants',
        subtitle: 'View tenant details',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        ),
        color: 'blue',
        onClick: () => router.push('/tenants'),
        priority: hasActiveTenants ? 4 : 7
      },
      manageInventory: {
        title: 'Manage Inventory',
        subtitle: 'Track property items',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="9" y1="3" x2="9" y2="21"/>
            <line x1="15" y1="3" x2="15" y2="21"/>
          </svg>
        ),
        color: 'blue',
        onClick: () => router.push('/inventory'),
        priority: hasActiveTenants ? 5 : 8
      },
      // Room management actions (ONLY for per_room properties)
      manageRooms: {
        title: rooms.length === 0 ? 'Add Multiple Rooms' : 'Manage Rooms',
        subtitle: rooms.length === 0 ? 'Create room structure' : 'Edit room layout',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
        ),
        color: 'green',
        onClick: () => setRoomCountEditorOpen(true),
        priority: 6,
        condition: isPerRoom // Only show for per_room properties
      },
      addRoom: {
        title: 'Add Single Room',
        subtitle: 'Create a new room',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14m-7-7h14"/>
          </svg>
        ),
        color: 'green',
        onClick: () => router.push(`/properties/${property?.id}/add-room`),
        priority: isPerRoom ? 7 : 10,
        condition: isPerRoom // Only show for per_room properties
      },
      // Communication actions
      communicationLog: {
        title: 'Communication Log',
        subtitle: 'View messages & history',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        ),
        color: 'blue',
        onClick: () => router.push('/communication-log'),
        priority: 9
      },
      // Conversion actions (low priority when tenants are active, not available for occupied properties)
      convertRentType: {
        title: 'Convert Rent Type',
        subtitle: `Switch to ${isPerRoom ? 'per-property' : 'per-room'} model`,
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <path d="M20 8v6"/>
            <path d="M23 11h-6"/>
          </svg>
        ),
        color: 'purple',
        onClick: () => setConversionWizardOpen(true),
        priority: hasActiveTenants ? 15 : 11,
        condition: !hasActiveTenants // Only show when no active tenants
      }
    };

    // Only show three actions: View Listings, View Applications, Manage Tenants
    return [allActions.viewListings, allActions.viewApplications, allActions.manageTenants];
  };

  // Dynamic header actions based on occupancy status
  const getHeaderActions = () => {
    const { occupiedRooms, totalRooms } = getPropertyOccupancyStats();
    const hasActiveTenants = occupiedRooms > 0;
    const hasVacantRooms = occupiedRooms < totalRooms;

    const actions = [];

    if (hasActiveTenants) {
      // When tenants are active, prioritize tenant management
      actions.push(
        <button key="manage-tenants" className="btn btn-primary" onClick={() => router.push('/tenants')}>
          Manage Tenants
        </button>
      );
      actions.push(
        <button key="view-leases" className="btn btn-secondary" onClick={() => router.push('/leases')}>
          View Leases
        </button>
      );
      
      // Only show listing actions if there are vacant rooms
      if (hasVacantRooms) {
        const existingListing = getFirstListing();
        actions.push(
          <button key="create-listing" className="btn btn-secondary" onClick={handleCreateListing}>
            {existingListing ? 'View Listing' : 'Create Listing'}
          </button>
        );
      }
    } else {
      // When no active tenants, prioritize marketing/listing actions
      const existingListing = getFirstListing();
      actions.push(
        <button key="create-listing" className="btn btn-primary" onClick={handleCreateListing}>
          {existingListing ? 'View Listing' : 'Create Listing'}
        </button>
      );
      actions.push(
        <button key="view-listings" className="btn btn-secondary" onClick={() => router.push(`/listings?property=${property.id}`)}>
          View Listings
        </button>
      );
    }

    // Always show edit property as last option
    actions.push(
      <Link key="edit-property" href={`/properties/${property.id}/edit`} className="btn btn-secondary">
        Edit Property
      </Link>
    );

    return actions;
  };

  return (
    <DashboardLayout title="">
      <Head>
        <title>{property?.name || 'Property Details'} - Property Details | SquareFt</title>
      </Head>
      
      <div style={{ padding: '2rem' }}>
        {/* Modern Header - Full Width */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: '2rem',
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
            justifyContent: 'space-between'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <button
                onClick={() => router.push('/properties')}
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              >
                <ArrowLeft style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />
              </button>
              <div>
                <h1 style={{
                  fontSize: '1.875rem',
                  fontWeight: '700',
                  color: '#111827',
                  margin: 0,
                  marginBottom: '0.25rem'
                }}>{property?.name || 'Loading...'}</h1>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#6b7280'
                }}>
                  <Home style={{ width: '1rem', height: '1rem' }} />
                  {property?.full_address || 'Loading address...'}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.75rem',
                  color: '#9ca3af',
                  marginTop: '0.25rem'
                }}>
                  <Building style={{ width: '0.875rem', height: '0.875rem' }} />
                  {property?.property_type || 'Property Type'}
                </div>
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
                <button 
                onClick={() => fetchPropertyData()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <RefreshCw style={{ width: '1rem', height: '1rem' }} />
                Refresh
                </button>
                <button 
                onClick={() => setShowEditPropertyModal(true)}
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
                <Edit style={{ width: '1rem', height: '1rem' }} />
                Edit Property
              </button>
              {(() => {
                const existingListing = getFirstListing();
                const hasListing = !!existingListing;
                
                if (!hasListing) {
                  return (
              <button
                      onClick={handleCreateListing}
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
                <Plus style={{ width: '1rem', height: '1rem' }} />
                Create Listing
                    </button>
                  );
                }
                
                return (
                  <div style={{ position: 'relative', zIndex: 1000 }} data-manage-listing-dropdown>
                    <button
                      onClick={() => setShowManageListingDropdown(!showManageListingDropdown)}
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
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        zIndex: 1001
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                    >
                      <Settings style={{ width: '1rem', height: '1rem' }} />
                      Manage Listing
                      <ChevronDown style={{ width: '0.875rem', height: '0.875rem' }} />
                    </button>
                    
                    {showManageListingDropdown && (
                      <>
                        <div
                          style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 999
                          }}
                          onClick={() => setShowManageListingDropdown(false)}
                        />
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          marginTop: '0.5rem',
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          minWidth: '180px',
                          zIndex: 1000,
                          overflow: 'hidden'
                        }}>
                          <button
                            onClick={() => {
                              setShowManageListingDropdown(false);
                              window.open(`/listings/${existingListing.public_slug || existingListing.id}`, '_blank');
                            }}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.75rem 1rem',
                              backgroundColor: 'white',
                              border: 'none',
                              borderBottom: '1px solid #e5e7eb',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              color: '#374151',
                              transition: 'background-color 0.2s',
                              textAlign: 'left'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          >
                            <Eye style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
                            <span>View Listing</span>
                            <ExternalLink style={{ width: '0.75rem', height: '0.75rem', color: '#9ca3af', marginLeft: 'auto' }} />
                          </button>
                          <button
                            onClick={handleEditListing}
                            disabled={loadingListingForEdit}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.75rem 1rem',
                              backgroundColor: loadingListingForEdit ? '#f3f4f6' : 'white',
                              border: 'none',
                              cursor: loadingListingForEdit ? 'not-allowed' : 'pointer',
                              fontSize: '0.875rem',
                              color: loadingListingForEdit ? '#9ca3af' : '#374151',
                              transition: 'background-color 0.2s',
                              textAlign: 'left'
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
                                <Loader style={{ width: '1rem', height: '1rem', color: '#9ca3af', animation: 'spin 1s linear infinite' }} />
                                <span>Loading...</span>
                              </>
                            ) : (
                              <>
                                <Edit style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
                                <span>Edit Listing</span>
                              </>
                            )}
                </button>
              </div>
                      </>
                    )}
                  </div>
                );
              })()}
              </div>
            </div>
          </div>

        {/* Modern Alert Banner */}
        {rooms.length === 0 && property?.rent_type === 'per_room' && (
          <div style={{
            backgroundColor: '#fef3cd',
            border: '1px solid #fbbf24',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              backgroundColor: '#f59e0b',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <AlertTriangle style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
              </div>
            <div style={{ flex: 1 }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#92400e',
                margin: 0,
                marginBottom: '0.25rem'
              }}>Setup Required</h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#92400e',
                margin: 0
              }}>This property needs rooms to be added before you can assign tenants or collect rent.</p>
                </div>
            <div style={{
              display: 'flex',
              gap: '0.5rem'
            }}>
              <button
                onClick={() => router.push(`/properties/${property?.id}/add-room`)}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#d97706'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f59e0b'}
                >
                  Add Room
                </button>
                <button 
                  onClick={() => setRoomCountEditorOpen(true)}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'transparent',
                  color: '#f59e0b',
                  border: '1px solid #f59e0b',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f59e0b';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#f59e0b';
                }}
                >
                  Add Multiple
                </button>
                </div>
                </div>
        )}

        {/* Main Content - 3:1 Grid Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '3fr 1fr',
          gap: '1.5rem',
          alignItems: 'start',
          marginBottom: '2rem'
        }}>
          {/* Left Column (2 parts): Property Details + Unit/Room Management */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Property Details Section */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#111827' }}>Property Details</h2>
              </div>

              <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
                {/* Images grid - only show if images exist */}
                {Array.isArray((property as any).images) && (property as any).images.length > 0 && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '8px' }}>
                      {/* Large primary image - using StagedImage component */}
                      {property.images && property.images.length > 0 && (() => {
                             const img = (property as any).images[selectedImageIdx];
                        if (!img) return null;
                        
                        // Get original URL - always preserve original
                        const originalUrl = typeof img === 'string' 
                          ? getMediaUrl(img) 
                          : getMediaUrl(img?.originalUrl || img?.url || '');
                        
                        // Get staged URL from state
                        const stagedUrl = stagedImages[selectedImageIdx] ? getMediaUrl(stagedImages[selectedImageIdx]) : null;
                        
                        return (
                          <div style={{ position: 'relative', width: '100%', height: '700px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb', background: '#f8fafc' }}>
                            {/* Download button - positioned dynamically based on whether image is staged */}
                            {stagingImageIndex !== selectedImageIdx && (
                              <button
                                onClick={() => {
                                  const displayUrl = viewPreferences[selectedImageIdx] && stagedUrl 
                                    ? stagedUrl 
                                    : originalUrl;
                                  handleDownloadImage(displayUrl, selectedImageIdx);
                                }}
                                style={{
                                  position: 'absolute',
                                  top: '12px',
                                  right: stagedUrl ? '112px' : '62px',
                                  width: '42px',
                                  height: '42px',
                                  border: '1px solid rgba(0,0,0,0.55)',
                                  borderRadius: '10px',
                                  background: 'rgba(255,255,255,0.85)',
                                  color: '#2563eb',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s ease',
                                  backdropFilter: 'blur(4px)',
                                  WebkitBackdropFilter: 'blur(4px)',
                                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                                  zIndex: 3,
                                  padding: 0
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(37, 99, 235, 0.12)';
                                  e.currentTarget.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(255,255,255,0.85)';
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                                title="Download image"
                              >
                                <Download size={18} />
                              </button>
                            )}
                            <StagedImage
                              originalUrl={originalUrl}
                              stagedUrl={stagedUrl}
                              mediaId={`property-image-${selectedImageIdx}`}
                              alt={`Property image ${selectedImageIdx + 1}`}
                              showStagedByDefault={viewPreferences[selectedImageIdx] === true}
                              onToggleView={(mediaId, showStaged) => {
                                // Save the user's view preference
                                setViewPreferences(prev => ({
                                  ...prev,
                                  [selectedImageIdx]: showStaged
                                }));
                              }}
                              onStage={async () => {
                                setStagingImageIndex(selectedImageIdx);
                                if (!property) return;
                                try {
                                  // Always use original URL for staging
                                  const img = (property as any).images[selectedImageIdx];
                                  const originalImageUrl = typeof img === 'string' 
                                    ? img 
                                    : (img?.originalUrl || img?.url);
                                  
                                  const propContext = {
                                    type: (property as any).property_type || 'residential',
                                    bedrooms: (property as any).bedrooms,
                                    bathrooms: (property as any).bathrooms,
                                    sqft: (property as any).square_footage,
                                    price: (property as any).monthly_rent,
                                    description: (property as any).description || '',
                                  };
                                  
                                  const controller = new AbortController();
                                  const timeoutId = setTimeout(() => controller.abort(), 90000);
                                  const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
                                    ? 'http://localhost:8000'
                                    : 'https://tink.global';
                                  
                                  const resp = await fetch(`${baseUrl}/api/listings/stage-image-demo/`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ 
                                      image_url: originalImageUrl, 
                                      property_context: propContext 
                                    }),
                                    signal: controller.signal,
                                  });
                                  
                                  clearTimeout(timeoutId);
                                  
                                  if (!resp.ok) {
                                    const errJson = await resp.json().catch(() => ({}));
                                    throw new Error(errJson.error || `Failed (${resp.status})`);
                                  }
                                  
                                  const data = await resp.json();
                                  if (!data.staged_url) {
                                    throw new Error('AI staging service returned no image. The service may be temporarily unavailable. Please try again in a moment.');
                                  }
                                  
                                  // Store staged URL in state (preserve original)
                                  setStagedImages(prev => ({
                                    ...prev,
                                    [selectedImageIdx]: data.staged_url,
                                  }));
                                  
                                  // When staging, auto-show the staged version
                                  setViewPreferences(prev => ({
                                    ...prev,
                                    [selectedImageIdx]: true
                                  }));
                                  
                                  // Update property images array to include staged_url while preserving original
                                  const newImages = (property as any).images.map((im: any, i: number) => {
                                    if (i === selectedImageIdx) {
                                      if (typeof im === 'string') {
                                        // Convert string to object with original and staged
                                        return {
                                          originalUrl: im,
                                          url: im,
                                          staged_url: data.staged_url,
                                        };
                                      } else {
                                        // Preserve originalUrl, update staged_url
                                        return {
                                          ...(im || {}),
                                          originalUrl: im?.originalUrl || im?.url || im,
                                          url: im?.url || im,
                                          staged_url: data.staged_url,
                                        };
                                      }
                                    }
                                    return im;
                                  });
                                  
                                  const updated = await apiClient.updateProperty(property.id, { images: newImages } as any);
                                  setProperty(updated);
                                } catch (e: any) {
                                  const errorMessage = e.message || 'Failed to stage image. The AI service may be temporarily unavailable. Please try again in a moment.';
                                  throw new Error(errorMessage);
                                } finally {
                                  setStagingImageIndex(null);
                                }
                              }}
                              className="property-main-image"
                            />
                       </div>
                        );
                      })()}
                       {/* Thumbnails - scrollable within main image height */}
                       <div style={{ 
                         display: 'flex',
                         flexDirection: 'column',
                         gap: '8px',
                         height: '700px'
                       }}>
                         {/* Scrollable list of thumbnails */}
                         <div style={{
                         overflowY: 'auto',
                           flex: 1,
                           display: 'flex',
                           flexDirection: 'column',
                           gap: '8px',
                         paddingRight: (property as any).images.length > 5 ? '4px' : '0'
                       }}>
                         {(property as any).images.map((img: any, idx: number) => {
                             // Use staged URL if available, otherwise original
                             const stagedUrl = stagedImages[idx];
                             const originalUrl = typeof img === 'string' 
                               ? img 
                               : (img?.originalUrl || img?.url);
                             // Use the stored view preference if available, otherwise show staged if available
                             const shouldShowStaged = viewPreferences[idx] !== false && !!stagedUrl;
                             const displayUrl = shouldShowStaged ? getMediaUrl(stagedUrl) : getMediaUrl(originalUrl || '');
                           const fallback = typeof img === 'object' ? img?.originalUrl : undefined;
                           const isActive = selectedImageIdx === idx;
                             
                           return (
                             <div 
                               key={idx}
                               style={{ 
                                 position: 'relative', 
                                 width: '100%', 
                                 paddingBottom: '66%', 
                                 borderRadius: '8px', 
                                 overflow: 'hidden', 
                                 border: isActive ? '2px solid #2563eb' : '1px solid #e5e7eb', 
                                 background: '#f8fafc',
                                 flexShrink: 0,
                                 cursor: 'pointer',
                                 boxShadow: isActive ? '0 0 0 3px rgba(37, 99, 235, 0.15)' : 'none'
                               }}
                               title="Click to view"
                             >
                                 <div
                                   onClick={() => setSelectedImageIdx(idx)}
                                   style={{ position: 'absolute', inset: 0 }}
                                 >
                                   <img 
                                     src={displayUrl} 
                                     alt={`Property image ${idx + 1}`} 
                                     referrerPolicy="no-referrer" 
                                     onError={(e) => handleImageError(e, fallback)} 
                                     style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
                                   />
                                 </div>
                                 {/* Download button on thumbnail - matching delete button style */}
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     const downloadUrl = shouldShowStaged && stagedUrl ? stagedUrl : originalUrl;
                                     handleDownloadImage(downloadUrl, idx);
                                   }}
                                   style={{
                                     position: 'absolute',
                                     top: '8px',
                                     right: '40px',
                                     width: '28px',
                                     height: '28px',
                                     borderRadius: '10px',
                                     border: '1px solid rgba(0,0,0,0.55)',
                                     background: 'rgba(255,255,255,0.85)',
                                     display: 'flex',
                                     alignItems: 'center',
                                     justifyContent: 'center',
                                     cursor: 'pointer',
                                     zIndex: 10,
                                     transition: 'all 0.2s ease',
                                     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                                     color: '#2563eb',
                                     padding: 0,
                                   }}
                                   onMouseEnter={(e) => {
                                     e.currentTarget.style.background = 'rgba(37, 99, 235, 0.12)';
                                     e.currentTarget.style.transform = 'scale(1.05)';
                                   }}
                                   onMouseLeave={(e) => {
                                     e.currentTarget.style.background = 'rgba(255,255,255,0.85)';
                                     e.currentTarget.style.transform = 'scale(1)';
                                   }}
                                   title="Download image"
                                 >
                                   <Download size={16} />
                                 </button>
                                 {/* Delete button on thumbnail */}
                                 <button
                                   onClick={async (e) => {
                                     e.stopPropagation();
                                     if (!property) return;
                                     const confirmed = window.confirm('Are you sure you want to delete this image? This action cannot be undone.');
                                     if (!confirmed) return;
                                     
                                     // Remove from staged images if exists
                                     setStagedImages(prev => {
                                       const newStaged = { ...prev };
                                       delete newStaged[idx];
                                       return newStaged;
                                     });
                                     
                                     // Remove from property images
                                     const newImages = (property as any).images.filter((_: any, i: number) => i !== idx);
                                     const updated = await apiClient.updateProperty(property.id, { images: newImages } as any);
                                     setProperty(updated);
                                     
                                     // Adjust selected index if needed
                                     if (selectedImageIdx >= newImages.length) {
                                       setSelectedImageIdx(Math.max(0, newImages.length - 1));
                                     }
                                   }}
                                   style={{
                                     position: 'absolute',
                                     top: '8px',
                                     right: '8px',
                                     width: '28px',
                                     height: '28px',
                                     borderRadius: '10px',
                                     border: '1px solid rgba(0,0,0,0.55)',
                                     background: 'rgba(255,255,255,0.85)',
                                     display: 'flex',
                                     alignItems: 'center',
                                     justifyContent: 'center',
                                     cursor: 'pointer',
                                     zIndex: 10,
                                     transition: 'all 0.2s ease',
                                     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                                     color: '#ef4444',
                                     padding: 0,
                                   }}
                                   onMouseEnter={(e) => {
                                     e.currentTarget.style.background = 'rgba(239,68,68,0.12)';
                                     e.currentTarget.style.transform = 'scale(1.05)';
                                   }}
                                   onMouseLeave={(e) => {
                                     e.currentTarget.style.background = 'rgba(255,255,255,0.85)';
                                     e.currentTarget.style.transform = 'scale(1)';
                                   }}
                                   title="Delete image"
                                 >
                                  <svg 
                                    width="16" 
                                    height="16" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2.5" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                    style={{ 
                                      transition: 'stroke 0.2s ease',
                                      display: 'block',
                                      flexShrink: 0,
                                      color: 'inherit',
                                      margin: '0 auto'
                                    }}
                                  >
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                  </svg>
                                 </button>
                                 {/* Staged badge */}
                                 {stagedUrl && (
                                   <div style={{
                                     position: 'absolute',
                                     top: '4px',
                                     left: '4px',
                                     background: 'rgba(17, 24, 39, 0.9)',
                                     color: 'white',
                                     padding: '2px 6px',
                                     borderRadius: '4px',
                                     fontSize: '10px',
                                     fontWeight: 600,
                                     display: 'flex',
                                     alignItems: 'center',
                                     gap: '4px',
                                     zIndex: 10,
                                   }}>
                                     <Wand2 size={10} />
                                     <span>AI</span>
                                   </div>
                                 )}
                             </div>
                           );
                         })}
                         </div>

                         {/* Buttons row - Add Photo and Download All side by side */}
                         <div style={{
                           display: 'flex',
                           flexDirection: 'row',
                           gap: '8px',
                           flexShrink: 0
                         }}>
                           {/* Upload button */}
                           <div 
                             onClick={() => fileInputRef.current?.click()}
                             style={{
                               flex: 1,
                               height: '100px',
                               borderRadius: '12px',
                               border: '2px dashed #cbd5e1',
                               display: 'flex',
                               alignItems: 'center',
                               justifyContent: 'center',
                               cursor: 'pointer',
                               transition: 'all 0.2s',
                               backgroundColor: '#f8fafc'
                             }}
                             onMouseOver={(e) => {
                               e.currentTarget.style.borderColor = '#2563eb';
                               e.currentTarget.style.backgroundColor = '#eff6ff';
                             }}
                             onMouseOut={(e) => {
                               e.currentTarget.style.borderColor = '#cbd5e1';
                               e.currentTarget.style.backgroundColor = '#f8fafc';
                             }}
                           >
                             <input
                               ref={fileInputRef}
                               type="file"
                               multiple
                               accept="image/*,video/*"
                               style={{ display: 'none' }}
                               onChange={(e) => handleUploadPropertyMedia(e.target.files)}
                             />
                             {uploadingMedia ? (
                               <div style={{ textAlign: 'center', color: '#2563eb' }}>
                                 <div style={{ fontSize: '12px', fontWeight: '500' }}>Uploading...</div>
                               </div>
                             ) : (
                               <div style={{ textAlign: 'center', color: '#64748b' }}>
                                 <Plus size={24} style={{ marginBottom: '4px' }} />
                                 <div style={{ fontSize: '11px', fontWeight: '500' }}>Add Photo</div>
                               </div>
                             )}
                           </div>

                           {/* Download All button */}
                           {(property as any).images && (property as any).images.length > 0 && (
                             <div 
                               onClick={isDownloadingAll ? undefined : handleDownloadAll}
                               style={{
                                 flex: 1,
                                 height: '100px',
                                 borderRadius: '12px',
                                 border: '2px solid #2563eb',
                                 display: 'flex',
                                 flexDirection: 'column',
                                 alignItems: 'center',
                                 justifyContent: 'center',
                                 cursor: isDownloadingAll ? 'wait' : 'pointer',
                                 transition: 'all 0.2s',
                                 backgroundColor: isDownloadingAll ? '#dbeafe' : '#eff6ff',
                                 position: 'relative',
                                 opacity: isDownloadingAll ? 0.7 : 1
                               }}
                               onMouseOver={(e) => {
                                 if (!isDownloadingAll) {
                                   e.currentTarget.style.borderColor = '#1d4ed8';
                                   e.currentTarget.style.backgroundColor = '#dbeafe';
                                   e.currentTarget.style.transform = 'translateY(-2px)';
                                   e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.2)';
                                 }
                               }}
                               onMouseOut={(e) => {
                                 if (!isDownloadingAll) {
                                   e.currentTarget.style.borderColor = '#2563eb';
                                   e.currentTarget.style.backgroundColor = '#eff6ff';
                                   e.currentTarget.style.transform = 'translateY(0)';
                                   e.currentTarget.style.boxShadow = 'none';
                                 }
                               }}
                             >
                               {isDownloadingAll ? (
                                 <>
                                   <RotateCcw size={24} className="spin" style={{ color: '#2563eb', marginBottom: '4px' }} />
                                   <div style={{ fontSize: '11px', fontWeight: '600', color: '#2563eb', textAlign: 'center' }}>
                                     Preparing...
                                   </div>
                                 </>
                               ) : (
                                 <>
                                   <Download size={24} style={{ color: '#2563eb', marginBottom: '4px' }} />
                                   <div style={{ fontSize: '11px', fontWeight: '600', color: '#2563eb', textAlign: 'center' }}>
                                     Download All
                                   </div>
                                   <div style={{ fontSize: '9px', color: '#60a5fa', marginTop: '2px', textAlign: 'center' }}>
                                     {(() => {
                                       const originalCount = (property as any).images.length;
                                       const stagedCount = Object.keys(stagedImages).length;
                                       const totalFiles = originalCount + stagedCount;
                                       return `${totalFiles} file${totalFiles !== 1 ? 's' : ''}`;
                                     })()}
                                   </div>
                                 </>
                               )}
                             </div>
                           )}
                         </div>
                       </div>
                    </div>
                    {/* Image count indicator if more than 5 */}
                    {(property as any).images.length > 5 && (
                      <div style={{ 
                        marginTop: '0.5rem', 
                        fontSize: '0.75rem', 
                        color: '#6b7280',
                        textAlign: 'right'
                      }}>
                        {(property as any).images.length} photos total
                      </div>
                    )}
                  </div>
                )}

                {/* Description under gallery with AI generation */}
                {(property as any).description ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 8 }}>
                      <div style={{ fontSize: '0.975rem', fontWeight: 700, color: '#111827' }}>Description</div>
                      <button
                        onClick={async () => {
                          if (!property) return;
                          try {
                            setIsGeneratingDesc(true);
                            const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
                              ? 'http://localhost:8000'
                              : 'https://tink.global';
                            const resp = await fetch(`${baseUrl}/api/listings/generate-description/`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                address: (property as any).full_address || property.name,
                                type: (property as any).property_type,
                                bedrooms: (property as any).bedrooms,
                                bathrooms: (property as any).bathrooms,
                                sqft: String((property as any).square_footage || ''),
                                price: (property as any).monthly_rent || '',
                                amenities: (property as any).amenities || [],
                                features: {
                                  lot_size_sqft: (property as any).lot_size_sqft,
                                  year_built: (property as any).year_built
                                },
                                neighborhood: (property as any).neighborhood || {},
                              }),
                            });
                            if (!resp.ok) {
                              const errJ = await resp.json().catch(() => ({}));
                              throw new Error(errJ.error || 'Failed to generate description');
                            }
                            const data = await resp.json();
                            const newDesc = data.description || (property as any).description;
                            const updated = await apiClient.updateProperty(property.id, { description: newDesc } as any);
                            setProperty(updated);
                          } catch (e: any) {
                            alert(e.message || 'Failed to generate description');
                          } finally {
                            setIsGeneratingDesc(false);
                          }
                        }}
                        disabled={isGeneratingDesc}
                        className="generate-description-btn"
                        title={isGeneratingDesc ? "Generating AI description..." : "Generate AI description — creates compelling copy using property details"}
                      >
                        {isGeneratingDesc ? (
                          <div className="wand-loader">
                            <Wand2 size={18} className="wand-generating" />
                            <div className="mini-sparkles">
                              <span className="mini-sparkle"></span>
                              <span className="mini-sparkle"></span>
                              <span className="mini-sparkle"></span>
                            </div>
                          </div>
                        ) : (
                          <Wand2 size={18} />
                        )}
                      </button>
                    </div>
                    <p style={{ fontSize: '0.95rem', color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {(property as any).description}
                    </p>
                  </div>
                ) : null}

                {/* Facts and amenities */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
                    <DetailItem label="Bedrooms" value={`${(property as any).bedrooms ?? '—'}`} />
                    <DetailItem label="Bathrooms" value={`${(property as any).bathrooms ?? '—'}`} />
                    <DetailItem label="Square Footage" value={`${(property as any).square_footage ?? '—'}`} />
                    <DetailItem label="Year Built" value={`${(property as any).year_built ?? '—'}`} />
                    <DetailItem label="Lot Size (sqft)" value={`${(property as any).lot_size_sqft ?? '—'}`} />
                  </div>

                  {/* Amenities list - only show if amenities exist */}
                  {Array.isArray((property as any).amenities) && (property as any).amenities.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '0.75rem' }}>Amenities</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {(property as any).amenities.slice(0, 20).map((a: string, i: number) => (
                          <span key={i} style={{
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: '#0f172a',
                            background: '#f1f5f9',
                            border: '1px solid #e2e8f0',
                            padding: '0.5rem 0.875rem',
                            borderRadius: '9999px',
                            lineHeight: '1'
                          }}>{a}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Scraped Information */}
                  {((property as any).nearby_places && Object.keys((property as any).nearby_places).length > 0) ||
                   (property as any).neighborhood ||
                   (property as any).walkability_score !== null ||
                   (property as any).transit_score !== null ||
                   (Array.isArray((property as any).schools) && (property as any).schools.length > 0) ||
                   (Array.isArray((property as any).price_history) && (property as any).price_history.length > 0) ? (
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '0.75rem' }}>Additional Information</div>
                      
                      {/* Neighborhood & Scores */}
                      {((property as any).neighborhood || (property as any).walkability_score !== null || (property as any).transit_score !== null) && (
                        <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                          {(property as any).neighborhood && (
                            <div style={{ marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280' }}>Neighborhood: </span>
                              <span style={{ fontSize: '0.875rem', color: '#111827' }}>{(property as any).neighborhood}</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            {(property as any).walkability_score !== null && (
                              <div>
                                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280' }}>Walk Score: </span>
                                <span style={{ fontSize: '0.875rem', color: '#111827', fontWeight: 600 }}>{(property as any).walkability_score}/100</span>
                              </div>
                            )}
                            {(property as any).transit_score !== null && (
                              <div>
                                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280' }}>Transit Score: </span>
                                <span style={{ fontSize: '0.875rem', color: '#111827', fontWeight: 600 }}>{(property as any).transit_score}/100</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Nearby Places - filter out neighborhood and similar_listings */}
                      {(property as any).nearby_places && Object.keys((property as any).nearby_places).length > 0 && (() => {
                        const filteredPlaces = Object.entries((property as any).nearby_places).filter(([key]) => {
                          const lowerKey = key.toLowerCase();
                          return lowerKey !== 'neighborhood' && lowerKey !== 'similar_listings' && lowerKey !== 'similar listings';
                        });
                        return filteredPlaces.length > 0 ? (
                          <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '0.75rem' }}>Nearby Places</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                              {filteredPlaces.slice(0, 10).map(([category, places]: [string, any]) => {
                                // Format category name (replace underscores with spaces, capitalize)
                                const formattedCategory = category
                                  .replace(/_/g, ' ')
                                  .split(' ')
                                  .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                  .join(' ');
                                
                                const placesList = Array.isArray(places) 
                                  ? places.filter(p => p && String(p).trim()).slice(0, 5).join(', ')
                                  : (places && String(places).trim() ? String(places) : null);
                                
                                if (!placesList) return null;
                                
                                return (
                                  <div key={category}>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>{formattedCategory}: </span>
                                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{placesList}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : null;
                      })()}

                      {/* Schools */}
                      {Array.isArray((property as any).schools) && (property as any).schools.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280', marginBottom: '0.5rem' }}>Nearby Schools</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {(property as any).schools.slice(0, 5).map((school: any, i: number) => (
                              <div key={i} style={{ fontSize: '0.875rem', color: '#111827' }}>
                                {typeof school === 'string' ? school : (school.name || school)}
                                {typeof school === 'object' && school.rating && (
                                  <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>(Rating: {school.rating})</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Price History */}
                      {Array.isArray((property as any).price_history) && (property as any).price_history.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280', marginBottom: '0.5rem' }}>Price History</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                            {(property as any).price_history.slice(0, 10).map((entry: any, i: number) => (
                              <div key={i} style={{ fontSize: '0.875rem', color: '#111827', display: 'flex', justifyContent: 'space-between' }}>
                                <span>
                                  {typeof entry === 'object' && entry.date ? (
                                    <>
                                      {new Date(entry.date).toLocaleDateString()}: 
                                      <span style={{ fontWeight: 600, marginLeft: '0.5rem' }}>
                                        ${typeof entry.price === 'number' ? entry.price.toLocaleString() : entry.price}
                                      </span>
                                    </>
                                  ) : (
                                    <span>{String(entry)}</span>
                                  )}
                                </span>
                  </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Virtual tour */}
                  {(property as any).virtual_tour_url ? (
                    <div>
                      <a href={(property as any).virtual_tour_url} target="_blank" rel="noreferrer" style={{ 
                        color: '#2563eb', 
                        textDecoration: 'none', 
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        View virtual tour →
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Property Management - Conditional based on rent_type */}
            {property.rent_type === 'per_room' ? (
              // Room Management for per-room properties
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease',
                overflow: 'hidden'
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
                  borderBottom: '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <h2 style={{
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      color: '#111827',
                      margin: 0,
                      marginBottom: '0.25rem'
                    }}>Room Management</h2>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      margin: 0
                    }}>{rooms.length} rooms in this property</p>
                  </div>
                  <Link href={`/properties/${id}/add-room`} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add New Room
                  </Link>
                </div>
                {rooms.length > 0 ? (
                  <div className="rooms-table-container">
                    <DataTable
                      columns={[
                        { header: 'Room Name', key: 'name', align: 'left' },
                        { header: 'Status', key: 'status', align: 'center' },
                        { header: 'Tenant', key: 'tenant', align: 'center' },
                        { header: 'Rent', key: 'rent', align: 'center' },
                        { header: 'Actions', key: 'actions', align: 'center' },
                      ]}
                      data={rooms}
                      renderRow={renderRoomRow}
                    />
                  </div>
                ) : (
                  <div className="empty-rooms-state">
                    <div className="empty-state-content">
                      <div className="empty-state-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                          <polyline points="9 22 9 12 15 12 15 22"/>
                        </svg>
                      </div>
                      <h3 className="empty-state-title">No Rooms Found</h3>
                      <p className="empty-state-description">
                        This property is configured for per-room renting, but no rooms have been added yet.
                        <br />
                        Get started by adding rooms to enable tenant assignments and rent collection.
                      </p>
                      <div className="empty-state-actions">
                        <button 
                          onClick={() => router.push(`/properties/${property.id}/add-room`)} 
                          className="btn btn-primary"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14m-7-7h14"/>
                          </svg>
                          Add Single Room
                        </button>
                        <button 
                          onClick={() => setRoomCountEditorOpen(true)} 
                          className="btn btn-secondary"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                          </svg>
                          Add Multiple Rooms
                        </button>
                      </div>
                      <div className="empty-state-help">
                        <p className="help-text">
                          💡 <strong>Tip:</strong> Use "Add Multiple Rooms" to quickly create several rooms at once with different types and rent amounts.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Unit Management for whole-property rentals
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease',
                overflow: 'hidden'
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
                  borderBottom: '1px solid #e5e7eb',
                }}>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#111827',
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>Unit Management</h2>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: 0
                  }}>This property is managed as a single unit</p>
                </div>
                <div className="rooms-table-container">
                  <DataTable
                    columns={[
                      { header: 'Unit', key: 'unit', align: 'left' },
                      { header: 'Status', key: 'status', align: 'center' },
                      { header: 'Tenant', key: 'tenant', align: 'center' },
                      { header: 'Rent', key: 'rent', align: 'center' },
                      { header: 'Lease Dates', key: 'dates', align: 'center' },
                    ]}
                    data={[
                      {
                        id: property.id,
                        unit: property.name,
                        unitType: 'Entire Property',
                        isVacant: !(property as any).current_tenants || (property as any).current_tenants.length === 0,
                        currentTenants: (property as any).current_tenants || [],
                        monthlyRent: property.monthly_rent
                      }
                    ]}
                    renderRow={(unit) => (
                      <tr key={unit.id}>
                        <td style={{ paddingLeft: '1.5rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ fontWeight: '600', color: '#111827' }}>{unit.unit}</span>
                            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{unit.unitType}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <StatusBadge status={unit.isVacant ? 'vacant' : 'occupied'} text={unit.isVacant ? 'Vacant' : 'Occupied'} />
                        </td>
                        <td style={{ textAlign: 'center', color: '#374151' }}>
                          {unit.currentTenants && unit.currentTenants.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                              {unit.currentTenants.map((t: any, idx: number) => (
                                <span
                                  key={idx}
                                  onClick={() => handleViewTenantDetails(t)}
                                  style={{
                                    cursor: 'pointer',
                                    color: '#2563eb',
                                    textDecoration: 'underline',
                                    fontWeight: '500'
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.color = '#1d4ed8'}
                                  onMouseOut={(e) => e.currentTarget.style.color = '#2563eb'}
                                >
                                  {t.name || t.full_name}
                                </span>
                              ))}
                            </div>
                          ) : '-'}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: '600', color: '#111827' }}>
                          {unit.monthlyRent ? `$${parseFloat(unit.monthlyRent).toFixed(2)}` : '-'}
                        </td>
                        <td style={{ textAlign: 'center', color: '#374151' }}>
                          {unit.currentTenants && unit.currentTenants.length > 0 ? (
                            <div style={{ fontSize: '0.875rem' }}>
                              {unit.currentTenants[0].move_in_date || '-'}
                            </div>
                          ) : '-'}
                        </td>
                      </tr>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Property History */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s ease',
              overflow: 'hidden'
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
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#111827',
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>Property History</h2>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: 0
                  }}>Tenant and rent collection history</p>
                      </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    backgroundColor: '#f8fafc',
                    borderRadius: '6px',
                    padding: '0.25rem'
                  }}>
                              <button 
                                  onClick={() => setActiveHistoryTab('tenant')}
                      style={{
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backgroundColor: activeHistoryTab === 'tenant' ? '#2563eb' : 'transparent',
                        color: activeHistoryTab === 'tenant' ? 'white' : '#6b7280'
                      }}
                              >
                                  Tenant History
                              </button>
                              <button 
                                  onClick={() => setActiveHistoryTab('rent')}
                      style={{
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backgroundColor: activeHistoryTab === 'rent' ? '#2563eb' : 'transparent',
                        color: activeHistoryTab === 'rent' ? 'white' : '#6b7280'
                      }}
                              >
                                  Rent Collection
                              </button>
                              <button 
                                  onClick={() => setActiveHistoryTab('price')}
                      style={{
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backgroundColor: activeHistoryTab === 'price' ? '#2563eb' : 'transparent',
                        color: activeHistoryTab === 'price' ? 'white' : '#6b7280'
                      }}
                              >
                                  Price History
                              </button>
                          </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                            <input 
                              id="history-toggle"
                              type="checkbox" 
                              checked={showAllHistory} 
                              onChange={(e) => setShowAllHistory(e.target.checked)} 
                      style={{
                        width: '1rem',
                        height: '1rem',
                        accentColor: '#2563eb'
                      }}
                    />
                    <label htmlFor="history-toggle" style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      cursor: 'pointer'
                    }}>Show all properties</label>
                          </div>
                        </div>
                    </div>
                    {activeHistoryTab === 'tenant' && (
                  <div className="history-table-container">
                  <DataTable
                    columns={[
                                    { header: 'Tenant', key: 'tenant' },
                                    { header: 'Unit', key: 'unit' },
                                    { header: 'Move In', key: 'move_in' },
                                    { header: 'Move Out', key: 'move_out' },
                                    { header: 'Status', key: 'status' },
                                ]}
                                data={propertyHistoryLeases}
                                renderRow={renderTenantHistoryRow}
                            />
                  </div>
                    )}
                    {activeHistoryTab === 'rent' && (
                  <div className="history-table-container">
                    {paymentLoading ? (
                            <div className="loading-container">
                                <div className="loading-spinner"></div>
                                <p>Loading payment history...</p>
                            </div>
                        ) : paymentHistory.length > 0 ? (
                                <DataTable
                                    columns={[
                                        { header: 'Tenant', key: 'tenant' },
                                        { header: 'Amount', key: 'amount' },
                                        { header: 'Payment Date', key: 'payment_date' },
                                        { header: 'Rent Period', key: 'rent_period' },
                                        { header: 'Status', key: 'status' },
                                        { header: 'Description', key: 'description' },
                                    ]}
                                    data={paymentHistory}
                                    renderRow={renderPaymentHistoryRow}
                                />
                        ) : (
                            <EmptyState
                                title="No Payment History"
                                description="No rent payments have been recorded for this property yet."
                            />
                    )}
                  </div>
                    )}
                    {activeHistoryTab === 'price' && (
                  <div className="history-table-container">
                    {Array.isArray((property as any).price_history) && (property as any).price_history.length > 0 ? (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                            <th style={{ textAlign: 'left', padding: '12px', fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>Date</th>
                            <th style={{ textAlign: 'left', padding: '12px', fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>Event</th>
                            <th style={{ textAlign: 'right', padding: '12px', fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(property as any).price_history.map((entry: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '12px', fontSize: '0.875rem', color: '#0f172a' }}>
                                {entry.date || '—'}
                              </td>
                              <td style={{ padding: '12px', fontSize: '0.875rem', color: '#64748b' }}>
                                {entry.event || entry.priceChangeRate || '—'}
                              </td>
                              <td style={{ padding: '12px', fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>
                                {entry.price ? formatCurrency(entry.price) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <EmptyState
                        title="No Price History"
                        description="No pricing history data is available for this property."
                      />
                    )}
                  </div>
                    )}
                </div>
              </div>

          {/* Right Column (1 part): Quick Actions + Lease Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Quick Actions Section */}
            <div style={{
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
                }}>
                    {(() => {
                      const { occupiedRooms, totalRooms } = getPropertyOccupancyStats();
                      const hasActiveTenants = occupiedRooms > 0;
                      const hasVacantRooms = occupiedRooms < totalRooms;
                      const isPerProperty = property.rent_type === 'per_property';
                      
                      if (isPerProperty) {
                        if (hasActiveTenants) {
                        return `Property occupied - manage tenant`;
                        } else {
                        return `Property vacant - find tenant`;
                        }
                      } else {
                        if (hasActiveTenants && hasVacantRooms) {
                        return `${occupiedRooms}/${totalRooms} rooms occupied`;
                        } else if (hasActiveTenants) {
                        return `All rooms occupied`;
                        } else {
                        return `${totalRooms} vacant rooms available`;
                        }
                      }
                    })()}
                  </p>
                  </div>
              
              <div style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                {getQuickActions().slice(0, 4).map((action, index) => {
                  // Define colors for each quick action button
                  const colors = [
                    { bg: '#eff6ff', border: '#bfdbfe', iconBg: '#dbeafe' }, // Blue
                    { bg: '#f0fdf4', border: '#bbf7d0', iconBg: '#dcfce7' }, // Green
                    { bg: '#fff7ed', border: '#fed7aa', iconBg: '#ffedd5' }, // Orange
                    { bg: '#fdf4ff', border: '#f3e8ff', iconBg: '#fae8ff' }  // Purple
                  ];
                  const colorScheme = colors[index] || colors[0];
                  
                  return (
                    <div key={index}
                    onClick={action.onClick}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        backgroundColor: colorScheme.bg,
                        borderRadius: '8px',
                        border: `1px solid ${colorScheme.border}`,
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
                        backgroundColor: colorScheme.iconBg,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                      {action.icon}
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
                  );
                })}
                    </div>
            </div>

            {/* MVP: Lease Details - Hidden for Phase 1 */}
            {false && property?.rent_type === 'per_property' && (
              <div className="section-card">
                <div className="section-header">
                  <div className="section-title-group">
                    <h2 className="section-title">Lease Details</h2>
                    <p className="section-subtitle">This property is leased as a whole unit</p>
          </div>
                </div>
                {propertyLevelLease ? (
                  <div className="lease-details">
                    <div className="lease-detail-item">
                      <span className="item-label">Tenant</span>
                      <span className="item-value tenant-name">
                        <Link href={`/tenants/${propertyLevelLease.tenant}`} className="tenant-link">
                          {getTenantName(propertyLevelLease.tenant)}
                        </Link>
                      </span>
                    </div>
                    <div className="lease-detail-item">
                      <span className="item-label">Rent</span>
                      <span className="item-value">{formatCurrency(propertyLevelLease.monthly_rent)}/mo</span>
                    </div>
                    <div className="lease-detail-item">
                      <span className="item-label">Lease Dates</span>
                      <span className="item-value">{formatDate(propertyLevelLease.start_date)} - {formatDate(propertyLevelLease.end_date)}</span>
                    </div>
                    <div className="lease-detail-item">
                      <span className="item-label">Status</span>
                      <span className="item-value">
                        <StatusBadge
                          status={propertyLevelLease.status as any}
                          text={
                            propertyLevelLease.status === 'draft' ? 'Draft Lease' :
                            propertyLevelLease.status === 'active' ? 'Occupied' :
                            (propertyLevelLease.status.charAt(0).toUpperCase() + propertyLevelLease.status.slice(1))
                          }
                        />
                      </span>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    title="No Active Lease"
                    description="This property is currently vacant."
                    action={
                      <button onClick={openPropertyAssignment} className="btn btn-primary">
                        Assign Tenant
                      </button>
                    }
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {assignmentModalOpen && selectedRoomForAssignment && (
        <PropertyTenantAssignmentModal
          property={property}
          room={selectedRoomForAssignment}
          isOpen={assignmentModalOpen}
          onClose={handleAssignmentModalClose}
          onSave={handleAssignmentModalSave}
        />
      )}

      {propertyAssignmentModalOpen && property && (
        <PropertyTenantAssignmentModal
          property={property}
          isOpen={propertyAssignmentModalOpen}
          onClose={closePropertyAssignment}
          onSave={handlePropertyAssignmentSave}
        />
      )}

      {/* Modal commented out - using simplified flow instead */}
      {/* {isNewApplicationModalOpen && (
        <NewListingModal onClose={() => setIsNewApplicationModalOpen(false)} onSuccess={() => setIsNewApplicationModalOpen(false)} />
      )}

      {showListingModal && property && (
        <NewListingModal
          onClose={() => setShowListingModal(false)}
          onSuccess={async () => {
            setShowListingModal(false);
            await fetchPropertyData();
          }}
          selectedPropertyId={property.id}
          property_name={property.name}
        />
      )} */}

      {/* Full-screen loading overlay during listing creation and redirect */}
      {creatingListing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          <Loader style={{ width: '3rem', height: '3rem', color: 'white', animation: 'spin 1s linear infinite' }} />
          <div style={{
            color: 'white',
            fontSize: '1.125rem',
            fontWeight: '600'
          }}>
            {listingSuccess ? 'Redirecting to listing page...' : 'Creating listing...'}
          </div>
        </div>
      )}

      {/* Edit Listing Modal */}
      {showEditListingModal && editingListing && (
        <NewListingModal
          onClose={() => {
            setShowEditListingModal(false);
            setEditingListing(null);
          }}
          onSuccess={handleEditListingSuccess}
          editMode={true}
          existingListing={editingListing}
          property_name={editingListing?.property_details?.name || editingListing?.property_name || property?.name}
        />
      )}

      {/* Simplified Listing Creation Flow */}
      {showListingFlow && property && !creatingListing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#111827',
                margin: 0
              }}>Create Listing</h2>
              <button
                onClick={() => setShowListingFlow(false)}
                style={{
                  width: '2rem',
                  height: '2rem',
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              >
                <X style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {error && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '1rem',
                  color: '#dc2626',
                  fontSize: '0.875rem'
                }}>
                  {error}
                </div>
              )}

              {listingSuccess && (
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: '8px',
                  padding: '1rem',
                  color: '#16a34a',
                  fontSize: '0.875rem'
                }}>
                  {listingSuccess}
                </div>
              )}

              {/* Property Preview */}
              <div style={{
                backgroundColor: '#f9fafb',
                borderRadius: '12px',
                padding: '1rem',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Property
                </div>
                <div style={{ fontSize: '1rem', fontWeight: '700', color: '#111827' }}>
                  {property.name}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  {(property as any).full_address || property.address_line1}
                </div>
                {getStagedImages().length > 0 && (
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                    {getStagedImages().length} image{getStagedImages().length !== 1 ? 's' : ''} ready
                  </div>
                )}
              </div>

              {/* Available From Date */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Available From <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="date"
                  value={availableFrom}
                  onChange={(e) => setAvailableFrom(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2563eb';
                    e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Room Selection (only for per_room properties) */}
              {property.rent_type === 'per_room' && rooms.length > 0 && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Select Rooms <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: '0.75rem',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    padding: '0.5rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px'
                  }}>
                    {rooms.map((room) => (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => {
                          setSelectedRoomsForListing(prev =>
                            prev.includes(room.id)
                              ? prev.filter(id => id !== room.id)
                              : [...prev, room.id]
                          );
                        }}
                        style={{
                          padding: '0.75rem',
                          borderRadius: '8px',
                          border: selectedRoomsForListing.includes(room.id) ? '2px solid #2563eb' : '2px solid #e5e7eb',
                          background: selectedRoomsForListing.includes(room.id) ? '#eff6ff' : 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#111827'
                        }}
                        onMouseOver={(e) => {
                          if (!selectedRoomsForListing.includes(room.id)) {
                            e.currentTarget.style.borderColor = '#2563eb';
                            e.currentTarget.style.backgroundColor = '#f9fafb';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!selectedRoomsForListing.includes(room.id)) {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                            e.currentTarget.style.backgroundColor = 'white';
                          }
                        }}
                      >
                        {room.name}
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                    {selectedRoomsForListing.length} room{selectedRoomsForListing.length !== 1 ? 's' : ''} selected
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginTop: '1rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid #e5e7eb'
              }}>
                <button
                  onClick={() => setShowListingFlow(false)}
                  disabled={creatingListing}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: 'white',
                    color: '#374151',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: creatingListing ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    if (!creatingListing) {
                      e.currentTarget.style.borderColor = '#d1d5db';
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!creatingListing) {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateListingSubmit}
                  disabled={creatingListing || !availableFrom || (property.rent_type === 'per_room' && selectedRoomsForListing.length === 0)}
                  style={{
                    flex: 2,
                    padding: '0.75rem',
                    backgroundColor: creatingListing || !availableFrom || (property.rent_type === 'per_room' && selectedRoomsForListing.length === 0) ? '#9ca3af' : '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: creatingListing || !availableFrom || (property.rent_type === 'per_room' && selectedRoomsForListing.length === 0) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseOver={(e) => {
                    if (!creatingListing && availableFrom && (property.rent_type === 'per_property' || selectedRoomsForListing.length > 0)) {
                      e.currentTarget.style.backgroundColor = '#1d4ed8';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!creatingListing && availableFrom && (property.rent_type === 'per_property' || selectedRoomsForListing.length > 0)) {
                      e.currentTarget.style.backgroundColor = '#2563eb';
                    }
                  }}
                >
                  {creatingListing ? (
                    <>
                      <Loader style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check style={{ width: '1rem', height: '1rem' }} />
                      Create Listing
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conversion Wizard */}
      {conversionWizardOpen && property && (
        <RentTypeConversionWizard
          property={property}
          rooms={rooms}
          leases={leases}
          tenants={tenants}
          isOpen={conversionWizardOpen}
          onClose={() => setConversionWizardOpen(false)}
          onComplete={(updatedProperty) => {
            setProperty(updatedProperty);
            setConversionWizardOpen(false);
            fetchPropertyData();
          }}
        />
      )}

      {/* Room Count Editor Modal */}
      {roomCountEditorOpen && property && (
        <div className="modal-overlay" onClick={() => setRoomCountEditorOpen(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Room Management</h2>
              <button onClick={() => setRoomCountEditorOpen(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <RoomCountEditor
                property={property}
                rooms={rooms}
                leases={leases}
                tenants={tenants}
                onUpdate={(updatedRooms) => {
                  setRooms(updatedRooms);
                  setRoomCountEditorOpen(false);
                  fetchPropertyData();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedRoom && property && (
        <RoomDeletionModal
          room={selectedRoom}
          property={property}
          leases={leases}
          tenants={tenants}
          isOpen={showDeleteModal}
          onClose={cancelDeleteRoom}
          onDelete={handleDeleteComplete}
        />
      )}

      {/* Edit Property Modal */}
      {showEditPropertyModal && property && (
        <EditPropertyModal
          property={property}
          onClose={() => setShowEditPropertyModal(false)}
          onSuccess={() => {
            setShowEditPropertyModal(false);
            fetchPropertyData();
          }}
        />
      )}

      {/* Edit Room Modal */}
      {showEditRoomModal && editingRoom && property && (
        <EditRoomModal
          room={editingRoom}
          property={property}
          isOpen={showEditRoomModal}
          onClose={() => {
            setShowEditRoomModal(false);
            setEditingRoom(null);
          }}
          onSuccess={() => {
            setShowEditRoomModal(false);
            setEditingRoom(null);
            fetchPropertyData();
          }}
        />
      )}

      {/* Tenant Detail Modal */}
      {isTenantDetailModalOpen && selectedApplicationForDetail && property && (
        <ApplicationDetailModal
          isOpen={isTenantDetailModalOpen}
          application={selectedApplicationForDetail}
          properties={property ? [property] : []}
          rooms={rooms}
          onClose={() => {
            setIsTenantDetailModalOpen(false);
            setSelectedApplicationForDetail(null);
            setSelectedTenantForDetail(null);
          }}
          onApprove={async (applicationId: number) => {
            // Handle approve if needed
            await fetchPropertyData();
          }}
          onReject={async (applicationId: number) => {
            // Handle reject if needed
            await fetchPropertyData();
          }}
        />
      )}

      <style jsx>{`
        .dashboard-container {
          padding: 0;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          min-height: 100vh;
          font-family: 'Inter', system-ui, sans-serif;
        }
        
        .main-content-grid {
          display: grid;
          grid-template-columns: 2.5fr 1fr;
          gap: 24px;
          align-items: flex-start;
          padding: 16px 32px 32px;
        }

        .left-column, .right-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .metric-card {
          background: white;
          border-radius: 6px;
          padding: 14px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
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
        
        .metric-change.vacant {
          color: #10b981;
        }
        
        .metric-change.occupied {
          color: #ef4444;
        }
        
        .metric-change.neutral {
          color: #64748b;
        }

        .section-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(226, 232, 240, 0.6);
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        }

        .section-header {
          padding: 24px 28px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.6);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .section-title-group {
          flex: 1;
        }
        
        .section-title {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
          letter-spacing: -0.01em;
        }

        .section-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0;
          font-weight: 500;
        }

        .btn {
          padding: 12px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .btn-secondary {
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .btn-secondary:hover {
          background: #f9fafb;
          border-color: #9ca3af;
          transform: translateY(-1px);
        }

        .quick-actions-section {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(226, 232, 240, 0.6);
          border-radius: 6px;
          padding: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
          height: fit-content;
        }

        .quick-actions-section .section-header {
          padding: 0;
          border-bottom: none;
          margin-bottom: 12px;
        }

        .quick-actions-section .section-title {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 3px 0;
        }

        .quick-actions-section .section-subtitle {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        .actions-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
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
          color: inherit;
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
          background: #fff7ed;
          border-color: #fed7aa;
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

        .action-card.orange .action-icon {
          background: #f97316;
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

        .rooms-table-container,
        .history-table-container {
          width: 100%;
          overflow-x: auto;
          border-radius: 6px;
          background: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          align-items: center;
          justify-content: center;
        }
        
        .btn-action {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          background: transparent;
          color: #64748b;
        }

        .btn-action:hover {
          transform: scale(1.1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .btn-action.assign {
          background: #eff6ff;
          color: #3b82f6;
        }

        .btn-action.assign:hover {
          background: #dbeafe;
          color: #2563eb;
        }

        .btn-action.edit {
          background: #f0fdf4;
          color: #22c55e;
        }

        .btn-action.edit:hover {
          background: #dcfce7;
          color: #16a34a;
        }

        .btn-action.delete {
          background: #fef2f2;
          color: #ef4444;
        }

        .btn-action.delete:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        .room-link {
          text-decoration: none;
          color: inherit;
        }

        .room-name {
          font-weight: 600;
          color: #1e293b;
        }

        .room-type {
          font-size: 12px;
          color: #64748b;
        }

        .tenant-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tenant-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 600;
          color: white;
        }

        .tenant-link {
          text-decoration: none;
          color: #3b82f6;
        }

        .tenant-link:hover {
          text-decoration: underline;
        }

        .unassigned {
          color: #64748b;
        }

        .loading-state, .error-state {
          text-align: center;
          padding: 40px;
        }

        .error-state {
          color: #dc2626;
        }

        .empty-rooms-state {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          min-height: 400px;
        }

        .empty-state-content {
          text-align: center;
          max-width: 480px;
        }

        .empty-state-icon {
          margin: 0 auto 24px auto;
          width: 64px;
          height: 64px;
          color: #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .empty-state-title {
          font-size: 24px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 16px 0;
        }

        .empty-state-description {
          font-size: 16px;
          color: #64748b;
          line-height: 1.6;
          margin: 0 0 32px 0;
        }

        .empty-state-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }

        .empty-state-help {
          background: #f0f9ff;
          border: 1px solid #e0f2fe;
          border-radius: 8px;
          padding: 16px;
          margin-top: 24px;
        }

        .help-text {
          font-size: 14px;
          color: #0369a1;
          margin: 0;
          line-height: 1.5;
        }

        .help-text strong {
          font-weight: 600;
        }

        .lease-details {
          padding: 20px;
        }

        .lease-detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #e2e8f0;
        }

        .lease-detail-item:last-child {
          border: none;
        }

        .item-label {
          font-weight: 500;
          color: #64748b;
        }

        .item-value {
          font-weight: 600;
          color: #1e293b;
        }

        .item-value.tenant-name {
          color: #4f46e5;
        }

        .history-controls {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .history-tabs {
          display: flex;
          gap: 4px;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 6px;
        }

        .tab-btn {
          background: transparent;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
        }
        
        .tab-btn.active {
          background: white;
          color: #1e293b;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .toggle-switch {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .toggle-switch label {
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          user-select: none;
        }

        .toggle-switch input {
          cursor: pointer;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          color: #64748b;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e2e8f0;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .alert-banner {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 1px solid #f59e0b;
          border-radius: 12px;
            padding: 16px;
          margin-bottom: 24px;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.1);
        }

        .alert-content {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .alert-icon {
          color: #d97706;
          flex-shrink: 0;
        }

        .alert-text {
          flex: 1;
          min-width: 200px;
          color: #92400e;
          font-size: 14px;
          line-height: 1.4;
        }

        .alert-text strong {
          font-weight: 600;
        }

        .alert-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }

        .alert-btn {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .alert-btn.primary {
          background: #d97706;
          color: white;
        }

        .alert-btn.primary:hover {
          background: #b45309;
        }

        .alert-btn.secondary {
          background: white;
          color: #d97706;
          border: 1px solid #d97706;
        }

        .alert-btn.secondary:hover {
          background: #fef3c7;
        }

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
        }

        .modal-container {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 900px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h2 {
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
            font-size: 24px;
          color: #64748b;
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .modal-close:hover {
          background: #f1f5f9;
          color: #1e293b;
        }

        .modal-body {
          padding: 24px;
          max-height: calc(90vh - 80px);
          overflow-y: auto;
        }

        .back-button {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 8px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #64748b;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          margin-right: 16px;
        }

        .back-button:hover {
          background: #f8fafc;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 1200px) {
          .main-content-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }

        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .main-content-grid {
            padding: 24px 16px;
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
        }

        /* Image action buttons - matching listing page style */
        .stage-btn,
        .remove-btn {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(0, 0, 0, 0.55);
          border-radius: 10px;
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        }

        .stage-btn {
          color: #ffffff;
          background: rgba(17, 24, 39, 0.9);
          border-color: rgba(0, 0, 0, 0.65);
        }

        .stage-btn:hover:not(:disabled) {
          background: rgba(17, 24, 39, 0.4);
          color: #ffffff;
          transform: scale(1.05);
        }

        .stage-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .remove-btn {
          color: #ef4444;
          background: rgba(255, 255, 255, 0.85);
        }

        .remove-btn:hover {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
          transform: scale(1.05);
        }

        /* Description button styles - matching listing page */
        .button-group {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .generate-description-btn {
          background: rgba(17, 24, 39, 0.9);
          border: 1px solid rgba(0, 0, 0, 0.65);
          border-radius: 10px;
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
          color: #ffffff;
          position: relative;
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
        }

        .generate-description-btn:hover:not(:disabled) {
          background: rgba(17, 24, 39, 0.4);
          color: #ffffff;
          transform: scale(1.05);
        }

        .generate-description-btn:active:not(:disabled) {
          transform: scale(0.95);
        }

        .generate-description-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .generate-description-btn svg {
          animation: sparkle 2s ease-in-out infinite;
        }

        @keyframes sparkle {
          0%, 100% {
            transform: rotate(0deg) scale(1);
          }
          25% {
            transform: rotate(-10deg) scale(1.1);
          }
          75% {
            transform: rotate(10deg) scale(1.1);
          }
        }

        .wand-loader {
          position: relative;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wand-generating {
          position: relative;
          z-index: 2;
          animation: wandBounce 0.8s ease-in-out infinite;
          filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.8));
        }

        @keyframes wandBounce {
          0%, 100% {
            transform: translateY(0px) rotate(-8deg);
          }
          50% {
            transform: translateY(-3px) rotate(8deg);
          }
        }

        .mini-sparkles {
          position: absolute;
          inset: -8px;
          pointer-events: none;
        }

        .mini-sparkle {
          position: absolute;
          width: 3px;
          height: 3px;
          background: linear-gradient(135deg, #60a5fa, #ffffff);
          border-radius: 50%;
          box-shadow: 0 0 4px rgba(96, 165, 250, 0.8);
          animation: miniSparkle 1.2s ease-in-out infinite;
        }

        .mini-sparkle:nth-child(1) {
          top: 0;
          right: 2px;
          animation-delay: 0s;
        }

        .mini-sparkle:nth-child(2) {
          bottom: 0;
          left: 2px;
          animation-delay: 0.4s;
        }

        .mini-sparkle:nth-child(3) {
          top: 50%;
          left: -2px;
          animation-delay: 0.8s;
        }

        @keyframes miniSparkle {
          0%, 100% {
            transform: translateY(0px) scale(1);
            opacity: 1;
          }
          50% {
            transform: translateY(-8px) scale(1.3);
            opacity: 0.6;
          }
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Staging Overlay Animation - matching listing page */
        .staging-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .staging-spinner {
          text-align: center;
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .wand-animation {
          position: relative;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wand-icon {
          position: relative;
          z-index: 2;
          color: #ffffff;
          filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.6));
          animation: wandFloat 2s ease-in-out infinite;
        }

        @keyframes wandFloat {
          0%, 100% {
            transform: translateY(0px) rotate(-5deg);
          }
          50% {
            transform: translateY(-10px) rotate(5deg);
          }
        }

        .sparkles {
          position: absolute;
          inset: 0;
        }

        .sparkle {
          position: absolute;
          width: 8px;
          height: 8px;
          background: linear-gradient(135deg, #60a5fa, #a78bfa);
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(96, 165, 250, 0.8);
          animation: sparkleFloat 2s ease-in-out infinite;
        }

        .sparkle-1 {
          top: 10%;
          right: 15%;
          animation-delay: 0s;
        }

        .sparkle-2 {
          top: 25%;
          left: 10%;
          animation-delay: 0.5s;
          width: 6px;
          height: 6px;
        }

        .sparkle-3 {
          bottom: 20%;
          right: 20%;
          animation-delay: 1s;
          width: 10px;
          height: 10px;
        }

        .sparkle-4 {
          bottom: 15%;
          left: 15%;
          animation-delay: 1.5s;
        }

        @keyframes sparkleFloat {
          0%, 100% {
            transform: translateY(0px) scale(1);
            opacity: 1;
          }
          25% {
            transform: translateY(-15px) scale(1.2);
            opacity: 0.8;
          }
          50% {
            transform: translateY(-20px) scale(0.8);
            opacity: 0.6;
          }
          75% {
            transform: translateY(-10px) scale(1.1);
            opacity: 0.9;
          }
        }

        .staging-text {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 0.3px;
          color: white;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .progress-dots {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .progress-dots .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.6);
          animation: dotPulse 1.4s ease-in-out infinite;
        }

        .progress-dots .dot:nth-child(1) {
          animation-delay: 0s;
        }

        .progress-dots .dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .progress-dots .dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes dotPulse {
          0%, 80%, 100% {
            transform: scale(1);
            background: rgba(255, 255, 255, 0.4);
          }
          40% {
            transform: scale(1.3);
            background: rgba(255, 255, 255, 1);
          }
        }
      `}</style>
    </DashboardLayout>
  );
} 