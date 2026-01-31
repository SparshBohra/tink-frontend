export const mockProperties = [
  {
    id: 1,
    name: "Castro Commons",
    address: "123 Castro St, San Francisco, CA",
    type: "Co-living House",
    totalRooms: 6,
    occupiedRooms: 4,
  },
  {
    id: 2,
    name: "Mission Shared Living",
    address: "456 Mission St, San Francisco, CA", 
    type: "Shared Apartment",
    totalRooms: 4,
    occupiedRooms: 2,
  },
  {
    id: 3,
    name: "SOMA Tech House",
    address: "789 Howard St, San Francisco, CA",
    type: "Hacker House", 
    totalRooms: 8,
    occupiedRooms: 6,
  },
];

export const mockRooms = [
  // Castro Commons rooms
  { id: 1, propertyId: 1, name: "Room A", rent: 1200, occupied: true, tenantId: 1 },
  { id: 2, propertyId: 1, name: "Room B", rent: 1100, occupied: true, tenantId: 2 },
  { id: 3, propertyId: 1, name: "Room C", rent: 1300, occupied: false, tenantId: null },
  { id: 4, propertyId: 1, name: "Room D", rent: 1000, occupied: true, tenantId: 3 },
  { id: 5, propertyId: 1, name: "Room E", rent: 1150, occupied: true, tenantId: 4 },
  { id: 6, propertyId: 1, name: "Room F", rent: 1250, occupied: false, tenantId: null },
  
  // Mission Shared Living rooms
  { id: 7, propertyId: 2, name: "Master Bedroom", rent: 1500, occupied: true, tenantId: 5 },
  { id: 8, propertyId: 2, name: "Second Bedroom", rent: 1200, occupied: false, tenantId: null },
  { id: 9, propertyId: 2, name: "Living Room Conversion", rent: 900, occupied: true, tenantId: 6 },
  { id: 10, propertyId: 2, name: "Den", rent: 800, occupied: false, tenantId: null },
  
  // SOMA Tech House rooms
  { id: 11, propertyId: 3, name: "Pod A", rent: 1000, occupied: true, tenantId: 7 },
  { id: 12, propertyId: 3, name: "Pod B", rent: 1000, occupied: true, tenantId: 8 },
  { id: 13, propertyId: 3, name: "Pod C", rent: 1000, occupied: false, tenantId: null },
  { id: 14, propertyId: 3, name: "Pod D", rent: 1000, occupied: true, tenantId: 9 },
  { id: 15, propertyId: 3, name: "Pod E", rent: 1000, occupied: true, tenantId: 10 },
  { id: 16, propertyId: 3, name: "Pod F", rent: 1000, occupied: true, tenantId: 11 },
  { id: 17, propertyId: 3, name: "Pod G", rent: 1000, occupied: true, tenantId: 12 },
  { id: 18, propertyId: 3, name: "Pod H", rent: 1000, occupied: false, tenantId: null },
];

export const mockTenants = [
  { id: 1, name: "Alice Johnson", email: "alice@email.com", phone: "(555) 123-4567", roomId: 1 },
  { id: 2, name: "Bob Chen", email: "bob@email.com", phone: "(555) 234-5678", roomId: 2 },
  { id: 3, name: "Carol Davis", email: "carol@email.com", phone: "(555) 345-6789", roomId: 4 },
  { id: 4, name: "David Wilson", email: "david@email.com", phone: "(555) 456-7890", roomId: 5 },
  { id: 5, name: "Eva Martinez", email: "eva@email.com", phone: "(555) 567-8901", roomId: 7 },
  { id: 6, name: "Frank Kim", email: "frank@email.com", phone: "(555) 678-9012", roomId: 9 },
  { id: 7, name: "Grace Liu", email: "grace@email.com", phone: "(555) 789-0123", roomId: 11 },
  { id: 8, name: "Henry Garcia", email: "henry@email.com", phone: "(555) 890-1234", roomId: 12 },
  { id: 9, name: "Iris Thompson", email: "iris@email.com", phone: "(555) 901-2345", roomId: 14 },
  { id: 10, name: "Jack Brown", email: "jack@email.com", phone: "(555) 012-3456", roomId: 15 },
  { id: 11, name: "Kate Smith", email: "kate@email.com", phone: "(555) 123-4567", roomId: 16 },
  { id: 12, name: "Leo Rodriguez", email: "leo@email.com", phone: "(555) 234-5678", roomId: 17 },
];

export const mockApplications = [
  { id: 1, applicantName: "Sarah Connor", email: "sarah@email.com", phone: "(555) 111-2222", propertyId: 1, status: "pending", appliedDate: "2025-01-05" },
  { id: 2, applicantName: "John Doe", email: "john@email.com", phone: "(555) 333-4444", propertyId: 2, status: "pending", appliedDate: "2025-01-07" },
  { id: 3, applicantName: "Jane Smith", email: "jane@email.com", phone: "(555) 555-6666", propertyId: 3, status: "pending", appliedDate: "2025-01-08" },
  { id: 4, applicantName: "Mike Johnson", email: "mike@email.com", phone: "(555) 777-8888", propertyId: 1, status: "approved", appliedDate: "2025-01-03" },
  { id: 5, applicantName: "Lisa Wang", email: "lisa@email.com", phone: "(555) 999-0000", propertyId: 2, status: "rejected", appliedDate: "2025-01-02" },
];

export const mockLeases = [
  { id: 1, tenantId: 1, roomId: 1, startDate: "2024-12-01", endDate: "2025-12-01", rent: 1200, status: "active" },
  { id: 2, tenantId: 2, roomId: 2, startDate: "2024-11-15", endDate: "2025-11-15", rent: 1100, status: "active" },
  { id: 3, tenantId: 3, roomId: 4, startDate: "2025-01-01", endDate: "2026-01-01", rent: 1000, status: "active" },
  { id: 4, tenantId: 4, roomId: 5, startDate: "2024-10-01", endDate: "2025-10-01", rent: 1150, status: "expiring_soon" },
  { id: 5, tenantId: 5, roomId: 7, startDate: "2024-09-01", endDate: "2025-09-01", rent: 1500, status: "expiring_soon" },
];

export const mockInventory = [
  { id: 1, propertyId: 1, roomId: 1, name: "Bed Frame", condition: "good", reportedIssues: 0 },
  { id: 2, propertyId: 1, roomId: 1, name: "Desk", condition: "fair", reportedIssues: 1 },
  { id: 3, propertyId: 1, roomId: 2, name: "Chair", condition: "poor", reportedIssues: 2 },
  { id: 4, propertyId: 2, roomId: 7, name: "Mattress", condition: "good", reportedIssues: 0 },
  { id: 5, propertyId: 2, roomId: 7, name: "Wardrobe", condition: "fair", reportedIssues: 1 },
  { id: 6, propertyId: 3, roomId: 11, name: "Bunk Bed", condition: "good", reportedIssues: 0 },
  { id: 7, propertyId: 3, roomId: 12, name: "Storage Unit", condition: "poor", reportedIssues: 3 },
  { id: 8, propertyId: 1, name: "Washing Machine", condition: "fair", reportedIssues: 1, roomId: null }, // Common area
  { id: 9, propertyId: 1, name: "Kitchen Table", condition: "good", reportedIssues: 0, roomId: null },
]; 