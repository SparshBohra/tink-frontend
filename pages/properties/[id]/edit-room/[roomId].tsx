import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { apiClient } from '../../../../lib/api';
import { Property, Room, RoomFormData } from '../../../../lib/types';
import DashboardLayout from '../../../../components/DashboardLayout';

export default function EditRoom() {
  const router = useRouter();
  const { id, roomId } = router.query;
  const propertyId = id ? parseInt(Array.isArray(id) ? id[0] : String(id), 10) : null;
  const roomIdNum = roomId ? parseInt(Array.isArray(roomId) ? roomId[0] : String(roomId), 10) : null;
  
  const [property, setProperty] = useState<Property | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState<RoomFormData>({
    property_ref: propertyId || 0,
    name: '',
    room_type: 'Standard',
    floor: '',
    max_capacity: 2,
    monthly_rent: 0,
    security_deposit: 0
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
      
      // Populate form with existing room data
      setFormData({
        property_ref: propertyId as number,
        name: roomData.name || '',
        room_type: roomData.room_type || 'Standard',
        floor: roomData.floor || '',
        max_capacity: roomData.max_capacity || 2,
        monthly_rent: roomData.monthly_rent || 0,
        security_deposit: roomData.security_deposit || 0
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

    try {
      const updateData = {
        property_ref: formData.property_ref,
        name: formData.name,
        room_type: formData.room_type,
        floor: formData.floor,
        max_capacity: formData.max_capacity,
        monthly_rent: formData.monthly_rent,
        security_deposit: formData.security_deposit
      };
      
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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'monthly_rent' || name === 'security_deposit') 
        ? parseFloat(value) || 0 
        : (name === 'max_capacity')
        ? parseInt(value) || 0
        : value
    }));
  };

  const formatCurrencyDisplay = (value: number) => {
    if (value === 0) return '';
    return value.toString();
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
                  Back to Rooms
                </Link>
              </div>
            </div>
          </div>

          {/* Current Room Overview */}
          {property && room && (
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-header">
                  <div className="metric-info">
                    <h3 className="metric-title">Property</h3>
                    <div className="metric-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="metric-content">
                  <div className="metric-value">{property.name}</div>
                  <div className="metric-subtitle">Current property</div>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-header">
                  <div className="metric-info">
                    <h3 className="metric-title">Room</h3>
                    <div className="metric-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="metric-content">
                  <div className="metric-value">{room.name}</div>
                  <div className="metric-subtitle">Room #{room.id}</div>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-header">
                  <div className="metric-info">
                    <h3 className="metric-title">Occupancy</h3>
                    <div className="metric-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="metric-content">
                  <div className="metric-value">{room.current_occupancy}/{room.max_capacity}</div>
                  <div className="metric-subtitle">{room.occupancy_rate.toFixed(1)}% occupied</div>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-header">
                  <div className="metric-info">
                    <h3 className="metric-title">Status</h3>
                    <div className="metric-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="metric-content">
                  <div className="metric-value">
                    <span className={`status-badge ${room.is_vacant ? 'vacant' : 'occupied'}`}>
                      {room.is_vacant ? 'Vacant' : 'Occupied'}
                    </span>
                  </div>
                  <div className="metric-subtitle">Current status</div>
                </div>
              </div>
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="alert alert-error">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {success && (
            <div className="alert alert-success">
              <strong>Success:</strong> {success}
            </div>
          )}

          {/* Main Content */}
          <div className="main-content">
            {/* Edit Room Form */}
            <div className="form-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Edit Room Details</h2>
                  <p className="section-subtitle">Update the room information</p>
                </div>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Room Number/Name*</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Room 101, Suite A, etc."
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Room Type*</label>
                    <select
                      name="room_type"
                      value={formData.room_type}
                      onChange={handleChange}
                      required
                      className="form-input"
                    >
                      <option value="Standard">Standard</option>
                      <option value="Deluxe">Deluxe</option>
                      <option value="Suite">Suite</option>
                      <option value="Studio">Studio</option>
                      <option value="Shared">Shared</option>
                      <option value="Premium">Premium</option>
                      <option value="Economy">Economy</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Floor</label>
                    <input
                      type="text"
                      name="floor"
                      value={formData.floor || ''}
                      onChange={handleChange}
                      placeholder="e.g., 1st Floor, Ground, etc."
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Max Capacity*</label>
                    <input
                      type="number"
                      name="max_capacity"
                      value={formData.max_capacity || 2}
                      onChange={handleChange}
                      required
                      min="1"
                      max="10"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Monthly Rent*</label>
                    <div className="currency-input-wrapper">
                      <span className="currency-symbol">$</span>
                      <input
                        type="number"
                        name="monthly_rent"
                        value={typeof formData.monthly_rent === 'number' ? formData.monthly_rent : (formData.monthly_rent ? Number(formData.monthly_rent) : '')}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                        placeholder="Enter monthly rent amount"
                        className="form-input currency-input"
                        disabled={property && property.rent_type === 'per_property'}
                        title={property && property.rent_type === 'per_property' ? 'Monthly rent is set at the property level and cannot be edited for individual rooms.' : ''}
                      />
                    </div>
                    {property && property.rent_type === 'per_property' && (
                      <div className="field-hint" style={{ color: '#d97706' }}>
                        Rent is set at the property level. To change rent, edit the property instead.
                      </div>
                    )}
                    {(!property || property.rent_type !== 'per_property') && (
                      <div className="field-hint">Enter the monthly rent amount in USD</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Security Deposit*</label>
                    <div className="currency-input-wrapper">
                      <span className="currency-symbol">$</span>
                      <input
                        type="number"
                        name="security_deposit"
                        value={typeof formData.security_deposit === 'number' ? formData.security_deposit : (formData.security_deposit ? Number(formData.security_deposit) : '')}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                        placeholder="Enter security deposit amount"
                        className="form-input currency-input"
                      />
                    </div>
                    <div className="field-hint">Typically 1-2 months of rent</div>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? 'Updating...' : 'Update Room'}
                  </button>
                  <Link href={`/properties/${propertyId}/rooms`} className="btn btn-secondary">
                    Cancel
                  </Link>
                </div>
              </form>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Quick Actions</h2>
                  <p className="section-subtitle">Frequently used actions</p>
                </div>
              </div>
              
              <div className="actions-grid">
                <div className="action-card blue" onClick={() => router.push(`/properties/${propertyId}/rooms`)}>
                  <div className="action-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>
                  </div>
                  <div className="action-content">
                    <h3 className="action-title">View All Rooms</h3>
                    <p className="action-subtitle">Back to rooms list</p>
                  </div>
                </div>
                
                <div className="action-card green" onClick={() => router.push(`/inventory?room=${roomIdNum}`)}>
                  <div className="action-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                  </div>
                  <div className="action-content">
                    <h3 className="action-title">Room Inventory</h3>
                    <p className="action-subtitle">Manage room items</p>
                  </div>
                </div>
                
                <div className="action-card purple" onClick={() => router.push('/applications')}>
                  <div className="action-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <div className="action-content">
                    <h3 className="action-title">Find Tenant</h3>
                    <p className="action-subtitle">Review applications</p>
                  </div>
                </div>
                
                {property && (
                  <div className="action-card blue" onClick={() => router.push(`/properties/${propertyId}`)}>
                    <div className="action-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>
                    </div>
                    <div className="action-content">
                      <h3 className="action-title">Property Details</h3>
                      <p className="action-subtitle">View property info</p>
                    </div>
                  </div>
                )}
              </div>
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

        .header-right {
          flex-shrink: 0;
        }

        .dashboard-title {
          font-size: 22px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
          line-height: 1.15;
        }

        .welcome-message {
          font-size: 14px;
          color: #4b5563;
          margin: 0;
          line-height: 1.45;
        }

        .back-btn {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 10px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .back-btn:hover {
          background: #3730a3;
          transform: translateY(-1px);
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

        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          display: inline-block;
        }

        .status-badge.vacant {
          background: #fef3c7;
          color: #d97706;
        }

        .status-badge.occupied {
          background: #dcfce7;
          color: #16a34a;
        }

        /* Main Content */
        .main-content {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        /* Form Section */
        .form-section,
        .quick-actions-section {
          background: white;
          border-radius: 6px;
          padding: 18px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          height: fit-content;
        }

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
        
        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .form-label {
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }
        
        .form-input {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        /* Currency Input Styling */
        .currency-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .currency-symbol {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-weight: 600;
          color: #6b7280;
          font-size: 14px;
          z-index: 1;
          pointer-events: none;
        }

        .currency-input {
          padding-left: 28px !important;
        }

        .field-hint {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
          font-style: italic;
        }

        .currency-input-wrapper:focus-within .currency-symbol {
          color: #4f46e5;
        }
        
        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }

        .btn {
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: none;
        }

        .btn-primary {
          background: #4f46e5;
          color: white;
        }

        .btn-primary:hover {
          background: #3730a3;
        }

        .btn-primary:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }

        .btn-secondary:hover {
          background: #e2e8f0;
        }
        
        /* Quick Actions Section */
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
        
        /* Alerts */
        .alert {
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .alert-error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }
        
        .alert-success {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }

        /* Loading & Error sections */
        .loading-section,
        .error-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
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
          border: 4px solid #e5e7eb;
          border-top-color: #4f46e5;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .actions-container {
          margin-top: 20px;
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
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

          .main-content {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
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

          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
} 