import React, { ReactNode } from 'react';
import Head from 'next/head';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}

/**
 * DashboardLayout - Provides consistent layout, spacing and styling for all dashboard pages
 * 
 * @param {ReactNode} children - Page content
 * @param {string} title - Page title
 * @param {string} subtitle - Optional subtitle/description text
 * @param {ReactNode} icon - Optional icon component
 */
export default function DashboardLayout({ 
  children, 
  title, 
  subtitle,
  icon 
}: DashboardLayoutProps) {
  return (
    <div className="dashboard-container">
      <Head>
        <title>{title} - Tink Property Management</title>
      </Head>
      
      <div className="dashboard-content">
        {/* Page Header */}
        <div className="page-header">
          {icon && <div className="page-header-icon">{icon}</div>}
          <div>
            <h1 className="text-h1 mb-sm">{title}</h1>
            {subtitle && <p className="text-body text-secondary">{subtitle}</p>}
          </div>
        </div>

        {/* Main Content */}
        <div className="page-content">
          {children}
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          width: 100%;
        }

        .dashboard-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--spacing-lg) var(--spacing-xl);
        }

        .page-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-xl);
        }

        .page-header-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          font-size: 20px;
          background: var(--gray-100);
          border-radius: var(--radius-sm);
        }

        .page-content {
          margin-top: var(--spacing-lg);
        }

        @media (max-width: 768px) {
          .dashboard-content {
            padding: var(--spacing-md);
          }
        }
      `}</style>
    </div>
  );
} 