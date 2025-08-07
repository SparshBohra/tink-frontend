import React, { useState, useEffect } from 'react';
import { 
  X, 
  Phone, 
  MessageSquare, 
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  User,
  Clock,
  Building
} from 'lucide-react';
import { apiClient } from '../lib/api';

interface ContactLandlordModalProps {
  isOpen: boolean;
  onClose: () => void;
  landlordInfo?: {
    name: string;
    phone?: string;
    email?: string;
    property_name?: string;
  };
}

const ContactLandlordModal: React.FC<ContactLandlordModalProps> = ({ 
  isOpen, 
  onClose, 
  landlordInfo 
}) => {
  const [contactMethod, setContactMethod] = useState<'sms' | 'call'>('sms');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Predefined message templates
  const messageTemplates = [
    {
      title: 'Maintenance Request',
      message: 'Hi! I need to report a maintenance issue in my unit. Could you please contact me when convenient? Thank you!'
    },
    {
      title: 'Payment Question',
      message: 'Hello! I have a question about my rent payment. Could you please get in touch with me? Thanks!'
    },
    {
      title: 'General Inquiry',
      message: 'Hi! I have a question about my rental. Could you please contact me when you have a moment? Thank you!'
    },
    {
      title: 'Emergency',
      message: 'URGENT: I have an emergency situation in my unit that requires immediate attention. Please contact me as soon as possible!'
    }
  ];

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setContactMethod('sms');
      setMessage('');
      setLoading(false);
      setSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  const handleTemplateSelect = (template: string) => {
    setMessage(template);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    if (!landlordInfo?.phone) {
      setError('Landlord phone number not available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get current user info from localStorage
      const userStr = localStorage.getItem('tenant_user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const tenantName = user?.full_name || 'Tenant';
      const propertyName = landlordInfo.property_name || 'your property';
      
      // Format message with tenant info
      const fullMessage = `Message from ${tenantName} at ${propertyName}: ${message}`;

      // Send SMS via API
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: landlordInfo.phone,
          message: fullMessage,
          from: 'tenant'
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(result.error || 'Failed to send message');
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneCall = () => {
    if (landlordInfo?.phone) {
      window.open(`tel:${landlordInfo.phone}`, '_self');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
        onClick={onClose}
      >
        {/* Modal */}
        <div 
          style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            width: '100%',
            maxWidth: '32rem',
            maxHeight: '90vh',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #2563eb, #1e40af)',
            padding: '1.5rem 1.5rem 1rem 1.5rem',
            color: 'white',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.5rem',
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <MessageSquare style={{ width: '1.5rem', height: '1.5rem' }} />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Contact Landlord</h3>
                </div>
                <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: 0 }}>
                  Send a message or call your property manager
                </p>
              </div>
              <button 
                onClick={onClose}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.5rem',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
              >
                <X style={{ width: '1.25rem', height: '1.25rem' }} />
              </button>
            </div>
            
            {/* Landlord Info */}
            {landlordInfo && (
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '0.75rem',
                padding: '1rem',
                marginTop: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <User style={{ width: '1.25rem', height: '1.25rem' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 0.25rem 0' }}>
                      {landlordInfo.name}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Building style={{ width: '0.875rem', height: '0.875rem', opacity: 0.8 }} />
                      <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                        {landlordInfo.property_name || 'Property Manager'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div style={{ 
            padding: '1.5rem', 
            flex: 1, 
            overflow: 'auto',
            maxHeight: 'calc(90vh - 200px)'
          }}>
            {success ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '4rem',
                  height: '4rem',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '50%',
                  marginBottom: '1rem'
                }}>
                  <CheckCircle style={{ width: '2rem', height: '2rem', color: '#16a34a' }} />
                </div>
                <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#16a34a', margin: '0 0 0.5rem 0' }}>
                  Message Sent Successfully!
                </p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                  Your landlord will receive your message shortly.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Contact Method Selection */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '0.75rem' 
                  }}>
                    Contact Method
                  </label>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={() => setContactMethod('sms')}
                      style={{
                        flex: 1,
                        padding: '0.75rem 1rem',
                        border: `2px solid ${contactMethod === 'sms' ? '#2563eb' : '#e5e7eb'}`,
                        borderRadius: '0.5rem',
                        backgroundColor: contactMethod === 'sms' ? '#eff6ff' : 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      <MessageSquare style={{ width: '1.25rem', height: '1.25rem', color: contactMethod === 'sms' ? '#2563eb' : '#6b7280' }} />
                      <span style={{ fontWeight: '500', color: contactMethod === 'sms' ? '#2563eb' : '#6b7280' }}>
                        Send Message
                      </span>
                    </button>
                    <button
                      onClick={() => setContactMethod('call')}
                      style={{
                        flex: 1,
                        padding: '0.75rem 1rem',
                        border: `2px solid ${contactMethod === 'call' ? '#2563eb' : '#e5e7eb'}`,
                        borderRadius: '0.5rem',
                        backgroundColor: contactMethod === 'call' ? '#eff6ff' : 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Phone style={{ width: '1.25rem', height: '1.25rem', color: contactMethod === 'call' ? '#2563eb' : '#6b7280' }} />
                      <span style={{ fontWeight: '500', color: contactMethod === 'call' ? '#2563eb' : '#6b7280' }}>
                        Call Now
                      </span>
                    </button>
                  </div>
                </div>

                {contactMethod === 'sms' ? (
                  <>
                    {/* Message Templates */}
                    <div>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '0.875rem', 
                        fontWeight: '600', 
                        color: '#374151', 
                        marginBottom: '0.75rem' 
                      }}>
                        Quick Templates
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                        {messageTemplates.map((template, index) => (
                          <button
                            key={index}
                            onClick={() => handleTemplateSelect(template.message)}
                            style={{
                              padding: '0.5rem 0.75rem',
                              border: '1px solid #e5e7eb',
                              borderRadius: '0.375rem',
                              backgroundColor: 'white',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              color: '#374151',
                              transition: 'all 0.2s',
                              textAlign: 'left'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = '#f3f4f6';
                              e.currentTarget.style.borderColor = '#9ca3af';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = 'white';
                              e.currentTarget.style.borderColor = '#e5e7eb';
                            }}
                          >
                            {template.title}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Message Input */}
                    <div>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '0.875rem', 
                        fontWeight: '600', 
                        color: '#374151', 
                        marginBottom: '0.75rem' 
                      }}>
                        Your Message
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message here..."
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: `2px solid ${error ? '#ef4444' : '#e5e7eb'}`,
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          outline: 'none',
                          resize: 'vertical',
                          minHeight: '80px',
                          maxHeight: '120px',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                        onBlur={(e) => e.target.style.borderColor = error ? '#ef4444' : '#e5e7eb'}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                          {message.length}/500 characters
                        </span>
                        {landlordInfo?.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Phone style={{ width: '0.875rem', height: '0.875rem', color: '#9ca3af' }} />
                            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                              {landlordInfo.phone}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div style={{
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fca5a5',
                        borderRadius: '0.5rem',
                        padding: '0.75rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <AlertCircle style={{ width: '1.25rem', height: '1.25rem', color: '#ef4444' }} />
                          <p style={{ fontSize: '0.875rem', color: '#dc2626', margin: 0 }}>{error}</p>
                        </div>
                      </div>
                    )}

                    {/* Send Button */}
                    <button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || loading}
                      style={{
                        width: '100%',
                        background: loading ? '#9ca3af' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        color: 'white',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        fontWeight: '600',
                        cursor: (!message.trim() || loading) ? 'not-allowed' : 'pointer',
                        opacity: (!message.trim() || loading) ? 0.6 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      {loading ? (
                        <>
                          <Loader2 style={{ width: '1.25rem', height: '1.25rem', animation: 'spin 1s linear infinite' }} />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send style={{ width: '1.25rem', height: '1.25rem' }} />
                          <span>Send Message</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                                      /* Call Option */
                  <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '4rem',
                      height: '4rem',
                      backgroundColor: '#dbeafe',
                      borderRadius: '50%',
                      marginBottom: '1rem'
                    }}>
                      <Phone style={{ width: '2rem', height: '2rem', color: '#2563eb' }} />
                    </div>
                    <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: '0 0 0.5rem 0' }}>
                      Call Your Landlord
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 1rem 0' }}>
                      Click the button below to call {landlordInfo?.name || 'your landlord'} directly
                    </p>
                    {landlordInfo?.phone ? (
                      <button
                        onClick={handlePhoneCall}
                        style={{
                          background: 'linear-gradient(135deg, #16a34a, #15803d)',
                          color: 'white',
                          padding: '0.75rem 2rem',
                          borderRadius: '0.5rem',
                          border: 'none',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          margin: '0 auto',
                          fontSize: '1rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #15803d, #166534)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #16a34a, #15803d)'}
                      >
                        <Phone style={{ width: '1.25rem', height: '1.25rem' }} />
                        <span>Call {landlordInfo.phone}</span>
                      </button>
                    ) : (
                      <p style={{ fontSize: '0.875rem', color: '#ef4444', margin: 0 }}>
                        Phone number not available
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default ContactLandlordModal; 