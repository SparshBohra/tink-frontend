import { useState, useEffect } from 'react';
import Head from 'next/head';
import Navigation from '../components/Navigation';
import DashboardLayout from '../components/DashboardLayout';
import SectionCard from '../components/SectionCard';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
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
      <>
        <Navigation />
        <DashboardLayout
          title="Communication"
          subtitle="Loading communication data..."
        >
          <div className="loading-indicator">
            <div className="loading-spinner" />
            <p>Loading messages...</p>
          </div>
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Communication - Tink Property Management</title>
      </Head>
      <Navigation />
      
      <DashboardLayout
        title="Communication"
        subtitle="Manage tenant communications and announcements"
      >
        {error && <div className="alert alert-error">{error}</div>}

        {/* Quick Actions */}
        <SectionCard>
          <div className="actions-container">
            <button 
              className="btn btn-primary" 
              onClick={() => setShowMessageForm(true)}
            >
              Send Message
            </button>
            <button className="btn btn-secondary" onClick={fetchMessages}>
              Refresh
            </button>
          </div>
        </SectionCard>

        {/* Message Form */}
        {showMessageForm && (
          <SectionCard title="Send New Message">
            <form onSubmit={handleSendMessage} className="message-form">
              <div className="form-group">
                <label htmlFor="type">Message Type</label>
                <select
                  id="type"
                  value={messageForm.type}
                  onChange={(e) => setMessageForm({ ...messageForm, type: e.target.value })}
                  required
                >
                  <option value="individual">Individual Tenant</option>
                  <option value="broadcast">All Tenants</option>
                  <option value="property">All Tenants in Property</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="recipient">Recipient</label>
                <input
                  type="text"
                  id="recipient"
                  value={messageForm.recipient}
                  onChange={(e) => setMessageForm({ ...messageForm, recipient: e.target.value })}
                  placeholder={messageForm.type === 'individual' ? 'Enter tenant name or email' : 'All selected tenants'}
                  required={messageForm.type === 'individual'}
                  disabled={messageForm.type !== 'individual'}
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  value={messageForm.subject}
                  onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                  placeholder="Enter message subject"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  rows={5}
                  value={messageForm.message}
                  onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                  placeholder="Type your message here..."
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Send Message
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowMessageForm(false);
                    setMessageForm({ recipient: '', subject: '', message: '', type: 'individual' });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </SectionCard>
        )}

        {/* Message History */}
        <SectionCard title="Message History" subtitle="Recent communications with tenants">
          {messages.length > 0 ? (
            <DataTable
              columns={[
                { key: 'recipient', header: 'Recipient' },
                { key: 'subject', header: 'Subject' },
                { key: 'sent_date', header: 'Sent Date' },
                { key: 'status', header: 'Status' },
                { key: 'actions', header: 'Actions' }
              ]}
              data={messages}
              renderRow={(message) => (
                <tr key={message.id}>
                  <td style={{ textAlign: 'center' }}>
                    <strong>{message.recipient}</strong>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {message.subject}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {new Date(message.sent_date).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {getStatusBadge(message.status)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn btn-info btn-sm">
                      View Details
                    </button>
                  </td>
                </tr>
              )}
            />
          ) : (
            <EmptyState
              title="No Messages Sent"
              description="You haven't sent any messages yet. Start communicating with your tenants!"
            />
          )}
        </SectionCard>

        {/* Communication Templates */}
        <SectionCard 
          title="Quick Templates" 
          subtitle="Common message templates for faster communication"
        >
          <div className="templates-grid">
            <div className="template-card">
              <h4>Rent Reminder</h4>
              <p>Gentle reminder about upcoming rent payment</p>
              <button className="btn btn-secondary btn-sm">Use Template</button>
            </div>
            <div className="template-card">
              <h4>Maintenance Notice</h4>
              <p>Notify tenants about scheduled maintenance</p>
              <button className="btn btn-secondary btn-sm">Use Template</button>
            </div>
            <div className="template-card">
              <h4>Policy Update</h4>
              <p>Inform tenants about policy changes</p>
              <button className="btn btn-secondary btn-sm">Use Template</button>
            </div>
            <div className="template-card">
              <h4>Welcome Message</h4>
              <p>Welcome new tenants to the property</p>
              <button className="btn btn-secondary btn-sm">Use Template</button>
            </div>
          </div>
        </SectionCard>
      </DashboardLayout>
      
      <style jsx>{`
        .actions-container {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .message-form {
          max-width: 600px;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #374151;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 1rem;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-group input:disabled {
          background-color: #f9fafb;
          color: #6b7280;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
        }

        .templates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .template-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1rem;
          text-align: center;
        }

        .template-card h4 {
          margin: 0 0 0.5rem 0;
          color: #1f2937;
          font-size: 1.1rem;
        }

        .template-card p {
          margin: 0 0 1rem 0;
          color: #6b7280;
          font-size: 0.9rem;
        }

        .status-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .status-sent {
          background-color: #fef3c7;
          color: #d97706;
        }

        .status-delivered {
          background-color: #dbeafe;
          color: #2563eb;
        }

        .status-read {
          background-color: #d1fae5;
          color: #059669;
        }

        .loading-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .alert {
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .alert-error {
          background-color: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        /* Button styles */
        .btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 0.375rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-block;
        }

        .btn-primary {
          background-color: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background-color: #2563eb;
        }

        .btn-secondary {
          background-color: #6b7280;
          color: white;
        }

        .btn-secondary:hover {
          background-color: #4b5563;
        }

        .btn-info {
          background-color: #06b6d4;
          color: white;
        }

        .btn-info:hover {
          background-color: #0891b2;
        }

        .btn-sm {
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
        }
      `}</style>
    </>
  );
}

export default withAuth(CommunicationPage, ['manager']); 