import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { Property, Room } from '../lib/types';

interface NewListingModalProps {
  onClose: () => void;
  onSuccess?: () => void;
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

const NewListingModal = ({ onClose, onSuccess }: NewListingModalProps) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
    virtual_tour_url: '',
    
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

  useEffect(() => {
    if (formData.property_ref) {
      fetchRooms(parseInt(formData.property_ref));
    }
  }, [formData.property_ref]);

  const fetchProperties = async () => {
    try {
      const response = await apiClient.getProperties();
      setProperties(response.results || []);
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
    setMediaFiles(prev => 
      prev.map(media => ({
        ...media,
        is_primary: media.id === id
      }))
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const selectedProperty = properties.find(p => p.id === parseInt(formData.property_ref));
      
      const listingData = {
        property_ref: parseInt(formData.property_ref),
        title: formData.title,
        description: formData.description,
        listing_type: formData.listing_type,
        available_rooms: formData.listing_type === 'rooms' ? formData.available_rooms : [],
        available_from: formData.available_from || undefined,
        featured_image_url: mediaFiles.find(m => m.is_primary)?.url || mediaFiles[0]?.url || '',
        
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
        virtual_tour_url: formData.virtual_tour_url,
        seo_title: formData.seo_title || formData.title,
        seo_description: formData.seo_description || formData.description,
        marketing_tags: formData.marketing_tags,
        property_name: selectedProperty?.name || '',
        property_address: selectedProperty?.full_address || '',
      };

      await apiClient.createListing(listingData);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Failed to create listing:', error);
      setError(error.response?.data?.message || 'Failed to create listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedProperty = properties.find(p => p.id === parseInt(formData.property_ref));
  const isFormValid = formData.property_ref && formData.title && formData.description;
  const currentStep = tabs.findIndex(t => t.id === activeTab) + 1;

  const renderBasicInfo = () => (
    <>
      <div className="section-header">
        <h3>Basic Information</h3>
        <p>Set up the fundamental details of your property listing.</p>
        </div>

      <div className="form-section">
              <div className="form-group">
          <label htmlFor="property_ref">Property <span className="required">*</span></label>
          <div className="select-wrapper">
            <select id="property_ref" value={formData.property_ref} onChange={(e) => handleInputChange('property_ref', e.target.value)} required>
                  <option value="">Select a property...</option>
                  {properties.map(property => (
                <option key={property.id} value={property.id}>{property.name} - {property.full_address}</option>
                  ))}
                </select>
          </div>
              </div>

              {selectedProperty && (
                <div className="form-group">
            <label>Listing Type <span className="required">*</span></label>
                  <div className="radio-group">
                <label className={`radio-option ${formData.listing_type === 'rooms' ? 'selected' : ''}`}>
                    <input type="radio" name="listing_type" value="rooms" checked={formData.listing_type === 'rooms'} onChange={(e) => handleInputChange('listing_type', e.target.value)} />
                    <div className="radio-content">
                        <span className="radio-title">Individual Rooms</span>
                        <small className="radio-description">Rent out specific rooms in the property</small>
                    </div>
                    </label>
                <label className={`radio-option ${formData.listing_type === 'whole_property' ? 'selected' : ''}`}>
                    <input type="radio" name="listing_type" value="whole_property" checked={formData.listing_type === 'whole_property'} onChange={(e) => handleInputChange('listing_type', e.target.value)} />
                    <div className="radio-content">
                        <span className="radio-title">Whole Property</span>
                        <small className="radio-description">Rent the entire property as one unit</small>
                    </div>
                    </label>
                  </div>
            </div>
          )}
              
              <div className="form-group">
          <label htmlFor="title">Listing Title <span className="required">*</span></label>
          <input id="title" type="text" value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} placeholder={selectedProperty ? `${selectedProperty.name} - Available ${formData.listing_type === 'rooms' ? 'Rooms' : 'Property'}` : 'Enter listing title'} required />
              </div>

              <div className="form-group">
          <label htmlFor="description">Description <span className="required">*</span></label>
          <textarea id="description" value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Describe your property, highlight key features, nearby amenities, and what makes it special..." rows={4} required />
              </div>

              <div className="form-group">
          <label htmlFor="available_from">Available From</label>
          <input id="available_from" type="date" value={formData.available_from} onChange={(e) => handleInputChange('available_from', e.target.value)} />
              </div>
            </div>

      {formData.listing_type === 'rooms' && rooms.length > 0 && (
        <div className="form-section">
          <div className="section-header">
            <h4>Select Available Rooms</h4>
            <p>Choose which rooms you want to include in this listing.</p>
          </div>
                <div className="rooms-grid">
                  {rooms.map(room => (
                <div key={room.id} className={`room-card ${formData.available_rooms.includes(room.id) ? 'selected' : ''}`} onClick={() => handleRoomToggle(room.id)}>
                      <div className="room-header">
                        <h4>{room.name}</h4>
                        <span className="room-rent">${room.monthly_rent}/mo</span>
                      </div>
                      <div className="room-details">
                        <span className="room-type">{room.room_type}</span>
                        <span className="room-capacity">Max {room.max_capacity} people</span>
                      </div>
                      <div className="room-checkbox">
                        {formData.available_rooms.includes(room.id) ? <CheckCircleIcon /> : <div className="checkbox-placeholder"></div>}
                      </div>
                    </div>
                  ))}
                </div>
                </div>
              )}
    </>
  );

  const renderMediaTab = () => (
    <>
      <div className="section-header">
        <h3>Photos & Media</h3>
        <p>Add high-quality photos to showcase your property. The first image will be the featured image.</p>
            </div>
      
      <div className="form-section">
        <div className="form-group">
          <label>Property Photos</label>
          <div className="media-upload-area">
            <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="file-input" id="media-upload" />
            <label htmlFor="media-upload" className="upload-label">
              <div className="upload-icon"><UploadIcon /></div>
              <div className="upload-text">
                <strong>Click to upload photos</strong>
                <span>or drag and drop images here</span>
              </div>
            </label>
          </div>
        </div>

        {mediaFiles.length > 0 && (
          <div className="media-preview">
            <div className="section-header">
              <h4>Uploaded Photos ({mediaFiles.length})</h4>
            </div>
            <div className="media-grid">
              {mediaFiles.map(media => (
                <div key={media.id} className="media-item">
                  <div className="media-image">
                    <img src={media.url} alt="Property" />
                    {media.is_primary && <div className="primary-badge">Featured</div>}
                  </div>
                  <div className="media-controls">
                    <input type="text" placeholder="Add caption..." value={media.caption} onChange={(e) => handleMediaUpdate(media.id!, { caption: e.target.value })} />
                    <div className="media-actions">
                      <button type="button" onClick={() => setPrimaryImage(media.id!)} className={`btn btn-sm ${media.is_primary ? 'btn-primary' : 'btn-secondary'}`}>{media.is_primary ? 'Featured' : 'Set as Featured'}</button>
                      <button type="button" onClick={() => handleMediaDelete(media.id!)} className="btn btn-sm btn-danger">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          )}

        <div className="form-group">
          <label htmlFor="virtual_tour_url">Virtual Tour URL</label>
          <input id="virtual_tour_url" type="url" value={formData.virtual_tour_url} onChange={(e) => handleInputChange('virtual_tour_url', e.target.value)} placeholder="https://example.com/virtual-tour" />
        </div>
      </div>
    </>
  );

  const renderDetailsTab = () => (
    <>
      <div className="section-header">
        <h3>Property Details</h3>
        <p>Provide detailed information about amenities, policies, and terms.</p>
          </div>
      
      <div className="form-section">
        <div className="form-group">
          <label>Utilities Included</label>
          <div className="checkbox-grid">
            {utilityOptions.map(utility => (
              <label key={utility} className={`checkbox-option ${formData.utilities_included.includes(utility) ? 'selected' : ''}`}>
                <input type="checkbox" checked={formData.utilities_included.includes(utility)} onChange={() => handleArrayToggle('utilities_included', utility)} />
                <span>{utility}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Amenities</label>
          <div className="checkbox-grid">
            {amenityOptions.map(amenity => (
              <label key={amenity} className={`checkbox-option ${formData.amenities.includes(amenity) ? 'selected' : ''}`}>
                <input type="checkbox" checked={formData.amenities.includes(amenity)} onChange={() => handleArrayToggle('amenities', amenity)} />
                <span>{amenity}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="pet_policy">Pet Policy</label>
          <textarea id="pet_policy" value={formData.pet_policy} onChange={(e) => handleInputChange('pet_policy', e.target.value)} placeholder="Describe your pet policy (e.g., 'Pets allowed with deposit')" rows={3} />
        </div>

        <div className="form-group">
          <label htmlFor="smoking_policy">Smoking Policy</label>
          <div className="select-wrapper">
            <select id="smoking_policy" value={formData.smoking_policy} onChange={(e) => handleInputChange('smoking_policy', e.target.value)}>
              <option value="no_smoking">No Smoking</option>
              <option value="smoking_allowed">Smoking Allowed</option>
              <option value="designated_areas">Designated Areas Only</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="lease_terms">Lease Terms</label>
          <textarea id="lease_terms" value={formData.lease_terms} onChange={(e) => handleInputChange('lease_terms', e.target.value)} placeholder="Describe lease terms, minimum duration, renewal options, etc." rows={4} />
        </div>

        <div className="form-group">
          <label htmlFor="pricing_notes">Pricing Notes</label>
          <textarea id="pricing_notes" value={formData.pricing_notes} onChange={(e) => handleInputChange('pricing_notes', e.target.value)} placeholder="Additional pricing information, deposits, fees, etc." rows={3} />
        </div>
      </div>
    </>
  );

  const renderApplicationTab = () => (
    <>
      <div className="section-header">
        <h3>Application Settings</h3>
        <p>Configure application requirements and fees for potential tenants.</p>
      </div>
      
      <div className="form-section">
        <div className="form-group">
          <label htmlFor="application_fee">Application Fee</label>
          <div className="input-with-prefix">
            <span className="prefix">$</span>
            <input id="application_fee" type="number" value={formData.application_fee} onChange={(e) => handleInputChange('application_fee', parseInt(e.target.value))} min="0" step="1" />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="minimum_income_ratio">Minimum Income Ratio</label>
          <div className="input-with-suffix">
            <input id="minimum_income_ratio" type="number" value={formData.minimum_income_ratio} onChange={(e) => handleInputChange('minimum_income_ratio', parseFloat(e.target.value))} min="1" max="10" step="0.1" />
            <span className="suffix">x rent</span>
          </div>
          <small>Income must be at least this many times the monthly rent</small>
        </div>

        <div className="form-group">
          <label>Application Requirements</label>
          <div className="checkbox-grid single-column">
            <label className={`checkbox-option ${formData.require_background_check ? 'selected' : ''}`}>
              <input type="checkbox" checked={formData.require_background_check} onChange={(e) => handleInputChange('require_background_check', e.target.checked)} />
              <span>Background Check Required</span>
            </label>
            <label className={`checkbox-option ${formData.require_income_verification ? 'selected' : ''}`}>
              <input type="checkbox" checked={formData.require_income_verification} onChange={(e) => handleInputChange('require_income_verification', e.target.checked)} />
              <span>Income Verification Required</span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>Required Documents</label>
          <div className="checkbox-grid">
            {documentOptions.map(doc => (
              <label key={doc} className={`checkbox-option ${formData.required_documents.includes(doc) ? 'selected' : ''}`}>
                <input type="checkbox" checked={formData.required_documents.includes(doc)} onChange={() => handleArrayToggle('required_documents', doc)} />
                <span>{doc}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  const renderContactTab = () => (
    <>
      <div className="section-header">
        <h3>Contact & Publish</h3>
        <p>Set contact information and publish your listing.</p>
      </div>
      
      <div className="form-section">
        <div className="form-group">
          <label htmlFor="contact_email">Contact Email</label>
          <input id="contact_email" type="email" value={formData.contact_email} onChange={(e) => handleInputChange('contact_email', e.target.value)} placeholder="contact@example.com" />
        </div>

        <div className="form-group">
          <label htmlFor="contact_phone">Contact Phone</label>
          <input id="contact_phone" type="tel" value={formData.contact_phone} onChange={(e) => handleInputChange('contact_phone', e.target.value)} placeholder="(555) 123-4567" />
        </div>

        <div className="form-group">
          <label>Visibility Settings</label>
          <div className="checkbox-grid single-column">
            <label className={`checkbox-option ${formData.show_landlord_info ? 'selected' : ''}`}>
              <input type="checkbox" checked={formData.show_landlord_info} onChange={(e) => handleInputChange('show_landlord_info', e.target.checked)} />
              <span>Show Landlord Information</span>
            </label>
            <label className={`checkbox-option ${formData.is_active ? 'selected' : ''}`}>
              <input type="checkbox" checked={formData.is_active} onChange={(e) => handleInputChange('is_active', e.target.checked)} />
              <span>Publish Listing (Active)</span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="seo_title">SEO Title</label>
          <input id="seo_title" type="text" value={formData.seo_title} onChange={(e) => handleInputChange('seo_title', e.target.value)} placeholder="Custom title for search engines (optional)" />
        </div>

        <div className="form-group">
          <label htmlFor="seo_description">SEO Description</label>
          <textarea id="seo_description" value={formData.seo_description} onChange={(e) => handleInputChange('seo_description', e.target.value)} placeholder="Custom description for search engines (optional)" rows={3} />
        </div>
      </div>
    </>
  );

  const renderTabContent = () => {
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
    <div className="modal-backdrop">
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-title">
            <h3>Set up your property listing in 5 easy steps</h3>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close modal">
            <CloseIcon />
              </button>
        </div>

        <div className="modal-body">
          <div className="tabs-navigation">
            {tabs.map((tab, index) => {
              const IconComponent = tab.icon;
              return (
              <button key={tab.id} className={`tab-button ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                <div className="tab-icon"><IconComponent /></div>
                <div className="tab-label-group">
                    <span className="tab-step">Step {index + 1}</span>
                    <span className="tab-label">{tab.label}</span>
                </div>
              </button>
              );
            })}
          </div>

          <div className="tab-content-area">
            {error && (
              <div className="error-message">
                <AlertIcon />
                <span>{error}</span>
              </div>
            )}
            <div className="tab-content-scrollable">
              {renderTabContent()}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="footer-left">
            <span className="form-progress">Step {currentStep} of {tabs.length}: {tabs[currentStep - 1].label}</span>
          </div>
          <div className="footer-right">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !isFormValid}>
                {loading ? 'Creating...' : 'Create Listing'}
              </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          top: 70px;
          left: 0;
          width: 100%;
          height: calc(100% - 70px);
          background-color: rgba(17, 24, 39, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          backdrop-filter: blur(8px);
          padding: 1rem;
        }

        .modal-container {
          background: #F9FAFB;
          border-radius: 16px;
          width: 100%;
          max-width: 1100px;
          height: 100%; /* Adjusted to fill the backdrop space */
          max-height: 100%; /* Ensure it doesn't overflow its container */
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          border: 1px solid var(--gray-200);
        }

        .modal-header {
          padding: 16px 24px;
          border-bottom: 1px solid var(--gray-200);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          flex-shrink: 0;
        }

        .modal-title h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--gray-800);
        }

        .close-button {
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--gray-500);
          padding: 8px;
          border-radius: 50%;
          transition: all 0.2s ease;
          display: flex;
        }

        .close-button:hover {
          background-color: var(--gray-200);
          color: var(--gray-800);
        }

        .modal-body {
          flex-grow: 1;
          display: flex;
          overflow: hidden;
        }

        .tabs-navigation {
          width: 250px;
          background: white;
          border-right: 1px solid var(--gray-200);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex-shrink: 0;
        }

        .tab-button {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          color: var(--gray-600);
          border-radius: 8px;
        }

        .tab-button:hover {
          background-color: var(--gray-100);
          color: var(--gray-900);
        }

        .tab-button.active {
          background-color: var(--primary-blue-light);
          color: var(--primary-blue-dark);
          font-weight: 600;
        }
        
        .tab-button.active .tab-icon {
            color: var(--primary-blue);
        }

        .tab-icon {
          flex-shrink: 0;
          color: var(--gray-500);
        }
        
        .tab-label-group {
            display: flex;
            flex-direction: column;
        }

        .tab-step {
            font-size: 12px;
            font-weight: 500;
            color: var(--gray-500);
        }
        
        .tab-button.active .tab-step {
            color: var(--primary-blue);
        }

        .tab-label {
          font-weight: 500;
        }
        
        .tab-button.active .tab-label {
            font-weight: 600;
        }

        .tab-content-area {
          flex-grow: 1;
          overflow-y: hidden;
          padding: 0;
          background: #F9FAFB;
          display: flex;
          flex-direction: column;
        }
        
        .tab-content-scrollable {
          overflow-y: auto;
            padding: 24px 32px;
        }

        .tab-content-scrollable::-webkit-scrollbar {
          width: 6px;
        }

        .tab-content-scrollable::-webkit-scrollbar-track {
          background: transparent;
        }

        .tab-content-scrollable::-webkit-scrollbar-thumb {
          background: var(--gray-300);
          border-radius: 3px;
        }

        .section-header {
          margin-bottom: 24px;
        }

        .section-header h3 {
          margin: 0 0 4px 0;
          font-size: 20px;
          font-weight: 600;
          color: var(--gray-900);
        }

        .section-header h4 {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--gray-800);
        }

        .section-header p {
          margin: 0;
          color: var(--gray-600);
          font-size: 14px;
          line-height: 1.5;
        }

        .form-section {
          background: white;
          padding: 24px;
          border-radius: 12px;
          border: 1px solid var(--gray-200);
          margin-bottom: 24px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: var(--gray-700);
          font-size: 14px;
        }

        .required {
          color: var(--error-red);
        }

        .form-group input[type="text"],
        .form-group input[type="email"],
        .form-group input[type="tel"],
        .form-group input[type="url"],
        .form-group input[type="number"],
        .form-group input[type="date"],
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid var(--gray-300);
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s ease;
          background: white;
          box-sizing: border-box;
          color: var(--gray-900);
        }

        .form-group input::placeholder,
        .form-group textarea::placeholder {
          color: var(--gray-400);
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--primary-blue);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }
        
        .form-group select {
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            padding-right: 32px;
        }

        .select-wrapper {
          position: relative;
        }

        .select-wrapper::after {
          content: '▼';
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 12px;
          color: var(--gray-400);
          pointer-events: none;
        }
        
        .form-group textarea {
          resize: vertical;
          min-height: 100px;
        }

        .radio-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .radio-option {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          cursor: pointer;
          padding: 16px;
          border: 1px solid var(--gray-300);
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .radio-option.selected {
          border-color: var(--primary-blue);
          background-color: var(--primary-blue-light);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }

        .radio-option input {
            margin-top: 3px;
        }

        .radio-title {
          font-weight: 500;
          color: var(--gray-800);
        }

        .radio-description {
          font-size: 12px;
          color: var(--gray-500);
        }

        .checkbox-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        }
        
        .checkbox-grid.single-column {
            grid-template-columns: 1fr;
        }

        .checkbox-option {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          padding: 12px;
          border: 1px solid var(--gray-200);
          border-radius: 8px;
          transition: all 0.2s ease;
          background: #F9FAFB;
        }

        .checkbox-option.selected {
          border-color: var(--primary-blue);
          background-color: var(--primary-blue-light);
        }
        
        .checkbox-option input {
            accent-color: var(--primary-blue);
        }

        .rooms-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 16px;
        }

        .room-card {
          border: 1px solid var(--gray-300);
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .room-card.selected {
          border-color: var(--primary-blue);
          background-color: var(--primary-blue-light);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }
        
        .room-card .room-checkbox {
            position: absolute;
            top: 16px;
            right: 16px;
            color: var(--primary-blue);
        }
        
        .room-checkbox .checkbox-placeholder {
            width: 16px;
            height: 16px;
            border: 2px solid var(--gray-400);
            border-radius: 50%;
        }

        .room-header {
          margin-bottom: 8px;
        }

        .room-header h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
        }

        .room-rent {
          font-weight: 600;
          color: var(--success-green-dark);
          font-size: 13px;
        }

        .room-details {
          font-size: 12px;
          color: var(--gray-500);
        }

        .media-upload-area {
          border: 2px dashed var(--gray-300);
          border-radius: 8px;
          padding: 32px;
          text-align: center;
          transition: all 0.2s ease;
        }
        
        .media-upload-area:hover {
            border-color: var(--primary-blue);
            background-color: var(--primary-blue-light);
        }

        .file-input { display: none; }
        .upload-label { cursor: pointer; }
        .upload-icon { color: var(--gray-500); margin-bottom: 8px; }
        .upload-text strong { display: block; color: var(--gray-800); font-weight: 500; }
        .upload-text span { font-size: 12px; color: var(--gray-500); }

        .media-preview { margin-top: 24px; }
        
        .media-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 16px;
        }

        .media-item {
          border: 1px solid var(--gray-200);
          border-radius: 8px;
          overflow: hidden;
        }
        .media-image { position: relative; aspect-ratio: 16/10; }
        .media-image img { width: 100%; height: 100%; object-fit: cover; }
        .primary-badge {
            position: absolute;
            top: 8px; left: 8px;
            background: rgba(0,0,0,0.5);
            color: white; padding: 4px 8px;
            border-radius: 4px; font-size: 10px;
        }
        .media-controls { padding: 12px; }
        .media-controls input {
            width: 100%;
            border: 1px solid var(--gray-300);
            border-radius: 4px; padding: 8px;
            font-size: 12px;
            margin-bottom: 8px;
        }
        .media-actions { display: flex; gap: 8px; }

        .input-with-prefix, .input-with-suffix {
            display: flex;
            border: 1px solid var(--gray-300);
            border-radius: 8px;
            overflow: hidden;
        }
        .input-with-prefix input:focus-within, .input-with-suffix:focus-within {
            border-color: var(--primary-blue);
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }
        .prefix, .suffix { padding: 12px; background: var(--gray-100); color: var(--gray-600); }
        .input-with-prefix input, .input-with-suffix input {
            border: none;
            padding: 12px;
            flex-grow: 1;
        }
        .input-with-prefix input:focus, .input-with-suffix input:focus { outline: none; }
        
        .form-group small {
            font-size: 12px;
            color: var(--gray-500);
            margin-top: 4px;
            display: block;
        }

        .error-message {
          background-color: var(--error-red-light);
          border: 1px solid var(--error-red);
          color: var(--error-red-dark);
          border-radius: 8px;
          padding: 12px;
          margin: 0 32px 16px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid var(--gray-200);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          flex-shrink: 0;
        }

        .form-progress {
          font-size: 12px;
          color: var(--gray-600);
          font-weight: 500;
        }

        .footer-right {
          display: flex;
          gap: 12px;
        }

        .btn {
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.2s ease;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: var(--primary-blue);
          color: white;
          border-color: var(--primary-blue);
        }

        .btn-primary:not(:disabled):hover {
            background: var(--primary-blue-dark);
            border-color: var(--primary-blue-dark);
        }

        .btn-secondary {
            background: white;
            color: var(--gray-700);
            border-color: var(--gray-300);
        }
        
        .btn-secondary:not(:disabled):hover {
            background: var(--gray-50);
        }
        
        .btn-sm {
            padding: 6px 10px;
            font-size: 12px;
            border-radius: 6px;
        }
        
        .btn-danger {
            background-color: var(--error-red);
            color: white;
            border-color: var(--error-red);
        }

        @media (max-width: 768px) {
            .modal-backdrop {
                padding: 0;
                top: 60px; /* Adjust for mobile header */
                height: calc(100% - 60px);
            }
            .modal-container {
                height: 100%;
                max-height: 100%;
                border-radius: 0;
            }
            .modal-body {
                flex-direction: column;
            }
            .tabs-navigation {
                width: 100%;
                flex-direction: row;
                overflow-x: auto;
                border-right: none;
                border-bottom: 1px solid var(--gray-200);
            }
        }
      `}</style>
    </div>
  );
};

export default NewListingModal; 