import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { apiClient } from '../lib/api';
import { TenantOtpResponse, TenantAuthResponse } from '../lib/types';

interface FormData {
  phoneNumber: string;
  otpCode: string;
}

interface FormErrors {
  phoneNumber?: string;
  otpCode?: string;
  general?: string;
}

const TenantLogin: React.FC = () => {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [formData, setFormData] = useState<FormData>({
    phoneNumber: '',
    otpCode: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [tenantName, setTenantName] = useState<string>('');
  const [resendTimer, setResendTimer] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  // Format phone number as user types
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format based on length
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else if (digits.length <= 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else {
      // Limit to 10 digits
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  // Convert formatted phone to E.164 format
  const toE164Format = (formattedPhone: string): string => {
    const digits = formattedPhone.replace(/\D/g, '');
    return digits.length === 10 ? `+1${digits}` : formattedPhone;
  };

  // Validate phone number
  const validatePhoneNumber = (phone: string): boolean => {
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10;
  };

  // Validate OTP code
  const validateOtpCode = (otp: string): boolean => {
    return /^\d{6}$/.test(otp);
  };

  // Handle phone number input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, phoneNumber: formatted }));
    
    // Clear phone number error when user starts typing
    if (errors.phoneNumber) {
      setErrors(prev => ({ ...prev, phoneNumber: undefined }));
    }
  };

  // Handle OTP input
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setFormData(prev => ({ ...prev, otpCode: value }));
    
    // Clear OTP error when user starts typing
    if (errors.otpCode) {
      setErrors(prev => ({ ...prev, otpCode: undefined }));
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

  // Handle phone submission (request OTP)
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Validate phone number
    if (!validatePhoneNumber(formData.phoneNumber)) {
      setErrors({ phoneNumber: 'Please enter a valid 10-digit phone number' });
      return;
    }

    setLoading(true);

    try {
      const phoneE164 = toE164Format(formData.phoneNumber);
      const response: TenantOtpResponse = await apiClient.requestTenantOtp(phoneE164);

      if (response.success) {
        setOtpSent(true);
        setStep('otp');
        setTenantName(response.tenant_name || '');
        startResendTimer();
        
        // Clear general errors
        setErrors({});
      } else {
        // Handle different error types
        if (response.error_type === 'phone_not_found') {
          setErrors({
            phoneNumber: "Phone number not found in our system. Please contact your landlord to set up your tenant account."
          });
        } else if (response.error_type === 'rate_limited') {
          setErrors({
            general: response.error || 'Too many requests. Please wait before trying again.'
          });
        } else {
          setErrors({
            general: response.error || 'Failed to send OTP. Please try again or contact support.'
          });
        }
      }
    } catch (error: any) {
      console.error('OTP request error:', error);
      
      // Handle specific error cases
      if (error.response?.data?.error_type === 'phone_not_found') {
        setErrors({
          phoneNumber: "Phone number not found in our system. Please contact your landlord to set up your tenant account."
        });
      } else if (error.response?.data?.error) {
        setErrors({
          general: error.response.data.error
        });
      } else {
        setErrors({
          general: 'An unexpected error occurred. Please try again or contact support.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP submission (verify OTP)
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Validate OTP
    if (!validateOtpCode(formData.otpCode)) {
      setErrors({ otpCode: 'Please enter a valid 6-digit code' });
      return;
    }

    setLoading(true);

    try {
      const phoneE164 = toE164Format(formData.phoneNumber);
      const response: TenantAuthResponse = await apiClient.verifyTenantOtp(phoneE164, formData.otpCode);

      if (response.success && response.tokens) {
        // Store tokens in localStorage
        localStorage.setItem('tenant_access_token', response.tokens.access);
        localStorage.setItem('tenant_refresh_token', response.tokens.refresh);
        localStorage.setItem('tenant_user', JSON.stringify(response.tenant));

        // Redirect to tenant dashboard
        router.push('/tenant-dashboard');
      } else {
        // Handle OTP verification errors with better messages
        setRemainingAttempts(response.remaining_attempts || null);
        
        if (response.error_type === 'phone_not_found') {
          setErrors({
            general: "Phone number not found in our system. Please contact your landlord to set up your tenant account."
          });
        } else if (response.error_type === 'blocked') {
          setErrors({
            general: response.error || 'Too many failed attempts. Please try again later.'
          });
        } else if (response.error_type === 'expired') {
          setErrors({
            otpCode: 'Your OTP code has expired. Please request a new one below.'
          });
        } else if (response.error_type === 'no_otp') {
          setErrors({
            otpCode: 'No OTP found. Please request a new one below.'
          });
        } else if (response.error_type === 'invalid_otp') {
          const remainingText = response.remaining_attempts 
            ? ` ${response.remaining_attempts} attempts remaining.`
            : '';
          setErrors({
            otpCode: `Invalid OTP code.${remainingText} Please check your code and try again.`
          });
        } else {
          setErrors({
            general: response.error || 'Failed to verify OTP. Please try again.'
          });
        }
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      
      // Handle specific error cases
      if (error.response?.data?.error_type === 'phone_not_found') {
        setErrors({
          general: "Phone number not found in our system. Please contact your landlord to set up your tenant account."
        });
      } else if (error.response?.data?.error) {
        setErrors({
          general: error.response.data.error
        });
      } else {
        setErrors({
          general: 'An unexpected error occurred. Please try again or contact support.'
        });
      }
    } finally {
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
        setFormData(prev => ({ ...prev, otpCode: '' })); // Clear OTP field
        setRemainingAttempts(null); // Reset attempts counter
      } else {
        // Handle different error types for resend
        if (response.error_type === 'phone_not_found') {
          setErrors({
            general: "Phone number not found in our system. Please contact your landlord to set up your tenant account."
          });
        } else if (response.error_type === 'rate_limited') {
          setErrors({
            general: response.error || 'Too many requests. Please wait before requesting another OTP.'
          });
        } else {
          setErrors({
            general: response.error || 'Failed to resend OTP. Please try again.'
          });
        }
      }
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      
      // Handle specific error cases for resend
      if (error.response?.data?.error_type === 'phone_not_found') {
        setErrors({
          general: "Phone number not found in our system. Please contact your landlord to set up your tenant account."
        });
      } else if (error.response?.data?.error) {
        setErrors({
          general: error.response.data.error
        });
      } else {
        setErrors({
          general: 'Failed to resend OTP. Please try again or contact support.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Go back to phone step
  const handleBack = () => {
    setStep('phone');
    setOtpSent(false);
    setFormData(prev => ({ ...prev, otpCode: '' }));
    setErrors({});
    setRemainingAttempts(null);
  };

  return (
    <>
      <Head>
        <title>Tenant Login - Tink Property Management</title>
        <meta name="description" content="Login to your tenant portal" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21l4-4 4 4" />
              </svg>
            </div>
            <h1 className="mt-6 text-3xl font-extrabold text-gray-900">
              Tink Tenant Portal
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {step === 'phone' 
                ? 'Enter your phone number to get started'
                : `Enter the 6-digit code sent to ${formData.phoneNumber}`
              }
            </p>
            {tenantName && (
              <p className="mt-1 text-sm font-medium text-indigo-600">
                Welcome, {tenantName}!
              </p>
            )}
          </div>

          {/* Form */}
          <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
            {step === 'phone' ? (
              <form onSubmit={handlePhoneSubmit} className="space-y-6">
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder="(555) 123-4567"
                      className={`appearance-none block w-full px-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                        errors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={loading}
                    />
                  </div>
                  {errors.phoneNumber && (
                    <p className="mt-2 text-sm text-red-600">{errors.phoneNumber}</p>
                  )}
                </div>

                {errors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-sm text-red-800">{errors.general}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !formData.phoneNumber}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : null}
                  {loading ? 'Sending...' : 'Send Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div>
                  <label htmlFor="otpCode" className="block text-sm font-medium text-gray-700">
                    Verification Code
                  </label>
                  <div className="mt-1">
                    <input
                      id="otpCode"
                      type="text"
                      value={formData.otpCode}
                      onChange={handleOtpChange}
                      placeholder="123456"
                      className={`appearance-none block w-full px-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center text-2xl tracking-widest ${
                        errors.otpCode ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={loading}
                      maxLength={6}
                      autoComplete="one-time-code"
                    />
                  </div>
                  {errors.otpCode && (
                    <p className="mt-2 text-sm text-red-600">{errors.otpCode}</p>
                  )}
                  {remainingAttempts !== null && (
                    <p className="mt-2 text-sm text-orange-600">
                      {remainingAttempts} attempts remaining
                    </p>
                  )}
                </div>

                {errors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-sm text-red-800">{errors.general}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || formData.otpCode.length !== 6}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : null}
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>

                {/* Resend OTP */}
                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-sm text-gray-500">
                      Resend code in {resendTimer} seconds
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-sm text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                    >
                      Resend verification code
                    </button>
                  )}
                </div>

                {/* Back button */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={loading}
                    className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  >
                    ← Change phone number
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Help text */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Having trouble? Contact your landlord or property manager for assistance.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default TenantLogin; 