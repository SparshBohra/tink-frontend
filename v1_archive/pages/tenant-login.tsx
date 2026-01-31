import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  Home, 
  ArrowLeft, 
  Phone, 
  MessageSquare, 
  CheckCircle,
  MapPin,
  Building,
  Users,
  ArrowRight,
  Shield,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { TenantOtpResponse, TenantAuthResponse, TenantProfileData } from '../lib/types';

interface FormData {
  phoneNumber: string;
  otpCode: string[];
}

interface FormErrors {
  phoneNumber?: string;
  otpCode?: string;
  general?: string;
}

type Step = 'phone' | 'otp' | 'properties';

const TenantLogin: React.FC = () => {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [formData, setFormData] = useState<FormData>({
    phoneNumber: '',
    otpCode: ['', '', '', '', '', '']
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  
  // Multi-tenant state
  const [tenantProfiles, setTenantProfiles] = useState<TenantProfileData[]>([]);
  const [verifiedPhone, setVerifiedPhone] = useState<string>('');

  // Format phone number for display
  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  // Validate phone number
  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10;
  };

  // Format phone to E164
  const toE164Format = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    return `+1${cleaned}`;
  };

  // Handle phone number input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
    setFormData(prev => ({ ...prev, phoneNumber: value }));
    if (errors.phoneNumber) {
      setErrors(prev => ({ ...prev, phoneNumber: undefined }));
      }
    }
  };

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...formData.otpCode];
    newOtp[index] = value;
    setFormData(prev => ({ ...prev, otpCode: newOtp }));
    
    // Clear errors
    if (errors.otpCode) {
      setErrors(prev => ({ ...prev, otpCode: undefined }));
    }

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Handle backspace in OTP
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !formData.otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Start resend timer
  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle phone submission
  const handlePhoneSubmit = async () => {
    if (!validatePhone(formData.phoneNumber)) {
      setErrors({ phoneNumber: 'Please enter a valid 10-digit phone number' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const phoneE164 = toE164Format(formData.phoneNumber);
      const response: TenantOtpResponse = await apiClient.requestTenantOtp(phoneE164);

      if (response.success) {
        setStep('otp');
        startResendTimer();
      } else {
        if (response.error_type === 'phone_not_found') {
          setErrors({
            phoneNumber: "Phone number not found. Please contact your landlord to set up your account."
          });
        } else {
          setErrors({
            general: response.error || 'Failed to send code. Please try again.'
          });
        }
      }
    } catch (error: any) {
      if (error.response?.data?.error_type === 'phone_not_found') {
        setErrors({
          phoneNumber: "Phone number not found. Please contact your landlord to set up your account."
        });
      } else {
        setErrors({
          general: 'An unexpected error occurred. Please try again.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP submission
  const handleOtpSubmit = async () => {
    const otpValue = formData.otpCode.join('');
    if (otpValue.length !== 6) {
      setErrors({ otpCode: 'Please enter all 6 digits' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const phoneE164 = toE164Format(formData.phoneNumber);
      const response: TenantAuthResponse = await apiClient.verifyTenantOtp(phoneE164, otpValue);

      if (response.success) {
        if (response.requires_selection && response.tenant_profiles) {
          setTenantProfiles(response.tenant_profiles);
          setVerifiedPhone(response.phone_number || phoneE164);
          setStep('properties');
        } else if (response.tokens && response.tenant) {
          completeLogin(response.tokens, response.tenant);
        }
      } else {
        setRemainingAttempts(response.remaining_attempts || null);
        
        if (response.error_type === 'invalid_otp') {
          const remainingText = response.remaining_attempts 
            ? ` ${response.remaining_attempts} attempts remaining.`
            : '';
          setErrors({
            otpCode: `Invalid code.${remainingText}`
          });
        } else if (response.error_type === 'expired') {
          setErrors({
            otpCode: 'Code expired. Please request a new one.'
          });
        } else {
          setErrors({
            general: response.error || 'Verification failed. Please try again.'
          });
        }
      }
    } catch (error: any) {
        setErrors({
        general: 'An unexpected error occurred. Please try again.'
        });
    } finally {
      setLoading(false);
    }
  };

  // Complete login
  const completeLogin = (tokens: any, tenant: TenantProfileData) => {
    localStorage.setItem('tenant_access_token', tokens.access);
    localStorage.setItem('tenant_refresh_token', tokens.refresh);
    localStorage.setItem('tenant_user', JSON.stringify(tenant));
    router.push('/tenant-dashboard');
  };

  // Handle property selection
  const handlePropertySelect = async (tenantUserId: number) => {
    setLoading(true);
    
    try {
      const response = await apiClient.selectTenantProfile(verifiedPhone, tenantUserId);
      
      if (response.success && response.tokens && response.tenant) {
        completeLogin(response.tokens, response.tenant);
      } else {
        setErrors({
          general: response.error || 'Failed to select property. Please try again.'
        });
        setLoading(false);
      }
    } catch (error: any) {
      setErrors({
        general: 'An unexpected error occurred. Please try again.'
      });
      setLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    try {
      const phoneE164 = toE164Format(formData.phoneNumber);
      const response: TenantOtpResponse = await apiClient.requestTenantOtp(phoneE164);

      if (response.success) {
        startResendTimer();
        setErrors({});
        setFormData(prev => ({ ...prev, otpCode: ['', '', '', '', '', ''] }));
        setRemainingAttempts(null);
      } else {
        setErrors({
          general: response.error || 'Failed to resend code. Please try again.'
        });
      }
    } catch (error: any) {
      setErrors({
        general: 'Failed to resend code. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (step === 'otp') {
    setStep('phone');
      setFormData(prev => ({ ...prev, otpCode: ['', '', '', '', '', ''] }));
    } else if (step === 'properties') {
      setStep('otp');
    }
    setErrors({});
    setRemainingAttempts(null);
  };

  return (
    <>
      <Head>
        <title>Tenant Login - SquareFt</title>
        <meta name="description" content="Login to your tenant portal" />
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </Head>

      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #dbeafe 0%, #ffffff 50%, #faf5ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{ width: '100%', maxWidth: '28rem' }}>
            {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              display: 'inline-block',
              marginBottom: '1rem'
            }}>
              <img src="/logo1.png" alt="SquareFt" style={{ height: '80px', width: 'auto' }} />
              </div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
                SquareFt Tenant Portal
              </h1>
            <p style={{ color: '#6b7280', margin: 0 }}>
              {step === 'phone' && 'Enter your phone number to get started'}
              {step === 'otp' && 'Enter the verification code sent to your phone'}
              {step === 'properties' && 'Select the property you want to access'}
            </p>
          </div>

          {/* Phone Number Step */}
          {step === 'phone' && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              padding: '2rem',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: '#374151', 
                    marginBottom: '0.5rem' 
                  }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formatPhoneNumber(formData.phoneNumber)}
                      onChange={handlePhoneChange}
                      placeholder="(555) 123-4567"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: `2px solid ${errors.phoneNumber ? '#ef4444' : '#e5e7eb'}`,
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                    onBlur={(e) => e.target.style.borderColor = errors.phoneNumber ? '#ef4444' : '#e5e7eb'}
                  />
                  {errors.phoneNumber && (
                    <p style={{ fontSize: '0.875rem', color: '#ef4444', marginTop: '0.5rem' }}>
                      {errors.phoneNumber}
                    </p>
                  )}
                </div>

                {errors.general && (
                  <div style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fca5a5',
                    borderRadius: '0.5rem',
                    padding: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertCircle style={{ width: '1.25rem', height: '1.25rem', color: '#ef4444' }} />
                      <p style={{ fontSize: '0.875rem', color: '#dc2626', margin: 0 }}>{errors.general}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handlePhoneSubmit}
                  disabled={!validatePhone(formData.phoneNumber) || loading}
                  style={{
                    width: '100%',
                    background: loading ? '#94a3b8' : '#1877F2',
                    color: 'white',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    fontWeight: '700',
                    cursor: (!validatePhone(formData.phoneNumber) || loading) ? 'not-allowed' : 'pointer',
                    opacity: (!validatePhone(formData.phoneNumber) || loading) ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s',
                    boxShadow: loading ? 'none' : '0 4px 14px rgba(24, 119, 242, 0.25)'
                  }}
                  onMouseOver={(e) => {
                    if (!loading && validatePhone(formData.phoneNumber)) {
                      e.currentTarget.style.background = '#166FE5';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(24, 119, 242, 0.35)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!loading && validatePhone(formData.phoneNumber)) {
                      e.currentTarget.style.background = '#1877F2';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 14px rgba(24, 119, 242, 0.25)';
                    }
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 style={{ width: '1.25rem', height: '1.25rem', animation: 'spin 1s linear infinite' }} />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare style={{ width: '1.25rem', height: '1.25rem' }} />
                      <span>Send Code</span>
                    </>
                  )}
                </button>

                <p style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center', margin: 0 }}>
                  Having trouble? Contact your landlord or property manager for assistance.
                </p>
              </div>
            </div>
          )}

          {/* OTP Verification Step */}
          {step === 'otp' && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              padding: '2rem',
              border: '1px solid #e5e7eb'
            }}>
              <button
                onClick={handleBack}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#6b7280',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  marginBottom: '1.5rem',
                  fontSize: '0.875rem'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#374151'}
                onMouseOut={(e) => e.currentTarget.style.color = '#6b7280'}
              >
                <ArrowLeft style={{ width: '1rem', height: '1rem' }} />
                <span>Back</span>
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '3rem',
                    height: '3rem',
                    backgroundColor: '#dcfce7',
                    borderRadius: '50%',
                    marginBottom: '1rem'
                  }}>
                    <Phone style={{ width: '1.5rem', height: '1.5rem', color: '#16a34a' }} />
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                    We sent a 6-digit code to<br />
                    <span style={{ fontWeight: '500', color: '#111827' }}>{formatPhoneNumber(formData.phoneNumber)}</span>
                  </p>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: '#374151', 
                    marginBottom: '0.75rem',
                    textAlign: 'center'
                  }}>
                    Enter Verification Code
                  </label>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                    {formData.otpCode.map((digit, index) => (
                    <input
                        key={index}
                        id={`otp-${index}`}
                      type="text"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        style={{
                          width: '3rem',
                          height: '3rem',
                          textAlign: 'center',
                          fontSize: '1.125rem',
                          fontWeight: 'bold',
                          border: `2px solid ${errors.otpCode ? '#ef4444' : '#e5e7eb'}`,
                          borderRadius: '0.5rem',
                          outline: 'none',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                        onBlur={(e) => e.target.style.borderColor = errors.otpCode ? '#ef4444' : '#e5e7eb'}
                        maxLength={1}
                    />
                    ))}
                  </div>
                  {errors.otpCode && (
                    <p style={{ fontSize: '0.875rem', color: '#ef4444', marginTop: '0.5rem', textAlign: 'center' }}>
                      {errors.otpCode}
                    </p>
                  )}
                  {remainingAttempts !== null && (
                    <p style={{ fontSize: '0.875rem', color: '#f59e0b', marginTop: '0.5rem', textAlign: 'center' }}>
                      {remainingAttempts} attempts remaining
                    </p>
                  )}
                </div>

                {errors.general && (
                  <div style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fca5a5',
                    borderRadius: '0.5rem',
                    padding: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertCircle style={{ width: '1.25rem', height: '1.25rem', color: '#ef4444' }} />
                      <p style={{ fontSize: '0.875rem', color: '#dc2626', margin: 0 }}>{errors.general}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleOtpSubmit}
                  disabled={formData.otpCode.join('').length !== 6 || loading}
                  style={{
                    width: '100%',
                    background: loading ? '#94a3b8' : '#1877F2',
                    color: 'white',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    fontWeight: '700',
                    cursor: (formData.otpCode.join('').length !== 6 || loading) ? 'not-allowed' : 'pointer',
                    opacity: (formData.otpCode.join('').length !== 6 || loading) ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s',
                    boxShadow: loading ? 'none' : '0 4px 14px rgba(24, 119, 242, 0.25)'
                  }}
                  onMouseOver={(e) => {
                    if (!loading && formData.otpCode.join('').length === 6) {
                      e.currentTarget.style.background = '#166FE5';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(24, 119, 242, 0.35)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!loading && formData.otpCode.join('').length === 6) {
                      e.currentTarget.style.background = '#1877F2';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 14px rgba(24, 119, 242, 0.25)';
                    }
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 style={{ width: '1.25rem', height: '1.25rem', animation: 'spin 1s linear infinite' }} />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle style={{ width: '1.25rem', height: '1.25rem' }} />
                      <span>Verify Code</span>
                    </>
                  )}
                </button>

                <div style={{ textAlign: 'center' }}>
                  {resendTimer > 0 ? (
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                      Resend code in {resendTimer} seconds
                    </p>
                  ) : (
                    <button
                      onClick={handleResendOtp}
                      disabled={loading}
                      style={{
                        fontSize: '0.875rem',
                        color: '#1877F2',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.5 : 1
                      }}
                      onMouseOver={(e) => !loading && (e.currentTarget.style.color = '#166FE5')}
                      onMouseOut={(e) => !loading && (e.currentTarget.style.color = '#1877F2')}
                    >
                      Didn't receive the code? Resend
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Property Selection Step */}
          {step === 'properties' && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              padding: '2rem',
              border: '1px solid #e5e7eb'
            }}>
                  <button
                    onClick={handleBack}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#6b7280',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  marginBottom: '1.5rem',
                  fontSize: '0.875rem'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#374151'}
                onMouseOut={(e) => e.currentTarget.style.color = '#6b7280'}
              >
                <ArrowLeft style={{ width: '1rem', height: '1rem' }} />
                <span>Back</span>
                  </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '3rem',
                    height: '3rem',
                    backgroundColor: '#dbeafe',
                    borderRadius: '50%',
                    marginBottom: '1rem'
                  }}>
                    <Building style={{ width: '1.5rem', height: '1.5rem', color: '#2563eb' }} />
                  </div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
                    Select Property
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                    Choose which property you'd like to access
                  </p>
                </div>

                {errors.general && (
                  <div style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fca5a5',
                    borderRadius: '0.5rem',
                    padding: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertCircle style={{ width: '1.25rem', height: '1.25rem', color: '#ef4444' }} />
                      <p style={{ fontSize: '0.875rem', color: '#dc2626', margin: 0 }}>{errors.general}</p>
                    </div>
                  </div>
            )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {tenantProfiles.map((property) => (
                    <button
                      key={property.tenant_user_id}
                      onClick={() => handlePropertySelect(property.tenant_user_id)}
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        backgroundColor: 'white',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                        opacity: loading ? 0.6 : 1
                      }}
                      onMouseOver={(e) => {
                        if (!loading) {
                          e.currentTarget.style.borderColor = '#93c5fd';
                          e.currentTarget.style.backgroundColor = '#eff6ff';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!loading) {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.backgroundColor = 'white';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: '4rem',
                          height: '4rem',
                          borderRadius: '0.5rem',
                          backgroundColor: '#f3f4f6',
                          backgroundImage: `url(https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=400)`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          flexShrink: 0
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ fontWeight: '600', color: '#111827', margin: '0 0 0.25rem 0', fontSize: '1rem' }}>
                            {property.property_name || 'Property'}
                          </h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                            <MapPin style={{ width: '0.875rem', height: '0.875rem', color: '#6b7280' }} />
                            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                              {property.property_address || 'Address not available'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#2563eb' }}>
                              ${property.monthly_rent || 0}/month
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Users style={{ width: '0.875rem', height: '0.875rem', color: '#6b7280' }} />
                              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                {property.landlord_name || 'Landlord'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <ArrowRight style={{ 
                          width: '1.25rem', 
                          height: '1.25rem', 
                          color: loading ? '#9ca3af' : '#6b7280',
                          flexShrink: 0
                        }} />
          </div>
                    </button>
                  ))}
          </div>
        </div>
      </div>
      )}
        </div>
      </div>
    </>
  );
};

export default TenantLogin; 