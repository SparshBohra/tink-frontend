import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth-context';
import DashboardLayout from '../../components/DashboardLayout';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { RefreshCw, ArrowLeft } from 'lucide-react';

const StripeRefreshPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // Redirect to stripe-connect page after a short delay
    const timer = setTimeout(() => {
      router.push('/stripe-connect');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  const handleContinue = () => {
    router.push('/stripe-connect');
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <DashboardLayout title="Refreshing Setup">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <div className="text-center">
            <RefreshCw className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold mb-2">Refreshing Your Setup</h2>
            <p className="text-gray-600 mb-6">
              We're updating your onboarding information. You'll be redirected automatically in a few seconds.
            </p>
            
            <div className="space-y-3">
              <Button onClick={handleContinue} className="w-full">
                Continue Setup Now
              </Button>
              <Button 
                onClick={handleGoToDashboard}
                className="w-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StripeRefreshPage; 