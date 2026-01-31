import React, { useState } from 'react';
import { apiClient } from '../lib/api';
import { Lease } from '../lib/types';

interface LeaseSigningActionsProps {
  lease: Lease;
  onLeaseUpdated: () => void;
}

export default function LeaseSigningActions({ lease, onLeaseUpdated }: LeaseSigningActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSendToTenant = async () => {
    try {
      setLoading('sending');
      setError(null);
      
      await apiClient.sendLeaseToTenant(lease.id);
      
      alert('Lease sent to tenant! They will receive an SMS with instructions.');
      onLeaseUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to send lease to tenant');
    } finally {
      setLoading(null);
    }
  };

  const handleActivateLease = async () => {
    const confirmed = confirm(
      'Are you sure you want to activate this lease? This will make it officially active and send confirmation to the tenant.'
    );
    
    if (!confirmed) return;

    try {
      setLoading('activating');
      setError(null);
      
      await apiClient.activateLease(lease.id);
      
      alert('Lease activated successfully! Tenant has been notified.');
      onLeaseUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to activate lease');
    } finally {
      setLoading(null);
    }
  };

  const handleDownloadDraft = async () => {
    try {
      setLoading('downloading-draft');
      setError(null);
      
      const downloadData = await apiClient.downloadDraftLease(lease.id);
      window.open(downloadData.download_url, '_blank');
    } catch (err: any) {
      setError(err.message || 'Failed to download draft lease');
    } finally {
      setLoading(null);
    }
  };

  const handleDownloadSigned = async () => {
    try {
      setLoading('downloading-signed');
      setError(null);
      
      const downloadData = await apiClient.downloadSignedLease(lease.id);
      window.open(downloadData.download_url, '_blank');
    } catch (err: any) {
      setError(err.message || 'Failed to download signed lease');
    } finally {
      setLoading(null);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'draft':
        return { text: 'Draft', color: 'gray' };
      case 'sent_to_tenant':
        return { text: 'Sent to Tenant', color: 'blue' };
      case 'signed':
        return { text: 'Signed by Tenant', color: 'yellow' };
      case 'active':
        return { text: 'Active', color: 'green' };
      default:
        return { text: status, color: 'gray' };
    }
  };

  const statusDisplay = getStatusDisplay(lease.status);

  return (
    <div className="lease-signing-actions">
      <div className="status-section">
        <div className={`status-badge ${statusDisplay.color}`}>
          {statusDisplay.text}
        </div>
        
        {lease.sent_to_tenant_at && (
          <div className="timestamp">
            Sent: {new Date(lease.sent_to_tenant_at).toLocaleDateString()}
          </div>
        )}
        {lease.signed_at && (
          <div className="timestamp">
            Signed: {new Date(lease.signed_at).toLocaleDateString()}
          </div>
        )}
        {lease.activated_at && (
          <div className="timestamp">
            Activated: {new Date(lease.activated_at).toLocaleDateString()}
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)} className="alert-close">×</button>
        </div>
      )}

      <div className="actions-grid">
        {/* Draft Status Actions */}
        {lease.status === 'draft' && (
          <>
            <button
              onClick={handleSendToTenant}
              disabled={loading === 'sending'}
              className="btn btn-primary"
            >
              {loading === 'sending' ? 'Sending...' : 'Send to Tenant'}
            </button>
            
            {lease.draft_lease_s3_url && (
              <button
                onClick={handleDownloadDraft}
                disabled={loading === 'downloading-draft'}
                className="btn btn-secondary"
              >
                {loading === 'downloading-draft' ? 'Downloading...' : 'Preview Draft'}
              </button>
            )}
          </>
        )}

        {/* Sent to Tenant Status Actions */}
        {lease.status === 'sent_to_tenant' && (
          <>
            <div className="info-box">
              <p>Lease has been sent to tenant for signing</p>
              <p>They will receive an SMS with download and upload instructions</p>
            </div>
            
            {lease.draft_lease_s3_url && (
              <button
                onClick={handleDownloadDraft}
                disabled={loading === 'downloading-draft'}
                className="btn btn-secondary"
              >
                {loading === 'downloading-draft' ? 'Downloading...' : 'View Sent Lease'}
              </button>
            )}
          </>
        )}

        {/* Signed Status Actions */}
        {lease.status === 'signed' && (
          <>
            <div className="info-box success">
              <p>Lease has been signed by tenant!</p>
              {lease.signed_at && (
                <p>Signed on {new Date(lease.signed_at).toLocaleDateString()} at {new Date(lease.signed_at).toLocaleTimeString()}</p>
              )}
              <p>Review the signed lease and activate it to make it official</p>
            </div>
            
            <div className="document-actions">
              {lease.draft_lease_s3_url && (
                <button
                  onClick={handleDownloadDraft}
                  disabled={loading === 'downloading-draft'}
                  className="btn btn-secondary"
                >
                  {loading === 'downloading-draft' ? 'Downloading...' : 'Original Draft'}
                </button>
              )}
              
              {lease.signed_lease_s3_url && (
                <button
                  onClick={handleDownloadSigned}
                  disabled={loading === 'downloading-signed'}
                  className="btn btn-primary"
                >
                  {loading === 'downloading-signed' ? 'Downloading...' : 'Signed Lease'}
                </button>
              )}
              
              <button
                onClick={handleActivateLease}
                disabled={loading === 'activating'}
                className="btn btn-success"
              >
                {loading === 'activating' ? 'Activating...' : 'Activate Lease'}
              </button>
            </div>
          </>
        )}

        {/* Active Status Actions */}
        {lease.status === 'active' && (
          <>
            <div className="info-box success">
              <p>Lease is now active!</p>
              <p>Tenant has been notified and can now access their portal</p>
            </div>
            
            <div className="document-actions">
              {lease.draft_lease_s3_url && (
                <button
                  onClick={handleDownloadDraft}
                  disabled={loading === 'downloading-draft'}
                  className="btn btn-secondary"
                >
                  {loading === 'downloading-draft' ? 'Downloading...' : 'Original Draft'}
                </button>
              )}
              
              {lease.signed_lease_s3_url && (
                <button
                  onClick={handleDownloadSigned}
                  disabled={loading === 'downloading-signed'}
                  className="btn btn-primary"
                >
                  {loading === 'downloading-signed' ? 'Downloading...' : 'Signed Lease'}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .lease-signing-actions {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          margin-top: 16px;
        }

        .status-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          width: fit-content;
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

        .timestamp {
          font-size: 12px;
          color: #6b7280;
        }

        .actions-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .document-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .info-box {
          background: #f0f9ff;
          border: 1px solid #e0f2fe;
          border-radius: 8px;
          padding: 16px;
          border-left: 4px solid #3b82f6;
        }

        .info-box.success {
          background: #f0fdf4;
          border-color: #bbf7d0;
          border-left-color: #10b981;
        }

        .info-box p {
          margin: 0 0 8px 0;
          color: #374151;
          font-size: 14px;
        }

        .info-box p:last-child {
          margin-bottom: 0;
        }

        .btn {
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          justify-content: center;
        }

        .btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
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

        .btn-large {
          padding: 16px 24px;
          font-size: 16px;
          font-weight: 700;
        }

        .alert {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
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
          margin-left: 12px;
        }

        @media (max-width: 768px) {
          .document-actions {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
} 