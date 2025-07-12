import React, { useState } from 'react';
import { PropertyListing } from '../lib/types';

interface PublicApplicationFormProps {
  listing: PropertyListing;
  onClose: () => void;
  onSubmit: (applicationData: any) => Promise<void>;
}

interface FormData {
  // Personal Information
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  
  // Employment Information
  employment_status: string;
  employer_name: string;
  job_title: string;
  annual_income: string;
  employment_length: string;
  
  // Rental History
  previous_address: string;
  previous_landlord_name: string;
  previous_landlord_phone: string;
  previous_rent_amount: string;
  move_in_date: string;
  move_out_date: string;
  
  // Required API fields
  desired_move_in_date: string;
  desired_lease_duration: string;
  rent_budget: string;
  
  // References
  reference_name: string;
  reference_phone: string;
  reference_relationship: string;
  
  // Additional Information
  number_of_occupants: string;
  pets: string;
  pet_details: string;
  smoking: string;
  additional_comments: string;
  
  // Agreements
  background_check_consent: boolean;
  terms_agreement: boolean;
}

export default function PublicApplicationForm({ listing, onClose, onSubmit }: PublicApplicationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    employment_status: '',
    employer_name: '',
    job_title: '',
    annual_income: '',
    employment_length: '',
    previous_address: '',
    previous_landlord_name: '',
    previous_landlord_phone: '',
    previous_rent_amount: '',
    move_in_date: '',
    move_out_date: '',
    desired_move_in_date: '',
    desired_lease_duration: '12',
    rent_budget: '',
    reference_name: '',
    reference_phone: '',
    reference_relationship: '',
    number_of_occupants: '1',
    pets: 'no',
    pet_details: '',
    smoking: 'no',
    additional_comments: '',
    background_check_consent: false,
    terms_agreement: false,
  });

  const totalSteps = 5;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateStep = (step: number): boolean => {
    setError(null);
    
    switch (step) {
      case 1:
        if (!formData.full_name || !formData.email || !formData.phone || !formData.date_of_birth) {
          setError('Please fill in all required fields in Personal Information.');
          return false;
        }
        break;
      case 2:
        if (!formData.employment_status || !formData.annual_income) {
          setError('Please fill in all required fields in Employment Information.');
          return false;
        }
        if (formData.employment_status === 'employed' && (!formData.employer_name || !formData.job_title)) {
          setError('Please provide employer details.');
          return false;
        }
        break;
      case 3:
        if (!formData.desired_move_in_date || !formData.desired_lease_duration || !formData.rent_budget || !formData.previous_address || !formData.move_in_date) {
          setError('Please fill in all required fields in Rental History & Preferences.');
          return false;
        }
        break;
      case 4:
        if (!formData.reference_name || !formData.reference_phone || !formData.reference_relationship) {
          setError('Please provide at least one reference.');
          return false;
        }
        break;
      case 5:
        if (!formData.background_check_consent || !formData.terms_agreement) {
          setError('Please accept the required agreements to proceed.');
          return false;
        }
        break;
      default:
        return true;
    }
    
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Apply for {listing.title}</h2>
          <button onClick={onClose} className="modal-close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
        </div>

        <div className="progress-text">
          Step {currentStep} of {totalSteps}
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="alert alert-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {error}
            </div>
          )}

          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="step-content">
              <h3>Personal Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">Full Name *</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label required">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label required">Date of Birth *</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Employment Information */}
          {currentStep === 2 && (
            <div className="step-content">
              <h3>Employment Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">Employment Status *</label>
                  <select
                    name="employment_status"
                    value={formData.employment_status}
                    onChange={handleInputChange}
                    className="form-select"
                    required
                  >
                    <option value="">Select employment status</option>
                    <option value="employed">Employed</option>
                    <option value="self_employed">Self-Employed</option>
                    <option value="student">Student</option>
                    <option value="unemployed">Unemployed</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label required">Annual Income *</label>
                  <input
                    type="number"
                    name="annual_income"
                    value={formData.annual_income}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter annual income"
                    required
                  />
                </div>
              </div>

              {formData.employment_status === 'employed' && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label required">Employer Name *</label>
                      <input
                        type="text"
                        name="employer_name"
                        value={formData.employer_name}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label required">Job Title *</label>
                      <input
                        type="text"
                        name="job_title"
                        value={formData.job_title}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Employment Length</label>
                    <input
                      type="text"
                      name="employment_length"
                      value={formData.employment_length}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g., 2 years, 6 months"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Rental History & Preferences */}
          {currentStep === 3 && (
            <div className="step-content">
              <h3>Rental History & Preferences</h3>
              
              <div className="form-section">
                <h4>Rental Preferences</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Desired Move-in Date *</label>
                    <input
                      type="date"
                      name="desired_move_in_date"
                      value={formData.desired_move_in_date}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label required">Desired Lease Duration *</label>
                    <select
                      name="desired_lease_duration"
                      value={formData.desired_lease_duration}
                      onChange={handleInputChange}
                      className="form-select"
                      required
                    >
                      <option value="6">6 months</option>
                      <option value="12">12 months</option>
                      <option value="18">18 months</option>
                      <option value="24">24 months</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label required">Rent Budget *</label>
                  <input
                    type="number"
                    name="rent_budget"
                    value={formData.rent_budget}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Maximum monthly rent you can afford"
                    required
                  />
                </div>
              </div>
              
              <div className="form-section">
                <h4>Previous Rental History</h4>
                <div className="form-group">
                  <label className="form-label required">Current/Previous Address *</label>
                  <input
                    type="text"
                    name="previous_address"
                    value={formData.previous_address}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your current/previous address"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Move-in Date *</label>
                    <input
                      type="date"
                      name="move_in_date"
                      value={formData.move_in_date}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Move-out Date</label>
                    <input
                      type="date"
                      name="move_out_date"
                      value={formData.move_out_date}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Previous Landlord Name</label>
                    <input
                      type="text"
                      name="previous_landlord_name"
                      value={formData.previous_landlord_name}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Previous Landlord Phone</label>
                    <input
                      type="tel"
                      name="previous_landlord_phone"
                      value={formData.previous_landlord_phone}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Previous Rent Amount</label>
                  <input
                    type="number"
                    name="previous_rent_amount"
                    value={formData.previous_rent_amount}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Monthly rent amount"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: References & Additional Info */}
          {currentStep === 4 && (
            <div className="step-content">
              <h3>References & Additional Information</h3>
              
              <div className="form-section">
                <h4>Personal Reference</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Reference Name *</label>
                    <input
                      type="text"
                      name="reference_name"
                      value={formData.reference_name}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label required">Reference Phone *</label>
                    <input
                      type="tel"
                      name="reference_phone"
                      value={formData.reference_phone}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label required">Relationship *</label>
                  <input
                    type="text"
                    name="reference_relationship"
                    value={formData.reference_relationship}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="e.g., Friend, Colleague, Family Member"
                    required
                  />
                </div>
              </div>

              <div className="form-section">
                <h4>Occupancy Details</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Number of Occupants</label>
                    <select
                      name="number_of_occupants"
                      value={formData.number_of_occupants}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="1">1 person</option>
                      <option value="2">2 people</option>
                      <option value="3">3 people</option>
                      <option value="4">4 people</option>
                      <option value="5+">5+ people</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Do you have pets?</label>
                    <select
                      name="pets"
                      value={formData.pets}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                </div>

                {formData.pets === 'yes' && (
                  <div className="form-group">
                    <label className="form-label">Pet Details</label>
                    <textarea
                      name="pet_details"
                      value={formData.pet_details}
                      onChange={handleInputChange}
                      className="form-textarea"
                      rows={3}
                      placeholder="Please describe your pets (type, breed, age, etc.)"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Do you smoke?</label>
                  <select
                    name="smoking"
                    value={formData.smoking}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Additional Comments</label>
                  <textarea
                    name="additional_comments"
                    value={formData.additional_comments}
                    onChange={handleInputChange}
                    className="form-textarea"
                    rows={4}
                    placeholder="Any additional information you'd like to share..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Agreements */}
          {currentStep === 5 && (
            <div className="step-content">
              <h3>Terms & Agreements</h3>
              
              <div className="final-step-container">
                <div className="application-summary">
                  <div className="summary-header">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 11l3 3L22 4"/>
                      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                    </svg>
                    <h4>Application Summary</h4>
                  </div>
                  
                  <div className="summary-grid">
                    <div className="summary-section">
                      <h5>Property Information</h5>
                      <div className="summary-item">
                        <span className="summary-label">Property:</span>
                        <span className="summary-value">{listing.title}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Address:</span>
                        <span className="summary-value">{listing.property_details?.address 
                          ? `${listing.property_details.address.line1}, ${listing.property_details.address.city}, ${listing.property_details.address.state}`
                          : 'Address not available'}</span>
                      </div>
                    </div>

                    <div className="summary-section">
                      <h5>Applicant Information</h5>
                      <div className="summary-item">
                        <span className="summary-label">Name:</span>
                        <span className="summary-value">{formData.full_name}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Email:</span>
                        <span className="summary-value">{formData.email}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Phone:</span>
                        <span className="summary-value">{formData.phone}</span>
                      </div>
                    </div>

                    <div className="summary-section">
                      <h5>Rental Details</h5>
                      <div className="summary-item">
                        <span className="summary-label">Desired Move-in:</span>
                        <span className="summary-value">{formData.desired_move_in_date}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Rent Budget:</span>
                        <span className="summary-value">${formData.rent_budget}</span>
                      </div>
                      {listing.application_form_config?.global_settings?.application_fee && (
                        <div className="summary-item">
                          <span className="summary-label">Application Fee:</span>
                          <span className="summary-value">${listing.application_form_config.global_settings.application_fee}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="agreements-section">
                  <div className="agreements-header">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10,9 9,9 8,9"/>
                    </svg>
                    <h4>Required Agreements</h4>
                  </div>
                  
                  <div className="agreements-list">
                    <div className="agreement-item">
                      <label className="form-checkbox-enhanced">
                        <input
                          type="checkbox"
                          name="background_check_consent"
                          checked={formData.background_check_consent}
                          onChange={handleInputChange}
                          required
                        />
                        <div className="checkbox-content">
                          <span className="checkbox-title">Background & Credit Check Consent</span>
                          <span className="checkbox-description">I consent to a background check and credit check as part of the application process</span>
                        </div>
                      </label>
                    </div>

                    <div className="agreement-item">
                      <label className="form-checkbox-enhanced">
                        <input
                          type="checkbox"
                          name="terms_agreement"
                          checked={formData.terms_agreement}
                          onChange={handleInputChange}
                          required
                        />
                        <div className="checkbox-content">
                          <span className="checkbox-title">Terms & Conditions Agreement</span>
                          <span className="checkbox-description">I agree to the terms and conditions and certify that all information provided is accurate</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="modal-footer">
            <div className="navigation-buttons">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15,18 9,12 15,6"/>
                  </svg>
                  Previous
                </button>
              )}
              
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  Next
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9,18 15,12 9,6"/>
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting && (
                    <div className="loading-spinner" />
                  )}
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </div>
          </div>
        </form>
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

        .modal-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          max-width: 700px;
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
        }

        .modal-title {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
          padding: 8px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .progress-bar {
          height: 4px;
          background: #e5e7eb;
          position: relative;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #3b82f6;
          transition: width 0.3s ease;
        }

        .progress-text {
          text-align: center;
          padding: 16px;
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }

        .modal-body {
          padding: 0 24px;
        }

        .step-content {
          padding: 24px 0;
        }

        .step-content h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 24px 0;
        }

        .form-section {
          margin-bottom: 24px;
          padding: 20px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .form-section h4 {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 16px 0;
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

        .form-label.required::after {
          content: ' *';
          color: #ef4444;
        }

        .form-input,
        .form-select,
        .form-textarea {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
          background: white;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-textarea {
          resize: vertical;
          font-family: inherit;
        }

        .form-checkbox {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          cursor: pointer;
          font-size: 14px;
          color: #374151;
          line-height: 1.5;
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #f9fafb;
          transition: all 0.2s;
        }

        .form-checkbox:hover {
          border-color: #d1d5db;
          background: #f3f4f6;
        }

        .form-checkbox input {
          margin: 0;
          width: 18px;
          height: 18px;
          accent-color: #3b82f6;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .form-checkbox input:checked + span {
          color: #1f2937;
          font-weight: 500;
        }

        .final-step-container {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .application-summary {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .summary-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #e2e8f0;
        }

        .summary-header svg {
          color: #22c55e;
          flex-shrink: 0;
        }

        .summary-header h4 {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }

        .summary-section {
          background: white;
          border-radius: 8px;
          padding: 20px;
          border: 1px solid #e2e8f0;
        }

        .summary-section h5 {
          font-size: 14px;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.025em;
          margin: 0 0 16px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid #e2e8f0;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .summary-item:last-child {
          border-bottom: none;
        }

        .summary-label {
          font-weight: 500;
          color: #64748b;
          font-size: 14px;
          min-width: 120px;
        }

        .summary-value {
          color: #1e293b;
          font-weight: 500;
          font-size: 14px;
          text-align: right;
          flex: 1;
          margin-left: 16px;
        }

        .agreements-section {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .agreements-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #e2e8f0;
        }

        .agreements-header svg {
          color: #3b82f6;
          flex-shrink: 0;
        }

        .agreements-header h4 {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .agreements-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .agreement-item {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          padding: 20px;
          transition: all 0.2s ease;
        }

        .agreement-item:hover {
          border-color: #cbd5e1;
          box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.05);
        }

        .form-checkbox-enhanced {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          cursor: pointer;
          width: 100%;
        }

        .form-checkbox-enhanced input {
          margin: 0;
          width: 20px;
          height: 20px;
          accent-color: #3b82f6;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .checkbox-content {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }

        .checkbox-title {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          line-height: 1.4;
        }

        .checkbox-description {
          font-size: 14px;
          color: #64748b;
          line-height: 1.5;
        }

        .form-checkbox-enhanced input:checked + .checkbox-content .checkbox-title {
          color: #3b82f6;
        }

        .form-checkbox-enhanced input:checked + .checkbox-content .checkbox-description {
          color: #475569;
        }

        .alert {
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .alert-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          padding: 20px 24px;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .navigation-buttons {
          display: flex;
          gap: 12px;
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .btn-secondary:disabled {
          opacity: 0.6;
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

        @media (max-width: 768px) {
          .modal-overlay {
            padding: 10px;
          }

          .modal-content {
            max-width: 100%;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .final-step-container {
            gap: 24px;
          }

          .application-summary,
          .agreements-section {
            padding: 20px;
          }

          .summary-header,
          .agreements-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            text-align: left;
          }

          .summary-header h4,
          .agreements-header h4 {
            font-size: 16px;
          }

          .summary-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }

          .summary-label {
            min-width: auto;
          }

          .summary-value {
            text-align: left;
            margin-left: 0;
          }

          .agreement-item {
            padding: 16px;
          }

          .checkbox-title {
            font-size: 15px;
          }

          .checkbox-description {
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
} 