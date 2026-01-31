import type { AppProps } from 'next/app';
// V1 Archive: Original auth providers moved to v1_archive/lib/
// import { AuthProvider } from '../lib/auth-context';
// import { ThemeProvider } from '../lib/theme-context';

// SquareFt Phase 1: Supabase Auth
import { SupabaseAuthProvider } from '../lib/supabase-auth-context';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SupabaseAuthProvider>
      <Component {...pageProps} />
    </SupabaseAuthProvider>
  );
} 