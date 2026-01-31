import { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../lib/api';
import { PropertyFormData, Property, Room } from '../lib/types';
import { usStates } from '../lib/states';
import MapboxAddressAutocomplete from './MapboxAddressAutocomplete';
import styles from './EditPropertyModal.module.css';

// SVG Icon Components
const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
);

const DollarSignIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const ClipboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
  </svg>
);

const DoorOpenIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M13 4h3a2 2 0 0 1 2 2v14"/>
    <path d="M2 20h3"/>
    <path d="M13 20h9"/>
    <path d="M10 12v.01"/>
    <path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V6a2 2 0 0 1 2-2h4.036a2 2 0 0 1 1.582.89l1.182 1.617a2 2 0 0 0 1.582.89H13z"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

// Updated to match backend API specifications
const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment Building', description: 'Multi-unit apartment complex' },
  { value: 'house', label: 'Single-Family House', description: 'Individual residential house' },
  { value: 'dorm', label: 'Dormitory', description: 'Student or institutional housing' },
  { value: 'other', label: 'Other', description: 'Other property type' }
];

const RENT_TYPES = [
  { value: 'per_room', label: 'Rent is per room', description: 'Individual rent for each room' },
  { value: 'per_property', label: 'Rent is for the whole property', description: 'Single rent for entire property' }
];

