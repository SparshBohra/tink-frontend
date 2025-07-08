import { useState, useEffect } from 'react';
import { Property, Room, Lease, Tenant } from '../lib/types';
import { validatePropertyOperation } from '../lib/validationRules';
import { getOccupancyStats } from '../lib/revenueCalculator';
import { apiClient } from '../lib/api';

interface RoomCountEditorProps {
  property: Property;
  rooms: Room[];
  leases: Lease[];
  tenants: Tenant[];
  onUpdate: (updatedRooms: Room[]) => void;
}

export default function RoomCountEditor({
  property,
  rooms,
  leases,
  tenants,
  onUpdate
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
      <div className="editor-header">
        <h3>Room Count Management</h3>
        <div className="current-status">
          <span>Currently: {rooms.length} rooms</span>
          <span>({occupancyStats.occupiedUnits} occupied, {occupancyStats.vacantUnits} vacant)</span>
        </div>
      </div>

      <div className="room-count-controls">
        <div className="count-selector">
          <label htmlFor="room-count">Number of Rooms</label>
          <select
            id="room-count"
            value={newRoomCount}
            onChange={(e) => handleRoomCountChange(parseInt(e.target.value))}
            disabled={loading}
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
              l.room === rooms[index]?.id && (l.status === 'active' || l.is_active)
            );
            
            return (
              <div key={index} className={`room-input ${isExisting ? 'existing' : 'new'} ${isOccupied ? 'occupied' : ''}`}>
                <input
                  type="text"
                  placeholder={`Room ${index + 1}`}
                  value={newRoomNames[index] || ''}
                  onChange={(e) => updateRoomName(index, e.target.value)}
                  disabled={loading}
                />
                {isOccupied && <span className="occupancy-indicator">👤</span>}
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
              <h4>⚠️ Issues Found:</h4>
              {validationResult.errors.map((error: string, idx: number) => (
                <p key={idx}>• {error}</p>
              ))}
            </div>
          )}

          {validationResult.warnings.length > 0 && (
            <div className="validation-warnings">
              <h4>⚠️ Important Notes:</h4>
              {validationResult.warnings.map((warning: string, idx: number) => (
                <p key={idx}>• {warning}</p>
              ))}
            </div>
          )}

          {validationResult.suggestions.length > 0 && (
            <div className="validation-suggestions">
              <h4>💡 Suggestions:</h4>
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
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="editor-actions">
        <button
          onClick={handleSave}
          disabled={!canSave || loading}
          className="btn btn-primary"
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
          className="btn btn-secondary"
        >
          Reset
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="confirmation-modal">
          <div className="modal-content">
            <h3>Confirm Room Removal</h3>
            <p>You're about to remove {rooms.length - newRoomCount} room(s). This action cannot be undone.</p>
            
            {validationResult?.warnings && (
              <div className="modal-warnings">
                {validationResult.warnings.map((warning: string, idx: number) => (
                  <p key={idx}>⚠️ {warning}</p>
                ))}
              </div>
            )}

            <div className="modal-actions">
              <button
                onClick={() => executeChanges(true)}
                className="btn btn-danger"
                disabled={loading}
              >
                {loading ? 'Removing...' : 'Confirm Removal'}
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                className="btn btn-secondary"
                disabled={loading}
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
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
        }

        .editor-header {
          margin-bottom: 20px;
        }

        .editor-header h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        .current-status {
          display: flex;
          gap: 12px;
          font-size: 14px;
          color: #64748b;
        }

        .room-count-controls {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
        }

        .count-selector label {
          display: block;
          font-weight: 600;
          color: #374151;
          margin-bottom: 6px;
        }

        .count-selector select {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          min-width: 150px;
        }

        .change-indicator {
          font-size: 14px;
          font-weight: 600;
        }

        .increase {
          color: #059669;
        }

        .decrease {
          color: #dc2626;
        }

        .room-names-section {
          margin-bottom: 20px;
        }

        .room-names-section > label {
          display: block;
          font-weight: 600;
          color: #374151;
          margin-bottom: 12px;
        }

        .room-names-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .room-input {
          position: relative;
        }

        .room-input input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          box-sizing: border-box;
        }

        .room-input.existing input {
          background: #f8fafc;
        }

        .room-input.new input {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }

        .room-input.occupied input {
          background: #fef3c7;
          border-color: #fcd34d;
        }

        .occupancy-indicator {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 12px;
        }

        .new-indicator {
          position: absolute;
          right: 8px;
          top: -6px;
          background: #059669;
          color: white;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .validation-results {
          margin-bottom: 20px;
        }

        .validation-errors,
        .validation-warnings,
        .validation-suggestions {
          margin-bottom: 12px;
          padding: 12px 16px;
          border-radius: 6px;
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

        .validation-errors h4 {
          color: #dc2626;
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .validation-warnings h4 {
          color: #92400e;
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .validation-suggestions h4 {
          color: #0c4a6e;
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .validation-errors p,
        .validation-warnings p,
        .validation-suggestions p {
          font-size: 13px;
          margin: 2px 0;
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
          border-radius: 6px;
          padding: 12px 16px;
          color: #dc2626;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .editor-actions {
          display: flex;
          gap: 12px;
        }

        .btn {
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #4f46e5;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #3730a3;
        }

        .btn-secondary {
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #e2e8f0;
        }

        .btn-danger {
          background: #dc2626;
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background: #b91c1c;
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
          border-radius: 8px;
          padding: 24px;
          max-width: 500px;
          width: 90%;
        }

        .modal-content h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 12px 0;
        }

        .modal-content p {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 16px;
        }

        .modal-warnings {
          background: #fffbeb;
          border: 1px solid #fcd34d;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 16px;
        }

        .modal-warnings p {
          color: #92400e;
          margin: 4px 0;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
      `}</style>
    </div>
  );
} 