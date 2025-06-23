import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { apiClient } from '../../../lib/api';
import { Property } from '../../../lib/types';
import Navigation from '../../../components/Navigation';
import DashboardLayout from '../../../components/DashboardLayout';
import SectionCard from '../../../components/SectionCard';
import MetricCard from '../../../components/MetricCard';

export default function AddRoom() {
  const router = useRouter();
  const { id } = router.query;
  const propertyId = id ? parseInt(id as string) : null;
  
  const [property, setProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState({
    property: propertyId || 0,
    room_number: '',
    room_type: 'Standard',
    monthly_rent: 0,
    security_deposit: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (propertyId) {
      fetchPropertyDetails();
      setFormData(prev => ({ ...prev, property: propertyId }));
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
        property: propertyId as number
      };
      const newRoom = await apiClient.createRoom(roomData);
      setSuccess(`Room "${newRoom.room_number}" added successfully to ${property?.name}!`);
      
      // Reset form (except property)
      setFormData({
        property: propertyId as number,
        room_number: '',
        room_type: 'Standard',
        monthly_rent: 0,
        security_deposit: 0
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
      [name]: (name === 'monthly_rent' || name === 'security_deposit') ? parseFloat(value) || 0 : value
    }));
  };

  if (!propertyId) {
    return (
      <>
        <Head>
          <title>Add Room - Property ID Missing - Tink Property Management</title>
        </Head>
        <Navigation />
        <DashboardLayout
          title="Property ID Missing"
          subtitle="Unable to add room without property selection"
        >
          <div className="alert alert-error">
            <strong>Error:</strong> Please select a property first.
          </div>
          <div className="actions-container">
            <Link href="/properties" className="btn btn-primary">
              View All Properties
            </Link>
          </div>
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Add New Room - {property?.name || 'Property'} - Tink Property Management</title>
      </Head>
      <Navigation />
      
      <DashboardLayout
        title="🚪 Add New Room"
        subtitle={property ? `Adding a room to ${property.name}` : 'Add a new room to the property'}
      >
        <div className="actions-container">
          <Link href={`/properties/${propertyId}/rooms`} className="btn btn-secondary">
            ← Back to Property
          </Link>
        </div>

        {/* Property Overview */}
        {property && (
          <div className="metrics-grid">
            <MetricCard 
              title="Property" 
              value={property.name}
              color="blue"
            />
            <MetricCard 
              title="Address" 
              value={property.full_address || 'N/A'}
              color="gray"
            />
            <MetricCard 
              title="Current Rooms" 
              value={property.total_rooms || 0}
              color="purple"
            />
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {success && (
          <div className="alert alert-success">
            <strong>Success:</strong> {success}
          </div>
        )}

        {/* Room Form */}
        <SectionCard title="Room Details" subtitle="Enter the details for the new room">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  Room Number/Name*
                </label>
                <input
                  type="text"
                  name="room_number"
                  value={formData.room_number}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Room 101, Suite A, etc."
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Room Type*
                </label>
                <select
                  name="room_type"
                  value={formData.room_type}
                  onChange={handleChange}
                  required
                  className="form-input"
                >
                  <option value="Standard">Standard</option>
                  <option value="Deluxe">Deluxe</option>
                  <option value="Suite">Suite</option>
                  <option value="Studio">Studio</option>
                  <option value="Shared">Shared</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Monthly Rent ($)*
                </label>
                <input
                  type="number"
                  name="monthly_rent"
                  value={formData.monthly_rent}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Security Deposit ($)*
                </label>
                <input
                  type="number"
                  name="security_deposit"
                  value={formData.security_deposit}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Adding...' : '➕ Add Room'}
              </button>
              <Link href={`/properties/${propertyId}/rooms`} className="btn btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </SectionCard>

        {/* Quick Actions */}
        <SectionCard title="Quick Actions" subtitle="Other property management tasks">
          <div className="actions-grid">
            <Link href={`/properties/${propertyId}/rooms`} className="btn btn-secondary">
              View All Rooms
            </Link>
            <Link href="/properties" className="btn btn-secondary">
              All Properties
            </Link>
            {property && (
              <Link href={`/properties/${propertyId}`} className="btn btn-secondary">
                Property Details
              </Link>
            )}
          </div>
        </SectionCard>
      </DashboardLayout>

      <style jsx>{`
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
        }
        
        .form-label {
          font-weight: 600;
          margin-bottom: var(--spacing-sm);
          color: var(--text-primary);
        }
        
        .form-input {
          padding: var(--spacing-md);
          border: 1px solid var(--gray-300);
          border-radius: var(--radius-md);
          font-size: var(--text-base);
          transition: border-color 0.2s ease;
        }
        
        .form-input:focus {
          outline: none;
          border-color: var(--primary-blue);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .form-actions {
          display: flex;
          gap: var(--spacing-md);
          margin-top: var(--spacing-xl);
        }
        
        .actions-grid {
          display: flex;
          gap: var(--spacing-md);
          flex-wrap: wrap;
        }
        
        .actions-container {
          margin-bottom: var(--spacing-lg);
        }
        
        .alert {
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          margin-bottom: var(--spacing-lg);
        }
        
        .alert-error {
          background-color: var(--red-50);
          border: 1px solid var(--red-200);
          color: var(--red-800);
        }
        
        .alert-success {
          background-color: var(--green-50);
          border: 1px solid var(--green-200);
          color: var(--green-800);
        }
      `}</style>
    </>
  );
} 