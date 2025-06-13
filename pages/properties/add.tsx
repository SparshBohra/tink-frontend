import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { apiClient } from '../../lib/api';
import Navigation from '../../components/Navigation';

export default function AddProperty() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    address_line1: '',
    city: '',
    state: '',
    postal_code: '',
    property_type: 'coliving',
    timezone: 'America/New_York'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const newProperty = await apiClient.createProperty(formData);
      setSuccess(`Property "${newProperty.name}" created successfully!`);
      
      // Reset form
      setFormData({
        name: '',
        address_line1: '',
        city: '',
        state: '',
        postal_code: '',
        property_type: 'coliving',
        timezone: 'America/New_York'
      });
      
      // Redirect after a short delay
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
    <div>
      <Navigation />
      
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <Link href="/properties">
          <button style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '15px'
          }}>
            ← Back to Properties
          </button>
        </Link>
        <h1>🏢 Register New Property</h1>
        <p style={{ color: '#666' }}>Add a new property to your management portfolio</p>
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

      {/* Property Form */}
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
              Property Name*
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Downtown Professional Suites"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Property Type*
            </label>
            <select
              name="property_type"
              value={formData.property_type}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            >
              <option value="coliving">Co-Living Space</option>
              <option value="residential">Residential Property</option>
              <option value="commercial">Commercial Property</option>
              <option value="mixed">Mixed Use</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Street Address*
            </label>
            <input
              type="text"
              name="address_line1"
              value={formData.address_line1}
              onChange={handleChange}
              required
              placeholder="e.g., 123 Main Street"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                City*
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                placeholder="e.g., New York"
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
                State*
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
                placeholder="e.g., NY"
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
                Postal Code*
              </label>
              <input
                type="text"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                required
                placeholder="e.g., 10001"
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
              Timezone
            </label>
            <select
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            >
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="America/Anchorage">Alaska Time (AKT)</option>
              <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
            </select>
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
              {loading ? 'Creating...' : '➕ Register Property'}
            </button>
            <Link href="/properties">
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

      {/* Post-Creation Guide */}
      <div style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '20px',
        backgroundColor: '#f0f7ff'
      }}>
        <h2>📝 Next Steps After Creation</h2>
        <p>After adding your property, you'll want to:</p>
        <ol style={{ paddingLeft: '20px' }}>
          <li style={{ marginBottom: '10px' }}>Add individual rooms to your property</li>
          <li style={{ marginBottom: '10px' }}>Set up rental rates and details for each room</li>
          <li style={{ marginBottom: '10px' }}>Add inventory items for the property (furniture, appliances, etc.)</li>
          <li>Review existing applications or add tenants directly</li>
        </ol>
      </div>
    </div>
  );
} 
 
 
 
 