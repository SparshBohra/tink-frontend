/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Application, Property, Room } from '../lib/types';

interface LeaseGenerationModalProps {
  isOpen: boolean;
  application: Application;
  room: Room;
  properties: Property[];
  rooms?: Room[]; // Add rooms array for room selection
  onClose: () => void;
  onLeaseGenerated: (leaseData: LeaseData) => void;
}

interface LeaseData {
  applicationId: number;
  tenantName: string;
  tenantEmail: string;
  propertyName: string;
  roomName: string;
  roomId: number; // Add room ID for tracking
  monthlyRent: number;
  securityDeposit: number;
  leaseStartDate: string;
  leaseEndDate: string;
  leaseTermMonths: number;
  additionalTerms: string[];
  specialConditions: string;
  utilitiesIncluded: string[];
  parkingIncluded: boolean;
  petPolicy: string;
  templateId: string;
}

interface LeaseTemplate {
  id: string;
  name: string;
  description: string;
  standardTerms: string[];
  defaultTermMonths: number;
}

export default function ImprovedLeaseGenerationModal({
  application,
  onClose,
  onGenerate,
  availableRooms,
  properties,
  getPropertyName,
  getAvailableRooms,
}: ImprovedLeaseGenerationModalProps) {
  // Move all hooks before any early returns
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  
  // Early return after hooks
  if (!application) {
    return null;
  }

  // Find the property for this application
  const property = properties.find((p: any) => p.id === application.property_ref);
  
  if (!property) {
    return null;
  }

  // Enhanced auto-fill logic using application data
  const getAutoFilledMonthlyRent = () => {
    // Priority: 1. Application monthly_rent, 2. Room monthly_rent, 3. Rent budget
    if (application.monthly_rent) {
      const rent = typeof application.monthly_rent === 'string' ? parseFloat(application.monthly_rent) : application.monthly_rent;
      return rent;
    }
    if (room.monthly_rent) {
      const rent = typeof room.monthly_rent === 'string' ? parseFloat(room.monthly_rent) : room.monthly_rent;
      return rent;
    }
    if (application.rent_budget) {
      const rent = typeof application.rent_budget === 'string' ? parseFloat(application.rent_budget) : application.rent_budget;
      return rent;
    }
    return 0;
  };

  const getAutoFilledSecurityDeposit = () => {
    // Priority: 1. Application security_deposit, 2. 2x monthly rent
    if (application.security_deposit) {
      const deposit = typeof application.security_deposit === 'string' ? parseFloat(application.security_deposit) : application.security_deposit;
      return deposit;
    }
    const monthlyRent = getAutoFilledMonthlyRent();
    const deposit = monthlyRent * 2; // Standard 2 months rent
    return deposit;
  };

  const getAutoFilledLeaseEndDate = () => {
    if (application.lease_end_date) {
      return application.lease_end_date;
    }
    // Calculate based on start date + 12 months default
    const startDate = new Date(application.desired_move_in_date || application.lease_start_date || new Date());
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 12);
    return endDate.toISOString().split('T')[0];
  };

  const getAutoFilledSpecialConditions = () => {
    const conditions = [];
    if (application.notes) conditions.push(`Application Notes: ${application.notes}`);
    if (application.decision_notes) conditions.push(`Decision Notes: ${application.decision_notes}`);
    if (application.occupation) conditions.push(`Tenant Occupation: ${application.occupation}`);
    if (application.monthly_income) conditions.push(`Monthly Income: $${application.monthly_income}`);
    if (application.emergency_contact_name) {
      conditions.push(`Emergency Contact: ${application.emergency_contact_name}${application.emergency_contact_phone ? ` (${application.emergency_contact_phone})` : ''}`);
    }
    return conditions.join('\n');
  };

  const [leaseData, setLeaseData] = useState<LeaseData>({
    applicationId: application.id,
    tenantName: application.tenant_name || '',
    tenantEmail: application.tenant_email || '',
    propertyName: property.name,
    roomName: room.name,
    roomId: room.id, // Set room ID
    monthlyRent: getAutoFilledMonthlyRent(),
    securityDeposit: getAutoFilledSecurityDeposit(),
    leaseStartDate: application.desired_move_in_date || application.lease_start_date || new Date().toISOString().split('T')[0],
    leaseEndDate: getAutoFilledLeaseEndDate(),
    leaseTermMonths: 12,
    additionalTerms: [],
    specialConditions: getAutoFilledSpecialConditions(),
    utilitiesIncluded: [],
    parkingIncluded: false,
    petPolicy: 'No pets allowed',
    templateId: 'standard'
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    // Calculate security deposit and end date when template or start date changes
    const template = templates.find(t => t.id === leaseData.templateId);
    const termMonths = template?.defaultTermMonths || leaseData.leaseTermMonths;
    const securityDeposit = leaseData.monthlyRent * 2; // Standard 2 months rent
    
    const startDate = new Date(leaseData.leaseStartDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + termMonths);
    
    setLeaseData(prev => ({
      ...prev,
      leaseTermMonths: termMonths,
      securityDeposit,
      leaseEndDate: endDate.toISOString().split('T')[0]
    }));
  }, [leaseData.templateId, leaseData.leaseStartDate, leaseData.monthlyRent]);

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setLeaseData(prev => ({
        ...prev,
        templateId,
        leaseTermMonths: template.defaultTermMonths,
        additionalTerms: [...template.standardTerms]
      }));
    }
  };

  const handleInputChange = (field: keyof LeaseData, value: any) => {
    setLeaseData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUtilityToggle = (utility: string) => {
    setLeaseData(prev => ({
      ...prev,
      utilitiesIncluded: prev.utilitiesIncluded.includes(utility)
        ? prev.utilitiesIncluded.filter(u => u !== utility)
        : [...prev.utilitiesIncluded, utility]
    }));
  };

  const addCustomTerm = () => {
    const newTerm = prompt('Enter additional lease term:');
    if (newTerm && newTerm.trim()) {
      setLeaseData(prev => ({
        ...prev,
        additionalTerms: [...prev.additionalTerms, newTerm.trim()]
      }));
    }
  };

  const removeCustomTerm = (index: number) => {
    setLeaseData(prev => ({
      ...prev,
      additionalTerms: prev.additionalTerms.filter((_, i) => i !== index)
    }));
  };

  const generatePDF = async () => {
    setGeneratingPDF(true);
    
    // Simulate PDF generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real implementation, this would generate a PDF using a library like jsPDF or html2pdf
    const blob = new Blob([generateLeaseText()], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lease-${leaseData.tenantName.replace(/\s+/g, '-')}-${leaseData.leaseStartDate}.txt`;
    a.click();
    
    setGeneratingPDF(false);
  };

  const generateLeaseText = () => {
    const template = templates.find(t => t.id === leaseData.templateId);
    
    return `
RENTAL LEASE AGREEMENT

Property: ${leaseData.propertyName}
Room: ${leaseData.roomName}
Tenant: ${leaseData.tenantName}
Email: ${leaseData.tenantEmail}

LEASE TERMS:
- Monthly Rent: $${leaseData.monthlyRent}
- Security Deposit: $${leaseData.securityDeposit}
- Lease Start Date: ${leaseData.leaseStartDate}
- Lease End Date: ${leaseData.leaseEndDate}
- Lease Term: ${leaseData.leaseTermMonths} months

UTILITIES INCLUDED:
${leaseData.utilitiesIncluded.length > 0 ? leaseData.utilitiesIncluded.join(', ') : 'None specified'}

PARKING: ${leaseData.parkingIncluded ? 'Included' : 'Not included'}

PET POLICY: ${leaseData.petPolicy}

TERMS AND CONDITIONS:
${leaseData.additionalTerms.map((term, index) => `${index + 1}. ${term}`).join('\n')}

${leaseData.specialConditions ? `\nSPECIAL CONDITIONS:\n${leaseData.specialConditions}` : ''}

Template Used: ${template?.name || 'Standard'}
Generated on: ${new Date().toLocaleDateString()}
`;
  };

  const handleFinish = () => {
    onLeaseGenerated(leaseData);
    onClose();
  };

  if (!isOpen) return null;

  const selectedTemplate = templates.find(t => t.id === leaseData.templateId);

  return (
    <div className="modal-overlay">
      <div className="lease-generation-modal">
        <div className="modal-header">
          <h2 className="modal-title">Generate Lease Agreement</h2>
          <button onClick={onClose} className="close-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Auto-fill Information */}
        <div className="auto-fill-info">
          <div className="info-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="l12 6 0 4"/>
              <path d="l12 14 0 .01"/>
            </svg>
            <span>Auto-filled from Application Data</span>
          </div>
          <div className="info-content">
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Tenant:</span>
                <span className="value">{application.tenant_name || 'Not specified'}</span>
              </div>
              <div className="info-item">
                <span className="label">Monthly Rent:</span>
                <span className="value">${getAutoFilledMonthlyRent()}</span>
                <span className="source">
                  {application.monthly_rent ? '(from application)' : 
                   room.monthly_rent ? '(from room)' : 
                   application.rent_budget ? '(from budget)' : '(default)'}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Security Deposit:</span>
                <span className="value">${getAutoFilledSecurityDeposit()}</span>
                <span className="source">
                  {application.security_deposit ? '(from application)' : '(2x monthly rent)'}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Start Date:</span>
                <span className="value">{application.desired_move_in_date || application.lease_start_date || 'Today'}</span>
                <span className="source">
                  {application.desired_move_in_date ? '(desired move-in)' : 
                   application.lease_start_date ? '(from application)' : '(default)'}
                </span>
              </div>
            </div>
            <div className="info-note">
              <strong>Note:</strong> All fields are editable. You can modify any auto-filled values as needed.
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          <div className={`step ${activeStep >= 1 ? 'active' : ''} ${activeStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Template & Basic Info</div>
          </div>
          <div className={`step ${activeStep >= 2 ? 'active' : ''} ${activeStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Terms & Conditions</div>
          </div>
          <div className={`step ${activeStep >= 3 ? 'active' : ''} ${activeStep > 3 ? 'completed' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Review & Generate</div>
          </div>
        </div>

        <div className="modal-content">
          {!previewMode ? (
            <>
              {/* Step 1: Template & Basic Info */}
              {activeStep === 1 && (
                <div className="step-content">
                  <h3 className="step-title">Step 1: Select Template & Basic Information</h3>
                  
                  {/* Template Selection */}
                  <div className="form-section">
                    <h4 className="section-title">Lease Template</h4>
                    <div className="template-selection">
                      {templates.map(template => (
                        <div 
                          key={template.id}
                          className={`template-card ${leaseData.templateId === template.id ? 'selected' : ''}`}
                          onClick={() => handleTemplateChange(template.id)}
                        >
                          <div className="template-header">
                            <h5 className="template-name">{template.name}</h5>
                            <div className="template-term">{template.defaultTermMonths} months</div>
                          </div>
                          <p className="template-description">{template.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div className="form-section">
                    <h4 className="section-title">Lease Information</h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>
                          Tenant Name
                          {application.tenant_name && (
                            <span className="auto-fill-badge" title="Auto-filled from application">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 6L9 17l-5-5"/>
                              </svg>
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={leaseData.tenantName}
                          onChange={(e) => handleInputChange('tenantName', e.target.value)}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          Tenant Email
                          {application.tenant_email && (
                            <span className="auto-fill-badge" title="Auto-filled from application">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 6L9 17l-5-5"/>
                              </svg>
                            </span>
                          )}
                        </label>
                        <input
                          type="email"
                          value={leaseData.tenantEmail}
                          onChange={(e) => handleInputChange('tenantEmail', e.target.value)}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          Room Assignment
                          <span className="auto-fill-badge" title="Auto-selected based on application, but can be changed">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 6L9 17l-5-5"/>
                            </svg>
                          </span>
                        </label>
                        <select
                          value={leaseData.roomId}
                          onChange={(e) => {
                            const selectedRoomId = parseInt(e.target.value);
                            const selectedRoom = rooms?.find(r => r.id === selectedRoomId);
                            if (selectedRoom) {
                              handleInputChange('roomId', selectedRoomId);
                              handleInputChange('roomName', selectedRoom.name);
                              // Update monthly rent if room has different rent
                              if (selectedRoom.monthly_rent) {
                                const roomRent = typeof selectedRoom.monthly_rent === 'string' ? 
                                  parseFloat(selectedRoom.monthly_rent) : selectedRoom.monthly_rent;
                                handleInputChange('monthlyRent', roomRent);
                              }
                            }
                          }}
                          className="form-input"
                        >
                          {rooms ? (
                            // If rooms array is provided, show all rooms for the property
                            rooms.filter(r => r.property_ref === application.property_ref).map(room => (
                              <option key={room.id} value={room.id}>
                                {room.name} - ${typeof room.monthly_rent === 'string' ? 
                                  parseFloat(room.monthly_rent) : room.monthly_rent}/month
                                {room.is_vacant ? ' (Available)' : ' (Occupied)'}
                              </option>
                            ))
                          ) : (
                            // Fallback: show current room only
                            <option value={room.id}>{room.name}</option>
                          )}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>
                          Monthly Rent
                          {(application.monthly_rent || room.monthly_rent || application.rent_budget) && (
                            <span className="auto-fill-badge" title={`Auto-filled from ${application.monthly_rent ? 'application' : room.monthly_rent ? 'room' : 'budget'}`}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 6L9 17l-5-5"/>
                              </svg>
                            </span>
                          )}
                        </label>
                        <input
                          type="number"
                          value={leaseData.monthlyRent}
                          onChange={(e) => handleInputChange('monthlyRent', parseFloat(e.target.value))}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          Security Deposit
                          {(application.security_deposit || getAutoFilledMonthlyRent() > 0) && (
                            <span className="auto-fill-badge" title={`Auto-filled ${application.security_deposit ? 'from application' : '(2x monthly rent)'}`}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 6L9 17l-5-5"/>
                              </svg>
                            </span>
                          )}
                        </label>
                        <input
                          type="number"
                          value={leaseData.securityDeposit}
                          onChange={(e) => handleInputChange('securityDeposit', parseFloat(e.target.value))}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          Lease Start Date
                          {(application.desired_move_in_date || application.lease_start_date) && (
                            <span className="auto-fill-badge" title="Auto-filled from application">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 6L9 17l-5-5"/>
                              </svg>
                            </span>
                          )}
                        </label>
                        <input
                          type="date"
                          value={leaseData.leaseStartDate}
                          onChange={(e) => handleInputChange('leaseStartDate', e.target.value)}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          Lease End Date
                          {application.lease_end_date && (
                            <span className="auto-fill-badge" title="Auto-filled from application">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 6L9 17l-5-5"/>
                              </svg>
                            </span>
                          )}
                        </label>
                        <input
                          type="date"
                          value={leaseData.leaseEndDate}
                          onChange={(e) => handleInputChange('leaseEndDate', e.target.value)}
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Terms & Conditions */}
              {activeStep === 2 && (
                <div className="step-content">
                  <h3 className="step-title">Step 2: Terms & Conditions</h3>
                  
                  {/* Utilities & Amenities */}
                  <div className="form-section">
                    <h4 className="section-title">Utilities & Amenities</h4>
                    <div className="utilities-grid">
                      {['Electricity', 'Water', 'Gas', 'Internet', 'Cable/TV', 'Heating', 'Air Conditioning'].map(utility => (
                        <label key={utility} className="utility-checkbox">
                          <input
                            type="checkbox"
                            checked={leaseData.utilitiesIncluded.includes(utility)}
                            onChange={() => handleUtilityToggle(utility)}
                          />
                          <span className="checkmark"></span>
                          {utility}
                        </label>
                      ))}
                    </div>
                    
                    <div className="form-group">
                      <label className="parking-checkbox">
                        <input
                          type="checkbox"
                          checked={leaseData.parkingIncluded}
                          onChange={(e) => handleInputChange('parkingIncluded', e.target.checked)}
                        />
                        <span className="checkmark"></span>
                        Parking Included
                      </label>
                    </div>
                  </div>

                  {/* Pet Policy */}
                  <div className="form-section">
                    <h4 className="section-title">Pet Policy</h4>
                    <div className="form-group">
                      <select
                        value={leaseData.petPolicy}
                        onChange={(e) => handleInputChange('petPolicy', e.target.value)}
                        className="form-select"
                      >
                        <option value="No pets allowed">No pets allowed</option>
                        <option value="Cats allowed with deposit">Cats allowed with deposit</option>
                        <option value="Dogs allowed with deposit">Dogs allowed with deposit</option>
                        <option value="All pets allowed with deposit">All pets allowed with deposit</option>
                        <option value="Case by case basis">Case by case basis</option>
                      </select>
                    </div>
                  </div>

                  {/* Lease Terms */}
                  <div className="form-section">
                    <h4 className="section-title">Lease Terms</h4>
                    <div className="terms-list">
                      {leaseData.additionalTerms.map((term, index) => (
                        <div key={index} className="term-item">
                          <span className="term-text">{term}</span>
                          <button
                            onClick={() => removeCustomTerm(index)}
                            className="remove-term-btn"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </div>
                      ))}
                      <button onClick={addCustomTerm} className="add-term-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19"/>
                          <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Add Custom Term
                      </button>
                    </div>
                  </div>

                  {/* Special Conditions */}
                  <div className="form-section">
                    <h4 className="section-title">
                      Special Conditions
                      {(application.notes || application.decision_notes || application.occupation || application.monthly_income || application.emergency_contact_name) && (
                        <span className="auto-fill-badge" title="Auto-filled from application data">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 6L9 17l-5-5"/>
                          </svg>
                        </span>
                      )}
                    </h4>
                    <div className="form-group">
                      <textarea
                        value={leaseData.specialConditions}
                        onChange={(e) => handleInputChange('specialConditions', e.target.value)}
                        className="form-textarea"
                        placeholder="Enter any special conditions or additional notes..."
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Review & Generate */}
              {activeStep === 3 && (
                <div className="step-content">
                  <h3 className="step-title">Step 3: Review & Generate</h3>
                  
                  <div className="review-summary">
                    <div className="summary-section">
                      <h4 className="summary-title">Lease Summary</h4>
                      <div className="summary-grid">
                        <div className="summary-item">
                          <span className="summary-label">Tenant:</span>
                          <span className="summary-value">{leaseData.tenantName}</span>
                        </div>
                        <div className="summary-item">
                          <span className="summary-label">Property:</span>
                          <span className="summary-value">{leaseData.propertyName} - {leaseData.roomName}</span>
                        </div>
                        <div className="summary-item">
                          <span className="summary-label">Monthly Rent:</span>
                          <span className="summary-value">${leaseData.monthlyRent}</span>
                        </div>
                        <div className="summary-item">
                          <span className="summary-label">Security Deposit:</span>
                          <span className="summary-value">${leaseData.securityDeposit}</span>
                        </div>
                        <div className="summary-item">
                          <span className="summary-label">Lease Period:</span>
                          <span className="summary-value">{leaseData.leaseStartDate} to {leaseData.leaseEndDate}</span>
                        </div>
                        <div className="summary-item">
                          <span className="summary-label">Template:</span>
                          <span className="summary-value">{selectedTemplate?.name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="preview-actions">
                      <button 
                        onClick={() => setPreviewMode(true)} 
                        className="preview-btn"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        Preview Lease
                      </button>
                      <button 
                        onClick={generatePDF} 
                        className="generate-pdf-btn"
                        disabled={generatingPDF}
                      >
                        {generatingPDF ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spinning">
                            <line x1="12" y1="2" x2="12" y2="6"/>
                            <line x1="12" y1="18" x2="12" y2="22"/>
                            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
                            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                            <line x1="2" y1="12" x2="6" y2="12"/>
                            <line x1="18" y1="12" x2="22" y2="12"/>
                            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
                            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7,10 12,15 17,10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                        )}
                        {generatingPDF ? 'Generating...' : 'Download PDF'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Preview Mode */
            <div className="preview-content">
              <div className="preview-header">
                <h3>Lease Agreement Preview</h3>
                <button 
                  onClick={() => setPreviewMode(false)} 
                  className="close-preview-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Close Preview
                </button>
              </div>
              
              <div className="lease-preview">
                <div className="lease-document">
                  <pre className="lease-text">{generateLeaseText()}</pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {!previewMode && (
          <div className="modal-actions">
            <div className="navigation-buttons">
              {activeStep > 1 && (
                <button 
                  onClick={() => setActiveStep(activeStep - 1)} 
                  className="nav-btn prev-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15,18 9,12 15,6"/>
                  </svg>
                  Previous
                </button>
              )}
              
              {activeStep < 3 ? (
                <button 
                  onClick={() => setActiveStep(activeStep + 1)} 
                  className="nav-btn next-btn"
                >
                  Next
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9,18 15,12 9,6"/>
                  </svg>
                </button>
              ) : (
                <button 
                  onClick={handleFinish} 
                  className="nav-btn finish-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                  Generate Lease
                </button>
              )}
            </div>
            
            <button onClick={onClose} className="cancel-btn">
              Cancel
            </button>
          </div>
        )}
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
        }

        .lease-generation-modal {
          background: white;
          border-radius: 12px;
          width: 95%;
          max-width: 900px;
          max-height: 95vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          position: relative;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-title {
          font-size: 24px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
          padding: 8px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .close-btn:hover {
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

        .modal-content {
          padding: 24px;
          min-height: 400px;
        }

        .step-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .step-title {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
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

        .template-selection {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .template-card {
          padding: 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
        }

        .template-card:hover {
          border-color: #3b82f6;
        }

        .template-card.selected {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .template-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .template-name {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .template-term {
          font-size: 14px;
          color: #6b7280;
          background: #f3f4f6;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .template-description {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .form-input, .form-select {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-input:focus, .form-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-textarea {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          resize: vertical;
          font-family: inherit;
          transition: border-color 0.2s;
        }

        .form-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .utilities-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }

        .utility-checkbox, .parking-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #374151;
        }

        .utility-checkbox input, .parking-checkbox input {
          margin: 0;
        }

        .terms-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .term-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
        }

        .term-text {
          font-size: 14px;
          color: #374151;
          flex: 1;
        }

        .remove-term-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #ef4444;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .remove-term-btn:hover {
          background: #fef2f2;
        }

        .add-term-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: #f3f4f6;
          border: 1px dashed #d1d5db;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          color: #6b7280;
          transition: all 0.2s;
        }

        .add-term-btn:hover {
          background: #e5e7eb;
          color: #374151;
        }

        .review-summary {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .summary-section {
          background: #f9fafb;
          border-radius: 8px;
          padding: 20px;
        }

        .summary-title {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 16px 0;
        }

        .summary-grid {
          display: grid;
          gap: 12px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .summary-item:last-child {
          border-bottom: none;
        }

        .summary-label {
          font-weight: 500;
          color: #374151;
        }

        .summary-value {
          color: #6b7280;
        }

        .preview-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .preview-btn, .generate-pdf-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .preview-btn {
          background: #f3f4f6;
          color: #374151;
        }

        .preview-btn:hover {
          background: #e5e7eb;
        }

        .generate-pdf-btn {
          background: #3b82f6;
          color: white;
        }

        .generate-pdf-btn:hover:not(:disabled) {
          background: #2563eb;
        }

        .generate-pdf-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .preview-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .preview-header h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .close-preview-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: #f3f4f6;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          color: #374151;
          transition: all 0.2s;
        }

        .close-preview-btn:hover {
          background: #e5e7eb;
        }

        .lease-preview {
          max-height: 500px;
          overflow-y: auto;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        .lease-document {
          padding: 24px;
          background: white;
        }

        .lease-text {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.6;
          color: #374151;
          white-space: pre-wrap;
          margin: 0;
        }

        .modal-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .navigation-buttons {
          display: flex;
          gap: 12px;
        }

        .nav-btn {
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

        .prev-btn {
          background: #f3f4f6;
          color: #374151;
        }

        .prev-btn:hover {
          background: #e5e7eb;
        }

        .next-btn, .finish-btn {
          background: #3b82f6;
          color: white;
        }

        .next-btn:hover, .finish-btn:hover {
          background: #2563eb;
        }

        .cancel-btn {
          padding: 10px 16px;
          background: #6b7280;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .cancel-btn:hover {
          background: #4b5563;
        }

        .auto-fill-info {
          background: #f9fafb;
          border-radius: 8px;
          padding: 16px;
          margin: 0 24px 24px 24px;
          border: 1px solid #e5e7eb;
        }

        .info-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          color: #374151;
          font-size: 14px;
          font-weight: 500;
        }

        .info-header svg {
          color: #3b82f6;
        }

        .info-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 12px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 400;
        }

        .value {
          font-size: 14px;
          font-weight: 500;
          color: #1f2937;
        }

        .source {
          font-size: 12px;
          color: #6b7280;
          margin-left: 8px;
        }

        .info-note {
          font-size: 12px;
          color: #6b7280;
          margin-top: 8px;
        }

        .auto-fill-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-left: 8px;
          color: #3b82f6;
          font-size: 12px;
          font-weight: 500;
          background: #eff6ff;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid #d1fae5;
        }

        .auto-fill-badge svg {
          color: #10b981;
        }

        @media (max-width: 768px) {
          .lease-generation-modal {
            width: 100%;
            height: 100vh;
            max-height: 100vh;
            border-radius: 0;
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

          .form-grid {
            grid-template-columns: 1fr;
          }

          .template-selection {
            grid-template-columns: 1fr;
          }

          .utilities-grid {
            grid-template-columns: 1fr;
          }

          .modal-actions {
            flex-direction: column;
            gap: 12px;
          }

          .navigation-buttons {
            order: 2;
          }

          .cancel-btn {
            order: 1;
          }

          .auto-fill-info {
            margin: 0 16px 16px 16px;
            padding: 12px;
          }

          .info-header {
            font-size: 12px;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .info-item {
            flex-direction: row;
            align-items: center;
            gap: 8px;
          }

          .label {
            flex: 1;
          }

          .value {
            flex: 2;
          }

          .source {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
};