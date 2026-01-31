import { useEffect } from 'react';
import Head from 'next/head';

// Redirect to the new auth signup page
export default function SignupRedirect() {
  useEffect(() => {
    window.location.href = '/auth/signup';
  }, []);

  return (
    <>
      <Head>
        <title>Redirecting... - SquareFt</title>
      </Head>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafbfc'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px'
        }}>
          <div style={{
            width: 32,
            height: 32,
            border: '3px solid #e5e7eb',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#64748b', fontSize: 14 }}>Redirecting to signup...</p>
        </div>
      </div>
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
