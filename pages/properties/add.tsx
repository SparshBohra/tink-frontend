import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { apiClient } from '../../lib/api';
import DashboardLayout from '../../components/DashboardLayout';
import { usStates } from '../../lib/states';
import { Landlord } from '../../lib/types';

interface RoomTypeConfig {
  id: string;
  roomType: string;
  quantity: number;
  monthlyRent: number;
  maxCapacity: number;
  floor: string;
}

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

const ROOM_TYPES = [
  { value: 'standard', label: 'Standard Room', description: 'Basic room with standard amenities' },
  { value: 'suite', label: 'Suite', description: 'Large room with separate living area' },
  { value: 'studio', label: 'Studio', description: 'Open-plan room with kitchenette' },
  { value: 'shared', label: 'Shared Room', description: 'Shared accommodation with multiple beds' },
  { value: 'single', label: 'Single Occupancy', description: 'Room for one person' },
  { value: 'double', label: 'Double Occupancy', description: 'Room for two people' },
  { value: 'premium', label: 'Premium Room', description: 'High-end room with luxury amenities' }
];

export default function AddProperty() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'United States',
    property_type: 'apartment',
    timezone: 'America/Los_Angeles',
    rent_type: 'per_room',
    monthly_rent: '',
    security_deposit: '',
    total_rooms: 1,
    landlord: undefined as number | undefined,
  });
  const [roomTypeConfigs, setRoomTypeConfigs] = useState<RoomTypeConfig[]>([]);
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [landlordsLoading, setLandlordsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profileResolved, setProfileResolved] = useState(false);

  // Auto-detect landlord or fetch list
  useEffect(() => {
    const init = async () => {
      try {
        const profile = await apiClient.getProfile();
        
        // Always set the current user as the landlord
          setFormData(prev => ({ ...prev, landlord: profile.id }));
        
        // If user is a manager, we might still want to show landlord relationships
        // but we'll use the current user's ID as the landlord for property creation
        if (profile.role === 'manager') {
          try {
          const rel = await apiClient.getManagerLandlordRelationships();
            // If manager has relationships, use the first one, otherwise use their own ID
            if (rel.length > 0) {
            setFormData(prev => ({ ...prev, landlord: rel[0].landlord }));
          }
          } catch (e) {
            console.error('Failed to load manager relationships:', e);
            // Fallback to using manager's own ID
        }
        }
      } catch (e) {
        console.error('Failed to load profile:', e);
        setError('Failed to load user profile. Please refresh the page.');
      } finally {
        setProfileResolved(true);
      }
    };
    init();
  }, []);

  const addRoomTypeConfig = () => {
    const newConfig: RoomTypeConfig = {
      id: `room-type-${Date.now()}`,
      roomType: 'standard',
      quantity: 1,
      monthlyRent: 0,
      maxCapacity: 2,
      floor: ''
    };
    setRoomTypeConfigs(prev => [...prev, newConfig]);
  };

  const updateRoomTypeConfig = (id: string, field: keyof RoomTypeConfig, value: string | number) => {
    let finalValue: string | number = value;

    if (field === 'roomType' && typeof value === 'string') {
      // Normalise to backend-friendly lowercase slug
      const trimmed = value.trim();
      // If user somehow selected/typed the label instead of value, map it
      const match = ROOM_TYPES.find(rt => rt.value === trimmed.toLowerCase() || rt.label.toLowerCase() === trimmed.toLowerCase());
      finalValue = match ? match.value : trimmed.toLowerCase();
    }

    console.log('Updating room config:', { id, field, originalValue: value, finalValue });

    setRoomTypeConfigs(prev =>
      prev.map(config => (config.id === id ? { ...config, [field]: finalValue } : config))
    );
  };

  const removeRoomTypeConfig = (id: string) => {
    setRoomTypeConfigs(prev => prev.filter(config => config.id !== id));
  };

  const createRoomsForProperty = async (propertyId: number) => {
    const roomsToCreate = [];
    // Track counts per room type to generate unique names
    const typeCounters: Record<string, number> = {};
    
    for (const config of roomTypeConfigs) {
      // Canonical room type value
      const matchType = ROOM_TYPES.find(rt => rt.value === config.roomType) || ROOM_TYPES.find(rt => rt.label.toLowerCase() === config.roomType.toLowerCase());
      const canonicalType = matchType ? matchType.value : config.roomType.toLowerCase();
      const typeLabel = ROOM_TYPES.find(rt => rt.value === canonicalType)?.label || canonicalType;

      for (let i = 1; i <= config.quantity; i++) {
        // Increment sequence number for this type
        typeCounters[canonicalType] = (typeCounters[canonicalType] || 0) + 1;
        const seq = typeCounters[canonicalType];
        const roomName = `${typeLabel} ${seq}`;
        
        const roomData = {
          property_ref: propertyId,
          name: roomName,
          room_type: canonicalType,
          max_capacity: config.maxCapacity,
          monthly_rent: config.monthlyRent,
          security_deposit: config.monthlyRent * 2,
        } as any;

        if (config.floor && config.floor.trim() !== '') roomData.floor = config.floor;

        roomsToCreate.push(roomData);
      }
    }

    // Create all rooms
    const createdRooms = [];
    for (const roomData of roomsToCreate) {
      try {
        console.log('Creating room with data:', roomData); // Debug log
        const room = await apiClient.createRoom(roomData);
        createdRooms.push(room);
      } catch (error: any) {
        console.error('Failed to create room:', roomData.name, error);
        console.error('Room data that failed:', roomData); // Debug log
        
        // Extract more detailed error information
        let errorMessage = `Failed to create room: ${roomData.name}`;
        if (error.response?.data) {
          const errorData = error.response.data;
          if (typeof errorData === 'object') {
            const errorDetails = Object.entries(errorData).map(([field, messages]) => {
              if (Array.isArray(messages)) {
                return `${field}: ${messages.join(', ')}`;
              }
              return `${field}: ${messages}`;
            }).join('; ');
            errorMessage += ` - ${errorDetails}`;
          } else {
            errorMessage += ` - ${errorData}`;
          }
        }
        
        throw new Error(errorMessage);
      }
    }

    return createdRooms;
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

    if (formData.rent_type === 'per_room') {
      if (roomTypeConfigs.length === 0) {
        setError('Please add at least one room type configuration when using "Rent is per room" structure.');
        setLoading(false);
        return;
      }

      // Validate room configurations
      for (const config of roomTypeConfigs) {
        if (!config.roomType || config.quantity < 1 || config.monthlyRent <= 0 || config.maxCapacity < 1) {
          setError('Please ensure all room configurations have valid room type, quantity, rent amount, and capacity.');
          setLoading(false);
          return;
        }
      }
    }

    try {
      // Prepare property data according to backend API
      const propertyData = {
        name: formData.name,
        address_line1: formData.address_line1,
        address_line2: formData.address_line2 || undefined,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code,
        country: formData.country,
        property_type: formData.property_type,
        timezone: formData.timezone,
        rent_type: formData.rent_type as 'per_room' | 'per_property',
        total_rooms: formData.rent_type === 'per_room' ? getTotalRooms() : formData.total_rooms,
        monthly_rent: formData.rent_type === 'per_property' ? formData.monthly_rent : '',
        landlord: formData.landlord,
        // Include security_deposit only for per_property
        ...(formData.rent_type === 'per_property' && {
          security_deposit: formData.security_deposit || undefined
        })
      };

      let bulkRoomsProvided = false;
      if (formData.rent_type === 'per_room') {
        // Build arrays for bulk room creation in property payload
        const roomNames: string[] = [];
        const roomTypes: string[] = [];
        const roomRents: string[] = [];
        const roomCaps: number[] = [];
        const typeCounters: Record<string, number> = {};

        roomTypeConfigs.forEach(cfg => {
          const matchType = ROOM_TYPES.find(rt => rt.value === cfg.roomType) || ROOM_TYPES.find(rt => rt.label.toLowerCase() === cfg.roomType.toLowerCase());
          const canonical = matchType ? matchType.value : cfg.roomType.toLowerCase();
          const label = ROOM_TYPES.find(rt => rt.value === canonical)?.label || canonical;
          for (let i = 0; i < cfg.quantity; i++) {
            typeCounters[canonical] = (typeCounters[canonical] || 0) + 1;
            const seq = typeCounters[canonical];
            const name = `${label} ${seq}`;
            roomNames.push(name);
            roomTypes.push(canonical);
            roomRents.push(cfg.monthlyRent.toFixed(2));
            roomCaps.push(cfg.maxCapacity);
          }
        });

        Object.assign(propertyData, {
          room_names: roomNames,
          room_types: roomTypes,
          room_rents: roomRents,
          room_capacities: roomCaps,
        });
        bulkRoomsProvided = true;
      }

      const newProperty = await apiClient.createProperty(propertyData);

      // If per_room rent type and bulk rooms not sent, create manually
      if (formData.rent_type === 'per_room' && roomTypeConfigs.length > 0 && !bulkRoomsProvided) {
        await createRoomsForProperty(newProperty.id);
      }

      setSuccess(`Property "${newProperty.name}" created successfully! ${formData.rent_type === 'per_room' ? `Created ${getTotalRooms()} rooms.` : ''}`);

      setTimeout(() => {
        router.push(`/properties/${newProperty.id}/rooms?created=true`);
      }, 2000);
    } catch (err: any) {
      console.error('Failed to create property:', err);
      setError(err.message || 'Failed to create property. Please try again.');
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

  const getTotalRooms = () => {
    return roomTypeConfigs.reduce((total, config) => total + config.quantity, 0);
  };

  const getEstimatedRevenue = () => {
    const total = roomTypeConfigs.reduce((total, config) => total + (config.quantity * config.monthlyRent), 0);
    // Round to 2 decimal places to fix floating point precision issues
    return Math.round(total * 100) / 100;
  };

  const getTotalCapacity = () => {
    return roomTypeConfigs.reduce((total, config) => total + (config.quantity * config.maxCapacity), 0);
  };

  // Don't render the form until profile is resolved
  if (!profileResolved) {
  return (
    <>
      <Head>
          <title>Add Property - Loading - Tink</title>
      </Head>
      <DashboardLayout title="">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <div className="header-content">
              <div className="header-left">
                  <h1 className="dashboard-title">Loading...</h1>
                  <p className="welcome-message">Please wait while we load your profile information.</p>
                </div>
              </div>
            </div>
            <div className="loading-section">
              <div className="loading-indicator">
                <div className="loading-spinner"></div>
                <p>Loading profile information...</p>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Add New Property - Tink Property Management</title>
      </Head>
      <DashboardLayout title="">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <div className="header-content">
              <div className="header-left">
                <h1 className="dashboard-title">Add New Property</h1>
                <p className="welcome-message">Create a new property in your portfolio.</p>
              </div>
              <div className="header-right">
                <Link href="/properties" className="back-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5"/>
                    <path d="M12 19l-7-7 7-7"/>
                  </svg>
                  Back to Properties
                </Link>
              </div>
            </div>
          </div>

          {error && <div className="alert alert-error"><strong>Error:</strong> {error}</div>}
          {success && <div className="alert alert-success"><strong>Success:</strong> {success}</div>}

          <div className="main-content-grid">
            <div className="form-section">
              <div className="section-header">
                  <h2 className="section-title">Property Details</h2>
                <p className="section-subtitle">Enter the basic information for your new property.</p>
              </div>

              <form onSubmit={handleSubmit} className="property-form">
                {/* Basic Information */}
                <div className="form-group">
                  <label htmlFor="name" className="form-label required">Property Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., Main Street Apartments"
                    maxLength={200}
                    required
                  />
                  <div className="form-hint">Maximum 200 characters</div>
                  </div>

                {/* Property Type */}
                <div className="form-group">
                  <label htmlFor="property_type" className="form-label required">Property Type</label>
                  <select
                    id="property_type"
                    name="property_type"
                    value={formData.property_type}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >
                    {PROPERTY_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <div className="form-hint">
                    {PROPERTY_TYPES.find(t => t.value === formData.property_type)?.description}
                  </div>
                  </div>

                {/* Rent Structure */}
                  <div className="form-group">
                  <label htmlFor="rent_type" className="form-label required">Rent Structure</label>
                  <select
                    id="rent_type"
                    name="rent_type"
                    value={formData.rent_type}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >
                    {RENT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                      ))}
                    </select>
                  <div className="form-hint">
                    {RENT_TYPES.find(t => t.value === formData.rent_type)?.description}
                  </div>
                </div>

                {/* Conditional Fields based on Rent Type */}
                {formData.rent_type === 'per_property' && (
                  <>
                  <div className="form-group">
                      <label htmlFor="total_rooms" className="form-label required">Total Rooms</label>
                      <input
                        type="number"
                        id="total_rooms"
                        name="total_rooms"
                        value={formData.total_rooms}
                        onChange={(e) => setFormData(prev => ({ ...prev, total_rooms: parseInt(e.target.value) || 1 }))}
                        className="form-input"
                        min="1"
                        max="50"
                        required
                      />
                      <div className="form-hint">Number of rooms in this property (1-50)</div>
                  </div>

                  <div className="form-group">
                      <label htmlFor="monthly_rent" className="form-label required">Monthly Rent</label>
                      <div className="input-group">
                        <span className="input-prefix">$</span>
                        <input
                          type="number"
                          id="monthly_rent"
                          name="monthly_rent"
                          value={formData.monthly_rent}
                          onChange={handleChange}
                          className="form-input"
                          placeholder="3500.00"
                          min="0"
                          step="0.01"
                          required
                        />
                  </div>
                      <div className="form-hint">Total monthly rent for the entire property</div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="security_deposit" className="form-label">Security Deposit</label>
                      <div className="input-group">
                        <span className="input-prefix">$</span>
                          <input 
                          type="number"
                          id="security_deposit"
                          name="security_deposit"
                          value={formData.security_deposit}
                            onChange={handleChange}
                          className="form-input"
                          placeholder="1750.00"
                          min="0"
                          step="0.01"
                        />
                            </div>
                      <div className="form-hint">Optional security deposit amount</div>
                          </div>
                  </>
                )}

                {/* Address Information */}
                <div className="form-group">
                  <label htmlFor="address_line1" className="form-label required">Address Line 1</label>
                          <input 
                    type="text"
                    id="address_line1"
                    name="address_line1"
                    value={formData.address_line1}
                            onChange={handleChange}
                    className="form-input"
                    placeholder="123 Main Street"
                    required
                  />
                            </div>

                <div className="form-group">
                  <label htmlFor="address_line2" className="form-label">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    id="address_line2"
                    name="address_line2"
                    value={formData.address_line2}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Apartment, suite, unit, building, floor, etc."
                  />
                          </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city" className="form-label required">City</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="San Francisco"
                      required
                    />
                      </div>

                  <div className="form-group">
                    <label htmlFor="state" className="form-label required">State</label>
                    <select
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="form-select"
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

                  <div className="form-group">
                    <label htmlFor="postal_code" className="form-label required">ZIP Code</label>
                    <input
                      type="text"
                      id="postal_code"
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="94102"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="country" className="form-label required">Country</label>
                        <input 
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                          onChange={handleChange} 
                    className="form-input"
                          required 
                        />
                      </div>

                <div className="form-group">
                  <label htmlFor="timezone" className="form-label required">Timezone</label>
                  <select
                    id="timezone"
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >
                    {TIMEZONE_OPTIONS.map(tz => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                  <div className="form-hint">
                    {TIMEZONE_OPTIONS.find(t => t.value === formData.timezone)?.description}
                    </div>
                </div>

                {/* Room Configuration for per_room rent type */}
                  {formData.rent_type === 'per_room' && (
                  <div className="room-configuration-section">
                    <div className="section-header">
                      <h3 className="section-title">Room Configuration</h3>
                      <p className="section-subtitle">Configure the types and quantities of rooms for this property.</p>
                        </div>

                    {roomTypeConfigs.length > 0 && (
                      <div className="room-configs-list">
                        {roomTypeConfigs.map((config) => (
                          <div key={config.id} className="room-config-card">
                            <div className="room-config-header">
                              <div className="room-config-info">
                                <h4 className="room-config-title">
                                  {ROOM_TYPES.find(rt => rt.value === config.roomType)?.label || 'Room Type'}
                                </h4>
                        </div>
                              <button
                                type="button"
                                onClick={() => removeRoomTypeConfig(config.id)}
                                className="remove-room-config-btn"
                                title="Remove room configuration"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              </button>
                      </div>

                            <div className="room-config-fields">
                              <div className="form-group">
                                <label className="form-label">Room Type</label>
                                <select
                                  value={config.roomType}
                                  onChange={(e) => updateRoomTypeConfig(config.id, 'roomType', e.target.value)}
                                  className="form-select"
                                >
                                  {ROOM_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>
                                      {type.label}
                                    </option>
                                  ))}
                                </select>
                    </div>

                              <div className="form-group">
                                <label className="form-label">Quantity</label>
                                <input
                                  type="number"
                                  value={config.quantity}
                                  onChange={(e) => updateRoomTypeConfig(config.id, 'quantity', parseInt(e.target.value) || 1)}
                                  className="form-input"
                                  min="1"
                                  max="20"
                                />
                </div>

                              <div className="form-group">
                                <label className="form-label">Monthly Rent</label>
                                <div className="input-group">
                                  <span className="input-prefix">$</span>
                                  <input
                                    type="number"
                                    value={config.monthlyRent || ''}
                                    onChange={(e) => updateRoomTypeConfig(config.id, 'monthlyRent', parseFloat(e.target.value) || 0)}
                                    className="form-input"
                                    placeholder="1200.00"
                                    min="0"
                                    step="0.01"
                                  />
                </div>
            </div>

                              <div className="form-group">
                                <label className="form-label">Max Capacity</label>
                                <input
                                  type="number"
                                  value={config.maxCapacity}
                                  onChange={(e) => updateRoomTypeConfig(config.id, 'maxCapacity', parseInt(e.target.value) || 1)}
                                  className="form-input"
                                  min="1"
                                  max="10"
                                />
                              </div>

                              <div className="form-group">
                                <label className="form-label">Floor (Optional)</label>
                                <input
                                  type="text"
                                  value={config.floor}
                                  onChange={(e) => updateRoomTypeConfig(config.id, 'floor', e.target.value)}
                                  className="form-input"
                                  placeholder="1, 2, Ground, etc."
                                />
                </div>
              </div>

                            <div className="room-config-summary">
                              <span className="summary-item">
                                <strong>{config.quantity}</strong> rooms
                              </span>
                              <span className="summary-item">
                                <strong>{config.quantity * config.maxCapacity}</strong> max occupancy
                              </span>
                              <span className="summary-item">
                                <strong>${(config.quantity * config.monthlyRent).toLocaleString()}</strong>/month revenue
                              </span>
                  </div>
                </div>
                        ))}
                  </div>
                    )}

                    <div className="add-room-type-section">
                      <button
                        type="button"
                        onClick={addRoomTypeConfig}
                        className="btn btn-secondary add-room-type-btn"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Room Type
                      </button>
                </div>

                    {/* Property Summary */}
                    {roomTypeConfigs.length > 0 && (
                      <div className="property-summary">
                        <h4 className="summary-title">Property Summary</h4>
                        <div className="summary-metrics">
                          <div className="summary-metric">
                            <div className="metric-value">{getTotalRooms()}</div>
                            <div className="metric-label">Total Rooms</div>
                  </div>
                          <div className="summary-metric">
                            <div className="metric-value">{getTotalCapacity()}</div>
                            <div className="metric-label">Max Occupancy</div>
                </div>
                          <div className="summary-metric">
                            <div className="metric-value">${getEstimatedRevenue().toLocaleString()}</div>
                            <div className="metric-label">Monthly Revenue</div>
                  </div>
                </div>
              </div>
                    )}
            </div>
                )}

                <div className="form-actions">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? (
                      <>
                        <div className="btn-spinner"></div>
                        Creating Property...
                      </>
                    ) : (
                      'Create Property'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </DashboardLayout>
      <style jsx>{`
        .dashboard-container {
          width: 100%;
          padding: 16px 20px 20px 20px;
          background: #f8fafc;
          min-height: calc(100vh - 72px);
          box-sizing: border-box;
        }
        .dashboard-header { margin-bottom: 24px; }
        .header-content { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
        .header-left { flex: 1; }
        .header-right { flex-shrink: 0; }
        .dashboard-title { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0 0 4px 0; line-height: 1.15; }
        .welcome-message { font-size: 14px; color: #4b5563; margin: 0; line-height: 1.45; }
        .back-btn { background: #4f46e5; color: white; border: none; padding: 10px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s ease; text-decoration: none; }
        .back-btn:hover { background: #3730a3; transform: translateY(-1px); }
        .alert { padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 8px; }
        .alert-error { background-color: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        .alert-success { background-color: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
        .main-content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; align-items: flex-start; }
        .form-section, .quick-actions-section { background: white; border-radius: 6px; padding: 18px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; height: fit-content; }
        .section-header { margin-bottom: 16px; }
        .section-title { font-size: 14px; font-weight: 700; color: #1e293b; margin: 0 0 3px 0; }
        .section-subtitle { font-size: 12px; color: #64748b; margin: 0; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group.full-width { grid-column: 1 / -1; }
        .form-label { font-weight: 600; color: #374151; font-size: 14px; }
        .form-input { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; transition: all 0.2s ease; box-sizing: border-box; }
        .input-group .form-input { padding-left: 48px; }
        .form-input:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
        .form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
        .btn { padding: 10px 16px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s ease; text-decoration: none; border: none; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-primary { background: #4f46e5; color: white; }
        .btn-primary:hover:not(:disabled) { background: #3730a3; }
        .btn-secondary { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }
        .btn-secondary:hover { background: #e2e8f0; }
        .actions-grid { display: flex; flex-direction: column; gap: 12px; }
        .action-card { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 5px; border: 1px solid #e2e8f0; cursor: pointer; transition: all 0.2s ease; text-decoration: none; }
        .action-card:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .action-card.blue { background: #eff6ff; border-color: #dbeafe; }
        .action-card.green { background: #f0fdf4; border-color: #dcfce7; }
        .action-card.purple { background: #faf5ff; border-color: #e9d5ff; }
        .action-icon { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: white; }
        .action-card.blue .action-icon { background: #3b82f6; }
        .action-card.green .action-icon { background: #10b981; }
        .action-card.purple .action-icon { background: #8b5cf6; }
        .action-content { flex: 1; }
        .action-title { font-size: 13px; font-weight: 600; color: #1e293b; margin: 0 0 2px 0; }
        .action-subtitle { font-size: 11px; color: #64748b; margin: 0; }
        
        /* Enhanced Rent Type Selection */
        .rent-type-selection {
          margin-top: 8px;
        }
        
        .rent-type-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        .rent-type-option {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #f8fafc;
        }
        
        .rent-type-option:hover {
          border-color: #cbd5e1;
          background: #f1f5f9;
        }
        
        .rent-type-option.selected {
          border-color: #4f46e5;
          background: #eff6ff;
        }
        
        .rent-type-radio {
          margin: 0;
          width: 20px;
          height: 20px;
          accent-color: #4f46e5;
        }
        
        .rent-type-content {
          flex: 1;
        }
        
        .rent-type-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .rent-type-header svg {
          color: #4f46e5;
          flex-shrink: 0;
        }
        
        .rent-type-title {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }
        
        .rent-type-description {
          font-size: 12px;
          color: #64748b;
          margin: 0;
          line-height: 1.4;
        }
        
        /* Enhanced Currency Input */
        .rent-input-wrapper {
          position: relative;
          display: inline-block;
          width: 100%;
        }
        
        .currency-symbol {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
          font-weight: 600;
          font-size: 14px;
          z-index: 1;
        }
        
        .currency-input {
          padding-left: 48px;
        }
        
        .form-help {
          font-size: 12px;
          color: #6b7280;
          margin: 4px 0 0 0;
          font-style: italic;
        }
        
        /* Per Room Info */
        .per-room-info {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          margin-top: 8px;
        }
        
        .info-icon {
          width: 40px;
          height: 40px;
          background: #0ea5e9;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }
        
        .info-content {
          flex: 1;
        }
        
        .info-title {
          font-size: 14px;
          font-weight: 600;
          color: #0c4a6e;
          margin: 0 0 4px 0;
        }
        
        .info-description {
          font-size: 12px;
          color: #075985;
          margin: 0;
          line-height: 1.4;
        }
        
        /* Room Types Section */
        .room-types-section {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
        }

        .empty-room-types {
          text-align: center;
          padding: 40px 20px;
          background: #f8fafc;
          border: 2px dashed #cbd5e1;
          border-radius: 8px;
          margin: 16px 0;
        }

        .empty-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 16px;
          color: #94a3af;
        }

        .empty-room-types h4 {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 8px 0;
        }

        .empty-room-types p {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 20px 0;
        }

        .room-type-config {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .room-type-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f3f4f6;
        }

        .room-type-header h4 {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin: 0;
        }

        .remove-btn {
          background: #fee2e2;
          color: #dc2626;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .remove-btn:hover {
          background: #fecaca;
          border-color: #fca5a5;
        }

        .room-config-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .room-summary {
          display: flex;
          gap: 24px;
          padding: 12px 16px;
          background: #f8fafc;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }

        .summary-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .summary-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        .summary-value {
          font-size: 14px;
          color: #374151;
          font-weight: 600;
        }

        .property-summary {
          margin-top: 24px;
          padding: 20px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
        }

        .property-summary h4 {
          font-size: 16px;
          font-weight: 600;
          color: #166534;
          margin: 0 0 16px 0;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
        }

        .summary-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: white;
          border-radius: 6px;
          border: 1px solid #dcfce7;
        }

        .summary-icon {
          width: 32px;
          height: 32px;
          background: #16a34a;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .summary-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .summary-number {
          font-size: 18px;
          font-weight: 700;
          color: #374151;
          line-height: 1;
        }

        .summary-card .summary-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        :global(.dark-mode) .dashboard-container { background-color: #0a0a0a; }
        :global(.dark-mode) .dashboard-title, :global(.dark-mode) .section-title, :global(.dark-mode) .action-title { color: #ffffff; }
        :global(.dark-mode) .welcome-message, :global(.dark-mode) .section-subtitle, :global(.dark-mode) .action-subtitle { color: #94a3b8; }
        :global(.dark-mode) .back-btn, :global(.dark-mode) .btn-secondary { background: #1a1a1a; border: 1px solid #333333; color: #e2e8f0; }
        :global(.dark-mode) .back-btn:hover, :global(.dark-mode) .btn-secondary:hover { background: #222222; }
        :global(.dark-mode) .alert-error { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: #ef4444; }
        :global(.dark-mode) .alert-success { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.3); color: #10b981; }
        :global(.dark-mode) .form-section, :global(.dark-mode) .quick-actions-section { background: #1a1a1a; border-color: #333333; }
        :global(.dark-mode) .form-label { color: #e2e8f0; }
        :global(.dark-mode) .form-input { background: #111111; border-color: #333333; color: #ffffff; }
        :global(.dark-mode) .form-input:focus { border-color: #4f46e5; }
        :global(.dark-mode) .action-card { color: #e2e8f0; }
        :global(.dark-mode) .action-card:hover { background: #222222; }
        
        :global(.dark-mode) .rent-type-option {
          background: #111111;
          border-color: #333333;
        }
        
        :global(.dark-mode) .rent-type-option:hover {
          background: #1a1a1a;
          border-color: #404040;
        }
        
        :global(.dark-mode) .rent-type-option.selected {
          background: #1e1b4b;
          border-color: #4f46e5;
        }
        
        :global(.dark-mode) .rent-type-title {
          color: #e2e8f0;
        }
        
        :global(.dark-mode) .rent-type-description {
          color: #9ca3af;
        }
        
        :global(.dark-mode) .currency-symbol {
          color: #9ca3af;
        }
        
        :global(.dark-mode) .form-help {
          color: #9ca3af;
        }
        
        :global(.dark-mode) .per-room-info {
          background: #0f172a;
          border-color: #1e293b;
        }
        
        :global(.dark-mode) .info-icon {
          background: #0ea5e9;
        }
        
        :global(.dark-mode) .info-title {
          color: #38bdf8;
        }
        
        :global(.dark-mode) .info-description {
          color: #94a3b8;
        }
        
        :global(.dark-mode) .summary-card .summary-label {
          color: #9ca3af;
        }
        
        /* Loading States */
        .loading-section {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 200px;
          padding: 40px;
        }

        .loading-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #4f46e5;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-indicator p {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        :global(.dark-mode) .loading-spinner {
          border-color: #374151;
          border-top-color: #4f46e5;
        }

        :global(.dark-mode) .loading-indicator p {
          color: #9ca3af;
        }
        
        @media (max-width: 1024px) { 
          .main-content-grid { grid-template-columns: 1fr; }
          .rent-type-options { grid-template-columns: 1fr; }
          .room-config-grid { grid-template-columns: 1fr 1fr; }
          .summary-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 768px) { 
          .form-grid { grid-template-columns: 1fr; } 
          .form-group.full-width { grid-column: span 1; } 
          .rent-type-options { grid-template-columns: 1fr; }
          .room-config-grid { grid-template-columns: 1fr; }
          .summary-grid { grid-template-columns: 1fr; }
          .room-summary { flex-direction: column; gap: 12px; }
        }
      `}</style>
    </>
  );
} 