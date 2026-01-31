import React from 'react';
import Head from 'next/head';
import DashboardLayout from '../../components/DashboardLayout';
import { withAuth } from '../../lib/auth-context';
import { HelpCircle, Phone, Mail, BookOpen, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

function SupportPage() {
  return (
    <DashboardLayout>
      <Head>
        <title>Support - SquareFt</title>
      </Head>
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: '700', 
            color: '#111827', 
            margin: '0 0 0.5rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <HelpCircle size={28} />
            Support & Help
          </h1>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Get help, contact our team, or learn how to use SquareFt
          </p>
        </div>

        {/* Contact Information */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 1.5rem 0'
          }}>
            Contact Us
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {/* Phone */}
            <div style={{
              padding: '1rem',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.5rem'
              }}>
                <Phone size={20} color="#2563eb" />
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Hotline
                </span>
              </div>
              <a 
                href="tel:+18572000666"
                style={{
                  fontSize: '1rem',
                  color: '#2563eb',
                  textDecoration: 'none',
                  fontWeight: '500'
                }}
                onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                +1 (857) 200-0666
              </a>
              <div style={{
                fontSize: '0.8125rem',
                color: '#6b7280',
                marginTop: '0.25rem'
              }}>
                Available during business hours
              </div>
            </div>

            {/* Email 1 */}
            <div style={{
              padding: '1rem',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.5rem'
              }}>
                <Mail size={20} color="#2563eb" />
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Email Support
                </span>
              </div>
              <a 
                href="mailto:dakshhsaraf@gmail.com"
                style={{
                  fontSize: '0.875rem',
                  color: '#2563eb',
                  textDecoration: 'none',
                  fontWeight: '500',
                  wordBreak: 'break-word'
                }}
                onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                dakshhsaraf@gmail.com
              </a>
            </div>

            {/* Email 2 */}
            <div style={{
              padding: '1rem',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.5rem'
              }}>
                <Mail size={20} color="#2563eb" />
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Email Support
                </span>
              </div>
              <a 
                href="mailto:sparshbohra@gmail.com"
                style={{
                  fontSize: '0.875rem',
                  color: '#2563eb',
                  textDecoration: 'none',
                  fontWeight: '500',
                  wordBreak: 'break-word'
                }}
                onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                sparshbohra@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* How to Use SquareFt */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 1.5rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <BookOpen size={20} />
            How to Use SquareFt
          </h2>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 1rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle size={16} color="#10b981" />
              Current Workflows
            </h3>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {/* Property Management */}
              <div style={{
                padding: '1rem',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px'
              }}>
                <h4 style={{
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                  color: '#166534',
                  margin: '0 0 0.5rem 0'
                }}>
                  1. Property Management
                </h4>
                <ul style={{
                  margin: 0,
                  paddingLeft: '1.25rem',
                  fontSize: '0.875rem',
                  color: '#374151',
                  lineHeight: '1.6'
                }}>
                  <li>Add properties by entering an address - we'll automatically scrape property details</li>
                  <li>Configure rent structure (whole property or per room)</li>
                  <li>Edit property details, upload photos, and manage listings</li>
                  <li>View property history and tenant occupancy</li>
                </ul>
              </div>

              {/* Application Management */}
              <div style={{
                padding: '1rem',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px'
              }}>
                <h4 style={{
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                  color: '#1e40af',
                  margin: '0 0 0.5rem 0'
                }}>
                  2. Application Management
                </h4>
                <ul style={{
                  margin: 0,
                  paddingLeft: '1.25rem',
                  fontSize: '0.875rem',
                  color: '#374151',
                  lineHeight: '1.6'
                }}>
                  <li>Review applications in the Applications page (Pending, Shortlisted, Active columns)</li>
                  <li>Shortlist promising applicants</li>
                  <li>Assign applicants directly to properties with rent and move-in details</li>
                  <li>Move tenants out when they leave</li>
                </ul>
              </div>

              {/* Listing Management */}
              <div style={{
                padding: '1rem',
                backgroundColor: '#fef3c7',
                border: '1px solid #fde68a',
                borderRadius: '8px'
              }}>
                <h4 style={{
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                  color: '#92400e',
                  margin: '0 0 0.5rem 0'
                }}>
                  3. Listing Management
                </h4>
                <ul style={{
                  margin: 0,
                  paddingLeft: '1.25rem',
                  fontSize: '0.875rem',
                  color: '#374151',
                  lineHeight: '1.6'
                }}>
                  <li>Create public listings from your properties</li>
                  <li>Use AI to stage images and generate descriptions</li>
                  <li>Edit listings, manage media, and set availability</li>
                  <li>Share public listing URLs with potential tenants</li>
                </ul>
              </div>

              {/* Tenant Management */}
              <div style={{
                padding: '1rem',
                backgroundColor: '#f5f3ff',
                border: '1px solid #ddd6fe',
                borderRadius: '8px'
              }}>
                <h4 style={{
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                  color: '#6b21a8',
                  margin: '0 0 0.5rem 0'
                }}>
                  4. Tenant Management
                </h4>
                <ul style={{
                  margin: 0,
                  paddingLeft: '1.25rem',
                  fontSize: '0.875rem',
                  color: '#374151',
                  lineHeight: '1.6'
                }}>
                  <li>View all active tenants on the Tenants page</li>
                  <li>View tenant details and application history</li>
                  <li>Move tenants out when their tenancy ends</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 1rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Clock size={16} color="#6b7280" />
              Coming Soon
            </h3>

            <div style={{
              padding: '1rem',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}>
              <ul style={{
                margin: 0,
                paddingLeft: '1.25rem',
                fontSize: '0.875rem',
                color: '#6b7280',
                lineHeight: '1.6'
              }}>
                <li>Lease Management - Create, sign, and manage lease agreements</li>
                <li>Payment Processing - Track rent payments and generate invoices</li>
                <li>Accounting & Reports - Financial reports and revenue tracking</li>
                <li>Vendor Management - Manage maintenance and service providers</li>
                <li>Communication Tools - Messaging and notifications system</li>
                <li>Advanced Analytics - Property performance and occupancy analytics</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 1rem 0'
          }}>
            Quick Links
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <Link href="/app/properties">
              <span style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                borderRadius: '6px',
                fontSize: '0.875rem',
                textDecoration: 'none',
                fontWeight: '500',
                display: 'inline-block',
                cursor: 'pointer'
              }}>
                Properties
              </span>
            </Link>
            <Link href="/app/applications">
              <span style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                borderRadius: '6px',
                fontSize: '0.875rem',
                textDecoration: 'none',
                fontWeight: '500',
                display: 'inline-block',
                cursor: 'pointer'
              }}>
                Applications
              </span>
            </Link>
            <Link href="/app/tenants">
              <span style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                borderRadius: '6px',
                fontSize: '0.875rem',
                textDecoration: 'none',
                fontWeight: '500',
                display: 'inline-block',
                cursor: 'pointer'
              }}>
                Tenants
              </span>
            </Link>
            <Link href="/landlord-dashboard">
              <span style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                borderRadius: '6px',
                fontSize: '0.875rem',
                textDecoration: 'none',
                fontWeight: '500',
                display: 'inline-block',
                cursor: 'pointer'
              }}>
                Dashboard
              </span>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(SupportPage);

