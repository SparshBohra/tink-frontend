import React, { useState } from 'react';
import Head from 'next/head';
import { useAuth, withAuth } from '../lib/auth-context';

function TenantAnnouncements() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all');
  
  const [announcements, setAnnouncements] = useState([
    {
      id: 1,
      title: 'Building Maintenance Schedule',
      type: 'maintenance',
      urgent: false,
      content: 'The building will undergo routine maintenance on February 15th, 2024. Water may be temporarily shut off between 9 AM and 12 PM. Please plan accordingly.',
      author: 'Property Management',
      date: '2024-01-25',
      expiryDate: '2024-02-15',
      read: false
    },
    {
      id: 2,
      title: 'URGENT: Elevator Out of Service',
      type: 'maintenance',
      urgent: true,
      content: 'The main elevator is currently out of service due to technical issues. Please use the stairs or the service elevator. We apologize for the inconvenience.',
      author: 'Maintenance Team',
      date: '2024-01-28',
      expiryDate: '2024-02-05',
      read: false
    },
    {
      id: 3,
      title: 'Rent Payment Due Date Reminder',
      type: 'payment',
      urgent: false,
      content: 'Friendly reminder that rent payments are due on the 1st of each month. Late fees apply after the 5th. You can now pay online through the tenant portal.',
      author: 'Property Management',
      date: '2024-01-20',
      expiryDate: '2024-12-31',
      read: true
    },
    {
      id: 4,
      title: 'Community BBQ Event',
      type: 'events',
      urgent: false,
      content: 'Join us for a community BBQ in the courtyard on February 10th at 6 PM. Food and drinks will be provided. RSVP by February 5th.',
      author: 'Community Manager',
      date: '2024-01-22',
      expiryDate: '2024-02-10',
      read: true
    },
    {
      id: 5,
      title: 'New Parking Regulations',
      type: 'general',
      urgent: false,
      content: 'Please note the new parking regulations effective February 1st. Visitor parking is now limited to 2 hours during weekdays. See the full policy attached.',
      author: 'Property Management',
      date: '2024-01-18',
      expiryDate: '2024-06-01',
      read: false
    }
  ]);

  const filterAnnouncements = (type: string) => {
    if (type === 'all') return announcements;
    return announcements.filter(a => a.type === type);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'maintenance': return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      );
      case 'payment': return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
          <line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
      );
      case 'events': return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      );
      case 'general': return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
        </svg>
      );
      default: return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
        </svg>
      );
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'maintenance': return 'var(--warning-amber)';
      case 'payment': return 'var(--primary-blue)';
      case 'events': return 'var(--success-green)';
      case 'general': return 'var(--gray-600)';
      default: return 'var(--gray-600)';
    }
  };

  const markAsRead = (id: number) => {
    setAnnouncements(announcements.map(a => 
      a.id === id ? { ...a, read: true } : a
    ));
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  const filteredAnnouncements = filterAnnouncements(activeFilter);
  const urgentAnnouncements = announcements.filter(a => a.urgent && !isExpired(a.expiryDate));
  const unreadCount = announcements.filter(a => !a.read).length;

  return (
    <div className="tenant-announcements">
      <Head>
        <title>Announcements - Tenant Portal</title>
      </Head>

      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Announcements</h1>
        <p className="page-subtitle">Stay updated with property news and important notices</p>
        {unreadCount > 0 && (
          <div className="unread-badge">
            {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Urgent Announcements */}
      {urgentAnnouncements.length > 0 && (
        <div className="urgent-section">
          <h2 className="urgent-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline-block', marginRight: '8px'}}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Urgent Announcements
        </h2>
          <div className="urgent-grid">
            {urgentAnnouncements.map((announcement) => (
              <div key={announcement.id} className="urgent-card">
                <div className="urgent-header">
                  <div className="urgent-icon">{getTypeIcon(announcement.type)}</div>
                  <div className="urgent-content">
                    <h3 className="urgent-card-title">{announcement.title}</h3>
                    <div className="urgent-meta">
                      <span className="urgent-author">By {announcement.author}</span>
                      <span className="urgent-date">{announcement.date}</span>
                    </div>
                  </div>
                </div>
                <p className="urgent-text">{announcement.content}</p>
                {!announcement.read && (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => markAsRead(announcement.id)}
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          All ({announcements.length})
        </button>
        <button
          className={`filter-tab ${activeFilter === 'general' ? 'active' : ''}`}
          onClick={() => setActiveFilter('general')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline-block', marginRight: '4px'}}>
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
          </svg>
          General ({announcements.filter(a => a.type === 'general').length})
        </button>
        <button
          className={`filter-tab ${activeFilter === 'maintenance' ? 'active' : ''}`}
          onClick={() => setActiveFilter('maintenance')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline-block', marginRight: '4px'}}>
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          Maintenance ({announcements.filter(a => a.type === 'maintenance').length})
        </button>
        <button
          className={`filter-tab ${activeFilter === 'payment' ? 'active' : ''}`}
          onClick={() => setActiveFilter('payment')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline-block', marginRight: '4px'}}>
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
          Payment ({announcements.filter(a => a.type === 'payment').length})
        </button>
        <button
          className={`filter-tab ${activeFilter === 'events' ? 'active' : ''}`}
          onClick={() => setActiveFilter('events')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline-block', marginRight: '4px'}}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Events ({announcements.filter(a => a.type === 'events').length})
        </button>
      </div>

      {/* Announcements List */}
      <div className="announcements-section">
        <div className="announcements-grid">
          {filteredAnnouncements.map((announcement) => (
            <div 
              key={announcement.id} 
              className={`announcement-card ${!announcement.read ? 'unread' : ''} ${isExpired(announcement.expiryDate) ? 'expired' : ''}`}
            >
              <div className="announcement-header">
                <div className="announcement-icon">
                  {getTypeIcon(announcement.type)}
                </div>
                <div className="announcement-content">
                  <h3 className="announcement-title">
                    {announcement.title}
                    {announcement.urgent && (
                      <span className="urgent-indicator">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                          <line x1="12" y1="9" x2="12" y2="13"/>
                          <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                      </span>
                    )}
                  </h3>
                  <div className="announcement-meta">
                    <span 
                      className="announcement-type"
                      style={{ color: getTypeColor(announcement.type) }}
                    >
                      {announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1)}
                    </span>
                    <span className="announcement-author">By {announcement.author}</span>
                    <span className="announcement-date">{announcement.date}</span>
                  </div>
                </div>
                {!announcement.read && (
                  <div className="unread-dot"></div>
                )}
              </div>
              
              <p className="announcement-text">{announcement.content}</p>
              
              <div className="announcement-footer">
                <div className="announcement-expiry">
                  {isExpired(announcement.expiryDate) ? (
                    <span className="expired-text">Expired</span>
                  ) : (
                    <span className="expiry-text">Valid until {announcement.expiryDate}</span>
                  )}
                </div>
                {!announcement.read && (
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => markAsRead(announcement.id)}
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .tenant-announcements {
          width: 100%;
          padding: 32px 40px 20px 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          box-sizing: border-box;
        }

        .page-header {
          margin-bottom: 24px;
          position: relative;
        }

        .page-title {
          font-size: 22px;
          font-weight: 700;
          color: white;
          margin: 0 0 4px 0;
          line-height: 1.15;
        }

        .page-subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
          line-height: 1.45;
        }

        .unread-badge {
          position: absolute;
          top: 0;
          right: 0;
          background: #dc2626;
          color: white;
          padding: 4px 8px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 600;
        }

        .urgent-section {
          background: linear-gradient(135deg, #fff5f5, #fed7d7);
          border: 2px solid #dc2626;
          border-radius: 16px;
          padding: 18px;
          margin-bottom: 20px;
        }

        .urgent-title {
          font-size: 16px;
          font-weight: 700;
          color: #dc2626;
          margin: 0 0 16px 0;
        }

        .urgent-grid {
          display: grid;
          gap: 16px;
        }

        .urgent-card {
          background: white;
          border: 1px solid #dc2626;
          border-radius: 12px;
          padding: 16px;
        }

        .urgent-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
        }

        .urgent-icon {
          font-size: 1.5rem;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fed7d7;
          border-radius: 8px;
          flex-shrink: 0;
        }

        .urgent-content {
          flex: 1;
        }

        .urgent-card-title {
          font-size: 14px;
          font-weight: 600;
          color: #dc2626;
          margin: 0 0 8px 0;
        }

        .urgent-meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #64748b;
        }

        .urgent-author {
          font-weight: 500;
        }

        .urgent-text {
          color: #374151;
          margin: 0 0 12px 0;
          font-size: 14px;
        }

        .filter-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          overflow-x: auto;
          padding-bottom: 8px;
        }

        .filter-tab {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          border-radius: 16px;
          background: white;
          color: #64748b;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .filter-tab:hover {
          background: #f9fafb;
        }

        .filter-tab.active {
          background: #4f46e5;
          color: white;
          border-color: #4f46e5;
        }

        .announcements-section {
          background: white;
          border-radius: 16px;
          padding: 18px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        .announcements-grid {
          display: grid;
          gap: 16px;
        }

        .announcement-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          transition: all 0.2s ease;
        }

        .announcement-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          transform: translateY(-2px);
        }

        .announcement-card.unread {
          border-color: #4f46e5;
          background: #f8faff;
        }

        .announcement-card.expired {
          opacity: 0.6;
          border-color: #d1d5db;
        }

        .announcement-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
          position: relative;
        }

        .announcement-icon {
          font-size: 1.25rem;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1f5f9;
          border-radius: 8px;
          flex-shrink: 0;
        }

        .announcement-content {
          flex: 1;
        }

        .announcement-title {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 8px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .urgent-indicator {
          font-size: 12px;
        }

        .announcement-meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #64748b;
        }

        .announcement-type {
          font-weight: 600;
          text-transform: capitalize;
        }

        .announcement-author {
          font-weight: 500;
        }

        .unread-dot {
          position: absolute;
          top: 0;
          right: 0;
          width: 12px;
          height: 12px;
          background: #4f46e5;
          border-radius: 50%;
          border: 2px solid white;
        }

        .announcement-text {
          color: #374151;
          margin: 0 0 12px 0;
          line-height: 1.5;
          font-size: 14px;
        }

        .announcement-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
        }

        .expiry-text {
          color: #64748b;
        }

        .expired-text {
          color: #dc2626;
          font-weight: 600;
        }

        .btn {
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          text-decoration: none;
        }

        .btn-sm {
          padding: 6px 10px;
        }

        .btn-primary {
          background: #4f46e5;
          color: white;
        }

        .btn-primary:hover {
          background: #3730a3;
        }

        .btn-outline {
          background: transparent;
          border: 1px solid #d1d5db;
          color: #374151;
        }

        .btn-outline:hover {
          background: #f9fafb;
        }

        @media (max-width: 768px) {
          .tenant-announcements {
            padding: 24px 20px 20px 20px;
          }

          .unread-badge {
            position: static;
            align-self: flex-start;
            margin-top: 12px;
          }

          .filter-tabs {
            flex-wrap: wrap;
          }

          .announcement-header {
            flex-direction: column;
            gap: 8px;
          }

          .announcement-icon {
            align-self: flex-start;
          }

          .announcement-meta {
            flex-direction: column;
            gap: 4px;
          }

          .announcement-footer {
            flex-direction: column;
            gap: 8px;
            align-items: flex-start;
          }

          .urgent-header {
            flex-direction: column;
            gap: 8px;
          }

          .urgent-icon {
            align-self: flex-start;
          }

          .urgent-meta {
            flex-direction: column;
            gap: 4px;
          }
        }
      `}</style>
    </div>
  );
}

export default withAuth(TenantAnnouncements, ['tenant']); 