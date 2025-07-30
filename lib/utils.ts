import { format, toZonedTime } from 'date-fns-tz';
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

// Phone number validation and formatting utilities
export const phoneUtils = {
  // Format phone number as user types
  formatPhoneNumber: (value: string): string => {
    // Remove all non-digits
    const phoneNumber = value.replace(/\D/g, '');
    
    // Don't format if empty
    if (!phoneNumber) return '';
    
    // Format based on length
    if (phoneNumber.length <= 3) {
      return `(${phoneNumber}`;
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    }
  },

  // Validate phone number format
  validatePhoneNumber: (phoneNumber: string): boolean => {
    // Remove all formatting and non-digits
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if it's exactly 10 digits (US format)
    return cleaned.length === 10;
  },

  // Get error message for invalid phone
  getPhoneErrorMessage: (phoneNumber: string): string | null => {
    if (!phoneNumber.trim()) {
      return 'Phone number is required';
    }
    
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.length === 0) {
      return 'Phone number is required';
    } else if (cleaned.length < 10) {
      return 'Phone number must be 10 digits';
    } else if (cleaned.length > 10) {
      return 'Phone number must be exactly 10 digits';
    }
    
    return null;
  },

  // Clean phone number for storage (removes formatting)
  cleanPhoneNumber: (phoneNumber: string): string => {
    return phoneNumber.replace(/\D/g, '');
  },

  // Format phone number for display
  displayPhoneNumber: (phoneNumber: string): string => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phoneNumber; // Return as-is if not 10 digits
  },

  // Convert phone number to E.164 format for API (e.g., +15551234567)
  toE164Format: (phoneNumber: string, countryCode: string = '+1'): string => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // If it's already in E.164 format, return as-is
    if (phoneNumber.startsWith('+')) {
      return phoneNumber;
    }
    
    // For US numbers, add +1 prefix
    if (cleaned.length === 10) {
      return `${countryCode}${cleaned}`;
    }
    
    // If it's 11 digits and starts with 1, format it
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    
    // Return original if we can't format it
    return phoneNumber;
  }
}; 

/**
 * Convert S3 media URLs to Django serving URLs
 * This solves the S3 public access issue by serving files through Django
 */
export function getMediaUrl(url: string): string {
  if (!url) return '';
  
  // If it's already a Django URL, return as-is
  if (url.includes('/api/properties/media/')) {
    return url;
  }
  
  // Convert S3 URLs to Django URLs
  if (url.includes('s3.amazonaws.com') || url.includes('.s3.')) {
    // Extract the file path from S3 URL
    // Example: https://bucket.s3.amazonaws.com/media/path/file.jpg -> path/file.jpg
    const mediaMatch = url.match(/\/media\/(.+)$/);
    if (mediaMatch) {
      const filePath = mediaMatch[1];
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_API_URL || 'https://tink.global'
        : 'http://localhost:8000';
      return `${baseUrl}/api/properties/media/${filePath}`;
    }
  }
  
  // If it's a local URL path, convert to Django URL
  if (url.startsWith('/media/') || url.startsWith('media/')) {
    const filePath = url.replace(/^\/media\//, '').replace(/^media\//, '');
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_API_URL || 'https://tink.global'
      : 'http://localhost:8000';
    return `${baseUrl}/api/properties/media/${filePath}`;
  }
  
  // Return original URL if no conversion needed
  return url;
}

export function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export const formatUTCDate = (dateString: string, timeZone: string = 'UTC') => {
  if (!dateString) return '';
  try {
    const zonedDate = toZonedTime(dateString, timeZone);
    return format(zonedDate, 'MMMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString; // Fallback to original string
  }
};
