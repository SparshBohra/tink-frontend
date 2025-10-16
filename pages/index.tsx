import AddressInput from '../components/listing-generator/AddressInput';

export default function Home() {
  const handleAddressSubmit = (address: string) => {
    // This logic is now handled inside AddressInput, 
    // but we can add more here if needed in the future.
    console.log('Submitted address from Home:', address);
  };

  const handleAuth = (mode: 'login' | 'signup') => {
    // This is also handled inside AddressInput
    console.log('Auth action from Home:', mode);
  }

  return <AddressInput onSubmit={handleAddressSubmit} onAuthClick={handleAuth} />;
}