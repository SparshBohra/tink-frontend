import { Application, Room, Property } from './types';

// Priority scoring configuration
const PRIORITY_WEIGHTS = {
  DAYS_PENDING: 0.4,
  BUDGET_COMPATIBILITY: 0.3,
  MOVE_IN_URGENCY: 0.2,
  ROOM_AVAILABILITY: 0.1
};

// Calculate priority score for an application (0-100)
export const calculatePriorityScore = (
  application: Application,
  availableRooms: Room[],
  averageRent: number
): number => {
  let score = 0;
  
  // Days pending factor (more days = higher priority)
  const daysPending = application.days_pending || 0;
  const daysPendingScore = Math.min(daysPending * 5, 40); // Max 40 points for 8+ days
  score += daysPendingScore * PRIORITY_WEIGHTS.DAYS_PENDING;
  
  // Budget compatibility factor
  const rentBudget = application.rent_budget || 0;
  let budgetScore = 0;
  if (rentBudget > 0) {
    const budgetRatio = rentBudget / averageRent;
    if (budgetRatio >= 1.2) budgetScore = 30; // High budget
    else if (budgetRatio >= 1.0) budgetScore = 25; // Good budget
    else if (budgetRatio >= 0.8) budgetScore = 20; // Reasonable budget
    else budgetScore = 10; // Low budget
  }
  score += budgetScore * PRIORITY_WEIGHTS.BUDGET_COMPATIBILITY;
  
  // Move-in urgency factor
  const moveInDate = application.desired_move_in_date;
  let urgencyScore = 0;
  if (moveInDate) {
    const moveInDays = Math.ceil((new Date(moveInDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (moveInDays <= 7) urgencyScore = 20; // Very urgent
    else if (moveInDays <= 14) urgencyScore = 15; // Urgent
    else if (moveInDays <= 30) urgencyScore = 10; // Soon
    else urgencyScore = 5; // Later
  }
  score += urgencyScore * PRIORITY_WEIGHTS.MOVE_IN_URGENCY;
  
  // Room availability factor
  const propertyRooms = availableRooms.filter(room => room.property_ref === application.property_ref);
  const availableCount = propertyRooms.filter(room => room.is_vacant).length;
  const availabilityScore = availableCount > 0 ? 10 : 0;
  score += availabilityScore * PRIORITY_WEIGHTS.ROOM_AVAILABILITY;
  
  return Math.round(Math.min(score, 100));
};

// Determine urgency level based on priority score
export const getUrgencyLevel = (priorityScore: number): 'low' | 'medium' | 'high' => {
  if (priorityScore >= 80) return 'high';
  if (priorityScore >= 60) return 'medium';
  return 'low';
};

// Detect conflicts between applications
export const detectConflicts = (applications: Application[]): Application[] => {
  const conflictMap = new Map<string, Application[]>();
  
  // Group applications by property
  applications.filter(app => app.status === 'pending' || app.status === 'processing').forEach(app => {
    const key = `${app.property_ref}`;
    if (!conflictMap.has(key)) {
      conflictMap.set(key, []);
    }
    conflictMap.get(key)!.push(app);
  });
  
  // Mark applications with conflicts
  const conflictingApps: Application[] = [];
  conflictMap.forEach((apps, property) => {
    if (apps.length > 1) {
      apps.forEach(app => {
        app.has_conflicts = true;
        app.conflicting_applications = apps.filter(a => a.id !== app.id).map(a => a.id);
        conflictingApps.push(app);
      });
    }
  });
  
  return conflictingApps;
};

// Calculate room compatibility score
export const calculateRoomCompatibility = (
  application: Application,
  room: Room
): number => {
  let score = 0;
  const maxScore = 100;
  
  // Budget compatibility (40 points)
  const rentBudget = application.rent_budget || 0;
  const roomRent = typeof room.monthly_rent === 'string' ? parseFloat(room.monthly_rent) : (room.monthly_rent || 0);
  
  if (rentBudget > 0 && roomRent > 0) {
    const budgetRatio = roomRent / rentBudget;
    if (budgetRatio <= 0.8) score += 40; // Great value
    else if (budgetRatio <= 0.9) score += 35; // Good value
    else if (budgetRatio <= 1.0) score += 30; // Fair value
    else if (budgetRatio <= 1.1) score += 20; // Slight stretch
    else score += 10; // Over budget
  }
  
  // Availability (30 points)
  if (room.is_vacant) score += 30;
  
  // Capacity utilization (20 points)
  const utilizationRate = room.current_occupancy / room.max_capacity;
  if (utilizationRate < 0.5) score += 20; // Low occupancy
  else if (utilizationRate < 0.8) score += 15; // Medium occupancy
  else score += 10; // High occupancy
  
  // Room can add tenant (10 points)
  if (room.can_add_tenant) score += 10;
  
  return Math.min(score, maxScore);
};

// Get recommended rooms for an application
export const getRecommendedRooms = (
  application: Application,
  rooms: Room[],
  minCompatibilityScore: number = 60
): Room[] => {
  const propertyRooms = rooms.filter(room => room.property_ref === application.property_ref);
  
  const roomsWithScores = propertyRooms.map(room => ({
    ...room,
    compatibility_score: calculateRoomCompatibility(application, room)
  }));
  
  return roomsWithScores
    .filter(room => room.compatibility_score >= minCompatibilityScore)
    .sort((a, b) => b.compatibility_score - a.compatibility_score)
    .slice(0, 3); // Top 3 recommendations
};

// Check if application budget is compatible with property
export const isBudgetCompatible = (
  application: Application,
  rooms: Room[]
): boolean => {
  const rentBudget = application.rent_budget || 0;
  if (rentBudget <= 0) return false;
  
  const propertyRooms = rooms.filter(room => room.property_ref === application.property_ref);
  const minRent = Math.min(...propertyRooms.map(room => {
    const rent = typeof room.monthly_rent === 'string' ? parseFloat(room.monthly_rent) : (room.monthly_rent || 0);
    return rent;
  }));
  
  return rentBudget >= minRent * 0.9; // Allow 10% flexibility
};

// Format priority score for display
export const formatPriorityScore = (score: number): string => {
  if (score >= 90) return `${score} - Critical`;
  if (score >= 80) return `${score} - High`;
  if (score >= 60) return `${score} - Medium`;
  if (score >= 40) return `${score} - Low`;
  return `${score} - Very Low`;
};

// Get status display text with enhanced formatting
export const getStatusDisplayText = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'pending': 'Pending Review',
    'processing': 'Under Review',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'withdrawn': 'Withdrawn',
    'lease_created': 'Lease Created',
    'moved_in': 'Moved In',
    'active': 'Active Lease'
  };
  
  return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
};

// Enhanced application with calculated fields
export const enhanceApplication = (
  application: Application,
  rooms: Room[],
  averageRent: number
): Application => {
  const availableRooms = rooms.filter(room => room.is_vacant);
  const priorityScore = calculatePriorityScore(application, availableRooms, averageRent);
  const urgencyLevel = getUrgencyLevel(priorityScore);
  const budgetCompatible = isBudgetCompatible(application, rooms);
  const recommendedRooms = getRecommendedRooms(application, rooms);
  
  return {
    ...application,
    priority_score: priorityScore,
    urgency_level: urgencyLevel,
    is_budget_compatible: budgetCompatible,
    recommended_rooms: recommendedRooms.map(room => room.id),
    match_score: recommendedRooms.length > 0 ? recommendedRooms[0].compatibility_score : 0,
  };
};

// Enhanced Dashboard Analytics Functions
export const calculateProcessingTimeMetrics = (applications: Application[]) => {
  const processedApplications = applications.filter(app => 
    app.status === 'approved' || app.status === 'rejected' || app.status === 'lease_created'
  );
  
  if (processedApplications.length === 0) {
    return {
      averageProcessingTime: 0,
      medianProcessingTime: 0,
      fastestProcessingTime: 0,
      slowestProcessingTime: 0,
      totalProcessed: 0
    };
  }
  
  const processingTimes = processedApplications.map(app => app.days_pending || 0);
  const sortedTimes = processingTimes.sort((a, b) => a - b);
  
  const averageProcessingTime = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
  const medianProcessingTime = sortedTimes[Math.floor(sortedTimes.length / 2)];
  const fastestProcessingTime = sortedTimes[0];
  const slowestProcessingTime = sortedTimes[sortedTimes.length - 1];
  
  return {
    averageProcessingTime: Math.round(averageProcessingTime * 10) / 10,
    medianProcessingTime,
    fastestProcessingTime,
    slowestProcessingTime,
    totalProcessed: processedApplications.length
  };
};

export const calculatePipelineMetrics = (applications: Application[]) => {
  const statusCounts = {
    pending: 0,
    processing: 0,
    approved: 0,
    rejected: 0,
    lease_created: 0,
    moved_in: 0,
    active: 0,
    withdrawn: 0
  };
  
  applications.forEach(app => {
    if (statusCounts.hasOwnProperty(app.status)) {
      statusCounts[app.status as keyof typeof statusCounts]++;
    }
  });
  
  const total = applications.length;
  const conversionRate = total > 0 ? ((statusCounts.approved + statusCounts.lease_created + statusCounts.moved_in + statusCounts.active) / total) * 100 : 0;
  const rejectionRate = total > 0 ? (statusCounts.rejected / total) * 100 : 0;
  const activeRate = total > 0 ? ((statusCounts.processing + statusCounts.pending) / total) * 100 : 0;
  
  return {
    statusCounts,
    total,
    conversionRate: Math.round(conversionRate * 10) / 10,
    rejectionRate: Math.round(rejectionRate * 10) / 10,
    activeRate: Math.round(activeRate * 10) / 10
  };
};

export const calculateEfficiencyMetrics = (applications: Application[]) => {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  
  const thisWeekApplications = applications.filter(app => 
    new Date(app.created_at) >= oneWeekAgo
  );
  
  const lastWeekApplications = applications.filter(app => {
    const createdAt = new Date(app.created_at);
    return createdAt >= twoWeeksAgo && createdAt < oneWeekAgo;
  });
  
  const thisWeekProcessed = applications.filter(app => {
    const updatedAt = new Date(app.updated_at);
    return updatedAt >= oneWeekAgo && (app.status === 'approved' || app.status === 'rejected');
  });
  
  const lastWeekProcessed = applications.filter(app => {
    const updatedAt = new Date(app.updated_at);
    return updatedAt >= twoWeeksAgo && updatedAt < oneWeekAgo && (app.status === 'approved' || app.status === 'rejected');
  });
  
  // Calculate trends
  const applicationTrend = thisWeekApplications.length - lastWeekApplications.length;
  const processingTrend = thisWeekProcessed.length - lastWeekProcessed.length;
  
  // Calculate daily throughput
  const dailyThroughput = thisWeekProcessed.length / 7;
  
  // Calculate backlog (pending applications older than 7 days)
  const backlogApplications = applications.filter(app => 
    (app.status === 'pending' || app.status === 'processing') && 
    (app.days_pending || 0) > 7
  );
  
  return {
    thisWeekApplications: thisWeekApplications.length,
    lastWeekApplications: lastWeekApplications.length,
    thisWeekProcessed: thisWeekProcessed.length,
    lastWeekProcessed: lastWeekProcessed.length,
    applicationTrend,
    processingTrend,
    dailyThroughput: Math.round(dailyThroughput * 10) / 10,
    backlogCount: backlogApplications.length,
    backlogApplications
  };
};

export const calculatePriorityDistribution = (applications: Application[]) => {
  const priorityRanges = {
    critical: 0,    // 90-100
    high: 0,        // 80-89
    medium: 0,      // 60-79
    low: 0,         // 40-59
    minimal: 0      // 0-39
  };
  
  applications.forEach(app => {
    const score = app.priority_score || 0;
    if (score >= 90) priorityRanges.critical++;
    else if (score >= 80) priorityRanges.high++;
    else if (score >= 60) priorityRanges.medium++;
    else if (score >= 40) priorityRanges.low++;
    else priorityRanges.minimal++;
  });
  
  return priorityRanges;
};

export const calculatePropertyPerformance = (applications: Application[], properties: any[]) => {
  const propertyStats = properties.map(property => {
    const propertyApplications = applications.filter(app => app.property_ref === property.id);
    const pendingCount = propertyApplications.filter(app => app.status === 'pending' || app.status === 'processing').length;
    const approvedCount = propertyApplications.filter(app => app.status === 'approved' || app.status === 'lease_created').length;
    const rejectedCount = propertyApplications.filter(app => app.status === 'rejected').length;
    
    const totalCount = propertyApplications.length;
    const approvalRate = totalCount > 0 ? (approvedCount / totalCount) * 100 : 0;
    
    const avgProcessingTime = propertyApplications.length > 0 
      ? propertyApplications.reduce((sum, app) => sum + (app.days_pending || 0), 0) / propertyApplications.length 
      : 0;
    
    return {
      propertyId: property.id,
      propertyName: property.name,
      totalApplications: totalCount,
      pendingApplications: pendingCount,
      approvedApplications: approvedCount,
      rejectedApplications: rejectedCount,
      approvalRate: Math.round(approvalRate * 10) / 10,
      avgProcessingTime: Math.round(avgProcessingTime * 10) / 10,
      vacantRooms: property.rooms?.filter((room: any) => room.status === 'vacant').length || 0
    };
  });
  
  return propertyStats;
}; 