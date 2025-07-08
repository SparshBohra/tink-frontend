// Property and Room form validation utilities
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface PropertyFormValidation {
  name: string;
  property_type: string;
  rent_type: 'per_room' | 'per_property';
  address_line1: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  timezone: string;
  monthly_rent?: string;
  total_rooms?: number;
}

export interface RoomFormValidation {
  name: string;
  room_type: string;
  max_capacity: number;
  monthly_rent: string;
  security_deposit: string;
}

// Property form validation
export function validatePropertyForm(data: PropertyFormValidation): ValidationResult {
  const errors: string[] = [];

  // Required field validation
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Property name is required');
  } else if (data.name.length > 200) {
    errors.push('Property name must be 200 characters or less');
  }

  if (!data.property_type) {
    errors.push('Property type is required');
  }

  if (!data.rent_type) {
    errors.push('Rent structure is required');
  }

  if (!data.address_line1 || data.address_line1.trim().length === 0) {
    errors.push('Address line 1 is required');
  }

  if (!data.city || data.city.trim().length === 0) {
    errors.push('City is required');
  }

  if (!data.state || data.state.trim().length === 0) {
    errors.push('State is required');
  }

  if (!data.postal_code || data.postal_code.trim().length === 0) {
    errors.push('Postal code is required');
  }

  if (!data.country || data.country.trim().length === 0) {
    errors.push('Country is required');
  }

  if (!data.timezone) {
    errors.push('Timezone is required');
  }

  // Conditional validation for per_property rent type
  if (data.rent_type === 'per_property') {
    if (!data.monthly_rent || data.monthly_rent.trim().length === 0) {
      errors.push('Monthly rent is required for per-property rent structure');
    } else {
      const rent = parseFloat(data.monthly_rent);
      if (isNaN(rent) || rent <= 0) {
        errors.push('Monthly rent must be a valid positive number');
      }
    }

    if (data.total_rooms && (data.total_rooms < 1 || data.total_rooms > 50)) {
      errors.push('Total rooms must be between 1 and 50');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Room form validation
export function validateRoomForm(data: RoomFormValidation): ValidationResult {
  const errors: string[] = [];

  // Required field validation
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Room name is required');
  } else if (data.name.length > 100) {
    errors.push('Room name must be 100 characters or less');
  }

  if (!data.room_type) {
    errors.push('Room type is required');
  }

  if (!data.monthly_rent || data.monthly_rent.trim().length === 0) {
    errors.push('Monthly rent is required');
  } else {
    const rent = parseFloat(data.monthly_rent);
    if (isNaN(rent) || rent <= 0) {
      errors.push('Monthly rent must be a valid positive number');
    }
  }

  if (!data.security_deposit || data.security_deposit.trim().length === 0) {
    errors.push('Security deposit is required');
  } else {
    const deposit = parseFloat(data.security_deposit);
    if (isNaN(deposit) || deposit < 0) {
      errors.push('Security deposit must be a valid non-negative number');
    }
  }

  if (data.max_capacity < 1 || data.max_capacity > 10) {
    errors.push('Max capacity must be between 1 and 10');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Utility functions for form handling
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[$,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function calculateDefaultSecurityDeposit(monthlyRent: string | number): string {
  const rent = typeof monthlyRent === 'string' ? parseFloat(monthlyRent) : monthlyRent;
  if (isNaN(rent) || rent <= 0) return '';
  return (rent * 2).toFixed(2);
}

export function generateRoomName(roomType: string, quantity: number, index: number): string {
  const typeLabels: Record<string, string> = {
    'standard': 'Standard Room',
    'suite': 'Suite',
    'studio': 'Studio',
    'shared': 'Shared Room',
    'single': 'Single Room',
    'double': 'Double Room',
    'premium': 'Premium Room'
  };

  const label = typeLabels[roomType] || roomType;
  
  if (quantity === 1) {
    return label;
  }
  
  return `${label} ${index}`;
}

// Property constants for consistent usage
export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment Building', description: 'Multi-unit apartment complex' },
  { value: 'house', label: 'Single-Family House', description: 'Individual residential house' },
  { value: 'dorm', label: 'Dormitory', description: 'Student or institutional housing' },
  { value: 'other', label: 'Other', description: 'Other property type' }
] as const;

export const RENT_TYPES = [
  { value: 'per_room', label: 'Rent is per room', description: 'Individual rent for each room' },
  { value: 'per_property', label: 'Rent is for the whole property', description: 'Single rent for entire property' }
] as const;

export const TIMEZONE_OPTIONS = [
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', description: 'West Coast time zone' },
  { value: 'America/New_York', label: 'Eastern Time (ET)', description: 'East Coast time zone' },
  { value: 'America/Chicago', label: 'Central Time (CT)', description: 'Central US time zone' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', description: 'Mountain time zone' },
  { value: 'Europe/London', label: 'GMT/BST', description: 'Greenwich Mean Time' },
  { value: 'Europe/Paris', label: 'CET/CEST', description: 'Central European Time' }
] as const;

export const ROOM_TYPES = [
  { value: 'standard', label: 'Standard Room', description: 'Basic room with standard amenities' },
  { value: 'suite', label: 'Suite', description: 'Large room with separate living area' },
  { value: 'studio', label: 'Studio', description: 'Open-plan room with kitchenette' },
  { value: 'shared', label: 'Shared Room', description: 'Shared accommodation with multiple beds' },
  { value: 'single', label: 'Single Occupancy', description: 'Room for one person' },
  { value: 'double', label: 'Double Occupancy', description: 'Room for two people' },
  { value: 'premium', label: 'Premium Room', description: 'High-end room with luxury amenities' }
] as const;

export const ROOM_FEATURES = [
  'ensuite', 'balcony', 'furnished', 'ac', 'heating', 
  'closet', 'desk', 'window', 'hardwood', 'carpet'
] as const;

// Type guards
export function isValidPropertyType(propertyType: string): propertyType is typeof PROPERTY_TYPES[number]['value'] {
  return PROPERTY_TYPES.some(pt => pt.value === propertyType);
}

export function isValidRentType(rentType: string): rentType is typeof RENT_TYPES[number]['value'] {
  return RENT_TYPES.some(rt => rt.value === rentType);
}

export function isValidRoomType(roomType: string): roomType is typeof ROOM_TYPES[number]['value'] {
  return ROOM_TYPES.some(rt => rt.value === roomType);
}

export function isValidTimezone(timezone: string): timezone is typeof TIMEZONE_OPTIONS[number]['value'] {
  return TIMEZONE_OPTIONS.some(tz => tz.value === timezone);
}

// Form state management helpers
export function createEmptyPropertyForm(): PropertyFormValidation {
  return {
    name: '',
    property_type: 'apartment',
    rent_type: 'per_room',
    address_line1: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'United States',
    timezone: 'America/Los_Angeles'
  };
}

export function createEmptyRoomForm(): RoomFormValidation {
  return {
    name: '',
    room_type: 'standard',
    max_capacity: 2,
    monthly_rent: '',
    security_deposit: ''
  };
}

// Error handling helpers
export function formatValidationErrors(errors: string[]): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0];
  
  const lastError = errors.pop();
  return `${errors.join(', ')}, and ${lastError}`;
}

export function extractApiErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  
  if (error?.message) return error.message;
  
  if (error?.response?.data?.message) return error.response.data.message;
  
  if (error?.response?.data?.error) return error.response.data.error;
  
  // Handle validation errors from Django REST framework
  if (error?.response?.data && typeof error.response.data === 'object') {
    const errors: string[] = [];
    
    for (const [field, messages] of Object.entries(error.response.data)) {
      if (Array.isArray(messages)) {
        errors.push(`${field}: ${messages.join(', ')}`);
      } else if (typeof messages === 'string') {
        errors.push(`${field}: ${messages}`);
      }
    }
    
    if (errors.length > 0) {
      return errors.join('; ');
    }
  }
  
  return 'An unexpected error occurred. Please try again.';
}

// Date formatting helpers
export function formatDate(date: string | Date): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  return d.toISOString().split('T')[0];
}

export function parseDate(dateString: string): Date | null {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) return null;
  
  return date;
}

export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(Number(value))) return '$0.00';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(Number(value));
}; 