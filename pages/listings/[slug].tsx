import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { publicApiRequest } from '../../lib/api';
import { PropertyListing } from '../../lib/types';
import PublicApplicationForm from '../../components/PublicApplicationForm';

interface PublicListingPageProps {
  listing: PropertyListing | null;
  error?: string;
}

export default function PublicListingPage({ listing, error }: PublicListingPageProps) {
  const router = useRouter();
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Treat undefined as true so listings are open unless explicitly closed
  const canApply = listing?.is_active !== false;

  if (error || !listing) {
    return (
      <div className="error-page">
        <Head>
          <title>Property Listing Not Found</title>
        </Head>
        <div className="error-content">
          <h1>Property Listing Not Found</h1>
          <p>{error || 'The property listing you requested could not be found.'}</p>
          <button onClick={() => router.push('/')} className="btn btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleStartApplication = () => {
    setShowApplicationForm(true);
  };

  const handleApplicationSubmit = async (applicationData: any) => {
    try {
      const { slug } = router.query;
      
      if (!listing) {
        throw new Error('Listing not found');
      }
      
      // Transform the data to match backend expectations
      const transformedData = {
        tenant: {
          first_name: applicationData.full_name?.split(' ')[0] || '',
          last_name: applicationData.full_name?.split(' ').slice(1).join(' ') || '',
          email: applicationData.email,
          phone: applicationData.phone,
          date_of_birth: applicationData.date_of_birth
        },
        desired_move_in_date: applicationData.desired_move_in_date,
        desired_lease_duration: parseInt(applicationData.desired_lease_duration) || 12,
        rent_budget: parseInt(applicationData.rent_budget) || 0,
        message: applicationData.additional_comments || `Application for ${listing.title}`,
        // Include additional form data as metadata
        form_responses: applicationData
      };
      
      const response = await publicApiRequest(`/properties/public/listings/${slug}/apply/`, {
        method: 'POST',
        body: JSON.stringify(transformedData),
      });

      // Show success message and redirect
      alert('Application submitted successfully! We will contact you soon.');
      setShowApplicationForm(false);
    } catch (error: any) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    }
  };

  const nextImage = () => {
    if (listing.media && listing.media.length > 0) {
      const length = listing.media.length;
      setCurrentImageIndex((prev) => (prev + 1) % length);
    }
  };

  const prevImage = () => {
    if (listing.media && listing.media.length > 0) {
      const length = listing.media.length;
      setCurrentImageIndex((prev) => (prev - 1 + length) % length);
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'Contact for pricing';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPetPolicy = (policy: string) => {
    const policies: Record<string, string> = {
      'not_allowed': 'Not Allowed',
      'cats_only': 'Cats Only',
      'dogs_only': 'Dogs Only',
      'cats_and_dogs': 'Cats and Dogs',
      'all_pets': 'All Pets Welcome',
    };
    return policies[policy] || policy;
  };

  return (
    <div className="public-listing-page">
      <Head>
        <title>{listing.title} - Property Listing</title>
        <meta name="description" content={listing.description} />
        <meta property="og:title" content={listing.title} />
        <meta property="og:description" content={listing.description} />
        {listing.media && listing.media.length > 0 && (
          <meta property="og:image" content={listing.media[0].file_url} />
        )}
      </Head>

      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="listing-title">{listing.title}</h1>
            <p className="property-address">{listing.property_address}</p>
            <div className="listing-badges">
              {listing.furnished && <span className="badge">Furnished</span>}
              {listing.utilities_included && listing.utilities_included.length > 0 && (
                <span className="badge">Utilities Included</span>
              )}
              {listing.pet_policy !== 'not_allowed' && (
                <span className="badge">Pet Friendly</span>
              )}
            </div>
          </div>
          
          <div className="hero-actions">
            <button 
              onClick={handleStartApplication}
              className="btn btn-primary btn-large"
              disabled={!canApply}
            >
              {canApply ? 'Apply Now' : 'Applications Closed'}
            </button>
            {listing.virtual_tour_url && (
              <a 
                href={listing.virtual_tour_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-secondary btn-large"
              >
                Virtual Tour
              </a>
            )}
            {listing.application_fee && (
              <span className="application-fee">
                Application Fee: {formatPrice(listing.application_fee)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      {listing.media && listing.media.length > 0 && (
        <div className="image-gallery">
          <div className="main-image">
            <img 
              src={listing.media[currentImageIndex].file_url} 
              alt={listing.title}
              className="gallery-image"
            />
            {listing.media.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="image-nav prev-btn"
                  aria-label="Previous image"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15,18 9,12 15,6"/>
                  </svg>
                </button>
                <button 
                  onClick={nextImage}
                  className="image-nav next-btn"
                  aria-label="Next image"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9,18 15,12 9,6"/>
                  </svg>
                </button>
              </>
            )}
          </div>
          
          {listing.media.length > 1 && (
            <div className="image-thumbnails">
              {listing.media.map((media, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                >
                  <img src={media.file_url} alt={`${listing.title} - Image ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="main-content">
        <div className="content-grid">
          {/* Left Column - Property Details */}
          <div className="property-details">
            <section className="details-section">
              <h2>Property Details</h2>
              <div className="details-grid">
                <div className="detail-item">
                  <div className="detail-label">Property Type</div>
                  <div className="detail-value">{listing.property_type}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Max Occupancy</div>
                  <div className="detail-value">{listing.max_occupancy} people</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Available From</div>
                  <div className="detail-value">{listing.available_from ? formatDate(listing.available_from) : 'TBD'}</div>
                </div>
                {listing.application_deadline && (
                  <div className="detail-item">
                    <div className="detail-label">Application Deadline</div>
                    <div className="detail-value">{listing.application_deadline ? formatDate(listing.application_deadline) : 'TBD'}</div>
                  </div>
                )}
                <div className="detail-item">
                  <div className="detail-label">Lease Term</div>
                  <div className="detail-value">
                    {listing.min_lease_term} - {listing.max_lease_term || '∞'} months
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Pet Policy</div>
                  <div className="detail-value">{listing.pet_policy ? formatPetPolicy(listing.pet_policy) : 'N/A'}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Smoking</div>
                  <div className="detail-value">{listing.smoking_allowed ? 'Allowed' : 'Not Allowed'}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Furnished</div>
                  <div className="detail-value">{listing.furnished ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </section>

            <section className="details-section">
              <h2>Description</h2>
              <div className="description-content">
                <p>{listing.description}</p>
              </div>
            </section>

            {listing.utilities_included && listing.utilities_included.length > 0 && (
              <section className="details-section">
                <h2>Utilities Included</h2>
                <div className="utilities-list">
                  {listing.utilities_included.map((utility, index) => (
                    <span key={index} className="utility-item">
                      {utility.replace('_', ' ').toUpperCase()}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {listing.amenities && listing.amenities.length > 0 && (
              <section className="details-section">
                <h2>Amenities</h2>
                <div className="amenities-list">
                  {listing.amenities.map((amenity, index) => (
                    <span key={index} className="amenity-item">
                      {amenity.replace('_', ' ').toUpperCase()}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column - Application Summary */}
          <div className="application-summary">
            <div className="summary-card">
              <h3>Application Information</h3>
              
              <div className="pricing-info">
                {listing.application_fee && (
                  <div className="price-item">
                    <span className="price-label">Application Fee</span>
                    <span className="price-value">{formatPrice(listing.application_fee)}</span>
                  </div>
                )}
                {listing.security_deposit && (
                  <div className="price-item">
                    <span className="price-label">Security Deposit</span>
                    <span className="price-value">{formatPrice(listing.security_deposit)}</span>
                  </div>
                )}
              </div>

              <div className="contact-info">
                <h4>Contact Information</h4>
                <div className="contact-details">
                  <div className="contact-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <span>{listing.contact_info?.contact_email}</span>
                  </div>
                  {listing.contact_info?.contact_phone && (
                    <div className="contact-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      <span>{listing.contact_info?.contact_phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="summary-actions">
                <button 
                  onClick={handleStartApplication}
                  className="btn btn-primary btn-block"
                  disabled={!canApply}
                >
                  {canApply ? 'Start Application' : 'Applications Closed'}
                </button>
                {listing.virtual_tour_url && (
                  <a 
                    href={listing.virtual_tour_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-block"
                  >
                    Take Virtual Tour
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Application Form Modal */}
      {showApplicationForm && (
        <PublicApplicationForm
          listing={listing}
          onClose={() => setShowApplicationForm(false)}
          onSubmit={handleApplicationSubmit}
        />
      )}

      <style jsx>{`
        .public-listing-page {
          min-height: 100vh;
          background: #ffffff;
        }

        .error-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
        }

        .error-content {
          text-align: center;
          padding: 40px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .error-content h1 {
          font-size: 24px;
          color: #1f2937;
          margin-bottom: 16px;
        }

        .error-content p {
          color: #6b7280;
          margin-bottom: 24px;
        }

        .hero-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 80px 0;
        }

        .hero-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 40px;
        }

        .hero-text {
          flex: 1;
        }

        .listing-title {
          font-size: 42px;
          font-weight: 700;
          margin: 0 0 16px 0;
          line-height: 1.1;
        }

        .property-address {
          font-size: 18px;
          margin: 0 0 24px 0;
          opacity: 0.9;
        }

        .listing-badges {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .badge {
          background: rgba(255, 255, 255, 0.2);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .hero-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .application-fee {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
          margin-top: 4px;
        }

        .image-gallery {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .main-image {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 20px;
        }

        .gallery-image {
          width: 100%;
          height: 500px;
          object-fit: cover;
          display: block;
        }

        .image-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border: none;
          border-radius: 50%;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .image-nav:hover {
          background: rgba(0, 0, 0, 0.9);
        }

        .prev-btn {
          left: 20px;
        }

        .next-btn {
          right: 20px;
        }

        .image-thumbnails {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding: 10px 0;
        }

        .thumbnail {
          flex-shrink: 0;
          width: 100px;
          height: 70px;
          border-radius: 6px;
          overflow: hidden;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
          background: none;
          padding: 0;
        }

        .thumbnail:hover {
          border-color: #3b82f6;
        }

        .thumbnail.active {
          border-color: #3b82f6;
        }

        .thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .main-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 40px;
        }

        .property-details {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .details-section {
          background: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .details-section h2 {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 20px 0;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .detail-item:last-child {
          border-bottom: none;
        }

        .detail-label {
          font-weight: 500;
          color: #6b7280;
        }

        .detail-value {
          font-weight: 600;
          color: #1f2937;
        }

        .description-content {
          line-height: 1.6;
          color: #374151;
        }

        .utilities-list, .amenities-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .utility-item, .amenity-item {
          background: #f3f4f6;
          color: #374151;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 500;
        }

        .application-summary {
          position: sticky;
          top: 20px;
          height: fit-content;
        }

        .summary-card {
          background: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .summary-card h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 20px 0;
        }

        .pricing-info {
          margin-bottom: 24px;
        }

        .price-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .price-item:last-child {
          border-bottom: none;
        }

        .price-label {
          color: #6b7280;
          font-weight: 500;
        }

        .price-value {
          font-weight: 600;
          color: #1f2937;
          font-size: 18px;
        }

        .contact-info {
          margin-bottom: 24px;
        }

        .contact-info h4 {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 16px 0;
        }

        .contact-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #6b7280;
        }

        .contact-item svg {
          flex-shrink: 0;
        }

        .summary-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          border: none;
          text-align: center;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .btn-primary:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .btn-secondary:hover {
          background: #e5e7eb;
        }

        .btn-large {
          padding: 16px 32px;
          font-size: 18px;
        }

        .btn-block {
          width: 100%;
        }

        @media (max-width: 1024px) {
          .content-grid {
            grid-template-columns: 1fr;
          }

          .application-summary {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .hero-content {
            flex-direction: column;
            text-align: center;
          }

          .listing-title {
            font-size: 32px;
          }

          .hero-actions {
            flex-direction: row;
            justify-content: center;
          }

          .details-grid {
            grid-template-columns: 1fr;
          }

          .gallery-image {
            height: 300px;
          }

          .image-nav {
            width: 40px;
            height: 40px;
          }

          .prev-btn {
            left: 10px;
          }

          .next-btn {
            right: 10px;
          }
        }
      `}</style>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;

  if (!slug || typeof slug !== 'string') {
    return {
      notFound: true,
    };
  }

  try {
    // Corrected endpoint path (API_BASE_URL already includes '/api')
    const listing = await publicApiRequest(`/properties/public/listings/${slug}/`);
    
    return {
      props: {
        listing,
      },
    };
  } catch (error: any) {
    console.error('Error fetching listing:', error);
    
    return {
      props: {
        listing: null,
        error: error.message || 'Failed to load listing',
      },
    };
  }
}; 