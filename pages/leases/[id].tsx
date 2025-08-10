import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';
import { withAuth } from '../../lib/auth-context';
import { apiClient } from '../../lib/api';
import { Lease, Tenant, Property, Room } from '../../lib/types';
import { formatCurrency } from '../../lib/utils';
import LeaseSigningActions from '../../components/LeaseSigningActions';
import { ArrowLeft, FileText, Home, User, Calendar } from 'lucide-react';

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    start_date: '',
    end_date: '',
    monthly_rent: '',
    security_deposit: ''
  });

  useEffect(() => {
    if (lease) {
      setEditData({
        start_date: lease.start_date,
        end_date: lease.end_date,
        monthly_rent: String(lease.monthly_rent),
        security_deposit: String(lease.security_deposit)
      });
    }
  }, [lease]);

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

  const handleUpdateLease = async () => {
    if (!lease) return;
    try {
      const payload = {
        ...editData,
        monthly_rent: parseFloat(editData.monthly_rent),
        security_deposit: parseFloat(editData.security_deposit),
      };
      await apiClient.updateLease(lease.id, payload);
      setShowEditModal(false);
      fetchLeaseData();
      alert('Lease updated successfully!');
    } catch (error) {
      console.error('Failed to update lease:', error);
      alert('Failed to update lease. Please check the console for details.');
    }
  };

  const handleDownloadLease = async () => {
    if (!lease) return;
    try {
      const downloadData = await apiClient.downloadDraftLease(lease.id);
      // Open download URL in new tab
      window.open(downloadData.download_url, '_blank');
    } catch (error: any) {
      alert(`Failed to download lease: ${error.message}`);
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
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
          {/* Modern Title Section */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            marginBottom: '2rem',
            marginTop: '1.5rem',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}>
            <div style={{
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <Link href="/leases" style={{ textDecoration: 'none' }}>
                  <button
                    style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      backgroundColor: '#f3f4f6',
                      border: 'none',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  >
                    <ArrowLeft style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />
                  </button>
                </Link>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  backgroundColor: '#3b82f6',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <FileText style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
                </div>
                <div>
                  <h1 style={{
                    fontSize: '1.875rem',
                    fontWeight: '700',
                    color: '#111827',
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>Lease #{lease.id}</h1>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#6b7280'
                  }}>
                    <User style={{ width: '1rem', height: '1rem' }} />
                    {tenant?.full_name || 'Unknown Tenant'}
                    <span style={{ color: '#d1d5db' }}>•</span>
                    <Home style={{ width: '1rem', height: '1rem' }} />
                    {property?.name || 'Unknown Property'}
                    {room && (
                      <>
                        <span style={{ color: '#d1d5db' }}>•</span>
                        {room.name}
                      </>
                    )}
              </div>
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                {lease.status === 'draft' && (
                  <>
                    <button
                      onClick={() => setShowEditModal(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#f1f5f9';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Edit Lease
                    </button>
                    <button
                      onClick={handleDownloadLease}
                  style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#f1f5f9';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7,10 12,15 17,10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Download
                    </button>
                  </>
                )}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.375rem 0.875rem',
                  borderRadius: '9999px',
                  fontSize: '0.8125rem',
                  fontWeight: '600',
                  backgroundColor: 
                    lease.status === 'draft' ? '#fef3c7' :
                    lease.status === 'sent_to_tenant' ? '#dbeafe' :
                    lease.status === 'signed' ? '#d1fae5' :
                    lease.status === 'active' ? '#dcfce7' : '#f3f4f6',
                  color:
                    lease.status === 'draft' ? '#92400e' :
                    lease.status === 'sent_to_tenant' ? '#1d4ed8' :
                    lease.status === 'signed' ? '#065f46' :
                    lease.status === 'active' ? '#166534' : '#6b7280'
                }}>
                  {lease.status?.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Main Layout - 3:1 Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '3fr 1fr',
            gap: '2rem',
            alignItems: 'start'
          }}>
            {/* Left Side - 3 Columns */}
            <div>
              {/* Metric Cards - 3 Columns */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1.5rem',
                marginBottom: '2rem'
              }}>
                {/* Monthly Rent Card */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem'
                  }}>
                    <h3 style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      margin: 0,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Monthly Rent</h3>
                    <div style={{
                      width: '2rem',
                      height: '2rem',
                      backgroundColor: '#10b981',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23"/>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                  </div>
                </div>
                  <div>
                    <div style={{
                      fontSize: '1.875rem',
                      fontWeight: '700',
                      color: '#111827',
                      marginBottom: '0.25rem'
                    }}>{formatCurrency(lease.monthly_rent)}</div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>per month</div>
              </div>
            </div>

                {/* Security Deposit Card */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem'
                  }}>
                    <h3 style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      margin: 0,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Security Deposit</h3>
                    <div style={{
                      width: '2rem',
                      height: '2rem',
                      backgroundColor: '#f59e0b',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                </div>
                  <div>
                    <div style={{
                      fontSize: '1.875rem',
                      fontWeight: '700',
                      color: '#111827',
                      marginBottom: '0.25rem'
                    }}>{formatCurrency(lease.security_deposit)}</div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>security deposit</div>
              </div>
            </div>

                {/* Days Remaining Card */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem'
                  }}>
                    <h3 style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      margin: 0,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Days Remaining</h3>
                    <div style={{
                      width: '2rem',
                      height: '2rem',
                      backgroundColor: '#3b82f6',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                </div>
                  <div>
                    <div style={{
                      fontSize: '1.875rem',
                      fontWeight: '700',
                      color: '#111827',
                      marginBottom: '0.25rem'
                    }}>{getDaysRemaining()}</div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>days until expiry</div>
              </div>
            </div>
          </div>

              {/* Content Sections - Full Width Stacked */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
              }}>
                {/* Lease Information - Full Width */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                  <div style={{
                    borderBottom: '1px solid #e5e7eb',
                    paddingBottom: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <h2 style={{
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      color: '#111827',
                      margin: 0,
                      marginBottom: '0.25rem'
                    }}>Lease Information</h2>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      margin: 0
                    }}>Agreement details and terms</p>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '1.5rem'
                  }}>
                  <div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>Lease ID</div>
                      <div style={{
                        fontSize: '1rem',
                        color: '#111827'
                      }}>#{lease.id}</div>
                  </div>
                    <div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>Status</div>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: 
                          lease.status === 'draft' ? '#fef3c7' :
                          lease.status === 'sent_to_tenant' ? '#dbeafe' :
                          lease.status === 'signed' ? '#d1fae5' :
                          lease.status === 'active' ? '#dcfce7' : '#f3f4f6',
                        color:
                          lease.status === 'draft' ? '#92400e' :
                          lease.status === 'sent_to_tenant' ? '#1d4ed8' :
                          lease.status === 'signed' ? '#065f46' :
                          lease.status === 'active' ? '#166534' : '#6b7280'
                      }}>
                        {lease.status?.replace('_', ' ')}
                </div>
                  </div>
                    <div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>Start Date</div>
                      <div style={{
                        fontSize: '1rem',
                        color: '#111827'
                      }}>{formatDate(lease.start_date)}</div>
                    </div>
                    <div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>End Date</div>
                      <div style={{
                        fontSize: '1rem',
                        color: '#111827'
                      }}>{formatDate(lease.end_date)}</div>
                  </div>
                    <div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>Monthly Rent</div>
                      <div style={{
                        fontSize: '1rem',
                        color: '#111827'
                      }}>{formatCurrency(lease.monthly_rent)}</div>
                  </div>
                    <div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>Security Deposit</div>
                      <div style={{
                        fontSize: '1rem',
                        color: '#111827'
                      }}>{formatCurrency(lease.security_deposit)}</div>
                  </div>
                    <div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>Lease Term</div>
                      <div style={{
                        fontSize: '1rem',
                        color: '#111827'
                      }}>{getDaysRemaining()} days remaining</div>
                  </div>
                    <div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>Created</div>
                      <div style={{
                        fontSize: '1rem',
                        color: '#111827'
                      }}>{lease.created_at ? formatDate(lease.created_at) : 'N/A'}</div>
                  </div>
                </div>
              </div>

                {/* Tenant Information - Full Width */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                  <div style={{
                    borderBottom: '1px solid #e5e7eb',
                    paddingBottom: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <h2 style={{
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      color: '#111827',
                      margin: 0,
                      marginBottom: '0.25rem'
                    }}>Tenant Information</h2>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      margin: 0
                    }}>Contact details and personal information</p>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '1.5rem'
                  }}>
                  <div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>Full Name</div>
                      <div style={{
                        fontSize: '1rem',
                        color: '#111827'
                      }}>{tenant?.full_name || 'Unknown Tenant'}</div>
                  </div>
                    <div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>Email Address</div>
                      <div style={{
                        fontSize: '1rem',
                        color: '#3b82f6'
                      }}>
                        <a href={`mailto:${tenant?.email}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          {tenant?.email || 'Not available'}
                        </a>
                </div>
                  </div>
                    <div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>Phone Number</div>
                      <div style={{
                        fontSize: '1rem',
                        color: '#3b82f6'
                      }}>
                        <a href={`tel:${tenant?.phone}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          {tenant?.phone || 'Not available'}
                        </a>
                    </div>
                  </div>
                    <div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>Tenant ID</div>
                      <div style={{
                        fontSize: '1rem',
                        color: '#111827'
                      }}>#{tenant?.id}</div>
                    </div>
                    <div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>Created Date</div>
                      <div style={{
                        fontSize: '1rem',
                        color: '#111827'
                      }}>{tenant?.created_at ? formatDate(tenant.created_at) : 'Not available'}</div>
                  </div>
                    <div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>Emergency Contact</div>
                      <div style={{
                        fontSize: '1rem',
                        color: '#111827'
                      }}>{tenant?.emergency_contact_name || 'Not provided'}</div>
                  </div>
                    <div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>Emergency Phone</div>
                      <div style={{
                        fontSize: '1rem',
                        color: '#3b82f6'
                      }}>
                        <a href={`tel:${tenant?.emergency_contact_phone}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          {tenant?.emergency_contact_phone || 'Not provided'}
                        </a>
                </div>
              </div>
                  <div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>Current Address</div>
                      <div style={{
                        fontSize: '1rem',
                        color: '#111827'
                      }}>{tenant?.current_address || 'Not provided'}</div>
                  </div>
                </div>
                </div>

                {/* Lease Timeline - Full Width */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                  <div style={{
                    borderBottom: '1px solid #e5e7eb',
                    paddingBottom: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <h2 style={{
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      color: '#111827',
                      margin: 0,
                      marginBottom: '0.25rem'
                    }}>Lease Timeline</h2>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      margin: 0
                    }}>Workflow progress and key dates</p>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '2rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      padding: '1rem',
                      backgroundColor: lease.created_at ? '#f0fdf4' : '#f9fafb',
                      borderRadius: '12px',
                      border: lease.created_at ? '2px solid #bbf7d0' : '2px solid #e5e7eb'
                    }}>
                      <div style={{
                        width: '3rem',
                        height: '3rem',
                        borderRadius: '50%',
                        backgroundColor: lease.created_at ? '#10b981' : '#d1d5db',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1rem'
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14,2 14,8 20,8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <polyline points="10,9 9,9 8,9"/>
                        </svg>
                      </div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '700',
                        color: '#111827',
                        marginBottom: '0.25rem'
                      }}>Lease Created</div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280'
                      }}>
                        {lease.created_at ? formatDate(lease.created_at) : 'Pending'}
                    </div>
                  </div>
                  
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      padding: '1rem',
                      backgroundColor: lease.sent_to_tenant_at ? '#f0fdf4' : 
                        lease.status === 'draft' ? '#eff6ff' : '#f9fafb',
                      borderRadius: '12px',
                      border: lease.sent_to_tenant_at ? '2px solid #bbf7d0' : 
                        lease.status === 'draft' ? '2px solid #dbeafe' : '2px solid #e5e7eb'
                    }}>
                      <div style={{
                        width: '3rem',
                        height: '3rem',
                        borderRadius: '50%',
                        backgroundColor: lease.sent_to_tenant_at ? '#10b981' : 
                          lease.status === 'draft' ? '#3b82f6' : '#d1d5db',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1rem'
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                          <polyline points="22,6 12,13 2,6"/>
                        </svg>
                      </div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '700',
                        color: '#111827',
                        marginBottom: '0.25rem'
                      }}>Sent to Tenant</div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280'
                      }}>
                        {lease.sent_to_tenant_at ? formatDate(lease.sent_to_tenant_at) : 
                         lease.status === 'sent_to_tenant' ? 'Sent (date not recorded)' : 'Pending'}
                    </div>
                  </div>
                  
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      padding: '1rem',
                      backgroundColor: lease.signed_at ? '#f0fdf4' : 
                        lease.status === 'sent_to_tenant' ? '#eff6ff' : '#f9fafb',
                      borderRadius: '12px',
                      border: lease.signed_at ? '2px solid #bbf7d0' : 
                        lease.status === 'sent_to_tenant' ? '2px solid #dbeafe' : '2px solid #e5e7eb'
                    }}>
                      <div style={{
                        width: '3rem',
                        height: '3rem',
                        borderRadius: '50%',
                        backgroundColor: lease.signed_at ? '#10b981' : 
                          lease.status === 'sent_to_tenant' ? '#3b82f6' : '#d1d5db',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1rem'
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                        </svg>
                      </div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '700',
                        color: '#111827',
                        marginBottom: '0.25rem'
                      }}>Tenant Signed</div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280'
                      }}>
                        {lease.signed_at ? formatDate(lease.signed_at) : 'Awaiting tenant signature'}
                    </div>
                  </div>
                  
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      padding: '1rem',
                      backgroundColor: lease.activated_at ? '#f0fdf4' : 
                        lease.status === 'signed' ? '#eff6ff' : '#f9fafb',
                      borderRadius: '12px',
                      border: lease.activated_at ? '2px solid #bbf7d0' : 
                        lease.status === 'signed' ? '2px solid #dbeafe' : '2px solid #e5e7eb'
                    }}>
                      <div style={{
                        width: '3rem',
                        height: '3rem',
                        borderRadius: '50%',
                        backgroundColor: lease.activated_at ? '#10b981' : 
                          lease.status === 'signed' ? '#3b82f6' : '#d1d5db',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1rem'
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '700',
                        color: '#111827',
                        marginBottom: '0.25rem'
                      }}>Lease Activated</div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280'
                      }}>
                        {lease.activated_at ? formatDate(lease.activated_at) : 'Pending activation'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Property Info Column */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}>
              {/* Property Information */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
                <div style={{
                  borderBottom: '1px solid #e5e7eb',
                  paddingBottom: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#111827',
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>Property Information</h2>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: 0
                  }}>Location and property details</p>
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}>Property Name</div>
                    <div style={{
                      fontSize: '1rem',
                      color: '#111827'
                    }}>{property?.name || 'Unknown Property'}</div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}>Address</div>
                    <div style={{
                      fontSize: '1rem',
                      color: '#111827'
                    }}>{property?.address || 'Not available'}</div>
                </div>
                  <div>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}>Room</div>
                    <div style={{
                      fontSize: '1rem',
                      color: '#111827'
                    }}>{room?.name || `Room ${lease.room}`}</div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}>Room Type</div>
                    <div style={{
                      fontSize: '1rem',
                      color: '#111827'
                    }}>{room?.room_type || 'Standard'}</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
                <div style={{
                  borderBottom: '1px solid #e5e7eb',
                  paddingBottom: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#111827',
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>Quick Actions</h2>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: 0
                  }}>Lease management options</p>
                  </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <button
                    onClick={() => setShowRenewalForm(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '1rem',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#dcfce7';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0fdf4';
                    }}
                  >
                    <div style={{
                      width: '2rem',
                      height: '2rem',
                      backgroundColor: '#10b981',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#111827',
                        marginBottom: '0.125rem'
                      }}>Renew Lease</div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280'
                      }}>Extend lease duration</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setShowMoveOutForm(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '1rem',
                      backgroundColor: '#eff6ff',
                      border: '1px solid #dbeafe',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#dbeafe';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#eff6ff';
                    }}
                  >
                    <div style={{
                      width: '2rem',
                      height: '2rem',
                      backgroundColor: '#3b82f6',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#111827',
                        marginBottom: '0.125rem'
                      }}>Process Move-Out</div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280'
                      }}>End lease and return deposit</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Lease Signing */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
                <div style={{
                  borderBottom: '1px solid #e5e7eb',
                  paddingBottom: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#111827',
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>Lease Signing</h2>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: 0
                  }}>Manage lease documents and signing workflow</p>
                </div>
                <LeaseSigningActions 
                  lease={lease} 
                  onLeaseUpdated={fetchLeaseData}
                />
              </div>
            </div>
          </div>

          {/* Edit Lease Modal */}
          {showEditModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3 className="modal-title">Edit Lease</h3>
                  <button className="modal-close" onClick={() => setShowEditModal(false)}>
                    &times;
                  </button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      value={editData.start_date}
                      onChange={(e) => setEditData({ ...editData, start_date: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input
                      type="date"
                      value={editData.end_date}
                      onChange={(e) => setEditData({ ...editData, end_date: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monthly Rent</label>
                    <input
                      type="number"
                      value={editData.monthly_rent}
                      onChange={(e) => setEditData({ ...editData, monthly_rent: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Security Deposit</label>
                    <input
                      type="number"
                      value={editData.security_deposit}
                      onChange={(e) => setEditData({ ...editData, security_deposit: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleUpdateLease}>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

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

          .action-card.outline {
            background: #f8fafc;
            border-color: #e2e8f0;
            color: #4f46e5;
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

          .action-card.outline .action-icon {
            background: #e2e8f0;
            color: #4f46e5;
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

          .btn-outline {
            background: #f8fafc;
            color: #4f46e5;
            border: 1px solid #e2e8f0;
          }

          .btn-outline:hover {
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

          .timeline {
            display: flex;
            flex-direction: column;
            gap: 20px;
            padding: 16px 0;
          }

          .timeline-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            position: relative;
          }

          .timeline-item::before {
            content: '';
            position: absolute;
            top: 10px;
            left: 10px;
            width: 2px;
            height: calc(100% - 20px);
            background: #e0e0e0;
            z-index: -1;
          }

          .timeline-item.completed::before {
            background: #10b981; /* Green for completed */
          }

          .timeline-item.current::before {
            background: #f59e0b; /* Orange for current */
          }

          .timeline-item.pending::before {
            background: #e0e0e0; /* Grey for pending */
          }

          .timeline-marker {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #e0e0e0;
            flex-shrink: 0;
            border: 2px solid white;
            box-shadow: 0 0 0 2px #e0e0e0;
          }

          .timeline-item.completed .timeline-marker {
            background: #10b981;
            box-shadow: 0 0 0 2px #10b981;
          }

          .timeline-item.current .timeline-marker {
            background: #f59e0b;
            box-shadow: 0 0 0 2px #f59e0b;
          }

          .timeline-item.pending .timeline-marker {
            background: #e0e0e0;
            box-shadow: 0 0 0 2px #e0e0e0;
          }

          .timeline-content {
            flex: 1;
          }

          .timeline-title {
            font-size: 13px;
            font-weight: 600;
            color: #1e293b;
            margin: 0 0 4px 0;
          }

          .timeline-date {
            font-size: 11px;
            color: #64748b;
            margin-bottom: 4px;
          }

          .timeline-description {
            font-size: 11px;
            color: #94a3b8;
            margin: 0;
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