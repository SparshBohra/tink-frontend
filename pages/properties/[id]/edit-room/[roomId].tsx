import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { apiClient } from '../../../../lib/api';
import { Property, Room, RoomFormData } from '../../../../lib/types';
import DashboardLayout from '../../../../components/DashboardLayout';

// Updated to match backend API specifications
const ROOM_TYPES = [
  { value: 'standard', label: 'Standard Room', description: 'Basic room with standard amenities' },
  { value: 'suite', label: 'Suite', description: 'Large room with separate living area' },
  { value: 'studio', label: 'Studio', description: 'Open-plan room with kitchenette' },
  { value: 'shared', label: 'Shared Room', description: 'Shared accommodation with multiple beds' },
  { value: 'single', label: 'Single Occupancy', description: 'Room for one person' },
  { value: 'double', label: 'Double Occupancy', description: 'Room for two people' },
  { value: 'premium', label: 'Premium Room', description: 'High-end room with luxury amenities' }
];

const COMMON_ROOM_FEATURES = [
  'ensuite', 'balcony', 'furnished', 'ac', 'heating', 
  'closet', 'desk', 'window', 'hardwood', 'carpet'
];

export default function EditRoom() {
  const router = useRouter();
  const { id, roomId } = router.query;
  const propertyId = id ? parseInt(Array.isArray(id) ? id[0] : String(id), 10) : null;
  const roomIdNum = roomId ? parseInt(Array.isArray(roomId) ? roomId[0] : String(roomId), 10) : null;
  
  const [property, setProperty] = useState<Property | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    property_ref: propertyId || 0,
    name: '',
    room_type: 'standard',
    floor_number: '',
    max_capacity: 2,
    monthly_rent: '',
    security_deposit: '',
    room_features: [] as string[],
    is_available: true,
    available_from: '',
    available_until: '',
    square_footage: ''
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (propertyId && roomIdNum) {
      fetchData();
    }
  }, [propertyId, roomIdNum]);

  const fetchData = async () => {
    try {
      setFetchLoading(true);
      const [propertyData, roomData] = await Promise.all([
        apiClient.getProperty(propertyId as number),
        apiClient.getRoom(roomIdNum as number)
      ]);
      
      setProperty(propertyData);
      setRoom(roomData);
      
      // Parse room features if they exist
      let roomFeatures: string[] = [];
      if ((roomData as any).room_features) {
        try {
          roomFeatures = Array.isArray((roomData as any).room_features) 
            ? (roomData as any).room_features 
            : JSON.parse((roomData as any).room_features);
        } catch (e) {
          console.warn('Could not parse room features:', (roomData as any).room_features);
        }
      }
      
      // Populate form with existing room data
      setFormData({
        property_ref: propertyId as number,
        name: roomData.name || '',
        room_type: roomData.room_type || 'standard',
        floor_number: (roomData as any).floor_number ? String((roomData as any).floor_number) : '',
        max_capacity: Number(roomData.max_capacity) || 2,
        monthly_rent: String(roomData.monthly_rent || ''),
        security_deposit: String(roomData.security_deposit || ''),
        room_features: roomFeatures,
        is_available: (roomData as any).is_available !== false,
        available_from: (roomData as any).available_from || '',
        available_until: (roomData as any).available_until || '',
        square_footage: (roomData as any).square_footage ? String((roomData as any).square_footage) : ''
      });
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load room details. Please try again.');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validate required fields
    if (!formData.name || !formData.room_type || !formData.monthly_rent || !formData.security_deposit) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    // Validate numeric fields
    const monthlyRent = parseFloat(formData.monthly_rent);
    const securityDeposit = parseFloat(formData.security_deposit);
    
    if (isNaN(monthlyRent) || monthlyRent <= 0) {
      setError('Please enter a valid monthly rent amount.');
      setLoading(false);
      return;
    }
    
    if (isNaN(securityDeposit) || securityDeposit < 0) {
      setError('Please enter a valid security deposit amount.');
      setLoading(false);
      return;
    }

    if (formData.max_capacity < 1) {
      setError('Max capacity must be at least 1.');
      setLoading(false);
      return;
    }

    try {
      const updateData = {
        property_ref: formData.property_ref,
        name: formData.name,
        room_type: formData.room_type,
        max_capacity: formData.max_capacity,
        monthly_rent: parseFloat(formData.monthly_rent),
        security_deposit: parseFloat(formData.security_deposit),
      };
      
      // Add optional fields only if they have values
      if (formData.floor_number && formData.floor_number.trim() !== '') {
        (updateData as any).floor = formData.floor_number;
      }

      if (formData.room_features && formData.room_features.length > 0) {
        (updateData as any).room_features = formData.room_features;
      }

      if (formData.is_available !== undefined) {
        (updateData as any).is_available = formData.is_available;
      }

      if (formData.available_from && formData.available_from.trim() !== '') {
        (updateData as any).available_from = formData.available_from;
      }

      if (formData.available_until && formData.available_until.trim() !== '') {
        (updateData as any).available_until = formData.available_until;
      }

      if (formData.square_footage && formData.square_footage.trim() !== '') {
        (updateData as any).square_footage = parseInt(formData.square_footage);
      }

      console.log('Updating room with data:', updateData); // Debug log
      const updatedRoom = await apiClient.updateRoom(roomIdNum as number, updateData);
      setSuccess(`Room "${updatedRoom.name}" updated successfully!`);
      
      // Update local room state
      setRoom(updatedRoom);
      
      // Redirect after short delay
      setTimeout(() => {
        router.push(`/properties/${propertyId}/rooms`);
      }, 1500);
    } catch (err: any) {
      console.error('Failed to update room:', err);
      setError(err.message || 'Failed to update room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      room_features: prev.room_features.includes(feature)
        ? prev.room_features.filter(f => f !== feature)
        : [...prev.room_features, feature]
    }));
  };

  const calculateDefaultDeposit = () => {
    const rent = parseFloat(formData.monthly_rent);
    if (!isNaN(rent) && rent > 0) {
      return (rent * 2).toFixed(2);
    }
    return '';
  };

  if (!propertyId || !roomIdNum) {
    return (
      <>
        <Head>
          <title>Edit Room - Invalid Parameters - Tink Property Management</title>
        </Head>
        <DashboardLayout title="">
          <div className="dashboard-container">
            <div className="dashboard-header">
              <div className="header-content">
                <div className="header-left">
                  <h1 className="dashboard-title">Invalid Parameters</h1>
                  <p className="welcome-message">Unable to edit room without proper selection</p>
                </div>
              </div>
            </div>
            
            <div className="error-section">
          <div className="alert alert-error">
            <strong>Error:</strong> Please select a valid property and room.
          </div>
          <div className="actions-container">
            <Link href="/properties" className="btn btn-primary">
              View All Properties
            </Link>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </>
    );
  }

  if (fetchLoading) {
    return (
      <>
        <Head>
          <title>Edit Room - Loading - Tink Property Management</title>
        </Head>
        <DashboardLayout title="">
          <div className="dashboard-container">
            <div className="dashboard-header">
              <div className="header-content">
                <div className="header-left">
                  <h1 className="dashboard-title">Loading Room Details</h1>
                  <p className="welcome-message">Fetching room information...</p>
                </div>
              </div>
            </div>
            
            <div className="loading-section">
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
            <p>Loading room details...</p>
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
        <title>Edit Room - {room?.name || 'Room'} - {property?.name || 'Property'} - Tink Property Management</title>
      </Head>
      <DashboardLayout title="">
        <div className="dashboard-container">
          {/* Custom Header */}
          <div className="dashboard-header">
            <div className="header-content">
              <div className="header-left">
                <h1 className="dashboard-title">Edit Room</h1>
                <p className="welcome-message">
                  {property && room ? `Editing ${room.name} in ${property.name}` : 'Edit room details'}
                </p>
              </div>
              <div className="header-right">
                <Link href={`/properties/${propertyId}/rooms`} className="back-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5"/>
                    <path d="M12 19l-7-7 7-7"/>
                  </svg>
                  Back to Property
                </Link>
              </div>
            </div>
          </div>

          {/* Room Overview */}
          {room && (
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-header">
                  <div className="metric-info">
                    <h3 className="metric-title">Current Status</h3>
                    <div className="metric-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                        <line x1="9" y1="9" x2="9.01" y2="9"></line>
                        <line x1="15" y1="9" x2="15.01" y2="9"></line>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="metric-content">
                  <div className="metric-value">{room.is_vacant ? 'Vacant' : 'Occupied'}</div>
                  <div className="metric-subtitle">Occupancy status</div>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-header">
                  <div className="metric-info">
                    <h3 className="metric-title">Occupancy</h3>
                    <div className="metric-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="metric-content">
                  <div className="metric-value">{room.current_occupancy}/{room.max_capacity}</div>
                  <div className="metric-subtitle">Current / Max</div>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-header">
                  <div className="metric-info">
                    <h3 className="metric-title">Monthly Rent</h3>
                    <div className="metric-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="metric-content">
                  <div className="metric-value">${Number(room.monthly_rent || 0).toLocaleString()}</div>
                  <div className="metric-subtitle">Current rent</div>
                </div>
              </div>
            </div>
          )}

          {error && <div className="alert alert-error"><strong>Error:</strong> {error}</div>}
          {success && <div className="alert alert-success"><strong>Success:</strong> {success}</div>}

          <div className="main-content-grid">
            <div className="form-section">
              <div className="section-header">
                <h2 className="section-title">Room Details</h2>
                <p className="section-subtitle">Update the room information and settings.</p>
              </div>
              
              <form onSubmit={handleSubmit} className="room-form">
                {/* Basic Information */}
                  <div className="form-group">
                  <label htmlFor="name" className="form-label required">Room Name</label>
                    <input
                      type="text"
                    id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="form-input"
                    placeholder="e.g., Master Bedroom, Room A, Studio 101"
                    maxLength={100}
                    required
                    />
                  <div className="form-hint">Maximum 100 characters, must be unique within the property</div>
                  </div>

                  <div className="form-group">
                  <label htmlFor="room_type" className="form-label required">Room Type</label>
                    <select
                    id="room_type"
                      name="room_type"
                      value={formData.room_type}
                      onChange={handleChange}
                    className="form-select"
                      required
                  >
                    {ROOM_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                    </select>
                  <div className="form-hint">
                    {ROOM_TYPES.find(t => t.value === formData.room_type)?.description}
                  </div>
                  </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="max_capacity" className="form-label required">Max Capacity</label>
                    <input
                      type="number"
                      id="max_capacity"
                      name="max_capacity"
                      value={formData.max_capacity}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_capacity: parseInt(e.target.value) || 1 }))}
                      className="form-input"
                      min="1"
                      max="10"
                      required
                    />
                    <div className="form-hint">Maximum occupants (1-10)</div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="floor_number" className="form-label">Floor Number</label>
                    <input
                      type="number"
                      id="floor_number"
                      name="floor_number"
                      value={formData.floor_number}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="1, 2, 3..."
                      min="1"
                    />
                    <div className="form-hint">Optional floor number</div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="square_footage" className="form-label">Square Footage</label>
                    <input
                      type="number"
                      id="square_footage"
                      name="square_footage"
                      value={formData.square_footage}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="350"
                      min="1"
                    />
                    <div className="form-hint">Optional room size in sq ft</div>
                  </div>
                  </div>

                {/* Pricing */}
                <div className="form-row">
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
                        placeholder="1200.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="form-hint">Monthly rent amount</div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="security_deposit" className="form-label required">Security Deposit</label>
                    <div className="input-group">
                      <span className="input-prefix">$</span>
                      <input
                        type="number"
                        id="security_deposit"
                        name="security_deposit"
                        value={formData.security_deposit}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="2400.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="form-hint">Security deposit amount</div>
                    {formData.monthly_rent && (
                      <div className="form-suggestion">
                  <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, security_deposit: calculateDefaultDeposit() }))}
                          className="suggestion-btn"
                  >
                          Use 2x monthly rent (${calculateDefaultDeposit()})
                  </button>
                </div>
                    )}
                </div>
              </div>
              
                {/* Availability */}
                <div className="form-group">
                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      id="is_available"
                      name="is_available"
                      checked={formData.is_available}
                      onChange={handleChange}
                      className="form-checkbox"
                    />
                    <label htmlFor="is_available" className="checkbox-label">
                      Room is available for rent
                    </label>
                  </div>
                </div>
                
                {formData.is_available && (
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="available_from" className="form-label">Available From</label>
                      <input
                        type="date"
                        id="available_from"
                        name="available_from"
                        value={formData.available_from}
                        onChange={handleChange}
                        className="form-input"
                      />
                      <div className="form-hint">Optional availability start date</div>
                </div>
                
                    <div className="form-group">
                      <label htmlFor="available_until" className="form-label">Available Until</label>
                      <input
                        type="date"
                        id="available_until"
                        name="available_until"
                        value={formData.available_until}
                        onChange={handleChange}
                        className="form-input"
                      />
                      <div className="form-hint">Optional availability end date</div>
                  </div>
                  </div>
                )}

                {/* Room Features */}
                <div className="form-group">
                  <label className="form-label">Room Features (Optional)</label>
                  <div className="features-grid">
                    {COMMON_ROOM_FEATURES.map(feature => (
                      <div key={feature} className="feature-checkbox">
                        <input
                          type="checkbox"
                          id={`feature-${feature}`}
                          checked={formData.room_features.includes(feature)}
                          onChange={() => handleFeatureToggle(feature)}
                          className="form-checkbox"
                        />
                        <label htmlFor={`feature-${feature}`} className="feature-label">
                          {feature.charAt(0).toUpperCase() + feature.slice(1)}
                        </label>
                    </div>
                    ))}
                    </div>
                  <div className="form-hint">Select applicable room features and amenities</div>
                  </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? (
                      <>
                        <div className="btn-spinner"></div>
                        Updating Room...
                      </>
                    ) : (
                      'Update Room'
                    )}
                  </button>

                  <Link href={`/properties/${propertyId}/rooms`} className="btn btn-secondary">
                    Cancel
                  </Link>
              </div>
              </form>
            </div>
          </div>
        </div>
      
      <style jsx>{`
          .form-row {
          display: grid;
            grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
        }
        
          .input-group {
          position: relative;
          display: flex;
          align-items: center;
        }

          .input-prefix {
          position: absolute;
          left: 12px;
          color: #6b7280;
            font-weight: 500;
            z-index: 10;
          pointer-events: none;
        }

          .input-group .form-input {
            padding-left: 32px;
        }

          .checkbox-group {
          display: flex;
            align-items: center;
            gap: 8px;
        }

          .checkbox-label {
          font-size: 14px;
            color: #374151;
          cursor: pointer;
          }

          .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
            margin-top: 8px;
        }

          .feature-checkbox {
          display: flex;
          align-items: center;
            gap: 8px;
        }

          .feature-label {
            font-size: 14px;
            color: #374151;
            cursor: pointer;
        }

          .form-suggestion {
            margin-top: 4px;
        }

          .suggestion-btn {
          font-size: 12px;
            color: #2563eb;
            background: none;
            border: none;
            cursor: pointer;
            text-decoration: underline;
            padding: 0;
        }

          .suggestion-btn:hover {
            color: #1d4ed8;
        }

        @media (max-width: 768px) {
            .form-row {
            grid-template-columns: 1fr;
          }

            .features-grid {
              grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
      </DashboardLayout>
    </>
  );
} 