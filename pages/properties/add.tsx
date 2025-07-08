import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { apiClient } from '../../lib/api';
import DashboardLayout from '../../components/DashboardLayout';
import { usStates } from '../../lib/states';
import { Landlord } from '../../lib/types';

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
    property_type: 'coliving',
    timezone: '',
    rent_type: 'per_property',
    monthly_rent: '',
    landlord: undefined as number | undefined,
  });
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
        if (profile.role === 'landlord') {
          setFormData(prev => ({ ...prev, landlord: profile.id }));
          return;
        }
        if (profile.role === 'manager') {
          const rel = await apiClient.getManagerLandlordRelationships();
          if (rel.length === 1) {
            setFormData(prev => ({ ...prev, landlord: rel[0].landlord }));
            return;
          }
        }
        // Otherwise fetch all landlords for selection
        setLandlordsLoading(true);
        const list = await apiClient.getAllLandlords();
        setLandlords(list);
      } catch (e) {
        console.error('Failed to load landlord info:', e);
      } finally {
        setLandlordsLoading(false);
        setProfileResolved(true);
      }
    };
    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validate required fields
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
      const payload = {
        ...formData,
        rent_type: formData.rent_type as 'per_property' | 'per_room',
        monthly_rent: formData.rent_type === 'per_property' ? String(formData.monthly_rent) : '',
      };
      const newProperty = await apiClient.createProperty(payload);
      setSuccess(`Property "${newProperty.name}" created successfully!`);

      setFormData({
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
        landlord: formData.landlord,
      });

      setTimeout(() => {
        router.push(`/properties/${newProperty.id}/rooms`);
      }, 1500);
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

  return (
    <>
      <Head>
        <title>Register New Property - Tink</title>
      </Head>
      <DashboardLayout title="">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <div className="header-content">
              <div className="header-left">
                <h1 className="dashboard-title">Register New Property</h1>
                <p className="welcome-message">Add a new property to your management portfolio.</p>
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
                  <p className="section-subtitle">Enter the information for your new property.</p>
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
                          <h4 className="info-title">Room Setup Required</h4>
                          <p className="info-description">
                            You'll be able to add rooms and set individual rent amounts for each room after creating the property.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Creating Property...' : 
                     formData.rent_type === 'per_room' ? 'Create Property & Add Rooms' : 'Create Property'
                    }
                  </button>
                  <button type="button" onClick={() => router.back()} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>

            <div className="quick-actions-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Quick Actions</h2>
                  <p className="section-subtitle">Frequently used actions</p>
                </div>
              </div>

              <div className="actions-grid">
                <div className="action-card blue" onClick={() => router.push('/properties')}>
                  <div className="action-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg></div>
                  <div className="action-content">
                    <h3 className="action-title">View All Properties</h3>
                    <p className="action-subtitle">Back to property list</p>
                  </div>
                </div>
                <div className="action-card green" onClick={() => router.push('/tenants')}>
                  <div className="action-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                  <div className="action-content">
                    <h3 className="action-title">Manage Tenants</h3>
                    <p className="action-subtitle">View and add tenants</p>
                  </div>
                </div>
                <div className="action-card purple" onClick={() => router.push('/applications')}>
                  <div className="action-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
                  <div className="action-content">
                    <h3 className="action-title">Review Applications</h3>
                    <p className="action-subtitle">Process new applications</p>
                  </div>
                </div>
                <div className="action-card blue" onClick={() => router.push('/leases')}>
                  <div className="action-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
                  <div className="action-content">
                    <h3 className="action-title">Manage Leases</h3>
                    <p className="action-subtitle">View and manage leases</p>
                  </div>
                </div>
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
        
        /* Dark Mode Styles */
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
        
        /* Dark mode for new elements */
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
        
        @media (max-width: 1024px) { 
          .main-content-grid { grid-template-columns: 1fr; }
          .rent-type-options { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) { 
          .form-grid { grid-template-columns: 1fr; } 
          .form-group.full-width { grid-column: span 1; } 
          .rent-type-options { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
} 