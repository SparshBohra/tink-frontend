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
  rent_type?: 'per_property' | 'per_room';
  monthly_rent?: number | string | null;
  effective_rent?: number | string | null;
  effective_security_deposit?: number | string | null;
}

export interface Room {
  id: number;
  property_ref: number;
  name: string;
  room_number?: string;
  room_type?: string;
  floor?: string;
  floor_number?: number;
  max_capacity: number;
  current_occupancy: number;
  monthly_rent?: string | number;
  security_deposit?: string | number;
  is_occupied?: boolean;
  is_vacant: boolean;
  is_available?: boolean;
  available_from?: string;
  available_until?: string;
  room_features?: string[] | string;
  square_footage?: number;
  occupancy_rate: number;
  last_occupied_at?: string;
  property_name: string;
  can_add_tenant: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ApplicationViewing {
  id: number;
  application: number;
  scheduled_date: string;
  scheduled_time: string;
  contact_person: string;
  contact_phone: string;
  viewing_notes: string;
  completed_at?: string;
  outcome?: 'positive' | 'negative' | 'neutral';
  tenant_feedback?: string;
  landlord_notes?: string;
  next_action?: string;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: number;
  tenant: number;
  room: number;
  property_ref: number;
  status: ApplicationStatus;
  application_date: string;
  move_in_date?: string;
  desired_move_in_date?: string;
  rent_budget?: number;
  notes?: string;
  tenant_name?: string;
  tenant_email?: string;
  tenant_phone?: string;
  property_name?: string;
  room_name?: string;
  monthly_income?: number;
  occupation?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  days_pending?: number;
  decision_date?: string;
  decision_notes?: string;
  lease_id?: number;
  lease_start_date?: string;
  lease_end_date?: string;
  monthly_rent?: number;
  security_deposit?: number;
  room_assignment?: any;
  lease_terms?: any;
  viewings?: ApplicationViewing[];
  created_at: string;
  updated_at: string;
  // Enhanced fields for MVP improvements
  priority_score?: number; // 0-100 scoring
  match_score?: number; // Room compatibility score
  has_conflicts?: boolean; // Conflict detection
  conflicting_applications?: number[]; // Related conflicts
  is_budget_compatible?: boolean; // Budget validation
  urgency_level?: 'low' | 'medium' | 'high'; // Priority level
  recommended_rooms?: number[]; // Suggested room IDs
}

// Application status constants - Enhanced workflow with 9 states
export const APPLICATION_STATUSES = {
  PENDING: 'pending' as const,
  APPROVED: 'approved' as const,
  VIEWING_SCHEDULED: 'viewing_scheduled' as const,
  VIEWING_COMPLETED: 'viewing_completed' as const,
  ROOM_ASSIGNED: 'room_assigned' as const,
  LEASE_READY: 'lease_ready' as const,
  LEASE_CREATED: 'lease_created' as const,
  LEASE_SIGNED: 'lease_signed' as const,
  MOVED_IN: 'moved_in' as const,
  REJECTED: 'rejected' as const,
  // Legacy statuses for backward compatibility
  PROCESSING: 'processing' as const,
  WITHDRAWN: 'withdrawn' as const,
  ACTIVE: 'active' as const,
} as const;

export type ApplicationStatus = typeof APPLICATION_STATUSES[keyof typeof APPLICATION_STATUSES];

// Status helper functions
export const getStatusDisplayName = (status: ApplicationStatus): string => {
  switch (status) {
    case APPLICATION_STATUSES.PENDING: return 'Awaiting Review';
    case APPLICATION_STATUSES.APPROVED: return 'Approved - Viewing Needed';
    case APPLICATION_STATUSES.VIEWING_SCHEDULED: return 'Viewing Scheduled';
    case APPLICATION_STATUSES.VIEWING_COMPLETED: return 'Viewing Complete';
    case APPLICATION_STATUSES.ROOM_ASSIGNED: return 'Room Assigned';
    case APPLICATION_STATUSES.LEASE_READY: return 'Lease Ready';
    case APPLICATION_STATUSES.LEASE_CREATED: return 'Lease Generated';
    case APPLICATION_STATUSES.LEASE_SIGNED: return 'Lease Signed';
    case APPLICATION_STATUSES.MOVED_IN: return 'Moved In';
    case APPLICATION_STATUSES.REJECTED: return 'Rejected';
    case APPLICATION_STATUSES.PROCESSING: return 'Processing'; // Legacy
    case APPLICATION_STATUSES.WITHDRAWN: return 'Withdrawn'; // Legacy
    case APPLICATION_STATUSES.ACTIVE: return 'Active'; // Legacy
    default: return status;
  }
};

export const getStatusIcon = (status: ApplicationStatus): string => {
  switch (status) {
    case APPLICATION_STATUSES.PENDING: return '🟡';
    case APPLICATION_STATUSES.APPROVED: return '🟢';
    case APPLICATION_STATUSES.VIEWING_SCHEDULED: return '📅';
    case APPLICATION_STATUSES.VIEWING_COMPLETED: return '✅';
    case APPLICATION_STATUSES.ROOM_ASSIGNED: return '🏠';
    case APPLICATION_STATUSES.LEASE_READY: return '📋';
    case APPLICATION_STATUSES.LEASE_CREATED: return '📄';
    case APPLICATION_STATUSES.LEASE_SIGNED: return '✍️';
    case APPLICATION_STATUSES.MOVED_IN: return '🏡';
    case APPLICATION_STATUSES.REJECTED: return '❌';
    case APPLICATION_STATUSES.PROCESSING: return '🔄'; // Legacy
    case APPLICATION_STATUSES.WITHDRAWN: return '🚫'; // Legacy
    case APPLICATION_STATUSES.ACTIVE: return '🏡'; // Legacy
    default: return '⚪';
  }
};

export const getStatusColor = (status: ApplicationStatus): string => {
  switch (status) {
    case APPLICATION_STATUSES.PENDING: return 'bg-yellow-100 text-yellow-800';
    case APPLICATION_STATUSES.APPROVED: return 'bg-green-100 text-green-800';
    case APPLICATION_STATUSES.VIEWING_SCHEDULED: return 'bg-blue-100 text-blue-800';
    case APPLICATION_STATUSES.VIEWING_COMPLETED: return 'bg-emerald-100 text-emerald-800';
    case APPLICATION_STATUSES.ROOM_ASSIGNED: return 'bg-purple-100 text-purple-800';
    case APPLICATION_STATUSES.LEASE_READY: return 'bg-indigo-100 text-indigo-800';
    case APPLICATION_STATUSES.LEASE_CREATED: return 'bg-cyan-100 text-cyan-800';
    case APPLICATION_STATUSES.LEASE_SIGNED: return 'bg-teal-100 text-teal-800';
    case APPLICATION_STATUSES.MOVED_IN: return 'bg-green-100 text-green-800';
    case APPLICATION_STATUSES.REJECTED: return 'bg-red-100 text-red-800';
    case APPLICATION_STATUSES.PROCESSING: return 'bg-blue-100 text-blue-800'; // Legacy
    case APPLICATION_STATUSES.WITHDRAWN: return 'bg-gray-100 text-gray-800'; // Legacy
    case APPLICATION_STATUSES.ACTIVE: return 'bg-green-100 text-green-800'; // Legacy
    default: return 'bg-gray-100 text-gray-800';
  }
};

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
  // Additional fields from backend serializer
  tenant_name?: string;
  tenant_email?: string;
  property_name?: string;
  room_name?: string;
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
  rent_type: 'per_property' | 'per_room';
  monthly_rent: string;
  landlord?: number;
  total_rooms: number;
  room_names?: string[];
  room_types?: string[];
  room_rents?: string[];
  room_capacities?: number[];
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
  property_ref: number;
  room?: number;
  desired_move_in_date: string;
  desired_lease_duration: number;
  rent_budget: number;
  message?: string;
  special_requests?: string;
  // New fields for listing support
  listing_id?: number;
  source?: 'direct' | 'public_listing';
  form_responses?: any;
}

