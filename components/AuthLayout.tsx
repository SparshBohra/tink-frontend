import Head from 'next/head';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AuthLayout({ children, title }: AuthLayoutProps) {
  return (
    <>
      <Head>
        <title>{title} - SquareFt</title>
      </Head>
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <div className="logo">
              <span>T</span>
            </div>
            <h1 className="text-h1 mb-sm">SquareFt</h1>
          </div>
          {children}
        </div>
      </div>
    </>
  );
} 