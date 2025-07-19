import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth, withAuth } from '../lib/auth-context';

function TenantPayments() {
  const { user } = useAuth();
  const [rentDue, setRentDue] = useState(1250);
  const [daysUntilDue, setDaysUntilDue] = useState(8);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([
    {
      id: 1,
      date: '2024-01-01',
      amount: 1250,
      method: 'Credit Card',
      status: 'Paid',
      reference: 'TXN001'
    },
    {
      id: 2,
      date: '2023-12-01',
      amount: 1250,
      method: 'Bank Transfer',
      status: 'Paid',
      reference: 'TXN002'
    }
  ]);

  const handlePayment = async () => {
    if (!paymentAmount || !paymentMethod) {
      alert('Please fill in all payment details');
      return;
    }

    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      const newPayment = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
        status: 'Paid',
        reference: `TXN${Date.now().toString().slice(-6)}`
      };
      
      setPaymentHistory([newPayment, ...paymentHistory]);
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentMethod('');
      setIsProcessing(false);
      
      // Update rent due if full payment
      if (parseFloat(paymentAmount) >= rentDue) {
        setRentDue(0);
        setDaysUntilDue(30); // Reset to next month
      } else {
        setRentDue(rentDue - parseFloat(paymentAmount));
      }
      
      alert('Payment processed successfully!');
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'var(--success-green)';
      case 'Pending': return 'var(--warning-amber)';
      case 'Failed': return 'var(--error-red)';
      default: return 'var(--gray-500)';
    }
  };

  return (
    <div className="tenant-payments">
      <Head>
        <title>Rent Payments - Tenant Portal</title>
      </Head>

      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Rent Payments</h1>
        <p className="page-subtitle">Manage your rent payments and view payment history</p>
      </div>

      {/* Current Rent Due */}
      <div className="rent-due-section">
        <div className="rent-due-card">
          <div className="rent-due-header">
            <h2 className="rent-due-title">Current Rent Due</h2>
            <div className="rent-due-amount">${rentDue.toFixed(2)}</div>
          </div>
          <div className="rent-due-details">
            <div className="rent-due-info">
              <p className="rent-due-property">Sunset Gardens Apartments - Room A101</p>
              <p className="rent-due-date">
                {rentDue > 0 ? (
                  daysUntilDue > 0 ? (
                    <span className="due-upcoming">Due in {daysUntilDue} days</span>
                  ) : (
                    <span className="due-overdue">Overdue by {Math.abs(daysUntilDue)} days</span>
                  )
                ) : (
                  <span className="due-paid">Paid for this month</span>
                )}
              </p>
            </div>
            {rentDue > 0 && (
              <button
                className="btn btn-primary pay-now-btn"
                onClick={() => {
                  setPaymentAmount(rentDue.toString());
                  setShowPaymentModal(true);
                }}
              >
                Pay Now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="payment-history-section">
        <div className="section-header">
          <h2 className="section-title">Payment History</h2>
          <button
            className="btn btn-secondary"
            onClick={() => setShowPaymentModal(true)}
          >
            Make Payment
          </button>
        </div>
        
        <div className="payment-history-table">
          <div className="table-header">
            <div className="table-cell">Date</div>
            <div className="table-cell">Amount</div>
            <div className="table-cell">Method</div>
            <div className="table-cell">Status</div>
            <div className="table-cell">Reference</div>
          </div>
          
          {paymentHistory.map((payment) => (
            <div key={payment.id} className="table-row">
              <div className="table-cell">{payment.date}</div>
              <div className="table-cell">${payment.amount.toFixed(2)}</div>
              <div className="table-cell">{payment.method}</div>
              <div className="table-cell">
                <span 
                  className="status-badge"
                  style={{ color: getStatusColor(payment.status) }}
                >
                  {payment.status}
                </span>
              </div>
              <div className="table-cell">{payment.reference}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Make a Payment</h3>
              <button
                className="modal-close"
                onClick={() => setShowPaymentModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Payment Amount</label>
                <input
                  type="number"
                  className="form-input"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  step="0.01"
                  min="0"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select
                  className="form-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="">Select payment method</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Debit Card">Debit Card</option>
                </select>
              </div>
              
              <div className="quick-amounts">
                <span className="quick-amounts-label">Quick amounts:</span>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setPaymentAmount(rentDue.toString())}
                >
                  Full Rent (${rentDue})
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setPaymentAmount((rentDue / 2).toString())}
                >
                  Half Rent (${rentDue / 2})
                </button>
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowPaymentModal(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handlePayment}
                disabled={isProcessing || !paymentAmount || !paymentMethod}
              >
                {isProcessing ? 'Processing...' : 'Pay Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .tenant-payments {
          width: 100%;
          padding: 32px 40px 20px 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          box-sizing: border-box;
        }

        .page-header {
          margin-bottom: 24px;
        }

        .page-title {
          font-size: 22px;
          font-weight: 700;
          color: white;
          margin: 0 0 4px 0;
          line-height: 1.15;
        }

        .page-subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
          line-height: 1.45;
        }

        .rent-due-section {
          margin-bottom: 20px;
        }

        .rent-due-card {
          background: white;
          border-radius: 16px;
          padding: 18px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        .rent-due-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .rent-due-title {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .rent-due-amount {
          font-size: 24px;
          font-weight: 700;
          color: #4f46e5;
        }

        .rent-due-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .rent-due-info {
          flex: 1;
        }

        .rent-due-property {
          font-size: 14px;
          color: #374151;
          margin: 0 0 6px 0;
        }

        .rent-due-date {
          margin: 0;
        }

        .due-upcoming {
          color: #d97706;
          font-weight: 600;
        }

        .due-overdue {
          color: #dc2626;
          font-weight: 600;
        }

        .due-paid {
          color: #10b981;
          font-weight: 600;
        }

        .pay-now-btn {
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 600;
          background: #4f46e5;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pay-now-btn:hover {
          background: #3730a3;
        }

        .payment-history-section {
          background: white;
          border-radius: 16px;
          padding: 18px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .payment-history-table {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
        }

        .table-header {
          background: #f8fafc;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
          font-weight: 600;
          color: #64748b;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .table-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
          border-top: 1px solid #f1f5f9;
          transition: all 0.2s ease;
        }

        .table-row:hover {
          background: #f9fafb;
        }

        .table-cell {
          padding: 12px;
          display: flex;
          align-items: center;
          font-size: 14px;
          color: #374151;
        }

        .status-badge {
          font-weight: 600;
          font-size: 12px;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #64748b;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close:hover {
          color: #374151;
        }

        .modal-body {
          padding: 20px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          font-weight: 500;
          color: #374151;
          margin-bottom: 6px;
          font-size: 14px;
        }

        .form-input,
        .form-select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          color: #374151;
          background: white;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }

        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .quick-amounts {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
        }

        .quick-amounts-label {
          font-size: 12px;
          color: #64748b;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px;
          border-top: 1px solid #e2e8f0;
        }

        .btn {
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          text-decoration: none;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #4f46e5;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #3730a3;
        }

        .btn-secondary {
          background: #f9fafb;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #f3f4f6;
        }

        .btn-outline {
          background: transparent;
          border: 1px solid #d1d5db;
          color: #374151;
        }

        .btn-outline:hover:not(:disabled) {
          background: #f9fafb;
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
        }

        @media (max-width: 768px) {
          .tenant-payments {
            padding: 24px 20px 20px 20px;
          }

          .rent-due-details {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }

          .section-header {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }

          .table-header,
          .table-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .table-cell {
            padding: 8px;
          }
        }
      `}</style>
    </div>
  );
}

export default withAuth(TenantPayments, ['tenant']); 