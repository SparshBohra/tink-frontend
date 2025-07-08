import React, { useState } from 'react';
import { Application, ApplicationViewing } from '../lib/types';

interface ViewingCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application;
  viewing: ApplicationViewing;
  onComplete: (completionData: {
    outcome: 'positive' | 'negative' | 'neutral';
    tenant_feedback?: string;
    landlord_notes?: string;
    next_action?: string;
  }) => Promise<void>;
}

export default function ViewingCompletionModal({
  isOpen,
  onClose,
  application,
  viewing,
  onComplete,
}: ViewingCompletionModalProps) {
  const [formData, setFormData] = useState({
    outcome: 'neutral' as 'positive' | 'negative' | 'neutral',
    tenant_feedback: '',
    landlord_notes: '',
    next_action: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await onComplete(formData);
      onClose();
      setFormData({
        outcome: 'neutral',
        tenant_feedback: '',
        landlord_notes: '',
        next_action: '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to complete viewing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatDateTime = (date: string, time: string) => {
    const dateObj = new Date(`${date}T${time}`);
    return dateObj.toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Complete Property Viewing</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Viewing Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Viewing Details</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Tenant:</span> {application.tenant_name}</p>
              <p><span className="font-medium">Property:</span> {application.property_name}</p>
              <p><span className="font-medium">Scheduled:</span> {formatDateTime(viewing.scheduled_date, viewing.scheduled_time)}</p>
              <p><span className="font-medium">Contact:</span> {viewing.contact_person} ({viewing.contact_phone})</p>
              {viewing.viewing_notes && (
                <p><span className="font-medium">Notes:</span> {viewing.viewing_notes}</p>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Viewing Outcome *
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="outcome"
                    value="positive"
                    checked={formData.outcome === 'positive'}
                    onChange={handleChange}
                    className="mr-2 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-900">
                    <span className="text-green-600 font-medium">Positive</span> - Tenant is interested and ready to proceed
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="outcome"
                    value="neutral"
                    checked={formData.outcome === 'neutral'}
                    onChange={handleChange}
                    className="mr-2 text-yellow-600 focus:ring-yellow-500"
                  />
                  <span className="text-sm text-gray-900">
                    <span className="text-yellow-600 font-medium">Neutral</span> - Tenant needs time to consider
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="outcome"
                    value="negative"
                    checked={formData.outcome === 'negative'}
                    onChange={handleChange}
                    className="mr-2 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-900">
                    <span className="text-red-600 font-medium">Negative</span> - Tenant is not interested
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="tenant_feedback" className="block text-sm font-medium text-gray-700 mb-1">
                Tenant Feedback
              </label>
              <textarea
                id="tenant_feedback"
                name="tenant_feedback"
                value={formData.tenant_feedback}
                onChange={handleChange}
                rows={3}
                placeholder="What did the tenant say about the property?"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="landlord_notes" className="block text-sm font-medium text-gray-700 mb-1">
                Landlord Assessment
              </label>
              <textarea
                id="landlord_notes"
                name="landlord_notes"
                value={formData.landlord_notes}
                onChange={handleChange}
                rows={3}
                placeholder="Your assessment of the tenant and viewing..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="next_action" className="block text-sm font-medium text-gray-700 mb-1">
                Recommended Next Action
              </label>
              <textarea
                id="next_action"
                name="next_action"
                value={formData.next_action}
                onChange={handleChange}
                rows={2}
                placeholder="What should happen next? (e.g., assign room, schedule another viewing, etc.)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Completing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Complete Viewing</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 