import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth-context';
import DashboardLayout from '../components/DashboardLayout';
import StripeConnectOnboarding from '../components/StripeConnectOnboarding';

const StripeConnectPage: React.FC = () => {
  const router = useRouter();
  const { user, isLandlord } = useAuth();

  // Redirect if not a landlord
  React.useEffect(() => {
    if (user && !isLandlord()) {
      router.push('/unauthorized');
    }
  }, [user, isLandlord, router]);

  if (!user || !isLandlord()) {
    return (
      <DashboardLayout title="Payment Setup">
        <div className="dashboard-container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Access Denied</h2>
              <p className="section-subtitle">Only landlords can access this page.</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handleComplete = (accountId: string) => {
    console.log('Stripe Connect setup completed:', accountId);
  };

  const handleError = (error: string) => {
    console.error('Stripe Connect error:', error);
  };

  return (
    <DashboardLayout title="">
      <div className="dashboard-container">
        {/* Top Bar with Back Button */}
        <div className="stripe-top-bar">
          <div className="stripe-top-content">
            <div className="stripe-title-section">
              <h1 className="stripe-main-title">Payment Setup</h1>
              <p className="stripe-main-subtitle">Connect Stripe to accept payments from tenants</p>
            </div>
            <button 
              className="stripe-back-btn"
              onClick={() => router.back()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5"/>
                <path d="M12 19l-7-7 7-7"/>
              </svg>
              Back
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="stripe-main-grid">
          {/* Left Column - Stripe Connect Component */}
          <div className="stripe-left-column">
            <div className="stripe-onboarding-section">
              <div className="onboarding-container">
                <StripeConnectOnboarding 
                  onComplete={handleComplete}
                  onError={handleError}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Benefits, Setup Process & Support */}
          <div className="stripe-right-column">
            {/* Benefits Section */}
            <div className="stripe-benefits-section" style={{ marginBottom: '3rem' }}>
              <h2 className="section-title">Why Set Up Stripe Connect?</h2>
              <div className="benefits-grid">
                <div className="benefit-item">
                  <div className="benefit-icon blue">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23"/>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                  </div>
                  <div className="benefit-content">
                    <h3>Automatic Payments</h3>
                    <p>Tenants pay rent directly through the platform</p>
                  </div>
                </div>
                
                <div className="benefit-item">
                  <div className="benefit-icon green">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12l2 2 4-4"/>
                      <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                    </svg>
                  </div>
                  <div className="benefit-content">
                    <h3>Secure & Compliant</h3>
                    <p>PCI DSS compliant with fraud protection</p>
                  </div>
                </div>
                
                <div className="benefit-item">
                  <div className="benefit-icon purple">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                      <line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                  </div>
                  <div className="benefit-content">
                    <h3>Multiple Payment Methods</h3>
                    <p>Cards, bank transfers, and digital wallets</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Setup Process */}
            <div className="stripe-process-section" style={{ marginBottom: '3rem' }}>
              <h2 className="section-title">Setup Process</h2>
              <div className="process-steps">
                <div className="process-step">
                  <div className="step-number">1</div>
                  <div className="step-info">
                    <h4>Create Account</h4>
                    <p>Link your Stripe Connect account</p>
                  </div>
                </div>
                <div className="process-step">
                  <div className="step-number">2</div>
                  <div className="step-info">
                    <h4>Complete Onboarding</h4>
                    <p>Provide business and banking details</p>
                  </div>
                </div>
                <div className="process-step">
                  <div className="step-number">3</div>
                  <div className="step-info">
                    <h4>Start Accepting Payments</h4>
                    <p>Begin collecting rent payments</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Section */}
            <div className="stripe-support-section">
              <h2 className="section-title">Need Help?</h2>
              <div className="support-actions">
                <button 
                  className="support-btn primary"
                  onClick={() => window.open('mailto:support@tink.global', '_blank')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  Email Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StripeConnectPage; 