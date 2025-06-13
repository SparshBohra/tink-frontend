import { useState } from 'react';
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
    clearError(); // Clear errors when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);

    // Validation
    if (formData.password !== formData.password_confirm) {
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setLoading(false);
      return;
    }

    try {
      await signupLandlord(formData);
      setSuccess('Landlord account created successfully! Redirecting to your dashboard...');
    } catch (err: any) {
      console.error('Landlord signup failed:', err);
      // Error is handled by auth context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '50px auto', 
      padding: '40px', 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      backgroundColor: '#fff'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#2c3e50', marginBottom: '10px' }}>
          💰 Join Tink as a Landlord
        </h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Register your property management business on our platform
        </p>
      </div>

      {error && (
        <div style={{ 
          color: '#721c24', 
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb', 
          padding: '12px', 
          marginBottom: '20px',
          borderRadius: '4px'
        }}>
          <strong>⚠️ Registration Failed:</strong> {error}
        </div>
      )}

      {success && (
        <div style={{ 
          color: '#155724', 
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb', 
          padding: '12px', 
          marginBottom: '20px',
          borderRadius: '4px'
        }}>
          <strong>✅ Success:</strong> {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Organization Information */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>🏢 Organization Information</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="org_name" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Organization Name *
            </label>
            <input
              id="org_name"
              name="org_name"
              type="text"
              value={formData.org_name}
              onChange={handleChange}
              placeholder="e.g., ABC Property Management"
              required
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '12px', 
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="contact_email" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Business Email *
            </label>
            <input
              id="contact_email"
              name="contact_email"
              type="email"
              value={formData.contact_email}
              onChange={handleChange}
              placeholder="business@yourcompany.com"
              required
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '12px', 
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="contact_phone" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Business Phone
            </label>
            <input
              id="contact_phone"
              name="contact_phone"
              type="tel"
              value={formData.contact_phone}
              onChange={handleChange}
              placeholder="+1 (555) 123-4567"
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '12px', 
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="address" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Business Address
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Business St, City, State, ZIP"
              disabled={loading}
              rows={3}
              style={{ 
                width: '100%', 
                padding: '12px', 
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        {/* Account Information */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>👤 Account Information</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="full_name" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Your Full Name *
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="John Doe"
              required
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '12px', 
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="username" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Username *
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              placeholder="johndoe_properties"
              required
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '12px', 
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Password *
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 8 characters"
              required
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '12px', 
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="password_confirm" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Confirm Password *
            </label>
            <input
              id="password_confirm"
              name="password_confirm"
              type="password"
              value={formData.password_confirm}
              onChange={handleChange}
              placeholder="Re-enter your password"
              required
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '12px', 
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: '100%',
            padding: '15px 20px', 
            fontSize: '16px',
            fontWeight: 'bold',
            backgroundColor: loading ? '#6c757d' : '#f39c12',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '20px'
          }}
        >
          {loading ? '🔄 Creating Account...' : '💰 Create Landlord Account'}
        </button>
      </form>

      <hr style={{ margin: '30px 0', borderColor: '#eee' }} />
      
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#007bff', textDecoration: 'none' }}>
            Sign in here
          </Link>
        </p>
        <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
          Are you a manager?{' '}
          <Link href="/login" style={{ color: '#007bff', textDecoration: 'none' }}>
            Contact your landlord for access
          </Link>
        </p>
      </div>
    </div>
  );
} 