import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';
import { withAuth } from '../../lib/auth-context';
import { apiClient } from '../../lib/api';
import { Lease, Tenant, Property, Room } from '../../lib/types';
import { formatCurrency } from '../../lib/utils';

function LeaseDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [lease, setLease] = useState<Lease | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRenewalForm, setShowRenewalForm] = useState(false);
  const [showMoveOutForm, setShowMoveOutForm] = useState(false);
  const [renewalData, setRenewalData] = useState({
    new_end_date: '',
    new_monthly_rent: '',
    notes: ''
  });
  const [moveOutData, setMoveOutData] = useState({
    move_out_date: '',
    move_out_condition: 'Good condition',
    cleaning_charges: 0,
    damage_charges: 0,
    deposit_returned: 0
  });

  useEffect(() => {
    if (id) {
      fetchLeaseData();
    }
  }, [id]);

  const fetchLeaseData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get lease details
      const leaseResponse = await apiClient.getLeases();
      const foundLease = leaseResponse.results.find(l => l.id === Number(id));
      
      if (!foundLease) {
        throw new Error('Lease not found');
      }
      
      setLease(foundLease);
      
      // Get related data
      const [tenantsResponse, propertiesResponse, roomsResponse] = await Promise.all([
        apiClient.getTenants(),
        apiClient.getProperties(),
        apiClient.getRooms()
      ]);
      
      const tenantData = tenantsResponse.results.find(t => t.id === foundLease.tenant);
      const roomData = roomsResponse.results.find(r => r.id === foundLease.room);
      const propertyData = propertiesResponse.results.find(p => p.id === foundLease.property_ref);
      
      setTenant(tenantData || null);
      setRoom(roomData || null);
      setProperty(propertyData || null);
      
      // Initialize move-out data with lease security deposit
      setMoveOutData(prev => ({
        ...prev,
        deposit_returned: foundLease.security_deposit,
        move_out_date: new Date().toISOString().split('T')[0]
      }));
      
      // Initialize renewal data
      const currentEndDate = new Date(foundLease.end_date);
      const newEndDate = new Date(currentEndDate);
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);
      
      setRenewalData({
        new_end_date: newEndDate.toISOString().split('T')[0],
        new_monthly_rent: foundLease.monthly_rent.toString(),
        notes: ''
      });
      
    } catch (error: any) {
      console.error('Failed to fetch lease data:', error);
      setError(error?.message || 'Failed to load lease data');
    } finally {
      setLoading(false);
    }
  };

  const handleRenewLease = async () => {
    try {
      if (!lease) return;
      
      const renewalPayload = {
        tenant: lease.tenant,
        room: lease.room,
        start_date: lease.end_date, // New lease starts when old one ends
        end_date: renewalData.new_end_date,
        monthly_rent: parseFloat(renewalData.new_monthly_rent),
        security_deposit: lease.security_deposit
      };
      
      await apiClient.createLease(renewalPayload);
      alert('Lease renewed successfully!');
      router.push('/leases');
      
    } catch (error: any) {
      alert(`Failed to renew lease: ${error.message}`);
    }
  };

  const handleMoveOut = async () => {
    try {
      if (!lease) return;
      
      await apiClient.processMoveout(lease.id, {
        move_out_date: moveOutData.move_out_date,
        move_out_condition: moveOutData.move_out_condition,
        cleaning_charges: moveOutData.cleaning_charges,
        damage_charges: moveOutData.damage_charges,
        deposit_returned: moveOutData.deposit_returned
      });
      
      alert('Move-out processed successfully!');
      router.push('/leases');
      
    } catch (error: any) {
      alert(`Failed to process move-out: ${error.message}`);
    }
  };

  const getLeaseStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#10b981';
      case 'expiring_soon':
        return '#f59e0b';
      case 'expired':
        return '#ef4444';
      case 'terminated':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getLeaseStatusBackground = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#dcfce7';
      case 'expiring_soon':
        return '#fef3c7';
      case 'expired':
        return '#fee2e2';
      case 'terminated':
        return '#f3f4f6';
      default:
        return '#f3f4f6';
    }
  };

  const getDaysRemaining = () => {
    if (!lease) return 0;
    const today = new Date();
    const endDate = new Date(lease.end_date);
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardLayout title="">
        <div className="loading-indicator">
          <div className="loading-spinner"></div>
          <p>Loading lease details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !lease) {
    return (
      <DashboardLayout title="">
        <div className="error-section">
          <h2>Lease Not Found</h2>
          <p>{error || 'The requested lease could not be found.'}</p>
          <Link href="/leases" legacyBehavior>
            <a className="btn btn-primary">Back to Leases</a>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Lease Details - {tenant?.full_name || 'Unknown Tenant'}</title>
      </Head>
      
      <DashboardLayout title="">
        <div className="dashboard-container">
          {/* Header */}
          <div className="dashboard-header">
            <div className="header-content">
              <div className="header-left">
                <h1 className="dashboard-title">Lease #{lease.id}</h1>
                <div className="subtitle-container">
                  <p className="welcome-message">
                    {tenant?.full_name || 'Unknown Tenant'} • {property?.name || 'Unknown Property'}
                    {room && ` • ${room.name}`}
                  </p>
                </div>
              </div>
              <div className="header-right">
                <Link href="/leases" legacyBehavior>
                  <a className="back-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 12H5m7 7l-7-7 7-7"/>
                    </svg>
                    Back
                  </a>
                </Link>
                <div 
                  className="status-badge" 
                  style={{ 
                    backgroundColor: getLeaseStatusBackground(lease.status),
                    color: getLeaseStatusColor(lease.status)
                  }}
                >
                  {lease.status?.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-info">
                  <h3 className="metric-title">Monthly Rent</h3>
                  <div className="metric-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23"/>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="metric-content">
                <div className="metric-value">{formatCurrency(lease.monthly_rent)}</div>
                <div className="metric-subtitle">per month</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-info">
                  <h3 className="metric-title">Security Deposit</h3>
                  <div className="metric-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="metric-content">
                <div className="metric-value">{formatCurrency(lease.security_deposit)}</div>
                <div className="metric-subtitle">security deposit</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-info">
                  <h3 className="metric-title">Days Remaining</h3>
                  <div className="metric-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="metric-content">
                <div className="metric-value">{getDaysRemaining()}</div>
                <div className="metric-subtitle">days until expiry</div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="main-content-grid">
            <div className="left-column">
              {/* Lease Information */}
              <div className="info-section">
                <div className="section-header">
                  <div>
                    <h2 className="section-title">Lease Information</h2>
                    <p className="section-subtitle">Agreement details and terms</p>
                  </div>
                </div>
                <div className="info-grid">
                  <div className="info-item">
                    <strong>Lease ID</strong>
                    <div className="info-value">#{lease.id}</div>
                  </div>
                  <div className="info-item">
                    <strong>Status</strong>
                    <div className="info-value">
                      <span 
                        className="status-badge-small" 
                        style={{ 
                          backgroundColor: getLeaseStatusBackground(lease.status),
                          color: getLeaseStatusColor(lease.status)
                        }}
                      >
                        {lease.status?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="info-item">
                    <strong>Start Date</strong>
                    <div className="info-value">{formatDate(lease.start_date)}</div>
                  </div>
                  <div className="info-item">
                    <strong>End Date</strong>
                    <div className="info-value">{formatDate(lease.end_date)}</div>
                  </div>
                  <div className="info-item">
                    <strong>Monthly Rent</strong>
                    <div className="info-value">{formatCurrency(lease.monthly_rent)}</div>
                  </div>
                  <div className="info-item">
                    <strong>Security Deposit</strong>
                    <div className="info-value">{formatCurrency(lease.security_deposit)}</div>
                  </div>
                </div>
              </div>

              {/* Tenant Information */}
              <div className="info-section">
                <div className="section-header">
                  <div>
                    <h2 className="section-title">Tenant Information</h2>
                    <p className="section-subtitle">Contact details and personal information</p>
                  </div>
                </div>
                <div className="info-grid">
                  <div className="info-item">
                    <strong>Full Name</strong>
                    <div className="info-value">{tenant?.full_name || 'Unknown Tenant'}</div>
                  </div>
                  <div className="info-item">
                    <strong>Email Address</strong>
                    <div className="info-value">
                      <a href={`mailto:${tenant?.email}`}>{tenant?.email || 'Not available'}</a>
                    </div>
                  </div>
                  <div className="info-item">
                    <strong>Phone Number</strong>
                    <div className="info-value">
                      <a href={`tel:${tenant?.phone}`}>{tenant?.phone || 'Not available'}</a>
                    </div>
                  </div>
                  <div className="info-item">
                    <strong>Tenant ID</strong>
                    <div className="info-value">#{tenant?.id}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="right-column">
              {/* Property Information */}
              <div className="info-section">
                <div className="section-header">
                  <div>
                    <h2 className="section-title">Property Information</h2>
                    <p className="section-subtitle">Location and property details</p>
                  </div>
                </div>
                <div className="info-grid single-column">
                  <div className="info-item">
                    <strong>Property Name</strong>
                    <div className="info-value">{property?.name || 'Unknown Property'}</div>
                  </div>
                  <div className="info-item">
                    <strong>Address</strong>
                    <div className="info-value">{property?.address || 'Not available'}</div>
                  </div>
                  <div className="info-item">
                    <strong>Room</strong>
                    <div className="info-value">{room?.name || `Room ${lease.room}`}</div>
                  </div>
                  <div className="info-item">
                    <strong>Room Type</strong>
                    <div className="info-value">{room?.room_type || 'Standard'}</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="info-section">
                <div className="section-header">
                  <div>
                    <h2 className="section-title">Quick Actions</h2>
                    <p className="section-subtitle">Lease management options</p>
                  </div>
                </div>
                <div className="actions-grid">
                  <div className="action-card green" onClick={() => setShowRenewalForm(true)}>
                    <div className="action-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                      </svg>
                    </div>
                    <div className="action-content">
                      <h4 className="action-title">Renew Lease</h4>
                      <p className="action-subtitle">Extend lease duration</p>
                    </div>
                  </div>
                  <div className="action-card blue" onClick={() => setShowMoveOutForm(true)}>
                    <div className="action-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                      </svg>
                    </div>
                    <div className="action-content">
                      <h4 className="action-title">Process Move-Out</h4>
                      <p className="action-subtitle">End lease and return deposit</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Renewal Form Modal */}
          {showRenewalForm && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3 className="modal-title">Renew Lease</h3>
                  <button className="modal-close" onClick={() => setShowRenewalForm(false)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">New End Date</label>
                    <input
                      type="date"
                      value={renewalData.new_end_date}
                      onChange={(e) => setRenewalData({...renewalData, new_end_date: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">New Monthly Rent</label>
                    <input
                      type="number"
                      value={renewalData.new_monthly_rent}
                      onChange={(e) => setRenewalData({...renewalData, new_monthly_rent: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea
                      value={renewalData.notes}
                      onChange={(e) => setRenewalData({...renewalData, notes: e.target.value})}
                      rows={3}
                      className="form-textarea"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowRenewalForm(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleRenewLease}>
                    Renew Lease
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Move-Out Form Modal */}
          {showMoveOutForm && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3 className="modal-title">Process Move-Out</h3>
                  <button className="modal-close" onClick={() => setShowMoveOutForm(false)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Move-Out Date</label>
                    <input
                      type="date"
                      value={moveOutData.move_out_date}
                      onChange={(e) => setMoveOutData({...moveOutData, move_out_date: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Move-Out Condition</label>
                    <select
                      value={moveOutData.move_out_condition}
                      onChange={(e) => setMoveOutData({...moveOutData, move_out_condition: e.target.value})}
                      className="form-select"
                    >
                      <option value="Good condition">Good condition</option>
                      <option value="Fair condition">Fair condition</option>
                      <option value="Poor condition">Poor condition</option>
                      <option value="Damaged">Damaged</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cleaning Charges</label>
                    <input
                      type="number"
                      value={moveOutData.cleaning_charges}
                      onChange={(e) => setMoveOutData({...moveOutData, cleaning_charges: parseFloat(e.target.value) || 0})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Damage Charges</label>
                    <input
                      type="number"
                      value={moveOutData.damage_charges}
                      onChange={(e) => setMoveOutData({...moveOutData, damage_charges: parseFloat(e.target.value) || 0})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Deposit Returned</label>
                    <input
                      type="number"
                      value={moveOutData.deposit_returned}
                      onChange={(e) => setMoveOutData({...moveOutData, deposit_returned: parseFloat(e.target.value) || 0})}
                      className="form-input"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowMoveOutForm(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleMoveOut}>
                    Process Move-Out
                  </button>
                </div>
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

          .header-right {
            flex-shrink: 0;
            display: flex;
            gap: 12px;
            align-items: center;
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

          .back-btn {
            padding: 10px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            transition: all 0.2s ease;
            text-decoration: none;
            border: none;
            background: #f8fafc;
            color: #64748b;
            border: 1px solid #e2e8f0;
          }

          .back-btn:hover {
            background: #e2e8f0;
          }

          .status-badge {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .status-badge-small {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
            text-transform: capitalize;
            display: inline-block;
          }

          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 20px;
          }

          .metric-card {
            background: white;
            border-radius: 6px;
            padding: 14px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
          }

          .metric-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
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
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .metric-icon {
            width: 20px;
            height: 20px;
            color: #64748b;
          }

          .metric-content {
            margin-top: 4px;
          }

          .metric-value {
            font-size: 20px;
            font-weight: 700;
            color: #1e293b;
            line-height: 1;
          }

          .metric-subtitle {
            font-size: 11px;
            color: #64748b;
            margin-top: 4px;
          }

          .main-content-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 20px;
            align-items: flex-start;
          }

          .left-column, .right-column {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .info-section {
            background: white;
            border-radius: 6px;
            padding: 18px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
            height: fit-content;
          }

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

          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .info-grid.single-column {
            grid-template-columns: 1fr;
          }

          .info-item {
            padding: 12px;
            background: #f8fafc;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
          }

          .info-item strong {
            display: block;
            color: #64748b;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }

          .info-item .info-value {
            color: #1e293b;
            font-size: 14px;
            font-weight: 500;
          }

          .info-item a {
            color: #4f46e5;
            text-decoration: none;
          }

          .info-item a:hover {
            text-decoration: underline;
          }

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
            width: 32px;
            height: 32px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            color: white;
          }

          .action-card.blue .action-icon {
            background: #3b82f6;
          }

          .action-card.green .action-icon {
            background: #10b981;
          }

          .action-card.purple .action-icon {
            background: #8b5cf6;
          }

          .action-content {
            flex: 1;
          }

          .action-title {
            font-size: 13px;
            font-weight: 600;
            color: #1e293b;
            margin: 0 0 2px 0;
          }

          .action-subtitle {
            font-size: 11px;
            color: #64748b;
            margin: 0;
          }

          .loading-indicator, .error-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            text-align: center;
          }

          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #e5e7eb;
            border-top-color: #4f46e5;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .error-section h2 {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            margin: 0 0 8px 0;
          }

          .error-section p {
            font-size: 14px;
            color: #64748b;
            margin: 0 0 16px 0;
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
            gap: 6px;
            transition: all 0.2s ease;
            text-decoration: none;
            border: none;
          }

          .btn-primary {
            background: #4f46e5;
            color: white;
          }

          .btn-primary:hover {
            background: #3730a3;
          }

          .btn-secondary {
            background: #f8fafc;
            color: #64748b;
            border: 1px solid #e2e8f0;
          }

          .btn-secondary:hover {
            background: #e2e8f0;
          }

          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .modal-content {
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 24px;
            border-bottom: 1px solid #e2e8f0;
          }

          .modal-title {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            margin: 0;
          }

          .modal-close {
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            color: #64748b;
            transition: all 0.2s ease;
          }

          .modal-close:hover {
            background: #f1f5f9;
            color: #1e293b;
          }

          .modal-body {
            padding: 24px;
          }

          .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            padding: 20px 24px;
            border-top: 1px solid #e2e8f0;
          }

          .form-group {
            margin-bottom: 16px;
          }

          .form-label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 6px;
          }

          .form-input, .form-select, .form-textarea {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            color: #374151;
            background: white;
            transition: border-color 0.2s ease;
          }

          .form-input:focus, .form-select:focus, .form-textarea:focus {
            outline: none;
            border-color: #4f46e5;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
          }

          .form-textarea {
            resize: vertical;
          }

          @media (max-width: 768px) {
            .dashboard-container {
              padding: 16px;
            }

            .header-content {
              flex-direction: column;
              gap: 12px;
            }

            .header-right {
              align-self: flex-start;
            }

            .metrics-grid {
              grid-template-columns: 1fr;
            }

            .main-content-grid {
              grid-template-columns: 1fr;
            }

            .info-grid {
              grid-template-columns: 1fr;
            }
          }

          /* Dark Mode Styles */
          :global(.dark-mode) .dashboard-container {
            background: #0a0a0a;
          }

          :global(.dark-mode) .dashboard-title,
          :global(.dark-mode) .section-title,
          :global(.dark-mode) .metric-value,
          :global(.dark-mode) .info-item .info-value,
          :global(.dark-mode) .action-title {
            color: #ffffff;
          }

          :global(.dark-mode) .welcome-message,
          :global(.dark-mode) .metric-subtitle,
          :global(.dark-mode) .section-subtitle,
          :global(.dark-mode) .info-item strong,
          :global(.dark-mode) .action-subtitle {
            color: #94a3b8;
          }

          :global(.dark-mode) .metric-card,
          :global(.dark-mode) .info-section {
            background: #1a1a1a;
            border-color: #333333;
          }

          :global(.dark-mode) .info-item {
            background: #111111;
            border-color: #333333;
          }

          :global(.dark-mode) .action-card {
            background: #111111;
            border-color: #333333;
          }

          :global(.dark-mode) .btn-secondary {
            background: #1a1a1a;
            border-color: #333333;
            color: #e2e8f0;
          }

          :global(.dark-mode) .btn-secondary:hover {
            background: #222222;
          }

          :global(.dark-mode) .modal-content {
            background: #1a1a1a;
            border-color: #333333;
          }

          :global(.dark-mode) .modal-header,
          :global(.dark-mode) .modal-footer {
            border-color: #333333;
          }

          :global(.dark-mode) .form-input,
          :global(.dark-mode) .form-select,
          :global(.dark-mode) .form-textarea {
            background: #111111;
            border-color: #333333;
            color: #e2e8f0;
          }
        `}</style>
      </DashboardLayout>
    </>
  );
}

export default withAuth(LeaseDetail); 