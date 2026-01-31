import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSupabaseAuth } from '../lib/supabase-auth-context';
import { Bell, Settings, LogOut, ChevronDown, User, Building2, Lock, X, Check } from 'lucide-react';
import SettingsModal from './SettingsModal';

// Mock notifications for demo
const mockNotifications = [
  { id: 1, title: 'New emergency ticket', message: 'Active Water Leak in Unit 402', time: '5m ago', read: false },
  { id: 2, title: 'Ticket assigned', message: 'HVAC issue assigned to maintenance', time: '1h ago', read: false },
  { id: 3, title: 'Ticket completed', message: 'Plumbing repair marked as done', time: '3h ago', read: true },
  { id: 4, title: 'New message', message: 'Tenant responded to ticket #12', time: '1d ago', read: true },
];

export default function TopBar() {
  const router = useRouter();
  const { profile, organization, signOut } = useSupabaseAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (showNotifications && notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu, showNotifications]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-container">
          <div className="topbar-left">
            <Link href="/dashboard/tickets" className="logo-section">
              <img src="/logo1.png" alt="SquareFt" className="logo-img" />
            </Link>
          </div>

          <div className="topbar-right">
            {/* Notifications */}
            <div className="notif-wrapper" ref={notifRef}>
              <button 
                className={`icon-btn ${unreadCount > 0 ? 'has-unread' : ''}`} 
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={22} />
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
              </button>

              {showNotifications && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <h3>Notifications</h3>
                    {unreadCount > 0 && (
                      <button className="mark-all-btn" onClick={markAllAsRead}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="notif-list">
                    {notifications.length === 0 ? (
                      <div className="notif-empty">No notifications</div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          className={`notif-item ${notif.read ? 'read' : 'unread'}`}
                          onClick={() => markAsRead(notif.id)}
                        >
                          <div className="notif-indicator" />
                          <div className="notif-content">
                            <div className="notif-title">{notif.title}</div>
                            <div className="notif-message">{notif.message}</div>
                            <div className="notif-time">{notif.time}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="user-menu" ref={userMenuRef}>
              <button className="user-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
                <div className="user-avatar">
                  {profile?.full_name?.charAt(0) || 'U'}
                </div>
                <ChevronDown size={16} className="chevron" />
              </button>
              
              {showUserMenu && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <div className="user-name">{profile?.full_name || 'User'}</div>
                    <div className="user-org">{organization?.name || 'Property Manager'}</div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={() => { setShowSettings(true); setShowUserMenu(false); }}>
                    <Settings size={16} />
                    Settings
                  </button>
                  <button className="dropdown-item text-red" onClick={handleLogout}>
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      <style jsx>{`
        .topbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 76px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(226, 232, 240, 0.6);
          z-index: 100;
        }

        .topbar-container {
          max-width: 1400px;
          margin: 0 auto;
          height: 100%;
          padding: 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .topbar-left {
          display: flex;
          align-items: center;
        }

        .logo-section {
          display: flex;
          align-items: center;
          text-decoration: none;
        }

        .logo-img {
          height: 44px;
          width: auto;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .notif-wrapper {
          position: relative;
        }

        .icon-btn {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          border: none;
          background: transparent;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .icon-btn:hover {
          background: rgba(0, 0, 0, 0.04);
          color: #0f172a;
        }

        .icon-btn.has-unread {
          color: #3b82f6;
        }

        .notif-badge {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 18px;
          height: 18px;
          background: #ef4444;
          color: white;
          font-size: 11px;
          font-weight: 700;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notif-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 360px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
          overflow: hidden;
          animation: slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .notif-header {
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .notif-header h3 {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .mark-all-btn {
          font-size: 12px;
          color: #3b82f6;
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 600;
        }

        .notif-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .notif-empty {
          padding: 40px;
          text-align: center;
          color: #94a3b8;
          font-size: 14px;
        }

        .notif-item {
          padding: 14px 20px;
          display: flex;
          gap: 12px;
          cursor: pointer;
          transition: background 0.1s;
          border-bottom: 1px solid #f8fafc;
        }

        .notif-item:hover {
          background: #f8fafc;
        }

        .notif-item.unread {
          background: #eff6ff;
        }

        .notif-item.unread:hover {
          background: #dbeafe;
        }

        .notif-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-top: 6px;
          flex-shrink: 0;
        }

        .notif-item.unread .notif-indicator {
          background: #3b82f6;
        }

        .notif-item.read .notif-indicator {
          background: #e2e8f0;
        }

        .notif-content {
          flex: 1;
          min-width: 0;
        }

        .notif-title {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 2px;
        }

        .notif-message {
          font-size: 13px;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .notif-time {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 4px;
        }

        .user-menu {
          position: relative;
        }

        .user-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 4px;
          border-radius: 20px;
          transition: all 0.2s;
        }

        .user-btn:hover {
          background: rgba(0, 0, 0, 0.03);
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #3b82f6;
          color: white;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
        }

        .chevron {
          color: #64748b;
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 220px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          padding: 8px;
          overflow: hidden;
          animation: slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dropdown-header {
          padding: 12px;
        }

        .user-name {
          font-weight: 600;
          color: #0f172a;
          font-size: 14px;
        }

        .user-org {
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
        }

        .dropdown-divider {
          height: 1px;
          background: #f1f5f9;
          margin: 4px 0;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          color: #475569;
          font-size: 14px;
          text-decoration: none;
          border-radius: 10px;
          border: none;
          background: transparent;
          width: 100%;
          cursor: pointer;
          transition: all 0.2s;
        }

        .dropdown-item:hover {
          background: #f8fafc;
          color: #0f172a;
        }

        .dropdown-item.text-red {
          color: #ef4444;
        }

        .dropdown-item.text-red:hover {
          background: #fef2f2;
        }

        @media (max-width: 768px) {
          .topbar-container {
            padding: 0 16px;
          }

          .notif-dropdown {
            width: 300px;
            right: -50px;
          }
        }
      `}</style>
    </>
  );
}
