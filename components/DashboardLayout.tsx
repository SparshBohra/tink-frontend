import React, { ReactNode, useState, useEffect } from 'react';
import Head from 'next/head';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode[];
}

/**
 * DashboardLayout - Modern layout with collapsible sidebar and clean top bar
 */
export default function DashboardLayout({ 
  children, 
  title, 
  subtitle,
  icon,
  actions
}: DashboardLayoutProps) {
  // Default to collapsed (true), load from localStorage if available
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    setIsClient(true);
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    if (savedSidebarState !== null) {
      setIsSidebarCollapsed(JSON.parse(savedSidebarState));
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
    }
  };

  // Prevent hydration mismatch by not rendering until client-side
  if (!isClient) {
    return (
      <>
        <Head>
          <title>{title} - Tink Property Management</title>
        </Head>
        
        <div className="dashboard-layout">
          <Sidebar isCollapsed={true} onToggle={() => {}} />
          <TopBar onSidebarToggle={() => {}} isSidebarCollapsed={true} />
          
          <main className="main-content sidebar-collapsed">
            <div className="content-wrapper">
              {(title || subtitle || icon) && (
                <div className="page-header">
                  {icon && <div className="page-header-icon">{icon}</div>}
                  <div className="page-header-content">
                    {title && <h1 className="page-title">{title}</h1>}
                    {subtitle && <p className="page-subtitle">{subtitle}</p>}
                  </div>
                </div>
              )}
              <div className="page-content">
                {children}
              </div>
            </div>
          </main>
        </div>

        <style jsx>{`
          .dashboard-layout {
            min-height: 100vh;
            background: linear-gradient(135deg, #fafbfc 0%, #f8fafc 50%, #f1f5f9 100%);
            position: relative;
          }

          .dashboard-layout::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.03) 0%, transparent 50%),
                        radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.03) 0%, transparent 50%);
            pointer-events: none;
          }

          .main-content {
            margin-left: 240px;
            margin-top: 72px;
            min-height: calc(100vh - 72px);
            transition: margin-left 0.3s ease;
            width: calc(100% - 240px);
          }

          .main-content.sidebar-collapsed {
            margin-left: 70px;
            width: calc(100% - 70px);
          }

          .content-wrapper {
            width: 100%;
            position: relative;
            z-index: 1;
          }

          .page-header {
            margin-bottom: 20px;
            padding: 16px 20px 0;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 20px;
          }

          .page-header-content {
            flex: 1;
            min-width: 0;
          }

          .page-title {
            font-size: 24px;
            font-weight: 700;
            color: #1f2937;
            margin: 0 0 6px 0;
            line-height: 1.2;
          }

          .page-subtitle {
            font-size: 14px;
            color: #6b7280;
            margin: 0;
            line-height: 1.4;
            font-weight: 500;
          }

          .page-content {
            position: relative;
            z-index: 1;
            padding: 0 20px 16px;
          }

          .page-header-icon {
            width: 56px;
            height: 56px;
            font-size: 24px;
          }

          @media (max-width: 768px) {
            .main-content {
              margin-left: 0;
              margin-top: 64px;
              width: 100%;
            }

            .main-content.sidebar-collapsed {
              margin-left: 0;
              width: 100%;
            }

            .content-wrapper {
              
            }

            .page-header {
              flex-direction: column;
              gap: 16px;
              align-items: flex-start;
              padding: 16px;
              margin-bottom: 16px;
            }

            .page-header-actions {
              width: 100%;
              justify-content: flex-end;
            }

            .page-title {
              font-size: 28px;
            }

            .page-subtitle {
              font-size: 16px;
            }

            .page-header-icon {
              width: 56px;
              height: 56px;
              font-size: 24px;
            }
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{title} - Tink Property Management</title>
      </Head>
      
      <div className="dashboard-layout">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        <TopBar onSidebarToggle={toggleSidebar} isSidebarCollapsed={isSidebarCollapsed} />
        
        <main className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
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
          background: linear-gradient(135deg, #fafbfc 0%, #f8fafc 50%, #f1f5f9 100%);
          position: relative;
        }

        .dashboard-layout::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.03) 0%, transparent 50%),
                      radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.03) 0%, transparent 50%);
          pointer-events: none;
        }

        .main-content {
          margin-left: 240px;
          margin-top: 72px;
          min-height: calc(100vh - 72px);
          transition: margin-left 0.3s ease;
          width: calc(100% - 240px);
        }

        .main-content.sidebar-collapsed {
          margin-left: 70px;
          width: calc(100% - 70px);
        }

        .main-content.sidebar-expanded {
          margin-left: 240px;
          width: calc(100% - 240px);
        }

        .content-wrapper {
          width: 100%;
          position: relative;
          z-index: 1;
        }

        .page-header {
          margin-bottom: 20px;
          padding: 16px 20px 0;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }

        .page-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .page-header-content {
          flex: 1;
          min-width: 0;
        }

        .page-title {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 6px 0;
          line-height: 1.2;
        }

        .page-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
          line-height: 1.4;
          font-weight: 500;
        }

        .page-header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-shrink: 0;
        }

        .page-content {
          position: relative;
          z-index: 1;
          padding: 0 16px 16px;
        }

        .page-header-icon {
          width: 56px;
          height: 56px;
          font-size: 24px;
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .main-content,
          .main-content.sidebar-collapsed,
          .main-content.sidebar-expanded {
            margin-left: 0;
            margin-top: 64px;
            width: 100%;
          }

          .content-wrapper {
            
          }

          .page-header {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
            padding: 16px;
            margin-bottom: 16px;
          }

          .page-header-actions {
            width: 100%;
            justify-content: flex-end;
          }

          .page-title {
            font-size: 28px;
          }

          .page-subtitle {
            font-size: 16px;
          }

          .page-header-icon {
            width: 56px;
            height: 56px;
            font-size: 24px;
          }
        }

        /* Dark Mode Styles */
        :global(.dark-mode) .dashboard-layout {
          background: var(--bg-primary, #0a0a0a);
        }

        :global(.dark-mode) .dashboard-layout::before {
          background: none;
        }

        :global(.dark-mode) .page-title,
        :global(.dark-mode) .page-subtitle {
          color: var(--text-primary, #ffffff) !important;
        }
      `}</style>
    </>
  );
} 