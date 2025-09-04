import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { apiClient } from '../lib/api';
import { Lease } from '../lib/types';
import PaymentModal from '../components/PaymentModal';
import PaymentHistoryModal from '../components/PaymentHistoryModal';
import ContactLandlordModal from '../components/ContactLandlordModal';
import { 
  Download, 
  Clock, 
  CheckCircle, 
  Mail, 
  Phone, 
  Shield, 
  CreditCard,
  MessageSquare,
  History,
  LogOut,
  Bell
} from 'lucide-react';

interface TenantUser {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  is_verified: boolean;
}

const TenantDashboard: React.FC = () => {
  const router = useRouter();
  const [tenantLeases, setTenantLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaseLoading, setLeaseLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<TenantUser | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPaymentHistoryModalOpen, setIsPaymentHistoryModalOpen] = useState(false);
  const [isContactLandlordModalOpen, setIsContactLandlordModalOpen] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem('tenant_access_token');
    const userStr = localStorage.getItem('tenant_user');

    if (!accessToken || !userStr) {
      router.push('/tenant-login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      apiClient.setAccessToken(accessToken, 'tenant');
      loadTenantLeases().finally(() => setLoading(false));
    } catch (error) {
      console.error('Error parsing user data:', error);
      setLoading(false);
      router.push('/tenant-login');
    }
  }, [router]);

  const loadTenantLeases = async () => {
    try {
      setLeaseLoading(true);
      const response = await apiClient.getTenantLeases();
      setTenantLeases(response || []);
    } catch (error: any) {
      console.error('Error loading tenant leases:', error);
      // setError(error.message || 'Failed to load lease information'); // This line was removed
    } finally {
      setLeaseLoading(false);
    }
  };

  const handleDownloadLease = async (leaseId: number) => {
    try {
      const downloadData = await apiClient.downloadDraftLease(leaseId);
      window.open(downloadData.download_url, '_blank');
    } catch (error: any) {
      alert(`Failed to download lease: ${error.message}`);
    }
  };

  const handlePaymentModalClose = () => setIsPaymentModalOpen(false);
  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false);
    loadTenantLeases();
  };

  const handleLogout = () => {
    localStorage.removeItem('tenant_access_token');
    localStorage.removeItem('tenant_user');
    router.push('/tenant-login');
  };

  const primaryLease = 
    tenantLeases.find(lease => lease.status === 'active') || 
    tenantLeases.find(lease => lease.status === 'sent_to_tenant') ||
    tenantLeases.find(lease => lease.status === 'signed') ||
    tenantLeases.find(lease => lease.status === 'draft') ||
    tenantLeases[0];

  const renderLeaseStatus = (status: string) => {
    const statusConfig: { [key: string]: { label: string; color: string; bgColor: string } } = {
      'draft': { label: 'Being Prepared', color: '#6b7280', bgColor: '#f3f4f6' },
      'sent_to_tenant': { label: 'Ready to Sign', color: '#2563eb', bgColor: '#eff6ff' },
      'signed': { label: 'Awaiting Activation', color: '#d97706', bgColor: '#fef3c7' },
      'active': { label: 'Lease Active', color: '#16a34a', bgColor: '#f0fdf4' },
      'expired': { label: 'Expired', color: '#dc2626', bgColor: '#fef2f2' }
    };
    
    const config = statusConfig[status] || statusConfig['draft'];
    
        return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.375rem 0.75rem',
        backgroundColor: config.bgColor,
        color: config.color,
        borderRadius: '12px',
        fontSize: '0.875rem',
        fontWeight: '500'
      }}>
        <CheckCircle size={14} />
        {config.label}
          </div>
        );
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontSize: '1.125rem',
        color: '#6b7280'
      }}>
        Loading your dashboard...
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Tenant Dashboard - Tink</title>
        <meta name="description" content="Manage your rental, payments, and communicate with your landlord" />
      </Head>

      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc'
      }}>
        {/* Header */}
        <header style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '1rem 0'
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                backgroundColor: '#2563eb',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '700',
                fontSize: '1.125rem'
              }}>
                T
              </div>
              <div>
                <h1 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#111827',
                  margin: 0
                }}>Tink</h1>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: 0
                }}>Tenant Portal</p>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <Bell size={20} color="#6b7280" style={{ cursor: 'pointer' }} />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  backgroundColor: '#2563eb',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '0.875rem'
                }}>
                  {currentUser?.full_name?.charAt(0) || 'T'}
                </div>
            <div>
                  <p style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#111827',
                    margin: 0
                  }}>{currentUser?.full_name || 'Tenant'}</p>
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    margin: 0
                  }}>Tenant</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  color: '#6b7280',
                  borderRadius: '6px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '2rem'
        }}>
          {/* Welcome Section */}
          <div style={{
            marginBottom: '2rem'
          }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#111827',
              margin: '0 0 0.5rem 0'
            }}>
              Welcome back, <span style={{ color: '#2563eb' }}>{currentUser?.full_name?.split(' ')[0] || 'Tenant'}</span>
            </h2>
            <p style={{
              fontSize: '1.125rem',
              color: '#6b7280',
              margin: 0
            }}>Manage your rental and stay connected with your property</p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '1rem',
              fontSize: '0.875rem',
              color: '#6b7280'
            }}>
              <Clock size={14} />
              Last login: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'numeric', 
                day: 'numeric' 
              })}
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '2rem',
            alignItems: 'start'
          }}>
            {/* Left Column */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2rem'
            }}>
              {/* Current Lease */}
              <div style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#111827',
                    margin: 0
                  }}>Current Lease</h3>
                  {primaryLease && renderLeaseStatus(primaryLease.status)}
                </div>

                {leaseLoading ? (
                  <p style={{ color: '#6b7280' }}>Loading lease information...</p>
                ) : primaryLease ? (
                  <div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '1.5rem',
                      marginBottom: '2rem'
                    }}>
                      <div>
                        <dt style={{
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#6b7280',
                          marginBottom: '0.25rem'
                        }}>Property</dt>
                        <dd style={{
                          fontSize: '1rem',
                          fontWeight: '500',
                          color: '#111827',
                          margin: 0
                        }}>{(primaryLease.property_ref as any)?.name || 'Property Address'}</dd>
                      </div>
                      
                      <div>
                        <dt style={{
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#6b7280',
                          marginBottom: '0.25rem'
                        }}>Lease Period</dt>
                        <dd style={{
                          fontSize: '1rem',
                          fontWeight: '500',
                          color: '#111827',
                          margin: 0
                        }}>
                          {new Date(primaryLease.start_date).toLocaleDateString()} - {new Date(primaryLease.end_date).toLocaleDateString()}
                        </dd>
                      </div>

                      {primaryLease.room && (
                        <div>
                          <dt style={{
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: '#6b7280',
                            marginBottom: '0.25rem'
                          }}>Unit/Room</dt>
                          <dd style={{
                            fontSize: '1rem',
                            fontWeight: '500',
                            color: '#111827',
                            margin: 0
                          }}>{(primaryLease.room as any)?.name || `Room ${primaryLease.room}`}</dd>
                        </div>
                      )}

                    <div>
                        <dt style={{
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#6b7280',
                          marginBottom: '0.25rem'
                        }}>Status</dt>
                        <dd style={{ margin: 0 }}>
                          {renderLeaseStatus(primaryLease.status)}
                        </dd>
                      </div>
                    </div>

                    {/* Lease Status Message */}
                    {primaryLease.status === 'active' && (
                      <div style={{
                        padding: '1rem',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '8px',
                        marginBottom: '1.5rem'
                      }}>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#166534',
                          margin: 0,
                          fontWeight: '500'
                        }}>Your lease is now active. Welcome to your new home!</p>
                      </div>
                    )}

                    {/* Lease Actions */}
                    {primaryLease.status === 'active' && (
                      <button
                        onClick={() => handleDownloadLease(primaryLease.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
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
                        <Download size={16} />
                        Download Lease Copy
                      </button>
                    )}
                  </div>
                ) : (
                  <p style={{ color: '#6b7280' }}>No lease information available</p>
                )}
              </div>

              {/* Quick Actions */}
              <div style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#111827',
                  margin: '0 0 1.5rem 0'
                }}>Quick Actions</h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '1rem'
                }}>
                  <button
                    onClick={() => setIsPaymentHistoryModalOpen(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1.5rem',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#dcfce7';
                      e.currentTarget.style.borderColor = '#86efac';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0fdf4';
                      e.currentTarget.style.borderColor = '#bbf7d0';
                    }}
                  >
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
                      <History size={18} color="white" />
                    </div>
              <div>
                      <h4 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#111827',
                        margin: '0 0 0.25rem 0'
                      }}>Payment History</h4>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        margin: 0
                      }}>View all your past rent payments</p>
                    </div>
                </button>

                  <button
                    onClick={() => setIsContactLandlordModalOpen(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1.5rem',
                      backgroundColor: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#dbeafe';
                      e.currentTarget.style.borderColor = '#93c5fd';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#eff6ff';
                      e.currentTarget.style.borderColor = '#bfdbfe';
                    }}
                  >
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
                      <MessageSquare size={18} color="white" />
                    </div>
                    <div>
                      <h4 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#111827',
                        margin: '0 0 0.25rem 0'
                      }}>Contact Landlord</h4>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        margin: 0
                      }}>Send a message to your property manager</p>
                    </div>
                </button>
                </div>
              </div>
          </div>

            {/* Right Column */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2rem'
            }}>
              {/* Profile Information */}
              <div style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#111827',
                  margin: '0 0 1.5rem 0'
                }}>Profile Information</h3>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    width: '3rem',
                    height: '3rem',
                    backgroundColor: '#2563eb',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '1.25rem'
                  }}>
                    {currentUser?.full_name?.charAt(0) || 'T'}
                  </div>
                  <div>
                    <p style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#111827',
                      margin: '0 0 0.25rem 0'
                    }}>{currentUser?.full_name || 'Not provided'}</p>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      margin: 0
                    }}>Tenant</p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <Mail size={16} color="#6b7280" />
                    <span style={{
                      fontSize: '0.875rem',
                      color: '#111827'
                    }}>{currentUser?.email || 'Not provided'}</span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <Phone size={16} color="#6b7280" />
                    <span style={{
                      fontSize: '0.875rem',
                      color: '#111827'
                    }}>{currentUser?.phone || 'Not provided'}</span>
                  </div>

                  {currentUser?.is_verified && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <Shield size={16} color="#16a34a" />
                      <span style={{
                        fontSize: '0.875rem',
                        color: '#16a34a',
                        fontWeight: '500'
                      }}>Verified Account</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rent Payment */}
              <div style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#111827',
                  margin: '0 0 1.5rem 0'
                }}>Rent Payment</h3>
                
                <div style={{
                  marginBottom: '1.5rem'
                }}>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: '0 0 0.5rem 0'
                  }}>Next Payment Due</p>
                  <p style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#111827',
                    margin: '0 0 0.25rem 0'
                  }}>
                    ${primaryLease?.monthly_rent || '1,350'}<span style={{
                      fontSize: '1rem',
                      fontWeight: '400',
                      color: '#6b7280'
                    }}>.00</span>
                  </p>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: 0
                  }}>Due on the 1st of each month</p>
                </div>

                {primaryLease?.status === 'active' ? (
                  <button
                    onClick={() => setIsPaymentModalOpen(true)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.875rem 1rem',
                      backgroundColor: '#16a34a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                  >
                    <CreditCard size={16} />
                    Pay Rent Now
                  </button>
                ) : (
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: 0,
                    textAlign: 'center',
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px'
                  }}>Payments will be available once your lease is activated</p>
                )}
              </div>
            </div>
          </div>
        </main>

        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={handlePaymentModalClose}
          lease={primaryLease}
          onPaymentSuccess={handlePaymentSuccess}
        />

        <PaymentHistoryModal
          isOpen={isPaymentHistoryModalOpen}
          onClose={() => setIsPaymentHistoryModalOpen(false)}
        />

        <ContactLandlordModal
          isOpen={isContactLandlordModalOpen}
          onClose={() => setIsContactLandlordModalOpen(false)}
        />
      </div>
    </>
  );
};

export default TenantDashboard; 