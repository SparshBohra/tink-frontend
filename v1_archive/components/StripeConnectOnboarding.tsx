import React, { useState, useEffect } from 'react';
import { ConnectAccountOnboarding, ConnectComponentsProvider } from '@stripe/react-connect-js';
import { loadConnectAndInitialize } from '@stripe/connect-js';
import { useAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';
import { StripeConnectAccountStatus, StripeConnectAccountData } from '../lib/types';
import { AlertCircle, CheckCircle, CreditCard, Shield, Users, ArrowRight, Zap } from 'lucide-react';

interface StripeConnectOnboardingProps {
  onComplete?: (accountId: string) => void;
  onError?: (error: string) => void;
}

const StripeConnectOnboarding: React.FC<StripeConnectOnboardingProps> = ({ 
  onComplete, 
  onError 
}) => {
  const { user } = useAuth();
  const [accountStatus, setAccountStatus] = useState<StripeConnectAccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stripeConnectInstance, setStripeConnectInstance] = useState<any>(null);
  const [showEmbedded, setShowEmbedded] = useState(false);
  const [embeddedLoading, setEmbeddedLoading] = useState(false);

  // Fetch account status on component mount
  useEffect(() => {
    const fetchAccountStatus = async () => {
      try {
        setLoading(true);
        const status = await apiClient.getStripeAccountStatus();
        setAccountStatus(status);
      } catch (err: any) {
        console.error('Failed to fetch account status:', err);
        setError(err.message || 'Failed to fetch account status');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAccountStatus();
    }
  }, [user]);

  // Create Stripe Connect account
  const handleCreateAccount = async () => {
    try {
      setLoading(true);
      setError(null);

      const accountData: StripeConnectAccountData = {
        business_type: 'individual',
        email: user?.email || '',
        phone: '+15551234567',
        address: {
          line1: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          postal_code: '94111',
          country: 'US'
        }
      };

      const response = await apiClient.createStripeConnectedAccount(accountData);
      
      const status = await apiClient.getStripeAccountStatus();
      setAccountStatus(status);

      if (onComplete) {
        onComplete(response.account_id);
      }
    } catch (err: any) {
      console.error('Failed to create account:', err);
      const errorMessage = err.message || 'Failed to create Stripe account';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Start embedded onboarding
  const handleStartEmbeddedOnboarding = async () => {
    try {
      setEmbeddedLoading(true);
      setError(null);

      if (!accountStatus?.account_id) {
        throw new Error('No account ID available');
      }

      const session = await apiClient.createStripeAccountSession({
        account_id: accountStatus.account_id,
        refresh_url: `${window.location.origin}/stripe/refresh`,
        return_url: `${window.location.origin}/stripe/return`,
      });

      const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (!publishableKey) {
        throw new Error('Stripe publishable key not found');
      }

      const stripeInstance = await loadConnectAndInitialize({
        publishableKey,
        fetchClientSecret: async () => session.client_secret,
      });

      setStripeConnectInstance(stripeInstance);
      setShowEmbedded(true);
    } catch (err: any) {
      console.error('Failed to start embedded onboarding:', err);
      const errorMessage = err.message || 'Failed to start onboarding';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setEmbeddedLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        padding: '3rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px'
      }}>
        <div style={{
          width: '3rem',
          height: '3rem',
          border: '3px solid #f3f4f6',
          borderTop: '3px solid #2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '3rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        minHeight: '300px'
      }}>
        <div style={{
          width: '4rem',
          height: '4rem',
          backgroundColor: '#fef2f2',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem'
        }}>
          <AlertCircle size={24} color="#dc2626" />
        </div>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#111827',
          margin: '0 0 0.5rem 0'
        }}>An Error Occurred</h3>
        <p style={{
          color: '#6b7280',
          margin: '0 0 1.5rem 0'
        }}>{error}</p>
        <button
            onClick={() => {
              setError(null);
              setShowEmbedded(false);
              const fetchStatus = async () => {
                setLoading(true);
                const status = await apiClient.getStripeAccountStatus();
                setAccountStatus(status);
                setLoading(false);
              };
              fetchStatus();
            }}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          >
            Try Again
        </button>
        </div>
    );
  }
  
  if (showEmbedded && stripeConnectInstance) {
    return (
      <div style={{ width: '100%' }}>
        <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
          <div style={{ width: '100%' }}>
            <ConnectAccountOnboarding
              onExit={() => {
                setShowEmbedded(false);
                setStripeConnectInstance(null);
                const fetchStatus = async () => {
                  setLoading(true);
                  const status = await apiClient.getStripeAccountStatus();
                  setAccountStatus(status);
                  setLoading(false);
                };
                fetchStatus();
              }}
              onLoadError={(error) => {
                console.error('Onboarding load error:', error);
                setError('Failed to load onboarding form');
                setShowEmbedded(false);
                setStripeConnectInstance(null);
              }}
            />
          </div>
        </ConnectComponentsProvider>
      </div>
    );
  }

  return (
    <div style={{
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    }}>
      {/* Header with Stripe Logo */}
      <div style={{
        textAlign: 'center',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            backgroundColor: '#635bff',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '1rem'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M13.976 9.15c-2.172-.806-3.596-1.191-3.596-2.705 0-1.091.7-1.852 2.161-1.852 1.495 0 2.91.694 2.91 1.727 0 .694-.652 1.183-1.452 1.183-.437 0-.833-.194-.833-.548 0-.194.194-.337.388-.337.194 0 .388.143.388.337 0 .194-.194.337-.388.337-.194 0-.388-.143-.388-.337 0-.194.194-.337.388-.337.194 0 .388.143.388.337 0 .548-.652.91-1.452.91-.833 0-1.452-.4-1.452-1.183 0 1.033 1.415 1.727 2.91 1.727 1.461 0 2.161-.761 2.161-1.852 0-1.514-1.424-1.899-3.596-2.705z"/>
            </svg>
          </div>
          <div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#111827',
              margin: 0
            }}>Stripe Connect Setup</h2>
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              margin: '0.25rem 0 0 0'
            }}>Powered by Stripe</p>
          </div>
        </div>
        <p style={{
          color: '#6b7280',
          fontSize: '1rem',
          margin: 0,
          maxWidth: '400px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          Set up your Stripe account to accept payments from tenants securely and efficiently
        </p>
      </div>

      {/* Features Grid */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem',
          padding: '1rem',
          backgroundColor: '#eff6ff',
          borderRadius: '8px',
          border: '1px solid #bfdbfe'
        }}>
          <div style={{
            width: '2.5rem',
            height: '2.5rem',
            backgroundColor: '#2563eb',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <CreditCard size={16} color="white" />
          </div>
          <div>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 0.25rem 0'
            }}>Accept Payments</h4>
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              margin: 0
            }}>Credit cards, bank transfers, and digital wallets</p>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem',
          padding: '1rem',
          backgroundColor: '#f0fdf4',
          borderRadius: '8px',
          border: '1px solid #bbf7d0'
        }}>
          <div style={{
            width: '2.5rem',
            height: '2.5rem',
            backgroundColor: '#16a34a',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Shield size={16} color="white" />
          </div>
          <div>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 0.25rem 0'
            }}>Secure & Compliant</h4>
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              margin: 0
            }}>PCI DSS compliant with advanced fraud protection</p>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem',
          padding: '1rem',
          backgroundColor: '#faf5ff',
          borderRadius: '8px',
          border: '1px solid #e9d5ff'
        }}>
          <div style={{
            width: '2.5rem',
            height: '2.5rem',
            backgroundColor: '#7c3aed',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Users size={16} color="white" />
          </div>
          <div>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 0.25rem 0'
            }}>Multi-tenant Support</h4>
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              margin: 0
            }}>Manage payments across multiple properties</p>
          </div>
        </div>
      </div>

      {/* Action Section */}
      <div style={{
        paddingTop: '1.5rem',
        borderTop: '1px solid #e5e7eb'
      }}>
        {accountStatus?.status === 'not_created' && (
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleCreateAccount}
              disabled={loading}
              style={{
                width: '100%',
                height: '3rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                backgroundColor: '#635bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s ease',
                opacity: loading ? 0.7 : 1
              }}
              onMouseOver={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#5b56f0';
              }}
              onMouseOut={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#635bff';
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '1.25rem',
                    height: '1.25rem',
                    border: '2px solid #ffffff40',
                    borderTop: '2px solid #ffffff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Creating Account...
                </>
              ) : (
                <>
                  <Zap size={20} />
                  Create Stripe Account
                </>
              )}
            </button>
          </div>
        )}

        {accountStatus?.status === 'onboarding_pending' && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{ flex: 1 }}>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                margin: '0 0 0.25rem 0'
              }}>Ready to complete your setup</p>
              <p style={{
                fontSize: '0.75rem',
                color: '#9ca3af',
                margin: 0
              }}>This will take about 2-3 minutes</p>
            </div>
            <button
              onClick={handleStartEmbeddedOnboarding}
              disabled={embeddedLoading}
              style={{
                height: '3rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                backgroundColor: '#635bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0 1.5rem',
                cursor: embeddedLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: embeddedLoading ? 0.7 : 1,
                boxShadow: '0 4px 12px rgba(99, 91, 255, 0.3)'
              }}
              onMouseOver={(e) => {
                if (!embeddedLoading) {
                  e.currentTarget.style.backgroundColor = '#5b56f0';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 91, 255, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                if (!embeddedLoading) {
                  e.currentTarget.style.backgroundColor = '#635bff';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 91, 255, 0.3)';
                }
              }}
            >
              {embeddedLoading ? (
                <>
                  <div style={{
                    width: '1.25rem',
                    height: '1.25rem',
                    border: '2px solid #ffffff40',
                    borderTop: '2px solid #ffffff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Loading...
                </>
              ) : (
                <>
                  <Zap size={20} />
                  Complete Setup
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        )}

        {accountStatus?.status === 'active' && (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            backgroundColor: '#f0fdf4',
            borderRadius: '12px',
            border: '1px solid #bbf7d0'
          }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              backgroundColor: '#16a34a',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}>
              <CheckCircle size={24} color="white" />
            </div>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#15803d',
              margin: '0 0 0.5rem 0'
            }}>
              Setup Complete!
            </h3>
            <p style={{
              color: '#166534',
              fontSize: '0.875rem',
              margin: 0
            }}>
              Your Stripe account is ready to accept payments from tenants
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default StripeConnectOnboarding; 