import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ArrowLeft, Building, MapPin, Home, Check, Loader, DollarSign, Users, Sparkles } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingOverlay from '../../components/listing-generator/LoadingOverlay';
import { apiClient } from '../../lib/api';

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

interface ScrapedListing {
  listing_id: string;
  title: string;
  description: string;
  address: any;
  pricing: any;
  property_details: any;
  source?: { platform?: string; url?: string; provider_listing_id?: string };
  amenities?: string[];
  nearby?: any;
  schools?: any[];
  media: {
    thumbnail?: string;
    photos?: string[];
    videos?: string[];
    floorplans?: string[];
    virtual_tour?: string;
  };
}

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment Building', description: 'Multi-unit apartment complex' },
  { value: 'house', label: 'Single-Family House', description: 'Individual residential house' },
  { value: 'dorm', label: 'Dormitory', description: 'Student or institutional housing' },
  { value: 'other', label: 'Other', description: 'Other property type' }
];

const RENT_TYPES = [
  { value: 'per_room', label: 'Rent is per room', description: 'Individual rent for each room' },
  { value: 'per_property', label: 'Rent is for the whole property', description: 'Single rent for entire property' }
];

// Auto-detect timezone from US state
const getTimezoneFromState = (state: string): string => {
  const stateUpper = state.toUpperCase();
  
  // Pacific Time
  const pacificStates = ['CA', 'WA', 'OR', 'NV'];
  if (pacificStates.includes(stateUpper)) return 'America/Los_Angeles';
  
  // Mountain Time
  const mountainStates = ['MT', 'ID', 'WY', 'UT', 'CO', 'AZ', 'NM'];
  if (mountainStates.includes(stateUpper)) return 'America/Denver';
  
  // Central Time
  const centralStates = ['ND', 'SD', 'NE', 'KS', 'OK', 'TX', 'MN', 'IA', 'MO', 'AR', 'LA', 'MS', 'AL', 'WI', 'IL', 'TN', 'KY'];
  if (centralStates.includes(stateUpper)) return 'America/Chicago';
  
  // Eastern Time (default for most remaining states)
  const easternStates = ['ME', 'NH', 'VT', 'MA', 'RI', 'CT', 'NY', 'NJ', 'PA', 'DE', 'MD', 'DC', 'VA', 'WV', 'NC', 'SC', 'GA', 'FL', 'OH', 'MI', 'IN'];
  if (easternStates.includes(stateUpper)) return 'America/New_York';
  
  // Default to Pacific
  return 'America/Los_Angeles';
};

