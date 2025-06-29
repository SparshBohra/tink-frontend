import { 
  DashboardStats,
  User,
  Manager,
  Tenant,
  Property,
  Room,
  Application,
  Lease,
  Landlord,
  Document,
  Occupancy,
  InventoryItem,
  PaginatedResponse,
  ApiError,
  TenantFormData,
  PropertyFormData,
  RoomFormData,
  ApplicationFormData,
  LeaseFormData,
  ManagerWithProperties,
  ManagerPropertyAssignment,
  ManagerFormData,
  ManagerLandlordRelationship
} from './types';

// Mock API client for UI testing without backend
class MockApiClient {
  private isAuthenticated(): boolean {
    return !!localStorage.getItem('mockUser');
  }

  private getCurrentUser(): User | null {
    const userData = localStorage.getItem('mockUser');
    return userData ? JSON.parse(userData) : null;
  }

  private mockDelay(ms: number = 300): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private createMockResponse<T>(data: T): Promise<T> {
    return this.mockDelay().then(() => data);
  }

  private createMockPaginatedResponse<T>(data: T[]): Promise<PaginatedResponse<T>> {
    return this.mockDelay().then(() => ({
      count: data.length,
      next: undefined,
      previous: undefined,
      results: data
    }));
  }

  // Authentication endpoints (not used in mock mode)
  async login(): Promise<any> {
    throw new Error('Use mock authentication context instead');
  }

  async logout_api(): Promise<void> {
    await this.mockDelay();
  }

  async getProfile(): Promise<User> {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    return this.createMockResponse(user);
  }

  // Dashboard endpoints
  async getDashboardStats(): Promise<DashboardStats> {
    const mockStats: DashboardStats = {
      properties: { total: 3, occupied: 2, vacant: 1 },
      rooms: { total: 15, occupied: 12, vacant: 3, occupancy_rate: 80 },
      tenants: { total: 12, active: 12 },
      revenue: { monthly: 15400, projected_annual: 184800 },
      applications: { total: 8, pending: 3, approved: 4, rejected: 1 },
      leases: { total: 12, active: 10, draft: 1, expired: 1 },
      managers: { total: 2, active: 2 }
    };
    return this.createMockResponse(mockStats);
  }

  // Tenant endpoints
  async getTenants(): Promise<PaginatedResponse<Tenant>> {
    const mockTenants: Tenant[] = [
      {
        id: 1,
        full_name: 'Alice Johnson',
        email: 'alice@email.com',
        phone: '(555) 123-4567',
        emergency_contact_name: 'Bob Johnson',
        emergency_contact_phone: '(555) 123-4568',
        current_address: '123 Main St',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      },
      {
        id: 2,
        full_name: 'Bob Chen',
        email: 'bob@email.com',
        phone: '(555) 234-5678',
        emergency_contact_name: 'Lisa Chen',
        emergency_contact_phone: '(555) 234-5679',
        current_address: '456 Oak Ave',
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-01-10T10:00:00Z'
      },
      {
        id: 3,
        full_name: 'Carol Davis',
        email: 'carol@email.com',
        phone: '(555) 345-6789',
        emergency_contact_name: 'Mike Davis',
        emergency_contact_phone: '(555) 345-6790',
        current_address: '789 Pine St',
        created_at: '2024-01-05T10:00:00Z',
        updated_at: '2024-01-05T10:00:00Z'
      }
    ];
    return this.createMockPaginatedResponse(mockTenants);
  }

  async getTenant(id: number): Promise<Tenant> {
    const tenants = await this.getTenants();
    const tenant = tenants.results.find(t => t.id === id);
    if (!tenant) throw new Error('Tenant not found');
    return this.createMockResponse(tenant);
  }

