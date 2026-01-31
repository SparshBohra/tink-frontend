import AddressInput from '../components/listing-generator/AddressInput';

export default function Home() {
  const handleAddressSubmit = (address: string) => {
    console.log('Submitted address from Home:', address);
  };

  const handleAuth = (mode: 'login' | 'signup') => {
    console.log('Auth action from Home:', mode);
  }

  return <AddressInput onSubmit={handleAddressSubmit} onAuthClick={handleAuth} />;
}