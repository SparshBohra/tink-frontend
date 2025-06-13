import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { apiClient } from '../../lib/api';
import { Property, Room } from '../../lib/types';
import Navigation from '../../components/Navigation';

export default function AddTenant() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    room_ref: '',
    lease_start_date: '',
    lease_end_date: '',
    monthly_rent: '',
    security_deposit: '',
    notes: ''
  });
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);
  
  useEffect(() => {
    // Filter rooms by selected property
    if (selectedProperty) {
      const filtered = rooms.filter(room => 
        room.property_ref === selectedProperty && room.is_vacant
      );
      setAvailableRooms(filtered);
    } else {
      setAvailableRooms(rooms.filter(room => room.is_vacant));
    }
  }, [selectedProperty, rooms]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [propertiesResponse, roomsResponse] = await Promise.all([
        apiClient.getProperties(),
        apiClient.getRooms()
      ]);

      setProperties(propertiesResponse.results || []);
      const roomsData = roomsResponse.results || [];
      setRooms(roomsData);
      setAvailableRooms(roomsData.filter(room => room.is_vacant));
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      setError(error?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedProperty(value ? parseInt(value) : null);
    // Reset room selection when property changes
    setFormData(prev => ({ ...prev, room_ref: '' }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // First create the tenant
      const tenantData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        notes: formData.notes
      };
      
      const tenant = await apiClient.createTenant(tenantData);
      
      // Then create the lease
      if (formData.room_ref) {
        const leaseData = {
          tenant_ref: tenant.id,
          room_ref: parseInt(formData.room_ref),
          start_date: formData.lease_start_date,
          end_date: formData.lease_end_date,
          monthly_rent: parseFloat(formData.monthly_rent),
          security_deposit: parseFloat(formData.security_deposit),
          status: 'active'
        };
        
        await apiClient.createLease(leaseData);
        
        // Update room vacancy
        await apiClient.updateRoom(parseInt(formData.room_ref), { is_vacant: false });
      }
      
      setSuccess(`Tenant ${tenant.first_name} ${tenant.last_name} added successfully!`);
      
      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        room_ref: '',
        lease_start_date: '',
        lease_end_date: '',
        monthly_rent: '',
        security_deposit: '',
        notes: ''
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/tenants/${tenant.id}`);
      }, 1500);
    } catch (err: any) {
      console.error('Failed to add tenant:', err);
      setError(err.message || 'Failed to add tenant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && properties.length === 0) {
    return (
      <div>
        <Navigation />
        <h1>Loading...</h1>
        <p>Fetching data from the server...</p>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <Link href="/tenants">
          <button style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '15px'
          }}>
            ← Back to Tenants
          </button>
        </Link>
        <h1>👤 Register New Tenant</h1>
        <p style={{ color: '#666' }}>Add a tenant directly without requiring an application</p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div style={{ 
          color: 'red', 
          border: '1px solid red', 
          padding: '15px', 
          marginBottom: '20px',
          backgroundColor: '#ffebee'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {success && (
        <div style={{ 
          color: 'green', 
          border: '1px solid green', 
          padding: '15px', 
          marginBottom: '20px',
          backgroundColor: '#e8f5e8'
        }}>
          <strong>Success:</strong> {success}
        </div>
      )}

      {/* Tenant Form */}
      <div style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        backgroundColor: '#f8f9fa'
      }}>
        <form onSubmit={handleSubmit}>
          <h2>Tenant Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                First Name*
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Last Name*
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Email*
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                resize: 'vertical'
              }}
              placeholder="Additional information about the tenant"
            />
          </div>

          <h2>Room Assignment & Lease Details (Optional)</h2>
          <p style={{ marginBottom: '20px', color: '#666' }}>
            If you want to assign a room and create a lease now, fill in these details. You can also do this later.
          </p>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Property
            </label>
            <select
              value={selectedProperty || ''}
              onChange={handlePropertyChange}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            >
              <option value="">All Properties</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Room
            </label>
            <select
              name="room_ref"
              value={formData.room_ref}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            >
              <option value="">Select a Room (Optional)</option>
              {availableRooms.length > 0 ? (
                availableRooms.map(room => (
                  <option key={room.id} value={room.id}>
                    {room.name} at {room.property_name || `Property ${room.property_ref}`}
                  </option>
                ))
              ) : (
                <option value="" disabled>No vacant rooms available</option>
              )}
            </select>
            {availableRooms.length === 0 && (
              <p style={{ color: '#dc3545', fontSize: '0.85rem', marginTop: '5px' }}>
                No vacant rooms available. Add rooms to properties first.
              </p>
            )}
          </div>

          {formData.room_ref && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Lease Start Date*
                  </label>
                  <input
                    type="date"
                    name="lease_start_date"
                    value={formData.lease_start_date}
                    onChange={handleChange}
                    required={!!formData.room_ref}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Lease End Date*
                  </label>
                  <input
                    type="date"
                    name="lease_end_date"
                    value={formData.lease_end_date}
                    onChange={handleChange}
                    required={!!formData.room_ref}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Monthly Rent*
                  </label>
                  <input
                    type="number"
                    name="monthly_rent"
                    value={formData.monthly_rent}
                    onChange={handleChange}
                    required={!!formData.room_ref}
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Security Deposit*
                  </label>
                  <input
                    type="number"
                    name="security_deposit"
                    value={formData.security_deposit}
                    onChange={handleChange}
                    required={!!formData.room_ref}
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px'
              }}
            >
              {loading ? 'Creating...' : '➕ Register Tenant'}
            </button>
            <Link href="/tenants">
              <button
                type="button"
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Cancel
              </button>
            </Link>
          </div>
        </form>
      </div>

      {/* Info Box */}
      <div style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '20px',
        backgroundColor: '#f0f7ff'
      }}>
        <h2>💡 Direct Tenant Registration</h2>
        <p>Use this form to register tenants who:</p>
        <ul style={{ paddingLeft: '20px' }}>
          <li style={{ marginBottom: '10px' }}>Come directly to you (without going through application process)</li>
          <li style={{ marginBottom: '10px' }}>Are being manually added to the system</li>
          <li style={{ marginBottom: '10px' }}>Need to be registered quickly without formalities</li>
        </ul>
        <p style={{ fontWeight: 'bold', marginTop: '10px' }}>
          Note: You can either assign a room and create a lease now, or just register the tenant and do the assignment later.
        </p>
      </div>
    </div>
  );
}