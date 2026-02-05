import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSupabaseAuth } from '../lib/supabase-auth-context';
import { 
  Inbox, 
  Settings, 
  LogOut, 
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ReactElement;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const router = useRouter();
  const { profile, organization, signOut } = useSupabaseAuth();
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);

  // Determine if sidebar should appear expanded
  const shouldShowExpanded = !isCollapsed || isHoverExpanded;

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSidebarMouseEnter = () => {
    if (isCollapsed) {
      setIsHoverExpanded(true);
    }
  };

  const handleSidebarMouseLeave = () => {
    if (isCollapsed) {
            setIsHoverExpanded(false);
    }
  };

  // Navigation items for SquareFt Phase 1
  const navigationItems: NavigationItem[] = [
    { 
      path: '/dashboard/tickets', 
      label: 'Tickets', 
      icon: <Inbox size={20} /> 
    },
  ];

  const bottomItems: NavigationItem[] = [
    { 
      path: '/dashboard/settings', 
      label: 'Settings', 
      icon: <Settings size={20} /> 
    },
  ];

  const isActive = (path: string) => {
    return router.pathname === path || router.pathname.startsWith(path + '/');
  };

  return (
    <>
      <div 
        className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isHoverExpanded ? 'hover-expanded' : ''}`}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
      >
        {/* Header */}
        <div className="sidebar-header">
          <div className="logo-container">
            <img src="/logo1.png" alt="SquareFt" className="logo-img" />
                {shouldShowExpanded && (
              <span className="logo-text">SquareFt</span>
            )}
                        </div>
          <button className="collapse-btn" onClick={onToggle}>
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                      </button>
        </div>

        {/* Organization Badge */}
        {shouldShowExpanded && organization && (
          <div className="org-badge">
            <span className="org-name">{organization.name}</span>
                </div>
              )}

        {/* Main Navigation */}
        <nav className="sidebar-nav">
          {navigationItems.map((item) => (
            <Link
                    key={item.path}
              href={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              {shouldShowExpanded && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Bottom Navigation */}
        <div className="sidebar-bottom">
          {bottomItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              {shouldShowExpanded && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </div>

        {/* User Profile */}
        <div className="sidebar-user">
          {shouldShowExpanded ? (
            <div className="user-info">
              <div className="user-avatar">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="user-details">
                <div className="user-name">{profile?.full_name || 'User'}</div>
                <div className="user-role">Property Manager</div>
                </div>
              <button onClick={handleLogout} className="logout-btn" title="Sign out">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="user-info-collapsed">
              <div className="user-avatar-collapsed">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
              <button onClick={handleLogout} className="logout-btn-collapsed" title="Sign out">
                <LogOut size={18} />
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
        }

        .sidebar.collapsed {
          width: 70px;
        }

        .sidebar.collapsed.hover-expanded {
          width: 240px;
          box-shadow: 4px 0 20px rgba(0, 0, 0, 0.3);
        }

        /* Header */
        .sidebar-header {
          padding: 16px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-img {
          width: 32px;
          height: 32px;
          object-fit: contain;
        }

        .logo-text {
          font-size: 20px;
          font-weight: 800;
          color: white;
          white-space: nowrap;
        }

        .collapse-btn {
          width: 28px;
          height: 28px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.2s;
        }

        .collapse-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: white;
        }

        .sidebar.collapsed .collapse-btn {
          display: none;
        }

        .sidebar.collapsed.hover-expanded .collapse-btn {
          display: flex;
        }

        /* Organization Badge */
        .org-badge {
          padding: 0 16px;
          margin: 12px 0;
        }

        .org-name {
          display: block;
          padding: 8px 12px;
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #93c5fd;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Navigation */
        .sidebar-nav {
          flex: 1;
          padding: 16px 12px;
          overflow-y: auto;
        }

        .nav-item {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 12px 16px;
          margin-bottom: 6px;
          color: rgba(255, 255, 255, 0.7);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          gap: 12px;
        }

        .sidebar.collapsed .nav-item {
          justify-content: center;
          padding: 12px;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .nav-item.active {
          background: rgba(59, 130, 246, 0.2);
          color: white;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .nav-label {
          white-space: nowrap;
        }

        /* Bottom */
        .sidebar-bottom {
          padding: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* User */
        .sidebar-user {
          padding: 16px;
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
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
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
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
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
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .logout-btn:hover,
        .logout-btn-collapsed:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        /* Mobile */
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
