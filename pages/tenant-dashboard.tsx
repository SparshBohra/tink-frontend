import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { apiClient } from '../lib/api';
import { Lease } from '../lib/types';
import PaymentModal from '../components/PaymentModal';

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
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [uploadingLease, setUploadingLease] = useState<number | null>(null);

  // Check authentication on component mount
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
      
      // Load tenant leases and set main loading to false when complete
      loadTenantLeases().finally(() => {
        setLoading(false);
      });
    } catch (error) {
      console.error('Error parsing user data:', error);
      setLoading(false); // Set loading to false even on error
      router.push('/tenant-login');
    }
  }, [router]);

  // Load tenant leases
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

  // Download lease draft
  const handleDownloadLease = async (leaseId: number) => {
    try {
      const leaseData = await apiClient.downloadTenantLeaseDraft(leaseId);
      
      // Open download URL in new tab
      window.open(leaseData.download_url, '_blank');
    } catch (error: any) {
      console.error('Error downloading lease:', error);
      alert('Failed to download lease. Please try again.');
    }
  };

  // Upload signed lease
  const handleUploadSignedLease = async (leaseId: number, file: File) => {
    try {
      setUploadingLease(leaseId);
      
      const result = await apiClient.uploadSignedLease(leaseId, file);
      
      alert(`Success! ${result.message}`);
      
      // Reload leases to get updated status
      await loadTenantLeases();
      
    } catch (error: any) {
      console.error('Error uploading signed lease:', error);
      alert('Failed to upload signed lease. Please try again.');
    } finally {
      setUploadingLease(null);
    }
  };

  // Handle file selection for lease upload
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

  // Handle payment modal
  const handlePaymentModalClose = () => {
    setIsPaymentModalOpen(false);
  };

  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false);
    // Refresh lease data to get updated payment status
    loadTenantLeases();
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('tenant_access_token');
    localStorage.removeItem('tenant_user');
    router.push('/tenant-login');
  };

  // Get primary lease (prioritize by status importance)
  const primaryLease = tenantLeases.find(lease => lease.status === 'active') || 
                      tenantLeases.find(lease => lease.status === 'sent_to_tenant') ||
                      tenantLeases.find(lease => lease.status === 'signed') ||
                      tenantLeases.find(lease => lease.status === 'draft') ||
                      tenantLeases[0];

  // Render lease status badge
  const renderLeaseStatus = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'draft': 'bg-yellow-100 text-yellow-800',
      'sent_to_tenant': 'bg-blue-100 text-blue-800', 
      'signed': 'bg-purple-100 text-purple-800',
      'active': 'bg-green-100 text-green-800',
      'expired': 'bg-red-100 text-red-800'
    };
    
    const statusLabels: { [key: string]: string } = {
      'draft': 'Being Prepared',
      'sent_to_tenant': 'Ready to Sign',
      'signed': 'Awaiting Activation',
      'active': 'Active',
      'expired': 'Expired'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  // Render lease actions based on status
  const renderLeaseActions = (lease: Lease) => {
    switch (lease.status) {
      case 'draft':
        return (
          <div className="text-center text-sm text-gray-600 bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-yellow-800">Lease Being Prepared</span>
            </div>
            <p className="text-yellow-700">Your landlord is preparing your lease document. You'll receive an SMS notification once it's ready for signing.</p>
          </div>
        );
      case 'sent_to_tenant':
        return (
          <div className="space-y-3">
            <div className="text-center text-sm bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-blue-800">Ready for Your Signature!</span>
              </div>
              <p className="text-blue-700 mb-3">Your lease is ready. Follow these steps:</p>
              <div className="text-left text-sm text-blue-700 space-y-2">
                <div className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs font-medium mr-2 mt-0.5">1</span>
                  <span>Click "Download for Review" to get your lease document</span>
                </div>
                <div className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs font-medium mr-2 mt-0.5">2</span>
                  <span>Review all terms carefully</span>
                </div>
                <div className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs font-medium mr-2 mt-0.5">3</span>
                  <span>Print and sign the document</span>
                </div>
                <div className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs font-medium mr-2 mt-0.5">4</span>
                  <span>Take a clear photo or scan of the signed lease</span>
                </div>
                <div className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs font-medium mr-2 mt-0.5">5</span>
                  <span>Click "Upload Signed Lease" and select your file</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleDownloadLease(lease.id)}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              📄 Download for Review
            </button>
            <button
              onClick={() => handleLeaseFileSelect(lease.id)}
              disabled={uploadingLease === lease.id}
              className="w-full flex items-center justify-center px-4 py-3 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {uploadingLease === lease.id ? 'Uploading...' : '✍️ Upload Signed Lease (PDF)'}
            </button>
          </div>
        );
      case 'signed':
        return (
          <div className="text-center text-sm text-purple-600 bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-purple-800">Signed Successfully!</span>
            </div>
            <p className="text-purple-700">Great! Your signed lease has been received. Your landlord will review and activate it shortly. You'll be notified once it's active.</p>
          </div>
        );
      case 'active':
        return (
          <div className="space-y-3">
            <div className="text-center text-sm bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium text-green-800">Lease Active!</span>
              </div>
              <p className="text-green-700">Your lease is now active. Welcome to your new home! You can make payments, contact your landlord, and access all tenant services.</p>
            </div>
            <button
              onClick={() => handleDownloadLease(lease.id)}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              📄 Download Lease Copy
            </button>
          </div>
        );
      default:
        return (
          <div className="text-center text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Processing...</span>
            </div>
            <p>Your lease is being processed. Please check back soon or contact your landlord for updates.</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Tenant Dashboard - Tink Property Management</title>
        <meta name="description" content="Manage your rental, payments, and communicate with your landlord" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center">
                  <div className="bg-indigo-600 rounded-full p-2">
                    <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21l4-4 4 4" />
                  </svg>
                </div>
                <h1 className="ml-3 text-2xl font-bold text-gray-900">Tink Tenant Portal</h1>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Welcome, {currentUser?.full_name}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              
              {/* Profile Information */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Profile Information</h3>
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-4">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{currentUser?.full_name || 'Not provided'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900">{currentUser?.email || 'Not provided'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Phone</dt>
                      <dd className="mt-1 text-sm text-gray-900">{currentUser?.phone || 'Not provided'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Account Status</dt>
                          <dd className="mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Verified
                            </span>
                          </dd>
                        </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Last Login</dt>
                      <dd className="mt-1 text-sm text-gray-900">{new Date().toLocaleDateString()}</dd>
                          </div>
                      </dl>
                </div>
              </div>

              {/* Current Lease */}
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Current Lease</h3>
                  {leaseLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-500">Loading lease...</p>
                    </div>
                  ) : primaryLease ? (
                    <div className="space-y-4">
                              <div>
                                <dt className="text-sm font-medium text-gray-500">Property</dt>
                        <dd className="mt-1 text-sm text-gray-900">{(primaryLease.property_ref as any)?.name || 'Property'}</dd>
                              </div>
                              <div>
                                <dt className="text-sm font-medium text-gray-500">Address</dt>
                        <dd className="mt-1 text-sm text-gray-900">{(primaryLease.property_ref as any)?.address || 'Property Address'}</dd>
                              </div>
                      {primaryLease.room && (
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">Unit/Room</dt>
                          <dd className="mt-1 text-sm text-gray-900">{(primaryLease.room as any)?.name || `Room ${primaryLease.room}`}</dd>
                                </div>
                              )}
                              <div>
                                <dt className="text-sm font-medium text-gray-500">Lease Period</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                          {new Date(primaryLease.start_date).toLocaleDateString()} - {new Date(primaryLease.end_date).toLocaleDateString()}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-sm font-medium text-gray-500">Status</dt>
                        <dd className="mt-1">{renderLeaseStatus(primaryLease.status)}</dd>
                              </div>
                      <div className="pt-2">
                        {renderLeaseActions(primaryLease)}
                          </div>
                        </div>
                      ) : (
                    <p className="text-sm text-gray-500">No lease data available</p>
                      )}
                    </div>
                  </div>

              {/* Rent Payment */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Rent Payment</h3>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-500 mb-1">Next Payment Due</div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      ${primaryLease?.monthly_rent || '0.00'}
                    </div>
                    <div className="text-sm text-gray-500 mb-4">Due on the 1st of each month</div>
                    
                    {primaryLease?.status === 'active' ? (
                      <button
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                      >
                        Pay Rent
                      </button>
                    ) : (
                      <div className="bg-gray-100 text-gray-500 py-2 px-4 rounded-md text-sm">
                        Payments will be available once your lease is activated
                            </div>
                              )}
                            </div>
                          </div>
                        </div>
                              </div>

                  {/* Quick Actions */}
            <div className="mt-8">
              <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">Quick Actions</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      
                        <button
                      onClick={() => alert('Payment history feature will be available soon!')}
                          className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="ml-4 text-left">
                            <p className="text-sm font-medium text-gray-900">Payment History</p>
                            <p className="text-sm text-gray-500">View past payments</p>
                          </div>
                        </button>
                        
                        <button
                      onClick={() => alert('Contact landlord feature will be available soon!')}
                          className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <div className="ml-4 text-left">
                            <p className="text-sm font-medium text-gray-900">Contact Landlord</p>
                            <p className="text-sm text-gray-500">Send a message</p>
                          </div>
                        </button>
                        
                        <button
                      onClick={() => alert('Maintenance request feature will be available soon!')}
                          className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <div className="ml-4 text-left">
                            <p className="text-sm font-medium text-gray-900">Maintenance</p>
                            <p className="text-sm text-gray-500">Report an issue</p>
                          </div>
                        </button>
                        
                    <div className="flex items-center p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="ml-4 text-left">
                            <p className="text-sm font-medium text-gray-900">Lease Documents</p>
                        <p className="text-sm text-gray-500">Handled in Current Lease section above</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Payment Modal */}
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={handlePaymentModalClose}
          lease={primaryLease}
          onPaymentSuccess={handlePaymentSuccess}
        />
      </div>
    </>
  );
};

export default TenantDashboard; 