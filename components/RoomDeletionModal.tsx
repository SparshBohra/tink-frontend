import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { Room, Lease, Tenant } from '../lib/types';
import { validatePropertyOperation } from '../lib/validationRules';
import { formatCurrency } from '../lib/utils';

interface RoomDeletionModalProps {
  room: Room;
  property: any;
  leases: Lease[];
  tenants: Tenant[];
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
}

interface RoomValidationResult {
  canDelete: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  occupiedBy?: Lease;
  tenant?: Tenant;
  revenueImpact: number;
  alternativeRooms: Room[];
}

export default function RoomDeletionModal({
  room,
  property,
  leases,
  tenants,
  isOpen,
  onClose,
  onDelete
}: RoomDeletionModalProps) {
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<RoomValidationResult | null>(null);
  const [step, setStep] = useState<'validate' | 'terminate' | 'confirm'>('validate');
  const [terminationDate, setTerminationDate] = useState('');
  const [terminationReason, setTerminationReason] = useState('');
  const [terminationFee, setTerminationFee] = useState('');
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (isOpen) {
      validateRoomDeletion();
    }
  }, [isOpen, room.id]);

  const validateRoomDeletion = async () => {
    try {
      setValidating(true);
      setError(null);
      
      console.log('Validating room deletion for:', room.id);

      // Get all rooms for alternative suggestions
      const allRooms = await apiClient.getPropertyRooms(property.id);
      
      // Find active lease for this room
      const activeLease = leases.find(l => 
        l.room === room.id && (l.status === 'active' || l.is_active)
      );
      
      // Find tenant if lease exists
      const tenant = activeLease ? tenants.find(t => t.id === activeLease.tenant) : undefined;

      // Calculate revenue impact
      const revenueImpact = activeLease ? activeLease.monthly_rent : 0;

      // Find alternative vacant rooms
      const alternativeRooms = allRooms.filter(r => 
        r.id !== room.id && 
        !leases.some(l => l.room === r.id && (l.status === 'active' || l.is_active))
      );

      // Run validation using the validation rules
      const frontendValidation = validatePropertyOperation('room_deletion', {
        property,
        rooms: allRooms,
        leases,
        tenants
      }, {
        roomIds: [room.id]
      });

      const result: RoomValidationResult = {
        canDelete: !activeLease && frontendValidation.isValid,
        errors: frontendValidation.errors,
        warnings: frontendValidation.warnings,
        suggestions: frontendValidation.suggestions,
        occupiedBy: activeLease,
        tenant: tenant,
        revenueImpact: revenueImpact,
        alternativeRooms: alternativeRooms
      };

      console.log('Room validation result:', result);
      setValidation(result);

      if (result.canDelete) {
        setStep('confirm');
      } else if (result.occupiedBy) {
        setStep('terminate');
      }

    } catch (err: any) {
      console.error('Room validation failed:', err);
      setError(err.message || 'Failed to validate room deletion');
    } finally {
      setValidating(false);
    }
  };

  const handleTerminateLease = async () => {
    if (!validation?.occupiedBy) return;

    try {
      setLoading(true);
      setError(null);

      const terminationData = {
        termination_date: terminationDate,
        reason: terminationReason,
        early_termination_fee: terminationFee ? parseFloat(terminationFee) : 0,
        notes: `Lease terminated to allow room deletion. Room: ${room.name}`
      };

      console.log('Terminating lease:', validation.occupiedBy.id, terminationData);
      await apiClient.terminateLease(validation.occupiedBy.id, terminationData);
      
      console.log('Lease terminated successfully');
      
      // Re-validate after lease termination
      await validateRoomDeletion();
      
    } catch (err: any) {
      console.error('Lease termination failed:', err);
      setError(err.message || 'Failed to terminate lease');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Deleting room:', room.id);
      await apiClient.deleteRoom(room.id);
      
      console.log('Room deleted successfully');
      onDelete();
      onClose();

    } catch (err: any) {
      console.error('Room deletion failed:', err);
      setError(err.message || 'Failed to delete room');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = () => {
    if (confirmText.toLowerCase() === room.name.toLowerCase()) {
      handleDeleteRoom();
    } else {
      setError('Room name confirmation does not match');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h2 className="modal-title">Delete Room</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert alert-error">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="room-info">
            <h3>{room.name}</h3>
            <p className="text-muted">{property.name}</p>
            <div className="room-details">
              <span>Type: {room.room_type || 'Standard'}</span>
              {room.monthly_rent && <span>Rent: {formatCurrency(room.monthly_rent)}</span>}
            </div>
          </div>

          {validating && (
            <div className="loading-section">
              <div className="loading-spinner" />
              <p>Validating room deletion...</p>
            </div>
          )}

          {validation && step === 'validate' && (
            <div className="validation-results">
              {validation.errors.length > 0 && (
                <div className="validation-section errors">
                  <h4>❌ Cannot Delete Room</h4>
                  <ul>
                    {validation.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.suggestions.length > 0 && (
                <div className="validation-section suggestions">
                  <h4>💡 Suggestions</h4>
                  <ul>
                    {validation.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {step === 'terminate' && validation?.occupiedBy && (
            <div className="termination-section">
              <h4>📄 Active Lease Found</h4>
              
              <div className="lease-details">
                <div className="lease-item">
                  <span>Tenant:</span>
                  <span>{validation.tenant?.full_name || `Tenant ${validation.occupiedBy.tenant}`}</span>
                </div>
                <div className="lease-item">
                  <span>Monthly Rent:</span>
                  <span>{formatCurrency(validation.occupiedBy.monthly_rent)}</span>
                </div>
                <div className="lease-item">
                  <span>Lease Period:</span>
                  <span>{validation.occupiedBy.start_date} - {validation.occupiedBy.end_date}</span>
                </div>
              </div>

              <div className="termination-form">
                <h5>Terminate Lease</h5>
                <p>To delete this room, the active lease must be terminated first.</p>
                
                <div className="form-group">
                  <label>Termination Date*</label>
                  <input
                    type="date"
                    value={terminationDate}
                    onChange={(e) => setTerminationDate(e.target.value)}
                    className="form-input"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Reason for Termination*</label>
                  <select
                    value={terminationReason}
                    onChange={(e) => setTerminationReason(e.target.value)}
                    className="form-input"
                    required
                  >
                    <option value="">Select reason...</option>
                    <option value="property_management">Property Management Decision</option>
                    <option value="room_removal">Room Being Removed</option>
                    <option value="maintenance">Major Maintenance Required</option>
                    <option value="tenant_agreement">Mutual Agreement</option>
                    <option value="lease_violation">Lease Violation</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Early Termination Fee (if applicable)</label>
                  <input
                    type="number"
                    value={terminationFee}
                    onChange={(e) => setTerminationFee(e.target.value)}
                    className="form-input"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                {validation.alternativeRooms.length > 0 && (
                  <div className="alternative-rooms">
                    <h6>Available Alternative Rooms</h6>
                    <p>Consider offering tenant relocation to:</p>
                    <ul>
                      {validation.alternativeRooms.map(altRoom => (
                        <li key={altRoom.id}>
                          {altRoom.name} ({altRoom.room_type || 'Standard'})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="confirmation-section">
              <div className="warning-box">
                <h4>⚠️ Confirm Room Deletion</h4>
                <p>This action cannot be undone. The room and all its data will be permanently deleted.</p>
                
                {validation?.revenueImpact > 0 && (
                  <div className="revenue-impact">
                    <p><strong>Revenue Impact:</strong> This room was generating {formatCurrency(validation.revenueImpact)}/month</p>
                  </div>
                )}
              </div>
              
              <div className="confirmation-input">
                <label>Type the room name to confirm:</label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={room.name}
                  className="form-input"
                />
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary" disabled={loading}>
            Cancel
          </button>
          
          {step === 'terminate' && (
            <button
              onClick={handleTerminateLease}
              className="btn btn-warning"
              disabled={loading || !terminationDate || !terminationReason}
            >
              {loading ? 'Terminating Lease...' : 'Terminate Lease & Continue'}
            </button>
          )}
          
          {step === 'confirm' && (
            <button
              onClick={handleConfirmDelete}
              className="btn btn-danger"
              disabled={loading || confirmText.toLowerCase() !== room.name.toLowerCase()}
            >
              {loading ? 'Deleting Room...' : 'Delete Room'}
            </button>
          )}
        </div>

        <style jsx>{`
          .modal-content.large {
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
          }

          .room-info {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 20px;
          }

          .room-info h3 {
            margin: 0 0 4px 0;
          }

          .room-details {
            display: flex;
            gap: 16px;
            margin-top: 8px;
            font-size: 14px;
            color: #6c757d;
          }

          .validation-section {
            margin-bottom: 20px;
            padding: 16px;
            border-radius: 8px;
            border-left: 4px solid;
          }

          .validation-section.errors {
            background: #fef2f2;
            border-left-color: #ef4444;
          }

          .validation-section.suggestions {
            background: #f0f9ff;
            border-left-color: #3b82f6;
          }

          .termination-section {
            background: #fffbeb;
            border: 1px solid #fed7aa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }

          .lease-details {
            background: white;
            border-radius: 6px;
            padding: 16px;
            margin: 16px 0;
          }

          .lease-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }

          .lease-item:last-child {
            margin-bottom: 0;
          }

          .termination-form {
            margin-top: 20px;
          }

          .termination-form h5 {
            margin: 0 0 8px 0;
            color: #dc2626;
          }

          .alternative-rooms {
            background: #f0f9ff;
            border-radius: 6px;
            padding: 12px;
            margin-top: 16px;
          }

          .alternative-rooms h6 {
            margin: 0 0 8px 0;
            color: #1e40af;
          }

          .alternative-rooms ul {
            margin: 8px 0 0 20px;
          }

          .confirmation-section {
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            background: #fef2f2;
            border: 1px solid #fecaca;
          }

          .warning-box h4 {
            color: #dc2626;
            margin: 0 0 8px 0;
          }

          .revenue-impact {
            background: #fee2e2;
            border-radius: 4px;
            padding: 8px;
            margin: 12px 0;
          }

          .confirmation-input {
            margin-top: 16px;
          }

          .confirmation-input label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
          }

          .form-group {
            margin-bottom: 16px;
          }

          .form-group label {
            display: block;
            margin-bottom: 4px;
            font-weight: 500;
          }

          .loading-section {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 20px;
            justify-content: center;
          }

          .loading-spinner {
            width: 20px;
            height: 20px;
            border: 2px solid #e5e7eb;
            border-top: 2px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
} 