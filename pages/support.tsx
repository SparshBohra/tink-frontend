import Head from 'next/head'
import Link from 'next/link'

export default function Support() {
  return (
    <>
      <Head>
        <title>Support - SquareFt</title>
        <meta name="description" content="Get help with SquareFt property maintenance management" />
      </Head>

      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        padding: '40px 20px'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          background: 'white',
          borderRadius: '16px',
          padding: '48px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)'
        }}>
          {/* Logo */}
          <div style={{ marginBottom: '32px' }}>
            <Link href="/">
              <img src="/logo1.png" alt="SquareFt" style={{ height: '50px', cursor: 'pointer' }} />
            </Link>
          </div>

          <h1 style={{
            fontSize: '36px',
            fontWeight: '800',
            color: '#0f172a',
            marginBottom: '16px'
          }}>
            Support
          </h1>

          <p style={{
            fontSize: '16px',
            color: '#64748b',
            marginBottom: '40px'
          }}>
            Get help with SquareFt and the Chrome extension
          </p>

          {/* Contact Section */}
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '16px'
            }}>
              Contact Us
            </h2>
            <p style={{ color: '#475569', marginBottom: '12px' }}>
              For technical support, feature requests, or general inquiries:
            </p>
            <div style={{
              background: '#f8fafc',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '20px'
            }}>
              <strong style={{ color: '#0f172a' }}>Email:</strong>{' '}
              <a href="mailto:support@squareft.ai" style={{
                color: '#3b82f6',
                textDecoration: 'none',
                fontWeight: '600'
              }}>
                support@squareft.ai
              </a>
            </div>
          </section>

          {/* Chrome Extension Help */}
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '16px'
            }}>
              Chrome Extension Help
            </h2>
            
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '8px'
              }}>
                Installation
              </h3>
              <ol style={{ color: '#475569', lineHeight: '1.8', paddingLeft: '20px' }}>
                <li>Install the extension from Chrome Web Store</li>
                <li>Click the SquareFt icon in your browser toolbar</li>
                <li>Sign in with your SquareFt account credentials</li>
                <li>Your tickets will appear automatically</li>
              </ol>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '8px'
              }}>
                Common Issues
              </h3>
              <ul style={{ color: '#475569', lineHeight: '1.8', paddingLeft: '20px' }}>
                <li><strong>Can't see tickets:</strong> Make sure you're signed in to your SquareFt account</li>
                <li><strong>Login issues:</strong> Check that you're using the same credentials as squareft.ai</li>
                <li><strong>Tickets not updating:</strong> Click the refresh icon or close and reopen the extension</li>
                <li><strong>Copy not working:</strong> Make sure you click the copy icon next to the field</li>
              </ul>
            </div>
          </section>

          {/* Dashboard Help */}
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '16px'
            }}>
              Dashboard Help
            </h2>
            <p style={{ color: '#475569', marginBottom: '12px' }}>
              Access the full dashboard at{' '}
              <a href="https://squareft.ai" style={{
                color: '#3b82f6',
                textDecoration: 'none',
                fontWeight: '600'
              }}>
                squareft.ai
              </a>
            </p>
            <p style={{ color: '#475569' }}>
              The web dashboard offers additional features including ticket creation, 
              team management, property management, and detailed analytics.
            </p>
          </section>

          {/* Account Issues */}
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '16px'
            }}>
              Account Issues
            </h2>
            <p style={{ color: '#475569', marginBottom: '12px' }}>
              If you're having trouble with your account:
            </p>
            <ul style={{ color: '#475569', lineHeight: '1.8', paddingLeft: '20px' }}>
              <li>Reset your password at squareft.ai</li>
              <li>Check your email for verification links</li>
              <li>Contact support@squareft.ai for account recovery</li>
            </ul>
          </section>

          {/* Privacy */}
          <section>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '16px'
            }}>
              Privacy & Security
            </h2>
            <p style={{ color: '#475569', marginBottom: '12px' }}>
              Read our{' '}
              <Link href="/privacy" style={{
                color: '#3b82f6',
                textDecoration: 'none',
                fontWeight: '600'
              }}>
                Privacy Policy
              </Link>
              {' '}to learn how we protect your data.
            </p>
          </section>

          {/* Back to Home */}
          <div style={{ 
            marginTop: '48px',
            paddingTop: '24px',
            borderTop: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <Link href="/" style={{
              color: '#3b82f6',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '14px'
            }}>
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
