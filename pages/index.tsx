import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AddressInput from '../components/listing-generator/AddressInput';

export default function Home() {
  const router = useRouter();
  const [isCheckingDevice, setIsCheckingDevice] = useState(true);

  useEffect(() => {
    // Check if user is on a mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      
      // Common mobile device patterns
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
      
      // Also check screen width as a fallback (768px is common mobile breakpoint)
      const isSmallScreen = window.innerWidth <= 768;
      
      // Check if touch is primary input
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Consider mobile if: matches user agent OR (small screen AND touch device)
      const isMobile = mobileRegex.test(userAgent) || (isSmallScreen && isTouchDevice);
      
      if (isMobile) {
        router.replace('/mobile');
      } else {
        setIsCheckingDevice(false);
      }
    };

    checkMobile();
  }, [router]);

  const handleAddressSubmit = (address: string) => {
    // This logic is now handled inside AddressInput, 
    // but we can add more here if needed in the future.
    console.log('Submitted address from Home:', address);
  };

  const handleAuth = (mode: 'login' | 'signup') => {
    // This is also handled inside AddressInput
    console.log('Auth action from Home:', mode);
  }

  // Show nothing while checking device to prevent flash
  if (isCheckingDevice) {
    return null;
  }

  return <AddressInput onSubmit={handleAddressSubmit} onAuthClick={handleAuth} />;
}