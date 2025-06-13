import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return <div>Redirecting to dashboard...</div>;
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>🏠 Tink Property Management</h1>
      <p>Manage co-living properties with ease.</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
        <Link href="/login"><button style={{ padding: '12px 24px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>Login</button></Link>
        <Link href="/signup"><button style={{ padding: '12px 24px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>Sign Up</button></Link>
      </div>
    </div>
  );
} 