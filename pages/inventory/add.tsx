import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navigation from '../../components/Navigation';
import DashboardLayout from '../../components/DashboardLayout';
import SectionCard from '../../components/SectionCard';
import MetricCard from '../../components/MetricCard';
import { apiClient } from '../../lib/api';
import { Property } from '../../lib/types';

export default function AddInventoryItem() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
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
          <title>Add Inventory Item - Tink</title>
        </Head>
        <Navigation />
        <DashboardLayout
          title="Add Inventory Item"
          subtitle="Loading properties..."
        >
          <div className="loading-indicator">
            <div className="loading-spinner" />
            <p>Loading form data...</p>
          </div>
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Add Inventory Item - Tink</title>
      </Head>
      <Navigation />
      
      <DashboardLayout
        title="➕ Add Inventory Item"
        subtitle="Add a new item to your property inventory"
      >
        <div className="actions-container">
          <Link href="/inventory" className="btn btn-secondary">
            ← Back to Inventory
          </Link>
        </div>

        {error && <div className="alert alert-error"><strong>Error:</strong> {error}</div>}

        <SectionCard title="Item Details" subtitle="Enter the basic information for your new inventory item">
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
                <label className="form-label">Room (Optional)</label>
                <input
                  name="room"
                  type="text"
                  value={formData.room}
                  onChange={handleChange}
                  placeholder="e.g., Room 101, Common Area"
                  className="form-input"
                />
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
                  <span className="checkmark"></span>
                  Needs Maintenance Immediately
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? 'Saving...' : '💾 Save Item'}
              </button>
              <Link href="/inventory" className="btn btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </SectionCard>

        <SectionCard title="Quick Tips" subtitle="Best practices for inventory management">
          <div className="info-grid">
            <div className="info-item">
              <h4>📝 Item Names</h4>
              <p>Use descriptive names that include brand/model when relevant (e.g., "IKEA Malm Bed Frame" vs "Bed")</p>
            </div>
            <div className="info-item">
              <h4>🏠 Property Assignment</h4>
              <p>Always assign items to properties. Room assignment is optional but helps with organization.</p>
            </div>
            <div className="info-item">
              <h4>💰 Cost Tracking</h4>
              <p>Recording purchase costs helps with budgeting and insurance claims.</p>
            </div>
            <div className="info-item">
              <h4>🔧 Maintenance Flags</h4>
              <p>Check "Needs Maintenance" for items requiring immediate attention or repair.</p>
            </div>
          </div>
        </SectionCard>
      </DashboardLayout>
    </>
  );
} 
 
 
 
 