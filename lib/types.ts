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
  name: string;
  address: string;
  property_type: string;
  description?: string;
  total_rooms: number;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: number;
  property: number;
  room_number: string;
  room_type: string;
  monthly_rent: number;
  security_deposit: number;
  is_occupied: boolean;
  created_at: string;
  updated_at: string;
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
  start_date: string;
  end_date: string;
  monthly_rent: number;
  security_deposit: number;
  status: string;
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
  property: number;
  room?: number;
  name: string;
  description?: string;
  qty: number;
  cost: number;
  purchase_date: string;
  needs_maintenance: boolean;
  created_at: string;
  updated_at: string;
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
  address: string;
  property_type: string;
  description?: string;
}

export interface RoomFormData {
  property: number;
  room_number: string;
  room_type: string;
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
  total_properties: number;
  total_rooms: number;
  occupied_rooms: number;
  total_tenants: number;
  pending_applications: number;
  active_leases: number;
  monthly_revenue: number;
}

export interface LandlordSignupData {
  full_name: string;
  email: string;
  phone: string;
  company_name?: string;
  username: string;
  password: string;
  confirm_password: string;
} 