import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  Home, 
  ArrowLeft, 
  Phone, 
  MessageSquare, 
  CheckCircle,
  MapPin,
  Building,
  Users,
  ArrowRight,
  Download,
  Upload,
  DollarSign,
  Clock,
  FileText,
  User,
  Mail,
  LogOut,
  Calendar,
  CreditCard,
  History
} from 'lucide-react';
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
  const [isContactLandlordModalOpen, setIsContactLandlordModalOpen] = useState(false);
  const [uploadingLease, setUploadingLease] = useState<number | null>(null);

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

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'draft': 'bg-yellow-100 text-yellow-800',
      'sent_to_tenant': 'bg-blue-100 text-blue-800',
      'signed': 'bg-purple-100 text-purple-800',
      'active': 'bg-green-100 text-green-800',
      'expired': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const renderLeaseStatus = (status: string) => {
    const statusLabels: { [key: string]: string } = {
      'draft': 'Being Prepared',
      'sent_to_tenant': 'Ready to Sign',
      'signed': 'Awaiting Activation',
      'active': 'Active',
      'expired': 'Expired'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const renderLeaseActions = (lease: Lease) => {
    switch (lease.status) {
      case 'draft':
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
          <div>
                <h3 className="text-lg font-medium text-yellow-900">Lease Being Prepared</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Your landlord is preparing your lease document. You'll receive an SMS notification once it's ready for signing.
                </p>
              </div>
            </div>
          </div>
        );
      case 'sent_to_tenant':
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
          <div>
                <h3 className="text-lg font-medium text-blue-900">Ready for Your Signature</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Your lease is ready for review and signing.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-3">Next Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Download and review the lease document</li>
              <li>Print and sign the document</li>
              <li>Scan or photograph the signed lease</li>
              <li>Upload the signed document using the button below</li>
            </ol>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => handleDownloadLease(lease.id)}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Lease</span>
              </button>
              <button 
                onClick={() => handleLeaseFileSelect(lease.id)} 
                disabled={uploadingLease === lease.id}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {uploadingLease === lease.id ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>{uploadingLease === lease.id ? 'Uploading...' : 'Upload Signed Lease'}</span>
              </button>
            </div>
          </div>
        );
      case 'signed':
        return (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-purple-600" />
              </div>
          <div>
                <h3 className="text-lg font-medium text-purple-900">Lease Signed Successfully</h3>
                <p className="text-sm text-purple-700 mt-1">
                  Your signed lease has been received. Your landlord will review and activate it shortly.
                </p>
              </div>
            </div>
          </div>
        );
      case 'active':
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
          <div>
                  <h3 className="text-lg font-medium text-green-900">Your lease is now active. Welcome to your new home!</h3>
                  <p className="text-sm text-green-700 mt-1">You can now make payments and access all tenant features.</p>
                </div>
              </div>
              <button 
                onClick={() => handleDownloadLease(lease.id)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Lease Copy</span>
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-gray-600" />
              </div>
          <div>
                <h3 className="text-lg font-medium text-gray-900">Processing</h3>
                <p className="text-sm text-gray-700 mt-1">
                  Your lease is being processed. Please check back soon.
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #dbeafe 0%, #ffffff 50%, #faf5ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{ textAlign: 'center' }}>
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
          <div style={{
            width: '2rem',
            height: '2rem',
            border: '4px solid #dbeafe',
            borderTop: '4px solid #2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem auto'
          }}></div>
          <p style={{ color: '#6b7280' }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Tenant Dashboard - Tink</title>
        <meta name="description" content="Manage your rental, payments, and communicate with your landlord" />
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @media (min-width: 1024px) {
            .dashboard-grid {
              grid-template-columns: 2fr 1fr !important;
            }
          }
        `}</style>
      </Head>

      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #dbeafe 0%, #ffffff 50%, #faf5ff 100%)'
      }}>
        {/* Header */}
        <header style={{
          backgroundColor: 'white',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{
            maxWidth: '80rem',
            margin: '0 auto',
            padding: '0 1rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.5rem 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '3rem',
                  height: '3rem',
                  background: 'linear-gradient(135deg, #2563eb, #1e40af)',
                  borderRadius: '0.75rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}>
                  <Home style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
                </div>
      <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>Tink</h1>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Tenant Portal</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Welcome back,</p>
                  <p style={{ fontWeight: '600', color: '#111827', margin: 0 }}>{currentUser?.full_name || 'Tenant'}</p>
                </div>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  background: 'linear-gradient(135deg, #2563eb, #1e40af)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600'
                }}>
                  {currentUser?.full_name?.charAt(0) || 'T'}
            </div>
                <button 
                  onClick={handleLogout}
                  style={{
                    padding: '0.5rem',
                    color: '#9ca3af',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '0.375rem'
                  }}
                  title="Logout"
                  onMouseOver={(e) => e.currentTarget.style.color = '#6b7280'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
                >
                  <LogOut style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '2rem 1rem'
        }}>
          {/* Welcome Section */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>Welcome back, {currentUser?.full_name || 'Tenant'}</h2>
            <p style={{ color: '#6b7280', margin: 0 }}>Manage your rental and stay connected with your property</p>
          </div>
          
          {/* Last Login Info */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            padding: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock style={{ width: '1rem', height: '1rem', color: '#9ca3af' }} />
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Last login: {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '2rem'
          }}>
            {/* For larger screens, we'll use CSS media queries in a style tag */}
            <style jsx>{`
              @media (min-width: 1024px) {
                .dashboard-grid {
                  grid-template-columns: 2fr 1fr !important;
                }
              }
            `}</style>
            
            <div className="dashboard-grid" style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '2rem'
            }}>
              {/* Main Content */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Current Lease Section */}
                <section style={{
                  backgroundColor: 'white',
                  borderRadius: '0.75rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    padding: '1.5rem 1.5rem 1rem 1.5rem',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Building style={{ width: '1.25rem', height: '1.25rem', color: '#2563eb' }} />
                      <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', margin: 0 }}>Current Lease</h2>
                      {primaryLease && renderLeaseStatus(primaryLease.status)}
                    </div>
                  </div>
                  <div style={{ padding: '1.5rem' }}>
                {leaseLoading ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem 0'
                      }}>
                        <div style={{
                          width: '1.5rem',
                          height: '1.5rem',
                          border: '2px solid #dbeafe',
                          borderTop: '2px solid #2563eb',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                        <span style={{ marginLeft: '0.75rem', color: '#6b7280' }}>Loading lease information...</span>
                      </div>
                ) : primaryLease ? (
                  <>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                          gap: '1.5rem',
                          marginBottom: '1.5rem'
                        }}>
                      <div>
                            <dt style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>Property</dt>
                            <dd style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>{(primaryLease.property_ref as any)?.name || 'Property Address'}</dd>
                      </div>
                      <div>
                            <dt style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>Lease Period</dt>
                            <dd style={{ fontSize: '0.875rem', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Calendar style={{ width: '1rem', height: '1rem', color: '#9ca3af' }} />
                              <span>
                          {new Date(primaryLease.start_date).toLocaleDateString()} - {new Date(primaryLease.end_date).toLocaleDateString()}
                              </span>
                        </dd>
                      </div>
                      <div>
                            <dt style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>Address</dt>
                            <dd style={{ fontSize: '0.875rem', color: '#111827', margin: 0, display: 'flex', alignItems: 'flex-start', gap: '0.25rem' }}>
                              <MapPin style={{ width: '1rem', height: '1rem', color: '#9ca3af', marginTop: '0.125rem' }} />
                              <span>{(primaryLease.property_ref as any)?.address || 'Property Address'}</span>
                            </dd>
                      </div>
                      {primaryLease.room && (
                        <div>
                              <dt style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>Unit/Room</dt>
                              <dd style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>{(primaryLease.room as any)?.name || `Room ${primaryLease.room}`}</dd>
                            </div>
                          )}
                        </div>
                      {renderLeaseActions(primaryLease)}
                  </>
                ) : (
                      <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <Building style={{ width: '3rem', height: '3rem', color: '#d1d5db', margin: '0 auto 1rem auto' }} />
                        <p style={{ color: '#6b7280' }}>No lease information available</p>
                      </div>
                )}
              </div>
            </section>

                {/* Quick Actions Section */}
                <section style={{
                  backgroundColor: 'white',
                  borderRadius: '0.75rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    padding: '1.5rem 1.5rem 1rem 1.5rem',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', margin: 0 }}>Quick Actions</h2>
                  </div>
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: '1rem'
                    }}>
                      <button 
                        onClick={() => setIsPaymentHistoryModalOpen(true)}
                        style={{
                          padding: '1.5rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '0.75rem',
                          backgroundColor: 'white',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = '#93c5fd';
                          e.currentTarget.style.backgroundColor = '#eff6ff';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.backgroundColor = 'white';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{
                            width: '3rem',
                            height: '3rem',
                            backgroundColor: '#dcfce7',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <History style={{ width: '1.5rem', height: '1.5rem', color: '#16a34a' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ fontWeight: '600', color: '#111827', margin: '0 0 0.25rem 0' }}>Payment History</h3>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>View all your past rent payments</p>
                          </div>
                          <ArrowRight style={{ width: '1.25rem', height: '1.25rem', color: '#9ca3af' }} />
                        </div>
                </button>
                                          <button 
                      onClick={() => setIsContactLandlordModalOpen(true)}
                      style={{
                        padding: '1.5rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = '#93c5fd';
                        e.currentTarget.style.backgroundColor = '#eff6ff';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{
                            width: '3rem',
                            height: '3rem',
                            backgroundColor: '#dbeafe',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <MessageSquare style={{ width: '1.5rem', height: '1.5rem', color: '#2563eb' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ fontWeight: '600', color: '#111827', margin: '0 0 0.25rem 0' }}>Contact Landlord</h3>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Send a message to your property manager</p>
                          </div>
                          <ArrowRight style={{ width: '1.25rem', height: '1.25rem', color: '#9ca3af' }} />
                        </div>
                </button>
                    </div>
              </div>
            </section>
          </div>

              {/* Sidebar */}
              <aside style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Profile Information */}
                <section style={{
                  backgroundColor: 'white',
                  borderRadius: '0.75rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    padding: '1.5rem 1.5rem 1rem 1.5rem',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>Profile Information</h2>
                  </div>
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div style={{
                        width: '4rem',
                        height: '4rem',
                        background: 'linear-gradient(135deg, #2563eb, #1e40af)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1.25rem',
                        fontWeight: '600'
                      }}>
                        {currentUser?.full_name?.charAt(0) || 'T'}
                </div>
                <div>
                        <p style={{ fontWeight: '600', color: '#111827', margin: '0 0 0.25rem 0' }}>{currentUser?.full_name || 'Not provided'}</p>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Tenant</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Mail style={{ width: '1rem', height: '1rem', color: '#9ca3af' }} />
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{currentUser?.email}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Phone style={{ width: '1rem', height: '1rem', color: '#9ca3af' }} />
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{currentUser?.phone}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <CheckCircle style={{ width: '1rem', height: '1rem', color: '#10b981' }} />
                        <span style={{ fontSize: '0.875rem', color: '#059669', fontWeight: '500' }}>Verified Account</span>
                      </div>
                </div>
              </div>
            </section>

                {/* Rent Payment */}
                <section style={{
                  backgroundColor: 'white',
                  borderRadius: '0.75rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    padding: '1.5rem 1.5rem 1rem 1.5rem',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>Rent Payment</h2>
                  </div>
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <DollarSign style={{ width: '1.25rem', height: '1.25rem', color: '#16a34a' }} />
                        <dt style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280' }}>Next Payment Due</dt>
                      </div>
                      <dd style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                        ${primaryLease?.monthly_rent || '0'}<span style={{ fontSize: '1.125rem', fontWeight: 'normal', color: '#6b7280' }}>.00</span>
                      </dd>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>Due on the 1st of each month</p>
                </div>
                {primaryLease?.status === 'active' ? (
                      <button 
                        onClick={() => setIsPaymentModalOpen(true)}
                        style={{
                          width: '100%',
                          background: 'linear-gradient(135deg, #16a34a, #15803d)',
                          color: 'white',
                          padding: '0.75rem 1rem',
                          borderRadius: '0.5rem',
                          border: 'none',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #15803d, #166534)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #16a34a, #15803d)'}
                      >
                        <CreditCard style={{ width: '1.25rem', height: '1.25rem' }} />
                        <span>Pay Rent Now</span>
                      </button>
                    ) : (
                      <div style={{
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        textAlign: 'center'
                      }}>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Payments will be available once your lease is activated</p>
                      </div>
                )}
              </div>
            </section>
          </aside>
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
          landlordInfo={{
            name: (primaryLease?.property_ref as any)?.landlord?.name || 'Property Manager',
            phone: (primaryLease?.property_ref as any)?.landlord?.phone,
            email: (primaryLease?.property_ref as any)?.landlord?.email,
            property_name: (primaryLease?.property_ref as any)?.name || 'Your Property'
          }}
        />
      </div>
    </>
  );
};

export default TenantDashboard; 