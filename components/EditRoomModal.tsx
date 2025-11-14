import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { Room, Property } from '../lib/types';
import styles from './EditPropertyModal.module.css';

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const ROOM_TYPES = [
  { value: 'standard', label: 'Standard Room', description: 'Basic room with standard amenities' },
  { value: 'suite', label: 'Suite', description: 'Large room with separate living area' },
  { value: 'studio', label: 'Studio', description: 'Open-plan room with kitchenette' },
  { value: 'shared', label: 'Shared Room', description: 'Shared accommodation with multiple beds' },
  { value: 'single', label: 'Single Occupancy', description: 'Room for one person' },
  { value: 'double', label: 'Double Occupancy', description: 'Room for two people' },
  { value: 'premium', label: 'Premium Room', description: 'High-end room with luxury amenities' }
];

interface EditRoomModalProps {
  room: Room;
  property: Property;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EditRoomModal({ room, property, isOpen, onClose, onSuccess }: EditRoomModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    room_type: 'standard',
    max_capacity: 2,
    monthly_rent: '',
    security_deposit: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    if (isOpen && room) {
      fetchRoomData();
    }
  }, [isOpen, room]);

  const fetchRoomData = async () => {
    try {
      setFetchLoading(true);
      const roomData = await apiClient.getRoom(room.id, property.id);
      
      setFormData({
        name: roomData.name || '',
        room_type: roomData.room_type || 'standard',
        max_capacity: Number(roomData.max_capacity) || 2,
        monthly_rent: String(roomData.monthly_rent || ''),
        security_deposit: String(roomData.security_deposit || ''),
      });
    } catch (err: any) {
      console.error('Failed to fetch room data:', err);
      setError('Failed to load room details. Please try again.');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate required fields
    if (!formData.name || !formData.room_type || !formData.monthly_rent || !formData.security_deposit) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    // Validate numeric fields
    const monthlyRent = parseFloat(formData.monthly_rent);
    const securityDeposit = parseFloat(formData.security_deposit);
    
    if (isNaN(monthlyRent) || monthlyRent <= 0) {
      setError('Please enter a valid monthly rent amount.');
      setLoading(false);
      return;
    }
    
    if (isNaN(securityDeposit) || securityDeposit < 0) {
      setError('Please enter a valid security deposit amount.');
      setLoading(false);
      return;
    }

    if (formData.max_capacity < 1) {
      setError('Max capacity must be at least 1.');
      setLoading(false);
      return;
    }

    try {
      const updateData = {
        property_ref: property.id,
        name: formData.name,
        room_type: formData.room_type,
        max_capacity: formData.max_capacity,
        monthly_rent: monthlyRent,
        security_deposit: securityDeposit,
      };
      
      await apiClient.updateRoom(room.id, updateData);
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to update room:', err);
      setError(err.message || 'Failed to update room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateDefaultDeposit = () => {
    const rent = parseFloat(formData.monthly_rent);
    if (!isNaN(rent) && rent > 0) {
      return (rent * 2).toFixed(2);
    }
    return '';
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <h3>Edit Room</h3>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {fetchLoading ? (
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid #e5e7eb',
                borderTopColor: '#2563eb',
                borderRadius: '50%',
                margin: '0 auto 0.5rem',
                animation: 'spin 1s linear infinite'
              }}></div>
              <style jsx>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
              <p style={{ fontSize: '0.875rem', margin: 0 }}>Loading room details...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {error && (
                <div style={{
                  padding: '10px 14px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  color: '#dc2626',
                  fontSize: '0.875rem'
                }}>
                  {error}
                </div>
              )}

              <div className={styles.formSection} style={{ flex: 1, gap: '16px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} style={{ marginBottom: '6px' }}>
                    Room Name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={styles.formInput}
                    placeholder="e.g., Master Bedroom, Room A"
                    maxLength={100}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} style={{ marginBottom: '6px' }}>
                    Room Type <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    name="room_type"
                    value={formData.room_type}
                    onChange={handleChange}
                    className={styles.formInput}
                    required
                  >
                    {ROOM_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '3px' }}>
                    {ROOM_TYPES.find(t => t.value === formData.room_type)?.description}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} style={{ marginBottom: '6px' }}>
                    Max Capacity <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="max_capacity"
                    value={formData.max_capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_capacity: parseInt(e.target.value) || 1 }))}
                    className={styles.formInput}
                    min="1"
                    max="10"
                    required
                  />
                  <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '3px' }}>
                    Maximum number of occupants (1-10)
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ marginBottom: '6px' }}>
                      Monthly Rent <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#6b7280',
                        fontSize: '0.875rem'
                      }}>$</span>
                      <input
                        type="number"
                        name="monthly_rent"
                        value={formData.monthly_rent}
                        onChange={handleChange}
                        className={styles.formInput}
                        style={{ paddingLeft: '28px' }}
                        placeholder="1200.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ marginBottom: '6px' }}>
                      Security Deposit <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#6b7280',
                        fontSize: '0.875rem'
                      }}>$</span>
                      <input
                        type="number"
                        name="security_deposit"
                        value={formData.security_deposit}
                        onChange={handleChange}
                        className={styles.formInput}
                        style={{ paddingLeft: '28px' }}
                        placeholder="2400.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    {formData.monthly_rent && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, security_deposit: calculateDefaultDeposit() }))}
                        style={{
                          marginTop: '6px',
                          fontSize: '0.7rem',
                          color: '#2563eb',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: 0
                        }}
                      >
                        Use 2x monthly rent (${calculateDefaultDeposit()})
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter} style={{ justifyContent: 'flex-end' }}>
                <div className={styles.footerRight}>
                  <button
                    type="button"
                    onClick={onClose}
                    className={`${styles.btn} ${styles.btnSecondary}`}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
