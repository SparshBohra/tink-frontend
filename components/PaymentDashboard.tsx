import React, { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { PaymentSummaryResponse, PaymentHistoryResponse } from '../lib/types';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  CreditCard,
  ArrowRight,
  Download,
  Filter,
  Loader2
} from 'lucide-react';

interface PaymentDashboardProps {
  className?: string;
}

const PaymentDashboard: React.FC<PaymentDashboardProps> = ({ className = '' }) => {
  const [summary, setSummary] = useState<PaymentSummaryResponse | null>(null);
  const [recentPayments, setRecentPayments] = useState<PaymentHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Load payment summary and recent payments in parallel
        const [summaryData, paymentsData] = await Promise.all([
          apiClient.getLandlordPaymentSummary(),
          apiClient.getPaymentHistory({ page: 1, page_size: 10 })
        ]);
        
        setSummary(summaryData);
        setRecentPayments(paymentsData);
      } catch (err: any) {
        console.error('Failed to load payment dashboard:', err);
        setError(err.message || 'Failed to load payment data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
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
      <Card className={`p-8 ${className}`}>
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading payment data...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-8 ${className}`}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Payment Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary ? formatCurrency(summary.summary.current_month_total_dollars) : '$0.00'}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Last 30 Days</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary ? formatCurrency(summary.summary.last_30_days_total_dollars) : '$0.00'}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary ? summary.summary.total_successful_payments : 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary ? summary.summary.pending_payments : 0}
              </p>
              {summary && summary.summary.failed_payments > 0 && (
                <p className="text-sm text-red-600 mt-1">
                  {summary.summary.failed_payments} failed
                </p>
              )}
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Payments */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {recentPayments && recentPayments.payments.length > 0 ? (
          <div className="space-y-4">
            {recentPayments.payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(payment.status)}
                  <div>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(payment.amount_dollars)}
                    </p>
                    <p className="text-sm text-gray-600">
                      from {payment.tenant_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {payment.property_name} • {formatDate(payment.payment_date)}
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

            {/* View All Link */}
            <div className="pt-4 border-t border-gray-200">
              <Button variant="outline" className="w-full">
                <ArrowRight className="w-4 h-4 mr-2" />
                View All Payments
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No payments yet</h4>
            <p className="text-gray-600">
              When tenants make payments, they'll appear here
            </p>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="justify-start">
            <Users className="w-4 h-4 mr-2" />
            Send Payment Reminders
          </Button>
          <Button variant="outline" className="justify-start">
            <Download className="w-4 h-4 mr-2" />
            Download Reports
          </Button>
          <Button variant="outline" className="justify-start">
            <Calendar className="w-4 h-4 mr-2" />
            View Rent Roll
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PaymentDashboard; 