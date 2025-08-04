import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { apiClient } from '../../../lib/api';
import { Property } from '../../../lib/types';
import DashboardLayout from '../../../components/DashboardLayout';

export default function AddRoom() {
  const router = useRouter();
  const { id } = router.query;
  const propertyId = id ? parseInt(Array.isArray(id) ? id[0] : String(id), 10) : null;
  
  const [property, setProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState({
    property_ref: propertyId || 0,
    name: '',
    room_type: 'Standard',
    floor: '',
    max_capacity: 2,
    monthly_rent: 0,
    security_deposit: 0
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

    try {
      const roomData = {
        ...formData,
        property_ref: propertyId as number
      };
      const newRoom = await apiClient.createRoom(roomData);
      setSuccess(`Room "${newRoom.name}" added successfully to ${property?.name}!`);
      
      // Reset form (except property)
      setFormData({
        property_ref: propertyId as number,
        name: '',
        room_type: 'Standard',
        floor: '',
        max_capacity: 2,
        monthly_rent: 0,
        security_deposit: 0
      });
      
      // Redirect after short delay
      setTimeout(() => {
        router.push(`/properties/${propertyId}`);
      }, 1500);
    } catch (err: any) {
      console.error('Failed to add room:', err);
      setError(err.message || 'Failed to add room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'monthly_rent' || name === 'security_deposit' || name === 'max_capacity') 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const formatCurrencyDisplay = (value: number) => {
    if (value === 0) return '';
    return value.toString();
  };

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
                <Link href={`/properties/${propertyId}`} className="back-btn">
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
                    <h3 className="metric-title">Total Rooms</h3>
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
                  <div className="metric-subtitle">Current rooms</div>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-header">
                  <div className="metric-info">
                    <h3 className="metric-title">Address</h3>
                    <div className="metric-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="metric-content">
                  <div className="metric-value">{property.address_line1 && property.city ? `${property.address_line1}, ${property.city}` : 'N/A'}</div>
                  <div className="metric-subtitle">Location</div>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-header">
                  <div className="metric-info">
                    <h3 className="metric-title">Status</h3>
                    <div className="metric-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M9 12l2 2 4-4"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="metric-content">
                  <div className="metric-value">
                    <span className="status-badge active">Active</span>
                  </div>
                  <div className="metric-subtitle">Property status</div>
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
            {/* Room Form */}
            <div className="form-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Room Details</h2>
                  <p className="section-subtitle">Enter the details for the new room</p>
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
                      value={formData.floor}
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
                      value={formData.max_capacity}
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
                        value={formatCurrencyDisplay(formData.monthly_rent)}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                        placeholder="Enter monthly rent amount"
                        className="form-input currency-input"
                      />
                    </div>
                    <div className="field-hint">Enter the monthly rent amount in USD</div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Security Deposit*</label>
                    <div className="currency-input-wrapper">
                      <span className="currency-symbol">$</span>
                      <input
                        type="number"
                        name="security_deposit"
                        value={formatCurrencyDisplay(formData.security_deposit)}
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
                    {loading ? 'Adding...' : 'Add Room'}
                  </button>
                  <Link href={`/properties/${propertyId}`} className="btn btn-secondary">
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
                <div className="action-card blue" onClick={() => router.push(`/properties/${propertyId}`)}>
                  <div className="action-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 21h18"/>
                      <path d="M5 21V7l8-4v18"/>
                      <path d="M19 21V11l-6-4"/>
                    </svg>
                  </div>
                  <div className="action-content">
                    <h3 className="action-title">View All Rooms</h3>
                    <p className="action-subtitle">See all property rooms</p>
                  </div>
                </div>
                
                <div className="action-card green" onClick={() => router.push('/properties')}>
                  <div className="action-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 21h18"/>
                      <path d="M5 21V7l8-4v18"/>
                      <path d="M19 21V11l-6-4"/>
                    </svg>
                  </div>
                  <div className="action-content">
                    <h3 className="action-title">All Properties</h3>
                    <p className="action-subtitle">Back to properties list</p>
                  </div>
                </div>
                
                <div className="action-card purple" onClick={() => router.push('/applications')}>
                  <div className="action-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                  </div>
                  <div className="action-content">
                    <h3 className="action-title">Review Applications</h3>
                    <p className="action-subtitle">Process tenant applications</p>
                  </div>
                </div>
                
                {property && (
                  <div className="action-card blue" onClick={() => router.push(`/properties/${propertyId}`)}>
                    <div className="action-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 21h18"/>
                        <path d="M5 21V7l8-4v18"/>
                        <path d="M19 21V11l-6-4"/>
                      </svg>
                    </div>
                    <div className="action-content">
                      <h3 className="action-title">Property Details</h3>
                      <p className="action-subtitle">View property room management</p>
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

        .status-badge.active {
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
          padding-left: 48px !important;
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

        /* Actions Grid */
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
          border: 1px solid #fecaca;
          color: #dc2626;
        }

        .alert-success {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #16a34a;
        }

        /* Error Section */
        .error-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
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