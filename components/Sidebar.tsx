import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ReactElement;
  badge?: number;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const router = useRouter();
  const { user, logout, isAdmin, isLandlord, isManager } = useAuth();
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState(0);

  // Fetch pending applications count
  useEffect(() => {
    const fetchPendingApplications = async () => {
      try {
        if (isLandlord() || isManager()) {
          const applications = await apiClient.getPendingApplications();
          setPendingApplicationsCount(Array.isArray(applications) ? applications.length : 0);
        }
      } catch (error) {
        console.error('Failed to fetch pending applications:', error);
        setPendingApplicationsCount(0);
      }
    };

    if (user) {
      fetchPendingApplications();
      // Refresh every 30 seconds
      const interval = setInterval(fetchPendingApplications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, isAdmin, isLandlord, isManager]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleNavigation = (path: string) => {
    if (path === '/settings' || path === '/support') {
      alert('Coming soon!');
      return;
    }
    router.push(path);
  };

  // SVG Icons
  const DashboardIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
  );

  const ApplicationsIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"/>
      <path d="M14 2V8H20"/>
      <path d="M16 13H8"/>
      <path d="M16 17H8"/>
      <path d="M10 9H9H8"/>
    </svg>
  );

  const LeasesIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"/>
      <path d="M14 2V8H20"/>
      <path d="M12 18V12"/>
      <path d="M9 15L12 12L15 15"/>
    </svg>
  );

  const TenantsIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21V19C17 17.9 16.1 17 15 17H9C7.9 17 7 17.9 7 19V21"/>
      <circle cx="12" cy="7" r="4"/>
      <path d="M6 21V19C6 16.79 7.79 15 10 15L12 15"/>
      <circle cx="20" cy="8" r="4"/>
    </svg>
  );

  const PropertiesIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21V8L12 3L21 8V21H3Z"/>
      <path d="M9 21V12H15V21"/>
    </svg>
  );

  const ManagersIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21V19C16 16.79 14.21 15 12 15H5C2.79 15 1 16.79 1 19V21"/>
      <circle cx="8.5" cy="7" r="4"/>
      <path d="M23 21V19C23 16.79 21.21 15 19 15C17.94 15 16.93 15.53 16.2 16.36"/>
      <circle cx="20" cy="7" r="4"/>
    </svg>
  );

  const SettingsIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15C19.2 15.3 19.1 15.6 19 16L20.4 17.1C20.8 17.4 20.9 18 20.6 18.4L19 21.4C18.7 21.8 18.1 21.9 17.7 21.6L16.2 20.7C15.8 20.9 15.4 21.1 15 21.2L14.8 23C14.7 23.5 14.3 23.9 13.8 23.9H10.2C9.7 23.9 9.3 23.5 9.2 23L9 21.2C8.6 21.1 8.2 20.9 7.8 20.7L6.3 21.6C5.9 21.9 5.3 21.8 5 21.4L3.4 18.4C3.1 18 3.2 17.4 3.6 17.1L5 16C4.9 15.6 4.8 15.3 4.6 15L3.2 14.8C2.7 14.7 2.3 14.3 2.3 13.8V10.2C2.3 9.7 2.7 9.3 3.2 9.2L4.6 9C4.8 8.6 4.9 8.2 5 7.8L3.6 6.3C3.2 5.9 3.1 5.3 3.4 4.9L5 1.9C5.3 1.5 5.9 1.4 6.3 1.7L7.8 2.6C8.2 2.4 8.6 2.2 9 2.1L9.2 0.3C9.3 -0.2 9.7 -0.6 10.2 -0.6H13.8C14.3 -0.6 14.7 -0.2 14.8 0.3L15 2.1C15.4 2.2 15.8 2.4 16.2 2.6L17.7 1.7C18.1 1.4 18.7 1.5 19 1.9L20.6 4.9C20.9 5.3 20.8 5.9 20.4 6.3L19 7.8C19.1 8.2 19.2 8.6 19.4 9L20.8 9.2C21.3 9.3 21.7 9.7 21.7 10.2V13.8C21.7 14.3 21.3 14.7 20.8 14.8L19.4 15Z"/>
    </svg>
  );

  const SupportIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0109 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13"/>
      <path d="M12 17H12.01"/>
    </svg>
  );

  const LogoutIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H9"/>
      <path d="M16 17L21 12L16 7"/>
      <path d="M21 12H9"/>
    </svg>
  );

  const getNavigationItems = (): NavigationItem[] => {
    const baseItems: NavigationItem[] = [
      { path: isAdmin() ? '/admin-dashboard' : isLandlord() ? '/landlord-dashboard' : '/manager-dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    ];

    if (isAdmin()) {
      return [
        ...baseItems,
        { path: '/applications', label: 'Applications', icon: <ApplicationsIcon />, badge: pendingApplicationsCount },
        { path: '/properties', label: 'Properties', icon: <PropertiesIcon /> },
        { path: '/leases', label: 'Leases', icon: <LeasesIcon /> },
        { path: '/tenants', label: 'Tenants', icon: <TenantsIcon /> },
        { path: '/managers', label: 'Managers', icon: <ManagersIcon /> },
      ];
    }

    if (isLandlord()) {
      return [
        ...baseItems,
        { path: '/applications', label: 'Applications', icon: <ApplicationsIcon />, badge: pendingApplicationsCount },
        { path: '/properties', label: 'Properties', icon: <PropertiesIcon /> },
        { path: '/leases', label: 'Leases', icon: <LeasesIcon /> },
        { path: '/tenants', label: 'Tenants', icon: <TenantsIcon /> },
        { path: '/managers', label: 'Managers', icon: <ManagersIcon /> },
      ];
    }

    if (isManager()) {
      return [
        ...baseItems,
        { path: '/applications', label: 'Applications', icon: <ApplicationsIcon />, badge: pendingApplicationsCount },
        { path: '/properties', label: 'Properties', icon: <PropertiesIcon /> },
        { path: '/leases', label: 'Leases', icon: <LeasesIcon /> },
        { path: '/tenants', label: 'Tenants', icon: <TenantsIcon /> },
      ];
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Logo Section */}
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo">T</div>
            {!isCollapsed && <span className="logo-text">Tink</span>}
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navigationItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`nav-item ${router.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {!isCollapsed && (
                <>
                  <span className="nav-label">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="nav-badge">{item.badge}</span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        {/* Settings & Support */}
        <div className="sidebar-bottom">
          <button
            onClick={() => handleNavigation('/settings')}
            className="nav-item"
          >
            <span className="nav-icon"><SettingsIcon /></span>
            {!isCollapsed && <span className="nav-label">Settings</span>}
          </button>

          <button
            onClick={() => handleNavigation('/support')}
            className="nav-item"
          >
            <span className="nav-icon"><SupportIcon /></span>
            {!isCollapsed && <span className="nav-label">Support</span>}
          </button>
        </div>

        {/* User Profile */}
        <div className="sidebar-user">
          {!isCollapsed ? (
            <div className="user-info">
              <div className="user-avatar">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="user-details">
                <div className="user-name">{user?.full_name || 'User'}</div>
                <div className="user-role">
                  {isAdmin() ? 'Platform Admin' : isLandlord() ? 'Business Owner' : 'Property Manager'}
                </div>
              </div>
              <button onClick={handleLogout} className="logout-btn">
                <LogoutIcon />
              </button>
            </div>
          ) : (
            <div className="user-info-collapsed">
              <div className="user-avatar-collapsed">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <button onClick={handleLogout} className="logout-btn-collapsed">
                <LogoutIcon />
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          width: 320px;
          height: 100vh;
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          transition: width 0.3s ease;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .sidebar.collapsed {
          width: 90px;
        }

        .sidebar-header {
          padding: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          height: 84px;
          display: flex;
          align-items: center;
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 700;
          color: white;
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
        }

        .logo-text {
          font-size: 24px;
          font-weight: 700;
          color: white;
          white-space: nowrap;
        }

        .sidebar-nav {
          flex: 1;
          padding: 20px 16px;
          overflow-y: auto;
        }

        .sidebar-nav::-webkit-scrollbar {
          width: 4px;
        }

        .sidebar-nav::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }

        .sidebar-nav::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 16px;
          margin-bottom: 8px;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          font-size: 16px;
          font-weight: 500;
          position: relative;
          gap: 16px;
        }

        .sidebar.collapsed .nav-item {
          justify-content: center;
          padding: 16px;
          width: 54px;
          height: 54px;
          margin: 0 auto 12px auto;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.9);
          transform: translateX(4px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .sidebar.collapsed .nav-item:hover {
          transform: none;
          box-shadow: 0 4px 20px rgba(255, 255, 255, 0.1);
        }

        .nav-item.active {
          background: rgba(102, 126, 234, 0.2);
          color: #667eea;
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.2);
        }

        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .nav-label {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .nav-badge {
          background: #ef4444;
          color: white;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 12px;
          min-width: 20px;
          text-align: center;
          line-height: 1;
        }

        .sidebar-bottom {
          padding: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .sidebar-user {
          padding: 20px 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-info-collapsed {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .user-avatar,
        .user-avatar-collapsed {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 600;
          color: white;
          flex-shrink: 0;
        }

        .user-details {
          flex: 1;
          min-width: 0;
        }

        .user-name {
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .logout-btn,
        .logout-btn-collapsed {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .logout-btn:hover,
        .logout-btn-collapsed:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
          }

          .sidebar:not(.collapsed) {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
} 