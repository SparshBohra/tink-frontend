import React, { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { Property, Room } from '../lib/types';
import styles from './NewListingModal.module.css';
import { getMediaUrl } from '../lib/utils';
import StagedImage from './StagedImage';
import { Wand2, GripVertical, X, Plus, Trash2, Download, RotateCcw } from 'lucide-react';
import JSZip from 'jszip';

interface NewListingModalProps {
  onClose: () => void;
  onSuccess?: (refreshedListing?: any) => void;
  editMode?: boolean;
  existingListing?: any;
  property_name?: string;
  selectedPropertyId?: number | null;
}

interface MediaFile {
  id?: string;
  file: File | null;
  url: string;
  originalUrl?: string; // Always preserve original URL
  staged_url?: string | null;
  caption: string;
  is_primary: boolean;
  uploading?: boolean;
  isStaging?: boolean;
}

// SVG Icon Components
const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
);

const CameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const ClipboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
  </svg>
);

const FileTextIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10,9 9,9 8,9"/>
  </svg>
);

const PhoneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const UploadIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17,8 12,3 7,8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const CheckCircleIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const NewListingModal = ({ onClose, onSuccess, editMode = false, existingListing, property_name, selectedPropertyId }: NewListingModalProps) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormDataPopulated, setIsFormDataPopulated] = useState(false);
  
  console.log('NewListingModal render - activeTab:', activeTab, 'editMode:', editMode, 'existingListing:', !!existingListing, 'property_name:', property_name);
  // Properties and rooms data
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [propertyData, setPropertyData] = useState<Property | null>(null);
  const [applicationMode, setApplicationMode] = useState<'default' | 'manual'>('default');
  const [stagingErrors, setStagingErrors] = useState<Record<string, string>>({});
  const [publishingPlatforms, setPublishingPlatforms] = useState({
    squareft: true,
    zillow: false,
    apartments: false,
    realtor: false,
    trulia: false,
    facebook: false
  });
  // Download state
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [stagingImageId, setStagingImageId] = useState<string | null>(null);
  // View preferences for staged images
  const [viewPreferences, setViewPreferences] = useState<{[key: string]: boolean}>({});
  
  // Form data
  const [formData, setFormData] = useState({
    // Basic Info
    property_ref: selectedPropertyId ? selectedPropertyId.toString() : '',
    title: '',
    description: '',
    listing_type: 'rooms' as 'rooms' | 'whole_property',
    available_rooms: [] as number[],
    available_from: '',
    
    // Media & Images
    featured_image_url: '',
    
    // Pricing & Terms
    pricing_notes: '',
    lease_terms: '',
    utilities_included: [] as string[],
    amenities: [] as string[],
    pet_policy: '',
    smoking_policy: 'no_smoking' as 'no_smoking' | 'smoking_allowed' | 'designated_areas',
    
    // Application Settings
    application_fee: 0,
    require_background_check: true,
    require_income_verification: true,
    minimum_income_ratio: 3,
    required_documents: [] as string[],
    
    // Contact & Visibility
    contact_email: '',
    contact_phone: '',
    show_landlord_info: true,
    is_active: true,
    
    // SEO & Marketing
    seo_title: '',
    seo_description: '',
    marketing_tags: [] as string[],
  });

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: HomeIcon },
    { id: 'media', label: 'Photos & Media', icon: CameraIcon },
    { id: 'details', label: 'Property Details', icon: ClipboardIcon },
    { id: 'application', label: 'Application Settings', icon: FileTextIcon },
    { id: 'contact', label: 'Contact & Publish', icon: PhoneIcon },
  ];

  const utilityOptions = [
    'Water', 'Electricity', 'Gas', 'Internet', 'Cable TV', 'Trash', 'Heating', 'Air Conditioning'
  ];

  const amenityOptions = [
    'Parking', 'Laundry', 'Gym', 'Pool', 'Balcony', 'Garden', 'Elevator', 'Security', 
    'Furnished', 'Dishwasher', 'Microwave', 'Air Conditioning', 'Heating', 'Fireplace'
  ];

  const documentOptions = [
    'Government ID', 'Proof of Income', 'Bank Statements', 'Employment Letter', 
    'Previous Rental History', 'References', 'Credit Report', 'Background Check'
  ];

  useEffect(() => {
    // Only fetch properties if not in edit mode, or if we need them for room selection
    if (!editMode) {
      fetchProperties();
    } else if (editMode && existingListing) {
      // In edit mode, fetch property data to get staged images
      const propertyId = typeof existingListing.property_ref === 'object' 
        ? existingListing.property_ref?.id 
        : existingListing.property_ref;
      
      if (propertyId) {
        fetchPropertyData(Number(propertyId));
      }
    }
  }, [editMode, existingListing]);

  const fetchPropertyData = async (propertyId: number) => {
    try {
      const property = await apiClient.getProperty(propertyId);
      setPropertyData(property);
      console.log('Fetched property data for staging:', property);
    } catch (err) {
      console.error('Failed to fetch property data:', err);
    }
  };

  // Populate form with existing data in edit mode
  useEffect(() => {
    console.log('--- Edit Mode Debug ---');
    console.log('useEffect triggered for existing listing population.');
    console.log('editMode:', editMode);
    console.log('existingListing available:', !!existingListing);
    console.log('existingListing data:', existingListing);
    console.log('existingListing keys:', existingListing ? Object.keys(existingListing) : 'none');

    if (editMode && existingListing) {
      console.log('Populating form with existing listing data:', existingListing);
      
      // Ensure property_ref is properly converted to string - try multiple possible locations
      let propertyRefValue = '';
      if (existingListing.property_ref) {
        propertyRefValue = existingListing.property_ref.toString();
        console.log('Found property_ref at existingListing.property_ref:', existingListing.property_ref);
      } else if (existingListing.property?.id) {
        propertyRefValue = existingListing.property.id.toString();
        console.log('Found property_ref at existingListing.property.id:', existingListing.property.id);
      } else if (existingListing.property_details?.id) {
        propertyRefValue = existingListing.property_details.id.toString();
        console.log('Found property_ref at existingListing.property_details.id:', existingListing.property_details.id);
      } else {
        console.error('Could not find property reference in any expected location!');
        console.log('Available property-related fields:');
        console.log('- property_ref:', existingListing.property_ref);
        console.log('- property:', existingListing.property);
        console.log('- property_details:', existingListing.property_details);
        console.log('- All keys:', Object.keys(existingListing));
      }
      
      console.log('Final property_ref value:', propertyRefValue);
      
      // Extract metadata from listing_metadata or root level (for backward compatibility)
      const metadata = existingListing.listing_metadata || {};
      
      // Map the API response to form data structure
      const newFormData = {
        property_ref: propertyRefValue,
        title: existingListing.title || '',
        description: existingListing.description || '',
        listing_type: existingListing.listing_type || 'rooms',
        available_rooms: Array.isArray(existingListing.available_rooms) ? existingListing.available_rooms : [],
        available_from: existingListing.available_from || '',
        featured_image_url: existingListing.featured_image_url || '',
        
        // Handle nested application config
        application_fee: existingListing.application_form_config?.global_settings?.application_fee || 
                        existingListing.application_fee || 50,
        require_background_check: existingListing.application_form_config?.steps?.background_check?.enabled ?? true,
        require_income_verification: existingListing.application_form_config?.steps?.employment_info?.enabled ?? true,
        minimum_income_ratio: existingListing.application_form_config?.global_settings?.minimum_income_ratio || 3,
        required_documents: existingListing.application_form_config?.global_settings?.required_documents || [],
        
        // Handle metadata fields (from listing_metadata or root level for backward compatibility)
        pricing_notes: metadata.pricing_notes || existingListing.pricing_notes || '',
        lease_terms: metadata.lease_terms || existingListing.lease_terms || '',
        utilities_included: Array.isArray(metadata.utilities_included) ? metadata.utilities_included : 
                           (Array.isArray(existingListing.utilities_included) ? existingListing.utilities_included : []),
        amenities: Array.isArray(metadata.amenities) ? metadata.amenities : 
                  (Array.isArray(existingListing.amenities) ? existingListing.amenities : []),
        pet_policy: metadata.pet_policy || existingListing.pet_policy || '',
        smoking_policy: metadata.smoking_policy || existingListing.smoking_policy || 
                      (existingListing.smoking_allowed ? 'smoking_allowed' : 'no_smoking'),
        
        // Contact information
        contact_email: metadata.contact_email || existingListing.contact_info?.contact_email || existingListing.contact_email || '',
        contact_phone: metadata.contact_phone || existingListing.contact_info?.contact_phone || existingListing.contact_phone || '',
        show_landlord_info: metadata.show_landlord_info !== undefined ? metadata.show_landlord_info : 
                           (existingListing.show_landlord_info !== false),
        is_active: existingListing.is_active !== undefined ? existingListing.is_active : 
                  (existingListing.status === 'active'),
        
        // SEO fields
        seo_title: metadata.seo_title || existingListing.seo_title || '',
        seo_description: metadata.seo_description || existingListing.seo_description || '',
        marketing_tags: Array.isArray(metadata.marketing_tags) ? metadata.marketing_tags : 
                       (Array.isArray(existingListing.marketing_tags) ? existingListing.marketing_tags : []),
      };

      console.log('Setting form data to:', newFormData);
      setFormData(newFormData);
      setIsFormDataPopulated(true); // Mark form data as populated
      
      // Set application mode based on existing settings
      const hasCustomSettings = (existingListing.application_form_config?.global_settings?.application_fee || 0) > 0 ||
                                existingListing.application_form_config?.steps?.background_check?.enabled ||
                                existingListing.application_form_config?.steps?.employment_info?.enabled ||
                                (existingListing.application_form_config?.global_settings?.required_documents || []).length > 0;
      setApplicationMode(hasCustomSettings ? 'manual' : 'default');
      
      console.log('✅ Form data has been set. property_ref in form data:', newFormData.property_ref);

      // Load existing media if available
      // Check multiple possible locations for media
      let mediaToLoad: any[] = [];
      
      // 0. If metadata.kept_property_images exists, prefer it (explicit user selection)
      const keptFromMetadata = Array.isArray(existingListing?.listing_metadata?.kept_property_images)
        ? existingListing.listing_metadata.kept_property_images
        : [];
      if (keptFromMetadata.length > 0) {
        const sortedKept = [...keptFromMetadata].sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0));
        mediaToLoad = sortedKept.map((item: any, index: number) => {
          // Ensure URL is valid - handle both string URLs and object formats
          let imageUrl = item.url || item.file_url || '';
          if (typeof imageUrl !== 'string') {
            imageUrl = '';
          }
          // Process staged URL similarly
          let stagedUrl = item.staged_url || null;
          if (stagedUrl && typeof stagedUrl !== 'string') {
            stagedUrl = null;
          }
          
          // Preserve original URL - use originalUrl from item if available, otherwise imageUrl
          const originalUrl = item.originalUrl || imageUrl;
          
          return {
            id: item.id?.toString() || `kept-${index}`,
            file: null as any,
            url: stagedUrl || imageUrl, // Display staged if available, otherwise original
            originalUrl: originalUrl, // Always preserve original
            staged_url: stagedUrl,
            caption: item.caption || '',
            is_primary: !!item.is_primary,
            uploading: false,
          };
        });
        console.log('Loaded kept_property_images from metadata:', mediaToLoad);
      }
      
      // 1. Check listing.media (listing-specific media)
      if (mediaToLoad.length === 0 && existingListing.media && Array.isArray(existingListing.media) && existingListing.media.length > 0) {
        // Get staged URLs from listing_metadata
        const stagedMediaUrls = existingListing.listing_metadata?.staged_media_urls || {};
        
        // Sort by display_order if available
        const sortedMedia = [...existingListing.media].sort((a: any, b: any) => {
          const orderA = a.display_order ?? 0;
          const orderB = b.display_order ?? 0;
          return orderA - orderB;
        });
        
        mediaToLoad = sortedMedia.map((media: any, index: number) => {
          const originalUrl = media.file_url || media.url || media.thumbnail;
          let stagedUrl = null;
          
          // First check listing_metadata for staged URL
          if (media.id && stagedMediaUrls[media.id]) {
            stagedUrl = stagedMediaUrls[media.id];
          } else {
            // Fallback: Try to find staged version from property data
            if (propertyData && (propertyData as any).images) {
              const propertyImg = (propertyData as any).images.find((img: any) => {
                const imgUrl = typeof img === 'string' ? img : (img?.url || img?.staged_url);
                return imgUrl === originalUrl || imgUrl?.includes(originalUrl.split('/').pop() || '');
              });
              if (propertyImg) {
                stagedUrl = typeof propertyImg === 'string' 
                  ? null 
                  : (propertyImg.staged_url || null);
              }
            }
          }
          
          return {
            id: media.id?.toString() || `listing-media-${index}`,
            file: null as any,
            url: stagedUrl || originalUrl, // Display staged if available, otherwise original
            originalUrl: originalUrl, // Always preserve original
            staged_url: stagedUrl,
            caption: media.caption || '',
            is_primary: media.is_primary || index === 0,
            uploading: false
          };
        });
        console.log('Loaded listing media:', mediaToLoad);
      }
      
      // 2. If no listing media, check property_ref.images (staged images from property)
      if (mediaToLoad.length === 0) {
        const propertyImages = propertyData ? (propertyData as any).images 
          : (existingListing.property_ref && typeof existingListing.property_ref === 'object' 
            ? existingListing.property_ref.images 
            : existingListing.property_details?.images) || [];
        
        if (Array.isArray(propertyImages) && propertyImages.length > 0) {
          mediaToLoad = propertyImages.map((img: any, index: number) => {
            // Handle both string URLs and object formats
            const imgUrl = typeof img === 'string' 
              ? img 
              : (img?.url || img?.file_url || img);
            const stagedUrl = typeof img === 'object' ? (img.staged_url || null) : null;
            
            // Preserve original URL
            const originalUrl = typeof img === 'object' ? (img.originalUrl || imgUrl) : imgUrl;
            
            return {
              id: `property-image-${index}`,
              file: null as any,
              url: stagedUrl || imgUrl, // Display staged if available, otherwise original
              originalUrl: originalUrl, // Always preserve original
              staged_url: stagedUrl,
              caption: typeof img === 'object' ? (img.caption || '') : '',
              is_primary: index === 0,
              uploading: false
            };
          });
          console.log('Loaded property images as media:', mediaToLoad);
        }
      }
      
      // 3. Check property_details.images as fallback
      if (mediaToLoad.length === 0 && existingListing.property_details?.images) {
        const propertyImages = existingListing.property_details.images;
        if (Array.isArray(propertyImages) && propertyImages.length > 0) {
          mediaToLoad = propertyImages.map((img: any, index: number) => {
            const imgUrl = typeof img === 'string' 
              ? img 
              : (img?.staged_url || img?.url || img?.file_url || img);
            const stagedUrl = typeof img === 'object' ? (img.staged_url || null) : null;
            
            return {
              id: `property-detail-image-${index}`,
              file: null as any,
              url: imgUrl,
              staged_url: stagedUrl,
              caption: typeof img === 'object' ? (img.caption || '') : '',
              is_primary: index === 0,
              uploading: false
            };
          });
          console.log('Loaded property_details images as media:', mediaToLoad);
        }
      }
      
      if (mediaToLoad.length > 0) {
        setMediaFiles(mediaToLoad);
        console.log('✅ Final media files set:', mediaToLoad);
      } else {
        console.log('⚠️ No media found in listing data');
      }
    } else {
      console.log('Conditions not met for populating form in edit mode.');
    }
    console.log('--- End Edit Mode Debug ---');
  }, [editMode, existingListing, propertyData]);

  // Fetch rooms when property selection changes
  useEffect(() => {
    if (formData.property_ref) {
      console.log('Property selected, fetching rooms for ID:', formData.property_ref);
      fetchRooms(parseInt(formData.property_ref));
    } else {
      console.log('No property selected, clearing rooms');
      setRooms([]);
    }
  }, [formData.property_ref]);

  // Add room loading state
  const [roomsLoading, setRoomsLoading] = useState(false);

  // Auto-adjust listing type based on available rooms (only on initial load, not after user selection)
  useEffect(() => {
    if (formData.property_ref && rooms.length === 0 && !roomsLoading && !editMode) {
      // Only auto-adjust if we've finished loading and there are truly no rooms
      // And only if user hasn't explicitly selected a listing type
      if (formData.listing_type === 'rooms') {
        // Don't auto-adjust if user explicitly chose rooms - let them see the "no rooms" message
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        listing_type: 'whole_property'
      }));
    }
  }, [formData.property_ref, rooms.length, roomsLoading, editMode]);

  const fetchProperties = async () => {
    try {
      const response = await apiClient.getProperties();
      const propertiesList = response.results || [];
      console.log('Fetched properties:', propertiesList);
      setProperties(propertiesList);
      
      // In edit mode, if we have existing listing data but the form hasn't been populated yet
      // (race condition where properties load before listing data), re-trigger form population
      if (editMode && existingListing && !isFormDataPopulated) {
        console.log('Properties loaded after listing data - ensuring property_ref is set');
        const propertyRefValue = existingListing.property_ref ? existingListing.property_ref.toString() : '';
        if (propertyRefValue && formData.property_ref !== propertyRefValue) {
          setFormData(prev => ({
            ...prev,
            property_ref: propertyRefValue
          }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    }
  };

  const fetchRooms = async (propertyId: number) => {
    try {
      setRoomsLoading(true);
      console.log('Fetching rooms for property:', propertyId);
      const roomsData = await apiClient.getPropertyRooms(propertyId);
      console.log('Rooms fetched:', roomsData);
      setRooms(roomsData);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      setRooms([]);
    } finally {
      setRoomsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayToggle = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).includes(value)
        ? (prev[field as keyof typeof prev] as string[]).filter(item => item !== value)
        : [...(prev[field as keyof typeof prev] as string[]), value]
    }));
  };

  const handleRoomToggle = (roomId: number) => {
    setFormData(prev => ({
      ...prev,
      available_rooms: prev.available_rooms.includes(roomId)
        ? prev.available_rooms.filter(id => id !== roomId)
        : [...prev.available_rooms, roomId]
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        const newMedia: MediaFile = {
          id: Date.now().toString() + Math.random(),
          file,
          url,
          originalUrl: url, // Preserve original URL for new uploads (blob URL)
          caption: '',
          is_primary: mediaFiles.length === 0,
          uploading: false
        };
        setMediaFiles(prev => [...prev, newMedia]);
      }
    });
  };

  const handleMediaUpdate = (id: string, updates: Partial<MediaFile>) => {
    setMediaFiles(prev => 
      prev.map(media => 
        media.id === id ? { ...media, ...updates } : media
      )
    );
  };

  // Helper to update kept_property_images in metadata immediately
  const updateKeptPropertyImages = async (currentMediaFiles: MediaFile[]) => {
    if (!editMode || !existingListing?.id) return;
    
    // Check if we're using property images (no ListingMedia or synthetic IDs)
    const isUsingPropertyImages = !existingListing.media?.length || 
      currentMediaFiles.some(m => 
        !m.file && m.id && (m.id.toString().startsWith('property-image-') || 
                           m.id.toString().startsWith('kept-') || 
                           m.id.toString().startsWith('property-detail-image-'))
      );
    
    if (isUsingPropertyImages) {
      const keptImages = currentMediaFiles
        .filter(m => !m.file) // Only existing images
        .map((media, index) => {
          // Ensure we save the original URL
          const originalUrl = media.url || '';
          const stagedUrl = media.staged_url || null;
          
          return {
            id: media.id?.toString() || `kept-${index}`,
            url: originalUrl, // Original URL (will be processed by getMediaUrl when displaying)
            staged_url: stagedUrl,
            caption: media.caption || '',
            display_order: index,
            is_primary: media.is_primary || false
          };
        });
      
      const currentMetadata = existingListing.listing_metadata || {};
      const updatedMetadata = {
        ...currentMetadata,
        kept_property_images: keptImages,
        staged_media_urls: keptImages.reduce((acc: Record<string, string>, img) => {
          if (img.staged_url) acc[img.id] = img.staged_url;
          return acc;
        }, {})
      };
      
      try {
        await apiClient.updateListing(existingListing.id, {
          listing_metadata: updatedMetadata
        } as any);
        console.log('✅ Updated kept_property_images immediately:', keptImages.length, 'items');
      } catch (err) {
        console.error('❌ Failed to update kept_property_images:', err);
      }
    }
  };

  const handleMediaDelete = async (id: string) => {
    const updatedMediaFiles = mediaFiles.filter(media => media.id !== id);
      // If we deleted the primary image, make the first remaining image primary
    if (updatedMediaFiles.length > 0 && !updatedMediaFiles.some(media => media.is_primary)) {
      updatedMediaFiles[0].is_primary = true;
    }
    setMediaFiles(updatedMediaFiles);

    // Immediately delete from backend when editing an existing listing
    if (editMode && existingListing?.id) {
      // Try to resolve backend media ID from existing listing by matching id or url
      const match = (existingListing.media || []).find((m: any) =>
        m.id?.toString() === id || (m.file_url === (mediaFiles.find(x => x.id === id)?.url))
      );
      if (match?.id) {
        try {
          await apiClient.deleteListingMedia(existingListing.id, match.id);
          console.log(`✅ Deleted media ${match.id} immediately`);
        } catch (err) {
          console.error('Failed to delete media immediately:', err);
        }
      }
      
      // Update kept_property_images if using property images
      await updateKeptPropertyImages(updatedMediaFiles);
    }
  };

  const setPrimaryImage = async (id: string) => {
    console.log('Setting primary image:', id);
    const updatedMediaFiles = mediaFiles.map(media => ({
        ...media,
        is_primary: media.id === id
      }));
    setMediaFiles(updatedMediaFiles);
    console.log('Updated media files:', updatedMediaFiles);
    
    // Update backend immediately
    if (editMode && existingListing?.id) {
      const match = (existingListing.media || []).find((m: any) =>
        m.id?.toString() === id || (m.file_url === (mediaFiles.find(x => x.id === id)?.url))
      );
      if (match?.id) {
        try {
          // Set new primary
          await apiClient.updateListingMedia(match.id, { is_primary: true });
          // Unset old primary
          const oldPrimary = mediaFiles.find(m => m.is_primary && m.id !== id);
          if (oldPrimary?.id) {
            const oldMatch = (existingListing.media || []).find((m: any) =>
              m.id?.toString() === oldPrimary.id || (m.file_url === oldPrimary.url)
            );
            if (oldMatch?.id) {
              await apiClient.updateListingMedia(oldMatch.id, { is_primary: false });
            }
          }
          console.log(`✅ Updated primary status for media ${match.id}`);
        } catch (err) {
          console.error('Failed to update primary status:', err);
        }
      }
      
      // Update kept_property_images if using property images
      await updateKeptPropertyImages(updatedMediaFiles);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    
    if (draggedIndex !== index) {
      const newMediaFiles = [...mediaFiles];
      const draggedItem = newMediaFiles[draggedIndex];
      newMediaFiles.splice(draggedIndex, 1);
      newMediaFiles.splice(index, 0, draggedItem);
      setMediaFiles(newMediaFiles);
      setDraggedIndex(index);
    }
  };

  // Download single image
  const handleDownloadImage = async (media: MediaFile, index: number) => {
    try {
      const displayUrl = viewPreferences[media.id!] && media.staged_url 
        ? media.staged_url 
        : (media.originalUrl || media.url);
      const mediaUrl = getMediaUrl(displayUrl);
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
      const listingTitle = formData.title || existingListing?.title || `listing-${existingListing?.id || 'new'}`;
      const sanitizedName = listingTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase();
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
    if (!mediaFiles || mediaFiles.length === 0) return;
    
    setIsDownloadingAll(true);
    try {
      const zip = new JSZip();
      const imagePromises: Promise<void>[] = [];
      const listingTitle = formData.title || existingListing?.title || `listing-${existingListing?.id || 'new'}`;
      const sanitizedName = listingTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase();

      mediaFiles.forEach((media, idx) => {
        const imageNumber = idx + 1;
        const originalUrl = media.originalUrl || media.url;
        
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
        if (media.staged_url) {
          imagePromises.push(
            (async () => {
              try {
                let blob: Blob;
                if (media.staged_url!.startsWith('data:image/')) {
                  const response = await fetch(media.staged_url!);
                  if (!response.ok) throw new Error(`Failed to convert base64 image: ${response.status}`);
                  blob = await response.blob();
                } else {
                  const mediaUrl = getMediaUrl(media.staged_url!);
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

  const handleDragEnd = async () => {
    setDraggedIndex(null);

    // Persist new order immediately when editing existing listing
    if (editMode && existingListing?.id) {
      // Update ListingMedia objects if they exist
      const hasListingMedia = (existingListing.media || []).length > 0;
      if (hasListingMedia) {
        for (const [idx, m] of mediaFiles.entries()) {
          // Only update existing media (skip new uploads)
          if (m.file) continue;
          const match = (existingListing.media || []).find((em: any) =>
            em.id?.toString() === m.id?.toString() || (em.file_url === m.url)
          );
          if (match?.id) {
            try {
              await apiClient.updateListingMedia(match.id, { display_order: idx });
              console.log(`✅ Updated display_order for media ${match.id} to ${idx}`);
            } catch (err) {
              console.error('Failed to persist display_order:', err);
            }
          }
        }
      }
      
      // Update kept_property_images if using property images
      await updateKeptPropertyImages(mediaFiles);
    }
  };

  // Staging handlers
  const handleStageImage = async (mediaId: string, index: number) => {
    const media = mediaFiles.find(m => m.id === mediaId);
    if (!media) return;

    // Clear any previous error for this image
    setStagingErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[mediaId];
      return newErrors;
    });

    setStagingImageId(mediaId);
    setMediaFiles(prev => prev.map(m => 
      m.id === mediaId ? { ...m, isStaging: true } : m
    ));

    try {
      const propertyContext = propertyData ? {
        type: propertyData.property_type || 'residential',
        bedrooms: (propertyData as any).bedrooms || 0,
        bathrooms: (propertyData as any).bathrooms || 0,
        sqft: (propertyData as any).square_footage || 0,
        description: formData.description || '',
      } : {
        type: 'residential',
        description: formData.description || '',
      };

      // Get API base URL (matching property page pattern)
      const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:8000'
        : 'https://tink.global';
      
      // Always use original URL for staging (preserve original)
      const originalImageUrl = media.originalUrl || media.url;
      
      const response = await fetch(`${baseUrl}/api/listings/stage-image-demo/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image_url: originalImageUrl,
          property_context: propertyContext,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `Server error (${response.status})`;
        
        // Check for rate limit or cooldown errors
        const isRateLimit = response.status === 429 || 
                           errorMessage.toLowerCase().includes('rate limit') ||
                           errorMessage.toLowerCase().includes('cooldown') ||
                           errorMessage.toLowerCase().includes('quota');
        
        throw new Error(isRateLimit 
          ? 'AI service is temporarily unavailable due to rate limits. Please try again in a few moments.'
          : errorMessage
        );
      }

      const data = await response.json();
      if (!data.staged_url) {
        throw new Error('AI staging service returned no image. The service may be temporarily unavailable. Please try again in a moment.');
      }

        // Success - update staged URL but preserve original
        setMediaFiles(prev => prev.map(m => 
          m.id === mediaId 
            ? { ...m, staged_url: data.staged_url, originalUrl: m.originalUrl || m.url, isStaging: false }
            : { ...m, isStaging: false }
        ));
        // Auto-show staged version
        setViewPreferences(prev => ({
          ...prev,
          [mediaId]: true
        }));
      
      // Clear error for this image
      setStagingErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[mediaId];
        return newErrors;
      });

      // Immediately persist staged URL to listing metadata in edit mode
      if (editMode && existingListing?.id) {
        // Check if we're using ListingMedia or property images
        const match = (existingListing.media || []).find((m: any) =>
          m.id?.toString() === mediaId || (m.file_url === media.url)
        );
        const isUsingPropertyImages = !match || mediaId.toString().startsWith('property-image-') || 
                                       mediaId.toString().startsWith('kept-') || 
                                       mediaId.toString().startsWith('property-detail-image-');
        
        if (match?.id && !isUsingPropertyImages) {
          // Update staged_media_urls for ListingMedia
          const currentMetadata = existingListing.listing_metadata || {};
          const stagedMap = { ...(currentMetadata.staged_media_urls || {}) } as any;
          stagedMap[match.id] = data.staged_url;
          try {
            await apiClient.updateListing(existingListing.id, {
              listing_metadata: { ...currentMetadata, staged_media_urls: stagedMap }
            } as any);
            console.log('✅ Persisted staged URL for ListingMedia immediately');
          } catch (err) {
            console.error('Failed to persist staged URL immediately:', err);
          }
        } else if (isUsingPropertyImages) {
          // Update kept_property_images for property images
          const updatedMediaFiles = mediaFiles.map(m => 
            m.id === mediaId ? { ...m, staged_url: data.staged_url } : m
          );
          await updateKeptPropertyImages(updatedMediaFiles);
        }
      }
    } catch (err: any) {
      console.error('Staging error:', err);
      // Set user-friendly error message (never throw to UI)
      const rawMessage = (err && err.message) ? String(err.message) : '';
      const isRateLimit = rawMessage.toLowerCase().includes('rate limit')
        || rawMessage.toLowerCase().includes('cooldown')
        || rawMessage.toLowerCase().includes('quota')
        || rawMessage.toLowerCase().includes('temporarily unavailable');
      const friendlyMessage = isRateLimit
        ? 'AI service is temporarily unavailable due to rate limits. Please try again in a few moments.'
        : (rawMessage || 'Oops, we could not stage this image. Please try again in a moment.');
      setStagingErrors(prev => ({
        ...prev,
        [mediaId]: friendlyMessage
      }));
      
      setMediaFiles(prev => prev.map(m => 
        m.id === mediaId ? { ...m, isStaging: false } : m
      ));
      
      // Auto-clear error after 8 seconds
      setTimeout(() => {
        setStagingErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[mediaId];
          return newErrors;
        });
      }, 8000);
    }
  };

  const handleUnstageImage = (mediaId: string) => {
    // Just toggle the view - don't actually delete the staged version
    // This is now a view toggle, not a deletion
    // The StagedImage component handles the toggle internally
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simple success toast helper
      const showToast = (msg: string) => {
        try {
          const containerId = 'sqft-global-toast-container';
          let container = document.getElementById(containerId);
          if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            container.style.position = 'fixed';
            container.style.top = '20px';
            container.style.right = '20px';
            container.style.zIndex = '2147483647';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '8px';
            document.body.appendChild(container);
          }
          const toast = document.createElement('div');
          toast.style.background = '#10B981';
          toast.style.color = 'white';
          toast.style.padding = '10px 14px';
          toast.style.borderRadius = '8px';
          toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          toast.style.fontSize = '0.875rem';
          toast.style.fontWeight = '600';
          toast.textContent = msg || 'Saved successfully';
          container.appendChild(toast);
          setTimeout(() => {
            toast.style.transition = 'opacity 300ms ease';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 320);
          }, 1600);
        } catch {}
      };

      // Validation
      if (!formData.title || !formData.description) {
        throw new Error('Please fill in all required fields (Title, Description).');
      }

      if (!formData.available_from) {
        throw new Error('Please select an available from date.');
      }

      if (!editMode && !formData.property_ref) {
        throw new Error('Please select a property.');
      }
      
      if (!editMode && formData.listing_type === 'rooms' && formData.available_rooms.length === 0) {
        throw new Error('Please select at least one room for room-based listings.');
      }
      
      // Determine the property reference to use
      const propertyRefToUse = formData.property_ref ? parseInt(formData.property_ref) : 
                               (existingListing?.property_ref || existingListing?.property?.id);
      
      const selectedProperty = properties.find(p => p.id === parseInt(formData.property_ref));
      
      console.log('Using property_ref for API call:', propertyRefToUse);
      console.log('Edit mode:', editMode);
      
      // First, create/update the listing
      const listingData = {
        ...(propertyRefToUse && { property_ref: propertyRefToUse }),
        title: formData.title,
        description: formData.description,
        listing_type: formData.listing_type,
        available_rooms: formData.listing_type === 'rooms' ? formData.available_rooms : 
                        (existingListing?.available_rooms || []),
        available_from: formData.available_from || undefined,
        featured_image_url: '', // Will be updated after upload
        
        application_form_config: {
          steps: {
            basic_info: { enabled: true, mandatory: true },
            contact_info: { enabled: true, mandatory: true },
            employment_info: { enabled: formData.require_income_verification, mandatory: formData.require_income_verification },
            documents: { enabled: formData.required_documents.length > 0, mandatory: true },
            background_check: { enabled: formData.require_background_check, mandatory: formData.require_background_check }
          },
          global_settings: {
            application_fee: formData.application_fee,
            minimum_income_ratio: formData.minimum_income_ratio,
            required_documents: formData.required_documents,
            allow_save_and_continue: true,
            mobile_optimized: true
          }
        },
        
        // Additional metadata for backend
        pricing_notes: formData.pricing_notes,
        lease_terms: formData.lease_terms,
        utilities_included: formData.utilities_included,
        amenities: formData.amenities,
        pet_policy: formData.pet_policy,
        smoking_policy: formData.smoking_policy,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        show_landlord_info: formData.show_landlord_info,
        is_active: formData.is_active, // Backend will map this to status
        seo_title: formData.seo_title || formData.title,
        seo_description: formData.seo_description || formData.description,
        marketing_tags: formData.marketing_tags,
        // Note: property_name and property_address are read-only fields, don't send them
        
        // Remove media_info as it's not the correct way to handle uploads
        // media_info will be created from the actual uploaded files
      };

      console.log('Submitting listing data:', listingData);
      
      let savedListing;
      if (editMode && existingListing) {
        savedListing = await apiClient.updateListing(existingListing.id, listingData);
      } else {
        savedListing = await apiClient.createListing(listingData);
      }

      console.log('Listing saved:', savedListing);
      console.log('Listing ID:', savedListing?.id);

      // Handle media updates: deletions, reordering, staging, captions, primary image
      if (editMode && savedListing?.id) {
        console.log('=== MEDIA UPDATE DEBUG ===');
      console.log('Total mediaFiles:', mediaFiles.length);
        console.log('All mediaFiles:', mediaFiles.map((m, idx) => ({
        id: m.id,
          index: idx,
        hasFile: !!m.file,
          url: m.url,
          staged_url: m.staged_url,
        caption: m.caption,
        is_primary: m.is_primary,
          display_order: idx
      })));
        
        // Get existing media IDs from the listing
        const existingMediaIds = (existingListing?.media || []).map((m: any) => m.id?.toString());
        
        // Build a map of current media by URL and ID for better matching
        const currentMediaMap = new Map<string, string>(); // URL -> ID
        mediaFiles
          .filter(m => !m.file) // Only existing media (not new uploads)
          .forEach(m => {
            if (m.id) currentMediaMap.set(m.id.toString(), m.url);
            currentMediaMap.set(m.url, m.id?.toString() || '');
          });
        
        // Find media to delete (exist in backend but not matched in current mediaFiles)
        const mediaToDelete = existingMediaIds.filter(id => {
          const existingMedia = (existingListing?.media || []).find((m: any) => m.id?.toString() === id);
          if (!existingMedia) return false;
          
          const existingUrl = existingMedia.file_url || existingMedia.url;
          // Check if this URL or ID exists in current mediaFiles
          const hasUrlMatch = mediaFiles.some(m => 
            !m.file && (m.url === existingUrl || m.id?.toString() === id)
          );
          return !hasUrlMatch;
        });
        console.log('Media to delete:', mediaToDelete);
        
        // Delete removed media
        for (const mediaId of mediaToDelete) {
          try {
            await apiClient.deleteListingMedia(savedListing.id, parseInt(mediaId));
            console.log(`✅ Deleted media ${mediaId}`);
          } catch (err: any) {
            console.error(`❌ Failed to delete media ${mediaId}:`, err);
          }
        }
        
        // Collect all staged URLs to update metadata in one batch
        const stagedMediaUpdates: Record<string, string | null> = {};
        const mediaUpdates: Array<{ id: number; data: any }> = [];
        const allExistingMediaIds = new Set((existingListing?.media || []).map((m: any) => m.id?.toString()).filter(Boolean));
        
        // Update existing media (captions, display_order, is_primary, staged_url)
        for (let index = 0; index < mediaFiles.length; index++) {
          const media = mediaFiles[index];
          
          // Skip new files (will be uploaded separately)
          if (media.file) continue;
          
          // Find the existing media ID
          const existingMedia = (existingListing?.media || []).find((m: any) => {
            const mUrl = m.file_url || m.url;
            return mUrl === media.url || m.id?.toString() === media.id?.toString();
          });
          
          if (existingMedia?.id) {
            const mediaIdStr = existingMedia.id.toString();
            
            // Track staged URL changes (including removals when staged_url is null)
            if (media.staged_url !== undefined) {
              stagedMediaUpdates[mediaIdStr] = media.staged_url || null;
            }
            
            // Collect media updates
            mediaUpdates.push({
              id: existingMedia.id,
              data: {
                caption: media.caption || '',
                display_order: index,
                is_primary: media.is_primary || false
              }
            });
          }
        }
        
        // Remove staged URLs for media that was deleted
        const currentMediaIds = new Set(mediaFiles
          .filter(m => !m.file)
          .map(m => {
            const existingMedia = (existingListing?.media || []).find((em: any) => {
              const mUrl = em.file_url || em.url;
              return mUrl === m.url || em.id?.toString() === m.id?.toString();
            });
            return existingMedia?.id?.toString();
          })
          .filter(Boolean)
        );
        
        // Mark staged URLs for deletion for removed media
        for (const mediaId of allExistingMediaIds) {
          if (!currentMediaIds.has(mediaId)) {
            stagedMediaUpdates[mediaId] = null;
          }
        }
        
        // Check if we're working with ListingMedia objects or property images
        const hasListingMedia = existingMediaIds.length > 0;
        const isUsingPropertyImages = !hasListingMedia || mediaFiles.some(m => 
          !m.file && m.id && (m.id.toString().startsWith('property-image-') || m.id.toString().startsWith('kept-') || m.id.toString().startsWith('property-detail-image-'))
        );
        
        // Batch update all ListingMedia objects (if any)
        if (hasListingMedia && !isUsingPropertyImages) {
          for (const update of mediaUpdates) {
            try {
              await apiClient.updateListingMedia(update.id, update.data);
              console.log(`✅ Updated media ${update.id}:`, update.data);
            } catch (err: any) {
              console.error(`❌ Failed to update media ${update.id}:`, err);
            }
          }
        }
        
        // Update listing metadata: staged_media_urls AND kept_property_images
        const currentMetadata = savedListing.listing_metadata || {};
        let metadataUpdated = false;
        
        // Handle staged_media_urls (for ListingMedia objects)
        if (hasListingMedia && !isUsingPropertyImages && Object.keys(stagedMediaUpdates).length > 0) {
          try {
            const existingStagedUrls = currentMetadata.staged_media_urls || {};
            const updatedStagedUrls: Record<string, string> = {};
            
            // Keep existing staged URLs that aren't being updated
            for (const [mediaId, stagedUrl] of Object.entries(existingStagedUrls)) {
              if (!(mediaId in stagedMediaUpdates)) {
                updatedStagedUrls[mediaId] = stagedUrl;
              }
            }
            
            // Apply updates (add new, update existing, remove null ones)
            for (const [mediaId, stagedUrl] of Object.entries(stagedMediaUpdates)) {
              if (stagedUrl !== null) {
                updatedStagedUrls[mediaId] = stagedUrl;
              }
            }
            
            currentMetadata.staged_media_urls = updatedStagedUrls;
            metadataUpdated = true;
            console.log('✅ Updated listing metadata with staged URLs:', updatedStagedUrls);
          } catch (err: any) {
            console.error('❌ Failed to update listing metadata:', err);
          }
        }
        
        // Handle kept_property_images (for property images without ListingMedia)
        if (isUsingPropertyImages) {
          try {
            // Build kept_property_images array from current mediaFiles (excluding new uploads)
            const keptImages = mediaFiles
              .filter(m => !m.file) // Only existing images
              .map((media, index) => {
                // Ensure we're saving the original URL (not processed)
                // media.url should already be the original URL from when it was loaded
                const originalUrl = media.url || '';
                const stagedUrl = media.staged_url || null;
                
                console.log(`[kept_property_images] Saving image ${index}:`, {
                  id: media.id,
                  url: originalUrl?.substring(0, 100),
                  staged_url: stagedUrl?.substring(0, 100) || null,
                  caption: media.caption
                });
                
                return {
                  id: media.id?.toString() || `kept-${index}`,
                  url: originalUrl, // Save original URL (will be processed by getMediaUrl when displaying)
                  staged_url: stagedUrl,
                  caption: media.caption || '',
                  display_order: index,
                  is_primary: media.is_primary || false
                };
              });
            
            currentMetadata.kept_property_images = keptImages;
            
            // Also update staged_media_urls for property images (using synthetic IDs)
            const propertyStagedUrls: Record<string, string> = {};
            keptImages.forEach((img) => {
              if (img.staged_url) {
                propertyStagedUrls[img.id] = img.staged_url;
              }
            });
            currentMetadata.staged_media_urls = propertyStagedUrls;
            
            metadataUpdated = true;
            console.log('✅ Updated kept_property_images:', keptImages.length, 'items');
            console.log('✅ Updated staged_media_urls for property images:', Object.keys(propertyStagedUrls).length, 'staged URLs');
          } catch (err: any) {
            console.error('❌ Failed to update kept_property_images:', err);
          }
        }
        
        // Save metadata if it was updated
        if (metadataUpdated) {
          try {
            await apiClient.updateListing(savedListing.id, {
              listing_metadata: currentMetadata
            });
            console.log('✅ Saved listing metadata');
          } catch (err: any) {
            console.error('❌ Failed to save listing metadata:', err);
          }
        }
        
        console.log('=== END MEDIA UPDATE DEBUG ===');
      }

      // Now upload NEW media files if any
      const newMediaFiles = mediaFiles.filter(media => media.file); // Only new files with File objects
      console.log('=== MEDIA UPLOAD DEBUG ===');
      console.log('Filtered newMediaFiles:', newMediaFiles.length);
      console.log('Listing ID:', savedListing?.id);
      console.log('=== END DEBUG ===');
      
      if (newMediaFiles.length > 0 && savedListing?.id) {
        console.log('Starting media upload process...');
        console.log('Files to upload:', newMediaFiles.map(m => ({
          fileName: m.file?.name,
          fileSize: m.file?.size,
          fileType: m.file?.type,
          caption: m.caption,
          is_primary: m.is_primary
        })));
        
        try {
          let uploadedCount = 0;
          let primaryImageUrl = '';
          
          for (const media of newMediaFiles) {
            console.log(`\n--- Uploading file ${uploadedCount + 1}/${newMediaFiles.length} ---`);
            console.log('File details:', {
              name: media.file?.name,
              size: media.file?.size,
              type: media.file?.type,
              caption: media.caption,
              is_primary: media.is_primary
            });
            
            try {
              const uploadedMedia = await apiClient.uploadListingMedia(savedListing.id, media.file, media.caption);
              console.log('✅ Upload successful:', uploadedMedia);
              uploadedCount++;
              
              // Update the uploaded media with display_order, is_primary, and staged_url
              const mediaIndex = mediaFiles.findIndex(m => m.id === media.id);
              if (uploadedMedia.id) {
                const updateData: any = {
                  display_order: mediaIndex,
                  is_primary: media.is_primary || false
                };
                
                // Update media with order and primary status
                await apiClient.updateListingMedia(uploadedMedia.id, updateData);
                console.log(`✅ Updated new media ${uploadedMedia.id} with order and primary status`);
                
                // Store staged_url in listing_metadata if present
                if (media.staged_url) {
                  const currentMetadata = savedListing.listing_metadata || {};
                  const stagedMediaMap = currentMetadata.staged_media_urls || {};
                  stagedMediaMap[uploadedMedia.id] = media.staged_url;
                  currentMetadata.staged_media_urls = stagedMediaMap;
                  
                  // Update listing metadata
                  await apiClient.updateListing(savedListing.id, {
                    listing_metadata: currentMetadata
                  });
                  console.log(`✅ Stored staged URL for new media ${uploadedMedia.id}`);
                }
              }
              
              // If this is the primary image, save the URL
              if (media.is_primary) {
                primaryImageUrl = uploadedMedia.file_url || uploadedMedia.url;
                console.log('📌 Primary image URL saved:', primaryImageUrl);
              }
            } catch (singleUploadError: any) {
              console.error('❌ Single file upload failed:', singleUploadError);
              console.error('Error response:', singleUploadError.response?.data);
              console.error('Error status:', singleUploadError.response?.status);
              console.error('Error headers:', singleUploadError.response?.headers);
              throw singleUploadError; // Re-throw to be caught by outer try-catch
            }
          }
          
          console.log(`\n✅ All ${uploadedCount} media files uploaded successfully!`);
          
          // Update featured image if we have a primary image
          if (primaryImageUrl) {
            console.log('🖼️ Setting featured image URL:', primaryImageUrl);
            await apiClient.updateListing(savedListing.id, { 
              featured_image_url: primaryImageUrl 
            });
            console.log('✅ Featured image URL updated');
          }
          
        } catch (uploadError: any) {
          console.error('❌ MEDIA UPLOAD FAILED:', uploadError);
          console.error('Error message:', uploadError.message);
          console.error('Error response data:', uploadError.response?.data);
          console.error('Error response status:', uploadError.response?.status);
          console.error('Error response headers:', uploadError.response?.headers);
          console.error('Full error object:', uploadError);
          
          // Show detailed error to user
          const errorMessage = uploadError.response?.data?.error || 
                             uploadError.response?.data?.message || 
                             uploadError.message || 
                             'Unknown upload error';
          
          setError(`Listing created successfully, but failed to upload images: ${errorMessage}`);
        }
      } else if (newMediaFiles.length > 0 && !savedListing?.id) {
        console.error('❌ Cannot upload media: listing ID is missing');
        console.error('Saved listing:', savedListing);
        setError('Listing created but media upload failed: listing ID not available');
      } else if (newMediaFiles.length === 0) {
        console.log('ℹ️ No new media files to upload');
      } else {
        console.log('ℹ️ Media upload conditions not met');
      }
      
      // Refresh listing data to get newly uploaded media
      let refreshedListing = savedListing;
      if (editMode && savedListing?.id) {
        try {
          refreshedListing = await apiClient.getListing(savedListing.id);
          console.log('✅ Refreshed listing with new media:', refreshedListing);
        } catch (err) {
          console.error('⚠️ Failed to refresh listing data:', err);
        }
      }
      
      // Show friendly confirmation
      showToast(editMode ? 'Listing updated' : 'Listing created');
      onSuccess?.(refreshedListing);
      onClose();
    } catch (error: any) {
      console.error('Failed to create listing:', error);
      setError(error.response?.data?.message || error.message || 'Failed to create listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedProperty = properties.find(p => p.id === parseInt(formData.property_ref));

  // Enhanced validation logic for edit mode
  const isFormValid = editMode ? true : (
    formData.property_ref && 
    formData.title && 
    formData.description && 
    formData.listing_type &&
    formData.available_from && // Required field
    (formData.listing_type === 'whole_property' || 
     (formData.listing_type === 'rooms' && formData.available_rooms.length > 0))
  );

  // Debug logging
  console.log('Form validation state:', {
    property_ref: formData.property_ref,
    title: formData.title,
    description: formData.description,
    listing_type: formData.listing_type,
    available_from: formData.available_from,
    rooms_length: rooms.length,
    roomsLoading: roomsLoading,
    available_rooms_length: formData.available_rooms.length,
    editMode,
    isFormValid,
    // Individual validation checks
    has_property: !!formData.property_ref,
    has_title: !!formData.title,
    has_description: !!formData.description,
    has_listing_type: !!formData.listing_type,
    has_available_from: !!formData.available_from,
    room_validation: formData.listing_type === 'whole_property' ? 'N/A' : 
                    (formData.available_rooms.length > 0 ? 'PASS' : 'FAIL')
  });

  const handleNext = () => {
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
    }
  };

  const handleBack = () => {
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id);
    }
  };

  const currentStep = tabs.findIndex(t => t.id === activeTab) + 1;

  const renderBasicInfo = () => (
    <>
      <div className={styles.sectionHeader}>
        <h3>Basic Information</h3>
        <p>Set up the fundamental details of your property listing.</p>
        </div>

      <div className={styles.formSection}>
              <div className={styles.formGroup}>
          <label htmlFor="property_ref">Property <span className={styles.required}>*</span></label>
          {editMode ? (
            // In edit mode, show the property name as read-only
            <div className={styles.readOnlyField}>
              <input 
                type="text" 
                value={property_name || (selectedProperty ? `${selectedProperty.name} - ${selectedProperty.full_address}` : 'Loading property...')} 
                readOnly 
                className={styles.readOnlyInput}
              />
              <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Property cannot be changed when editing a listing
              </small>
            </div>
          ) : (
            // In create mode, show the dropdown
            <div className={styles.selectWrapper}>
              <select id="property_ref" value={formData.property_ref} onChange={(e) => handleInputChange('property_ref', e.target.value)} required>
                  <option value="">Select a property...</option>
                  {properties.map(property => (
                  <option key={property.id} value={property.id}>{property.name} - {property.full_address}</option>
                  ))}
                </select>
            </div>
          )}
          {/* Debug info */}
          {editMode && (
            <small style={{ color: '#666', fontSize: '12px' }}>
              Debug: property_ref = "{formData.property_ref}", properties loaded = {properties.length}, existingListing.property_ref = {existingListing?.property_ref}
            </small>
          )}
              </div>

              {selectedProperty && (
                <div className={styles.formGroup}>
            <label>Listing Type <span className={styles.required}>*</span></label>
                  <div className={styles.radioGroup}>
                <label className={`${styles.radioOption} ${formData.listing_type === 'rooms' ? styles.selected : ''}`}>
                    <input type="radio" name="listing_type" value="rooms" checked={formData.listing_type === 'rooms'} onChange={(e) => handleInputChange('listing_type', e.target.value)} />
                    <div className="radio-content">
                        <span className={styles.radioTitle}>Individual Rooms</span>
                        <small className={styles.radioDescription}>Rent out specific rooms in the property</small>
                    </div>
                    </label>
                <label className={`${styles.radioOption} ${formData.listing_type === 'whole_property' ? styles.selected : ''}`}>
                    <input type="radio" name="listing_type" value="whole_property" checked={formData.listing_type === 'whole_property'} onChange={(e) => handleInputChange('listing_type', e.target.value)} />
                    <div className="radio-content">
                        <span className={styles.radioTitle}>Whole Property</span>
                        <small className={styles.radioDescription}>Rent the entire property as one unit</small>
                    </div>
                    </label>
                  </div>
            </div>
          )}
              
              <div className={styles.formGroup}>
          <label htmlFor="title">Listing Title <span className={styles.required}>*</span></label>
          <input id="title" type="text" value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} placeholder={selectedProperty ? `${selectedProperty.name} - Available ${formData.listing_type === 'rooms' ? 'Rooms' : 'Property'}` : 'Enter listing title'} required />
              </div>

              <div className={styles.formGroup}>
          <label htmlFor="description" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Description <span className={styles.required}>*</span></span>
            <button
              type="button"
              onClick={async () => {
                if (!selectedProperty && !propertyData) {
                  alert('Please select a property first');
                  return;
                }
                try {
                  const property = selectedProperty || propertyData;
                  const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
                    ? 'http://localhost:8000'
                    : 'https://tink.global';
                  const resp = await fetch(`${baseUrl}/api/listings/generate-description/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      address: property?.full_address || property?.name || '',
                      type: property?.property_type || '',
                      bedrooms: (property as any)?.bedrooms || 0,
                      bathrooms: (property as any)?.bathrooms || 0,
                      sqft: String((property as any)?.square_footage || ''),
                      price: formData.listing_type === 'whole_property' 
                        ? (property as any)?.monthly_rent || ''
                        : '',
                      amenities: (property as any)?.amenities || [],
                      features: {
                        lot_size_sqft: (property as any)?.lot_size_sqft,
                        year_built: (property as any)?.year_built
                      },
                      neighborhood: (property as any)?.neighborhood || {},
                    }),
                  });
                  if (!resp.ok) {
                    const errJ = await resp.json().catch(() => ({}));
                    throw new Error(errJ.error || 'Failed to generate description');
                  }
                  const data = await resp.json();
                  const newDesc = data.description || '';
                  handleInputChange('description', newDesc);
                } catch (err: any) {
                  alert(err.message || 'Failed to generate description');
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                padding: '0',
                backgroundColor: '#eff6ff',
                border: '1px solid #dbeafe',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#dbeafe';
                e.currentTarget.style.borderColor = '#93c5fd';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#eff6ff';
                e.currentTarget.style.borderColor = '#dbeafe';
              }}
              title="Generate AI description"
            >
              <Wand2 size={16} color="#2563eb" />
            </button>
          </label>
          <textarea id="description" value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Describe your property, highlight key features, nearby amenities, and what makes it special..." rows={4} required />
              </div>

              <div className={styles.formGroup}>
                          <label htmlFor="available_from">Available From <span className={styles.required}>*</span></label>
                <input id="available_from" type="date" value={formData.available_from} onChange={(e) => handleInputChange('available_from', e.target.value)} min={new Date().toISOString().split('T')[0]} required />
              </div>
            </div>

      {formData.listing_type === 'rooms' && (
        <div className={styles.formSection}>
          <div className={styles.sectionHeader}>
            <h4>Select Available Rooms <span className={styles.required}>*</span></h4>
            <p>Choose which rooms you want to include in this listing.</p>
          </div>
          
                      {roomsLoading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <div className={styles.spinner}></div>
                <span style={{ marginLeft: '10px' }}>Loading rooms...</span>
              </div>
          ) : rooms.length > 0 ? (
            <>
              {formData.available_rooms.length === 0 && (
                <div className={`${styles.validationMessage} ${styles.error}`}>
                  Please select at least one room for room-based listings.
                </div>
              )}
              <div className={styles.roomsGrid}>
                {rooms.map(room => (
                  <div key={room.id} className={`${styles.roomCard} ${formData.available_rooms.includes(room.id) ? styles.selected : ''}`} onClick={() => handleRoomToggle(room.id)}>
                    <div className={styles.roomHeader}>
                      <h4>{room.name}</h4>
                      <span className={styles.roomRent}>${room.monthly_rent}/mo</span>
                    </div>
                    <div className={styles.roomDetails}>
                      <span className="room-type">{room.room_type}</span>
                      <span className="room-capacity">Max {room.max_capacity} people</span>
                    </div>
                    <div className={styles.roomCheckbox}>
                      {formData.available_rooms.includes(room.id) ? <CheckCircleIcon /> : <div className={styles.checkboxPlaceholder}></div>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : formData.property_ref ? (
            <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
              <h5>No Rooms Available</h5>
              <p>This property doesn't have any rooms configured. You can add rooms in the property management section, or select "Whole Property" instead.</p>
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p>Please select a property first to see available rooms.</p>
            </div>
          )}
        </div>
      )}


    </>
  );

  // Get available property images that aren't in the listing
  const getAvailablePropertyImages = () => {
    if (!propertyData || !propertyData.images || !Array.isArray(propertyData.images)) {
      return [];
    }
    
    // Get URLs currently in the listing
    const currentUrls = new Set(
      mediaFiles
        .filter(m => !m.file) // Only existing images
        .map(m => {
          // Normalize URL for comparison (remove query params, etc.)
          const url = m.url || '';
          return url.split('?')[0]; // Remove query params
        })
    );
    
    // Filter property images to only those not in listing
    return propertyData.images
      .map((img: any, index: number) => {
        const imgUrl = typeof img === 'string' ? img : (img?.url || img?.file_url || '');
        const normalizedUrl = imgUrl.split('?')[0];
        
        return {
          id: `property-img-${index}`,
          url: imgUrl,
          staged_url: typeof img === 'object' ? (img.staged_url || null) : null,
          caption: typeof img === 'object' ? (img.caption || '') : '',
          originalIndex: index
        };
      })
      .filter((img: any) => {
        const normalizedUrl = img.url.split('?')[0];
        return !currentUrls.has(normalizedUrl);
      });
  };

  // Restore property image to listing
  const handleRestorePropertyImage = (propertyImage: any) => {
    // Preserve original URL - use originalUrl if available, otherwise url
    const originalUrl = propertyImage.originalUrl || propertyImage.url;
    
    const newMediaFile: MediaFile = {
      id: `property-image-${Date.now()}-${propertyImage.originalIndex}`,
      file: null as any,
      url: propertyImage.staged_url || propertyImage.url, // Display staged if available
      originalUrl: originalUrl, // Always preserve original
      staged_url: propertyImage.staged_url || null,
      caption: propertyImage.caption || '',
      is_primary: mediaFiles.length === 0, // Make primary if it's the first image
      uploading: false
    };
    
    setMediaFiles(prev => [...prev, newMediaFile]);
    
    // If using property images, update kept_property_images immediately
    if (editMode && existingListing?.id) {
      const updatedMediaFiles = [...mediaFiles, newMediaFile];
      updateKeptPropertyImages(updatedMediaFiles);
    }
  };

  const renderMediaTab = () => {
    const availablePropertyImages = editMode && propertyData ? getAvailablePropertyImages() : [];
    
    return (
    <>
      <div className={styles.sectionHeader}>
        <h3>Photos & Media</h3>
        <p>Add high-quality photos to showcase your property. The first image will be the featured image.</p>
            </div>
      
      <div className={styles.formSection}>
        <div className={styles.formGroup}>
          <label>Property Photos</label>
          <div className={styles.mediaUploadArea}>
            <input type="file" accept="image/*" multiple onChange={handleFileUpload} className={styles.fileInput} id="media-upload" />
            <label htmlFor="media-upload" className={styles.uploadLabel}>
              <div className={styles.uploadIcon}><UploadIcon /></div>
              <div className={styles.uploadText}>
                <strong>Click to upload photos</strong>
                <span>or drag and drop images here</span>
              </div>
            </label>
          </div>
        </div>

        {/* Available Property Images Section */}
        {availablePropertyImages.length > 0 && (
          <div className={styles.formGroup} style={{ marginTop: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span>Available Property Images</span>
              <span style={{ 
                fontSize: '0.875rem', 
                color: '#6b7280', 
                fontWeight: 'normal' 
              }}>
                ({availablePropertyImages.length} {availablePropertyImages.length === 1 ? 'image' : 'images'} available)
              </span>
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '1rem',
              marginTop: '0.5rem'
            }}>
              {availablePropertyImages.map((img: any) => {
                const displayUrl = img.staged_url || img.url;
                return (
                  <div
                    key={img.id}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '2px solid #e5e7eb',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: '#f9fafb'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#2563eb';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    onClick={() => handleRestorePropertyImage(img)}
                  >
                    <img
                      src={displayUrl ? getMediaUrl(displayUrl) : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNSA2NUw0NSA1NSw1NSA2NUw3NSA0NUwzNSA2NVoiIGZpbGw9IiNEMUQ1REIiLz4KPGNpcmNsZSBjeD0iNDAiIGN5PSIzNSIgcj0iNSIgZmlsbD0iI0QxRDVEQiIvPgo8L3N2Zz4='}
                      alt="Property"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNSA2NUw0NSA1NSw1NSA2NUw3NSA0NUwzNSA2NVoiIGZpbGw9IiNEMUQ1REIiLz4KPGNpcmNsZSBjeD0iNDAiIGN5PSIzNSIgcj0iNSIgZmlsbD0iI0QxRDVEQiIvPgo8L3N2Zz4=';
                      }}
                    />
                    {/* Restore overlay */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0';
                    }}
                    >
                      <div style={{
                        backgroundColor: '#2563eb',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}>
                        <Plus size={16} />
                        <span>Add to Listing</span>
                      </div>
                    </div>
                    {/* Staged badge if applicable */}
                    {img.staged_url && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        backgroundColor: 'rgba(37, 99, 235, 0.9)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Wand2 size={12} />
                        <span>Staged</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <small style={{ display: 'block', marginTop: '0.75rem', color: '#6b7280' }}>
              Click on any image to add it back to your listing. These are images from the property that aren't currently in the listing.
            </small>
          </div>
        )}

        {/* Download All button */}
        {mediaFiles.length > 0 && (
          <div 
            onClick={isDownloadingAll ? undefined : handleDownloadAll}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '12px',
              border: '2px solid #2563eb',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isDownloadingAll ? 'wait' : 'pointer',
              transition: 'all 0.2s',
              backgroundColor: isDownloadingAll ? '#dbeafe' : '#eff6ff',
              marginTop: '1rem',
              marginBottom: '1rem'
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
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#2563eb', textAlign: 'center' }}>
                  Preparing...
                </div>
              </>
            ) : (
              <>
                <Download size={24} style={{ color: '#2563eb', marginBottom: '4px' }} />
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#2563eb', textAlign: 'center' }}>
                  Download All
                </div>
                <div style={{ fontSize: '10px', color: '#60a5fa', marginTop: '2px', textAlign: 'center' }}>
                  {(() => {
                    const originalCount = mediaFiles.length;
                    const stagedCount = mediaFiles.filter(m => m.staged_url).length;
                    const totalFiles = originalCount + stagedCount;
                    return `${totalFiles} file${totalFiles !== 1 ? 's' : ''}`;
                  })()}
                </div>
              </>
            )}
          </div>
        )}

        {mediaFiles.length > 0 && (
          <div className={styles.mediaPreview}>
            <div className={styles.sectionHeader}>
              <h4>Uploaded Photos ({mediaFiles.length})</h4>
            </div>
            <div className={styles.mediaGrid}>
              {mediaFiles.map((media, index) => {
                const displayUrl = media.staged_url || media.url;
                const isStaged = !!media.staged_url;
                
                return (
                  <div 
                    key={media.id} 
                    className={styles.mediaItem}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    style={{ 
                      opacity: draggedIndex === index ? 0.5 : 1,
                      cursor: 'move'
                    }}
                  >
                  <div className={styles.mediaImage}>
                      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        {/* Download button - positioned dynamically based on whether image is staged */}
                        {stagingImageId !== media.id && (
                          <button
                            onClick={() => handleDownloadImage(media, index)}
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: media.staged_url ? '112px' : '62px',
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
                        {/* Use StagedImage component */}
                        <StagedImage
                          originalUrl={getMediaUrl(media.originalUrl || media.url)}
                          stagedUrl={media.staged_url ? getMediaUrl(media.staged_url) : null}
                          mediaId={media.id!}
                          alt={`Property image ${index + 1}`}
                          showStagedByDefault={viewPreferences[media.id!] === true}
                          onToggleView={(mediaId, showStaged) => {
                            setViewPreferences(prev => ({
                              ...prev,
                              [mediaId]: showStaged
                            }));
                          }}
                          onStage={async () => {
                            await handleStageImage(media.id!, index);
                          }}
                        />
                        {/* Drag handle */}
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          backgroundColor: 'rgba(0, 0, 0, 0.6)',
                          color: 'white',
                          padding: '4px',
                          borderRadius: '4px',
                          cursor: 'grab',
                          zIndex: 5
                        }}>
                          <GripVertical size={16} />
                        </div>
                        {/* Primary badge */}
                        {media.is_primary && <div className={styles.primaryBadge}>Featured</div>}
                      </div>
                  </div>
                  <div className={styles.mediaControls}>
                      {/* Download button */}
                      <button
                        type="button"
                        onClick={() => handleDownloadImage(media, index)}
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.85)',
                          border: '1px solid rgba(0,0,0,0.55)',
                          borderRadius: '10px',
                          width: '32px',
                          height: '32px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                          color: '#2563eb',
                          padding: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.12)';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.85)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        title="Download image"
                      >
                        <Download size={16} />
                      </button>
                      {/* Delete button with confirmation */}
                      <button
                        type="button"
                        onClick={async () => {
                          const confirmed = window.confirm('Are you sure you want to delete this image? This action cannot be undone.');
                          if (!confirmed) return;
                          await handleMediaDelete(media.id!);
                        }}
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.85)',
                          border: '1px solid rgba(0,0,0,0.55)',
                          borderRadius: '10px',
                          width: '32px',
                          height: '32px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                          color: '#ef4444',
                          padding: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.12)';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.85)';
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
                      <input 
                        type="text" 
                        placeholder="Add caption..." 
                        value={media.caption} 
                        onChange={(e) => handleMediaUpdate(media.id!, { caption: e.target.value })} 
                      />
                    <div className={styles.mediaActions}>
                        <button 
                          type="button" 
                          onClick={() => setPrimaryImage(media.id!)} 
                          className={`${styles.btn} ${styles.btnSm} ${media.is_primary ? styles.btnPrimary : styles.btnSecondary}`}
                        >
                          {media.is_primary ? 'Featured' : 'Set as Featured'}
                        </button>
                        <button 
                          type="button" 
                          onClick={() => handleMediaDelete(media.id!)} 
                          className={`${styles.btn} ${styles.btnSm} ${styles.btnDanger}`}
                        >
                          Delete
                        </button>
                    </div>
                  </div>
                </div>
                );
              })}
              </div>
            </div>
          )}
        </div>
    </>
  );
  };

  const renderDetailsTab = () => (
    <>
      <div className={styles.sectionHeader}>
        <h3>Property Details</h3>
        <p>Provide detailed information about amenities, policies, and terms.</p>
        </div>

      <div className={styles.formSection}>
        <div className={styles.formGroup}>
          <label>Utilities Included</label>
          <div className={styles.tagGrid}>
            {utilityOptions.map(utility => (
              <button key={utility} type="button" className={`${styles.tagOption} ${formData.utilities_included.includes(utility) ? styles.selected : ''}`} onClick={() => handleArrayToggle('utilities_included', utility)}>
                {utility}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Amenities</label>
          <div className={styles.tagGrid}>
            {amenityOptions.map(amenity => (
              <button key={amenity} type="button" className={`${styles.tagOption} ${formData.amenities.includes(amenity) ? styles.selected : ''}`} onClick={() => handleArrayToggle('amenities', amenity)}>
                {amenity}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="pet_policy">Pet Policy</label>
          <textarea id="pet_policy" value={formData.pet_policy} onChange={(e) => handleInputChange('pet_policy', e.target.value)} placeholder="Describe your pet policy (e.g., 'Pets allowed with deposit')" rows={3} />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="smoking_policy">Smoking Policy</label>
          <div className={styles.selectWrapper}>
            <select id="smoking_policy" value={formData.smoking_policy} onChange={(e) => handleInputChange('smoking_policy', e.target.value)}>
              <option value="no_smoking">No Smoking</option>
              <option value="smoking_allowed">Smoking Allowed</option>
              <option value="designated_areas">Designated Areas Only</option>
            </select>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="lease_terms">Lease Terms</label>
          <textarea id="lease_terms" value={formData.lease_terms} onChange={(e) => handleInputChange('lease_terms', e.target.value)} placeholder="Describe lease terms, minimum duration, renewal options, etc." rows={4} />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="pricing_notes">Pricing Notes</label>
          <textarea id="pricing_notes" value={formData.pricing_notes} onChange={(e) => handleInputChange('pricing_notes', e.target.value)} placeholder="Additional pricing information, deposits, fees, etc." rows={3} />
        </div>
      </div>
    </>
  );

  const renderApplicationTab = () => (
    <>
      <div className={styles.sectionHeader}>
        <h3>Application Settings</h3>
        <p>Configure application requirements and fees for potential tenants.</p>
      </div>
      
      <div className={styles.formSection}>
        <div className={styles.formGroup}>
          <label>Application Configuration</label>
          <div className={styles.radioGroup} style={{ marginBottom: '1.5rem' }}>
            <label 
              className={`${styles.radioOption} ${applicationMode === 'default' ? styles.selected : ''}`}
              onClick={() => {
                setApplicationMode('default');
                // Set default values
                handleInputChange('application_fee', 0);
                handleInputChange('require_background_check', false);
                handleInputChange('require_income_verification', false);
                handleInputChange('minimum_income_ratio', 3);
                handleInputChange('required_documents', []);
              }}
            >
              <input 
                type="radio" 
                name="application_mode" 
                value="default" 
                checked={applicationMode === 'default'} 
                onChange={() => setApplicationMode('default')} 
              />
              <div className="radio-content">
                <span className={styles.radioTitle}>Default</span>
                <small className={styles.radioDescription}>Free application • No background check</small>
              </div>
            </label>
            <label 
              className={`${styles.radioOption} ${applicationMode === 'manual' ? styles.selected : ''}`}
              onClick={() => setApplicationMode('manual')}
            >
              <input 
                type="radio" 
                name="application_mode" 
                value="manual" 
                checked={applicationMode === 'manual'} 
                onChange={() => setApplicationMode('manual')} 
              />
              <div className="radio-content">
                <span className={styles.radioTitle}>Edit Manually</span>
                <small className={styles.radioDescription}>Customize application fee and requirements</small>
              </div>
            </label>
          </div>
        </div>

        {applicationMode === 'manual' && (
          <>
        <div className={styles.formGroup}>
          <label htmlFor="application_fee">Application Fee</label>
          <div className={styles.inputWithPrefix}>
            <span className={styles.prefix}>$</span>
                <input id="application_fee" type="number" value={formData.application_fee} onChange={(e) => handleInputChange('application_fee', parseInt(e.target.value) || 0)} min="0" step="1" />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="minimum_income_ratio">Minimum Income Ratio</label>
          <div className={styles.inputWithSuffix}>
                <input id="minimum_income_ratio" type="number" value={formData.minimum_income_ratio} onChange={(e) => handleInputChange('minimum_income_ratio', parseFloat(e.target.value) || 3)} min="1" max="10" step="0.1" />
            <span className={styles.suffix}>x rent</span>
          </div>
          <small>Income must be at least this many times the monthly rent</small>
        </div>

        <div className={styles.formGroup}>
          <label>Application Requirements</label>
          <div className={styles.checkboxGrid}>
            <label className={`${styles.checkboxOption} ${formData.require_background_check ? styles.selected : ''}`}>
              <input type="checkbox" checked={formData.require_background_check} onChange={(e) => handleInputChange('require_background_check', e.target.checked)} />
              <span>Background Check Required</span>
            </label>
            <label className={`${styles.checkboxOption} ${formData.require_income_verification ? styles.selected : ''}`}>
              <input type="checkbox" checked={formData.require_income_verification} onChange={(e) => handleInputChange('require_income_verification', e.target.checked)} />
              <span>Income Verification Required</span>
            </label>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Required Documents</label>
          <div className={styles.tagGrid}>
            {documentOptions.map(doc => (
              <button key={doc} type="button" className={`${styles.tagOption} ${formData.required_documents.includes(doc) ? styles.selected : ''}`} onClick={() => handleArrayToggle('required_documents', doc)}>
                {doc}
              </button>
            ))}
          </div>
        </div>
          </>
        )}
      </div>
    </>
  );

  const renderContactTab = () => (
    <>
      <div className={styles.sectionHeader}>
        <h3>Publish Your Listing</h3>
        <p>Choose where you want to publish this listing. We'll syndicate it to all selected platforms instantly.</p>
      </div>
      
      <div className={styles.formSection}>
        {/* Publishing Platforms */}
        <div className={styles.formGroup}>
          <label>Publishing Platforms</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
            {/* SquareFt Platform */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              backgroundColor: publishingPlatforms.squareft ? '#eff6ff' : 'white',
              border: `2px solid ${publishingPlatforms.squareft ? '#2563eb' : '#e5e7eb'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setPublishingPlatforms(prev => ({ ...prev, squareft: true }))}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#2563eb',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.875rem'
                }}>Sft</div>
                <div>
                  <div style={{ fontWeight: '600', color: '#111827', marginBottom: '0.25rem' }}>SquareFt Public Listing</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Always included • Free forever</div>
                </div>
              </div>
              <div style={{
                width: '44px',
                height: '24px',
                backgroundColor: publishingPlatforms.squareft ? '#2563eb' : '#d1d5db',
                borderRadius: '12px',
                position: 'relative',
                transition: 'background-color 0.2s',
                cursor: 'pointer'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  left: publishingPlatforms.squareft ? '22px' : '2px',
                  width: '20px',
                  height: '20px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: 'left 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </div>
        </div>

            {/* Other Platforms */}
            {[
              { key: 'zillow', name: 'Zillow', logo: 'Z' },
              { key: 'apartments', name: 'Apartments.com', logo: 'A' },
              { key: 'realtor', name: 'Realtor.com', logo: 'R' },
              { key: 'trulia', name: 'Trulia', logo: 'T' },
              { key: 'facebook', name: 'Facebook Marketplace', logo: 'f' }
            ].map(platform => (
              <div key={platform.key} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'not-allowed',
                opacity: 0.6
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6b7280',
                    fontWeight: 'bold',
                    fontSize: '0.875rem'
                  }}>{platform.logo}</div>
                  <div>
                    <div style={{ fontWeight: '600', color: '#111827', marginBottom: '0.25rem' }}>{platform.name}</div>
                    <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Coming soon</div>
                  </div>
                </div>
                <div style={{
                  width: '44px',
                  height: '24px',
                  backgroundColor: '#d1d5db',
                  borderRadius: '12px',
                  position: 'relative',
                  cursor: 'not-allowed'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    left: '2px',
                    width: '20px',
                    height: '20px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </div>
              </div>
            ))}
          </div>
          <small style={{ display: 'block', marginTop: '0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>
            You can always add more platforms later
          </small>
        </div>

        {/* Listing Status Toggle */}
        <div className={styles.formGroup} style={{ marginTop: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span>Listing Status</span>
            <div style={{
              width: '52px',
              height: '28px',
              backgroundColor: formData.is_active ? '#2563eb' : '#d1d5db',
              borderRadius: '14px',
              position: 'relative',
              transition: 'background-color 0.2s',
              cursor: 'pointer'
            }}
            onClick={() => handleInputChange('is_active', !formData.is_active)}
            >
              <div style={{
                position: 'absolute',
                top: '2px',
                left: formData.is_active ? '26px' : '2px',
                width: '24px',
                height: '24px',
                backgroundColor: 'white',
                borderRadius: '50%',
                transition: 'left 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }} />
            </div>
            </label>
          <small style={{ display: 'block', marginTop: '0.5rem', color: '#6b7280' }}>
            {formData.is_active ? 'Listing is active and visible to tenants' : 'Listing is inactive and hidden'}
          </small>
        </div>

        {/* Contact Information */}
        <div className={styles.formGroup} style={{ marginTop: '1.5rem' }}>
          <label htmlFor="contact_email">Contact Email</label>
          <input id="contact_email" type="email" value={formData.contact_email} onChange={(e) => handleInputChange('contact_email', e.target.value)} placeholder="contact@example.com" />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="contact_phone">Contact Phone</label>
          <input id="contact_phone" type="tel" value={formData.contact_phone} onChange={(e) => handleInputChange('contact_phone', e.target.value)} placeholder="(555) 123-4567" />
        </div>
      </div>
    </>
  );

  const renderTabContent = () => {
    console.log('Rendering tab content for:', activeTab);
    switch (activeTab) {
      case 'basic': return renderBasicInfo();
      case 'media': return renderMediaTab();
      case 'details': return renderDetailsTab();
      case 'application': return renderApplicationTab();
      case 'contact': return renderContactTab();
      default: return renderBasicInfo();
    }
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <h3>{editMode ? 'Edit your property listing' : 'Set up your property listing in 5 easy steps'}</h3>
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close modal">
            <CloseIcon />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.tabsNavigation}>
            {tabs.map((tab, index) => {
              const IconComponent = tab.icon;
              return (
              <button key={tab.id} className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`} onClick={() => {
                console.log('Tab clicked:', tab.id);
                setActiveTab(tab.id);
              }}>
                <div className={styles.tabIcon}><IconComponent /></div>
                <div className={styles.tabLabelGroup}>
                    <span className={styles.tabStep}>Step {index + 1}</span>
                    <span className={styles.tabLabel}>{tab.label}</span>
                </div>
              </button>
              );
            })}
          </div>

          <div className={styles.tabContentArea}>
            {error && (
              <div className={styles.errorMessage}>
                <AlertIcon />
                <span>{error}</span>
              </div>
            )}
            <div className={styles.tabContentScrollable} key={activeTab}>
              {renderTabContent()}
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <div className={styles.footerLeft}>
            <span className={styles.formProgress}>Step {currentStep} of {tabs.length}: {tabs[currentStep - 1].label}</span>
            {activeTab === 'contact' && !isFormValid && !editMode && (
              <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
                Missing: {[
                  !formData.property_ref && 'Property',
                  !formData.title && 'Title', 
                  !formData.description && 'Description',
                  !formData.available_from && 'Available Date',
                  formData.listing_type === 'rooms' && formData.available_rooms.length === 0 && 'Select Rooms'
                ].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
          <div className={styles.footerRight}>
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onClose}>Cancel</button>
            {currentStep > 1 && (
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleBack}>Back</button>
            )}
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={activeTab === 'contact' ? handleSubmit : handleNext} disabled={loading || (activeTab === 'contact' && !isFormValid)}>
                {loading ? (editMode ? 'Updating...' : 'Creating...') : 
                 activeTab === 'contact' ? (editMode ? 'Update Listing' : 'Create Listing') : 'Next'}
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewListingModal; 