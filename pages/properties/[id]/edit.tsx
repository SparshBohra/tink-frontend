import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { apiClient } from '../../../lib/api';
import DashboardLayout from '../../../components/DashboardLayout';
import { usStates } from '../../../lib/states';
import { PropertyFormData, Property } from '../../../lib/types';

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
    property_type: 'coliving',
    timezone: '',
    rent_type: 'per_property',
    monthly_rent: '',
    landlord: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      apiClient.getProperty(Number(id))
        .then(data => {
          setProperty(data);
          setFormData({
            name: data.name,
            address_line1: data.address_line1,
            address_line2: data.address_line2 || '',
            city: data.city,
            state: data.state,
            postal_code: data.postal_code,
            country: data.country,
            property_type: data.property_type,
            timezone: data.timezone,
            rent_type: data.rent_type || 'per_property',
            monthly_rent: data.monthly_rent ? String(data.monthly_rent) : '',
            landlord: data.landlord,
          });
        })
        .catch(err => {
          setError('Failed to fetch property details.');
          console.error(err);
        });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!formData.name || !formData.address_line1 || !formData.city || !formData.state || !formData.postal_code || !formData.country || !formData.timezone) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    if (formData.rent_type === 'per_property' && (!formData.monthly_rent || isNaN(Number(formData.monthly_rent)))) {
      setError('Please enter a valid monthly rent amount for the property. This field is required when "Per Property" rent structure is selected.');
      setLoading(false);
      return;
    }

    try {
      if (!id) return;
      const payload = {
        ...formData,
        monthly_rent: formData.rent_type === 'per_property' ? formData.monthly_rent : '',
      };
      const updatedProperty = await apiClient.updateProperty(Number(id), payload);
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
                  <p className="section-subtitle">Update the information for your new property.</p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label className="form-label">Property Name*</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g., Downtown Professional Suites" className="form-input"/>
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Address Line 1*</label>
                    <input type="text" name="address_line1" value={formData.address_line1} onChange={handleChange} required placeholder="e.g., 123 Main Street" className="form-input"/>
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Address Line 2</label>
                    <input type="text" name="address_line2" value={formData.address_line2} onChange={handleChange} placeholder="e.g., Apt 4B, Suite 200 (optional)" className="form-input"/>
                  </div>
                  <div className="form-group"><label className="form-label">City*</label><input type="text" name="city" value={formData.city} onChange={handleChange} required placeholder="e.g., New York" className="form-input"/></div>
                  <div className="form-group">
                    <label className="form-label">State*</label>
                    <select name="state" value={formData.state} onChange={handleChange} required className="form-input">
                      <option value="" disabled>Select a state</option>
                      {usStates.map(s => (
                        <option key={s.abbreviation} value={s.abbreviation}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Postal Code*</label><input type="text" name="postal_code" value={formData.postal_code} onChange={handleChange} required placeholder="e.g., 10001" className="form-input"/></div>
                  <div className="form-group">
                    <label className="form-label">Country*</label>
                    <select name="country" value={formData.country} onChange={handleChange} required className="form-input">
                      <option value="United States">United States</option>
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Property Type*</label><select name="property_type" value={formData.property_type} onChange={handleChange} required className="form-input"><option value="coliving">Co-Living Space</option><option value="residential">Residential Property</option></select></div>
                  <div className="form-group">
                    <label className="form-label">Time Zone*</label>
                    <select name="timezone" value={formData.timezone} onChange={handleChange} required className="form-input">
                      <option value="" disabled>Select a timezone</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Rent Structure*</label>
                    <div className="rent-type-selection">
                      <div className="rent-type-options">
                        <label className={`rent-type-option ${formData.rent_type === 'per_property' ? 'selected' : ''}`}>
                          <input 
                            type="radio" 
                            name="rent_type" 
                            value="per_property" 
                            checked={formData.rent_type === 'per_property'}
                            onChange={handleChange}
                            className="rent-type-radio"
                          />
                          <div className="rent-type-content">
                            <div className="rent-type-header">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 21h18"/>
                                <path d="M5 21V7l8-4v18"/>
                                <path d="M19 21V11l-6-4"/>
                              </svg>
                              <span className="rent-type-title">Per Property</span>
                            </div>
                            <p className="rent-type-description">Set one rent amount for the entire property. Best for single-family homes or when renting the whole property to one tenant.</p>
                          </div>
                        </label>
                        <label className={`rent-type-option ${formData.rent_type === 'per_room' ? 'selected' : ''}`}>
                          <input 
                            type="radio" 
                            name="rent_type" 
                            value="per_room" 
                            checked={formData.rent_type === 'per_room'}
                            onChange={handleChange}
                            className="rent-type-radio"
                          />
                          <div className="rent-type-content">
                            <div className="rent-type-header">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                                <line x1="8" y1="21" x2="16" y2="21"/>
                                <line x1="12" y1="17" x2="12" y2="21"/>
                              </svg>
                              <span className="rent-type-title">Per Room</span>
                            </div>
                            <p className="rent-type-description">Set individual rent amounts for each room. Perfect for co-living spaces, shared housing, or multi-room rentals.</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                  {formData.rent_type === 'per_property' && (
                    <div className="form-group full-width">
                      <label className="form-label">Monthly Rent*</label>
                      <div className="rent-input-wrapper">
                        <span className="currency-symbol">$</span>
                        <input 
                          type="number" 
                          name="monthly_rent" 
                          value={formData.monthly_rent} 
                          onChange={handleChange} 
                          required 
                          placeholder="3000" 
                          className="form-input currency-input" 
                          min="0"
                          step="1"
                        />
                      </div>
                      <p className="form-help">This rent amount will apply to the entire property.</p>
                    </div>
                  )}
                  {formData.rent_type === 'per_room' && (
                    <div className="form-group full-width">
                      <div className="per-room-info">
                        <div className="info-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 16v-4"/>
                            <path d="M12 8h.01"/>
                          </svg>
                        </div>
                        <div className="info-content">
                          <h4 className="info-title">Room-Based Rent Management</h4>
                          <p className="info-description">
                            Rent amounts are managed individually for each room. You can set specific rent amounts in the room management section.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" onClick={() => router.back()} className="btn btn-secondary">
                    Cancel
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
        .form-input:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
        .form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
        .btn { padding: 10px 16px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s ease; text-decoration: none; border: none; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-primary { background: #4f46e5; color: white; }
        .btn-primary:hover:not(:disabled) { background: #3730a3; }
        .btn-secondary { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }
        
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
          padding-left: 28px;
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
        
        @media (max-width: 768px) {
          .rent-type-options {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
} 