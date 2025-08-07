import React, { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement, AddressElement } from '@stripe/react-stripe-js';
import { 
  CreditCard, 
  MapPin, 
  Loader2, 
  CheckCircle,
  AlertCircle 
} from 'lucide-react';

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Loading Payment Form */}
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '3rem',
            height: '3rem',
            backgroundColor: '#f3f4f6',
            borderRadius: '50%',
            marginBottom: '1rem'
          }}>
            <Loader2 style={{ 
              width: '1.5rem', 
              height: '1.5rem', 
              color: '#2563eb',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
          <p style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', margin: '0 0 0.5rem 0' }}>
            Loading Payment Form
          </p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
            Stripe: {stripe ? '✓' : '✗'} | Elements: {elements ? '✓' : '✗'} | Ready: {isElementsReady ? '✓' : '✗'}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              backgroundColor: '#f9fafb',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.borderColor = '#9ca3af';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Payment Information Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <CreditCard style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />
            <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
            Payment Information
          </label>
          </div>
          <div style={{
            border: '2px solid #e5e7eb',
            borderRadius: '0.75rem',
            padding: '1rem',
            backgroundColor: '#ffffff',
            transition: 'border-color 0.2s'
          }}>
            <PaymentElement 
              id="payment-element"
              options={{
                layout: 'tabs'
              }}
            />
          </div>
        </div>
        
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <MapPin style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />
            <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
            Billing Address
          </label>
          </div>
          <div style={{
            border: '2px solid #e5e7eb',
            borderRadius: '0.75rem',
            padding: '1rem',
            backgroundColor: '#ffffff',
            transition: 'border-color 0.2s'
          }}>
            <AddressElement 
              id="address-element" 
              options={{mode: 'billing'}} 
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fca5a5',
          borderRadius: '0.75rem',
          padding: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <AlertCircle style={{ width: '1.25rem', height: '1.25rem', color: '#ef4444', flexShrink: 0, marginTop: '0.125rem' }} />
            <div>
              <p style={{ fontWeight: '600', color: '#dc2626', margin: '0 0 0.25rem 0' }}>Payment Error</p>
              <p style={{ fontSize: '0.875rem', color: '#dc2626', margin: 0 }}>{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem' }}>
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            backgroundColor: '#f9fafb',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.5 : 1,
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.borderColor = '#9ca3af';
            }
          }}
          onMouseOut={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.borderColor = '#d1d5db';
            }
          }}
        >
          Cancel
        </button>
        <button
          disabled={isLoading || !stripe || !elements}
          id="submit"
          type="submit"
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: 'white',
            background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: (isLoading || !stripe || !elements) ? 'not-allowed' : 'pointer',
            opacity: (isLoading || !stripe || !elements) ? 0.6 : 1,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            minWidth: '140px'
          }}
          onMouseOver={(e) => {
            if (!isLoading && stripe && elements) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #1d4ed8, #1e40af)';
            }
          }}
          onMouseOut={(e) => {
            if (!isLoading && stripe && elements) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb, #1d4ed8)';
            }
          }}
        >
            {isLoading ? (
            <>
              <Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
                Processing...
            </>
            ) : (
            <>
              <CreditCard style={{ width: '1rem', height: '1rem' }} />
              Pay {formatCurrency(rentAmount)}
            </>
            )}
        </button>
      </div>

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  );
};

export default StripePaymentForm; 