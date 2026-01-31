/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Application, Property, Room } from '../lib/types';
import { apiClient } from '../lib/api';

interface LeaseGenerationModalProps {
  isOpen: boolean;
  application: Application;
  properties: Property[];
  rooms?: Room[];
  onClose: () => void;
  onLeaseGenerated: (leaseData: any) => void;
}

export default function ImprovedLeaseGenerationModal({
  isOpen,
  application,
  properties,
  rooms,
  onClose,
  onLeaseGenerated,
}: LeaseGenerationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'room_assignment' | 'lease_generation'>('room_assignment');
  
  // Auto-fill from application but allow editing
  const [selectedPropertyId, setSelectedPropertyId] = useState<number>(application.property_ref || 0);
  const [selectedRoomId, setSelectedRoomId] = useState<number>(application.room || 0);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [isRoomOptional, setIsRoomOptional] = useState<boolean>(false);
  
  // Confirmed room assignment (after step 1)
  const [confirmedPropertyId, setConfirmedPropertyId] = useState<number>(0);
  const [confirmedRoomId, setConfirmedRoomId] = useState<number>(0);
  
  // Lease terms (step 2)
  const [leaseTerms, setLeaseTerms] = useState({
    monthly_rent: '',
    security_deposit: '',
    start_date: '',
    end_date: ''
  });

  // Custom lease upload state
  const [leaseGenerationType, setLeaseGenerationType] = useState<'auto' | 'upload'>('auto');
  const [customLeaseFile, setCustomLeaseFile] = useState<File | null>(null);

  // Consolidated useEffect for initializing and updating modal state
  useEffect(() => {
    if (isOpen) {
      // 1. Set the initial property and room from the application
      const initialPropertyId = application.property_ref || 0;
      const initialRoomId = application.room || 0;
      setSelectedPropertyId(initialPropertyId);
      setSelectedRoomId(initialRoomId);

      // 2. Populate the list of available rooms for the selected property
      if (initialPropertyId && rooms) {
        const propertyRooms = rooms.filter(r => 
          r.property_ref === initialPropertyId && 
          (r.is_available || r.id === initialRoomId)
        );
        setAvailableRooms(propertyRooms);
        
        const selectedProperty = properties.find(p => p.id === initialPropertyId);
        const roomOptional = selectedProperty?.rent_type === 'per_property' || propertyRooms.length === 0;
        setIsRoomOptional(roomOptional);
      }

      // 3. Reset the rest of the modal's state
      setCurrentStep('room_assignment');
      setConfirmedPropertyId(0);
      setConfirmedRoomId(0);
      setLeaseGenerationType('auto');
      setCustomLeaseFile(null);
      setError(null);
    }
  }, [isOpen, application, rooms, properties]);

  if (!isOpen) return null;

  const handleConfirmRoomAssignment = () => {
    // Validation for step 1
    if (!selectedPropertyId) {
      setError('Please select a property before continuing.');
      return;
    }
    
    // Only require room selection if it's not optional
    if (!isRoomOptional && !selectedRoomId) {
      setError('Please select a room before continuing.');
      return;
    }

    // Save confirmed selections and move to step 2
    setConfirmedPropertyId(selectedPropertyId);
    setConfirmedRoomId(selectedRoomId);
    
    // Auto-fill lease terms
    autoFillLeaseTerms();
    
    setCurrentStep('lease_generation');
    setError(null);
  };

  const autoFillLeaseTerms = () => {
    const selectedRoom = rooms?.find(r => r.id === selectedRoomId);
    const selectedProperty = properties.find(p => p.id === selectedPropertyId);
    
    // Calculate monthly rent
    let monthlyRent = '';
    if (selectedRoom?.monthly_rent) {
      monthlyRent = selectedRoom.monthly_rent.toString();
    } else if (selectedProperty?.monthly_rent) {
      monthlyRent = selectedProperty.monthly_rent.toString();
    } else if (application.rent_budget) {
      monthlyRent = application.rent_budget.toString();
    }
    
    // Security deposit (default to same as monthly rent)
    const securityDeposit = monthlyRent;
    
    // Start date from application
    const startDate = application.desired_move_in_date || new Date().toISOString().split('T')[0];
    
    // Calculate end date based on default lease duration (12 months)
    const startDateObj = new Date(startDate);
    const durationMonths = 12; // Default to 12 months lease
    const endDateObj = new Date(startDateObj);
    endDateObj.setMonth(endDateObj.getMonth() + durationMonths);
    const endDate = endDateObj.toISOString().split('T')[0];
    
    setLeaseTerms({
      monthly_rent: monthlyRent,
      security_deposit: securityDeposit,
      start_date: startDate,
      end_date: endDate
    });
  };

  const handleGenerateLease = async () => {
    // Validate lease terms
    if (!leaseTerms.monthly_rent || !leaseTerms.start_date || !leaseTerms.end_date) {
      setError('Please fill in all required lease terms.');
      return;
    }

    if (parseFloat(leaseTerms.monthly_rent) <= 0) {
      setError('Monthly rent must be greater than $0.');
      return;
    }

    const startDate = new Date(leaseTerms.start_date);
    const endDate = new Date(leaseTerms.end_date);
    if (endDate <= startDate) {
      setError('End date must be after start date.');
      return;
    }

    // Validate custom lease upload if selected
    if (leaseGenerationType === 'upload' && !customLeaseFile) {
      setError('Please upload a lease document or switch to auto-generate.');
      return;
    }

    // Validate file size (10MB limit)
    if (customLeaseFile && customLeaseFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Include lease terms in the request
      const leaseData = {
        room_id: confirmedRoomId || 0,
        monthly_rent: parseFloat(leaseTerms.monthly_rent),
        security_deposit: parseFloat(leaseTerms.security_deposit) || parseFloat(leaseTerms.monthly_rent),
        start_date: leaseTerms.start_date,
        end_date: leaseTerms.end_date,
        is_custom_lease: leaseGenerationType === 'upload'
      };
      
      const response = await apiClient.generateLeaseWithCustomDocument(
        application.id, 
        confirmedRoomId || 0, 
        leaseData,
        customLeaseFile
      );
      onLeaseGenerated(response);
    onClose();
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToRoomSelection = () => {
    setCurrentStep('room_assignment');
    setError(null);
  };

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const selectedRoom = availableRooms.find(r => r.id === selectedRoomId);
  
  // For step 2 - get confirmed property and room
  const confirmedProperty = properties.find(p => p.id === confirmedPropertyId);
  const confirmedRoom = rooms?.find(r => r.id === confirmedRoomId);

  return (
    <div className="modal-overlay">
      <div className="lease-generation-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            {currentStep === 'room_assignment' ? 'Room Assignment' : 'Generate Lease Agreement'}
          </h2>
          <div className="step-indicator">
            Step {currentStep === 'room_assignment' ? '1' : '2'} of 2
        </div>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        <div className="modal-content">
          {error && <div className="error-message">{error}</div>}
          
          <div className="tenant-info">
            <h3>Tenant: {application.tenant_name}</h3>
            <p>Email: {application.tenant_email}</p>
            <p>Application Status: {application.status}</p>
                  </div>

          {currentStep === 'room_assignment' && (
            <>
                      <div className="form-group">
                <label>Select Property</label>
                <select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(Number(e.target.value))}
                          className="form-input"
                >
                  <option value={0}>Select a property...</option>
                  {properties.map(property => (
                    <option key={property.id} value={property.id}>
                      {property.name} - {property.address}
                    </option>
                  ))}
                </select>
                {selectedProperty && (
                  <div className="property-info">
                    <small>Selected: {selectedProperty.name}</small>
                      </div>
                )}
                      </div>
              
              {selectedPropertyId > 0 && (
                      <div className="form-group">
                        <label>
                    Select Room {isRoomOptional && <span className="optional-label">(Optional)</span>}
                        </label>
                        <select
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(Number(e.target.value))}
                          className="form-input"
                        >
                    <option value={0}>
                      {isRoomOptional ? 'No specific room (per-property lease)' : 'Select a room...'}
                    </option>
                    {availableRooms.map(room => (
                              <option key={room.id} value={room.id}>
                        {room.name} - ${room.monthly_rent}/month {room.is_available ? '(Available)' : '(Occupied)'}
                              </option>
                    ))}
                        </select>
                  
                  {availableRooms.length === 0 && selectedPropertyId > 0 && !isRoomOptional && (
                    <div className="no-rooms-warning">
                      ⚠️ <strong>No available rooms found for this property.</strong>
                      <div className="solutions">
                        <p><strong>Solutions:</strong></p>
                        <ul>
                          <li>Add rooms to this property</li>
                          <li>Check if existing rooms are available</li>
                          <li>Consider a per-property lease if applicable</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  {availableRooms.length === 0 && selectedPropertyId > 0 && isRoomOptional && (
                    <div className="info-message">
                      ℹ️ <strong>No specific rooms available.</strong> This will be a per-property lease where the tenant can use any available space.
                      </div>
                  )}
                  
                  {selectedRoom && (
                    <div className="room-info">
                      <small>✅ Selected: {selectedRoom.name} - ${selectedRoom.monthly_rent}/month</small>
                      </div>
                  )}
                  
                  {!selectedRoom && selectedRoomId === 0 && isRoomOptional && (
                    <div className="room-info">
                      <small>ℹ️ Per-property lease - no specific room assignment</small>
                      </div>
                  )}
                      </div>
              )}
            </>
          )}

          {currentStep === 'lease_generation' && (
            <>
              <div className="confirmation-section">
                <h3>✅ Room Assignment Confirmed</h3>
                <div className="confirmed-details">
                  <div className="detail-row">
                    <strong>Property:</strong> {confirmedProperty?.name} - {confirmedProperty?.address}
                    </div>
                  <div className="detail-row">
                    <strong>Room:</strong> {confirmedRoom ? `${confirmedRoom.name}` : 'Per-property lease (no specific room)'}
                  </div>
                  <div className="detail-row">
                    <strong>Tenant:</strong> {application.tenant_name} ({application.tenant_email})
                </div>
                </div>
              </div>

              <div className="lease-terms-section">
                <h3>📋 Lease Terms</h3>
                <p className="section-description">Review and edit the lease terms below. These are auto-filled based on the application and room details.</p>
                
                <div className="lease-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="monthly_rent">Monthly Rent *</label>
                      <div className="input-with-prefix">
                        <span className="prefix">$</span>
                          <input
                          id="monthly_rent"
                          type="number"
                          step="0.01"
                          min="0"
                          value={leaseTerms.monthly_rent}
                          onChange={(e) => setLeaseTerms(prev => ({ ...prev, monthly_rent: e.target.value }))}
                          className="form-input with-prefix"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="security_deposit">Security Deposit *</label>
                      <div className="input-with-prefix">
                        <span className="prefix">$</span>
                        <input
                          id="security_deposit"
                          type="number"
                          step="0.01"
                          min="0"
                          value={leaseTerms.security_deposit}
                          onChange={(e) => setLeaseTerms(prev => ({ ...prev, security_deposit: e.target.value }))}
                          className="form-input with-prefix"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="start_date">Lease Start Date *</label>
                      <input
                        id="start_date"
                        type="date"
                        value={leaseTerms.start_date}
                        onChange={(e) => setLeaseTerms(prev => ({ ...prev, start_date: e.target.value }))}
                        className="form-input"
                      />
                  </div>

                    <div className="form-group">
                      <label htmlFor="end_date">Lease End Date *</label>
                      <input
                        id="end_date"
                        type="date"
                        value={leaseTerms.end_date}
                        onChange={(e) => setLeaseTerms(prev => ({ ...prev, end_date: e.target.value }))}
                        className="form-input"
                      />
                    </div>
                  </div>

                  {leaseTerms.start_date && leaseTerms.end_date && (
                    <div className="lease-summary">
                      <p><strong>Lease Duration:</strong> {Math.ceil((new Date(leaseTerms.end_date).getTime() - new Date(leaseTerms.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30))} months</p>
                      <p><strong>Total First Payment:</strong> ${(parseFloat(leaseTerms.monthly_rent || '0') + parseFloat(leaseTerms.security_deposit || '0')).toFixed(2)} (First month rent + Security deposit)</p>
                        </div>
                  )}
                    </div>
                  </div>

              <div className="lease-document-section">
                <h3>📄 Lease Document</h3>
                <p className="section-description">Choose how to create the lease document for this tenant.</p>
                
                <div className="lease-type-toggle">
                  <div className="toggle-options">
                    <label className={`toggle-option ${leaseGenerationType === 'auto' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="leaseType"
                        value="auto"
                        checked={leaseGenerationType === 'auto'}
                        onChange={(e) => setLeaseGenerationType(e.target.value as 'auto' | 'upload')}
                      />
                      <div className="option-content">
                        <div className="option-icon">🤖</div>
                        <div className="option-text">
                          <strong>Auto Generate</strong>
                          <span>Generate lease document automatically using our template</span>
                        </div>
                      </div>
                    </label>
                    
                    <label className={`toggle-option ${leaseGenerationType === 'upload' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="leaseType"
                        value="upload"
                        checked={leaseGenerationType === 'upload'}
                        onChange={(e) => setLeaseGenerationType(e.target.value as 'auto' | 'upload')}
                      />
                      <div className="option-content">
                        <div className="option-icon">📤</div>
                        <div className="option-text">
                          <strong>Upload Custom Lease</strong>
                          <span>Upload your own lease document (PDF format)</span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {leaseGenerationType === 'upload' && (
                  <div className="custom-lease-upload">
                    <div className="form-group">
                      <label htmlFor="custom_lease_file">Upload Lease Document *</label>
                      <input
                        id="custom_lease_file"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setCustomLeaseFile(e.target.files?.[0] || null)}
                        className="form-input file-input"
                      />
                      {customLeaseFile && (
                        <div className="file-info">
                          <span className="file-name">📄 {customLeaseFile.name}</span>
                          <span className="file-size">({(customLeaseFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                      )}
                      <p className="input-help">Supported formats: PDF, DOC, DOCX (Max 10MB)</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

          <div className="modal-actions">
          {currentStep === 'room_assignment' && (
            <>
                <button 
                onClick={handleConfirmRoomAssignment} 
                className="nav-btn confirm-btn" 
                disabled={!selectedPropertyId || (!isRoomOptional && !selectedRoomId)}
                >
                Confirm Room Assignment
                </button>
              <button onClick={onClose} className="cancel-btn">
                Cancel
              </button>
            </>
              )}
              
          {currentStep === 'lease_generation' && (
            <>
                <button 
                onClick={handleGenerateLease} 
                  className="nav-btn finish-btn"
                disabled={loading}
                >
                {loading ? 'Generating Lease...' : 'Generate Lease'}
                </button>
              <button onClick={handleBackToRoomSelection} className="secondary-btn">
                Back to Room Selection
              </button>
            <button onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            </>
        )}
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .lease-generation-modal {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6b7280;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }

        .close-btn:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .step-indicator {
          background: #3b82f6;
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .confirmation-section {
          padding: 20px;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .confirmation-section h3 {
          color: #0891b2;
          margin: 0 0 16px 0;
          font-size: 16px;
        }

        .confirmed-details {
          background: white;
          padding: 16px;
          border-radius: 6px;
          border: 1px solid #e0f2fe;
        }

        .detail-row {
          margin: 8px 0;
          color: #374151;
        }

        .detail-row strong {
          color: #1f2937;
          display: inline-block;
          width: 80px;
        }

        .lease-generation-info {
          margin-top: 16px;
          padding: 12px;
          background: #ecfdf5;
          border: 1px solid #bbf7d0;
          border-radius: 6px;
        }

        .lease-generation-info p {
          margin: 4px 0;
          color: #065f46;
        }

        .confirm-btn {
          background: #10b981;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .confirm-btn:hover:not(:disabled) {
          background: #059669;
        }

        .confirm-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .secondary-btn {
          background: #6b7280;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .secondary-btn:hover {
          background: #4b5563;
        }

        .lease-terms-section {
          margin-top: 20px;
        }

        .lease-terms-section h3 {
          color: #1f2937;
          margin: 0 0 8px 0;
          font-size: 16px;
        }

        .section-description {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .lease-form {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .form-row:last-child {
          margin-bottom: 0;
        }

        .input-with-prefix {
          position: relative;
        }

        .prefix {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
          font-weight: 500;
          pointer-events: none;
        }

        .form-input.with-prefix {
          padding-left: 32px;
        }

        .lease-summary {
          margin-top: 16px;
          padding: 16px;
          background: #ecfdf5;
          border: 1px solid #bbf7d0;
          border-radius: 6px;
        }

        .lease-summary p {
          margin: 4px 0;
          color: #065f46;
          font-size: 14px;
        }

        @media (max-width: 600px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }

        .modal-content {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .tenant-info {
          background: #f9fafb;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .tenant-info h3 {
          margin: 0 0 8px 0;
          color: #1f2937;
          font-size: 18px;
        }

        .tenant-info p {
          margin: 4px 0;
          color: #6b7280;
          font-size: 14px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .form-input {
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .property-info, .room-info {
          color: #10b981;
          font-weight: 500;
        }

        .optional-label {
          color: #6b7280;
          font-size: 12px;
          font-weight: normal;
        }

        .no-rooms-warning {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          padding: 12px;
          color: #92400e;
          font-size: 14px;
        }

        .no-rooms-warning .solutions {
          margin-top: 8px;
        }

        .no-rooms-warning .solutions p {
          margin: 4px 0;
          font-size: 13px;
        }

        .no-rooms-warning .solutions ul {
          margin: 4px 0 0 20px;
          padding: 0;
        }

        .no-rooms-warning .solutions li {
          margin: 2px 0;
          font-size: 13px;
        }

        .info-message {
          color: #0891b2;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 6px;
          padding: 12px;
          margin-top: 8px;
          font-size: 14px;
        }

        .error-message {
          background: #fee2e2;
          border: 1px solid #fca5a5;
          border-radius: 6px;
          padding: 12px;
          color: #dc2626;
          font-size: 14px;
        }

        .modal-actions {
          display: flex;
          justify-content: space-between;
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .nav-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .finish-btn {
          background: #3b82f6;
          color: white;
        }

        .finish-btn:hover:not(:disabled) {
          background: #2563eb;
        }

        .finish-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .cancel-btn {
          padding: 12px 24px;
          background: #6b7280;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .cancel-btn:hover {
          background: #4b5563;
        }

        .lease-document-section {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          border: 1px solid #e5e7eb;
        }

        .lease-type-toggle {
          margin: 16px 0;
        }

        .toggle-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .toggle-option {
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
          display: block;
        }

        .toggle-option:hover {
          border-color: #d1d5db;
        }

        .toggle-option.active {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .toggle-option input[type="radio"] {
          display: none;
        }

        .option-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .option-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .option-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .option-text strong {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }

        .option-text span {
          font-size: 12px;
          color: #6b7280;
        }

        .custom-lease-upload {
          margin-top: 16px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .file-input {
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          padding: 12px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .file-input:hover {
          border-color: #9ca3af;
        }

        .file-info {
          margin-top: 8px;
          padding: 8px 12px;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .file-name {
          font-weight: 500;
          color: #0891b2;
        }

        .file-size {
          color: #6b7280;
          font-size: 12px;
        }

        .input-help {
          margin-top: 4px;
          font-size: 12px;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}