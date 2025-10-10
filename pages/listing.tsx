import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { MapPin, Bed, Bath, Maximize, DollarSign, Heart, Share2, Calendar, Shield, Zap } from 'lucide-react';

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

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mock listing data - in production, this would come from API/backend
  const listing = {
    address: '350 Rhode Island St, San Francisco, CA 94103',
    price: 3200,
    beds: 4,
    baths: 3,
    sqft: 2400,
    type: 'For Rent',
    description: 'Beautiful modern home in the heart of San Francisco. Features include hardwood floors, updated kitchen with stainless steel appliances, spacious bedrooms, and a private backyard perfect for entertaining. Close to public transportation, restaurants, and shopping.',
    amenities: ['Hardwood Floors', 'Updated Kitchen', 'Private Backyard', 'Near Transit', 'Washer/Dryer', 'Parking'],
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-600566753190-17f0baa2a6c3?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&h=800&fit=crop&q=80',
    ]
  };

  const handlePublishClick = () => {
    setShowIntegrationModal(true);
  };

  const handleAuthRedirect = (mode: 'login' | 'signup') => {
    if (mode === 'login') {
      window.location.href = 'http://app.localhost:3000/login';
    } else {
      window.location.href = 'http://app.localhost:3000/landlord-signup';
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
      <div className="listing-page">
        {/* Top Navigation */}
        <nav className={`topnav ${isScrolled ? 'scrolled' : ''}`}>
          <div className="brand" onClick={() => router.push('/')}>
            <img src="/logo1.png" alt="SquareFt" className="brand-logo" />
          </div>
          <div className="menu">
            <a href="/#how" className="menu-link">How it works</a>
            <a href="/#browse" className="menu-link">Browse homes</a>
            <a href="/#agents" className="menu-link">Agents</a>
            <a href="http://app.localhost:3000/login" className="menu-link login">Login</a>
            <a href="http://app.localhost:3000/landlord-signup" className="menu-link signup">Sign up</a>
          </div>
        </nav>

        {/* Main Content */}
        <div className="listing-container">
          {/* Image Gallery */}
          <div className="image-section">
            <div className="main-image">
              <img src={listing.images[currentImageIndex]} alt="Property" />
              <div className="image-controls">
                <button 
                  className="image-nav prev"
                  onClick={() => setCurrentImageIndex((prev) => prev === 0 ? listing.images.length - 1 : prev - 1)}
                  disabled={currentImageIndex === 0}
                >
                  ‹
                </button>
                <button 
                  className="image-nav next"
                  onClick={() => setCurrentImageIndex((prev) => prev === listing.images.length - 1 ? 0 : prev + 1)}
                  disabled={currentImageIndex === listing.images.length - 1}
                >
                  ›
                </button>
              </div>
              <div className="image-counter">
                {currentImageIndex + 1} / {listing.images.length}
              </div>
            </div>
            <div className="thumbnail-grid">
              {listing.images.map((image, idx) => (
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
              <div className="listing-type-badge">{listing.type}</div>
              <div className="listing-actions">
                <button className="action-btn" onClick={handleHeartOrShareClick}>
                  <Heart size={20} />
                </button>
                <button className="action-btn" onClick={handleHeartOrShareClick}>
                  <Share2 size={20} />
                </button>
              </div>
            </div>

            <div className="listing-price">${listing.price.toLocaleString()}/mo</div>
            <div className="listing-address">
              <MapPin size={20} />
              {listing.address}
            </div>

            <div className="listing-stats">
              <div className="stat">
                <Bed size={22} />
                <span>{listing.beds} Beds</span>
              </div>
              <div className="stat">
                <Bath size={22} />
                <span>{listing.baths} Baths</span>
              </div>
              <div className="stat">
                <Maximize size={22} />
                <span>{listing.sqft.toLocaleString()} sqft</span>
              </div>
            </div>

            <div className="section">
              <h3>Description</h3>
              <p className="description">{listing.description}</p>
            </div>

            <div className="section">
              <h3>Amenities</h3>
              <div className="amenities-grid">
                {listing.amenities.map((amenity, idx) => (
                  <div key={idx} className="amenity-item">
                    <Zap size={16} />
                    {amenity}
                  </div>
                ))}
              </div>
            </div>

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
            
            <div className="modal-icon">
              <Shield size={48} />
            </div>
            
            <h2 className="modal-title">Access SquareFt Dashboard</h2>
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

        .topnav.scrolled .brand::before,
        .topnav.scrolled .menu::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 200%;
          height: 300%;
          background: radial-gradient(ellipse at center, 
            rgba(255, 255, 255, 0.8) 0%, 
            rgba(255, 255, 255, 0.6) 30%,
            transparent 70%
          );
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          z-index: -1;
          pointer-events: none;
          opacity: 0;
          animation: fadeInSmoke 0.3s ease-out forwards;
        }

        @keyframes fadeInSmoke {
          to {
            opacity: 1;
          }
        }

        .brand {
          position: relative;
          display: flex;
          align-items: center;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .brand:hover {
          transform: scale(1.02);
        }

        .brand-logo {
          height: 65px;
          width: auto;
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
        }

        .main-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
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
          animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          text-align: center;
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
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
          animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
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

