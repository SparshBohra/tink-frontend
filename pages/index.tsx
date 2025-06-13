import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Tink Property Management</title>
      </Head>
      <div className="landing-page">
        <div className="hero-section">
          <div className="logo">T</div>
          <h1 className="text-h1">Tink Property Management</h1>
          <p className="text-h3 text-secondary">Manage co-living properties with ease.</p>
          <div className="cta-buttons">
            <Link href="/login" className="btn btn-primary btn-lg">Login</Link>
            <Link href="/landlord-signup" className="btn btn-secondary btn-lg">Sign Up</Link>
          </div>
        </div>
      </div>
    </>
  );
} 