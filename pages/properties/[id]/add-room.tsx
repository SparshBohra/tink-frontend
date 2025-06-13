import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { apiClient } from '../../../lib/api';
import { Property } from '../../../lib/types';
import Navigation from '../../../components/Navigation';

export default function AddRoom() {
  const router = useRouter();
  const { id } = router.query;
  const propertyId = id ? parseInt(id as string) : null;
  
  const [property, setProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState({
    property_ref: propertyId || 0,
    name: '',
    floor: '',
    max_capacity: 1,
    description: ''
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
      
      // Reset form (except property_ref)
      setFormData({
        property_ref: propertyId as number,
        name: '',
        floor: '',
        max_capacity: 1,
        description: ''
      });
      
      // Redirect after short delay
      setTimeout(() => {
        router.push(`/properties/${propertyId}/rooms`);
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
      [name]: name === 'max_capacity' ? parseInt(value) : value
    }));
  };

  if (!propertyId) {
    return (
      <div>
        <Navigation />
        <h1>Error: Property ID Missing</h1>
        <p>Please select a property first.</p>
        <Link href="/properties">
          <button style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            View All Properties
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <Link href={`/properties/${propertyId}/rooms`}>
          <button style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '15px'
          }}>
            ← Back to Property
          </button>
        </Link>
        <h1>🚪 Add New Room</h1>
        {property && (
          <p style={{ color: '#666' }}>Adding a room to <strong>{property.name}</strong></p>
        )}
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

      {/* Room Form */}
      <div style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        backgroundColor: '#f8f9fa'
      }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Room Name/Number*
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Room 101, Suite A, etc."
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Floor
              </label>
              <input
                type="text"
                name="floor"
                value={formData.floor}
                onChange={handleChange}
                placeholder="e.g., 1, Ground, Basement"
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
                Max Capacity*
              </label>
              <input
                type="number"
                name="max_capacity"
                value={formData.max_capacity}
                onChange={handleChange}
                required
                min="1"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add details about room features, size, etc."
              rows={4}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                resize: 'vertical'
              }}
            />
          </div>

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
              {loading ? 'Adding...' : '➕ Add Room'}
            </button>
            <Link href={`/properties/${propertyId}/rooms`}>
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

      {/* Tips */}
      <div style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '20px',
        backgroundColor: '#f0f7ff'
      }}>
        <h2>💡 Room Management Tips</h2>
        <ul style={{ paddingLeft: '20px' }}>
          <li style={{ marginBottom: '10px' }}>Provide clear, unique names for each room to avoid confusion</li>
          <li style={{ marginBottom: '10px' }}>Set accurate capacity limits to avoid overcrowding</li>
          <li style={{ marginBottom: '10px' }}>After creating a room, you can add inventory items associated with it</li>
          <li>You'll be able to assign tenants to this room once it's created</li>
        </ul>
      </div>
    </div>
  );
}
 
 
 
 