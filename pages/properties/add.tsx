import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { apiClient } from '../../lib/api';
import DashboardLayout from '../../components/DashboardLayout';
import { usStates } from '../../lib/states';

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
    timezone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

    try {
      const newProperty = await apiClient.createProperty(formData);
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
        timezone: ''
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
      [name]: value
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
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save and Add Rooms'}
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
        @media (max-width: 1024px) { .main-content-grid { grid-template-columns: 1fr; } }
        @media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } .form-group.full-width { grid-column: span 1; } }
      `}</style>
    </>
  );
} 