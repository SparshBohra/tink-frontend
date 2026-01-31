import React, { ReactNode } from 'react';
import Head from 'next/head';
import TopBar from './TopBar';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode[];
}

/**
 * DashboardLayout - Modern layout with top navigation only
 */
export default function DashboardLayout({ 
  children, 
  title, 
  subtitle,
  icon,
  actions
}: DashboardLayoutProps) {
  return (
    <>
      <Head>
        <title>{title} - SquareFt</title>
      </Head>
      
      <div className="dashboard-layout">
        <TopBar />
        
        <main className="main-content">
          <div className="content-wrapper">
            {/* Page Header */}
            {(title || subtitle || icon || actions) && (
              <div className="page-header">
                <div className="page-header-left">
                  {icon && <div className="page-header-icon">{icon}</div>}
                  <div className="page-header-content">
                    {title && <h1 className="page-title">{title}</h1>}
                    {subtitle && <p className="page-subtitle">{subtitle}</p>}
                  </div>
                </div>
                {actions && actions.length > 0 && (
                  <div className="page-header-actions">
                    {actions}
                  </div>
                )}
              </div>
            )}

            {/* Main Content */}
            <div className="page-content">
              {children}
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        .dashboard-layout {
          min-height: 100vh;
          background: #f8fafc;
          position: relative;
        }

        /* Subtle background blob */
        .dashboard-layout::before {
          content: '';
          position: fixed;
          top: -30%;
          right: -10%;
          width: 800px;
          height: 800px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.04) 0%, rgba(255, 255, 255, 0) 70%);
          z-index: 0;
          pointer-events: none;
        }

        .main-content {
          margin-top: 72px; /* Height of TopBar */
          min-height: calc(100vh - 72px);
          width: 100%;
          position: relative;
          z-index: 1;
        }

        .content-wrapper {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .page-header {
          padding: 32px 0 24px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
        }

        .page-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
        }

        .page-header-content {
          flex: 1;
        }

        .page-title {
          font-size: 32px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 8px 0;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .page-subtitle {
          font-size: 16px;
          color: #64748b;
          margin: 0;
          font-weight: 500;
        }

        .page-header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .page-content {
          padding-bottom: 40px;
        }

        @media (max-width: 768px) {
          .content-wrapper {
            padding: 0 16px;
          }

          .page-header {
            flex-direction: column;
            align-items: flex-start;
            padding: 24px 0 20px;
          }

          .page-title {
            font-size: 28px;
          }

          .page-header-actions {
            width: 100%;
            justify-content: flex-start;
          }
        }
      `}</style>
    </>
  );
}
