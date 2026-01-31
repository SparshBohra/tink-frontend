import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth, withAuth } from '../../lib/auth-context';
import { apiClient } from '../../lib/api';
import { Property } from '../../lib/types';

export default function AddInventoryItem() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    qty: 1,
    property_ref: '',
    room: '',
    condition_status: 'new',
    cost: '',
    purchase_date: '',
    needs_maintenance: false
  });

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await apiClient.getProperties();
        setProperties(res.results || []);
      } catch (e: any) {
        setError(e.message || 'Failed to load properties');
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    // If property is changed, fetch rooms for that property
    if (name === 'property_ref' && value) {
      try {
        const propertyRooms = await apiClient.getPropertyRooms(Number(value));
        setRooms(propertyRooms);
        // Reset room selection when property changes
        setFormData(prev => ({
          ...prev,
          property_ref: value,
          room: ''
        }));
      } catch (error) {
        console.error('Failed to fetch rooms:', error);
        setRooms([]);
        setFormData(prev => ({
          ...prev,
          property_ref: value,
          room: ''
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: newValue
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      const payload: any = {
        name: formData.name,
        qty: Number(formData.qty),
        property_ref: Number(formData.property_ref)
      };
      if (formData.room) payload.room = Number(formData.room);
      payload.condition_status = formData.condition_status;
      if (formData.cost) payload.cost = Number(formData.cost);
      if (formData.purchase_date) payload.purchase_date = formData.purchase_date;
      payload.needs_maintenance = formData.needs_maintenance;

      await apiClient.createInventoryItem(payload);
      router.push('/inventory');
    } catch (e: any) {
      setError(e.message || 'Failed to add inventory item');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Add Inventory Item - SquareFt</title>
        </Head>
        <DashboardLayout title="">
          <div className="dashboard-container">
            {/* Custom Header */}
            <div className="dashboard-header">
              <div className="header-content">
                <div className="header-left">
                  <h1 className="dashboard-title">Add Inventory Item</h1>
                  <div className="subtitle-container">
                    <p className="welcome-message">
                      Loading properties...
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <LoadingSpinner />
          </div>
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Add Inventory Item - SquareFt</title>
      </Head>
      <DashboardLayout title="">
        <div className="dashboard-container">
          {/* Custom Header */}
          <div className="dashboard-header">
            <div className="header-content">
              <div className="header-left">
                <h1 className="dashboard-title">Add Inventory Item</h1>
                <div className="subtitle-container">
                  <p className="welcome-message">
                    Add a new item to your property inventory
                  </p>
                </div>
              </div>
              <div className="header-right">
                <Link href="/inventory" className="back-btn">
                  ← Back to Inventory
                </Link>
              </div>
            </div>
          </div>

          {error && <div className="alert alert-error"><strong>Error:</strong> {error}</div>}

          <div className="main-content-grid">
            <div className="left-column">
              {/* Item Details Form */}
              <div className="form-section">
                <div className="section-header">
                  <div>
                    <h2 className="section-title">Item Details</h2>
                    <p className="section-subtitle">Enter the information for your new inventory item</p>
                  </div>
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label className="form-label">Item Name*</label>
                      <input
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="e.g., Office Chair, Desk Lamp, Bed Frame"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Quantity*</label>
                      <input
                        name="qty"
                        type="number"
                        min={1}
                        value={formData.qty}
                        onChange={handleChange}
                        required
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Property*</label>
                      <select
                        name="property_ref"
                        value={formData.property_ref}
                        onChange={handleChange}
                        required
                        className="form-input"
                      >
                        <option value="">Select Property</option>
                        {properties.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Room</label>
                      <select
                        name="room"
                        value={formData.room}
                        onChange={handleChange}
                        className="form-input"
                        disabled={!formData.property_ref}
                      >
                        <option value="">Select Room (or N/A)</option>
                        {rooms.map(room => (
                          <option key={room.id} value={room.id}>
                            {room.name} {room.room_type ? `(${room.room_type})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Condition*</label>
                      <select
                        name="condition_status"
                        value={formData.condition_status}
                        onChange={handleChange}
                        className="form-input"
                      >
                        <option value="new">New</option>
                        <option value="good">Good</option>
                        <option value="used">Used</option>
                        <option value="broken">Broken</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Cost (USD)</label>
                      <input
                        name="cost"
                        type="number"
                        step="0.01"
                        value={formData.cost}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Purchase Date</label>
                      <input
                        name="purchase_date"
                        type="date"
                        value={formData.purchase_date}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group full-width">
                      <label className="form-checkbox">
                        <input
                          name="needs_maintenance"
                          type="checkbox"
                          checked={formData.needs_maintenance}
                          onChange={handleChange}
                        />
                        Needs Maintenance
                      </label>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn btn-primary"
                    >
                      {saving ? 'Saving...' : 'Save Item'}
                    </button>
                    <Link href="/inventory" className="btn btn-secondary">
                      Cancel
                    </Link>
                  </div>
                </form>
              </div>
            </div>

            <div className="right-column">
              {/* Quick Tips */}
              <div className="tips-section">
                <div className="section-header">
                  <div>
                    <h2 className="section-title">Quick Tips</h2>
                    <p className="section-subtitle">Best practices for inventory management</p>
                  </div>
                </div>
                <div className="tips-grid">
                  <div className="tip-item">
                    <strong>Item Names</strong>
                    <p>Use descriptive names that include brand/model when relevant (e.g., "IKEA Malm Bed Frame" vs "Bed").</p>
                  </div>
                  <div className="tip-item">
                    <strong>Property Assignment</strong>
                    <p>Always assign items to properties. Room assignment is optional but helps with organization.</p>
                  </div>
                  <div className="tip-item">
                    <strong>Cost Tracking</strong>
                    <p>Recording purchase costs helps with budgeting and insurance claims.</p>
                  </div>
                  <div className="tip-item">
                    <strong>Maintenance Flags</strong>
                    <p>Check "Needs Maintenance" for items requiring immediate attention or repair.</p>
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

        .subtitle-container {
          min-height: 22px;
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
        
        /* Main Layout Grid */
        .main-content-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
          align-items: flex-start;
        }

        .left-column, .right-column {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Section Styling */
        .form-section,
        .tips-section {
          background: white;
          border-radius: 6px;
          padding: 18px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          height: fit-content;
        }

        .section-header {
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

        /* Form Styling */
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
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
          background: white;
          box-sizing: border-box;
        }

        .form-input:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .form-input:disabled {
          background: #f1f5f9;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .form-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #374151;
          padding: 6px 0;
        }

        .form-checkbox input[type="checkbox"] {
          width: 16px;
          height: 16px;
          accent-color: #4f46e5;
          cursor: pointer;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-start;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }

        /* Button Styling */
        .btn {
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;
          text-decoration: none;
          border: none;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #4f46e5;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #3730a3;
        }

        .btn-secondary {
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }

        .btn-secondary:hover {
          background: #e2e8f0;
        }

        /* Tips Section */
        .tips-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .tip-item {
          padding: 16px;
          background: #f8fafc;
          border-radius: 6px;
          border-left: 3px solid #4f46e5;
        }
        
        .tip-item strong {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 6px;
        }

        .tip-item p {
          font-size: 13px;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }

        /* Alert Styling & Loading */
        .alert { padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 8px; }
        .alert-error { background-color: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
        .loading-indicator { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; text-align: center; }
        .loading-spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: #4f46e5; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Responsive Design */
        @media (max-width: 900px) {
          .main-content-grid {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
} 
 
 
 
 