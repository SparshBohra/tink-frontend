import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe, Appearance } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentForm from './StripePaymentForm'; // We will create this next
import { TenantProfile } from '../lib/types';
import { apiClient } from '../lib/api';

// Load Stripe outside of component render to avoid re-creating the Stripe object on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantProfile: TenantProfile | null;
  onPaymentSuccess?: () => void; // New callback for payment success
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, tenantProfile, onPaymentSuccess }) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null); // Store payment intent ID
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen && tenantProfile?.active_lease) {
      createPaymentIntent();
    } else {
      // Reset when modal is closed or there's no lease
      setClientSecret(null);
      setPaymentIntentId(null);
      setError('');
    }
  }, [isOpen, tenantProfile]);

  const createPaymentIntent = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.createTenantRentPaymentIntent();

      if (response.client_secret) {
        setClientSecret(response.client_secret);
        
        // Extract payment intent ID from client secret (format: pi_xxxxx_secret_yyyyy)
        const piId = response.client_secret.split('_secret_')[0];
        setPaymentIntentId(piId);
      } else {
        // @ts-ignore
        const errorMessage = response.error || 'Failed to initialize payment.';
        setError(errorMessage);
        console.error('Payment Intent Error:', response);
      }
    } catch (err: any) {
      // Handle 401 errors specifically
      if (err.response?.status === 401) {
        setError('Your session has expired. Please logout and login again to continue with payment.');
      } else {
        const errorMessage = err.response?.data?.error || 'An unexpected error occurred.';
        setError(errorMessage);
      }
      console.error('Create Payment Intent failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    console.log("Payment successful! Processing...");
    
    // Mark payment as processed in the backend (for testing without webhooks)
    if (paymentIntentId) {
      try {
        const result = await apiClient.markTenantPaymentProcessed(paymentIntentId);
        console.log('Payment marked as processed:', result);
      } catch (error) {
        console.error('Failed to mark payment as processed:', error);
        // Don't fail the whole flow if this fails
      }
    }
    
    // Notify parent component of successful payment
    if (onPaymentSuccess) {
      onPaymentSuccess();
    }
    
    onClose(); // Close the modal on success
  };

  if (!isOpen) {
    return null;
  }

  const appearance: Appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#4f46e5',
      colorBackground: '#ffffff',
      colorText: '#374151',
      colorDanger: '#ef4444',
      fontFamily: 'Inter, sans-serif',
      spacingUnit: '4px',
      borderRadius: '6px',
    },
  };

  // The options object should not be created if clientSecret is null
  const options = clientSecret ? {
    clientSecret,
    appearance,
  } : undefined;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative mx-auto p-8 border w-full max-w-md shadow-lg rounded-md bg-white">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Pay Your Rent</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div>
          {loading && (
            <div className="text-center py-8">
              <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="mt-2 text-gray-600">Initializing secure payment...</p>
              <p className="text-xs text-gray-500 mt-1">Setting up payment intent with Stripe</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3 text-center w-full">
                  <p className="text-sm text-red-800 font-medium">Payment Setup Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <button
                    onClick={createPaymentIntent}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {clientSecret && options && (
            <Elements options={options} stripe={stripePromise}>
              <StripePaymentForm 
                onSuccess={handlePaymentSuccess} 
                onClose={onClose} 
                rentAmount={tenantProfile?.active_lease?.monthly_rent || 0}
              />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal; 