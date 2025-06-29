import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { ManagerWithProperties, Property, ManagerPropertyAssignment, ManagerLandlordRelationship } from '../lib/types';

interface PropertyAssignmentModalProps {
  manager: ManagerWithProperties;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function PropertyAssignmentModal({ 
  manager, 
  isOpen, 
  onClose, 
  onSave 
}: PropertyAssignmentModalProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [landlordProfile, setLandlordProfile] = useState<any>(null);
  const [assignments, setAssignments] = useState<ManagerPropertyAssignment[]>([]);
  const [relationships, setRelationships] = useState<ManagerLandlordRelationship[]>([]);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [determinedLandlordId, setDeterminedLandlordId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, manager.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For the Property Assignment Modal, we should use the assigned_properties 
      // that come with the manager data, not filter all properties by landlord.
      // The backend has already done the security filtering.
      
      console.log('Manager data:', manager);
      console.log('Manager assigned properties:', manager.assigned_properties);
      
      // Use the assigned properties directly from the manager data
      const managerAssignedProperties = manager.assigned_properties || [];
      
      // Fetch all properties to get full details for the assigned ones
      const propertiesResponse = await apiClient.getProperties();
      const allProperties = propertiesResponse.results || [];
      
      // Get full property details for the assigned properties
      const assignedPropertiesWithDetails = managerAssignedProperties.map(assignedProp => {
        const fullProperty = allProperties.find(p => p.id === assignedProp.id);
        return fullProperty;
      }).filter(Boolean) as Property[];
      
      console.log('Assigned properties with full details:', assignedPropertiesWithDetails);
      
      setAllProperties(allProperties);
      
      // For new assignment capabilities, we need to know what properties are available
      // from the same landlord. Get landlord ID from any assigned property
      let landlordId: number | null = null;
      if (assignedPropertiesWithDetails.length > 0) {
        landlordId = assignedPropertiesWithDetails[0].landlord;
        setDeterminedLandlordId(landlordId);
        console.log('Determined landlord ID from assigned properties:', landlordId);
        
        // Show ALL properties from the same landlord, not just assigned ones
        const landlordProperties = allProperties.filter(prop => prop.landlord === landlordId);
        setProperties(landlordProperties);
        console.log('Available properties from landlord:', landlordProperties.map(p => ({id: p.id, name: p.name})));
      } else {
        // If no assigned properties, we need to determine landlord from profile or other means
        console.log('No assigned properties found. Manager may not have any assignments yet.');
        
        // Try to get landlord profile
        try {
          const profile = await apiClient.getLandlordProfile();
          setLandlordProfile(profile);
          landlordId = profile?.id;
          setDeterminedLandlordId(landlordId);
          console.log('Using landlord ID from profile:', landlordId);
          
          if (landlordId) {
            // Show ALL properties from this landlord
            const landlordProperties = allProperties.filter(prop => prop.landlord === landlordId);
            setProperties(landlordProperties);
            console.log('Available properties from landlord profile:', landlordProperties.map(p => ({id: p.id, name: p.name})));
          }
        } catch (err) {
          console.log('Could not fetch landlord profile:', err);
        }
      }
      
      // Fetch manager-landlord relationships
      const relationshipsResponse = await apiClient.getManagerLandlordRelationships();
      setRelationships(relationshipsResponse);
      
      console.log('Manager-landlord relationships:', relationshipsResponse);
      console.log('Looking for relationships for manager ID:', manager.id);
      
      // Set currently selected properties based on what's assigned
      const currentAssignments = managerAssignedProperties.map(p => p.id);
      setSelectedPropertyIds(currentAssignments);
      
      console.log('Initial selected property IDs:', currentAssignments);
      
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyToggle = (propertyId: number) => {
    if (selectedPropertyIds.includes(propertyId)) {
      setSelectedPropertyIds(selectedPropertyIds.filter(id => id !== propertyId));
    } else {
      setSelectedPropertyIds([...selectedPropertyIds, propertyId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedPropertyIds.length === properties.length) {
      setSelectedPropertyIds([]);
    } else {
      setSelectedPropertyIds(properties.map(p => p.id));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      console.log('=== PROPERTY ASSIGNMENT SAVE STARTED ===');
      console.log('Manager:', manager);
      console.log('Selected Property IDs:', selectedPropertyIds);
      console.log('Available Properties:', properties.length);
      console.log('Current Relationships:', relationships);
      console.log('Landlord Profile:', landlordProfile);
      
      // Special handling for admin users
      if (manager.role === 'admin') {
        setError('Property assignments are not applicable to Platform Admin users. Admin users have access to all properties by default.');
        return;
      }
      
      // Find the manager's landlord relationship
      let managerRelationship = relationships.find(rel => rel.manager === manager.id);
      
      console.log('=== RELATIONSHIP LOOKUP ===');
      console.log('Looking for manager ID:', manager.id);
      console.log('Found relationship:', managerRelationship);
      console.log('All relationships:', relationships.map(r => ({ id: r.id, manager: r.manager, landlord: r.landlord })));
      
      // SPECIAL CASE: If no relationship found but manager has assigned properties,
      // get the relationship ID from existing assignments
      if (!managerRelationship && manager.assigned_properties && manager.assigned_properties.length > 0) {
        console.log('=== NO RELATIONSHIP FOUND BUT MANAGER HAS ASSIGNMENTS ===');
        try {
          const existingAssignments = await apiClient.getManagerPropertyAssignments();
          const managerAssignments = existingAssignments.filter(a => a.manager === manager.id);
          
          if (managerAssignments.length > 0) {
            const realRelationshipId = managerAssignments[0].landlord_relationship;
            console.log('Using relationship ID from existing assignments:', realRelationshipId);
            
            managerRelationship = {
              id: realRelationshipId,
              manager: manager.id,
              landlord: determinedLandlordId || 45, // Fallback to known landlord
              is_primary: false
            };
            console.log('Created relationship object from assignments:', managerRelationship);
          }
        } catch (err) {
          console.error('Failed to get relationship from assignments:', err);
        }
      }
      
      if (!managerRelationship) {
        setError(`No landlord relationship found for ${manager.full_name}. Please ensure this manager is properly linked to a landlord before assigning properties.`);
        return;
      }
      
      console.log('Using relationship ID:', managerRelationship.id);
      
      // Only consider properties owned by this landlord for assignments
      const currentAssignments = manager.assigned_properties?.filter(p => 
        properties.some(lp => lp.id === p.id)
      ).map(p => p.id) || [];
      
      const toAdd = selectedPropertyIds.filter(id => !currentAssignments.includes(id));
      const toRemove = currentAssignments.filter(id => !selectedPropertyIds.includes(id));
      
      console.log('Current assignments (landlord properties only):', currentAssignments);
      console.log('Properties to add:', toAdd);
      console.log('Properties to remove:', toRemove);
      
      // Add new assignments
      for (const propertyId of toAdd) {
        try {
          console.log(`Creating assignment: manager=${manager.id}, property=${propertyId}, relationship=${managerRelationship.id}`);
          await apiClient.createManagerPropertyAssignment({
            manager: manager.id,
            property: propertyId,
            landlord_relationship: managerRelationship.id,
            role_note: `Property Manager for ${manager.full_name}`
          });
          console.log(`Successfully assigned property ${propertyId} to manager ${manager.id}`);
        } catch (err: any) {
          console.error(`Failed to assign property ${propertyId}:`, err);
          
          // Handle new backend error codes for duplicate assignments
          if (err.response?.status === 400) {
            const errorData = err.response.data;
            
            // New backend response format for duplicate assignments
            if (errorData.code === 'already_assigned') {
              console.log(`Assignment already exists for property ${propertyId}, using existing assignment:`, errorData.existing_assignment);
              continue; // Skip to next property - this is OK
            }
            
            // Legacy error handling for existing unique constraint messages
            if (errorData.non_field_errors?.[0]?.includes('unique') ||
                errorData.detail?.includes('unique')) {
              console.log(`Assignment already exists for property ${propertyId} (legacy format), treating as success`);
              continue; // Skip to next property
            }
          }
          
          // For other errors, throw with better error message
          const errorMessage = err.response?.data?.detail || 
                              err.response?.data?.message || 
                              err.message || 
                              'Unknown error';
          throw new Error(`Failed to assign property ${propertyId}: ${errorMessage}`);
        }
      }
      
      // For removing assignments, we'd need to get the assignment IDs
      if (toRemove.length > 0) {
        try {
          const allAssignments = await apiClient.getManagerPropertyAssignments();
          const assignmentsToDelete = allAssignments.filter(
            assignment => assignment.manager === manager.id && toRemove.includes(assignment.property)
          );
          
          console.log('Assignments to delete:', assignmentsToDelete);
          
          for (const assignment of assignmentsToDelete) {
            await apiClient.deleteManagerPropertyAssignment(assignment.id);
          }
        } catch (err: any) {
          console.error('Failed to remove assignments:', err);
          throw new Error(`Failed to remove property assignments. ${err.message || 'Unknown error'}`);
        }
      }
      
      onSave();
      onClose();
      
    } catch (err: any) {
      console.error('=== FINAL ERROR CAUGHT ===');
      console.error('Error details:', err);
      console.error('Error message:', err?.message);
      console.error('Error response:', err?.response);
      console.error('Error stack:', err?.stack);
      console.error('Error saving assignments:', err);
      setError(err?.message || 'Failed to save assignments');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Manage Property Assignments</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          
          <div className="manager-info">
            <h3>{manager.full_name}</h3>
            <p className="text-muted">{manager.email}</p>
            <p className="access-info">
              Current Access: <span className={`access-badge ${manager.access_level}`}>
                {manager.access_level === 'full' ? 'Full Access' : 'Limited Access'}
              </span>
            </p>
          </div>

          {loading ? (
            <div className="loading-indicator">
              <div className="loading-spinner" />
              <p>Loading properties...</p>
            </div>
          ) : (
            <div className="property-assignment-section">
              <div className="section-header">
                <h4>Property Access ({selectedPropertyIds.length} of {properties.length} selected)</h4>
                <button 
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleSelectAll}
                >
                  {selectedPropertyIds.length === properties.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              
              <div className="property-list">
                {properties.map(property => (
                  <label key={property.id} className="property-item">
                    <input
                      type="checkbox"
                      checked={selectedPropertyIds.includes(property.id)}
                      onChange={() => handlePropertyToggle(property.id)}
                    />
                    <div className="property-details">
                      <strong>{property.name}</strong>
                      <p className="text-muted">{property.full_address}</p>
                      <small className="text-muted">
                        {property.total_rooms} rooms • {property.vacant_rooms} vacant
                      </small>
                    </div>
                  </label>
                ))}
              </div>
              
              {properties.length === 0 && (
                <p className="text-muted">No properties available.</p>
              )}
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? 'Saving...' : 'Save Changes'}
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
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: var(--radius-lg);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          display: flex;
          justify-content: between;
          align-items: center;
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--gray-200);
        }

        .modal-header h2 {
          margin: 0;
          flex: 1;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          padding: var(--spacing-xs);
          color: var(--gray-500);
        }

        .modal-close:hover {
          color: var(--gray-700);
        }

        .modal-body {
          padding: var(--spacing-lg);
          overflow-y: auto;
          flex: 1;
        }

        .manager-info {
          margin-bottom: var(--spacing-lg);
          padding-bottom: var(--spacing-md);
          border-bottom: 1px solid var(--gray-200);
        }

        .manager-info h3 {
          margin: 0 0 var(--spacing-xs) 0;
        }

        .access-info {
          margin-top: var(--spacing-sm);
        }

        .access-badge {
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
          font-weight: 600;
        }

        .access-badge.full {
          background-color: var(--success-green-light);
          color: var(--success-green-dark);
        }

        .access-badge.limited {
          background-color: var(--warning-amber-light);
          color: var(--warning-amber-dark);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }

        .section-header h4 {
          margin: 0;
        }

        .property-list {
          display: grid;
          gap: var(--spacing-sm);
          max-height: 300px;
          overflow-y: auto;
        }

        .property-item {
          display: flex;
          align-items: flex-start;
          gap: var(--spacing-sm);
          padding: var(--spacing-md);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s;
        }

        .property-item:hover {
          background-color: var(--gray-50);
          border-color: var(--primary-blue);
        }

        .property-item input[type="checkbox"] {
          margin-top: 2px;
        }

        .property-details {
          flex: 1;
        }

        .property-details strong {
          display: block;
          margin-bottom: var(--spacing-xs);
        }

        .property-details p {
          margin: 0 0 var(--spacing-xs) 0;
        }

        .property-details small {
          display: block;
        }

        .text-muted {
          color: var(--gray-600);
          font-size: 0.875rem;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-md);
          padding: var(--spacing-lg);
          border-top: 1px solid var(--gray-200);
        }

        .loading-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-xl);
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--gray-200);
          border-top-color: var(--primary-blue);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: var(--spacing-md);
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .alert {
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          margin-bottom: var(--spacing-lg);
        }

        .alert-error {
          background-color: var(--error-red-light);
          color: var(--error-red-dark);
          border: 1px solid var(--error-red);
        }
      `}</style>
    </div>
  );
} 