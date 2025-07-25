import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { apiRequest } from '../lib/api';
import { Property } from '../lib/types';

interface CreateListingModalProps {
  onClose: () => void;
  onSubmit: (listingData: any) => Promise<void>;
}

export default function CreateListingModal({ onClose, onSubmit }: CreateListingModalProps) {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    property_id: '',
    title: '',
    description: '',
    available_from: '',
    application_deadline: '',
    max_occupancy: '',
    min_lease_term: '',
    max_lease_term: '',
    application_fee: '',
    security_deposit: '',
    pet_policy: 'not_allowed',
    smoking_allowed: false,
    furnished: false,
    utilities_included: [] as string[],
    amenities: [] as string[],
    application_form_config: {},
    contact_email: user?.email || '',
    contact_phone: '',
    virtual_tour_url: '',
    is_active: true,
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/api/properties/', {
        method: 'GET',
      });
      setProperties(response.results || []);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to load properties. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  const handleMultiSelectChange = (name: string, value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked 
        ? [...prev[name as keyof typeof prev] as string[], value]
        : (prev[name as keyof typeof prev] as string[]).filter(item => item !== value)
    }));
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return formData.property_id && formData.title && formData.description;
      case 2:
        // Photos & Media step - add validation for media fields when implemented
        return true;
      case 3:
        // Property Details step
        return formData.available_from && formData.max_occupancy && formData.min_lease_term;
      case 4:
        // Application Settings step - add validation for application fields when implemented
        return true;
      case 5:
        // Contact & Publish step
        return formData.contact_email;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
      setError(null);
    } else {
      setError('Please fill in all required fields before continuing.');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(5)) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Prepare submission data
      const submitData = {
        ...formData,
        property_id: parseInt(formData.property_id),
        max_occupancy: parseInt(formData.max_occupancy),
        min_lease_term: parseInt(formData.min_lease_term),
        max_lease_term: formData.max_lease_term ? parseInt(formData.max_lease_term) : null,
        application_fee: formData.application_fee ? parseFloat(formData.application_fee) : null,
        security_deposit: formData.security_deposit ? parseFloat(formData.security_deposit) : null,
        available_from: formData.available_from || null,
        application_deadline: formData.application_deadline || null,
        virtual_tour_url: formData.virtual_tour_url || null,
        // Default application form config - can be customized later
        application_form_config: {
          steps: [
            { id: 'personal', name: 'Personal Information', required: true },
            { id: 'employment', name: 'Employment Details', required: true },
            { id: 'references', name: 'References', required: true },
            { id: 'documents', name: 'Documents', required: true },
          ]
        }
      };

      await onSubmit(submitData);
    } catch (err: any) {
      console.error('Error creating listing:', err);
      setError(err.message || 'Failed to create listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getSelectedProperty = () => {
    return properties.find(p => p.id === parseInt(formData.property_id));
  };

  const utilityOptions = [
    'electricity', 'gas', 'water', 'sewer', 'trash', 'internet', 'cable_tv', 'heating', 'cooling'
  ];

  const amenityOptions = [
    'parking', 'laundry', 'gym', 'pool', 'garden', 'balcony', 'storage', 'elevator', 'security_system'
  ];

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Create Property Listing</h2>
          <button onClick={onClose} className="modal-close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Basic Info</div>
          </div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Photos & Media</div>
          </div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Property Details</div>
          </div>
          <div className={`step ${currentStep >= 4 ? 'active' : ''} ${currentStep > 4 ? 'completed' : ''}`}>
            <div className="step-number">4</div>
            <div className="step-label">Application Settings</div>
          </div>
          <div className={`step ${currentStep >= 5 ? 'active' : ''} ${currentStep > 5 ? 'completed' : ''}`}>
            <div className="step-number">5</div>
            <div className="step-label">Contact & Publish</div>
          </div>
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

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="step-content">
              <div className="form-section">
                <h3 className="section-title">Basic Information</h3>
                
                <div className="form-group">
                  <label className="form-label required">Property *</label>
                  <select
                    name="property_id"
                    value={formData.property_id}
                    onChange={handleInputChange}
                    className="form-select"
                    required
                  >
                    <option value="">Select a property</option>
                    {properties.map(property => (
                      <option key={property.id} value={property.id}>
                        {property.name} - {property.address}
                      </option>
                    ))}
                  </select>
                  {loading && <p className="form-hint">Loading properties...</p>}
                </div>

                <div className="form-group">
                  <label className="form-label required">Listing Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="e.g., Beautiful 2-Bedroom Apartment Available"
                    required
                  />
                  <p className="form-hint">Create an attractive title that will catch potential tenants' attention</p>
                </div>

                <div className="form-group">
                  <label className="form-label required">Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="form-textarea"
                    rows={4}
                    placeholder="Describe the property, its features, and what makes it special..."
                    required
                  />
                  <p className="form-hint">Provide a detailed description of the property and its amenities</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Photos & Media */}
          {currentStep === 2 && (
            <div className="step-content">
              <div className="form-section">
                <h3 className="section-title">Photos & Media</h3>
                <p className="section-description">Add photos and media to showcase your property</p>
                
                <div className="form-group">
                  <label className="form-label">Property Photos</label>
                  <div className="upload-area">
                    <p>Photo upload functionality will be implemented here</p>
                    <p className="form-hint">Add high-quality photos of your property, rooms, and amenities</p>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="virtual_tour_url">Virtual Tour URL</label>
                  <input
                    type="url"
                    id="virtual_tour_url"
                    name="virtual_tour_url"
                    value={formData.virtual_tour_url}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className="form-input"
                  />
                  <p className="form-hint">Link to virtual tour, video, or 360° photos</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Property Details */}
          {currentStep === 3 && (
            <div className="step-content">
              <div className="form-section">
                <h3 className="section-title">Property Details</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Available From *</label>
                    <input
                      type="date"
                      name="available_from"
                      value={formData.available_from}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Application Deadline</label>
                    <input
                      type="date"
                      name="application_deadline"
                      value={formData.application_deadline}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Max Occupancy *</label>
                    <input
                      type="number"
                      name="max_occupancy"
                      value={formData.max_occupancy}
                      onChange={handleInputChange}
                      className="form-input"
                      min="1"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label required">Min Lease Term (months) *</label>
                    <input
                      type="number"
                      name="min_lease_term"
                      value={formData.min_lease_term}
                      onChange={handleInputChange}
                      className="form-input"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Max Lease Term (months)</label>
                    <input
                      type="number"
                      name="max_lease_term"
                      value={formData.max_lease_term}
                      onChange={handleInputChange}
                      className="form-input"
                      min="1"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Application Fee</label>
                    <input
                      type="number"
                      name="application_fee"
                      value={formData.application_fee}
                      onChange={handleInputChange}
                      className="form-input"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Security Deposit</label>
                  <input
                    type="number"
                    name="security_deposit"
                    value={formData.security_deposit}
                    onChange={handleInputChange}
                    className="form-input"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-title">Policies & Preferences</h3>
                
                <div className="form-group">
                  <label className="form-label">Pet Policy</label>
                  <select
                    name="pet_policy"
                    value={formData.pet_policy}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="not_allowed">Not Allowed</option>
                    <option value="cats_only">Cats Only</option>
                    <option value="dogs_only">Dogs Only</option>
                    <option value="cats_and_dogs">Cats and Dogs</option>
                    <option value="all_pets">All Pets</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-checkbox">
                      <input
                        type="checkbox"
                        name="smoking_allowed"
                        checked={formData.smoking_allowed}
                        onChange={handleInputChange}
                      />
                      Smoking Allowed
                    </label>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-checkbox">
                      <input
                        type="checkbox"
                        name="furnished"
                        checked={formData.furnished}
                        onChange={handleInputChange}
                      />
                      Furnished
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Utilities Included</label>
                  <div className="checkbox-grid">
                    {utilityOptions.map(utility => (
                      <label key={utility} className="form-checkbox">
                        <input
                          type="checkbox"
                          checked={formData.utilities_included.includes(utility)}
                          onChange={(e) => handleMultiSelectChange('utilities_included', utility, e.target.checked)}
                        />
                        {utility.replace('_', ' ').toUpperCase()}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Amenities</label>
                  <div className="checkbox-grid">
                    {amenityOptions.map(amenity => (
                      <label key={amenity} className="form-checkbox">
                        <input
                          type="checkbox"
                          checked={formData.amenities.includes(amenity)}
                          onChange={(e) => handleMultiSelectChange('amenities', amenity, e.target.checked)}
                        />
                        {amenity.replace('_', ' ').toUpperCase()}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Contact & Finish */}
          {currentStep === 3 && (
            <div className="step-content">
              <div className="form-section">
                <h3 className="section-title">Contact Information</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Contact Email *</label>
                    <input
                      type="email"
                      name="contact_email"
                      value={formData.contact_email}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Contact Phone</label>
                    <input
                      type="tel"
                      name="contact_phone"
                      value={formData.contact_phone}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Virtual Tour URL</label>
                  <input
                    type="url"
                    name="virtual_tour_url"
                    value={formData.virtual_tour_url}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="https://..."
                  />
                  <p className="form-hint">Optional: Add a link to a virtual tour or video walkthrough</p>
                </div>

                <div className="form-group">
                  <label className="form-checkbox">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                    />
                    Make this listing active immediately
                  </label>
                  <p className="form-hint">You can always activate/deactivate listings later</p>
                </div>
              </div>

              {getSelectedProperty() && (
                <div className="form-section">
                  <h3 className="section-title">Selected Property</h3>
                  <div className="property-preview">
                    <div className="property-info">
                      <h4 className="property-name">{getSelectedProperty()?.name}</h4>
                      <p className="property-address">{getSelectedProperty()?.address}</p>
                      <p className="property-type">{getSelectedProperty()?.property_type}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Application Settings */}
          {currentStep === 4 && (
            <div className="step-content">
              <h3 className="section-title">Application Settings</h3>
              <div className="form-section">
                <div className="form-group">
                  <label htmlFor="application_fee">Application Fee ($)</label>
                  <input
                    type="number"
                    id="application_fee"
                    name="application_fee"
                    value={formData.application_fee}
                    onChange={handleInputChange}
                    placeholder="e.g., 50"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="security_deposit">Security Deposit ($)</label>
                  <input
                    type="number"
                    id="security_deposit"
                    name="security_deposit"
                    value={formData.security_deposit}
                    onChange={handleInputChange}
                    placeholder="e.g., 1500"
                  />
                </div>

                <div className="form-group">
                  <label>Pet Policy</label>
                  <select
                    name="pet_policy"
                    value={formData.pet_policy}
                    onChange={handleInputChange}
                  >
                    <option value="not_allowed">Not Allowed</option>
                    <option value="cats_only">Cats Only</option>
                    <option value="dogs_only">Dogs Only</option>
                    <option value="cats_and_dogs">Cats and Dogs</option>
                    <option value="all_pets">All Pets Welcome</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-checkbox">
                    <input
                      type="checkbox"
                      name="smoking_allowed"
                      checked={formData.smoking_allowed}
                      onChange={handleInputChange}
                    />
                    Smoking allowed
                  </label>
                </div>

                <div className="form-group">
                  <label className="form-checkbox">
                    <input
                      type="checkbox"
                      name="furnished"
                      checked={formData.furnished}
                      onChange={handleInputChange}
                    />
                    Furnished
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Contact & Publish */}
          {currentStep === 5 && (
            <div className="step-content">
              <h3 className="section-title">Contact & Publish</h3>
              <div className="form-section">
                <div className="form-group">
                  <label htmlFor="contact_email">Contact Email *</label>
                  <input
                    type="email"
                    id="contact_email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleInputChange}
                    required
                    placeholder="landlord@example.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact_phone">Contact Phone</label>
                  <input
                    type="tel"
                    id="contact_phone"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleInputChange}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="virtual_tour_url">Virtual Tour URL</label>
                  <input
                    type="url"
                    id="virtual_tour_url"
                    name="virtual_tour_url"
                    value={formData.virtual_tour_url}
                    onChange={handleInputChange}
                    placeholder="https://..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-checkbox">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                    />
                    Make this listing active immediately
                  </label>
                  <p className="form-hint">You can always activate/deactivate listings later</p>
                </div>
              </div>

              {getSelectedProperty() && (
                <div className="form-section">
                  <h3 className="section-title">Selected Property</h3>
                  <div className="property-preview">
                    <div className="property-info">
                      <h4 className="property-name">{getSelectedProperty()?.name}</h4>
                      <p className="property-address">{getSelectedProperty()?.address}</p>
                      <p className="property-type">{getSelectedProperty()?.property_type}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="modal-footer">
            <div className="navigation-buttons">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn btn-secondary"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15,18 9,12 15,6"/>
                  </svg>
                  Previous
                </button>
              )}
              
              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn btn-primary"
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
                  {submitting ? 'Creating...' : 'Create Listing'}
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
          max-width: 800px;
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

        .progress-steps {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 24px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          flex: 1;
          max-width: 200px;
        }

        .step:not(:last-child)::after {
          content: '';
          position: absolute;
          top: 20px;
          right: -50%;
          width: 100%;
          height: 2px;
          background: #e5e7eb;
          z-index: 1;
        }

        .step.completed:not(:last-child)::after {
          background: #10b981;
        }

        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #e5e7eb;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          position: relative;
          z-index: 2;
          transition: all 0.2s;
        }

        .step.active .step-number {
          background: #3b82f6;
          color: white;
        }

        .step.completed .step-number {
          background: #10b981;
          color: white;
        }

        .step-label {
          margin-top: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          text-align: center;
        }

        .step.active .step-label {
          color: #3b82f6;
        }

        .step.completed .step-label {
          color: #10b981;
        }

        .modal-body {
          padding: 0 24px;
        }

        .step-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-bottom: 24px;
        }

        .form-section {
          background: #f9fafb;
          border-radius: 8px;
          padding: 20px;
        }

        .section-title {
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
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #374151;
        }

        .form-checkbox input {
          margin: 0;
          width: 16px;
          height: 16px;
          accent-color: #3b82f6;
        }

        .checkbox-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 8px;
          margin-top: 8px;
        }

        .form-hint {
          font-size: 12px;
          color: #6b7280;
          margin: 0;
        }

        .property-preview {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 16px;
        }

        .property-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .property-name {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .property-address {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .property-type {
          font-size: 12px;
          color: #9ca3af;
          margin: 0;
          text-transform: capitalize;
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

        .btn-secondary:hover {
          background: #e5e7eb;
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

          .progress-steps {
            padding: 16px 12px;
          }

          .step {
            max-width: 120px;
          }

          .step-label {
            font-size: 12px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .checkbox-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
} 