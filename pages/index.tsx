import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AddressInput from '../components/listing-generator/AddressInput';

export default function Home() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Check for auth code in URL (Supabase PKCE flow)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      // Redirect to auth callback with the code
      setIsRedirecting(true);
      window.location.href = `/auth/callback?code=${code}`;
    }
  }, []);

  const handleAddressSubmit = (address: string) => {
    console.log('Submitted address from Home:', address);
  };

  const handleAuth = (mode: 'login' | 'signup') => {
    console.log('Auth action from Home:', mode);
  }

  // Show nothing while redirecting auth
  if (isRedirecting) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f8fafc'
      }}>
        <p style={{ color: '#64748b' }}>Redirecting...</p>
      </div>
    );
  }

  return <AddressInput onSubmit={handleAddressSubmit} onAuthClick={handleAuth} />;
}