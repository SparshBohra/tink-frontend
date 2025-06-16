import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import TestimonialsCarousel from '../components/TestimonialsCarousel';

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
      <>
        <div className="loading-screen">
          <div className="loading-container">
            <div className="loading-content">
              <div className="loading-logo">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <rect width="48" height="48" rx="12" fill="#2563eb"/>
                  <path d="M12 18h24v3H12v-3zm0 6h24v3H12v-3zm0 6h15v3H12v-3z" fill="white"/>
                  <circle cx="30" cy="30" r="4.5" fill="#dbeafe"/>
                </svg>
              </div>
              <div className="loading-spinner">
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
              </div>
              <div className="loading-text">
                <h2>Welcome back!</h2>
                <p>Redirecting you to your dashboard...</p>
              </div>
              <div className="loading-progress">
                <div className="progress-bar">
                  <div className="progress-fill"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style jsx global>{`
          html, body {
            margin: 0;
            padding: 0;
            height: 100%;
          }
        `}</style>
        <style jsx>{`
          :root {
            --primary-blue: #2563eb;
            --primary-blue-dark: #1d4ed8;
            --primary-blue-light: #dbeafe;
            --success-green: #10b981;
            --info-purple: #8b5cf6;
            --warning-amber: #f59e0b;
            --gray-50: #f9fafb;
            --gray-100: #f3f4f6;
            --gray-200: #e5e7eb;
            --gray-300: #d1d5db;
            --gray-400: #9ca3af;
            --gray-500: #6b7280;
            --gray-600: #4b5563;
            --gray-700: #374151;
            --gray-800: #1f2937;
            --gray-900: #111827;
            --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }

          .loading-screen {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            height: 100vh;
            width: 100vw;
            display: flex;
            align-items: center;
            justify-content: center;
            background: 
              radial-gradient(circle at 20% 80%, rgba(37, 99, 235, 0.08) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
              linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f0f9ff 100%);
            overflow: hidden;
            z-index: 9999;
          }

          .loading-screen::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232563eb' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
            opacity: 0.7;
          }

          .loading-container {
            position: relative;
            z-index: 2;
          }

          .loading-content {
            background: white;
            border-radius: 20px;
            padding: 3rem;
            text-align: center;
            box-shadow: 0 20px 40px -12px rgba(37, 99, 235, 0.15);
            border: 1px solid rgba(37, 99, 235, 0.1);
            position: relative;
            overflow: hidden;
            min-width: 400px;
          }

          .loading-content::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--primary-blue) 0%, var(--info-purple) 100%);
          }

          .loading-logo {
            margin-bottom: 2rem;
            display: flex;
            justify-content: center;
          }

          .loading-spinner {
            position: relative;
            width: 80px;
            height: 80px;
            margin: 0 auto 2rem;
          }

          .spinner-ring {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: 3px solid transparent;
            border-radius: 50%;
          }

          .spinner-ring:nth-child(1) {
            border-top-color: var(--primary-blue);
            animation: spin 1.5s linear infinite;
          }

          .spinner-ring:nth-child(2) {
            border-right-color: var(--info-purple);
            animation: spin 1.5s linear infinite reverse;
            animation-delay: -0.3s;
          }

          .spinner-ring:nth-child(3) {
            border-bottom-color: var(--success-green);
            animation: spin 1.5s linear infinite;
            animation-delay: -0.6s;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .loading-text h2 {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--gray-900);
            margin-bottom: 0.5rem;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          }

          .loading-text p {
            font-size: 1rem;
            color: var(--gray-600);
            margin-bottom: 2rem;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          }

          .loading-progress {
            width: 100%;
          }

          .progress-bar {
            width: 100%;
            height: 6px;
            background: var(--gray-200);
            border-radius: 3px;
            overflow: hidden;
          }

          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--primary-blue) 0%, var(--info-purple) 100%);
            border-radius: 3px;
            animation: progressFill 2s ease-in-out infinite;
          }

          @keyframes progressFill {
            0% { width: 0%; transform: translateX(-100%); }
            50% { width: 100%; transform: translateX(0%); }
            100% { width: 100%; transform: translateX(100%); }
          }

          /* Responsive Design */
          @media (max-width: 768px) {
            .loading-content {
              padding: 2rem;
              min-width: 320px;
              margin: 0 1rem;
            }

            .loading-text h2 {
              font-size: 1.25rem;
            }

            .loading-spinner {
              width: 60px;
              height: 60px;
            }
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Tink - Professional Co-Living Property Management Platform</title>
        <meta name="description" content="Transform your co-living business with Tink's comprehensive property management platform. Room-level management, automated communications, and seamless operations." />
        <meta name="keywords" content="property management, co-living, coliving, rental management, tenant management, WhatsApp integration" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      
      <div className="landing-page">
        {/* Navigation */}
        <nav className="navbar">
          <div className="nav-container">
            <div className="nav-brand">
              <div className="logo">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect width="32" height="32" rx="8" fill="#2563eb"/>
                  <path d="M8 12h16v2H8v-2zm0 4h16v2H8v-2zm0 4h10v2H8v-2z" fill="white"/>
                  <circle cx="20" cy="20" r="3" fill="#dbeafe"/>
                </svg>
              </div>
              <span className="brand-name">Tink</span>
            </div>
            <div className="nav-actions">
              <Link href="/login" className="nav-link">Sign In</Link>
              <Link href="/landlord-signup" className="btn btn-primary">Get Started Free</Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="hero">
          <div className="container">
            <div className="hero-content">
              <div className="hero-badge">
                <span className="badge-text">Trusted by 500+ Property Owners Worldwide</span>
              </div>
              <h1 className="hero-title">
                The Modern Way to Manage<br />
                <span className="text-gradient">Co-Living Properties</span>
              </h1>
              <p className="hero-subtitle">
                Transform your co-living business with our comprehensive platform designed specifically for shared housing. Streamline operations, maximize occupancy, and deliver exceptional tenant experiences.
              </p>
              <div className="hero-actions">
                <Link href="/landlord-signup" className="btn btn-primary btn-lg">
                  <span>Start Free Trial</span>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4.293 15.707a1 1 0 010-1.414L10.586 8 4.293 1.707a1 1 0 111.414-1.414l7 7a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0z" fill="currentColor"/>
                  </svg>
                </Link>
                <button className="btn btn-watch-demo btn-lg">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" fill="currentColor"/>
                  </svg>
                  <span>Watch Demo</span>
                </button>
              </div>
              <div className="hero-stats">
                <div className="stat">
                  <span className="stat-number">98%</span>
                  <span className="stat-label">Customer Satisfaction</span>
                </div>
                <div className="stat">
                  <span className="stat-number">45%</span>
                  <span className="stat-label">Faster Tenant Placement</span>
                </div>
                <div className="stat">
                  <span className="stat-number">24/7</span>
                  <span className="stat-label">Automated Support</span>
                </div>
              </div>
            </div>
            <div className="hero-visual">
              <div className="dashboard-preview">
                <div className="preview-header">
                  <div className="preview-dots">
                    <div className="dot red"></div>
                    <div className="dot yellow"></div>
                    <div className="dot green"></div>
                  </div>
                  <div className="preview-title">Tink Dashboard</div>
                </div>
                <div className="preview-content">
                  <div className="metric-cards-preview">
                    <div className="mini-card blue">
                      <div className="mini-card-value">$12,450</div>
                      <div className="mini-card-label">Monthly Revenue</div>
                    </div>
                    <div className="mini-card green">
                      <div className="mini-card-value">94%</div>
                      <div className="mini-card-label">Occupancy Rate</div>
                    </div>
                    <div className="mini-card purple">
                      <div className="mini-card-value">23</div>
                      <div className="mini-card-label">Active Applications</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition */}
        <section className="value-proposition">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Why Property Owners Choose Tink</h2>
              <p className="section-subtitle">
                From individual rooms to entire co-living operations, we've built the tools you need to scale efficiently.
              </p>
              </div>
            <div className="value-grid">
              <div className="value-card">
                <div className="value-icon">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <rect width="48" height="48" rx="12" fill="#dbeafe"/>
                    <path d="M24 16a8 8 0 100 16 8 8 0 000-16zm-6 8a6 6 0 1112 0 6 6 0 01-12 0z" fill="#2563eb"/>
                    <path d="M24 20a4 4 0 100 8 4 4 0 000-8zm-2 4a2 2 0 114 0 2 2 0 01-4 0z" fill="#2563eb"/>
                  </svg>
                </div>
                <h3>Room-Level Precision</h3>
                <p>Manage each room individually with separate leases, rent tracking, and tenant histories. Perfect for shared housing dynamics.</p>
                <div className="value-stats">
                  <span className="stat-highlight">50% faster room turnovers</span>
                </div>
              </div>
              <div className="value-card">
                <div className="value-icon">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <rect width="48" height="48" rx="12" fill="#dcfce7"/>
                    <path d="M20 12a8 8 0 108 8 8 8 0 00-8-8zm0 14a6 6 0 110-12 6 6 0 010 12z" fill="#10b981"/>
                    <path d="M28 22a8 8 0 108 8 8 8 0 00-8-8zm0 14a6 6 0 110-12 6 6 0 010 12z" fill="#10b981"/>
                  </svg>
                </div>
                <h3>Automated Operations</h3>
                <p>WhatsApp integration, smart reminders, and automated workflows reduce manual tasks by up to 70%.</p>
                <div className="value-stats">
                  <span className="stat-highlight">10+ hours saved weekly</span>
                </div>
              </div>
              <div className="value-card">
                <div className="value-icon">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <rect width="48" height="48" rx="12" fill="#fef3c7"/>
                    <path d="M24 8l6.18 12.54L44 22l-10 9.74L36.36 44 24 37.18 11.64 44 14 31.74 4 22l13.82-1.46L24 8z" fill="#f59e0b"/>
                  </svg>
                </div>
                <h3>Superior Experience</h3>
                <p>Tenants enjoy clear communication, easy maintenance requests, and transparent house rules through familiar channels.</p>
                <div className="value-stats">
                  <span className="stat-highlight">95% tenant satisfaction</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="features">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Everything You Need to Scale Your Co-Living Business</h2>
              <p className="section-subtitle">
                Built specifically for co-living operations with features that traditional property management software can't provide.
              </p>
            </div>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-header">
                  <div className="feature-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="#2563eb" strokeWidth="2" fill="none"/>
                      <polyline points="9,22 9,12 15,12 15,22" stroke="#2563eb" strokeWidth="2" fill="none"/>
                    </svg>
                  </div>
                  <h3>Room-Level Management</h3>
                </div>
                <p>Individual lease tracking, separate rent collection, and detailed room histories. Manage shared houses like the complex operations they are.</p>
                <ul className="feature-benefits">
                  <li>Individual room leases</li>
                  <li>Separate rent tracking per room</li>
                  <li>Room-specific maintenance logs</li>
                </ul>
              </div>
              <div className="feature-card">
                <div className="feature-header">
                  <div className="feature-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="#10b981" strokeWidth="2" fill="none"/>
                      <path d="M13 11l-4-4" stroke="#10b981" strokeWidth="2"/>
                      <path d="M13 7l-4 4" stroke="#10b981" strokeWidth="2"/>
                    </svg>
                  </div>
                  <h3>WhatsApp Automation</h3>
                </div>
                <p>Tenants communicate through WhatsApp while you maintain professional boundaries. Automated responses, rent reminders, and maintenance workflows.</p>
                <ul className="feature-benefits">
                  <li>No app downloads required</li>
                  <li>Automated rent reminders</li>
                  <li>24/7 virtual assistant</li>
                </ul>
              </div>
              <div className="feature-card">
                <div className="feature-header">
                  <div className="feature-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="#f59e0b" strokeWidth="2" fill="none"/>
                    </svg>
                  </div>
                  <h3>Tenant Experience</h3>
                </div>
                <p>Happy tenants stay longer. Clear house rules, easy maintenance requests, and transparent communication keep satisfaction high.</p>
                <ul className="feature-benefits">
                  <li>Digital house agreements</li>
                  <li>One-click maintenance requests</li>
                  <li>Transparent fee structure</li>
                </ul>
              </div>
              <div className="feature-card">
                <div className="feature-header">
                  <div className="feature-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="#8b5cf6" strokeWidth="2" fill="none"/>
                      <rect x="7" y="8" width="10" height="8" rx="1" ry="1" stroke="#8b5cf6" strokeWidth="2" fill="none"/>
                    </svg>
                  </div>
                  <h3>Financial Dashboard</h3>
                </div>
                <p>Real-time revenue tracking, occupancy analytics, and automated rent collection. See exactly how your properties are performing.</p>
                <ul className="feature-benefits">
                  <li>Real-time financial tracking</li>
                  <li>Occupancy rate analytics</li>
                  <li>Automated rent collection</li>
                </ul>
              </div>
              <div className="feature-card">
                <div className="feature-header">
                  <div className="feature-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#2563eb" strokeWidth="2" fill="none"/>
                      <circle cx="9" cy="7" r="4" stroke="#2563eb" strokeWidth="2" fill="none"/>
                      <path d="M23 21v-2a4 4 0 00-3-3.87" stroke="#2563eb" strokeWidth="2" fill="none"/>
                      <path d="M16 3.13a4 4 0 010 7.75" stroke="#2563eb" strokeWidth="2" fill="none"/>
                    </svg>
                  </div>
                  <h3>Team Management</h3>
                </div>
                <p>Multiple access levels for property managers, cleaning staff, and maintenance teams. Everyone knows their role and responsibilities.</p>
                <ul className="feature-benefits">
                  <li>Role-based access control</li>
                  <li>Task assignment system</li>
                  <li>Team communication tools</li>
                </ul>
              </div>
              <div className="feature-card">
                <div className="feature-header">
                  <div className="feature-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#10b981" strokeWidth="2" fill="none"/>
                      <path d="M9 12l2 2 4-4" stroke="#10b981" strokeWidth="2" fill="none"/>
                    </svg>
              </div>
                  <h3>Compliance & Security</h3>
                </div>
                <p>Digital lease agreements, automated background check workflows, and secure document storage ensure you're always compliant.</p>
                <ul className="feature-benefits">
                  <li>Secure document storage</li>
                  <li>Digital lease agreements</li>
                  <li>Automated compliance checks</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="pricing">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Simple, Scalable Pricing</h2>
              <p className="section-subtitle">
                Transparent pricing that grows with your business. No hidden fees, no long-term contracts.
              </p>
            </div>
            <div className="pricing-cards">
              <div className="pricing-card starter">
                <div className="pricing-header">
                  <h3 className="plan-name">Starter</h3>
                  <p className="plan-description">Perfect for smaller co-living operations</p>
                </div>
                <div className="pricing-price">
                  <span className="price-amount">$29</span>
                  <span className="price-period">/month</span>
                </div>
                <div className="pricing-features">
                  <div className="feature-category">
                    <h4>Up to 25 rooms</h4>
                    <ul>
                      <li>Room-level lease management</li>
                      <li>WhatsApp automation</li>
                      <li>Rent collection & tracking</li>
                      <li>Maintenance request system</li>
                      <li>Tenant communication portal</li>
                      <li>Basic reporting & analytics</li>
              </ul>
                  </div>
                </div>
                <Link href="/landlord-signup" className="btn btn-primary btn-full">Start Free Trial</Link>
                <p className="pricing-note">14-day free trial • No setup fees</p>
              </div>
              
              <div className="pricing-card professional featured">
                <div className="featured-badge">Most Popular</div>
                <div className="pricing-header">
                  <h3 className="plan-name">Professional</h3>
                  <p className="plan-description">For growing co-living businesses</p>
                </div>
                <div className="pricing-price">
                  <span className="price-amount">$79</span>
                  <span className="price-period">/month</span>
                </div>
                <div className="pricing-features">
                  <div className="feature-category">
                    <h4>Up to 100 rooms</h4>
                    <ul>
                      <li><strong>Everything in Starter, plus:</strong></li>
                      <li>Advanced analytics & insights</li>
                      <li>Multi-property management</li>
                      <li>Team collaboration tools</li>
                      <li>Custom lease templates</li>
                      <li>Priority support</li>
                      <li>API access for integrations</li>
                    </ul>
                  </div>
                </div>
                <Link href="/landlord-signup" className="btn btn-primary btn-full">Start Free Trial</Link>
                <p className="pricing-note">14-day free trial • Dedicated onboarding</p>
              </div>
              
              <div className="pricing-card enterprise">
                <div className="pricing-header">
                  <h3 className="plan-name">Enterprise</h3>
                  <p className="plan-description">For large-scale operations</p>
                </div>
                <div className="pricing-price">
                  <span className="price-amount">Custom</span>
                  <span className="price-period">pricing</span>
                </div>
                <div className="pricing-features">
                  <div className="feature-category">
                    <h4>Unlimited rooms</h4>
                    <ul>
                      <li><strong>Everything in Professional, plus:</strong></li>
                      <li>White-label solution</li>
                      <li>Custom integrations</li>
                      <li>Dedicated success manager</li>
                      <li>Advanced compliance tools</li>
                      <li>Custom reporting</li>
                      <li>SLA guarantees</li>
                    </ul>
                  </div>
                </div>
                <Link href="/contact" className="btn btn-outline btn-full">Contact Sales</Link>
                <p className="pricing-note">Custom onboarding • Enterprise support</p>
              </div>
            </div>
            <div className="pricing-guarantee">
              <div className="guarantee-content">
                <div className="guarantee-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12l2 2 4-4" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h4>30-Day Money-Back Guarantee</h4>
                  <p>Not satisfied? Get a full refund within 30 days, no questions asked.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="testimonials">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Trusted by Property Owners Worldwide</h2>
              <p className="section-subtitle">
                See how co-living operators are transforming their businesses with Tink
              </p>
            </div>
            
            <TestimonialsCarousel />
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="container">
            <div className="cta-content">
              <h2>Ready to Scale Your Co-Living Business?</h2>
              <p>Join 500+ property owners who trust Tink to manage their co-living operations efficiently and profitably.</p>
            <div className="cta-actions">
                <Link href="/landlord-signup" className="btn btn-primary btn-lg">
                  <span>Start Free Trial</span>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4.293 15.707a1 1 0 010-1.414L10.586 8 4.293 1.707a1 1 0 111.414-1.414l7 7a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0z" fill="currentColor"/>
                  </svg>
                </Link>
                <Link href="/contact" className="btn btn-secondary btn-lg">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" fill="currentColor"/>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" fill="currentColor"/>
                  </svg>
                  <span>Talk to Sales</span>
                </Link>
              </div>
              <div className="cta-guarantee">
                <div className="guarantee-features">
                  <div className="guarantee-item">
                    <span className="guarantee-check">✅</span>
                    <span>14-day free trial</span>
                  </div>
                  <div className="guarantee-item">
                    <span className="guarantee-check">✅</span>
                    <span>No setup fees</span>
                  </div>
                  <div className="guarantee-item">
                    <span className="guarantee-check">✅</span>
                    <span>Cancel anytime</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="container">
            <div className="footer-content">
              <div className="footer-main">
              <div className="footer-brand">
                  <div className="logo">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <rect width="32" height="32" rx="8" fill="#2563eb"/>
                      <path d="M8 12h16v2H8v-2zm0 4h16v2H8v-2zm0 4h10v2H8v-2z" fill="white"/>
                      <circle cx="20" cy="20" r="3" fill="#dbeafe"/>
                    </svg>
              </div>
                  <div className="brand-info">
                    <span className="brand-name">Tink</span>
                    <p className="footer-tagline">Professional co-living property management</p>
                  </div>
                </div>
                <div className="footer-links">
                  <div className="footer-column">
                    <h4>Product</h4>
                    <ul>
                      <li><Link href="/features">Features</Link></li>
                      <li><Link href="/pricing">Pricing</Link></li>
                      <li><Link href="/integrations">Integrations</Link></li>
                    </ul>
                  </div>
                  <div className="footer-column">
                    <h4>Company</h4>
                    <ul>
                      <li><Link href="/about">About</Link></li>
                      <li><Link href="/contact">Contact</Link></li>
                      <li><Link href="/help">Support</Link></li>
                    </ul>
                  </div>
                  <div className="footer-column">
                    <h4>Legal</h4>
                    <ul>
                      <li><Link href="/privacy">Privacy</Link></li>
                      <li><Link href="/terms">Terms</Link></li>
                      <li><Link href="/security">Security</Link></li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="footer-bottom">
                <p>&copy; 2024 Tink Property Management. All rights reserved.</p>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <style jsx>{`
        .landing-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          line-height: 1.6;
          color: var(--gray-800);
        }

        /* Navigation */
        .navbar {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(37, 99, 235, 0.08);
          box-shadow: 0 4px 32px rgba(0, 0, 0, 0.06);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .navbar::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--primary-blue) 0%, var(--success-green) 35%, var(--info-purple) 65%, var(--primary-blue) 100%);
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 72px;
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 0.875rem;
        }

        .brand-name {
          font-size: 1.625rem;
          font-weight: 800;
          color: var(--gray-900);
          letter-spacing: -0.025em;
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .nav-link {
          color: var(--gray-600);
          font-weight: 500;
          padding: 0.625rem 1.125rem;
          border-radius: 8px;
          transition: all 0.2s ease;
          font-size: 0.975rem;
        }

        .nav-link:hover {
          color: var(--primary-blue);
          background: rgba(37, 99, 235, 0.08);
          transform: translateY(-1px);
        }

        .logo {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        /* Hero Section */
        .hero {
          background: 
            radial-gradient(circle at 0% 0%, rgba(37, 99, 235, 0.1) 0%, transparent 40%),
            radial-gradient(circle at 100% 100%, rgba(139, 92, 246, 0.1) 0%, transparent 40%),
            linear-gradient(135deg, rgba(219, 234, 254, 0.2) 0%, rgba(255, 255, 255, 1) 50%, rgba(240, 249, 255, 0.3) 100%);
          padding: 5rem 0;
          overflow: hidden;
          position: relative;
        }

        .hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232563eb' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
          opacity: 0.7;
        }

        .hero .container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
          position: relative;
          z-index: 2;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.5rem 1rem;
          background: var(--primary-blue-light);
          border: 1px solid var(--primary-blue);
          border-radius: 50px;
          margin-bottom: 1.5rem;
        }

        .badge-text {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--primary-blue-dark);
        }

        .hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          color: var(--gray-900);
          margin-bottom: 1.5rem;
          line-height: 1.1;
        }

        .text-gradient {
          background: linear-gradient(135deg, var(--primary-blue) 0%, var(--info-purple) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: var(--gray-600);
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .hero-actions {
          display: flex;
          gap: 1rem;
          margin-bottom: 3rem;
        }

        .hero-stats {
          display: flex;
          gap: 2rem;
        }

        .stat {
          text-align: center;
        }

        .stat-number {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--primary-blue);
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--gray-600);
        }

        /* Hero Visual */
        .hero-visual {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .dashboard-preview {
          background: white;
          border-radius: 12px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          width: 100%;
          max-width: 500px;
        }

        .preview-header {
          background: var(--gray-100);
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .preview-dots {
          display: flex;
          gap: 0.5rem;
        }

        .dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        .dot.red { background: #ef4444; }
        .dot.yellow { background: #f59e0b; }
        .dot.green { background: #10b981; }

        .preview-title {
          font-weight: 600;
          color: var(--gray-700);
        }

        .preview-content {
          padding: 2rem;
        }

        .metric-cards-preview {
          display: grid;
          gap: 1rem;
        }

        .mini-card {
          border-radius: 8px;
          padding: 1rem;
          color: white;
        }
        .mini-card.blue { background: linear-gradient(135deg, var(--primary-blue), var(--primary-blue-dark)); }
        .mini-card.green { background: linear-gradient(135deg, var(--success-green), #059669); }
        .mini-card.purple { background: linear-gradient(135deg, var(--info-purple), var(--info-purple-dark)); }

        .mini-card-value {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .mini-card-label {
          font-size: 0.875rem;
          opacity: 0.9;
        }

        /* Section Headers */
        .section-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .section-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--gray-900);
          margin-bottom: 1rem;
        }

        .section-subtitle {
          font-size: 1.125rem;
          color: var(--gray-600);
          max-width: 600px;
          margin: 0 auto;
        }

        /* Value Proposition */
        .value-proposition {
          padding: 5rem 0;
          background: 
            linear-gradient(to bottom, rgba(219, 234, 254, 0.2) 0%, rgba(255, 255, 255, 1) 10%, rgba(255, 255, 255, 1) 90%, rgba(219, 234, 254, 0.2) 100%);
          position: relative;
          border-top: 1px solid var(--gray-100);
        }

        .value-proposition::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232563eb' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
          opacity: 0.4;
        }

        .value-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
          position: relative;
          z-index: 2;
        }

        .value-card {
          background: white;
          border: 2px solid var(--gray-200);
          border-radius: 16px;
          padding: 2rem;
          text-align: center;
          transition: all 0.3s ease;
        }

        .value-card:hover {
          border-color: var(--primary-blue);
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .value-icon {
          margin-bottom: 1.5rem;
        }

        .value-card h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: var(--gray-900);
        }

        .value-card p {
          color: var(--gray-600);
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }

        .value-stats {
          padding: 0.75rem 1rem;
          background: var(--gray-50);
          border-radius: 8px;
          border: 1px solid var(--gray-200);
        }

        .stat-highlight {
          font-weight: 600;
          color: var(--primary-blue);
        }

        /* Features */
        .features {
          padding: 5rem 0;
          background: 
            linear-gradient(to right, rgba(219, 234, 254, 0.3) 0%, rgba(255, 255, 255, 1) 20%, rgba(255, 255, 255, 1) 80%, rgba(219, 234, 254, 0.3) 100%);
          position: relative;
          border-top: 1px solid var(--gray-100);
          border-bottom: 1px solid var(--gray-100);
        }

        .features::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232563eb' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
          opacity: 0.4;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
          position: relative;
          z-index: 2;
        }

        .feature-card {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          border: 1px solid var(--gray-200);
          transition: all 0.3s ease;
        }

        .feature-card:hover {
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .feature-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          background: var(--gray-50);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .feature-card h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--gray-900);
          margin: 0;
        }

        .feature-card p {
          color: var(--gray-600);
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }

        .feature-benefits {
          list-style: none;
          padding: 0;
        }

        .feature-benefits li {
          padding: 0.5rem 0;
          position: relative;
          padding-left: 1.5rem;
          color: var(--gray-600);
          font-size: 0.875rem;
        }

        .feature-benefits li:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: var(--success-green);
          font-weight: 600;
        }

        /* Pricing */
        .pricing {
          padding: 5rem 0;
          background: 
            radial-gradient(circle at 30% 20%, rgba(37, 99, 235, 0.08) 0%, transparent 40%),
            radial-gradient(circle at 70% 80%, rgba(16, 185, 129, 0.06) 0%, transparent 40%),
            #ffffff;
          position: relative;
        }

        .pricing::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232563eb' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
          opacity: 0.4;
        }

        .pricing-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .pricing-card {
          background: white;
          border: 2px solid var(--gray-200);
          border-radius: 16px;
          padding: 2rem;
          position: relative;
          transition: all 0.3s ease;
        }

        .pricing-card.featured {
          border-color: var(--primary-blue);
          transform: scale(1.05);
          box-shadow: 0 20px 25px -5px rgba(37, 99, 235, 0.1);
        }

        .featured-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--primary-blue);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .pricing-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .plan-name {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--gray-900);
          margin-bottom: 0.5rem;
        }

        .plan-description {
          color: var(--gray-600);
          margin: 0;
        }

        .pricing-price {
          text-align: center;
          margin-bottom: 2rem;
        }

        .price-amount {
          font-size: 3rem;
          font-weight: 800;
          color: var(--primary-blue);
        }

        .price-period {
          font-size: 1.125rem;
          color: var(--gray-600);
        }

        .pricing-features {
          margin-bottom: 2rem;
        }

        .feature-category h4 {
          font-weight: 600;
          color: var(--gray-900);
          margin-bottom: 1rem;
        }

        .feature-category ul {
          list-style: none;
          padding: 0;
        }

        .feature-category li {
          padding: 0.5rem 0;
          position: relative;
          padding-left: 1.5rem;
          color: var(--gray-600);
        }

        .feature-category li:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: var(--success-green);
          font-weight: 600;
        }

        .pricing-note {
          text-align: center;
          font-size: 0.875rem;
          color: var(--gray-500);
          margin-top: 1rem;
        }

        .pricing-guarantee {
          text-align: center;
          padding: 2rem;
          background: var(--gray-50);
          border-radius: 12px;
          border: 1px solid var(--gray-200);
        }

        .guarantee-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }

        .guarantee-icon {
          flex-shrink: 0;
        }

        .guarantee-content h4 {
          font-weight: 600;
          color: var(--gray-900);
          margin-bottom: 0.25rem;
        }

        .guarantee-content p {
          color: var(--gray-600);
          margin: 0;
        }

        /* CTA Section */
        .cta-section {
          padding: 6rem 0;
          background: 
            radial-gradient(circle at 50% 50%, rgba(219, 234, 254, 0.5) 0%, rgba(255, 255, 255, 0.9) 70%);
          color: var(--gray-900);
          position: relative;
          overflow: hidden;
          border-top: 1px solid var(--gray-200);
          border-bottom: 1px solid var(--gray-200);
        }

        .cta-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232563eb' fill-opacity='0.03'%3E%3Ccircle cx='40' cy='40' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
          opacity: 0.6;
        }

        .cta-content {
          text-align: center;
          position: relative;
          z-index: 2;
        }

        .cta-section h2 {
          font-size: 3rem;
          font-weight: 800;
          margin-bottom: 1.5rem;
          letter-spacing: -0.025em;
          color: var(--gray-900);
        }

        .cta-section p {
          font-size: 1.375rem;
          margin-bottom: 2.5rem;
          line-height: 1.6;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
          color: var(--gray-700);
        }

        .cta-actions {
          display: flex;
          gap: 1.5rem;
          justify-content: center;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
        }

        .cta-guarantee {
          margin-top: 2rem;
          display: flex;
          justify-content: center;
        }

        .guarantee-features {
          display: flex;
          gap: 3rem;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          padding: 1.5rem 0;
        }

        .guarantee-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1rem;
          font-weight: 500;
          color: var(--gray-700);
        }

        .guarantee-check {
          font-size: 1.125rem;
          color: var(--success-green);
        }

                 /* Testimonials */
        .testimonials {
          padding: 5rem 0;
          background: 
            linear-gradient(to bottom, rgba(219, 234, 254, 0.3) 0%, rgba(255, 255, 255, 1) 15%, rgba(255, 255, 255, 1) 85%, rgba(219, 234, 254, 0.3) 100%);
          position: relative;
          overflow: hidden;
          border-top: 1px solid var(--gray-100);
          border-bottom: 1px solid var(--gray-100);
        }

        .testimonials::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232563eb' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
          opacity: 0.4;
        }

         .testimonials-wrapper {
           position: relative;
           z-index: 2;
         }

         .testimonials-container {
           overflow: hidden;
           border-radius: 20px;
           margin-bottom: 2rem;
         }

         .testimonials-track {
           display: flex;
           transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
           animation: testimonialAutoScroll 20s infinite linear;
         }

         .testimonials-track:hover {
           animation-play-state: paused;
         }

         @keyframes testimonialAutoScroll {
           0% { transform: translateX(0); }
           25% { transform: translateX(-100%); }
           50% { transform: translateX(-200%); }
           75% { transform: translateX(-300%); }
           100% { transform: translateX(0); }
         }

         .testimonial-card {
           background: white;
           border-radius: 20px;
           padding: 3rem;
           min-width: 800px;
           width: 800px;
           margin-right: 2rem;
           box-shadow: 0 20px 40px -12px rgba(37, 99, 235, 0.15);
           border: 1px solid rgba(37, 99, 235, 0.1);
           position: relative;
           overflow: hidden;
           flex-shrink: 0;
         }

         .testimonial-card::before {
           content: '';
           position: absolute;
           top: 0;
           left: 0;
           right: 0;
           height: 4px;
           background: linear-gradient(90deg, var(--primary-blue) 0%, var(--info-purple) 100%);
         }

         .testimonial-header {
           display: flex;
           justify-content: space-between;
           align-items: center;
           margin-bottom: 2rem;
         }

         .testimonial-quote-icon {
           display: flex;
           align-items: center;
           justify-content: center;
         }

         .testimonial-rating {
           display: flex;
           align-items: center;
           gap: 0.5rem;
         }

         .stars {
           display: flex;
           gap: 0.25rem;
         }

         .star {
           color: #fbbf24;
           font-size: 1.25rem;
         }

         .rating-text {
           font-weight: 600;
           color: var(--gray-600);
           font-size: 0.875rem;
         }

         .testimonial-content {
           margin-bottom: 2.5rem;
         }

         .testimonial-text {
           font-size: 1.375rem;
           line-height: 1.7;
           color: var(--gray-800);
           font-weight: 400;
           margin: 0;
           font-style: normal;
           position: relative;
         }

         .testimonial-text strong {
           color: var(--primary-blue);
           font-weight: 600;
         }

         .highlight-stat {
           background: linear-gradient(135deg, var(--primary-blue) 0%, var(--info-purple) 100%);
           -webkit-background-clip: text;
           -webkit-text-fill-color: transparent;
           background-clip: text;
           font-weight: 700;
           font-size: 1.5rem;
         }

         .testimonial-author {
           display: flex;
           align-items: center;
           gap: 1rem;
           padding-top: 2rem;
           border-top: 1px solid var(--gray-200);
         }

         .author-avatar {
           flex-shrink: 0;
         }

         .avatar-placeholder {
           width: 60px;
           height: 60px;
           border-radius: 50%;
           background: var(--primary-blue-light);
           display: flex;
           align-items: center;
           justify-content: center;
           border: 2px solid var(--primary-blue);
         }

         .avatar-placeholder.green {
           background: var(--success-green);
           border-color: var(--success-green);
         }

         .avatar-placeholder.purple {
           background: var(--info-purple);
           border-color: var(--info-purple);
         }

         .avatar-placeholder.amber {
           background: var(--warning-amber);
           border-color: var(--warning-amber);
         }

         .avatar-initials {
           font-weight: 700;
          color: white;
           font-size: 1.125rem;
         }

         .author-info {
           flex: 1;
         }

         .author-name {
           font-size: 1.125rem;
           font-weight: 700;
           color: var(--gray-900);
           font-style: normal;
           display: block;
           margin-bottom: 0.25rem;
         }

         .author-title {
           font-size: 1rem;
           color: var(--gray-600);
           margin: 0 0 0.5rem 0;
           font-weight: 500;
         }

         .property-stats {
          display: flex;
          align-items: center;
           gap: 0.75rem;
         }

         .stat-item {
           display: flex;
           align-items: baseline;
           gap: 0.25rem;
         }

         .stat-number {
           font-weight: 700;
           color: var(--primary-blue);
           font-size: 1.125rem;
         }

         .stat-label {
           font-size: 0.875rem;
           color: var(--gray-600);
         }

         .stat-divider {
           color: var(--gray-400);
           font-weight: bold;
         }

         .testimonial-logo {
           flex-shrink: 0;
         }

         .company-logo {
           width: 48px;
           height: 48px;
           border-radius: 8px;
           background: linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-blue-dark) 100%);
          display: flex;
          align-items: center;
           justify-content: center;
           box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
         }

         .company-logo.green {
           background: linear-gradient(135deg, var(--success-green) 0%, #059669 100%);
           box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
         }

         .company-logo.purple {
           background: linear-gradient(135deg, var(--info-purple) 0%, var(--info-purple-dark) 100%);
           box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
         }

         .company-logo.amber {
           background: linear-gradient(135deg, var(--warning-amber) 0%, var(--warning-amber-dark) 100%);
           box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
         }

         .logo-text {
           font-weight: 700;
           color: white;
           font-size: 1.125rem;
         }

         /* Testimonials Navigation */
         .testimonials-navigation {
           display: flex;
           align-items: center;
           justify-content: center;
           gap: 2rem;
           margin-top: 2rem;
         }

         .nav-button {
           background: white;
           border: 2px solid var(--gray-200);
           border-radius: 50%;
           width: 48px;
           height: 48px;
           display: flex;
           align-items: center;
           justify-content: center;
           cursor: pointer;
           transition: all 0.3s ease;
           color: var(--gray-600);
         }

         .nav-button:hover {
           border-color: var(--primary-blue);
           color: var(--primary-blue);
           transform: translateY(-2px);
           box-shadow: 0 8px 25px -8px rgba(37, 99, 235, 0.3);
         }

         .testimonial-dots {
           display: flex;
           gap: 0.75rem;
         }

         .dot {
           width: 12px;
           height: 12px;
           border-radius: 50%;
           background: var(--gray-300);
           border: none;
           cursor: pointer;
           transition: all 0.3s ease;
         }

         .dot.active {
           background: var(--primary-blue);
           transform: scale(1.2);
         }

         .dot:hover {
           background: var(--primary-blue);
           opacity: 0.7;
         }

         /* Carousel Functionality */
         .testimonials-container {
           overflow: hidden;
           border-radius: 20px;
           margin-bottom: 2rem;
         }

         .testimonials-track {
           display: flex;
           transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
           animation: testimonialAutoScroll 20s infinite linear;
         }

         .testimonials-track:hover {
           animation-play-state: paused;
         }

         @keyframes testimonialAutoScroll {
           0% { transform: translateX(0); }
           23% { transform: translateX(0); }
           25% { transform: translateX(-100%); }
           48% { transform: translateX(-100%); }
           50% { transform: translateX(-200%); }
           73% { transform: translateX(-200%); }
           75% { transform: translateX(-300%); }
           98% { transform: translateX(-300%); }
           100% { transform: translateX(0); }
         }

        /* Footer */
        .footer {
          background: var(--gray-900);
          color: white;
          padding: 4rem 0 1.5rem;
          position: relative;
          border-top: 1px solid var(--gray-800);
        }

        .footer::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.015'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
          opacity: 0.1;
        }

        .footer-main {
          display: grid;
          grid-template-columns: 2.5fr 3fr;
          gap: 4rem;
          margin-bottom: 3rem;
          position: relative;
          z-index: 2;
        }

        .footer-brand {
          display: flex;
          gap: 1.25rem;
          align-items: center;
        }

        .brand-info .brand-name {
          font-size: 1.75rem;
          font-weight: 800;
          margin-bottom: 0.75rem;
          display: block;
          letter-spacing: -0.025em;
          color: white;
        }

        .footer-tagline {
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          font-size: 1.1rem;
          line-height: 1.6;
        }

        .footer-links {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 2.5rem;
        }

        .footer-column h4 {
          font-weight: 700;
          margin-bottom: 1.25rem;
          color: white;
          font-size: 1.1rem;
          letter-spacing: -0.015em;
        }

        .footer-column ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-column li {
          margin-bottom: 0.75rem;
        }

        .footer-column a {
          color: rgba(255, 255, 255, 0.65);
          transition: all 0.25s ease;
          font-size: 0.975rem;
          line-height: 1.5;
        }

        .footer-column a:hover {
          color: white;
          transform: translateX(2px);
        }

        .footer-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          padding-top: 1.5rem;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          z-index: 2;
        }

        .footer-bottom p {
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
          font-size: 0.95rem;
          text-align: center;
        }

        /* Buttons */
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.875rem 1.75rem;
          border-radius: 10px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
          border: 2px solid transparent;
          cursor: pointer;
          font-size: 1rem;
          line-height: 1.5;
          position: relative;
        }

        .btn-lg {
          padding: 1.125rem 2.25rem;
          font-size: 1.125rem;
          border-radius: 12px;
          gap: 0.625rem;
        }

        .btn-full {
          width: 100%;
          justify-content: center;
        }

        .btn svg {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        .btn-lg svg {
          width: 20px;
          height: 20px;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-blue-dark) 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35);
        }

        .btn-secondary {
          background: white;
          color: var(--gray-700);
          border-color: var(--gray-300);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
        }

        .btn-secondary:hover {
          background: var(--gray-50);
          border-color: var(--gray-400);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .btn-outline {
          background: rgba(255, 255, 255, 0.95);
          color: var(--primary-blue);
          border-color: var(--primary-blue);
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
        }

        .btn-outline:hover {
          background: var(--primary-blue);
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.3);
        }

        .btn-watch-demo {
          background: white;
          color: var(--gray-700);
          border-color: var(--gray-300);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
        }

        .btn-watch-demo:hover {
          background: var(--gray-50);
          border-color: var(--gray-400);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .cta-section .btn-secondary {
          background: white;
          color: var(--gray-700);
          border-color: var(--gray-300);
          box-shadow: var(--shadow-sm);
        }

        .cta-section .btn-secondary:hover {
          background: var(--gray-50);
          border-color: var(--gray-400);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .hero .container {
            grid-template-columns: 1fr;
            gap: 3rem;
            text-align: center;
          }
          
          .footer-main {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }

        @media (max-width: 768px) {
           .nav-container {
             padding: 0 1rem;
           }
           
           .container {
             padding: 0 1rem;
           }
           
          .hero-title {
            font-size: 2.5rem;
          }

           .section-title {
             font-size: 2rem;
          }

          .hero-actions, .cta-actions {
            flex-direction: column;
            align-items: center;
          }

           .hero-stats {
             justify-content: center;
          }

           .value-grid, .features-grid, .pricing-cards {
            grid-template-columns: 1fr;
           }
           
           .pricing-card.featured {
             transform: none;
           }
           
           .testimonial-card {
             padding: 2rem;
             min-width: 90vw;
             width: 90vw;
           }
           
           .testimonial-header {
             flex-direction: column;
             gap: 1rem;
             align-items: flex-start;
           }
           
           .testimonial-text {
             font-size: 1.125rem;
           }
           
           .highlight-stat {
             font-size: 1.25rem;
           }
           
           .testimonial-author {
             flex-direction: column;
             align-items: flex-start;
             gap: 1rem;
           }
           
           .property-stats {
             justify-content: flex-start;
           }

           .testimonials-navigation {
             gap: 1rem;
           }

           .nav-button {
             width: 40px;
             height: 40px;
           }
           
           .footer-bottom {
             flex-direction: column;
             gap: 1rem;
             text-align: center;
           }
         }

        @media (max-width: 480px) {
          .hero {
            padding: 3rem 0;
          }
          
          .hero-title {
            font-size: 2rem;
          }
          
          .btn {
            padding: 0.75rem 1rem;
            font-size: 0.875rem;
          }
          
          .btn-lg {
            padding: 0.875rem 1.5rem;
            font-size: 1rem;
          }
        }
      `}</style>
    </>
  );
} 