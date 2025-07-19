import React, { useState, useEffect } from 'react';
import { ConnectAccountOnboarding, ConnectComponentsProvider } from '@stripe/react-connect-js';
import { loadConnectAndInitialize } from '@stripe/connect-js';
import { useAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';
import { StripeConnectAccountStatus, StripeConnectAccountData } from '../lib/types';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { AlertCircle, CheckCircle, CreditCard, Shield, Users, ArrowRight, Zap } from 'lucide-react';

interface StripeConnectOnboardingProps {
  onComplete?: (accountId: string) => void;
  onError?: (error: string) => void;
}

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="flex items-start p-4 bg-gray-50 rounded-lg">
    <div className="flex-shrink-0 mr-4">
      {icon}
    </div>
    <div>
      <h4 className="font-semibold text-gray-800">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  </div>
);

const StripeConnectOnboarding: React.FC<StripeConnectOnboardingProps> = ({ 
  onComplete, 
  onError 
}) => {
  const { user } = useAuth();
  const [accountStatus, setAccountStatus] = useState<StripeConnectAccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stripeConnectInstance, setStripeConnectInstance] = useState<any>(null);
  const [showEmbedded, setShowEmbedded] = useState(false);
  const [embeddedLoading, setEmbeddedLoading] = useState(false);

  // Fetch account status on component mount
  useEffect(() => {
    const fetchAccountStatus = async () => {
      try {
        setLoading(true);
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

  // Create Stripe Connect account
  const handleCreateAccount = async () => {
    try {
      setLoading(true);
      setError(null);

      const accountData: StripeConnectAccountData = {
        business_type: 'individual',
        email: user?.email || '',
        phone: '+15551234567',
        address: {
          line1: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          postal_code: '94111',
          country: 'US'
        }
      };

      const response = await apiClient.createStripeConnectedAccount(accountData);
      
      const status = await apiClient.getStripeAccountStatus();
      setAccountStatus(status);

      if (onComplete) {
        onComplete(response.account_id);
      }
    } catch (err: any) {
      console.error('Failed to create account:', err);
      const errorMessage = err.message || 'Failed to create Stripe account';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Start embedded onboarding
  const handleStartEmbeddedOnboarding = async () => {
    try {
      setEmbeddedLoading(true);
      setError(null);

      if (!accountStatus?.account_id) {
        throw new Error('No account ID available');
      }

      const session = await apiClient.createStripeAccountSession({
        account_id: accountStatus.account_id,
        refresh_url: `${window.location.origin}/stripe/refresh`,
        return_url: `${window.location.origin}/stripe/return`,
      });

      const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (!publishableKey) {
        throw new Error('Stripe publishable key not found');
      }

      const stripeInstance = await loadConnectAndInitialize({
        publishableKey,
        fetchClientSecret: async () => session.client_secret,
      });

      setStripeConnectInstance(stripeInstance);
      setShowEmbedded(true);
    } catch (err: any) {
      console.error('Failed to start embedded onboarding:', err);
      const errorMessage = err.message || 'Failed to start onboarding';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setEmbeddedLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-800">An Error Occurred</h3>
          <p className="text-gray-600 mt-2">{error}</p>
          <Button 
            onClick={() => {
              setError(null);
              setShowEmbedded(false);
              const fetchStatus = async () => {
                setLoading(true);
                const status = await apiClient.getStripeAccountStatus();
                setAccountStatus(status);
                setLoading(false);
              };
              fetchStatus();
            }}
            className="mt-6"
          >
            Try Again
          </Button>
        </div>
      </Card>
    );
  }
  
  if (showEmbedded && stripeConnectInstance) {
    return (
      <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
        <ConnectAccountOnboarding
          onExit={() => {
            setShowEmbedded(false);
            setStripeConnectInstance(null);
            const fetchStatus = async () => {
              setLoading(true);
              const status = await apiClient.getStripeAccountStatus();
              setAccountStatus(status);
              setLoading(false);
            };
            fetchStatus();
          }}
          onLoadError={(error) => {
            console.error('Onboarding load error:', error);
            setError('Failed to load onboarding form');
            setShowEmbedded(false);
            setStripeConnectInstance(null);
          }}
        />
      </ConnectComponentsProvider>
    );
  }

  return (
    <Card className="p-8 space-y-6">
      {/* Header with Stripe Logo */}
      <div className="text-center pb-4 border-b border-gray-100">
        <div className="flex items-center justify-center mb-3">
          <div className="bg-[#6772E5] p-3 rounded-lg mr-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M13.976 9.15c-2.172-.806-3.596-1.191-3.596-2.705 0-1.091.7-1.852 2.161-1.852 1.495 0 2.91.694 2.91 1.727 0 .694-.652 1.183-1.452 1.183-.437 0-.833-.194-.833-.548 0-.194.194-.337.388-.337.194 0 .388.143.388.337 0 .194-.194.337-.388.337-.194 0-.388-.143-.388-.337 0-.194.194-.337.388-.337.194 0 .388.143.388.337 0 .548-.652.91-1.452.91-.833 0-1.452-.4-1.452-1.183 0 1.033 1.415 1.727 2.91 1.727 1.461 0 2.161-.761 2.161-1.852 0-1.514-1.424-1.899-3.596-2.705z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Stripe Connect Setup</h2>
            <p className="text-gray-500 text-sm mt-1">Powered by Stripe</p>
          </div>
        </div>
        <p className="text-gray-600 text-base max-w-md mx-auto">
          Set up your Stripe account to accept payments from tenants securely and efficiently
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 gap-4">
        <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
          <div className="bg-blue-500 p-2 rounded-lg flex-shrink-0">
            <CreditCard className="text-white w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Accept Payments</h4>
            <p className="text-sm text-gray-600 mt-1">Credit cards, bank transfers, and digital wallets</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
          <div className="bg-green-500 p-2 rounded-lg flex-shrink-0">
            <Shield className="text-white w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Secure & Compliant</h4>
            <p className="text-sm text-gray-600 mt-1">PCI DSS compliant with advanced fraud protection</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
          <div className="bg-purple-500 p-2 rounded-lg flex-shrink-0">
            <Users className="text-white w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Multi-tenant Support</h4>
            <p className="text-sm text-gray-600 mt-1">Manage payments across multiple properties</p>
          </div>
        </div>
      </div>

      {/* Action Section */}
      <div className="pt-6 border-t border-gray-100">
        {accountStatus?.status === 'not_created' && (
          <div className="text-center">
            <Button 
              onClick={handleCreateAccount}
              className="w-full h-12 text-base font-semibold bg-[#6772E5] hover:bg-[#5b66d9] text-white rounded-lg transition-colors"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Creating Account...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Create Stripe Account
                </div>
              )}
            </Button>
          </div>
        )}

        {accountStatus?.status === 'onboarding_pending' && (
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1">Ready to complete your setup</p>
              <p className="text-xs text-gray-500">This will take about 2-3 minutes</p>
            </div>
            <Button 
              onClick={handleStartEmbeddedOnboarding}
              className="h-12 text-base font-semibold bg-gradient-to-r from-[#6772E5] to-[#5b66d9] hover:from-[#5b66d9] hover:to-[#4f5bd8] text-white shadow-lg px-6 rounded-lg transition-all"
              disabled={embeddedLoading}
            >
              {embeddedLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Loading...
                </div>
              ) : (
                <div className="flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Complete Setup
                  <ArrowRight className="w-5 h-5 ml-2" />
                </div>
              )}
            </Button>
          </div>
        )}

        {accountStatus?.status === 'active' && (
          <div className="text-center p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
            <div className="bg-green-500 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-green-800 mb-2">
              Setup Complete!
            </h3>
            <p className="text-green-700 text-sm">
              Your Stripe account is ready to accept payments from tenants
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default StripeConnectOnboarding; 