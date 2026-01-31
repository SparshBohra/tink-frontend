import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe, Appearance } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { 
  X, 
  CreditCard, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  DollarSign,
  Shield,
  Clock
} from 'lucide-react';
import StripePaymentForm from './StripePaymentForm';
import { TenantProfile } from '../lib/types';
import { apiClient } from '../lib/api';

// Load Stripe outside of component render to avoid re-creating the Stripe object on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  lease: any | null;
  onPaymentSuccess?: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, lease, onPaymentSuccess }) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen && lease && lease.status === 'active') {
      createPaymentIntent();
    } else {
      // Reset when modal is closed or there's no active lease
      setClientSecret(null);
      setPaymentIntentId(null);
      setError('');
    }
  }, [isOpen, lease]);

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
      colorPrimary: '#2563eb',
      colorBackground: '#ffffff',
      colorText: '#374151',
      colorDanger: '#ef4444',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  };

  const options = clientSecret ? {
    clientSecret,
    appearance,
  } : undefined;

  return (
    <>
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
        onClick={onClose}
      >
        {/* Modal */}
        <div 
          style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            width: '100%',
            maxWidth: '28rem',
            maxHeight: '90vh',
            overflow: 'hidden',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #2563eb, #1e40af)',
            padding: '2rem 2rem 1rem 2rem',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.5rem',
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CreditCard style={{ width: '1.5rem', height: '1.5rem' }} />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Pay Your Rent</h3>
                </div>
                <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: 0 }}>
                  Secure payment powered by Stripe
                </p>
              </div>
              <button 
                onClick={onClose}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.5rem',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
              >
                <X style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
        </div>

            {/* Amount Display */}
            {lease && (
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '0.75rem',
                padding: '1rem',
                marginTop: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
                    <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: '0 0 0.25rem 0' }}>Amount Due</p>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
                      ${lease.monthly_rent || '0'}.00
                    </p>
                  </div>
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    padding: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <DollarSign style={{ width: '1.5rem', height: '1.5rem' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Body */}
          <div style={{ padding: '2rem', maxHeight: '60vh', overflowY: 'auto' }}>
            {/* No Lease Warning */}
          {!lease && (
              <div style={{
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '0.75rem',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <AlertCircle style={{ width: '1.25rem', height: '1.25rem', color: '#f59e0b', flexShrink: 0, marginTop: '0.125rem' }} />
                  <div>
                    <p style={{ fontWeight: '600', color: '#92400e', margin: '0 0 0.25rem 0' }}>No Lease Found</p>
                    <p style={{ fontSize: '0.875rem', color: '#92400e', margin: 0 }}>
                      You don't have an active lease to make payments against.
                    </p>
                </div>
              </div>
            </div>
          )}

            {/* Inactive Lease Warning */}
          {lease && lease.status !== 'active' && (
              <div style={{
                backgroundColor: '#dbeafe',
                border: '1px solid #3b82f6',
                borderRadius: '0.75rem',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <Clock style={{ width: '1.25rem', height: '1.25rem', color: '#3b82f6', flexShrink: 0, marginTop: '0.125rem' }} />
                  <div>
                    <p style={{ fontWeight: '600', color: '#1e40af', margin: '0 0 0.25rem 0' }}>Lease Not Active</p>
                    <p style={{ fontSize: '0.875rem', color: '#1e40af', margin: 0 }}>
                      Your lease must be active before you can make payments. Current status: <span style={{ fontWeight: '600' }}>{lease.status}</span>
                    </p>
                </div>
              </div>
            </div>
          )}

            {/* Loading State */}
          {loading && (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '4rem',
                  height: '4rem',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '50%',
                  marginBottom: '1rem'
                }}>
                  <Loader2 style={{ 
                    width: '2rem', 
                    height: '2rem', 
                    color: '#2563eb',
                    animation: 'spin 1s linear infinite'
                  }} />
                </div>
                <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: '0 0 0.5rem 0' }}>
                  Initializing Payment
                </p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                  Setting up secure payment with Stripe...
                </p>
            </div>
          )}

            {/* Error State */}
          {error && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fca5a5',
                borderRadius: '0.75rem',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <AlertCircle style={{ width: '1.25rem', height: '1.25rem', color: '#ef4444', flexShrink: 0, marginTop: '0.125rem' }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '600', color: '#dc2626', margin: '0 0 0.5rem 0' }}>Payment Setup Error</p>
                    <p style={{ fontSize: '0.875rem', color: '#dc2626', margin: '0 0 1rem 0' }}>{error}</p>
                  <button
                    onClick={createPaymentIntent}
                      style={{
                        backgroundColor: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

            {/* Payment Form */}
          {clientSecret && options && lease && lease.status === 'active' && (
              <div>
                {/* Security Notice */}
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #22c55e',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Shield style={{ width: '1.25rem', height: '1.25rem', color: '#22c55e' }} />
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#166534', margin: 0 }}>
                        🔒 Your payment is secured by Stripe's industry-leading encryption
                      </p>
                    </div>
                  </div>
                </div>

            <Elements options={options} stripe={stripePromise}>
              <StripePaymentForm 
                onSuccess={handlePaymentSuccess} 
                onClose={onClose} 
                rentAmount={lease?.monthly_rent || 0}
              />
            </Elements>
              </div>
          )}
        </div>
      </div>
    </div>

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default PaymentModal; 