const TIMEZONE_OPTIONS = [
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', description: 'West Coast time zone' },
  { value: 'America/New_York', label: 'Eastern Time (ET)', description: 'East Coast time zone' },
  { value: 'America/Chicago', label: 'Central Time (CT)', description: 'Central US time zone' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', description: 'Mountain time zone' },
  { value: 'Europe/London', label: 'GMT/BST', description: 'Greenwich Mean Time' },
  { value: 'Europe/Paris', label: 'CET/CEST', description: 'Central European Time' }
];

interface EditPropertyModalProps {
  property: Property;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EditPropertyModal({ property, onClose, onSuccess }: EditPropertyModalProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState<PropertyFormData>({
    name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'United States',
    property_type: 'apartment',
    timezone: 'America/Los_Angeles',
    rent_type: 'per_property',
    monthly_rent: '',
    landlord: undefined,
    total_rooms: 0,
  });
  const [rooms, setRooms] = useState<Room[]>([]);
  const [editingRooms, setEditingRooms] = useState<Record<number, { monthly_rent: number }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profileResolved, setProfileResolved] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [savingRooms, setSavingRooms] = useState(false);

  // Dynamic tabs based on rent type
  const tabs = useMemo(() => [
    { id: 'basic', label: 'Basic Info', icon: HomeIcon },
    { id: 'rent', label: 'Rent Structure', icon: DollarSignIcon },
    { id: 'details', label: 'Property Details', icon: ClipboardIcon },
    ...(formData.rent_type === 'per_room' ? [{ id: 'rooms', label: 'Room Configuration', icon: DoorOpenIcon }] : []),
  ], [formData.rent_type]);

  // Reset to first tab if current tab becomes invalid
  useEffect(() => {
    const tabIds = tabs.map(t => t.id);
    if (!tabIds.includes(activeTab)) {
      setActiveTab('basic');
    }
  }, [tabs, activeTab]);

  useEffect(() => {
    const init = async () => {
      try {
        // Load user profile first
        const profile = await apiClient.getProfile();
        let landlordId = profile.id;
        
        // If user is a manager, try to get the landlord relationship
        if (profile.role === 'manager') {
          try {
            const rel = await apiClient.getManagerLandlordRelationships();
            if (rel.length > 0) {
              landlordId = rel[0].landlord;
            }
          } catch (e) {
            console.error('Failed to load manager relationships:', e);
          }
        }

        // Populate form with property data
        setFormData({
          name: property.name,
          address_line1: property.address_line1,
          address_line2: property.address_line2 || '',
          city: property.city,
          state: property.state,
          postal_code: property.postal_code,
          country: property.country,
          property_type: property.property_type,
          timezone: property.timezone,
          rent_type: property.rent_type || 'per_property',
          monthly_rent: property.monthly_rent ? String(property.monthly_rent) : '',
          landlord: property.landlord || landlordId,
          total_rooms: property.total_rooms || 0,
        });

        // Fetch rooms if per_room type
        if (property.rent_type === 'per_room') {
          fetchRooms();
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load property details or user profile. Please refresh the page.');
      } finally {
        setProfileResolved(true);
      }
    };
    init();
  }, [property]);

  // Auto-create rooms when switching to per_room if they don't exist
  useEffect(() => {
    if (formData.rent_type === 'per_room' && property.id && formData.total_rooms > 0) {
      fetchRooms().then((fetchedRooms) => {
        // Check if rooms need to be created
        if (fetchedRooms.length === 0 && formData.total_rooms > 0) {
          autoCreateRooms();
        }
      });
    }
  }, [formData.rent_type, formData.total_rooms]);

  const autoCreateRooms = async () => {
    if (!property.id || formData.total_rooms <= 0) return;
    
    try {
      setRoomsLoading(true);
      const roomsToCreate = [];
      const totalRent = Number(formData.monthly_rent) || 0;
      const rentPerRoom = totalRent > 0 ? Math.round(totalRent / formData.total_rooms) : 0;

      for (let i = 0; i < formData.total_rooms; i++) {
        const roomData = {
          property_ref: property.id,
          name: `Room ${i + 1}`,
          room_type: 'standard',
          max_capacity: 2,
          monthly_rent: rentPerRoom,
          security_deposit: 0
        };
        roomsToCreate.push(apiClient.createRoom(roomData));
      }

      const createdRooms = await Promise.all(roomsToCreate);
      setRooms(createdRooms);
    } catch (error) {
      console.error('Failed to auto-create rooms:', error);
      setError('Failed to create rooms. Please try again.');
    } finally {
      setRoomsLoading(false);
    }
  };

  const fetchRooms = async (): Promise<Room[]> => {
    if (!property.id) return [];
    try {
      setRoomsLoading(true);
      const roomsData = await apiClient.getPropertyRooms(property.id);
      setRooms(roomsData);
      return roomsData;
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      setRooms([]);
      return [];
    } finally {
      setRoomsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Wait for profile resolution
    if (!profileResolved) {
      setError('Please wait for the system to load your profile information.');
      setLoading(false);
      return;
    }

    // Validate landlord is set
    if (!formData.landlord) {
      setError('Unable to determine landlord information. Please refresh the page and try again.');
      setLoading(false);
      return;
    }

    // Validate required fields
    if (!formData.name || !formData.address_line1 || !formData.city || !formData.state || !formData.postal_code || !formData.country || !formData.timezone) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    // Validate rent type specific requirements
    if (formData.rent_type === 'per_property') {
      if (!formData.monthly_rent || isNaN(Number(formData.monthly_rent)) || Number(formData.monthly_rent) <= 0) {
        setError('Please enter a valid monthly rent amount for the property. This field is required when "Rent is for the whole property" is selected.');
        setLoading(false);
        return;
      }
    }

    try {
      // Prepare update payload according to backend API
      const payload = {
        name: formData.name,
        address_line1: formData.address_line1,
        address_line2: formData.address_line2 || undefined,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code,
        country: formData.country,
        property_type: formData.property_type,
        timezone: formData.timezone,
        rent_type: formData.rent_type,
        landlord: formData.landlord,
        // Only include monetary fields for per_property rent type
        ...(formData.rent_type === 'per_property' ? {
          monthly_rent: formData.monthly_rent,
          total_rooms: formData.total_rooms
        } : {
          monthly_rent: undefined // Clear for per_room type
        })
      };

      await apiClient.updateProperty(property.id, payload);
      
      // If switching to per_room and rooms don't exist, create them
      if (formData.rent_type === 'per_room' && formData.total_rooms > 0) {
        const existingRooms = await apiClient.getPropertyRooms(property.id);
        if (existingRooms.length === 0) {
          await autoCreateRooms();
        }
      }
      
      // Save any pending room rent changes
      if (Object.keys(editingRooms).length > 0) {
        await handleSaveRoomRents();
      }
      
      setSuccess(`Property "${formData.name}" updated successfully!`);
      
      // Show a small success toast and then close
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
        toast.textContent = 'Property updated';
        container.appendChild(toast);
        setTimeout(() => {
          toast.style.transition = 'opacity 300ms ease';
          toast.style.opacity = '0';
          setTimeout(() => toast.remove(), 320);
        }, 1600);
      } catch {}
      
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 800);
    } catch (err: any) {
      console.error('Failed to update property:', err);
      setError(err.message || 'Failed to update property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle address selection from Mapbox autocomplete
  const handleAddressSelect = (addressComponents: any) => {
    setFormData(prev => ({
      ...prev,
      address_line1: addressComponents.address_line1,
      city: addressComponents.city,
      state: addressComponents.state,
      postal_code: addressComponents.postal_code,
    }));
  };

  const currentStep = tabs.findIndex(tab => tab.id === activeTab) + 1;

  const handleNext = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
    }
  };

  const handleBack = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id);
    }
  };

  const renderBasicInfo = () => (
    <>
      <div className={styles.sectionHeader}>
        <h3>Basic Information</h3>
        <p>Update the core information for your property.</p>
      </div>
      <div className={styles.formSection}>
      <div className={styles.formGroup}>
        <label htmlFor="name" className={styles.formLabel}>
          <span>Property Name</span>
          <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={styles.formInput}
          placeholder="e.g., Main Street Apartments"
          maxLength={200}
          required
        />
        <div className={styles.formHint}>Maximum 200 characters</div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="property_type" className={styles.formLabel}>
          <span>Property Type</span>
          <span className={styles.required}>*</span>
        </label>
        <select
          id="property_type"
          name="property_type"
          value={formData.property_type}
          onChange={handleChange}
          className={styles.formSelect}
          required
        >
          {PROPERTY_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <div className={styles.formHint}>
          {PROPERTY_TYPES.find(t => t.value === formData.property_type)?.description}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="address_line1" className={styles.formLabel}>
          <span>Address Line 1</span>
          <span className={styles.required}>*</span>
        </label>
        <MapboxAddressAutocomplete
          id="address_line1"
          name="address_line1"
          value={formData.address_line1}
          onChange={(value) => setFormData(prev => ({ ...prev, address_line1: value }))}
          onAddressSelect={handleAddressSelect}
          placeholder="123 Main Street"
          className={styles.formInput}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="address_line2" className={styles.formLabel}>Address Line 2 (Optional)</label>
        <input
          type="text"
          id="address_line2"
          name="address_line2"
          value={formData.address_line2}
          onChange={handleChange}
          className={styles.formInput}
          placeholder="Apt, suite, etc."
        />
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="city" className={styles.formLabel}>
            <span>City</span>
            <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className={styles.formInput}
            placeholder="San Francisco"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="state" className={styles.formLabel}>
            <span>State</span>
            <span className={styles.required}>*</span>
          </label>
          <select
            id="state"
            name="state"
            value={formData.state}
            onChange={handleChange}
            className={styles.formSelect}
            required
          >
            <option value="">Select State</option>
            {usStates.map(state => (
              <option key={state.value} value={state.value}>
                {state.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="postal_code" className={styles.formLabel}>
            <span>ZIP Code</span>
            <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            id="postal_code"
            name="postal_code"
            value={formData.postal_code}
            onChange={handleChange}
            className={styles.formInput}
            placeholder="94102"
            required
          />
        </div>
      </div>
      </div>
    </>
  );

  const renderRentStructure = () => (
    <>
      <div className={styles.sectionHeader}>
        <h3>Rent Structure</h3>
        <p>Configure how rent is structured for this property.</p>
      </div>
      <div className={styles.formSection}>
        <div className={styles.formGroup}>
          <label htmlFor="rent_type" className={styles.formLabel}>
            <span>Rent Structure</span>
            <span className={styles.required}>*</span>
          </label>
          <select
            id="rent_type"
            name="rent_type"
            value={formData.rent_type}
            onChange={handleChange}
            className={styles.formSelect}
            required
          >
            {RENT_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <div className={styles.formHint}>
            {RENT_TYPES.find(t => t.value === formData.rent_type)?.description}
          </div>
        </div>

        {formData.rent_type === 'per_property' && (
          <>
            <div className={styles.formGroup}>
              <label htmlFor="total_rooms" className={styles.formLabel}>
                <span>Total Rooms</span>
                <span className={styles.required}>*</span>
              </label>
              <input 
                type="number"
                id="total_rooms"
                name="total_rooms"
                value={formData.total_rooms}
                onChange={(e) => setFormData(prev => ({ ...prev, total_rooms: parseInt(e.target.value) || 1 }))}
                className={styles.formInput}
                min="1"
                max="50"
                required
              />
              <div className={styles.formHint}>Number of rooms in this property (1-50)</div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="monthly_rent" className={styles.formLabel}>
                <span>Monthly Rent</span>
                <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputGroup}>
                <span className={styles.inputPrefix}>$</span>
                <input 
                  type="number" 
                  id="monthly_rent"
                  name="monthly_rent" 
                  value={formData.monthly_rent} 
                  onChange={handleChange} 
                  className={styles.formInput}
                  placeholder="3500.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className={styles.formHint}>Total monthly rent for the entire property</div>
            </div>
          </>
        )}

        {formData.rent_type === 'per_room' && (
          <>
            <div className={styles.formGroup}>
              <label htmlFor="total_rooms_per_room" className={styles.formLabel}>
                <span>Total Rooms</span>
                <span className={styles.required}>*</span>
              </label>
              <input 
                type="number"
                id="total_rooms_per_room"
                name="total_rooms"
                value={formData.total_rooms}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  setFormData(prev => ({ ...prev, total_rooms: value }));
                }}
                className={styles.formInput}
                min="1"
                max="50"
                required
              />
              <div className={styles.formHint}>Number of rooms in this property. Rooms will be auto-created when you save.</div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="monthly_rent_per_room" className={styles.formLabel}>
                <span>Total Property Rent (Optional)</span>
              </label>
              <div className={styles.inputGroup}>
                <span className={styles.inputPrefix}>$</span>
                <input 
                  type="number" 
                  id="monthly_rent_per_room"
                  name="monthly_rent" 
                  value={formData.monthly_rent} 
                  onChange={handleChange} 
                  className={styles.formInput}
                  placeholder="3500.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className={styles.formHint}>
                Optional: Set total rent for the property. You can split this evenly across rooms using the "Split by Ratio" button in the Room Configuration tab.
              </div>
            </div>

            {formData.monthly_rent && Number(formData.monthly_rent) > 0 && (
              <div className={styles.infoBox}>
                <div className={styles.infoIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                </div>
                <div className={styles.infoContent}>
                  <h4>Per-Room Rent Structure</h4>
                  <p>
                    Total property rent: <strong>${Number(formData.monthly_rent).toLocaleString()}/mo</strong>
                    <br />
                    Go to the Room Configuration tab to split this rent across {formData.total_rooms} room(s) or set individual room rents.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );

  const renderPropertyDetails = () => (
    <>
      <div className={styles.sectionHeader}>
        <h3>Property Details</h3>
        <p>Additional property information and settings.</p>
      </div>
      <div className={styles.formSection}>
        <div className={styles.formGroup}>
          <label htmlFor="country" className={styles.formLabel}>
            <span>Country</span>
            <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            id="country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            className={styles.formInput}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="timezone" className={styles.formLabel}>
            <span>Timezone</span>
            <span className={styles.required}>*</span>
          </label>
          <select
            id="timezone"
            name="timezone"
            value={formData.timezone}
            onChange={handleChange}
            className={styles.formSelect}
            required
          >
            {TIMEZONE_OPTIONS.map(tz => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          <div className={styles.formHint}>
            {TIMEZONE_OPTIONS.find(t => t.value === formData.timezone)?.description}
          </div>
        </div>
      </div>
    </>
  );

  const handleRoomRentChange = (roomId: number, value: string) => {
    const rentValue = parseFloat(value) || 0;
    setEditingRooms(prev => ({
      ...prev,
      [roomId]: { monthly_rent: rentValue }
    }));
  };

  const handleSplitRentByRatio = () => {
    const totalRent = Number(formData.monthly_rent) || 0;
    if (totalRent <= 0 || rooms.length === 0) return;
    
    const rentPerRoom = Math.round((totalRent / rooms.length) * 100) / 100; // Round to 2 decimals
    const updatedRooms: Record<number, { monthly_rent: number }> = {};
    
    rooms.forEach((room, index) => {
      // Last room gets the remainder to ensure total matches
      const rent = index === rooms.length - 1 
        ? totalRent - (rentPerRoom * (rooms.length - 1))
        : rentPerRoom;
      updatedRooms[room.id] = { monthly_rent: rent };
    });
    
    setEditingRooms(updatedRooms);
  };

  const handleSaveRoomRents = async () => {
    if (Object.keys(editingRooms).length === 0) return;
    
    try {
      setSavingRooms(true);
      const updatePromises = Object.entries(editingRooms).map(([roomId, data]) =>
        apiClient.updateRoom(Number(roomId), data)
      );
      
      await Promise.all(updatePromises);
      
      // Refresh rooms to get updated data
      await fetchRooms();
      setEditingRooms({});
      setSuccess('Room rents updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to save room rents:', error);
      setError('Failed to save room rents. Please try again.');
    } finally {
      setSavingRooms(false);
    }
  };

  const renderRoomConfiguration = () => {
    const totalRent = Number(formData.monthly_rent) || 0;
    const hasUnsavedChanges = Object.keys(editingRooms).length > 0;
    const currentTotalRent = rooms.reduce((sum, room) => {
      const editedRent = editingRooms[room.id]?.monthly_rent;
      const roomRent = typeof room.monthly_rent === 'string' ? parseFloat(room.monthly_rent) || 0 : (room.monthly_rent || 0);
      return sum + (editedRent !== undefined ? editedRent : roomRent);
    }, 0);

    return (
      <>
        <div className={styles.sectionHeader}>
          <h3>Room Configuration</h3>
          <p>Manage individual rooms for this property. Each room can have its own rent and capacity settings.</p>
        </div>
        <div className={styles.formSection}>
          {roomsLoading ? (
            <div className={styles.loadingSection}>
              <p>Loading rooms...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className={styles.infoBox}>
              <div className={styles.infoIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </div>
              <div className={styles.infoContent}>
                <h4>No Rooms Configured</h4>
                <p>
                  {formData.total_rooms > 0 
                    ? `This property has ${formData.total_rooms} room(s) configured but no rooms exist yet. Rooms will be auto-created when you save the property with "per room" rent type.`
                    : 'This property doesn\'t have any rooms yet. Please set the total number of rooms in the Rent Structure tab first.'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {formData.rent_type === 'per_room' && totalRent > 0 && (
                <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={handleSplitRentByRatio}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                      e.currentTarget.style.borderColor = '#9ca3af';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }}
                  >
                    Split ${totalRent.toLocaleString()} by Ratio
                  </button>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Total: <strong style={{ color: '#111827' }}>${currentTotalRent.toLocaleString()}/mo</strong>
                    {hasUnsavedChanges && (
                      <span style={{ color: '#f59e0b', marginLeft: '0.5rem' }}>• Unsaved changes</span>
                    )}
                  </div>
                </div>
              )}

              <div className={styles.roomsGrid}>
                {rooms.map((room) => {
                  const editedRent = editingRooms[room.id]?.monthly_rent;
                  const roomRent = typeof room.monthly_rent === 'string' ? parseFloat(room.monthly_rent) || 0 : (room.monthly_rent || 0);
                  const displayRent = editedRent !== undefined ? editedRent : roomRent;
                  const isEdited = editingRooms[room.id] !== undefined;

                  return (
                    <div key={room.id} className={styles.roomCard} style={{
                      border: isEdited ? '2px solid #2563eb' : undefined,
                      backgroundColor: isEdited ? '#eff6ff' : undefined
                    }}>
                      <div className={styles.roomHeader}>
                        <h4>{room.name}</h4>
                      </div>
                      <div className={styles.roomDetails} style={{ marginBottom: '1rem' }}>
                        <span className={styles.roomType}>{room.room_type}</span>
                        <span className={styles.roomCapacity}>Max {room.max_capacity} people</span>
                      </div>
                      
                      <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          color: '#6b7280',
                          marginBottom: '0.25rem'
                        }}>
                          Monthly Rent
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>$</span>
                          <input
                            type="number"
                            value={displayRent}
                            onChange={(e) => handleRoomRentChange(room.id, e.target.value)}
                            style={{
                              flex: 1,
                              padding: '0.5rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '0.875rem',
                              width: '100%'
                            }}
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                          />
                          <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>/mo</span>
                        </div>
                      </div>

                      <div className={styles.roomStatus}>
                        {(room.is_vacant !== undefined ? room.is_vacant : (room.current_occupancy || 0) === 0) ? (
                          <span className={styles.statusBadgeVacant}>Vacant</span>
                        ) : (
                          <span className={styles.statusBadgeOccupied}>Occupied</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasUnsavedChanges && (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fbbf24',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
                    You have unsaved changes to room rents
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveRoomRents}
                    disabled={savingRooms}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: savingRooms ? 'not-allowed' : 'pointer',
                      opacity: savingRooms ? 0.6 : 1,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {savingRooms ? 'Saving...' : 'Save Room Rents'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic': return renderBasicInfo();
      case 'rent': return renderRentStructure();
      case 'details': return renderPropertyDetails();
      case 'rooms': return renderRoomConfiguration();
      default: return renderBasicInfo();
    }
  };

  if (!profileResolved) {
    return (
      <div className={styles.modalBackdrop}>
        <div className={styles.modalContainer}>
          <div className={styles.modalHeader}>
            <div className={styles.modalTitle}>
              <h3>Loading...</h3>
            </div>
            <button className={styles.closeButton} onClick={onClose}>
              <CloseIcon />
            </button>
          </div>
          <div className={styles.loadingSection}>
            <p>Loading property and profile information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <h3>Edit Property</h3>
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
                <button 
                  key={tab.id} 
                  className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`} 
                  onClick={() => setActiveTab(tab.id)}
                >
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
            {success && (
              <div className={styles.successMessage}>
                <span>{success}</span>
              </div>
            )}
            <div className={styles.tabContentScrollable}>
              {renderTabContent()}
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <div className={styles.footerLeft}>
            <span className={styles.formProgress}>
              Step {currentStep} of {tabs.length}: {tabs[currentStep - 1]?.label}
            </span>
          </div>
          <div className={styles.footerRight}>
            <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={onClose}>
              Cancel
            </button>
            {currentStep > 1 && (
              <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleBack}>
                Back
              </button>
            )}
            {currentStep < tabs.length ? (
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleNext}>
                Next
              </button>
            ) : (
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
