import React, { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { Property, Room } from '../lib/types';
import styles from './NewListingModal.module.css';

interface NewListingModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  editMode?: boolean;
  existingListing?: any;
}

interface MediaFile {
  id?: string;
  file: File;
  url: string;
  caption: string;
  is_primary: boolean;
  uploading?: boolean;
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

const NewListingModal = ({ onClose, onSuccess, editMode = false, existingListing }: NewListingModalProps) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormDataPopulated, setIsFormDataPopulated] = useState(false);
  
  console.log('NewListingModal render - activeTab:', activeTab, 'editMode:', editMode, 'existingListing:', !!existingListing);
  // Properties and rooms data
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  
  // Form data
  const [formData, setFormData] = useState({
    // Basic Info
    property_ref: '',
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
    application_fee: 50,
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
    fetchProperties();
  }, []);

  // Populate form with existing data in edit mode
  useEffect(() => {
    console.log('useEffect triggered - editMode:', editMode, 'existingListing:', existingListing);
    
    if (editMode && existingListing) {
      console.log('Populating form with existing listing data:', existingListing);
      
      // Ensure property_ref is properly converted to string
      const propertyRefValue = existingListing.property_ref ? existingListing.property_ref.toString() : '';
      console.log('Setting property_ref to:', propertyRefValue);
      
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
        
        // Handle property details that might be at root level
        pricing_notes: existingListing.pricing_notes || '',
        lease_terms: existingListing.lease_terms || '',
        utilities_included: Array.isArray(existingListing.utilities_included) ? existingListing.utilities_included : [],
        amenities: Array.isArray(existingListing.amenities) ? existingListing.amenities : [],
        pet_policy: existingListing.pet_policy || '',
        smoking_policy: existingListing.smoking_policy || (existingListing.smoking_allowed ? 'smoking_allowed' : 'no_smoking'),
        
        // Contact information
        contact_email: existingListing.contact_info?.contact_email || existingListing.contact_email || '',
        contact_phone: existingListing.contact_info?.contact_phone || existingListing.contact_phone || '',
        show_landlord_info: existingListing.show_landlord_info !== false,
        is_active: existingListing.is_active !== false,
        
        // SEO fields
        seo_title: existingListing.seo_title || '',
        seo_description: existingListing.seo_description || '',
        marketing_tags: Array.isArray(existingListing.marketing_tags) ? existingListing.marketing_tags : [],
      };

      console.log('Setting form data to:', newFormData);
      setFormData(newFormData);
      setIsFormDataPopulated(true); // Mark form data as populated

      // Load existing media if available
      if (existingListing.media && Array.isArray(existingListing.media) && existingListing.media.length > 0) {
        const existingMedia = existingListing.media.map((media: any, index: number) => ({
          id: media.id?.toString() || `existing-${index}`,
          file: null as any, // No file object for existing media
          url: media.file_url || media.url,
          caption: media.caption || '',
          is_primary: media.is_primary || index === 0,
          uploading: false
        }));
        setMediaFiles(existingMedia);
        console.log('Loaded existing media:', existingMedia);
      }
    }
  }, [editMode, existingListing]);

  useEffect(() => {
    if (formData.property_ref) {
      fetchRooms(parseInt(formData.property_ref));
    }
  }, [formData.property_ref]);

  // Auto-adjust listing type based on available rooms
  useEffect(() => {
    if (formData.property_ref && rooms.length === 0) {
      // If no rooms are available, default to whole property
      setFormData(prev => ({
        ...prev,
        listing_type: 'whole_property'
      }));
    }
  }, [formData.property_ref, rooms.length]);

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
      const roomsData = await apiClient.getPropertyRooms(propertyId);
      setRooms(roomsData);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      setRooms([]);
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

  const handleMediaDelete = (id: string) => {
    setMediaFiles(prev => {
      const filtered = prev.filter(media => media.id !== id);
      // If we deleted the primary image, make the first remaining image primary
      if (filtered.length > 0 && !filtered.some(media => media.is_primary)) {
        filtered[0].is_primary = true;
      }
      return filtered;
    });
  };

  const setPrimaryImage = (id: string) => {
    console.log('Setting primary image:', id);
    setMediaFiles(prev => {
      const updated = prev.map(media => ({
        ...media,
        is_primary: media.id === id
      }));
      console.log('Updated media files:', updated);
      return updated;
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (!formData.property_ref || !formData.title || !formData.description) {
        throw new Error('Please fill in all required fields (Property, Title, Description).');
      }

      if (formData.listing_type === 'rooms' && formData.available_rooms.length === 0) {
        throw new Error('Please select at least one room for room-based listings.');
      }

      const selectedProperty = properties.find(p => p.id === parseInt(formData.property_ref));
      
      // First, create/update the listing
      const listingData = {
        property_ref: parseInt(formData.property_ref),
        title: formData.title,
        description: formData.description,
        listing_type: formData.listing_type,
        available_rooms: formData.listing_type === 'rooms' ? formData.available_rooms : [],
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
        is_active: formData.is_active,
        seo_title: formData.seo_title || formData.title,
        seo_description: formData.seo_description || formData.description,
        marketing_tags: formData.marketing_tags,
        property_name: selectedProperty?.name || '',
        property_address: selectedProperty?.full_address || '',
        
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

      // Now upload media files if any
      const newMediaFiles = mediaFiles.filter(media => media.file); // Only new files with File objects
      console.log('=== MEDIA UPLOAD DEBUG ===');
      console.log('Total mediaFiles:', mediaFiles.length);
      console.log('All mediaFiles:', mediaFiles.map(m => ({
        id: m.id,
        hasFile: !!m.file,
        fileName: m.file?.name,
        fileSize: m.file?.size,
        fileType: m.file?.type,
        caption: m.caption,
        is_primary: m.is_primary,
        url: m.url
      })));
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
      
      onSuccess?.();
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
    (formData.listing_type === 'whole_property' || 
     (formData.listing_type === 'rooms' && rooms.length > 0 && formData.available_rooms.length > 0))
  );

  // Debug logging
  console.log('Form validation state:', {
    property_ref: formData.property_ref,
    title: formData.title,
    description: formData.description,
    listing_type: formData.listing_type,
    rooms_length: rooms.length,
    available_rooms_length: formData.available_rooms.length,
    editMode,
    isFormValid
  });

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
                value={selectedProperty ? `${selectedProperty.name} - ${selectedProperty.full_address}` : 'Loading property...'} 
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
          <label htmlFor="description">Description <span className={styles.required}>*</span></label>
          <textarea id="description" value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Describe your property, highlight key features, nearby amenities, and what makes it special..." rows={4} required />
              </div>

              <div className={styles.formGroup}>
          <label htmlFor="available_from">Available From</label>
          <input id="available_from" type="date" value={formData.available_from} onChange={(e) => handleInputChange('available_from', e.target.value)} />
              </div>
            </div>

      {formData.listing_type === 'rooms' && rooms.length > 0 && (
        <div className={styles.formSection}>
          <div className={styles.sectionHeader}>
            <h4>Select Available Rooms <span className={styles.required}>*</span></h4>
            <p>Choose which rooms you want to include in this listing.</p>
          </div>
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
        </div>
      )}

      {formData.listing_type === 'rooms' && rooms.length === 0 && formData.property_ref && (
        <div className={styles.formSection}>
          <div className={styles.sectionHeader}>
            <h4>No Rooms Available</h4>
            <p>This property doesn't have any rooms set up yet.</p>
          </div>
          <div className={`${styles.validationMessage} ${styles.warning}`}>
            You need to add rooms to this property before creating a room-based listing.
            <br />
            <a href={`/properties/${formData.property_ref}/add-room`} target="_blank" rel="noopener noreferrer">
              Add rooms to this property
            </a>
          </div>
                </div>
              )}
    </>
  );

  const renderMediaTab = () => (
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

        {mediaFiles.length > 0 && (
          <div className={styles.mediaPreview}>
            <div className={styles.sectionHeader}>
              <h4>Uploaded Photos ({mediaFiles.length})</h4>
            </div>
            <div className={styles.mediaGrid}>
              {mediaFiles.map(media => (
                <div key={media.id} className={styles.mediaItem}>
                  <div className={styles.mediaImage}>
                    <img src={media.url} alt="Property" />
                    {media.is_primary && <div className={styles.primaryBadge}>Featured</div>}
                  </div>
                  <div className={styles.mediaControls}>
                    <input type="text" placeholder="Add caption..." value={media.caption} onChange={(e) => handleMediaUpdate(media.id!, { caption: e.target.value })} />
                    <div className={styles.mediaActions}>
                      <button type="button" onClick={() => setPrimaryImage(media.id!)} className={`${styles.btn} ${styles.btnSm} ${media.is_primary ? styles.btnPrimary : styles.btnSecondary}`}>{media.is_primary ? 'Featured' : 'Set as Featured'}</button>
                      <button type="button" onClick={() => handleMediaDelete(media.id!)} className={`${styles.btn} ${styles.btnSm} ${styles.btnDanger}`}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          )}
        </div>
    </>
  );

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
          <label htmlFor="application_fee">Application Fee</label>
          <div className={styles.inputWithPrefix}>
            <span className={styles.prefix}>$</span>
            <input id="application_fee" type="number" value={formData.application_fee} onChange={(e) => handleInputChange('application_fee', parseInt(e.target.value))} min="0" step="1" />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="minimum_income_ratio">Minimum Income Ratio</label>
          <div className={styles.inputWithSuffix}>
            <input id="minimum_income_ratio" type="number" value={formData.minimum_income_ratio} onChange={(e) => handleInputChange('minimum_income_ratio', parseFloat(e.target.value))} min="1" max="10" step="0.1" />
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
      </div>
    </>
  );

  const renderContactTab = () => (
    <>
      <div className={styles.sectionHeader}>
        <h3>Contact & Publish</h3>
        <p>Set contact information and publish your listing.</p>
      </div>
      
      <div className={styles.formSection}>
        <div className={styles.formGroup}>
          <label htmlFor="contact_email">Contact Email</label>
          <input id="contact_email" type="email" value={formData.contact_email} onChange={(e) => handleInputChange('contact_email', e.target.value)} placeholder="contact@example.com" />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="contact_phone">Contact Phone</label>
          <input id="contact_phone" type="tel" value={formData.contact_phone} onChange={(e) => handleInputChange('contact_phone', e.target.value)} placeholder="(555) 123-4567" />
        </div>

        <div className={styles.formGroup}>
          <label>Visibility Settings</label>
          <div className={styles.checkboxGrid}>
            <label className={`${styles.checkboxOption} ${formData.show_landlord_info ? styles.selected : ''}`}>
              <input type="checkbox" checked={formData.show_landlord_info} onChange={(e) => handleInputChange('show_landlord_info', e.target.checked)} />
              <span>Show Landlord Information</span>
            </label>
            <label className={`${styles.checkboxOption} ${formData.is_active ? styles.selected : ''}`}>
              <input type="checkbox" checked={formData.is_active} onChange={(e) => handleInputChange('is_active', e.target.checked)} />
              <span>Publish Listing (Active)</span>
            </label>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="seo_title">SEO Title</label>
          <input id="seo_title" type="text" value={formData.seo_title} onChange={(e) => handleInputChange('seo_title', e.target.value)} placeholder="Custom title for search engines (optional)" />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="seo_description">SEO Description</label>
          <textarea id="seo_description" value={formData.seo_description} onChange={(e) => handleInputChange('seo_description', e.target.value)} placeholder="Custom description for search engines (optional)" rows={3} />
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
          </div>
          <div className={styles.footerRight}>
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onClose}>Cancel</button>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSubmit} disabled={loading || !isFormValid}>
                {loading ? (editMode ? 'Updating...' : 'Creating...') : (editMode ? 'Update Listing' : 'Create Listing')}
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewListingModal; 