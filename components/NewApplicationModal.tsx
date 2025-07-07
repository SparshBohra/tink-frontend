import { useState } from 'react';

// SVG Icons to replace lucide-react imports
const Settings = ({ size = 20, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m16.24-4.24l-4.24 4.24m-4.48 0L3.76 7.76m0 8.48l4.24-4.24m4.48 0l4.24 4.24"/>
  </svg>
);

const User = ({ size = 20, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const Home = ({ size = 20, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M3 21h18"/>
    <path d="M5 21V7l8-4v18"/>
    <path d="M19 21V11l-6-4"/>
  </svg>
);

const Briefcase = ({ size = 20, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

const Car = ({ size = 20, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18.4 10H5.6L3.5 11.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/>
    <circle cx="7" cy="17" r="2"/>
    <path d="M9 17h6"/>
    <circle cx="17" cy="17" r="2"/>
  </svg>
);

const Users = ({ size = 20, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const Phone = ({ size = 20, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const PawPrint = ({ size = 20, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="11" cy="4" r="2"/>
    <circle cx="18" cy="8" r="2"/>
    <circle cx="20" cy="16" r="2"/>
    <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>
  </svg>
);

const DollarSign = ({ size = 20, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const HelpCircle = ({ size = 20, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <path d="M12 17h.01"/>
  </svg>
);

const FileText = ({ size = 20, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10,9 9,9 8,9"/>
  </svg>
);

const CheckSquare = ({ size = 20, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polyline points="9,11 12,14 22,4"/>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
);

const Bell = ({ size = 20, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
  </svg>
);

const Link = ({ size = 20, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const Clock = ({ size = 20, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
  </svg>
);

const Save = ({ size = 20, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17,21 17,13 7,13 7,21"/>
    <polyline points="7,3 7,8 15,8"/>
  </svg>
);

const FileX = ({ size = 20, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="9.5" y1="12.5" x2="14.5" y2="17.5"/>
    <line x1="14.5" y1="12.5" x2="9.5" y2="17.5"/>
  </svg>
);

const Lock = ({ size = 20, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <circle cx="12" cy="16" r="1"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const Cloud = ({ size = 20, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
  </svg>
);

const Search = ({ size = 20, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const FileCheck2 = ({ size = 20, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <path d="m9 15 2 2 4-4"/>
  </svg>
);

const applicationSteps = [
    { name: 'Application Fees', icon: <Settings size={20} />, mandatory: false },
    { name: 'Welcome', icon: <Home size={20} />, mandatory: false },
    { name: 'Applicant Info', icon: <User size={20} />, mandatory: true },
    { name: 'Residential', icon: <Home size={20} />, mandatory: true },
    { name: 'Employment', icon: <Briefcase size={20} />, mandatory: true },
    { name: 'Vehicle', icon: <Car size={20} />, mandatory: false },
    { name: 'Dependants', icon: <Users size={20} />, mandatory: false },
    { name: 'Emergency Contacts', icon: <Phone size={20} />, mandatory: false },
    { name: 'Pets', icon: <PawPrint size={20} />, mandatory: false },
    { name: 'Additional Income & Assets', icon: <DollarSign size={20} />, mandatory: false },
    { name: 'Create Questions', icon: <HelpCircle size={20} />, mandatory: false },
    { name: 'Request Documents', icon: <FileText size={20} />, mandatory: false },
    { name: 'Terms & Conditions', icon: <CheckSquare size={20} />, mandatory: false },
    { name: 'Notifications', icon: <Bell size={20} />, mandatory: false },
    { name: 'Application Link', icon: <Link size={20} />, mandatory: false },
];

const NewApplicationModal = ({ onClose }: { onClose: () => void }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <ApplicationFeesStep />;
      case 1:
        return <WelcomeStep />;
      case 2:
        return <ApplicantInfoStep />;
      case 3:
        return <ResidentialStep />;
      case 4:
        return <EmploymentStep />;
      case 5:
        return <VehicleStep />;
      case 6:
        return <DependantsStep />;
      case 7:
        return <EmergencyContactsStep />;
      case 8:
        return <PetsStep />;
      case 9:
        return <AdditionalIncomeStep />;
      case 10:
        return <CreateQuestionsStep />;
      case 11:
        return <RequestDocumentsStep />;
      case 12:
        return <TermsConditionsStep />;
      case 13:
        return <NotificationsStep />;
      case 14:
        return <ApplicationLinkStep />;
      default:
        return <div>{applicationSteps[currentStep].name} - Coming Soon</div>;
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        <div className="modal-sidebar">
          <h2 className="sidebar-title">Rental Applications</h2>
          <nav className="sidebar-nav">
            {applicationSteps.map((step, index) => (
              <a
                key={index}
                href="#"
                className={`nav-item ${currentStep === index ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentStep(index);
                }}
              >
                {step.icon}
                <span>{step.name}</span>
                {step.mandatory && <span className="mandatory-indicator">Mandatory</span>}
              </a>
            ))}
          </nav>
        </div>
        <div className="modal-content">
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
          {renderStepContent()}
        </div>
      </div>
      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }
        .modal-container {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 1200px;
          height: 85vh;
          display: flex;
          overflow: hidden;
        }
        .modal-sidebar {
          width: 280px;
          background-color: #f7fafc;
          border-right: 1px solid #e2e8f0;
          padding: 24px;
          display: flex;
          flex-direction: column;
        }
        .sidebar-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 24px;
        }
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 6px;
          color: #4a5568;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
        }
        .nav-item.active {
          background-color: #e9d8fd;
          color: #8a2be2;
        }
        .nav-item:not(.active):hover {
            background-color: #e2e8f0;
        }
        .mandatory-indicator {
            margin-left: auto;
            font-size: 10px;
            font-weight: 600;
            color: #718096;
            background-color: #e2e8f0;
            padding: 2px 6px;
            border-radius: 4px;
        }
        .modal-content {
          flex: 1;
          padding: 24px 48px;
          position: relative;
          overflow-y: auto;
        }
        .close-button {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #718096;
        }
      `}</style>
    </div>
  );
};

const ApplicationFeesStep = () => {
    const [fee, setFee] = useState(60.00);
    const [addScreening, setAddScreening] = useState(true);
    const [agreeTerms, setAgreeTerms] = useState(false);

    const processingFee = -3.50;
    const screeningFee = addScreening ? 20.00 : 0;
    const netRevenue = fee + processingFee + screeningFee;


    return (
        <div>
            <h2 className="step-title">APPLICATION FEES</h2>
            
            <div className="form-section">
                <p className="section-description">This is the price applicants pay you</p>
                <div className="input-group">
                    <label htmlFor="application-fee">Custom application fee *</label>
                    <div className="fee-input">
                        <span>$</span>
                        <input 
                            type="number" 
                            id="application-fee" 
                            value={fee.toFixed(2)}
                            onChange={(e) => setFee(parseFloat(e.target.value))}
                        />
                    </div>
                </div>
                <div className="checkbox-group">
                    <input 
                        type="checkbox" 
                        id="tenant-screening" 
                        checked={addScreening}
                        onChange={(e) => setAddScreening(e.target.checked)}
                    />
                    <label htmlFor="tenant-screening">Add automatic tenant screening upfront—$20.00 per applicant (deducted from application fee)</label>
                </div>
            </div>

            <div className="plan-selection">
                <div className="radio-group">
                    <input type="radio" id="basic-plan" name="plan" value="basic" />
                    <label htmlFor="basic-plan">Basic Plan</label>
                </div>
                <div className="plan-details">
                    <p>Free for applicants—no background check included in this plan</p>
                    <p>Tenant screening is available for a $49.90 fee, paid by the applicant directly to Tink</p>
                </div>
            </div>

            <p className="info-text">Fees can always be adjusted manually for each new application</p>

            <div className="summary-section">
                <h3 className="summary-title">Summary</h3>
                <div className="summary-item">
                    <span>Application fee</span>
                    <span>${fee.toFixed(2)}</span>
                </div>
                <div className="summary-item">
                    <span>Card processing fee</span>
                    <span>-${Math.abs(processingFee).toFixed(2)}</span>
                </div>
                <div className="summary-item">
                    <span>TransUnion screening fee</span>
                    <span>${screeningFee.toFixed(2)}</span>
                </div>
                <hr className="divider" />
                <div className="summary-total">
                    <span>Your net revenue</span>
                    <span>${netRevenue.toFixed(2)}</span>
                </div>
            </div>

            <div className="terms-agreement">
                <input 
                    type="checkbox" 
                    id="agree-terms" 
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <label htmlFor="agree-terms">I agree to the <a>Tink</a> and <a>TransUnion</a> Terms and Conditions.</label>
            </div>

            <div className="form-actions">
                <button className="save-preview-btn">Save & Preview</button>
                <button className="save-btn">Save</button>
            </div>
            <style jsx>{`
                .step-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #e11d48;
                    padding-bottom: 8px;
                    border-bottom: 2px solid #e11d48;
                    display: inline-block;
                    margin-bottom: 24px;
                }
                /* Add all other component-specific styles here */
                .form-section {
                    background-color: #f7fafc;
                    padding: 24px;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                }
                .section-description {
                    font-size: 14px;
                    color: #4a5568;
                    margin-bottom: 16px;
                }
                .input-group {
                    margin-bottom: 16px;
                }
                .input-group label {
                    display: block;
                    font-size: 14px;
                    font-weight: 500;
                    margin-bottom: 8px;
                }
                .fee-input {
                    display: flex;
                    align-items: center;
                    border: 1px solid #cbd5e1;
                    border-radius: 6px;
                    background: white;
                    padding: 0 12px;
                }
                .fee-input span {
                    color: #94a3b8;
                }
                .fee-input input {
                    border: none;
                    outline: none;
                    padding: 10px 8px;
                    font-size: 16px;
                    width: 100%;
                }
                .checkbox-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .checkbox-group input {
                    width: 16px;
                    height: 16px;
                }
                .checkbox-group label {
                    font-size: 14px;
                }
                .plan-selection {
                    margin-top: 24px;
                }
                .radio-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .plan-details {
                    margin-left: 28px;
                    font-size: 14px;
                    color: #4a5568;
                }
                .info-text {
                    font-size: 14px;
                    color: #4a5568;
                    margin-top: 24px;
                }
                .summary-section {
                    margin-top: 24px;
                    padding-top: 24px;
                    border-top: 1px solid #e2e8f0;
                }
                .summary-title {
                    font-size: 16px;
                    font-weight: 600;
                    margin-bottom: 16px;
                }
                .summary-item, .summary-total {
                    display: flex;
                    justify-content: space-between;
                    font-size: 14px;
                    margin-bottom: 8px;
                }
                .summary-total {
                    font-weight: 600;
                }
                .divider {
                    border: none;
                    border-top: 1px solid #e2e8f0;
                    margin: 16px 0;
                }
                .terms-agreement {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 24px;
                    font-size: 14px;
                }
                .terms-agreement a {
                    color: #8a2be2;
                    text-decoration: underline;
                    cursor: pointer;
                }
                .form-actions {
                    margin-top: 32px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }
                .save-preview-btn, .save-btn {
                    padding: 10px 20px;
                    border-radius: 6px;
                    border: 1px solid #cbd5e1;
                    font-weight: 500;
                    cursor: pointer;
                }
                .save-btn {
                    background-color: #e11d48;
                    color: white;
                    border-color: #e11d48;
                }
            `}</style>
        </div>
    );
}

const WelcomeStep = () => {
    const [additionalInstructions, setAdditionalInstructions] = useState(false);

    return (
        <div>
            <h2 className="step-title">WELCOME</h2>
            <div className="welcome-header">
                <h1>Welcome! Let's Get Started.</h1>
                <div className="info-tags">
                    <span className="info-tag"><Clock size={16} /> Less than 10 min</span>
                    <span className="info-tag"><Save size={16} /> Save for Later</span>
                    <span className="info-tag"><FileX size={16} /> No Documents Required</span>
                    <span className="info-tag"><Lock size={16} /> Private & Secure</span>
                </div>
            </div>

            <div className="welcome-section">
                <Cloud size={24} className="section-icon" />
                <div>
                    <h3>Don't have everything right now?</h3>
                    <p>No problem—you can start now, save your progress, and come back anytime to finish.</p>
                </div>
            </div>

            <div className="welcome-section">
                <h3>What Will You Get?</h3>
                <div className="benefit-item">
                    <Search size={24} className="section-icon" />
                    <div>
                        <h4>TransUnion screening reports</h4>
                        <p>Credit, eviction, and criminal checks for peace of mind in a safe community.</p>
                    </div>
                </div>
                <div className="benefit-item">
                    <FileCheck2 size={24} className="section-icon" />
                    <div>
                        <h4>30 Days of Access</h4>
                        <p>Easily access and share your screening reports for other rentals.</p>
                    </div>
                </div>
            </div>

            <div className="form-actions">
                <button className="save-preview-btn">Save & Preview</button>
                <button className="save-btn">Save</button>
            </div>

            <style jsx>{`
                .step-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #e11d48;
                    padding-bottom: 8px;
                    border-bottom: 2px solid #e11d48;
                    display: inline-block;
                    margin-bottom: 24px;
                }
                .welcome-header h1 {
                    font-size: 28px;
                    font-weight: 600;
                    margin-bottom: 16px;
                }
                .info-tags {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 32px;
                }
                .info-tag {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background-color: #f1f5f9;
                    padding: 6px 12px;
                    border-radius: 16px;
                    font-size: 12px;
                    color: #475569;
                }
                .welcome-section {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 24px;
                    padding-bottom: 24px;
                    border-bottom: 1px solid #e2e8f0;
                }
                .welcome-section:last-of-type {
                    border-bottom: none;
                }
                .section-icon {
                    color: #64748b;
                    flex-shrink: 0;
                    margin-top: 4px;
                }
                .welcome-section h3 {
                    font-size: 16px;
                    font-weight: 600;
                    margin-bottom: 8px;
                }
                .welcome-section p {
                    font-size: 14px;
                    color: #475569;
                }
                .benefit-item {
                    display: flex;
                    gap: 16px;
                    margin-top: 16px;
                }
                .benefit-item h4 {
                    font-size: 14px;
                    font-weight: 600;
                }
                .form-actions {
                    margin-top: 32px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }
                .save-preview-btn, .save-btn {
                    padding: 10px 20px;
                    border-radius: 6px;
                    border: 1px solid #cbd5e1;
                    font-weight: 500;
                    cursor: pointer;
                }
                .save-btn {
                    background-color: #e11d48;
                    color: white;
                    border-color: #e11d48;
                }
            `}</style>
        </div>
    );
};

const ApplicantInfoStep = () => {
    const [fields, setFields] = useState([
        { name: 'Name', isImmutable: true, required: true },
        { name: 'Email', enabled: true, required: true },
        { name: 'Phone', isImmutable: true, required: true },
        { name: 'Date of birth', enabled: true, required: false },
        { name: 'Social security number', enabled: true, required: false },
    ]);

    const handleToggle = (index: any) => {
        const newFields = [...fields];
        newFields[index].enabled = !newFields[index].enabled;
        setFields(newFields);
    };

    const handleRequiredToggle = (index: any) => {
        const newFields = [...fields];
        newFields[index].required = !newFields[index].required;
        setFields(newFields);
    };

    return (
        <div>
            <h2 className="step-title">APPLICANT INFO</h2>
            <p className="section-description">Select the fields you want to include in the applicant information section.</p>

            <div className="fields-section">
                <div className="fields-header">
                    <span className="field-header-name">Field</span>
                    <span className="field-header-required">Required</span>
                </div>
                {fields.map((field, index) => (
                    <div className="field-row" key={field.name}>
                        <div className="field-name">
                            {field.isImmutable ? (
                                <div style={{ width: '34px' }}></div> // Placeholder for alignment
                            ) : (
                                <label className="switch">
                                    <input type="checkbox" checked={field.enabled} onChange={() => handleToggle(index)} />
                                    <span className="slider round"></span>
                                </label>
                            )}
                            <span>{field.name}</span>
                        </div>
                        <div className="field-required">
                            <input type="checkbox" checked={field.required} disabled={!field.enabled && !field.isImmutable} onChange={() => handleRequiredToggle(index)} />
                        </div>
                    </div>
                ))}
            </div>

             <div className="form-actions" style={{position: 'absolute', bottom: '24px', right: '48px'}}>
                <button className="save-preview-btn">Save & Preview</button>
                <button className="save-btn">Save</button>
            </div>
            <style jsx>{`
                .step-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #e11d48;
                    padding-bottom: 8px;
                    border-bottom: 2px solid #e11d48;
                    display: inline-block;
                    margin-bottom: 24px;
                }
                .section-description {
                    font-size: 14px;
                    color: #475569;
                    margin-bottom: 24px;
                }
                 .fields-header {
                    display: flex;
                    justify-content: space-between;
                    padding: 0 8px 8px 56px;
                    border-bottom: 1px solid #e2e8f0;
                    font-weight: 600;
                    color: #475569;
                }
                .field-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 8px;
                    border-bottom: 1px solid #e2e8f0;
                }
                .field-name {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .field-required input {
                    width: 16px;
                    height: 16px;
                }
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 34px;
                    height: 20px;
                }
                .switch input { 
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    transition: .4s;
                }
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 12px;
                    width: 12px;
                    left: 4px;
                    bottom: 4px;
                    background-color: white;
                    transition: .4s;
                }
                input:checked + .slider {
                    background-color: #8a2be2;
                }
                input:checked + .slider:before {
                    transform: translateX(14px);
                }
                .slider.round {
                    border-radius: 34px;
                }
                .slider.round:before {
                    border-radius: 50%;
                }
                .form-actions {
                    margin-top: 32px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }
                .save-preview-btn, .save-btn {
                    padding: 10px 20px;
                    border-radius: 6px;
                    border: 1px solid #cbd5e1;
                    font-weight: 500;
                    cursor: pointer;
                }
                .save-btn {
                    background-color: #e11d48;
                    color: white;
                    border-color: #e11d48;
                }
            `}</style>
        </div>
    );
};

const ResidentialStep = () => {
    const [instructions, setInstructions] = useState('');
    const [fields, setFields] = useState([
        { name: 'Address', enabled: true, required: false },
        { name: 'Landlord / Company name', enabled: true, required: true },
        { name: 'Contact Phone', enabled: true, required: true },
        { name: 'Contact Email', enabled: true, required: true },
        { name: 'Move-in date', enabled: true, required: false },
        { name: 'Monthly Payment', enabled: true, required: true },
    ]);

    const handleToggle = (index: any) => {
        const newFields = [...fields];
        newFields[index].enabled = !newFields[index].enabled;
        setFields(newFields);
    };

    const handleRequiredToggle = (index: any) => {
        const newFields = [...fields];
        newFields[index].required = !newFields[index].required;
        setFields(newFields);
    };

    return (
        <div>
            <h2 className="step-title">RESIDENTIAL</h2>
            <p className="section-description">Do you want to specify any additional instructions about their residential history?</p>
            
            <div className="instructions-section">
                <label htmlFor="instructions" className="form-label">Instructions</label>
                <textarea 
                    id="instructions"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    maxLength={5000}
                    placeholder="Instructions"
                    className="instructions-textarea"
                />
                <div className="char-counter">{instructions.length}/5000 characters</div>
            </div>

            <div className="fields-section">
                <div className="fields-header">
                    <span className="field-header-name">Field</span>
                    <span className="field-header-required">Required</span>
                </div>
                {fields.map((field, index) => (
                    <div className="field-row" key={field.name}>
                        <div className="field-name">
                            <label className="switch">
                                <input type="checkbox" checked={field.enabled} onChange={() => handleToggle(index)} />
                                <span className="slider round"></span>
                            </label>
                            <span>{field.name}</span>
                        </div>
                        <div className="field-required">
                            <input type="checkbox" checked={field.required} disabled={!field.enabled} onChange={() => handleRequiredToggle(index)} />
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="form-actions">
                <button className="save-preview-btn">Save & Preview</button>
                <button className="save-btn">Save</button>
            </div>

            <style jsx>{`
                .step-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #e11d48;
                    padding-bottom: 8px;
                    border-bottom: 2px solid #e11d48;
                    display: inline-block;
                    margin-bottom: 16px;
                }
                .section-description {
                    font-size: 14px;
                    color: #475569;
                    margin-bottom: 24px;
                }
                .instructions-section {
                    margin-bottom: 24px;
                }
                .form-label {
                    display: block;
                    font-size: 16px;
                    font-weight: 600;
                    margin-bottom: 8px;
                }
                .instructions-textarea {
                    width: 100%;
                    height: 120px;
                    border: 1px solid #cbd5e1;
                    border-radius: 6px;
                    padding: 12px;
                    font-size: 14px;
                }
                .char-counter {
                    font-size: 12px;
                    color: #64748b;
                    text-align: right;
                    margin-top: 4px;
                }
                .fields-header {
                    display: flex;
                    justify-content: space-between;
                    padding: 0 8px 8px 56px;
                    border-bottom: 1px solid #e2e8f0;
                    font-weight: 600;
                    color: #475569;
                }
                .field-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 8px;
                    border-bottom: 1px solid #e2e8f0;
                }
                .field-name {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .field-required input {
                    width: 16px;
                    height: 16px;
                }
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 34px;
                    height: 20px;
                }
                .switch input { 
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    transition: .4s;
                }
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 12px;
                    width: 12px;
                    left: 4px;
                    bottom: 4px;
                    background-color: white;
                    transition: .4s;
                }
                input:checked + .slider {
                    background-color: #8a2be2;
                }
                input:checked + .slider:before {
                    transform: translateX(14px);
                }
                .slider.round {
                    border-radius: 34px;
                }
                .slider.round:before {
                    border-radius: 50%;
                }
                 .form-actions {
                    position: absolute;
                    bottom: 24px;
                    right: 48px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }
                .save-preview-btn, .save-btn {
                    padding: 10px 20px;
                    border-radius: 6px;
                    border: 1px solid #cbd5e1;
                    font-weight: 500;
                    cursor: pointer;
                }
                .save-btn {
                    background-color: #e11d48;
                    color: white;
                    border-color: #e11d48;
                }
            `}</style>
        </div>
    );
};

const EmploymentStep = () => {
    const [fields, setFields] = useState([
        { name: 'Employer name', enabled: true, required: true },
        { name: 'Job title', enabled: true, required: true },
        { name: 'Employment type', enabled: true, required: false },
        { name: 'Start date', enabled: true, required: false },
        { name: 'Monthly income', enabled: true, required: true },
        { name: 'Supervisor name', enabled: false, required: false },
        { name: 'Supervisor phone', enabled: false, required: false },
    ]);

    const handleToggle = (index: any) => {
        const newFields = [...fields];
        newFields[index].enabled = !newFields[index].enabled;
        setFields(newFields);
    };

    const handleRequiredToggle = (index: any) => {
        const newFields = [...fields];
        newFields[index].required = !newFields[index].required;
        setFields(newFields);
    };

    return (
        <div>
            <h2 className="step-title">EMPLOYMENT</h2>
            <p className="section-description">Configure employment information fields for applicants.</p>

            <div className="fields-section">
                <div className="fields-header">
                    <span className="field-header-name">Field</span>
                    <span className="field-header-required">Required</span>
                </div>
                {fields.map((field, index) => (
                    <div className="field-row" key={field.name}>
                        <div className="field-name">
                            <label className="switch">
                                <input type="checkbox" checked={field.enabled} onChange={() => handleToggle(index)} />
                                <span className="slider round"></span>
                            </label>
                            <span>{field.name}</span>
                        </div>
                        <div className="field-required">
                            <input type="checkbox" checked={field.required} disabled={!field.enabled} onChange={() => handleRequiredToggle(index)} />
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="form-actions">
                <button className="save-preview-btn">Save & Preview</button>
                <button className="save-btn">Save</button>
            </div>

            <style jsx>{`
                .step-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #e11d48;
                    padding-bottom: 8px;
                    border-bottom: 2px solid #e11d48;
                    display: inline-block;
                    margin-bottom: 16px;
                }
                .section-description {
                    font-size: 14px;
                    color: #475569;
                    margin-bottom: 24px;
                }
                .fields-header {
                    display: flex;
                    justify-content: space-between;
                    padding: 0 8px 8px 56px;
                    border-bottom: 1px solid #e2e8f0;
                    font-weight: 600;
                    color: #475569;
                }
                .field-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 8px;
                    border-bottom: 1px solid #e2e8f0;
                }
                .field-name {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .field-required input {
                    width: 16px;
                    height: 16px;
                }
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 34px;
                    height: 20px;
                }
                .switch input { 
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    transition: .4s;
                }
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 12px;
                    width: 12px;
                    left: 4px;
                    bottom: 4px;
                    background-color: white;
                    transition: .4s;
                }
                input:checked + .slider {
                    background-color: #8a2be2;
                }
                input:checked + .slider:before {
                    transform: translateX(14px);
                }
                .slider.round {
                    border-radius: 34px;
                }
                .slider.round:before {
                    border-radius: 50%;
                }
                .form-actions {
                    position: absolute;
                    bottom: 24px;
                    right: 48px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }
                .save-preview-btn, .save-btn {
                    padding: 10px 20px;
                    border-radius: 6px;
                    border: 1px solid #cbd5e1;
                    font-weight: 500;
                    cursor: pointer;
                }
                .save-btn {
                    background-color: #e11d48;
                    color: white;
                    border-color: #e11d48;
                }
            `}</style>
        </div>
    );
};

const VehicleStep = () => {
    const [enableSection, setEnableSection] = useState(true);
    const [fields, setFields] = useState([
        { name: 'Make', enabled: true, required: false },
        { name: 'Model', enabled: true, required: false },
        { name: 'Year', enabled: true, required: false },
        { name: 'License plate', enabled: true, required: false },
        { name: 'Color', enabled: false, required: false },
    ]);

    const handleToggle = (index: any) => {
        const newFields = [...fields];
        newFields[index].enabled = !newFields[index].enabled;
        setFields(newFields);
    };

    const handleRequiredToggle = (index: any) => {
        const newFields = [...fields];
        newFields[index].required = !newFields[index].required;
        setFields(newFields);
    };

    return (
        <div>
            <h2 className="step-title">VEHICLE</h2>
            <div className="section-toggle">
                <label className="switch">
                    <input type="checkbox" checked={enableSection} onChange={(e) => setEnableSection(e.target.checked)} />
                    <span className="slider round"></span>
                </label>
                <span>Enable vehicle information section</span>
            </div>

            {enableSection && (
                <div className="fields-section">
                    <div className="fields-header">
                        <span className="field-header-name">Field</span>
                        <span className="field-header-required">Required</span>
                    </div>
                    {fields.map((field, index) => (
                        <div className="field-row" key={field.name}>
                            <div className="field-name">
                                <label className="switch">
                                    <input type="checkbox" checked={field.enabled} onChange={() => handleToggle(index)} />
                                    <span className="slider round"></span>
                                </label>
                                <span>{field.name}</span>
                            </div>
                            <div className="field-required">
                                <input type="checkbox" checked={field.required} disabled={!field.enabled} onChange={() => handleRequiredToggle(index)} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="form-actions">
                <button className="save-preview-btn">Save & Preview</button>
                <button className="save-btn">Save</button>
            </div>

            <style jsx>{`
                .step-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #e11d48;
                    padding-bottom: 8px;
                    border-bottom: 2px solid #e11d48;
                    display: inline-block;
                    margin-bottom: 16px;
                }
                .section-toggle {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 24px;
                }
                .fields-header {
                    display: flex;
                    justify-content: space-between;
                    padding: 0 8px 8px 56px;
                    border-bottom: 1px solid #e2e8f0;
                    font-weight: 600;
                    color: #475569;
                }
                .field-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 8px;
                    border-bottom: 1px solid #e2e8f0;
                }
                .field-name {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .field-required input {
                    width: 16px;
                    height: 16px;
                }
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 34px;
                    height: 20px;
                }
                .switch input { 
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    transition: .4s;
                }
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 12px;
                    width: 12px;
                    left: 4px;
                    bottom: 4px;
                    background-color: white;
                    transition: .4s;
                }
                input:checked + .slider {
                    background-color: #8a2be2;
                }
                input:checked + .slider:before {
                    transform: translateX(14px);
                }
                .slider.round {
                    border-radius: 34px;
                }
                .slider.round:before {
                    border-radius: 50%;
                }
                .form-actions {
                    position: absolute;
                    bottom: 24px;
                    right: 48px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }
                .save-preview-btn, .save-btn {
                    padding: 10px 20px;
                    border-radius: 6px;
                    border: 1px solid #cbd5e1;
                    font-weight: 500;
                    cursor: pointer;
                }
                .save-btn {
                    background-color: #e11d48;
                    color: white;
                    border-color: #e11d48;
                }
            `}</style>
        </div>
    );
};

const DependantsStep = () => {
    const [enableSection, setEnableSection] = useState(true);
    const [fields, setFields] = useState([
        { name: 'Name', enabled: true, required: true },
        { name: 'Relationship', enabled: true, required: true },
        { name: 'Age', enabled: true, required: false },
        { name: 'Special needs', enabled: false, required: false },
    ]);

    const handleToggle = (index: any) => {
        const newFields = [...fields];
        newFields[index].enabled = !newFields[index].enabled;
        setFields(newFields);
    };

    const handleRequiredToggle = (index: any) => {
        const newFields = [...fields];
        newFields[index].required = !newFields[index].required;
        setFields(newFields);
    };

    return (
        <div>
            <h2 className="step-title">DEPENDANTS</h2>
            <div className="section-toggle">
                <label className="switch">
                    <input type="checkbox" checked={enableSection} onChange={(e) => setEnableSection(e.target.checked)} />
                    <span className="slider round"></span>
                </label>
                <span>Enable dependants section</span>
            </div>

            {enableSection && (
                <div className="fields-section">
                    <div className="fields-header">
                        <span className="field-header-name">Field</span>
                        <span className="field-header-required">Required</span>
                    </div>
                    {fields.map((field, index) => (
                        <div className="field-row" key={field.name}>
                            <div className="field-name">
                                <label className="switch">
                                    <input type="checkbox" checked={field.enabled} onChange={() => handleToggle(index)} />
                                    <span className="slider round"></span>
                                </label>
                                <span>{field.name}</span>
                            </div>
                            <div className="field-required">
                                <input type="checkbox" checked={field.required} disabled={!field.enabled} onChange={() => handleRequiredToggle(index)} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="form-actions">
                <button className="save-preview-btn">Save & Preview</button>
                <button className="save-btn">Save</button>
            </div>

            <style jsx>{`
                .step-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #e11d48;
                    padding-bottom: 8px;
                    border-bottom: 2px solid #e11d48;
                    display: inline-block;
                    margin-bottom: 16px;
                }
                .section-toggle {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 24px;
                }
                .fields-header {
                    display: flex;
                    justify-content: space-between;
                    padding: 0 8px 8px 56px;
                    border-bottom: 1px solid #e2e8f0;
                    font-weight: 600;
                    color: #475569;
                }
                .field-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 8px;
                    border-bottom: 1px solid #e2e8f0;
                }
                .field-name {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .field-required input {
                    width: 16px;
                    height: 16px;
                }
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 34px;
                    height: 20px;
                }
                .switch input { 
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    transition: .4s;
                }
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 12px;
                    width: 12px;
                    left: 4px;
                    bottom: 4px;
                    background-color: white;
                    transition: .4s;
                }
                input:checked + .slider {
                    background-color: #8a2be2;
                }
                input:checked + .slider:before {
                    transform: translateX(14px);
                }
                .slider.round {
                    border-radius: 34px;
                }
                .slider.round:before {
                    border-radius: 50%;
                }
                .form-actions {
                    position: absolute;
                    bottom: 24px;
                    right: 48px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }
                .save-preview-btn, .save-btn {
                    padding: 10px 20px;
                    border-radius: 6px;
                    border: 1px solid #cbd5e1;
                    font-weight: 500;
                    cursor: pointer;
                }
                .save-btn {
                    background-color: #e11d48;
                    color: white;
                    border-color: #e11d48;
                }
            `}</style>
        </div>
    );
};

const EmergencyContactsStep = () => {
    const [enableSection, setEnableSection] = useState(true);
    const [fields, setFields] = useState([
        { name: 'Name', enabled: true, required: true },
        { name: 'Relationship', enabled: true, required: true },
        { name: 'Phone', enabled: true, required: true },
        { name: 'Email', enabled: true, required: false },
        { name: 'Address', enabled: false, required: false },
    ]);

    const handleToggle = (index: any) => {
        const newFields = [...fields];
        newFields[index].enabled = !newFields[index].enabled;
        setFields(newFields);
    };

    const handleRequiredToggle = (index: any) => {
        const newFields = [...fields];
        newFields[index].required = !newFields[index].required;
        setFields(newFields);
    };

    return (
        <div>
            <h2 className="step-title">EMERGENCY CONTACTS</h2>
            <div className="section-toggle">
                <label className="switch">
                    <input type="checkbox" checked={enableSection} onChange={(e) => setEnableSection(e.target.checked)} />
                    <span className="slider round"></span>
                </label>
                <span>Enable emergency contacts section</span>
            </div>

            {enableSection && (
                <div className="fields-section">
                    <div className="fields-header">
                        <span className="field-header-name">Field</span>
                        <span className="field-header-required">Required</span>
                    </div>
                    {fields.map((field, index) => (
                        <div className="field-row" key={field.name}>
                            <div className="field-name">
                                <label className="switch">
                                    <input type="checkbox" checked={field.enabled} onChange={() => handleToggle(index)} />
                                    <span className="slider round"></span>
                                </label>
                                <span>{field.name}</span>
                            </div>
                            <div className="field-required">
                                <input type="checkbox" checked={field.required} disabled={!field.enabled} onChange={() => handleRequiredToggle(index)} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="form-actions">
                <button className="save-preview-btn">Save & Preview</button>
                <button className="save-btn">Save</button>
            </div>

            <style jsx>{`
                .step-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #e11d48;
                    padding-bottom: 8px;
                    border-bottom: 2px solid #e11d48;
                    display: inline-block;
                    margin-bottom: 16px;
                }
                .section-toggle {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 24px;
                }
                .fields-header {
                    display: flex;
                    justify-content: space-between;
                    padding: 0 8px 8px 56px;
                    border-bottom: 1px solid #e2e8f0;
                    font-weight: 600;
                    color: #475569;
                }
                .field-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 8px;
                    border-bottom: 1px solid #e2e8f0;
                }
                .field-name {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .field-required input {
                    width: 16px;
                    height: 16px;
                }
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 34px;
                    height: 20px;
                }
                .switch input { 
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    transition: .4s;
                }
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 12px;
                    width: 12px;
                    left: 4px;
                    bottom: 4px;
                    background-color: white;
                    transition: .4s;
                }
                input:checked + .slider {
                    background-color: #8a2be2;
                }
                input:checked + .slider:before {
                    transform: translateX(14px);
                }
                .slider.round {
                    border-radius: 34px;
                }
                .slider.round:before {
                    border-radius: 50%;
                }
                .form-actions {
                    position: absolute;
                    bottom: 24px;
                    right: 48px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }
                .save-preview-btn, .save-btn {
                    padding: 10px 20px;
                    border-radius: 6px;
                    border: 1px solid #cbd5e1;
                    font-weight: 500;
                    cursor: pointer;
                }
                .save-btn {
                    background-color: #e11d48;
                    color: white;
                    border-color: #e11d48;
                }
            `}</style>
        </div>
    );
};

const PetsStep = () => {
    const [enableSection, setEnableSection] = useState(true);
    const [fields, setFields] = useState([
        { name: 'Pet type', enabled: true, required: true },
        { name: 'Pet name', enabled: true, required: false },
        { name: 'Breed', enabled: true, required: false },
        { name: 'Weight', enabled: true, required: false },
        { name: 'Age', enabled: false, required: false },
        { name: 'Vaccination records', enabled: false, required: false },
    ]);

    const handleToggle = (index: any) => {
        const newFields = [...fields];
        newFields[index].enabled = !newFields[index].enabled;
        setFields(newFields);
    };

    const handleRequiredToggle = (index: any) => {
        const newFields = [...fields];
        newFields[index].required = !newFields[index].required;
        setFields(newFields);
    };

    return (
        <div>
            <h2 className="step-title">PETS</h2>
            <div className="section-toggle">
                <label className="switch">
                    <input type="checkbox" checked={enableSection} onChange={(e) => setEnableSection(e.target.checked)} />
                    <span className="slider round"></span>
                </label>
                <span>Enable pets section</span>
            </div>

            {enableSection && (
                <div className="fields-section">
                    <div className="fields-header">
                        <span className="field-header-name">Field</span>
                        <span className="field-header-required">Required</span>
                    </div>
                    {fields.map((field, index) => (
                        <div className="field-row" key={field.name}>
                            <div className="field-name">
                                <label className="switch">
                                    <input type="checkbox" checked={field.enabled} onChange={() => handleToggle(index)} />
                                    <span className="slider round"></span>
                                </label>
                                <span>{field.name}</span>
                            </div>
                            <div className="field-required">
                                <input type="checkbox" checked={field.required} disabled={!field.enabled} onChange={() => handleRequiredToggle(index)} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="form-actions">
                <button className="save-preview-btn">Save & Preview</button>
                <button className="save-btn">Save</button>
            </div>

            <style jsx>{`
                .step-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #e11d48;
                    padding-bottom: 8px;
                    border-bottom: 2px solid #e11d48;
                    display: inline-block;
                    margin-bottom: 16px;
                }
                .section-toggle {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 24px;
                }
                .fields-header {
                    display: flex;
                    justify-content: space-between;
                    padding: 0 8px 8px 56px;
                    border-bottom: 1px solid #e2e8f0;
                    font-weight: 600;
                    color: #475569;
                }
                .field-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 8px;
                    border-bottom: 1px solid #e2e8f0;
                }
                .field-name {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .field-required input {
                    width: 16px;
                    height: 16px;
                }
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 34px;
                    height: 20px;
                }
                .switch input { 
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    transition: .4s;
                }
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 12px;
                    width: 12px;
                    left: 4px;
                    bottom: 4px;
                    background-color: white;
                    transition: .4s;
                }
                input:checked + .slider {
                    background-color: #8a2be2;
                }
                input:checked + .slider:before {
                    transform: translateX(14px);
                }
                .slider.round {
                    border-radius: 34px;
                }
                .slider.round:before {
                    border-radius: 50%;
                }
                .form-actions {
                    position: absolute;
                    bottom: 24px;
                    right: 48px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }
                .save-preview-btn, .save-btn {
                    padding: 10px 20px;
                    border-radius: 6px;
                    border: 1px solid #cbd5e1;
                    font-weight: 500;
                    cursor: pointer;
                }
                .save-btn {
                    background-color: #e11d48;
                    color: white;
                    border-color: #e11d48;
                }
            `}</style>
        </div>
    );
};

const AdditionalIncomeStep = () => {
    const [enableSection, setEnableSection] = useState(true);
    const [fields, setFields] = useState([
        { name: 'Income source', enabled: true, required: true },
        { name: 'Monthly amount', enabled: true, required: true },
        { name: 'Asset type', enabled: true, required: false },
        { name: 'Asset value', enabled: true, required: false },
        { name: 'Bank account balance', enabled: false, required: false },
    ]);

    const handleToggle = (index: any) => {
        const newFields = [...fields];
        newFields[index].enabled = !newFields[index].enabled;
        setFields(newFields);
    };

    const handleRequiredToggle = (index: any) => {
        const newFields = [...fields];
        newFields[index].required = !newFields[index].required;
        setFields(newFields);
    };

    return (
        <div>
            <h2 className="step-title">ADDITIONAL INCOME & ASSETS</h2>
            <div className="section-toggle">
                <label className="switch">
                    <input type="checkbox" checked={enableSection} onChange={(e) => setEnableSection(e.target.checked)} />
                    <span className="slider round"></span>
                </label>
                <span>Enable additional income & assets section</span>
            </div>

            {enableSection && (
                <div className="fields-section">
                    <div className="fields-header">
                        <span className="field-header-name">Field</span>
                        <span className="field-header-required">Required</span>
                    </div>
                    {fields.map((field, index) => (
                        <div className="field-row" key={field.name}>
                            <div className="field-name">
                                <label className="switch">
                                    <input type="checkbox" checked={field.enabled} onChange={() => handleToggle(index)} />
                                    <span className="slider round"></span>
                                </label>
                                <span>{field.name}</span>
                            </div>
                            <div className="field-required">
                                <input type="checkbox" checked={field.required} disabled={!field.enabled} onChange={() => handleRequiredToggle(index)} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="form-actions">
                <button className="save-preview-btn">Save & Preview</button>
                <button className="save-btn">Save</button>
            </div>

            <style jsx>{`
                .step-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #e11d48;
                    padding-bottom: 8px;
                    border-bottom: 2px solid #e11d48;
                    display: inline-block;
                    margin-bottom: 16px;
                }
                .section-toggle {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 24px;
                }
                .fields-header {
                    display: flex;
                    justify-content: space-between;
                    padding: 0 8px 8px 56px;
                    border-bottom: 1px solid #e2e8f0;
                    font-weight: 600;
                    color: #475569;
                }
                .field-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 8px;
                    border-bottom: 1px solid #e2e8f0;
                }
                .field-name {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .field-required input {
                    width: 16px;
                    height: 16px;
                }
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 34px;
                    height: 20px;
                }
                .switch input { 
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    transition: .4s;
                }
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 12px;
                    width: 12px;
                    left: 4px;
                    bottom: 4px;
                    background-color: white;
                    transition: .4s;
                }
                input:checked + .slider {
                    background-color: #8a2be2;
                }
                input:checked + .slider:before {
                    transform: translateX(14px);
                }
                .slider.round {
                    border-radius: 34px;
                }
                .slider.round:before {
                    border-radius: 50%;
                }
                .form-actions {
                    position: absolute;
                    bottom: 24px;
                    right: 48px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }
                .save-preview-btn, .save-btn {
                    padding: 10px 20px;
                    border-radius: 6px;
                    border: 1px solid #cbd5e1;
                    font-weight: 500;
                    cursor: pointer;
                }
                .save-btn {
                    background-color: #e11d48;
                    color: white;
                    border-color: #e11d48;
                }
            `}</style>
        </div>
    );
};

const CreateQuestionsStep = () => {
    const [questions, setQuestions] = useState<{ id: number; text: string; required: boolean }[]>([]);
    const [newQuestion, setNewQuestion] = useState('');

    const addQuestion = () => {
        if (newQuestion.trim()) {
            setQuestions([...questions, { id: Date.now(), text: newQuestion, required: false }]);
            setNewQuestion('');
        }
    };

    const removeQuestion = (id: any) => {
        setQuestions(questions.filter((q) => q.id !== id));
    };

    const toggleRequired = (id: any) => {
        setQuestions(questions.map((q) => 
            q.id === id ? { ...q, required: !q.required } : q
        ));
    };

    return (
        <div>
            <h2 className="step-title">CREATE QUESTIONS</h2>
            <p className="section-description">Add custom questions for applicants to answer.</p>
            
            <div className="add-question">
                <input 
                    type="text" 
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Enter your question..."
                    className="question-input"
                />
                <button onClick={addQuestion} className="add-btn">Add Question</button>
            </div>

            <div className="questions-list">
                {questions.map((question) => (
                    <div key={question.id} className="question-item">
                        <span className="question-text">{question.text}</span>
                        <div className="question-controls">
                            <label>
                                <input 
                                    type="checkbox" 
                                    checked={question.required}
                                    onChange={() => toggleRequired(question.id)}
                                />
                                Required
                            </label>
                            <button onClick={() => removeQuestion(question.id)} className="remove-btn">Remove</button>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="form-actions">
                <button className="save-preview-btn">Save & Preview</button>
                <button className="save-btn">Save</button>
            </div>

            <style jsx>{`
                .step-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #e11d48;
                    padding-bottom: 8px;
                    border-bottom: 2px solid #e11d48;
                    display: inline-block;
                    margin-bottom: 16px;
                }
                .section-description {
                    font-size: 14px;
                    color: #475569;
                    margin-bottom: 24px;
                }
                .add-question {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 24px;
                }
                .question-input {
                    flex: 1;
                    padding: 10px 12px;
                    border: 1px solid #cbd5e1;
                    border-radius: 6px;
                }
                .add-btn {
                    padding: 10px 16px;
                    background-color: #8a2be2;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                }
                .questions-list {
                    margin-bottom: 24px;
                }
                .question-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    margin-bottom: 8px;
                }
                .question-controls {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .remove-btn {
                    padding: 4px 8px;
                    background-color: #dc2626;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                }
                .form-actions {
                    position: absolute;
                    bottom: 24px;
                    right: 48px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }
                .save-preview-btn, .save-btn {
                    padding: 10px 20px;
                    border-radius: 6px;
                    border: 1px solid #cbd5e1;
                    font-weight: 500;
                    cursor: pointer;
                }
                .save-btn {
                    background-color: #e11d48;
                    color: white;
                    border-color: #e11d48;
                }
            `}</style>
        </div>
    );
};

const RequestDocumentsStep = () => {
    return (
        <div>
            <h2 className="step-title">REQUEST DOCUMENTS</h2>
            <p>Document upload configuration - Coming Soon</p>
            <div className="form-actions">
                <button className="save-preview-btn">Save & Preview</button>
                <button className="save-btn">Save</button>
            </div>
            <style jsx>{`
                .step-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #e11d48;
                    padding-bottom: 8px;
                    border-bottom: 2px solid #e11d48;
                    display: inline-block;
                    margin-bottom: 24px;
                }
                .form-actions {
                    position: absolute;
                    bottom: 24px;
                    right: 48px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }
                .save-preview-btn, .save-btn {
                    padding: 10px 20px;
                    border-radius: 6px;
                    border: 1px solid #cbd5e1;
                    font-weight: 500;
                    cursor: pointer;
                }
                .save-btn {
                    background-color: #e11d48;
                    color: white;
                    border-color: #e11d48;
                }
            `}</style>
        </div>
    );
};

const TermsConditionsStep = () => {
    return (
        <div>
            <h2 className="step-title">TERMS & CONDITIONS</h2>
            <p>Terms and conditions setup - Coming Soon</p>
            <div className="form-actions">
                <button className="save-preview-btn">Save & Preview</button>
                <button className="save-btn">Save</button>
            </div>
            <style jsx>{`
                .step-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #e11d48;
                    padding-bottom: 8px;
                    border-bottom: 2px solid #e11d48;
                    display: inline-block;
                    margin-bottom: 24px;
                }
                .form-actions {
                    position: absolute;
                    bottom: 24px;
                    right: 48px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }
                .save-preview-btn, .save-btn {
                    padding: 10px 20px;
                    border-radius: 6px;
                    border: 1px solid #cbd5e1;
                    font-weight: 500;
                    cursor: pointer;
                }
                .save-btn {
                    background-color: #e11d48;
                    color: white;
                    border-color: #e11d48;
                }
            `}</style>
        </div>
    );
};

const NotificationsStep = () => {
    return (
        <div>
            <h2 className="step-title">NOTIFICATIONS</h2>
            <p>Notification preferences - Coming Soon</p>
            <div className="form-actions">
                <button className="save-preview-btn">Save & Preview</button>
                <button className="save-btn">Save</button>
            </div>
            <style jsx>{`
                .step-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #e11d48;
                    padding-bottom: 8px;
                    border-bottom: 2px solid #e11d48;
                    display: inline-block;
                    margin-bottom: 24px;
                }
                .form-actions {
                    position: absolute;
                    bottom: 24px;
                    right: 48px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }
                .save-preview-btn, .save-btn {
                    padding: 10px 20px;
                    border-radius: 6px;
                    border: 1px solid #cbd5e1;
                    font-weight: 500;
                    cursor: pointer;
                }
                .save-btn {
                    background-color: #e11d48;
                    color: white;
                    border-color: #e11d48;
                }
            `}</style>
        </div>
    );
};

const ApplicationLinkStep = () => {
    return (
        <div>
            <h2 className="step-title">APPLICATION LINK</h2>
            <p>Application link generation - Coming Soon</p>
            <div className="form-actions">
                <button className="save-preview-btn">Save & Preview</button>
                <button className="save-btn">Save</button>
            </div>
            <style jsx>{`
                .step-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #e11d48;
                    padding-bottom: 8px;
                    border-bottom: 2px solid #e11d48;
                    display: inline-block;
                    margin-bottom: 24px;
                }
                .form-actions {
                    position: absolute;
                    bottom: 24px;
                    right: 48px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }
                .save-preview-btn, .save-btn {
                    padding: 10px 20px;
                    border-radius: 6px;
                    border: 1px solid #cbd5e1;
                    font-weight: 500;
                    cursor: pointer;
                }
                .save-btn {
                    background-color: #e11d48;
                    color: white;
                    border-color: #e11d48;
                }
            `}</style>
        </div>
    );
};

export default NewApplicationModal; 