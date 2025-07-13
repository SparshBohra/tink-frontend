import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { publicApiRequest } from '../../lib/api';
import PublicApplicationForm from '../../components/PublicApplicationForm';

interface PublicListingPageProps {
  listing: any | null;
  error?: string;
}

export default function PublicListingPage({ listing, error }: PublicListingPageProps) {
  const router = useRouter();
  const [showApplicationForm, setShowApplicationForm] = useState(false);

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
      // Transform the form data to match API expectations
      const apiData = {
        // Personal Information
        tenant: {
          first_name: applicationData.full_name.split(' ')[0] || applicationData.full_name,
          last_name: applicationData.full_name.split(' ').slice(1).join(' ') || '',
          email: applicationData.email,
          phone: applicationData.phone,
        },
        // Required API fields
        desired_move_in_date: applicationData.desired_move_in_date,
        desired_lease_duration: parseInt(applicationData.desired_lease_duration),
        rent_budget: parseInt(applicationData.rent_budget),
        // Additional information
        message: applicationData.additional_comments || '',
        employment_info: {
          employer: applicationData.employer_name || '',
          position: applicationData.job_title || '',
          annual_income: parseInt(applicationData.annual_income) || 0,
        },
        listing_id: listing.id,
      };

      const response = await publicApiRequest(`/properties/public/listings/${listing.public_slug}/apply/`, {
        method: 'POST',
        body: JSON.stringify(apiData),
      });

      // Show success message and redirect
      alert('Application submitted successfully! We will contact you soon.');
      setShowApplicationForm(false);
    } catch (error: any) {
      console.error('Error submitting application:', error);
      throw new Error('Failed to submit application. Please try again.');
    }
  };

  const formatPrice = (price: number) => {
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

  const propertyAddress = listing.property_details?.address 
    ? `${listing.property_details.address.line1}${listing.property_details.address.line2 ? ', ' + listing.property_details.address.line2 : ''}, ${listing.property_details.address.city}, ${listing.property_details.address.state} ${listing.property_details.address.postal_code}`
    : 'Address not available';

  return (
    <div className="public-listing-page">
      <Head>
        <title>{listing.title} - Property Listing</title>
        <meta name="description" content={listing.description} />
        <meta property="og:title" content={listing.title} />
        <meta property="og:description" content={listing.description} />
      </Head>

      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="listing-title">{listing.title}</h1>
            <p className="property-address">{propertyAddress}</p>
            <div className="listing-badges">
              <span className="badge">{listing.property_details?.property_type || 'Property'}</span>
              <span className="badge">{listing.listing_type === 'whole_property' ? 'Whole Property' : 'Individual Rooms'}</span>
            </div>
          </div>
          
          <div className="hero-actions">
            <button 
              onClick={handleStartApplication}
              className="btn btn-primary btn-lg"
            >
              Apply Now
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-grid">
          {/* Left Column - Property Details */}
          <div className="property-details">
            <div className="card">
              <div className="card-header">
                <h2>Property Details</h2>
              </div>
              <div className="card-body">
                <div className="details-list">
                  <div className="detail-item">
                    <div className="detail-label">Property Name</div>
                    <div className="detail-value">{listing.property_details?.name || 'N/A'}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Property Type</div>
                    <div className="detail-value">{listing.property_details?.property_type || 'N/A'}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Listing Type</div>
                    <div className="detail-value">{listing.listing_type === 'whole_property' ? 'Whole Property' : 'Individual Rooms'}</div>
                  </div>
                  {listing.available_from && (
                    <div className="detail-item">
                      <div className="detail-label">Available From</div>
                      <div className="detail-value">{formatDate(listing.available_from)}</div>
                    </div>
                  )}
                  {listing.available_room_details?.monthly_rent && (
                    <div className="detail-item">
                      <div className="detail-label">Monthly Rent</div>
                      <div className="detail-value">{formatPrice(listing.available_room_details.monthly_rent)}</div>
                    </div>
                  )}
                  {listing.available_room_details?.total_rooms && (
                    <div className="detail-item">
                      <div className="detail-label">Total Rooms</div>
                      <div className="detail-value">{listing.available_room_details.total_rooms}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Gallery Section */}
            {listing.media && listing.media.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h2>Photos</h2>
                </div>
                <div className="card-body">
                  <div className="gallery-grid">
                    {listing.media.map((media: any, index: number) => (
                      <div key={media.id || index} className="gallery-item">
                        <img
                          src={media.file_url || media.url}
                          alt={media.caption || `Property photo ${index + 1}`}
                          className="gallery-image"
                          onClick={() => {
                            // Optional: Add lightbox functionality
                            window.open(media.file_url || media.url, '_blank');
                          }}
                        />
                        {media.caption && (
                          <div className="gallery-caption">{media.caption}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="card">
              <div className="card-header">
                <h2>Description</h2>
              </div>
              <div className="card-body">
                <div className="description-content">
                  <p>{listing.description}</p>
                </div>
              </div>
            </div>

            {listing.application_form_config?.global_settings && (
              <div className="card">
                <div className="card-header">
                  <h2>Application Information</h2>
                </div>
                <div className="card-body">
                  <div className="details-list">
                    {listing.application_form_config.global_settings.application_fee && (
                      <div className="detail-item">
                        <div className="detail-label">Application Fee</div>
                        <div className="detail-value">{formatPrice(listing.application_form_config.global_settings.application_fee)}</div>
                      </div>
                    )}
                    {listing.application_form_config.global_settings.minimum_income_ratio && (
                      <div className="detail-item">
                        <div className="detail-label">Minimum Income Requirement</div>
                        <div className="detail-value">{listing.application_form_config.global_settings.minimum_income_ratio}x monthly rent</div>
                      </div>
                    )}
                    {listing.application_form_config.global_settings.required_documents && (
                      <div className="detail-item">
                        <div className="detail-label">Required Documents</div>
                        <div className="detail-value">
                          {listing.application_form_config.global_settings.required_documents.join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Contact Info & Apply */}
          <div className="contact-summary">
            <div className="card">
              <div className="card-header">
                <h3>Contact Information</h3>
              </div>
              <div className="card-body">
                <div className="contact-info">
                  <div className="contact-details">
                    <div className="contact-item">
                      <strong>Landlord:</strong> {listing.contact_info?.landlord_name || 'N/A'}
                    </div>
                    <div className="contact-item">
                      <strong>Email:</strong> {listing.contact_info?.contact_email || 'N/A'}
                    </div>
                    <div className="contact-item">
                      <strong>Property:</strong> {listing.contact_info?.property_name || listing.property_details?.name || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card apply-card">
              <div className="card-header">
                <h3>Ready to Apply?</h3>
              </div>
              <div className="card-body">
                <div className="apply-info">
                  <p className="text-muted">Submit your application online in just a few minutes.</p>
                  {listing.application_form_config?.global_settings?.application_fee && (
                    <div className="fee-info">
                      <span className="fee-label">Application Fee:</span>
                      <span className="fee-amount">{formatPrice(listing.application_form_config.global_settings.application_fee)}</span>
                    </div>
                  )}
                </div>
                <div className="apply-actions">
                  <button 
                    onClick={handleStartApplication}
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%' }}
                  >
                    Apply Now
                  </button>
                  <p className="apply-note text-small text-muted">
                    Secure application process • Get notified instantly
                  </p>
                </div>
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
          background: var(--gray-50);
          font-family: var(--font-sans);
        }

        .error-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--gray-50);
        }

        .error-content {
          text-align: center;
          padding: var(--spacing-2xl);
          background: white;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          max-width: 400px;
        }

        .error-content h1 {
          font-size: var(--text-h2);
          color: var(--gray-900);
          margin-bottom: var(--spacing-md);
        }

        .error-content p {
          color: var(--gray-600);
          margin-bottom: var(--spacing-lg);
        }

        .hero-section {
          background: linear-gradient(135deg, var(--primary-blue) 0%, var(--info-purple) 100%);
          color: white;
          padding: var(--spacing-2xl) 0;
        }

        .hero-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 var(--spacing-md);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--spacing-2xl);
        }

        .hero-text {
          flex: 1;
        }

        .listing-title {
          font-size: 2.5rem;
          font-weight: var(--font-weight-bold);
          margin: 0 0 var(--spacing-md) 0;
          line-height: var(--line-height-tight);
        }

        .property-address {
          font-size: 1.125rem;
          margin: 0 0 var(--spacing-lg) 0;
          opacity: 0.9;
        }

        .listing-badges {
          display: flex;
          gap: var(--spacing-sm);
          flex-wrap: wrap;
        }

        .badge {
          background: rgba(255, 255, 255, 0.2);
          padding: var(--spacing-xs) var(--spacing-md);
          border-radius: 20px;
          font-size: var(--text-small);
          font-weight: var(--font-weight-medium);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .hero-actions {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .main-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--spacing-2xl) var(--spacing-md);
        }

        .content-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: var(--spacing-2xl);
        }

        .property-details {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .details-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-sm) 0;
          border-bottom: 1px solid var(--gray-200);
        }

        .detail-item:last-child {
          border-bottom: none;
        }

        .detail-label {
          font-weight: var(--font-weight-medium);
          color: var(--gray-600);
        }

        .detail-value {
          font-weight: var(--font-weight-semibold);
          color: var(--gray-900);
        }

        .description-content {
          line-height: var(--line-height-loose);
          color: var(--gray-700);
        }

        .contact-summary {
          position: sticky;
          top: var(--spacing-md);
          height: fit-content;
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .contact-info {
          margin-bottom: var(--spacing-lg);
        }

        .contact-details {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .contact-item {
          color: var(--gray-600);
          font-size: var(--text-small);
        }

        .contact-item strong {
          color: var(--gray-900);
        }

        .apply-card {
          border: 2px solid var(--primary-blue);
          box-shadow: var(--shadow-lg);
        }

        .apply-info {
          margin-bottom: var(--spacing-lg);
        }

        .fee-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-sm);
          background: var(--gray-50);
          border-radius: var(--radius-md);
          margin-top: var(--spacing-sm);
        }

        .fee-label {
          font-size: var(--text-small);
          color: var(--gray-600);
        }

        .fee-amount {
          font-weight: var(--font-weight-semibold);
          color: var(--primary-blue);
        }

        .apply-actions {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .apply-note {
          text-align: center;
          margin: 0;
        }

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--spacing-md);
          margin-top: var(--spacing-sm);
        }

        .gallery-item {
          position: relative;
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--gray-100);
          aspect-ratio: 4/3;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .gallery-item:hover {
          transform: scale(1.02);
        }

        .gallery-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: opacity 0.2s ease;
        }

        .gallery-image:hover {
          opacity: 0.9;
        }

        .gallery-caption {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
          color: white;
          padding: var(--spacing-md) var(--spacing-sm) var(--spacing-sm);
          font-size: var(--text-small);
          font-weight: var(--font-weight-medium);
        }

        @media (max-width: 1024px) {
          .content-grid {
            grid-template-columns: 1fr;
          }

          .contact-summary {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .gallery-grid {
            grid-template-columns: 1fr;
          }
          
          .gallery-item {
            aspect-ratio: 16/9;
          }
          .hero-content {
            flex-direction: column;
            text-align: center;
          }

          .listing-title {
            font-size: 2rem;
          }

          .hero-actions {
            flex-direction: row;
            justify-content: center;
          }

          .details-list {
            gap: var(--spacing-sm);
          }

          .detail-item {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-xs);
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