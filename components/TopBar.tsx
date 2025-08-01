import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth-context';
import { useTheme } from '../lib/theme-context';
import { apiClient } from '../lib/api';
import { GlobalSearchResponse, SearchTenantResult, SearchPropertyResult, SearchApplicationResult } from '../lib/types';

interface TopBarProps {
  onSidebarToggle: () => void;
  isSidebarCollapsed: boolean;
}

interface Notification {
  id: number;
  text: string;
  time: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read?: boolean;
}

// Icon Components
const BriefcaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
);
const HouseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
);
const LightningIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
);
const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10m12 20V4m6 20V14"></path></svg>
);
const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
);
const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3L9.27 9.27L3 12l6.27 2.73L12 21l2.73-6.27L21 12l-6.27-2.73z"></path></svg>
);
const TrendingUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
);
const TargetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
);

export default function TopBar({ onSidebarToggle, isSidebarCollapsed }: TopBarProps) {
  const router = useRouter();
  const { user, isAdmin, isLandlord, isManager, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GlobalSearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Refs for click outside detection
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle outside clicks and auto-close functionality
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Close notifications if clicking outside notifications dropdown
      if (showNotifications && notificationsRef.current && !notificationsRef.current.contains(target)) {
        setShowNotifications(false);
      }
      
      // Close user menu if clicking outside user menu dropdown
      if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }

      // Close search results if clicking outside search container
      if (showSearchResults && searchRef.current && !searchRef.current.contains(target)) {
        setShowSearchResults(false);
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications, showUserMenu, showSearchResults]);

  // Auto-close menus when other menus are opened
  useEffect(() => {
    if (showNotifications) {
      setShowUserMenu(false);
      setShowSearchResults(false);
    }
  }, [showNotifications]);

  useEffect(() => {
    if (showUserMenu) {
      setShowNotifications(false);
      setShowSearchResults(false);
    }
  }, [showUserMenu]);

  useEffect(() => {
    if (showSearchResults) {
      setShowNotifications(false);
      setShowUserMenu(false);
    }
  }, [showSearchResults]);

  // Debounced search functionality
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await apiClient.globalSearch(searchQuery);
          setSearchResults(results);
          setShowSearchResults(true);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults(null);
        } finally {
          setIsSearching(false);
        }
      }, 300); // 300ms debounce
    } else {
      setSearchResults(null);
      setShowSearchResults(false);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Navigate to search result
  const handleResultClick = (result: SearchTenantResult | SearchPropertyResult | SearchApplicationResult) => {
    if (result.type === 'tenant') {
      router.push(`/tenants/${result.id}`);
    } else if (result.type === 'property') {
      router.push(`/properties/${result.id}`);
    } else if (result.type === 'application') {
      router.push(`/applications?highlight=${result.id}`);
    }
    setShowSearchResults(false);
    setSearchQuery('');
  };

  // Fetch real notifications data
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const notificationsData: Notification[] = [];
        
        // Fetch pending applications and add to notifications
        if (isLandlord() || isManager()) {
          try {
            const applications = await apiClient.getPendingApplications();
            if (Array.isArray(applications) && applications.length > 0) {
              applications.forEach((app: any, index: number) => {
                notificationsData.push({
                  id: app.id || (1000 + index),
                  text: `New application received for ${app.property_name || 'property'} - ${app.tenant_name || `Applicant ${app.tenant || 'Unknown'}`}`,
                  time: getRelativeTime(app.created_at || new Date()),
                  type: 'info',
                  read: false
                });
              });
            }
          } catch (error) {
            console.warn('Failed to fetch applications for notifications:', error);
          }
        }

        // Only use pending applications - remove other mock notifications to match sidebar count
        setNotifications(notificationsData);
        setUnreadCount(notificationsData.filter(n => !n.read).length);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    if (user) {
      fetchNotifications();
      // Refresh notifications every 60 seconds
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user, isAdmin, isLandlord, isManager]);

  const getRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const getRoleTitle = () => {
    if (isAdmin()) return 'Platform Admin';
    if (isLandlord()) return 'Business Owner';
    if (isManager()) return 'Property Manager';
    return 'User';
  };

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSettings = () => {
    router.push('/settings');
    setShowUserMenu(false);
  };

  // SVG Icons
  const SearchIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35"/>
    </svg>
  );

  const MessagesIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );

  const NotificationsIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );

  const SettingsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.43 12.98C19.47 12.66 19.5 12.34 19.5 12C19.5 11.66 19.47 11.34 19.43 11.02L21.54 9.37C21.73 9.22 21.78 8.95 21.66 8.73L19.66 5.27C19.54 5.05 19.27 4.97 19.05 5.05L16.56 6.05C16.04 5.65 15.48 5.32 14.87 5.07L14.49 2.42C14.46 2.18 14.25 2 14 2H10C9.75 2 9.54 2.18 9.51 2.42L9.13 5.07C8.52 5.32 7.96 5.66 7.44 6.05L4.95 5.05C4.72 4.96 4.46 5.05 4.34 5.27L2.34 8.73C2.21 8.95 2.27 9.22 2.46 9.37L4.57 11.02C4.53 11.34 4.5 11.67 4.5 12C4.5 12.33 4.53 12.66 4.57 12.98L2.46 14.63C2.27 14.78 2.21 15.05 2.34 15.27L4.34 18.73C4.46 18.95 4.73 19.03 4.95 18.95L7.44 17.95C7.96 18.35 8.52 18.68 9.13 18.93L9.51 21.58C9.54 21.82 9.75 22 10 22H14C14.25 22 14.46 21.82 14.49 21.58L14.87 18.93C15.48 18.68 16.04 18.34 16.56 17.95L19.05 18.95C19.28 19.04 19.54 18.95 19.66 18.73L21.66 15.27C21.78 15.05 21.73 14.78 21.54 14.63L19.43 12.98Z"/>
    </svg>
  );

  const LogoutIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H9"/>
      <path d="M16 17L21 12L16 7"/>
      <path d="M21 12H9"/>
    </svg>
  );

  const MoonIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );

  const SunIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5"/>
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  );

  return (
    <>
      <div className={`topbar ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="topbar-left">
          <div className="greeting-section">
            <span className="greeting-text">
              {getTimeBasedGreeting()}, {user?.full_name?.split(' ')[0] || 'User'}
            </span>
          </div>
          <div className="search-container" ref={searchRef}>
            <div className="search-input-wrapper">
              <span className="search-icon"><SearchIcon /></span>
              <input
                type="text"
                placeholder="Search properties, tenants, applications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            {showSearchResults && (
              <div className="search-results-dropdown">
                <div className="search-results-header">
                  <h3>Search Results</h3>
                  {isSearching && <span className="search-loading">Searching...</span>}
                </div>
                <div className="search-results-list">
                  {searchResults?.tenants && searchResults.tenants.length > 0 && (
                    <div className="search-results-section">
                      <h4>Tenants</h4>
                      {searchResults.tenants.map((tenant) => (
                                                 <div key={tenant.id} className="search-result-item" onClick={() => handleResultClick(tenant)}>
                           <span className="result-icon"><BriefcaseIcon /></span>
                           <span className="result-text">{tenant.full_name}</span>
                         </div>
                      ))}
                    </div>
                  )}
                  {searchResults?.properties && searchResults.properties.length > 0 && (
                    <div className="search-results-section">
                      <h4>Properties</h4>
                      {searchResults.properties.map((property) => (
                                                 <div key={property.id} className="search-result-item" onClick={() => handleResultClick(property)}>
                           <span className="result-icon"><HouseIcon /></span>
                           <span className="result-text">{property.name}</span>
                         </div>
                      ))}
                    </div>
                  )}
                  {searchResults?.applications && searchResults.applications.length > 0 && (
                    <div className="search-results-section">
                      <h4>Applications</h4>
                      {searchResults.applications.map((application) => (
                        <div key={application.id} className="search-result-item" onClick={() => handleResultClick(application)}>
                          <span className="result-icon"><BriefcaseIcon /></span>
                          <span className="result-text">{application.property_name || 'Unknown Property'} - {application.tenant_name || 'Unknown Tenant'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                                     {searchResults?.total_results === 0 && (
                    <div className="search-result-item">
                      <span className="result-icon"><SparklesIcon /></span>
                      <span className="result-text">No results found for "{searchQuery}"</span>
                    </div>
                  )}
                </div>
                <div className="search-results-footer">
                  <button className="view-all-btn">View all results</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="topbar-center">
          {/* This space is now intentionally left blank */}
        </div>

        <div className="topbar-right">
          <div className="action-buttons">
            <button className="action-btn">
              <span className="btn-icon"><MessagesIcon /></span>
              <span className="btn-label">Messages</span>
            </button>
            
            <div className="notifications-container" ref={notificationsRef}>
              <button 
                className="action-btn notification-btn"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <span className="btn-icon"><NotificationsIcon /></span>
                <span className="btn-label">Notifications</span>
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>
              
              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <h3>Notifications</h3>
                    {unreadCount > 0 && (
                      <button className="mark-all-read" onClick={markAllAsRead}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="notifications-list">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div key={notif.id} className={`notification-item ${notif.type} ${notif.read ? 'read' : 'unread'}`}>
                          <div className="notification-content">
                            <p>{notif.text}</p>
                            <span className="notification-time">{notif.time}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="notification-item">
                        <div className="notification-content">
                          <p>No new notifications</p>
                          <span className="notification-time">All caught up!</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="notifications-footer">
                    <button className="view-all-btn">View all notifications</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="user-menu" ref={userMenuRef}>
            <div className="user-info" onClick={() => setShowUserMenu(!showUserMenu)}>
              {isSidebarCollapsed && (
                <div className="user-details">
                  <div className="user-name">{user?.full_name || user?.username || 'User'}</div>
                  <div className="user-role">{getRoleTitle()}</div>
                </div>
              )}
              <div className="user-avatar">
                {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </div>
            </div>
            
            {showUserMenu && (
              <div className="user-dropdown">
                <div className="user-dropdown-header">
                  <div className="user-avatar-small">
                    {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                  </div>
                  <div className="user-info-dropdown">
                    <div className="user-name-dropdown">{user?.full_name || user?.username || 'User'}</div>
                    <div className="user-role-dropdown">{getRoleTitle()}</div>
                  </div>
                </div>
                <div className="user-dropdown-divider"></div>
                <div className="user-dropdown-items">
                  <button className="user-dropdown-item" onClick={toggleDarkMode}>
                    <span className="dropdown-icon">
                      {isDarkMode ? <SunIcon /> : <MoonIcon />}
                    </span>
                    <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>
                  <button className="user-dropdown-item" onClick={handleSettings}>
                    <span className="dropdown-icon"><SettingsIcon /></span>
                    <span>Settings</span>
                  </button>
                  <button className="user-dropdown-item logout" onClick={handleLogout}>
                    <span className="dropdown-icon"><LogoutIcon /></span>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        :global(body) {
          margin: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          background-color: #f8f9fa;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 72px;
          background-color: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          padding: 0 24px;
          position: fixed;
          top: 0;
          left: 240px;
          right: 0;
          z-index: 999;
          transition: left 0.3s ease;
        }

        .topbar.sidebar-collapsed {
          left: 70px;
        }

        .topbar-left {
          display: flex;
          align-items: center;
          flex-grow: 1;
        }

        .greeting-section {
          padding-left: 12px;
          margin-right: 24px;
        }

        .greeting-text {
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
          white-space: nowrap;
        }

        .search-container {
          flex-grow: 1;
          max-width: 600px;
          position: relative;
        }

        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 16px;
          color: #9ca3af;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .search-input {
          width: 100%;
          padding: 12px 20px 12px 46px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          font-size: 14px;
          background: rgba(255, 255, 255, 0.8);
          transition: all 0.2s ease;
          height: 44px;
          box-sizing: border-box;
        }

        .search-input::placeholder {
          color: #9ca3af;
          font-size: 14px;
        }

        .search-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          background: white;
        }

        .search-results-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          width: 100%;
          max-height: 300px;
          overflow-y: auto;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          z-index: 1000;
          max-height: 400px;
          overflow: hidden;
        }

        .search-results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px 16px;
          border-bottom: 1px solid #f3f4f6;
        }

        .search-results-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .search-loading {
          font-size: 14px;
          color: #6b7280;
        }

        .search-results-list {
          padding: 0 24px 16px;
        }

        .search-results-section {
          margin-bottom: 16px;
        }

        .search-results-section h4 {
          font-size: 14px;
          font-weight: 600;
          color: #4b5563;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid #f3f4f6;
        }

        .search-result-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .search-result-item:hover {
          background: #f9fafb;
        }

        .result-icon {
          color: #667eea;
          font-size: 20px;
        }

        .result-text {
          font-size: 14px;
          color: #374151;
          flex-grow: 1;
        }

        .search-results-footer {
          padding: 16px 24px;
          border-top: 1px solid #f3f4f6;
        }

        .view-all-btn {
          width: 100%;
          padding: 8px;
          background: none;
          border: none;
          color: #667eea;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border-radius: 8px;
          transition: background 0.2s ease;
        }

        .view-all-btn:hover {
          background: #f3f4f6;
        }

        .topbar-center {
          flex: 1;
          text-align: center;
          max-width: 500px;
          margin: 0 auto;
        }

        .page-title h1 {
          font-size: 22px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 4px 0;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 16px; /* Evenly space all items */
        }

        .action-buttons {
          display: flex;
          align-items: center;
          gap: 16px; /* Match the main gap */
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 18px;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          height: 44px;
          box-sizing: border-box;
        }

        .action-btn:hover {
          background: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
          transform: translateY(-1px);
          border-color: #d1d5db;
        }

        .btn-icon svg {
          width: 22px;
          height: 22px;
        }

        .btn-label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .notification-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ef4444;
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
        }

        .notifications-container {
          position: relative;
        }

        .notifications-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 380px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          z-index: 1000;
          max-height: 400px;
          overflow: hidden;
        }

        .notifications-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px 16px;
          border-bottom: 1px solid #f3f4f6;
        }

        .notifications-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .mark-all-read {
          background: none;
          border: none;
          color: #667eea;
          font-size: 14px;
          cursor: pointer;
          font-weight: 500;
        }

        .notifications-list {
          max-height: 280px;
          overflow-y: auto;
        }

        .notification-item {
          padding: 16px 24px;
          border-bottom: 1px solid #f9fafb;
          cursor: pointer;
          transition: background 0.2s ease;
          position: relative;
        }

        .notification-item:hover {
          background: #f9fafb;
        }

        .notification-item:last-child {
          border-bottom: none;
        }

        .notification-item.unread {
          background: rgba(102, 126, 234, 0.02);
        }

        .notification-item.unread::before {
          content: '';
          position: absolute;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          background: #667eea;
          border-radius: 50%;
        }

        .notification-content p {
          font-size: 14px;
          color: #374151;
          margin: 0 0 4px 0;
          line-height: 1.4;
        }

        .notification-time {
          font-size: 12px;
          color: #9ca3af;
        }

        .notifications-footer {
          padding: 16px 24px;
          border-top: 1px solid #f3f4f6;
        }

        .view-all-btn {
          width: 100%;
          padding: 8px;
          background: none;
          border: none;
          color: #667eea;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border-radius: 8px;
          transition: background 0.2s ease;
        }

        .view-all-btn:hover {
          background: #f3f4f6;
        }

        .user-menu {
          display: flex;
          align-items: center;
          position: relative;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          padding: 10px 14px;
          border-radius: 14px;
          transition: background 0.2s ease;
          min-width: fit-content;
        }

        .user-info:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .user-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 280px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          z-index: 1000;
          overflow: hidden;
        }

        .user-dropdown-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 24px 16px;
        }

        .user-avatar-small {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 16px;
          color: white;
          flex-shrink: 0;
        }

        .user-info-dropdown {
          flex: 1;
          min-width: 0;
        }

        .user-name-dropdown {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          line-height: 1.2;
          margin-bottom: 2px;
        }

        .user-role-dropdown {
          font-size: 13px;
          color: #6b7280;
          line-height: 1.2;
        }

        .user-dropdown-divider {
          height: 1px;
          background: #f3f4f6;
          margin: 0 16px;
        }

        .user-dropdown-items {
          padding: 8px 0;
        }

        .user-dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 24px;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: background 0.2s ease;
          font-size: 15px;
          color: #374151;
        }

        .user-dropdown-item:hover {
          background: #f9fafb;
        }

        .user-dropdown-item.logout {
          color: #dc2626;
        }

        .user-dropdown-item.logout:hover {
          background: #fef2f2;
        }

        .dropdown-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
        }

        .user-dropdown-item.logout .dropdown-icon {
          color: #dc2626;
        }

        .user-details {
          text-align: right;
        }

        .user-name {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          line-height: 1.2;
        }

        .user-role {
          font-size: 13px;
          color: #6b7280;
          line-height: 1.2;
        }

        .user-avatar {
          width: 42px;
          height: 42px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 16px;
          color: white;
        }

        @media (max-width: 768px) {
          .topbar {
            left: 0;
            padding: 0 20px;
          }

          .topbar.sidebar-collapsed {
            left: 0;
          }

          .topbar-center {
            display: none;
          }

          .search-container {
            min-width: 240px;
          }

          .search-input {
            height: 48px;
            padding: 14px 18px 14px 48px;
            font-size: 15px;
          }

          .search-icon {
            left: 16px;
          }

          .action-btn {
            height: 44px;
            padding: 12px 16px;
          }

          .btn-label {
            display: none;
          }

          .user-details {
            display: none;
          }

          .user-avatar {
            width: 36px;
            height: 36px;
            font-size: 14px;
          }
        }

        /* Dark Mode Styles */
        :global(.dark-mode) .topbar {
          background: rgba(10, 10, 10, 0.85); /* near-black transparent */
          backdrop-filter: blur(20px);
          border-bottom: 1px solid #333333 !important;
        }
        :global(.dark-mode) .search-input {
          background: #1a1a1a !important;
          border-color: #333333 !important;
        }
        :global(.dark-mode) .search-input:focus {
          background: #222222 !important;
          border-color: #ffffff !important;
          box-shadow: none !important;
        }
        :global(.dark-mode) .action-btn {
          background: transparent !important;
          border: 1px solid #333333 !important;
        }
        :global(.dark-mode) .action-btn:hover {
          background: #222222 !important;
          border-color: #ffffff !important;
        }
        :global(.dark-mode) .user-info:hover {
          background: #222222 !important;
        }
        :global(.dark-mode) .user-dropdown,
        :global(.dark-mode) .notifications-dropdown {
          background: #111111 !important;
          border: 1px solid #333333 !important;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4) !important;
        }
        :global(.dark-mode) .user-dropdown-divider,
        :global(.dark-mode) .notifications-header,
        :global(.dark-mode) .notifications-footer,
        :global(.dark-mode) .notification-item {
          border-color: #333333 !important;
        }
        :global(.dark-mode) .user-dropdown-item:hover,
        :global(.dark-mode) .notification-item:hover,
        :global(.dark-mode) .view-all-btn:hover {
          background: #222222 !important;
        }
        :global(.dark-mode) .user-dropdown-item.logout:hover {
          background: rgba(239, 68, 68, 0.2) !important;
        }
        :global(.dark-mode) .notification-item.unread {
          background: rgba(59, 130, 246, 0.1) !important;
        }
        :global(.dark-mode) .notification-item.unread::before {
          background: #3b82f6 !important;
        }
      `}</style>
    </>
  );
} 