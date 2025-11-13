import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { 
  MapPin, 
  Home, 
  Users, 
  Calendar, 
  DollarSign, 
  Phone, 
  Mail, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Bed,
  Shield,
  Wind,
  CheckCircle,
  X,
  Clock,
  Tag,
  Zap,
  Droplets,
  Wifi
} from 'lucide-react';
import { publicApiRequest } from '../../lib/api';
import { PropertyListing } from '../../lib/types';
import PublicApplicationForm from '../../components/PublicApplicationForm';
import { getMediaUrl, formatUTCDate } from '../../lib/utils';

interface PublicListingPageProps {
  listing: PropertyListing | null;
  error?: string;
}

export default function PublicListingPage({ listing, error }: PublicListingPageProps) {
  const router = useRouter();
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Debug modal state
  React.useEffect(() => {
    console.log('Modal state changed:', showApplicationForm ? 'OPEN' : 'CLOSED');
    if (listing && listing.media) {
      console.log('🖼️ Listing Media:', JSON.stringify(listing.media, null, 2));
      listing.media.forEach((item, index) => {
        console.log(`📸 Image ${index + 1} Original URL:`, item.file_url);
        console.log(`🔗 Image ${index + 1} Processed URL:`, getMediaUrl(item.file_url || ''));
      });
    }
  }, [showApplicationForm, listing]);

  // Treat undefined as true so listings are open unless explicitly closed
  const canApply = listing?.is_active !== false;

  if (error || !listing) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <Head>
          <title>Property Listing Not Found</title>
        </Head>
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          maxWidth: '24rem',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            backgroundColor: '#fef2f2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto'
          }}>
            <X style={{ width: '1.25rem', height: '1.25rem', color: '#ef4444' }} />
          </div>
          <h1 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            color: '#111827', 
            marginBottom: '0.5rem',
            margin: '0 0 0.5rem 0'
          }}>
            Property Not Found
          </h1>
          <p style={{ 
            color: '#6b7280', 
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            margin: '0 0 1.5rem 0'
          }}>
            {error && error.includes('500') 
              ? 'Server error occurred. Please try again later.' 
              : error || 'The property listing you requested could not be found.'}
          </p>
          <button 
            onClick={() => router.push('/')}
            style={{
              backgroundColor: '#374151',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#374151'}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleStartApplication = () => {
    console.log('Apply Now button clicked, opening modal for:', listing?.title);
    setShowApplicationForm(true);
  };

  const handleApplicationSubmit = async (applicationData: any) => {
    try {
      console.log('Starting application submission...', applicationData);
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
      
      console.log('Transformed data for API:', transformedData);
      
      const response = await publicApiRequest(`/properties/public/listings/${slug}/apply/`, {
        method: 'POST',
        body: JSON.stringify(transformedData),
      });

      console.log('Application submitted successfully:', response);
      
      // Show success message and redirect
      alert('Application submitted successfully! We will contact you soon.');
      setShowApplicationForm(false);
    } catch (error: any) {
      console.error('Error submitting application:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit application. Please try again.';
      alert(`Failed to submit application: ${errorMessage}`);
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
    <>
      <Head>
        <title>{listing.title} - Property Listing</title>
        <meta name="description" content={listing.description} />
        <meta property="og:title" content={listing.title} />
        <meta property="og:description" content={listing.description} />
        {listing.media && listing.media.length > 0 && (
          <meta property="og:image" content={listing.media[0].file_url} />
        )}
      </Head>

      <style jsx global>{`
        /* Custom scrollbar for thumbnail gallery */
        .thumbnail-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .thumbnail-scroll::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .thumbnail-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .thumbnail-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .thumbnail-scroll {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f1f1;
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff'
      }}>
        {/* Header Section */}
        <div style={{
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e5e7eb',
          padding: '2rem 0'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 1rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '2rem',
              marginBottom: '1rem'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem'
                }}>
                  <MapPin style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />
                  <h1 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#111827',
                    margin: 0,
                    lineHeight: 1.2
                  }}>
                    {listing.title}
                  </h1>
                </div>
                <div style={{ 
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  marginLeft: '1.75rem'
                }}>
                  {listing.property_address}
            </div>
          </div>
          
            <button 
              onClick={handleStartApplication}
              disabled={!canApply}
                style={{
                  backgroundColor: canApply ? '#2563eb' : '#9ca3af',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: canApply ? 'pointer' : 'not-allowed',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  height: 'fit-content'
                }}
                onMouseOver={(e) => canApply && (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                onMouseOut={(e) => canApply && (e.currentTarget.style.backgroundColor = '#2563eb')}
              >
                <Home style={{ width: '1rem', height: '1rem' }} />
              {canApply ? 'Apply Now' : 'Applications Closed'}
            </button>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                flexWrap: 'wrap'
              }}>
                {listing.furnished && (
                  <span style={{
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    border: '1px solid #d1d5db'
                  }}>
                    Furnished
                  </span>
                )}
                {listing.property_details?.utilities_included && listing.property_details.utilities_included.length > 0 && (
                  <span style={{
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    border: '1px solid #d1d5db'
                  }}>
                    Utilities Included
                  </span>
                )}
                {listing.property_details?.pet_policy && listing.property_details.pet_policy !== 'not_allowed' && (
                  <span style={{
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    border: '1px solid #d1d5db'
                  }}>
                    Pet Friendly
                  </span>
                )}
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                alignItems: 'flex-end'
              }}>
            {listing.virtual_tour_url && (
              <a 
                href={listing.virtual_tour_url} 
                target="_blank" 
                rel="noopener noreferrer"
                    style={{
                      backgroundColor: 'white',
                      color: '#374151',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      border: '1px solid #d1d5db',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    <ExternalLink style={{ width: '0.875rem', height: '0.875rem' }} />
                Virtual Tour
              </a>
            )}
            {listing.application_fee && (
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <Tag style={{ width: '0.75rem', height: '0.75rem' }} />
                Application Fee: {formatPrice(listing.application_fee)}
                  </div>
            )}
              </div>
          </div>
        </div>
      </div>

      {/* Image Gallery - Matching Property Detail Page Style */}
      {listing.media && listing.media.length > 0 && (
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem 1rem'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '8px' }}>
            {/* Large primary image - not cropped */}
            <div style={{ 
              position: 'relative', 
              width: '100%', 
              height: '700px', 
              borderRadius: '12px', 
              overflow: 'hidden', 
              border: '1px solid #e5e7eb', 
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img 
                src={getMediaUrl(listing.media[currentImageIndex].file_url || '')} 
                alt={listing.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block'
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.objectFit = 'cover';
                }}
              />
              {listing.media.length > 1 && (
                <>
                  <button 
                    onClick={prevImage}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '1rem',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '3rem',
                      height: '3rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      zIndex: 10
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                    }}
                  >
                    <ChevronLeft style={{ width: '1.5rem', height: '1.5rem' }} />
                  </button>
                  <button 
                    onClick={nextImage}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      right: '1rem',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '3rem',
                      height: '3rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      zIndex: 10
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                    }}
                  >
                    <ChevronRight style={{ width: '1.5rem', height: '1.5rem' }} />
                  </button>
                  <div style={{
                    position: 'absolute',
                    bottom: '1rem',
                    right: '1rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    zIndex: 10
                  }}>
                    {currentImageIndex + 1} / {listing.media.length}
                  </div>
                </>
              )}
            </div>
            
            {/* Thumbnails - scrollable column */}
            {listing.media.length > 1 && (
              <div className="thumbnail-scroll" style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxHeight: '700px',
                overflowY: 'auto',
                paddingRight: listing.media.length > 5 ? '4px' : '0'
              }}>
                {listing.media.map((media, index) => {
                  const isActive = currentImageIndex === index;
                  return (
                    <div 
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      style={{ 
                        position: 'relative', 
                        width: '100%', 
                        paddingBottom: '66%', 
                        borderRadius: '8px', 
                        overflow: 'hidden', 
                        border: isActive ? '2px solid #2563eb' : '1px solid #e5e7eb', 
                        background: '#f8fafc',
                        flexShrink: 0,
                        cursor: 'pointer',
                        boxShadow: isActive ? '0 0 0 3px rgba(37, 99, 235, 0.15)' : 'none',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.borderColor = '#2563eb';
                          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(37, 99, 235, 0.1)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                      title="Click to view"
                    >
                      <img 
                        src={getMediaUrl(media.file_url || '')} 
                        alt={`${listing.title} - Image ${index + 1}`}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Image count indicator */}
          {listing.media.length > 5 && (
            <div style={{ 
              marginTop: '0.75rem', 
              fontSize: '0.875rem', 
              color: '#6b7280',
              textAlign: 'right',
              fontWeight: '500'
            }}>
              {listing.media.length} photos total
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem 3rem 1rem'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '2rem',
            marginTop: '2rem'
          }}>
          {/* Left Column - Property Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Property Details */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.5rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <Home style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#111827',
                    margin: 0
                  }}>
                    Property Details
                  </h2>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem'
                }}>
                  {[
                    { label: 'Property Type', value: listing.property_details?.property_type, icon: <Home style={{ width: '1rem', height: '1rem' }} /> },
                    { label: 'Bedrooms', value: listing.property_details?.bedrooms, icon: <Bed style={{ width: '1rem', height: '1rem' }} /> },
                    { label: 'Bathrooms', value: listing.property_details?.bathrooms, icon: <Droplets style={{ width: '1rem', height: '1rem' }} /> },
                    { label: 'Square Footage', value: listing.property_details?.square_footage ? `${listing.property_details.square_footage} sq ft` : null, icon: <Home style={{ width: '1rem', height: '1rem' }} /> },
                    { label: 'Max Occupancy', value: listing.property_details?.max_occupancy ? `${listing.property_details.max_occupancy} ${listing.property_details.max_occupancy === 1 ? 'person' : 'people'}` : null, icon: <Users style={{ width: '1rem', height: '1rem' }} /> },
                    { label: 'Available From', value: listing.available_from ? formatUTCDate(listing.available_from) : null, icon: <Calendar style={{ width: '1rem', height: '1rem' }} /> },
                    { label: 'Pet Policy', value: listing.property_details?.pet_policy ? formatPetPolicy(listing.property_details.pet_policy) : null, icon: <Shield style={{ width: '1rem', height: '1rem' }} /> },
                    { label: 'Smoking', value: listing.property_details?.smoking_allowed !== undefined ? (listing.property_details.smoking_allowed ? 'Allowed' : 'Not Allowed') : null, icon: <Wind style={{ width: '1rem', height: '1rem' }} /> }
                  ].filter(item => item.value !== null && item.value !== undefined && item.value !== 'N/A' && item.value !== '').map((item, index) => (
                    <div key={index} style={{
                      padding: '0.75rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '6px',
                      border: '1px solid #f3f4f6'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        marginBottom: '0.25rem' 
                      }}>
                        <div style={{ color: '#9ca3af' }}>{item.icon}</div>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: '500', 
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.025em'
                        }}>
                          {item.label}
                        </span>
                </div>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '600', 
                        color: '#111827',
                        marginLeft: '1.5rem'
                      }}>
                        {item.value}
                </div>
                  </div>
                  ))}
                  </div>
                  </div>

              {/* Description */}
              {listing.description && listing.description.trim() && (
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#111827',
                    margin: '0 0 1rem 0',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    Description
                  </h2>
                  <p style={{
                    lineHeight: 1.8,
                    color: '#374151',
                    fontSize: '0.9375rem',
                    margin: 0,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {listing.description}
                  </p>
                </div>
              )}

              {/* Utilities & Amenities */}
              {((listing.property_details?.utilities_included && listing.property_details.utilities_included.length > 0) || 
                (listing.property_details?.amenities && listing.property_details.amenities.length > 0)) && (
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
            {listing.property_details?.utilities_included && listing.property_details.utilities_included.length > 0 && (
                    <div style={{ marginBottom: listing.property_details?.amenities && listing.property_details.amenities.length > 0 ? '1.5rem' : 0 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.75rem'
                      }}>
                        <Zap style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />
                        <h3 style={{
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          color: '#111827',
                          margin: 0
                        }}>
                          Utilities Included
                        </h3>
                      </div>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}>
                  {listing.property_details.utilities_included.map((utility, index) => (
                          <span key={index} style={{
                            backgroundColor: '#fef3c7',
                            color: '#92400e',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            border: '1px solid #fcd34d'
                          }}>
                            {utility.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  ))}
                </div>
                    </div>
            )}

            {listing.property_details?.amenities && listing.property_details.amenities.length > 0 && (
                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.75rem'
                      }}>
                        <CheckCircle style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />
                        <h3 style={{
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          color: '#111827',
                          margin: 0
                        }}>
                          Amenities
                        </h3>
                      </div>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}>
                  {listing.property_details.amenities.map((amenity, index) => (
                          <span key={index} style={{
                            backgroundColor: '#dcfce7',
                            color: '#166534',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            border: '1px solid #bbf7d0'
                          }}>
                            {amenity.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  ))}
                </div>
                    </div>
                  )}
                </div>
            )}

              {/* Room Details */}
            {listing.listing_type === 'rooms' && listing.available_room_details && listing.available_room_details.length > 0 && (
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1.5rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <Bed style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />
                    <h2 style={{
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      color: '#111827',
                      margin: 0
                    }}>
                      Available Rooms
                    </h2>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '1rem'
                  }}>
                  {listing.available_room_details.map((room, index) => (
                      <div key={room.id || index} style={{
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '1rem'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.75rem',
                          paddingBottom: '0.75rem',
                          borderBottom: '1px solid #e5e7eb'
                        }}>
                          <h3 style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: '#111827',
                            margin: 0
                          }}>
                            {room.name}
                          </h3>
                          <span style={{
                            backgroundColor: '#16a34a',
                            color: 'white',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            fontWeight: '600'
                          }}>
                            {formatPrice(room.monthly_rent)}/month
                          </span>
                      </div>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '0.5rem',
                          fontSize: '0.75rem'
                        }}>
                          {room.room_type && (
                            <div>
                              <span style={{ color: '#6b7280', fontWeight: '500' }}>Type:</span>
                              <div style={{ color: '#111827', fontWeight: '600' }}>
                                {room.room_type.replace('_', ' ')}
                              </div>
                            </div>
                          )}
                          {room.square_footage && (
                            <div>
                              <span style={{ color: '#6b7280', fontWeight: '500' }}>Size:</span>
                              <div style={{ color: '#111827', fontWeight: '600' }}>
                                {room.square_footage} sq ft
                              </div>
                            </div>
                          )}
                          {room.floor_number && (
                            <div>
                              <span style={{ color: '#6b7280', fontWeight: '500' }}>Floor:</span>
                              <div style={{ color: '#111827', fontWeight: '600' }}>
                                {room.floor_number}
                              </div>
                            </div>
                          )}
                          <div>
                            <span style={{ color: '#6b7280', fontWeight: '500' }}>Available:</span>
                            <div style={{ color: '#111827', fontWeight: '600' }}>
                              {room.available_from ? new Date(room.available_from).toLocaleDateString() : 'Now'}
                            </div>
                          </div>
                        </div>
                        {room.room_features && room.room_features.length > 0 && (
                          <div style={{ marginTop: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>Features:</span>
                            <div style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '0.25rem',
                              marginTop: '0.25rem'
                            }}>
                              {room.room_features.map((feature, featureIndex) => (
                                <span key={featureIndex} style={{
                                  backgroundColor: '#dbeafe',
                                  color: '#1e40af',
                                  padding: '0.125rem 0.5rem',
                                  borderRadius: '4px',
                                  fontSize: '0.625rem',
                                  fontWeight: '500'
                                }}>
                                  {feature.replace('_', ' ')}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
                  </div>
            )}
          </div>

          {/* Right Column - Application Summary */}
            <div style={{ position: 'sticky', top: '2rem', height: 'fit-content' }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.5rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <DollarSign style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#111827',
                    margin: 0
                  }}>
                    Application Info
                  </h3>
                </div>
                
                {(listing.application_fee || listing.security_deposit) && (
                  <div style={{ marginBottom: '1.5rem' }}>
                {listing.application_fee && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 0',
                        borderBottom: '1px solid #f3f4f6'
                      }}>
                        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Application Fee</span>
                        <span style={{ fontWeight: '600', color: '#111827', fontSize: '0.875rem' }}>
                          {formatPrice(listing.application_fee)}
                        </span>
                  </div>
                )}
                {listing.security_deposit && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 0'
                      }}>
                        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Security Deposit</span>
                        <span style={{ fontWeight: '600', color: '#111827', fontSize: '0.875rem' }}>
                          {formatPrice(listing.security_deposit)}
                        </span>
                  </div>
                )}
              </div>
                )}

                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#111827',
                    margin: '0 0 0.75rem 0'
                  }}>
                    Contact Information
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: '#6b7280'
                    }}>
                      <Mail style={{ width: '1rem', height: '1rem' }} />
                      <span style={{ fontSize: '0.75rem' }}>{listing.contact_info?.contact_email}</span>
                  </div>
                  {listing.contact_info?.contact_phone && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#6b7280'
                      }}>
                        <Phone style={{ width: '1rem', height: '1rem' }} />
                        <span style={{ fontSize: '0.75rem' }}>{listing.contact_info?.contact_phone}</span>
                    </div>
                  )}
                </div>
              </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button 
                  onClick={handleStartApplication}
                  disabled={!canApply}
                    style={{
                      width: '100%',
                      backgroundColor: canApply ? '#2563eb' : '#9ca3af',
                      color: 'white',
                      padding: '0.75rem 1rem',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: canApply ? 'pointer' : 'not-allowed',
                      transition: 'background-color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseOver={(e) => canApply && (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                    onMouseOut={(e) => canApply && (e.currentTarget.style.backgroundColor = '#2563eb')}
                  >
                    <Home style={{ width: '1rem', height: '1rem' }} />
                  {canApply ? 'Start Application' : 'Applications Closed'}
                </button>
                {listing.virtual_tour_url && (
                  <a 
                    href={listing.virtual_tour_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                      style={{
                        width: '100%',
                        backgroundColor: 'white',
                        color: '#374151',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        border: '1px solid #d1d5db',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'background-color 0.2s',
                        boxSizing: 'border-box'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      <ExternalLink style={{ width: '0.875rem', height: '0.875rem' }} />
                    Take Virtual Tour
                  </a>
                )}
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
    </>
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