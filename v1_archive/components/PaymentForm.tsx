import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { apiClient } from '../lib/api';
import { PaymentIntentRequest, PaymentIntentResponse, PaymentError } from '../lib/types';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { AlertCircle, CheckCircle, CreditCard, Loader2 } from 'lucide-react';

interface PaymentFormProps {
  leaseId: number;
  amount: number;
  landlordName: string;
  propertyName: string | null;
  rentPeriod: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  leaseId,
  amount,
  landlordName,
  propertyName,
  rentPeriod,
  onSuccess,
  onError,
  onCancel
}) => {
  const stripe = useStripe();
  const elements = useElements();
  
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentResponse | null>(null);
  const [cardComplete, setCardComplete] = useState(false);

  // Create payment intent when component mounts
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const request: PaymentIntentRequest = {
          lease_id: leaseId,
          rent_period_start: rentPeriod,
          amount: amount
        };

        const response = await apiClient.createRentPaymentIntent(request);
        setPaymentIntent(response);
      } catch (err: any) {
        console.error('Failed to create payment intent:', err);
        const errorMsg = err.error || err.message || 'Failed to initialize payment';
        setError(errorMsg);
        onError(errorMsg);
      }
    };

    createPaymentIntent();
  }, [leaseId, amount, rentPeriod, onError]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !paymentIntent) {
      setError('Payment system not ready. Please try again.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found. Please refresh and try again.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Confirm the payment with Stripe
      const result = await stripe.confirmCardPayment(paymentIntent.client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: 'Tenant', // You might want to pass actual tenant name
          },
        },
      });

      if (result.error) {
        // Payment failed
        const errorMessage = result.error.message || 'Payment failed';
        setError(errorMessage);
        onError(errorMessage);
      } else {
        // Payment succeeded
        onSuccess(result.paymentIntent.id);
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        fontFamily: '"Inter", "Segoe UI", Roboto, sans-serif',
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  const handleCardChange = (event: any) => {
    setCardComplete(event.complete);
    if (event.error) {
      setError(event.error.message);
    } else {
      setError(null);
    }
  };

  if (!paymentIntent && !error) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Initializing payment...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 max-w-md mx-auto">
      <div className="space-y-6">
        {/* Payment Summary */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">Rent Payment</h3>
          <div className="mt-2 space-y-1">
            <p className="text-2xl font-bold text-green-600">${amount.toFixed(2)}</p>
            <p className="text-sm text-gray-600">to {landlordName}</p>
            {propertyName && <p className="text-sm text-gray-600">{propertyName}</p>}
            <p className="text-xs text-gray-500">
              Period: {new Date(rentPeriod).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CreditCard className="w-4 h-4 inline mr-2" />
              Card Information
            </label>
            <div className="p-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <CardElement
                options={cardElementOptions}
                onChange={handleCardChange}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={processing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!stripe || processing || !cardComplete || !!error}
              className="flex-1"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay ${amount.toFixed(2)}
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Security Notice */}
        <div className="text-xs text-gray-500 text-center">
          <p>Your payment information is secure and encrypted.</p>
          <p>Powered by Stripe</p>
        </div>
      </div>
    </Card>
  );
};

export default PaymentForm; 