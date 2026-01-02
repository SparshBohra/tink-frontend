import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '../components/DashboardLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth, withAuth } from '../lib/auth-context';
import { vapiApi, CommunicationLog, CommunicationSummary } from '../lib/api';
import { Phone, MessageSquare, Users, ChevronRight, Clock, TrendingUp, Calendar } from 'lucide-react';

interface ContactGroup {
  phone_number: string;
  contact_name: string;
  property_name: string | null;
  calls: number;
  sms: number;
  total: number;
  logs: CommunicationLog[];
}

function CommunicationPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [summary, setSummary] = useState<CommunicationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedContact, setExpandedContact] = useState<string | null>(null);
  const [filters, setFilters] = useState({ days: 30 });

  useEffect(() => {
    fetchData();
  }, [filters.days]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [logsResponse, summaryResponse] = await Promise.all([
        vapiApi.getCommunicationLogs({ days: filters.days }),
        vapiApi.getCommunicationSummary()
      ]);
      setLogs(logsResponse.logs);
      setSummary(summaryResponse);
    } catch (err: any) {
      console.error('Failed to fetch communication logs:', err);
      setError('Failed to load communication logs');
    } finally {
      setLoading(false);
    }
  };

  // Group logs by contact
  const groupedContacts: ContactGroup[] = React.useMemo(() => {
    const groups: Record<string, ContactGroup> = {};
    logs.forEach(log => {
      const key = log.phone_number;
      if (!groups[key]) {
        groups[key] = {
          phone_number: log.phone_number,
          contact_name: log.contact_name || 'Unknown',
          property_name: log.property_name,
          calls: 0, sms: 0, total: 0, logs: []
        };
      }
      if (log.is_call) groups[key].calls++;
      else groups[key].sms++;
      groups[key].total++;
      groups[key].logs.push(log);
      if (log.contact_name && groups[key].contact_name === 'Unknown') {
        groups[key].contact_name = log.contact_name;
      }
    });
    Object.values(groups).forEach(group => {
      group.logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    });
    return Object.values(groups).sort((a, b) => b.total - a.total);
  }, [logs]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const toggleExpand = (phone: string) => {
    setExpandedContact(expandedContact === phone ? null : phone);
  };

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <DashboardLayout title="">
      <Head>
        <title>Communication - SquareFt</title>
      </Head>

      <div className="dashboard-container">
        {/* Header Card */}
        <div className="header-card">
            <div className="header-left">
            <div className="header-icon">
              <MessageSquare size={24} />
            </div>
            <div className="header-text">
              <h1>Communication</h1>
              <p>Track all calls and SMS messages with your contacts</p>
            </div>
          </div>
          <div className="header-right">
            <div className="date-display">
              <Calendar size={14} />
              <span>{dayName}</span>
            </div>
            <div className="date-value">{dateStr}</div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-label">TOTAL CALLS</span>
              <div className="metric-icon purple"><Phone size={18} /></div>
            </div>
            <div className="metric-value">{summary?.total_calls || 0}</div>
          </div>
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-label">TOTAL SMS</span>
              <div className="metric-icon green"><MessageSquare size={18} /></div>
            </div>
            <div className="metric-value">{summary?.total_sms || 0}</div>
          </div>
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-label">TODAY</span>
              <div className="metric-icon orange"><Clock size={18} /></div>
            </div>
            <div className="metric-value">{summary?.today_count || 0}</div>
          </div>
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-label">TOTAL INTERACTIONS</span>
              <div className="metric-icon blue"><TrendingUp size={18} /></div>
            </div>
            <div className="metric-value">{summary?.total || 0}</div>
          </div>
        </div>

        {error && <div className="alert error-alert">{error}</div>}

        {/* Filter */}
        <div className="filter-row">
              <select
            value={filters.days}
            onChange={(e) => setFilters({ days: parseInt(e.target.value) })}
                className="filter-select"
              >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
              </select>
            </div>

        {/* Main Content */}
        <div className="content-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Contact Interaction Breakdown</h2>
              <p className="section-subtitle">Click on a contact to view detailed interaction history</p>
          </div>
        </div>

          {loading ? (
            <div className="loading-container"><LoadingSpinner /></div>
          ) : groupedContacts.length === 0 ? (
            <div className="empty-state">
              <MessageSquare size={48} strokeWidth={1} />
              <h3>No communications yet</h3>
              <p>Communication logs will appear here when calls and SMS are tracked.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}></th>
                    <th>Name</th>
                    <th style={{ textAlign: 'center' }}>Phone</th>
                    <th style={{ textAlign: 'center' }}>Property</th>
                    <th style={{ textAlign: 'center' }}>Calls</th>
                    <th style={{ textAlign: 'center' }}>SMS</th>
                    <th style={{ textAlign: 'center' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedContacts.map((contact) => (
                    <React.Fragment key={contact.phone_number}>
                      <tr
                        className={`clickable-row ${expandedContact === contact.phone_number ? 'expanded' : ''}`}
                        onClick={() => toggleExpand(contact.phone_number)}
                      >
                        <td style={{ textAlign: 'center' }}>
                          <ChevronRight 
                            size={16} 
                            className={`expand-icon ${expandedContact === contact.phone_number ? 'rotated' : ''}`}
                          />
                        </td>
                        <td>
                          <div className="primary-text">{contact.contact_name}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="secondary-text">{contact.phone_number}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="secondary-text">{contact.property_name || '-'}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`stat-badge ${contact.calls > 0 ? 'purple' : 'muted'}`}>{contact.calls}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`stat-badge ${contact.sms > 0 ? 'green' : 'muted'}`}>{contact.sms}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="stat-badge blue">{contact.total}</span>
                        </td>
                      </tr>

                      {expandedContact === contact.phone_number && (
                        <tr className="detail-row">
                          <td colSpan={7}>
                            <div className="detail-section">
                              <div className="detail-card">
                                <div className="detail-header">
                                  <div className="detail-title">Detailed interactions</div>
                                  <div className="detail-count">{contact.logs.length} total</div>
                                </div>
                                <table className="detail-table">
                                  <thead>
                                    <tr>
                                      <th style={{ width: '120px' }}>Date</th>
                                      <th style={{ width: '90px', textAlign: 'center' }}>Time</th>
                                      <th style={{ width: '110px', textAlign: 'center' }}>Method</th>
                                      <th style={{ width: '120px', textAlign: 'center' }}>Direction</th>
                                      <th>Content</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {contact.logs.map((log) => {
                                      const { date, time } = formatDateTime(log.created_at);
                                      return (
                                        <tr key={log.id}>
                                          <td className="detail-date">{date}</td>
                                          <td className="detail-time cell-center">{time}</td>
                                          <td className="cell-center">
                                            <span className="method-chip">
                                              {log.is_call ? (
                                                <>
                                                  <Phone size={14} /> Call
                                                </>
                                              ) : (
                                                <>
                                                  <MessageSquare size={14} /> SMS
                                                </>
                                              )}
                                            </span>
                                          </td>
                                          <td className="cell-center">
                                            <span className={`direction-chip ${log.is_inbound ? 'inbound' : 'outbound'}`}>
                                              {log.is_inbound ? '↓ Inbound' : '↑ Outbound'}
                                            </span>
                                          </td>
                                          <td className="content-cell">
                                            {log.content || (log.is_call ? `${log.assistant_name || 'Voice'} call` : '-')}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          padding: 24px 32px;
          background: #f8fafc;
          min-height: calc(100vh - 72px);
        }

        /* Header Card */
        .header-card {
          background: white;
          border-radius: 12px;
          padding: 24px 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          border: 1px solid #e2e8f0;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3b82f6;
        }

        .header-text h1 {
          font-size: 22px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .header-text p {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }

        .header-right {
          text-align: right;
        }

        .date-display {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 6px;
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 4px;
        }

        .date-value {
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
        }

        /* Metrics Grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .metric-card {
          background: white;
          border-radius: 12px;
          padding: 20px 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          border: 1px solid #e2e8f0;
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .metric-label {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          letter-spacing: 0.5px;
        }

        .metric-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .metric-icon.purple { background: #ede9fe; color: #7c3aed; }
        .metric-icon.green { background: #d1fae5; color: #10b981; }
        .metric-icon.orange { background: #fef3c7; color: #d97706; }
        .metric-icon.blue { background: #dbeafe; color: #3b82f6; }

        .metric-value {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
        }

        /* Filter */
        .filter-row {
          margin-bottom: 16px;
        }

        .filter-select {
          padding: 10px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          background: white;
          color: #475569;
          cursor: pointer;
        }

        /* Alert */
        .alert {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 13px;
          font-weight: 500;
        }

        .error-alert { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }

        /* Content Section */
        .content-section {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          border: 1px solid #e2e8f0;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 2px 0;
        }

        .section-subtitle {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }

        .loading-container {
          display: flex;
          justify-content: center;
          padding: 48px;
        }

        .empty-state {
          text-align: center;
          padding: 48px 24px;
          color: #64748b;
        }

        .empty-state h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 16px 0 8px;
        }

        /* Table */
        .table-container { 
          overflow-x: auto;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th {
          padding: 12px 16px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          white-space: nowrap;
        }

        .data-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
          color: #374151;
          vertical-align: middle;
        }

        .data-table tbody tr:last-child td { border-bottom: none; }

        .cell-center {
          text-align: center;
        }

        .clickable-row {
          cursor: pointer;
          transition: background 0.15s;
        }

        .clickable-row:hover, .clickable-row.expanded {
          background: #f8fafc;
        }

        .expand-icon {
          color: #64748b;
          transition: transform 0.2s;
        }

        .expand-icon.rotated {
          transform: rotate(90deg);
        }

        .primary-text {
          font-weight: 600;
          color: #1e293b;
          font-size: 14px;
        }

        .secondary-text {
          color: #64748b;
          font-size: 14px;
        }

        .stat-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 32px;
          height: 28px;
          padding: 0 10px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
        }

        .stat-badge.purple { background: #ede9fe; color: #7c3aed; }
        .stat-badge.green { background: #d1fae5; color: #10b981; }
        .stat-badge.blue { background: #dbeafe; color: #3b82f6; }
        .stat-badge.muted { background: #f1f5f9; color: #94a3b8; }

        .detail-row td {
          padding: 0 !important;
          background: #f8fafc;
        }

        .detail-section {
          padding: 14px 16px 18px 44px;
        }

        .detail-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
          overflow: hidden;
        }

        .detail-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-bottom: 1px solid #e2e8f0;
          background: #ffffff;
        }

        .detail-title {
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
          letter-spacing: -0.1px;
          text-transform: none;
          margin: 0;
          padding: 0;
        }

        .detail-count {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
        }

        .detail-table {
          width: 100%;
          border-collapse: collapse;
        }

        /* Consistent padding so headers and cells start at the same left margin */
        .detail-table th,
        .detail-table td {
          padding: 12px 16px;
        }

        .detail-table th {
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .detail-table td {
          font-size: 13px;
          color: #374151;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        /* Column alignment: Date + Content left, middle columns centered */
        .detail-table th:nth-child(2),
        .detail-table th:nth-child(3),
        .detail-table th:nth-child(4),
        .detail-table td:nth-child(2),
        .detail-table td:nth-child(3),
        .detail-table td:nth-child(4) {
          text-align: center;
        }

        .detail-table th:nth-child(1),
        .detail-table td:nth-child(1),
        .detail-table th:nth-child(5),
        .detail-table td:nth-child(5) {
          text-align: left;
        }

        .detail-table tr:last-child td { border-bottom: none; }

        .detail-date {
          font-weight: 600;
          color: #334155;
          white-space: nowrap;
        }

        .detail-time {
          color: #64748b;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }

        .method-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          font-size: 12px;
          font-weight: 600;
          color: #334155;
          white-space: nowrap;
        }

        .direction-chip {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }

        .direction-chip.inbound { color: #059669; }
        .direction-chip.outbound { color: #2563eb; }

        .content-cell {
          color: #374151;
          line-height: 1.5;
          white-space: normal;
          word-break: break-word;
        }

        @media (max-width: 1024px) {
          .metrics-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 768px) {
          .dashboard-container { padding: 16px; }
          .metrics-grid { grid-template-columns: 1fr; }
          .header-card { flex-direction: column; align-items: flex-start; gap: 16px; }
          .header-right { text-align: left; }
        }
      `}</style>
    </DashboardLayout>
  );
}

export default withAuth(CommunicationPage);
