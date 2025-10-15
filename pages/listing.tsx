import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { MapPin, Bed, Bath, Maximize, DollarSign, Heart, Share2, Calendar, Shield, Zap, Wand2, RotateCcw } from 'lucide-react';
import StagedImage from '../components/StagedImage';
import Walkthrough from '../components/Walkthrough';

export default function ListingPage() {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [integrations, setIntegrations] = useState({
    squareft: true,
    zillow: false,
    apartments: false,
    realtor: false,
    trulia: false,
    facebook: false,
  });
  
  // Staging state - store staged URLs for each image index
  const [stagedImages, setStagedImages] = useState<{[key: number]: string}>({});
  
  // AI Description generation state
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [generatedDescription, setGeneratedDescription] = useState<string>('');
  const [showOriginalDescription, setShowOriginalDescription] = useState(true);
  
  // Walkthrough state
  const [showWalkthrough, setShowWalkthrough] = useState(false);

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

  const [appUrl, setAppUrl] = useState('');

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

  // Staging API functions
  const handleStageImage = async (imageIndex: number) => {
    try {
      const imageUrl = displayListing.images[imageIndex];
      
      console.log('🎨 Staging image:', imageUrl);
      
      // Send property context to help AI make better staging decisions
      const propertyContext = {
        type: displayListing.type || 'residential',
        bedrooms: displayListing.beds,
        bathrooms: displayListing.baths,
        sqft: displayListing.sqft,
        price: displayListing.price,
        description: displayListing.description || '',
      };
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      const response = await fetch(`${getApiUrl()}/api/listings/stage-image-demo/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image_url: imageUrl,
          property_context: propertyContext,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Staging failed');
      }
      
      const data = await response.json();
      console.log('✅ Staging complete, received data URL of length:', data.staged_url?.length);
      
      // Store the staged URL (base64 data URL)
      setStagedImages(prev => ({
        ...prev,
        [imageIndex]: data.staged_url,
      }));
    } catch (error: any) {
      console.error('❌ Staging error:', error);
      
      // Better error messages
      if (error.name === 'AbortError') {
        throw new Error('Staging timed out. Please try again with a smaller image.');
      } else if (error.message === 'Failed to fetch') {
        throw new Error('Network error. Please check your connection and try again.');
      } else {
        throw error;
      }
    }
  };

  const handleUnstageImage = async (imageIndex: number) => {
    // Remove staged version
    setStagedImages(prev => {
      const newStaged = { ...prev };
      delete newStaged[imageIndex];
      return newStaged;
    });
  };

  const handleGenerateDescription = async () => {
    try {
      setIsGeneratingDescription(true);
      
      console.log('🎨 Generating AI description...');
      
      // Prepare property data for AI
      const propertyData = {
        address: displayListing.address || '',
        type: displayListing.type || 'residential',
        bedrooms: displayListing.beds,
        bathrooms: displayListing.baths,
        sqft: displayListing.sqft?.toString() || '',
        price: displayListing.price || '',
        amenities: displayListing.amenities || [],
        features: listing.property_details || {},
        neighborhood: listing.neighborhood || {},
      };
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`${getApiUrl()}/api/listings/generate-description/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(propertyData),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate description');
      }
      
      const data = await response.json();
      console.log('✅ Description generated:', data.description);
      
      // Update the generated description state and switch to AI version
      setGeneratedDescription(data.description);
      setShowOriginalDescription(false);
      
    } catch (error: any) {
      console.error('❌ Description generation error:', error);
      
      // Better error messages
      if (error.name === 'AbortError') {
        alert('Description generation timed out. Please try again.');
      } else if (error.message === 'Failed to fetch') {
        alert('Network error. Please check your connection and try again.');
      } else {
        alert(`Failed to generate description: ${error.message}`);
      }
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Show walkthrough on first visit
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const forceWalkthrough = urlParams.get('walkthrough') === 'true';
    const hasSeenWalkthrough = localStorage.getItem('hasSeenWalkthrough');
    
    if (forceWalkthrough || !hasSeenWalkthrough) {
      // Delay to let the page render first
      setTimeout(() => {
        setShowWalkthrough(true);
      }, 1000);
    }
  }, []);

  // Resolve appUrl on client
  useEffect(() => {
    setAppUrl(getAppUrl());
  }, []);

  // Load listing data from sessionStorage (populated by API)
  const [listing, setListing] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load listing data from sessionStorage
    const storedListing = sessionStorage.getItem('currentListing');
    const storedError = sessionStorage.getItem('listingError');

    if (storedError) {
      setError(storedError);
      sessionStorage.removeItem('listingError');
    } else if (storedListing) {
      try {
        const parsedListing = JSON.parse(storedListing);
        setListing(parsedListing);
      } catch (e) {
        setError('Failed to parse listing data');
      }
    } else {
      // No data found, redirect back to home
      router.push('/');
    }
  }, [router]);

  // Show loading state while data is being loaded
  if (!listing && !error) {
    return <div style={{ padding: '100px', textAlign: 'center' }}>Loading...</div>;
  }

  // Show error state
  if (error) {
    return (
      <div style={{ padding: '100px', textAlign: 'center' }}>
        <h2>Error Loading Listing</h2>
        <p>{error}</p>
        <button onClick={() => router.push('/')} style={{ marginTop: '20px', padding: '10px 20px' }}>
          Go Back Home
        </button>
      </div>
    );
  }

  // Transform API data to match the component's expected format
  // Filter out placeholder/invalid image URLs
  const filterValidImages = (photos: string[] | undefined) => {
    if (!photos || photos.length === 0) return [];
    
    const validImages = photos.filter(url => {
      // Filter out placeholder domains and invalid URLs
      const invalidDomains = ['photos.domain.com', 'example.com', 'placeholder.com'];
      try {
        const urlObj = new URL(url);
        return !invalidDomains.some(domain => urlObj.hostname.includes(domain));
      } catch {
        return false;
      }
    });
    
    return validImages;
  };

  const apiImages = filterValidImages(listing.media?.photos);
  const fallbackImages = [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&h=800&fit=crop&q=80',
  ];

  const displayListing = {
    address: listing.address?.full_address || listing.address?.street || 'Address not available',
    price: listing.pricing?.price || 0,
    beds: listing.property_details?.bedrooms || 0,
    baths: listing.property_details?.bathrooms || 0,
    sqft: listing.property_details?.living_area_sqft || 0,
    type: listing.pricing?.status === 'FOR_RENT' ? 'For Rent' : listing.pricing?.status === 'FOR_SALE' ? 'For Sale' : 'Property',
    description: listing.description || listing.ai_description || 'No description available',
    amenities: listing.property_details?.amenities || [],
    images: apiImages.length > 0 ? apiImages : fallbackImages,
    agents: listing.agents || [],
    schools: listing.schools || [],
    nearby: listing.nearby || {},
    parking: listing.property_details?.parking || {},
    pets: listing.property_details?.pets_allowed || [],
    heating: listing.property_details?.heating || [],
    cooling: listing.property_details?.cooling || [],
    laundry: listing.property_details?.laundry || [],
  };

  const handlePublishClick = () => {
    setShowIntegrationModal(true);
  };

  const handleAuthRedirect = (mode: 'login' | 'signup') => {
    const appUrl = getAppUrl();
    if (mode === 'login') {
      window.location.href = `${appUrl}/login`;
    } else {
      window.location.href = `${appUrl}/landlord-signup`;
    }
  };

  const handleHeartOrShareClick = () => {
    setShowAuthModal(true);
  };

  const handleGoLive = () => {
    setShowIntegrationModal(false);
    setShowAuthModal(true);
  };

  const toggleIntegration = (platform: string) => {
    if (platform === 'squareft') return; // SquareFt is always on
    setIntegrations(prev => ({
      ...prev,
      [platform]: !prev[platform as keyof typeof prev]
    }));
  };

  return (
    <>
      {/* Walkthrough Tutorial */}
      {showWalkthrough && (
        <Walkthrough onComplete={() => setShowWalkthrough(false)} />
      )}
      
      <div className="listing-page">
        {/* Top Navigation */}
        <nav className={`topnav ${isScrolled ? 'scrolled' : ''}`}>
          <div className="brand" onClick={() => router.push('/')}>
            <div className="brand-content">
              <img src="/logo1.png" alt="SquareFt" className="brand-logo" />
              <span className="brand-tagline">Your AI Property Assistant</span>
            </div>
          </div>
          <div className="menu">
            <a href="/#how" className="menu-link">About</a>
            <a href="/#agents" className="menu-link">AI Agents</a>
            <a href="/#browse" className="menu-link">FAQ</a>
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

        {/* Main Content */}
        <div className="listing-container">
          {/* Image Gallery */}
          <div className="image-section">
            <div className="main-image">
              <StagedImage
                originalUrl={displayListing.images[currentImageIndex]}
                stagedUrl={stagedImages[currentImageIndex] || null}
                mediaId={`image-${currentImageIndex}`}
                alt={`Property - ${currentImageIndex + 1}`}
                onStage={async () => await handleStageImage(currentImageIndex)}
                onUnstage={async () => await handleUnstageImage(currentImageIndex)}
                className="property-main-image"
              />
              <div className="image-controls">
                <button 
                  className="image-nav prev"
                  onClick={() => setCurrentImageIndex((prev) => prev === 0 ? displayListing.images.length - 1 : prev - 1)}
                  disabled={currentImageIndex === 0}
                >
                  ‹
                </button>
                <button 
                  className="image-nav next"
                  onClick={() => setCurrentImageIndex((prev) => prev === displayListing.images.length - 1 ? 0 : prev + 1)}
                  disabled={currentImageIndex === displayListing.images.length - 1}
                >
                  ›
                </button>
              </div>
              <div className="image-counter">
                {currentImageIndex + 1} / {displayListing.images.length}
              </div>
            </div>
            <div className="thumbnail-grid">
              {displayListing.images.map((image, idx) => (
                <div 
                  key={idx} 
                  className={`thumbnail ${idx === currentImageIndex ? 'active' : ''}`}
                  onClick={() => setCurrentImageIndex(idx)}
                >
                  <img src={image} alt={`View ${idx + 1}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Listing Details */}
          <div className="details-section">
            <div className="listing-header">
              <div className="listing-type-badge">{displayListing.type}</div>
              <div className="listing-actions">
                <button className="action-btn" onClick={handleHeartOrShareClick}>
                  <Heart size={20} />
                </button>
                <button className="action-btn" onClick={handleHeartOrShareClick}>
                  <Share2 size={20} />
                </button>
              </div>
            </div>

            <div className="listing-price">${displayListing.price.toLocaleString()}/mo</div>
            <div className="listing-address">
              <MapPin size={20} />
              {displayListing.address}
            </div>

            <div className="listing-stats">
              <div className="stat">
                <Bed size={22} />
                <span>{displayListing.beds} Beds</span>
              </div>
              <div className="stat">
                <Bath size={22} />
                <span>{displayListing.baths} Baths</span>
              </div>
              <div className="stat">
                <Maximize size={22} />
                <span>{displayListing.sqft.toLocaleString()} sqft</span>
              </div>
            </div>

            <div className="section">
              <div className="section-header-with-action">
                <h3>Description</h3>
                <div className="button-group">
                  {generatedDescription && (
                    <button
                      onClick={() => setShowOriginalDescription(!showOriginalDescription)}
                      className="toggle-btn"
                      title={showOriginalDescription ? "View AI-generated description" : "View original description"}
                      aria-label="Toggle description"
                    >
                      <RotateCcw size={18} />
                    </button>
                  )}
                  <button
                    onClick={handleGenerateDescription}
                    disabled={isGeneratingDescription}
                    className="generate-description-btn"
                    title={isGeneratingDescription ? "Generating AI description..." : "Generate AI description — creates compelling copy using property details"}
                    aria-label="Generate AI description"
                  >
                    {isGeneratingDescription ? (
                      <div className="spinner-small" />
                    ) : (
                      <Wand2 size={18} />
                    )}
                  </button>
                </div>
              </div>
              <p className="description">
                {!showOriginalDescription && generatedDescription ? generatedDescription : displayListing.description}
              </p>
            </div>

            {displayListing.amenities && displayListing.amenities.length > 0 && (
              <div className="section">
                <h3>Amenities</h3>
                <div className="amenities-grid">
                  {displayListing.amenities.map((amenity, idx) => (
                    <div key={idx} className="amenity-item">
                      <Zap size={16} />
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Property Details - Only show section if any detail is available */}
            {(() => {
              const hasPropertyDetails = 
                listing.property_details?.year_built ||
                listing.property_details?.lot_size_sqft ||
                listing.property_details?.stories ||
                displayListing.parking?.type ||
                (displayListing.pets && displayListing.pets.length > 0 && !displayListing.pets.includes('None')) ||
                (displayListing.heating && displayListing.heating.length > 0 && !displayListing.heating.includes('None')) ||
                (displayListing.cooling && displayListing.cooling.length > 0 && !displayListing.cooling.includes('None')) ||
                (displayListing.laundry && displayListing.laundry.length > 0 && !displayListing.laundry.includes('None')) ||
                listing.pricing?.deposit ||
                listing.pricing?.application_fee ||
                listing.pricing?.lease_term ||
                listing.pricing?.availability_date;

              if (!hasPropertyDetails) return null;

              return (
                <div className="section">
                  <h3>Property Details</h3>
                  <div className="details-grid">
                    {listing.property_details?.year_built && (
                      <div className="detail-item">
                        <strong>Year Built</strong>
                        <span>{listing.property_details.year_built}</span>
                      </div>
                    )}
                    {listing.property_details?.lot_size_sqft && (
                      <div className="detail-item">
                        <strong>Lot Size</strong>
                        <span>{listing.property_details.lot_size_sqft.toLocaleString()} sqft</span>
                      </div>
                    )}
                    {listing.property_details?.stories && listing.property_details.stories > 0 && (
                      <div className="detail-item">
                        <strong>Stories</strong>
                        <span>{listing.property_details.stories}</span>
                      </div>
                    )}
                    {displayListing.parking?.type && (
                      <div className="detail-item">
                        <strong>Parking</strong>
                        <span>{displayListing.parking.type}{displayListing.parking.spaces ? ` (${displayListing.parking.spaces} spaces)` : ''}</span>
                      </div>
                    )}
                    {displayListing.pets && displayListing.pets.length > 0 && !displayListing.pets.includes('None') && (
                      <div className="detail-item">
                        <strong>Pets Allowed</strong>
                        <span>{displayListing.pets.join(', ')}</span>
                      </div>
                    )}
                    {displayListing.heating && displayListing.heating.length > 0 && !displayListing.heating.includes('None') && (
                      <div className="detail-item">
                        <strong>Heating</strong>
                        <span>{displayListing.heating.join(', ')}</span>
                      </div>
                    )}
                    {displayListing.cooling && displayListing.cooling.length > 0 && !displayListing.cooling.includes('None') && (
                      <div className="detail-item">
                        <strong>Cooling</strong>
                        <span>{displayListing.cooling.join(', ')}</span>
                      </div>
                    )}
                    {displayListing.laundry && displayListing.laundry.length > 0 && !displayListing.laundry.includes('None') && (
                      <div className="detail-item">
                        <strong>Laundry</strong>
                        <span>{displayListing.laundry.join(', ')}</span>
                      </div>
                    )}
                    {listing.pricing?.deposit && listing.pricing.deposit > 0 && (
                      <div className="detail-item">
                        <strong>Security Deposit</strong>
                        <span>${listing.pricing.deposit.toLocaleString()}</span>
                      </div>
                    )}
                    {listing.pricing?.application_fee && listing.pricing.application_fee > 0 && (
                      <div className="detail-item">
                        <strong>Application Fee</strong>
                        <span>${listing.pricing.application_fee}</span>
                      </div>
                    )}
                    {listing.pricing?.lease_term && (
                      <div className="detail-item">
                        <strong>Lease Term</strong>
                        <span>{listing.pricing.lease_term}</span>
                      </div>
                    )}
                    {listing.pricing?.availability_date && (
                      <div className="detail-item">
                        <strong>Available From</strong>
                        <span>{new Date(listing.pricing.availability_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {listing.pricing?.price_per_sqft && listing.pricing.price_per_sqft > 0 && (
                      <div className="detail-item">
                        <strong>Price per sqft</strong>
                        <span>${listing.pricing.price_per_sqft.toFixed(2)}</span>
                      </div>
                    )}
                    {listing.pricing?.other_fees && listing.pricing.other_fees.length > 0 && 
                      listing.pricing.other_fees.map((fee: any, idx: number) => (
                        <div key={idx} className="detail-item">
                          <strong>{fee.type}</strong>
                          <span>${fee.amount.toLocaleString()}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              );
            })()}

            {/* Agent Information */}
            {displayListing.agents && displayListing.agents.length > 0 && (
              <div className="section">
                <h3>Contact Agent</h3>
                <div className="agents-list">
                  {displayListing.agents.map((agent, idx) => (
                    <div key={idx} className="agent-card">
                      <div className="agent-info">
                        <h4>{agent.name}</h4>
                        <p className="agent-company">{agent.company} • {agent.role}</p>
                      </div>
                      <div className="agent-contact">
                        {agent.phone && (
                          <div className="contact-item">
                            <strong>Phone:</strong> {agent.phone}
                          </div>
                        )}
                        {agent.email && (
                          <div className="contact-item">
                            <strong>Email:</strong> {agent.email}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Schools */}
            {displayListing.schools && displayListing.schools.length > 0 && (
              <div className="section">
                <h3>Nearby Schools</h3>
                <div className="schools-list">
                  {displayListing.schools.map((school, idx) => (
                    <div key={idx} className="school-card">
                      <div className="school-header">
                        <h4>{school.name}</h4>
                        {school.rating && (
                          <div className="school-rating">
                            ⭐ {school.rating}/10
                          </div>
                        )}
                      </div>
                      <div className="school-details">
                        <span className="school-level">{school.level}</span>
                        {school.grades && <span>• Grades {school.grades}</span>}
                        {school.distance_miles && <span>• {school.distance_miles} mi away</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price History */}
            {listing.history?.price_history && listing.history.price_history.length > 0 && (
              <div className="section">
                <h3>Price History</h3>
                <div className="price-history-list">
                  {listing.history.price_history.map((entry: any, idx: number) => (
                    <div key={idx} className="price-history-item">
                      <div className="price-history-date">
                        {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="price-history-details">
                        <span className="price-history-event">{entry.event}</span>
                        <span className="price-history-price">${entry.price.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Neighborhood */}
            {displayListing.nearby?.neighborhood && (
              <div className="section">
                <h3>Neighborhood</h3>
                <p className="neighborhood-name">{displayListing.nearby.neighborhood}</p>
              </div>
            )}

            <div className="cta-section">
              <button className="publish-btn" onClick={handlePublishClick}>
                <Calendar size={20} />
                Publish This Listing
              </button>
              <p className="cta-note">
                <Shield size={16} />
                Free to publish • Syndicate to 10+ platforms instantly
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-content">
            <div className="footer-grid">
              <div>
                <div className="footer-brand">SquareFt</div>
                <p className="footer-tagline">
                  Create professional real estate listings in minutes with AI-powered automation.
                </p>
              </div>

              <div className="footer-column">
                <h4>Product</h4>
                <ul className="footer-links">
                  <li><a href="#features">Features</a></li>
                  <li><a href="#pricing">Pricing</a></li>
                  <li><a href="#integrations">Integrations</a></li>
                </ul>
              </div>

              <div className="footer-column">
                <h4>Company</h4>
                <ul className="footer-links">
                  <li><a href="#about">About</a></li>
                  <li><a href="#contact">Contact</a></li>
                </ul>
              </div>

              <div className="footer-column">
                <h4>Resources</h4>
                <ul className="footer-links">
                  <li><a href="#help">Help Center</a></li>
                  <li><a href="#docs">Documentation</a></li>
                </ul>
              </div>
            </div>

            <div className="footer-bottom">
              <div>© 2025 SquareFt.ai. All rights reserved.</div>
              <div className="footer-bottom-links">
                <a href="#privacy">Privacy</a>
                <a href="#terms">Terms</a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Integration Modal */}
      {showIntegrationModal && (
        <div className="auth-modal-overlay" onClick={() => setShowIntegrationModal(false)}>
          <div className="integration-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowIntegrationModal(false)}>×</button>
            
            <h2 className="modal-title">Publish Your Listing</h2>
            <p className="modal-description">
              Choose where you want to publish this listing. We'll syndicate it to all selected platforms instantly.
            </p>

            <div className="integrations-list">
              {/* SquareFt - Always On */}
              <div className="integration-item active">
                <div className="integration-info">
                  <img src="/logo1.png" alt="SquareFt" className="integration-logo squareft-logo" />
                  <div>
                    <div className="integration-name">SquareFt Public Listing</div>
                    <div className="integration-desc">Always included • Free forever</div>
                  </div>
                </div>
                <div className="toggle-switch active disabled">
                  <div className="toggle-slider"></div>
                </div>
              </div>

              {/* Zillow */}
              <div className={`integration-item ${integrations.zillow ? 'active' : ''}`}>
                <div className="integration-info">
                  <img src="/media/zillow.png" alt="Zillow" className="integration-logo" />
                  <div>
                    <div className="integration-name">Zillow</div>
                    <div className="integration-desc">Reach millions of renters</div>
                  </div>
                </div>
                <div 
                  className={`toggle-switch ${integrations.zillow ? 'active' : ''}`}
                  onClick={() => toggleIntegration('zillow')}
                >
                  <div className="toggle-slider"></div>
                </div>
              </div>

              {/* Apartments.com */}
              <div className={`integration-item ${integrations.apartments ? 'active' : ''}`}>
                <div className="integration-info">
                  <img src="/media/Apartments.webp" alt="Apartments.com" className="integration-logo" />
                  <div>
                    <div className="integration-name">Apartments.com</div>
                    <div className="integration-desc">Leading apartment marketplace</div>
                  </div>
                </div>
                <div 
                  className={`toggle-switch ${integrations.apartments ? 'active' : ''}`}
                  onClick={() => toggleIntegration('apartments')}
                >
                  <div className="toggle-slider"></div>
                </div>
              </div>

              {/* Realtor.com */}
              <div className={`integration-item ${integrations.realtor ? 'active' : ''}`}>
                <div className="integration-info">
                  <img src="/media/Realtor.com_logo.png" alt="Realtor.com" className="integration-logo" />
                  <div>
                    <div className="integration-name">Realtor.com</div>
                    <div className="integration-desc">Trusted by millions</div>
                  </div>
                </div>
                <div 
                  className={`toggle-switch ${integrations.realtor ? 'active' : ''}`}
                  onClick={() => toggleIntegration('realtor')}
                >
                  <div className="toggle-slider"></div>
                </div>
              </div>

              {/* Trulia */}
              <div className={`integration-item ${integrations.trulia ? 'active' : ''}`}>
                <div className="integration-info">
                  <img src="/media/trulia-png.webp" alt="Trulia" className="integration-logo" />
                  <div>
                    <div className="integration-name">Trulia</div>
                    <div className="integration-desc">Find quality renters</div>
                  </div>
                </div>
                <div 
                  className={`toggle-switch ${integrations.trulia ? 'active' : ''}`}
                  onClick={() => toggleIntegration('trulia')}
                >
                  <div className="toggle-slider"></div>
                </div>
              </div>

              {/* Facebook Marketplace */}
              <div className={`integration-item ${integrations.facebook ? 'active' : ''}`}>
                <div className="integration-info">
                  <div className="integration-logo-text facebook-logo">f</div>
                  <div>
                    <div className="integration-name">Facebook Marketplace</div>
                    <div className="integration-desc">Local reach, fast results</div>
                  </div>
                </div>
                <div 
                  className={`toggle-switch ${integrations.facebook ? 'active' : ''}`}
                  onClick={() => toggleIntegration('facebook')}
                >
                  <div className="toggle-slider"></div>
                </div>
              </div>
            </div>

            <button className="modal-btn primary large" onClick={handleGoLive}>
              <Zap size={20} />
              Go Live
            </button>
            <p className="modal-note">You can always add more platforms later</p>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAuthModal(false)}>×</button>
            
            {/* <div className="modal-icon">
              <Shield size={48} />
            </div> */}
            
            <h2 className="modal-title">Access Dashboard</h2>
            <p className="modal-description">
              To publish and manage your listings, please sign in or create a free account.
            </p>

            <div className="modal-actions">
              <button className="modal-btn primary" onClick={() => handleAuthRedirect('signup')}>
                Create Free Account
              </button>
              <button className="modal-btn secondary" onClick={() => handleAuthRedirect('login')}>
                Sign In
              </button>
            </div>

            <p className="modal-note">
              Free forever • No credit card required
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        .listing-page {
          min-height: 100vh;
          background: #fafbfc;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .listing-page::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 0;
          background: radial-gradient(circle at 50% 50%, rgba(24, 119, 242, 0.08) 0%, rgba(24, 119, 242, 0.03) 40%, transparent 70%);
          pointer-events: none;
        }

        /* Top Navigation */
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
          margin-left: 8px;
          font-weight: 600;
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
          margin-left: 8px;
          font-weight: 600;
        }

        .menu-link.signup:hover {
          background: #166FE5;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(24, 119, 242, 0.25);
        }

        /* Main Content */
        .listing-container {
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          padding: 140px 0 60px;
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 60px;
          position: relative;
          z-index: 1;
        }

        /* Image Section */
        .image-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .main-image {
          position: relative;
          width: 100%;
          height: 600px;
          border-radius: 20px;
          overflow: hidden;
          background: #f1f5f9;
          will-change: transform;
        }

        .main-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
        }

        .property-main-image {
          width: 100%;
          height: 100%;
        }

        .property-main-image .staged-image {
          border-radius: 0;
        }

        .image-controls {
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          transform: translateY(-50%);
          display: flex;
          justify-content: space-between;
          padding: 0 20px;
          pointer-events: none;
        }

        .image-nav {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.95);
          border: none;
          font-size: 28px;
          color: #1e293b;
          cursor: pointer;
          transition: all 0.2s;
          pointer-events: all;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .image-nav:hover:not(:disabled) {
          background: white;
          transform: scale(1.05);
        }

        .image-nav:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .image-counter {
          position: absolute;
          bottom: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .thumbnail-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .thumbnail {
          height: 100px;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          border: 3px solid transparent;
          transition: all 0.2s;
        }

        .thumbnail:hover {
          border-color: #cbd5e1;
        }

        .thumbnail.active {
          border-color: #1877F2;
        }

        .thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Details Section */
        .details-section {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .listing-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .listing-type-badge {
          background: #1877F2;
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .listing-actions {
          display: flex;
          gap: 12px;
        }

        .action-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 2px solid #e5e7eb;
          background: white;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:hover {
          border-color: #1877F2;
          color: #1877F2;
          transform: scale(1.05);
        }

        .listing-price {
          font-size: 44px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -1px;
        }

        .listing-address {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 18px;
          color: #475569;
          font-weight: 500;
        }

        .listing-stats {
          display: flex;
          gap: 32px;
          padding: 24px 0;
          border-top: 2px solid #f1f5f9;
          border-bottom: 2px solid #f1f5f9;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #1e293b;
          font-size: 17px;
          font-weight: 600;
        }

        .stat svg {
          color: #1877F2;
        }

        .section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .section h3 {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .section-header-with-action {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .button-group {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .section-header-with-action .toggle-btn {
          background: rgba(17, 24, 39, 0.9);
          border: 1px solid rgba(0, 0, 0, 0.65);
          border-radius: 10px;
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
          color: #ffffff;
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
        }

        .section-header-with-action .toggle-btn:hover {
          background: rgba(17, 24, 39, 0.4);
          color: #ffffff;
          transform: scale(1.05);
        }

        .section-header-with-action .toggle-btn:active {
          transform: scale(0.95);
        }

        .generate-description-btn {
          background: rgba(17, 24, 39, 0.9);
          border: 1px solid rgba(0, 0, 0, 0.65);
          border-radius: 10px;
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
          color: #ffffff;
          position: relative;
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
        }

        .generate-description-btn:hover:not(:disabled) {
          background: rgba(17, 24, 39, 0.4);
          color: #ffffff;
          transform: scale(1.05);
        }

        .generate-description-btn:active:not(:disabled) {
          transform: scale(0.95);
        }

        .generate-description-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .generate-description-btn svg {
          animation: sparkle 2s ease-in-out infinite;
        }

        @keyframes sparkle {
          0%, 100% {
            transform: rotate(0deg) scale(1);
          }
          25% {
            transform: rotate(-10deg) scale(1.1);
          }
          75% {
            transform: rotate(10deg) scale(1.1);
          }
        }

        .spinner-small {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(24, 119, 242, 0.2);
          border-top-color: #1877F2;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .description {
          font-size: 16px;
          line-height: 1.7;
          color: #475569;
          margin: 0;
        }

        .amenities-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .amenity-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #f8fafc;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 500;
          color: #1e293b;
        }

        .amenity-item svg {
          color: #1877F2;
          flex-shrink: 0;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .detail-item {
          padding: 14px 16px;
          background: #f8fafc;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-item strong {
          color: #64748b;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detail-item span {
          color: #1e293b;
          font-size: 15px;
          font-weight: 500;
        }

        .agents-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .agent-card {
          padding: 20px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .agent-info h4 {
          margin: 0 0 4px 0;
          color: #1e293b;
          font-size: 18px;
        }

        .agent-company {
          color: #64748b;
          font-size: 14px;
          margin: 0 0 12px 0;
        }

        .agent-contact {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .contact-item {
          font-size: 14px;
          color: #475569;
        }

        .contact-item strong {
          color: #64748b;
          font-weight: 500;
          margin-right: 8px;
        }

        .schools-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .school-card {
          padding: 16px;
          background: #f8fafc;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
        }

        .school-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .school-header h4 {
          margin: 0;
          color: #1e293b;
          font-size: 16px;
          font-weight: 600;
        }

        .school-rating {
          background: #fbbf24;
          color: #78350f;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
        }

        .school-details {
          display: flex;
          gap: 8px;
          font-size: 14px;
          color: #64748b;
          flex-wrap: wrap;
        }

        .school-level {
          color: #1877F2;
          font-weight: 500;
        }

        .price-history-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .price-history-item {
          padding: 14px 16px;
          background: #f8fafc;
          border-radius: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-left: 3px solid #1877F2;
        }

        .price-history-date {
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }

        .price-history-details {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .price-history-event {
          font-size: 14px;
          color: #475569;
          padding: 4px 10px;
          background: #e2e8f0;
          border-radius: 6px;
        }

        .price-history-price {
          font-size: 16px;
          color: #1e293b;
          font-weight: 600;
        }

        .neighborhood-name {
          font-size: 16px;
          color: #475569;
          padding: 16px;
          background: #f8fafc;
          border-radius: 10px;
          margin: 0;
        }

        .cta-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 32px 0;
        }

        .publish-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          padding: 18px 32px;
          background: #1877F2;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 17px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(24, 119, 242, 0.25);
        }

        .publish-btn:hover {
          background: #166FE5;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(24, 119, 242, 0.35);
        }

        .cta-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .cta-note svg {
          color: #10b981;
        }

        /* Footer */
        .footer {
          background: white;
          color: #64748b;
          padding: 60px 40px 30px;
          border-top: 1px solid #e5e7eb;
          margin-top: auto;
          position: relative;
          z-index: 1;
        }

        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 60px;
          margin-bottom: 50px;
        }

        .footer-brand {
          font-size: 24px;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 12px;
        }

        .footer-tagline {
          font-size: 15px;
          line-height: 1.6;
          margin: 0;
        }

        .footer-column h4 {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 16px;
        }

        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .footer-links a {
          color: #64748b;
          text-decoration: none;
          font-size: 15px;
          transition: color 0.2s;
        }

        .footer-links a:hover {
          color: #1877F2;
        }

        .footer-bottom {
          border-top: 1px solid #e5e7eb;
          padding-top: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
        }

        .footer-bottom-links {
          display: flex;
          gap: 24px;
        }

        .footer-bottom-links a {
          color: #64748b;
          text-decoration: none;
          transition: color 0.2s;
        }

        .footer-bottom-links a:hover {
          color: #1877F2;
        }

        /* Auth Modal */
        .auth-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .auth-modal {
          position: relative;
          background: white;
          border-radius: 24px;
          padding: 48px 40px;
          max-width: 480px;
          width: 90%;
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.3);
          animation: shakePopIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
          text-align: center;
        }

        @keyframes shakePopIn {
          0% {
            transform: scale(0.7) rotate(0deg);
            opacity: 0;
          }
          10% {
            transform: scale(0.8) rotate(-2deg);
            opacity: 0.5;
          }
          20% {
            transform: scale(0.9) rotate(2deg);
            opacity: 0.8;
          }
          30% {
            transform: scale(1.05) rotate(-3deg);
            opacity: 1;
          }
          40% {
            transform: scale(1.1) rotate(3deg);
          }
          50% {
            transform: scale(1.05) rotate(-2deg);
          }
          60% {
            transform: scale(1.02) rotate(2deg);
          }
          70% {
            transform: scale(1.01) rotate(-1deg);
          }
          80% {
            transform: scale(1.005) rotate(1deg);
          }
          90% {
            transform: scale(1) rotate(-0.5deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        .modal-close {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: #f1f5f9;
          color: #64748b;
          font-size: 28px;
          line-height: 1;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close:hover {
          background: #e2e8f0;
          color: #1e293b;
        }

        .modal-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 24px;
          background: linear-gradient(135deg, #1877F2, #60a5fa);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .modal-title {
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 12px;
          letter-spacing: -0.5px;
        }

        .modal-description {
          font-size: 16px;
          color: #64748b;
          line-height: 1.6;
          margin: 0 0 32px;
        }

        .modal-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .modal-btn {
          width: 100%;
          padding: 16px 32px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .modal-btn.primary {
          background: #1877F2;
          color: white;
        }

        .modal-btn.primary:hover {
          background: #166FE5;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(24, 119, 242, 0.35);
        }

        .modal-btn.secondary {
          background: #f8fafc;
          color: #1e293b;
          border: 2px solid #e5e7eb;
        }

        .modal-btn.secondary:hover {
          background: white;
          border-color: #1877F2;
          color: #1877F2;
        }

        .modal-note {
          margin: 24px 0 0;
          font-size: 14px;
          color: #64748b;
        }

        /* Integration Modal */
        .integration-modal {
          position: relative;
          background: white;
          border-radius: 24px;
          padding: 48px 40px;
          max-width: 580px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.3);
          animation: smoothScaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes smoothScaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .integrations-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 32px;
        }

        .integration-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-radius: 14px;
          border: 2px solid #e5e7eb;
          background: white;
          transition: all 0.3s;
          cursor: pointer;
        }

        .integration-item.active {
          border-color: #1877F2;
          background: #eff6ff;
        }

        .integration-item:hover:not(.active) {
          border-color: #cbd5e1;
          background: #f8fafc;
        }

        .integration-info {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .integration-logo {
          width: 48px;
          height: 48px;
          object-fit: contain;
          border-radius: 8px;
          background: white;
          padding: 6px;
          border: 1px solid #f1f5f9;
        }

        .squareft-logo {
          width: 56px;
          height: 56px;
        }

        .integration-logo-text {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 700;
        }

        .facebook-logo {
          background: #1877F2;
          color: white;
        }

        .integration-name {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 2px;
        }

        .integration-desc {
          font-size: 13px;
          color: #64748b;
        }

        /* Toggle Switch */
        .toggle-switch {
          width: 52px;
          height: 30px;
          background: #e5e7eb;
          border-radius: 15px;
          position: relative;
          cursor: pointer;
          transition: all 0.3s;
          flex-shrink: 0;
        }

        .toggle-switch.active {
          background: #1877F2;
        }

        .toggle-switch.disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .toggle-slider {
          width: 24px;
          height: 24px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 3px;
          left: 3px;
          transition: all 0.3s;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .toggle-switch.active .toggle-slider {
          left: 25px;
        }

        .modal-btn.large {
          width: 100%;
          padding: 18px 32px;
          font-size: 17px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        /* Responsive */
        @media (max-width: 1240px) {
          .topnav,
          .listing-container,
          .footer-content {
            padding-left: 24px;
            padding-right: 24px;
          }
        }

        @media (max-width: 1024px) {
          .listing-container {
            grid-template-columns: 1fr;
            gap: 40px;
            padding-top: 120px;
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

          .menu-link:not(.login):not(.signup) {
            display: none;
          }

          .details-grid {
            grid-template-columns: 1fr;
          }

          .school-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .price-history-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .price-history-details {
            width: 100%;
            justify-content: space-between;
          }

          .listing-price {
            font-size: 36px;
          }

          .listing-stats {
            flex-wrap: wrap;
            gap: 20px;
          }

          .thumbnail-grid {
            grid-template-columns: repeat(4, 1fr);
          }

          .amenities-grid {
            grid-template-columns: 1fr;
          }

          .footer-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }

          .footer-bottom {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }
        }
      `}</style>
    </>
  );
}

