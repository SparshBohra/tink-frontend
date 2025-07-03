import { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '../components/DashboardLayout';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { withAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';
import { Lease, Tenant, Property, Room } from '../lib/types';
import { formatCurrency } from '../lib/utils';

function Leases() {
  const router = useRouter();
  const [leases, setLeases] = useState<Lease[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRenewalForm, setShowRenewalForm] = useState<number | null>(null);
  const [showMoveOutForm, setShowMoveOutForm] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [leasesResponse, tenantsResponse, propertiesResponse, roomsResponse] = await Promise.all([
        apiClient.getLeases(),
        apiClient.getTenants(),
        apiClient.getProperties(),
        apiClient.getRooms()
      ]);

      setLeases(leasesResponse.results || []);
      setTenants(tenantsResponse.results || []);
      setProperties(propertiesResponse.results || []);
      setRooms(roomsResponse.results || []);
    } catch (error: any) {
      console.error('Failed to fetch leases data:', error);
      setError(error?.message || 'Failed to load leases data');
    } finally {
      setLoading(false);
    }
  };

  const getTenantName = (tenantId: number) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? tenant.full_name : 'Unknown Tenant';
  };

  const getTenantContact = (tenantId: number) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? { email: tenant.email, phone: tenant.phone } : null;
  };

  const getPropertyName = (propertyId: number) => {
    const property = properties.find(p => p.id === propertyId);
    return property ? property.name : 'Unknown Property';
  };

  const getRoomName = (roomId: number) => {
    const room = rooms.find(r => r.id === roomId);
    return room ? room.name : 'Unknown Room';
  };

  const getDaysUntilExpiry = (endDate: string) => {
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  };

  const handleRenewLease = async (leaseId: number) => {
    try {
      // In a real implementation, this would open a renewal form
      // For now, we'll show an alert with renewal options
      const lease = leases.find(l => l.id === leaseId);
      if (lease) {
        const tenant = getTenantName(lease.tenant);
        const property = getPropertyName(lease.property_ref);
        const room = getRoomName(lease.room);
        
        const confirmed = confirm(
          `Renew lease for ${tenant} at ${property} - ${room}?\n\n` +
          `Current rent: $${lease.monthly_rent}/month\n` +
          `Current end date: ${lease.end_date}\n\n` +
          `This will extend the lease for another 12 months.`
        );
        
        if (confirmed) {
          // Calculate new end date (12 months from current end date)
          const currentEndDate = new Date(lease.end_date);
          const newEndDate = new Date(currentEndDate);
          newEndDate.setFullYear(newEndDate.getFullYear() + 1);
          
          const renewalData = {
            tenant: lease.tenant,
            room: lease.room,
            start_date: lease.end_date, // New lease starts when old one ends
            end_date: newEndDate.toISOString().split('T')[0],
            monthly_rent: lease.monthly_rent, // Keep same rent for now
            security_deposit: lease.security_deposit
          };
          
          await apiClient.createLease(renewalData);
          
          alert(`Lease renewed successfully!`);
          fetchData(); // Refresh data
        }
      }
    } catch (error: any) {
      alert(`Failed to renew lease: ${error.message}`);
    }
  };

  const handleMoveOut = async (leaseId: number) => {
    try {
      const lease = leases.find(l => l.id === leaseId);
      if (lease) {
        const tenant = getTenantName(lease.tenant);
        const moveOutDate = prompt(
          `Process move-out for ${tenant}?\n\nEnter move-out date (YYYY-MM-DD):`,
          new Date().toISOString().split('T')[0]
        );
        
        if (moveOutDate) {
          await apiClient.processMoveout(leaseId, {
            move_out_date: moveOutDate,
            move_out_condition: 'Good condition',
            deposit_returned: lease.security_deposit
          });
          
          alert(`Move-out processed successfully for ${tenant}`);
          fetchData(); // Refresh data
        }
      }
    } catch (error: any) {
      alert(`Failed to process move-out: ${error.message}`);
    }
  };

  const downloadLeasesReport = () => {
    const csvData = [
      ['Tenant', 'Email', 'Phone', 'Property', 'Room', 'Start Date', 'End Date', 'Monthly Rent', 'Security Deposit', 'Status', 'Days to Expiry'],
      ...leases.map(lease => {
        const tenant = tenants.find(t => t.id === lease.tenant);
        const daysToExpiry = getDaysUntilExpiry(lease.end_date);
        return [
          tenant?.full_name || 'Unknown',
          tenant?.email || '',
          tenant?.phone || '',
          getPropertyName(lease.property_ref),
          getRoomName(lease.room),
          lease.start_date,
          lease.end_date,
          formatCurrency(lease.monthly_rent),
          formatCurrency(lease.security_deposit),
          lease.status.toUpperCase(),
          daysToExpiry.toString()
        ];
      })
    ];
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tink-leases-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Calculate lease categories
  const activeLeases = leases.filter(lease => lease.status === 'active' || lease.is_active);
  const draftLeases = leases.filter(lease => lease.status === 'draft');
  const expiringLeases = leases.filter(lease => {
    const daysUntilExpiry = getDaysUntilExpiry(lease.end_date);
    return (lease.status === 'active' || lease.is_active) && daysUntilExpiry <= 90 && daysUntilExpiry > 0;
  });
  const expiredLeases = leases.filter(lease => {
    const daysUntilExpiry = getDaysUntilExpiry(lease.end_date);
    return (lease.status === 'active' || lease.is_active) && daysUntilExpiry <= 0;
  });
  
  // Calculate total monthly revenue
  const monthlyRevenue = activeLeases.reduce((sum, lease) => sum + (lease.monthly_rent || 0), 0);

  if (loading) {
    return (
      <DashboardLayout
        title="Lease Management"
        subtitle="Loading lease data..."
      >
        <div className="loading-indicator">
          <div className="loading-spinner"></div>
          <p>Fetching lease data...</p>
        </div>
        
        <style jsx>{`
          .loading-indicator {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-xl);
          }
          
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid var(--gray-200);
            border-top-color: var(--primary-blue);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: var(--spacing-md);
          }
          
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="">
      <Head>
        <title>Lease Management - Tink Property Management</title>
      </Head>
      
      <div className="dashboard-container">
        {/* Custom Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="dashboard-title">Lease Management</h1>
              <div className="subtitle-container">
                <p className="welcome-message">
                  Manage active leases, process renewals, and handle move-outs
                </p>
              </div>
            </div>
          </div>
        </div>

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
                <h3 className="metric-title">Active Leases</h3>
                <div className="metric-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="metric-content">
              <div className="metric-value">{activeLeases.length}</div>
              <div className="metric-subtitle">Currently active</div>
              <div className="metric-progress">
                <span className="metric-label">Across all properties</span>
                <span className="metric-change positive">+{activeLeases.length > 0 ? '1' : '0'}</span>
              </div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-info">
                <h3 className="metric-title">Expiring Soon</h3>
                <div className="metric-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="metric-content">
              <div className="metric-value">{expiringLeases.length}</div>
              <div className="metric-subtitle">Within 90 days</div>
              <div className="metric-progress">
                <span className="metric-label">Needs attention</span>
                <span className="metric-change ${expiringLeases.length > 0 ? 'warning' : 'positive'}">
                  {expiringLeases.length > 0 ? '⚠️' : '✓'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-info">
                <h3 className="metric-title">Monthly Revenue</h3>
                <div className="metric-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="metric-content">
              <div className="metric-value">{formatCurrency(monthlyRevenue)}</div>
              <div className="metric-subtitle">From active leases</div>
              <div className="metric-progress">
                <span className="metric-label">Recurring income</span>
                <span className="metric-change positive">+5%</span>
              </div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-info">
                <h3 className="metric-title">Draft Leases</h3>
                <div className="metric-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9"/>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="metric-content">
              <div className="metric-value">{draftLeases.length}</div>
              <div className="metric-subtitle">Awaiting activation</div>
              <div className="metric-progress">
                <span className="metric-label">Pending action</span>
                <span className="metric-change ${draftLeases.length > 0 ? 'warning' : 'positive'}">
                  {draftLeases.length > 0 ? '⚠️' : '✓'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* Active Leases Section */}
          <div className="leases-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Active Leases ({activeLeases.length})</h2>
                <p className="section-subtitle">Currently active leases across all properties</p>
              </div>
              <div className="section-actions">
                <button onClick={() => fetchData()} className="refresh-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10"/>
                    <polyline points="1 20 1 14 7 14"/>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                  </svg>
                  Refresh
                </button>
                <button onClick={downloadLeasesReport} className="download-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download Report
                </button>
              </div>
            </div>

            {activeLeases.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                  </svg>
                </div>
                <h3>No active leases</h3>
                <p>There are no active leases in the system yet.</p>
              </div>
            ) : (
              <div className="leases-scroll-container">
                <div className="leases-table-container">
                  <table className="leases-table">
                    <thead>
                      <tr>
                        <th className="table-left">Tenant</th>
                        <th className="table-left">Property</th>
                        <th className="table-left">Lease Details</th>
                        <th className="table-center">Status</th>
                        <th className="table-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeLeases.map((lease) => {
                        const daysToExpiry = getDaysUntilExpiry(lease.end_date);
                        const tenant = getTenantName(lease.tenant);
                        const tenantContact = getTenantContact(lease.tenant);
                        const property = getPropertyName(lease.property_ref);
                        const room = getRoomName(lease.room);
                        
                        return (
                          <tr key={lease.id}>
                            <td className="table-left">
                              <div className="tenant-name">{tenant}</div>
                              {tenantContact && (
                                <div className="tenant-contact">{tenantContact.phone}</div>
                              )}
                            </td>
                            <td className="table-left">
                              <div className="property-name">{property}</div>
                              <div className="room-name">{room}</div>
                            </td>
                            <td className="table-left">
                              <div className="lease-details">
                                <div className="lease-term">Term: <span className="date-highlight">{formatDate(lease.start_date)}</span> to <span className="date-highlight">{formatDate(lease.end_date)}</span></div>
                                <div className="lease-rent">Rent: ${lease.monthly_rent}/month</div>
                                <div className="lease-deposit">Deposit: ${lease.security_deposit}</div>
                              </div>
                            </td>
                            <td className="table-center">
                              <span className={`status-badge ${
                                daysToExpiry <= 30 ? 'critical' : 
                                daysToExpiry <= 90 ? 'warning' : 'active'
                              }`}>
                                {daysToExpiry <= 30 ? `${daysToExpiry} days left` : 
                                 daysToExpiry <= 90 ? `${daysToExpiry} days left` : 'Active'}
                              </span>
                            </td>
                            <td className="table-center">
                              <div className="action-buttons">
                                <button 
                                  onClick={() => handleRenewLease(lease.id)}
                                  className="renew-btn"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="23 4 23 10 17 10"/>
                                    <polyline points="1 20 1 14 7 14"/>
                                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                                  </svg>
                                  Renew
                                </button>
                                <button 
                                  onClick={() => handleMoveOut(lease.id)}
                                  className="moveout-btn"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 3l18 18"/>
                                    <path d="M21 12H3"/>
                                    <path d="M12 3v18"/>
                                  </svg>
                                  Move Out
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions Section */}
          <div className="quick-actions-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Quick Actions</h2>
                <p className="section-subtitle">Common lease management tasks</p>
              </div>
            </div>
            
            <div className="actions-grid">
              <div className="action-card blue" onClick={() => router.push('/applications')}>
                <div className="action-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <div className="action-content">
                  <h3 className="action-title">Review Applications</h3>
                  <p className="action-subtitle">Process new lease applications</p>
                </div>
              </div>

              <div className="action-card green" onClick={downloadLeasesReport}>
                <div className="action-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </div>
                <div className="action-content">
                  <h3 className="action-title">Download Report</h3>
                  <p className="action-subtitle">Export lease data to CSV</p>
                </div>
              </div>

              <div className="action-card purple" onClick={() => router.push('/tenants')}>
                <div className="action-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div className="action-content">
                  <h3 className="action-title">Manage Tenants</h3>
                  <p className="action-subtitle">View and manage all tenants</p>
                </div>
              </div>

              <div className="action-card blue" onClick={() => router.push('/properties')}>
                <div className="action-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 21h18"/>
                    <path d="M5 21V7l8-4v18"/>
                    <path d="M19 21V11l-6-4"/>
                  </svg>
                </div>
                <div className="action-content">
                  <h3 className="action-title">View Properties</h3>
                  <p className="action-subtitle">Manage property portfolio</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Sections */}
        {expiringLeases.length > 0 && (
          <div className="expiring-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Expiring Soon ({expiringLeases.length})</h2>
                <p className="section-subtitle">Leases expiring within the next 90 days</p>
              </div>
            </div>
            
            <div className="expiring-scroll-container">
              <div className="expiring-table-container">
                <table className="expiring-table">
                  <thead>
                    <tr>
                      <th className="table-left">Tenant</th>
                      <th className="table-left">Property</th>
                      <th className="table-center">Expiry</th>
                      <th className="table-center">Status</th>
                      <th className="table-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiringLeases.map((lease) => {
                      const daysToExpiry = getDaysUntilExpiry(lease.end_date);
                      return (
                        <tr key={lease.id}>
                          <td className="table-left">{getTenantName(lease.tenant)}</td>
                          <td className="table-left">
                            <div className="property-name">{getPropertyName(lease.property_ref)}</div>
                            <div className="room-name">{getRoomName(lease.room)}</div>
                          </td>
                          <td className="table-center">
                            <div className="expiry-date"><span className="date-highlight">{formatDate(lease.end_date)}</span></div>
                            <div className="expiry-days">{daysToExpiry} days left</div>
                          </td>
                          <td className="table-center">
                            <span className={`status-badge ${daysToExpiry <= 30 ? 'critical' : 'warning'}`}>
                              {daysToExpiry <= 30 ? 'Critical' : 'Expiring soon'}
                            </span>
                          </td>
                          <td className="table-center">
                            <button 
                              onClick={() => handleRenewLease(lease.id)} 
                              className="renew-now-btn"
                            >
                              Renew Now
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {draftLeases.length > 0 && (
          <div className="drafts-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Draft Leases ({draftLeases.length})</h2>
                <p className="section-subtitle">Pending leases awaiting activation</p>
              </div>
            </div>
            
            <div className="drafts-scroll-container">
              <div className="drafts-table-container">
                <table className="drafts-table">
                  <thead>
                    <tr>
                      <th className="table-left">Tenant</th>
                      <th className="table-left">Property</th>
                      <th className="table-left">Lease Details</th>
                      <th className="table-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draftLeases.map((lease) => (
                      <tr key={lease.id}>
                        <td className="table-left">{getTenantName(lease.tenant)}</td>
                        <td className="table-left">
                          <div className="property-name">{getPropertyName(lease.property_ref)}</div>
                          <div className="room-name">{getRoomName(lease.room)}</div>
                        </td>
                        <td className="table-left">
                          <div className="lease-details">
                            <div className="lease-term">Term: <span className="date-highlight">{formatDate(lease.start_date)}</span> to <span className="date-highlight">{formatDate(lease.end_date)}</span></div>
                            <div className="lease-rent">Rent: ${lease.monthly_rent}/month</div>
                          </div>
                        </td>
                        <td className="table-center">
                          <div className="draft-actions">
                            <button className="activate-btn">Activate</button>
                            <button className="delete-btn">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
          font-weight: 600;
        }

        .metric-change.positive {
          color: #10b981;
        }

        .metric-change.warning {
          color: #f59e0b;
        }

        /* Main Content */
        .main-content {
          display: grid;
          grid-template-columns: 3fr 1fr;
          gap: 20px;
          margin-bottom: 32px;
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

        /* Leases Section */
        .leases-section {
          background: white;
          border-radius: 6px;
          padding: 18px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          height: 420px;
          display: flex;
          flex-direction: column;
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

        .download-btn {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }
        
        .download-btn:hover {
          background: #3730a3;
          transform: translateY(-1px);
        }

        .create-btn {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 10px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .create-btn:hover {
          background: #3730a3;
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

        /* Tables */
        .leases-scroll-container, .expiring-scroll-container, .drafts-scroll-container {
          overflow-y: auto;
          flex: 1;
        }

        .leases-scroll-container {
        }

        .expiring-scroll-container, .drafts-scroll-container {
          max-height: 500px;
        }

        .leases-scroll-container::-webkit-scrollbar, 
        .expiring-scroll-container::-webkit-scrollbar, 
        .drafts-scroll-container::-webkit-scrollbar {
          width: 6px;
        }

        .leases-scroll-container::-webkit-scrollbar-track, 
        .expiring-scroll-container::-webkit-scrollbar-track, 
        .drafts-scroll-container::-webkit-scrollbar-track {
          background: rgba(226, 232, 240, 0.3);
          border-radius: 3px;
        }

        .leases-scroll-container::-webkit-scrollbar-thumb, 
        .expiring-scroll-container::-webkit-scrollbar-thumb, 
        .drafts-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }

        .leases-table-container, .expiring-table-container, .drafts-table-container {
          width: 100%;
          overflow-x: auto;
          border-radius: 8px;
          background: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .leases-table, .expiring-table, .drafts-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        
        .leases-table tbody tr, .expiring-table tbody tr, .drafts-table tbody tr {
          transition: background-color 0.2s ease;
        }

        .leases-table tbody tr:hover, .expiring-table tbody tr:hover, .drafts-table tbody tr:hover {
          background-color: #f9fafb;
        }

        .leases-table th, .expiring-table th, .drafts-table th {
          position: sticky;
          top: 0;
          background: #ffffff;
          z-index: 2;
          font-size: 12px;
          font-weight: 600;
          color: #9ca3af;
          padding: 12px 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #e5e7eb;
          text-align: left;
        }

        .leases-table td, .expiring-table td, .drafts-table td {
          padding: 12px 16px;
          vertical-align: middle;
          height: 48px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
          color: #374151;
        }

        .tenant-name {
          color: #1e293b;
          margin-bottom: 4px;
        }

        .tenant-contact {
          font-size: 12px;
          color: #64748b;
        }

        .property-name {
          color: #1e293b;
          margin-bottom: 4px;
        }

        .room-name {
          font-size: 12px;
          color: #64748b;
        }

        .lease-details {
          font-size: 13px;
        }

        .lease-term, .lease-rent, .lease-deposit {
          margin-bottom: 4px;
          color: #1e293b;
        }

        .lease-rent, .lease-deposit {
          font-size: 12px;
          color: #64748b;
        }

        .expiry-date {
          color: #1e293b;
          margin-bottom: 4px;
        }

        .expiry-days {
          font-size: 12px;
          color: #64748b;
        }

        .date-highlight {
          font-weight: 600;
          color: #374151;
          background-color: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          text-align: center;
          display: inline-block;
          min-width: 95px;
        }

        .status-badge.active {
          background: #dcfce7;
          color: #16a34a;
        }

        .status-badge.warning {
          background: #fef3c7;
          color: #d97706;
        }

        .status-badge.critical {
          background: #fee2e2;
          color: #dc2626;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          justify-content: center;
          align-items: center;
        }

        .renew-btn, .moveout-btn {
          border: none;
          padding: 6px 12px;
          border-radius: 5px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }
        
        .renew-now-btn {
          border: none;
          padding: 6px 12px;
          border-radius: 5px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .renew-btn, .renew-now-btn {
          background: #4f46e5;
          color: white;
        }

        .renew-btn:hover, .renew-now-btn:hover {
          background: #3730a3;
          transform: translateY(-1px);
        }

        .moveout-btn {
          background: #4f46e5;
          color: white;
        }

        .moveout-btn:hover {
          background: #3730a3;
          transform: translateY(-1px);
        }

        .draft-actions {
          display: flex;
          gap: 8px;
          justify-content: center;
        }

        .activate-btn, .delete-btn {
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid #e2e8f0;
        }

        .activate-btn {
          background: #10b981;
          color: white;
          border-color: #10b981;
        }

        .activate-btn:hover {
          background: #059669;
          transform: translateY(-1px);
        }

        .delete-btn {
          background: #ef4444;
          color: white;
          border-color: #ef4444;
        }

        .delete-btn:hover {
          background: #dc2626;
          transform: translateY(-1px);
        }

        /* Quick Actions Section */
        .quick-actions-section {
          background: white;
          border-radius: 6px;
          padding: 18px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          height: 420px;
          display: flex;
          flex-direction: column;
        }

        .actions-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
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
          width: 100%;
          box-sizing: border-box;
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

        /* Additional Sections */
        .expiring-section, .drafts-section {
          background: white;
          border-radius: 6px;
          padding: 18px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          margin-bottom: 20px;
        }

        /* Utility classes for alignment */
        .table-left { text-align: left !important; }
        .table-right { text-align: right !important; }
        .table-center { text-align: center !important; }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .main-content {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }

        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }

          .dashboard-container {
            padding: 24px 16px;
          }

          .section-actions {
            flex-direction: column;
            gap: 8px;
          }

          .action-buttons {
            flex-direction: column;
            gap: 8px;
          }
        }

        @media (max-width: 480px) {
          .metrics-grid {
            grid-template-columns: 1fr;
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
        :global(.dark-mode) .leases-section, 
        :global(.dark-mode) .quick-actions-section,
        :global(.dark-mode) .expiring-section,
        :global(.dark-mode) .drafts-section,
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
        :global(.dark-mode) .leases-table th, 
        :global(.dark-mode) .expiring-table th, 
        :global(.dark-mode) .drafts-table th {
          background-color: #1a1a1a !important;
          border-bottom: 1px solid #333333 !important;
        }
        :global(.dark-mode) .leases-table td, 
        :global(.dark-mode) .expiring-table td, 
        :global(.dark-mode) .drafts-table td {
          background-color: #111111 !important;
          border-bottom: 1px solid #333333 !important;
        }
        :global(.dark-mode) .error-banner {
          background: rgba(239, 68, 68, 0.1) !important;
          border-color: rgba(239, 68, 68, 0.3) !important;
          color: #ef4444 !important;
        }
      `}</style>
    </DashboardLayout>
  );
}

export default withAuth(Leases); 
