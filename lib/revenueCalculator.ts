import { Property, Room, Lease } from './types';

export interface RevenueCalculation {
  monthlyRevenue: number;
  projectedAnnualRevenue: number;
  occupiedUnits: number;
  totalUnits: number;
  occupancyRate: number;
  revenueBreakdown: {
    source: string;
    amount: number;
    tenant?: string;
    room?: string;
  }[];
}

/**
 * Unified revenue calculator that handles both per-property and per-room rent structures
 * Fixes the $0 revenue display issue by properly calculating revenue based on rent type
 */
export const calculatePropertyRevenue = (
  property: Property,
  leases: Lease[],
  rooms: Room[] = []
): RevenueCalculation => {
  console.log(`Calculating revenue for property ${property.id} (${property.rent_type})`);
  
  if (property.rent_type === 'per_property') {
    return calculatePerPropertyRevenue(property, leases);
  } else {
    return calculatePerRoomRevenue(property, leases, rooms);
  }
};

/**
 * Calculate revenue for per-property rent structure
 */
const calculatePerPropertyRevenue = (
  property: Property,
  leases: Lease[]
): RevenueCalculation => {
  // Find active property-level lease
  const propertyLease = leases.find(lease => 
    lease.property_ref === property.id && 
    (!lease.room || lease.room === 0) &&
    isLeaseActive(lease)
  );

  const monthlyRevenue = propertyLease?.monthly_rent || 0;
  const occupiedUnits = propertyLease ? 1 : 0;
  const totalUnits = 1; // Entire property is one unit
  
  return {
    monthlyRevenue,
    projectedAnnualRevenue: monthlyRevenue * 12,
    occupiedUnits,
    totalUnits,
    occupancyRate: occupiedUnits / totalUnits * 100,
    revenueBreakdown: propertyLease ? [{
      source: 'Property Lease',
      amount: monthlyRevenue,
      tenant: `Tenant ${propertyLease.tenant}`, // We'd need to join with tenant data for name
    }] : []
  };
};

/**
 * Calculate revenue for per-room rent structure
 */
const calculatePerRoomRevenue = (
  property: Property,
  leases: Lease[],
  rooms: Room[]
): RevenueCalculation => {
  // Find all active room leases for this property
  const roomLeases = leases.filter(lease => 
    lease.property_ref === property.id && 
    lease.room && 
    lease.room > 0 &&
    isLeaseActive(lease)
  );

  const monthlyRevenue = roomLeases.reduce((sum, lease) => sum + lease.monthly_rent, 0);
  const occupiedUnits = roomLeases.length;
  const totalUnits = rooms.length || property.total_rooms || 1;
  
  const revenueBreakdown = roomLeases.map(lease => {
    const room = rooms.find(r => r.id === lease.room);
    return {
      source: 'Room Lease',
      amount: lease.monthly_rent,
      tenant: `Tenant ${lease.tenant}`,
      room: room?.name || `Room ${lease.room}`
    };
  });

  return {
    monthlyRevenue,
    projectedAnnualRevenue: monthlyRevenue * 12,
    occupiedUnits,
    totalUnits,
    occupancyRate: totalUnits > 0 ? (occupiedUnits / totalUnits * 100) : 0,
    revenueBreakdown
  };
};

/**
 * Check if a lease is currently active
 */
const isLeaseActive = (lease: Lease): boolean => {
  const now = new Date();
  const startDate = new Date(lease.start_date);
  const endDate = lease.end_date ? new Date(lease.end_date) : null;
  
  // Lease is active if:
  // 1. It has started (start_date <= now)
  // 2. It hasn't ended (end_date is null or end_date >= now)
  // 3. Status is active or is_active is true
  const hasStarted = startDate <= now;
  const hasNotEnded = !endDate || endDate >= now;
  const statusActive = lease.status === 'active' || lease.is_active === true;
  
  return hasStarted && hasNotEnded && statusActive;
};

/**
 * Calculate revenue for multiple properties
 */
export const calculatePortfolioRevenue = (
  properties: Property[],
  allLeases: Lease[],
  allRooms: Room[]
): RevenueCalculation => {
  const initialValue: RevenueCalculation = {
    monthlyRevenue: 0,
    projectedAnnualRevenue: 0,
    occupiedUnits: 0,
    totalUnits: 0,
    occupancyRate: 0,
    revenueBreakdown: []
  };

  const portfolioCalculation = properties.reduce((portfolio: RevenueCalculation, property: Property) => {
    const propertyRooms = allRooms.filter(room => room.property_ref === property.id);
    const propertyLeases = allLeases.filter(lease => lease.property_ref === property.id);
    
    const calculation = calculatePropertyRevenue(property, propertyLeases, propertyRooms);
    
    return {
      monthlyRevenue: portfolio.monthlyRevenue + calculation.monthlyRevenue,
      projectedAnnualRevenue: portfolio.projectedAnnualRevenue + calculation.projectedAnnualRevenue,
      occupiedUnits: portfolio.occupiedUnits + calculation.occupiedUnits,
      totalUnits: portfolio.totalUnits + calculation.totalUnits,
      occupancyRate: 0, // Will be calculated after
      revenueBreakdown: [...portfolio.revenueBreakdown, ...calculation.revenueBreakdown]
    };
  }, initialValue);

  // Calculate overall occupancy rate
  portfolioCalculation.occupancyRate = portfolioCalculation.totalUnits > 0 
    ? (portfolioCalculation.occupiedUnits / portfolioCalculation.totalUnits * 100)
    : 0;

  return portfolioCalculation;
};

/**
 * Get occupancy statistics for a property
 */
export const getOccupancyStats = (
  property: Property,
  leases: Lease[],
  rooms: Room[] = []
) => {
  const calculation = calculatePropertyRevenue(property, leases, rooms);
  
  return {
    totalUnits: calculation.totalUnits,
    occupiedUnits: calculation.occupiedUnits,
    vacantUnits: calculation.totalUnits - calculation.occupiedUnits,
    occupancyRate: calculation.occupancyRate.toFixed(1)
  };
};

/**
 * Format currency for display
 */
export const formatRevenue = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Get revenue trend analysis (placeholder for future enhancement)
 */
export const getRevenueTrend = (
  property: Property,
  leases: Lease[],
  rooms: Room[] = []
): { trend: 'up' | 'down' | 'stable'; percentage: number } => {
  // For now, return stable - this would be enhanced with historical data
  return { trend: 'stable', percentage: 0 };
}; 