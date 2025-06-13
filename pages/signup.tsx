import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Signup() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to landlord signup since managers are created by admins/landlords
    router.replace('/landlord-signup');
  }, [router]);

  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center',
      maxWidth: '500px',
      margin: '50px auto'
    }}>
      <h2>🔄 Redirecting...</h2>
      <p>Redirecting to landlord registration...</p>
    </div>
  );
} 
 
 
 
 