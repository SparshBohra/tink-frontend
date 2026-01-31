import { useState, useEffect } from 'react';
import { Property, Room, Lease, Tenant } from '../lib/types';
import { validatePropertyOperation } from '../lib/validationRules';
import { getOccupancyStats } from '../lib/revenueCalculator';
import { apiClient } from '../lib/api';
import { User, AlertTriangle, Lightbulb, X } from 'lucide-react';

interface RoomCountEditorProps {
  property: Property;
  rooms: Room[];
  leases: Lease[];
  tenants: Tenant[];
  onUpdate: (updatedRooms: Room[]) => void;
  onClose?: () => void;
}

export default function RoomCountEditor({
  property,
  rooms,
  leases,
  tenants,
  onUpdate,
  onClose
}: RoomCountEditorProps) {
  const [newRoomCount, setNewRoomCount] = useState(rooms.length);
  const [newRoomNames, setNewRoomNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const occupancyStats = getOccupancyStats(property, leases, rooms);
  const isIncreasing = newRoomCount > rooms.length;
  const isDecreasing = newRoomCount < rooms.length;

  useEffect(() => {
    // Initialize room names when component mounts
    setNewRoomNames(Array.from({ length: newRoomCount }, (_, i) => 
      rooms[i]?.name || `Room ${i + 1}`
    ));
  }, [rooms, newRoomCount]);

  useEffect(() => {
    // Validate changes when room count changes
    if (newRoomCount !== rooms.length) {
      validateChanges();
    } else {
      setValidationResult(null);
    }
  }, [newRoomCount, rooms, leases]);

  const validateChanges = () => {
    if (isIncreasing) {
      const result = validatePropertyOperation('room_addition', {
        property,
        rooms,
        leases,
        tenants
      }, {
        roomCount: newRoomCount - rooms.length,
        roomNames: newRoomNames.slice(rooms.length)
      });
      setValidationResult(result);
    } else if (isDecreasing) {
      const roomsToDelete = rooms.slice(newRoomCount).map(r => r.id);
      const result = validatePropertyOperation('room_deletion', {
        property,
        rooms,
        leases,
        tenants
      }, {
        roomIds: roomsToDelete
      });
      setValidationResult(result);
    }
  };

  const handleRoomCountChange = (count: number) => {
    setNewRoomCount(count);
    
    // Adjust room names array
    const updatedNames = Array.from({ length: count }, (_, i) => 
      i < rooms.length ? (rooms[i]?.name || `Room ${i + 1}`) : `Room ${i + 1}`
    );
    setNewRoomNames(updatedNames);
  };

  const updateRoomName = (index: number, name: string) => {
    const updatedNames = [...newRoomNames];
    updatedNames[index] = name;
    setNewRoomNames(updatedNames);
  };

  const handleSave = async () => {
    if (!validationResult?.isValid && isDecreasing) {
      setShowConfirmation(true);
      return;
    }

    await executeChanges();
  };

  const executeChanges = async (force = false) => {
    setLoading(true);
    setError(null);
    setShowConfirmation(false);

    try {
      // Use the new backend API endpoint for room count updates
      const result = await apiClient.updatePropertyRoomCount(property.id, {
        newRoomCount,
        roomNames: newRoomNames,
        force: force
      });
      
      if (result.success) {
        onUpdate(result.rooms || []);
        setError(null);
      } else {
        setError(result.message || 'Failed to update room count');
      }
      
    } catch (err: any) {
      console.error('Room count update failed:', err);
      setError(err.message || 'Failed to update room count');
    } finally {
      setLoading(false);
    }
  };

  const canSave = newRoomCount !== rooms.length && (!validationResult || validationResult.isValid || isIncreasing);

  return (
    <div className="room-count-editor">
      {/* Modal Header */}
      <div className="modal-header">
        <h2>Room Management</h2>
        {onClose && (
          <button onClick={onClose} className="close-button">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Current Status */}
      <div className="status-section">
        <h3>Room Count Management</h3>
        <div className="current-status">
          <span>Currently: <strong>{rooms.length} rooms</strong></span>
          <span>({occupancyStats.occupiedUnits} occupied, {occupancyStats.vacantUnits} vacant)</span>
        </div>
      </div>

      {/* Room Count Controls */}
      <div className="room-count-controls">
        <div className="count-selector">
          <label htmlFor="room-count">Number of Rooms</label>
          <select
            id="room-count"
            value={newRoomCount}
            onChange={(e) => handleRoomCountChange(parseInt(e.target.value))}
            disabled={loading}
            style={{
              padding: '0.75rem 1rem',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '0.875rem',
              minWidth: '180px',
              backgroundColor: 'white',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {Array.from({ length: 50 }, (_, i) => i + 1).map(num => (
              <option key={num} value={num}>
                {num} {num === 1 ? 'Room' : 'Rooms'}
              </option>
            ))}
          </select>
        </div>

        {newRoomCount !== rooms.length && (
          <div className="change-indicator">
            {isIncreasing && (
              <span className="increase">
                +{newRoomCount - rooms.length} rooms will be added
              </span>
            )}
            {isDecreasing && (
              <span className="decrease">
                -{rooms.length - newRoomCount} rooms will be removed
              </span>
            )}
          </div>
        )}
      </div>

      {/* Room Names Grid */}
      <div className="room-names-section">
        <label>Room Names</label>
        <div className="room-names-grid">
          {Array.from({ length: newRoomCount }, (_, index) => {
            const isExisting = index < rooms.length;
            const isOccupied = isExisting && leases.some(l => 
              l.room === rooms[index]?.id && (l.status === 'active' || l.status === 'signed')
            );
            
            return (
              <div key={index} className={`room-input ${isExisting ? 'existing' : 'new'} ${isOccupied ? 'occupied' : ''}`}>
                <input
                  type="text"
                  placeholder={`Room ${index + 1}`}
                  value={newRoomNames[index] || ''}
                  onChange={(e) => updateRoomName(index, e.target.value)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                    backgroundColor: isOccupied ? '#fef3c7' : isExisting ? '#f8fafc' : '#f0fdf4',
                    borderColor: isOccupied ? '#fcd34d' : !isExisting ? '#bbf7d0' : '#e5e7eb'
                  }}
                />
                {isOccupied && (
                  <div className="occupancy-indicator">
                    <User size={14} color="#92400e" />
                  </div>
                )}
                {!isExisting && <span className="new-indicator">NEW</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Validation Results */}
      {validationResult && (
        <div className="validation-results">
          {validationResult.errors.length > 0 && (
            <div className="validation-errors">
              <div className="validation-header">
                <AlertTriangle size={16} color="#dc2626" />
                <h4>Issues Found:</h4>
              </div>
              {validationResult.errors.map((error: string, idx: number) => (
                <p key={idx}>• {error}</p>
              ))}
            </div>
          )}

          {validationResult.warnings.length > 0 && (
            <div className="validation-warnings">
              <div className="validation-header">
                <AlertTriangle size={16} color="#92400e" />
                <h4>Important Notes:</h4>
              </div>
              {validationResult.warnings.map((warning: string, idx: number) => (
                <p key={idx}>• {warning}</p>
              ))}
            </div>
          )}

          {validationResult.suggestions.length > 0 && (
            <div className="validation-suggestions">
              <div className="validation-header">
                <Lightbulb size={16} color="#0c4a6e" />
                <h4>Suggestions:</h4>
              </div>
              {validationResult.suggestions.map((suggestion: string, idx: number) => (
                <p key={idx}>• {suggestion}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <AlertTriangle size={16} color="#dc2626" />
          <span><strong>Error:</strong> {error}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="editor-actions">
        <button
          onClick={handleSave}
          disabled={!canSave || loading}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: loading || !canSave ? '#9ca3af' : '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: loading || !canSave ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {loading ? 'Updating...' : `Update to ${newRoomCount} Rooms`}
        </button>
        
        <button
          onClick={() => {
            setNewRoomCount(rooms.length);
            setNewRoomNames(rooms.map(r => r.name));
            setValidationResult(null);
          }}
          disabled={loading || newRoomCount === rooms.length}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#f8fafc',
            color: '#64748b',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: loading || newRoomCount === rooms.length ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Reset
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="confirmation-modal">
          <div className="modal-content">
            <div className="modal-header">
            <h3>Confirm Room Removal</h3>
              <button onClick={() => setShowConfirmation(false)} className="close-button">
                <X size={20} />
              </button>
            </div>
            <p>You're about to remove {rooms.length - newRoomCount} room(s). This action cannot be undone.</p>
            
            {validationResult?.warnings && (
              <div className="modal-warnings">
                {validationResult.warnings.map((warning: string, idx: number) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <AlertTriangle size={16} color="#92400e" style={{ marginTop: '0.125rem', flexShrink: 0 }} />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="modal-actions">
              <button
                onClick={() => executeChanges(true)}
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: loading ? '#9ca3af' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {loading ? 'Removing...' : 'Confirm Removal'}
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#f8fafc',
                  color: '#64748b',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .room-count-editor {
          background: white;
          border-radius: '12px';
          padding: 0;
          max-width: 800px;
          width: 100%;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 1.5rem 0 1.5rem;
          margin-bottom: 1.5rem;
        }

        .modal-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .close-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          transition: background-color 0.2s ease;
        }

        .close-button:hover {
          background-color: #f3f4f6;
        }

        .status-section {
          padding: 0 1.5rem;
          margin-bottom: 1.5rem;
        }

        .status-section h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #374151;
          margin: 0 0 0.5rem 0;
        }

        .current-status {
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .room-count-controls {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 0 1.5rem;
          margin-bottom: 1.5rem;
        }

        .count-selector label {
          display: block;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .change-indicator {
          font-size: 0.875rem;
          font-weight: 600;
        }

        .increase {
          color: #059669;
        }

        .decrease {
          color: #dc2626;
        }

        .room-names-section {
          padding: 0 1.5rem;
          margin-bottom: 1.5rem;
        }

        .room-names-section > label {
          display: block;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.75rem;
          font-size: 0.875rem;
        }

        .room-names-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .room-input {
          position: relative;
        }

        .occupancy-indicator {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
        }

        .new-indicator {
          position: absolute;
          right: 0.5rem;
          top: -0.375rem;
          background: #059669;
          color: white;
          font-size: 0.625rem;
          font-weight: 600;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
        }

        .validation-results {
          padding: 0 1.5rem;
          margin-bottom: 1.5rem;
        }

        .validation-errors,
        .validation-warnings,
        .validation-suggestions {
          margin-bottom: 1rem;
          padding: 1rem;
          border-radius: 8px;
        }

        .validation-errors {
          background: #fef2f2;
          border: 1px solid #fecaca;
        }

        .validation-warnings {
          background: #fffbeb;
          border: 1px solid #fcd34d;
        }

        .validation-suggestions {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
        }

        .validation-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .validation-header h4 {
          font-size: 0.875rem;
          font-weight: 600;
          margin: 0;
        }

        .validation-errors .validation-header h4 {
          color: #dc2626;
        }

        .validation-warnings .validation-header h4 {
          color: #92400e;
        }

        .validation-suggestions .validation-header h4 {
          color: #0c4a6e;
        }

        .validation-errors p,
        .validation-warnings p,
        .validation-suggestions p {
          font-size: 0.8125rem;
          margin: 0.125rem 0;
        }

        .validation-errors p {
          color: #dc2626;
        }

        .validation-warnings p {
          color: #92400e;
        }

        .validation-suggestions p {
          color: #0c4a6e;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 1rem;
          color: #dc2626;
          font-size: 0.875rem;
          margin: 0 1.5rem 1.5rem 1.5rem;
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .editor-actions {
          display: flex;
          gap: 0.75rem;
          padding: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .confirmation-modal {
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

        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 0;
          max-width: 500px;
          width: 90%;
        }

        .modal-content .modal-header {
          padding: 1.5rem;
          margin-bottom: 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-content h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .modal-content p {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 1.5rem;
          line-height: 1.5;
        }

        .modal-warnings {
          background: #fffbeb;
          border: 1px solid #fcd34d;
          border-radius: 8px;
          padding: 1rem;
          margin: 0 1.5rem 1.5rem 1.5rem;
          color: #92400e;
          font-size: 0.875rem;
        }

        .modal-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          padding: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }
      `}</style>
    </div>
  );
} 