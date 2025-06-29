import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { apiClient } from '../../../../lib/api';
import { Property, Room, RoomFormData } from '../../../../lib/types';
import DashboardLayout from '../../../../components/DashboardLayout';
import SectionCard from '../../../../components/SectionCard';
import MetricCard from '../../../../components/MetricCard';

export default function EditRoom() {
  const router = useRouter();
  const { id, roomId } = router.query;
  const propertyId = id ? parseInt(id as string) : null;
  const roomIdNum = roomId ? parseInt(roomId as string) : null;
  
  const [property, setProperty] = useState<Property | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState<RoomFormData>({
    property_ref: propertyId || 0,
    name: '',
    room_type: 'Standard',
    floor: '',
    max_capacity: 2,
    monthly_rent: 0,
    security_deposit: 0
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (propertyId && roomIdNum) {
      fetchData();
    }
  }, [propertyId, roomIdNum]);

  const fetchData = async () => {
    try {
      setFetchLoading(true);
      const [propertyData, roomData] = await Promise.all([
        apiClient.getProperty(propertyId as number),
        apiClient.getRoom(roomIdNum as number)
      ]);
      
      setProperty(propertyData);
      setRoom(roomData);
      
      // Populate form with existing room data
      setFormData({
        property_ref: propertyId as number,
        name: roomData.name || '',
        room_type: roomData.room_type || 'Standard',
        floor: roomData.floor || '',
        max_capacity: roomData.max_capacity || 2,
        monthly_rent: roomData.monthly_rent || 0,
        security_deposit: roomData.security_deposit || 0
      });
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load room details. Please try again.');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData = {
        property_ref: formData.property_ref,
        name: formData.name,
        room_type: formData.room_type,
        floor: formData.floor,
        max_capacity: formData.max_capacity,
        monthly_rent: formData.monthly_rent,
        security_deposit: formData.security_deposit
      };
      
      const updatedRoom = await apiClient.updateRoom(roomIdNum as number, updateData);
      setSuccess(`Room "${updatedRoom.name}" updated successfully!`);
      
      // Update local room state
      setRoom(updatedRoom);
      
      // Redirect after short delay
      setTimeout(() => {
        router.push(`/properties/${propertyId}/rooms`);
      }, 1500);
    } catch (err: any) {
      console.error('Failed to update room:', err);
      setError(err.message || 'Failed to update room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'monthly_rent' || name === 'security_deposit' || name === 'max_capacity') 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  if (!propertyId || !roomIdNum) {
    return (
      <>
        <Head>
          <title>Edit Room - Invalid Parameters - Tink Property Management</title>
        </Head>
        <DashboardLayout
          title="Invalid Parameters"
          subtitle="Unable to edit room without proper selection"
        >
          <div className="alert alert-error">
            <strong>Error:</strong> Please select a valid property and room.
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

  if (fetchLoading) {
    return (
      <>
        <Head>
          <title>Edit Room - Loading - Tink Property Management</title>
        </Head>
        <DashboardLayout
          title="Loading Room Details"
          subtitle="Fetching room information..."
        >
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
            <p>Loading room details...</p>
          </div>
        </DashboardLayout>
        
        <style jsx>{`
          .loading-indicator {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-xl);
          }
          
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid var(--gray-200);
            border-top-color: var(--primary-blue);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: var(--spacing-md);
          }
          
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Edit Room - {room?.name || 'Room'} - {property?.name || 'Property'} - Tink Property Management</title>
      </Head>
      <DashboardLayout
        title="✏️ Edit Room"
        subtitle={property && room ? `Editing ${room.name} in ${property.name}` : 'Edit room details'}
      >
        <div className="actions-container">
          <Link href={`/properties/${propertyId}/rooms`} className="btn btn-secondary">
            ← Back to Rooms
          </Link>
        </div>

        {/* Current Room Overview */}
        {property && room && (
          <div className="metrics-grid">
            <MetricCard 
              title="Property" 
              value={property.name}
              color="blue"
            />
            <MetricCard 
              title="Room" 
              value={room.name}
              color="purple"
            />
            <MetricCard 
              title="Current Occupancy" 
              value={`${room.current_occupancy}/${room.max_capacity}`}
              color={room.is_vacant ? "amber" : "green"}
            />
            <MetricCard 
              title="Status" 
              value={room.is_vacant ? "Vacant" : "Occupied"}
              color={room.is_vacant ? "amber" : "green"}
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

        {/* Edit Room Form */}
        <SectionCard title="Edit Room Details" subtitle="Update the room information">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  Room Number/Name*
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Room 101, Suite A, etc."
                  className="form-input"
                />
                <small className="form-help">
                  This will be displayed as the room identifier
                </small>
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
                  <option value="Premium">Premium</option>
                  <option value="Economy">Economy</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Floor
                </label>
                <input
                  type="text"
                  name="floor"
                  value={formData.floor || ''}
                  onChange={handleChange}
                  placeholder="e.g., 1st Floor, Ground, etc."
                  className="form-input"
                />
                <small className="form-help">
                  Optional floor information
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Max Capacity*
                </label>
                <input
                  type="number"
                  name="max_capacity"
                  value={formData.max_capacity || 2}
                  onChange={handleChange}
                  required
                  min="1"
                  max="10"
                  className="form-input"
                />
                <small className="form-help">
                  Maximum number of tenants for this room
                </small>
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
                <small className="form-help">
                  Current rent: ${room?.monthly_rent || 'Not set'}
                </small>
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
                <small className="form-help">
                  Current deposit: ${room?.security_deposit || 'Not set'}
                </small>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Updating...' : '💾 Update Room'}
              </button>
              <Link href={`/properties/${propertyId}/rooms`} className="btn btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </SectionCard>

        {/* Room Information */}
        {room && (
          <SectionCard title="Current Room Information" subtitle="Current details for reference">
            <div className="info-grid">
              <div className="info-item">
                <strong>Room ID:</strong><br />
                #{room.id}
              </div>
              <div className="info-item">
                <strong>Property:</strong><br />
                {property?.name || 'Unknown'}
              </div>
              <div className="info-item">
                <strong>Max Capacity:</strong><br />
                {room.max_capacity} tenant(s)
              </div>
              <div className="info-item">
                <strong>Floor:</strong><br />
                {room.floor || 'Not specified'}
              </div>
              <div className="info-item">
                <strong>Occupancy Rate:</strong><br />
                {room.occupancy_rate.toFixed(1)}%
              </div>
              <div className="info-item">
                <strong>Created:</strong><br />
                {new Date(room.created_at).toLocaleDateString()}
              </div>
            </div>
          </SectionCard>
        )}

        {/* Quick Actions */}
        <SectionCard title="Quick Actions" subtitle="Other room management tasks">
          <div className="actions-grid">
            <Link href={`/properties/${propertyId}/rooms`} className="btn btn-secondary">
              View All Rooms
            </Link>
            <Link href={`/inventory?room=${roomIdNum}`} className="btn btn-secondary">
              Room Inventory
            </Link>
            <Link href="/applications" className="btn btn-secondary">
              Find Tenant
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
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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
          gap: var(--spacing-xs);
        }
        
        .form-label {
          font-weight: 500;
          color: var(--gray-900);
        }
        
        .form-input {
          padding: var(--spacing-sm);
          border: 1px solid var(--gray-300);
          border-radius: var(--border-radius);
          font-size: var(--text-base);
        }
        
        .form-input:focus {
          outline: none;
          border-color: var(--primary-blue);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .form-help {
          color: var(--gray-600);
          font-size: var(--text-small);
        }
        
        .form-actions {
          display: flex;
          gap: var(--spacing-md);
          padding-top: var(--spacing-lg);
          border-top: 1px solid var(--gray-200);
        }
        
        .actions-container {
          display: flex;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }
        
        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-md);
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-lg);
        }
        
        .info-item {
          padding: var(--spacing-md);
          background-color: var(--gray-50);
          border-radius: var(--border-radius);
        }
        
        .alert {
          padding: var(--spacing-md);
          border-radius: var(--border-radius);
          margin-bottom: var(--spacing-lg);
        }
        
        .alert-error {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
        }
        
        .alert-success {
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #16a34a;
        }
      `}</style>
    </>
  );
} 