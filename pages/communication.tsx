import { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '../components/DashboardLayout';
import { withAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';

interface Message {
  id: number;
  recipient: string;
  subject: string;
  message: string;
  sent_date: string;
  status: 'sent' | 'delivered' | 'read';
}

function CommunicationPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageForm, setMessageForm] = useState({
    recipient: '',
    subject: '',
    message: '',
    type: 'individual' // individual or broadcast
  });

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call when available
      setMessages([
        {
          id: 1,
          recipient: 'John Doe',
          subject: 'Rent Reminder',
          message: 'Your rent payment is due in 3 days.',
          sent_date: '2024-01-15T10:00:00Z',
          status: 'read'
        },
        {
          id: 2,
          recipient: 'All Tenants - Building A',
          subject: 'Maintenance Notice',
          message: 'Water will be shut off tomorrow from 9 AM to 2 PM.',
          sent_date: '2024-01-14T14:30:00Z',
          status: 'delivered'
        },
        {
          id: 3,
          recipient: 'Jane Smith',
          subject: 'Lease Renewal',
          message: 'Your lease is expiring soon. Would you like to renew?',
          sent_date: '2024-01-12T11:00:00Z',
          status: 'read'
        },
        {
          id: 4,
          recipient: 'All Tenants - Building B',
          subject: 'Holiday Hours',
          message: 'The management office will be closed on Monday for the holiday.',
          sent_date: '2024-01-10T18:00:00Z',
          status: 'delivered'
        },
        {
          id: 5,
          recipient: 'Mike Johnson',
          subject: 'Package Delivery',
          message: 'A package has been delivered for you to the front office.',
          sent_date: '2024-01-09T15:20:00Z',
          status: 'sent'
        }
      ]);
    } catch (err: any) {
      console.error('Failed to fetch messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Mock implementation - replace with actual API call
      console.log('Sending message:', messageForm);
      alert('Message sent successfully!');
      setShowMessageForm(false);
      setMessageForm({ recipient: '', subject: '', message: '', type: 'individual' });
      fetchMessages(); // Refresh messages
    } catch (err: any) {
      alert('Failed to send message: ' + err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      sent: { className: 'status-sent', text: 'Sent' },
      delivered: { className: 'status-delivered', text: 'Delivered' },
      read: { className: 'status-read', text: 'Read' }
    };
    const badge = badges[status as keyof typeof badges] || badges.sent;
    return <span className={`status-badge ${badge.className}`}>{badge.text}</span>;
  };

  if (loading) {
    return (
      <DashboardLayout
        title="Communication"
        subtitle="Loading communication data..."
      >
        <div className="loading-state">
          <div className="loading-spinner">Loading communication...</div>
        </div>
        
        <style jsx>{`
          .loading-state {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 400px;
          }
          
          .loading-spinner {
            font-size: 18px;
            color: var(--gray-600);
          }
        `}</style>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="">
      <Head>
        <title>Communication - Tink Property Management</title>
      </Head>
      
      <div className="dashboard-container">
        {/* Custom Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="dashboard-title">Communication</h1>
              <div className="subtitle-container">
                <p className="welcome-message">
                  Manage tenant communications and announcements
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="error-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {error}
          </div>
        )}
        
        {/* Main Content Layout */}
        <div className="main-content-grid">
          <div className="left-column">
            {/* Top Metrics Row */}
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-header">
                  <div className="metric-info">
                    <h3 className="metric-title">Total Messages</h3>
                    <div className="metric-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="metric-content">
                  <div className="metric-value">{messages.length}</div>
                  <div className="metric-subtitle">Messages sent</div>
                  <div className="metric-progress">
                    <span className="metric-label">This month</span>
                    <span className="metric-change positive">+{messages.length > 0 ? '1' : '0'}</span>
                  </div>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-header">
                  <div className="metric-info">
                    <h3 className="metric-title">Read Messages</h3>
                    <div className="metric-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20,6 9,17 4,12"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="metric-content">
                  <div className="metric-value">{messages.filter(m => m.status === 'read').length}</div>
                  <div className="metric-subtitle">Successfully read</div>
                  <div className="metric-progress">
                    <span className="metric-label">Read rate</span>
                    <span className="metric-change positive">+2</span>
                  </div>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-header">
                  <div className="metric-info">
                    <h3 className="metric-title">Delivered</h3>
                    <div className="metric-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="metric-content">
                  <div className="metric-value">{messages.filter(m => m.status === 'delivered').length}</div>
                  <div className="metric-subtitle">Successfully delivered</div>
                  <div className="metric-progress">
                    <span className="metric-label">Delivery rate</span>
                    <span className="metric-change positive">+1</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Message History Section */}
            <div className="messages-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Message History ({messages.length})</h2>
                  <p className="section-subtitle">Recent communications with tenants</p>
                </div>
                <div className="section-actions">
                  <button onClick={fetchMessages} className="refresh-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 4 23 10 17 10"/>
                      <polyline points="1 20 1 14 7 14"/>
                      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                    </svg>
                    Refresh
                  </button>
                </div>
              </div>

              {messages.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <h3>No Messages Sent</h3>
                  <p>You haven't sent any messages yet. Start communicating with your tenants!</p>
                  <button 
                    className="empty-action-btn"
                    onClick={() => setShowMessageForm(true)}
                  >
                    Send Your First Message
                  </button>
                </div>
              ) : (
                <div className="messages-scroll-container">
                  <div className="messages-table-container">
                    <table className="messages-table">
                      <thead>
                        <tr>
                          <th className="table-left">Recipient</th>
                          <th className="table-left">Subject</th>
                          <th className="table-center">Sent Date</th>
                          <th className="table-center">Status</th>
                          <th className="table-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {messages.map((message) => (
                          <tr key={message.id}>
                            <td className="table-left">
                              <div className="recipient-name">{message.recipient}</div>
                            </td>
                            <td className="table-left">
                              <div className="message-subject">{message.subject}</div>
                            </td>
                            <td className="table-center">
                              <div className="message-date">
                                {new Date(message.sent_date).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="table-center">
                              {getStatusBadge(message.status)}
                            </td>
                            <td className="table-center">
                              <button className="view-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                  <circle cx="12" cy="12" r="3"/>
                                </svg>
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="right-column">
            {/* Quick Actions Section */}
            <div className="quick-actions-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Quick Actions</h2>
                  <p className="section-subtitle">Frequently used actions</p>
                </div>
              </div>
              
              <div className="actions-grid">
                <div 
                  className="action-card blue"
                  onClick={() => setShowMessageForm(true)}
                >
                  <div className="action-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <div className="action-content">
                    <h3 className="action-title">Send Message</h3>
                    <p className="action-subtitle">Send message to tenants</p>
                  </div>
                </div>

                <div className="action-card green">
                  <div className="action-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                  </div>
                  <div className="action-content">
                    <h3 className="action-title">Templates</h3>
                    <p className="action-subtitle">Use message templates</p>
                  </div>
                </div>

                <div className="action-card purple">
                  <div className="action-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <div className="action-content">
                    <h3 className="action-title">Broadcast</h3>
                    <p className="action-subtitle">Send to all tenants</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Quick Templates Section */}
            <div className="templates-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Quick Templates</h2>
                  <p className="section-subtitle">Common message templates</p>
                </div>
              </div>
              
              <div className="templates-grid">
                <div className="template-card">
                  <div className="template-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23"/>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                  </div>
                  <div className="template-content">
                    <h4 className="template-title">Rent Reminder</h4>
                    <p className="template-description">Gentle reminder about upcoming rent payment</p>
                    <button className="template-btn">Use Template</button>
                  </div>
                </div>
                
                <div className="template-card">
                  <div className="template-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                    </svg>
                  </div>
                  <div className="template-content">
                    <h4 className="template-title">Maintenance Notice</h4>
                    <p className="template-description">Notify tenants about scheduled maintenance</p>
                    <button className="template-btn">Use Template</button>
                  </div>
                </div>

                <div className="template-card">
                  <div className="template-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                  </div>
                  <div className="template-content">
                    <h4 className="template-title">Policy Update</h4>
                    <p className="template-description">Inform tenants about policy changes</p>
                    <button className="template-btn">Use Template</button>
                  </div>
                </div>
                
                <div className="template-card">
                  <div className="template-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div className="template-content">
                    <h4 className="template-title">Welcome Message</h4>
                    <p className="template-description">Welcome new tenants to the property</p>
                    <button className="template-btn">Use Template</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message Form (Modal) */}
        {showMessageForm && (
          <div className="message-form-modal">
            <div className="message-form-section">
              <div className="form-header">
                <h3 className="form-title">Send New Message</h3>
                <p className="form-subtitle">Send message to tenants or broadcast to all</p>
                <button 
                  className="close-btn"
                  onClick={() => setShowMessageForm(false)}
                >
                  &times;
                </button>
              </div>
              
              <form onSubmit={handleSendMessage} className="message-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="type" className="form-label">Message Type</label>
                    <select
                      id="type"
                      value={messageForm.type}
                      onChange={(e) => setMessageForm({ ...messageForm, type: e.target.value })}
                      required
                      className="form-input"
                    >
                      <option value="individual">Individual Tenant</option>
                      <option value="broadcast">All Tenants</option>
                      <option value="property">All Tenants in Property</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="recipient" className="form-label">Recipient</label>
                    <input
                      type="text"
                      id="recipient"
                      value={messageForm.recipient}
                      onChange={(e) => setMessageForm({ ...messageForm, recipient: e.target.value })}
                      placeholder={messageForm.type === 'individual' ? 'Enter tenant name or email' : 'All selected tenants'}
                      required={messageForm.type === 'individual'}
                      disabled={messageForm.type !== 'individual'}
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group full-width">
                    <label htmlFor="subject" className="form-label">Subject</label>
                    <input
                      type="text"
                      id="subject"
                      value={messageForm.subject}
                      onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                      placeholder="e.g., Rent Reminder, Maintenance Notice"
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="message" className="form-label">Message</label>
                    <textarea
                      id="message"
                      value={messageForm.message}
                      onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                      rows={6}
                      placeholder="Write your message here..."
                      required
                      className="form-input"
                    />
                  </div>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowMessageForm(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                  >
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .dashboard-container {
          width: 100%;
          padding: 16px 20px 20px 20px;
          background: #f8fafc;
          min-height: calc(100vh - 72px);
          box-sizing: border-box;
        }

        /* Custom Header */
        .dashboard-header {
          margin-bottom: 24px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }

        .header-left {
          flex: 1;
        }

        .dashboard-title {
          font-size: 22px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
          line-height: 1.15;
        }

        .subtitle-container {
          min-height: 22px;
        }

        .welcome-message {
          font-size: 14px;
          color: #4b5563;
          margin: 0;
          line-height: 1.45;
        }

        /* Error Banner */
        .error-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
        }

        /* Main Layout Grid */
        .main-content-grid {
          display: grid;
          grid-template-columns: 2.5fr 1fr;
          gap: 24px;
          align-items: flex-start;
        }

        .left-column, .right-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Metrics Grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .metric-card {
          background: white;
          border-radius: 6px;
          padding: 14px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .metric-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .metric-title {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          margin: 0;
        }

        .metric-icon {
          width: 20px;
          height: 20px;
          color: #64748b;
        }

        .metric-content {
          margin-top: 8px;
        }

        .metric-value {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 3px;
          line-height: 1;
        }

        .metric-subtitle {
          font-size: 11px;
          color: #64748b;
          margin-bottom: 10px;
        }

        .metric-progress {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .metric-label {
          font-size: 12px;
          color: #64748b;
        }

        .metric-change {
          font-size: 12px;
          font-weight: 600;
        }

        .metric-change.positive {
          color: #10b981;
        }

        /* Section Headers */
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 3px 0;
        }

        .section-subtitle {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        .section-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        /* Messages Section */
        .messages-section, 
        .templates-section, 
        .quick-actions-section {
          background: white;
          border-radius: 6px;
          padding: 18px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          height: fit-content;
        }

        .refresh-btn {
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
          padding: 10px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .refresh-btn:hover {
          background: #e2e8f0;
          transform: translateY(-1px);
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #64748b;
        }

        .empty-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 16px;
          color: #cbd5e1;
        }

        .empty-state h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        .empty-state p {
          font-size: 14px;
          margin: 0 0 20px 0;
        }

        .empty-action-btn {
          background: #6366f1;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: all 0.2s ease;
        }

        .empty-action-btn:hover {
          background: #4f46e5;
          transform: translateY(-1px);
        }

        /* Messages Table */
        .messages-scroll-container {
          overflow-y: auto;
          max-height: 500px;
        }

        .messages-scroll-container::-webkit-scrollbar {
          width: 6px;
        }

        .messages-scroll-container::-webkit-scrollbar-track {
          background: rgba(226, 232, 240, 0.3);
          border-radius: 3px;
        }

        .messages-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }

        .messages-table-container {
          width: 100%;
          overflow-x: auto;
          border-radius: 8px;
          background: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .messages-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }

        .messages-table th {
          position: sticky;
          top: 0;
          background: #f8fafc;
          z-index: 2;
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
          padding: 12px 10px;
          border-bottom: 2px solid #e2e8f0;
        }

        .messages-table td {
          font-size: 14px;
          padding: 16px 10px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .messages-table tr:last-child td {
          border-bottom: none;
        }

        .recipient-name {
          font-weight: 600;
          color: #1e293b;
        }

        .message-subject {
          font-weight: 500;
          color: #374151;
        }
        
        .message-date {
          font-size: 13px;
          color: #64748b;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }
        
        .status-sent {
          background: #e5e7eb;
          color: #4b5563;
        }

        .status-delivered {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .status-read {
          background: #dcfce7;
          color: #166534;
        }

        .view-btn {
          background: #f0f0f0;
          color: #000000;
          border: 1px solid #e2e8f0;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;
          text-decoration: none;
          margin: 0 auto;
        }

        .view-btn:hover {
          background: #e2e8f0;
          transform: translateY(-1px);
        }

        .view-btn svg {
          stroke: #000000;
        }

        /* Templates Section */
        .templates-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .template-card {
          display: flex;
          gap: 12px;
          padding: 12px;
          border-radius: 5px;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
          background: #f9fafb;
        }
        
        .template-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          border-color: #cbd5e1;
        }
        
        .template-icon {
          width: 36px;
          height: 36px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: #e5e7eb;
          color: #4b5563;
        }
        
        .template-content {
          flex: 1;
        }
        
        .template-title {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 3px 0;
        }
        
        .template-description {
          font-size: 12px;
          color: #64748b;
          margin: 0 0 8px 0;
        }
        
        .template-btn {
          background: none;
          border: 1px solid #d1d5db;
          color: #374151;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .template-btn:hover {
          background: #e5e7eb;
          border-color: #9ca3af;
        }

        /* Quick Actions Section */
        .actions-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .action-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 5px;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .action-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .action-card.blue {
          background: #eff6ff;
          border-color: #dbeafe;
        }

        .action-card.green {
          background: #f0fdf4;
          border-color: #dcfce7;
        }

        .action-card.purple {
          background: #faf5ff;
          border-color: #e9d5ff;
        }

        .action-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .action-card.blue .action-icon {
          background: #3b82f6;
          color: white;
        }

        .action-card.green .action-icon {
          background: #10b981;
          color: white;
        }

        .action-card.purple .action-icon {
          background: #8b5cf6;
          color: white;
        }

        .action-content {
          flex: 1;
        }

        .action-title {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 3px 0;
        }

        .action-subtitle {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        /* Utility classes for alignment */
        .table-left { text-align: left !important; }
        .table-right { text-align: right !important; }
        .table-center { text-align: center !important; }

        /* Message Form Modal */
        .message-form-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .message-form-section {
          background: white;
          width: 90%;
          max-width: 600px;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
          position: relative;
        }

        .form-header {
          margin-bottom: 24px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e2e8f0;
        }

        .form-title {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
        }
        
        .form-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }
        
        .close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          font-size: 28px;
          line-height: 1;
          color: #9ca3af;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .close-btn:hover {
          color: #1e293b;
        }

        .message-form .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        .message-form .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .message-form .form-group.full-width {
          grid-column: 1 / -1;
        }
        
        .message-form .form-label {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .message-form .form-input {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: all 0.2s ease;
          background: white;
        }
        
        .message-form .form-input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        
        .message-form .form-input:disabled {
          background: #f9fafb;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .message-form .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding-top: 24px;
          margin-top: 16px;
          border-top: 1px solid #e2e8f0;
        }

        .btn {
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          text-decoration: none;
          border: none;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }

        .btn-primary {
          background: #6366f1;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #4f46e5;
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: #f8fafc;
          color: #1e293b;
          border: 1px solid #e2e8f0;
        }

        .btn-secondary:hover {
          background: #f1f5f9;
          transform: translateY(-1px);
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .main-content-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }

        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .dashboard-container {
            padding: 24px 16px;
          }

          .header-content {
            flex-direction: column;
            gap: 16px;
          }
          
          .dashboard-title {
            font-size: 28px;
          }
          
          .welcome-message {
            font-size: 14px;
          }
          
          .metric-card {
            padding: 16px;
          }
          
          .metric-value {
            font-size: 24px;
          }
          
          .messages-section,
          .templates-section,
          .quick-actions-section {
            padding: 16px;
          }

          .messages-table-container {
            overflow-x: scroll;
          }

          .messages-table th,
          .messages-table td {
            padding: 12px 8px;
            font-size: 12px;
          }

          .section-actions {
            flex-direction: column;
            gap: 8px;
          }
        }

        @media (max-width: 480px) {
          .dashboard-container {
            padding: 16px;
          }

          .dashboard-title {
            font-size: 24px;
          }

          .welcome-message {
            font-size: 13px;
          }

          .section-header {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }
        }

        /* Dark Mode Styles */
        :global(.dark-mode) .dashboard-container { background: transparent; }
        :global(.dark-mode) .metric-card, 
        :global(.dark-mode) .messages-section, 
        :global(.dark-mode) .templates-section,
        :global(.dark-mode) .quick-actions-section,
        :global(.dark-mode) .action-card {
          background: #111111 !important;
          border: 1px solid #333333 !important;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4) !important;
        }
        :global(.dark-mode) .metric-card:hover,
        :global(.dark-mode) .action-card:hover {
          background: #222222 !important;
          border-color: #ffffff !important;
        }
        :global(.dark-mode) .messages-table th {
          background-color: #1a1a1a !important;
          border-bottom: 1px solid #333333 !important;
        }
        :global(.dark-mode) .messages-table td {
          background-color: #111111 !important;
          border-bottom: 1px solid #333333 !important;
        }
        :global(.dark-mode) .messages-table tbody tr:hover {
          background-color: #222222 !important;
        }
        :global(.dark-mode) .refresh-btn {
            background: #1a1a1a !important;
            border: 1px solid #333333 !important;
        }
        :global(.dark-mode) .refresh-btn:hover {
            background: #2a2a2a !important;
            border-color: #ffffff !important;
        }
        :global(.dark-mode) .empty-action-btn,
        :global(.dark-mode) .btn-primary {
            background: #3b82f6 !important;
            border: none !important;
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2) !important;
        }
        :global(.dark-mode) .empty-action-btn:hover,
        :global(.dark-mode) .btn-primary:hover:not(:disabled) {
            background: #2563eb !important;
            box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3) !important;
        }
        :global(.dark-mode) .btn-secondary {
            background: #1a1a1a !important;
            border: 1px solid #333333 !important;
            color: #ffffff !important;
        }
        :global(.dark-mode) .btn-secondary:hover {
            background: #2a2a2a !important;
            border-color: #ffffff !important;
        }
        :global(.dark-mode) .status-badge {
            color: #ffffff !important;
        }
        :global(.dark-mode) .status-badge.sent { background: rgba(107, 114, 128, 0.3); }
        :global(.dark-mode) .status-badge.delivered { background: rgba(59, 130, 246, 0.3); }
        :global(.dark-mode) .status-badge.read { background: rgba(34, 197, 94, 0.3); }
        :global(.dark-mode) .action-card.blue .action-icon { background: rgba(59, 130, 246, 0.3); }
        :global(.dark-mode) .action-card.green .action-icon { background: rgba(34, 197, 94, 0.3); }
        :global(.dark-mode) .action-card.purple .action-icon { background: rgba(139, 92, 246, 0.3); }
        :global(.dark-mode) .template-card { background: #1a1a1a !important; }
        :global(.dark-mode) .template-card:hover { border-color: #4b5563 !important; }
        :global(.dark-mode) .template-icon { background: #374151 !important; }
        :global(.dark-mode) .template-btn { border-color: #4b5563 !important; color: #d1d5db !important; }
        :global(.dark-mode) .template-btn:hover { background: #374151 !important; border-color: #6b7280 !important; }
        :global(.dark-mode) .message-form-section { background: #111111 !important; }
        :global(.dark-mode) .form-header { border-bottom-color: #333333 !important; }
        :global(.dark-mode) .close-btn { color: #6b7280 !important; }
        :global(.dark-mode) .close-btn:hover { color: #f9fafb !important; }
        :global(.dark-mode) .message-form .form-input {
          background: #1a1a1a !important;
          border-color: #4b5563 !important;
          color: #d1d5db !important;
        }
        :global(.dark-mode) .message-form .form-input:focus { border-color: #3b82f6 !important; }
        :global(.dark-mode) .message-form .form-input:disabled { background: #374151 !important; color: #6b7280 !important; }
        :global(.dark-mode) .message-form .form-actions { border-top-color: #333333 !important; }
      `}</style>
    </DashboardLayout>
  );
}

export default withAuth(CommunicationPage, ['manager']); 