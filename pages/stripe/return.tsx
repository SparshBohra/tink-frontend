import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth-context';
import { apiClient } from '../../lib/api';
import { StripeConnectAccountStatus } from '../../lib/types';
import DashboardLayout from '../../components/DashboardLayout';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { CheckCircle, AlertCircle, ArrowLeft, CreditCard } from 'lucide-react';

const StripeReturnPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [accountStatus, setAccountStatus] = useState<StripeConnectAccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccountStatus = async () => {
      try {
        setLoading(true);
        // Wait a moment for Stripe to process the onboarding
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const status = await apiClient.getStripeAccountStatus();
        setAccountStatus(status);
      } catch (err: any) {
        console.error('Failed to fetch account status:', err);
        setError(err.message || 'Failed to fetch account status');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAccountStatus();
    }
  }, [user]);

  const handleContinue = () => {
    router.push('/stripe-connect');
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <DashboardLayout title="Processing Setup">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">Processing Your Setup</h2>
              <p className="text-gray-600">
                We're verifying your information with Stripe. This may take a few moments.
              </p>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Setup Error">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2 text-red-600">Setup Error</h2>
              <p className="text-gray-600 mb-6">
                {error}
              </p>
              <div className="space-y-3">
                <Button onClick={handleContinue} className="w-full">
                  Try Again
                </Button>
                <Button 
                  onClick={handleGoToDashboard}
                  className="w-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Setup Complete">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <div className="text-center">
            {accountStatus?.status === 'active' ? (
              <>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2 text-green-600">
                  Setup Complete!
                </h2>
                <p className="text-gray-600 mb-6">
                  Your Stripe Connect account is now active. You can start accepting payments from tenants.
                </p>
                <div className="bg-green-50 p-4 rounded-lg mb-6">
                  <div className="flex items-center justify-center space-x-2">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Account ID: {accountStatus.account_id}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2 text-yellow-600">
                  Setup In Progress
                </h2>
                <p className="text-gray-600 mb-6">
                  Your Stripe Connect account has been created but is still being verified.
                  {accountStatus?.requirements?.currently_due && accountStatus.requirements.currently_due.length > 0 && (
                    <span className="block mt-2">
                      You have {accountStatus.requirements.currently_due.length} pending requirements to complete.
                    </span>
                  )}
                </p>
                <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                  <div className="flex items-center justify-center space-x-2">
                    <CreditCard className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      Status: {accountStatus?.status?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-3">
              <Button onClick={handleGoToDashboard} className="w-full">
                Go to Dashboard
              </Button>
              <Button 
                onClick={handleContinue}
                className="w-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Payment Setup
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StripeReturnPage; 