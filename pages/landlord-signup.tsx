import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';

export default function LandlordSignup() {
  const router = useRouter();
  const { signupLandlord, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    org_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    full_name: '',
    username: '',
    password: '',
    password_confirm: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);

    if (formData.password !== formData.password_confirm) {
      // This should be handled by the auth context, but as a fallback:
      clearError(); // Need to implement custom error state for this
      setLoading(false);
      return;
    }

    try {
      await signupLandlord(formData);
      setSuccess('Landlord account created! Redirecting to dashboard...');
    } catch (err) {
      // Error is handled by auth context
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Register as Landlord - Tink Property Management</title>
      </Head>
      <div className="signup-container">
        <div className="signup-card">
          {/* Header */}
          <div className="signup-header">
            <div className="logo">
              <span>T</span>
            </div>
            <h1 className="brand-title">Tink Property Management</h1>
            <h2 className="signup-title">Join as a Landlord</h2>
            <p className="signup-subtitle">Register your business on our platform and start managing properties today</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-error">
              <strong>Registration Failed:</strong> {error}
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="alert alert-success">
              <strong>Success:</strong> {success}
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="signup-form">
            {/* Organization Information */}
            <div className="form-section">
              <h3 className="section-title">Organization Information</h3>
              
              <div className="form-group">
                <label htmlFor="org_name" className="form-label">Organization Name *</label>
                <input 
                  id="org_name" 
                  name="org_name" 
                  type="text" 
                  value={formData.org_name} 
                  onChange={handleChange} 
                  placeholder="e.g., Premium Properties LLC"
                  required 
                  disabled={loading} 
                  className="form-input" 
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="contact_email" className="form-label">Business Email *</label>
                  <input 
                    id="contact_email" 
                    name="contact_email" 
                    type="email" 
                    value={formData.contact_email} 
                    onChange={handleChange} 
                    placeholder="business@company.com"
                    required 
                    disabled={loading} 
                    className="form-input" 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="contact_phone" className="form-label">Business Phone</label>
                  <input 
                    id="contact_phone" 
                    name="contact_phone" 
                    type="tel" 
                    value={formData.contact_phone} 
                    onChange={handleChange} 
                    placeholder="+1 (555) 123-4567"
                    disabled={loading} 
                    className="form-input" 
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="address" className="form-label">Business Address</label>
                <input 
                  id="address" 
                  name="address" 
                  type="text" 
                  value={formData.address} 
                  onChange={handleChange} 
                  placeholder="123 Business St, City, State"
                  disabled={loading} 
                  className="form-input" 
                />
              </div>
            </div>

            {/* Personal Account Information */}
            <div className="form-section">
              <h3 className="section-title">Your Personal Account</h3>
              
              <div className="form-group">
                <label htmlFor="full_name" className="form-label">Your Full Name *</label>
                <input 
                  id="full_name" 
                  name="full_name" 
                  type="text" 
                  value={formData.full_name} 
                  onChange={handleChange} 
                  placeholder="John Doe"
                  required 
                  disabled={loading} 
                  className="form-input" 
                />
              </div>

              <div className="form-group">
                <label htmlFor="username" className="form-label">Username *</label>
                <input 
                  id="username" 
                  name="username" 
                  type="text" 
                  value={formData.username} 
                  onChange={handleChange} 
                  placeholder="john_doe"
                  required 
                  disabled={loading} 
                  className="form-input" 
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password" className="form-label">Password *</label>
                  <input 
                    id="password" 
                    name="password" 
                    type="password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    placeholder="Enter secure password"
                    required 
                    disabled={loading} 
                    className="form-input" 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password_confirm" className="form-label">Confirm Password *</label>
                  <input 
                    id="password_confirm" 
                    name="password_confirm" 
                    type="password" 
                    value={formData.password_confirm} 
                    onChange={handleChange} 
                    placeholder="Confirm password"
                    required 
                    disabled={loading} 
                    className="form-input" 
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="btn btn-primary signup-button"
            >
              {loading ? 'Creating Account...' : 'Create Landlord Account'}
            </button>
          </form>

          {/* Footer */}
          <div className="signup-footer">
            <p className="text-small text-secondary">
              Already have an account?
            </p>
            <Link href="/login" className="btn btn-secondary btn-outline signin-button">
              Sign In
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .signup-container {
          min-height: 100vh;
          background: linear-gradient(135deg, var(--gray-50) 0%, var(--gray-100) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-lg);
          font-family: var(--font-sans);
        }

        .signup-card {
          background: white;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          padding: var(--spacing-2xl);
          width: 100%;
          max-width: 600px;
          border: 1px solid var(--gray-200);
        }

        .signup-header {
          text-align: center;
          margin-bottom: var(--spacing-xl);
        }

        .logo {
          width: 56px;
          height: 56px;
          background: var(--primary-blue);
          border-radius: var(--radius-md);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 24px;
          color: white;
          margin-bottom: var(--spacing-md);
        }

        .brand-title {
          font-size: var(--text-h2);
          font-weight: 600;
          color: var(--gray-900);
          margin: 0 0 var(--spacing-md) 0;
          line-height: var(--line-height-tight);
        }

        .signup-title {
          font-size: var(--text-h1);
          font-weight: 700;
          color: var(--gray-900);
          margin: 0 0 var(--spacing-sm) 0;
          line-height: var(--line-height-tight);
        }

        .signup-subtitle {
          font-size: var(--text-body);
          color: var(--gray-600);
          margin: 0;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }

        .signup-form {
          margin-bottom: var(--spacing-xl);
        }

        .form-section {
          margin-bottom: var(--spacing-xl);
          padding-bottom: var(--spacing-lg);
          border-bottom: 1px solid var(--gray-100);
        }

        .form-section:last-of-type {
          border-bottom: none;
          margin-bottom: var(--spacing-lg);
        }

        .section-title {
          font-size: var(--text-h3);
          font-weight: 600;
          color: var(--gray-900);
          margin: 0 0 var(--spacing-lg) 0;
          text-align: center;
        }

        .form-group {
          margin-bottom: var(--spacing-lg);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-md);
        }

        .form-label {
          display: block;
          margin-bottom: var(--spacing-sm);
          font-weight: var(--font-weight-medium);
          color: var(--gray-700);
          font-size: var(--text-small);
        }

        .signup-button {
          width: 100%;
          padding: var(--spacing-md);
          font-size: var(--text-body);
          font-weight: var(--font-weight-medium);
          margin-bottom: var(--spacing-lg);
        }

        .signup-footer {
          text-align: center;
          padding-top: var(--spacing-lg);
          border-top: 1px solid var(--gray-100);
        }

        .signin-button {
          width: 100%;
          margin-top: var(--spacing-md);
          font-weight: var(--font-weight-medium);
        }

        @media (max-width: 640px) {
          .signup-container {
            padding: var(--spacing-md);
          }

          .signup-card {
            padding: var(--spacing-xl);
          }

          .brand-title {
            font-size: var(--text-h3);
          }

          .signup-title {
            font-size: var(--text-h2);
          }

          .form-row {
            grid-template-columns: 1fr;
            gap: 0;
          }
        }
      `}</style>
    </>
  );
} 