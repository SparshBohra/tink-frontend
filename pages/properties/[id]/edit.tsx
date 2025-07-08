import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { apiClient } from '../../../lib/api';
import DashboardLayout from '../../../components/DashboardLayout';
import { usStates } from '../../../lib/states';
import { PropertyFormData, Property } from '../../../lib/types';

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

export default function EditProperty() {
  const router = useRouter();
  const { id } = router.query;
  const [property, setProperty] = useState<Property | null>(null);
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profileResolved, setProfileResolved] = useState(false);

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

        // Load property if ID is available
    if (id) {
          const propertyData = await apiClient.getProperty(Number(id));
          setProperty(propertyData);
          setFormData({
            name: propertyData.name,
            address_line1: propertyData.address_line1,
            address_line2: propertyData.address_line2 || '',
            city: propertyData.city,
            state: propertyData.state,
            postal_code: propertyData.postal_code,
            country: propertyData.country,
            property_type: propertyData.property_type,
            timezone: propertyData.timezone,
            rent_type: propertyData.rent_type || 'per_property',
            monthly_rent: propertyData.monthly_rent ? String(propertyData.monthly_rent) : '',
            landlord: propertyData.landlord || landlordId,
            total_rooms: propertyData.total_rooms || 0,
          });
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load property details or user profile. Please refresh the page.');
      } finally {
        setProfileResolved(true);
      }
    };
    init();
  }, [id]);

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
      if (!id) return;
      
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
          monthly_rent: null // Clear for per_room type
        })
      };

      const updatedProperty = await apiClient.updateProperty(Number(id), payload);
      setProperty(updatedProperty);
      setSuccess(`Property "${updatedProperty.name}" updated successfully!`);
      
      setTimeout(() => {
        router.push(`/properties/${updatedProperty.id}/rooms`);
      }, 1500);
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

  // Don't render the form until profile is resolved
  if (!profileResolved) {
    return (
      <>
        <Head>
          <title>Edit Property - Loading - Tink</title>
        </Head>
        <DashboardLayout title="">
          <div className="dashboard-container">
            <div className="dashboard-header">
              <div className="header-content">
                <div className="header-left">
                  <h1 className="dashboard-title">Loading...</h1>
                  <p className="welcome-message">Please wait while we load your property details.</p>
                </div>
              </div>
            </div>
            <div className="loading-section">
              <div className="loading-indicator">
                <div className="loading-spinner"></div>
                <p>Loading property and profile information...</p>
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
        <title>Edit Property - {property?.name || ''} - Tink</title>
      </Head>
      <DashboardLayout title="">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <div className="header-content">
              <div className="header-left">
                <h1 className="dashboard-title">Edit Property</h1>
                <p className="welcome-message">Update details for {property?.name}.</p>
              </div>
              <div className="header-right">
                <button onClick={() => router.back()} className="back-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7 7l-7-7 7-7"/></svg>
                  Back
                </button>
              </div>
            </div>
          </div>

          {error && <div className="alert alert-error"><strong>Error:</strong> {error}</div>}
          {success && <div className="alert alert-success"><strong>Success:</strong> {success}</div>}

          <div className="main-content-grid">
            <div className="form-section">
              <div className="section-header">
                  <h2 className="section-title">Property Details</h2>
                <p className="section-subtitle">Update the information for your property.</p>
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
                  {formData.rent_type !== property?.rent_type && (
                    <div className="form-warning">
                      <strong>Warning:</strong> Changing the rent structure may affect existing room configurations and pricing.
                            </div>
                  )}
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
                  </>
                  )}

                  {formData.rent_type === 'per_room' && (
                  <div className="info-box">
                        <div className="info-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                          </svg>
                        </div>
                        <div className="info-content">
                      <h4>Per-Room Rent Structure</h4>
                      <p>Individual rooms can be configured with their own pricing. Go to the rooms section to set up individual room rents and details.</p>
                    </div>
                    </div>
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

                <div className="form-actions">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? (
                      <>
                        <div className="btn-spinner"></div>
                        Updating Property...
                      </>
                    ) : (
                      'Update Property'
                    )}
                  </button>
                  
                  <Link href={`/properties/${id}/rooms`} className="btn btn-secondary">
                    Manage Rooms
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>

      <style jsx>{`
          .info-box {
          display: flex;
          padding: 16px;
            background: #f0f9ff;
            border: 1px solid #e0f2fe;
          border-radius: 8px;
            margin: 16px 0;
          }

          .info-icon {
          flex-shrink: 0;
            margin-right: 12px;
            color: #0369a1;
        }
        
          .info-content h4 {
            margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
            color: #0369a1;
        }
        
          .info-content p {
          margin: 0;
            font-size: 14px;
            color: #075985;
          line-height: 1.4;
        }
        
          .form-warning {
            margin-top: 8px;
            padding: 12px;
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
          font-size: 14px;
            color: #92400e;
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

          .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 16px;
        }
        
        @media (max-width: 768px) {
            .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      </DashboardLayout>
    </>
  );
} 