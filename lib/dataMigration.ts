import { Property, Room, Lease, Tenant } from './types';
import { apiClient } from './api';

export interface ConversionPreview {
  currentState: {
    rentType: 'per_property' | 'per_room';
    revenue: number;
    occupiedUnits: number;
    totalUnits: number;
    tenants: { id: number; name: string; rent: number }[];
  };
  proposedState: {
    rentType: 'per_property' | 'per_room';
    estimatedRevenue: number;
    proposedUnits: number;
    migrationSteps: string[];
  };
  warnings: string[];
  blockers: string[];
}

export interface TenantAssignment {
  tenantId: number;
  tenantName: string;
  currentRent: number;
  assignedRooms: number[]; // Room IDs
  newRent?: number;
}

export interface ConversionData {
  newRentType: 'per_property' | 'per_room';
  roomCount?: number;
  roomNames?: string[];
  tenantAssignments: TenantAssignment[];
  preserveRentAmounts: boolean;
}

/**
 * Generate a preview of what will happen during rent type conversion
 */
export const generateConversionPreview = async (
  property: Property,
  newRentType: 'per_property' | 'per_room',
  rooms: Room[] = [],
  leases: Lease[] = [],
  tenants: Tenant[] = []
): Promise<ConversionPreview> => {
  try {
    // Try using the backend API for preview generation
    const previewData = await apiClient.validatePropertyOperation(property.id, 'rent_type_conversion', {
      newRentType,
      rooms,
      leases,
      tenants
    });
    
    return previewData;
  } catch (error) {
    // Fallback to client-side preview generation
    console.warn('Backend preview failed, using client-side preview:', error);
    return generateClientSidePreview(property, newRentType, rooms, leases, tenants);
  }
};

/**
 * Client-side preview generation (fallback)
 */
const generateClientSidePreview = (
  property: Property,
  newRentType: 'per_property' | 'per_room',
  rooms: Room[] = [],
  leases: Lease[] = [],
  tenants: Tenant[] = []
): ConversionPreview => {
  const currentLeases = leases.filter(l => l.property_ref === property.id);
  const currentRevenue = currentLeases.reduce((sum, lease) => sum + lease.monthly_rent, 0);
  
  const warnings: string[] = [];
  const blockers: string[] = [];
  const migrationSteps: string[] = [];

  if (property.rent_type === newRentType) {
    blockers.push(`Property is already using ${newRentType} rent structure.`);
  }

  let currentState, proposedState;

  if (property.rent_type === 'per_property') {
    // Current: Per Property
    const propertyLease = currentLeases.find(l => !l.room || l.room === 0);
    const tenant = propertyLease ? tenants.find(t => t.id === propertyLease.tenant) : null;

    currentState = {
      rentType: 'per_property' as const,
      revenue: currentRevenue,
      occupiedUnits: propertyLease ? 1 : 0,
      totalUnits: 1,
      tenants: tenant ? [{
        id: tenant.id,
        name: tenant.full_name,
        rent: propertyLease!.monthly_rent
      }] : []
    };

    if (newRentType === 'per_room') {
      migrationSteps.push('1. Create room structure for the property');
      migrationSteps.push('2. Assign current tenant to selected room(s)');
      migrationSteps.push('3. Migrate lease data to room-level leases');
      migrationSteps.push('4. Update property rent type');

      if (!propertyLease) {
        warnings.push('No active property lease found. Conversion will create empty room structure.');
      } else if (!tenant) {
        warnings.push('Tenant information not found. Manual tenant assignment may be required.');
      }

      proposedState = {
        rentType: 'per_room' as const,
        estimatedRevenue: currentRevenue,
        proposedUnits: rooms.length || 2, // Default to 2 rooms if not specified
        migrationSteps
      };
    }
  } else {
    // Current: Per Room
    const roomLeases = currentLeases.filter(l => l.room && l.room > 0);
    const tenantData = roomLeases.map(lease => {
      const tenant = tenants.find(t => t.id === lease.tenant);
      return {
        id: lease.tenant,
        name: tenant?.full_name || `Tenant ${lease.tenant}`,
        rent: lease.monthly_rent
      };
    });

    currentState = {
      rentType: 'per_room' as const,
      revenue: currentRevenue,
      occupiedUnits: roomLeases.length,
      totalUnits: rooms.length,
      tenants: tenantData
    };

    if (newRentType === 'per_property') {
      if (roomLeases.length === 0) {
        migrationSteps.push('1. Create property-level lease structure');
        migrationSteps.push('2. Update property rent type');
        warnings.push('No room leases found. Conversion will create empty property structure.');
      } else if (roomLeases.length === 1) {
        migrationSteps.push('1. Convert room lease to property lease');
        migrationSteps.push('2. Update lease details');
        migrationSteps.push('3. Update property rent type');
      } else {
        migrationSteps.push('1. Consolidate multiple room leases');
        migrationSteps.push('2. Handle tenant conflicts');
        migrationSteps.push('3. Create unified property lease');
        migrationSteps.push('4. Update property rent type');
        
        const uniqueTenants = new Set(roomLeases.map(l => l.tenant));
        if (uniqueTenants.size > 1) {
          warnings.push(`Multiple tenants found (${uniqueTenants.size}). You'll need to choose how to handle this.`);
        }
      }

      proposedState = {
        rentType: 'per_property' as const,
        estimatedRevenue: currentRevenue,
        proposedUnits: 1,
        migrationSteps
      };
    }
  }

  if (!currentState || !proposedState) {
    blockers.push('Invalid conversion configuration.');
    return {
      currentState: {
        rentType: property.rent_type,
        revenue: 0,
        occupiedUnits: 0,
        totalUnits: 0,
        tenants: []
      },
      proposedState: {
        rentType: newRentType as 'per_property' | 'per_room',
        estimatedRevenue: 0,
        proposedUnits: 0,
        migrationSteps: []
      },
      warnings,
      blockers
    };
  }

  return {
    currentState,
    proposedState,
    warnings,
    blockers
  };
};

