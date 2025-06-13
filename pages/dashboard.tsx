import { useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { useRouter } from 'next/router';

function Dashboard() {
  const { user, isAdmin, isLandlord, isManager } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      // Redirect to role-specific dashboard
      if (isAdmin()) {
        router.replace('/admin-dashboard');
      } else if (isLandlord()) {
        router.replace('/landlord-dashboard');
      } else if (isManager()) {
        router.replace('/manager-dashboard');
      } else {
        // Fallback to login if no role
        router.replace('/login');
      }
    }
  }, [user, router, isAdmin, isLandlord, isManager]);

  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center',
      maxWidth: '500px',
      margin: '50px auto'
    }}>
      <h2>🔄 Redirecting...</h2>
      <p>Redirecting to your dashboard...</p>
    </div>
  );
}

export default Dashboard; 
 
 
 
 