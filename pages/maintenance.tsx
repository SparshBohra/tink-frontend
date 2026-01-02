import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '../components/DashboardLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth, withAuth } from '../lib/auth-context';
import { vapiApi, MaintenanceTicket, MaintenanceVendor } from '../lib/api';
import { Wrench, Clock, CheckCircle, AlertCircle, Plus, Edit, Trash2, X, Users, AlertTriangle, Zap, Calendar } from 'lucide-react';

function MaintenancePage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [vendors, setVendors] = useState<MaintenanceVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tickets' | 'vendors'>('tickets');
  
  // Vendor modal
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<MaintenanceVendor | null>(null);
  const [vendorForm, setVendorForm] = useState({
    name: '', phone: '', email: '', category: 'plumbing', notes: ''
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ticketsResponse, vendorsResponse] = await Promise.all([
        vapiApi.getMaintenanceTickets(),
        vapiApi.getMaintenanceVendors()
      ]);
      setTickets(ticketsResponse.tickets);
      setVendors(vendorsResponse.vendors);
    } catch (err: any) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (ticketId: number, newStatus: string) => {
    try {
      await vapiApi.updateMaintenanceTicket(ticketId, { status: newStatus });
      setSuccess('Status updated');
      setTimeout(() => setSuccess(null), 2000);
      fetchData();
    } catch (err) {
      setError('Failed to update');
      setTimeout(() => setError(null), 3000);
    }
  };

  const openAddVendorModal = () => {
    setEditingVendor(null);
    setVendorForm({ name: '', phone: '', email: '', category: 'plumbing', notes: '' });
    setShowVendorModal(true);
  };

  const openEditVendorModal = (vendor: MaintenanceVendor) => {
    setEditingVendor(vendor);
    setVendorForm({
      name: vendor.name, phone: vendor.phone, email: vendor.email || '',
      category: vendor.category, notes: vendor.notes || ''
    });
    setShowVendorModal(true);
  };

  const handleSaveVendor = async () => {
    try {
      if (editingVendor) {
        await vapiApi.updateMaintenanceVendor(editingVendor.id, vendorForm);
        setSuccess('Vendor updated');
      } else {
        await vapiApi.createMaintenanceVendor(vendorForm);
        setSuccess('Vendor added');
      }
      setShowVendorModal(false);
      setTimeout(() => setSuccess(null), 2000);
      fetchData();
    } catch (err) {
      setError('Failed to save vendor');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteVendor = async (id: number) => {
    if (!confirm('Delete this vendor?')) return;
    try {
      await vapiApi.deleteMaintenanceVendor(id);
      setSuccess('Vendor deleted');
      setTimeout(() => setSuccess(null), 2000);
      fetchData();
    } catch (err) {
      setError('Failed to delete');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await vapiApi.toggleMaintenanceVendorActive(id);
      fetchData();
    } catch (err) {
      setError('Failed to update');
      setTimeout(() => setError(null), 3000);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      plumbing: 'Plumber', electrical: 'Electrician', hvac: 'HVAC',
      appliance: 'Appliance', pest: 'Pest Control', other: 'General'
    };
    return labels[category] || category;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getUrgencyStyle = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return { bg: '#fef2f2', color: '#dc2626', label: 'Emergency' };
      case 'urgent': return { bg: '#fef3c7', color: '#d97706', label: 'Urgent' };
      default: return { bg: '#f0fdf4', color: '#16a34a', label: 'Standard' };
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return { bg: '#d1fae5', color: '#059669' };
      default: return { bg: '#fef3c7', color: '#d97706' };
    }
  };

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const pendingCount = tickets.filter(t => t.status === 'pending').length;
  const completedCount = tickets.filter(t => t.status === 'completed').length;
  const emergencyCount = tickets.filter(t => t.urgency === 'emergency').length;

  return (
    <DashboardLayout title="">
      <Head>
        <title>Maintenance - SquareFt</title>
      </Head>

      <div className="dashboard-container">
        {/* Header Card */}
        <div className="header-card">
          <div className="header-left">
            <div className="header-icon">
              <Wrench size={24} />
            </div>
            <div className="header-text">
              <h1>Maintenance</h1>
              <p>Manage maintenance requests and your preferred contractors</p>
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

        {/* Tabs - Above Cards */}
        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`} 
            onClick={() => setActiveTab('tickets')}
          >
            Tickets ({tickets.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'vendors' ? 'active' : ''}`} 
            onClick={() => setActiveTab('vendors')}
          >
            Contractors ({vendors.length})
          </button>
        </div>

        {/* Metrics Grid - Changes based on active tab */}
        {activeTab === 'tickets' ? (
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">PENDING</span>
                <div className="metric-icon orange"><Clock size={18} /></div>
              </div>
              <div className="metric-value">{pendingCount}</div>
            </div>
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">COMPLETED</span>
                <div className="metric-icon green"><CheckCircle size={18} /></div>
              </div>
              <div className="metric-value">{completedCount}</div>
            </div>
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">EMERGENCIES</span>
                <div className="metric-icon red"><Zap size={18} /></div>
              </div>
              <div className="metric-value">{emergencyCount}</div>
            </div>
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">TOTAL TICKETS</span>
                <div className="metric-icon blue"><Wrench size={18} /></div>
              </div>
              <div className="metric-value">{tickets.length}</div>
            </div>
          </div>
        ) : (
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">TOTAL CONTRACTORS</span>
                <div className="metric-icon blue"><Users size={18} /></div>
              </div>
              <div className="metric-value">{vendors.length}</div>
            </div>
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">ACTIVE</span>
                <div className="metric-icon green"><CheckCircle size={18} /></div>
              </div>
              <div className="metric-value">{vendors.filter(v => v.is_active).length}</div>
            </div>
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">INACTIVE</span>
                <div className="metric-icon orange"><Clock size={18} /></div>
              </div>
              <div className="metric-value">{vendors.filter(v => !v.is_active).length}</div>
            </div>
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">CATEGORIES</span>
                <div className="metric-icon purple"><Wrench size={18} /></div>
              </div>
              <div className="metric-value">{new Set(vendors.map(v => v.category)).size}</div>
            </div>
          </div>
        )}

        {/* Alerts */}
        {error && <div className="alert error-alert">{error}</div>}
        {success && <div className="alert success-alert">{success}</div>}

        {loading ? (
          <div className="loading-container"><LoadingSpinner /></div>
        ) : activeTab === 'tickets' ? (
          <div className="content-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">All Tickets</h2>
                <p className="section-subtitle">Maintenance requests from tenant calls</p>
              </div>
            </div>

            {tickets.length === 0 ? (
              <div className="empty-state">
                <Wrench size={48} strokeWidth={1} />
                <h3>No tickets yet</h3>
                <p>Maintenance requests from calls will appear here.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table tickets-table">
                  <thead>
                    <tr>
                      <th className="left-align">Ticket</th>
                      <th className="left-align">Issue</th>
                      <th>Tenant</th>
                      <th>Created</th>
                      <th>Urgency</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket) => {
                      const { date, time } = formatDateTime(ticket.created_at);
                      const urgencyStyle = getUrgencyStyle(ticket.urgency);
                      const statusStyle = getStatusStyle(ticket.status);
                      return (
                        <tr key={ticket.id}>
                          <td className="left-align">
                            <div className="primary-text">{ticket.ticket_number}</div>
                            <div className="secondary-text">{ticket.category_display}</div>
                          </td>
                          <td className="left-align">
                            <div className="primary-text">{ticket.issue_description.length > 50 ? ticket.issue_description.substring(0, 50) + '...' : ticket.issue_description}</div>
                            <div className="secondary-text">{ticket.property_address.length > 40 ? ticket.property_address.substring(0, 40) + '...' : ticket.property_address}</div>
                          </td>
                          <td>
                            <div className="primary-text">{ticket.caller_name}</div>
                            <div className="secondary-text">{ticket.caller_phone}</div>
                          </td>
                          <td>
                            <div className="primary-text">{date}</div>
                            <div className="secondary-text">{time}</div>
                          </td>
                          <td>
                            <span className="badge" style={{ background: urgencyStyle.bg, color: urgencyStyle.color }}>
                              {ticket.urgency === 'emergency' && <AlertTriangle size={12} />}
                              {urgencyStyle.label}
                            </span>
                          </td>
                          <td>
                            <select
                              value={ticket.status}
                              onChange={(e) => handleUpdateStatus(ticket.id, e.target.value)}
                              className="status-select"
                              style={{ background: statusStyle.bg, color: statusStyle.color, borderColor: statusStyle.bg }}
                            >
                              <option value="pending">Pending</option>
                              <option value="completed">Completed</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="content-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Your Contractors</h2>
                <p className="section-subtitle">Add your preferred contractors. We'll notify them when matching tickets come in.</p>
              </div>
              <button className="primary-btn" onClick={openAddVendorModal}>
                <Plus size={16} /> Add Contractor
              </button>
            </div>

            {vendors.length === 0 ? (
              <div className="empty-state">
                <Users size={48} strokeWidth={1} />
                <h3>No contractors yet</h3>
                <p>Add your preferred contractors to get started.</p>
                <button className="primary-btn" onClick={openAddVendorModal}>
                  <Plus size={14} /> Add Contractor
                </button>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table vendors-table">
                  <thead>
                    <tr>
                      <th className="left-align">Name</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map((vendor) => (
                      <tr key={vendor.id}>
                        <td className="left-align">
                          <div className="primary-text">{vendor.name}</div>
                          {vendor.email && <div className="secondary-text">{vendor.email}</div>}
                        </td>
                        <td>{vendor.phone}</td>
                        <td>
                          <span className="badge blue">{getCategoryLabel(vendor.category)}</span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleToggleActive(vendor.id)}
                            className={`status-toggle ${vendor.is_active ? 'active' : 'inactive'}`}
                          >
                            {vendor.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="action-btns">
                            <button className="icon-btn" onClick={() => openEditVendorModal(vendor)} title="Edit">
                              <Edit size={20} />
                            </button>
                            <button className="icon-btn danger" onClick={() => handleDeleteVendor(vendor.id)} title="Delete">
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Vendor Modal */}
      {showVendorModal && (
        <div className="modal-overlay" onClick={() => setShowVendorModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingVendor ? 'Edit Contractor' : 'Add Contractor'}</h2>
              <button className="modal-close" onClick={() => setShowVendorModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Name *</label>
                <input type="text" value={vendorForm.name} onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })} placeholder="e.g. SwiftFix Plumbing" />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input type="tel" value={vendorForm.phone} onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })} placeholder="+1 (555) 123-4567" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={vendorForm.email} onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })} placeholder="contact@example.com" />
              </div>
              <div className="form-group">
                <label>Role *</label>
                <select value={vendorForm.category} onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })}>
                  <option value="plumbing">Plumber</option>
                  <option value="electrical">Electrician</option>
                  <option value="hvac">HVAC</option>
                  <option value="appliance">Appliance</option>
                  <option value="pest">Pest Control</option>
                  <option value="other">General</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea value={vendorForm.notes} onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })} placeholder="Any additional notes..." rows={3} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setShowVendorModal(false)}>Cancel</button>
              <button className="primary-btn" onClick={handleSaveVendor} disabled={!vendorForm.name || !vendorForm.phone}>
                {editingVendor ? 'Save Changes' : 'Add Contractor'}
              </button>
            </div>
          </div>
        </div>
      )}

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

        .metric-icon.orange { background: #fef3c7; color: #d97706; }
        .metric-icon.blue { background: #dbeafe; color: #3b82f6; }
        .metric-icon.green { background: #d1fae5; color: #10b981; }
        .metric-icon.red { background: #fee2e2; color: #ef4444; }
        .metric-icon.purple { background: #ede9fe; color: #7c3aed; }

        .metric-value {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
        }

        /* Tabs */
        .tabs-container {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }

        .tab-btn {
          padding: 10px 20px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          background: white;
          color: #64748b;
          transition: all 0.2s ease;
        }

        .tab-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        /* Alerts */
        .alert {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 13px;
          font-weight: 500;
        }

        .error-alert { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
        .success-alert { background: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a; }

        .loading-container {
          display: flex;
          justify-content: center;
          padding: 48px;
        }

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

        .primary-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .primary-btn:hover { background: #2563eb; }
        .primary-btn:disabled { background: #cbd5e1; cursor: not-allowed; }

        .secondary-btn {
          padding: 10px 16px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          color: #475569;
        }

        /* Empty State */
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

        .empty-state p { margin: 0 0 16px; }

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
          text-align: center;
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
          text-align: center;
        }

        .data-table tbody tr:hover { background: #f8fafc; }
        .data-table tbody tr:last-child td { border-bottom: none; }

        .data-table th.left-align,
        .data-table td.left-align {
          text-align: left;
        }

        .primary-text {
          font-weight: 600;
          color: #1e293b;
          font-size: 14px;
        }

        .secondary-text {
          font-size: 13px;
          color: #64748b;
          margin-top: 3px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .badge.blue { background: #dbeafe; color: #2563eb; }

        .status-select {
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid transparent;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          min-width: 120px;
        }

        .status-toggle {
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          border: none;
          cursor: pointer;
        }

        .status-toggle.active { background: #d1fae5; color: #059669; }
        .status-toggle.inactive { background: #f1f5f9; color: #64748b; }

        .action-btns { 
          display: flex; 
          gap: 8px;
          justify-content: center;
        }

        .icon-btn {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          cursor: pointer;
          color: #334155;
          transition: all 0.2s;
        }

        .icon-btn:hover { 
          background: #eef2ff;
          border-color: #cbd5e1;
        }
        
        .icon-btn.danger:hover { 
          background: #fef2f2; 
          color: #dc2626;
          border-color: #fecaca;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .modal {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h2 {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          padding: 4px;
        }

        .modal-body { padding: 24px; }

        .form-group { margin-bottom: 16px; }

        .form-group label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 6px;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .modal-footer {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding: 16px 24px;
          border-top: 1px solid #e2e8f0;
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

export default withAuth(MaintenancePage);