  async createTenant(data: TenantFormData): Promise<Tenant> {
    const newTenant: Tenant = {
      id: Date.now(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return this.createMockResponse(newTenant);
  }

  async updateTenant(id: number, data: Partial<TenantFormData>): Promise<Tenant> {
    const tenant = await this.getTenant(id);
    const updatedTenant = { ...tenant, ...data, updated_at: new Date().toISOString() };
    return this.createMockResponse(updatedTenant);
  }

  async deleteTenant(id: number): Promise<void> {
    await this.mockDelay();
  }

  // Property endpoints
  async getProperties(): Promise<PaginatedResponse<Property>> {
    const mockProperties: Property[] = [
      {
        id: 1,
        landlord: 27,
        name: 'Downtown Professional Suites',
        address: '123 Business St',
        address_line1: '123 Business St',
        city: 'New York',
        state: 'NY',
        postal_code: '10001',
        country: 'United States',
        full_address: '123 Business St, New York, NY 10001',
        property_type: 'coliving',
        timezone: 'America/New_York',
        timezone_display: 'Eastern Time',
        total_rooms: 8,
        vacant_rooms: 2,
        landlord_name: 'Olivia Wilson',
        created_at: '2024-01-01T10:00:00Z'
      },
      {
        id: 2,
        landlord: 27,
        name: 'University District House',
        address: '456 College Ave',
        address_line1: '456 College Ave',
        city: 'New York',
        state: 'NY',
        postal_code: '10002',
        country: 'United States',
        full_address: '456 College Ave, New York, NY 10002',
        property_type: 'coliving',
        timezone: 'America/New_York',
        timezone_display: 'Eastern Time',
        total_rooms: 6,
        vacant_rooms: 1,
        landlord_name: 'Olivia Wilson',
        created_at: '2024-01-01T10:00:00Z'
      }
    ];
    return this.createMockPaginatedResponse(mockProperties);
  }

  async getProperty(id: number): Promise<Property> {
    const properties = await this.getProperties();
    const property = properties.results.find(p => p.id === id);
    if (!property) throw new Error('Property not found');
    return this.createMockResponse(property);
  }

  async createProperty(data: PropertyFormData): Promise<Property> {
    const newProperty: Property = {
      id: Date.now(),
      landlord: 27,
      ...data,
      full_address: `${data.address_line1}, ${data.city}, ${data.state} ${data.postal_code}`,
      total_rooms: 0,
      vacant_rooms: 0,
      timezone_display: 'Eastern Time',
      created_at: new Date().toISOString()
    };
    return this.createMockResponse(newProperty);
  }

  async getPropertyRooms(propertyId: number): Promise<Room[]> {
    const mockRooms: Room[] = [
      {
        id: 1,
        property_ref: propertyId,
        name: 'Room 101',
        room_type: 'Standard',
        floor: '1',
        max_capacity: 2,
        current_occupancy: 1,
        monthly_rent: 1200,
        security_deposit: 2400,
        is_vacant: false,
        occupancy_rate: 50,
        property_name: 'Downtown Professional Suites',
        can_add_tenant: false,
        created_at: '2024-01-01T10:00:00Z'
      },
      {
        id: 2,
        property_ref: propertyId,
        name: 'Room 102',
        room_type: 'Deluxe',
        floor: '1',
        max_capacity: 1,
        current_occupancy: 0,
        monthly_rent: 1500,
        security_deposit: 3000,
        is_vacant: true,
        occupancy_rate: 0,
        property_name: 'Downtown Professional Suites',
        can_add_tenant: true,
        created_at: '2024-01-01T10:00:00Z'
      }
    ];
    return this.createMockResponse(mockRooms);
  }

  // Room endpoints
  async getRooms(): Promise<PaginatedResponse<Room>> {
    const mockRooms: Room[] = [
      {
        id: 1,
        property_ref: 1,
        name: 'Room 101',
        room_type: 'Standard',
        max_capacity: 2,
        current_occupancy: 1,
        monthly_rent: 1200,
        security_deposit: 2400,
        is_vacant: false,
        occupancy_rate: 50,
        property_name: 'Downtown Professional Suites',
        can_add_tenant: false,
        created_at: '2024-01-01T10:00:00Z'
      },
      {
        id: 2,
        property_ref: 1,
        name: 'Room 102',
        room_type: 'Deluxe',
        max_capacity: 1,
        current_occupancy: 0,
        monthly_rent: 1500,
        security_deposit: 3000,
        is_vacant: true,
        occupancy_rate: 0,
        property_name: 'Downtown Professional Suites',
        can_add_tenant: true,
        created_at: '2024-01-01T10:00:00Z'
      }
    ];
    return this.createMockPaginatedResponse(mockRooms);
  }

  async getRoom(id: number): Promise<Room> {
    const rooms = await this.getRooms();
    const room = rooms.results.find(r => r.id === id);
    if (!room) throw new Error('Room not found');
    return this.createMockResponse(room);
  }

  async createRoom(data: RoomFormData): Promise<Room> {
    const newRoom: Room = {
      id: Date.now(),
      ...data,
      current_occupancy: 0,
      is_vacant: true,
      occupancy_rate: 0,
      property_name: 'Property',
      can_add_tenant: true,
      created_at: new Date().toISOString()
    };
    return this.createMockResponse(newRoom);
  }

  async updateRoom(id: number, data: Partial<RoomFormData>): Promise<Room> {
    const room = await this.getRoom(id);
    const updatedRoom = { ...room, ...data };
    return this.createMockResponse(updatedRoom);
  }

  // Application endpoints
  async getApplications(params?: any): Promise<PaginatedResponse<Application>> {
    const mockApplications: Application[] = [
      {
        id: 1,
        tenant: 1,
        room: 2,
        property_ref: 1,
        status: 'pending',
        application_date: '2024-01-15T10:00:00Z',
        desired_move_in_date: '2024-02-01',
        rent_budget: 1500,
        tenant_name: 'Alice Johnson',
        tenant_email: 'alice@email.com',
        days_pending: 5,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      },
      {
        id: 2,
        tenant: 2,
        room: 3,
        property_ref: 2,
        status: 'pending',
        application_date: '2024-01-14T10:00:00Z',
        desired_move_in_date: '2024-02-15',
        rent_budget: 1200,
        tenant_name: 'Bob Chen',
        tenant_email: 'bob@email.com',
        days_pending: 6,
        created_at: '2024-01-14T10:00:00Z',
        updated_at: '2024-01-14T10:00:00Z'
      }
    ];
    return this.createMockPaginatedResponse(mockApplications);
  }

  async getApplication(id: number): Promise<Application> {
    const applications = await this.getApplications();
    const application = applications.results.find(a => a.id === id);
    if (!application) throw new Error('Application not found');
    return this.createMockResponse(application);
  }

  async createApplication(data: ApplicationFormData): Promise<Application> {
    const newApplication: Application = {
      id: Date.now(),
      ...data,
      status: 'pending',
      application_date: new Date().toISOString(),
      days_pending: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return this.createMockResponse(newApplication);
  }

  async decideApplication(id: number, decisionData: any): Promise<Application> {
    const application = await this.getApplication(id);
    const updatedApplication = {
      ...application,
      status: decisionData.decision,
      decision_date: new Date().toISOString(),
      decision_notes: decisionData.decision_notes,
      updated_at: new Date().toISOString()
    };
    return this.createMockResponse(updatedApplication);
  }

  async getPendingApplications(): Promise<Application[]> {
    const applications = await this.getApplications();
    return applications.results.filter(app => app.status === 'pending');
  }

  // Lease endpoints
  async getLeases(params?: any): Promise<PaginatedResponse<Lease>> {
    const mockLeases: Lease[] = [
      {
        id: 1,
        tenant: 1,
        room: 1,
        property_ref: 1,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        monthly_rent: 1200,
        security_deposit: 2400,
        status: 'active',
        is_active: true,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z'
      }
    ];
    return this.createMockPaginatedResponse(mockLeases);
  }

  async getLease(id: number): Promise<Lease> {
    const leases = await this.getLeases();
    const lease = leases.results.find(l => l.id === id);
    if (!lease) throw new Error('Lease not found');
    return this.createMockResponse(lease);
  }

  async createLease(data: LeaseFormData): Promise<Lease> {
    const newLease: Lease = {
      id: Date.now(),
      ...data,
      status: 'active',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return this.createMockResponse(newLease);
  }

  // Manager endpoints
  async getManagersWithProperties(): Promise<ManagerWithProperties[]> {
    const mockManagers: ManagerWithProperties[] = [
      {
        id: 45,
        username: 'sarah_manager',
        email: 'sarah@premiumprops.com',
        full_name: 'Sarah Manager',
        role: 'manager',
        is_active: true,
        assigned_properties: [
          {
            id: 1,
            name: 'Downtown Professional Suites',
            full_address: '123 Business St, New York, NY 10001',
            total_rooms: 8,
            vacant_rooms: 2
          }
        ],
        access_level: 'limited',
        landlord_name: 'Olivia Wilson',
        landlord_id: 27
      }
    ];
    return this.createMockResponse(mockManagers);
  }

  async getManagers(): Promise<PaginatedResponse<Manager>> {
    const mockManagers: Manager[] = [
      {
        id: 45,
        username: 'sarah_manager',
        email: 'sarah@premiumprops.com',
        full_name: 'Sarah Manager',
        role: 'manager',
        is_active: true
      }
    ];
    return this.createMockPaginatedResponse(mockManagers);
  }

  async createManagerWithProperties(data: ManagerFormData): Promise<Manager> {
    const newManager: Manager = {
      id: Date.now(),
      username: data.username,
      email: data.email,
      full_name: data.full_name,
      role: 'manager',
      is_active: true
    };
    return this.createMockResponse(newManager);
  }

  async updateManager(id: number, data: Partial<Manager>): Promise<Manager> {
    const manager = {
      id,
      username: 'manager',
      email: data.email || 'manager@example.com',
      full_name: data.full_name || 'Manager',
      role: 'manager',
      is_active: true
    };
    return this.createMockResponse(manager);
  }

  async deleteManager(id: number): Promise<void> {
    await this.mockDelay();
  }

  // Inventory endpoints
  async getInventory(): Promise<PaginatedResponse<InventoryItem>> {
    const mockInventory: InventoryItem[] = [
      {
        id: 1,
        property_ref: 1,
        room: 1,
        name: 'Office Chair',
        description: 'Ergonomic office chair',
        qty: 1,
        cost: 150,
        condition_status: 'good',
        needs_maintenance: false,
        property_name: 'Downtown Professional Suites',
        room_name: 'Room 101',
        location_display: 'Room 101',
        created_at: '2024-01-01T10:00:00Z'
      }
    ];
    return this.createMockPaginatedResponse(mockInventory);
  }

  async getInventoryItem(id: number): Promise<InventoryItem> {
    const inventory = await this.getInventory();
    const item = inventory.results.find(i => i.id === id);
    if (!item) throw new Error('Inventory item not found');
    return this.createMockResponse(item);
  }

  async createInventoryItem(data: any): Promise<InventoryItem> {
    const newItem: InventoryItem = {
      id: Date.now(),
      ...data,
      created_at: new Date().toISOString()
    };
    return this.createMockResponse(newItem);
  }

  async updateInventoryItem(id: number, data: any): Promise<InventoryItem> {
    const item = await this.getInventoryItem(id);
    const updatedItem = { ...item, ...data };
    return this.createMockResponse(updatedItem);
  }

  async deleteInventoryItem(id: number): Promise<void> {
    await this.mockDelay();
  }

  // Landlord endpoints
  async getLandlordProfile(): Promise<any> {
    const mockProfile = {
      id: 27,
      username: 'premium_owner',
      email: 'owner@premiumprops.com',
      full_name: 'Olivia Wilson',
      org_name: 'Premium Properties',
      contact_email: 'owner@premiumprops.com',
      contact_phone: '+1 (555) 123-4567',
      is_active: true
    };
    return this.createMockResponse(mockProfile);
  }

  async getAllLandlords(): Promise<any[]> {
    const mockLandlords = [
      {
        id: 27,
        username: 'premium_owner',
        email: 'owner@premiumprops.com',
        full_name: 'Olivia Wilson',
        org_name: 'Premium Properties',
        contact_email: 'owner@premiumprops.com',
        is_active: true
      }
    ];
    return this.createMockResponse(mockLandlords);
  }

  async getAllManagers(): Promise<any[]> {
    const mockManagers = [
      {
        id: 45,
        username: 'sarah_manager',
        email: 'sarah@premiumprops.com',
        full_name: 'Sarah Manager',
        role: 'manager',
        is_active: true
      }
    ];
    return this.createMockResponse(mockManagers);
  }

  // Placeholder methods for other endpoints
  async getTenantApplications(tenantId: number): Promise<Application[]> {
    return this.createMockResponse([]);
  }

  async getTenantCurrentLease(tenantId: number): Promise<Lease | null> {
    return this.createMockResponse(null);
  }

  async getManagerPropertyAssignments(): Promise<ManagerPropertyAssignment[]> {
    return this.createMockResponse([]);
  }

  async createManagerPropertyAssignment(data: any): Promise<ManagerPropertyAssignment> {
    const assignment: ManagerPropertyAssignment = {
      id: Date.now(),
      manager: data.manager,
      property: data.property,
      landlord_relationship: data.landlord_relationship,
      role_note: data.role_note
    };
    return this.createMockResponse(assignment);
  }

  async deleteManagerPropertyAssignment(id: number): Promise<void> {
    await this.mockDelay();
  }

  async getManagerLandlordRelationships(): Promise<ManagerLandlordRelationship[]> {
    return this.createMockResponse([]);
  }

  async createManagerLandlordRelationship(data: any): Promise<ManagerLandlordRelationship> {
    const relationship: ManagerLandlordRelationship = {
      id: Date.now(),
      manager: data.manager,
      landlord: data.landlord,
      is_primary: data.is_primary
    };
    return this.createMockResponse(relationship);
  }

  async deleteManagerLandlordRelationship(id: number): Promise<void> {
    await this.mockDelay();
  }

  async getManagersForLandlord(landlordId: number): Promise<Manager[]> {
    return this.createMockResponse([]);
  }

  async inviteManager(landlordId: number, data: any): Promise<Manager> {
    const manager: Manager = {
      id: Date.now(),
      username: data.username,
      email: data.email,
      full_name: data.full_name,
      role: 'manager',
      is_active: true
    };
    return this.createMockResponse(manager);
  }

  async processMoveout(leaseId: number, data: any): Promise<Lease> {
    const lease = await this.getLease(leaseId);
    return this.createMockResponse({ ...lease, status: 'ended' });
  }

  async processMovein(leaseId: number, data: any): Promise<Lease> {
    const lease = await this.getLease(leaseId);
    return this.createMockResponse({ ...lease, status: 'active' });
  }

  async updateLease(id: number, data: any): Promise<Lease> {
    const lease = await this.getLease(id);
    return this.createMockResponse({ ...lease, ...data });
  }

  async deleteLease(id: number): Promise<void> {
    await this.mockDelay();
  }

  async updateProperty(id: number, data: any): Promise<Property> {
    const property = await this.getProperty(id);
    return this.createMockResponse({ ...property, ...data });
  }

  async deleteProperty(id: number): Promise<void> {
    await this.mockDelay();
  }

  async deleteRoom(id: number): Promise<void> {
    await this.mockDelay();
  }

  async updateApplication(id: number, data: any): Promise<Application> {
    const application = await this.getApplication(id);
    return this.createMockResponse({ ...application, ...data });
  }

  async deleteApplication(id: number): Promise<void> {
    await this.mockDelay();
  }

  async updateTenantProfile(userData: any): Promise<User> {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    return this.createMockResponse({ ...user, ...userData });
  }

  async signupLandlord(userData: any): Promise<any> {
    await this.mockDelay();
    return this.createMockResponse({
      user: { id: Date.now(), ...userData, role: 'owner' },
      tokens: { access: 'mock-token', refresh: 'mock-refresh' },
      landlord: { id: Date.now(), ...userData }
    });
  }

  async signup(userData: any): Promise<User> {
    await this.mockDelay();
    return this.createMockResponse({
      id: Date.now(),
      ...userData,
      role: 'manager',
      is_active: true
    });
  }

  async updateProfile(userData: any): Promise<User> {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const updatedUser = { ...user, ...userData };
    localStorage.setItem('mockUser', JSON.stringify(updatedUser));
    return this.createMockResponse(updatedUser);
  }

  async getLandlords(): Promise<PaginatedResponse<Landlord>> {
    const mockLandlords: Landlord[] = [
      {
        id: 27,
        full_name: 'Olivia Wilson',
        email: 'owner@premiumprops.com',
        phone: '+1 (555) 123-4567',
        company_name: 'Premium Properties',
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z'
      }
    ];
    return this.createMockPaginatedResponse(mockLandlords);
  }

  async getLandlord(id: number): Promise<Landlord> {
    const landlords = await this.getLandlords();
    const landlord = landlords.results.find(l => l.id === id);
    if (!landlord) throw new Error('Landlord not found');
    return this.createMockResponse(landlord);
  }

  async createLandlord(data: any): Promise<Landlord> {
    const newLandlord: Landlord = {
      id: Date.now(),
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      company_name: data.company_name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return this.createMockResponse(newLandlord);
  }

  async updateLandlord(id: number, data: any): Promise<Landlord> {
    const landlord = await this.getLandlord(id);
    const updatedLandlord = { ...landlord, ...data, updated_at: new Date().toISOString() };
    return this.createMockResponse(updatedLandlord);
  }

  async deleteLandlord(id: number): Promise<void> {
    await this.mockDelay();
  }

  async updateLandlordProfile(data: any): Promise<any> {
    const profile = await this.getLandlordProfile();
    return this.createMockResponse({ ...profile, ...data });
  }

  async getDocuments(): Promise<PaginatedResponse<Document>> {
    return this.createMockPaginatedResponse([]);
  }

  async getDocument(id: number): Promise<Document> {
    throw new Error('Document not found');
  }

  async deleteDocument(id: number): Promise<void> {
    await this.mockDelay();
  }

  async uploadTenantDocument(tenantId: number, file: File, documentType: string, notes?: string): Promise<Document> {
    const newDocument: Document = {
      id: Date.now(),
      tenant: tenantId,
      document_type: documentType,
      file_url: URL.createObjectURL(file),
      notes: notes,
      uploaded_at: new Date().toISOString()
    };
    return this.createMockResponse(newDocument);
  }

  async getOccupancies(params?: any): Promise<PaginatedResponse<Occupancy>> {
    return this.createMockPaginatedResponse([]);
  }

  async getOccupancy(id: number): Promise<Occupancy> {
    throw new Error('Occupancy not found');
  }

  async getCurrentOccupancies(): Promise<Occupancy[]> {
    return this.createMockResponse([]);
  }

  async getOccupancyHistory(): Promise<Occupancy[]> {
    return this.createMockResponse([]);
  }

  async getMaintenanceItems(): Promise<InventoryItem[]> {
    return this.createMockResponse([]);
  }

  async checkRoomAvailability(roomId: number): Promise<any> {
    return this.createMockResponse({ available: true });
  }

  async updateRoomOccupancy(roomId: number, occupancyData: any): Promise<Room> {
    const room = await this.getRoom(roomId);
    return this.createMockResponse({ ...room, ...occupancyData });
  }

  async getActiveLeases(): Promise<Lease[]> {
    const leases = await this.getLeases();
    return leases.results.filter(lease => lease.is_active);
  }

  async getExpiringLeases(): Promise<Lease[]> {
    return this.createMockResponse([]);
  }

  async bulkApproveApplications(data: any): Promise<any> {
    await this.mockDelay();
    return this.createMockResponse({ success: true, processed: data.application_ids.length });
  }

  async bulkRejectApplications(data: any): Promise<any> {
    await this.mockDelay();
    return this.createMockResponse({ success: true, processed: data.application_ids.length });
  }

  async getPropertyAnalytics(): Promise<any> {
    return this.createMockResponse({
      occupancy_trends: [],
      revenue_trends: [],
      vacancy_analysis: {}
    });
  }

  async getRoomAnalytics(): Promise<any> {
    return this.createMockResponse({
      room_performance: [],
      occupancy_rates: {}
    });
  }

  async getApplicationAnalytics(): Promise<any> {
    return this.createMockResponse({
      application_trends: [],
      conversion_rates: {}
    });
  }

  async exportPropertiesCSV(): Promise<Blob> {
    const csvContent = "Property Name,Address,Total Rooms,Vacant Rooms\nDowntown Professional Suites,123 Business St,8,2";
    return new Blob([csvContent], { type: 'text/csv' });
  }

  async exportVacancyCSV(): Promise<Blob> {
    const csvContent = "Property,Room,Status,Days Vacant\nDowntown Professional Suites,Room 102,Vacant,5";
    return new Blob([csvContent], { type: 'text/csv' });
  }

  async exportApplicationsCSV(): Promise<Blob> {
    const csvContent = "Applicant,Property,Status,Date\nAlice Johnson,Downtown Professional Suites,Pending,2024-01-15";
    return new Blob([csvContent], { type: 'text/csv' });
  }

  async exportLeasesCSV(): Promise<Blob> {
    const csvContent = "Tenant,Property,Room,Start Date,End Date,Monthly Rent\nAlice Johnson,Downtown Professional Suites,Room 101,2024-01-01,2024-12-31,1200";
    return new Blob([csvContent], { type: 'text/csv' });
  }

  async checkManagerPropertyAssignment(managerId: number, propertyId: number): Promise<any> {
    return this.createMockResponse({ exists: false });
  }

  async getPlatformStats(): Promise<any> {
    return this.createMockResponse({
      total_landlords: 1,
      total_managers: 1,
      total_properties: 2,
      total_revenue: 15400
    });
  }
}

export const apiClient = new MockApiClient();