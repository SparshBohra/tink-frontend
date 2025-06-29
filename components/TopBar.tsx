import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';

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

export default function TopBar({ onSidebarToggle, isSidebarCollapsed }: TopBarProps) {
  const { user, isAdmin, isLandlord, isManager } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

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

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
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

  return (
    <>
      <div className={`topbar ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="topbar-left">
          <button className="sidebar-toggle" onClick={onSidebarToggle}>
            <span className="hamburger"></span>
          </button>
          
          <div className="search-container">
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
          </div>
        </div>

        <div className="topbar-center">
          <div className="page-title">
            <h1>Good evening, {user?.full_name?.split(' ')[0] || 'User'}</h1>
            <p>Here's what's happening with your properties today.</p>
          </div>
        </div>

        <div className="topbar-right">
          <div className="action-buttons">
            <button className="action-btn">
              <span className="btn-icon"><MessagesIcon /></span>
              <span className="btn-label">Messages</span>
            </button>
            
            <div className="notifications-container">
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

          <div className="user-menu">
            <div className="user-info">
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
          </div>
        </div>
      </div>

      <style jsx>{`
        .topbar {
          position: fixed;
          top: 0;
          left: 320px;
          right: 0;
          height: 84px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: center;
          padding: 0 32px;
          z-index: 999;
          transition: left 0.3s ease;
        }

        .topbar.sidebar-collapsed {
          left: 90px;
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .sidebar-toggle {
          background: none;
          border: none;
          cursor: pointer;
          padding: 10px;
          border-radius: 12px;
          transition: background 0.2s ease;
        }

        .sidebar-toggle:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .hamburger {
          display: block;
          width: 24px;
          height: 3px;
          background: #374151;
          position: relative;
        }

        .hamburger::before,
        .hamburger::after {
          content: '';
          position: absolute;
          width: 24px;
          height: 3px;
          background: #374151;
          transition: transform 0.2s ease;
        }

        .hamburger::before {
          top: -8px;
        }

        .hamburger::after {
          bottom: -8px;
        }

        .search-container {
          min-width: 420px;
        }

        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 20px;
          color: #9ca3af;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .search-input {
          width: 100%;
          padding: 18px 24px 18px 56px;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          font-size: 16px;
          background: rgba(255, 255, 255, 0.8);
          transition: all 0.2s ease;
          height: 56px;
          box-sizing: border-box;
        }

        .search-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          background: white;
        }

        .topbar-center {
          flex: 1;
          text-align: center;
          max-width: 500px;
          margin: 0 auto;
        }

        .page-title h1 {
          font-size: 26px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 4px 0;
        }

        .page-title p {
          font-size: 15px;
          color: #6b7280;
          margin: 0;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .action-buttons {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 22px;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          height: 52px;
          box-sizing: border-box;
        }

        .action-btn:hover {
          background: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
          transform: translateY(-1px);
          border-color: #d1d5db;
        }

        .btn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
        }

        .btn-label {
          font-size: 16px;
          font-weight: 500;
          color: #374151;
        }

        .notification-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          background: #ef4444;
          color: white;
          font-size: 12px;
          font-weight: 600;
          padding: 3px 7px;
          border-radius: 12px;
          min-width: 20px;
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
      `}</style>
    </>
  );
} 