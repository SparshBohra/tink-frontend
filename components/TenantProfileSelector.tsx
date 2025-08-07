import React, { useState } from 'react';
import {
  Building,
  MapPin,
  Users,
  ArrowRight,
  CheckCircle,
  Loader2,
  Home
} from 'lucide-react';
import { TenantProfileData } from '../lib/types';

interface TenantProfileSelectorProps {
  tenantProfiles: TenantProfileData[];
  phoneNumber: string;
  onProfileSelect: (tenantUserId: number) => void;
  loading?: boolean;
}

const TenantProfileSelector: React.FC<TenantProfileSelectorProps> = ({
  tenantProfiles,
  phoneNumber,
  onProfileSelect,
  loading = false
}) => {
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);

  const handleProfileSelect = (tenantUserId: number) => {
    setSelectedProfileId(tenantUserId);
    onProfileSelect(tenantUserId);
  };

  const formatCurrency = (amount: number | undefined): string => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      const number = cleaned.slice(1);
      return `(${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
    }
    return phone;
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #dbeafe 0%, #ffffff 50%, #faf5ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{ width: '100%', maxWidth: '32rem' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '4rem',
              height: '4rem',
              background: 'linear-gradient(135deg, #2563eb, #1e40af)',
              borderRadius: '1rem',
              marginBottom: '1rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}>
              <Home style={{ width: '2rem', height: '2rem', color: 'white' }} />
        </div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
          Select Your Property
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '0.25rem' }}>
          You have multiple rental properties. Please select which one you want to access.
        </p>
            <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>
              Phone: {formatPhoneNumber(phoneNumber)}
        </p>
      </div>

          {/* Property Selection */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '2rem',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tenantProfiles.map((profile) => (
              <button
                key={profile.tenant_user_id}
                onClick={() => handleProfileSelect(profile.tenant_user_id)}
                disabled={loading}
                  style={{
                    width: '100%',
                    padding: '1.5rem',
                    border: `2px solid ${selectedProfileId === profile.tenant_user_id ? '#2563eb' : '#e5e7eb'}`,
                    borderRadius: '0.75rem',
                    backgroundColor: selectedProfileId === profile.tenant_user_id ? '#eff6ff' : 'white',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    opacity: loading ? 0.6 : 1
                  }}
                  onMouseOver={(e) => {
                    if (!loading && selectedProfileId !== profile.tenant_user_id) {
                      e.currentTarget.style.borderColor = '#93c5fd';
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!loading && selectedProfileId !== profile.tenant_user_id) {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Property Image */}
                    <div style={{
                      width: '4rem',
                      height: '4rem',
                      borderRadius: '0.75rem',
                      backgroundColor: '#f3f4f6',
                      backgroundImage: `url(https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=400)`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      flexShrink: 0,
                      border: '1px solid #e5e7eb'
                    }} />

                    {/* Property Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: '#111827',
                        margin: '0 0 0.5rem 0'
                      }}>
                          {profile.property_name || 'Property Name Not Available'}
                        </h3>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                        <MapPin style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {profile.property_address || 'Address not available'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Users style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
                          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            {profile.landlord_name || 'N/A'}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                            {formatCurrency(profile.monthly_rent)}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>per month</p>
                        </div>
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    <div style={{ flexShrink: 0 }}>
                      {selectedProfileId === profile.tenant_user_id ? (
                        loading ? (
                          <Loader2 style={{
                            width: '1.5rem',
                            height: '1.5rem',
                            color: '#2563eb',
                            animation: 'spin 1s linear infinite'
                          }} />
                        ) : (
                          <CheckCircle style={{ width: '1.5rem', height: '1.5rem', color: '#2563eb' }} />
                        )
                      ) : (
                        <ArrowRight style={{ width: '1.5rem', height: '1.5rem', color: '#9ca3af' }} />
                      )}
                  </div>
                </div>

                  {/* Loading/Selected Status */}
                {selectedProfileId === profile.tenant_user_id && (
                    <div style={{
                      marginTop: '1rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid #e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      {loading ? (
                        <>
                          <Loader2 style={{
                            width: '1rem',
                            height: '1rem',
                            color: '#2563eb',
                            animation: 'spin 1s linear infinite'
                          }} />
                          <span style={{ fontSize: '0.875rem', color: '#2563eb', fontWeight: '500' }}>
                            Logging you in...
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle style={{ width: '1rem', height: '1rem', color: '#16a34a' }} />
                          <span style={{ fontSize: '0.875rem', color: '#16a34a', fontWeight: '500' }}>
                            Selected
                          </span>
                        </>
                      )}
                  </div>
                )}
              </button>
            ))}
          </div>

            {/* Help Text */}
            <div style={{
              marginTop: '1.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid #e5e7eb',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                Need help? Contact your landlord or property manager for assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TenantProfileSelector; 