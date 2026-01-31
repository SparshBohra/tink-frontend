import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth-context';
import DashboardLayout from '../components/DashboardLayout';
import StripeConnectOnboarding from '../components/StripeConnectOnboarding';
import { 
  ArrowLeft, 
  DollarSign, 
  Shield, 
  CreditCard, 
  Mail,
  CheckCircle,
  Building,
  Users
} from 'lucide-react';

const StripeConnectPage: React.FC = () => {
  const router = useRouter();
  const { user, isLandlord } = useAuth();

  // Redirect if not a landlord
  React.useEffect(() => {
    if (user && !isLandlord()) {
      router.push('/unauthorized');
    }
  }, [user, isLandlord, router]);

  if (!user || !isLandlord()) {
    return (
      <DashboardLayout title="Payment Setup">
        <div style={{
          padding: '2rem',
          minHeight: 'calc(100vh - 72px)',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '3rem',
            textAlign: 'center',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              backgroundColor: '#fef2f2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto'
            }}>
              <Shield size={24} color="#dc2626" />
            </div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 0.5rem 0'
            }}>Access Denied</h2>
            <p style={{
              fontSize: '1rem',
              color: '#6b7280',
              margin: 0
            }}>Only landlords can access this page.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handleComplete = (accountId: string) => {
    console.log('Stripe Connect setup completed:', accountId);
  };

  const handleError = (error: string) => {
    console.error('Stripe Connect error:', error);
  };

  return (
    <DashboardLayout title="">
      <div style={{
        padding: '16px 20px 20px 20px',
        minHeight: 'calc(100vh - 72px)',
        backgroundColor: '#f8fafc'
      }}>
        {/* Title Section */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease',
          cursor: 'default'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.15)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
            <button 
              onClick={() => router.back()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                  e.currentTarget.style.borderColor = '#9ca3af';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              >
                <ArrowLeft size={16} />
              Back
            </button>
              
              <div style={{
                width: '3rem',
                height: '3rem',
                backgroundColor: '#dbeafe',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CreditCard size={20} color="#2563eb" />
              </div>
              
              <div>
                <h1 style={{
                  fontSize: '1.875rem',
                  fontWeight: '700',
                  color: '#111827',
                  margin: '0 0 0.25rem 0'
                }}>Payment Setup</h1>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '1rem',
                  color: '#6b7280'
                }}>
                  <Building size={16} />
                  Connect Stripe to accept payments from tenants
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 400px',
          gap: '2rem',
          alignItems: 'start'
        }}>
          {/* Left Column - Stripe Connect Component */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
                <StripeConnectOnboarding 
                  onComplete={handleComplete}
                  onError={handleError}
                />
          </div>

          {/* Right Column - Benefits, Setup Process & Support */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem'
          }}>
            {/* Benefits Section */}
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#111827',
                margin: '0 0 1.5rem 0'
              }}>Why Set Up Stripe Connect?</h2>
              
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
                    width: '2rem',
                    height: '2rem',
                    backgroundColor: '#2563eb',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <DollarSign size={16} color="white" />
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#111827',
                      margin: '0 0 0.25rem 0'
                    }}>Automatic Payments</h3>
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      margin: 0
                    }}>Tenants pay rent directly through the platform</p>
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
                    width: '2rem',
                    height: '2rem',
                    backgroundColor: '#16a34a',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Shield size={16} color="white" />
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#111827',
                      margin: '0 0 0.25rem 0'
                    }}>Secure & Compliant</h3>
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      margin: 0
                    }}>PCI DSS compliant with fraud protection</p>
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
                    width: '2rem',
                    height: '2rem',
                    backgroundColor: '#7c3aed',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <CreditCard size={16} color="white" />
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#111827',
                      margin: '0 0 0.25rem 0'
                    }}>Multiple Payment Methods</h3>
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      margin: 0
                    }}>Cards, bank transfers, and digital wallets</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Setup Process */}
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#111827',
                margin: '0 0 1.5rem 0'
              }}>Setup Process</h2>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <div style={{
                    width: '1.5rem',
                    height: '1.5rem',
                    backgroundColor: '#2563eb',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: 'white',
                    flexShrink: 0
                  }}>1</div>
                  <div>
                    <h4 style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#111827',
                      margin: '0 0 0.25rem 0'
                    }}>Create Account</h4>
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      margin: 0
                    }}>Link your Stripe Connect account</p>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <div style={{
                    width: '1.5rem',
                    height: '1.5rem',
                    backgroundColor: '#2563eb',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: 'white',
                    flexShrink: 0
                  }}>2</div>
                  <div>
                    <h4 style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#111827',
                      margin: '0 0 0.25rem 0'
                    }}>Complete Onboarding</h4>
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      margin: 0
                    }}>Provide business and banking details</p>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <div style={{
                    width: '1.5rem',
                    height: '1.5rem',
                    backgroundColor: '#16a34a',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: 'white',
                    flexShrink: 0
                  }}>3</div>
                  <div>
                    <h4 style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#111827',
                      margin: '0 0 0.25rem 0'
                    }}>Start Accepting Payments</h4>
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      margin: 0
                    }}>Begin collecting rent payments</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Section */}
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#111827',
                margin: '0 0 1.5rem 0'
              }}>Need Help?</h2>
              
                <button 
                  onClick={() => window.open('mailto:support@tink.global', '_blank')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
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
                <Mail size={16} />
                  Email Support
                </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StripeConnectPage; 