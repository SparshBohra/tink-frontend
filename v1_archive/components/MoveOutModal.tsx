import React, { useState, useEffect } from 'react';
import { Tenant } from '../lib/types';
import { apiClient } from '../lib/api';
import styles from './EditPropertyModal.module.css';

interface MoveOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenant: Tenant | null;
  occupancyId?: number;
}

export default function MoveOutModal({
  isOpen,
  onClose,
  onSuccess,
  tenant,
  occupancyId
}: MoveOutModalProps) {
  const [moveOutDate, setMoveOutDate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setMoveOutDate(today);
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!moveOutDate) {
      setError('Please select a move-out date.');
      return;
    }

    if (!occupancyId) {
      setError('Occupancy record not found. Cannot process move-out.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      await apiClient.moveOutTenant(occupancyId, moveOutDate);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Move-out error:', err);
      setError(err.message || 'Failed to process move-out. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !tenant) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: '70px',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(17, 24, 39, 0.4)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
        padding: '2rem'
      }}
      onClick={onClose}
    >
      <div 
        style={{ 
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '420px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e5e7eb',
          maxHeight: 'calc(100vh - 70px - 4rem)',
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <h3>Move Out Tenant</h3>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          <p style={{ marginBottom: '1.5rem', color: '#374151', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Confirm move-out date for <strong style={{ color: '#111827' }}>{tenant.full_name}</strong>. This will mark their occupancy as ended.
          </p>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className={styles.formLabel} style={{ marginBottom: '0.5rem', display: 'block', fontWeight: '500', color: '#374151' }}>
              Move-out Date
            </label>
            <input
              type="date"
              value={moveOutDate}
              onChange={(e) => setMoveOutDate(e.target.value)}
              className={styles.formInput}
              style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
            />
            <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: '#6b7280' }}>
              Default: Today's date ({new Date().toISOString().split('T')[0]})
            </div>
          </div>

          {error && (
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fecaca', 
              borderRadius: '8px', 
              marginBottom: '1rem',
              fontSize: '0.875rem',
              color: '#dc2626'
            }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ 
          padding: '20px 24px', 
          borderTop: '1px solid #e5e7eb', 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '12px',
          backgroundColor: '#f9fafb'
        }}>
          <button 
            onClick={onClose}
            disabled={isProcessing}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              background: 'white',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#9ca3af';
              }
            }}
            onMouseOut={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#d1d5db';
              }
            }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isProcessing}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: isProcessing ? '#9ca3af' : '#3b82f6',
              color: 'white',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }
            }}
            onMouseOut={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }
            }}
          >
            {isProcessing ? 'Processing...' : 'Confirm Move Out'}
          </button>
        </div>
      </div>
    </div>
  );
}