export interface LeaseFormData {
  tenant: number;
  room: number;
  /** Optional: link lease directly to property instead of a specific room */
  property_ref?: number;
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

export interface ManagerWithProperties {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  phone?: string;
  date_joined?: string;
  assigned_properties?: AssignedProperty[];
  access_level?: 'full' | 'limited';
  landlord_name?: string;
  landlord_id?: number;
  landlord_org_name?: string;
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
  password_confirm?: string;
  email: string;
  full_name: string;
  landlord_id?: number;
  property_ids?: number[];
  access_all_properties?: boolean;
}

export interface AssignedProperty {
  id: number;
  name: string;
  address?: string;
  full_address?: string;
  total_rooms?: number;
  vacant_rooms?: number;
}

export interface ManagerLandlordRelationship {
  id: number;
  manager: number;
  landlord: number;
  is_primary: boolean;
  access_all_properties?: boolean;
}

export interface PropertyListing {
  id: number;
  property_ref: number;
  landlord_id: number;
  title: string;
  description: string;
  listing_type: 'rooms' | 'whole_property';
  available_rooms: number[];
  application_form_config: ApplicationFormConfig;
  public_slug: string;
  is_active: boolean;
  view_count: number;
  application_count: number;
  featured_image_url?: string;
  available_from?: string;
  created_at: string;
  updated_at: string;
  // Additional fields from API response
  property_name?: string;
  property_address?: string;
  landlord_name?: string;
  available_room_details?: AvailableRoomDetail[];
  property_details?: PropertyDetail;
  contact_info?: ContactInfo;
  media?: ListingMedia[];
  // Public listing specific fields
  property_type?: string;
  max_occupancy?: number;
  application_deadline?: string;
  min_lease_term?: number;
  max_lease_term?: number;
  pet_policy?: string;
  furnished?: boolean;
  utilities_included?: string[];
  amenities?: string[];
  virtual_tour_url?: string;
  smoking_allowed?: boolean;
  application_fee?: number;
  security_deposit?: number;
}

export interface ListingMedia {
  id: number;
  listing_id: number;
  media_type: 'image' | 'video';
  url: string;
  file_url?: string; // Alternative field name for media URL
  caption?: string;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface AvailableRoomDetail {
  id: number;
  name: string;
  room_type: string;
  monthly_rent: number;
  square_footage?: number;
  room_features?: string[];
  floor_number?: number;
}

export interface PropertyDetail {
  name: string;
  property_type: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
  };
  timezone: string;
}

export interface ContactInfo {
  landlord_name: string;
  contact_email: string;
  contact_phone?: string;
}

export interface ApplicationFormConfig {
  steps: {
    [key: string]: {
      enabled: boolean;
      mandatory: boolean;
      [key: string]: any;
    };
  };
  global_settings?: {
    allow_save_and_continue?: boolean;
    session_timeout?: number;
    auto_save_interval?: number;
    progress_indicator?: boolean;
    mobile_optimized?: boolean;
    application_fee?: number;
    minimum_income_ratio?: number;
    required_documents?: string[];
  };
}

export interface ListingFormData {
  property_ref: number;
  title: string;
  description: string;
  listing_type: 'rooms' | 'whole_property';
  available_rooms?: number[];
  application_form_config: ApplicationFormConfig;
  available_from?: string;
  featured_image_url?: string;
}

export interface PublicApplicationData {
  tenant: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  room_preference?: number;
  desired_move_in_date: string;
  desired_lease_duration?: number;
  rent_budget?: number;
  message?: string;
  employment_info?: {
    employer?: string;
    position?: string;
    annual_income?: number;
  };
  [key: string]: any; // For additional form fields
} 

// Stripe Connect Types
export interface StripeConnectAccountData {
  business_type: 'individual' | 'company';
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  company?: {
    name: string;
    tax_id?: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
}

export interface StripeConnectAccountStatus {
  status: 'not_created' | 'onboarding_pending' | 'verification_pending' | 'active' | 'restricted' | 'rejected';
  account_id?: string;
  details_submitted: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  landlord_id: number;
  message?: string;
  requirements?: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
    pending_verification: string[];
  };
}

export interface StripeConnectAccountSession {
  client_secret: string;
  url?: string;
  expires_at?: number;
}

export interface StripeConnectAccountLink {
  url: string;
  expires_at: number;
  created: number;
}

export interface StripeConnectSessionData {
  account_id?: string;
  refresh_url: string;
  return_url: string;
}

export interface StripeConnectLinkData {
  refresh_url: string;
  return_url: string;
}

export interface LandlordSignupData {
  org_name: string;
  contact_email: string;
  contact_phone?: string;
  address?: string;
  full_name: string;
  username: string;
  password: string;
  password_confirm: string;
} 

// PAYMENT TYPES FOR STRIPE INTEGRATION

export interface PaymentIntentRequest {
  lease_id: number;
  rent_period_start?: string; // ISO date string
  amount?: number; // Optional custom amount in dollars
}

export interface PaymentIntentResponse {
  success: true;
  client_secret: string;
  payment_intent_id: string;
  amount_cents: number;
  amount_dollars: number;
  currency: string;
  lease_id: number;
  landlord: string;
  property: string | null;
  rent_period: string; // ISO date string
}

export interface PaymentRecord {
  id: number;
  payment_intent_id: string;
  amount_dollars: number;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled' | 'refunded';
  payment_date: string; // ISO datetime string
  rent_period_start: string; // ISO date string
  rent_period_end: string; // ISO date string
  description: string;
  tenant_name: string;
  landlord_name: string;
  property_name: string | null;
  stripe_fee_dollars: number;
  net_amount_dollars: number;
  is_late_payment: boolean;
}

export interface PaymentHistoryResponse {
  payments: PaymentRecord[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_count: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export interface PaymentSummary {
  current_month_total_dollars: number;
  last_30_days_total_dollars: number;
  total_successful_payments: number;
  pending_payments: number;
  failed_payments: number;
}

export interface RecentPayment {
  id: number;
  amount_dollars: number;
  tenant_name: string;
  property_name: string | null;
  payment_date: string; // ISO date string
  status: 'pending' | 'succeeded' | 'failed' | 'canceled' | 'refunded';
}

export interface PaymentSummaryResponse {
  summary: PaymentSummary;
  recent_payments: RecentPayment[];
}

// Stripe-specific types
export interface StripePaymentIntent {
  id: string;
  client_secret: string;
  status: string;
  amount: number;
  currency: string;
}

export interface StripeError {
  type: string;
  code: string;
  message: string;
}

export interface PaymentFormData {
  amount: number;
  lease_id: number;
  rent_period_start: string;
  save_payment_method?: boolean;
}

// API Error types
export interface PaymentError {
  error: string;
  error_type?: 'account_missing' | 'charges_disabled' | 'stripe_error' | 'validation_error';
  details?: {
    stripe_account_id: boolean;
    details_submitted: boolean;
    charges_enabled: boolean;
  };
}

// Tenant Authentication Types
export interface TenantOtpRequest {
  phone_number: string;
}

export interface TenantOtpResponse {
  success: boolean;
  message: string;
  phone_number?: string;
  tenant_name?: string;
  expires_in_minutes?: number;
  error?: string;
  error_type?: string;
}

export interface TenantOtpVerification {
  phone_number: string;
  otp_code: string;
}

export interface TenantAuthTokens {
  refresh: string;
  access: string;
}

export interface TenantAuthResponse {
  success: boolean;
  message: string;
  tokens?: TenantAuthTokens;
  tenant?: {
    id: number;
    full_name: string;
    email: string;
    phone: string;
    is_verified: boolean;
  };
  error?: string;
  error_type?: string;
  remaining_attempts?: number;
}

export interface TenantProfile {
  tenant: {
    id: number;
    full_name: string;
    email: string;
    phone: string;
    is_verified: boolean;
    last_login?: string;
    created_at: string;
  };
  active_lease?: {
    id: number;
    monthly_rent: number;
    start_date: string;
    end_date: string;
    status: string;
    property: {
      id: number;
      name: string;
      address: string;
    };
    room?: {
      id: number;
      name: string;
    };
  };
  payment_status: {
    has_active_lease: boolean;
    current_rent?: number;
    property_name?: string;
    room_name?: string;
  };
}

export interface TenantLogoutResponse {
  success: boolean;
  message: string;
} 