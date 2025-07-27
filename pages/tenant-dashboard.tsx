import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { apiClient } from '../lib/api';
import { TenantProfile } from '../lib/types';
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
  const [tenantProfile, setTenantProfile] = useState<TenantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<TenantUser | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

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
      loadTenantProfile();
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/tenant-login');
    }
  }, [router]);

  // Load tenant profile data
  const loadTenantProfile = async () => {
    try {
      setLoading(true);
      setError('');

      // Set up axios interceptor for tenant authentication
      const accessToken = localStorage.getItem('tenant_access_token');
      if (accessToken) {
        // Use proper auth setup instead of directly accessing private api property
        // The apiClient should handle this automatically via interceptors
      }

      const profile = await apiClient.getTenantProfile();
      setTenantProfile(profile);
    } catch (error: any) {
      console.error('Error loading tenant profile:', error);
      
      if (error.response?.status === 401) {
        // Token expired or invalid, redirect to login
        handleLogout();
      } else {
        setError('Failed to load profile data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await apiClient.tenantLogout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear local storage and redirect
      localStorage.removeItem('tenant_access_token');
      localStorage.removeItem('tenant_refresh_token');
      localStorage.removeItem('tenant_user');
      router.push('/tenant-login');
    }
  };

  // Handle payment
  const handlePayRent = () => {
    setIsPaymentModalOpen(true);
  };

  // Handle payment modal close
  const handlePaymentModalClose = () => {
    setIsPaymentModalOpen(false);
    // Refresh tenant profile to show updated payment status
    loadTenantProfile();
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin -ml-1 mr-3 h-12 w-12 text-indigo-600 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-4 text-lg text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Tenant Dashboard - Tink Property Management</title>
        <meta name="description" content="Your tenant portal dashboard" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-indigo-600 rounded-full flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7z" />
                  </svg>
                </div>
                <h1 className="ml-3 text-2xl font-bold text-gray-900">Tink Tenant Portal</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{currentUser?.full_name}</p>
                  <p className="text-sm text-gray-500">{currentUser?.phone}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              
              {/* Profile Card */}
              <div className="lg:col-span-1">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Profile Information
                    </h3>
                    {tenantProfile && (
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-4">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                          <dd className="mt-1 text-sm text-gray-900">{tenantProfile.tenant.full_name}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Email</dt>
                          <dd className="mt-1 text-sm text-gray-900">{tenantProfile.tenant.email}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Phone</dt>
                          <dd className="mt-1 text-sm text-gray-900">{tenantProfile.tenant.phone}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Account Status</dt>
                          <dd className="mt-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              tenantProfile.tenant.is_verified 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {tenantProfile.tenant.is_verified ? 'Verified' : 'Pending Verification'}
                            </span>
                          </dd>
                        </div>
                        {tenantProfile.tenant.last_login && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Last Login</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {formatDate(tenantProfile.tenant.last_login)}
                            </dd>
                          </div>
                        )}
                      </dl>
                    )}
                  </div>
                </div>
              </div>

              {/* Lease & Payment Info */}
              <div className="lg:col-span-2">
                <div className="space-y-6">
                  
                  {/* Active Lease Card */}
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Current Lease
                      </h3>
                      
                      {tenantProfile?.active_lease ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <dl className="space-y-3">
                              <div>
                                <dt className="text-sm font-medium text-gray-500">Property</dt>
                                <dd className="mt-1 text-sm text-gray-900">{tenantProfile.active_lease.property.name}</dd>
                              </div>
                              <div>
                                <dt className="text-sm font-medium text-gray-500">Address</dt>
                                <dd className="mt-1 text-sm text-gray-900">{tenantProfile.active_lease.property.address}</dd>
                              </div>
                              {tenantProfile.active_lease.room && (
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">Unit/Room</dt>
                                  <dd className="mt-1 text-sm text-gray-900">{tenantProfile.active_lease.room.name}</dd>
                                </div>
                              )}
                            </dl>
                          </div>
                          
                          <div>
                            <dl className="space-y-3">
                              <div>
                                <dt className="text-sm font-medium text-gray-500">Monthly Rent</dt>
                                <dd className="mt-1 text-lg font-semibold text-gray-900">
                                  {formatCurrency(tenantProfile.active_lease.monthly_rent)}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-sm font-medium text-gray-500">Lease Period</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                  {formatDate(tenantProfile.active_lease.start_date)} - {formatDate(tenantProfile.active_lease.end_date)}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-sm font-medium text-gray-500">Status</dt>
                                <dd className="mt-1">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    tenantProfile.active_lease.status === 'active'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {tenantProfile.active_lease.status.charAt(0).toUpperCase() + tenantProfile.active_lease.status.slice(1)}
                                  </span>
                                </dd>
                              </div>
                            </dl>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7z" />
                          </svg>
                          <h3 className="mt-4 text-sm font-medium text-gray-900">No Active Lease</h3>
                          <p className="mt-2 text-sm text-gray-500">
                            You don't have an active lease at this time.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Card */}
                  {tenantProfile?.active_lease && (
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                          Rent Payment
                        </h3>
                        
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Next Payment Due</p>
                              <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(tenantProfile.active_lease.monthly_rent)}
                              </p>
                              <p className="text-sm text-gray-500">Due on the 1st of each month</p>
                            </div>
                            <div className="text-right">
                              {tenantProfile.active_lease.status === 'active' ? (
                                <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                  Payment Due
                                </span>
                              ) : (
                                <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                                  Lease Pending
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Payment Section - Only show if landlord has Stripe set up */}
                        {tenantProfile.payment_status.landlord_stripe_status?.can_accept_payments ? (
                          tenantProfile.active_lease.status === 'active' ? (
                            <>
                              <button
                                onClick={handlePayRent}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                Pay Rent Now
                              </button>
                              
                              <p className="mt-3 text-xs text-gray-500 text-center">
                                Secure payment powered by Stripe
                              </p>
                            </>
                          ) : (
                            <>
                              <button
                                disabled
                                className="w-full bg-gray-300 text-gray-500 font-medium py-3 px-4 rounded-md cursor-not-allowed"
                              >
                                Payment Unavailable
                              </button>
                              
                              <p className="mt-3 text-xs text-gray-600 text-center">
                                Payments will be available once your lease is activated
                              </p>
                            </>
                          )
                        ) : (
                          <>
                            <div className="w-full bg-yellow-50 border border-yellow-200 rounded-md p-4 text-center">
                              <div className="flex items-center justify-center mb-2">
                                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm font-medium text-yellow-800">Payment Setup Required</span>
                              </div>
                              <p className="text-xs text-yellow-700">
                                Your landlord is still setting up payment processing. Please contact them for rent payment instructions.
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Quick Actions
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          onClick={() => alert('Payment history feature coming soon!')}
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
                          onClick={() => alert('Contact landlord feature coming soon!')}
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
                          onClick={() => alert('Maintenance request feature coming soon!')}
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
                        
                        <button
                          onClick={() => alert('Lease documents feature coming soon!')}
                          className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="ml-4 text-left">
                            <p className="text-sm font-medium text-gray-900">Lease Documents</p>
                            <p className="text-sm text-gray-500">Download lease</p>
                          </div>
                        </button>
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
          tenantProfile={tenantProfile}
        />
      </div>
    </>
  );
};

export default TenantDashboard; 