import { useState, useEffect } from 'react';
import { Property, Room, Lease, Tenant } from '../lib/types';
import { generateConversionPreview, executeConversion, TenantAssignment, ConversionData } from '../lib/dataMigration';
import { validatePropertyOperation } from '../lib/validationRules';
import { formatCurrency } from '../lib/utils';

interface RentTypeConversionWizardProps {
  property: Property;
  rooms: Room[];
  leases: Lease[];
  tenants: Tenant[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: (updatedProperty: Property) => void;
}

type WizardStep = 'overview' | 'structure' | 'assignment' | 'review' | 'executing' | 'complete';

export default function RentTypeConversionWizard({
  property,
  rooms,
  leases,
  tenants,
  isOpen,
  onClose,
  onComplete
}: RentTypeConversionWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('overview');
  const [newRentType, setNewRentType] = useState<'per_property' | 'per_room'>(
    property.rent_type === 'per_property' ? 'per_room' : 'per_property'
  );
  const [roomCount, setRoomCount] = useState(rooms.length || 2);
  const [roomNames, setRoomNames] = useState<string[]>([]);
  const [tenantAssignments, setTenantAssignments] = useState<TenantAssignment[]>([]);
  const [conversionData, setConversionData] = useState<ConversionData | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      initializeWizard();
    }
  }, [isOpen, property, rooms, leases, tenants]);

  const initializeWizard = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Generate conversion preview
      const previewData = await generateConversionPreview(
        property,
        newRentType,
        rooms,
        leases,
        tenants
      );
      setPreview(previewData);

      // Initialize room names for per-room conversion
      if (newRentType === 'per_room') {
        setRoomNames(Array.from({ length: roomCount }, (_, i) => `Room ${i + 1}`));
      }

      // Initialize tenant assignments
      initializeTenantAssignments();

    } catch (err: any) {
      setError(err.message || 'Failed to initialize conversion wizard');
    } finally {
      setLoading(false);
    }
  };

  const initializeTenantAssignments = () => {
    const activeLeases = leases.filter(l => 
      l.property_ref === property.id && (l.status === 'active' || l.is_active)
    );

    const assignments: TenantAssignment[] = activeLeases.map(lease => {
      const tenant = tenants.find(t => t.id === lease.tenant);
      return {
        tenantId: lease.tenant,
        tenantName: tenant?.full_name || `Tenant ${lease.tenant}`,
        currentRent: lease.monthly_rent,
        assignedRooms: [],
      };
    });

    setTenantAssignments(assignments);
  };

  const handleNext = () => {
    const steps: WizardStep[] = ['overview', 'structure', 'assignment', 'review', 'executing', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const steps: WizardStep[] = ['overview', 'structure', 'assignment', 'review', 'executing', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleExecuteConversion = async () => {
    setCurrentStep('executing');
    setLoading(true);
    setError(null);

    try {
      const conversionData: ConversionData = {
        newRentType,
        roomCount: newRentType === 'per_room' ? roomCount : undefined,
        roomNames: newRentType === 'per_room' ? roomNames : undefined,
        tenantAssignments,
        preserveRentAmounts: true
      };

      const result = await executeConversion(property, conversionData);
      
      if (result.success) {
        setCurrentStep('complete');
        if (result.newProperty) {
          onComplete(result.newProperty);
        }
      } else {
        setError(result.message);
        setCurrentStep('review');
      }
    } catch (err: any) {
      setError(err.message || 'Conversion failed');
      setCurrentStep('review');
    } finally {
      setLoading(false);
    }
  };

  const updateTenantAssignment = (tenantId: number, roomIds: number[], newRent?: number) => {
    setTenantAssignments(prev => prev.map(assignment => 
      assignment.tenantId === tenantId 
        ? { ...assignment, assignedRooms: roomIds, newRent }
        : assignment
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="conversion-wizard-overlay">
      <div className="conversion-wizard">
        {/* Header */}
        <div className="wizard-header">
          <h2 className="wizard-title">
            Convert Rent Structure
          </h2>
          <p className="wizard-subtitle">
            {property.rent_type === 'per_property' ? 'Per Property' : 'Per Room'} → {newRentType === 'per_property' ? 'Per Property' : 'Per Room'}
          </p>
          <button onClick={onClose} className="wizard-close">×</button>
        </div>

        {/* Progress Steps */}
        <div className="wizard-progress">
          {['Overview', 'Structure', 'Assignment', 'Review'].map((stepName, index) => {
            const stepKey = ['overview', 'structure', 'assignment', 'review'][index];
            const isActive = currentStep === stepKey;
            const isCompleted = ['overview', 'structure', 'assignment', 'review'].indexOf(currentStep) > index;
            
            return (
              <div key={stepKey} className={`progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                <div className="step-number">{index + 1}</div>
                <div className="step-name">{stepName}</div>
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="wizard-content">
          {currentStep === 'overview' && (
            <OverviewStep
              property={property}
              preview={preview}
              newRentType={newRentType}
              onRentTypeChange={setNewRentType}
            />
          )}

          {currentStep === 'structure' && newRentType === 'per_room' && (
            <StructureStep
              roomCount={roomCount}
              roomNames={roomNames}
              onRoomCountChange={setRoomCount}
              onRoomNamesChange={setRoomNames}
            />
          )}

          {currentStep === 'assignment' && (
            <TenantAssignmentStep
              property={property}
              tenantAssignments={tenantAssignments}
              roomCount={roomCount}
              roomNames={roomNames}
              newRentType={newRentType}
              onAssignmentChange={updateTenantAssignment}
            />
          )}

          {currentStep === 'review' && (
            <ReviewStep
              property={property}
              newRentType={newRentType}
              roomCount={roomCount}
              roomNames={roomNames}
              tenantAssignments={tenantAssignments}
              preview={preview}
            />
          )}

          {currentStep === 'executing' && (
            <ExecutingStep />
          )}

          {currentStep === 'complete' && (
            <CompleteStep
              property={property}
              newRentType={newRentType}
              onClose={onClose}
            />
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="wizard-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Navigation */}
        {currentStep !== 'executing' && currentStep !== 'complete' && (
          <div className="wizard-navigation">
            {currentStep !== 'overview' && (
              <button onClick={handlePrevious} className="btn btn-secondary">
                Previous
              </button>
            )}
            
            <div className="nav-spacer" />
            
            {currentStep === 'review' ? (
              <button onClick={handleExecuteConversion} className="btn btn-primary" disabled={loading}>
                {loading ? 'Converting...' : 'Execute Conversion'}
              </button>
            ) : (
              <button onClick={handleNext} className="btn btn-primary">
                Next
              </button>
            )}
          </div>
        )}
      </div>

      {/* Styles */}
      <style jsx>{`
        .conversion-wizard-overlay {
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

        .conversion-wizard {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .wizard-header {
          padding: 24px;
          border-bottom: 1px solid #e2e8f0;
          position: relative;
        }

        .wizard-title {
          font-size: 22px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .wizard-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .wizard-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: none;
          border: none;
          font-size: 24px;
          color: #64748b;
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
        }

        .wizard-close:hover {
          background: #f1f5f9;
          color: #1e293b;
        }

        .wizard-progress {
          display: flex;
          justify-content: space-between;
          padding: 20px 24px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          position: relative;
        }

        .progress-step:not(:last-child)::after {
          content: '';
          position: absolute;
          top: 16px;
          left: 50%;
          right: -50%;
          height: 2px;
          background: #e2e8f0;
          z-index: 1;
        }

        .progress-step.completed:not(:last-child)::after {
          background: #10b981;
        }

        .step-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #e2e8f0;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          position: relative;
          z-index: 2;
        }

        .progress-step.active .step-number {
          background: #4f46e5;
          color: white;
        }

        .progress-step.completed .step-number {
          background: #10b981;
          color: white;
        }

        .step-name {
          font-size: 12px;
          color: #64748b;
          margin-top: 8px;
          text-align: center;
        }

        .progress-step.active .step-name {
          color: #4f46e5;
          font-weight: 600;
        }

        .progress-step.completed .step-name {
          background: #10b981;
          color: white;
        }

        .wizard-content {
          padding: 24px;
          min-height: 300px;
        }

        .wizard-error {
          margin: 0 24px 20px;
          padding: 12px 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          color: #dc2626;
          font-size: 14px;
        }

        .wizard-navigation {
          display: flex;
          align-items: center;
          padding: 20px 24px;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .nav-spacer {
          flex: 1;
        }

        .btn {
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background: #4f46e5;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #3730a3;
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }

        .btn-secondary:hover {
          background: #e2e8f0;
        }
      `}</style>
    </div>
  );
}

// Step Components
function OverviewStep({ property, preview, newRentType, onRentTypeChange }: any) {
  return (
    <div className="overview-step">
      <h3>Current Property Structure</h3>
      <div className="current-state">
        <div className="state-card">
          <h4>Current: {property.rent_type === 'per_property' ? 'Per Property' : 'Per Room'}</h4>
          <p>Monthly Revenue: {formatCurrency(preview?.currentState?.revenue || 0)}</p>
          <p>Occupied Units: {preview?.currentState?.occupiedUnits || 0} of {preview?.currentState?.totalUnits || 0}</p>
        </div>
      </div>

      <h3>Proposed Changes</h3>
      <div className="rent-type-options">
        <label className={`rent-option ${newRentType === 'per_property' ? 'selected' : ''}`}>
          <input
            type="radio"
            value="per_property"
            checked={newRentType === 'per_property'}
            onChange={(e) => onRentTypeChange(e.target.value)}
          />
          <div className="option-content">
            <h4>Per Property</h4>
            <p>One rent amount for the entire property</p>
          </div>
        </label>
        
        <label className={`rent-option ${newRentType === 'per_room' ? 'selected' : ''}`}>
          <input
            type="radio"
            value="per_room"
            checked={newRentType === 'per_room'}
            onChange={(e) => onRentTypeChange(e.target.value)}
          />
          <div className="option-content">
            <h4>Per Room</h4>
            <p>Individual rent amounts for each room</p>
          </div>
        </label>
      </div>

      {preview?.warnings && preview.warnings.length > 0 && (
        <div className="warnings">
          <h4>⚠️ Important Notes:</h4>
          {preview.warnings.map((warning: string, idx: number) => (
            <p key={idx}>• {warning}</p>
          ))}
        </div>
      )}

      <style jsx>{`
        .overview-step h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 16px 0;
        }

        .state-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .state-card h4 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        .state-card p {
          font-size: 14px;
          color: #64748b;
          margin: 4px 0;
        }

        .rent-type-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }

        .rent-option {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .rent-option:hover {
          border-color: #cbd5e1;
        }

        .rent-option.selected {
          border-color: #4f46e5;
          background: #eff6ff;
        }

        .option-content h4 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .option-content p {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .warnings {
          background: #fffbeb;
          border: 1px solid #fcd34d;
          border-radius: 8px;
          padding: 16px;
        }

        .warnings h4 {
          font-size: 16px;
          font-weight: 600;
          color: #92400e;
          margin: 0 0 8px 0;
        }

        .warnings p {
          font-size: 14px;
          color: #92400e;
          margin: 4px 0;
        }
      `}</style>
    </div>
  );
}

function StructureStep({ roomCount, roomNames, onRoomCountChange, onRoomNamesChange }: any) {
  const updateRoomName = (index: number, name: string) => {
    const newNames = [...roomNames];
    newNames[index] = name;
    onRoomNamesChange(newNames);
  };

  const handleRoomCountChange = (count: number) => {
    onRoomCountChange(count);
    // Adjust room names array
    const newNames = Array.from({ length: count }, (_, i) => 
      roomNames[i] || `Room ${i + 1}`
    );
    onRoomNamesChange(newNames);
  };

  return (
    <div className="structure-step">
      <h3>Define Room Structure</h3>
      
      <div className="room-count-section">
        <label>Number of Rooms</label>
        <select 
          value={roomCount} 
          onChange={(e) => handleRoomCountChange(parseInt(e.target.value))}
        >
          {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
            <option key={num} value={num}>{num} {num === 1 ? 'Room' : 'Rooms'}</option>
          ))}
        </select>
      </div>

      <div className="room-names-section">
        <label>Room Names</label>
        <div className="room-names-grid">
          {Array.from({ length: roomCount }, (_, index) => (
            <input
              key={index}
              type="text"
              placeholder={`Room ${index + 1}`}
              value={roomNames[index] || ''}
              onChange={(e) => updateRoomName(index, e.target.value)}
            />
          ))}
        </div>
      </div>

      <div className="preview-section">
        <h4>Preview</h4>
        <p>{roomCount} rooms will be created: {roomNames.filter(n => n).join(', ') || Array.from({ length: roomCount }, (_, i) => `Room ${i + 1}`).join(', ')}</p>
      </div>

      <style jsx>{`
        .structure-step h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 24px 0;
        }

        .room-count-section {
          margin-bottom: 24px;
        }

        .room-count-section label {
          display: block;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .room-count-section select {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          width: 200px;
        }

        .room-names-section label {
          display: block;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .room-names-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }

        .room-names-grid input {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }

        .preview-section {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          padding: 16px;
        }

        .preview-section h4 {
          font-size: 16px;
          font-weight: 600;
          color: #0c4a6e;
          margin: 0 0 8px 0;
        }

        .preview-section p {
          font-size: 14px;
          color: #075985;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

function TenantAssignmentStep({ property, tenantAssignments, roomCount, roomNames, newRentType, onAssignmentChange }: any) {
  if (tenantAssignments.length === 0) {
    return (
      <div className="assignment-step">
        <h3>Tenant Assignment</h3>
        <p>No active tenants found. Room structure will be created without tenant assignments.</p>
      </div>
    );
  }

  return (
    <div className="assignment-step">
      <h3>Tenant Assignment</h3>
      <p>Assign current tenants to their new accommodations:</p>
      
      {tenantAssignments.map((assignment: TenantAssignment) => (
        <div key={assignment.tenantId} className="tenant-assignment">
          <div className="tenant-info">
            <h4>{assignment.tenantName}</h4>
            <p>Current rent: {formatCurrency(assignment.currentRent)}</p>
          </div>
          
          {newRentType === 'per_room' && (
            <div className="room-selection">
              <label>Assign to room(s):</label>
              <div className="room-checkboxes">
                {Array.from({ length: roomCount }, (_, index) => {
                  const roomName = roomNames[index] || `Room ${index + 1}`;
                  const roomId = index + 1; // Temporary ID for new rooms
                  
                  return (
                    <label key={index} className="room-checkbox">
                      <input
                        type="checkbox"
                        checked={assignment.assignedRooms.includes(roomId)}
                        onChange={(e) => {
                          const newRooms = e.target.checked
                            ? [...assignment.assignedRooms, roomId]
                            : assignment.assignedRooms.filter(id => id !== roomId);
                          onAssignmentChange(assignment.tenantId, newRooms);
                        }}
                      />
                      {roomName}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ))}

      <style jsx>{`
        .assignment-step h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 16px 0;
        }

        .tenant-assignment {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .tenant-info h4 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .tenant-info p {
          font-size: 14px;
          color: #64748b;
          margin: 0 0 16px 0;
        }

        .room-selection label {
          display: block;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .room-checkboxes {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 8px;
        }

        .room-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: normal;
          margin-bottom: 0;
        }

        .room-checkbox input {
          margin: 0;
        }
      `}</style>
    </div>
  );
}

function ReviewStep({ property, newRentType, roomCount, roomNames, tenantAssignments, preview }: any) {
  const totalAssignedRent = tenantAssignments.reduce((sum: number, assignment: TenantAssignment) => 
    sum + (assignment.newRent || assignment.currentRent), 0
  );

  return (
    <div className="review-step">
      <h3>Review Conversion</h3>
      
      <div className="review-summary">
        <div className="summary-section">
          <h4>Property Changes</h4>
          <p><strong>From:</strong> {property.rent_type === 'per_property' ? 'Per Property' : 'Per Room'}</p>
          <p><strong>To:</strong> {newRentType === 'per_property' ? 'Per Property' : 'Per Room'}</p>
          {newRentType === 'per_room' && (
            <p><strong>Rooms:</strong> {roomCount} rooms will be created</p>
          )}
        </div>

        <div className="summary-section">
          <h4>Revenue Impact</h4>
          <p><strong>Current:</strong> {formatCurrency(preview?.currentState?.revenue || 0)}</p>
          <p><strong>After:</strong> {formatCurrency(totalAssignedRent)}</p>
          <p><strong>Change:</strong> {formatCurrency(totalAssignedRent - (preview?.currentState?.revenue || 0))}</p>
        </div>

        {tenantAssignments.length > 0 && (
          <div className="summary-section">
            <h4>Tenant Assignments</h4>
            {tenantAssignments.map((assignment: TenantAssignment) => (
              <div key={assignment.tenantId} className="tenant-summary">
                <p><strong>{assignment.tenantName}</strong></p>
                {newRentType === 'per_room' && (
                  <p>Rooms: {assignment.assignedRooms.map(id => roomNames[id - 1] || `Room ${id}`).join(', ')}</p>
                )}
                <p>Rent: {formatCurrency(assignment.newRent || assignment.currentRent)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="confirmation">
        <h4>⚠️ Important</h4>
        <p>This conversion will modify your property structure and lease arrangements. Please review all details carefully before proceeding.</p>
      </div>

      <style jsx>{`
        .review-step h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 24px 0;
        }

        .review-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .summary-section {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
        }

        .summary-section h4 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 12px 0;
        }

        .summary-section p {
          font-size: 14px;
          color: #64748b;
          margin: 4px 0;
        }

        .tenant-summary {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 8px;
        }

        .tenant-summary p {
          margin: 2px 0;
        }

        .confirmation {
          background: #fffbeb;
          border: 1px solid #fcd34d;
          border-radius: 8px;
          padding: 16px;
        }

        .confirmation h4 {
          font-size: 16px;
          font-weight: 600;
          color: #92400e;
          margin: 0 0 8px 0;
        }

        .confirmation p {
          font-size: 14px;
          color: #92400e;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

function ExecutingStep() {
  return (
    <div className="executing-step">
      <div className="loading-animation">
        <div className="spinner"></div>
        <h3>Converting Property Structure</h3>
        <p>Please wait while we safely migrate your property data...</p>
      </div>

      <style jsx>{`
        .executing-step {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
        }

        .loading-animation {
          text-align: center;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #4f46e5;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-animation h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        .loading-animation p {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

function CompleteStep({ property, newRentType, onClose }: any) {
  return (
    <div className="complete-step">
      <div className="success-content">
        <div className="success-icon">✅</div>
        <h3>Conversion Complete!</h3>
        <p>
          Your property has been successfully converted to {newRentType === 'per_property' ? 'per-property' : 'per-room'} rent structure.
        </p>
        
        <div className="next-steps">
          <h4>Next Steps:</h4>
          <ul>
            {newRentType === 'per_room' && (
              <>
                <li>Review and customize individual room rent amounts</li>
                <li>Set security deposits for each room</li>
                <li>Update room descriptions and amenities</li>
              </>
            )}
            {newRentType === 'per_property' && (
              <>
                <li>Review the consolidated property lease</li>
                <li>Update property-level amenities and description</li>
                <li>Verify tenant contact information</li>
              </>
            )}
            <li>Update any property listings or marketing materials</li>
          </ul>
        </div>

        <button onClick={onClose} className="btn btn-primary">
          View Property
        </button>
      </div>

      <style jsx>{`
        .complete-step {
          text-align: center;
          padding: 40px 20px;
        }

        .success-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .success-content h3 {
          font-size: 22px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 12px 0;
        }

        .success-content p {
          font-size: 16px;
          color: #64748b;
          margin: 0 0 24px 0;
        }

        .next-steps {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
          text-align: left;
        }

        .next-steps h4 {
          font-size: 16px;
          font-weight: 600;
          color: #166534;
          margin: 0 0 8px 0;
        }

        .next-steps ul {
          margin: 0;
          padding-left: 20px;
        }

        .next-steps li {
          font-size: 14px;
          color: #166534;
          margin-bottom: 4px;
        }

        .btn {
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          background: #4f46e5;
          color: white;
          transition: all 0.2s ease;
        }

        .btn:hover {
          background: #3730a3;
        }
      `}</style>
    </div>
  );
} 