import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { apiClient } from '../lib/api';
import { Lease } from '../lib/types';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatUTCDate } from '../lib/utils';

export default function TenantLeasePortal() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingLease, setUploadingLease] = useState<number | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Check if phone number is in URL or localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const phoneFromUrl = urlParams.get('phone');
    const phoneFromStorage = localStorage.getItem('tenant_phone');
    
    if (phoneFromUrl) {
      setPhoneNumber(phoneFromUrl);
      localStorage.setItem('tenant_phone', phoneFromUrl);
      setIsAuthenticated(true);
      fetchLeases(phoneFromUrl);
    } else if (phoneFromStorage) {
      setPhoneNumber(phoneFromStorage);
      setIsAuthenticated(true);
      fetchLeases(phoneFromStorage);
    }
  }, []);

  const fetchLeases = async (phone: string) => {
    try {
      setLoading(true);
      setError(null);
      const leasesData = await apiClient.getTenantLeases(phone);
      setLeases(leasesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load leases');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    try {
      setLoading(true);
      setError(null);
      await fetchLeases(phoneNumber);
      localStorage.setItem('tenant_phone', phoneNumber);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadLease = async (lease: Lease) => {
    try {
      setError(null);
      const downloadData = await apiClient.downloadTenantLeaseDraft(lease.id);
      
      // Open download URL in new tab
      window.open(downloadData.download_url, '_blank');
    } catch (err: any) {
      setError(err.message || 'Failed to download lease');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please select a PDF file');
        return;
      }
      setUploadFile(file);
      setError(null);
    }
  };

  const handleUploadSignedLease = async (leaseId: number) => {
    if (!uploadFile) {
      setError('Please select a signed lease file');
      return;
    }

    try {
      setUploadingLease(leaseId);
      setError(null);
      
      await apiClient.uploadSignedLease(leaseId, phoneNumber, uploadFile);
      
      // Refresh leases
      await fetchLeases(phoneNumber);
      
      // Reset upload state
      setUploadFile(null);
      setUploadingLease(null);
      
      alert('Signed lease uploaded successfully! Your landlord will review it and activate your lease.');
    } catch (err: any) {
      setError(err.message || 'Failed to upload signed lease');
      setUploadingLease(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'gray';
      case 'sent_to_tenant': return 'blue';
      case 'signed': return 'yellow';
      case 'active': return 'green';
      default: return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Being Prepared';
      case 'sent_to_tenant': return 'Ready for Signing';
      case 'signed': return 'Pending Activation';
      case 'active': return 'Active';
      default: return status;
    }
  };

  const getInstructions = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Your lease is being prepared by your landlord. You will receive an SMS when it\'s ready for review.';
      case 'sent_to_tenant':
        return 'Your lease is ready! Download it, review the terms, print it, sign it, and upload the signed copy.';
      case 'signed':
        return 'Thank you for signing your lease! Your landlord is reviewing it and will activate it soon.';
      case 'active':
        return 'Congratulations! Your lease is now active. Welcome to your new home!';
      default:
        return '';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tenant_phone');
    setIsAuthenticated(false);
    setPhoneNumber('');
    setLeases([]);
    router.push('/');
  };

  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Tenant Lease Portal - Tink Property Management</title>
        </Head>
        
        <div className="tenant-portal-container">
          <div className="login-card">
            <div className="login-header">
              <h1>🏠 Tenant Lease Portal</h1>
              <p>Access your lease documents and signing workflow</p>
            </div>

            <form onSubmit={handlePhoneLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                  required
                  className="form-input"
                />
                <small className="form-help">Enter the phone number associated with your lease</small>
              </div>

              {error && (
                <div className="alert alert-error">
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading || !phoneNumber.trim()}
                className="btn btn-primary btn-full"
              >
                {loading ? 'Accessing...' : 'Access My Leases'}
              </button>
            </form>
          </div>
        </div>

        <style jsx>{`
          .tenant-portal-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }

          .login-card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
            padding: 40px;
            width: 100%;
            max-width: 450px;
          }

          .login-header {
            text-align: center;
            margin-bottom: 30px;
          }

          .login-header h1 {
            margin: 0 0 10px 0;
            color: #1f2937;
            font-size: 28px;
          }

          .login-header p {
            margin: 0;
            color: #6b7280;
            font-size: 16px;
          }

          .form-group {
            margin-bottom: 24px;
          }

          .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #374151;
          }

          .form-input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
          }

          .form-input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          .form-help {
            display: block;
            margin-top: 6px;
            color: #6b7280;
            font-size: 14px;
          }

          .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          }

          .btn-primary {
            background: #3b82f6;
            color: white;
          }

          .btn-primary:hover:not(:disabled) {
            background: #2563eb;
            transform: translateY(-1px);
          }

          .btn-primary:disabled {
            background: #9ca3af;
            cursor: not-allowed;
          }

          .btn-full {
            width: 100%;
          }

          .alert {
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
          }

          .alert-error {
            background: #fef2f2;
            color: #dc2626;
            border: 1px solid #fecaca;
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>My Leases - Tenant Portal</title>
      </Head>

      <div className="tenant-dashboard">
        <div className="dashboard-header">
          <div className="header-content">
            <h1>🏠 My Leases</h1>
            <p>Phone: {phoneNumber}</p>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>

        {loading && <LoadingSpinner />}

        {error && (
          <div className="alert alert-error">
            {error}
            <button onClick={() => setError(null)} className="alert-close">×</button>
          </div>
        )}

        <div className="leases-container">
          {leases.length === 0 ? (
            <div className="empty-state">
              <h3>No Leases Found</h3>
              <p>We couldn't find any leases associated with this phone number.</p>
            </div>
          ) : (
            leases.map((lease) => (
              <div key={lease.id} className="lease-card">
                <div className="lease-header">
                  <div className="lease-info">
                    <h3>{lease.property_name}</h3>
                    {lease.room_name && <p className="room-info">Room: {lease.room_name}</p>}
                  </div>
                  <div className={`status-badge ${getStatusColor(lease.status)}`}>
                    {getStatusText(lease.status)}
                  </div>
                </div>

                <div className="lease-details">
                  <div className="detail-row">
                    <span className="label">Monthly Rent:</span>
                    <span className="value">${lease.monthly_rent}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Lease Period:</span>
                    <span className="value">
                      {formatUTCDate(lease.start_date)} - {formatUTCDate(lease.end_date)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Security Deposit:</span>
                    <span className="value">${lease.security_deposit}</span>
                  </div>
                </div>

                <div className="instructions">
                  <p>{getInstructions(lease.status)}</p>
                </div>

                <div className="lease-actions">
                  {lease.status === 'sent_to_tenant' && (
                    <>
                      <button
                        onClick={() => handleDownloadLease(lease)}
                        className="btn btn-primary"
                      >
                        📄 Download Lease
                      </button>

                      <div className="upload-section">
                        <h4>Upload Signed Lease</h4>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileChange}
                          className="file-input"
                        />
                        {uploadFile && (
                          <div className="file-selected">
                            ✅ Selected: {uploadFile.name}
                          </div>
                        )}
                        <button
                          onClick={() => handleUploadSignedLease(lease.id)}
                          disabled={!uploadFile || uploadingLease === lease.id}
                          className="btn btn-success"
                        >
                          {uploadingLease === lease.id ? 'Uploading...' : '📤 Upload Signed Lease'}
                        </button>
                      </div>
                    </>
                  )}

                  {lease.status === 'draft' && (
                    <div className="waiting-state">
                      <p>⏱️ Waiting for landlord to send lease for review</p>
                    </div>
                  )}

                  {lease.status === 'signed' && (
                    <div className="pending-state">
                      <p>⏳ Lease uploaded! Waiting for landlord activation</p>
                    </div>
                  )}

                  {lease.status === 'active' && (
                    <div className="active-state">
                      <p>🎉 Your lease is active! Welcome home!</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .tenant-dashboard {
          min-height: 100vh;
          background: #f9fafb;
          padding: 20px;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          background: white;
          padding: 20px 30px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .header-content h1 {
          margin: 0;
          color: #1f2937;
          font-size: 28px;
        }

        .header-content p {
          margin: 5px 0 0 0;
          color: #6b7280;
        }

        .leases-container {
          display: grid;
          gap: 24px;
          max-width: 800px;
          margin: 0 auto;
        }

        .lease-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          padding: 24px;
          border: 1px solid #e5e7eb;
        }

        .lease-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .lease-info h3 {
          margin: 0 0 5px 0;
          color: #1f2937;
          font-size: 20px;
        }

        .room-info {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-badge.gray {
          background: #f3f4f6;
          color: #374151;
        }

        .status-badge.blue {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .status-badge.yellow {
          background: #fef3c7;
          color: #d97706;
        }

        .status-badge.green {
          background: #d1fae5;
          color: #065f46;
        }

        .lease-details {
          margin-bottom: 20px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .detail-row .label {
          color: #6b7280;
          font-weight: 500;
        }

        .detail-row .value {
          color: #1f2937;
          font-weight: 600;
        }

        .instructions {
          background: #f0f9ff;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          border-left: 4px solid #3b82f6;
        }

        .instructions p {
          margin: 0;
          color: #1e40af;
          font-size: 14px;
        }

        .lease-actions {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .upload-section {
          background: #f9fafb;
          padding: 16px;
          border-radius: 8px;
          border: 2px dashed #d1d5db;
        }

        .upload-section h4 {
          margin: 0 0 12px 0;
          color: #374151;
          font-size: 16px;
        }

        .file-input {
          width: 100%;
          padding: 8px;
          margin-bottom: 12px;
        }

        .file-selected {
          background: #ecfdf5;
          color: #065f46;
          padding: 8px 12px;
          border-radius: 6px;
          margin-bottom: 12px;
          font-size: 14px;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
        }

        .btn-success {
          background: #10b981;
          color: white;
        }

        .btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
        }

        .waiting-state,
        .pending-state,
        .active-state {
          text-align: center;
          padding: 20px;
          border-radius: 8px;
        }

        .waiting-state {
          background: #f3f4f6;
        }

        .pending-state {
          background: #fef3c7;
        }

        .active-state {
          background: #d1fae5;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .empty-state h3 {
          margin: 0 0 12px 0;
          color: #374151;
        }

        .empty-state p {
          margin: 0;
          color: #6b7280;
        }

        .alert {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .alert-error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .alert-close {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          font-size: 18px;
          padding: 0;
        }

        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }

          .lease-header {
            flex-direction: column;
            gap: 12px;
          }

          .detail-row {
            flex-direction: column;
            gap: 4px;
          }
        }
      `}</style>
    </>
  );
} 