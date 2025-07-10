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
    <DashboardLayout>
      <Head>
        <title>Edit Room - {room?.name || 'Loading...'} | Tink</title>
      </Head>
      <div className="dashboard-container">
        {/* Custom Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-left">
              <button onClick={() => router.push(`/properties/${id}/rooms`)} className="back-button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 12H5m7-7l-7 7 7 7"/>
                </svg>
              </button>
              <div>
                <h1 className="dashboard-title">Edit Room</h1>
                <div className="subtitle-container">
                  <p className="welcome-message">
                    <span className="message-text">Update details for {room?.name}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="header-right">
              <button
                type="submit"
                form="edit-room-form"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content-grid">
          <div className="left-column">
            <div className="section-card">
              <div className="section-header">
                <div className="section-title-group">
                  <h2 className="section-title">Room Details</h2>
                  <p className="section-subtitle">Update the core information for this room.</p>
                </div>
              </div>
              
              {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}><strong>Error:</strong> {error}</div>}
              {success && <div className="alert alert-success" style={{ marginBottom: '16px' }}><strong>Success:</strong> {success}</div>}
              
              <form id="edit-room-form" onSubmit={handleSubmit} className="room-form">
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
          
          <div className="right-column">
            {/* Placeholder for future content */}
          </div>
        </div>
      </div>
      <style jsx>{`
        .dashboard-container {
          padding: 0;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          min-height: 100vh;
          font-family: 'Inter', system-ui, sans-serif;
        }
        :global(.dark-mode) .dashboard-container {
          background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
        }

        /* Header Styles */
        .dashboard-header {
          background: transparent;
          backdrop-filter: none;
          border-bottom: none;
          padding: 24px 32px;
          position: relative;
          z-index: 100;
        }
        :global(.dark-mode) .dashboard-header {
          background: transparent;
          border-bottom: none;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1400px;
          margin: 0 auto;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .back-button {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 12px;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #64748b;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .back-button:hover {
          background: #f8fafc;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        :global(.dark-mode) .back-button {
          background: rgba(22, 27, 34, 0.9);
          border-color: rgba(48, 54, 61, 0.8);
          color: #8b949e;
        }
        :global(.dark-mode) .back-button:hover {
          background: #21262d;
        }

        .dashboard-title {
          font-size: 32px;
          font-weight: 800;
          background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
          letter-spacing: -0.02em;
        }
        :global(.dark-mode) .dashboard-title {
          background: linear-gradient(135deg, #f0f6fc 0%, #c9d1d9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .subtitle-container {
          margin-top: 4px;
        }

        .welcome-message {
          font-size: 15px;
          color: #64748b;
          margin: 0;
          font-weight: 500;
          letter-spacing: 0.01em;
        }
        :global(.dark-mode) .welcome-message {
          color: #8b949e;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
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
        .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .btn-primary {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
        }
        .btn-primary:hover {
          background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);
        }

        .main-content-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          align-items: flex-start;
          padding: 0 32px 32px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .left-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .right-column {
          position: sticky;
          top: 24px;
        }

        .section-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(226, 232, 240, 0.6);
        }
        :global(.dark-mode) .section-card {
          background: #161b22;
          border-color: rgba(48, 54, 61, 0.6);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
          margin-bottom: 24px;
          border-bottom: 1px solid #f1f5f9;
        }
        :global(.dark-mode) .section-header {
          border-color: #30363d;
        }

        .section-title-group {
          display: flex;
          flex-direction: column;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }
        :global(.dark-mode) .section-title {
          color: #f0f6fc;
        }

        .section-subtitle {
          font-size: 14px;
          color: #64748b;
          margin-top: 4px;
        }
        :global(.dark-mode) .section-subtitle {
          color: #8b949e;
        }
        
        .room-form {
          display: grid;
          gap: 24px;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
        }
        :global(.dark-mode) .form-label {
          color: #c9d1d9;
        }

        .form-label.required::after {
          content: ' *';
          color: #ef4444;
        }
        
        .form-input, .form-select {
          width: 100%;
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          background-color: white;
          font-size: 14px;
          color: #1e293b;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        :global(.dark-mode) .form-input, 
        :global(.dark-mode) .form-select {
          background-color: #0d1117;
          border-color: #30363d;
          color: #c9d1d9;
        }

        .form-input:focus, .form-select:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .form-hint {
          font-size: 12px;
          color: #64748b;
          margin-top: 6px;
        }
        :global(.dark-mode) .form-hint {
          color: #8b949e;
        }
        
        .input-group {
          position: relative;
        }
        
        .input-prefix {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          font-size: 14px;
        }

        .input-group .form-input {
          padding-left: 28px;
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
        :global(.dark-mode) .feature-label {
          color: #c9d1d9;
        }
      `}</style>
    </DashboardLayout>
  );
} 