import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '../components/DashboardLayout';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { withAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';
import { Lease, Tenant, Property, Room } from '../lib/types';
import { formatCurrency } from '../lib/utils';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  FileText, 
  Clock, 
  DollarSign, 
  Edit, 
  RefreshCw, 
  Download,
  AlertTriangle,
  CheckCircle,
  LogOut,
  Calendar,
  Calculator
} from 'lucide-react';

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
  const [showMoveOutModal, setShowMoveOutModal] = useState<number | null>(null);
  const [moveOutDate, setMoveOutDate] = useState('');
  const [depositReturn, setDepositReturn] = useState('');
  const [moveOutCalculations, setMoveOutCalculations] = useState<{
    monthsRemaining: number;
    daysRemaining: number;
    rentForgo: number;
    depositReturned: number;
    totalForgo: number;
  } | null>(null);

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

  // Helper functions for lease objects (use lease data directly)
  const getTenantNameFromLease = (lease: Lease) => {
    return lease.tenant_name || 'Unknown Tenant';
  };

  const getPropertyNameFromLease = (lease: Lease) => {
    return lease.property_name || 'Unknown Property';
  };

  const getRoomNameFromLease = (lease: Lease) => {
    return lease.room_name || 'Unknown Room';
  };

  // Legacy functions for backward compatibility (ID-based lookup)
  const getTenantName = (tenantId: number) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? tenant.full_name : 'Unknown Tenant';
  };

  const getTenantContact = (tenantId: number) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? { email: tenant.email, phone: tenant.phone } : null;
  };

  const getPropertyName = (propertyId: number | undefined) => {
    if (!propertyId) return 'Unknown Property';
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

  const handleActivateLease = async (lease: any) => {
    try {
      setError(null);
      const currentUser = await apiClient.getProfile();
      const payload = {
        tenant: lease.tenant,
        room: lease.room,
        property_ref: lease.property_ref,
        application: lease.application,
        start_date: lease.start_date,
        end_date: lease.end_date,
        monthly_rent: lease.monthly_rent,
        security_deposit: lease.security_deposit,
        created_by: currentUser.id,
        status: 'active',
        is_active: true,
      };
      await apiClient.updateLease(lease.id, payload);
      try {
        if (lease.application) {
          await apiClient.updateApplication(lease.application, { status: 'moved_in' } as any);
        } else {
          // attempt to locate the related application (still in lease_created)
          const appSearch = await apiClient.getApplications({
            tenant: lease.tenant,
            property: lease.property_ref,
            status: 'lease_created'
          } as any);

          const foundApp = appSearch.results?.[0];
          if (foundApp) {
            await apiClient.updateApplication(foundApp.id, { status: 'moved_in', lease: lease.id } as any);
          }
        }
      } catch (linkErr) {
        console.warn('Failed to update application to active', linkErr);
      }
      await fetchData();
    } catch (e:any) {
      setError(e.message || 'Failed to activate lease');
    }
  };

  const handleSendToTenant = async (lease: Lease) => {
    try {
      setError(null);
      await apiClient.sendLeaseToTenant(lease.id);
      await fetchData();
      alert('Lease sent to tenant successfully!');
    } catch (e: any) {
      setError(e.message || 'Failed to send lease to tenant');
    }
  };

  const handleDownloadLease = async (lease: Lease) => {
    try {
      setError(null);
      
      // Prioritize signed lease if available, otherwise download draft
      if (lease.status === 'signed' || lease.status === 'active') {
        try {
          const signedDownloadData = await apiClient.downloadSignedLease(lease.id);
          window.open(signedDownloadData.download_url, '_blank');
          return;
        } catch (signedError) {
          console.warn('Signed lease not available, falling back to draft:', signedError);
          // Fall through to draft download
        }
      }
      
      // Download draft lease as fallback
      const downloadData = await apiClient.downloadDraftLease(lease.id);
      window.open(downloadData.download_url, '_blank');
    } catch (e: any) {
      setError(e.message || 'Failed to download lease PDF');
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

  const calculateMoveOutImpact = (lease: Lease, moveOutDate: string, depositReturnAmount?: string) => {
    const moveOut = new Date(moveOutDate);
    const leaseEnd = new Date(lease.end_date);
    
    // Calculate time remaining from move-out date to lease end
    const timeDiff = leaseEnd.getTime() - moveOut.getTime();
    const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
    
    // Calculate months and remaining days
    const monthsRemaining = Math.floor(daysRemaining / 30);
    const extraDays = daysRemaining % 30;
    
    // Calculate rent forgo (prorated)
    const dailyRent = parseFloat(lease.monthly_rent.toString()) / 30;
    const rentForgo = dailyRent * daysRemaining;
    
    // Calculate deposit return (default to full deposit if not specified)
    const depositReturned = depositReturnAmount ? parseFloat(depositReturnAmount) : parseFloat(lease.security_deposit.toString());
    
    // Total financial impact = rent forgo - deposit returned
    const totalForgo = rentForgo - depositReturned;
    
    return {
      monthsRemaining,
      daysRemaining: extraDays,
      totalDaysRemaining: daysRemaining,
      rentForgo: Math.round(rentForgo * 100) / 100,
      depositReturned: Math.round(depositReturned * 100) / 100,
      totalForgo: Math.round(totalForgo * 100) / 100
    };
  };

  const handleMoveOutClick = (lease: Lease) => {
    setShowMoveOutModal(lease.id);
    setMoveOutDate(new Date().toISOString().split('T')[0]); // Default to today
    setDepositReturn(lease.security_deposit.toString()); // Default to full deposit
    const calculations = calculateMoveOutImpact(lease, new Date().toISOString().split('T')[0], lease.security_deposit.toString());
    setMoveOutCalculations(calculations);
  };

  const handleMoveOutDateChange = (date: string, lease: Lease) => {
    setMoveOutDate(date);
    const calculations = calculateMoveOutImpact(lease, date);
    setMoveOutCalculations(calculations);
  };

  const handleConfirmMoveOut = async (lease: Lease) => {
    try {
      setError(null);
      
      console.log('Processing move-out with data:', {
        move_out_date: moveOutDate,
        move_out_condition: 'Manual move-out processed',
        cleaning_charges: 0,
        damage_charges: 0,
        deposit_returned: parseFloat(depositReturn || lease.security_deposit.toString())
      });
      
      await apiClient.processMoveout(lease.id, {
        move_out_date: moveOutDate,
        move_out_condition: 'Manual move-out processed',
        cleaning_charges: 0,
        damage_charges: 0,
        deposit_returned: parseFloat(depositReturn || lease.security_deposit.toString())
      });
      
      // Refresh data to show updated lease status
      await fetchData();
      
      // Close modal and reset states
      setShowMoveOutModal(null);
      setMoveOutCalculations(null);
      setDepositReturn(''); // Reset deposit return state
      setMoveOutDate(''); // Reset move out date state
      
      alert('Move-out processed successfully!');
    } catch (error: any) {
      console.error('Failed to process move-out:', error);
      console.error('Error response:', error.response?.data);
      
      // Show more detailed error message
      let errorMessage = 'Failed to process move-out';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else {
          errorMessage = JSON.stringify(error.response.data);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    }
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
  
  // Create a unified, sorted list of leases
  const sortedLeases = [...leases].sort((a, b) => {
    // Sort by status: draft leases first
    if (a.status === 'draft' && b.status !== 'draft') return -1;
    if (a.status !== 'draft' && b.status === 'draft') return 1;
    
    // Then sort by end date (soonest expiring first)
    return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
  });
  
  // Calculate total monthly revenue
  const monthlyRevenue = activeLeases.reduce((sum, lease) => sum + (lease.monthly_rent || 0), 0);

  if (loading) {
    return (
      <DashboardLayout
        title="Lease Management"
        subtitle="Loading lease data..."
      >
        <LoadingSpinner />
        
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

      {/* Move-out Confirmation Modal */}
      {showMoveOutModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            {(() => {
              const lease = leases.find(l => l.id === showMoveOutModal);
              if (!lease) return null;
              
              return (
                <>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{
                      width: '3rem',
                      height: '3rem',
                      backgroundColor: '#fef2f2',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <LogOut style={{ width: '1.5rem', height: '1.5rem', color: '#dc2626' }} />
                    </div>
                    <div>
                      <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: '#111827',
                        margin: 0
                      }}>
                        Process Move-Out
                      </h2>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        margin: '0.25rem 0 0 0'
                      }}>
                        {getTenantNameFromLease(lease)} - {getPropertyNameFromLease(lease)}
                      </p>
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.75rem'
                    }}>
                      <Calendar style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        Move-out Date
                      </span>
                    </div>
                    <input
                      type="date"
                      value={moveOutDate}
                      onChange={(e) => handleMoveOutDateChange(e.target.value, lease)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div style={{
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.75rem'
                    }}>
                      <DollarSign style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        Security Deposit Return
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={depositReturn}
                      onChange={(e) => {
                        setDepositReturn(e.target.value);
                        const calculations = calculateMoveOutImpact(lease, moveOutDate, e.target.value);
                        setMoveOutCalculations(calculations);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '0.875rem'
                      }}
                      placeholder="0.00"
                    />
                  </div>

                  {moveOutCalculations && (
                    <div style={{
                      backgroundColor: '#fef3c7',
                      borderRadius: '8px',
                      padding: '1rem',
                      marginBottom: '1.5rem',
                      border: '1px solid #fbbf24'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.75rem'
                      }}>
                        <Calculator style={{ width: '1rem', height: '1rem', color: '#d97706' }} />
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#92400e'
                        }}>
                          Financial Impact
                        </span>
                      </div>
                      
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '1rem',
                        fontSize: '0.875rem'
                      }}>
                        <div>
                          <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>
                            Time Remaining
                          </div>
                          <div style={{ fontWeight: '600', color: '#374151' }}>
                            {moveOutCalculations.monthsRemaining} months, {moveOutCalculations.daysRemaining} days
                          </div>
                        </div>
                        <div>
                          <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>
                            Rent Forgo
                          </div>
                          <div style={{ fontWeight: '600', color: '#dc2626' }}>
                            ${moveOutCalculations.rentForgo.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>
                            Deposit Return
                          </div>
                          <div style={{ fontWeight: '600', color: '#16a34a' }}>
                            ${moveOutCalculations.depositReturned.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div style={{
                        marginTop: '0.75rem',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid #fbbf24',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ color: '#6b7280', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                            Net Financial Impact
                          </div>
                          <div style={{ 
                            fontWeight: '700', 
                            fontSize: '1.125rem',
                            color: moveOutCalculations.totalForgo > 0 ? '#dc2626' : '#16a34a'
                          }}>
                            {moveOutCalculations.totalForgo > 0 ? '-' : '+'}${Math.abs(moveOutCalculations.totalForgo).toFixed(2)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                            Lease ends: {formatDate(lease.end_date)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    gap: '0.75rem',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      onClick={() => {
                        setShowMoveOutModal(null);
                        setMoveOutCalculations(null);
                      }}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#f8fafc',
                        color: '#374151',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#f1f5f9';
                        e.currentTarget.style.borderColor = '#94a3b8';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleConfirmMoveOut(lease)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                    >
                      Confirm Move-Out
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

  return (
    <DashboardLayout title="">
      <Head>
        <title>Lease Management - Tink Property Management</title>
      </Head>
      
      <div style={{ padding: '2rem' }}>
        {/* Modern Header - Full Width */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: '2rem',
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
              <div style={{
                width: '3rem',
                height: '3rem',
                backgroundColor: '#2563eb',
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
                }}>Lease Management</h1>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#6b7280'
                }}>
                  Manage active leases, process renewals, and handle move-outs
              </div>
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <button 
                onClick={() => fetchData()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
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
                <RefreshCw style={{ width: '1rem', height: '1rem' }} />
                Refresh
              </button>
              <button 
                onClick={downloadLeasesReport}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              >
                <Download style={{ width: '1rem', height: '1rem' }} />
                Download Report
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: '#dc2626'
          }}>
            <AlertTriangle style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0 }} />
            {error}
          </div>
        )}
        
        {/* Modern Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '3fr 1fr',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Left side - 3 metric cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.5rem'
          }}>
            {[
              {
                title: 'Active Leases',
                value: activeLeases.length,
                subtitle: 'Currently active',
                icon: FileText,
                bgColor: '#eff6ff',
                iconColor: '#2563eb'
              },
              {
                title: 'Expiring Soon',
                value: expiringLeases.length,
                subtitle: 'Within 90 days',
                icon: Clock,
                bgColor: '#fff7ed',
                iconColor: '#ea580c'
              },
              {
                title: 'Monthly Revenue',
                value: formatCurrency(monthlyRevenue),
                subtitle: 'From active leases',
                icon: DollarSign,
                bgColor: '#f0fdf4',
                iconColor: '#16a34a'
              }
            ].map((metric, index) => (
              <div key={index} style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
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
                    color: '#374151',
                    margin: 0
                  }}>{metric.title}</h3>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    backgroundColor: metric.bgColor,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <metric.icon style={{ width: '1.25rem', height: '1.25rem', color: metric.iconColor }} />
                </div>
              </div>
                <div style={{
                  fontSize: '1.875rem',
                  fontWeight: '700',
                  color: '#111827',
                  marginBottom: '0.5rem'
                }}>{metric.value}</div>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  margin: 0
                }}>{metric.subtitle}</p>
            </div>
            ))}
          </div>
          
          {/* Right side - Draft Leases metric card */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            e.currentTarget.style.transform = 'translateY(-2px)';
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
                color: '#374151',
                margin: 0
              }}>Draft Leases</h3>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                backgroundColor: '#fdf4ff',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Edit style={{ width: '1.25rem', height: '1.25rem', color: '#a855f7' }} />
                </div>
              </div>
            <div style={{
              fontSize: '1.875rem',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '0.5rem'
            }}>{draftLeases.length}</div>
            <p style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              margin: 0
            }}>Awaiting activation</p>
            </div>
          </div>
          
        {/* Main Content - 3:1 Grid Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '3fr 1fr',
          gap: '1.5rem',
          alignItems: 'start'
        }}>
          {/* Left Column (3 parts): All Leases Table */}
              <div>
            {/* All Leases Section */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              overflow: 'visible',
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
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#111827',
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>All Leases ({leases.length})</h2>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: 0
                  }}>Manage all draft, active, and expiring leases in one place</p>
              </div>
            </div>

            {leases.length === 0 ? (
                <div style={{
                  padding: '3rem',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  <div style={{
                    width: '3rem',
                    height: '3rem',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem'
                  }}>
                    <FileText style={{ width: '1.5rem', height: '1.5rem', color: '#9ca3af' }} />
                </div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#374151',
                    margin: '0 0 0.5rem'
                  }}>No leases found</h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: 0
                  }}>There are no leases in the system yet.</p>
              </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse'
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc' }}>
                        <th style={{
                          padding: '0.75rem 1rem',
                          textAlign: 'center',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#374151',
                          borderBottom: '1px solid #e5e7eb'
                        }}>Tenant</th>
                        <th style={{
                          padding: '0.75rem 1rem',
                          textAlign: 'center',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#374151',
                          borderBottom: '1px solid #e5e7eb'
                        }}>Property</th>
                        <th style={{
                          padding: '0.75rem 1rem',
                          textAlign: 'center',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#374151',
                          borderBottom: '1px solid #e5e7eb'
                        }}>Lease Details</th>
                        <th style={{
                          padding: '0.75rem 1rem',
                          textAlign: 'center',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#374151',
                          borderBottom: '1px solid #e5e7eb'
                        }}>Status</th>
                        <th style={{
                          padding: '0.75rem 1rem',
                          textAlign: 'center',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#374151',
                          borderBottom: '1px solid #e5e7eb'
                        }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedLeases.map((lease) => {
                        const daysToExpiry = getDaysUntilExpiry(lease.end_date);
                        const tenant = getTenantNameFromLease(lease);
                        const tenantContact = getTenantContact(lease.tenant);
                        const property = getPropertyNameFromLease(lease);
                        const room = getRoomNameFromLease(lease);
                        
                        return (
                          <tr key={lease.id} style={{
                            borderBottom: '1px solid #f3f4f6',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <td style={{
                              padding: '1rem',
                              textAlign: 'center',
                              borderBottom: '1px solid #f3f4f6'
                            }}>
                              <div 
                                onClick={() => router.push(`/tenants/${lease.tenant}`)}
                                style={{
                                  fontSize: '0.875rem',
                                  fontWeight: '500',
                                  color: '#374151',
                                  cursor: 'pointer',
                                  transition: 'color 0.2s ease'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.color = '#1f2937'}
                                onMouseOut={(e) => e.currentTarget.style.color = '#374151'}
                              >
                                {tenant}
                              </div>
                              {tenantContact && (
                                <div style={{
                                  fontSize: '0.75rem',
                                  color: '#6b7280'
                                }}>{tenantContact.phone}</div>
                              )}
                            </td>
                            <td style={{
                              padding: '1rem',
                              textAlign: 'center',
                              borderBottom: '1px solid #f3f4f6'
                            }}>
                              <div 
                                onClick={() => router.push(`/properties/${lease.property_ref}`)}
                                style={{
                                  fontSize: '0.875rem',
                                  fontWeight: '500',
                                  color: '#374151',
                                  cursor: 'pointer',
                                  marginBottom: '0.25rem',
                                  transition: 'color 0.2s ease'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.color = '#1f2937'}
                                onMouseOut={(e) => e.currentTarget.style.color = '#374151'}
                              >
                                {property}
                              </div>
                              <div style={{
                                fontSize: '0.75rem',
                                color: '#6b7280'
                              }}>{room}</div>
                            </td>
                            <td style={{
                              padding: '1rem',
                              textAlign: 'center',
                              borderBottom: '1px solid #f3f4f6'
                            }}>
                              <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.375rem',
                                alignItems: 'center'
                              }}>
                                <div style={{
                                  fontSize: '0.8125rem',
                                  color: '#374151',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}>
                                  <span style={{ 
                                    fontWeight: '600',
                                    color: '#1f2937'
                                  }}>Term:</span> 
                                  <span style={{
                                    backgroundColor: '#f3f4f6',
                                    padding: '0.125rem 0.375rem',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    color: '#374151'
                                  }}>
                                    {formatDate(lease.start_date)}
                                  </span>
                                  <span style={{ color: '#6b7280' }}>to</span>
                                  <span style={{
                                    backgroundColor: '#f3f4f6',
                                    padding: '0.125rem 0.375rem',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    color: '#374151'
                                  }}>
                                    {formatDate(lease.end_date)}
                                  </span>
                                </div>
                                <div style={{
                                  fontSize: '0.8125rem',
                                  color: '#374151',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}>
                                  <span style={{ 
                                    fontWeight: '600',
                                    color: '#1f2937'
                                  }}>Rent:</span> 
                                  <span style={{
                                    backgroundColor: '#f3f4f6',
                                    padding: '0.125rem 0.375rem',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    color: '#374151'
                                  }}>
                                    ${lease.monthly_rent}/month
                                  </span>
                                </div>
                                <div style={{
                                  fontSize: '0.8125rem',
                                  color: '#374151',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}>
                                  <span style={{ 
                                    fontWeight: '600',
                                    color: '#1f2937'
                                  }}>Deposit:</span> 
                                  <span style={{
                                    backgroundColor: '#f3f4f6',
                                    padding: '0.125rem 0.375rem',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    color: '#374151'
                                  }}>
                                    ${lease.security_deposit}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td style={{
                              padding: '1rem',
                              textAlign: 'center',
                              borderBottom: '1px solid #f3f4f6'
                            }}>
                              <span style={{
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
                                  lease.status === 'expired' ? '#f3f4f6' :
                                  lease.status === 'active' ? (
                                    daysToExpiry <= 0 ? '#fecaca' :
                                    daysToExpiry <= 30 ? '#fecaca' : 
                                    daysToExpiry <= 90 ? '#fed7aa' : '#dcfce7'
                                  ) : '#dcfce7',
                                color:
                                  lease.status === 'draft' ? '#92400e' :
                                  lease.status === 'sent_to_tenant' ? '#1d4ed8' :
                                  lease.status === 'signed' ? '#065f46' :
                                  lease.status === 'expired' ? '#6b7280' :
                                  lease.status === 'active' ? (
                                    daysToExpiry <= 0 ? '#dc2626' :
                                    daysToExpiry <= 30 ? '#dc2626' : 
                                    daysToExpiry <= 90 ? '#ea580c' : '#166534'
                                  ) : '#166534'
                              }}>
                                {lease.status === 'draft' ? 'Draft' : 
                                 lease.status === 'sent_to_tenant' ? 'Sent to Tenant' :
                                 lease.status === 'signed' ? 'Signed' :
                                 lease.status === 'expired' ? 'Moved Out' :
                                 lease.status === 'active' ? (
                                   daysToExpiry <= 0 ? 'Lease Expired' :
                                   daysToExpiry <= 30 ? `${daysToExpiry} days left` : 
                                   daysToExpiry <= 90 ? `${daysToExpiry} days left` : 'Active'
                                 ) : 'Active'}
                              </span>
                            </td>
                            <td style={{
                              padding: '1rem',
                              textAlign: 'center',
                              borderBottom: '1px solid #f3f4f6'
                            }}>
                              {lease.status === 'draft' ? (
                                <div style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '0.5rem'
                                }}>
                                  <button 
                                    onClick={() => handleSendToTenant(lease)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '0.375rem',
                                      padding: '0.5rem 0.875rem',
                                      backgroundColor: '#2563eb',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '6px',
                                      fontSize: '0.8125rem',
                                      fontWeight: '500',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                      minWidth: '140px'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <line x1="22" y1="2" x2="11" y2="13"/>
                                      <polygon points="22,2 15,22 11,13 2,9 22,2"/>
                                    </svg>
                                    Send to Tenant
                                  </button>
                                  <Link href={`/leases/${lease.id}`}>
                                    <button style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '0.375rem',
                                      padding: '0.5rem 0.875rem',
                                      backgroundColor: '#f8fafc',
                                      color: '#374151',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '6px',
                                      fontSize: '0.8125rem',
                                      fontWeight: '500',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                      minWidth: '140px'
                                    }}
                                    onMouseOver={(e) => {
                                      e.currentTarget.style.backgroundColor = '#f1f5f9';
                                      e.currentTarget.style.borderColor = '#94a3b8';
                                    }}
                                    onMouseOut={(e) => {
                                      e.currentTarget.style.backgroundColor = '#f8fafc';
                                      e.currentTarget.style.borderColor = '#cbd5e1';
                                    }}
                                    >
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                      </svg>
                                      View Lease
                                    </button>
                                  </Link>
                                  <button 
                                    onClick={() => handleDownloadLease(lease)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '0.375rem',
                                      padding: '0.5rem 0.875rem',
                                      backgroundColor: '#16a34a',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '6px',
                                      fontSize: '0.8125rem',
                                      fontWeight: '500',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                      minWidth: '140px'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                      <polyline points="7,10 12,15 17,10"/>
                                      <line x1="12" y1="15" x2="12" y2="3"/>
                                    </svg>
                                    Download
                                  </button>
                                </div>
                              ) : lease.status === 'sent_to_tenant' ? (
                                <div style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '0.5rem'
                                }}>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.375rem',
                                    fontSize: '0.8125rem',
                                    color: '#16a34a',
                                    fontWeight: '500',
                                    backgroundColor: '#f0fdf4',
                                    padding: '0.375rem 0.75rem',
                                    borderRadius: '6px',
                                    border: '1px solid #bbf7d0'
                                  }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <line x1="22" y1="2" x2="11" y2="13"/>
                                      <polygon points="22,2 15,22 11,13 2,9 22,2"/>
                                    </svg>
                                    Awaiting Signature
                                  </div>
                                  <Link href={`/leases/${lease.id}`}>
                                    <button style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '0.375rem',
                                      padding: '0.5rem 0.875rem',
                                      backgroundColor: '#f8fafc',
                                      color: '#374151',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '6px',
                                      fontSize: '0.8125rem',
                                      fontWeight: '500',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                      minWidth: '140px'
                                    }}
                                    onMouseOver={(e) => {
                                      e.currentTarget.style.backgroundColor = '#f1f5f9';
                                      e.currentTarget.style.borderColor = '#94a3b8';
                                    }}
                                    onMouseOut={(e) => {
                                      e.currentTarget.style.backgroundColor = '#f8fafc';
                                      e.currentTarget.style.borderColor = '#cbd5e1';
                                    }}
                                    >
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                      </svg>
                                      View Lease
                                  </button>
                                  </Link>
                                </div>
                              ) : (
                                <div style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.5rem'
                                }}>
                                  <Link href={`/leases/${lease.id}`}>
                                    <button style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '0.375rem',
                                      padding: '0.5rem 0.875rem',
                                      backgroundColor: '#2563eb',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '6px',
                                      fontSize: '0.8125rem',
                                      fontWeight: '500',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                      minWidth: '140px'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                                    >
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                                    </svg>
                                    Manage Lease
                                    </button>
                                </Link>
                                {(lease.status === 'active' || lease.is_active) && (
                                  <button 
                                    onClick={() => handleMoveOutClick(lease)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '0.375rem',
                                      padding: '0.5rem 0.875rem',
                                      backgroundColor: '#dc2626',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '6px',
                                      fontSize: '0.8125rem',
                                      fontWeight: '500',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                      minWidth: '140px'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                                  >
                                    <LogOut style={{ width: '12px', height: '12px' }} />
                                    Move Out
                                  </button>
                                )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
              </div>
            )}
            </div>
          </div>

          {/* Right Column (1 part): Quick Actions */}
              <div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              overflow: 'visible',
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
                borderBottom: '1px solid #e5e7eb'
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
                }}>Manage leases efficiently</p>
            </div>
            
              <div style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                {[
                  {
                    title: 'Export All Data',
                    subtitle: 'Download comprehensive report',
                    icon: <Download style={{ width: '1.25rem', height: '1.25rem', color: '#16a34a' }} />,
                    bgColor: '#f0fdf4',
                    onClick: downloadLeasesReport
                  },
                  {
                    title: 'Refresh Data',
                    subtitle: 'Update lease information',
                    icon: <RefreshCw style={{ width: '1.25rem', height: '1.25rem', color: '#ea580c' }} />,
                    bgColor: '#fff7ed',
                    onClick: () => fetchData()
                  },
                  {
                    title: 'Expiring Soon',
                    subtitle: `${expiringLeases.length} leases need attention`,
                    icon: <Clock style={{ width: '1.25rem', height: '1.25rem', color: '#a855f7' }} />,
                    bgColor: '#fdf4ff',
                    onClick: () => {}
                  }
                ].map((action, index) => (
                  <div key={index}
                    onClick={action.onClick}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem',
                      backgroundColor: action.bgColor,
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {action.icon}
                </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#111827',
                        margin: 0,
                        marginBottom: '0.125rem'
                      }}>{action.title}</h3>
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        margin: 0
                      }}>{action.subtitle}</p>
                </div>
              </div>
                ))}
                </div>
            </div>
          </div>
        </div>

        {/* Additional Sections */}
        {/* Expiring Soon Section */}
        {expiringLeases.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            overflow: 'visible',
            marginTop: '2rem',
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
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#111827',
                  margin: 0,
                  marginBottom: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Clock style={{ width: '1.25rem', height: '1.25rem', color: '#ea580c' }} />
                  Expiring Soon ({expiringLeases.length})
                </h2>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: 0
                }}>Leases expiring within the next 90 days</p>
              </div>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                  <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <th style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb'
                    }}>Tenant</th>
                    <th style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb'
                    }}>Property</th>
                    <th style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb'
                    }}>Expiry</th>
                    <th style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb'
                    }}>Status</th>
                    <th style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb'
                    }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiringLeases.map((lease) => {
                      const daysToExpiry = getDaysUntilExpiry(lease.end_date);
                    const tenant = getTenantNameFromLease(lease);
                    const property = getPropertyNameFromLease(lease);
                    const room = getRoomNameFromLease(lease);
                    
                      return (
                      <tr key={lease.id} style={{
                        borderBottom: '1px solid #f3f4f6',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td style={{
                          padding: '1rem',
                          textAlign: 'center',
                          borderBottom: '1px solid #f3f4f6'
                        }}>
                          <div 
                              onClick={() => router.push(`/tenants/${lease.tenant}`)}
                            style={{
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              color: '#374151',
                              cursor: 'pointer',
                              transition: 'color 0.2s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = '#1f2937'}
                            onMouseOut={(e) => e.currentTarget.style.color = '#374151'}
                          >
                            {tenant}
                            </div>
                          </td>
                        <td style={{
                          padding: '1rem',
                          textAlign: 'center',
                          borderBottom: '1px solid #f3f4f6'
                        }}>
                          <div 
                              onClick={() => router.push(`/properties/${lease.property_ref}`)}
                            style={{
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              color: '#374151',
                              cursor: 'pointer',
                              marginBottom: '0.25rem',
                              transition: 'color 0.2s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = '#1f2937'}
                            onMouseOut={(e) => e.currentTarget.style.color = '#374151'}
                          >
                            {property}
                            </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#6b7280'
                          }}>{room}</div>
                          </td>
                        <td style={{
                          padding: '1rem',
                          textAlign: 'center',
                          borderBottom: '1px solid #f3f4f6'
                        }}>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <span style={{
                              backgroundColor: '#f3f4f6',
                              padding: '0.125rem 0.375rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              color: '#374151'
                            }}>
                              {formatDate(lease.end_date)}
                            </span>
                            <span style={{
                              fontSize: '0.75rem',
                              color: lease.status === 'expired' ? '#6b7280' : (daysToExpiry <= 30 ? '#dc2626' : '#ea580c'),
                              fontWeight: '600'
                            }}>
                              {lease.status === 'expired' ? 'Moved Out' : `${daysToExpiry} days left`}
                            </span>
                          </div>
                          </td>
                        <td style={{
                          padding: '1rem',
                          textAlign: 'center',
                          borderBottom: '1px solid #f3f4f6'
                        }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.375rem 0.875rem',
                            borderRadius: '9999px',
                            fontSize: '0.8125rem',
                            fontWeight: '600',
                            backgroundColor: daysToExpiry <= 30 ? '#fecaca' : '#fed7aa',
                            color: daysToExpiry <= 30 ? '#dc2626' : '#ea580c'
                          }}>
                            <AlertTriangle style={{ 
                              width: '0.875rem', 
                              height: '0.875rem' 
                            }} />
                            {daysToExpiry <= 30 ? 'Critical' : 'Expiring Soon'}
                            </span>
                          </td>
                        <td style={{
                          padding: '1rem',
                          textAlign: 'center',
                          borderBottom: '1px solid #f3f4f6'
                        }}>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <Link href={`/leases/${lease.id}`}>
                              <button style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.375rem',
                                padding: '0.5rem 0.875rem',
                                backgroundColor: '#2563eb',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.8125rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                minWidth: '140px'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                              </svg>
                              Manage Lease
                              </button>
                          </Link>
                          {(lease.status === 'active' || lease.is_active) && (
                            <button 
                              onClick={() => handleMoveOutClick(lease)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.375rem',
                                padding: '0.5rem 0.875rem',
                                backgroundColor: '#dc2626',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.8125rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                minWidth: '140px'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                            >
                              <LogOut style={{ width: '12px', height: '12px' }} />
                              Move Out
                            </button>
                          )}
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
          grid-template-columns: 3fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
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
          padding: 16px 16px;
          vertical-align: middle;
          height: auto;
          min-height: 80px;
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
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        /* Dropdown Menu Styles */
        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          min-width: 160px;
          overflow: visible;
        }

        .dropdown-menu button {
          width: 100%;
          padding: 8px 12px;
          border: none;
          background: none;
          text-align: left;
          font-size: 14px;
          color: #374151;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .dropdown-menu button:hover {
          background-color: #f3f4f6;
        }

        .dropdown-menu button:first-child {
          border-radius: 8px 8px 0 0;
        }

        .dropdown-menu button:last-child {
          border-radius: 0 0 8px 8px;
        }

        /* Table container positioning for dropdowns */
        .table-container {
          position: relative;
          overflow: visible;
        }

        /* Action button container */
        .action-buttons {
          position: relative;
          display: inline-block;
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

        .status-badge.draft {
          background: #f3f4f6;
          color: #6b7280;
        }

        .status-badge.sent {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .status-badge.signed {
          background: #d1fae5;
          color: #065f46;
        }

        .status-badge.active {
          background: #dcfce7;
          color: #166534;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 6px;
          justify-content: center;
          align-items: center;
          min-width: 140px;
        }

        .send-to-tenant-btn, .edit-lease-btn, .download-lease-btn {
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;
          text-decoration: none;
          width: 130px;
          text-align: center;
        }
        
        .send-to-tenant-btn {
          background: #4f46e5;
          color: white;
        }

        .send-to-tenant-btn:hover {
          background: #3730a3;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
        }

        .edit-lease-btn {
          background: #3b82f6;
          color: white;
        }

        .edit-lease-btn:hover {
          background: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
          text-decoration: none;
        }

        .download-lease-btn {
          background: #10b981;
          color: white;
        }

        .download-lease-btn:hover {
          background: #059669;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }

        .status-text {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
        }

        .renew-btn, .moveout-btn {
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
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
          padding: 8px 12px;
          border-radius: 6px;
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
          box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
        }

        .moveout-btn {
          background: #4f46e5;
          color: white;
        }

        .moveout-btn:hover {
          background: #3730a3;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
        }

        .manage-lease-btn {
          border: none;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          transition: all 0.2s ease;
          background: #3b82f6;
          color: white;
          text-decoration: none;
          width: 130px;
          text-align: center;
        }

        .manage-lease-btn:hover {
          background: #2563eb;
          transform: translateY(-1px);
          color: white;
          text-decoration: none;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }

        .manage-lease-btn.view-variant {
          background: #6b7280;
          color: white;
        }

        .manage-lease-btn.view-variant:hover {
          background: #4b5563;
          box-shadow: 0 2px 8px rgba(107, 114, 128, 0.3);
        }

        .draft-actions {
          display: flex;
          gap: 8px;
          justify-content: center;
        }

        .activate-btn {
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;
          background: #10b981;
          color: white;
          width: 130px;
          text-align: center;
        }

        .activate-btn:hover {
          background: #059669;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
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
            gap: 6px;
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

        .clickable-name {
          cursor: pointer;
          transition: color 0.2s ease;
          border-radius: 4px;
          padding: 2px 4px;
          margin: -2px -4px;
        }

        .clickable-name:hover {
          color: #3b82f6;
          background: #eff6ff;
        }

        .clickable-property {
          cursor: pointer;
          transition: color 0.2s ease;
          border-radius: 4px;
          padding: 2px 4px;
          margin: -2px -4px;
        }

        .clickable-property:hover {
          color: #059669;
          background: #ecfdf5;
        }

        .tenant-name {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 2px;
        }

        .tenant-contact {
          font-size: 12px;
          color: #6b7280;
        }

        .property-name {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 2px;
        }

        .lease-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        /* Dropdown Menu Styles */
        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          min-width: 160px;
          overflow: visible;
        }

        .dropdown-menu button {
          width: 100%;
          padding: 8px 12px;
          border: none;
          background: none;
          text-align: left;
          font-size: 14px;
          color: #374151;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .dropdown-menu button:hover {
          background-color: #f3f4f6;
        }

        /* Table container positioning for dropdowns */
        .table-container {
          position: relative;
          overflow: visible;
        }

        /* Action button container */
        .action-buttons {
          position: relative;
          display: inline-block;
        }
      `}</style>

      {/* Move-out Confirmation Modal */}
      {showMoveOutModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            {(() => {
              const lease = leases.find(l => l.id === showMoveOutModal);
              if (!lease) return null;
              
              return (
                <>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{
                      width: '3rem',
                      height: '3rem',
                      backgroundColor: '#fef2f2',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <LogOut style={{ width: '1.5rem', height: '1.5rem', color: '#dc2626' }} />
                    </div>
                    <div>
                      <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: '#111827',
                        margin: 0
                      }}>
                        Process Move-Out
                      </h2>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        margin: '0.25rem 0 0 0'
                      }}>
                        {getTenantNameFromLease(lease)} - {getPropertyNameFromLease(lease)}
                      </p>
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.75rem'
                    }}>
                      <Calendar style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        Move-out Date
                      </span>
                    </div>
                    <input
                      type="date"
                      value={moveOutDate}
                      onChange={(e) => handleMoveOutDateChange(e.target.value, lease)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div style={{
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.75rem'
                    }}>
                      <DollarSign style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        Security Deposit Return
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={depositReturn}
                      onChange={(e) => {
                        setDepositReturn(e.target.value);
                        const calculations = calculateMoveOutImpact(lease, moveOutDate, e.target.value);
                        setMoveOutCalculations(calculations);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '0.875rem'
                      }}
                      placeholder="0.00"
                    />
                  </div>

                  {moveOutCalculations && (
                    <div style={{
                      backgroundColor: '#fef3c7',
                      borderRadius: '8px',
                      padding: '1rem',
                      marginBottom: '1.5rem',
                      border: '1px solid #fbbf24'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.75rem'
                      }}>
                        <Calculator style={{ width: '1rem', height: '1rem', color: '#d97706' }} />
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#92400e'
                        }}>
                          Financial Impact
                        </span>
                      </div>
                      
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '1rem',
                        fontSize: '0.875rem'
                      }}>
                        <div>
                          <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>
                            Time Remaining
                          </div>
                          <div style={{ fontWeight: '600', color: '#374151' }}>
                            {moveOutCalculations.monthsRemaining} months, {moveOutCalculations.daysRemaining} days
                          </div>
                        </div>
                        <div>
                          <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>
                            Rent Forgo
                          </div>
                          <div style={{ fontWeight: '600', color: '#dc2626' }}>
                            ${moveOutCalculations.rentForgo.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>
                            Deposit Return
                          </div>
                          <div style={{ fontWeight: '600', color: '#16a34a' }}>
                            ${moveOutCalculations.depositReturned.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div style={{
                        marginTop: '0.75rem',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid #fbbf24',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ color: '#6b7280', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                            Net Financial Impact
                          </div>
                          <div style={{ 
                            fontWeight: '700', 
                            fontSize: '1.125rem',
                            color: moveOutCalculations.totalForgo > 0 ? '#dc2626' : '#16a34a'
                          }}>
                            {moveOutCalculations.totalForgo > 0 ? '-' : '+'}${Math.abs(moveOutCalculations.totalForgo).toFixed(2)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                            Lease ends: {formatDate(lease.end_date)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    gap: '0.75rem',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      onClick={() => {
                        setShowMoveOutModal(null);
                        setMoveOutCalculations(null);
                      }}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#f8fafc',
                        color: '#374151',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#f1f5f9';
                        e.currentTarget.style.borderColor = '#94a3b8';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleConfirmMoveOut(lease)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                    >
                      Confirm Move-Out
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default withAuth(Leases); 
