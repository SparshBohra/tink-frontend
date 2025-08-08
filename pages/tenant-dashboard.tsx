import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { apiClient } from '../lib/api';
import { Lease } from '../lib/types';
import PaymentModal from '../components/PaymentModal';
import PaymentHistoryModal from '../components/PaymentHistoryModal';

interface TenantUser {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  is_verified: boolean;
}

const TenantDashboard: React.FC = () => {
  const router = useRouter();
  const [tenantLeases, setTenantLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaseLoading, setLeaseLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<TenantUser | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPaymentHistoryModalOpen, setIsPaymentHistoryModalOpen] = useState(false);
  const [uploadingLease, setUploadingLease] = useState<number | null>(null);

  useEffect(() => {
    const accessToken = localStorage.getItem('tenant_access_token');
    const userStr = localStorage.getItem('tenant_user');

    if (!accessToken || !userStr) {
      router.push('/tenant-login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      apiClient.setAccessToken(accessToken, 'tenant');
      loadTenantLeases().finally(() => setLoading(false));
    } catch (error) {
      console.error('Error parsing user data:', error);
      setLoading(false);
      router.push('/tenant-login');
    }
  }, [router]);

  const loadTenantLeases = async () => {
    try {
      setLeaseLoading(true);
      const leases = await apiClient.getTenantLeases();
      setTenantLeases(leases);
    } catch (error: any) {
      console.error('Error loading tenant leases:', error);
      setError('Failed to load lease data');
    } finally {
      setLeaseLoading(false);
    }
  };

  const handleDownloadLease = async (leaseId: number) => {
    try {
      const leaseData = await apiClient.downloadTenantLeaseDraft(leaseId);
      window.open(leaseData.download_url, '_blank');
    } catch (error: any) {
      console.error('Error downloading lease:', error);
      alert('Failed to download lease. Please try again.');
    }
  };

  const handleUploadSignedLease = async (leaseId: number, file: File) => {
    try {
      setUploadingLease(leaseId);
      const result = await apiClient.uploadSignedLease(leaseId, file);
      alert(`Success! ${result.message}`);
      await loadTenantLeases();
    } catch (error: any) {
      console.error('Error uploading signed lease:', error);
      alert('Failed to upload signed lease. Please try again.');
    } finally {
      setUploadingLease(null);
    }
  };

  const handleLeaseFileSelect = (leaseId: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.type !== 'application/pdf') {
          alert('Please select a PDF file.');
          return;
        }
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          alert('File size must be less than 10MB.');
          return;
        }
        handleUploadSignedLease(leaseId, file);
      }
    };
    input.click();
  };

  const handlePaymentModalClose = () => setIsPaymentModalOpen(false);
  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false);
    loadTenantLeases();
  };

  const handleLogout = () => {
    localStorage.removeItem('tenant_access_token');
    localStorage.removeItem('tenant_user');
    router.push('/tenant-login');
  };

  const primaryLease = 
    tenantLeases.find(lease => lease.status === 'active') || 
    tenantLeases.find(lease => lease.status === 'sent_to_tenant') ||
    tenantLeases.find(lease => lease.status === 'signed') ||
    tenantLeases.find(lease => lease.status === 'draft') ||
    tenantLeases[0];

  const renderLeaseStatus = (status: string) => {
    const statusLabels: { [key: string]: string } = {
      'draft': 'Being Prepared',
      'sent_to_tenant': 'Ready to Sign',
      'signed': 'Awaiting Activation',
      'active': 'Active',
      'expired': 'Expired'
    };
    return <span>{statusLabels[status] || status}</span>;
  };

  const renderLeaseActions = (lease: Lease) => {
    switch (lease.status) {
      case 'draft':
        return (
          <div>
            <h3>Lease Being Prepared</h3>
            <p>Your landlord is preparing your lease document. You'll receive an SMS notification once it's ready for signing.</p>
          </div>
        );
      case 'sent_to_tenant':
        return (
          <div>
            <h3>Ready for Your Signature</h3>
            <p>Your lease is ready for review and signing. Please follow these steps:</p>
            <ol>
              <li>Download and review the lease document</li>
              <li>Print and sign the document</li>
              <li>Scan or photograph the signed lease</li>
              <li>Upload the signed document using the button below</li>
            </ol>
            <div>
              <button onClick={() => handleDownloadLease(lease.id)}>Download Lease</button>
              <button onClick={() => handleLeaseFileSelect(lease.id)} disabled={uploadingLease === lease.id}>
                {uploadingLease === lease.id ? 'Uploading...' : 'Upload Signed Lease'}
              </button>
            </div>
          </div>
        );
      case 'signed':
        return (
          <div>
            <h3>Lease Signed Successfully</h3>
            <p>Your signed lease has been received. Your landlord will review and activate it shortly.</p>
          </div>
        );
      case 'active':
        return (
          <div>
            <h3>Lease Active</h3>
            <p>Your lease is now active. Welcome to your new home!</p>
            <button onClick={() => handleDownloadLease(lease.id)}>Download Lease Copy</button>
          </div>
        );
      default:
        return (
          <div>
            <h3>Processing</h3>
            <p>Your lease is being processed. Please check back soon.</p>
          </div>
        );
    }
  };

  if (loading) {
    return <div>Loading your dashboard...</div>;
  }

  return (
    <>
      <Head>
        <title>Tenant Dashboard - Tink</title>
        <meta name="description" content="Manage your rental, payments, and communicate with your landlord" />
      </Head>

      <div>
        <header>
          <div>
            <div>
              <div>
                <h1>Tink Tenant Portal</h1>
                <p>Property Management Dashboard</p>
              </div>
            </div>
            
            <div>
              <div>
                <p>Welcome back,</p>
                <p>{currentUser?.full_name || 'Tenant'}</p>
              </div>
              <div>{currentUser?.full_name?.charAt(0) || 'T'}</div>
              <button onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </header>

        <main>
          <div>
            <h2>Dashboard Overview</h2>
            <p>Manage your rental and stay connected with your property</p>
          </div>
          
          <div>
            <div>
              <p>Last login</p>
              <p>{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div>
            <section>
              <header>
                <h2>Current Lease</h2>
              </header>
              <div>
                {leaseLoading ? (
                  <p>Loading lease information...</p>
                ) : primaryLease ? (
                  <>
                    <dl>
                      <div>
                        <dt>Property</dt>
                        <dd>{(primaryLease.property_ref as any)?.name || 'Property'}</dd>
                      </div>
                      <div>
                        <dt>Lease Period</dt>
                        <dd>
                          {new Date(primaryLease.start_date).toLocaleDateString()} - {new Date(primaryLease.end_date).toLocaleDateString()}
                        </dd>
                      </div>
                      <div>
                        <dt>Address</dt>
                        <dd>{(primaryLease.property_ref as any)?.address || 'Property Address'}</dd>
                      </div>
                      <div>
                        <dt>Status</dt>
                        <dd>{renderLeaseStatus(primaryLease.status)}</dd>
                      </div>
                      {primaryLease.room && (
                        <div>
                          <dt>Unit/Room</dt>
                          <dd>{(primaryLease.room as any)?.name || `Room ${primaryLease.room}`}</dd>
                        </div>
                      )}
                    </dl>
                    <div>
                      {renderLeaseActions(primaryLease)}
                    </div>
                  </>
                ) : (
                  <p>No lease information available</p>
                )}
              </div>
            </section>

            <section>
              <header>
                <h2>Quick Actions</h2>
              </header>
              <div>
                <button onClick={() => setIsPaymentHistoryModalOpen(true)}>
                  <h3>Payment History</h3>
                  <p>View all your past rent payments</p>
                </button>
                <button onClick={() => alert('Contact landlord feature will be available soon!')}>
                  <h3>Contact Landlord</h3>
                  <p>Send a message to your property manager</p>
                </button>
              </div>
            </section>
          </div>

          <aside>
            <section>
              <header>
                <h2>Profile Information</h2>
              </header>
              <div>
                <div>
                  <div>{currentUser?.full_name?.charAt(0) || 'T'}</div>
                  <div>
                    <p>{currentUser?.full_name || 'Not provided'}</p>
                    <p>Tenant</p>
                  </div>
                </div>
                <div>
                  <p>{currentUser?.email}</p>
                  <p>{currentUser?.phone}</p>
                  <p>Verified Account</p>
                </div>
              </div>
            </section>

            <section>
              <header>
                <h2>Rent Payment</h2>
              </header>
              <div>
                <div>
                  <dt>Next Payment Due</dt>
                  <dd>${primaryLease?.monthly_rent || '0.00'}</dd>
                  <p>Due on the 1st of each month</p>
                </div>
                {primaryLease?.status === 'active' ? (
                  <button onClick={() => setIsPaymentModalOpen(true)}>Pay Rent Now</button>
                ) : (
                  <p>Payments will be available once your lease is activated</p>
                )}
              </div>
            </section>
          </aside>
        </main>

        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={handlePaymentModalClose}
          lease={primaryLease}
          onPaymentSuccess={handlePaymentSuccess}
        />

        <PaymentHistoryModal
          isOpen={isPaymentHistoryModalOpen}
          onClose={() => setIsPaymentHistoryModalOpen(false)}
        />
      </div>
    </>
  );
};

export default TenantDashboard; 