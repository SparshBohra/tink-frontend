import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AddressInput from '../components/listing-generator/AddressInput';

export default function Home() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Check for auth params in URL (Supabase PKCE flow or email confirmation)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const tokenHash = urlParams.get('token_hash');
    const type = urlParams.get('type');
    
    if (code || tokenHash) {
      // Redirect to auth callback with all relevant params
      setIsRedirecting(true);
      const params = new URLSearchParams();
      if (code) params.set('code', code);
      if (tokenHash) params.set('token_hash', tokenHash);
      if (type) params.set('type', type);
      window.location.href = `/auth/callback?${params.toString()}`;
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