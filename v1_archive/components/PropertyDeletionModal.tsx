import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { Property, Room, Lease } from '../lib/types';
import { validatePropertyOperation } from '../lib/validationRules';

interface PropertyDeletionModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
}

interface ValidationResult {
  canDelete: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  requiresCleanup: boolean;
  inconsistencies?: any;
  activeLeases?: Lease[];
  orphanedRooms?: Room[];
}

export default function PropertyDeletionModal({
  property,
  isOpen,
  onClose,
  onDelete
}: PropertyDeletionModalProps) {
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [showForceDelete, setShowForceDelete] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [step, setStep] = useState<'validate' | 'confirm' | 'cleanup'>('validate');

  useEffect(() => {
    if (isOpen) {
      validateDeletion();
    }
  }, [isOpen, property.id]);

  const validateDeletion = async () => {
    try {
      setValidating(true);
      setError(null);
      
      console.log('Validating property deletion for:', property.id);

      // Get rooms and leases for frontend validation
      const rooms = await apiClient.getPropertyRooms(property.id);
      const leasesResponse = await apiClient.getLeases({ property: property.id });
      const leases = leasesResponse.results || [];

      // Try backend validation first, but fallback to frontend if API doesn't exist
      let backendValidation: any = null;
      let inconsistencies: any = null;

      try {
        backendValidation = await apiClient.validatePropertyDeletion(property.id);
        console.log('Backend validation succeeded:', backendValidation);
      } catch (backendErr: any) {
        console.log('Backend validation not available, using frontend validation only');
        if (backendErr.response?.status !== 404) {
          console.error('Backend validation failed:', backendErr);
        }
      }

      try {
        inconsistencies = await apiClient.getPropertyInconsistencies(property.id);
        console.log('Inconsistency check succeeded:', inconsistencies);
      } catch (inconsErr: any) {
        console.log('Backend inconsistency check not available');
        if (inconsErr.response?.status !== 404) {
          console.error('Inconsistency check failed:', inconsErr);
          setError('Could not verify property data integrity. Please try again.');
        }
      }

      // Run frontend validation
      const frontendValidation = validatePropertyOperation('property_deletion', {
        property,
        rooms,
        leases
      });

      // Combine backend and frontend results
      const result: ValidationResult = {
        canDelete: backendValidation ? 
          (backendValidation.can_delete && frontendValidation.isValid) : 
          frontendValidation.isValid,
        errors: [
          ...(backendValidation?.errors || []), 
          ...frontendValidation.errors
        ],
        warnings: [
          ...(backendValidation?.warnings || []), 
          ...frontendValidation.warnings
        ],
        suggestions: [
          ...(backendValidation?.suggestions || []), 
          ...frontendValidation.suggestions
        ],
        requiresCleanup: backendValidation?.requires_cleanup || 
          inconsistencies?.has_inconsistencies || 
          false,
        inconsistencies: inconsistencies,
        activeLeases: leases.filter(l => l.status === 'active' || l.is_active),
        orphanedRooms: rooms.filter(r => 
          backendValidation?.valid_rooms ? 
            !backendValidation.valid_rooms.includes(r.id) : 
            false
        )
      };

      console.log('Final validation result:', result);
      setValidation(result);

      if (result.errors.length === 0 && !result.requiresCleanup) {
        setStep('confirm');
      } else if (result.requiresCleanup) {
        setStep('cleanup');
      }

    } catch (err: any) {
      console.error('Validation failed:', err);
      setError(`Validation failed: ${err.message || 'Unknown error'}`);
      
      // Fallback: allow force deletion if validation completely fails
      setShowForceDelete(true);
    } finally {
      setValidating(false);
    }
  };

  const handleCleanup = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Starting property cleanup...');
      
      try {
        const cleanupResult = await apiClient.cleanupPropertyData(property.id);
        console.log('Cleanup completed:', cleanupResult);
        
        // Re-validate after cleanup
        await validateDeletion();
      } catch (cleanupErr: any) {
        console.log('Backend cleanup not available, proceeding with force delete option');
        if (cleanupErr.response?.status !== 404) {
          console.error('Cleanup failed:', cleanupErr);
        }
        setShowForceDelete(true);
        setStep('confirm');
      }
      
    } catch (err: any) {
      console.error('Cleanup process failed:', err);
      setError(err.message || 'Failed to cleanup property data');
      setShowForceDelete(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (force = false) => {
    try {
      setLoading(true);
      setError(null);

      if (force) {
        console.log('Force deleting property...');
        try {
          await apiClient.forceDeleteProperty(property.id);
        } catch (forceErr: any) {
          console.log('Force delete API not available, using regular delete');
          if (forceErr.response?.status !== 404) {
            throw forceErr;
          }
          await apiClient.deleteProperty(property.id);
        }
      } else {
        console.log('Deleting property normally...');
        await apiClient.deleteProperty(property.id);
      }

      console.log('Property deleted successfully');
      onDelete();
      onClose();

    } catch (err: any) {
      console.error('Deletion failed:', err);
      setError(err.message || 'Failed to delete property');
      
      if (!force) {
        setShowForceDelete(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = () => {
    if (confirmText.toLowerCase() === property.name.toLowerCase()) {
      handleDelete(false);
    } else {
      setError('Property name confirmation does not match');
    }
  };

  const handleForceDelete = () => {
    if (confirmText.toLowerCase() === property.name.toLowerCase()) {
      handleDelete(true);
    } else {
      setError('Property name confirmation does not match');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h2 className="modal-title">Delete Property</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert alert-error">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="property-info">
            <h3>{property.name}</h3>
            <p className="text-muted">{property.full_address}</p>
          </div>

          {validating && (
            <div className="loading-section">
              <div className="loading-spinner" />
              <p>Validating property deletion...</p>
            </div>
          )}

          {validation && step === 'validate' && (
            <div className="validation-results">
              {validation.errors.length > 0 && (
                <div className="validation-section errors">
                  <h4>❌ Issues Preventing Deletion</h4>
                  <ul>
                    {validation.errors.map((error, index) => (
                      <li key={index} className="error-item">{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.warnings.length > 0 && (
                <div className="validation-section warnings">
                  <h4>⚠️ Warnings</h4>
                  <ul>
                    {validation.warnings.map((warning, index) => (
                      <li key={index} className="warning-item">{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.suggestions.length > 0 && (
                <div className="validation-section suggestions">
                  <h4>💡 Suggestions</h4>
                  <ul>
                    {validation.suggestions.map((suggestion, index) => (
                      <li key={index} className="suggestion-item">{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.activeLeases && validation.activeLeases.length > 0 && (
                <div className="validation-section active-leases">
                  <h4>📄 Active Leases ({validation.activeLeases.length})</h4>
                  <div className="lease-list">
                    {validation.activeLeases.map(lease => (
                      <div key={lease.id} className="lease-item">
                        <span>Tenant {lease.tenant}</span>
                        <span>${lease.monthly_rent}/mo</span>
                        <span>{lease.start_date} - {lease.end_date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {validation.orphanedRooms && validation.orphanedRooms.length > 0 && (
                <div className="validation-section orphaned-rooms">
                  <h4>🏠 Orphaned Rooms ({validation.orphanedRooms.length})</h4>
                  <div className="room-list">
                    {validation.orphanedRooms.map(room => (
                      <div key={room.id} className="room-item">
                        <span>{room.name}</span>
                        <span className="room-status">Needs cleanup</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'cleanup' && (
            <div className="cleanup-section">
              <h4>🔧 Property Cleanup Required</h4>
              <p>This property has data inconsistencies that need to be resolved before deletion:</p>
              
              {validation?.inconsistencies && (
                <div className="inconsistency-details">
                  {validation.inconsistencies.orphaned_rooms && (
                    <p>• {validation.inconsistencies.orphaned_rooms} orphaned room(s)</p>
                  )}
                  {validation.inconsistencies.invalid_leases && (
                    <p>• {validation.inconsistencies.invalid_leases} invalid lease(s)</p>
                  )}
                  {validation.inconsistencies.missing_references && (
                    <p>• Missing data references</p>
                  )}
                </div>
              )}
              
              <p className="cleanup-note">
                Click "Cleanup Data" to automatically resolve these issues, then deletion will proceed normally.
              </p>
            </div>
          )}

          {step === 'confirm' && (
            <div className="confirmation-section">
              <div className="danger-warning">
                <h4>⚠️ This action cannot be undone</h4>
                <p>This will permanently delete the property and all associated data.</p>
              </div>
              
              <div className="confirmation-input">
                <label>Type the property name to confirm:</label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={property.name}
                  className="form-input"
                />
              </div>
            </div>
          )}

          {showForceDelete && (
            <div className="force-delete-section">
              <div className="danger-warning">
                <h4>🚨 Force Delete</h4>
                <p>Standard deletion failed. You can force delete this property, but this may leave orphaned data.</p>
              </div>
              
              <div className="confirmation-input">
                <label>Type the property name to confirm force deletion:</label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={property.name}
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
          
          {step === 'cleanup' && (
            <button
              onClick={handleCleanup}
              className="btn btn-warning"
              disabled={loading}
            >
              {loading ? 'Cleaning up...' : 'Cleanup Data'}
            </button>
          )}
          
          {step === 'confirm' && (
            <button
              onClick={handleConfirmDelete}
              className="btn btn-danger"
              disabled={loading || confirmText.toLowerCase() !== property.name.toLowerCase()}
            >
              {loading ? 'Deleting...' : 'Delete Property'}
            </button>
          )}
          
          {showForceDelete && (
            <button
              onClick={handleForceDelete}
              className="btn btn-danger"
              disabled={loading || confirmText.toLowerCase() !== property.name.toLowerCase()}
            >
              {loading ? 'Force Deleting...' : 'Force Delete'}
            </button>
          )}
        </div>

        <style jsx>{`
          .modal-content.large {
            max-width: 700px;
            max-height: 80vh;
            overflow-y: auto;
          }

          .property-info {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 20px;
          }

          .property-info h3 {
            margin: 0 0 4px 0;
            color: #212529;
          }

          .validation-results {
            max-height: 400px;
            overflow-y: auto;
            margin: 20px 0;
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

          .validation-section.warnings {
            background: #fffbeb;
            border-left-color: #f59e0b;
          }

          .validation-section.suggestions {
            background: #f0f9ff;
            border-left-color: #3b82f6;
          }

          .validation-section h4 {
            margin: 0 0 12px 0;
            font-size: 16px;
          }

          .validation-section ul {
            margin: 0;
            padding-left: 20px;
          }

          .validation-section li {
            margin-bottom: 8px;
            line-height: 1.4;
          }

          .lease-list, .room-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .lease-item, .room-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: white;
            border-radius: 4px;
            font-size: 14px;
          }

          .cleanup-section, .confirmation-section, .force-delete-section {
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }

          .cleanup-section {
            background: #fffbeb;
            border: 1px solid #fed7aa;
          }

          .confirmation-section, .force-delete-section {
            background: #fef2f2;
            border: 1px solid #fecaca;
          }

          .danger-warning h4 {
            color: #dc2626;
            margin: 0 0 8px 0;
          }

          .confirmation-input {
            margin-top: 16px;
          }

          .confirmation-input label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
          }

          .cleanup-note {
            font-style: italic;
            color: #92400e;
            margin-top: 12px;
          }

          .inconsistency-details {
            margin: 12px 0;
            font-family: monospace;
            font-size: 14px;
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