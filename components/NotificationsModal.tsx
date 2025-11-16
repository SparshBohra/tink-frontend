import React, { useMemo } from 'react';
import { useTheme } from '../lib/theme-context';

export interface Notification {
  id: number;
  text: string;
  time: string;
  created_at?: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read?: boolean;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
}

export default function NotificationsModal({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationsModalProps) {
  const { isDarkMode } = useTheme();
  
  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: Notification[] } = {};
    
    notifications.forEach((notif) => {
      const date = notif.created_at 
        ? new Date(notif.created_at).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        : 'Today';
      
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(notif);
    });
    
    // Sort dates (most recent first)
    const sortedDates = Object.keys(groups).sort((a, b) => {
      if (a === 'Today') return -1;
      if (b === 'Today') return 1;
      return new Date(b).getTime() - new Date(a).getTime();
    });
    
    return sortedDates.map(date => ({
      date,
      notifications: groups[date].sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA; // Most recent first
      })
    }));
  }, [notifications]);

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return '';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="modal-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />

      {/* Modal */}
      <div 
        className="notifications-modal"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '80vh',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isDarkMode 
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)'
            : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: isDarkMode ? '1px solid #3f3f46' : 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: isDarkMode ? '1px solid #3f3f46' : '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '600',
            color: isDarkMode ? '#fafafa' : '#1e293b',
          }}>
            All Notifications
          </h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1d4ed8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                }}
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                padding: '6px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: isDarkMode ? '#a1a1aa' : '#64748b',
                fontSize: '20px',
                lineHeight: 1,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = isDarkMode ? '#e4e4e7' : '#1e293b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = isDarkMode ? '#a1a1aa' : '#64748b';
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
        }}>
          {groupedNotifications.length > 0 ? (
            groupedNotifications.map((group) => (
              <div key={group.date} style={{ marginBottom: '24px' }}>
                {/* Date Header */}
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: isDarkMode ? '#a1a1aa' : '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '12px',
                  paddingBottom: '8px',
                  borderBottom: isDarkMode ? '1px solid #3f3f46' : '1px solid #f1f5f9',
                }}>
                  {group.date}
                </div>

                {/* Notifications for this date */}
                {group.notifications.map((notif) => {
                  const isUnread = !notif.read;
                  const bgColor = isDarkMode
                    ? (isUnread ? 'rgba(59, 130, 246, 0.15)' : '#18181b')
                    : (isUnread ? '#eff6ff' : '#f8f9fa');
                  const borderColor = isDarkMode
                    ? (isUnread ? 'rgba(59, 130, 246, 0.3)' : '#3f3f46')
                    : (isUnread ? '#dbeafe' : '#e2e8f0');
                  const hoverBgColor = isDarkMode
                    ? (isUnread ? 'rgba(59, 130, 246, 0.25)' : '#27272a')
                    : (isUnread ? '#dbeafe' : '#f1f5f9');
                  
                  return (
                    <div
                      key={notif.id}
                      onClick={() => !notif.read && onMarkAsRead(notif.id)}
                      style={{
                        padding: '12px',
                        marginBottom: '8px',
                        borderRadius: '8px',
                        backgroundColor: bgColor,
                        border: `1px solid ${borderColor}`,
                        cursor: notif.read ? 'default' : 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (!notif.read) {
                          e.currentTarget.style.backgroundColor = hoverBgColor;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!notif.read) {
                          e.currentTarget.style.backgroundColor = bgColor;
                        }
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <p style={{
                            margin: 0,
                            fontSize: '14px',
                            fontWeight: notif.read ? '400' : '500',
                            color: isDarkMode ? '#e4e4e7' : '#1e293b',
                            lineHeight: '1.5',
                          }}>
                            {notif.text}
                          </p>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '4px',
                          }}>
                            <span style={{
                              fontSize: '12px',
                              color: isDarkMode ? '#a1a1aa' : '#64748b',
                            }}>
                              {formatTime(notif.created_at) || notif.time}
                            </span>
                            {!notif.read && (
                              <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: '#2563eb',
                              }} />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '48px 24px',
              color: isDarkMode ? '#a1a1aa' : '#64748b',
            }}>
              <p style={{ margin: 0, fontSize: '16px', color: isDarkMode ? '#e4e4e7' : '#64748b' }}>No notifications</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: isDarkMode ? '#a1a1aa' : '#64748b' }}>You're all caught up!</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .modal-backdrop {
          animation: fadeIn 0.2s ease-out;
        }
        
        .notifications-modal {
          animation: slideUp 0.3s ease-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, -45%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </>
  );
}

