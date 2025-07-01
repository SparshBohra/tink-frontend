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

        {/* Main Content */}
        <div className="main-content">
          {/* Quick Actions Section */}
          <div className="quick-actions-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Quick Actions</h2>
                <p className="section-subtitle">Send messages and manage communications</p>
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

          {/* Message Form */}
          {showMessageForm && (
            <div className="message-form-section">
              <div className="form-header">
                <h3 className="form-title">Send New Message</h3>
                <p className="form-subtitle">Send message to tenants or broadcast to all</p>
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
                  
                  <div className="form-group form-group-full">
                    <label htmlFor="subject" className="form-label">Subject</label>
                    <input
                      type="text"
                      id="subject"
                      value={messageForm.subject}
                      onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                      placeholder="Enter message subject"
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group form-group-full">
                    <label htmlFor="message" className="form-label">Message</label>
                    <textarea
                      id="message"
                      rows={5}
                      value={messageForm.message}
                      onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                      placeholder="Type your message here..."
                      required
                      className="form-textarea"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="save-btn">
                    Send Message
                  </button>
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => {
                      setShowMessageForm(false);
                      setMessageForm({ recipient: '', subject: '', message: '', type: 'individual' });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Message History Section */}
          <div className="messages-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Message History ({messages.length})</h2>
                <p className="section-subtitle">Recent communications with tenants</p>
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

          {/* Communication Templates */}
          <div className="templates-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Quick Templates</h2>
                <p className="section-subtitle">Common message templates for faster communication</p>
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
        }

        /* Metrics Grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
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
          font-weight: 500;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .metric-change.positive {
          background: #dcfce7;
          color: #16a34a;
        }

        /* Main Content */
        .main-content {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }

        /* Section Styling */
        .quick-actions-section,
        .messages-section,
        .templates-section,
        .message-form-section {
          background: white;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          background: white;
        }

        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 2px 0;
        }

        .section-subtitle {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }

        .section-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* Button Styles */
        .refresh-btn,
        .save-btn,
        .cancel-btn,
        .view-btn,
        .template-btn,
        .empty-action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
          cursor: pointer;
          border: 1px solid transparent;
          text-decoration: none;
        }

        .refresh-btn {
          background: #f8fafc;
          color: #475569;
          border-color: #e2e8f0;
        }

        .refresh-btn:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .save-btn {
          background: #10b981;
          color: white;
          border-color: #10b981;
        }

        .save-btn:hover {
          background: #059669;
        }

        .cancel-btn {
          background: #f8fafc;
          color: #475569;
          border-color: #e2e8f0;
        }

        .cancel-btn:hover {
          background: #f1f5f9;
        }

        .view-btn {
          background: #dbeafe;
          color: #2563eb;
          border-color: #93c5fd;
          font-size: 12px;
          padding: 4px 8px;
        }

        .view-btn:hover {
          background: #bfdbfe;
        }

        .template-btn {
          background: #f8fafc;
          color: #475569;
          border-color: #e2e8f0;
          font-size: 12px;
          padding: 6px 12px;
        }

        .template-btn:hover {
          background: #f1f5f9;
        }

        .empty-action-btn {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
          padding: 8px 16px;
          font-size: 14px;
        }

        .empty-action-btn:hover {
          background: #2563eb;
        }

        /* Form Styling */
        .message-form-section {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .form-header {
          margin-bottom: 20px;
        }

        .form-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .form-subtitle {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group-full {
          grid-column: 1 / -1;
        }

        .form-label {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 6px;
        }

        .form-input,
        .form-textarea {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
          transition: border-color 0.2s ease;
          background: white;
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-input:disabled {
          background: #f9fafb;
          color: #6b7280;
        }

        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .form-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        /* Table Styling */
        .messages-scroll-container {
          overflow-x: auto;
        }

        .messages-table-container {
          min-width: 800px;
        }

        .messages-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .messages-table th {
          background: #f8fafc;
          color: #475569;
          font-weight: 600;
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
          font-size: 12px;
        }

        .messages-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        .messages-table tbody tr:hover {
          background: #f8fafc;
        }

        .table-left {
          text-align: left;
        }

        .table-center {
          text-align: center;
        }

        .recipient-name {
          font-weight: 500;
          color: #1e293b;
        }

        .message-subject {
          color: #1e293b;
        }

        .message-date {
          font-size: 11px;
          color: #64748b;
        }

        /* Status Badges */
        .status-badge {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
        }

        .status-sent {
          background: #fef3c7;
          color: #d97706;
        }

        .status-delivered {
          background: #dbeafe;
          color: #2563eb;
        }

        .status-read {
          background: #d1fae5;
          color: #059669;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 48px 24px;
        }

        .empty-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 16px;
          color: #cbd5e1;
        }

        .empty-state h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        .empty-state p {
          font-size: 13px;
          color: #64748b;
          margin: 0 0 20px 0;
        }

        /* Quick Actions Grid */
        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          padding: 20px;
        }

        .action-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s ease;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
        }

        .action-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-color: #cbd5e1;
        }

        .action-card.blue {
          border-left: 3px solid #3b82f6;
        }

        .action-card.green {
          border-left: 3px solid #10b981;
        }

        .action-card.purple {
          border-left: 3px solid #8b5cf6;
        }

        .action-icon {
          width: 32px;
          height: 32px;
          background: #f8fafc;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          flex-shrink: 0;
        }

        .action-card.blue .action-icon {
          background: #dbeafe;
          color: #3b82f6;
        }

        .action-card.green .action-icon {
          background: #d1fae5;
          color: #10b981;
        }

        .action-card.purple .action-icon {
          background: #e9d5ff;
          color: #8b5cf6;
        }

        .action-content {
          flex: 1;
        }

        .action-title {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 2px 0;
        }

        .action-subtitle {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        /* Templates Grid */
        .templates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          padding: 20px;
        }

        .template-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: all 0.2s ease;
        }

        .template-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-color: #cbd5e1;
        }

        .template-icon {
          width: 32px;
          height: 32px;
          background: #f8fafc;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          margin-bottom: 12px;
        }

        .template-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .template-title {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 6px 0;
        }

        .template-description {
          font-size: 12px;
          color: #64748b;
          margin: 0 0 12px 0;
          line-height: 1.4;
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 12px 16px;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .section-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .actions-grid,
          .templates-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .section-header {
            padding: 12px 16px;
          }

          .messages-table th,
          .messages-table td {
            padding: 8px 12px;
          }

          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}

export default withAuth(CommunicationPage, ['manager']); 