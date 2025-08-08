import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { apiClient } from '../lib/api';
import { Lease } from '../lib/types';
import PaymentModal from '../components/PaymentModal';
import PaymentHistoryModal from '../components/PaymentHistoryModal';
import ContactLandlordModal from '../components/ContactLandlordModal';

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
  const [error, setError] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<TenantUser | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPaymentHistoryModalOpen, setIsPaymentHistoryModalOpen] = useState(false);
  const [uploadingLease, setUploadingLease] = useState<number | null>(null);
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
      const leases = await apiClient.getTenantLeases();
      setTenantLeases(leases);
    } catch (error: any) {
      console.error('Error loading tenant leases:', error);
      setError('Failed to load lease data');
    } finally {
      setLeaseLoading(false);
    }
  };

  const handleDownloadLease = async (leaseId: number) => {
    try {
      const leaseData = await apiClient.downloadTenantLeaseDraft(leaseId);
      window.open(leaseData.download_url, '_blank');
    } catch (error: any) {
      console.error('Error downloading lease:', error);
      alert('Failed to download lease. Please try again.');
    }
  };

  const handleUploadSignedLease = async (leaseId: number, file: File) => {
    try {
      setUploadingLease(leaseId);
      const result = await apiClient.uploadSignedLease(leaseId, file);
      alert(`Success! ${result.message}`);
      await loadTenantLeases();
    } catch (error: any) {
      console.error('Error uploading signed lease:', error);
      alert('Failed to upload signed lease. Please try again.');
    } finally {
      setUploadingLease(null);
    }
  };

  const handleLeaseFileSelect = (leaseId: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.type !== 'application/pdf') {
          alert('Please select a PDF file.');
          return;
        }
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          alert('File size must be less than 10MB.');
          return;
        }
        handleUploadSignedLease(leaseId, file);
      }
    };
    input.click();
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
    const statusLabels: { [key: string]: string } = {
      'draft': 'Being Prepared',
      'sent_to_tenant': 'Ready to Sign',
      'signed': 'Awaiting Activation',
      'active': 'Active',
      'expired': 'Expired'
    };
    return <span>{statusLabels[status] || status}</span>;
  };

  const renderLeaseActions = (lease: Lease) => {
    switch (lease.status) {
      case 'draft':
        return (
          <div>
            <h3>Lease Being Prepared</h3>
            <p>Your landlord is preparing your lease document. You'll receive an SMS notification once it's ready for signing.</p>
          </div>
        );
      case 'sent_to_tenant':
        return (
          <div>
            <h3>Ready for Your Signature</h3>
            <p>Your lease is ready for review and signing. Please follow these steps:</p>
            <ol>
              <li>Download and review the lease document</li>
              <li>Print and sign the document</li>
              <li>Scan or photograph the signed lease</li>
              <li>Upload the signed document using the button below</li>
            </ol>
            <div>
              <button onClick={() => handleDownloadLease(lease.id)}>Download Lease</button>
              <button onClick={() => handleLeaseFileSelect(lease.id)} disabled={uploadingLease === lease.id}>
                {uploadingLease === lease.id ? 'Uploading...' : 'Upload Signed Lease'}
              </button>
            </div>
          </div>
        );
      case 'signed':
        return (
          <div>
            <h3>Lease Signed Successfully</h3>
            <p>Your signed lease has been received. Your landlord will review and activate it shortly.</p>
          </div>
        );
      case 'active':
        return (
          <div>
            <h3>Lease Active</h3>
            <p>Your lease is now active. Welcome to your new home!</p>
            <button onClick={() => handleDownloadLease(lease.id)}>Download Lease Copy</button>
          </div>
        );
      default:
        return (
          <div>
            <h3>Processing</h3>
            <p>Your lease is being processed. Please check back soon.</p>
          </div>
        );
    }
  };

  if (loading) {
    return <div>Loading your dashboard...</div>;
  }

  return (
    <>
      <Head>
        <title>Tenant Dashboard - Tink</title>
        <meta name="description" content="Manage your rental, payments, and communicate with your landlord" />
      </Head>

      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        {/* Header */}
        <header style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e2e8f0',
          padding: '1rem 2rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            maxWidth: '1400px',
            margin: '0 auto'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                backgroundColor: '#3b82f6',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.25rem'
              }}>
                T
              </div>
              <div>
                <h1 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#1e293b',
                  margin: 0
                }}>Tink</h1>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#64748b',
                  margin: 0
                }}>Tenant Portal</p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  backgroundColor: '#3b82f6',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  {currentUser?.full_name?.charAt(0) || 'R'}
                </div>
                <div>
                  <p style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: 0
                  }}>{currentUser?.full_name || 'Rohan Dave'}</p>
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#64748b',
                    margin: 0
                  }}>Tenant</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  color: '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#e2e8f0';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '2rem',
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
            {/* Welcome Section */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div>
                  <h1 style={{
                    fontSize: '1.875rem',
                    fontWeight: '700',
                    color: '#1e293b',
                    margin: '0 0 0.5rem 0'
                  }}>
                    Welcome back, <span style={{ color: '#3b82f6' }}>{currentUser?.full_name || 'Rohan Dave'}</span>
                  </h1>
                  <p style={{
                    fontSize: '1rem',
                    color: '#64748b',
                    margin: 0
                  }}>Manage your rental and stay connected with your property</p>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#64748b'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                  Last login: {new Date().toLocaleDateString('en-US', { 
                    month: 'numeric', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </div>
              </div>
            </div>

            {/* Current Lease Card */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: 0
                }}>Current Lease</h2>
                {primaryLease && (
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    backgroundColor: primaryLease.status === 'active' ? '#dcfce7' : '#dbeafe',
                    color: primaryLease.status === 'active' ? '#166534' : '#1d4ed8'
                  }}>
                    {primaryLease.status === 'active' ? 'Active' : renderLeaseStatus(primaryLease.status)}
                  </span>
                )}
              </div>

              {leaseLoading ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem',
                  color: '#64748b'
                }}>
                  Loading lease information...
                </div>
              ) : primaryLease ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1.5rem'
                }}>
                  <div>
                    <div style={{ marginBottom: '1rem' }}>
                      <dt style={{
                        fontSize: '0.875rem',
                        color: '#64748b',
                        marginBottom: '0.25rem'
                      }}>Property</dt>
                      <dd style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#1e293b',
                        margin: 0
                      }}>{(primaryLease.property_ref as any)?.name || 'Property Address'}</dd>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <dt style={{
                        fontSize: '0.875rem',
                        color: '#64748b',
                        marginBottom: '0.25rem'
                      }}>Unit/Room</dt>
                      <dd style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#1e293b',
                        margin: 0
                      }}>{primaryLease.room ? `Room ${(primaryLease.room as any)?.name || primaryLease.room}` : 'Room 129'}</dd>
                    </div>
                  </div>
                  <div>
                    <div style={{ marginBottom: '1rem' }}>
                      <dt style={{
                        fontSize: '0.875rem',
                        color: '#64748b',
                        marginBottom: '0.25rem'
                      }}>Lease Period</dt>
                      <dd style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#1e293b',
                        margin: 0
                      }}>
                        {new Date(primaryLease.start_date).toLocaleDateString('en-US', { 
                          month: 'numeric', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })} - {new Date(primaryLease.end_date).toLocaleDateString('en-US', { 
                          month: 'numeric', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </dd>
                    </div>
                    <div>
                      <dt style={{
                        fontSize: '0.875rem',
                        color: '#64748b',
                        marginBottom: '0.25rem'
                      }}>Status</dt>
                      <dd style={{
                        fontSize: '1rem',
                        color: '#1e293b',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                          <polyline points="22,4 12,14.01 9,11.01"/>
                        </svg>
                        Lease Active
                      </dd>
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>
                  No lease information available
                </p>
              )}

              {primaryLease?.status === 'active' && (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '8px',
                  border: '1px solid #bbf7d0'
                }}>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#166534',
                    margin: 0,
                    fontWeight: '500'
                  }}>Your lease is now active. Welcome to your new home!</p>
                  <button
                    onClick={() => primaryLease && handleDownloadLease(primaryLease.id)}
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#2563eb';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#3b82f6';
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7,10 12,15 17,10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download Lease Copy
                  </button>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0 0 1.5rem 0'
              }}>Quick Actions</h2>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem'
              }}>
                <button
                  onClick={() => setIsPaymentHistoryModalOpen(true)}
                  style={{
                    padding: '1.5rem',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    backgroundColor: '#10b981',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12,6 12,12 16,14"/>
                    </svg>
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#1e293b',
                      margin: '0 0 0.25rem 0'
                    }}>Payment History</h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#64748b',
                      margin: 0
                    }}>View all your past rent payments</p>
                  </div>
                </button>

                <button
                  onClick={() => setIsContactLandlordModalOpen(true)}
                  style={{
                    padding: '1.5rem',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    backgroundColor: '#3b82f6',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#1e293b',
                      margin: '0 0 0.25rem 0'
                    }}>Contact Landlord</h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#64748b',
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
            gap: '1.5rem'
          }}>
            {/* Profile Information */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0 0 1.5rem 0'
              }}>Profile Information</h2>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  backgroundColor: '#3b82f6',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1.25rem'
                }}>
                  {currentUser?.full_name?.charAt(0) || 'R'}
                </div>
                <div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: '0 0 0.25rem 0'
                  }}>{currentUser?.full_name || 'Rohan Dave'}</h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#64748b',
                    margin: 0
                  }}>Tenant</p>
                </div>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#1e293b'
                  }}>{currentUser?.email || 'rohannn@gseg.com'}</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#1e293b'
                  }}>{currentUser?.phone || '+18572000666'}</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22,4 12,14.01 9,11.01"/>
                  </svg>
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#10b981',
                    fontWeight: '500'
                  }}>Verified Account</span>
                </div>
              </div>
            </div>

            {/* Rent Payment */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0 0 1.5rem 0'
              }}>Rent Payment</h2>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#64748b',
                  margin: '0 0 0.5rem 0'
                }}>Next Payment Due</p>
                <div style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '0.25rem',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#1e293b'
                  }}>${primaryLease?.monthly_rent || '1,350'}</span>
                  <span style={{
                    fontSize: '1rem',
                    color: '#64748b'
                  }}>.00</span>
                </div>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#64748b',
                  margin: 0
                }}>Due on the 1st of each month</p>
              </div>

              {primaryLease?.status === 'active' ? (
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#059669';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#10b981';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                  Pay Rent Now
                </button>
              ) : (
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center'
                }}>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#64748b',
                    margin: 0
                  }}>Payments will be available once your lease is activated</p>
                </div>
              )}
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