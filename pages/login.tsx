import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth-context';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
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

  const handleDemoLogin = async (role: 'admin' | 'owner' | 'tenant') => {
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
        // Tenant - Uses different auth system (phone + OTP), redirect to tenant login
        setSuccess('Redirecting to Tenant Portal...');
        setTimeout(() => {
          router.push('/tenant-login');
        }, 1000);
        return;
      }
      
      console.log('Demo login - attempting login with:', credentials.username);
      await login(credentials);
      console.log('Demo login completed successfully');
      setSuccess(`${role === 'admin' ? 'Platform Admin' : role === 'owner' ? 'Landlord' : 'Tenant'} demo login successful! Redirecting...`);
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
      <>
        <Head>
          <title>Login - Tink Property Management</title>
        </Head>
        <div className="login-container">
          <div className="login-card">
            <div className="text-center">
              <h2 className="text-h2 text-success mb-md">Already Logged In</h2>
              <p className="text-body text-secondary">Redirecting to dashboard...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Login - Tink Property Management</title>
      </Head>
      <div className="login-container">
        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <div className="logo">
              <span>T</span>
            </div>
            <h1 className="brand-title">Tink Property Management</h1>
            <h2 className="login-title">Welcome Back!</h2>
            <p className="login-subtitle">Sign in to your account to continue</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-error">
              <strong>Login Failed:</strong> {error}
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="alert alert-success">
              <strong>Success:</strong> {success}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="login-form">
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
              className="btn btn-primary login-button"
            >
              {isLoading || loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Access Section */}
          <div className="demo-section">
            <div className="section-divider">
              <span>Or try a demo account</span>
            </div>
            
            <div className="demo-buttons">
              <button 
                onClick={() => handleDemoLogin('admin')}
                disabled={isLoading || loading}
                className="btn btn-error btn-sm demo-btn"
              >
                Platform Admin Demo
              </button>
              
              <button 
                onClick={() => handleDemoLogin('owner')}
                disabled={isLoading || loading}
                className="btn btn-warning btn-sm demo-btn"
              >
                Landlord Demo
              </button>
              
              <button 
                onClick={() => handleDemoLogin('tenant')}
                disabled={isLoading || loading}
                className="btn btn-primary btn-sm demo-btn"
              >
                Tenant Portal Demo
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="login-footer">
            <p className="text-small text-secondary">
              Don't have an account yet?{' '}
              <Link href="/landlord-signup" className="signup-link">
                Register as a Landlord
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          background: linear-gradient(135deg, var(--gray-50) 0%, var(--gray-100) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-lg);
          font-family: var(--font-sans);
        }

        .login-card {
          background: white;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          padding: var(--spacing-2xl);
          width: 100%;
          max-width: 450px;
          border: 1px solid var(--gray-200);
        }

        .login-header {
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

        .login-title {
          font-size: var(--text-h1);
          font-weight: 700;
          color: var(--gray-900);
          margin: 0 0 var(--spacing-sm) 0;
          line-height: var(--line-height-tight);
        }

        .login-subtitle {
          font-size: var(--text-body);
          color: var(--gray-600);
          margin: 0;
        }

        .login-form {
          margin-bottom: var(--spacing-xl);
        }

        .form-group {
          margin-bottom: var(--spacing-lg);
        }

        .form-label {
          display: block;
          margin-bottom: var(--spacing-sm);
          font-weight: var(--font-weight-medium);
          color: var(--gray-700);
        }

        .login-button {
          width: 100%;
          padding: var(--spacing-md);
          font-size: var(--text-body);
          font-weight: var(--font-weight-medium);
        }

        .demo-section {
          margin-bottom: var(--spacing-xl);
        }

        .section-divider {
          position: relative;
          text-align: center;
          margin-bottom: var(--spacing-lg);
        }

        .section-divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: var(--gray-200);
          z-index: 1;
        }

        .section-divider span {
          background: white;
          padding: 0 var(--spacing-md);
          color: var(--gray-500);
          font-size: var(--text-small);
          position: relative;
          z-index: 2;
        }

        .demo-buttons {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .demo-btn {
          width: 100%;
          justify-content: center;
          padding: var(--spacing-sm) var(--spacing-md);
        }

        .login-footer {
          text-align: center;
          padding-top: var(--spacing-lg);
          border-top: 1px solid var(--gray-100);
        }

        .signup-button {
          width: 100%;
          margin-top: var(--spacing-md);
          font-weight: var(--font-weight-medium);
        }

        .text-link {
          color: var(--primary-blue);
          text-decoration: none;
          font-weight: var(--font-weight-medium);
          transition: color var(--transition-fast);
        }

        .text-link:hover {
          color: var(--primary-blue-dark);
          text-decoration: underline;
        }

        .signup-link {
          color: var(--gray-900);
          text-decoration: underline;
          font-weight: var(--font-weight-semibold);
          transition: color var(--transition-fast);
        }

        .signup-link:hover {
          color: var(--gray-700);
        }

        @media (max-width: 480px) {
          .login-container {
            padding: var(--spacing-md);
          }

          .login-card {
            padding: var(--spacing-xl);
          }

          .brand-title {
            font-size: var(--text-h3);
          }

          .login-title {
            font-size: var(--text-h2);
          }
        }
      `}</style>
    </>
  );
} 