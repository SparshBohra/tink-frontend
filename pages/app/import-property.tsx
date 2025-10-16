import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth-context';
import Head from 'next/head';
import { Home, Building2, Sparkles, CheckCircle2, Upload, FileCheck, MapPin, Package, Image, Zap, FileText, Settings, AlertTriangle, Check } from 'lucide-react';
import Cookies from 'js-cookie';

/**
 * Import Property Page
 * 
 * This page handles importing property data from the guest listing generator
 * after a user signs up or logs in. It reads the pending property data from
 * localStorage and sends it to the backend to create a new property.
 */
export default function ImportProperty() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<'checking' | 'duplicate-check' | 'select-type' | 'importing' | 'success' | 'error'>('checking');
  const [message, setMessage] = useState('');
  const [propertyId, setPropertyId] = useState<number | null>(null);
  const [selectedRentType, setSelectedRentType] = useState<'per_room' | 'per_property' | null>(null);
  const [existingProperty, setExistingProperty] = useState<any>(null);
  const [pendingDataForImport, setPendingDataForImport] = useState<any>(null);
  const [agenticMessage, setAgenticMessage] = useState('Starting import process...');
  const [currentIcon, setCurrentIcon] = useState('search');
  const [importProgress, setImportProgress] = useState(0);

  // Get API URL based on environment
  const getApiUrl = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname.includes('app.localhost')) {
        return 'http://localhost:8000';
      } else {
        return 'https://tink.global';
      }
    }
    return 'http://localhost:8000';
  };

  // Check for pending data and user on mount, then check for duplicates
  useEffect(() => {
    const checkForDuplicates = async () => {
      console.log('📦 Import Property page loaded', { user: !!user, role: user?.role });
      
      if (!user) {
        console.log('⏳ Waiting for user to load...');
        return; // Wait for user to load
      }

      // Check if user is a landlord
      if (user.role !== 'owner') {
        console.log('❌ User is not a landlord:', user.role);
        setStep('error');
        setMessage('Only landlords can import properties. Please contact support.');
        return;
      }

      // Get pending property data from localStorage OR window.name handoff (cross-subdomain)
      let pendingDataStr = localStorage.getItem('pendingPropertyData');
      if (!pendingDataStr && typeof window !== 'undefined' && (window as any).name?.startsWith?.('SF_PENDING_PROPERTY|')) {
        pendingDataStr = (window as any).name.slice('SF_PENDING_PROPERTY|'.length);
        // Clear the window.name to avoid re-imports on refresh
        (window as any).name = '';
        if (pendingDataStr) {
          try {
            localStorage.setItem('pendingPropertyData', pendingDataStr);
          } catch (e) {}
        }
      }
      console.log('🔍 Checking for pending property data:', !!pendingDataStr);
      
      if (!pendingDataStr) {
        console.log('❌ No pending property data found');
        setStep('error');
        setMessage('No property data found. Please generate a listing first.');
        setTimeout(() => {
          router.push('/landlord-dashboard');
        }, 3000);
        return;
      }
      
      try {
        const pendingData = JSON.parse(pendingDataStr);
        setPendingDataForImport(pendingData);
        
        // Check if this property already exists
        const authToken = Cookies.get('access_token');
        if (!authToken) {
          throw new Error('No authentication token found');
        }
        
        const apiUrl = `${getApiUrl()}/api/properties/`;
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });
        
        if (response.ok) {
          const propertiesData = await response.json();
          const properties = propertiesData.results || propertiesData;
          
          // Check for duplicate by address
          const importAddress = pendingData.propertyData.address?.toLowerCase().trim();
          const duplicate = properties.find((p: any) => 
            p.address_line1?.toLowerCase().trim() === importAddress
          );
          
          if (duplicate) {
            console.log('⚠️ Duplicate property found:', duplicate);
            setExistingProperty(duplicate);
            setStep('duplicate-check');
            return;
          }
        }
        
        // No duplicate found, proceed to type selection
        console.log('✅ Ready to import property (no duplicates)');
        setStep('select-type');
        
      } catch (error) {
        console.error('❌ Error checking for duplicates:', error);
        // If check fails, just proceed to import
        setStep('select-type');
      }
    };
    
    checkForDuplicates();
  }, [user, router]);

  // Agentic loading messages
  useEffect(() => {
    if (step === 'importing') {
      const messages = [
        { text: 'Importing property details...', icon: 'search', progress: 10 },
        { text: 'Creating property record in database...', icon: 'package', progress: 45 },
        { text: 'Finalizing property setup...', icon: 'settings', progress: 90 },
      ];
      
      let index = 0;
      const interval = setInterval(() => {
        if (index < messages.length) {
          setAgenticMessage(messages[index].text);
          setCurrentIcon(messages[index].icon);
          setImportProgress(messages[index].progress);
          index++;
        }
      }, 700);
      
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleRentTypeSelection = async (rentType: 'per_room' | 'per_property') => {
    setSelectedRentType(rentType);
    setStep('importing');
    
    // Get pending property data from localStorage
    const pendingDataStr = localStorage.getItem('pendingPropertyData');
    
    if (!pendingDataStr) {
      setStep('error');
      setMessage('No property data found.');
      return;
    }

    try {
      const pendingData = JSON.parse(pendingDataStr);
      
      // Update rent type in property data
      pendingData.propertyData.rent_type = rentType;
      
      console.log('📦 Importing property data with rent type:', rentType);
      console.log('📦 Full propertyData being sent:', pendingData.propertyData);

      // Get auth token from cookies (where APIClient stores it)
      const authToken = Cookies.get('access_token');

      console.log('🔑 Auth token check:', { hasToken: !!authToken, tokenLength: authToken?.length });

      if (!authToken) {
        throw new Error('No authentication token found. Please log in again.');
      }

      // Send data to backend
      const apiUrl = `${getApiUrl()}/api/properties/import-guest-property/`;
      console.log('🌐 POST request to:', apiUrl);
      console.log('📤 Request payload:', JSON.stringify(pendingData, null, 2));

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(pendingData),
      });

      console.log('📥 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Backend error:', errorData);
        throw new Error(errorData.error || 'Failed to import property');
      }

      const result = await response.json();
      
      console.log('✅ Property imported successfully:', result);
      console.log('✅ Property rent_type in response:', result.property.rent_type);
      console.log('✅ Property total_rooms in response:', result.property.total_rooms);
      
      // Clear the pending data
      localStorage.removeItem('pendingPropertyData');
      
      setStep('success');
      setMessage(`Property "${result.property.name}" imported successfully!`);
      setPropertyId(result.property.id);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/landlord-dashboard');
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Failed to import property:', error);
      setStep('error');
      setMessage(error.message || 'Failed to import property. Please try again.');
      
      // Redirect to dashboard after 5 seconds
      setTimeout(() => {
        router.push('/landlord-dashboard');
      }, 5000);
    }
  };

  return (
    <>
      <Head>
        <title>Importing Property - SquareFt</title>
      </Head>
      
      <div className="import-container">
        {/* Checking State */}
        {step === 'checking' && (
          <div className="import-page">
            <div className="page-content">
              <img src="/logo1.png" alt="SquareFt" className="page-logo-large" />
              <div className="spinner-container">
                <div className="loading-spinner"></div>
              </div>
              <p className="loading-text">Checking your properties...</p>
            </div>
          </div>
        )}
        
        {/* Duplicate Property Warning */}
        {step === 'duplicate-check' && existingProperty && (
          <div className="import-page">
            <div className="page-content">
              <img src="/logo1.png" alt="SquareFt" className="page-logo-large" />
              <div className="warning-icon-large">
                <AlertTriangle size={48} />
              </div>
              <h2 className="page-title">Property Already Exists</h2>
              <p className="page-subtitle">
                We found a property with the same address in your account:
              </p>
              
              <div className="existing-property-info">
                <strong>{existingProperty.name}</strong>
                <p>{existingProperty.address_line1}</p>
                <p className="property-meta">
                  {existingProperty.total_rooms} {existingProperty.rent_type === 'per_room' ? 'Rooms' : 'Property'}
                </p>
              </div>
              
              <p className="warning-text">
                Are you sure you want to import this property again? This will create a duplicate entry.
              </p>
              
              <div className="duplicate-actions">
                <button 
                  onClick={() => router.push('/landlord-dashboard')}
                  className="btn-cancel"
                >
                  Cancel Import
                </button>
                <button 
                  onClick={() => setStep('select-type')}
                  className="btn-continue"
                >
                  Continue Anyway
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Property Type Selection Modal */}
        {step === 'select-type' && (
          <div className="import-page">
            <div className="page-content">
              <img src="/logo1.png" alt="SquareFt" className="page-logo-large" />
              <h2 className="page-title">Choose Your Rental Model</h2>
              <p className="page-subtitle">How would you like to rent this property?</p>
              
              <div className="rent-options">
                <button 
                  onClick={() => handleRentTypeSelection('per_property')}
                  className="rent-option-btn"
                >
                  <div className="option-icon-container">
                    <Home size={36} />
                  </div>
                  <div className="option-content">
                    <h3>Whole Property</h3>
                    <p>Rent the entire property as a single unit</p>
                  </div>
                  <div className="option-badge recommended">Recommended</div>
                </button>
                
                <button 
                  onClick={() => handleRentTypeSelection('per_room')}
                  className="rent-option-btn"
                >
                  <div className="option-icon-container">
                    <Building2 size={36} />
                  </div>
                  <div className="option-content">
                    <h3>Individual Rooms</h3>
                    <p>Rent rooms separately to different tenants</p>
                  </div>
                  <div className="option-badge">Co-Living</div>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Importing State */}
        {step === 'importing' && (
          <div className="import-page">
            <div className="page-content">
              <img src="/logo1.png" alt="SquareFt" className="page-logo-large" />
              <div className="spinner-container">
                <div className="loading-spinner"></div>
              </div>
              <p className="loading-text">Importing property details...</p>
            </div>
          </div>
        )}
        
        {/* Success State */}
        {step === 'success' && (
          <div className="import-page">
            <div className="page-content">
              <img src="/logo1.png" alt="SquareFt" className="page-logo-large" />
              <div className="success-icon-large">
                <Check size={64} />
              </div>
              <h2 className="page-title">Property Imported!</h2>
              <p className="page-subtitle">Redirecting to your dashboard...</p>
            </div>
          </div>
        )}
        
        {/* Error State */}
        {step === 'error' && (
          <div className="import-page">
            <div className="page-content">
              <img src="/logo1.png" alt="SquareFt" className="page-logo-large" />
              <div className="error-icon-large">
                <AlertTriangle size={64} />
              </div>
              <h2 className="page-title">Import Failed</h2>
              <p className="page-subtitle">{message}</p>
              <button onClick={() => router.push('/landlord-dashboard')} className="btn-primary">
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .import-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1877F2 0%, #0056D2 100%);
          padding: 20px;
          position: relative;
        }

        /* Import Page - consistent white background */
        .import-page {
          position: fixed;
          inset: 0;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.4s ease-out;
          padding: 40px 20px;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .page-content {
          width: 100%;
          max-width: 650px;
          text-align: center;
          animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .page-logo-large {
          height: 80px;
          width: auto;
          margin: 0 auto 40px;
          display: block;
        }

        .page-title {
          font-size: 36px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 16px 0;
          letter-spacing: -0.02em;
        }

        .page-subtitle {
          font-size: 18px;
          color: #64748b;
          margin: 0 0 48px 0;
          font-weight: 500;
        }

        /* Rent Options */
        .rent-options {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .rent-option-btn {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          gap: 20px;
          position: relative;
          overflow: hidden;
        }

        .rent-option-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #1877F2 0%, #0056D2 100%);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .rent-option-btn:hover {
          border-color: #1877F2;
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(24, 119, 242, 0.2);
        }

        .rent-option-btn:hover::before {
          opacity: 0.05;
        }

        .option-icon-container {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #1877F2 0%, #0056D2 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 8px 16px rgba(24, 119, 242, 0.3);
        }

        .option-content {
          flex: 1;
          text-align: left;
        }

        .option-content h3 {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 6px 0;
        }

        .option-content p {
          font-size: 14px;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }

        .option-badge {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          background: #f1f5f9;
          color: #475569;
          flex-shrink: 0;
        }

        .option-badge.recommended {
          background: linear-gradient(135deg, #1877F2 0%, #0056D2 100%);
          color: white;
        }

        /* Loading Modal */
        .loading-modal {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .loading-header {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .spinner-container {
          margin: 48px 0 32px;
        }

        .loading-spinner {
          width: 60px;
          height: 60px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #1877F2;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-text {
          font-size: 18px;
          font-weight: 600;
          color: #475569;
          margin: 0;
        }

        /* Icon Containers */
        .warning-icon-large {
          width: 100px;
          height: 100px;
          margin: 0 auto 32px;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          animation: pulse 2s ease-in-out infinite;
        }

        .success-icon-large {
          width: 100px;
          height: 100px;
          margin: 0 auto 32px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          animation: scaleIn 0.5s ease-out;
        }

        .error-icon-large {
          width: 100px;
          height: 100px;
          margin: 0 auto 32px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.9;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* Duplicate Warning - keep existing */
        .selection-modal {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .modal-content {
          background: white;
          border-radius: 24px;
          padding: 48px 40px;
          max-width: 900px;
          width: 90%;
          animation: slideUp 0.4s ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(40px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-title {
          font-size: 32px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 12px;
          text-align: center;
          letter-spacing: -0.5px;
        }

        .modal-subtitle {
          font-size: 16px;
          color: #64748b;
          margin: 0 0 40px;
          text-align: center;
        }

        .rent-type-options {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .rent-type-card {
          background: white;
          border: 3px solid #e5e7eb;
          border-radius: 20px;
          padding: 40px 32px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .rent-type-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #1877F2, #60a5fa);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .rent-type-card:hover {
          border-color: #1877F2;
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(24, 119, 242, 0.2);
        }

        .rent-type-card:hover::before {
          opacity: 0.05;
        }

        .card-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 24px;
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1877F2;
          position: relative;
          z-index: 1;
        }

        .rent-type-card h3 {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 12px;
          position: relative;
          z-index: 1;
        }

        .rent-type-card p {
          font-size: 15px;
          color: #64748b;
          line-height: 1.6;
          margin: 0 0 20px;
          position: relative;
          z-index: 1;
        }

        .card-badge {
          display: inline-block;
          background: #1877F2;
          color: white;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 16px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          position: relative;
          z-index: 1;
        }

        /* Import Card */
        .import-card {
          background: white;
          border-radius: 20px;
          padding: 60px 40px;
          max-width: 500px;
          width: 100%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.4s ease-out;
        }

        .spinner {
          width: 60px;
          height: 60px;
          border: 4px solid #f3f4f6;
          border-top-color: #1877F2;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 30px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .progress-steps {
          margin-top: 32px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: left;
        }

        .progress-step {
          font-size: 15px;
          color: #94a3b8;
          padding: 12px 20px;
          background: #f8fafc;
          border-radius: 10px;
          transition: all 0.3s;
        }

        .progress-step.active {
          color: #1877F2;
          background: #eff6ff;
          font-weight: 600;
        }

        .success-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #10b981;
          color: white;
          font-size: 48px;
          line-height: 80px;
          margin: 0 auto 20px;
          animation: scaleIn 0.5s ease-out;
        }

        .error-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #ef4444;
          color: white;
          font-size: 48px;
          line-height: 80px;
          margin: 0 auto 20px;
          animation: scaleIn 0.5s ease-out;
        }

        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* Duplicate Warning Styles */
        .duplicate-warning {
          text-align: center;
          max-width: 500px;
        }

        .warning-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 20px;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          animation: pulse 2s ease-in-out infinite;
          box-shadow: 0 8px 16px rgba(251, 191, 36, 0.3);
        }

        @keyframes pulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 8px 16px rgba(251, 191, 36, 0.3);
          }
          50% { 
            transform: scale(1.05);
            box-shadow: 0 12px 24px rgba(251, 191, 36, 0.4);
          }
        }

        .existing-property-info {
          background: #fef3c7;
          border: 2px solid #fbbf24;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
          text-align: left;
        }

        .existing-property-info strong {
          font-size: 18px;
          color: #92400e;
          display: block;
          margin-bottom: 8px;
        }

        .existing-property-info p {
          margin: 4px 0;
          color: #78350f;
        }

        .property-meta {
          font-size: 14px;
          opacity: 0.8;
        }

        .warning-text {
          color: #dc2626;
          font-weight: 600;
          margin: 20px 0;
        }

        .duplicate-actions {
          display: flex;
          gap: 16px;
          margin-top: 30px;
        }

        .btn-cancel,
        .btn-continue {
          flex: 1;
          padding: 14px 24px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-cancel {
          background: #f1f5f9;
          color: #475569;
        }

        .btn-cancel:hover {
          background: #e2e8f0;
        }

        .btn-continue {
          background: #f59e0b;
          color: white;
        }

        .btn-continue:hover {
          background: #d97706;
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(245, 158, 11, 0.3);
        }

        .btn-primary {
          padding: 16px 32px;
          background: linear-gradient(135deg, #1877F2 0%, #0056D2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 24px;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(24, 119, 242, 0.3);
        }

        h2 {
          font-size: 28px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 16px;
        }

        p {
          font-size: 16px;
          color: #64748b;
          line-height: 1.6;
          margin: 0 0 12px;
        }

        .redirect-note {
          font-size: 14px;
          color: #94a3b8;
          margin-top: 20px;
        }

        .retry-btn {
          margin-top: 24px;
          padding: 14px 32px;
          background: #1877F2;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .retry-btn:hover {
          background: #166FE5;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(24, 119, 242, 0.35);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .rent-type-options {
            grid-template-columns: 1fr;
          }

          .modal-content {
            padding: 32px 24px;
          }

          .modal-title {
            font-size: 24px;
          }
        }
      `}</style>
    </>
  );
}

