import React, { useState, useEffect } from 'react';
import { Application, Property, Room } from '../lib/types';

interface ApplicationApprovalModalProps {
  isOpen: boolean;
  application: Application | null;
  property: Property | null;
  availableRooms: Room[];
  allProperties?: Property[];
  allRooms?: Room[];
  onClose: () => void;
  onApprove: (applicationId: number, approvalData: {
    decision: 'approve';
    decision_notes?: string;
    start_date: string;
    end_date: string;
    monthly_rent: string;
    security_deposit: string;
    room_id?: number;
    property_id?: number;
  }) => void;
}

const ApplicationApprovalModal: React.FC<ApplicationApprovalModalProps> = ({
  isOpen,
  application,
  property,
  availableRooms,
  allProperties = [],
  allRooms = [],
  onClose,
  onApprove,
}) => {
  const [formData, setFormData] = useState({
    decision_notes: '',
    start_date: '',
    end_date: '',
    monthly_rent: '',
    security_deposit: '',
    room_id: undefined as number | undefined,
    property_id: undefined as number | undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(property);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>(availableRooms);

  useEffect(() => {
    if (isOpen && application && property) {
      // Calculate default dates
      const startDate = application.desired_move_in_date || new Date().toISOString().split('T')[0];
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
      
      // Calculate default rent amounts
      const monthlyRent = parseFloat(String(application.rent_budget || property.monthly_rent || '1000'));
      const securityDeposit = monthlyRent * 2;
      
      // Set default room for per-room rentals
      const defaultRoomId = property.rent_type === 'per_room' && availableRooms.length > 0 
        ? availableRooms[0].id 
        : undefined;
      
      setFormData({
        decision_notes: `Application approved for ${application.tenant_name}`,
        start_date: startDate,
        end_date: endDate.toISOString().split('T')[0],
        monthly_rent: monthlyRent.toFixed(2),
        security_deposit: securityDeposit.toFixed(2),
        room_id: defaultRoomId,
        property_id: property.id,
      });
      
      setSelectedProperty(property);
      setFilteredRooms(availableRooms);
      setErrors({});
    }
  }, [isOpen, application, property, availableRooms]);

  // Update filtered rooms when property changes
  useEffect(() => {
    if (selectedProperty) {
      const propertyRooms = allRooms.filter(room => 
        room.property_ref === selectedProperty.id && room.is_vacant
      );
      setFilteredRooms(propertyRooms);
      
      // Reset room selection if current room is not available in new property
      if (formData.room_id && !propertyRooms.some(room => room.id === formData.room_id)) {
        setFormData(prev => ({
          ...prev,
          room_id: propertyRooms.length > 0 ? propertyRooms[0].id : undefined
        }));
      }
      
      // Update rent based on property/room selection
      if (selectedProperty.rent_type === 'per_property') {
        const propertyRent = typeof selectedProperty.monthly_rent === 'string' 
          ? parseFloat(selectedProperty.monthly_rent) 
          : selectedProperty.monthly_rent || 0;
        setFormData(prev => ({
          ...prev,
          monthly_rent: propertyRent.toFixed(2),
          security_deposit: (propertyRent * 2).toFixed(2)
        }));
      } else if (propertyRooms.length > 0) {
        const firstRoom = propertyRooms[0];
        const roomRent = typeof firstRoom.monthly_rent === 'string' 
          ? parseFloat(firstRoom.monthly_rent) 
          : firstRoom.monthly_rent || 0;
        setFormData(prev => ({
          ...prev,
          monthly_rent: roomRent.toFixed(2),
          security_deposit: (roomRent * 2).toFixed(2)
        }));
      }
    }
  }, [selectedProperty, allRooms, formData.room_id]);

  // Update rent when room selection changes
  useEffect(() => {
    if (formData.room_id && selectedProperty?.rent_type === 'per_room') {
      const selectedRoom = filteredRooms.find(room => room.id === formData.room_id);
      if (selectedRoom) {
        const roomRent = typeof selectedRoom.monthly_rent === 'string' 
          ? parseFloat(selectedRoom.monthly_rent) 
          : selectedRoom.monthly_rent || 0;
        setFormData(prev => ({
          ...prev,
          monthly_rent: roomRent.toFixed(2),
          security_deposit: (roomRent * 2).toFixed(2)
        }));
      }
    }
  }, [formData.room_id, filteredRooms, selectedProperty?.rent_type]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'property_id') {
      const newProperty = allProperties.find(p => p.id === parseInt(value));
      setSelectedProperty(newProperty || null);
      setFormData(prev => ({
        ...prev,
        property_id: parseInt(value),
        room_id: undefined, // Reset room when property changes
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'room_id' ? (value ? parseInt(value) : undefined) : value
      }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!application) {
      newErrors.application = 'Application data is missing';
      setErrors(newErrors);
      return false;
    }
    
    if (!formData.property_id) {
      newErrors.property_id = 'Property selection is required';
    }
    
    // Validate lease details for all applications
    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }
    
    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    } else if (formData.start_date && new Date(formData.end_date) <= new Date(formData.start_date)) {
      newErrors.end_date = 'End date must be after start date';
    }
    
    if (!formData.monthly_rent) {
      newErrors.monthly_rent = 'Monthly rent is required';
    } else if (parseFloat(formData.monthly_rent) <= 0) {
      newErrors.monthly_rent = 'Monthly rent must be greater than 0';
    }
    
    if (!formData.security_deposit) {
      newErrors.security_deposit = 'Security deposit is required';
    } else if (parseFloat(formData.security_deposit) < 0) {
      newErrors.security_deposit = 'Security deposit cannot be negative';
    }
    
    if (selectedProperty?.rent_type === 'per_room' && !formData.room_id) {
      newErrors.room_id = 'Room assignment is required for per-room rentals';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('ApplicationApprovalModal handleSubmit called');
    
    if (!application) {
      console.error('No application found');
      return;
    }
    
    console.log('Validating form...');
    if (!validateForm()) {
      console.error('Form validation failed');
      return;
    }
    
    console.log('Form validation passed, creating approval data...');
    const approvalData = {
      decision: 'approve' as const,
      decision_notes: formData.decision_notes || undefined,
      start_date: formData.start_date,
      end_date: formData.end_date,
      monthly_rent: formData.monthly_rent,
      security_deposit: formData.security_deposit,
      room_id: formData.room_id,
      property_id: formData.property_id,
    };
    
    console.log('Calling onApprove with data:', approvalData);
    onApprove(application.id, approvalData);
  };

  if (!isOpen || !application) return null;

  console.log('ApplicationApprovalModal rendering with:', {
    isOpen,
    application: application?.id,
    selectedProperty: selectedProperty?.id,
    allProperties: allProperties.length,
    allRooms: allRooms.length
  });

  const isPerProperty = selectedProperty?.rent_type === 'per_property';

  return (
    <div className="modal-overlay">
      <div className="modal-content approval-modal">
        <div className="modal-header">
          <h2>Generate Lease & Assign Room</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="application-summary">
            <h3>Application Summary</h3>
            <div className="summary-row">
              <span className="label">Tenant:</span>
              <span className="value">{application.tenant_name}</span>
            </div>
            <div className="summary-row">
              <span className="label">Email:</span>
              <span className="value">{application.tenant_email}</span>
            </div>
            <div className="summary-row">
              <span className="label">Applied Date:</span>
              <span className="value">{new Date(application.created_at).toLocaleDateString()}</span>
            </div>
            <div className="summary-row">
              <span className="label">Budget:</span>
              <span className="value">${application.rent_budget || 'Not specified'}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="approval-form">
            {/* Property Selection */}
            <div className="form-section">
              <h4>Property & Room Assignment</h4>
              
              <div className="form-group">
                <label htmlFor="property_id">Property *</label>
                <select
                  id="property_id"
                  name="property_id"
                  value={formData.property_id || ''}
                  onChange={handleInputChange}
                  className={errors.property_id ? 'error' : ''}
                >
                  <option value="">Select a property...</option>
                  {allProperties.map(prop => (
                    <option key={prop.id} value={prop.id}>
                      {prop.name} ({prop.rent_type === 'per_room' ? 'Per Room' : 'Entire Property'})
                    </option>
                  ))}
                </select>
                {errors.property_id && <span className="error-message">{errors.property_id}</span>}
              </div>

              {selectedProperty && (
                <div className="property-info">
                  <div className="property-details">
                    <p><strong>Property:</strong> {selectedProperty.name}</p>
                    <p><strong>Type:</strong> {selectedProperty.rent_type === 'per_room' ? 'Per Room' : 'Entire Property'}</p>
                    <p><strong>Available Rooms:</strong> {filteredRooms.length}</p>
                  </div>
                </div>
              )}

              {selectedProperty?.rent_type === 'per_room' && (
                <div className="form-group">
                  <label htmlFor="room_id">Room Assignment *</label>
                  <select
                    id="room_id"
                    name="room_id"
                    value={formData.room_id || ''}
                    onChange={handleInputChange}
                    className={errors.room_id ? 'error' : ''}
                  >
                    <option value="">Select a room...</option>
                    {filteredRooms.map(room => (
                      <option key={room.id} value={room.id}>
                        {room.name} - ${typeof room.monthly_rent === 'string' ? room.monthly_rent : room.monthly_rent?.toFixed(2) || '0.00'}/month
                      </option>
                    ))}
                  </select>
                  {errors.room_id && <span className="error-message">{errors.room_id}</span>}
                  {filteredRooms.length === 0 && selectedProperty && (
                    <span className="info-message">No vacant rooms available in this property</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="form-section">
              <h3>Lease Details</h3>
              
              <div className="form-group">
                <label htmlFor="decision_notes">Approval Notes</label>
                <textarea
                  id="decision_notes"
                  name="decision_notes"
                  value={formData.decision_notes}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Add any notes about this approval..."
                />
              </div>

              {/* Show lease details for all applications, but with different labels */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="start_date">
                    {application.status === 'pending' ? 'Lease Start Date *' : 'Move-in Date *'}
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className={errors.start_date ? 'error' : ''}
                  />
                  {errors.start_date && <span className="error-message">{errors.start_date}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="end_date">
                    {application.status === 'pending' ? 'Lease End Date *' : 'Move-out Date *'}
                  </label>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className={errors.end_date ? 'error' : ''}
                  />
                  {errors.end_date && <span className="error-message">{errors.end_date}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="monthly_rent">Monthly Rent *</label>
                  <input
                    type="number"
                    id="monthly_rent"
                    name="monthly_rent"
                    value={formData.monthly_rent}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className={errors.monthly_rent ? 'error' : ''}
                    placeholder="0.00"
                  />
                  {errors.monthly_rent && <span className="error-message">{errors.monthly_rent}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="security_deposit">Security Deposit *</label>
                  <input
                    type="number"
                    id="security_deposit"
                    name="security_deposit"
                    value={formData.security_deposit}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className={errors.security_deposit ? 'error' : ''}
                    placeholder="0.00"
                  />
                  {errors.security_deposit && <span className="error-message">{errors.security_deposit}</span>}
                </div>
              </div>

              {/* Show info message for viewing_completed applications */}
              {(application.status === 'viewing_completed' || application.status === 'processing') && (
                <div className="info-section">
                  <div className="info-message">
                    <svg className="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p><strong>Review & Finalize Lease Details</strong></p>
                      <p>Details have been auto-filled from the application and selected property/room. Please review and modify as needed before generating the lease.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-approve">
                {application.status === 'viewing_completed' || application.status === 'processing' 
                  ? 'Generate Lease' 
                  : 'Approve Application'}
              </button>
            </div>
          </form>
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
          max-width: 600px;
          width: 90%;
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
        
        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6b7280;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .close-button:hover {
          color: #374151;
        }
        
        .modal-body {
          padding: 20px;
        }
        
        .application-summary {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 24px;
        }
        
        .application-summary h3 {
          margin: 0 0 12px 0;
          color: #1f2937;
          font-size: 16px;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .summary-row:last-child {
          margin-bottom: 0;
        }
        
        .label {
          font-weight: 500;
          color: #6b7280;
        }
        
        .value {
          color: #1f2937;
        }
        
        .form-section h3 {
          margin: 0 0 16px 0;
          color: #1f2937;
          font-size: 16px;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
        }
        
        .form-group label {
          margin-bottom: 4px;
          font-weight: 500;
          color: #374151;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .form-group input.error,
        .form-group select.error,
        .form-group textarea.error {
          border-color: #ef4444;
        }
        
        .error-message {
          color: #ef4444;
          font-size: 12px;
          margin-top: 4px;
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
          color: #374151;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .btn-secondary:hover {
          background: #f9fafb;
        }
        
        .btn-primary {
          padding: 8px 16px;
          border: none;
          background: #3b82f6;
          color: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .btn-primary:hover {
          background: #2563eb;
        }
        
        .property-info {
          background: #f0f9eb;
          border: 1px solid #a7d7c5;
          border-radius: 6px;
          padding: 12px 16px;
          margin-top: 16px;
          margin-bottom: 24px;
        }

        .property-details p {
          margin: 4px 0;
          color: #333;
        }

        .info-message {
          color: #6b7280;
          font-size: 14px;
          margin-top: 8px;
        }
        
        .info-section {
          background: #e0f2fe;
          border: 1px solid #bbdefb;
          border-radius: 6px;
          padding: 12px 16px;
          margin-top: 16px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
        }

        .info-message svg {
          width: 20px;
          height: 20px;
          margin-right: 10px;
          color: #2196f3;
        }

        .info-message p {
          margin: 0;
          color: #1976d2;
          font-weight: 500;
        }
        
        @media (max-width: 640px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }

        .btn-cancel {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-cancel:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }
        
        .btn-approve {
          padding: 8px 16px;
          border: none;
          background: #2563eb;
          color: white;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-approve:hover {
          background: #1d4ed8;
        }
      `}</style>
    </div>
  );
};

export default ApplicationApprovalModal; 