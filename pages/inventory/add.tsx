import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navigation from '../../components/Navigation';
import { apiClient } from '../../lib/api';
import { Property } from '../../lib/types';

export default function AddInventoryItem() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      alert('Inventory item added!');
      router.push('/inventory');
    } catch (e: any) {
      alert('Failed to add item: ' + (e.message || 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div>
        <Navigation />
        <h1>Loading...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navigation />
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <div style={{ marginBottom: '20px' }}>
        <Link href="/inventory">
          <button style={{ backgroundColor: '#6c757d', color: 'white' }}>← Back to Inventory</button>
        </Link>
        <h1 style={{ marginTop: '10px' }}>➕ Add Inventory Item</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label><strong>Name</strong></label><br />
          <input name="name" value={formData.name} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label><strong>Quantity</strong></label><br />
          <input name="qty" type="number" min={1} value={formData.qty} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label><strong>Property</strong></label><br />
          <select name="property_ref" value={formData.property_ref} onChange={handleChange} required style={{ width: '100%', padding: '8px' }}>
            <option value="">Select Property</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label><strong>Room (optional)</strong></label><br />
          <input name="room" value={formData.room} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label><strong>Condition</strong></label><br />
          <select name="condition_status" value={formData.condition_status} onChange={handleChange} style={{ width: '100%', padding: '8px' }}>
            <option value="new">New</option>
            <option value="good">Good</option>
            <option value="used">Used</option>
            <option value="broken">Broken</option>
          </select>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label><strong>Cost (USD)</strong></label><br />
          <input name="cost" type="number" value={formData.cost} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label><strong>Purchase Date</strong></label><br />
          <input name="purchase_date" type="date" value={formData.purchase_date} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label>
            <input name="needs_maintenance" type="checkbox" checked={formData.needs_maintenance} onChange={handleChange} />{' '}
            Needs Maintenance Immediately
          </label>
        </div>

        <button type="submit" style={{ backgroundColor: '#28a745', color: 'white', padding: '10px 20px' }}>Save Item</button>
      </form>
    </div>
  );
} 
 
 
 
 