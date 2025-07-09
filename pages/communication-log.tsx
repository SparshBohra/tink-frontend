import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import DashboardLayout from '../components/DashboardLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth, withAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';

interface CommunicationLogEntry {
  id: number;
  type: 'sms' | 'email';
  recipient: string;
  recipientPhone?: string;
  recipientEmail?: string;
  subject: string;
  message: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  sentDate: string;
  deliveredDate?: string;
  readDate?: string;
  sender: string;
  property: string;
  unit: string;
  templateUsed?: string;
  messageId?: string;
  errorMessage?: string;
}

function CommunicationLogPage() {
  const [logs, setLogs] = useState<CommunicationLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    dateRange: '7',
    search: ''
  });

  useEffect(() => {
    fetchCommunicationLogs();
  }, [filters]);

  const fetchCommunicationLogs = async () => {
    try {
      setLoading(true);
      // Mock data - in production, this would fetch from your database
      const mockLogs: CommunicationLogEntry[] = [
        {
          id: 1,
          type: 'sms',
          recipient: 'John Doe',
          recipientPhone: '+1234567890',
          subject: 'Rent Reminder',
          message: 'Hi John, this is a friendly reminder that your rent payment is due in 3 days.',
          status: 'read',
          sentDate: '2024-01-15T10:00:00Z',
          deliveredDate: '2024-01-15T10:00:30Z',
          readDate: '2024-01-15T14:30:00Z',
          sender: 'Property Manager',
          property: 'Sunset Apartments',
          unit: 'A101',
          templateUsed: 'Rent Reminder',
          messageId: 'SM1234567890'
        },
        {
          id: 2,
          type: 'email',
          recipient: 'Jane Smith',
          recipientEmail: 'jane.smith@email.com',
          subject: 'Lease Renewal Notice',
          message: 'Dear Jane, your lease is expiring soon. Please contact us to discuss renewal options.',
          status: 'delivered',
          sentDate: '2024-01-14T16:45:00Z',
          deliveredDate: '2024-01-14T16:45:30Z',
          sender: 'Property Manager',
          property: 'Oak Street Complex',
          unit: 'B205',
          templateUsed: 'Lease Renewal',
          messageId: 'EM1234567891'
        },
        {
          id: 3,
          type: 'sms',
          recipient: 'Mike Johnson',
          recipientPhone: '+1234567892',
          subject: 'Maintenance Update',
          message: 'Hi Mike, the maintenance work in your unit has been completed. Please let us know if you have any concerns.',
          status: 'delivered',
          sentDate: '2024-01-13T09:20:00Z',
          deliveredDate: '2024-01-13T09:20:15Z',
          sender: 'Maintenance Team',
          property: 'Downtown Lofts',
          unit: 'C303',
          templateUsed: 'Maintenance Notice',
          messageId: 'SM1234567892'
        },
        {
          id: 4,
          type: 'sms',
          recipient: 'Sarah Wilson',
          recipientPhone: '+1234567893',
          subject: 'Payment Confirmation',
          message: 'Thank you Sarah! We have received your rent payment of $1,200 for January 2024.',
          status: 'read',
          sentDate: '2024-01-12T11:15:00Z',
          deliveredDate: '2024-01-12T11:15:20Z',
          readDate: '2024-01-12T11:45:00Z',
          sender: 'Accounting Team',
          property: 'Sunset Apartments',
          unit: 'A102',
          templateUsed: 'Payment Confirmation',
          messageId: 'SM1234567893'
        },
        {
          id: 5,
          type: 'email',
          recipient: 'David Brown',
          recipientEmail: 'david.brown@email.com',
          subject: 'Welcome to Your New Home',
          message: 'Welcome David! We are excited to have you as a new tenant. Here is important information about your new home.',
          status: 'delivered',
          sentDate: '2024-01-11T13:30:00Z',
          deliveredDate: '2024-01-11T13:30:45Z',
          sender: 'Property Manager',
          property: 'Oak Street Complex',
          unit: 'B206',
          templateUsed: 'Welcome Message',
          messageId: 'EM1234567894'
        },
        {
          id: 6,
          type: 'sms',
          recipient: 'Emma Davis',
          recipientPhone: '+1234567895',
          subject: 'Emergency Notice',
          message: 'URGENT: Water will be shut off tomorrow from 9 AM to 2 PM for emergency repairs. Please prepare accordingly.',
          status: 'delivered',
          sentDate: '2024-01-10T18:00:00Z',
          deliveredDate: '2024-01-10T18:00:10Z',
          sender: 'Property Manager',
          property: 'Downtown Lofts',
          unit: 'C201',
          templateUsed: 'Emergency Notice',
          messageId: 'SM1234567895'
        },
        {
          id: 7,
          type: 'sms',
          recipient: 'Alex Johnson',
          recipientPhone: '+1234567896',
          subject: 'Package Delivery',
          message: 'Hi Alex, you have a package waiting for pickup at the front office. Office hours are 9 AM - 6 PM.',
          status: 'failed',
          sentDate: '2024-01-09T14:20:00Z',
          sender: 'Front Office',
          property: 'Sunset Apartments',
          unit: 'A203',
          templateUsed: 'Package Delivery',
          messageId: 'SM1234567896',
          errorMessage: 'Invalid phone number'
        }
      ];

      // Apply filters
      let filteredLogs = mockLogs;

      if (filters.type !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.type === filters.type);
      }

      if (filters.status !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.status === filters.status);
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredLogs = filteredLogs.filter(log => 
          log.recipient.toLowerCase().includes(searchLower) ||
          log.subject.toLowerCase().includes(searchLower) ||
          log.message.toLowerCase().includes(searchLower) ||
          log.property.toLowerCase().includes(searchLower) ||
          log.unit.toLowerCase().includes(searchLower)
        );
      }

      // Apply date range filter
      if (filters.dateRange !== 'all') {
        const days = parseInt(filters.dateRange);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        filteredLogs = filteredLogs.filter(log => new Date(log.sentDate) >= cutoffDate);
      }

      setLogs(filteredLogs);
    } catch (err: any) {
      console.error('Failed to fetch communication logs:', err);
      setError('Failed to load communication logs');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      sent: { color: '#f59e0b', bg: '#fef3c7', text: 'Sent' },
      delivered: { color: '#10b981', bg: '#d1fae5', text: 'Delivered' },
      read: { color: '#3b82f6', bg: '#dbeafe', text: 'Read' },
      failed: { color: '#ef4444', bg: '#fee2e2', text: 'Failed' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.sent;

    return (
      <span 
        className="status-badge"
        style={{
          backgroundColor: config.bg,
          color: config.color,
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}
      >
        {config.text}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    if (type === 'sms') {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      );
    } else {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportLogs = () => {
    const csvContent = [
      ['Date', 'Type', 'Recipient', 'Subject', 'Status', 'Property', 'Unit', 'Template', 'Message ID'].join(','),
      ...logs.map(log => [
        formatDate(log.sentDate),
        log.type.toUpperCase(),
        log.recipient,
        log.subject,
        log.status,
        log.property,
        log.unit,
        log.templateUsed || '',
        log.messageId || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `communication-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout title="Communication Log">
      <Head>
        <title>Communication Log - Tink</title>
        <meta name="description" content="View comprehensive communication history" />
      </Head>

      <div className="log-container">
        <div className="log-header">
          <div className="header-content">
            <div className="header-left">
              <Link href="/communication" className="back-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5"/>
                  <path d="M12 19l-7-7 7-7"/>
                </svg>
                Back to Communication
              </Link>
              <h1 className="page-title">Communication Log</h1>
              <p className="page-subtitle">Comprehensive history of all communications sent through the system</p>
            </div>
            <div className="header-actions">
              <button onClick={exportLogs} className="export-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7,10 12,15 17,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <div className="filters-section">
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="filter-select"
              >
                <option value="all">All Types</option>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
                <option value="read">Read</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                className="filter-select"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search recipient, subject, or message..."
                className="filter-input"
              />
            </div>
          </div>
        </div>

        <div className="logs-section">
          {loading ? (
            <LoadingSpinner />
          ) : logs.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <h3>No communication logs found</h3>
              <p>No communications match your current filters.</p>
            </div>
          ) : (
            <div className="logs-table-container">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Type</th>
                    <th>Recipient</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Property</th>
                    <th>Template</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <div className="date-cell">
                          <div className="primary-date">{formatDate(log.sentDate)}</div>
                          {log.deliveredDate && (
                            <div className="secondary-date">
                              Delivered: {formatDate(log.deliveredDate)}
                            </div>
                          )}
                          {log.readDate && (
                            <div className="secondary-date">
                              Read: {formatDate(log.readDate)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="type-cell">
                          {getTypeIcon(log.type)}
                          <span className="type-text">{log.type.toUpperCase()}</span>
                        </div>
                      </td>
                      <td>
                        <div className="recipient-cell">
                          <div className="recipient-name">{log.recipient}</div>
                          <div className="recipient-contact">
                            {log.recipientPhone && (
                              <span className="contact-info">{log.recipientPhone}</span>
                            )}
                            {log.recipientEmail && (
                              <span className="contact-info">{log.recipientEmail}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="subject-cell">
                          <div className="subject-text">{log.subject}</div>
                          <div className="message-preview">
                            {log.message.length > 50 
                              ? `${log.message.substring(0, 50)}...` 
                              : log.message
                            }
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="status-cell">
                          {getStatusBadge(log.status)}
                          {log.errorMessage && (
                            <div className="error-message">{log.errorMessage}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="property-cell">
                          <div className="property-name">{log.property}</div>
                          <div className="unit-number">Unit {log.unit}</div>
                        </div>
                      </td>
                      <td>
                        <div className="template-cell">
                          {log.templateUsed || 'Custom'}
                        </div>
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button 
                            className="action-btn view-btn"
                            title="View full message"
                            onClick={() => {
                              alert(`Full Message:\n\n${log.message}`);
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </button>
                          {log.messageId && (
                            <button 
                              className="action-btn copy-btn"
                              title="Copy Message ID"
                              onClick={() => {
                                navigator.clipboard.writeText(log.messageId || '');
                                alert('Message ID copied to clipboard');
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .log-container {
          width: 100%;
          padding: 20px;
          background: #f8fafc;
          min-height: calc(100vh - 72px);
        }

        .log-header {
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

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #6366f1;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 12px;
          transition: color 0.2s ease;
        }

        .back-link:hover {
          color: #4f46e5;
        }

        .page-title {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        .page-subtitle {
          font-size: 16px;
          color: #64748b;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .export-btn {
          background: #10b981;
          color: white;
          border: none;
          padding: 12px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .export-btn:hover {
          background: #059669;
          transform: translateY(-1px);
        }

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

        .filters-section {
          background: white;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          margin-bottom: 20px;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .filter-label {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filter-select,
        .filter-input {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: all 0.2s ease;
          background: white;
        }

        .filter-select:focus,
        .filter-input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .logs-section {
          background: white;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: #64748b;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top: 3px solid #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: #64748b;
        }

        .empty-state svg {
          margin-bottom: 16px;
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
          margin: 0;
        }

        .logs-table-container {
          overflow-x: auto;
        }

        .logs-table {
          width: 100%;
          border-collapse: collapse;
        }

        .logs-table th {
          background: #f8fafc;
          padding: 12px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .logs-table td {
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: top;
        }

        .logs-table tr:hover {
          background: #f8fafc;
        }

        .date-cell {
          min-width: 180px;
        }

        .primary-date {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 2px;
        }

        .secondary-date {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 1px;
        }

        .type-cell {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 80px;
        }

        .type-text {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
        }

        .recipient-cell {
          min-width: 160px;
        }

        .recipient-name {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 2px;
        }

        .recipient-contact {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .contact-info {
          font-size: 12px;
          color: #64748b;
        }

        .subject-cell {
          min-width: 200px;
        }

        .subject-text {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .message-preview {
          font-size: 12px;
          color: #64748b;
          line-height: 1.4;
        }

        .status-cell {
          min-width: 100px;
        }

        .error-message {
          font-size: 11px;
          color: #dc2626;
          margin-top: 4px;
        }

        .property-cell {
          min-width: 120px;
        }

        .property-name {
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 2px;
        }

        .unit-number {
          font-size: 12px;
          color: #64748b;
        }

        .template-cell {
          min-width: 100px;
          font-size: 12px;
          color: #64748b;
        }

        .actions-cell {
          display: flex;
          gap: 8px;
          min-width: 100px;
        }

        .action-btn {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #64748b;
          padding: 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-btn:hover {
          background: #f1f5f9;
          color: #374151;
          transform: translateY(-1px);
        }

        .view-btn:hover {
          background: #dbeafe;
          color: #3b82f6;
        }

        .copy-btn:hover {
          background: #dcfce7;
          color: #10b981;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .log-container {
            padding: 16px;
          }

          .page-title {
            font-size: 24px;
          }

          .header-content {
            flex-direction: column;
            gap: 16px;
          }

          .filters-grid {
            grid-template-columns: 1fr;
          }

          .logs-table th,
          .logs-table td {
            padding: 8px 12px;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}

export default withAuth(CommunicationLogPage); 