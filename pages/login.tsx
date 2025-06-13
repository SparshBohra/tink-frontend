import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import Link from 'next/link';
import AuthLayout from '../components/AuthLayout';
import SectionCard from '../components/SectionCard';

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
      <div className="page-wrapper">
        <div className="card" style={{ maxWidth: '400px' }}>
          <div className="card-body text-center">
            <h2 className="text-h2 text-success mb-md">Already Logged In</h2>
            <p className="text-body text-secondary">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout title="Sign In">
      <div className="auth-card">
        <div className="card-body">
          <h2 className="text-h2 mb-lg text-center">Welcome Back!</h2>
          {/* Error Alert */}
          {error && (
            <div className="alert alert-error mb-md">
              <strong>Login Failed:</strong> {error}
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="alert alert-success mb-md">
              <strong>Success:</strong> {success}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Username or Email
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username or email"
                required
                disabled={isLoading || loading}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={isLoading || loading}
                className="form-input"
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading || loading}
              className="btn btn-primary btn-full-width"
            >
              {isLoading || loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div className="text-center mt-lg">
            <p className="text-small text-secondary mb-sm">
              Don't have an account yet?
            </p>
            <Link href="/landlord-signup" legacyBehavior>
              <a className="text-link">Register as a Landlord →</a>
            </Link>
          </div>
        </div>

        <div className="card-footer">
          <div className="text-center mb-lg">
            <h3 className="text-h3 mb-sm">Quick Demo Access</h3>
            <p className="text-small text-secondary mb-lg">
              Try the application with pre-configured demo accounts
            </p>
          </div>
      
          <div className="grid grid-cols-1 grid-gap">
            <button 
              onClick={() => handleDemoLogin('admin')}
              disabled={isLoading || loading}
              className="btn btn-error"
            >
              Platform Admin Demo
            </button>
            
            <button 
              onClick={() => handleDemoLogin('owner')}
              disabled={isLoading || loading}
              className="btn btn-warning"
            >
              Landlord Demo
            </button>
            
            <button 
              onClick={() => handleDemoLogin('manager')}
              disabled={isLoading || loading}
              className="btn btn-success"
            >
              Property Manager Demo
            </button>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
} 