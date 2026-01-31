import React, { useState } from 'react';
import { Application, ApplicationViewing } from '../lib/types';
import { phoneUtils } from '../lib/utils';

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
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Ensure time is in HH:MM:SS format and phone is in E164 format (backend expects this)
      const formattedData = {
        ...formData,
        scheduled_time: formData.scheduled_time.includes(':') && formData.scheduled_time.split(':').length === 2 
          ? `${formData.scheduled_time}:00` 
          : formData.scheduled_time,
        contact_phone: formData.contact_phone ? phoneUtils.toE164Format(formData.contact_phone) : formData.contact_phone
      };
      await onSchedule(formattedData);
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
    
    if (name === 'contact_phone') {
      const formattedPhone = phoneUtils.formatPhoneNumber(value);
      setFormData(prev => ({
        ...prev,
        [name]: formattedPhone,
      }));
      
      const phoneErrorMsg = phoneUtils.getPhoneErrorMessage(formattedPhone);
      setPhoneError(phoneErrorMsg);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
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
      <div className="viewing-scheduler-modal">
        <div className="modal-header">
          <h2 className="modal-title">Schedule Property Viewing</h2>
          <button onClick={onClose} className="close-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-content">
          {/* Application Info */}
          <div className="application-info">
            <h3 className="info-title">Application Details</h3>
            <div className="info-details">
              <div className="detail-row">
                <span className="detail-label">Tenant:</span>
                <span className="detail-value">{application.tenant_name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Property:</span>
                <span className="detail-value">{application.property_name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{application.tenant_email}</span>
              </div>
              {application.tenant_phone && (
                <div className="detail-row">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{application.tenant_phone}</span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="viewing-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="scheduled_date" className="form-label">
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
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="scheduled_time" className="form-label">
                  Viewing Time *
                </label>
                <input
                  type="time"
                  id="scheduled_time"
                  name="scheduled_time"
                  value={formData.scheduled_time}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="contact_person" className="form-label">
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
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact_phone" className="form-label">
                Contact Phone *
              </label>
              <input
                type="tel"
                id="contact_phone"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
                required
                className={`form-input ${phoneError ? 'error' : ''}`}
              />
              {phoneError && (
                <div className="field-error">
                  {phoneError}
                </div>
              )}
              {formData.contact_phone && !phoneError && (
                <div className="field-success">
                  ✓ Valid phone number
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="viewing_notes" className="form-label">
                Viewing Notes
              </label>
              <textarea
                id="viewing_notes"
                name="viewing_notes"
                value={formData.viewing_notes}
                onChange={handleChange}
                rows={3}
                placeholder="Special instructions, areas to highlight, or other notes..."
                className="form-textarea"
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>Scheduling...</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Schedule Viewing</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .viewing-scheduler-modal {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 24px 0 24px;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 24px;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          color: #374151;
          background: #f3f4f6;
        }

        .modal-content {
          padding: 0 24px 24px 24px;
        }

        .application-info {
          background: #f9fafb;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .info-title {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 12px 0;
        }

        .info-details {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .detail-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .detail-label {
          font-weight: 500;
          color: #374151;
          min-width: 60px;
        }

        .detail-value {
          color: #6b7280;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 20px;
        }

        .error-message p {
          color: #dc2626;
          font-size: 14px;
          margin: 0;
        }

        .viewing-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .form-input,
        .form-textarea {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          background: #e5e7eb;
        }

        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 640px) {
          .modal-overlay {
            padding: 10px;
          }

          .viewing-scheduler-modal {
            max-width: 100%;
          }

          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
} 