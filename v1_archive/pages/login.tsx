import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth-context';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const { login, isAuthenticated, loading, error, clearError, user } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Clear any previous errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      // Redirect based on user role
      switch (user.role) {
        case 'admin':
          router.push('/admin-dashboard');
          break;
        case 'owner':
          router.push('/landlord-dashboard');
          break;
        case 'manager':
          router.push('/manager-dashboard');
          break;
        case 'tenant':
          router.push('/tenant-dashboard');
          break;
        default:
          router.push('/landlord-dashboard');
      }
    }
  }, [loading, isAuthenticated, user, router]);

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

  if (isAuthenticated) {
    return (
      <>
        <Head>
          <title>Login - SquareFt</title>
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
        <title>Login - SquareFt</title>
      </Head>
      <div className="login-container">
        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <div className="logo">
              <img src="/logo1.png" alt="SquareFt" className="logo-img" />
            </div>
            <h2 className="login-title">Welcome!</h2>
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
          background: #fafbfc;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          position: relative;
        }

        .login-container::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 0;
          background: radial-gradient(circle at 50% 50%, rgba(24, 119, 242, 0.08) 0%, rgba(24, 119, 242, 0.03) 40%, transparent 70%);
          pointer-events: none;
        }

        .login-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 24px;
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.08);
          padding: 60px 50px;
          width: 100%;
          max-width: 520px;
          border: 1px solid rgba(255, 255, 255, 0.5);
          position: relative;
          z-index: 1;
        }

        .login-header {
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

        .login-title {
          font-size: 36px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 12px 0;
          letter-spacing: -0.5px;
          line-height: 1.1;
        }

        .login-subtitle {
          font-size: 17px;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }

        .login-form {
          margin-bottom: 32px;
        }

        .form-group {
          margin-bottom: 24px;
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

        .login-button {
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
        }

        .login-button:hover:not(:disabled) {
          background: #166FE5;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(24, 119, 242, 0.35);
        }

        .login-button:disabled {
          background: #94a3b8;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .login-footer {
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

        .signup-link {
          color: #1877F2;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
        }

        .signup-link:hover {
          color: #166FE5;
          text-decoration: underline;
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

        .text-center {
          text-align: center;
        }

        .text-h2 {
          font-size: 24px;
          font-weight: 700;
        }

        .text-success {
          color: #166534;
        }

        .mb-md {
          margin-bottom: 16px;
        }

        .text-body {
          font-size: 16px;
        }

        @media (max-width: 640px) {
          .login-container {
            padding: 24px 16px;
          }

          .login-card {
            padding: 40px 28px;
          }

          .logo-img {
            height: 65px;
          }

          .login-title {
            font-size: 30px;
          }

          .login-subtitle {
            font-size: 16px;
          }
        }
      `}</style>
    </>
  );
}
