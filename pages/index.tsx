import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AddressInput from '../components/listing-generator/AddressInput';

export default function Home() {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleAddressSubmit = (address: string) => {
    // This is handled by AddressInput component itself
    console.log('Address submitted:', address);
  };

  const handleAuthClick = (mode: 'login' | 'signup') => {
    setShowAuthModal(true);
    // Redirect to appropriate auth page
    if (mode === 'login') {
      router.push('/app/login');
    } else {
      router.push('/app/landlord-signup');
    }
  };

  return (
    <>
      <Head>
        <title>SquareFt - Your AI Property Assistant</title>
        <meta name="description" content="AI meets real estate. Manage your properties effortlessly with SquareFt's intelligent platform." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <AddressInput 
        onSubmit={handleAddressSubmit}
        onAuthClick={handleAuthClick}
      />
    </>
  );
}