/**
 * Execute the actual rent type conversion with data migration
 */
export const executeConversion = async (
  property: Property,
  conversionData: ConversionData
): Promise<{ success: boolean; message: string; newProperty?: Property }> => {
  try {
    console.log('Executing rent type conversion:', conversionData);

    if (property.rent_type === conversionData.newRentType) {
      return { success: false, message: 'Property already uses this rent type.' };
    }

    // Use the new backend API endpoint for rent type conversion
    const result = await apiClient.executeRentTypeConversion(property.id, conversionData);
    
    if (result.success) {
      return {
        success: true,
        message: result.message || 'Conversion completed successfully',
        newProperty: result.property
      };
    } else {
      return {
        success: false,
        message: result.message || 'Conversion failed'
      };
    }
  } catch (error: any) {
    console.error('Conversion failed:', error);
    return { 
      success: false, 
      message: error.message || 'Conversion failed due to an unexpected error.' 
    };
  }
};

/**
 * Convert from per-property to per-room
 */
const convertToPerRoom = async (
  property: Property,
  conversionData: ConversionData
): Promise<{ success: boolean; message: string; newProperty?: Property }> => {
  // Step 1: Update property rent type
  const updatedProperty = await apiClient.updateProperty(property.id, {
    rent_type: 'per_room',
    monthly_rent: '', // Clear property-level rent
  });

  // Step 2: Create rooms if they don't exist
  if (conversionData.roomCount && conversionData.roomCount > 0) {
    for (let i = 0; i < conversionData.roomCount; i++) {
      const roomName = conversionData.roomNames?.[i] || `Room ${i + 1}`;
      await apiClient.createRoom({
        property_ref: property.id,
        name: roomName,
        room_type: 'bedroom',
        monthly_rent: 0,
        security_deposit: 0,
      });
    }
  }

  // Step 3: Migrate tenant assignments
  for (const assignment of conversionData.tenantAssignments) {
    for (const roomId of assignment.assignedRooms) {
      // Create lease for each assigned room
      await apiClient.createLease({
        tenant: assignment.tenantId,
        room: roomId,
        property_ref: property.id,
        start_date: new Date().toISOString().split('T')[0], // Today
        end_date: '', // To be set by user
        monthly_rent: assignment.newRent || assignment.currentRent,
        security_deposit: 0, // To be set by user
        status: 'active'
      });
    }
  }

  return {
    success: true,
    message: `Successfully converted property to per-room structure with ${conversionData.roomCount} rooms.`,
    newProperty: updatedProperty
  };
};

/**
 * Convert from per-room to per-property
 */
const convertToPerProperty = async (
  property: Property,
  conversionData: ConversionData
): Promise<{ success: boolean; message: string; newProperty?: Property }> => {
  // Calculate total rent from tenant assignments
  const totalRent = conversionData.tenantAssignments.reduce(
    (sum, assignment) => sum + (assignment.newRent || assignment.currentRent), 
    0
  );

  // Step 1: Update property rent type and set rent amount
  const updatedProperty = await apiClient.updateProperty(property.id, {
    rent_type: 'per_property',
    monthly_rent: String(totalRent),
  });

  // Step 2: Create property-level lease
  if (conversionData.tenantAssignments.length === 1) {
    const assignment = conversionData.tenantAssignments[0];
    await apiClient.createLease({
      tenant: assignment.tenantId,
      room: 0, // Property-level lease
      property_ref: property.id,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      monthly_rent: assignment.newRent || assignment.currentRent,
      security_deposit: 0,
      status: 'active'
    });
  }

  // Step 3: Archive old room leases (this would need an API endpoint)
  // For now, we'll leave them as-is with a note that manual cleanup may be needed

  return {
    success: true,
    message: `Successfully converted property to per-property structure with total rent of $${totalRent}.`,
    newProperty: updatedProperty
  };
};

/**
 * Validate conversion prerequisites
 */
export const validateConversionPrerequisites = async (
  property: Property,
  newRentType: 'per_property' | 'per_room'
): Promise<{ canConvert: boolean; issues: string[] }> => {
  const issues: string[] = [];

  // Check for active applications that might be affected
  try {
    const applications = await apiClient.getApplications({ property: property.id });
    const pendingApps = applications.results?.filter(app => app.status === 'pending') || [];
    
    if (pendingApps.length > 0) {
      issues.push(`${pendingApps.length} pending applications may be affected by this conversion.`);
    }
  } catch (error) {
    console.warn('Could not check applications:', error);
  }

  // Check for conflicting lease dates
  try {
    const leases = await apiClient.getLeases({ property: property.id });
    const activeLeases = leases.results?.filter(lease => 
      lease.status === 'active' || lease.is_active
    ) || [];

    if (newRentType === 'per_property' && activeLeases.length > 1) {
      const endDates = activeLeases
        .map(l => l.end_date)
        .filter(date => date)
        .map(date => new Date(date));
      
      if (endDates.length > 1) {
        const hasConflictingDates = endDates.some((date, idx) => 
          endDates.some((otherDate, otherIdx) => 
            idx !== otherIdx && Math.abs(date.getTime() - otherDate.getTime()) > 7 * 24 * 60 * 60 * 1000
          )
        );
        
        if (hasConflictingDates) {
          issues.push('Multiple leases have different end dates. Conversion may require manual lease term adjustment.');
        }
      }
    }
  } catch (error) {
    console.warn('Could not check leases:', error);
  }

  return {
    canConvert: issues.length === 0,
    issues
  };
}; 