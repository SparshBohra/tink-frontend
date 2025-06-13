import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import AuthLayout from '../components/AuthLayout';

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
    <AuthLayout title="Register as Landlord">
      <div className="auth-card" style={{ maxWidth: '600px' }}>
        <div className="card-body">
          <h2 className="text-h2 mb-md text-center">Join Tink as a Landlord</h2>
          <p className="text-secondary text-center mb-lg">Register your business on our platform</p>
          
          {error && <div className="alert alert-error mb-md">{error}</div>}
          {success && <div className="alert alert-success mb-md">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-section mb-lg">
              <h3 className="text-h3 mb-md">Organization Information</h3>
              <div className="form-group">
                <label htmlFor="org_name" className="form-label">Organization Name</label>
                <input id="org_name" name="org_name" type="text" value={formData.org_name} onChange={handleChange} required disabled={loading} className="form-input" />
          </div>
              <div className="grid grid-cols-1 md:grid-cols-2 grid-gap">
                <div className="form-group">
                  <label htmlFor="contact_email" className="form-label">Business Email</label>
                  <input id="contact_email" name="contact_email" type="email" value={formData.contact_email} onChange={handleChange} required disabled={loading} className="form-input" />
          </div>
                <div className="form-group">
                  <label htmlFor="contact_phone" className="form-label">Business Phone</label>
                  <input id="contact_phone" name="contact_phone" type="tel" value={formData.contact_phone} onChange={handleChange} disabled={loading} className="form-input" />
          </div>
          </div>
        </div>

            <div className="form-section mb-lg">
              <h3 className="text-h3 mb-md">Your Personal Account</h3>
              <div className="form-group">
                <label htmlFor="full_name" className="form-label">Your Full Name</label>
                <input id="full_name" name="full_name" type="text" value={formData.full_name} onChange={handleChange} required disabled={loading} className="form-input" />
              </div>
              <div className="form-group">
                <label htmlFor="username" className="form-label">Username</label>
                <input id="username" name="username" type="text" value={formData.username} onChange={handleChange} required disabled={loading} className="form-input" />
          </div>
              <div className="grid grid-cols-1 md:grid-cols-2 grid-gap">
                <div className="form-group">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required disabled={loading} className="form-input" />
          </div>
                <div className="form-group">
                  <label htmlFor="password_confirm" className="form-label">Confirm Password</label>
                  <input id="password_confirm" name="password_confirm" type="password" value={formData.password_confirm} onChange={handleChange} required disabled={loading} className="form-input" />
          </div>
          </div>
        </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-full-width">
              {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
        </div>
      
        <div className="card-footer">
          <p className="text-small text-secondary">
          Already have an account?{' '}
            <Link href="/login" legacyBehavior><a className="text-link">Sign In</a></Link>
        </p>
      </div>
    </div>
    </AuthLayout>
  );
} 