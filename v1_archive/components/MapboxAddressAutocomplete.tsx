import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface AddressComponents {
  address_line1: string;
  city: string;
  state: string;
  postal_code: string;
}

interface MapboxFeature {
  place_name: string;
  properties: {
    address?: string;
  };
  context: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
}

// Portal component for suggestions dropdown
interface MapboxSuggestionsPortalProps {
  inputElement: HTMLInputElement;
  suggestions: MapboxFeature[];
  selectedIndex: number;
  onSelect: (feature: MapboxFeature) => void;
  onClose: () => void;
}

function MapboxSuggestionsPortal({ 
  inputElement, 
  suggestions, 
  selectedIndex, 
  onSelect, 
  onClose 
}: MapboxSuggestionsPortalProps) {
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  
  useEffect(() => {
    const updatePosition = () => {
      const rect = inputElement.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    };
    
    updatePosition();
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [inputElement]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.mapbox-suggestions-portal') && !inputElement.contains(target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputElement, onClose]);

  return createPortal(
    <div 
      className="mapbox-suggestions-portal"
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        width: position.width,
        zIndex: 99999,
        backgroundColor: 'white',
        border: '1px solid #d1d5db',
        borderRadius: '0 0 8px 8px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        maxHeight: '300px',
        overflowY: 'auto'
      }}
    >
      {suggestions.map((suggestion, index) => (
        <div
          key={suggestion.place_name}
          className={`mapbox-suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
          onClick={() => onSelect(suggestion)}
          style={{
            padding: '12px 16px',
            cursor: 'pointer',
            borderBottom: index < suggestions.length - 1 ? '1px solid #f3f4f6' : 'none',
            backgroundColor: index === selectedIndex ? '#f8fafc' : 'white',
            fontSize: '14px',
            color: '#374151',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => {
            if (index !== selectedIndex) {
              e.currentTarget.style.backgroundColor = '#f9fafb';
            }
          }}
          onMouseLeave={(e) => {
            if (index !== selectedIndex) {
              e.currentTarget.style.backgroundColor = 'white';
            }
          }}
        >
          {suggestion.place_name}
        </div>
      ))}
    </div>,
    document.body
  );
}

interface MapboxAddressAutocompleteProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (addressComponents: AddressComponents) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string | null;
  usePlaceName?: boolean; // If true, uses full place_name instead of just street address
}

export default function MapboxAddressAutocomplete({
  id,
  name,
  value,
  onChange,
  onAddressSelect,
  placeholder = "Enter address...",
  className = "",
  disabled = false,
  required = false,
  error = null,
  usePlaceName = false
}: MapboxAddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  // Debounced search function
  const searchAddresses = async (query: string) => {
    if (!query.trim() || !MAPBOX_ACCESS_TOKEN) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${MAPBOX_ACCESS_TOKEN}&` +
        `country=US&` +
        `types=address,place&` +
        `limit=5&` +
        `autocomplete=true`
      );

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.features || []);
        setShowSuggestions(true);
        setSelectedIndex(-1);
      } else {
        console.error('Mapbox API error:', response.statusText);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Address search error:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce the search
    debounceRef.current = setTimeout(() => {
      searchAddresses(newValue);
    }, 300);
  };

  // Parse address components from Mapbox feature
  const parseAddressComponents = (feature: MapboxFeature): AddressComponents => {
    const placeName = feature.place_name;
    
    // Extract components from context
    let city = '';
    let state = '';
    let postal_code = '';
    
    feature.context?.forEach(component => {
      if (component.id.startsWith('place')) {
        city = component.text;
      } else if (component.id.startsWith('region')) {
        state = component.short_code?.replace('US-', '') || component.text;
      } else if (component.id.startsWith('postcode')) {
        postal_code = component.text;
      }
    });

    // Extract street address (everything before the first comma)
    const address_line1 = placeName.split(',')[0].trim();

    return {
      address_line1,
      city,
      state,
      postal_code
    };
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (feature: MapboxFeature) => {
    const addressComponents = parseAddressComponents(feature);
    
    if (usePlaceName) {
      // Use the full place_name for single-field addresses
      onChange(feature.place_name);
    } else {
      // Use just the street address for multi-source addresses
      onChange(addressComponents.address_line1);
    }
    
    onAddressSelect(addressComponents);
    
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Click outside handling is now managed by the portal component

  // Show warning if no API key
  if (!MAPBOX_ACCESS_TOKEN) {
    return (
      <div className="mapbox-address-container">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`form-input ${className} ${error ? 'error' : ''}`}
          disabled={disabled}
          required={required}
        />
        <div className="mapbox-warning">
          <small>⚠️ Mapbox API key not configured. Using basic text input.</small>
        </div>
        {error && <div className="field-error">{error}</div>}
      </div>
    );
  }

  return (
    <div className="mapbox-address-container">
      <div className="mapbox-input-wrapper">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`form-input ${className} ${error ? 'error' : ''}`}
          disabled={disabled}
          required={required}
          autoComplete="off"
        />
        
        {isLoading && (
          <div className="mapbox-loading">
            <svg className="mapbox-spinner" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25"/>
              <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
          </div>
        )}
      </div>

      {/* Dropdown Portal - Renders suggestions in a portal at document body level */}
      {showSuggestions && suggestions.length > 0 && inputRef.current && (
        <MapboxSuggestionsPortal
          inputElement={inputRef.current}
          suggestions={suggestions}
          selectedIndex={selectedIndex}
          onSelect={handleSuggestionSelect}
          onClose={() => {
            setShowSuggestions(false);
            setSelectedIndex(-1);
          }}
        />
      )}

      {error && <div className="field-error">{error}</div>}
    </div>
  );
} 