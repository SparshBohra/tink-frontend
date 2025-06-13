import Link from 'next/link';
import { useAuth } from '../lib/auth-context';

export default function Unauthorized() {
  const { user, logout } = useAuth();

  const getRoleBasedDashboard = () => {
    if (!user) return '/login';
    
    switch (user.role) {
      case 'admin':
        return '/admin-dashboard';
      case 'owner':
        return '/landlord-dashboard';
      case 'manager':
        return '/manager-dashboard';
      default:
        return '/dashboard';
    }
  };

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '100px auto', 
      padding: '40px', 
      textAlign: 'center',
      border: '1px solid #ddd', 
      borderRadius: '8px',
      backgroundColor: '#fff'
    }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#dc3545', fontSize: '48px', margin: '0 0 20px 0' }}>
          🚫
        </h1>
        <h2 style={{ color: '#2c3e50', marginBottom: '10px' }}>
          Access Denied
        </h2>
        <p style={{ color: '#666', fontSize: '18px', marginBottom: '20px' }}>
          You don't have permission to access this page.
        </p>
      </div>

      {user && (
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '6px',
          marginBottom: '30px'
        }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
            <strong>Current User:</strong> {user.full_name || user.username}
          </p>
          <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
            <strong>Your Role:</strong> 
            <span style={{
              backgroundColor: user.role === 'admin' ? '#dc3545' : user.role === 'owner' ? '#f39c12' : '#28a745',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: 'bold',
              marginLeft: '8px'
            }}>
              {user.role.toUpperCase()}
            </span>
          </p>
          <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
            This page requires different permissions than your current role provides.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href={getRoleBasedDashboard()}>
          <button style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
            fontWeight: 'bold',
            textDecoration: 'none'
          }}>
            🏠 Go to My Dashboard
          </button>
        </Link>
        
        <Link href="/dashboard">
          <button style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
            fontWeight: 'bold',
            textDecoration: 'none'
          }}>
            📊 Main Dashboard
          </button>
        </Link>

        <button 
          onClick={() => logout()}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🚪 Logout
        </button>
      </div>

      <div style={{ marginTop: '30px', fontSize: '12px', color: '#6c757d' }}>
        <p>If you believe this is an error, please contact your administrator.</p>
      </div>
    </div>
  );
} 
 
 
 
 