import { Property, Room, Lease, Tenant } from './types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface PropertyValidationContext {
  property: Property;
  rooms?: Room[];
  leases?: Lease[];
  tenants?: Tenant[];
}

/**
 * Comprehensive property validation before any major operations
 */
export const validatePropertyOperation = (
  operation: 'rent_type_conversion' | 'room_deletion' | 'property_deletion' | 'room_addition',
  context: PropertyValidationContext,
  operationData?: any
): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  switch (operation) {
    case 'rent_type_conversion':
      return validateRentTypeConversion(context, operationData);
    case 'room_deletion':
      return validateRoomDeletion(context, operationData);
    case 'property_deletion':
      return validatePropertyDeletion(context);
    case 'room_addition':
      return validateRoomAddition(context, operationData);
    default:
      result.errors.push('Unknown operation type');
      result.isValid = false;
  }

  return result;
};

/**
 * Validate rent type conversion prerequisites
 */
const validateRentTypeConversion = (
  context: PropertyValidationContext,
  conversionData: { newRentType: 'per_property' | 'per_room'; roomCount?: number }
): ValidationResult => {
  const { property, rooms = [], leases = [], tenants = [] } = context;
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  // Check if conversion is actually needed
  if (property.rent_type === conversionData.newRentType) {
    result.errors.push(`Property is already using ${conversionData.newRentType} rent structure.`);
    result.isValid = false;
    return result;
  }

  const activeLeases = leases.filter(l => 
    l.property_ref === property.id && 
    (l.status === 'active' || l.is_active)
  );

  // Converting TO per-room
  if (conversionData.newRentType === 'per_room') {
    if (!conversionData.roomCount || conversionData.roomCount < 1) {
      result.errors.push('Room count must be specified and greater than 0 for per-room conversion.');
      result.isValid = false;
    }

    if (conversionData.roomCount && conversionData.roomCount > 20) {
      result.warnings.push('Converting to more than 20 rooms may affect performance.');
    }

    const propertyLease = activeLeases.find(l => !l.room || l.room === 0);
    if (propertyLease) {
      const tenant = tenants.find(t => t.id === propertyLease.tenant);
      result.warnings.push(
        `Current tenant ${tenant?.full_name || 'Unknown'} will need to be assigned to specific room(s).`
      );
      result.suggestions.push('Consider which room(s) the current tenant should occupy.');
    }

    if (activeLeases.length === 0) {
      result.warnings.push('No active leases found. Conversion will create empty room structure.');
    }
  }

  // Converting TO per-property
  if (conversionData.newRentType === 'per_property') {
    const roomLeases = activeLeases.filter(l => l.room && l.room > 0);
    
    if (roomLeases.length > 1) {
      const uniqueTenants = new Set(roomLeases.map(l => l.tenant));
      if (uniqueTenants.size > 1) {
        result.warnings.push(
          `Multiple tenants (${uniqueTenants.size}) found across rooms. You'll need to decide how to handle this.`
        );
        result.suggestions.push('Options: Choose primary tenant, create joint lease, or complete current leases first.');
      }

      // Check for lease term conflicts
      const endDates = roomLeases
        .map(l => l.end_date)
        .filter(date => date)
        .map(date => new Date(date));

      if (endDates.length > 1) {
        const sortedDates = endDates.sort((a, b) => a.getTime() - b.getTime());
        const earliestEnd = sortedDates[0];
        const latestEnd = sortedDates[sortedDates.length - 1];
        const daysDifference = Math.ceil((latestEnd.getTime() - earliestEnd.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDifference > 30) {
          result.warnings.push(
            `Lease end dates vary by ${daysDifference} days. This may complicate property-level lease terms.`
          );
        }
      }
    }

    if (roomLeases.length === 0) {
      result.warnings.push('No room leases found. Conversion will create empty property structure.');
    }
  }

  return result;
};

/**
 * Validate room deletion
 */
const validateRoomDeletion = (
  context: PropertyValidationContext,
  deletionData: { roomIds: number[]; force?: boolean }
): ValidationResult => {
  const { property, rooms = [], leases = [], tenants = [] } = context;
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  if (property.rent_type !== 'per_room') {
    result.errors.push('Cannot delete rooms from a per-property rent structure.');
    result.isValid = false;
    return result;
  }

  const roomsToDelete = rooms.filter(r => deletionData.roomIds.includes(r.id));
  const remainingRooms = rooms.filter(r => !deletionData.roomIds.includes(r.id));

  if (remainingRooms.length === 0) {
    result.errors.push('Cannot delete all rooms. Property must have at least one room.');
    result.isValid = false;
  }

  // Check for occupied rooms
  const occupiedRooms = roomsToDelete.filter(room => {
    return leases.some(lease => 
      lease.room === room.id && 
      (lease.status === 'active' || lease.is_active)
    );
  });

  if (occupiedRooms.length > 0 && !deletionData.force) {
    const occupiedRoomNames = occupiedRooms.map(r => r.name).join(', ');
    result.errors.push(`Cannot delete occupied rooms: ${occupiedRoomNames}`);
    result.isValid = false;

    // Provide tenant relocation suggestions
    occupiedRooms.forEach(room => {
      const lease = leases.find(l => l.room === room.id && (l.status === 'active' || l.is_active));
      if (lease) {
        const tenant = tenants.find(t => t.id === lease.tenant);
        const vacantRooms = remainingRooms.filter(r => 
          !leases.some(l => l.room === r.id && (l.status === 'active' || l.is_active))
        );
        
        if (vacantRooms.length > 0) {
          result.suggestions.push(
            `Relocate ${tenant?.full_name || 'tenant'} from ${room.name} to: ${vacantRooms.map(r => r.name).join(', ')}`
          );
        } else {
          result.suggestions.push(
            `Complete lease for ${tenant?.full_name || 'tenant'} in ${room.name} before deletion`
          );
        }
      }
    });
  }

  // Warn about revenue impact
  const revenueImpact = occupiedRooms.reduce((sum, room) => {
    const lease = leases.find(l => l.room === room.id && (l.status === 'active' || l.is_active));
    return sum + (lease?.monthly_rent || 0);
  }, 0);

  if (revenueImpact > 0) {
    result.warnings.push(`Deleting these rooms will reduce monthly revenue by $${revenueImpact.toLocaleString()}`);
  }

  return result;
};

/**
 * Validate property deletion
 */
const validatePropertyDeletion = (context: PropertyValidationContext): ValidationResult => {
  const { property, rooms = [], leases = [] } = context;
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  const activeLeases = leases.filter(l => 
    l.property_ref === property.id && 
    (l.status === 'active' || l.is_active)
  );

  if (activeLeases.length > 0) {
    result.errors.push(`Cannot delete property with ${activeLeases.length} active lease(s).`);
    result.isValid = false;
    result.suggestions.push('Complete or terminate all leases before deleting the property.');
  }

  const totalRevenue = activeLeases.reduce((sum, lease) => sum + lease.monthly_rent, 0);
  if (totalRevenue > 0) {
    result.warnings.push(`This property generates $${totalRevenue.toLocaleString()} monthly revenue.`);
  }

  if (rooms.length > 0) {
    result.warnings.push(`This will permanently delete ${rooms.length} room(s) and all associated data.`);
  }

  return result;
};

/**
 * Validate room addition
 */
const validateRoomAddition = (
  context: PropertyValidationContext,
  additionData: { roomCount: number; roomNames?: string[] }
): ValidationResult => {
  const { property, rooms = [] } = context;
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  if (property.rent_type !== 'per_room') {
    result.errors.push('Cannot add individual rooms to a per-property rent structure.');
    result.isValid = false;
    result.suggestions.push('Convert to per-room rent structure first, or set room count during conversion.');
    return result;
  }

  const newTotalRooms = rooms.length + additionData.roomCount;
  
  if (newTotalRooms > 50) {
    result.errors.push('Maximum of 50 rooms per property allowed.');
    result.isValid = false;
  } else if (newTotalRooms > 20) {
    result.warnings.push('Properties with more than 20 rooms may affect performance.');
  }

  if (additionData.roomNames) {
    const duplicateNames = additionData.roomNames.filter(name => 
      rooms.some(room => room.name.toLowerCase() === name.toLowerCase())
    );
    
    if (duplicateNames.length > 0) {
      result.warnings.push(`Room names already exist: ${duplicateNames.join(', ')}`);
      result.suggestions.push('Consider using unique room names or numbering scheme.');
    }
  }

  return result;
};

/**
 * Validate lease assignment to room
 */
export const validateLeaseAssignment = (
  room: Room,
  tenant: Tenant,
  leaseData: { start_date: string; end_date?: string; monthly_rent: number },
  existingLeases: Lease[]
): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  // Check if room is already occupied
  const activeRoomLease = existingLeases.find(l => 
    l.room === room.id && 
    (l.status === 'active' || l.is_active)
  );

  if (activeRoomLease) {
    result.errors.push(`Room ${room.name} is already occupied.`);
    result.isValid = false;
    return result;
  }

  // Check if tenant has other active leases
  const activeTenantLeases = existingLeases.filter(l => 
    l.tenant === tenant.id && 
    (l.status === 'active' || l.is_active)
  );

  if (activeTenantLeases.length > 0) {
    result.warnings.push(`${tenant.full_name} already has ${activeTenantLeases.length} active lease(s).`);
  }

  // Validate lease dates
  const startDate = new Date(leaseData.start_date);
  const endDate = leaseData.end_date ? new Date(leaseData.end_date) : null;
  const today = new Date();

  if (startDate < today) {
    const daysPast = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysPast > 30) {
      result.warnings.push(`Lease start date is ${daysPast} days in the past.`);
    }
  }

  if (endDate && endDate <= startDate) {
    result.errors.push('Lease end date must be after start date.');
    result.isValid = false;
  }

  // Validate rent amount
  if (leaseData.monthly_rent <= 0) {
    result.errors.push('Monthly rent must be greater than $0.');
    result.isValid = false;
  }

  if (leaseData.monthly_rent > 50000) {
    result.warnings.push('Monthly rent exceeds $50,000. Please verify this amount.');
  }

  return result;
};

/**
 * Validate property structure consistency
 */
export const validatePropertyStructure = (
  property: Property,
  rooms: Room[],
  leases: Lease[]
): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  if (property.rent_type === 'per_room') {
    if (rooms.length === 0) {
      result.errors.push('Per-room property must have at least one room.');
      result.isValid = false;
    }

    // Check for room leases without corresponding rooms
    const roomIds = new Set(rooms.map(r => r.id));
    const orphanedLeases = leases.filter(l => 
      l.property_ref === property.id && 
      l.room && 
      l.room > 0 && 
      !roomIds.has(l.room)
    );

    if (orphanedLeases.length > 0) {
      result.warnings.push(`${orphanedLeases.length} lease(s) reference non-existent rooms.`);
      result.suggestions.push('Clean up orphaned lease data or restore missing rooms.');
    }
  } else {
    // Per-property structure
    const roomLeases = leases.filter(l => 
      l.property_ref === property.id && 
      l.room && 
      l.room > 0
    );

    if (roomLeases.length > 0) {
      result.warnings.push(`Per-property structure has ${roomLeases.length} room-level lease(s).`);
      result.suggestions.push('Consider converting to per-room structure or consolidating leases.');
    }
  }

  return result;
}; 