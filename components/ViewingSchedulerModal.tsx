import React, { useState } from 'react';
import { Application, ApplicationViewing } from '../lib/types';

interface ViewingSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application;
  onSchedule: (viewingData: {
    scheduled_date: string;
    scheduled_time: string;
    contact_person: string;
    contact_phone: string;
    viewing_notes: string;
  }) => Promise<void>;
}

export default function ViewingSchedulerModal({
  isOpen,
  onClose,
  application,
  onSchedule,
}: ViewingSchedulerModalProps) {
  const [formData, setFormData] = useState({
    scheduled_date: '',
    scheduled_time: '',
    contact_person: '',
    contact_phone: '',
    viewing_notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await onSchedule(formData);
      onClose();
      setFormData({
        scheduled_date: '',
        scheduled_time: '',
        contact_person: '',
        contact_phone: '',
        viewing_notes: '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to schedule viewing');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Schedule Property Viewing</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Application Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Application Details</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Tenant:</span> {application.tenant_name}</p>
              <p><span className="font-medium">Property:</span> {application.property_name}</p>
              <p><span className="font-medium">Email:</span> {application.tenant_email}</p>
              {application.tenant_phone && (
                <p><span className="font-medium">Phone:</span> {application.tenant_phone}</p>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="scheduled_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Viewing Date *
                </label>
                <input
                  type="date"
                  id="scheduled_date"
                  name="scheduled_date"
                  value={formData.scheduled_date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="scheduled_time" className="block text-sm font-medium text-gray-700 mb-1">
                  Viewing Time *
                </label>
                <input
                  type="time"
                  id="scheduled_time"
                  name="scheduled_time"
                  value={formData.scheduled_time}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person *
              </label>
              <input
                type="text"
                id="contact_person"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                placeholder="Who will conduct the viewing?"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone *
              </label>
              <input
                type="tel"
                id="contact_phone"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="viewing_notes" className="block text-sm font-medium text-gray-700 mb-1">
                Viewing Notes
              </label>
              <textarea
                id="viewing_notes"
                name="viewing_notes"
                value={formData.viewing_notes}
                onChange={handleChange}
                rows={3}
                placeholder="Special instructions, areas to highlight, or other notes..."
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
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Scheduling...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Schedule Viewing</span>
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