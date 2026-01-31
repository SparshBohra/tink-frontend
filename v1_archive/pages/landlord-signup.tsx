import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';

export default function LandlordSignup() {
  const router = useRouter();
  const { signupLandlord, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
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
        <title>Register as Landlord - SquareFt</title>
      </Head>
      <div className="signup-container">
        <div className="signup-card">
          {/* Header */}
          <div className="signup-header">
            <div className="logo">
              <img src="/logo1.png" alt="SquareFt" className="logo-img" />
            </div>
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
          background: #fafbfc;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          position: relative;
        }

        .signup-container::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 0;
          background: radial-gradient(circle at 50% 50%, rgba(24, 119, 242, 0.08) 0%, rgba(24, 119, 242, 0.03) 40%, transparent 70%);
          pointer-events: none;
        }

        .signup-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 24px;
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.08);
          padding: 60px 50px;
          width: 100%;
          max-width: 680px;
          border: 1px solid rgba(255, 255, 255, 0.5);
          position: relative;
          z-index: 1;
        }

        .signup-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .logo {
          display: inline-block;
          margin-bottom: 32px;
        }

        .logo-img {
          height: 80px;
          width: auto;
        }

        .signup-title {
          font-size: 36px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 12px 0;
          letter-spacing: -0.5px;
          line-height: 1.1;
        }

        .signup-subtitle {
          font-size: 17px;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
          max-width: 480px;
          margin-left: auto;
          margin-right: auto;
        }

        .signup-form {
          margin-bottom: 32px;
        }

        .form-section {
          margin-bottom: 36px;
          padding-bottom: 32px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.6);
        }

        .form-section:last-of-type {
          border-bottom: none;
          margin-bottom: 28px;
        }

        .section-title {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 24px 0;
          text-align: center;
        }

        .form-group {
          margin-bottom: 22px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .form-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #334155;
          font-size: 15px;
        }

        .form-input {
          width: 100%;
          padding: 14px 18px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 16px;
          transition: all 0.2s;
          background: rgba(255, 255, 255, 0.8);
        }

        .form-input:focus {
          border-color: #1877F2;
          outline: none;
          box-shadow: 0 0 0 3px rgba(24, 119, 242, 0.1);
          background: white;
        }

        .form-input:disabled {
          background: #f1f5f9;
          cursor: not-allowed;
        }

        .signup-button {
          width: 100%;
          padding: 16px 32px;
          font-size: 17px;
          font-weight: 700;
          background: #1877F2;
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(24, 119, 242, 0.25);
          margin-bottom: 24px;
        }

        .signup-button:hover:not(:disabled) {
          background: #166FE5;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(24, 119, 242, 0.35);
        }

        .signup-button:disabled {
          background: #94a3b8;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .signup-footer {
          text-align: center;
          padding-top: 28px;
          border-top: 1px solid rgba(226, 232, 240, 0.6);
        }

        .text-small {
          font-size: 15px;
        }

        .text-secondary {
          color: #64748b;
        }

        .signin-button {
          width: 100%;
          margin-top: 14px;
          font-weight: 600;
          padding: 12px 24px;
          font-size: 16px;
          border-radius: 12px;
          border: 2px solid #1877F2;
          color: #1877F2;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s;
        }

        .signin-button:hover {
          background: rgba(24, 119, 242, 0.05);
          transform: translateY(-1px);
        }

        .alert {
          padding: 14px 18px;
          border-radius: 12px;
          margin-bottom: 24px;
          font-size: 15px;
        }

        .alert-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        }

        .alert-success {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        }

        .alert strong {
          font-weight: 700;
        }

        .field-success {
          color: #166534;
          font-size: 14px;
          margin-top: 6px;
          font-weight: 600;
        }

        .field-error {
          color: #dc2626;
          font-size: 14px;
          margin-top: 6px;
          font-weight: 500;
        }

        .input-error {
          border-color: #dc2626 !important;
          background-color: #fef2f2;
        }

        .input-error:focus {
          border-color: #dc2626 !important;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
        }

        @media (max-width: 640px) {
          .signup-container {
            padding: 24px 16px;
          }

          .signup-card {
            padding: 40px 28px;
          }

          .logo-img {
            height: 65px;
          }

          .signup-title {
            font-size: 30px;
          }

          .signup-subtitle {
            font-size: 16px;
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
