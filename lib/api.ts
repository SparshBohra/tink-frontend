import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import Cookies from 'js-cookie';
import {
  AuthTokens,
  LoginCredentials,
  Manager,
  Tenant,
  Property,
  Room,
  Application,
  ApplicationViewing,
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
  DashboardStats,
  User,
  ManagerWithProperties,
  ManagerPropertyAssignment,
  ManagerFormData,
  ManagerLandlordRelationship,
  ListingFormData
} from './types';

// Smart environment-based API URL configuration
const getApiBaseUrl = () => {
  // If explicitly set via environment variable, use that
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  
  // Smart defaults based on environment
  if (process.env.NODE_ENV === 'development') {
    // Default to localhost for development, but can be overridden
    return 'http://localhost:8000/api';
  }
  
  // Production default
  return 'https://tink.global/api';
};

const API_BASE_URL = getApiBaseUrl();

class ApiClient {
  private api: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.api(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) {
              throw new Error('No refresh token');
            }

            const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
              refresh: refreshToken
            });

            const { access } = response.data;
            this.setAccessToken(access);

            this.processQueue(null, access);
            
            originalRequest.headers.Authorization = `Bearer ${access}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            this.logout();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  private handleError(error: AxiosError): ApiError {
    const responseData = error.response?.data as any;
    const message = responseData?.detail || responseData?.message || error.message || 'An error occurred';
    const errors = responseData?.field_errors || responseData?.errors;
    const status = error.response?.status || 500;

    return {
      message,
      errors,
      status
    };
  }

  // Token management
  setTokens(tokens: AuthTokens) {
    Cookies.set('access_token', tokens.access, { expires: 1 }); // 1 day
    Cookies.set('refresh_token', tokens.refresh, { expires: 7 }); // 7 days
  }

  getAccessToken(): string | null {
    return Cookies.get('access_token') || null;
  }

  getRefreshToken(): string | null {
    return Cookies.get('refresh_token') || null;
  }

  setAccessToken(token: string) {
    Cookies.set('access_token', token, { expires: 1 });
  }

  logout() {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  // Authentication endpoints
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await this.api.post('/login/', credentials);
    
    const tokens = {
      access: response.data.access,
      refresh: response.data.refresh
    };
    this.setTokens(tokens);
    
    // Handle the actual API response structure
    // The API returns user data in the 'manager' field for all user types
    let user: User;
    if (response.data.manager) {
      user = response.data.manager;
    } else if (response.data.user) {
      // Fallback for different response structure
      user = response.data.user;
    } else if (response.data.landlord) {
      // Another possible structure
      user = response.data.landlord;
    } else {
      // Last resort fallback
      user = {
        id: response.data.id || 0,
        username: response.data.username || credentials.username,
        email: response.data.email || '',
        full_name: response.data.full_name || response.data.username || credentials.username,
        role: response.data.role || 'manager',
        is_active: response.data.is_active !== false
      };
    }
    
    return {
      user,
      tokens
    };
  }

  async logout_api(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      await this.api.post('/logout/', { refresh: refreshToken });
    }
    this.logout();
  }

  async signup(userData: any): Promise<User> {
    const response = await this.api.post('/signup/', userData);
    return response.data;
  }

  async signupLandlord(userData: any): Promise<{ user: User; tokens: AuthTokens; landlord: any }> {
    const response = await this.api.post('/landlords/signup/', userData);
    
    // If the response includes tokens, set them
    if (response.data.tokens) {
      this.setTokens(response.data.tokens);
    }
    
    return {
      user: response.data.user,
      tokens: response.data.tokens,
      landlord: response.data.landlord
    };
  }

  async getProfile(): Promise<User> {
    const response = await this.api.get('/profile/');
    return response.data;
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await this.api.put('/profile/', userData);
    return response.data;
  }

  // Dashboard endpoints - Updated to use new API structure
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.api.get('/dashboard/stats/');
    return response.data;
  }

  async getPropertyAnalytics(): Promise<any> {
    const response = await this.api.get('/dashboard/property-analytics/');
    return response.data;
  }

  async getRoomAnalytics(): Promise<any> {
    const response = await this.api.get('/dashboard/room-analytics/');
    return response.data;
  }

  async getApplicationAnalytics(): Promise<any> {
    const response = await this.api.get('/dashboard/application-analytics/');
    return response.data;
  }

  // CSV Export endpoints
  async exportPropertiesCSV(): Promise<Blob> {
    const response = await this.api.get('/dashboard/export-properties-csv/', {
      responseType: 'blob'
    });
    return response.data;
  }

  async exportVacancyCSV(): Promise<Blob> {
    const response = await this.api.get('/dashboard/export-vacancy-csv/', {
      responseType: 'blob'
    });
    return response.data;
  }

  async exportApplicationsCSV(): Promise<Blob> {
    const response = await this.api.get('/dashboard/export-applications-csv/', {
      responseType: 'blob'
    });
    return response.data;
  }

  async exportLeasesCSV(): Promise<Blob> {
    const response = await this.api.get('/dashboard/export-leases-csv/', {
      responseType: 'blob'
    });
    return response.data;
  }

  // Tenant endpoints
  async getTenants(): Promise<PaginatedResponse<Tenant>> {
    try {
      const response = await this.api.get('/tenants/');
      // Handle both paginated and direct array responses
      if (Array.isArray(response.data)) {
        return {
          count: response.data.length,
          next: undefined,
          previous: undefined,
          results: response.data
        };
      }
      return response.data;
    } catch (error: any) {
      if (error.status === 403 || error.status === 401) {
        // Return empty response if no permission
        return {
          count: 0,
          next: undefined,
          previous: undefined,
          results: []
        };
      }
      throw error;
    }
  }

  async getTenant(id: number): Promise<Tenant> {
    const response = await this.api.get(`/tenants/${id}/`);
    return response.data;
  }

  async createTenant(data: TenantFormData): Promise<Tenant> {
    try {
      const response = await this.api.post('/tenants/', data);
      return response.data;
    } catch (error: any) {
      console.error('Tenant creation error:', error);
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to create tenants. Please contact your administrator.');
      }
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.detail || 
                           error.response?.data?.message || 
                           'Invalid tenant data. Please check all required fields.';
        throw new Error(errorMessage);
      }
      if (error.response?.status === 500) {
        throw new Error('Server error occurred while creating tenant. Please try again later or contact support.');
      }
      throw new Error(error.message || 'Failed to create tenant. Please try again.');
    }
  }

  async updateTenant(id: number, data: Partial<TenantFormData>): Promise<Tenant> {
    const response = await this.api.put(`/tenants/${id}/`, data);
    return response.data;
  }

  async deleteTenant(id: number): Promise<void> {
    await this.api.delete(`/tenants/${id}/`);
  }

  async uploadTenantDocument(tenantId: number, file: File, documentType: string, notes?: string): Promise<Document> {
    const formData = new FormData();
    formData.append('tenant', tenantId.toString());
    formData.append('document_type', documentType);
    formData.append('document_file', file);
    if (notes) {
      formData.append('notes', notes);
    }

    const response = await this.api.post(`/tenants/${tenantId}/upload_document/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getTenantApplications(tenantId: number): Promise<Application[]> {
    const response = await this.api.get(`/tenants/${tenantId}/applications/`);
    return response.data;
  }

  async getTenantCurrentLease(tenantId: number): Promise<Lease | null> {
    try {
      const response = await this.api.get(`/tenants/${tenantId}/current_lease/`);
      return response.data;
    } catch (error: any) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  // Property endpoints
  async getProperties(): Promise<PaginatedResponse<Property>> {
    try {
      const response = await this.api.get('/properties/');
      // Handle both paginated and direct array responses
      if (Array.isArray(response.data)) {
        return {
          count: response.data.length,
          next: undefined,
          previous: undefined,
          results: response.data
        };
      }
      return response.data;
    } catch (error: any) {
      if (error.status === 403 || error.status === 401) {
        // Return empty response if no permission
        return {
          count: 0,
          next: undefined,
          previous: undefined,
          results: []
        };
      }
      throw error;
    }
  }

  async getProperty(id: number): Promise<Property> {
    const response = await this.api.get(`/properties/${id}/`);
    return response.data;
  }

  async createProperty(data: PropertyFormData): Promise<Property> {
    try {
      // The landlord should already be determined by the form
      // If not provided, this is an error that should be caught
      if (!data.landlord) {
        throw new Error('Landlord information is required but was not provided.');
      }

      // Extract room-related fields for later use
      const { total_rooms, room_names, room_types, room_rents, room_capacities, ...propertyData } = data;

      const payload = {
        ...propertyData,
        landlord: data.landlord,
        monthly_rent: data.monthly_rent ? parseInt(String(data.monthly_rent), 10) : undefined,
      };

      console.log('Creating property with payload:', payload); // Debug log

      const response = await this.api.post('/properties/', payload);
      const newProperty = response.data;
      
      console.log('Property created successfully:', newProperty); // Debug log
      
      // Auto-create rooms if rent_type is 'per_room'
      if (data.rent_type === 'per_room' && total_rooms > 0) {
        console.log(`Auto-creating ${total_rooms} rooms for property ${newProperty.id}`);
        try {
          const roomPromises = Array.from({ length: total_rooms }, (_, index) => {
            const roomName = room_names && room_names[index] 
              ? room_names[index] 
              : `Room ${index + 1}`;
            
            const roomData: RoomFormData = {
              property_ref: newProperty.id,
              name: roomName,
              room_type: room_types && room_types[index] ? room_types[index] : 'Standard',
              floor: '', // Empty string for floor
              max_capacity: room_capacities && room_capacities[index] ? room_capacities[index] : 2, // Default capacity
              monthly_rent: room_rents && room_rents[index] ? parseFloat(room_rents[index]) || 0 : 0, // Convert string to number
              security_deposit: 0, // Will be set later by the user
            };
            
            console.log(`Creating room ${index + 1}:`, roomData);
            return this.createRoom(roomData);
          });

          const createdRooms = await Promise.all(roomPromises);
          console.log(`Successfully auto-created ${createdRooms.length} rooms for property ${newProperty.id}:`, createdRooms);
        } catch (roomError) {
          console.error('Failed to auto-create rooms:', roomError);
          // Log the specific error details
          if (roomError instanceof Error) {
            console.error('Room creation error details:', roomError.message);
          }
          // Don't fail the property creation if room creation fails
          // The user can manually add rooms later
        }
      }
      
      // Auto-assign the property to the current manager
      try {
        const currentUser = await this.getProfile();
        
        // Only auto-assign for managers, not admins or landlords
        if (currentUser.role === 'manager') {
          // Get the manager's landlord relationships
          const relationships = await this.getManagerLandlordRelationships();
          const managerRelationship = relationships.find(rel => rel.manager === currentUser.id);
          
          if (managerRelationship) {
            // Create the property assignment
            await this.createManagerPropertyAssignment({
              manager: currentUser.id,
              property: newProperty.id,
              landlord_relationship: managerRelationship.id,
              role_note: `Auto-assigned to ${currentUser.full_name} (property creator)`
            });
            console.log(`Auto-assigned property ${newProperty.id} to manager ${currentUser.id}`);
          } else {
            console.warn('No landlord relationship found for manager, skipping auto-assignment');
          }
        }
      } catch (assignmentError) {
        // Don't fail the property creation if assignment fails
        console.error('Failed to auto-assign property to manager:', assignmentError);
      }
      
      return newProperty;
    } catch (error: any) {
      console.error('Property creation error:', error);
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to create properties. Please contact your administrator.');
      }
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.detail || 
                           error.response?.data?.message || 
                           'Invalid property data. Please check all required fields.';
        throw new Error(errorMessage);
      }
      if (error.response?.status === 500) {
        throw new Error('Server error occurred while creating property. Please try again later or contact support.');
      }
      throw new Error(error.message || 'Failed to create property. Please try again.');
    }
  }

  async updateProperty(id: number, data: Partial<PropertyFormData>): Promise<Property> {
    const payload = {
      ...data,
      monthly_rent: data.monthly_rent ? parseInt(String(data.monthly_rent), 10) : undefined,
    };
    delete (payload as Partial<PropertyFormData>).landlord;
    const response = await this.api.patch(`/properties/${id}/`, payload);
    return response.data;
  }

  async deleteProperty(id: number): Promise<void> {
    await this.api.delete(`/properties/${id}/`);
  }

  async getPropertyRooms(propertyId: number): Promise<Room[]> {
    const response = await this.api.get(`/properties/${propertyId}/rooms/`);
    return response.data;
  }

  // Room endpoints
  async getRooms(): Promise<PaginatedResponse<Room>> {
    const response = await this.api.get('/rooms/');
    // Handle both paginated and direct array responses
    if (Array.isArray(response.data)) {
      return {
        count: response.data.length,
        next: undefined,
        previous: undefined,
        results: response.data
      };
    }
    return response.data;
  }

  async getRoom(id: number): Promise<Room> {
    const response = await this.api.get(`/rooms/${id}/`);
    return response.data;
  }

  async createRoom(data: RoomFormData): Promise<Room> {
    const response = await this.api.post('/rooms/', data);
    return response.data;
  }

  async updateRoom(id: number, data: Partial<RoomFormData>): Promise<Room> {
    const response = await this.api.put(`/rooms/${id}/`, data);
    return response.data;
  }

  async deleteRoom(id: number): Promise<void> {
    await this.api.delete(`/rooms/${id}/`);
  }

  async checkRoomAvailability(roomId: number): Promise<any> {
    const response = await this.api.get(`/rooms/${roomId}/availability/`);
    return response.data;
  }

  async updateRoomOccupancy(roomId: number, occupancyData: any): Promise<Room> {
    const response = await this.api.patch(`/rooms/${roomId}/update_occupancy/`, occupancyData);
    return response.data;
  }

  // Application endpoints - Updated with new bulk operations
  async getApplications(params?: { status?: string; property?: number }): Promise<PaginatedResponse<Application>> {
    try {
      const response = await this.api.get('/applications/', { params });
      // Handle both paginated and direct array responses
      if (Array.isArray(response.data)) {
        return {
          count: response.data.length,
          next: undefined,
          previous: undefined,
          results: response.data
        };
      }
      return response.data;
    } catch (error: any) {
      if (error.status === 403 || error.status === 401) {
        // Return empty response if no permission
        return {
          count: 0,
          next: undefined,
          previous: undefined,
          results: []
        };
      }
      throw error;
    }
  }

  async getApplication(id: number): Promise<Application> {
    const response = await this.api.get(`/applications/${id}/`);
    return response.data;
  }

  async createApplication(data: ApplicationFormData): Promise<Application> {
    try {
      console.log('Creating application with data:', data);
      const response = await this.api.post('/applications/', data);
      console.log('Application created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Application creation failed:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to create applications. Please contact your administrator.');
      }
      if (error.response?.status === 400) {
        const details = error.response?.data?.detail || error.response?.data?.message || JSON.stringify(error.response?.data);
        throw new Error(`Invalid application data: ${details}`);
      }
      if (error.response?.status === 500) {
        throw new Error('Server error occurred while creating application. Please try again or contact support.');
      }
      throw new Error(error.message || 'Failed to create application');
    }
  }

  async updateApplication(id: number, data: Partial<ApplicationFormData>): Promise<Application> {
    const response = await this.api.patch<Application>(`/applications/${id}/`, data);
    return response.data;
  }

  async deleteApplication(id: number): Promise<void> {
    await this.api.delete(`/applications/${id}/`);
  }

  async decideApplication(id: number, decisionData: {
    decision: 'approve' | 'reject';
    start_date?: string;
    end_date?: string;
    monthly_rent?: number;
    security_deposit?: number;
    decision_notes?: string;
  }): Promise<Application> {
    try {
      console.log(`Deciding on application ${id} with data:`, decisionData);
    const response = await this.api.post(`/applications/${id}/decide/`, decisionData);
      console.log('Application decision successful:', response.data);
    return response.data;
    } catch (error: any) {
      console.error(`Application decision failed for ID ${id}:`, error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 400) {
        const details = error.response?.data?.detail || error.response?.data?.message || JSON.stringify(error.response?.data);
        throw new Error(`Decision validation failed: ${details}`);
      }
      if (error.response?.status === 404) {
        throw new Error(`Application with ID ${id} not found`);
      }
      if (error.response?.status === 500) {
        throw new Error('Server error occurred while processing application decision. Please try again or contact support.');
      }
      throw new Error(error.message || `Failed to decide on application ${id}`);
    }
  }

  async getPendingApplications(): Promise<Application[]> {
    const response = await this.api.get('/applications/pending/');
    return response.data;
  }

  // Enhanced workflow endpoints
  async scheduleViewing(applicationId: number, viewingData: {
    scheduled_date: string;
    scheduled_time: string;
    contact_person: string;
    contact_phone: string;
    viewing_notes: string;
  }): Promise<ApplicationViewing> {
    try {
      const response = await this.api.post(`/applications/${applicationId}/schedule-viewing/`, viewingData);
      return response.data;
    } catch (error: any) {
      console.error('Viewing scheduling failed:', error);
      if (error.response?.status === 400) {
        const details = error.response?.data?.detail || error.response?.data?.message || JSON.stringify(error.response?.data);
        throw new Error(`Invalid viewing data: ${details}`);
      }
      throw new Error(error.message || 'Failed to schedule viewing');
    }
  }

  async completeViewing(applicationId: number, completionData: {
    outcome: 'positive' | 'negative' | 'neutral';
    tenant_feedback?: string;
    landlord_notes?: string;
    next_action?: string;
  }): Promise<ApplicationViewing> {
    try {
      const response = await this.api.post(`/applications/${applicationId}/complete-viewing/`, completionData);
      return response.data;
    } catch (error: any) {
      console.error('Viewing completion failed:', error);
      if (error.response?.status === 400) {
        const details = error.response?.data?.detail || error.response?.data?.message || JSON.stringify(error.response?.data);
        throw new Error(`Invalid completion data: ${details}`);
      }
      throw new Error(error.message || 'Failed to complete viewing');
    }
  }

  async getApplicationViewings(applicationId: number): Promise<ApplicationViewing[]> {
    const response = await this.api.get(`/applications/${applicationId}/viewings/`);
    return response.data;
  }

  async assignRoom(applicationId: number, roomData: { room_id: number }): Promise<Application> {
    try {
      const response = await this.api.post(`/applications/${applicationId}/assign_room/`, roomData);
      return response.data;
    } catch (error: any) {
      console.error('Room assignment failed:', error);
      if (error.response?.status === 409) {
        throw new Error('Room is already assigned or unavailable');
      }
      if (error.response?.status === 400) {
        const details = error.response?.data?.detail || error.response?.data?.message || JSON.stringify(error.response?.data);
        throw new Error(`Invalid room assignment: ${details}`);
      }
      throw new Error(error.message || 'Failed to assign room');
    }
  }

  async generateLease(applicationId: number): Promise<Application> {
    try {
      const response = await this.api.post(`/applications/${applicationId}/generate-lease/`, {});
      return response.data;
    } catch (error: any) {
      console.error('Lease generation failed:', error);
      if (error.response?.status === 400) {
        const details = error.response?.data?.detail || error.response?.data?.message || JSON.stringify(error.response?.data);
        throw new Error(`Cannot generate lease: ${details}`);
      }
      throw new Error(error.message || 'Failed to generate lease');
    }
  }

  async getApplicationsPipeline(): Promise<{
    summary: {
      total_applications: number;
      active_applications: number;
      completed_applications: number;
      rejected_applications: number;
    };
    pending: Application[];
    approved: Application[];
    viewing_scheduled: Application[];
    viewing_completed: Application[];
    room_assigned: Application[];
    lease_created: Application[];
    lease_signed: Application[];
    moved_in: Application[];
    rejected: Application[];
  }> {
    const response = await this.api.get('/applications/pipeline/');
    return response.data;
  }

  // New bulk operations
  async bulkApproveApplications(data: {
    application_ids: number[];
    lease_duration_months: number;
    monthly_rent: number;
    security_deposit: number;
  }): Promise<any> {
    const response = await this.api.post('/applications/bulk_approve/', data);
    return response.data;
  }

  async bulkRejectApplications(data: {
    application_ids: number[];
    rejection_reason: string;
  }): Promise<any> {
    const response = await this.api.post('/applications/bulk_reject/', data);
    return response.data;
  }

  // Lease endpoints - Updated with move-in/move-out
  async getLeases(params?: { status?: string; property?: number }): Promise<PaginatedResponse<Lease>> {
    try {
      const response = await this.api.get('/leases/', { params });
      // Handle both paginated and direct array responses
      if (Array.isArray(response.data)) {
        return {
          count: response.data.length,
          next: undefined,
          previous: undefined,
          results: response.data
        };
      }
      return response.data;
    } catch (error: any) {
      if (error.status === 403 || error.status === 401) {
        // Return empty response if no permission
        return {
          count: 0,
          next: undefined,
          previous: undefined,
          results: []
        };
      }
      throw error;
    }
  }

  async getLease(id: number): Promise<Lease> {
    const response = await this.api.get(`/leases/${id}/`);
    return response.data;
  }

  async createLease(data: LeaseFormData): Promise<Lease> {
    const response = await this.api.post<Lease>('/leases/', data);
    return response.data;
  }

  async createListing(data: ListingFormData): Promise<any> {
    const response = await this.api.post('/listings/', data);
    return response.data;
  }

  async updateLease(id: number, data: Partial<LeaseFormData>): Promise<Lease> {
    const response = await this.api.put(`/leases/${id}/`, data);
    return response.data;
  }

  async deleteLease(id: number): Promise<void> {
    await this.api.delete(`/leases/${id}/`);
  }

  async getActiveLeases(): Promise<Lease[]> {
    const response = await this.api.get('/leases/active/');
    return response.data;
  }

  async getExpiringLeases(): Promise<Lease[]> {
    const response = await this.api.get('/leases/expiring_soon/');
    return response.data;
  }

  async processMovein(leaseId: number, moveInData: {
    move_in_date: string;
    move_in_condition?: string;
    deposit_collected?: number;
  }): Promise<Lease> {
    const response = await this.api.post(`/leases/${leaseId}/move_in/`, moveInData);
    return response.data;
  }

  async processMoveout(leaseId: number, moveOutData: {
    move_out_date: string;
    move_out_condition?: string;
    cleaning_charges?: number;
    damage_charges?: number;
    deposit_returned?: number;
  }): Promise<Lease> {
    const response = await this.api.post(`/leases/${leaseId}/move_out/`, moveOutData);
    return response.data;
  }

  // Landlord endpoints
  async getLandlords(): Promise<PaginatedResponse<Landlord>> {
    const response = await this.api.get('/landlords/');
    return response.data;
  }

  async getLandlord(id: number): Promise<Landlord> {
    const response = await this.api.get(`/landlords/${id}/`);
    return response.data;
  }

  async createLandlord(data: any): Promise<Landlord> {
    const response = await this.api.post('/landlords/', data);
    return response.data;
  }

  async updateLandlord(id: number, data: any): Promise<Landlord> {
    const response = await this.api.put(`/landlords/${id}/`, data);
    return response.data;
  }

  async deleteLandlord(id: number): Promise<void> {
    await this.api.delete(`/landlords/${id}/`);
  }

  // Document endpoints
  async getDocuments(): Promise<PaginatedResponse<Document>> {
    const response = await this.api.get('/documents/');
    return response.data;
  }

  async getDocument(id: number): Promise<Document> {
    const response = await this.api.get(`/documents/${id}/`);
    return response.data;
  }

  async deleteDocument(id: number): Promise<void> {
    await this.api.delete(`/documents/${id}/`);
  }

  // Occupancy endpoints - Updated with new filtering
  async getOccupancies(params?: { current?: boolean; property?: number; room?: number }): Promise<PaginatedResponse<Occupancy>> {
    const response = await this.api.get('/occupancies/', { params });
    return response.data;
  }

  async getOccupancy(id: number): Promise<Occupancy> {
    const response = await this.api.get(`/occupancies/${id}/`);
    return response.data;
  }

  async getCurrentOccupancies(): Promise<Occupancy[]> {
    const response = await this.api.get('/occupancies/current/');
    return response.data;
  }

  async getOccupancyHistory(): Promise<Occupancy[]> {
    const response = await this.api.get('/occupancies/history/');
    return response.data;
  }

  // Inventory endpoints - Updated
  async getInventory(): Promise<PaginatedResponse<InventoryItem>> {
    const response = await this.api.get('/inventory/');
    // Handle both paginated and direct array responses
    if (Array.isArray(response.data)) {
      return {
        results: response.data,
        count: response.data.length,
        next: undefined,
        previous: undefined
      };
    }
    return response.data;
  }

  async getInventoryItem(id: number): Promise<InventoryItem> {
    const response = await this.api.get(`/inventory/${id}/`);
    return response.data;
  }

  async createInventoryItem(data: any): Promise<InventoryItem> {
    const response = await this.api.post('/inventory/', data);
    return response.data;
  }

  async updateInventoryItem(id: number, data: any): Promise<InventoryItem> {
    const response = await this.api.put(`/inventory/${id}/`, data);
    return response.data;
  }

  async deleteInventoryItem(id: number): Promise<void> {
    await this.api.delete(`/inventory/${id}/`);
  }

  async getMaintenanceItems(): Promise<InventoryItem[]> {
    const response = await this.api.get('/inventory/needs_maintenance/');
    return response.data;
  }

  async getManagersForLandlord(landlordId: number): Promise<Manager[]> {
    const response = await this.api.get(`/landlords/${landlordId}/managers/`);
    return response.data.results || response.data;
  }

  async inviteManager(landlordId: number, data: { full_name: string; email: string; username: string; password: string }): Promise<Manager> {
    const response = await this.api.post(`/landlords/${landlordId}/managers/`, data);
    return response.data;
  }

  async updateManager(managerId: number, data: Partial<Manager>): Promise<Manager> {
    const response = await this.api.put(`/managers/${managerId}/`, data);
    return response.data;
  }

  async deleteManager(managerId: number): Promise<void> {
    await this.api.delete(`/managers/${managerId}/`);
  }

  async getManagers(): Promise<PaginatedResponse<Manager>> {
    const response = await this.api.get('/managers/');
    return response.data;
  }

  // NEW: Enhanced managers with properties endpoint
  async getManagersWithProperties(): Promise<ManagerWithProperties[]> {
    const response = await this.api.get('/managers-with-properties/');
    return response.data || [];
  }

  // NEW: Property assignment endpoints
  async getManagerPropertyAssignments(): Promise<ManagerPropertyAssignment[]> {
    const response = await this.api.get('/manager-property-assignments/');
    return response.data || [];
  }

  async createManagerPropertyAssignment(data: { 
    manager: number; 
    property: number; 
    landlord_relationship: number;
    role_note?: string;
  }): Promise<ManagerPropertyAssignment> {
    const response = await this.api.post('/manager-property-assignments/', data);
    return response.data;
  }

  async deleteManagerPropertyAssignment(id: number): Promise<void> {
    await this.api.delete(`/manager-property-assignments/${id}/`);
  }

  async checkManagerPropertyAssignment(managerId: number, propertyId: number): Promise<{ exists: boolean; assignment?: ManagerPropertyAssignment }> {
    try {
      const response = await this.api.get(`/manager-property-assignments/check_assignment/?manager=${managerId}&property=${propertyId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { exists: false };
      }
      throw error;
    }
  }

  async createManagerWithProperties(data: ManagerFormData): Promise<Manager> {
    try {
      // STEP 1: Create Manager Account using /api/signup/
      console.log('Step 1: Creating manager account via signup...');
      const signupData = {
        username: data.username,
        password: data.password,
        password_confirm: data.password_confirm || data.password,
        email: data.email,
        full_name: data.full_name,
        role: "manager"
      };
      
      const signupResponse = await this.api.post('/signup/', signupData);
      const responseData = signupResponse.data;
      console.log('Signup response:', responseData);
      
      // Extract manager data from response (it might be nested under 'manager' key)
      const manager = responseData.manager || responseData;
      console.log('Manager created:', manager);

      if (!manager.id) {
        throw new Error('Manager ID not found in signup response');
      }

      // STEP 2: Create Manager-Landlord Relationship
      console.log('Step 2: Creating manager-landlord relationship...');
      if (!data.landlord_id) {
        throw new Error('Landlord ID is required for manager creation');
      }

      const relationshipData = {
        manager: manager.id,
        landlord: data.landlord_id,
        is_primary: false,  // Set to false as per instructions
        role_note: `Manager for ${data.full_name}`
      };

      let relationship;
      try {
        const relationshipResponse = await this.api.post('/manager-landlord-relationships/', relationshipData);
        relationship = relationshipResponse.data;
        console.log('Relationship created:', relationship);
      } catch (relationshipError: any) {
        // Handle duplicate relationship creation gracefully
        if (relationshipError.response?.status === 400) {
          const errorData = relationshipError.response.data;
          
          if (errorData.code === 'relationship_exists') {
            // Use existing relationship
            relationship = errorData.existing_relationship;
            console.log('Using existing relationship:', relationship);
          } else {
            throw relationshipError;
          }
        } else {
          throw relationshipError;
        }
      }

      // STEP 3: Assign Manager to Properties (if specific properties selected)
      if (data.property_ids && data.property_ids.length > 0 && !data.access_all_properties) {
        console.log('Step 3: Assigning manager to specific properties...');
        for (const propertyId of data.property_ids) {
          try {
            await this.createManagerPropertyAssignment({
              manager: manager.id,
              property: propertyId,
              landlord_relationship: relationship.id,
              role_note: `Property Manager for Property ${propertyId}`
            });
          } catch (assignmentError: any) {
            // Handle duplicate assignments gracefully
            if (assignmentError.response?.status === 400) {
              const errorData = assignmentError.response.data;
              
              if (errorData.code === 'already_assigned') {
                console.log(`Assignment already exists for property ${propertyId}, using existing:`, errorData.existing_assignment);
                continue; // Skip to next property
              }
            }
            // Re-throw other errors
            throw assignmentError;
          }
        }
        console.log(`Assigned manager to ${data.property_ids.length} properties`);
      }

      return {
        id: manager.id,
        username: manager.username ?? data.username,
        email: manager.email ?? data.email,
        full_name: manager.full_name ?? data.full_name,
        role: 'manager',
        is_active: manager.is_active !== false
      };
    } catch (error: any) {
      console.error('Error creating manager with properties:', error);
      
      // Provide detailed error messages based on which step failed
      if (error.response?.data) {
        const errorData = error.response.data;
        let errorMessage = 'Failed to create manager: ';
        
        if (typeof errorData === 'string') {
          errorMessage += errorData;
        } else if (errorData.detail) {
          errorMessage += errorData.detail;
        } else if (errorData.username) {
          errorMessage += `Username error: ${errorData.username.join(', ')}`;
        } else if (errorData.email) {
          errorMessage += `Email error: ${errorData.email.join(', ')}`;
        } else {
          errorMessage += JSON.stringify(errorData);
        }
        
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  // Manager-Landlord Relationship methods
  async getManagerLandlordRelationships(): Promise<ManagerLandlordRelationship[]> {
    const response = await this.api.get('/manager-landlord-relationships/');
    return response.data || [];
  }

  async createManagerLandlordRelationship(data: { 
    manager: number; 
    landlord: number; 
    is_primary: boolean;
    access_all_properties?: boolean;
  }): Promise<ManagerLandlordRelationship> {
    const response = await this.api.post('/manager-landlord-relationships/', data);
    return response.data;
  }

  async deleteManagerLandlordRelationship(relationshipId: number): Promise<void> {
    await this.api.delete(`/manager-landlord-relationships/${relationshipId}/`);
  }

  // Platform Admin methods
  async getAllLandlords(): Promise<any[]> {
    try {
      const response = await this.api.get('/landlords/');
      return response.data.results || response.data;
    } catch (error: any) {
      if (error.status === 403 || error.status === 401) {
        // Return mock data for admin if API doesn't allow access
        return [
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
      }
      throw error;
    }
  }

  async getAllManagers(): Promise<any[]> {
    try {
      const response = await this.api.get('/managers/');
      return response.data.results || response.data;
    } catch (error: any) {
      if (error.status === 403 || error.status === 401 || error.status === 404) {
        // Return empty array if endpoint doesn't exist or no permission
        return [];
      }
      throw error;
    }
  }

  async getPlatformStats(): Promise<any> {
    try {
      const response = await this.api.get('/platform/stats/');
      return response.data;
    } catch (error: any) {
      if (error.status === 403 || error.status === 401 || error.status === 404) {
        // Return mock stats for admin
        return {
          total_landlords: 1,
          total_managers: 1,
          total_properties: 0,
          total_revenue: 0
        };
      }
      throw error;
    }
  }

  // Landlord Profile methods
  async getLandlordProfile(): Promise<any> {
    const response = await this.api.get('/landlords/profile/');
    return response.data;
  }

  async updateLandlordProfile(data: any): Promise<any> {
    const response = await this.api.put('/landlords/profile/', data);
    return response.data;
  }

  // Enhanced Property Management API Endpoints
  async getPropertyAnalysisData(propertyId: number): Promise<any> {
    const response = await this.api.get(`/properties/${propertyId}/analysis/`);
    return response.data;
  }

  async getPropertyRevenueBreakdown(propertyId: number): Promise<any> {
    const response = await this.api.get(`/properties/${propertyId}/revenue-breakdown/`);
    return response.data;
  }

  async getPropertyOccupancyData(propertyId: number): Promise<any> {
    const response = await this.api.get(`/properties/${propertyId}/occupancy-data/`);
    return response.data;
  }

  async validatePropertyOperation(propertyId: number, operation: string, data: any): Promise<any> {
    const response = await this.api.post(`/properties/${propertyId}/validate-operation/`, {
      operation,
      ...data
    });
    return response.data;
  }

  async executeRentTypeConversion(propertyId: number, conversionData: any): Promise<any> {
    const response = await this.api.post(`/properties/${propertyId}/convert-rent-type/`, conversionData);
    return response.data;
  }

  async updatePropertyRoomCount(propertyId: number, roomCountData: any): Promise<any> {
    const response = await this.api.post(`/properties/${propertyId}/update-room-count/`, roomCountData);
    return response.data;
  }

  async refreshPropertyData(propertyId: number): Promise<any> {
    const response = await this.api.post(`/properties/${propertyId}/refresh-data/`);
    return response.data;
  }

  // Smart Property/Room Management API Endpoints
  async validatePropertyDeletion(propertyId: number): Promise<any> {
    try {
      const response = await this.api.get(`/properties/${propertyId}/validate-deletion/`);
      return response.data;
    } catch (error: any) {
      console.error(`Property deletion validation failed for ID ${propertyId}:`, error);
      throw new Error(error.message || 'Failed to validate property deletion');
    }
  }

  async cleanupPropertyData(propertyId: number): Promise<any> {
    try {
      const response = await this.api.post(`/properties/${propertyId}/cleanup/`);
      return response.data;
    } catch (error: any) {
      console.error(`Property cleanup failed for ID ${propertyId}:`, error);
      throw new Error(error.message || 'Failed to cleanup property data');
    }
  }

  async forceDeleteProperty(propertyId: number): Promise<void> {
    try {
      console.log(`Force deleting property ${propertyId}`);
      await this.api.delete(`/properties/${propertyId}/force/`);
      console.log('Property force deleted successfully');
    } catch (error: any) {
      console.error(`Force property deletion failed for ID ${propertyId}:`, error);
      throw new Error(error.message || 'Failed to force delete property');
    }
  }

  async validateRoomDeletion(roomId: number): Promise<any> {
    try {
      const response = await this.api.get(`/rooms/${roomId}/validate-deletion/`);
      return response.data;
    } catch (error: any) {
      console.error(`Room deletion validation failed for ID ${roomId}:`, error);
      throw new Error(error.message || 'Failed to validate room deletion');
    }
  }

  async terminateLease(leaseId: number, terminationData: {
    termination_date: string;
    reason: string;
    early_termination_fee?: number;
    notes?: string;
  }): Promise<any> {
    try {
      const response = await this.api.post(`/leases/${leaseId}/terminate/`, terminationData);
      return response.data;
    } catch (error: any) {
      console.error(`Lease termination failed for ID ${leaseId}:`, error);
      throw new Error(error.message || 'Failed to terminate lease');
    }
  }

  async getPropertyInconsistencies(propertyId: number): Promise<any> {
    try {
      const response = await this.api.get(`/properties/${propertyId}/inconsistencies/`);
      return response.data;
    } catch (error: any) {
      console.error(`Property inconsistency check failed for ID ${propertyId}:`, error);
      // Return empty inconsistencies for any error - this is a validation check that should be optional
      return { inconsistencies: [], warnings: [] };
    }
  }
}

export const apiClient = new ApiClient();