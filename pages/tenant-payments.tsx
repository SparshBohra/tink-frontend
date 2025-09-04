import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { apiClient } from '../lib/api';
import { PaymentHistoryResponse, PaymentRecord, Lease } from '../lib/types';
import PaymentForm from '../components/PaymentForm';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { CheckCircle, Clock, AlertCircle, CreditCard, Calendar, ArrowLeft } from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface TenantUser {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  is_verified: boolean;
}

function TenantPayments() {
  const router = useRouter();
  
  // Data state
  const [lease, setLease] = useState<Lease | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<TenantUser | null>(null);
  
  // UI state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Check authentication on component mount
  useEffect(() => {
    const accessToken = localStorage.getItem('tenant_access_token');
    const userStr = localStorage.getItem('tenant_user');

    if (!accessToken || !userStr) {
      window.location.href = 'https://portal.squareft.ai/tenant-login';
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      
      // Load tenant data after authentication check
      loadTenantData();
    } catch (error) {
      console.error('Error parsing user data:', error);
      window.location.href = 'https://portal.squareft.ai/tenant-login';
    }
  }, [router]);

  // Load tenant's active lease and payment history
  const loadTenantData = async () => {
    try {
      setLoading(true);
      
      // Get tenant's active lease
      const leasesResponse = await apiClient.getTenantLeases();
      const activeLease = leasesResponse.find(l => l.status === 'active');
      
      if (activeLease) {
        setLease(activeLease);
      }
      
      // Load payment history
      const paymentData: PaymentHistoryResponse = await apiClient.getPaymentHistory({ page: 1, page_size: 20 });
      setPaymentHistory(paymentData.payments);
      
    } catch (err: any) {
      console.error('Failed to load tenant data:', err);
      setError(err.message || 'Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    setPaymentSuccess(true);
    setSuccessMessage(`Payment successful! Transaction ID: ${paymentIntentId}`);
    setShowPaymentModal(false);
    
    // Refresh payment history
    try {
      const paymentData: PaymentHistoryResponse = await apiClient.getPaymentHistory({ page: 1, page_size: 20 });
      setPaymentHistory(paymentData.payments);
    } catch (err) {
      console.error('Failed to refresh payment history:', err);
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    setError(error);
  };

  const getCurrentMonthPeriod = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  };

  const getCurrentMonthPayment = () => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    return paymentHistory.find(payment => 
      payment.rent_period_start.startsWith(currentMonth) && 
      payment.status === 'succeeded'
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment information...</p>
        </div>
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Active Lease Found</h2>
          <p className="text-gray-600 mb-4">
            You don't have an active lease associated with your account. 
            Please contact your property manager.
          </p>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  const currentMonthPayment = getCurrentMonthPayment();
  const rentDue = currentMonthPayment ? 0 : lease.monthly_rent;

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Rent Payments - Tenant Portal</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            onClick={() => window.location.href = 'https://portal.squareft.ai/tenant-dashboard'}
            className="mb-4 bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Rent Payments</h1>
          <p className="text-gray-600 mt-2">Manage your rent payments and view payment history</p>
        </div>

        {/* Success Message */}
        {paymentSuccess && (
          <Card className="p-4 mb-6 border-green-200 bg-green-50">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-green-800 font-medium">Payment Successful!</p>
                <p className="text-green-700 text-sm">{successMessage}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="p-4 mb-6 border-red-200 bg-red-50">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Current Rent Status */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Current Rent Status</h2>
              <div className="space-y-1">
                                 <p className="text-gray-600">
                   Property {lease.property_ref} - Room {lease.room || 'N/A'}
                 </p>
                <p className="text-2xl font-bold text-gray-900">
                  {rentDue > 0 ? formatCurrency(rentDue) : 'Paid'}
                </p>
                {rentDue > 0 ? (
                  <p className="text-red-600 font-medium">Due for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                ) : (
                  <p className="text-green-600 font-medium">
                    ✓ Paid for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
            <div>
              {rentDue > 0 && (
                <Button
                  onClick={() => setShowPaymentModal(true)}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay Now
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Payment History */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
          
          {paymentHistory.length > 0 ? (
            <div className="space-y-4">
              {paymentHistory.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(payment.status)}
                    <div>
                      <p className="font-medium text-gray-900">{formatCurrency(payment.amount_dollars)}</p>
                      <p className="text-sm text-gray-600">{payment.description}</p>
                      <p className="text-xs text-gray-500">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {formatDate(payment.payment_date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>
                    {payment.status === 'succeeded' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Net: {formatCurrency(payment.net_amount_dollars)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No payment history yet</p>
              <p className="text-sm text-gray-500">Your payments will appear here once you make them</p>
            </div>
          )}
        </Card>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full">
            <Elements stripe={stripePromise}>
                             <PaymentForm
                 leaseId={lease.id}
                 amount={lease.monthly_rent}
                 landlordName="Landlord"
                 propertyName={`Property ${lease.property_ref}`}
                 rentPeriod={getCurrentMonthPeriod()}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                onCancel={() => {
                  setShowPaymentModal(false);
                  setError(null);
                }}
              />
            </Elements>
          </div>
        </div>
      )}
    </div>
  );
}

export default TenantPayments; 