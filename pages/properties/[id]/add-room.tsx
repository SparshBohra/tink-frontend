import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { apiClient } from '../../../lib/api';
import { Property } from '../../../lib/types';
import DashboardLayout from '../../../components/DashboardLayout';

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

export default function AddRoom() {
  const router = useRouter();
  const { id } = router.query;
  const propertyId = id ? parseInt(Array.isArray(id) ? id[0] : String(id), 10) : null;
  
  const [property, setProperty] = useState<Property | null>(null);
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
    square_footage: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (propertyId) {
      fetchPropertyDetails();
      setFormData(prev => ({ ...prev, property_ref: propertyId }));
    }
  }, [propertyId]);

  const fetchPropertyDetails = async () => {
    try {
      const propertyData = await apiClient.getProperty(propertyId as number);
      setProperty(propertyData);
    } catch (err: any) {
      console.error('Failed to fetch property details:', err);
      setError('Failed to load property details. Please try again.');
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
      const roomData = {
        property_ref: propertyId as number,
        name: formData.name,
        room_type: formData.room_type,
        max_capacity: formData.max_capacity,
        monthly_rent: parseFloat(formData.monthly_rent),
        security_deposit: parseFloat(formData.security_deposit),
      };

      // Add optional fields only if they have values
      if (formData.floor_number && formData.floor_number.trim() !== '') {
        (roomData as any).floor = formData.floor_number;
      }

      if (formData.room_features && formData.room_features.length > 0) {
        (roomData as any).room_features = formData.room_features;
      }

      if (formData.is_available !== undefined) {
        (roomData as any).is_available = formData.is_available;
      }

      if (formData.available_from && formData.available_from.trim() !== '') {
        (roomData as any).available_from = formData.available_from;
      }

      if (formData.square_footage && formData.square_footage.trim() !== '') {
        (roomData as any).square_footage = parseInt(formData.square_footage);
      }

      console.log('Creating room with data:', roomData); // Debug log
      const newRoom = await apiClient.createRoom(roomData);
      setSuccess(`Room "${newRoom.name}" added successfully to ${property?.name}!`);
      
      // Reset form (except property)
      setFormData({
        property_ref: propertyId as number,
        name: '',
        room_type: 'standard',
        floor_number: '',
        max_capacity: 2,
        monthly_rent: '',
        security_deposit: '',
        room_features: [],
        is_available: true,
        available_from: '',
        square_footage: ''
      });
      
      // Redirect after short delay
      setTimeout(() => {
        router.push(`/properties/${propertyId}/rooms`);
      }, 1500);
    } catch (err: any) {
      console.error('Failed to add room:', err);
      setError(err.message || 'Failed to add room. Please try again.');
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

  // Auto-calculate security deposit when rent changes
  useEffect(() => {
    if (formData.monthly_rent && !formData.security_deposit) {
      const defaultDeposit = calculateDefaultDeposit();
      if (defaultDeposit) {
        setFormData(prev => ({ ...prev, security_deposit: defaultDeposit }));
      }
    }
  }, [formData.monthly_rent]);

  if (!propertyId) {
    return (
      <>
        <Head>
          <title>Add Room - Property ID Missing - Tink Property Management</title>
        </Head>
        <DashboardLayout title="">
          <div className="dashboard-container">
            <div className="dashboard-header">
              <div className="header-content">
                <div className="header-left">
                  <h1 className="dashboard-title">Property ID Missing</h1>
                  <p className="welcome-message">Unable to add room without property selection</p>
                </div>
              </div>
            </div>
            
            <div className="error-section">
              <div className="alert alert-error">
                <strong>Error:</strong> Please select a property first.
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

  return (
    <>
      <Head>
        <title>Add New Room - {property?.name || 'Property'} - Tink Property Management</title>
      </Head>
      <DashboardLayout title="">
        <div className="dashboard-container">
          {/* Custom Header */}
          <div className="dashboard-header">
            <div className="header-content">
              <div className="header-left">
                <h1 className="dashboard-title">Add New Room</h1>
                <p className="welcome-message">
                  {property ? `Adding a room to ${property.name}` : 'Add a new room to the property'}
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

          {/* Property Overview */}
          {property && (
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-header">
                  <div className="metric-info">
                    <h3 className="metric-title">Property</h3>
                    <div className="metric-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 21h18"/>
                        <path d="M5 21V7l8-4v18"/>
                        <path d="M19 21V11l-6-4"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="metric-content">
                  <div className="metric-value">{property.name}</div>
                  <div className="metric-subtitle">Selected property</div>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-header">
                  <div className="metric-info">
                    <h3 className="metric-title">Current Rooms</h3>
                    <div className="metric-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                        <line x1="8" y1="21" x2="16" y2="21"/>
                        <line x1="12" y1="17" x2="12" y2="21"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="metric-content">
                  <div className="metric-value">{property.total_rooms || 0}</div>
                  <div className="metric-subtitle">Total rooms</div>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-header">
                  <div className="metric-info">
                    <h3 className="metric-title">Vacancy</h3>
                    <div className="metric-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="metric-content">
                  <div className="metric-value">{property.vacant_rooms || 0}</div>
                  <div className="metric-subtitle">Vacant rooms</div>
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
                <p className="section-subtitle">Enter the details for the new room.</p>
              </div>

              <form onSubmit={handleSubmit} className="room-form">
                {/* Basic Information */}
                <div className="form-grid">
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

                  <div className="form-group">
                    <label htmlFor="max_capacity" className="form-label required">Max Capacity</label>
                    <input
                      type="number"
                      id="max_capacity"
                      name="max_capacity"
                      value={formData.max_capacity}
                      onChange={handleChange}
                      className="form-input"
                      min="1"
                      max="10"
                      required
                    />
                    <div className="form-hint">Maximum number of occupants (1-10)</div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="floor_number" className="form-label">Floor</label>
                    <input
                      type="text"
                      id="floor_number"
                      name="floor_number"
                      value={formData.floor_number}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="e.g., 1, 2, Ground, Basement"
                      maxLength={20}
                    />
                    <div className="form-hint">Floor or level (optional)</div>
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
                      min="50"
                      max="5000"
                    />
                    <div className="form-hint">Room size in square feet (optional)</div>
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
                        className="form-input currency-input"
                        placeholder="1200.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="form-hint">Monthly rental amount</div>
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
                        className="form-input currency-input"
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

                {/* Availability Section */}
                <div className="form-section-divider">
                  <h3 className="form-section-title">Availability</h3>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <div className="checkbox-wrapper">
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
                  )}
                </div>

                {/* Room Features Section */}
                <div className="form-section-divider">
                  <h3 className="form-section-title">Room Features</h3>
                  <p className="form-section-subtitle">Select applicable amenities and features</p>
                </div>

                <div className="form-group full-width">
                  <div className="features-grid">
                    {COMMON_ROOM_FEATURES.map(feature => (
                      <div key={feature} className="feature-item">
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
                        Adding Room...
                      </>
                    ) : (
                      'Add Room'
                    )}
                  </button>

                  <Link href={`/properties/${propertyId}/rooms`} className="btn btn-secondary">
                    Cancel
                  </Link>
                </div>
              </form>
            </div>

            {/* Quick Actions Sidebar */}
            <div className="quick-actions-section">
              <div className="section-header">
                <h3 className="section-title">Quick Actions</h3>
                <p className="section-subtitle">Related actions and shortcuts</p>
              </div>

              <div className="actions-grid">
                <Link href={`/properties/${propertyId}/rooms`} className="action-card blue">
                  <div className="action-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                      <line x1="8" y1="21" x2="16" y2="21"/>
                      <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                  </div>
                  <div className="action-content">
                    <div className="action-title">View All Rooms</div>
                    <div className="action-subtitle">See existing rooms</div>
                  </div>
                </Link>

                <Link href={`/properties/${propertyId}`} className="action-card green">
                  <div className="action-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 21h18"/>
                      <path d="M5 21V7l8-4v18"/>
                      <path d="M19 21V11l-6-4"/>
                    </svg>
                  </div>
                  <div className="action-content">
                    <div className="action-title">Property Details</div>
                    <div className="action-subtitle">View property info</div>
                  </div>
                </Link>

                <Link href={`/properties/${propertyId}/edit`} className="action-card purple">
                  <div className="action-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </div>
                  <div className="action-content">
                    <div className="action-title">Edit Property</div>
                    <div className="action-subtitle">Modify property details</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

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

          .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px; }
          .metric-card { background: white; border-radius: 6px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
          .metric-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
          .metric-info { display: flex; align-items: center; gap: 8px; }
          .metric-title { font-size: 13px; font-weight: 600; color: #64748b; margin: 0; }
          .metric-icon { color: #64748b; }
          .metric-content { }
          .metric-value { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0 0 4px 0; }
          .metric-subtitle { font-size: 12px; color: #64748b; margin: 0; }

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
          .form-label.required::after { content: ' *'; color: #dc2626; }
          .form-input, .form-select { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; transition: all 0.2s ease; box-sizing: border-box; }
          .form-input:focus, .form-select:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
          .form-hint { font-size: 12px; color: #6b7280; margin: 4px 0 0 0; }

          .form-section-divider { border-top: 1px solid #e2e8f0; padding-top: 16px; margin: 20px 0 16px 0; }
          .form-section-title { font-size: 16px; font-weight: 600; color: #1e293b; margin: 0 0 4px 0; }
          .form-section-subtitle { font-size: 12px; color: #64748b; margin: 0; }

          .input-group { position: relative; display: flex; align-items: center; }
          .input-prefix { position: absolute; left: 12px; color: #6b7280; font-weight: 500; z-index: 10; pointer-events: none; }
          .currency-input { padding-left: 28px; }

          .checkbox-wrapper { display: flex; align-items: center; gap: 8px; }
          .form-checkbox { width: 16px; height: 16px; accent-color: #4f46e5; cursor: pointer; }
          .checkbox-label { font-size: 14px; color: #374151; cursor: pointer; font-weight: 500; }

          .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
          .feature-item { display: flex; align-items: center; gap: 8px; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; background: #f8fafc; transition: all 0.2s ease; }
          .feature-item:hover { background: #f1f5f9; border-color: #cbd5e1; }
          .feature-label { font-size: 13px; color: #374151; cursor: pointer; font-weight: 500; }

          .form-suggestion { margin-top: 4px; }
          .suggestion-btn { font-size: 12px; color: #4f46e5; background: none; border: none; cursor: pointer; text-decoration: underline; padding: 0; font-weight: 500; }
          .suggestion-btn:hover { color: #3730a3; }

          .form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
          .btn { padding: 10px 16px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s ease; text-decoration: none; border: none; }
          .btn:disabled { opacity: 0.6; cursor: not-allowed; }
          .btn-primary { background: #4f46e5; color: white; }
          .btn-primary:hover:not(:disabled) { background: #3730a3; }
          .btn-secondary { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }
          .btn-secondary:hover { background: #e2e8f0; }
          .btn-spinner { width: 16px; height: 16px; border: 2px solid transparent; border-top: 2px solid currentColor; border-radius: 50%; animation: spin 1s linear infinite; }

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

          .error-section { text-align: center; padding: 40px 20px; }
          .actions-container { margin-top: 20px; }

          @keyframes spin { to { transform: rotate(360deg); } }

          @media (max-width: 1024px) {
            .main-content-grid { grid-template-columns: 1fr; }
            .form-grid { grid-template-columns: 1fr; }
          }

          @media (max-width: 768px) {
            .dashboard-container { padding: 12px 16px 16px 16px; }
            .header-content { flex-direction: column; align-items: stretch; gap: 12px; }
            .metrics-grid { grid-template-columns: 1fr; }
            .features-grid { grid-template-columns: 1fr 1fr; }
          }
        `}</style>
      </DashboardLayout>
    </>
  );
} 