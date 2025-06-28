import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navigation from '../../../components/Navigation';
import DashboardLayout from '../../../components/DashboardLayout';
import SectionCard from '../../../components/SectionCard';
import { apiClient } from '../../../lib/api';
import { Property, InventoryItem } from '../../../lib/types';

export default function EditInventoryItem() {
  const router = useRouter();
  const { id } = router.query;
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [item, setItem] = useState<InventoryItem | null>(null);

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
    if (id) {
      fetchItemAndProperties();
    }
  }, [id]);

  const fetchItemAndProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [itemResponse, propertiesResponse] = await Promise.all([
        apiClient.getInventoryItem(Number(id)),
        apiClient.getProperties()
      ]);

      setItem(itemResponse);
      setProperties(propertiesResponse.results || []);
      
      // Populate form with existing data
      setFormData({
        name: itemResponse.name,
        qty: itemResponse.qty,
        property_ref: itemResponse.property_ref.toString(),
        room: itemResponse.room?.toString() || '',
        condition_status: itemResponse.condition_status,
        cost: itemResponse.cost?.toString() || '',
        purchase_date: itemResponse.purchase_date || '',
        needs_maintenance: itemResponse.needs_maintenance || false
      });

      // Fetch rooms for the property
      if (itemResponse.property_ref) {
        const propertyRooms = await apiClient.getPropertyRooms(itemResponse.property_ref);
        setRooms(propertyRooms);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load inventory item');
    } finally {
      setLoading(false);
    }
  };

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

      await apiClient.updateInventoryItem(Number(id), payload);
      router.push('/inventory');
    } catch (e: any) {
      setError(e.message || 'Failed to update inventory item');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Edit Inventory Item - Tink</title>
        </Head>
        <Navigation />
        <DashboardLayout
          title="Edit Inventory Item"
          subtitle="Loading item data..."
        >
          <div className="loading-indicator">
            <div className="loading-spinner" />
            <p>Loading inventory item...</p>
          </div>
        </DashboardLayout>
      </>
    );
  }

  if (!item) {
    return (
      <>
        <Head>
          <title>Edit Inventory Item - Tink</title>
        </Head>
        <Navigation />
        <DashboardLayout
          title="Edit Inventory Item"
          subtitle="Item not found"
        >
          <div className="alert alert-error">
            <strong>Error:</strong> Inventory item not found.
          </div>
          <Link href="/inventory" className="btn btn-secondary">
            ← Back to Inventory
          </Link>
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Edit Inventory Item - Tink</title>
      </Head>
      <Navigation />
      
      <DashboardLayout
        title="✏️ Edit Inventory Item"
        subtitle={`Editing: ${item.name}`}
      >
        <div className="actions-container">
          <Link href="/inventory" className="btn btn-secondary">
            ← Back to Inventory
          </Link>
        </div>

        {error && <div className="alert alert-error"><strong>Error:</strong> {error}</div>}

        <SectionCard title="Item Details" subtitle="Update the information for this inventory item">
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
                <select
                  name="room"
                  value={formData.room}
                  onChange={handleChange}
                  className="form-input"
                  disabled={!formData.property_ref}
                >
                  <option value="">Select Room (or leave empty for common area)</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.name} {room.room_type ? `(${room.room_type})` : ''}
                    </option>
                  ))}
                </select>
                {!formData.property_ref && (
                  <small className="form-help">Please select a property first to see available rooms</small>
                )}
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

              <div className="form-group">
                <label className="form-label">
                  <input
                    name="needs_maintenance"
                    type="checkbox"
                    checked={formData.needs_maintenance}
                    onChange={handleChange}
                    className="form-checkbox"
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
                {saving ? 'Updating...' : 'Update Inventory Item'}
              </button>
              <Link href="/inventory" className="btn btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </SectionCard>
      </DashboardLayout>
    </>
  );
} 