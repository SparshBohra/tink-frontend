// API Response Types
export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

export interface Manager {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

export interface Tenant {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  current_address?: string;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: number;
  landlord: number;
  name: string;
  address: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  unit_number?: string;
  pin_code?: string;
  full_address: string;
  property_type: string;
  description?: string;
  timezone: string;
  timezone_display: string;
  lat?: number;
  lon?: number;
  total_rooms: number;
  vacant_rooms: number;
  landlord_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface Room {
  id: number;
  property_ref: number;
  name: string;
  room_number?: string;
  room_type?: string;
  floor?: string;
  max_capacity: number;
  current_occupancy: number;
  monthly_rent?: number;
  security_deposit?: number;
  is_occupied?: boolean;
  is_vacant: boolean;
  occupancy_rate: number;
  last_occupied_at?: string;
  property_name: string;
  can_add_tenant: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Application {
  id: number;
  tenant: number;
  room: number;
  status: string;
  application_date: string;
  move_in_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Lease {
  id: number;
  tenant: number;
  room: number;
  property_ref?: number;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  security_deposit: number;
  status: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Landlord {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  company_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: number;
  tenant: number;
  document_type: string;
  file_url: string;
  notes?: string;
  uploaded_at: string;
}

export interface Occupancy {
  id: number;
  tenant: number;
  room: number;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: number;
  property_ref: number;
  room?: number;
  name: string;
  description?: string;
  qty: number;
  cost?: number;
  condition_status: string;
  last_checked?: string;
  purchase_date?: string;
  needs_maintenance: boolean;
  property_name?: string;
  room_name?: string;
  location_display?: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status: number;
}

export interface TenantFormData {
  full_name: string;
  email: string;
  phone: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  current_address?: string;
}

export interface PropertyFormData {
  name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  property_type: string;
  timezone: string;
}

export interface RoomFormData {
  property_ref: number;
  name: string;
  room_type: string;
  floor?: string;
  max_capacity?: number;
  monthly_rent: number;
  security_deposit: number;
}

export interface ApplicationFormData {
  tenant: number;
  room: number;
  move_in_date: string;
  notes?: string;
}

export interface LeaseFormData {
  tenant: number;
  room: number;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  security_deposit: number;
}

export interface DashboardStats {
  properties: {
    total: number;
    occupied: number;
    vacant: number;
  };
  rooms: {
    total: number;
    occupied: number;
    vacant: number;
    occupancy_rate: number;
  };
  tenants: {
    total: number;
    active: number;
  };
  revenue: {
    monthly: number;
    projected_annual: number;
  };
  applications: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  leases: {
    total: number;
    active: number;
    draft: number;
    expired: number;
  };
  managers: {
    total: number;
    active: number;
  };
}

export interface LandlordSignupData {
  full_name: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  confirm_password: string;
}

export interface ManagerWithProperties {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  properties?: Property[];
}

export interface ManagerPropertyAssignment {
  id: number;
  manager: number;
  property: number;
  landlord_relationship: number;
  role_note?: string;
}

export interface ManagerFormData {
  username: string;
  password: string;
  email: string;
  full_name: string;
  landlord_id?: number;
  property_ids?: number[];
  access_all_properties?: boolean;
}

export interface ManagerLandlordRelationship {
  id: number;
  manager: number;
  landlord: number;
  is_primary: boolean;
  access_all_properties?: boolean;
} 