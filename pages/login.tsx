import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import Link from 'next/link';

export default function Login() {
  const { login, isAuthenticated, loading, error, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Clear any previous errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    try {
      setIsLoading(true);
      setSuccess(null);
      clearError();
      
      console.log('Login form - attempting login with:', username);
      await login({ username, password });
      console.log('Login form - login completed successfully');
      setSuccess('Login successful! Redirecting to dashboard...');
      // The login function will handle redirection
    } catch (error: any) {
      console.error('Login form - login failed:', error);
      setSuccess(null);
      // Error is handled by auth context
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'admin' | 'owner' | 'manager') => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      setSuccess(null);
      clearError();
      
      let credentials;
      if (role === 'admin') {
        // Platform Admin - SaaS owner who oversees all landlords
        credentials = { username: 'admin', password: 'TinkAdmin2024!' };
        setUsername('admin');
        setPassword('TinkAdmin2024!');
      } else if (role === 'owner') {
        // Landlord/Owner - Property owner who manages properties and hires managers
        credentials = { username: 'premium_owner', password: 'demo123' };
        setUsername('premium_owner');
        setPassword('demo123');
      } else {
        // Manager - Works for landlords and manages day-to-day operations
        credentials = { username: 'sarah_manager', password: 'demo123' };
        setUsername('sarah_manager');
        setPassword('demo123');
      }
      
      console.log('Demo login - attempting login with:', credentials.username);
      await login(credentials);
      console.log('Demo login completed successfully');
      setSuccess(`${role === 'admin' ? 'Platform Admin' : role === 'owner' ? 'Landlord' : 'Manager'} demo login successful! Redirecting...`);
      // Login function will redirect based on role
    } catch (error: any) {
      console.error('Demo login failed:', error);
      setSuccess(null);
      // Error is handled by auth context
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>✅ Already Logged In</h2>
        <p>Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '500px', 
      margin: '50px auto', 
      padding: '40px', 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      backgroundColor: '#fff'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#2c3e50', marginBottom: '10px' }}>
          🏠 Tink Property Management
        </h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Sign in to manage your co-living properties
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
          <strong>⚠️ Login Failed:</strong> {error}
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
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="username" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Username/Email:
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username or email"
            required
            disabled={isLoading || loading}
            style={{ 
              width: '100%', 
              padding: '12px', 
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: isLoading || loading ? '#f8f9fa' : 'white'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '25px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Password:
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            disabled={isLoading || loading}
            style={{ 
              width: '100%', 
              padding: '12px', 
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: isLoading || loading ? '#f8f9fa' : 'white'
            }}
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading || loading}
          style={{ 
            width: '100%',
            padding: '12px 20px', 
            fontSize: '16px',
            fontWeight: 'bold',
            backgroundColor: isLoading || loading ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading || loading ? 'not-allowed' : 'pointer',
            marginBottom: '20px'
          }}
        >
          {isLoading || loading ? '🔄 Signing in...' : '🔐 Sign In'}
        </button>
      </form>

      <hr style={{ margin: '30px 0', borderColor: '#eee' }} />
      
      <div>
        <h3 style={{ textAlign: 'center', marginBottom: '15px', color: '#495057' }}>
          🚀 Quick Demo Access
        </h3>
        <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666', fontSize: '14px' }}>
          Try the application with pre-configured demo accounts:
        </p>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            onClick={() => handleDemoLogin('admin')}
            disabled={isLoading || loading}
            style={{ 
              flex: 1,
              padding: '10px 16px', 
              backgroundColor: isLoading || loading ? '#6c757d' : '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading || loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            🛡️ Admin (SaaS Owner)
          </button>
          <button 
            onClick={() => handleDemoLogin('owner')}
            disabled={isLoading || loading}
            style={{ 
              flex: 1,
              padding: '10px 16px', 
              backgroundColor: isLoading || loading ? '#6c757d' : '#f39c12',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading || loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            💰 Landlord Demo
      </button>
          <button 
            onClick={() => handleDemoLogin('manager')}
            disabled={isLoading || loading}
            style={{ 
              flex: 1,
              padding: '10px 16px', 
              backgroundColor: isLoading || loading ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading || loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            ⚙️ Manager Demo
      </button>
        </div>
        
        <div style={{ 
          fontSize: '12px', 
          color: '#6c757d', 
          backgroundColor: '#f8f9fa',
          padding: '10px',
          borderRadius: '4px',
          border: '1px solid #e9ecef'
        }}>
          <p style={{ margin: '0 0 5px 0' }}>
            <strong>🛡️ Platform Admin:</strong> admin / TinkAdmin2024! <em>(SaaS owner - oversees all landlords)</em>
          </p>
          <p style={{ margin: '0 0 5px 0' }}>
            <strong>💰 Landlord:</strong> premium_owner / demo123 <em>(Property owner - manages properties & team)</em>
          </p>
          <p style={{ margin: '0' }}>
            <strong>⚙️ Manager:</strong> sarah_manager / demo123 <em>(Works for landlord - daily operations)</em>
          </p>
        </div>
      </div>

      <hr style={{ margin: '30px 0', borderColor: '#eee' }} />
      
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#666', fontSize: '14px' }}>
          New landlord?{' '}
          <Link href="/landlord-signup" style={{ color: '#007bff', textDecoration: 'none' }}>
            Register your business here
          </Link>
        </p>
        <p style={{ color: '#999', fontSize: '12px', marginTop: '10px' }}>
          <em>Managers are assigned by landlords or platform admins</em>
        </p>
      </div>
    </div>
  );
} 