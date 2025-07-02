import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { withAuth } from '../lib/auth-context';

function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to manager-dashboard
    router.replace('/manager-dashboard');
  }, [router]);

  // Return null since we're redirecting
  return null;
}

export default withAuth(Dashboard); 