import { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '../components/DashboardLayout';
import MetricCard from '../components/MetricCard';
import SectionCard from '../components/SectionCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import Link from 'next/link';
import { withAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';
import { Lease, Tenant, Property, Room } from '../lib/types';
import { formatCurrency } from '../lib/utils';

function Leases() {
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
            start_date: lease.end_date, // New lease starts when old one ends
            end_date: newEndDate.toISOString().split('T')[0],
            monthly_rent: lease.monthly_rent, // Keep same rent for now
            security_deposit: lease.security_deposit
          };
          
          const newLease = await apiClient.createLease({
            tenant: lease.tenant,
            property_ref: lease.property_ref,
            room: lease.room,
            ...renewalData
          });
          
          alert(`Lease renewed successfully! New lease ID: ${newLease.id}`);
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
    <DashboardLayout
      title="Lease Management"
      subtitle="Manage active leases, process renewals, and handle move-outs."
    >
        {error && <div className="alert alert-error">{error}</div>}
        
        {/* Actions */}
        <SectionCard>
          <div className="actions-container">
            <button 
              onClick={() => fetchData()} 
              className="btn btn-secondary"
            >
              Refresh
            </button>
            
        <button 
          onClick={downloadLeasesReport}
              className="btn btn-secondary"
            >
              Download Report
        </button>
            
            <Link href="/applications" className="btn btn-secondary">
              Create from Applications
            </Link>
          </div>
        </SectionCard>
        
        {/* Active Leases */}
        <SectionCard
          title={`Active Leases (${activeLeases.length})`}
          subtitle="Currently active leases across all properties"
        >
          {activeLeases.length === 0 ? (
            <EmptyState
              title="No active leases"
              description="There are no active leases in the system yet."
              action={
                <Link href="/applications" className="btn btn-primary">
                  Create from Applications
                </Link>
              }
            />
          ) : (
            <DataTable
              columns={[
                { key: 'tenant', header: 'Tenant', width: '20%' },
                { key: 'property', header: 'Property', width: '20%' },
                { key: 'details', header: 'Lease Details', width: '25%' },
                { key: 'status', header: 'Status', width: '15%' },
                { key: 'actions', header: 'Actions', width: '20%' }
              ]}
              data={activeLeases}
              renderRow={(lease) => {
                const daysToExpiry = getDaysUntilExpiry(lease.end_date);
                const tenant = getTenantName(lease.tenant);
                const tenantContact = getTenantContact(lease.tenant);
                const property = getPropertyName(lease.property_ref);
                const room = getRoomName(lease.room);
                
                return (
                  <tr key={lease.id}>
                    <td>
                      <div className="tenant-name">{tenant}</div>
                      {tenantContact && (
                        <div className="tenant-contact">{tenantContact.phone}</div>
                      )}
                    </td>
                    
                    <td>
                      <div>{property}</div>
                      <div className="room-name">{room}</div>
                    </td>
                    
                    <td>
                      <div className="lease-details">
                        <div>Term: {lease.start_date} to {lease.end_date}</div>
                        <div>Rent: ${lease.monthly_rent}/month</div>
                        <div>Deposit: ${lease.security_deposit}</div>
                      </div>
                    </td>
                    
                    <td>
                      {daysToExpiry <= 30 ? (
                        <StatusBadge status="error" text={`${daysToExpiry} days left`} />
                      ) : daysToExpiry <= 90 ? (
                        <StatusBadge status="warning" text={`${daysToExpiry} days left`} />
                      ) : (
                        <StatusBadge status="success" text="Active" />
                      )}
                    </td>
                    
                    <td>
                      <div className="action-buttons">
                        <button 
                          onClick={() => handleRenewLease(lease.id)}
                          className="btn btn-primary btn-sm"
                        >
                          Renew
                        </button>
                        
                        <button 
                          onClick={() => handleMoveOut(lease.id)}
                          className="btn btn-secondary btn-sm"
                        >
                          Move Out
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }}
            />
          )}
        </SectionCard>
        
        {/* Expiring Soon Leases */}
        {expiringLeases.length > 0 && (
          <SectionCard
            title={`Expiring Soon (${expiringLeases.length})`}
            subtitle="Leases expiring within the next 90 days"
          >
            <DataTable
              columns={[
                { key: 'tenant', header: 'Tenant', width: '20%' },
                { key: 'property', header: 'Property', width: '20%' },
                { key: 'expiry', header: 'Expiry', width: '20%' },
                { key: 'status', header: 'Status', width: '15%' },
                { key: 'actions', header: 'Actions', width: '25%' }
              ]}
              data={expiringLeases}
              renderRow={(lease) => {
                const daysToExpiry = getDaysUntilExpiry(lease.end_date);
                return (
                  <tr key={lease.id}>
                    <td>{getTenantName(lease.tenant)}</td>
                    <td>
                      {getPropertyName(lease.property_ref)}
                      <div className="room-name">{getRoomName(lease.room)}</div>
                    </td>
                    <td>
                      <div>{lease.end_date}</div>
                      <div className="expiry-days">{daysToExpiry} days left</div>
                    </td>
                    <td>
                      {daysToExpiry <= 30 ? (
                        <StatusBadge status="error" text="Critical" />
                      ) : (
                        <StatusBadge status="warning" text="Expiring soon" />
                      )}
                    </td>
                    <td>
                      <button 
                        onClick={() => handleRenewLease(lease.id)} 
                        className="btn btn-primary btn-sm"
                      >
                        Renew Now
                      </button>
                    </td>
                  </tr>
                );
              }}
            />
          </SectionCard>
        )}
        
        {/* Draft Leases */}
        {draftLeases.length > 0 && (
          <SectionCard
            title={`Draft Leases (${draftLeases.length})`}
            subtitle="Pending leases awaiting activation"
          >
            <DataTable
              columns={[
                { key: 'tenant', header: 'Tenant', width: '20%' },
                { key: 'property', header: 'Property', width: '20%' },
                { key: 'details', header: 'Lease Details', width: '35%' },
                { key: 'actions', header: 'Actions', width: '25%' }
              ]}
              data={draftLeases}
              renderRow={(lease) => (
                <tr key={lease.id}>
                  <td>{getTenantName(lease.tenant)}</td>
                  <td>
                    {getPropertyName(lease.property_ref)}
                    <div className="room-name">{getRoomName(lease.room)}</div>
                  </td>
                  <td>
                    <div>Term: {lease.start_date} to {lease.end_date}</div>
                    <div>Rent: ${lease.monthly_rent}/month</div>
                  </td>
                  <td>
                    <button className="btn btn-success btn-sm">Activate</button>
                    <button className="btn btn-error btn-sm">Delete</button>
                  </td>
                </tr>
              )}
            />
          </SectionCard>
        )}
    </DashboardLayout>
  );
}

export default withAuth(Leases); 
