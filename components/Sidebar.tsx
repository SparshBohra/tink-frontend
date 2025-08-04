import React, { useState, useEffect, useRef } from 'react';
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
  hasDropdown?: boolean;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const router = useRouter();
  const { user, logout, isAdmin, isLandlord, isManager } = useAuth();
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState(0);
  const [showPropertiesDropdown, setShowPropertiesDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const propertiesNavRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPropertiesDropdown(false);
      }
    };

    const handleResize = () => {
      if (showPropertiesDropdown && propertiesNavRef.current) {
        const rect = propertiesNavRef.current.getBoundingClientRect();
        setDropdownPosition({ top: rect.top + rect.height / 2 });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, [showPropertiesDropdown]);

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
    if (path === '/properties') {
      if (propertiesNavRef.current) {
        const rect = propertiesNavRef.current.getBoundingClientRect();
        setDropdownPosition({ top: rect.top + rect.height / 2 });
      }
      setShowPropertiesDropdown(!showPropertiesDropdown);
      return;
    }
    if (path === '/settings' || path === '/support') {
      router.push('/settings');
      return;
    }
    setShowPropertiesDropdown(false);
    router.push(path);
  };

  const handleDropdownNavigation = (path: string) => {
    setShowPropertiesDropdown(false);
    router.push(path);
  };

  // SVG Icons
  const MenuIcon = () => (
    <svg width="32" height="32" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="10,1 19,7 10,13 1,7"/>
      <polyline points="1,14 10,20 19,14"/>
      <polyline points="1,10.5 10,16.5 19,10.5"/>
    </svg>
  );

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
      <circle cx="12" cy="8" r="5"/>
      <path d="M3 21V19C3 16.79 4.79 15 7 15H17C19.21 15 21 16.79 21 19V21"/>
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
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M7 15L10 12L13 15L17 9"/>
      <circle cx="7" cy="9" r="1"/>
      <circle cx="17" cy="9" r="1"/>
    </svg>
  );

  const SettingsIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.43 12.98C19.47 12.66 19.5 12.34 19.5 12C19.5 11.66 19.47 11.34 19.43 11.02L21.54 9.37C21.73 9.22 21.78 8.95 21.66 8.73L19.66 5.27C19.54 5.05 19.27 4.97 19.05 5.05L16.56 6.05C16.04 5.65 15.48 5.32 14.87 5.07L14.49 2.42C14.46 2.18 14.25 2 14 2H10C9.75 2 9.54 2.18 9.51 2.42L9.13 5.07C8.52 5.32 7.96 5.66 7.44 6.05L4.95 5.05C4.72 4.96 4.46 5.05 4.34 5.27L2.34 8.73C2.21 8.95 2.27 9.22 2.46 9.37L4.57 11.02C4.53 11.34 4.5 11.67 4.5 12C4.5 12.33 4.53 12.66 4.57 12.98L2.46 14.63C2.27 14.78 2.21 15.05 2.34 15.27L4.34 18.73C4.46 18.95 4.73 19.03 4.95 18.95L7.44 17.95C7.96 18.35 8.52 18.68 9.13 18.93L9.51 21.58C9.54 21.82 9.75 22 10 22H14C14.25 22 14.46 21.82 14.49 21.58L14.87 18.93C15.48 18.68 16.04 18.34 16.56 17.95L19.05 18.95C19.28 19.04 19.54 18.95 19.66 18.73L21.66 15.27C21.78 15.05 21.73 14.78 21.54 14.63L19.43 12.98Z"/>
    </svg>
  );

  const CommunicationIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"/>
      <path d="M8 9H16"/>
      <path d="M8 13H12"/>
    </svg>
  );

  const AccountingIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  );

  const SupportIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9C9.32 8.33 9.78 7.77 10.4 7.41C11.01 7.05 11.73 6.92 12.43 7.04C13.13 7.16 13.76 7.52 14.22 8.06C14.67 8.61 14.92 9.29 14.92 10C14.92 12 11.92 13 11.92 13"/>
      <circle cx="12" cy="17" r="0.5" fill="currentColor"/>
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
        { path: '/properties', label: 'Properties', icon: <PropertiesIcon />, hasDropdown: true },
        { path: '/leases', label: 'Leases', icon: <LeasesIcon /> },
        { path: '/tenants', label: 'People', icon: <TenantsIcon /> },
        { path: '/managers', label: 'Managers', icon: <ManagersIcon /> },
      ];
    }

    if (isLandlord()) {
      return [
        ...baseItems,
        { path: '/applications', label: 'Applications', icon: <ApplicationsIcon />, badge: pendingApplicationsCount },
        { path: '/properties', label: 'Properties', icon: <PropertiesIcon />, hasDropdown: true },
        { path: '/leases', label: 'Leases', icon: <LeasesIcon /> },
        { path: '/tenants', label: 'People', icon: <TenantsIcon /> },
        { path: '/accounting', label: 'Accounting', icon: <AccountingIcon /> },
        { path: '/communication', label: 'Communication', icon: <CommunicationIcon /> },
      ];
    }

    if (isManager()) {
      return [
        ...baseItems,
        { path: '/applications', label: 'Applications', icon: <ApplicationsIcon />, badge: pendingApplicationsCount },
        { path: '/properties', label: 'Properties', icon: <PropertiesIcon />, hasDropdown: true },
        { path: '/leases', label: 'Leases', icon: <LeasesIcon /> },
        { path: '/tenants', label: 'People', icon: <TenantsIcon /> },
        { path: '/accounting', label: 'Accounting', icon: <AccountingIcon /> },
        { path: '/communication', label: 'Communication', icon: <CommunicationIcon /> },
      ];
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Menu Section */}
        <div className="sidebar-header">
          <div className="menu-container">
            <button className="menu-toggle" onClick={onToggle}>
              <MenuIcon />
            </button>
            {!isCollapsed && <span className="logo-text">Tink</span>}
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navigationItems.map((item) => (
            <div key={item.path} className="nav-item-container" ref={item.hasDropdown ? dropdownRef : undefined}>
              <button
                ref={item.path === '/properties' ? propertiesNavRef : undefined}
                onClick={() => handleNavigation(item.path)}
                className={`nav-item ${router.pathname === item.path || (item.path === '/properties' && (router.pathname === '/properties' || router.pathname === '/listings')) ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {!isCollapsed && (
                  <>
                    <span className="nav-label">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="nav-badge">{item.badge}</span>
                    )}
                    {item.hasDropdown && (
                      <span className={`dropdown-arrow ${showPropertiesDropdown ? 'open' : ''}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9,18 15,12 9,6"/>
                        </svg>
                      </span>
                    )}
                  </>
                )}
              </button>
              
              {/* Properties Dropdown */}
              {item.hasDropdown && showPropertiesDropdown && !isCollapsed && (
                <div 
                  className="properties-dropdown"
                  style={{ top: `${dropdownPosition.top}px` }}
                >
                  <div className="dropdown-content">
                    <div className="dropdown-options">
                      <button
                        onClick={() => handleDropdownNavigation('/properties')}
                        className={`dropdown-option ${router.pathname === '/properties' ? 'active' : ''}`}
                      >
                        <div className="option-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7"/>
                            <rect x="14" y="3" width="7" height="7"/>
                            <rect x="14" y="14" width="7" height="7"/>
                            <rect x="3" y="14" width="7" height="7"/>
                          </svg>
                        </div>
                        <div className="option-content">
                          <div className="option-title">View Properties</div>
                          <div className="option-subtitle">Manage property portfolio</div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => handleDropdownNavigation('/listings')}
                        className={`dropdown-option ${router.pathname === '/listings' ? 'active' : ''}`}
                      >
                        <div className="option-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"/>
                            <path d="M14 2V8H20"/>
                            <path d="M16 13H8"/>
                            <path d="M16 17H8"/>
                          </svg>
                        </div>
                        <div className="option-content">
                          <div className="option-title">View Listings</div>
                          <div className="option-subtitle">Browse available rentals</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
          width: 240px;
          height: 100vh;
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          transition: width 0.3s ease;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          pointer-events: auto;
        }

        .sidebar.collapsed {
          width: 70px;
        }

        .sidebar-header {
          padding: 16px 28px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          height: 72px;
          display: flex;
          align-items: center;
        }

        .sidebar.collapsed .sidebar-header {
          padding: 16px;
        }

        .menu-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sidebar.collapsed .menu-container {
          width: 100%;
          justify-content: center;
        }

        .menu-toggle {
          width: 50px;
          height: 50px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.9);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .menu-toggle:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
          transform: scale(1.05);
        }

        .menu-toggle:active {
          transform: scale(0.95);
        }

        .logo-text {
          font-size: 18px;
          font-weight: 700;
          color: white;
          white-space: nowrap;
        }

        .sidebar-nav {
          flex: 1;
          padding: 16px 12px;
          overflow-y: auto;
          overflow-x: visible;
          pointer-events: auto;
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

        .nav-item-container {
          position: relative;
        }

        .nav-item {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 12px 16px;
          margin-bottom: 6px;
          border: none;
          background: transparent;
          color: rgba(243, 244, 246, 0.85);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          font-size: 14px;
          font-weight: 400;
          position: relative;
          gap: 12px;
          z-index: 10;
          pointer-events: auto;
        }

        .sidebar.collapsed .nav-item {
          justify-content: center;
          padding: 10px;
          width: 42px;
          height: 42px;
          margin: 0 auto 10px auto;
        }

        .nav-item.active {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          box-shadow: none;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
          transform: translateX(2px);
          box-shadow: none;
        }

        .nav-item:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
        }

        .nav-item:active {
          transform: translateX(1px);
          background: rgba(255, 255, 255, 0.2);
        }

        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: inherit;
          opacity: 0.85;
        }

        .nav-icon svg {
          width: 20px;
          height: 20px;
        }

        .nav-label {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .nav-badge {
          background: #ef4444;
          color: #fff;
          font-size: 10px;
          font-weight: 500;
          padding: 1px 5px;
          border-radius: 8px;
          min-width: 16px;
          text-align: center;
          line-height: 1.2;
          box-shadow: 0 2px 6px rgba(239, 68, 68, 0.15), 0 0 0 1px #fff;
          letter-spacing: 0.02em;
          display: inline-block;
        }

        .dropdown-arrow {
          transition: transform 0.3s ease;
          transform: rotate(0deg); /* Points right when closed */
        }

        .dropdown-arrow.open {
          transform: rotate(180deg); /* Points left when open */
        }

        .properties-dropdown {
          position: fixed;
          top: auto;
          left: 252px; /* Add 12px space from sidebar (240px + 12px) */
          width: 320px;
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          z-index: 1001;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          pointer-events: auto;
        }

        .sidebar.collapsed .properties-dropdown {
          left: 82px; /* Add 12px space from collapsed sidebar (70px + 12px) */
        }

        .dropdown-content {
          padding: 16px;
          display: flex;
          flex-direction: column;
        }

        .dropdown-options {
          display: flex;
          flex-direction: column;
        }

        .dropdown-option {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 12px 16px;
          margin-bottom: 6px;
          border: none;
          background: transparent;
          color: rgba(243, 244, 246, 0.85);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          font-size: 14px;
          font-weight: 400;
          position: relative;
          gap: 12px;
          z-index: 10;
          pointer-events: auto;
        }

        .dropdown-option:hover {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
          color: #ffffff;
          transform: translateX(2px);
          box-shadow: none;
        }

        .dropdown-option.active {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
          color: #ffffff;
        }

        .dropdown-option:focus {
          outline: none;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
          color: #ffffff;
        }

        .option-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: inherit;
          opacity: 0.85;
        }

        .option-icon svg {
          width: 20px;
          height: 20px;
        }

        .option-content {
          flex: 1;
        }

        .option-title {
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .option-subtitle {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar-bottom {
          padding: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .sidebar-user {
          padding: 16px 12px;
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
          width: 44px;
          height: 44px;
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

        /* Dark Mode Styles */
        :global(.dark-mode) .sidebar {
          background: #111111;
          border-right: 1px solid #333333 !important;
        }
        :global(.dark-mode) .sidebar-header {
          background: transparent;
          border-bottom: 1px solid #333333 !important;
        }
        :global(.dark-mode) .sidebar-nav::-webkit-scrollbar-track {
          background: transparent;
        }
        :global(.dark-mode) .sidebar-nav::-webkit-scrollbar-thumb {
          background: #333;
        }
        :global(.dark-mode) .nav-item.active {
          background: #222222 !important;
        }
        :global(.dark-mode) .nav-item:hover {
          background: #222222 !important;
        }
        :global(.dark-mode) .properties-dropdown {
          background: #111111 !important;
          border: 1px solid #333333 !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5) !important;
        }
        :global(.dark-mode) .dropdown-option:hover {
          background: #222222 !important;
        }
        :global(.dark-mode) .sidebar-bottom,
        :global(.dark-mode) .sidebar-user {
          border-top: 1px solid #333333 !important;
        }
        :global(.dark-mode) .logout-btn,
        :global(.dark-mode) .logout-btn-collapsed {
          background: #222222 !important;
        }
        :global(.dark-mode) .logout-btn:hover,
        :global(.dark-mode) .logout-btn-collapsed:hover {
          background: #ef4444 !important;
        }

        /* Collapsed state - hide dropdown */
        .sidebar.collapsed .properties-dropdown {
          display: none;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .properties-dropdown {
            width: 280px;
            left: 240px;
            transform: translateY(-50%);
          }

          .sidebar.collapsed .properties-dropdown {
            left: 70px;
          }
        }
      `}</style>
    </>
  );
} 