export default function AddProperty() {
  const router = useRouter();
  const [step, setStep] = useState<'address' | 'configure' | 'saving'>('address');
  
  // Address input state
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  
  // Scraped data state
  const [scrapedData, setScrapedData] = useState<ScrapedListing | null>(null);
  
  // Configuration state
  const [propertyType, setPropertyType] = useState('apartment'); // Auto-detected, not shown to user
  const [rentType, setRentType] = useState('per_room');
  const [totalRooms, setTotalRooms] = useState(1);
  const [perRoomRent, setPerRoomRent] = useState<number>(0);
  const [manualRent, setManualRent] = useState<string>('');
  const [detectedTimezone, setDetectedTimezone] = useState<string>('America/Los_Angeles'); // Auto-detected
  
  // Loading states
  const [showLoading, setShowLoading] = useState(false);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Error states
  const [error, setError] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Duplicate address warning modal
  const [duplicateModal, setDuplicateModal] = useState<{
    show: boolean;
    existingProperty: any;
    addressToCheck: string;
  }>({ show: false, existingProperty: null, addressToCheck: '' });

  // Get API URL based on environment
  const getApiUrl = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost') {
        return 'http://localhost:8000';
      } else {
        return 'https://tink.global';
      }
    }
    return 'http://localhost:8000';
  };

  // Mapbox address search function
  const searchAddresses = async (query: string) => {
    if (!query.trim() || !MAPBOX_ACCESS_TOKEN) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${MAPBOX_ACCESS_TOKEN}&` +
        `country=US&` +
        `types=address&` +
        `limit=5&` +
        `autocomplete=true`
      );

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.features || []);
        setShowSuggestions(data.features && data.features.length > 0);
        setSelectedIndex(-1);
      }
    } catch (error) {
      console.error('Address search error:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle input change with debouncing
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setAddress(newValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (MAPBOX_ACCESS_TOKEN) {
      debounceRef.current = setTimeout(() => {
        searchAddresses(newValue);
      }, 300);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (feature: MapboxFeature) => {
    setAddress(feature.place_name);
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
        } else if (address.trim()) {
          handleScrapeAddress();
        }
        break;
      
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Check for duplicate address before scraping (using backend)
  const checkForDuplicateBeforeScraping = async (addressString: string): Promise<boolean> => {
    try {
      const result = await apiClient.checkDuplicateAddress({
        address: addressString
      });

      if (result.is_duplicate && result.existing_property) {
        setDuplicateModal({
          show: true,
          existingProperty: result.existing_property,
          addressToCheck: addressString
        });
        return true; // Duplicate found
      }
      return false; // No duplicate
    } catch (error) {
      console.error('Error checking for duplicate address:', error);
      // If check fails, allow proceeding
      return false;
    }
  };

  // Handle address scraping
  const handleScrapeAddress = async () => {
    if (!address.trim()) return;

    // Check for duplicate first
    const hasDuplicate = await checkForDuplicateBeforeScraping(address.trim());
    if (hasDuplicate) {
      return; // Stop here, modal will be shown
    }

    setShowLoading(true);
    setIsApiLoading(true);
    setError(null);
    
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/listings/ingest/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: address.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.listing) {
          setScrapedData(data.listing);
          
          // Auto-detect property type from scraped data
          const scrapedType = String(data.listing?.property_details?.type || '').toLowerCase();
          let mappedType = 'apartment';
          if (scrapedType.includes('house') || scrapedType.includes('single')) mappedType = 'house';
          else if (scrapedType.includes('dorm')) mappedType = 'dorm';
          else if (scrapedType.includes('apartment') || scrapedType.includes('apt') || scrapedType.includes('multi')) mappedType = 'apartment';
          else if (scrapedType.includes('condo') || scrapedType.includes('town')) mappedType = 'apartment';
          else if (scrapedType) mappedType = 'other';
          setPropertyType(mappedType);
          
          // Auto-detect timezone from state
          const state = data.listing?.address?.state || '';
          const tz = getTimezoneFromState(state);
          setDetectedTimezone(tz);
          
          // Set total rooms from bedrooms if available
          const bedrooms = Number(data.listing?.property_details?.bedrooms) || 1;
          setTotalRooms(bedrooms);
          
          // Calculate per-room rent if not a sale property
          const price = Number(data.listing?.pricing?.price) || 0;
          if (price <= 100000) {
            setPerRoomRent(bedrooms > 0 ? Math.round((price / bedrooms) || 0) : 0);
          }
          
          setStep('configure');
          } else {
          setErrorMessage('Sorry, property not found. Please check the address and try again.');
          setShowErrorModal(true);
        }
          } else {
        setErrorMessage('Sorry, property not found. Please check the address and try again.');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error calling API:', error);
      setErrorMessage('Network error occurred. Please check your connection and try again.');
      setShowErrorModal(true);
    } finally {
      setShowLoading(false);
      setIsApiLoading(false);
    }
  };

  // Handle loading complete
  const handleLoadingComplete = () => {
    setShowLoading(false);
  };

  // Handle close loading
  const handleCloseLoading = () => {
    setShowLoading(false);
    setIsApiLoading(false);
  };

  // Close error modal
  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage('');
  };

  // Handle continue despite duplicate
  const handleContinueWithDuplicate = async () => {
    setDuplicateModal({ show: false, existingProperty: null, addressToCheck: '' });
    
    // Now proceed with scraping
    setShowLoading(true);
    setIsApiLoading(true);
    setError(null);
    
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/listings/ingest/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: address.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.listing) {
          setScrapedData(data.listing);
          
          // Auto-detect property type from scraped data
          const scrapedType = String(data.listing?.property_details?.type || '').toLowerCase();
          let mappedType = 'apartment';
          if (scrapedType.includes('house') || scrapedType.includes('single')) mappedType = 'house';
          else if (scrapedType.includes('dorm')) mappedType = 'dorm';
          else if (scrapedType.includes('apartment') || scrapedType.includes('apt') || scrapedType.includes('multi')) mappedType = 'apartment';
          else if (scrapedType.includes('condo') || scrapedType.includes('town')) mappedType = 'apartment';
          else if (scrapedType) mappedType = 'other';
          setPropertyType(mappedType);
          
          // Auto-detect timezone from state
          const state = data.listing?.address?.state || '';
          const tz = getTimezoneFromState(state);
          setDetectedTimezone(tz);
          
          // Set total rooms from bedrooms if available
          const bedrooms = Number(data.listing?.property_details?.bedrooms) || 1;
          setTotalRooms(bedrooms);
          
          // Calculate per-room rent if not a sale property
          const price = Number(data.listing?.pricing?.price) || 0;
          if (price <= 100000) {
            setPerRoomRent(bedrooms > 0 ? Math.round((price / bedrooms) || 0) : 0);
          }
          
          setStep('configure');
        } else {
          setErrorMessage('Sorry, property not found. Please check the address and try again.');
          setShowErrorModal(true);
        }
      } else {
        setErrorMessage('Sorry, property not found. Please check the address and try again.');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error calling API:', error);
      setErrorMessage('Network error occurred. Please check your connection and try again.');
      setShowErrorModal(true);
    } finally {
      setShowLoading(false);
      setIsApiLoading(false);
    }
  };

  // Handle property save
  const handleSaveProperty = async () => {
    if (!scrapedData) return;

    setSaving(true);
    setError(null);

    try {
      // Get current user profile
      const profile = await apiClient.getProfile();

      // Extract data from scraped listing
      const addressData = scrapedData.address || {};
      const pricingData = scrapedData.pricing || {};
      const propertyDetails = scrapedData.property_details || {};
      
      // Detect if this is a sale property (price > 100k)
      const scrapedPrice = Number(pricingData.price) || 0;
      const isSaleProperty = scrapedPrice > 100000;

      // Prepare property data
      const propertyData: any = {
        name: scrapedData.title || address,
        address_line1: addressData.street || addressData.full_address || address,
        address_line2: addressData.unit || '',
        city: addressData.city || '',
        state: addressData.state || '',
        postal_code: addressData.zipcode || '',
        country: addressData.country || 'United States',
        property_type: propertyType,
        timezone: detectedTimezone,
        rent_type: rentType as 'per_room' | 'per_property',
        total_rooms: rentType === 'per_property' ? (Number(propertyDetails.bedrooms) || 1) : (Number(propertyDetails.bedrooms) || totalRooms || 1),
        landlord: profile.id,
        // Scraped details
        bedrooms: Number(propertyDetails.bedrooms) || undefined,
        bathrooms: Number(propertyDetails.bathrooms) || undefined,
        square_footage: Number(propertyDetails.living_area_sqft || propertyDetails.square_feet || propertyDetails.sqft) || undefined,
        lot_size_sqft: Number(propertyDetails.lot_size_sqft) || undefined,
        year_built: Number(propertyDetails.year_built) || undefined,
        stories: Number(propertyDetails.stories) || undefined,
        description: scrapedData.description || '',
        amenities: Array.isArray(scrapedData?.amenities) ? scrapedData.amenities : (Array.isArray(propertyDetails?.amenities) ? propertyDetails.amenities : []),
        features: propertyDetails || {},
        // Media (store raw URLs; backend supports JSON list)
        images: Array.isArray(scrapedData?.media?.photos) ? scrapedData.media.photos.slice(0, 12) : [],
        videos: Array.isArray(scrapedData?.media?.videos) ? scrapedData.media.videos : [],
        floorplans: Array.isArray(scrapedData?.media?.floorplans) ? scrapedData.media.floorplans : [],
        virtual_tour_url: scrapedData?.media?.virtual_tour || undefined,
        // Pricing details
        price_per_sqft: scrapedData?.pricing?.price_per_sqft || undefined,
        rent_estimate: scrapedData?.pricing?.rent_estimate || undefined,
        application_fee: scrapedData?.pricing?.application_fee || undefined,
        other_fees: scrapedData?.pricing?.other_fees || [],
        lease_term: scrapedData?.pricing?.lease_term || undefined,
        availability_date: scrapedData?.pricing?.availability_date || undefined,
        // Source info
        source_platform: scrapedData?.source?.platform || undefined,
        source_url: scrapedData?.source?.url || undefined,
        provider_listing_id: scrapedData?.source?.provider_listing_id || undefined,
        // Neighborhood/schools
        neighborhood: scrapedData?.nearby?.neighborhood || undefined,
        schools: Array.isArray(scrapedData?.schools) ? scrapedData.schools : [],
        nearby_places: scrapedData?.nearby || {},
        raw_scraped_data: scrapedData,
      };

      // Handle rent based on rent type and sale property detection
      if (rentType === 'per_property') {
        // For sale properties, require manual rent; otherwise use scraped price or manual rent
        if (isSaleProperty) {
          if (!manualRent) {
            throw new Error('Please enter the monthly rent amount for this property.');
          }
          propertyData.monthly_rent = String(manualRent);
        } else {
          // For non-sale properties, use manual rent if provided, otherwise use scraped price
          propertyData.monthly_rent = String(manualRent || scrapedPrice || 0);
        }
      } else {
        // For per-room: provide optional room arrays so API can set rents
        const bedrooms = Number(propertyDetails.bedrooms) || totalRooms || 1;
        let computedPerRoom = 0;
        
        if (isSaleProperty) {
          if (!manualRent) {
            throw new Error('Please enter the monthly rent amount for this property.');
          }
          // For sale properties with per-room, divide manual rent by bedrooms
          computedPerRoom = bedrooms > 0 ? Math.round(Number(manualRent) / bedrooms) : 0;
        } else {
          // For non-sale properties, use scraped price divided by bedrooms
          computedPerRoom = bedrooms > 0 ? Math.round((scrapedPrice / bedrooms) || 0) : 0;
        }
        
        propertyData.room_names = Array.from({ length: bedrooms }, (_, i) => `Room ${i + 1}`);
        propertyData.room_types = Array.from({ length: bedrooms }, () => 'standard');
        propertyData.room_capacities = Array.from({ length: bedrooms }, () => 1);
        propertyData.room_rents = Array.from({ length: bedrooms }, () => String(computedPerRoom));
      }

      const newProperty = await apiClient.createProperty(propertyData);

      // Success - redirect to property page
        router.push(`/properties/${newProperty.id}?created=true`);
    } catch (err: any) {
      console.error('Failed to create property:', err);
      setError(err.message || 'Failed to create property. Please try again.');
      setSaving(false);
    }
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        const target = event.target as Element;
        if (!target.closest('.address-suggestions')) {
          setShowSuggestions(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Render address input step
  const renderAddressStep = () => (
          <div style={{
      maxWidth: '600px',
      width: '100%',
      padding: '0 1rem 2rem 1rem',
              display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      minHeight: '60vh'
            }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
          width: '4rem',
          height: '4rem',
                  backgroundColor: '#2563eb',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
          margin: '0 auto 1rem'
                }}>
          <MapPin style={{ width: '2rem', height: '2rem', color: 'white' }} />
              </div>
                <h2 style={{
          fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#111827',
          marginBottom: '0.5rem'
        }}>Enter Property Address</h2>
                <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280'
        }}>We'll automatically fetch property details and photos</p>
          </div>

            <div style={{
        position: 'relative', 
        marginBottom: '1rem'
      }}>
                  <input
          ref={inputRef}
                    type="text"
          value={address}
          onChange={handleAddressChange}
          onKeyDown={handleKeyDown}
          placeholder="123 Main Street, San Francisco, CA"
                  style={{
                    width: '100%',
            padding: '1rem 1rem 1rem 3rem',
            border: '2px solid #d1d5db',
                    borderRadius: '8px',
            fontSize: '1rem',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2563eb';
                    e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
        <MapPin style={{
          position: 'absolute',
          left: '1rem',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '1.25rem',
          height: '1.25rem',
          color: '#6b7280'
        }} />

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="address-suggestions" style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            marginTop: '0.5rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 50,
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSuggestionSelect(suggestion)}
                  style={{
                  padding: '0.75rem 1rem',
                  cursor: 'pointer',
                  backgroundColor: selectedIndex === index ? '#f3f4f6' : 'white',
                  borderBottom: index < suggestions.length - 1 ? '1px solid #f3f4f6' : 'none'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedIndex === index ? '#f3f4f6' : 'white'}
              >
                <div style={{
                display: 'flex',
                alignItems: 'center',
              gap: '0.5rem'
            }}>
                  <MapPin style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                    {suggestion.place_name}
                  </span>
                  </div>
                  </div>
            ))}
                  </div>
          )}
                </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '1rem'
        }}>
          <button
            onClick={() => router.push('/properties')}
            disabled={isApiLoading}
                      style={{
              flex: 1,
              padding: '1rem',
              backgroundColor: 'white',
              color: '#374151',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
                        fontSize: '0.875rem',
              fontWeight: '600',
              cursor: isApiLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              if (!isApiLoading) {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }
            }}
            onMouseOut={(e) => {
              if (!isApiLoading) {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.backgroundColor = 'white';
              }
            }}
          >
            Back
          </button>
          <button
            onClick={handleScrapeAddress}
            disabled={!address.trim() || isApiLoading}
                        style={{
              flex: 2,
              padding: '1rem',
              backgroundColor: !address.trim() || isApiLoading ? '#9ca3af' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: !address.trim() || isApiLoading ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: (!address.trim() || isApiLoading) ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}
            onMouseOver={(e) => {
              if (address.trim() && !isApiLoading) {
                e.currentTarget.style.backgroundColor = '#1d4ed8';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              if (address.trim() && !isApiLoading) {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
              }
            }}
          >
            {isApiLoading ? (
              <>
                <Loader style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
                Fetching Property Data...
              </>
            ) : (
              <>
                <Building style={{ width: '1rem', height: '1rem' }} />
                Fetch Property Details
              </>
            )}
          </button>
                  </div>
                    </div>
  );

  // Render configuration step
  const renderConfigureStep = () => {
    if (!scrapedData) return null;

    const scrapedPrice = Number(scrapedData.pricing?.price) || 0;
    const isSaleProperty = scrapedPrice > 100000;

    return (
      <div style={{ 
        maxWidth: '800px', 
                          width: '100%',
        padding: '0 1rem 2rem 1rem'
      }}>
          {error && (
                    <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
            borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem',
            color: '#dc2626',
            fontSize: '0.875rem'
          }}>
            {error}
                          </div>
          )}

        {/* Property Name - Part of page flow */}
        <div style={{ marginBottom: '2rem', textAlign: 'center', paddingTop: '1rem' }}>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
                  color: '#111827',
                    marginBottom: '0.5rem'
          }}>{scrapedData.title || address}</h2>
          {scrapedData.address && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              color: '#6b7280',
              fontSize: '0.875rem'
            }}>
              <MapPin style={{ width: '16px', height: '16px' }} />
              <span>{scrapedData.address.full_address || address}</span>
                </div>
          )}
                          </div>

        {/* Sale Property Notice */}
        {isSaleProperty && (
                <div style={{
            backgroundColor: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            background: '#fef3c7',
            border: '2px solid #fde047',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
            gap: '1rem'
            }}>
            <Sparkles style={{ width: '24px', height: '24px', color: '#92400e', flexShrink: 0 }} />
                  <div>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#92400e', marginBottom: '0.25rem' }}>
                Property Listed for Sale
                      </div>
              <div style={{ fontSize: '0.75rem', color: '#78350f' }}>
                This property appears to be listed for sale (${scrapedPrice.toLocaleString()}). Please enter the monthly rent amount.
            </div>
                  </div>
          </div>
        )}

        {/* Rent Structure Selection - Large Visual Cards */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            fontSize: '1rem',
                      fontWeight: '600',
            color: '#111827',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            How do you want to rent this property?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => setRentType('per_room')}
                      style={{
                padding: '1.5rem',
                borderRadius: '16px',
                border: rentType === 'per_room' ? '3px solid #2563eb' : '2px solid #e5e7eb',
                background: rentType === 'per_room' ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : 'white',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                transform: rentType === 'per_room' ? 'scale(1.02)' : 'scale(1)',
                boxShadow: rentType === 'per_room' ? '0 4px 12px rgba(37, 99, 235, 0.15)' : '0 2px 4px rgba(0, 0, 0, 0.05)'
              }}
              onMouseOver={(e) => {
                if (rentType !== 'per_room') {
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.transform = 'scale(1.01)';
                }
              }}
              onMouseOut={(e) => {
                if (rentType !== 'per_room') {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
                <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: rentType === 'per_room' ? '#2563eb' : '#f3f4f6',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <Users style={{ width: '24px', height: '24px', color: rentType === 'per_room' ? 'white' : '#6b7280' }} />
                  </div>
              <div style={{ fontWeight: 700, color: '#111827', fontSize: '1rem', marginBottom: '0.5rem' }}>Per Room</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                Auto-create {totalRooms} rooms
                </div>
            </button>
            <button
              type="button"
              onClick={() => setRentType('per_property')}
                    style={{
                padding: '1.5rem',
                borderRadius: '16px',
                border: rentType === 'per_property' ? '3px solid #2563eb' : '2px solid #e5e7eb',
                background: rentType === 'per_property' ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : 'white',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                transform: rentType === 'per_property' ? 'scale(1.02)' : 'scale(1)',
                boxShadow: rentType === 'per_property' ? '0 4px 12px rgba(37, 99, 235, 0.15)' : '0 2px 4px rgba(0, 0, 0, 0.05)'
              }}
              onMouseOver={(e) => {
                if (rentType !== 'per_property') {
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.transform = 'scale(1.01)';
                }
              }}
              onMouseOut={(e) => {
                if (rentType !== 'per_property') {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
                  <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: rentType === 'per_property' ? '#2563eb' : '#f3f4f6',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <Home style={{ width: '24px', height: '24px', color: rentType === 'per_property' ? 'white' : '#6b7280' }} />
                  </div>
              <div style={{ fontWeight: 700, color: '#111827', fontSize: '1rem', marginBottom: '0.5rem' }}>Whole Property</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                {isSaleProperty ? 'Enter rent manually' : `$${scrapedPrice.toLocaleString()}/mo`}
                    </div>
            </button>
                </div>
                        </div>

        {/* Rent Input - Large Visual Card */}
        {(isSaleProperty || rentType === 'per_property') && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
                          border: '1px solid #e5e7eb',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                          padding: '1.5rem',
            marginBottom: '2rem'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
              gap: '0.75rem',
                            marginBottom: '1rem'
                          }}>
                    <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#fef3c7',
                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <DollarSign style={{ width: '20px', height: '20px', color: '#92400e' }} />
                    </div>
                            <div>
                <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>
                  Monthly Rent {isSaleProperty && <span style={{ color: '#dc2626' }}>*</span>}
                </div>
                {!isSaleProperty && (
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    Leave empty to use ${scrapedPrice.toLocaleString()}
                  </div>
                )}
              </div>
            </div>
                                  <input
                                    type="number"
              value={manualRent}
              onChange={(e) => setManualRent(e.target.value)}
              placeholder={isSaleProperty ? "Enter monthly rent" : `Default: $${scrapedPrice.toLocaleString()}`}
                                    min="0"
                                    step="0.01"
                                  style={{
                                    width: '100%',
                padding: '1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '1.125rem',
                                fontWeight: '600',
                                  transition: 'all 0.2s ease',
                          outline: 'none'
                                }}
                                onFocus={(e) => {
                                  e.target.style.borderColor = '#2563eb';
                                  e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                }}
                                onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                                  e.target.style.boxShadow = 'none';
                                }}
                                  />
                  </div>
                    )}


        {/* Action Buttons */}
                <div style={{
          display: 'flex',
                  gap: '1rem',
          marginTop: '2rem'
        }}>
                      <button
            onClick={() => {
              setStep('address');
              setScrapedData(null);
              setManualRent('');
            }}
            disabled={saving}
                    style={{
              flex: 1,
              padding: '1rem',
                        backgroundColor: 'white',
                      color: '#374151',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
                      fontSize: '0.875rem',
                    fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
              if (!saving) {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }
                    }}
                    onMouseOut={(e) => {
              if (!saving) {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.backgroundColor = 'white';
              }
            }}
          >
            Back
                      </button>
                  <button
            onClick={handleSaveProperty}
            disabled={saving}
                  style={{
              flex: 2,
              padding: '1rem',
              backgroundColor: saving ? '#9ca3af' : '#2563eb',
                    color: 'white',
                    border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
                    fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
              justifyContent: 'center',
                      gap: '0.5rem',
              boxShadow: saving ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.3)'
                  }}
                  onMouseOver={(e) => {
              if (!saving) {
                      e.currentTarget.style.backgroundColor = '#1d4ed8';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)';
                    }
                  }}
                  onMouseOut={(e) => {
              if (!saving) {
                      e.currentTarget.style.backgroundColor = '#2563eb';
                      e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
              }
            }}
          >
            {saving ? (
              <>
                <Loader style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
                        Creating Property...
                      </>
                    ) : (
                    <>
                <Sparkles style={{ width: '1rem', height: '1rem' }} />
                      Create Property
                    </>
                    )}
                  </button>
                </div>
          </div>
    );
  };

  return (
    <>
      <Head>
        <title>Add New Property - SquareFt</title>
      </Head>
      <DashboardLayout title="">
                    <div style={{
          width: '100%',
          padding: '16px 20px 20px 20px',
          background: '#f8fafc',
          minHeight: 'calc(100vh - 72px)',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {/* Content */}
          {step === 'address' && renderAddressStep()}
          {step === 'configure' && renderConfigureStep()}
        </div>
      </DashboardLayout>

      {/* Loading Overlay */}
      {showLoading && (
        <LoadingOverlay
          onComplete={handleLoadingComplete}
          onClose={handleCloseLoading}
          isLoading={isApiLoading}
        />
      )}

      {/* Duplicate Address Modal */}
      {duplicateModal.show && duplicateModal.existingProperty && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem'
        }}
        onClick={() => {
          // Don't close on backdrop click - require explicit action
        }}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <span style={{ color: '#f59e0b', fontSize: '24px', fontWeight: 'bold' }}>!</span>
              </div>
              <div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#111827',
                  margin: 0,
                  marginBottom: '0.25rem'
                }}>
                  Property Already Exists
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: 0
                }}>
                  A property with a similar address was found
                </p>
              </div>
            </div>

            <div style={{
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                marginBottom: '0.5rem'
              }}>
                Existing Property:
              </div>
              <div style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#111827'
              }}>
                {duplicateModal.existingProperty.address_line1}
                {duplicateModal.existingProperty.address_line2 ? `, ${duplicateModal.existingProperty.address_line2}` : ''}
              </div>
              {duplicateModal.existingProperty.city && (
                <div style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  marginTop: '0.25rem'
                }}>
                  {duplicateModal.existingProperty.city}, {duplicateModal.existingProperty.state} {duplicateModal.existingProperty.postal_code}
                </div>
              )}
            </div>

            <div style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              marginBottom: '1.5rem',
              lineHeight: '1.6'
            }}>
              You're trying to add: <strong>{duplicateModal.addressToCheck}</strong>
              <br /><br />
              If this is a different property (e.g., different apartment/unit number), you can continue. Otherwise, please cancel and edit the existing property.
            </div>

            <div style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setDuplicateModal({ show: false, existingProperty: null, addressToCheck: '' })}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleContinueWithDuplicate}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#1d4ed8';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
                }}
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
              <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                      alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
                      }}>
                        <div style={{
                          backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{
                            fontSize: '1.25rem',
                            fontWeight: '700',
              color: '#dc2626',
              marginBottom: '1rem'
            }}>Error</h3>
            <p style={{
              fontSize: '0.875rem',
              color: '#4b5563',
              marginBottom: '1.5rem'
            }}>{errorMessage}</p>
                  <button
              onClick={handleCloseErrorModal}
                  style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Close
                  </button>
                </div>
          </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
} 
