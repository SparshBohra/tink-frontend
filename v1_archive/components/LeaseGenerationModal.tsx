import React, { useState } from 'react';
import { Application } from '../lib/types';

interface LeaseGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application;
  onGenerateLease: (applicationId: number) => Promise<void>;
}

export default function LeaseGenerationModal({
  isOpen,
  onClose,
  application,
  onGenerateLease,
}: LeaseGenerationModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateLease = async () => {
    setError('');
    setIsGenerating(true);

    try {
      await onGenerateLease(application.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to generate lease');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (amount: number | string | undefined) => {
    if (!amount) return 'Not specified';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  const calculateLeaseDuration = () => {
    if (!application.lease_start_date || !application.lease_end_date) return 'Not specified';
    const start = new Date(application.lease_start_date);
    const end = new Date(application.lease_end_date);
    const months = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
    return `${months} months`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Generate Lease Agreement</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Application & Room Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Lease Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Tenant:</span>
                <p className="text-gray-900">{application.tenant_name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Property:</span>
                <p className="text-gray-900">{application.property_name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Room:</span>
                <p className="text-gray-900">{application.room_name || 'Room assigned'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <p className="text-gray-900">{application.tenant_email}</p>
              </div>
            </div>
          </div>

          {/* Lease Terms */}
          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Lease Terms</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Start Date:</span>
                <p className="text-gray-900">{formatDate(application.lease_start_date)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">End Date:</span>
                <p className="text-gray-900">{formatDate(application.lease_end_date)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Duration:</span>
                <p className="text-gray-900">{calculateLeaseDuration()}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Monthly Rent:</span>
                <p className="text-gray-900 font-semibold">{formatCurrency(application.monthly_rent)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Security Deposit:</span>
                <p className="text-gray-900 font-semibold">{formatCurrency(application.security_deposit)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Total Due at Signing:</span>
                <p className="text-gray-900 font-semibold">
                  {formatCurrency((application.monthly_rent || 0) + (application.security_deposit || 0))}
                </p>
              </div>
            </div>
          </div>

          {/* Lease Generation Status */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">📄 Lease Generation Ready</h3>
            <p className="text-sm text-blue-800">
              All required information has been collected. The lease agreement will be generated with the terms shown above.
            </p>
            <div className="mt-3 text-xs text-blue-700">
              <p>• Lease document will be generated in PDF format</p>
              <p>• Tenant will receive email notification with lease link</p>
              <p>• Digital signature workflow will be initiated</p>
              <p>• You can track signature status in the applications dashboard</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              disabled={isGenerating}
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateLease}
              disabled={isGenerating}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Generate Lease</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 