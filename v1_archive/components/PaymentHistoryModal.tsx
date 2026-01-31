import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  CreditCard, 
  Calendar,
  Loader2,
  DollarSign,
  Receipt,
  TrendingUp,
  FileText
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { PaymentHistoryResponse, PaymentRecord } from '../lib/types';

interface PaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PaymentHistoryModal: React.FC<PaymentHistoryModalProps> = ({ isOpen, onClose }) => {
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load payment history when modal opens
  useEffect(() => {
    if (isOpen) {
      loadPaymentHistory();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const loadPaymentHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const paymentData: PaymentHistoryResponse = await apiClient.getPaymentHistory({ page: 1, page_size: 50 });
      setPaymentHistory(paymentData.payments);
    } catch (err: any) {
      console.error('Failed to load payment history:', err);
      setError('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle style={{ width: '1.25rem', height: '1.25rem', color: '#16a34a' }} />;
      case 'pending':
        return <Clock style={{ width: '1.25rem', height: '1.25rem', color: '#f59e0b' }} />;
      case 'failed':
        return <AlertCircle style={{ width: '1.25rem', height: '1.25rem', color: '#ef4444' }} />;
      default:
        return <Clock style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded': 
        return { backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' };
      case 'pending': 
        return { backgroundColor: '#fefce8', color: '#ca8a04', border: '1px solid #fde047' };
      case 'failed': 
        return { backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' };
      default: 
        return { backgroundColor: '#f9fafb', color: '#374151', border: '1px solid #d1d5db' };
    }
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
      month: 'short',
      day: 'numeric'
    });
  };

  const getTotalPaid = () => {
    return paymentHistory
      .filter(payment => payment.status === 'succeeded')
      .reduce((total, payment) => total + payment.amount_dollars, 0);
  };

  const getSuccessfulPaymentsCount = () => {
    return paymentHistory.filter(payment => payment.status === 'succeeded').length;
  };

  if (!isOpen) return null;

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
            maxWidth: '56rem',
            maxHeight: '90vh',
            overflow: 'hidden',
            position: 'relative'
          }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
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
                    <Receipt style={{ width: '1.5rem', height: '1.5rem' }} />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Payment History</h3>
                </div>
                <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: 0 }}>
                  Track all your rent payments and transaction history
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
            
            {/* Summary Cards */}
            {!loading && !error && paymentHistory.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginTop: '1.5rem'
              }}>
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <DollarSign style={{ width: '1.25rem', height: '1.25rem' }} />
                    <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total Paid</span>
                  </div>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                    {formatCurrency(getTotalPaid())}
                  </p>
                </div>
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <TrendingUp style={{ width: '1.25rem', height: '1.25rem' }} />
                    <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Payments Made</span>
                  </div>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                    {getSuccessfulPaymentsCount()}
                  </p>
                </div>
              </div>
            )}
        </div>

        {/* Content */}
          <div style={{ padding: '2rem', maxHeight: '60vh', overflowY: 'auto' }}>
          {loading ? (
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
                    color: '#16a34a',
                    animation: 'spin 1s linear infinite'
                  }} />
                </div>
                <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: '0 0 0.5rem 0' }}>
                  Loading Payment History
                </p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                  Retrieving your transaction records...
                </p>
            </div>
          ) : error ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '4rem',
                  height: '4rem',
                  backgroundColor: '#fef2f2',
                  borderRadius: '50%',
                  marginBottom: '1rem'
                }}>
                  <AlertCircle style={{ width: '2rem', height: '2rem', color: '#ef4444' }} />
                </div>
                <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#dc2626', margin: '0 0 0.5rem 0' }}>
                  Failed to Load History
                </p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 1.5rem 0' }}>
                  {error}
                </p>
              <button
                onClick={loadPaymentHistory}
                  style={{
                    backgroundColor: '#16a34a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    margin: '0 auto',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
              >
                Try Again
              </button>
            </div>
          ) : paymentHistory.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {paymentHistory.map((payment) => (
                  <div 
                    key={payment.id} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1.5rem',
                      border: '2px solid #f3f4f6',
                      borderRadius: '0.75rem',
                      backgroundColor: 'white',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#f3f4f6';
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '3rem',
                        height: '3rem',
                        backgroundColor: payment.status === 'succeeded' ? '#f0fdf4' : 
                                       payment.status === 'pending' ? '#fefce8' : '#fef2f2',
                        borderRadius: '50%'
                      }}>
                    {getStatusIcon(payment.status)}
                      </div>
                    <div>
                        <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: '0 0 0.25rem 0' }}>
                          {formatCurrency(payment.amount_dollars)}{payment.amount_dollars > 20000 ? '' : '/mo'}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>
                          {payment.description || (payment.amount_dollars > 20000 ? 'Property Payment' : 'Monthly Rent Payment')}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar style={{ width: '0.875rem', height: '0.875rem', color: '#9ca3af' }} />
                          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        {formatDate(payment.payment_date)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        ...getStatusColor(payment.status),
                        padding: '0.5rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        marginBottom: '0.5rem'
                      }}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                  </div>
                    {payment.status === 'succeeded' && payment.net_amount_dollars && (
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                        Net: {formatCurrency(payment.net_amount_dollars)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
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
                  <CreditCard style={{ width: '2rem', height: '2rem', color: '#9ca3af' }} />
                </div>
                <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: '0 0 0.5rem 0' }}>
                  No Payment History Yet
                </p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                  Your payment transactions will appear here once you make them
                </p>
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

export default PaymentHistoryModal; 