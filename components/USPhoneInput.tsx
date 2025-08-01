import React from 'react';

interface USPhoneInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string | null;
  readOnly?: boolean;
}

export default function USPhoneInput({
  id,
  name,
  value,
  onChange,
  placeholder = "(555) 123-4567",
  className = "",
  disabled = false,
  required = false,
  error = null,
  readOnly = false
}: USPhoneInputProps) {
  
  // Format phone number as user types (US format only)
  const formatPhoneNumber = (inputValue: string): string => {
    // Remove all non-digits
    const digits = inputValue.replace(/\D/g, '');
    
    // Limit to 10 digits maximum
    const limitedDigits = digits.slice(0, 10);
    
    // Format based on length
    if (limitedDigits.length <= 3) {
      return limitedDigits;
    } else if (limitedDigits.length <= 6) {
      return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3)}`;
    } else {
      return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`;
    }
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatPhoneNumber(rawValue);
    onChange(formattedValue);
  };

  // Handle paste event to ensure only digits are processed
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const formattedValue = formatPhoneNumber(pastedText);
    onChange(formattedValue);
  };

  // Handle key press to only allow digits and navigation keys
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    
    if (allowedKeys.includes(e.key)) {
      return;
    }
    
    // Only allow digits
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className="us-phone-input-container">
      <div className="phone-input-wrapper">
        {/* US Flag and Country Code - Always visible and non-changeable */}
        <div className="country-code-display">
          <span className="flag-emoji" aria-label="United States">🇺🇸</span>
          <span className="country-code">+1</span>
        </div>
        
        {/* Phone Number Input */}
        <input
          id={id}
          name={name}
          type="tel"
          value={value}
          onChange={handleChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          className={`phone-number-input ${className} ${error ? 'error' : ''}`}
          disabled={disabled}
          required={required}
          readOnly={readOnly}
          maxLength={14} // (555) 123-4567 format
          autoComplete="tel"
        />
      </div>
      
      {error && (
        <div className="phone-input-error">
          {error}
        </div>
      )}
    </div>
  );
}

// Export utility functions for phone validation
export const validateUSPhone = (phoneNumber: string): boolean => {
  const digits = phoneNumber.replace(/\D/g, '');
  return digits.length === 10;
};

export const getUSPhoneError = (phoneNumber: string): string | null => {
  if (!phoneNumber.trim()) {
    return 'Phone number is required';
  }
  
  const digits = phoneNumber.replace(/\D/g, '');
  
  if (digits.length === 0) {
    return 'Phone number is required';
  } else if (digits.length < 10) {
    return 'Phone number must be 10 digits';
  } else if (digits.length > 10) {
    return 'Phone number must be exactly 10 digits';
  }
  
  return null;
};

export const toE164Format = (formattedPhone: string): string => {
  const digits = formattedPhone.replace(/\D/g, '');
  return digits.length === 10 ? `+1${digits}` : formattedPhone;
}; 