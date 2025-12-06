import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import NextImage from 'next/image';
import Script from 'next/script';
import Head from 'next/head';
import { MapPin, Building2, Phone, ArrowRight, MessageSquare, Menu, X } from 'lucide-react';
import LoadingOverlay from './LoadingOverlay';

// Declare Calendly on window for TypeScript
declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string }) => void;
    };
  }
}

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
  const [activeAiTab, setActiveAiTab] = useState('leasing');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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

  // Open Calendly popup widget
  const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);
  
  const openCalendly = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent multiple popups from opening
    if (isCalendlyOpen) return;
    
    if (typeof window !== 'undefined' && window.Calendly) {
      setIsCalendlyOpen(true);
      window.Calendly.initPopupWidget({
        url: 'https://calendly.com/dakshhsaraf/30min'
      });
      
      // Reset after a short delay to allow reopening
      setTimeout(() => setIsCalendlyOpen(false), 1000);
    }
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

  // Scroll detection with passive listener and throttling for mobile performance
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
      setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
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


  // Preload ALL images immediately on mount for instant carousel
  useEffect(() => {
    // Preload all images from all listings immediately (no delays)
    propertyListings.forEach((listing, listingIndex) => {
        listing.photos.forEach((photo, photoIndex) => {
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
      });
    });
  }, []); // Only run once on mount

  const currentListing = propertyListings[currentListingIndex];

  return (
    <>
      {/* Calendly Widget Scripts */}
      <Head>
        <link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet" />
        {/* Preload first images of each listing for instant carousel */}
        <link rel="preload" as="image" href="/landingPage/house1/house1a.webp" />
        <link rel="preload" as="image" href="/landingPage/house1/house1b.webp" />
        <link rel="preload" as="image" href="/landingPage/house2/house2a.webp" />
        <link rel="preload" as="image" href="/landingPage/house3/house3a.webp" />
        <link rel="preload" as="image" href="/landingPage/house4/house4a.webp" />
      </Head>
      <Script 
        src="https://assets.calendly.com/assets/external/widget.js" 
        strategy="lazyOnload"
      />
      
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
        {/* Blue Blur Orbs - Decorative */}
        <div className="blur-orb orb-1"></div>
        <div className="blur-orb orb-2"></div>
        <div className="blur-orb orb-3"></div>
        <div className="blur-orb orb-4"></div>
        <div className="blur-orb orb-5"></div>
        <div className="blur-orb orb-6"></div>
        <div className="blur-orb orb-7"></div>
        <div className="blur-orb orb-8"></div>

        {/* Top Navigation */}
        <nav className={`topnav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="brand">
          <div className="brand-content">
            <img src="/logo1.png" alt="SquareFt" className="brand-logo" />
            <span className="brand-tagline">Your AI Property Assistant</span>
          </div>
        </div>
          {/* Desktop Menu */}
          <div className="menu desktop-menu">
            <a 
              href="#use-cases" 
              className="menu-link"
              onClick={(e) => { e.preventDefault(); document.getElementById('use-cases')?.scrollIntoView({ behavior: 'smooth' }); }}
            >
              Use Cases
            </a>
            <a 
              href="#faq" 
              className="menu-link"
              onClick={(e) => { e.preventDefault(); document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }); }}
            >
              FAQ
            </a>
            <a
              href={appUrl ? `${appUrl}/login` : '#'}
              onClick={(e) => { e.preventDefault(); if (appUrl) window.location.href = `${appUrl}/login`; }}
              className="menu-link login"
            >
              Login
            </a>
            <a href="tel:+18573178479" className="menu-link demo-call-nav">
              <Phone size={16} />
              Try it out
            </a>
          </div>
          
          {/* Mobile Hamburger Button */}
          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
      </nav>
      
      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu-drawer" onClick={(e) => e.stopPropagation()}>
            <a 
              href="#use-cases" 
              className="mobile-menu-item"
              onClick={(e) => { 
                e.preventDefault(); 
                setMobileMenuOpen(false);
                document.getElementById('use-cases')?.scrollIntoView({ behavior: 'smooth' }); 
              }}
            >
              Use Cases
            </a>
            <a 
              href="#faq" 
              className="mobile-menu-item"
              onClick={(e) => { 
                e.preventDefault(); 
                setMobileMenuOpen(false);
                document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }); 
              }}
            >
              FAQ
            </a>
            <a
              href={appUrl ? `${appUrl}/login` : '#'}
              onClick={(e) => { 
                e.preventDefault(); 
                setMobileMenuOpen(false);
                if (appUrl) window.location.href = `${appUrl}/login`; 
              }}
              className="mobile-menu-item"
            >
              Login
            </a>
            <a 
              href="tel:+18573178479" 
              className="mobile-menu-item mobile-menu-cta"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Phone size={18} />
              Try AI Property Manager
            </a>
          </div>
        </div>
      )}

      {/* Voice AI Hero Section (New First Section) */}
      <section className="voice-ai-hero">
        <div className="voice-hero-container">
          {/* Full Width Title */}
          <h1 className="voice-hero-title-full">
            Your 24/7 AI <span className="text-highlight">Property Manager</span>
          </h1>
          
          {/* Two Column Layout */}
          <div className="voice-hero-split">
            {/* iPhone Image - Left */}
            <div className="voice-hero-phone">
              <NextImage 
                src="/iphone2.png" 
                alt="AI Property Manager Call" 
                width={340}
                height={690}
                className="iphone-image"
                priority
              />
            </div>

            {/* Content - Right */}
            <div className="voice-hero-content">
              <h2 className="voice-hero-subtitle">
                Faster Listings, Easier Leasing
              </h2>
              <p className="voice-hero-description">
                An intelligent voice assistant that handles tenant calls, schedules viewings, and resolves maintenance issues around the clock — so you never miss an opportunity.
              </p>
              
              <div className="voice-hero-actions">
                <a href="tel:+18573178479" className="btn-primary-large">
                  <Phone className="btn-icon" size={20} />
                  Try Demo Call
                </a>
                <button className="btn-secondary-large" onClick={(e) => openCalendly(e)}>
                  Book Consultation <ArrowRight className="btn-icon-right" size={18} />
                </button>
              </div>

              <div className="voice-social-proof">
                <div className="proof-avatars-container">
                  <div className="proof-avatars-row">
                    <img src="https://i.pravatar.cc/150?img=12" alt="Property Manager" className="avatar-img" loading="lazy" />
                    <img src="https://i.pravatar.cc/150?img=33" alt="Property Manager" className="avatar-img" loading="lazy" />
                    <img src="https://i.pravatar.cc/150?img=47" alt="Property Manager" className="avatar-img" loading="lazy" />
                  </div>
                  <div className="proof-avatars-row">
                    <img src="https://i.pravatar.cc/150?img=68" alt="Property Manager" className="avatar-img" loading="lazy" />
                    <img src="https://i.pravatar.cc/150?img=5" alt="Property Manager" className="avatar-img" loading="lazy" />
                    <img src="https://i.pravatar.cc/150?img=20" alt="Property Manager" className="avatar-img" loading="lazy" />
                  </div>
                </div>
                <div className="proof-text">
                  <div className="proof-item">
                    <span className="proof-dot">•</span>
                    <span className="proof-highlight">Join closed beta with other property managers</span>
                  </div>
                  <div className="proof-item">
                    <span className="proof-dot">•</span>
                    <span className="proof-highlight">100+ daily calls handled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Existing Hero Split Section (Now Second Section) */}
      <section id="listing-section" className="hero-fullsplit second-section">
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

            <div className="integrations-coming-soon">
              <p className="integrations-text">Integration with leading listing platforms coming soon:</p>
              <div className="platform-logos">
                <img src="/media/zillow.png" alt="Zillow" className="platform-logo" />
                <img src="/media/Apartments.webp" alt="Apartments.com" className="platform-logo" />
                <img src="/media/Realtor.com_logo.png" alt="Realtor.com" className="platform-logo" />
                <img src="/media/trulia-png.webp" alt="Trulia" className="platform-logo" />
                <div className="platform-logo fb-marketplace">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Marketplace</span>
                </div>
              </div>
            </div>
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

          {/* Coming Soon Section - Removed/Simplified as it's now the main hero */}
          
        </div>
      </section>

      {/* AI Handles Everything Section */}
      <section className="ai-demo-section">
        <div className="ai-demo-container">
          <div className="ai-demo-header">
            <h2 className="ai-demo-title">AI Handles Everything</h2>
            <p className="ai-demo-subtitle">Natural conversations. Instant actions. Zero missed opportunities.</p>
          </div>

          <div className="ai-demo-interface">
            <div className="ai-demo-tabs">
              <button 
                className={`ai-tab ${activeAiTab === 'leasing' ? 'active' : ''}`}
                onClick={() => setActiveAiTab('leasing')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                    </svg>
                Leasing Inquiries
              </button>
              <button 
                className={`ai-tab ${activeAiTab === 'maintenance' ? 'active' : ''}`}
                onClick={() => setActiveAiTab('maintenance')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
                Maintenance
              </button>
              <button 
                className={`ai-tab ${activeAiTab === 'tenant' ? 'active' : ''}`}
                onClick={() => setActiveAiTab('tenant')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Tenant Questions
              </button>
              <button 
                className={`ai-tab ${activeAiTab === 'moveinout' ? 'active' : ''}`}
                onClick={() => setActiveAiTab('moveinout')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="3" width="15" height="13"/>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/>
                  <circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
                Move In/Out
              </button>
              <button 
                className={`ai-tab ${activeAiTab === 'amenities' ? 'active' : ''}`}
                onClick={() => setActiveAiTab('amenities')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                Amenities
              </button>
              <button 
                className={`ai-tab ${activeAiTab === 'logistics' ? 'active' : ''}`}
                onClick={() => setActiveAiTab('logistics')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Logistics
              </button>
                  </div>

            <div className="ai-demo-content">
              {/* Leasing Inquiries Tab */}
              {activeAiTab === 'leasing' && (
                <>
                  <div className="ai-conversation-panel">
                    <div className="caller-info">
                      <div className="caller-avatar">
                        <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Leslie" />
                </div>
                      <div className="caller-details">
                        <span className="caller-name">Leslie</span>
                        <span className="caller-divider">|</span>
                        <span className="caller-property">412 Market Street</span>
                      </div>
                      <span className="call-time">3:28 PM <span className="timezone">EST</span></span>
                    </div>

                    <div className="user-message">
                      <p>Hello, This apartment seems perfect and I am interested in setting up a showing!</p>
                    </div>

                    <div className="ai-response-container">
                      <div className="ai-operator-info">
                        <div className="audio-wave-icon">
                          <span></span><span></span><span></span><span></span>
                        </div>
                        <span className="operator-name">Lisa</span>
                        <span className="operator-divider">|</span>
                        <span className="audio-duration">Audio 01:05</span>
                      </div>

                      <div className="ai-message">
                        <p>Hi Leslie, I'd be happy to help with that! We currently have a 1-bedroom on the 3rd floor available at 412 Market Street. It features hardwood floors, in-unit laundry, and a balcony with a city view.</p>
                        <p>Our next available tour slots are tomorrow at 11 AM, or Friday at 2 PM. Which one works better for you? I'll also email you a brochure and a virtual walk-through video in case you'd like to preview before your visit.</p>
                      </div>
                    </div>
                    
                    <div className="powered-by">POWERED BY SQUAREFT</div>
                  </div>

                  <div className="ai-status-panel">
                    <div className="audio-player">
                      <button className="play-button">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z"/>
                    </svg>
                      </button>
                      <div className="audio-progress">
                        <div className="audio-bar"></div>
                  </div>
                </div>

                    <div className="status-badges">
                      <div className="status-badge blue">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        Status: In-Progress
              </div>
                      <div className="status-badge purple">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        Priority: Routine
            </div>
                      <div className="status-badge green">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="12" r="10"/>
                        </svg>
                        Sentiment: Positive
          </div>
        </div>

                    <div className="action-badges">
                      <div className="action-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Tour Scheduled
                      </div>
                      <div className="action-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Brochure Sent
                      </div>
            </div>

                    <div className="doc-badges">
                      <div className="doc-badge">Docs: Leasing_Inquiry</div>
                      <div className="doc-badge">Tour_Scheduling</div>
                </div>
                  </div>
                </>
              )}

              {/* Maintenance Tab */}
              {activeAiTab === 'maintenance' && (
                <>
                  <div className="ai-conversation-panel">
                    <div className="caller-info">
                      <div className="caller-avatar">
                        <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Marcus" />
                      </div>
                      <div className="caller-details">
                        <span className="caller-name">Marcus</span>
                        <span className="caller-divider">|</span>
                        <span className="caller-property">Unit 4B, Parkview Apartments</span>
                      </div>
                      <span className="call-time">11:42 PM <span className="timezone">EST</span></span>
                    </div>

                    <div className="user-message">
                      <p>My heater stopped working and it's freezing in here. Can someone come look at it?</p>
                    </div>

                    <div className="ai-response-container">
                      <div className="ai-operator-info">
                        <div className="audio-wave-icon">
                          <span></span><span></span><span></span><span></span>
                        </div>
                        <span className="operator-name">Robbie</span>
                        <span className="operator-divider">|</span>
                        <span className="audio-duration">Audio 00:48</span>
                      </div>

                      <div className="ai-message">
                        <p>I'm really sorry to hear that, Marcus. I understand how uncomfortable that must be, especially at this hour.</p>
                        <p>I've flagged this as an urgent maintenance request and our on-call technician Mike will be there within 2 hours. In the meantime, I've sent you a text with portable heater pickup locations nearby if needed.</p>
                      </div>
                    </div>
                    
                    <div className="powered-by">POWERED BY SQUAREFT</div>
                  </div>

                  <div className="ai-status-panel">
                    <div className="audio-player">
                      <button className="play-button">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z"/>
                  </svg>
                      </button>
                      <div className="audio-progress">
                        <div className="audio-bar" style={{width: '45%'}}></div>
                </div>
              </div>

                    <div className="status-badges">
                      <div className="status-badge orange">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8" x2="12" y2="12"/>
                          <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        Status: Urgent
                      </div>
                      <div className="status-badge red">Priority: High</div>
                      <div className="status-badge yellow">Sentiment: Concerned</div>
                    </div>

                    <div className="action-badges">
                      <div className="action-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Technician Dispatched
                      </div>
                      <div className="action-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        SMS Sent
                      </div>
                    </div>

                    <div className="doc-badges">
                      <div className="doc-badge">Docs: Maintenance_Request</div>
                      <div className="doc-badge">Emergency_Protocol</div>
                    </div>
                  </div>
                </>
              )}

              {/* Tenant Questions Tab */}
              {activeAiTab === 'tenant' && (
                <>
                  <div className="ai-conversation-panel">
                    <div className="caller-info">
                      <div className="caller-avatar">
                        <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Erin" />
                      </div>
                      <div className="caller-details">
                        <span className="caller-name">Erin</span>
                        <span className="caller-divider">|</span>
                        <span className="caller-property">Canyon Ridge, Unit 302</span>
                      </div>
                      <span className="call-time">2:15 PM <span className="timezone">EST</span></span>
                    </div>

                    <div className="user-message">
                      <p>Hi, I need to add my partner to the lease. What's the process for that?</p>
                    </div>

                    <div className="ai-response-container">
                      <div className="ai-operator-info">
                        <div className="audio-wave-icon">
                          <span></span><span></span><span></span><span></span>
                        </div>
                        <span className="operator-name">Frank</span>
                        <span className="operator-divider">|</span>
                        <span className="audio-duration">Audio 01:22</span>
                      </div>

                      <div className="ai-message">
                        <p>Hi Erin! Great question. Adding a partner to your lease is straightforward. They'll need to complete a standard background check and provide proof of income.</p>
                        <p>I've just emailed you the "Add Occupant" form. Once your partner fills it out, we typically process these within 3-5 business days. Would you like me to schedule a call with our leasing team to answer any other questions?</p>
                      </div>
                    </div>
                    
                    <div className="powered-by">POWERED BY SQUAREFT</div>
                  </div>

                  <div className="ai-status-panel">
                    <div className="audio-player">
                      <button className="play-button">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                      </button>
                      <div className="audio-progress">
                        <div className="audio-bar" style={{width: '60%'}}></div>
                  </div>
                    </div>

                    <div className="status-badges">
                      <div className="status-badge green">Status: Resolved</div>
                      <div className="status-badge purple">Priority: Routine</div>
                      <div className="status-badge green">Sentiment: Neutral</div>
                    </div>

                    <div className="action-badges">
                      <div className="action-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Form Sent
                      </div>
                      <div className="action-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Follow-up Scheduled
                      </div>
                    </div>

                    <div className="doc-badges">
                      <div className="doc-badge">Docs: Lease_Amendment</div>
                      <div className="doc-badge">Add_Occupant_Form</div>
                    </div>
                  </div>
                </>
              )}

              {/* Move In/Out Tab */}
              {activeAiTab === 'moveinout' && (
                <>
                  <div className="ai-conversation-panel">
                    <div className="caller-info">
                      <div className="caller-avatar">
                        <img src="https://randomuser.me/api/portraits/men/45.jpg" alt="Jason" />
                      </div>
                      <div className="caller-details">
                        <span className="caller-name">Jason</span>
                        <span className="caller-divider">|</span>
                        <span className="caller-property">555 Oak Street, Apt 12</span>
                      </div>
                      <span className="call-time">10:30 AM <span className="timezone">EST</span></span>
                    </div>

                    <div className="user-message">
                      <p>I'm moving out next month. What do I need to do to get my security deposit back?</p>
                    </div>

                    <div className="ai-response-container">
                      <div className="ai-operator-info">
                        <div className="audio-wave-icon">
                          <span></span><span></span><span></span><span></span>
                        </div>
                        <span className="operator-name">Lisa</span>
                        <span className="operator-divider">|</span>
                        <span className="audio-duration">Audio 01:45</span>
                      </div>

                      <div className="ai-message">
                        <p>Hi Jason, thanks for letting us know! To ensure a smooth move-out and full deposit return, here's what you'll need:</p>
                        <p>1) Schedule your move-out inspection (I can book that now), 2) Return all keys and parking passes, 3) Leave the unit in clean, broom-swept condition. I've just texted you our move-out checklist. Would you like to schedule your inspection for the last day of your lease?</p>
                      </div>
                    </div>
                    
                    <div className="powered-by">POWERED BY SQUAREFT</div>
                  </div>

                  <div className="ai-status-panel">
                    <div className="audio-player">
                      <button className="play-button">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z"/>
                            </svg>
                      </button>
                      <div className="audio-progress">
                        <div className="audio-bar" style={{width: '25%'}}></div>
                          </div>
                    </div>

                    <div className="status-badges">
                      <div className="status-badge blue">Status: In-Progress</div>
                      <div className="status-badge purple">Priority: Routine</div>
                      <div className="status-badge green">Sentiment: Positive</div>
                    </div>

                    <div className="action-badges">
                      <div className="action-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                            </svg>
                        Checklist Sent
                          </div>
                      <div className="action-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                            </svg>
                        Notice Logged
                          </div>
                        </div>

                    <div className="doc-badges">
                      <div className="doc-badge">Docs: Move_Out_Notice</div>
                      <div className="doc-badge">Inspection_Schedule</div>
                      </div>
                          </div>
                </>
              )}

              {/* Amenities Tab */}
              {activeAiTab === 'amenities' && (
                <>
                  <div className="ai-conversation-panel">
                    <div className="caller-info">
                      <div className="caller-avatar">
                        <img src="https://randomuser.me/api/portraits/women/22.jpg" alt="Sarah" />
                        </div>
                      <div className="caller-details">
                        <span className="caller-name">Sarah</span>
                        <span className="caller-divider">|</span>
                        <span className="caller-property">The Heights, Unit 1804</span>
                            </div>
                      <span className="call-time">5:40 PM <span className="timezone">EST</span></span>
                              </div>

                    <div className="user-message">
                      <p>Do we have a gym and where is the package room located?</p>
                            </div>

                    <div className="ai-response-container">
                      <div className="ai-operator-info">
                        <div className="audio-wave-icon">
                          <span></span><span></span><span></span><span></span>
                          </div>
                        <span className="operator-name">Frank</span>
                        <span className="operator-divider">|</span>
                        <span className="audio-duration">Audio 01:12</span>
                        </div>

                      <div className="ai-message">
                        <p>Hi Sarah! Yes, we have a fully equipped fitness center located in Building C, ground floor near the east side entrance. It's open 24/7 and your key fob gives you access.</p>
                        <p>The package room is right next to the main lobby on the first floor—you'll get an automated text whenever a package arrives. Would you like me to send you a property map showing all amenity locations?</p>
                            </div>
                          </div>
                    
                    <div className="powered-by">POWERED BY SQUAREFT</div>
                        </div>

                  <div className="ai-status-panel">
                    <div className="audio-player">
                      <button className="play-button">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </button>
                      <div className="audio-progress">
                        <div className="audio-bar" style={{width: '80%'}}></div>
                      </div>
                    </div>

                    <div className="status-badges">
                      <div className="status-badge green">Status: Resolved</div>
                      <div className="status-badge purple">Priority: Low</div>
                      <div className="status-badge green">Sentiment: Neutral</div>
                  </div>

                    <div className="action-badges">
                      <div className="action-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Map Offered
                </div>
              </div>

                    <div className="doc-badges">
                      <div className="doc-badge">Docs: Amenity_FAQ</div>
                      <div className="doc-badge">Property_Map</div>
            </div>
          </div>
                </>
              )}

              {/* Logistics Tab */}
              {activeAiTab === 'logistics' && (
                <>
                  <div className="ai-conversation-panel">
                    <div className="caller-info">
                      <div className="caller-avatar">
                        <img src="https://randomuser.me/api/portraits/men/75.jpg" alt="David" />
            </div>
                      <div className="caller-details">
                        <span className="caller-name">David</span>
                        <span className="caller-divider">|</span>
                        <span className="caller-property">888 Oak Avenue</span>
            </div>
                      <span className="call-time">9:15 AM <span className="timezone">EST</span></span>
            </div>

                    <div className="user-message">
                      <p>I'm moving in next week. Where do I pick up my keys and parking pass?</p>
            </div>

                    <div className="ai-response-container">
                      <div className="ai-operator-info">
                        <div className="audio-wave-icon">
                          <span></span><span></span><span></span><span></span>
                        </div>
                        <span className="operator-name">Lisa</span>
                        <span className="operator-divider">|</span>
                        <span className="audio-duration">Audio 01:08</span>
          </div>

                      <div className="ai-message">
                        <p>Welcome, David! You can pick up your keys and parking pass from our leasing office at 888 Oak Avenue, Suite 100. Office hours are Monday-Friday 9AM-6PM and Saturday 10AM-4PM.</p>
                        <p>I've scheduled a key pickup appointment for you on your move-in date at 10 AM. I'll also text you the elevator reservation form for your moving day. Is there anything else you need?</p>
                      </div>
                    </div>
                    
                    <div className="powered-by">POWERED BY SQUAREFT</div>
                  </div>

                  <div className="ai-status-panel">
                    <div className="audio-player">
                      <button className="play-button">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
                      <div className="audio-progress">
                        <div className="audio-bar" style={{width: '55%'}}></div>
                      </div>
                    </div>

                    <div className="status-badges">
                      <div className="status-badge green">Status: Resolved</div>
                      <div className="status-badge purple">Priority: Routine</div>
                      <div className="status-badge green">Sentiment: Excited</div>
                    </div>

                    <div className="action-badges">
                      <div className="action-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Appointment Scheduled
                      </div>
                      <div className="action-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Forms Sent
                      </div>
                    </div>

                    <div className="doc-badges">
                      <div className="doc-badge">Docs: Move_In_Guide</div>
                      <div className="doc-badge">Elevator_Reservation</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="use-cases" className="how-it-works-section">
        <div className="how-it-works-container">
          <div className="solutions-grid">
            
            {/* Listing Block */}
            <div className="solution-block">
              <div className="solution-label">
                <span className="label-dot"></span>
                Listing Creation
              </div>
              <h2 className="solution-headline">
                From address to<br/>
                <span className="headline-accent">market-ready listing</span><br/>
                in under a minute
              </h2>
              <p className="solution-description">
                Enter any property address. Our AI pulls photos, generates stunning virtual staging, 
                writes compelling descriptions, and creates a complete listing—ready to attract renters.
              </p>
              
              <div className="process-steps">
                <div className="process-step">
                  <span className="step-num">01</span>
                  <div className="step-info">
                    <h4>Enter Address</h4>
              <p>Type your property address</p>
            </div>
            </div>
                <div className="process-step">
                  <span className="step-num">02</span>
                  <div className="step-info">
                    <h4>AI Stages & Writes</h4>
                    <p>Virtual staging + pro copy</p>
            </div>
                </div>
                <div className="process-step">
                  <span className="step-num">03</span>
                  <div className="step-info">
                    <h4>Publish Free</h4>
                    <p>Share your listing instantly</p>
                  </div>
                </div>
                <div className="process-step coming-soon-step">
                  <span className="step-num">04</span>
                  <div className="step-info">
                    <h4>Platform Integrations <span className="coming-soon-badge">Coming Soon</span></h4>
                    <p>Zillow, Apartments.com & more</p>
                  </div>
            </div>
          </div>

              <button className="solution-cta" onClick={() => document.getElementById('listing-section')?.scrollIntoView({ behavior: 'smooth' })}>
                Try it free - Enter your address
              </button>
            </div>

            {/* Operations Block */}
            <div className="solution-block">
              <div className="solution-label operations-label">
                <span className="label-dot operations-dot"></span>
                Property Operations
              </div>
              <h2 className="solution-headline">
                Never miss a call.<br/>
                <span className="headline-accent-green">Never lose a lead.</span>
              </h2>
              <p className="solution-description">
                Your AI team handles phone calls around the clock. Leasing inquiries get tours scheduled. 
                Maintenance issues get triaged and dispatched. You get updates—not interruptions.
              </p>
              
              <div className="process-steps">
                <div className="process-step">
                  <span className="step-num ops-num">01</span>
                  <div className="step-info">
                    <h4>Leasing Inquiries</h4>
                    <p>Schedule tours, send applications</p>
                  </div>
                </div>
                <div className="process-step">
                  <span className="step-num ops-num">02</span>
                  <div className="step-info">
                    <h4>Maintenance Dispatch</h4>
                    <p>Triage issues, dispatch techs</p>
                  </div>
                </div>
                <div className="process-step">
                  <span className="step-num ops-num">03</span>
                  <div className="step-info">
                    <h4>Tenant Support</h4>
                    <p>Answer questions instantly</p>
                  </div>
                </div>
                <div className="process-step">
                  <span className="step-num ops-num">04</span>
                  <div className="step-info">
                    <h4>Smart Escalation</h4>
                    <p>Knows when to involve you</p>
                  </div>
                </div>
              </div>

              <a href="tel:+18573178479" className="solution-cta operations-cta-btn">
                <Phone size={18} />
                Try a demo call
              </a>
            </div>
            
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="faq-section">
        <div className="faq-container">
          <div className="faq-header">
            <div className="beta-badge">
              <span className="beta-pulse"></span>
              Now Accepting Closed Beta
            </div>
            <h2 className="faq-title">Frequently Asked Questions</h2>
            <p className="faq-subtitle">
              Everything you need to know about SquareFt. Can't find what you're looking for? 
              <button className="inline-link" onClick={(e) => openCalendly(e)}>Book a consultation</button>
            </p>
          </div>

          <div className="faq-accordion">
            <div 
              className={`faq-item ${expandedFaq === 0 ? 'expanded' : ''}`}
              onClick={() => setExpandedFaq(expandedFaq === 0 ? null : 0)}
            >
              <div className="faq-question">
                <span>Is SquareFt really free?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
              </svg>
              </div>
              <div className="faq-answer">
                <div className="faq-answer-inner">
                  <p>Yes! Creating listings is completely free during our closed beta. Enter any property address and get a professional listing with AI-generated descriptions and virtual staging at no cost. We're offering free access to early users to gather feedback and refine the experience.</p>
                </div>
              </div>
            </div>

            <div 
              className={`faq-item ${expandedFaq === 1 ? 'expanded' : ''}`}
              onClick={() => setExpandedFaq(expandedFaq === 1 ? null : 1)}
            >
              <div className="faq-question">
                <span>How does the AI voice agent work?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
              <div className="faq-answer">
                <div className="faq-answer-inner">
                  <p>Our AI operators (Lisa for leasing, Robbie for maintenance, Frank for general inquiries) handle incoming calls 24/7. They can schedule tours, answer common questions, triage maintenance requests, and dispatch vendors—all while keeping you informed via text or email summaries.</p>
                </div>
              </div>
            </div>

            <div 
              className={`faq-item ${expandedFaq === 2 ? 'expanded' : ''}`}
              onClick={() => setExpandedFaq(expandedFaq === 2 ? null : 2)}
            >
              <div className="faq-question">
                <span>Can I publish listings directly to Zillow or Apartments.com?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
              <div className="faq-answer">
                <div className="faq-answer-inner">
                  <p>Not yet, but it's coming soon! We're actively building integrations with major listing platforms including Zillow, Apartments.com, Realtor.com, and Facebook Marketplace. For now, you can easily copy your listing details or share a direct link.</p>
                </div>
              </div>
            </div>

            <div 
              className={`faq-item ${expandedFaq === 3 ? 'expanded' : ''}`}
              onClick={() => setExpandedFaq(expandedFaq === 3 ? null : 3)}
            >
              <div className="faq-question">
                <span>How accurate is the virtual staging?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
              <div className="faq-answer">
                <div className="faq-answer-inner">
                  <p>Our AI generates realistic virtual staging that helps renters visualize empty spaces. While it's designed for marketing purposes, we recommend noting in your listing that images are virtually staged. The staging is optimized for rental properties and includes modern, neutral furnishings.</p>
                </div>
              </div>
            </div>

            <div 
              className={`faq-item ${expandedFaq === 4 ? 'expanded' : ''}`}
              onClick={() => setExpandedFaq(expandedFaq === 4 ? null : 4)}
            >
              <div className="faq-question">
                <span>What happens if the AI can't handle a call?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
              <div className="faq-answer">
                <div className="faq-answer-inner">
                  <p>Our AI knows its limits. For complex issues, emergencies, or when a caller specifically requests a human, it will seamlessly escalate to you via text, email, or direct call transfer based on your preferences. You set the escalation rules.</p>
                </div>
              </div>
            </div>

            <div 
              className={`faq-item ${expandedFaq === 5 ? 'expanded' : ''}`}
              onClick={() => setExpandedFaq(expandedFaq === 5 ? null : 5)}
            >
              <div className="faq-question">
                <span>How many properties can I manage?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
              <div className="faq-answer">
                <div className="faq-answer-inner">
                  <p>During the closed beta, there are no limits on the number of properties or listings you can create. We're building SquareFt to scale from individual landlords with one unit to property managers with hundreds of doors.</p>
                </div>
              </div>
            </div>

            <div 
              className={`faq-item ${expandedFaq === 6 ? 'expanded' : ''}`}
              onClick={() => setExpandedFaq(expandedFaq === 6 ? null : 6)}
            >
              <div className="faq-question">
                <span>Is my data secure?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
              <div className="faq-answer">
                <div className="faq-answer-inner">
                  <p>Absolutely. We use bank-level encryption for all data, never share your information with third parties, and comply with industry security standards. Call recordings are encrypted and only accessible to you.</p>
                </div>
              </div>
            </div>

            <div 
              className={`faq-item ${expandedFaq === 7 ? 'expanded' : ''}`}
              onClick={() => setExpandedFaq(expandedFaq === 7 ? null : 7)}
            >
              <div className="faq-question">
                <span>What's included in the closed beta?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
              <div className="faq-answer">
                <div className="faq-answer-inner">
                  <p>Beta users get full access to AI listing creation (virtual staging, descriptions, free hosting) and early access to our AI voice operations. You'll also get direct input into our product roadmap and priority access when we launch platform integrations.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="faq-cta-section">
            <h3 className="faq-cta-title">Ready to simplify property management?</h3>
            <p className="faq-cta-subtitle">Join our closed beta and get free access to AI-powered listings and operations.</p>
            <div className="faq-cta-buttons">
              <a href="tel:+18573178479" className="cta-btn cta-demo">
                <Phone size={18} />
                Try Demo Call
              </a>
              <button className="cta-btn cta-listing" onClick={() => document.getElementById('listing-section')?.scrollIntoView({ behavior: 'smooth' })}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                Try Free Listing
            </button>
              <button className="cta-btn cta-consult" onClick={(e) => openCalendly(e)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Book Consultation
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-main">
            <div className="footer-brand-section">
              <div className="footer-brand">SquareFt</div>
              <p className="footer-tagline">
                AI-powered property management for modern landlords.
              </p>
            </div>

            <div className="footer-nav">
              <a href="#use-cases" onClick={(e) => { e.preventDefault(); document.getElementById('use-cases')?.scrollIntoView({ behavior: 'smooth' }); }}>Use Cases</a>
              <a href="#faq" onClick={(e) => { e.preventDefault(); document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }); }}>FAQ</a>
              <a href="mailto:hello@squareft.io">Contact</a>
            </div>

              <div className="footer-social">
              <a href="https://instagram.com/squareft" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeLinecap="round"/>
                  </svg>
                </a>
              <a href="https://linkedin.com/company/squareft" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="LinkedIn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
                    <circle cx="4" cy="4" r="2"/>
                  </svg>
                </a>
            </div>
          </div>

          <div className="footer-bottom">
            <div>© 2025 SquareFt. All rights reserved.</div>
            <a href="tel:+18573178479" className="footer-phone">
              <Phone size={14} />
              +1 (857) 317-8479
            </a>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .landing-container {
          min-height: 100vh;
          background: #fafbfc;
          position: relative;
          overflow-x: hidden;
        }

        /* Blue Blur Orbs - Enhanced */
        .blur-orb {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(24, 119, 242, 0.45) 0%, rgba(24, 119, 242, 0.15) 40%, transparent 70%);
          pointer-events: none;
          z-index: 0;
          mix-blend-mode: multiply;
        }

        /* Ensure content sits above orbs */
        .topnav,
        .voice-ai-hero,
        .hero-fullsplit,
        .ai-demo-section,
        .how-it-works-section,
        .faq-section,
        .footer {
          position: relative;
          z-index: 1;
        }

        .orb-1 {
          width: 700px;
          height: 700px;
          top: -150px;
          right: -200px;
          filter: blur(100px);
          opacity: 0.6;
        }

        .orb-2 {
          width: 400px;
          height: 400px;
          top: 12%;
          left: -100px;
          filter: blur(60px);
          opacity: 0.5;
        }

        .orb-3 {
          width: 550px;
          height: 550px;
          top: 28%;
          right: -150px;
          filter: blur(80px);
          opacity: 0.55;
        }

        .orb-4 {
          width: 650px;
          height: 650px;
          top: 42%;
          left: -180px;
          filter: blur(90px);
          opacity: 0.6;
        }

        .orb-5 {
          width: 350px;
          height: 350px;
          top: 58%;
          right: 5%;
          filter: blur(50px);
          opacity: 0.45;
        }

        .orb-6 {
          width: 800px;
          height: 800px;
          top: 70%;
          left: -200px;
          filter: blur(110px);
          opacity: 0.5;
        }

        .orb-7 {
          width: 250px;
          height: 250px;
          top: 22%;
          left: 25%;
          filter: blur(40px);
          opacity: 0.4;
        }

        .orb-8 {
          width: 750px;
          height: 750px;
          bottom: -200px;
          right: -150px;
          filter: blur(100px);
          opacity: 0.65;
        }

        /* Voice AI Hero Section */
        .voice-ai-hero {
          position: relative;
          padding-top: 160px;
          padding-bottom: 0;
          background: transparent;
          overflow: hidden;
        }

        .voice-hero-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          position: relative;
          z-index: 1;
        }

        .voice-hero-title-full {
          font-size: 62px;
          line-height: 1.1;
          font-weight: 900;
          color: #0f172a;
          margin: 0 0 48px;
          letter-spacing: -2px;
          text-align: center;
        }

        .text-highlight {
          color: #1877F2;
        }

        .voice-hero-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: flex-start;
          max-width: 920px;
          margin: 0 auto;
        }

        .voice-hero-phone {
          display: flex;
          justify-content: center;
          align-items: flex-end;
        }

        .iphone-image {
          width: 100%;
          max-width: 340px;
          height: auto;
          object-fit: contain;
          margin-bottom: -60px;
        }

        .voice-hero-content {
          max-width: 420px;
          padding-top: 40px;
        }

        .voice-hero-subtitle {
          font-size: 28px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 18px;
          letter-spacing: -0.3px;
        }

        .voice-hero-description {
          font-size: 17px;
          color: #64748b;
          line-height: 1.7;
          margin: 0 0 32px;
        }

        .voice-hero-actions {
          display: flex;
          gap: 14px;
          margin-bottom: 36px;
        }

        .btn-primary-large {
          background: #059669;
          color: white;
          border: none;
          padding: 13px 22px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 14px rgba(5, 150, 105, 0.25);
          text-decoration: none;
        }

        .btn-primary-large:hover {
          background: #047857;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(5, 150, 105, 0.35);
        }

        .btn-secondary-large {
          background: #0f172a;
          color: white;
          border: none;
          padding: 13px 22px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-secondary-large:hover {
          background: #1e293b;
          transform: translateY(-2px);
        }

        .voice-social-proof {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: nowrap;
        }

        .proof-avatars-container {
          display: flex;
          flex-direction: column;
          margin-left: 6px;
          flex-shrink: 0;
        }

        .proof-avatars-row {
          display: flex;
          margin-bottom: -8px;
        }

        .proof-avatars-row:last-child {
          margin-bottom: 0;
        }

        .avatar-img {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid white;
          margin-left: -10px;
          object-fit: cover;
          background: #e2e8f0;
          position: relative;
        }

        .proof-avatars-row .avatar-img:first-child {
          margin-left: 0;
          z-index: 4;
        }

        .proof-avatars-row .avatar-img:nth-child(2) {
          z-index: 3;
        }

        .proof-avatars-row .avatar-img:nth-child(3) {
          z-index: 2;
        }

        .proof-avatars-row .avatar-img:nth-child(4) {
          z-index: 1;
        }

        .proof-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 13px;
          color: #475569;
        }

        .proof-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .proof-dot {
          color: #059669;
          font-size: 18px;
          line-height: 1;
        }

        .proof-highlight {
          font-weight: 600;
          color: #0f172a;
        }

        /* Phone Visual */
        .voice-hero-visual {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        /* iPhone Device */
        .iphone-device {
          position: relative;
          z-index: 1;
        }

        .iphone-frame {
          width: 280px;
          height: 560px;
          background: linear-gradient(145deg, #1c1c1e, #0a0a0c);
          border-radius: 50px;
          padding: 10px;
          position: relative;
          box-shadow: 
            0 0 0 2px #2c2c2e,
            0 30px 60px rgba(0, 0, 0, 0.5),
            inset 0 0 0 1px rgba(255, 255, 255, 0.05);
        }

        .iphone-notch {
          position: absolute;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          width: 90px;
          height: 26px;
          background: #0a0a0c;
          border-radius: 0 0 14px 14px;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .notch-speaker {
          width: 36px;
          height: 4px;
          background: #1c1c1e;
          border-radius: 2px;
        }

        .notch-camera {
          width: 6px;
          height: 6px;
          background: #1c1c3a;
          border-radius: 50%;
          box-shadow: inset 0 0 2px rgba(100, 100, 200, 0.5);
        }

        .iphone-screen {
          background: #f8fafc;
          width: 100%;
          height: 100%;
          border-radius: 42px;
          overflow: hidden;
          position: relative;
        }

        .call-screen {
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 48px 20px 20px;
          background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
        }

        .call-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .call-timer {
          font-size: 14px;
          font-weight: 600;
          color: #10b981;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }

        .caller-number-big {
          font-size: 22px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .caller-label {
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
        }

        .chat-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 8px 0;
        }

        .chat-msg {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          animation: msgFade 0.4s ease-out forwards;
          opacity: 0;
        }

        .chat-msg.prospect-msg {
          animation-delay: 0.2s;
        }

        .chat-msg.ai-response {
          animation-delay: 0.6s;
          justify-content: flex-end;
        }

        @keyframes msgFade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .msg-avatar {
          width: 24px;
          height: 24px;
          background: #e2e8f0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 20px;
        }

        .msg-avatar span {
          font-size: 8px;
          font-weight: 700;
          color: white;
        }

        .msg-avatar.ai-avatar {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        }

        .msg-content {
          display: flex;
          flex-direction: column;
          gap: 3px;
          max-width: 75%;
        }

        .msg-content.ai-content {
          align-items: flex-end;
        }

        .msg-label {
          font-size: 10px;
          font-weight: 600;
          color: #94a3b8;
          padding-left: 2px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .msg-label.ai-label {
          color: #3b82f6;
          padding-right: 2px;
          padding-left: 0;
        }

        .msg-bubble {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          border-top-left-radius: 4px;
          padding: 10px 14px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .msg-bubble p {
          font-size: 13px;
          color: #1e293b;
          margin: 0;
          line-height: 1.4;
        }

        .msg-bubble.ai-bubble {
          background: #3b82f6;
          border: none;
          border-top-left-radius: 14px;
          border-top-right-radius: 4px;
        }

        .msg-bubble.ai-bubble p {
          color: white;
        }

        .call-controls-bar {
          display: flex;
          justify-content: center;
          gap: 40px;
          padding-top: 20px;
          padding-bottom: 8px;
        }

        .ctrl-btn {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .end-call {
          background: #ef4444;
          box-shadow: 0 4px 16px rgba(239, 68, 68, 0.35);
        }

        .end-call:hover {
          transform: scale(1.08);
        }

        .mic-btn {
          background: linear-gradient(135deg, #60a5fa, #3b82f6);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.35);
          position: relative;
        }

        .mic-btn:hover {
          transform: scale(1.08);
        }

        .mic-btn.shining::before {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(96, 165, 250, 0.5), rgba(59, 130, 246, 0.2));
          animation: micShine 1.5s ease-in-out infinite;
          z-index: -1;
        }

        .mic-btn.shining::after {
          content: '';
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 2px solid rgba(59, 130, 246, 0.25);
          animation: micRing 2s ease-out infinite;
        }

        @keyframes micShine {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.03); }
        }

        @keyframes micRing {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.3); opacity: 0; }
        }

        .iphone-home-bar {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          width: 100px;
          height: 4px;
          background: #1c1c1e;
          border-radius: 2px;
        }

        .phone-shadow {
          position: absolute;
          bottom: -25px;
          left: 50%;
          transform: translateX(-50%);
          width: 180px;
          height: 20px;
          background: radial-gradient(ellipse, rgba(0, 0, 0, 0.25) 0%, transparent 70%);
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
          padding: 20px calc((100% - 1200px) / 2 + 24px);
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
          gap: 8px;
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
          padding: 10px 16px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          text-decoration: none;
        }

        .menu-link.login:hover {
          background: #f8fafc;
          color: #166FE5;
        }

        /* Nav Dropdown */
        .nav-dropdown {
          position: relative;
        }

        .dropdown-trigger {
          display: flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          cursor: pointer;
        }

        .dropdown-trigger svg {
          transition: transform 0.2s;
        }

        .nav-dropdown:hover .dropdown-trigger svg {
          transform: rotate(180deg);
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(8px);
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.12);
          padding: 8px;
          min-width: 280px;
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s;
          z-index: 1000;
        }

        .nav-dropdown:hover .dropdown-menu {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
        }

        .dropdown-item {
          display: flex;
          flex-direction: column;
          padding: 12px 16px;
          border-radius: 8px;
          text-decoration: none;
          transition: background 0.15s;
        }

        .dropdown-item:hover {
          background: #f8fafc;
        }

        .dropdown-title {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dropdown-desc {
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
        }

        .soon-tag {
          font-size: 10px;
          background: #e0e7ff;
          color: #4f46e5;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
        }

        .coming-soon-item {
          opacity: 0.7;
          cursor: default;
        }

        /* Demo Call - Nav (Blue) */
        .demo-call-nav {
          display: flex;
          align-items: center;
          gap: 6px;
          color: white;
          background: #1877F2;
          padding: 10px 20px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
        }

        .demo-call-nav:hover {
          background: #166FE5;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(24, 119, 242, 0.25);
        }

        /* Mobile Menu Button */
        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
          color: #0f172a;
          border-radius: 8px;
          transition: background 0.2s;
        }

        .mobile-menu-btn:hover {
          background: #f1f5f9;
        }

        /* Mobile Menu Overlay */
        .mobile-menu-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 200;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Mobile Menu Drawer */
        .mobile-menu-drawer {
          position: absolute;
          top: 0;
          right: 0;
          width: 280px;
          max-width: 85%;
          height: 100%;
          background: white;
          padding: 80px 24px 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          box-shadow: -10px 0 40px rgba(0, 0, 0, 0.15);
          animation: slideInRight 0.3s ease;
        }

        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        .mobile-menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          color: #0f172a;
          text-decoration: none;
          font-size: 16px;
          font-weight: 600;
          border-radius: 12px;
          transition: background 0.2s;
        }

        .mobile-menu-item:hover {
          background: #f8fafc;
        }

        .mobile-menu-cta {
          background: #059669;
          color: white;
          margin-top: auto;
        }

        .mobile-menu-cta:hover {
          background: #047857;
        }

        /* Hero Split - Second Section */
        .hero-fullsplit {
          position: relative;
          min-height: 80vh; /* Adjusted height */
          padding-top: 40px; /* Reduced top padding */
          padding-bottom: 80px;
          background: transparent;
          display: flex;
          align-items: center;
        }
        
        .second-section {
          border-top: 1px solid #f1f5f9;
        }

        .hero-fullsplit::before {
          display: none;
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

        /* Integrations Coming Soon */
        .integrations-coming-soon {
          margin-top: 32px;
          text-align: center;
        }

        .integrations-text {
          font-size: 14px;
          color: #64748b;
          margin: 0 0 16px;
          font-weight: 500;
        }

        .platform-logos {
          display: flex;
          gap: 32px;
          align-items: left;
          justify-content: left;
          flex-wrap: wrap;
        }

        .platform-logo {
          height: 28px;
          width: auto;
          object-fit: contain;
          opacity: 0.6;
          transition: all 0.2s;
          filter: grayscale(20%);
        }

        .platform-logo:hover {
          opacity: 1;
          filter: grayscale(0%);
          transform: scale(1.05);
        }

        .fb-marketplace {
          display: flex;
          align-items: center;
          gap: 6px;
          opacity: 0.6;
          transition: all 0.2s;
          height: auto;
        }

        .fb-marketplace span {
          font-size: 14px;
          font-weight: 600;
          color: #1877F2;
        }

        .fb-marketplace:hover {
          opacity: 1;
          transform: scale(1.05);
        }

        @media (max-width: 768px) {
          .integrations-coming-soon {
            margin-top: 24px;
          }

          .integrations-text {
            font-size: 13px;
            text-align: left;
          }

          .platform-logos {
            justify-content: center;
          }

          .platform-logo {
            height: 22px;
          }

          .facebook-logo {
            height: 22px;
            width: 22px;
          }
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
          transition: transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94), 
                      box-shadow 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                      opacity 0.4s ease-out;
          transform: rotateY(-6deg) rotateX(3deg);
          will-change: transform, opacity;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
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

        /* AI Handles Everything Section */
        .ai-demo-section {
          background: transparent;
          padding: 100px 0;
          position: relative;
          overflow: hidden;
        }

        .ai-demo-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 20%, rgba(24, 119, 242, 0.05) 0%, transparent 40%),
            radial-gradient(circle at 80% 80%, rgba(24, 119, 242, 0.03) 0%, transparent 40%);
          pointer-events: none;
        }

        .ai-demo-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          position: relative;
          z-index: 1;
        }

        .ai-demo-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .ai-demo-title {
          font-size: 48px;
          font-weight: 900;
          color: #0f172a;
          margin: 0 0 16px;
          letter-spacing: -1px;
        }

        .ai-demo-subtitle {
          font-size: 20px;
          color: #64748b;
          margin: 0;
          font-weight: 400;
        }

        .ai-demo-interface {
          background: white;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.08);
        }

        .ai-demo-tabs {
          display: flex;
          gap: 8px;
          padding: 20px 24px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          overflow-x: auto;
        }

        .ai-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: transparent;
          border: none;
          border-radius: 10px;
          color: #64748b;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .ai-tab:hover {
          color: #1e293b;
          background: #e2e8f0;
        }

        .ai-tab.active {
          background: #1877F2;
          color: white;
        }

        .ai-demo-content {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          min-height: 450px;
        }

        .ai-conversation-panel {
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          background: white;
        }

        .caller-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .caller-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid #e2e8f0;
        }

        .caller-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .caller-details {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .caller-name {
          color: #0f172a;
          font-weight: 700;
          font-size: 15px;
        }

        .caller-divider {
          color: #cbd5e1;
        }

        .caller-property {
          color: #64748b;
          font-size: 14px;
        }

        .call-time {
          margin-left: auto;
          color: #64748b;
          font-size: 14px;
          font-weight: 600;
        }

        .timezone {
          color: #94a3b8;
          font-weight: 400;
        }

        .user-message {
          background: #f1f5f9;
          border-radius: 16px;
          padding: 18px 22px;
          border: 1px solid #e2e8f0;
        }

        .user-message p {
          color: #334155;
          font-size: 15px;
          line-height: 1.6;
          margin: 0;
        }

        .ai-response-container {
          flex: 1;
        }

        .ai-operator-info {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }

        .audio-wave-icon {
          display: flex;
          align-items: center;
          gap: 2px;
          height: 20px;
        }

        .audio-wave-icon span {
          width: 3px;
          height: 100%;
          background: #1877F2;
          border-radius: 2px;
          animation: audioWave 1s ease-in-out infinite;
        }

        .audio-wave-icon span:nth-child(1) { animation-delay: 0s; height: 40%; }
        .audio-wave-icon span:nth-child(2) { animation-delay: 0.2s; height: 80%; }
        .audio-wave-icon span:nth-child(3) { animation-delay: 0.4s; height: 60%; }
        .audio-wave-icon span:nth-child(4) { animation-delay: 0.6s; height: 100%; }

        @keyframes audioWave {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.5); }
        }

        .operator-name {
          color: #0f172a;
          font-weight: 700;
          font-size: 14px;
        }

        .operator-divider {
          color: #cbd5e1;
        }

        .audio-duration {
          color: #64748b;
          font-size: 13px;
        }

        .ai-message {
          background: linear-gradient(135deg, #1877F2 0%, #0056D2 100%);
          border-radius: 16px;
          padding: 24px;
        }

        .ai-message p {
          color: white;
            font-size: 15px;
          line-height: 1.7;
          margin: 0 0 16px;
        }

        .ai-message p:last-child {
          margin-bottom: 0;
        }

        .powered-by {
          color: #94a3b8;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-top: auto;
          text-align: center;
        }

        .ai-status-panel {
          background: #f8fafc;
          padding: 32px;
          display: flex;
          flex-direction: column;
            gap: 20px;
          border-left: 1px solid #e2e8f0;
        }

        .audio-player {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .play-button {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #1877F2;
          border: none;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .play-button:hover {
          background: #166FE5;
          transform: scale(1.05);
        }

        .audio-progress {
          flex: 1;
          height: 4px;
          background: #e2e8f0;
          border-radius: 2px;
          overflow: hidden;
        }

        .audio-bar {
          width: 30%;
          height: 100%;
          background: #1877F2;
          border-radius: 2px;
        }

        .status-badges, .action-badges, .doc-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .status-badge, .action-badge, .doc-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: #f1f5f9;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          border: 1px solid #e2e8f0;
        }

        .status-badge.blue {
          background: #eff6ff;
          color: #1d4ed8;
          border-color: #bfdbfe;
        }

        .status-badge.purple {
          background: #f5f3ff;
          color: #7c3aed;
          border-color: #ddd6fe;
        }

        .status-badge.green {
          background: #ecfdf5;
          color: #059669;
          border-color: #a7f3d0;
        }

        .status-badge.green svg {
          fill: #10b981;
        }

        .status-badge.orange {
          background: #fff7ed;
          color: #ea580c;
          border-color: #fed7aa;
        }

        .status-badge.red {
          background: #fef2f2;
          color: #dc2626;
          border-color: #fecaca;
        }

        .status-badge.yellow {
          background: #fefce8;
          color: #ca8a04;
          border-color: #fef08a;
        }

        @media (max-width: 1024px) {
          .ai-demo-content {
            grid-template-columns: 1fr;
          }

          .ai-status-panel {
            border-left: none;
            border-top: 1px solid #e2e8f0;
          }
        }

        @media (max-width: 768px) {
          .ai-demo-section {
            padding: 60px 0;
          }

          .ai-demo-title {
            font-size: 36px;
          }

          .ai-demo-subtitle {
            font-size: 16px;
          }

          .ai-demo-tabs {
          padding: 16px;
          }

          .ai-tab {
            padding: 8px 14px;
            font-size: 13px;
          }

          .ai-conversation-panel {
            padding: 20px;
          }

          .ai-status-panel {
            padding: 20px;
          }
        }

        /* How It Works Section */
        .how-it-works-section {
          background: transparent;
          padding: 120px 0;
          position: relative;
        }

        .how-it-works-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .solutions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
        }

        .solution-block {
          
        }

        .solution-label {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 700;
          color: #1877F2;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 32px;
        }

        .label-dot {
          width: 8px;
          height: 8px;
          background: #1877F2;
          border-radius: 50%;
        }

        .operations-label {
          color: #059669;
        }

        .operations-dot {
          background: #059669;
        }

        .solution-headline {
          font-size: 42px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.15;
          margin: 0 0 24px;
          letter-spacing: -1.5px;
        }

        .headline-accent {
          color: #1877F2;
        }

        .headline-accent-green {
          color: #059669;
        }

        .solution-description {
          font-size: 18px;
          color: #475569;
          line-height: 1.7;
          margin: 0 0 40px;
        }

        .process-steps {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 40px;
        }

        .process-step {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .step-num {
          font-size: 11px;
          font-weight: 800;
          color: #1877F2;
          letter-spacing: 1px;
          min-width: 24px;
          padding-top: 2px;
        }

        .ops-num {
          color: #059669;
        }

        .step-info h4 {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .step-info p {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }

        .coming-soon-step {
          opacity: 0.7;
        }

        .coming-soon-badge {
          font-size: 9px;
          font-weight: 700;
          background: linear-gradient(135deg, #1877F2, #0056D2);
          color: white;
          padding: 3px 8px;
          border-radius: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .solution-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: #0f172a;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .solution-cta:hover {
          background: #1e293b;
          transform: translateY(-2px);
        }

        .operations-cta-btn {
          background: #059669;
        }

        .operations-cta-btn:hover {
          background: #047857;
        }

        @media (max-width: 1024px) {
          .solutions-grid {
            grid-template-columns: 1fr;
            gap: 80px;
          }

          .solution-headline {
            font-size: 36px;
          }
        }

        @media (max-width: 768px) {
          .how-it-works-section {
            padding: 80px 0;
          }

          .solution-headline {
            font-size: 28px;
          }

          .solution-description {
            font-size: 16px;
          }
        }


        /* FAQ Section */
        .faq-section {
          background: transparent;
          padding: 100px 0;
        }

        .faq-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .faq-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .beta-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(135deg, #059669, #047857);
          color: white;
          padding: 10px 20px;
          border-radius: 30px;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 24px;
        }

        .beta-pulse {
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          animation: betaPulse 2s ease-in-out infinite;
        }

        @keyframes betaPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }

        .faq-title {
          font-size: 42px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 16px;
          letter-spacing: -1px;
        }

        .faq-subtitle {
          font-size: 18px;
          color: #64748b;
          margin: 0;
          line-height: 1.6;
        }

        .inline-link {
          background: none;
          border: none;
          color: #1877F2;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 3px;
          padding: 0;
          margin-left: 4px;
        }

        .inline-link:hover {
          color: #0056D2;
        }

        .faq-accordion {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 60px;
        }

        .faq-item {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .faq-item:hover {
          border-color: #cbd5e1;
        }

        .faq-item.expanded {
          border-color: #1877F2;
          box-shadow: 0 4px 12px rgba(24, 119, 242, 0.1);
        }

        .faq-question {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          gap: 16px;
        }

        .faq-question span {
          font-size: 16px;
          font-weight: 600;
          color: #0f172a;
          line-height: 1.4;
        }

        .faq-chevron {
          flex-shrink: 0;
          color: #94a3b8;
          transition: transform 0.2s ease;
          will-change: transform;
        }

        .faq-item.expanded .faq-chevron {
          transform: rotate(180deg);
          color: #1877F2;
        }

        .faq-answer {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.2s ease-out;
          will-change: grid-template-rows;
        }

        .faq-item.expanded .faq-answer {
          grid-template-rows: 1fr;
        }

        .faq-answer-inner {
          overflow: hidden;
        }

        .faq-answer p {
          padding: 0 24px 20px;
          margin: 0;
          font-size: 15px;
          color: #64748b;
          line-height: 1.7;
          border-top: 1px solid #f1f5f9;
          padding-top: 16px;
        }

        .faq-cta-section {
          text-align: center;
          padding: 60px 0 20px;
          max-width: 900px;
          margin: 0 auto;
        }

        .faq-cta-title {
          font-size: 32px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 12px;
          letter-spacing: -0.5px;
        }

        .faq-cta-subtitle {
          font-size: 17px;
          color: #64748b;
          margin: 0 0 36px;
        }

        .faq-cta-buttons {
          display: flex;
          justify-content: center;
          gap: 16px;
        }

        .cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 24px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid transparent;
        }

        .cta-demo {
          background: #059669;
          color: white;
          border-color: #059669;
        }

        .cta-demo:hover {
          background: #047857;
          border-color: #047857;
          transform: translateY(-2px);
        }

        .cta-listing {
          background: #1877F2;
          color: white;
          border-color: #1877F2;
        }

        .cta-listing:hover {
          background: #166FE5;
          border-color: #166FE5;
          transform: translateY(-2px);
        }

        .cta-consult {
          background: #0f172a;
          color: white;
          border-color: #0f172a;
        }

        .cta-consult:hover {
          background: #1e293b;
          border-color: #1e293b;
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .faq-section {
            padding: 60px 0;
          }

          .faq-title {
            font-size: 32px;
          }

          .faq-question {
            padding: 16px 20px;
          }

          .faq-question span {
            font-size: 15px;
          }

          .faq-answer p {
            padding: 0 20px 16px;
          font-size: 14px;
          }

          .faq-cta-section {
            padding: 40px 0 20px;
          }

          .faq-cta-title {
            font-size: 26px;
          }

          .faq-cta-buttons {
            flex-direction: column;
            gap: 12px;
          }

          .cta-btn {
            width: 100%;
            justify-content: center;
          }
        }

        /* Footer */
        .footer {
          background: transparent;
          color: #64748b;
          padding: 16px 0 0;
          border-top: 1px solid #e5e7eb;
        }

        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0;
        }

        .footer-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .footer-brand-section {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .footer-brand {
          font-size: 18px;
          font-weight: 900;
          color: #1e293b;
        }

        .footer-tagline {
          font-size: 13px;
          color: #94a3b8;
          margin: 0;
          padding-left: 12px;
          border-left: 1px solid #e5e7eb;
        }

        .footer-nav {
          display: flex;
          gap: 16px;
        }

        .footer-nav a {
          color: #64748b;
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          transition: color 0.2s;
        }

        .footer-nav a:hover {
          color: #1877F2;
        }

        .footer-social {
          display: flex;
          gap: 8px;
        }

        .footer-social-link {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          transition: all 0.2s;
          text-decoration: none;
        }

        .footer-social-link:hover {
          background: #1877F2;
          color: white;
          transform: translateY(-2px);
        }

        .footer-bottom {
          border-top: 1px solid #e5e7eb;
          padding-top: 8px;
          padding-bottom: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
        }

        .footer-phone {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #64748b;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }

        .footer-phone:hover {
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
          .voice-hero-container,
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

          .voice-hero-container {
            grid-template-columns: 1fr;
            gap: 40px;
            text-align: center;
          }

          .voice-hero-content {
            margin: 0 auto;
          }

          .voice-hero-actions {
            justify-content: center;
          }
          
          .voice-social-proof {
            justify-content: center;
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

          .footer-main {
            flex-direction: column;
            text-align: center;
          }

          .footer-brand-section {
            flex-direction: column;
          }

          .footer-tagline {
            border-left: none;
            padding-left: 0;
          }
        }

        @media (max-width: 768px) {
          .voice-ai-hero {
            padding-top: 100px;
            padding-bottom: 60px;
          }

          .voice-hero-title-full {
            font-size: 36px;
            margin-bottom: 40px;
            letter-spacing: -1px;
          }

          .voice-hero-split {
            grid-template-columns: 1fr;
            gap: 40px;
          }

          .voice-hero-phone {
            order: -1;
          }

          .iphone-image {
            max-width: 260px;
          }

          .voice-hero-content {
            text-align: center;
            margin: 0 auto;
          }

          .voice-hero-subtitle {
            font-size: 24px;
          }

          .voice-hero-description {
            font-size: 16px;
          }

          .voice-hero-actions {
            flex-direction: column;
            align-items: center;
          }

          .btn-primary-large, .btn-secondary-large {
            width: 100%;
            justify-content: center;
          }

          .voice-social-proof {
            justify-content: center;
          }

          .topnav {
            padding: 12px 16px;
          }

          /* Hide desktop menu on mobile */
          .desktop-menu {
            display: none;
          }

          /* Show hamburger button on mobile */
          .mobile-menu-btn {
            display: flex;
          }

          /* Show mobile menu overlay on mobile */
          .mobile-menu-overlay {
            display: block;
          }

          .brand-logo {
            height: 48px;
          }

          .brand-tagline {
            font-size: 10px;
          }

          .hero-title-big {
            font-size: 38px;
            letter-spacing: -0.8px;
          }

          .hero-caption {
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

        /* Mobile Performance Optimizations */
        @media (max-width: 768px) {
          /* Enable smooth scrolling on mobile */
          html, body {
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
          }
          
          /* Simplify nav backdrop filter on mobile for better scrolling */
          .topnav::before {
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
          }
          
          /* Disable 3D transforms on mobile for better performance */
          .hero-property-card {
            transform: none !important;
            perspective: none;
          }
          
          .hero-property-card:hover {
            transform: none !important;
          }
          
          .hero-property-card.fading {
            transform: none !important;
            opacity: 0.5;
          }
          
          /* Disable blur orbs on mobile for better performance */
          .blur-orb {
            display: none;
          }
          
          /* Simplify hero-right perspective on mobile */
          .hero-right {
            perspective: none;
          }
          
          /* Simplify photo transitions on mobile */
          .photo-slide {
            transition: opacity 0.3s ease !important;
            transform: none !important;
          }
          
          .photo-slide.active {
            opacity: 1;
          }
          
          .photo-slide.left,
          .photo-slide.right {
            opacity: 0;
          }
          
          /* Reduce photo carousel height on mobile */
          .photo-carousel-container {
            min-height: 350px;
          }
          
          .photo-slide {
            min-height: 350px;
          }
          
          .photo-slide img {
            min-height: 350px;
          }
          
          /* Faster FAQ transitions on mobile */
          .faq-answer {
            transition: grid-template-rows 0.15s ease-out;
          }
          
          .faq-chevron {
            transition: transform 0.15s ease;
          }
          
          /* Reduce button hover animations on mobile */
          .btn-primary-large:hover,
          .btn-secondary-large:hover,
          .cta-demo:hover,
          .cta-listing:hover,
          .cta-consult:hover {
            transform: none;
          }
          
          /* Simplify box-shadows on mobile */
          .hero-property-card {
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          }
          
          /* Remove complex animations from cards on mobile */
          .ai-demo-interface,
          .solution-block,
          .faq-item {
            animation: none;
          }
        }

        /* Reduced motion preference - respect user accessibility settings */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
          
          .hero-property-card {
            transform: none !important;
          }
          
          .photo-slide {
            transition: none !important;
          }
          
          .faq-answer {
            transition: none !important;
          }
          
          .faq-chevron {
            transition: none !important;
          }
          
          .hero-content {
            animation: none !important;
          }
          
          .chat-msg {
            animation: none !important;
            opacity: 1 !important;
          }
          
          .beta-pulse {
            animation: none !important;
          }
          
          .error-icon-circle {
            animation: none !important;
          }
        }
      `}</style>
      </div>
    </>
  );
}