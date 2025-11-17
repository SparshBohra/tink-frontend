import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { MapPin, Building2 } from 'lucide-react';
import LoadingOverlay from './LoadingOverlay';

interface AddressInputProps {
  onSubmit: (address: string) => void;
  onAuthClick: (mode: 'login' | 'signup') => void;
}

interface PropertyListing {
  type: string;
  price: string;
  beds: number;
  baths: number;
  sqft: string;
  photos: string[];
  loadedPhotos?: Set<number>; // Track which photos have been loaded
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

export default function AddressInput({ onSubmit, onAuthClick }: AddressInputProps) {
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentListingIndex, setCurrentListingIndex] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [isApiLoading, setIsApiLoading] = useState(true);
  const [loadedPhotos, setLoadedPhotos] = useState<Map<number, Set<number>>>(new Map());
  const [appUrl, setAppUrl] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Mapbox autocomplete state
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  // Get base URL for app subdomain based on environment
  const getAppUrl = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost') {
        return 'http://app.localhost:3000';
      } else if (hostname === 'squareft.ai' || hostname.endsWith('.squareft.ai')) {
        return 'https://app.squareft.ai';
      } else {
        // For Vercel preview deployments
        return `${window.location.protocol}//app.${hostname}`;
      }
    }
    // Default to production app domain during SSR to avoid localhost leakage
    return 'https://app.squareft.ai';
  };

  const propertyListings: PropertyListing[] = [
    {
      type: 'For Rent',
      price: '$3,200/mo',
      beds: 4,
      baths: 3,
      sqft: '2,400',
      photos: [
        '/landingPage/house1/house1a.webp',
        '/landingPage/house1/house1b.webp',
        '/landingPage/house1/house1c.webp',
        '/landingPage/house1/house1d.webp',
      ]
    },
    {
      type: 'For Rent',
      price: '$2,850/mo',
      beds: 2,
      baths: 2,
      sqft: '1,200',
      photos: [
        '/landingPage/house2/house2a.webp',
        '/landingPage/house2/house2b.webp',
        '/landingPage/house2/house2c.webp',
      ]
    },
    {
      type: 'For Rent',
      price: '$4,500/mo',
      beds: 3,
      baths: 2.5,
      sqft: '1,850',
      photos: [
        '/landingPage/house3/house3a.webp',
        '/landingPage/house3/house3b.webp',
        '/landingPage/house3/house3c.webp',
      ]
    },
    {
      type: 'For Rent',
      price: '$2,200/mo',
      beds: 1,
      baths: 1,
      sqft: '750',
      photos: [
        '/landingPage/house4/house4a.webp',
        '/landingPage/house4/house4b.webp',
        '/landingPage/house4/house4c.webp',
        '/landingPage/house4/house4d.webp',
      ]
    },
  ];

  // Get API URL based on environment
  const getApiUrl = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost') {
        return 'http://localhost:8000';
      } else {
        // For production: use tink.global backend
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
      } else {
        console.error('Mapbox API error:', response.statusText);
        setSuggestions([]);
        setShowSuggestions(false);
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

    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce the search
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
          handleSubmit(e);
        }
        break;
      
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim()) {
      setShowLoading(true);
      setIsApiLoading(true);
      
      try {
        const apiUrl = getApiUrl();
        // Call the backend API to ingest the property
        const response = await fetch(`${apiUrl}/api/listings/ingest/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ address: address.trim() }),
        });

        if (response.ok) {
          const data = await response.json();
          // Store the listing data in sessionStorage to pass to the listing page
          if (data.listing) {
            sessionStorage.setItem('currentListing', JSON.stringify(data.listing));
          } else {
            // No listing data returned
            setShowLoading(false);
            setIsApiLoading(false);
            setErrorMessage('Sorry, property not found. Please check the address and try again.');
            setShowErrorModal(true);
            return;
          }
        } else {
          // API returned an error status
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to fetch listing data', errorData);
          setShowLoading(false);
          setIsApiLoading(false);
          setErrorMessage('Sorry, property not found. Please check the address and try again.');
          setShowErrorModal(true);
          return;
        }
      } catch (error) {
        console.error('Error calling API:', error);
        setShowLoading(false);
        setIsApiLoading(false);
        setErrorMessage('Network error occurred. Please check your connection and try again.');
        setShowErrorModal(true);
        return;
      } finally {
        // Mark API loading as complete (only if we didn't error out)
        setIsApiLoading(false);
      }
    }
  };

  const handleLoadingComplete = () => {
    setShowLoading(false);
    // Redirect to listing page
    router.push('/listing');
  };

  const handleCloseLoading = () => {
    setShowLoading(false);
  };

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Resolve appUrl on client to ensure correct domain (prevents SSR localhost)
  useEffect(() => {
    setAppUrl(getAppUrl());
  }, []);

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


  // Photo carousel within same listing (slide left/right animation)
  useEffect(() => {
    const photoInterval = setInterval(() => {
      setCurrentPhotoIndex((prev) => {
        const currentListing = propertyListings[currentListingIndex];
        return (prev + 1) % currentListing.photos.length;
      });
    }, 4500); // Change photo every 4.5 seconds (slower)

    return () => clearInterval(photoInterval);
  }, [currentListingIndex]);

  // Listing rotation (scroll down between different properties)
  useEffect(() => {
    const listingInterval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentListingIndex((prev) => (prev + 1) % propertyListings.length);
        setCurrentPhotoIndex(0); // Reset to first photo of new listing
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, 600); // Scroll down duration
    }, 18000); // Change listing every 18 seconds (4 photos × 4.5s each)

    return () => clearInterval(listingInterval);
  }, []);


  // Progressive image loading - Load images in the background
  useEffect(() => {
    const preloadImages = async () => {
      // First, ensure the first image of the current listing is loaded (priority)
      const currentListing = propertyListings[currentListingIndex];
      if (currentListing.photos.length > 0) {
        const img = new Image();
        img.src = currentListing.photos[0];
      }

      // Then progressively load remaining images for current and next listings
      const loadListingImages = (listingIndex: number) => {
        const listing = propertyListings[listingIndex];
        listing.photos.forEach((photo, photoIndex) => {
          setTimeout(() => {
            const img = new Image();
            img.src = photo;
            img.onload = () => {
              setLoadedPhotos(prev => {
                const newMap = new Map(prev);
                const photoSet = newMap.get(listingIndex) || new Set();
                photoSet.add(photoIndex);
                newMap.set(listingIndex, photoSet);
                return newMap;
              });
            };
          }, photoIndex * 500); // Stagger loading by 500ms per image
        });
      };

      // Load current listing images
      loadListingImages(currentListingIndex);

      // Load next 2 listings in advance (background loading)
      setTimeout(() => {
        const nextIndex = (currentListingIndex + 1) % propertyListings.length;
        loadListingImages(nextIndex);
      }, 2000);

      setTimeout(() => {
        const nextNextIndex = (currentListingIndex + 2) % propertyListings.length;
        loadListingImages(nextNextIndex);
      }, 4000);
    };

    preloadImages();
  }, [currentListingIndex]);

  const currentListing = propertyListings[currentListingIndex];

  return (
    <>
      {showLoading && (
        <LoadingOverlay 
          onClose={handleCloseLoading}
          onComplete={handleLoadingComplete}
          isLoading={isApiLoading}
        />
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="error-modal-overlay" onClick={() => setShowErrorModal(false)}>
          <div className="error-modal" onClick={(e) => e.stopPropagation()}>
            <div className="error-icon-circle">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h2 className="error-title">Property Not Found</h2>
            <p className="error-message">{errorMessage}</p>
            <button 
              className="error-close-btn"
              onClick={() => setShowErrorModal(false)}
            >
              Try Again
            </button>
          </div>
        </div>
      )}
      
      <div className="landing-container">
        {/* Top Navigation */}
        <nav className={`topnav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="brand">
          <div className="brand-content">
            <img src="/logo1.png" alt="SquareFt" className="brand-logo" />
            <span className="brand-tagline">Your AI Property Assistant</span>
          </div>
        </div>
          <div className="menu">
            <a href="#how" className="menu-link">About</a>
            <a href="#agents" className="menu-link">AI Agents</a>
            <a href="#browse" className="menu-link">FAQ</a>
            <a
              href={appUrl ? `${appUrl}/login` : '#'}
              onClick={(e) => { e.preventDefault(); if (appUrl) window.location.href = `${appUrl}/login`; }}
              className="menu-link login"
            >
              Login
            </a>
            <a
              href={appUrl ? `${appUrl}/landlord-signup` : '#'}
              onClick={(e) => { e.preventDefault(); if (appUrl) window.location.href = `${appUrl}/landlord-signup`; }}
              className="menu-link signup"
            >
              Sign up
            </a>
          </div>
      </nav>

      {/* Hero Split Section */}
      <section className="hero-fullsplit">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title-big">
              Stage your property and create a free listing
            </h1>
            <p className="hero-caption">Enter your address to get started</p>
            
            <form onSubmit={handleSubmit} className="hero-input-wrap">
              <div className="hero-input-icon">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="address-input-container">
                <input
                  ref={inputRef}
                  type="text"
                  value={address}
                  onChange={handleAddressChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => address && suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Eg: 2401 Saint St, #5A, San Francisco, CA"
                  className="hero-input"
                  autoComplete="off"
                  required
                />
                
                {/* Mapbox Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="address-suggestions">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={suggestion.place_name}
                        className={`address-suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                        onClick={() => handleSuggestionSelect(suggestion)}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <MapPin className="suggestion-icon" size={16} />
                        <span>{suggestion.place_name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button type="submit" className="primary-btn" aria-label="Submit">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </form>
          </div>

          <div className="hero-right">
            <div className={`hero-property-card ${isTransitioning ? 'fading' : ''}`}>
              <div className="photo-carousel-container">
                {currentListing.photos.map((photo, index) => {
                  // Only render first photo immediately, others render after loading
                  const isLoaded = loadedPhotos.get(currentListingIndex)?.has(index);
                  const shouldRender = index === 0 || isLoaded;
                  
                  if (!shouldRender) return null;
                  
                  return (
                    <div
                      key={index}
                      className={`photo-slide ${index === currentPhotoIndex ? 'active' : index < currentPhotoIndex ? 'left' : 'right'}`}
                    >
                      <img 
                        src={photo}
                        alt={`Property view ${index + 1}`}
                        loading={index === 0 ? 'eager' : 'lazy'}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="property-badge">{propertyListings[currentListingIndex].type}</div>
              <div className="property-price-badge">{propertyListings[currentListingIndex].price}</div>
              <div className="property-details-badge">
                <span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 4v16h20V4H2zm18 2v5H4V6h16zM4 13h7v5H4v-5zm9 0h7v5h-7v-5z" fill="currentColor"/>
                    <rect x="8" y="15" width="2" height="2" fill="white"/>
                    <rect x="15" y="15" width="2" height="2" fill="white"/>
                  </svg>
                  {propertyListings[currentListingIndex].beds} beds
                </span>
                <span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 12h12M3 17h18v3H3v-3zm0-10C3 5.34 4.34 4 6 4h12c1.66 0 3 1.34 3 3v4H3V7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="7" cy="9" r="1" fill="currentColor"/>
                    <circle cx="17" cy="9" r="1" fill="currentColor"/>
                  </svg>
                  {propertyListings[currentListingIndex].baths} baths
                </span>
                <span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {propertyListings[currentListingIndex].sqft} sqft
                </span>
              </div>
            </div>
          </div>

          {/* Coming Soon Section - Inside Hero */}
          <div className="coming-soon-hero-section">
            <div className="coming-soon-hero-content">
              <h2 className="coming-soon-hero-title">Your 24/7 AI Property Manager</h2>
              <p className="coming-soon-hero-description">
                Automatically handle tenant calls, maintenance requests, and property operations with AI that never sleeps.
              </p>
              <div className="coming-soon-hero-features">
                <div className="coming-soon-hero-feature">
                  <div className="coming-soon-hero-badge">Coming Soon</div>
                  <div className="coming-soon-hero-feature-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                      <line x1="12" y1="22.08" x2="12" y2="12"/>
                    </svg>
                  </div>
                  <h3 className="coming-soon-hero-feature-title">Integrations with Leading Platforms</h3>
                  <p className="coming-soon-hero-feature-description">
                    One-click listing to dozens of listing websites including Zillow, Apartments.com, Realtor.com, and more. Publish your property to the largest platforms instantly.
                  </p>
                </div>
                <div className="coming-soon-hero-feature">
                  <div className="coming-soon-hero-badge">Coming Soon</div>
                  <div className="coming-soon-hero-feature-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      <line x1="12" y1="19" x2="12" y2="23"/>
                      <line x1="8" y1="23" x2="16" y2="23"/>
                    </svg>
                  </div>
                  <h3 className="coming-soon-hero-feature-title">Voice Assistant for Property Management</h3>
                  <p className="coming-soon-hero-feature-description">
                    Answers calls 24/7 with no hold time, makes outbound calls, and handles SMS, Email, and WhatsApp. Manages maintenance requests, schedules appointments, and responds to prospects automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
            <div className="features-header">
              <h2 className="features-main-title">See <span className="title-highlight">SquareFt</span> in action</h2>
              <p className="features-main-subtitle">
                Watch how AI transforms your property address into market-ready listings, manages tenant screening, 
                automates rent collection, and handles maintenance requests—all while you stay hands-free
              </p>
            </div>

          <div className="dashboard-showcase">
            <div className="dashboard-mockup-large">
              <div className="mockup-browser-bar">
                <div className="browser-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="browser-url">app.squareft.ai/dashboard</div>
                <div className="browser-actions">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  </svg>
                </div>
              </div>
              <div className="mockup-video-container">
                {/* User will add their video/screenshot here */}
                <div className="video-placeholder">
                  <div className="video-play-button">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="white">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  <div className="video-preview">
                    <div className="dashboard-preview-content">
                      <div className="preview-sidebar">
                        <div className="sidebar-logo">SquareFt</div>
                        <div className="sidebar-menu">
                          <div className="menu-item active">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                            </svg>
                            <span>Dashboard</span>
                          </div>
                          <div className="menu-item">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            </svg>
                            <span>Listings</span>
                          </div>
                          <div className="menu-item">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="3"/>
                              <path d="M12 1v6m0 6v6m7.071-13.071l-4.243 4.243m0 5.656l4.243 4.243m-13.071-13.071l4.243 4.243m0 5.656l-4.243 4.243"/>
                            </svg>
                            <span>Integrations</span>
                          </div>
                        </div>
                      </div>
                      <div className="preview-main">
                        <div className="preview-header">
                          <h3>Your Listings</h3>
                          <div className="preview-stats">
                            <span className="stat-card">
                              <span className="stat-number">12</span>
                              <span className="stat-label">Total</span>
                            </span>
                            <span className="stat-card active">
                              <span className="stat-number">8</span>
                              <span className="stat-label">Active</span>
                            </span>
                            <span className="stat-card">
                              <span className="stat-number">4</span>
                              <span className="stat-label">Draft</span>
                            </span>
                          </div>
                        </div>
                        <div className="preview-listing-card">
                          <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=120&h=90&fit=crop&q=80" alt="Property" className="preview-listing-image" />
                          <div className="preview-listing-details">
                            <div className="preview-listing-title">350 Rhode Island St, San Francisco</div>
                            <div className="preview-listing-meta">
                              <span>4 bd</span>
                              <span>3 ba</span>
                              <span>2,400 sqft</span>
                              <span className="preview-price">$3,200/mo</span>
                            </div>
                            <div className="preview-listing-footer">
                              <span className="preview-status-badge live">● Live</span>
                              <div className="preview-platform-badges">
                                <span className="preview-platform">Zillow</span>
                                <span className="preview-platform">Realtor</span>
                                <span className="preview-platform">+2</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="preview-listing-card secondary">
                          <img src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=120&h=90&fit=crop&q=80" alt="Property" className="preview-listing-image" />
                          <div className="preview-listing-details">
                            <div className="preview-listing-title">1725 Montgomery St, Apt 203</div>
                            <div className="preview-listing-meta">
                              <span>2 bd</span>
                              <span>2 ba</span>
                              <span>1,200 sqft</span>
                              <span className="preview-price">$2,850/mo</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="video-label">💡 Rent collection is trending below average.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="features-steps-horizontal">
            <div className="feature-step-compact">
              <div className="step-number-large">1</div>
              <h4>Enter address</h4>
              <p>Type your property address</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="feature-step-compact">
              <div className="step-number-large">2</div>
              <h4>Stage</h4>
              <p>AI stages your property</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="feature-step-compact">
              <div className="step-number-large">3</div>
              <h4>List</h4>
              <p>AI creates your complete listing</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="feature-step-compact">
              <div className="step-number-large">4</div>
              <h4>Manage properties</h4>
              <p>Track and organize your listings</p>
            </div>
          </div>

          <div className="features-cta-center">
            <button className="features-cta-button-large" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Start creating your listing
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <p className="cta-note">No credit card required • Free to try</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-grid">
            <div>
              <div className="footer-brand">SquareFt</div>
              <p className="footer-tagline">
                Create professional real estate listings in minutes with AI-powered automation.
              </p>
              <div className="footer-social">
                <a href="#" className="footer-social-link" aria-label="Twitter">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                  </svg>
                </a>
                <a href="#" className="footer-social-link" aria-label="LinkedIn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
                    <circle cx="4" cy="4" r="2"/>
                  </svg>
                </a>
                <a href="#" className="footer-social-link" aria-label="Instagram">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" strokeWidth="2"/>
                    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" strokeWidth="2"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </a>
              </div>
            </div>

            <div className="footer-column">
              <h4>Product</h4>
              <ul className="footer-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#integrations">Integrations</a></li>
                <li><a href="#api">API</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Company</h4>
              <ul className="footer-links">
                <li><a href="#about">About</a></li>
                <li><a href="#blog">Blog</a></li>
                <li><a href="#careers">Careers</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Resources</h4>
              <ul className="footer-links">
                <li><a href="#help">Help Center</a></li>
                <li><a href="#docs">Documentation</a></li>
                <li><a href="#guides">Guides</a></li>
                <li><a href="#status">Status</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <div>© 2025 SquareFt. All rights reserved.</div>
            <div className="footer-bottom-links">
              <a href="#privacy">Privacy</a>
              <a href="#terms">Terms</a>
              <a href="#cookies">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .landing-container {
          min-height: 100vh;
          background: #fafbfc;
          position: relative;
        }

        .landing-container::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 0;
          background: radial-gradient(circle at 50% 50%, rgba(24, 119, 242, 0.08) 0%, rgba(24, 119, 242, 0.03) 40%, transparent 70%);
          pointer-events: none;
        }

        /* Top Navigation - Seamless Flow */
        .topnav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 0;
          max-width: 1200px;
          margin: 0 auto;
          background: transparent;
          transition: all 0.3s ease;
        }

        .topnav::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: -1;
        }

        .topnav.scrolled::before {
          opacity: 1;
        }

        .brand {
          position: relative;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .brand:hover {
          transform: scale(1.02);
        }

        .brand-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
        }

        .brand-logo {
          height: 60px;
          width: auto;
          display: block;
        }

        .brand-tagline {
          font-size: 11px;
          color: #0f172a;
          font-weight: 400;
          letter-spacing: 0.5px;
          white-space: nowrap;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          padding-left: 2px;
        }

        .menu {
          position: relative;
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .menu-link {
          color: #64748b;
          text-decoration: none;
          font-weight: 500;
          font-size: 15px;
          padding: 8px 18px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .menu-link:hover {
          color: #1e293b;
          background: #f8fafc;
        }

        .menu-link.login {
          color: #1877F2;
          background: transparent;
          padding: 10px 24px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          margin-left: 8px;
          font-weight: 600;
          text-decoration: none;
        }

        .menu-link.login:hover {
          background: #f8fafc;
          color: #166FE5;
        }

        .menu-link.signup {
          color: white;
          background: #1877F2;
          padding: 10px 28px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          margin-left: 8px;
          font-weight: 600;
          text-decoration: none;
        }

        .menu-link.signup:hover {
          background: #166FE5;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(24, 119, 242, 0.25);
        }

        /* Hero Split - Seamless Flow */
        .hero-fullsplit {
          position: relative;
          min-height: 100vh;
          padding-top: 80px;
          background: 
            radial-gradient(ellipse 120% 80% at 50% -10%, rgba(248, 250, 252, 0.6), transparent),
            radial-gradient(circle at 10% 20%, rgba(241, 245, 249, 0.4), transparent 50%),
            radial-gradient(circle at 90% 30%, rgba(249, 250, 251, 0.4), transparent 50%),
            #ffffff;
          display: flex;
          align-items: center;
        }

        .hero-fullsplit::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 100%;
          background: 
            radial-gradient(circle at 20% 15%, rgba(30, 64, 175, 0.015) 0%, transparent 35%),
            radial-gradient(circle at 80% 25%, rgba(148, 163, 184, 0.015) 0%, transparent 35%);
          pointer-events: none;
        }

        .hero-container {
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          padding: 60px 0 60px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
          position: relative;
          z-index: 1;
        }

        .hero-content {
          animation: slideIn 0.6s ease-out;
          min-width: 0;
          overflow: visible;
        }


        .hero-title-big {
          font-size: 54px;
          line-height: 1.2;
          margin: 0 0 34px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -1.5px;
        }

        .hero-caption {
          font-size: 19px;
          color: #475569;
          margin: 0 0 15px;
          font-weight: 400;
          letter-spacing: 0.2px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          line-height: 1.5;
        }

        .ai-highlight {
          font-weight: 700;
          color: #000000;
          font-size: 19px;
          letter-spacing: 0.5px;
          text-shadow: 0 0 20px rgba(24, 119, 242, 0.15);
        }

        .ai-text-highlight {
          color: #1877F2;
          font-weight: 800;
        }

        .hero-input-wrap {
          display: flex;
          position: relative;
          max-width: 720px;
        }

        .hero-input-icon {
          position: absolute;
          left: 22px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          transition: all 0.2s;
          z-index: 1;
        }

        .hero-input-wrap:focus-within .hero-input-icon {
          color: #1877F2;
        }

        .address-input-container {
          position: relative;
          flex: 1;
        }

        .hero-input {
          width: 100%;
          padding: 20px 70px 20px 58px;
          border: 2px solid #e5e7eb;
          border-radius: 14px;
          font-size: 17px;
          background: white;
          transition: all 0.25s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, sans-serif;
        }

        .address-suggestions {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 70px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
          z-index: 1000;
          max-height: 300px;
          overflow-y: auto;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .address-suggestion-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          cursor: pointer;
          transition: all 0.15s ease;
          border-bottom: 1px solid #f1f5f9;
          font-size: 15px;
          color: #334155;
        }

        .address-suggestion-item:last-child {
          border-bottom: none;
        }

        .address-suggestion-item:hover,
        .address-suggestion-item.selected {
          background: #f8fafc;
          color: #1877F2;
        }

        .suggestion-icon {
          color: #94a3b8;
          flex-shrink: 0;
        }

        .address-suggestion-item:hover .suggestion-icon,
        .address-suggestion-item.selected .suggestion-icon {
          color: #1877F2;
        }

        .hero-input::placeholder {
          color: #94a3b8;
          font-weight: 400;
          letter-spacing: -0.01em;
        }

        .hero-input:not(:focus)::placeholder {
          position: relative;
        }

        .hero-input:not(:focus)::placeholder::after {
          content: '';
          display: inline-block;
          width: 2px;
          height: 18px;
          background: #64748b;
          margin-left: 4px;
          vertical-align: middle;
          animation: blink 1.1s ease-in-out infinite;
        }

        @keyframes blink {
          0%, 45% {
            opacity: 1;
          }
          50%, 95% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        .hero-input:hover {
          border-color: #d1d5db;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .hero-input:focus {
          border-color: #1877F2;
          box-shadow: 0 0 0 3px rgba(24, 119, 242, 0.2), 0 4px 16px rgba(0, 0, 0, 0.1);
          outline: none;
        }

        .hero-input:focus + .primary-btn {
          background: #166FE5;
        }

        .primary-btn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          padding: 10px;
          border-radius: 8px;
          border: none;
          background: #1877F2;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
        }

        .primary-btn:hover {
          background: #166FE5;
          transform: translateY(-50%) scale(1.05);
        }

        .primary-btn:active {
          transform: translateY(-50%) scale(0.95);
        }

        .primary-btn svg {
          flex-shrink: 0;
        }

        /* Property Card */
        .hero-right {
          position: relative;
          perspective: 1200px;
          overflow: visible;
        }

        .hero-property-card {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 25px 70px rgba(20, 35, 27, 0.18);
          animation: slideIn 0.8s ease-out 0.2s backwards;
          transition: all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          transform: rotateY(-6deg) rotateX(3deg);
        }

        .hero-property-card:hover {
          transform: rotateY(-4deg) rotateX(2deg) translateY(-12px);
          box-shadow: 0 35px 90px rgba(20, 35, 27, 0.25);
        }

        .hero-property-card.fading {
          transform: rotateY(-6deg) rotateX(3deg) translateY(-40px);
          opacity: 0.3;
        }

        .photo-carousel-container {
          position: relative;
          width: 100%;
          min-height: 500px;
          height: auto;
          overflow: hidden;
          border-radius: 20px;
        }

        .hero-property-card.fading .photo-carousel-container {
          opacity: 0;
          transition: opacity 0.4s ease-out;
        }

        .photo-slide {
          position: relative;
          width: 100%;
          min-height: 500px;
          transition: transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94), 
                      opacity 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          will-change: transform, opacity;
          backface-visibility: hidden;
        }

        .hero-property-card.fading .photo-slide {
          transition: none !important;
        }

        .photo-slide:not(.active) {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
        }

        .photo-slide.active {
          transform: translateX(0);
          opacity: 1;
          z-index: 2;
        }

        .photo-slide.left {
          transform: translateX(-100%);
          opacity: 0;
          z-index: 1;
        }

        .photo-slide.right {
          transform: translateX(100%);
          opacity: 0;
          z-index: 1;
        }

        .photo-slide img {
          width: 100%;
          height: auto;
          display: block;
          min-height: 500px;
          object-fit: cover;
          border-radius: 20px;
          backface-visibility: hidden;
          -webkit-font-smoothing: antialiased;
        }

        .property-badge {
          position: absolute;
          top: 20px;
          left: 20px;
          background: rgba(255, 255, 255, 0.98);
          color: #1e293b;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          padding: 10px 18px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
          z-index: 10;
          transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), 
                      opacity 0.5s ease-in-out;
        }

        .hero-property-card.fading .property-badge {
          transform: translateY(-15px);
          opacity: 0;
        }

        .property-price-badge {
          position: absolute;
          bottom: 20px;
          left: 20px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          color: #0f172a;
          font-size: 24px;
          font-weight: 900;
          padding: 14px 24px;
          border-radius: 12px;
          border: 1.5px solid rgba(15, 23, 42, 0.1);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          z-index: 10;
          transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), 
                      opacity 0.5s ease-in-out;
        }

        .hero-property-card.fading .property-price-badge {
          transform: translateY(15px);
          opacity: 0;
        }

        .property-details-badge {
          position: absolute;
          bottom: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(12px);
          color: #1e293b;
          font-size: 13px;
          font-weight: 700;
          padding: 12px 18px;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
          display: flex;
          gap: 16px;
          z-index: 10;
          transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), 
                      opacity 0.5s ease-in-out;
        }

        .hero-property-card.fading .property-details-badge {
          transform: translateY(15px);
          opacity: 0;
        }

        .property-details-badge span {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Coming Soon Section - Inside Hero */
        .coming-soon-hero-section {
          grid-column: 1 / -1;
          margin-top: 50px;
          padding-top: 0;
        }

        .coming-soon-hero-content {
          max-width: 1000px;
          margin: 0 auto;
          padding: 0 24px;
          text-align: center;
        }

        .coming-soon-hero-title {
          font-size: 32px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 12px;
          letter-spacing: -0.7px;
          line-height: 1.2;
        }

        .coming-soon-hero-description {
          font-size: 17px;
          color: #64748b;
          margin: 0 auto 24px;
          line-height: 1.6;
          max-width: 700px;
        }

        .coming-soon-hero-features {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          margin-top: 24px;
        }

        .coming-soon-hero-feature {
          background: white;
          border-radius: 16px;
          padding: 32px 28px 36px;
          border: 2px solid #f1f5f9;
          position: relative;
          transition: all 0.3s ease;
          text-align: center;
        }

        .coming-soon-hero-feature:hover {
          border-color: #1877F2;
          box-shadow: 0 8px 32px rgba(24, 119, 242, 0.1);
          transform: translateY(-3px);
        }

        .coming-soon-hero-badge {
          position: absolute;
          top: 16px;
          right: 16px;
          background: linear-gradient(135deg, #1877F2 0%, #0056D2 100%);
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .coming-soon-hero-feature-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 20px;
          background: linear-gradient(135deg, rgba(24, 119, 242, 0.1) 0%, rgba(24, 119, 242, 0.05) 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1877F2;
        }

        .coming-soon-hero-feature-title {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 12px;
          letter-spacing: -0.2px;
        }

        .coming-soon-hero-feature-description {
          font-size: 14px;
          color: #64748b;
          line-height: 1.6;
          margin: 0;
          text-align: left;
        }

        @media (max-width: 768px) {
          .coming-soon-hero-section {
            margin-top: 32px;
            padding-top: 0;
          }

          .coming-soon-hero-title {
            font-size: 26px;
          }

          .coming-soon-hero-description {
            font-size: 15px;
            margin-bottom: 28px;
          }

          .coming-soon-hero-features {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .coming-soon-hero-feature {
            padding: 28px 20px;
          }

          .coming-soon-hero-feature-icon {
            width: 56px;
            height: 56px;
          }
        }

        /* Features Section - Centered Dashboard Hero */
        .features-section {
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 50%, #ffffff 100%);
          padding: 40px 0 80px;
          position: relative;
        }

        .features-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 100%;
          background: 
            radial-gradient(circle at 50% 20%, rgba(30, 64, 175, 0.02) 0%, transparent 50%),
            radial-gradient(circle at 20% 60%, rgba(59, 130, 246, 0.015) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.015) 0%, transparent 50%);
          pointer-events: none;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0;
          position: relative;
          z-index: 1;
        }

        .features-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .features-main-title {
          font-size: 44px;
          font-weight: 900;
          color: #0f172a;
          margin: 0 0 16px;
          letter-spacing: -0.8px;
          line-height: 1.1;
        }

        .title-highlight {
          color: #0F4C75;
        }

        .features-main-subtitle {
          font-size: 19px;
          color: #64748b;
          margin: 0;
          line-height: 1.6;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
        }

        /* Dashboard Showcase */
        .dashboard-showcase {
          margin-bottom: 56px;
        }

        .dashboard-mockup-large {
          background: white;
          border-radius: 20px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.12);
          transition: all 0.4s ease;
          max-width: 1100px;
          margin: 0 auto;
        }

        .dashboard-mockup-large:hover {
          transform: translateY(-6px);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.15);
        }

        .mockup-browser-bar {
          background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 14px 20px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .browser-dots {
          display: flex;
          gap: 8px;
        }

        .browser-dots span {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #cbd5e1;
        }

        .browser-dots span:nth-child(1) {
          background: #ef4444;
        }

        .browser-dots span:nth-child(2) {
          background: #f59e0b;
        }

        .browser-dots span:nth-child(3) {
          background: #10b981;
        }

        .browser-url {
          flex: 1;
          text-align: center;
          font-size: 13px;
          color: #64748b;
          font-weight: 600;
          background: #ffffff;
          padding: 6px 16px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .browser-actions {
          color: #94a3b8;
        }

        /* Video Container */
        .mockup-video-container {
          background: #f8fafc;
          min-height: 600px;
          position: relative;
        }

        .video-placeholder {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 600px;
        }

        .video-play-button {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80px;
          height: 80px;
          background: rgba(30, 64, 175, 0.9);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 8px 24px rgba(30, 64, 175, 0.3);
          z-index: 10;
        }

        .video-play-button:hover {
          background: rgba(30, 64, 175, 1);
          transform: translate(-50%, -50%) scale(1.1);
          box-shadow: 0 12px 32px rgba(30, 64, 175, 0.4);
        }

        .video-preview {
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .dashboard-preview-content {
          display: flex;
          height: 100%;
          min-height: 600px;
        }

        .preview-sidebar {
          width: 200px;
          background: #0f172a;
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .sidebar-logo {
          font-size: 22px;
          font-weight: 900;
          color: white;
          padding-left: 8px;
        }

        .sidebar-menu {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 10px;
          color: #94a3b8;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
          cursor: pointer;
        }

        .menu-item.active {
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
        }

        .menu-item:not(.active):hover {
          background: rgba(255, 255, 255, 0.05);
          color: #cbd5e1;
        }

        .preview-main {
          flex: 1;
          padding: 32px;
          background: #f8fafc;
          overflow: auto;
        }

        .preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
        }

        .preview-header h3 {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .preview-stats {
          display: flex;
          gap: 12px;
        }

        .stat-card {
          background: white;
          padding: 12px 20px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          min-width: 70px;
        }

        .stat-card.active {
          border-color: #1877F2;
          background: #eff6ff;
        }

        .stat-number {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
        }

        .stat-label {
          font-size: 11px;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .preview-listing-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 16px;
          display: flex;
          gap: 16px;
          margin-bottom: 12px;
          transition: all 0.2s;
        }

        .preview-listing-card:hover {
          border-color: #1877F2;
          box-shadow: 0 4px 12px rgba(24, 119, 242, 0.08);
        }

        .preview-listing-card.secondary {
          opacity: 0.7;
        }

        .preview-listing-image {
          width: 120px;
          height: 90px;
          border-radius: 10px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .preview-listing-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .preview-listing-title {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
        }

        .preview-listing-meta {
          display: flex;
          gap: 16px;
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
          align-items: center;
        }

        .preview-price {
          color: #1877F2;
          font-weight: 700;
          margin-left: auto;
        }

        .preview-listing-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .preview-status-badge {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .preview-status-badge.live {
          background: #dcfce7;
          color: #15803d;
        }

        .preview-platform-badges {
          display: flex;
          gap: 6px;
        }

        .preview-platform {
          background: #f1f5f9;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          color: #475569;
        }

        .video-label {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(15, 23, 42, 0.9);
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          backdrop-filter: blur(8px);
          z-index: 11;
        }

        /* Horizontal Steps */
        .features-steps-horizontal {
          display: grid;
          grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr;
          gap: 20px;
          align-items: center;
          margin-bottom: 60px;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
        }

        .feature-step-compact {
          background: white;
          padding: 32px 24px;
          border-radius: 16px;
          border: 2px solid #f1f5f9;
          text-align: center;
          position: relative;
          transition: all 0.3s ease;
          min-height: 160px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .feature-step-compact:hover {
          border-color: #1877F2;
          box-shadow: 0 12px 32px rgba(24, 119, 242, 0.12);
          transform: translateY(-6px);
        }

        .feature-step-compact:hover .step-number-large {
          background: #0f172a;
          color: white;
          border-color: #0f172a;
        }

        .step-number-large {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #f8fafc;
          color: #0f172a;
          border: 2px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 900;
          margin: 0 auto 16px;
          transition: all 0.3s ease;
        }

        .feature-step-compact h4 {
          font-size: 17px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 8px;
          letter-spacing: -0.3px;
        }

        .feature-step-compact p {
          font-size: 13px;
          color: #64748b;
          line-height: 1.5;
          margin: 0;
          font-weight: 500;
        }

        .step-arrow {
          font-size: 24px;
          color: #cbd5e1;
          font-weight: 300;
        }

        /* CTA Center */
        .features-cta-center {
          text-align: center;
        }

        .features-cta-button-large {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #1877F2;
          color: white;
          padding: 18px 40px;
          border-radius: 14px;
          font-size: 17px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(24, 119, 242, 0.25);
        }

        .features-cta-button-large:hover {
          background: #166FE5;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(24, 119, 242, 0.35);
        }

        .cta-note {
          margin-top: 16px;
          font-size: 14px;
          color: #64748b;
        }

        /* Footer */
        .footer {
          background: white;
          color: #64748b;
          padding: 60px 0 30px;
          border-top: 1px solid #e5e7eb;
        }

        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 60px;
          margin-bottom: 40px;
        }

        .footer-brand {
          font-size: 24px;
          font-weight: 900;
          color: #1e293b;
          margin-bottom: 12px;
        }

        .footer-tagline {
          font-size: 15px;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .footer-social {
          display: flex;
          gap: 12px;
        }

        .footer-social-link {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          transition: all 0.2s;
        }

        .footer-social-link:hover {
          background: #1877F2;
          color: white;
          transform: translateY(-2px);
        }

        .footer-column h4 {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 16px;
          text-transform: uppercase;
        }

        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-links li {
          margin-bottom: 12px;
        }

        .footer-links a {
          color: #64748b;
          text-decoration: none;
          font-size: 15px;
          transition: all 0.2s;
        }

        .footer-links a:hover {
          color: #1877F2;
        }

        .footer-bottom {
          border-top: 1px solid #e5e7eb;
          padding-top: 30px;
          display: flex;
          justify-content: space-between;
          font-size: 14px;
        }

        .footer-bottom-links {
          display: flex;
          gap: 20px;
        }

        .footer-bottom-links a {
          color: #64748b;
          text-decoration: none;
          transition: color 0.2s;
        }

        .footer-bottom-links a:hover {
          color: #1877F2;
        }

        /* Animations */
        @keyframes slideIn {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* Responsive */
        @media (max-width: 1240px) {
          .topnav,
          .hero-container,
          .container,
          .footer-content {
            padding-left: 24px;
            padding-right: 24px;
          }
        }

        @media (max-width: 1024px) {
          .hero-container {
            grid-template-columns: 1fr;
            gap: 50px;
          }

          .hero-title-big {
            font-size: 46px;
            letter-spacing: -1px;
          }

          .features-main-title {
            font-size: 36px;
          }

          .features-steps-horizontal {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .step-arrow {
            display: none;
          }

          .preview-sidebar {
            width: 160px;
            padding: 20px 12px;
          }

          .sidebar-logo {
            font-size: 18px;
          }

          .menu-item {
            font-size: 13px;
            padding: 10px;
          }

          .menu-item svg {
            width: 18px;
            height: 18px;
          }

          .preview-main {
            padding: 24px;
          }

          .preview-stats {
            flex-wrap: wrap;
          }

          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 40px;
          }
        }

        @media (max-width: 768px) {
          .topnav {
            padding: 16px 20px;
          }

          .menu {
            gap: 16px;
          }

          .menu-link:not(.signin) {
            display: none;
          }

          .hero-title-big {
            font-size: 38px;
            letter-spacing: -0.8px;
          }

          .hero-caption {
            font-size: 16px;
          }

          .hero-subtitle {
            font-size: 16px;
          }

          .hero-input {
            padding: 18px 64px 18px 54px;
          }

          .primary-btn {
            right: 8px;
            width: 40px;
            height: 40px;
          }

          .primary-btn:hover {
            transform: translateY(-50%) scale(1.05);
          }

          .primary-btn:active {
            transform: translateY(-50%) scale(0.95);
          }

          .property-price-badge {
            font-size: 20px;
            padding: 12px 20px;
          }

          .features-main-title {
            font-size: 32px;
          }

          .features-main-subtitle {
            font-size: 16px;
          }

          .preview-sidebar {
            display: none;
          }

          .dashboard-preview-content {
            min-height: 500px;
          }

          .preview-main {
            padding: 20px;
          }

          .preview-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .preview-header h3 {
            font-size: 20px;
          }

          .preview-stats {
            width: 100%;
            justify-content: space-between;
          }

          .stat-card {
            min-width: auto;
            flex: 1;
          }

          .preview-listing-card {
            flex-direction: column;
          }

          .preview-listing-image {
            width: 100%;
            height: 140px;
          }

          .feature-step-compact {
            padding: 28px 20px;
            min-height: 140px;
          }

          .step-number-large {
            width: 42px;
            height: 42px;
            font-size: 20px;
            margin-bottom: 12px;
          }

          .feature-step-compact h4 {
            font-size: 15px;
          }

          .feature-step-compact p {
            font-size: 12px;
          }

          .features-cta-button-large {
            width: 100%;
            justify-content: center;
          }

          .footer-bottom {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }
        }

        /* Error Modal */
        .error-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .error-modal {
          background: white;
          border-radius: 24px;
          padding: 48px 40px;
          max-width: 480px;
          width: 90%;
          text-align: center;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.2);
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .error-icon-circle {
          width: 100px;
          height: 100px;
          margin: 0 auto 24px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          animation: errorPulse 2s ease-in-out infinite;
        }

        @keyframes errorPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 8px 16px rgba(239, 68, 68, 0.3);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 12px 24px rgba(239, 68, 68, 0.4);
          }
        }

        .error-title {
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 16px;
          letter-spacing: -0.02em;
        }

        .error-message {
          font-size: 16px;
          color: #64748b;
          margin: 0 0 32px;
          line-height: 1.6;
        }

        .error-close-btn {
          width: 100%;
          padding: 16px 32px;
          background: linear-gradient(135deg, #1877F2 0%, #0056D2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .error-close-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(24, 119, 242, 0.3);
        }
      `}</style>
      </div>
    </>
  );
}
