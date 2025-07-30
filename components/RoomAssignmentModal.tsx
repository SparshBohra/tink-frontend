import React, { useState, useEffect } from 'react';
import { Application, Room, Property } from '../lib/types';
import { calculateRoomCompatibility, getRecommendedRooms } from '../lib/applicationUtils';
import StatusBadge from './StatusBadge';

interface RoomAssignmentModalProps {
  application: Application;
  availableRooms: Room[];
  properties: Property[];
  onClose: () => void;
  onAssignRoom: (applicationId: number, roomId: number, roomInfo: any) => void;
}

export default function RoomAssignmentModal({
  application,
  availableRooms,
  properties,
  onClose,
  onAssignRoom
}: RoomAssignmentModalProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(
    // Auto-select the room that the tenant originally applied for
    application.room || null
  );
  const [roomCompatibilityScores, setRoomCompatibilityScores] = useState<{[key: number]: number}>({});

  const propertyRooms = availableRooms.filter(room => room.property_ref === application.property_ref);
  const recommendedRooms = getRecommendedRooms(application, availableRooms, 50); // Lower threshold for more options

  useEffect(() => {
    // Calculate compatibility scores for all property rooms
    const scores: {[key: number]: number} = {};
    propertyRooms.forEach(room => {
      scores[room.id] = calculateRoomCompatibility(application, room);
    });
    setRoomCompatibilityScores(scores);
  }, [propertyRooms, application]);

  const getPropertyName = (propertyId: number) => {
    const property = properties.find(p => p.id === propertyId);
    return property ? property.name : 'Unknown Property';
  };

  const getRoomDetails = (roomId: number) => {
    return propertyRooms.find(room => room.id === roomId);
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return '#16a34a'; // Green
    if (score >= 60) return '#f59e0b'; // Yellow
    return '#dc2626'; // Red
  };

  const getCompatibilityText = (score: number) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Poor Match';
  };

  const handleAssign = () => {
    if (!selectedRoomId) {
      alert('Please select a room to assign');
      return;
    }

    const room = getRoomDetails(selectedRoomId);
    if (!room) {
      alert('Selected room not found');
      return;
    }

    const compatibilityScore = roomCompatibilityScores[selectedRoomId] || 0;
    
    onAssignRoom(application.id, selectedRoomId, {
      roomName: room.name,
      monthlyRent: room.monthly_rent,
      compatibilityScore,
      propertyName: getPropertyName(application.property_ref)
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large-modal">
        <div className="modal-header">
          <h2>Assign Room - {application.tenant_name}</h2>
          <button onClick={onClose} className="modal-close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Application Summary */}
          <div className="application-summary">
            <div className="app-header">
              <h3>{application.tenant_name}</h3>
              <StatusBadge status={application.status} />
            </div>
            <div className="app-details-grid">
              <div className="detail-item">
                <span className="label">Property:</span>
                <span className="value">{getPropertyName(application.property_ref)}</span>
              </div>
              <div className="detail-item">
                <span className="label">Budget:</span>
                <span className="value">${application.rent_budget || 'Not specified'}/mo</span>
              </div>
              <div className="detail-item">
                <span className="label">Move-in Date:</span>
                <span className="value">{application.desired_move_in_date || 'Not specified'}</span>
              </div>
              <div className="detail-item">
                <span className="label">Priority Score:</span>
                <span className="value">{application.priority_score || 0}</span>
              </div>
              {application.room && (
                <div className="detail-item requested-room">
                  <span className="label">Originally Requested:</span>
                  <span className="value">
                    {getRoomDetails(application.room)?.name || `Room ID ${application.room}`}
                    <span className="auto-selected-badge">✓ Auto-selected</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Room Recommendations */}
          {recommendedRooms.length > 0 && (
            <div className="recommendations-section">
              <h4>🎯 Recommended Rooms</h4>
              <p>These rooms are the best matches based on budget and preferences:</p>
              <div className="recommended-rooms">
                {recommendedRooms.slice(0, 3).map((room: any) => (
                  <div 
                    key={room.id} 
                    className={`recommended-room ${selectedRoomId === room.id ? 'selected' : ''}`}
                    onClick={() => setSelectedRoomId(room.id)}
                  >
                    <div className="room-header">
                      <span className="room-name">{room.name}</span>
                      <span 
                        className="compatibility-score"
                        style={{ color: getCompatibilityColor(room.compatibility_score) }}
                      >
                        {Math.round(room.compatibility_score)}% Match
                      </span>
                    </div>
                    <div className="room-details">
                      <div>💰 ${room.monthly_rent}/mo</div>
                      <div>👥 {room.current_occupancy}/{room.max_capacity} occupied</div>
                      <div>📍 {room.room_type || 'Standard Room'}</div>
                    </div>
                    <div className="compatibility-text">
                      {getCompatibilityText(room.compatibility_score)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Available Rooms */}
          <div className="all-rooms-section">
            <h4>All Available Rooms ({propertyRooms.length})</h4>
            <div className="rooms-list">
              {propertyRooms.map((room) => {
                const compatibilityScore = roomCompatibilityScores[room.id] || 0;
                const isRecommended = recommendedRooms.some((r: any) => r.id === room.id);
                
                return (
                  <div 
                    key={room.id} 
                    className={`room-card ${selectedRoomId === room.id ? 'selected' : ''} ${isRecommended ? 'recommended' : ''}`}
                    onClick={() => setSelectedRoomId(room.id)}
                  >
                    <div className="room-card-header">
                      <div className="room-info">
                        <span className="room-name">{room.name}</span>
                        {isRecommended && <span className="recommended-badge">⭐ Recommended</span>}
                      </div>
                      <div className="room-status">
                        {room.is_vacant ? (
                          <span className="status-available">Available</span>
                        ) : (
                          <span className="status-occupied">Occupied</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="room-card-body">
                      <div className="room-details-grid">
                        <div className="detail">
                          <span className="label">Rent:</span>
                          <span className="value">${room.monthly_rent}/mo</span>
                        </div>
                        <div className="detail">
                          <span className="label">Capacity:</span>
                          <span className="value">{room.current_occupancy}/{room.max_capacity}</span>
                        </div>
                        <div className="detail">
                          <span className="label">Type:</span>
                          <span className="value">{room.room_type || 'Standard'}</span>
                        </div>
                        {room.floor_number && (
                          <div className="detail">
                            <span className="label">Floor:</span>
                            <span className="value">{room.floor_number}</span>
                          </div>
                        )}
                        {room.square_footage && (
                          <div className="detail">
                            <span className="label">Size:</span>
                            <span className="value">{room.square_footage} sq ft</span>
                          </div>
                        )}
                        <div className="detail">
                          <span className="label">Compatibility:</span>
                          <span 
                            className="value compatibility"
                            style={{ color: getCompatibilityColor(compatibilityScore) }}
                          >
                            {Math.round(compatibilityScore)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="compatibility-breakdown">
                        <span className="breakdown-title">Match Analysis:</span>
                        <span className="breakdown-text">
                          {getCompatibilityText(compatibilityScore)}
                        </span>
                      </div>
                      
                      {room.room_features && (
                        <div className="room-features">
                          <span className="features-title">Features:</span>
                          <div className="features-list">
                            {Array.isArray(room.room_features) 
                              ? room.room_features.map((feature, index) => (
                                  <span key={index} className="feature-tag">
                                    {feature}
                                  </span>
                                ))
                              : typeof room.room_features === 'string' 
                                ? room.room_features.split(',').map((feature, index) => (
                                    <span key={index} className="feature-tag">
                                      {feature.trim()}
                                    </span>
                                  ))
                                : null
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Room Summary */}
          {selectedRoomId && (
            <div className="selected-room-summary">
              <h4>Selected Room Summary</h4>
              {(() => {
                const room = getRoomDetails(selectedRoomId);
                const score = roomCompatibilityScores[selectedRoomId] || 0;
                return room ? (
                  <div className="summary-content">
                    <div className="summary-header">
                      <span className="room-name">{room.name}</span>
                      <span 
                        className="compatibility-badge"
                        style={{ 
                          backgroundColor: getCompatibilityColor(score),
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        {Math.round(score)}% Compatible
                      </span>
                    </div>
                    <div className="summary-details">
                      <div>Monthly Rent: ${room.monthly_rent}</div>
                      <div>Current Occupancy: {room.current_occupancy}/{room.max_capacity}</div>
                      <div>Room Type: {room.room_type || 'Standard'}</div>
                      <div>Match Quality: {getCompatibilityText(score)}</div>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button 
            onClick={handleAssign} 
            className="btn-primary"
            disabled={!selectedRoomId}
          >
            Assign Room
          </button>
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

        .modal-content {
          background: white;
          border-radius: 8px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          width: 90%;
          max-width: 1000px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h2 {
          margin: 0;
          color: #1f2937;
        }

        .modal-close {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
          padding: 4px;
        }

        .modal-body {
          padding: 20px;
        }

        .application-summary {
          background: #f9fafb;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .app-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .app-header h3 {
          margin: 0;
          color: #1f2937;
        }

        .app-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .detail-item .label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        .detail-item .value {
          font-size: 14px;
          color: #1f2937;
          font-weight: 500;
        }

        .recommendations-section {
          margin-bottom: 24px;
        }

        .recommendations-section h4 {
          margin: 0 0 8px 0;
          color: #1f2937;
        }

        .recommendations-section p {
          margin: 0 0 16px 0;
          color: #6b7280;
          font-size: 14px;
        }

        .recommended-rooms {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 12px;
        }

        .recommended-room {
          border: 2px solid #10b981;
          border-radius: 8px;
          padding: 12px;
          cursor: pointer;
          background: #f0fdf4;
          transition: all 0.2s;
        }

        .recommended-room:hover {
          border-color: #059669;
          background: #ecfdf5;
        }

        .recommended-room.selected {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .room-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .room-name {
          font-weight: 600;
          color: #1f2937;
        }

        .compatibility-score {
          font-size: 12px;
          font-weight: 600;
        }

        .room-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .compatibility-text {
          font-size: 11px;
          font-weight: 500;
          color: #059669;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .room-features {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #e5e7eb;
        }

        .features-title {
          font-size: 12px;
          font-weight: 500;
          color: #6b7280;
          display: block;
          margin-bottom: 4px;
        }

        .features-list {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .feature-tag {
          background: #dbeafe;
          color: #1d4ed8;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 500;
        }

        .all-rooms-section h4 {
          margin: 0 0 16px 0;
          color: #1f2937;
        }

        .rooms-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .room-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
        }

        .room-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .room-card.selected {
          border-color: #3b82f6;
          background: #eff6ff;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .room-card.recommended {
          border-color: #10b981;
        }

        .room-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .room-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .recommended-badge {
          font-size: 10px;
          color: #059669;
          font-weight: 600;
        }

        .status-available {
          background: #dcfce7;
          color: #16a34a;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
        }

        .status-occupied {
          background: #fee2e2;
          color: #dc2626;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
        }

        .room-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 12px;
        }

        .detail {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }

        .detail .label {
          color: #6b7280;
        }

        .detail .value {
          color: #1f2937;
          font-weight: 500;
        }

        .detail .value.compatibility {
          font-weight: 600;
        }

        .requested-room {
          background: #f0f9ff;
          border-radius: 6px;
          padding: 8px 12px;
          border: 1px solid #0ea5e9;
        }

        .requested-room .label {
          color: #0c4a6e;
          font-weight: 600;
        }

        .requested-room .value {
          color: #0c4a6e;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .auto-selected-badge {
          background: #16a34a;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          white-space: nowrap;
        }

        .compatibility-breakdown {
          border-top: 1px solid #e5e7eb;
          padding-top: 8px;
          font-size: 11px;
        }

        .breakdown-title {
          color: #6b7280;
          margin-right: 6px;
        }

        .breakdown-text {
          color: #1f2937;
          font-weight: 500;
        }

        .selected-room-summary {
          background: #eff6ff;
          border: 1px solid #3b82f6;
          border-radius: 8px;
          padding: 16px;
          margin-top: 20px;
        }

        .selected-room-summary h4 {
          margin: 0 0 12px 0;
          color: #1f2937;
        }

        .summary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .summary-header .room-name {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .summary-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          font-size: 14px;
          color: #374151;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .btn-secondary {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-primary {
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
} 