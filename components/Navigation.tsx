import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';

export default function Navigation() {
  const router = useRouter();
  const { user, logout, isAdmin, isLandlord, isManager, isTenant } = useAuth();
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState<number>(0);

  useEffect(() => {
    const fetchPendingApplications = async () => {
      try {
        const applications = await apiClient.getPendingApplications();
        setPendingApplicationsCount(Array.isArray(applications) ? applications.length : 0);
      } catch (error) {
        console.warn('Failed to fetch pending applications count:', error);
        setPendingApplicationsCount(0);
      }
    };

    if (user) {
      fetchPendingApplications();
      
      // Refresh count every 30 seconds
      const interval = setInterval(fetchPendingApplications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const isActive = (path: string) => router.pathname === path;

  // Get display name with fallbacks
  const getDisplayName = () => {
    if (user?.full_name) return user.full_name;
    if (user?.username) return user.username;
    return 'User';
  };

  // Get user email with fallback
  const getUserEmail = () => {
    return user?.email || user?.username || '';
  };

  // Get dashboard title based on role
  const getDashboardTitle = () => {
    if (isAdmin()) return 'Platform Admin';
    if (isLandlord()) return 'Business Owner';
    if (isManager()) return 'Property Manager';
    if (isTenant()) return 'Tenant Portal';
    return 'User';
  };

  // Get role badge
  const getRoleBadge = () => {
    if (isAdmin()) return { text: 'ADMIN', bgColor: 'var(--error-red)', textColor: 'white' };
    if (isLandlord()) return { text: 'OWNER', bgColor: 'var(--warning-amber)', textColor: 'white' };
    if (isManager()) return { text: 'MANAGER', bgColor: 'var(--success-green)', textColor: 'white' };
    if (isTenant()) return { text: 'TENANT', bgColor: 'var(--primary-blue)', textColor: 'white' };
    return { text: 'USER', bgColor: 'var(--gray-400)', textColor: 'white' };
  };

  const roleBadge = getRoleBadge();

  return (
    <nav className="main-navigation">
      <div className="navigation-container">
        {/* Header */}
        <div className="navigation-header">
          <div className="logo-container">
            <div className="brand-logo">
              <span>T</span>
            </div>
            <div>
              <h1 className="brand-title">Tink Property Management</h1>
              <div className="role-title">{getDashboardTitle()}</div>
            </div>
          </div>
          
          <div className="user-container">
            <div className="user-info">
              <span className="user-name">{getDisplayName()}</span>
              <span 
                className="role-badge"
                style={{ 
                  backgroundColor: roleBadge.bgColor,
                  color: roleBadge.textColor
                }}
              >
                {roleBadge.text}
              </span>
            </div>
            <div className="user-email">
              {getUserEmail()}
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="navigation-links">
          {/* Role-specific main dashboard */}
          {isAdmin() && (
            <>
              <Link 
                href="/admin-dashboard" 
                className={`nav-link ${isActive('/admin-dashboard') ? 'active' : ''}`}
              >
                <span className="nav-icon admin-icon"></span>
                <span className="nav-text">Dashboard</span>
              </Link>
              <Link 
                href="/managers" 
                className={`nav-link ${isActive('/managers') ? 'active' : ''}`}
              >
                <span className="nav-icon manager-icon"></span>
                <span className="nav-text">Managers</span>
              </Link>
              <Link 
                href="/landlords" 
                className={`nav-link ${isActive('/landlords') ? 'active' : ''}`}
              >
                <span className="nav-icon landlord-icon"></span>
                <span className="nav-text">Landlords</span>
              </Link>
              <Link 
                href="/properties" 
                className={`nav-link ${isActive('/properties') ? 'active' : ''}`}
              >
                <span className="nav-icon property-icon"></span>
                <span className="nav-text">Properties</span>
              </Link>
            </>
          )}
          
          {isLandlord() && (
            <>
              <Link 
                href="/landlord-dashboard" 
                className={`nav-link ${isActive('/landlord-dashboard') ? 'active' : ''}`}
              >
                <span className="nav-icon dashboard-icon"></span>
                <span className="nav-text">Dashboard</span>
              </Link>
              <Link 
                href="/applications" 
                className={`nav-link ${isActive('/applications') ? 'active' : ''}`}
              >
                <span className="nav-icon application-icon"></span>
                <span className="nav-text">
                  Applications
                  {pendingApplicationsCount > 0 && (
                    <span className="count-badge">{pendingApplicationsCount}</span>
                  )}
                </span>
              </Link>
              <Link 
                href="/viewings" 
                className={`nav-link ${isActive('/viewings') ? 'active' : ''}`}
              >
                <span className="nav-icon viewing-icon"></span>
                <span className="nav-text">Viewings</span>
              </Link>
              <Link 
                href="/leases" 
                className={`nav-link ${isActive('/leases') ? 'active' : ''}`}
              >
                <span className="nav-icon lease-icon"></span>
                <span className="nav-text">Leases</span>
              </Link>
              <Link 
                href="/tenants" 
                className={`nav-link ${isActive('/tenants') ? 'active' : ''}`}
              >
                <span className="nav-icon tenant-icon"></span>
                <span className="nav-text">Tenants</span>
              </Link>
              <Link 
                href="/properties" 
                className={`nav-link ${isActive('/properties') ? 'active' : ''}`}
              >
                <span className="nav-icon property-icon"></span>
                <span className="nav-text">Properties</span>
              </Link>
              <Link 
                href="/communication" 
                className={`nav-link ${isActive('/communication') ? 'active' : ''}`}
              >
                <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span className="nav-text">Communication</span>
              </Link>
              <Link 
                href="/managers" 
                className={`nav-link ${isActive('/managers') ? 'active' : ''}`}
              >
                <span className="nav-icon team-icon"></span>
                <span className="nav-text">My Team</span>
              </Link>
              <Link 
                href="/stripe-connect" 
                className={`nav-link ${isActive('/stripe-connect') ? 'active' : ''}`}
              >
                <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
                <span className="nav-text">Payment Setup</span>
              </Link>
            </>
          )}
          
          {isManager() && (
            <>
              <Link 
                href="/manager-dashboard" 
                className={`nav-link ${isActive('/manager-dashboard') ? 'active' : ''}`}
              >
                <span className="nav-icon dashboard-icon"></span>
                <span className="nav-text">Dashboard</span>
              </Link>
              <Link 
                href="/applications" 
                className={`nav-link ${isActive('/applications') ? 'active' : ''}`}
              >
                <span className="nav-icon application-icon"></span>
                <span className="nav-text">
                  Applications
                  {pendingApplicationsCount > 0 && (
                    <span className="count-badge">{pendingApplicationsCount}</span>
                  )}
                </span>
              </Link>
              <Link 
                href="/viewings" 
                className={`nav-link ${isActive('/viewings') ? 'active' : ''}`}
              >
                <span className="nav-icon viewing-icon"></span>
                <span className="nav-text">Viewings</span>
              </Link>
              <Link 
                href="/leases" 
                className={`nav-link ${isActive('/leases') ? 'active' : ''}`}
              >
                <span className="nav-icon lease-icon"></span>
                <span className="nav-text">Leases</span>
              </Link>
              <Link 
                href="/tenants" 
                className={`nav-link ${isActive('/tenants') ? 'active' : ''}`}
              >
                <span className="nav-icon tenant-icon"></span>
                <span className="nav-text">Tenants</span>
              </Link>
              <Link 
                href="/communication" 
                className={`nav-link ${isActive('/communication') ? 'active' : ''}`}
              >
                <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span className="nav-text">Communication</span>
              </Link>
              <Link 
                href="/properties" 
                className={`nav-link ${isActive('/properties') ? 'active' : ''}`}
              >
                <span className="nav-icon property-icon"></span>
                <span className="nav-text">Properties</span>
              </Link>
              <Link 
                href="/reminders" 
                className={`nav-link ${isActive('/reminders') ? 'active' : ''}`}
              >
                <span className="nav-icon task-icon"></span>
                <span className="nav-text">Tasks</span>
              </Link>
            </>
          )}
          
          {isTenant() && (
            <>
              <Link 
                href="/tenant-dashboard" 
                className={`nav-link ${isActive('/tenant-dashboard') ? 'active' : ''}`}
              >
                <span className="nav-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9,22 9,12 15,12 15,22"/>
                  </svg>
                </span>
                <span className="nav-text">Dashboard</span>
              </Link>
              <Link 
                href="/tenant-payments" 
                className={`nav-link ${isActive('/tenant-payments') ? 'active' : ''}`}
              >
                <span className="nav-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                </span>
                <span className="nav-text">Payments</span>
              </Link>
              <Link 
                href="/tenant-maintenance" 
                className={`nav-link ${isActive('/tenant-maintenance') ? 'active' : ''}`}
              >
                <span className="nav-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                  </svg>
                </span>
                <span className="nav-text">Maintenance</span>
              </Link>
              <Link 
                href="/tenant-announcements" 
                className={`nav-link ${isActive('/tenant-announcements') ? 'active' : ''}`}
              >
                <span className="nav-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                  </svg>
                </span>
                <span className="nav-text">Announcements</span>
              </Link>
            </>
          )}
          
          <div className="flex-spacer"></div>
          
          <button 
            onClick={() => logout()} 
            className="btn btn-error btn-sm logout-button"
          >
            Logout
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .main-navigation {
          background-color: var(--gray-900);
          color: white;
          padding: 0;
        }
        
        .navigation-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .navigation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-lg) var(--spacing-xl);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .logo-container {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }
        
        .brand-logo {
          width: 36px;
          height: 36px;
          background: var(--primary-blue);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 18px;
        }
        
        .brand-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          line-height: 1.2;
          color: white;
        }
        
        .role-title {
          font-size: var(--text-small);
          color: var(--gray-400);
          font-weight: 400;
        }
        
        .user-container {
          text-align: right;
        }
        
        .user-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          justify-content: flex-end;
        }
        
        .user-name {
          font-weight: 500;
          font-size: var(--text-body);
        }
        
        .role-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .user-email {
          font-size: var(--text-small);
          color: var(--gray-400);
        }
        
        .navigation-links {
          display: flex;
          gap: var(--spacing-lg);
          padding: var(--spacing-md) var(--spacing-xl);
          align-items: center;
          flex-wrap: wrap;
        }
        
        .nav-link {
          color: var(--gray-200);
          text-decoration: none;
          font-weight: 500;
          font-size: var(--text-body);
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-sm);
          transition: all 0.15s ease;
        }
        
        .nav-link:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }
        
        .nav-link.active {
          color: white;
          background: rgba(255, 255, 255, 0.1);
          font-weight: 600;
        }

        .nav-icon {
          width: 16px;
          height: 16px;
          opacity: 0.7;
          display: inline-block;
        }
        
        .nav-link:hover .nav-icon,
        .nav-link.active .nav-icon {
          opacity: 1;
        }
        
        .count-badge {
          background: var(--error-red);
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 999px;
          margin-left: var(--spacing-xs);
        }
        
        .flex-spacer {
          flex: 1;
        }
        
        .logout-button {
          /* Override any custom styling - let btn-error handle the styling */
        }
        
        @media (max-width: 768px) {
          .navigation-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-md);
            padding: var(--spacing-md);
          }
          
          .user-container {
            text-align: left;
            width: 100%;
          }
          
          .user-info {
            justify-content: flex-start;
          }
          
          .navigation-links {
            padding: var(--spacing-md);
            overflow-x: auto;
            gap: var(--spacing-md);
          }
        }
      `}</style>
    </nav>
  );
} 