import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/login');
  }, [router]);

  return (
    <div>
      <h1>Tink Property Management</h1>
      <p>Redirecting to login...</p>
    </div>
  );
} 