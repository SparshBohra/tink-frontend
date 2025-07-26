import React, { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement, AddressElement } from '@stripe/react-stripe-js';

interface StripePaymentFormProps {
  onSuccess: () => void;
  onClose: () => void;
  rentAmount: number;
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({ onSuccess, onClose, rentAmount }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isElementsReady, setIsElementsReady] = useState(false);

  useEffect(() => {
    if (!stripe || !elements) {
      return;
    }

    // Check if elements are ready
    const checkElementsReady = () => {
      if (stripe && elements) {
        setIsElementsReady(true);
      }
    };

    // Small delay to ensure elements are mounted
    const timer = setTimeout(checkElementsReady, 1000);

    return () => clearTimeout(timer);
  }, [stripe, elements]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      console.error("Stripe.js has not loaded yet.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/tenant-dashboard?payment_success=true`,
      },
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setErrorMessage(error.message || 'An unexpected error occurred.');
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
      console.error('Payment error:', error);
    } else {
      // Payment succeeded, call onSuccess
      onSuccess();
    }

    setIsLoading(false);
  };

  // Show loading state while Stripe Elements are initializing
  if (!stripe || !elements || !isElementsReady) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Amount Due Today</p>
              <p className="text-2xl font-bold text-indigo-600">{formatCurrency(rentAmount)}</p>
            </div>
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 003 3z" />
            </svg>
          </div>
        </div>

        <div className="text-center py-8">
          <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="mt-2 text-gray-600">Loading secure payment form...</p>
          <p className="text-xs text-gray-500 mt-1">
            Stripe: {stripe ? '✓' : '✗'} | Elements: {elements ? '✓' : '✗'} | Ready: {isElementsReady ? '✓' : '✗'}
          </p>
        </div>

        <div className="flex items-center justify-end space-x-4 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Amount Due Today</p>
            <p className="text-2xl font-bold text-indigo-600">{formatCurrency(rentAmount)}</p>
          </div>
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 003 3z" />
          </svg>
        </div>
      </div>

      {/* Payment and Address Elements */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Information
          </label>
          <div className="border border-gray-300 rounded-md p-3 bg-white">
            <PaymentElement 
              id="payment-element"
              options={{
                layout: 'tabs'
              }}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Billing Address
          </label>
          <div className="border border-gray-300 rounded-md p-3 bg-white">
            <AddressElement 
              id="address-element" 
              options={{mode: 'billing'}} 
            />
          </div>
        </div>
      </div>

      {errorMessage && (
        <div id="payment-message" className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <p className="font-medium">Payment Error</p>
              <p className="mt-1">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-4 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          disabled={isLoading || !stripe || !elements}
          id="submit"
          className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span id="button-text">
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </div>
            ) : (
              `Pay ${formatCurrency(rentAmount)}`
            )}
          </span>
        </button>
      </div>
    </form>
  );
};

export default StripePaymentForm; 