import React, { useState } from 'react';
import { Application, ApplicationViewing } from '../lib/types';

interface ViewingCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application;
  viewing: ApplicationViewing | null;
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDateTime = (date: string, time: string) => {
    if (!date || !time) return 'Not scheduled';
    try {
    const dateObj = new Date(`${date}T${time}`);
    return dateObj.toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Complete Property Viewing</h2>
          <button onClick={onClose} className="close-btn">
            ×
          </button>
        </div>
        
        <div className="modal-body">
          {/* Application Summary */}
          <div className="application-summary">
            <h3>Viewing Details</h3>
            <div className="summary-row">
              <span className="label">Tenant:</span>
              <span className="value">{application.tenant_name}</span>
            </div>
            <div className="summary-row">
              <span className="label">Property:</span>
              <span className="value">{application.property_name}</span>
            </div>
            <div className="summary-row">
              <span className="label">Scheduled:</span>
              <span className="value">{formatDateTime(viewing?.scheduled_date || '', viewing?.scheduled_time || '')}</span>
            </div>
            <div className="summary-row">
              <span className="label">Contact:</span>
              <span className="value">{viewing?.contact_person || 'N/A'} ({viewing?.contact_phone || 'N/A'})</span>
            </div>
            {viewing?.viewing_notes && (
              <div className="summary-row">
                <span className="label">Notes:</span>
                <span className="value">{viewing.viewing_notes}</span>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <span>Error: {error}</span>
            </div>
          )}

          {/* Completion Form */}
          <form onSubmit={handleSubmit} className="completion-form">
            <div className="form-group">
              <label className="form-label">Viewing Outcome *</label>
              <div className="radio-group">
                <label className={`radio-option ${formData.outcome === 'positive' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="outcome"
                    value="positive"
                    checked={formData.outcome === 'positive'}
                    onChange={handleInputChange}
                  />
                  <span>Positive</span>
                </label>
                <label className={`radio-option ${formData.outcome === 'neutral' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="outcome"
                    value="neutral"
                    checked={formData.outcome === 'neutral'}
                    onChange={handleInputChange}
                  />
                  <span>Neutral</span>
                </label>
                <label className={`radio-option ${formData.outcome === 'negative' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="outcome"
                    value="negative"
                    checked={formData.outcome === 'negative'}
                    onChange={handleInputChange}
                  />
                  <span>Negative</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="tenant_feedback" className="form-label">Tenant Feedback</label>
              <textarea
                id="tenant_feedback"
                name="tenant_feedback"
                value={formData.tenant_feedback}
                onChange={handleInputChange}
                rows={3}
                className="form-input"
                placeholder="What did the tenant say about the property?"
              />
            </div>

            <div className="form-group">
              <label htmlFor="landlord_notes" className="form-label">Your Assessment</label>
              <textarea
                id="landlord_notes"
                name="landlord_notes"
                value={formData.landlord_notes}
                onChange={handleInputChange}
                rows={3}
                className="form-input"
                placeholder="Your assessment of the tenant and viewing..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="next_action" className="form-label">Recommended Next Action</label>
              <textarea
                id="next_action"
                name="next_action"
                value={formData.next_action}
                onChange={handleInputChange}
                rows={2}
                className="form-input"
                placeholder="What should happen next? (e.g., assign room, schedule follow-up, etc.)"
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Completing...' : 'Complete Viewing'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 