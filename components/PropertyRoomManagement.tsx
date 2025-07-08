import React, { useState, useEffect } from 'react';
import { Property, Room, Application } from '../lib/types';
import { apiClient } from '../lib/api';

interface PropertyRoomManagementProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProperty: Property | null;
  applications: Application[];
  onRoomUpdate: () => void;
}

interface RoomAnalytics {
  totalRooms: number;
  vacantRooms: number;
  occupiedRooms: number;
  pendingAssignments: number;
  maintenanceRooms: number;
  averageRent: number;
  occupancyRate: number;
  revenueGenerated: number;
}

const PropertyRoomManagement: React.FC<PropertyRoomManagementProps> = ({
  isOpen,
  onClose,
  selectedProperty,
  applications,
  onRoomUpdate
}) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<RoomAnalytics | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<'all' | 'vacant' | 'occupied' | 'maintenance'>('all');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showRoomDetails, setShowRoomDetails] = useState(false);

  useEffect(() => {
    if (isOpen && selectedProperty) {
      fetchRooms();
    }
  }, [isOpen, selectedProperty]);

  const fetchRooms = async () => {
    if (!selectedProperty) return;
    
    setLoading(true);
    try {
      const response = await apiClient.getRooms();
      const allRooms = response.results || [];
      const propertyRooms = allRooms.filter(room => room.property_ref === selectedProperty.id);
      setRooms(propertyRooms);
      calculateAnalytics(propertyRooms);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (propertyRooms: Room[]) => {
    const totalRooms = propertyRooms.length;
    const vacantRooms = propertyRooms.filter(room => room.is_vacant).length;
    const occupiedRooms = propertyRooms.filter(room => !room.is_vacant).length;
    const maintenanceRooms = propertyRooms.filter(room => room.status === 'maintenance').length;
    
    const pendingAssignments = applications.filter(app => 
      app.property_ref === selectedProperty?.id && 
      (app.status === 'approved' || app.status === 'processing')
    ).length;
    
    const rents = propertyRooms.map(room => {
      const rent = typeof room.monthly_rent === 'string' ? parseFloat(room.monthly_rent) : (room.monthly_rent || 0);
      return rent;
    });
    
    const averageRent = rents.length > 0 ? rents.reduce((sum, rent) => sum + rent, 0) / rents.length : 0;
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
    const revenueGenerated = propertyRooms
      .filter(room => !room.is_vacant)
      .reduce((sum, room) => {
        const rent = typeof room.monthly_rent === 'string' ? parseFloat(room.monthly_rent) : (room.monthly_rent || 0);
        return sum + rent;
      }, 0);

    setAnalytics({
      totalRooms,
      vacantRooms,
      occupiedRooms,
      pendingAssignments,
      maintenanceRooms,
      averageRent,
      occupancyRate,
      revenueGenerated
    });
  };

  const getRoomStatusColor = (room: Room) => {
    if (room.status === 'maintenance') return '#f59e0b';
    if (room.is_vacant) return '#10b981';
    return '#ef4444';
  };

  const getRoomStatusText = (room: Room) => {
    if (room.status === 'maintenance') return 'Maintenance';
    if (room.is_vacant) return 'Vacant';
    return 'Occupied';
  };

  const getFilteredRooms = () => {
    return rooms.filter(room => {
      switch (filterStatus) {
        case 'vacant': return room.is_vacant && room.status !== 'maintenance';
        case 'occupied': return !room.is_vacant;
        case 'maintenance': return room.status === 'maintenance';
        default: return true;
      }
    });
  };

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setShowRoomDetails(true);
  };

  const handleRoomUpdate = async (roomId: number, updates: Partial<Room>) => {
    try {
      // This would call the API to update the room
      // For now, we'll just update locally
      setRooms(prevRooms => 
        prevRooms.map(room => 
          room.id === roomId ? { ...room, ...updates } : room
        )
      );
      calculateAnalytics(rooms);
      onRoomUpdate();
    } catch (error) {
      console.error('Failed to update room:', error);
    }
  };

  const handleMarkVacant = (roomId: number) => {
    handleRoomUpdate(roomId, { is_vacant: true, status: 'available' });
  };

  const handleMarkOccupied = (roomId: number) => {
    handleRoomUpdate(roomId, { is_vacant: false, status: 'occupied' });
  };

  const handleMarkMaintenance = (roomId: number) => {
    handleRoomUpdate(roomId, { status: 'maintenance' });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="property-room-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            Room Management - {selectedProperty?.name}
          </h2>
          <button onClick={onClose} className="close-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-content">
          {/* Analytics Summary */}
          {analytics && (
            <div className="room-analytics">
              <div className="analytics-grid">
                <div className="analytics-item">
                  <div className="analytics-label">Total Rooms</div>
                  <div className="analytics-value">{analytics.totalRooms}</div>
                </div>
                <div className="analytics-item">
                  <div className="analytics-label">Vacant</div>
                  <div className="analytics-value vacant">{analytics.vacantRooms}</div>
                </div>
                <div className="analytics-item">
                  <div className="analytics-label">Occupied</div>
                  <div className="analytics-value occupied">{analytics.occupiedRooms}</div>
                </div>
                <div className="analytics-item">
                  <div className="analytics-label">Maintenance</div>
                  <div className="analytics-value maintenance">{analytics.maintenanceRooms}</div>
                </div>
                <div className="analytics-item">
                  <div className="analytics-label">Occupancy Rate</div>
                  <div className="analytics-value">{analytics.occupancyRate.toFixed(1)}%</div>
                </div>
                <div className="analytics-item">
                  <div className="analytics-label">Monthly Revenue</div>
                  <div className="analytics-value">${analytics.revenueGenerated.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="room-controls">
            <div className="view-controls">
              <label>View Mode:</label>
              <div className="view-mode-buttons">
                <button 
                  className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                  </svg>
                  Grid
                </button>
                <button 
                  className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="8" y1="6" x2="21" y2="6"/>
                    <line x1="8" y1="12" x2="21" y2="12"/>
                    <line x1="8" y1="18" x2="21" y2="18"/>
                    <line x1="3" y1="6" x2="3.01" y2="6"/>
                    <line x1="3" y1="12" x2="3.01" y2="12"/>
                    <line x1="3" y1="18" x2="3.01" y2="18"/>
                  </svg>
                  List
                </button>
              </div>
            </div>

            <div className="filter-controls">
              <label>Filter by Status:</label>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="status-filter"
              >
                <option value="all">All Rooms</option>
                <option value="vacant">Vacant</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          {/* Room Display */}
          <div className="rooms-container">
            {loading ? (
              <div className="loading-state">Loading rooms...</div>
            ) : (
              <div className={`rooms-display ${viewMode}`}>
                {getFilteredRooms().map((room) => (
                  <div 
                    key={room.id}
                    className={`room-card ${viewMode}`}
                    onClick={() => handleRoomClick(room)}
                  >
                    <div className="room-header">
                      <div className="room-name">{room.name}</div>
                      <div 
                        className="room-status-indicator"
                        style={{ backgroundColor: getRoomStatusColor(room) }}
                      >
                        {getRoomStatusText(room)}
                      </div>
                    </div>
                    <div className="room-details">
                      <div className="room-detail">
                        <span className="detail-label">Type:</span>
                        <span className="detail-value">{room.room_type || 'N/A'}</span>
                      </div>
                      <div className="room-detail">
                        <span className="detail-label">Rent:</span>
                        <span className="detail-value">
                          ${typeof room.monthly_rent === 'string' ? parseFloat(room.monthly_rent) : (room.monthly_rent || 0)}
                        </span>
                      </div>
                      <div className="room-detail">
                        <span className="detail-label">Capacity:</span>
                        <span className="detail-value">{room.capacity || 1} person(s)</span>
                      </div>
                    </div>
                    <div className="room-actions">
                      {room.is_vacant && room.status !== 'maintenance' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkOccupied(room.id);
                          }}
                          className="room-action-btn occupied"
                        >
                          Mark Occupied
                        </button>
                      )}
                      {!room.is_vacant && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkVacant(room.id);
                          }}
                          className="room-action-btn vacant"
                        >
                          Mark Vacant
                        </button>
                      )}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkMaintenance(room.id);
                        }}
                        className="room-action-btn maintenance"
                      >
                        Maintenance
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Room Details Modal */}
        {showRoomDetails && selectedRoom && (
          <div className="room-details-overlay">
            <div className="room-details-modal">
              <div className="room-details-header">
                <h3>Room Details - {selectedRoom.name}</h3>
                <button onClick={() => setShowRoomDetails(false)} className="close-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="room-details-content">
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Room Name:</label>
                    <span>{selectedRoom.name}</span>
                  </div>
                  <div className="detail-item">
                    <label>Room Type:</label>
                    <span>{selectedRoom.room_type || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Monthly Rent:</label>
                    <span>${typeof selectedRoom.monthly_rent === 'string' ? parseFloat(selectedRoom.monthly_rent) : (selectedRoom.monthly_rent || 0)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Capacity:</label>
                    <span>{selectedRoom.capacity || 1} person(s)</span>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <span className={`status-badge ${selectedRoom.is_vacant ? 'vacant' : 'occupied'}`}>
                      {getRoomStatusText(selectedRoom)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Description:</label>
                    <span>{selectedRoom.description || 'No description available'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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

        .property-room-modal {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 1200px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-title {
          font-size: 24px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
          padding: 8px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .modal-content {
          padding: 24px;
        }

        .room-analytics {
          background: #f8fafc;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
        }

        .analytics-item {
          text-align: center;
        }

        .analytics-label {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .analytics-value {
          font-size: 24px;
          font-weight: 600;
          color: #1f2937;
        }

        .analytics-value.vacant {
          color: #10b981;
        }

        .analytics-value.occupied {
          color: #ef4444;
        }

        .analytics-value.maintenance {
          color: #f59e0b;
        }

        .room-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .view-controls, .filter-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .view-mode-buttons {
          display: flex;
          gap: 4px;
        }

        .view-mode-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .view-mode-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .view-mode-btn:hover:not(.active) {
          background: #f3f4f6;
        }

        .status-filter {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }

        .rooms-container {
          min-height: 400px;
        }

        .rooms-display.grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .rooms-display.list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .room-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .room-card:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border-color: #d1d5db;
        }

        .room-card.list {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
        }

        .room-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .room-name {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .room-status-indicator {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          color: white;
        }

        .room-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
        }

        .room-card.list .room-details {
          flex-direction: row;
          gap: 16px;
        }

        .room-detail {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .room-card.list .room-detail {
          flex-direction: column;
          align-items: flex-start;
        }

        .detail-label {
          font-size: 14px;
          color: #6b7280;
        }

        .detail-value {
          font-size: 14px;
          font-weight: 500;
          color: #1f2937;
        }

        .room-actions {
          display: flex;
          gap: 8px;
        }

        .room-action-btn {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .room-action-btn.vacant {
          background: #10b981;
          color: white;
        }

        .room-action-btn.occupied {
          background: #ef4444;
          color: white;
        }

        .room-action-btn.maintenance {
          background: #f59e0b;
          color: white;
        }

        .room-action-btn:hover {
          opacity: 0.8;
        }

        .loading-state {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 200px;
          color: #6b7280;
        }

        .room-details-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1001;
        }

        .room-details-modal {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
        }

        .room-details-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .room-details-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        }

        .room-details-content {
          padding: 20px;
        }

        .detail-grid {
          display: grid;
          gap: 16px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #f9fafb;
          border-radius: 6px;
        }

        .detail-item label {
          font-weight: 500;
          color: #374151;
        }

        .detail-item span {
          color: #6b7280;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          color: white;
        }

        .status-badge.vacant {
          background: #10b981;
        }

        .status-badge.occupied {
          background: #ef4444;
        }
      `}</style>
    </div>
  );
};

export default PropertyRoomManagement; 