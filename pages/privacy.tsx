import Head from 'next/head'
import Link from 'next/link'

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy - SquareFt</title>
        <meta name="description" content="SquareFt Privacy Policy" />
      </Head>

      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        padding: '40px 20px'
      }}>
        <div style={{
          maxWidth: '900px',
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
            marginBottom: '8px'
          }}>
            Privacy Policy
          </h1>
          
          <p style={{ color: '#64748b', marginBottom: '40px' }}>
            Last updated: February 15, 2026
          </p>

          <div style={{ color: '#475569', lineHeight: '1.8' }}>
            <section style={{ marginBottom: '32px' }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '16px'
              }}>
                1. Introduction
              </h2>
              <p>
                SquareFt ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you use our property 
                maintenance management platform, including our website and Chrome extension.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '16px'
              }}>
                2. Information We Collect
              </h2>
              
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1e293b',
                marginTop: '16px',
                marginBottom: '12px'
              }}>
                Account Information
              </h3>
              <p style={{ marginBottom: '12px' }}>
                When you create an account, we collect:
              </p>
              <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                <li>Email address</li>
                <li>Full name</li>
                <li>Phone number (optional)</li>
                <li>Organization name</li>
                <li>Password (encrypted)</li>
              </ul>

              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '12px'
              }}>
                Ticket and Maintenance Data
              </h3>
              <p style={{ marginBottom: '12px' }}>
                We collect and store:
              </p>
              <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                <li>Maintenance request details</li>
                <li>Ticket messages and attachments</li>
                <li>Property and unit information</li>
                <li>Sender contact information (names, emails, phone numbers)</li>
                <li>Timestamps and status updates</li>
              </ul>

              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '12px'
              }}>
                Chrome Extension Data
              </h3>
              <p style={{ marginBottom: '12px' }}>
                Our Chrome extension:
              </p>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Stores authentication tokens locally in browser storage</li>
                <li>Caches user preferences (filters, sort settings) locally</li>
                <li>Does NOT collect browsing history</li>
                <li>Does NOT access data from other websites</li>
                <li>Only communicates with squareft.ai domains</li>
              </ul>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '16px'
              }}>
                3. How We Use Your Information
              </h2>
              <p style={{ marginBottom: '12px' }}>
                We use your information to:
              </p>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Provide and maintain the SquareFt service</li>
                <li>Display and manage your maintenance tickets</li>
                <li>Authenticate your access to the platform</li>
                <li>Send you service-related notifications</li>
                <li>Improve our services and user experience</li>
                <li>Provide customer support</li>
                <li>Ensure security and prevent fraud</li>
              </ul>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '16px'
              }}>
                4. Data Sharing and Disclosure
              </h2>
              <p style={{ marginBottom: '12px' }}>
                <strong>We do NOT sell your personal information.</strong>
              </p>
              <p style={{ marginBottom: '12px' }}>
                We may share your information only in these circumstances:
              </p>
              <ul style={{ paddingLeft: '20px' }}>
                <li><strong>Within your organization:</strong> Team members in your organization can access shared tickets</li>
                <li><strong>Service providers:</strong> Third-party services that help us operate (hosting, email delivery, analytics)</li>
                <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business transfers:</strong> In connection with a merger, sale, or acquisition</li>
              </ul>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '16px'
              }}>
                5. Data Security
              </h2>
              <p style={{ marginBottom: '12px' }}>
                We implement industry-standard security measures:
              </p>
              <ul style={{ paddingLeft: '20px' }}>
                <li>All data transmitted via HTTPS encryption</li>
                <li>Passwords are hashed and never stored in plain text</li>
                <li>Secure authentication tokens with expiration</li>
                <li>Regular security audits and updates</li>
                <li>Restricted access to user data</li>
              </ul>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '16px'
              }}>
                6. Data Retention
              </h2>
              <p>
                We retain your information for as long as your account is active or as needed to provide services. 
                You may request deletion of your account and associated data at any time by contacting support@squareft.ai.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '16px'
              }}>
                7. Your Rights
              </h2>
              <p style={{ marginBottom: '12px' }}>
                You have the right to:
              </p>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Export your data</li>
                <li>Opt-out of marketing communications</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p style={{ marginTop: '12px' }}>
                To exercise these rights, contact us at support@squareft.ai
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '16px'
              }}>
                8. Cookies and Tracking
              </h2>
              <p style={{ marginBottom: '12px' }}>
                We use cookies and similar technologies to:
              </p>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Maintain your login session</li>
                <li>Remember your preferences</li>
                <li>Analyze usage patterns to improve our service</li>
              </ul>
              <p style={{ marginTop: '12px' }}>
                You can control cookies through your browser settings. Disabling cookies may limit functionality.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '16px'
              }}>
                9. Chrome Extension Permissions
              </h2>
              <p style={{ marginBottom: '12px' }}>
                Our Chrome extension requests these permissions:
              </p>
              <ul style={{ paddingLeft: '20px' }}>
                <li><strong>storage:</strong> Store authentication tokens and preferences locally</li>
                <li><strong>alarms:</strong> Refresh ticket data periodically</li>
                <li><strong>cookies:</strong> Maintain login session</li>
                <li><strong>activeTab:</strong> Detect when you're on squareft.ai</li>
                <li><strong>sidePanel:</strong> Display extension interface</li>
                <li><strong>Host permissions (squareft.ai):</strong> Communicate with our API</li>
              </ul>
              <p style={{ marginTop: '12px' }}>
                The extension does NOT access your browsing history or data from other websites.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '16px'
              }}>
                10. Third-Party Services
              </h2>
              <p style={{ marginBottom: '12px' }}>
                We use these third-party services:
              </p>
              <ul style={{ paddingLeft: '20px' }}>
                <li><strong>Supabase:</strong> Database and authentication</li>
                <li><strong>Vercel:</strong> Web hosting</li>
                <li><strong>SendGrid:</strong> Email delivery</li>
                <li><strong>Twilio:</strong> SMS messaging</li>
              </ul>
              <p style={{ marginTop: '12px' }}>
                These services have their own privacy policies and security practices.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '16px'
              }}>
                11. Children's Privacy
              </h2>
              <p>
                SquareFt is not intended for children under 13. We do not knowingly collect information from children.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '16px'
              }}>
                12. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by 
                posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '16px'
              }}>
                13. Contact Us
              </h2>
              <p style={{ marginBottom: '12px' }}>
                If you have questions about this Privacy Policy, contact us at:
              </p>
              <div style={{
                background: '#f8fafc',
                padding: '20px',
                borderRadius: '12px'
              }}>
                <strong>Email:</strong>{' '}
                <a href="mailto:support@squareft.ai" style={{
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontWeight: '600'
                }}>
                  support@squareft.ai
                </a>
              </div>
            </section>
          </div>

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
