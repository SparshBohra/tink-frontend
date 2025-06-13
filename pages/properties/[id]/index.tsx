import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PropertyRedirect() {
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      router.replace(`/properties/${id}/rooms`);
    }
  }, [id, router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <p>Redirecting to property details...</p>
    </div>
  );
} 