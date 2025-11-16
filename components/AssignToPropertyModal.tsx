import React, { useState, useEffect } from 'react';
import { Application, Property } from '../lib/types';
import { apiClient } from '../lib/api';
import styles from './EditPropertyModal.module.css';

interface AssignToPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { rent: number; deposit: number; startDate: string; endDate: string }) => void;
  application: Application | null;
  property: Property | null;
}

export default function AssignToPropertyModal({
  isOpen,
  onClose,
  onSave,
  application,
  property,
}: AssignToPropertyModalProps) {
  const [rent, setRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [applicationBudget, setApplicationBudget] = useState('');
  const [desiredEndDate, setDesiredEndDate] = useState('');
  const [error, setError] = useState('');
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (isOpen && application && property) {
      // Priority: Property rent > Application budget
      const propertyRent = typeof property.monthly_rent === 'string' 
        ? parseFloat(property.monthly_rent) 
        : (property.monthly_rent || 0);
      const appBudget = typeof application.rent_budget === 'string'
        ? parseFloat(application.rent_budget)
        : (application.rent_budget || 0);
      
      // Use property rent if available, otherwise application budget
      const rentAmount = propertyRent || appBudget;
      setRent(String(rentAmount));
      setApplicationBudget(String(appBudget));
      
      // Security deposit: property default or 2x rent
      const depositAmount = typeof property.security_deposit === 'string'
        ? parseFloat(property.security_deposit)
        : (property.security_deposit || (rentAmount ? rentAmount * 2 : 0));
      setDeposit(String(depositAmount));
      
      // Move-in date priority: Property available_from > Application desired_move_in_date > Today
      const today = new Date().toISOString().split('T')[0];
      const propertyAvailableFrom = (property as any).available_from || (property as any).availability_date;
      const appDesiredMoveIn = application.desired_move_in_date;
      
      const moveInDate = propertyAvailableFrom || appDesiredMoveIn || today;
      setStartDate(moveInDate);

      // Calculate end date: Use application desired_lease_duration if available
      const startDateObj = new Date(moveInDate);
      const endDateObj = new Date(startDateObj);
      
      if (application.desired_lease_duration) {
        endDateObj.setMonth(endDateObj.getMonth() + application.desired_lease_duration);
      } else {
        endDateObj.setFullYear(endDateObj.getFullYear() + 1);
      }
      
      const calculatedEndDate = endDateObj.toISOString().split('T')[0];
      setEndDate(calculatedEndDate);
      setDesiredEndDate(calculatedEndDate);
      
      setConflicts([]);
      setShowConflictWarning(false);
      setError('');
    }
  }, [isOpen, application, property]);

  const checkForConflicts = async () => {
    if (!startDate || !endDate || !application?.property_ref) return;

    setIsChecking(true);
    try {
      const result = await apiClient.checkTenantConflicts(
        application.property_ref,
        startDate,
        endDate
      );
      
      if (result.has_conflicts && result.conflicts.length > 0) {
        setConflicts(result.conflicts);
        setShowConflictWarning(true);
      } else {
        setConflicts([]);
        setShowConflictWarning(false);
      }
    } catch (err) {
      console.error('Error checking conflicts:', err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async () => {
    if (!rent || !deposit || !startDate || !endDate) {
      setError('Please fill in all fields.');
      return;
    }

    // Check for conflicts before submitting
    await checkForConflicts();
    
    // If conflicts exist and user hasn't confirmed, show warning
    if (showConflictWarning && !window.confirm(
      `⚠️ There is already a tenant in this property during the selected dates:\n\n${conflicts.map(c => `${c.tenant_name} (${c.move_in_date} onwards)`).join('\n')}\n\nDo you want to replace them?`
    )) {
      return;
    }

    setError('');
    onSave({
      rent: parseFloat(rent),
      deposit: parseFloat(deposit),
      startDate,
      endDate,
    });
  };

  if (!isOpen || !application) return null;

  // Get property info for display
  const propertyRent = typeof property?.monthly_rent === 'string' 
    ? parseFloat(property.monthly_rent) 
    : (property?.monthly_rent || 0);
  const propertyAvailableFrom = (property as any)?.available_from || (property as any)?.availability_date;

  return (
    <div 
      style={{
        position: 'fixed',
        top: '70px', // Below top bar
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(17, 24, 39, 0.4)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center', // Vertically center
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
          maxWidth: '520px',
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
            <h3>Assign Tenant to Property</h3>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto' }}>
          <p style={{ marginBottom: '1.5rem', color: '#374151', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Finalize the terms for assigning <strong style={{ color: '#111827' }}>{application.tenant_name}</strong> to property. This will create an active tenant record.
          </p>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className={styles.formLabel} style={{ marginBottom: '0.5rem', display: 'block', fontWeight: '500', color: '#374151' }}>
              Monthly Rent ($)
            </label>
            <input
              type="number"
              value={rent}
              onChange={(e) => setRent(e.target.value)}
              placeholder="0"
              className={styles.formInput}
              style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
            />
            <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {propertyRent > 0 && (
                <span>Property rent: <strong style={{ color: '#374151' }}>${propertyRent.toLocaleString()}</strong></span>
              )}
              {applicationBudget > 0 && (
                <span>Application budget: <strong style={{ color: '#374151' }}>${parseFloat(applicationBudget).toLocaleString()}</strong></span>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className={styles.formLabel} style={{ marginBottom: '0.5rem', display: 'block', fontWeight: '500', color: '#374151' }}>
              Security Deposit ($)
            </label>
            <input
              type="number"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              placeholder="0"
              className={styles.formInput}
              style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className={styles.formLabel} style={{ marginBottom: '0.5rem', display: 'block', fontWeight: '500', color: '#374151' }}>
              Move-in Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={styles.formInput}
              style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
            />
            <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {propertyAvailableFrom && (
                <span>Property available from: <strong style={{ color: '#374151' }}>{propertyAvailableFrom}</strong></span>
              )}
              {application?.desired_move_in_date && (
                <span>Application requested: <strong style={{ color: '#374151' }}>{application.desired_move_in_date}</strong></span>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className={styles.formLabel} style={{ marginBottom: '0.5rem', display: 'block', fontWeight: '500', color: '#374151' }}>
              Move-out Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={styles.formInput}
              style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
            />
            {desiredEndDate && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: '#6b7280' }}>
                Suggested (based on application): <strong style={{ color: '#374151' }}>{desiredEndDate}</strong>
              </div>
            )}
          </div>

          {showConflictWarning && conflicts.length > 0 && (
            <div style={{
              padding: '12px',
              backgroundColor: '#fef3c7',
              border: '1px solid #fcd34d',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.875rem',
              color: '#92400e'
            }}>
              <strong>⚠️ Existing Tenant(s):</strong>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                {conflicts.map((conflict, idx) => (
                  <li key={idx}>
                    <strong>{conflict.tenant_name}</strong> - Since {conflict.move_in_date}
                  </li>
                ))}
              </ul>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem' }}>
                This tenant will be moved out when you assign the new one.
              </p>
            </div>
          )}

          {error && <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>{error}</p>}
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
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              background: 'white',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.borderColor = '#9ca3af';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isChecking}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: isChecking ? '#9ca3af' : '#3b82f6',
              color: 'white',
              cursor: isChecking ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              if (!isChecking) {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }
            }}
            onMouseOut={(e) => {
              if (!isChecking) {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }
            }}
          >
            {isChecking ? 'Checking...' : 'Assign Tenant'}
          </button>
        </div>
      </div>
    </div>
  );
}
