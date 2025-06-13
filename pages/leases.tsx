import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
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

  if (loading) {
    return (
      <div>
        <Navigation />
        <h1>Loading Leases...</h1>
        <p>Fetching lease data from the server...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navigation />
        <h1>Leases Error</h1>
        <div style={{ 
          color: 'red', 
          border: '1px solid red', 
          padding: '15px', 
          marginBottom: '20px',
          backgroundColor: '#ffebee'
        }}>
          <strong>Error:</strong> {error}
        </div>
        <button 
          onClick={fetchData}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

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

  return (
    <div>
      <Navigation />
      <h1>📜 Lease Management</h1>
      <p>Manage active leases, process renewals, and handle move-outs.</p>
      
      {/* Summary Cards */}
      <div style={{
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '15px', 
        marginBottom: '30px'
      }}>
        <div style={{
          border: '1px solid #ddd', 
          padding: '20px', 
          borderRadius: '8px', 
          backgroundColor: '#f8f9fa',
          textAlign: 'center'
        }}>
          <h3 style={{margin: '0 0 10px 0', color: '#27ae60'}}>Active Leases</h3>
          <div style={{fontSize: '32px', fontWeight: 'bold', color: '#27ae60'}}>{activeLeases.length}</div>
        </div>
        
        <div style={{
          border: '1px solid #ddd', 
          padding: '20px', 
          borderRadius: '8px', 
          backgroundColor: '#f8f9fa',
          textAlign: 'center'
        }}>
          <h3 style={{margin: '0 0 10px 0', color: '#f39c12'}}>Expiring Soon</h3>
          <div style={{fontSize: '32px', fontWeight: 'bold', color: '#f39c12'}}>{expiringLeases.length}</div>
          <small style={{color: '#666'}}>Within 90 days</small>
        </div>
        
        <div style={{
          border: '1px solid #ddd', 
          padding: '20px', 
          borderRadius: '8px', 
          backgroundColor: '#f8f9fa',
          textAlign: 'center'
        }}>
          <h3 style={{margin: '0 0 10px 0', color: '#6c757d'}}>Draft Leases</h3>
          <div style={{fontSize: '32px', fontWeight: 'bold', color: '#6c757d'}}>{draftLeases.length}</div>
          <small style={{color: '#666'}}>Awaiting activation</small>
        </div>
        
        <div style={{
          border: '1px solid #ddd', 
          padding: '20px', 
          borderRadius: '8px', 
          backgroundColor: '#f8f9fa',
          textAlign: 'center'
        }}>
          <h3 style={{margin: '0 0 10px 0', color: '#3498db'}}>Monthly Revenue</h3>
          <div style={{fontSize: '32px', fontWeight: 'bold', color: '#3498db'}}>
            ${activeLeases.reduce((sum, lease) => sum + lease.monthly_rent, 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{marginBottom: '20px'}}>
        <button 
          onClick={downloadLeasesReport}
          style={{
            backgroundColor: '#28a745', 
            color: 'white', 
            padding: '10px 15px', 
            border: 'none', 
            borderRadius: '5px',
            marginRight: '10px',
            cursor: 'pointer'
          }}
        >
          📊 Download Report
        </button>
        <button 
          onClick={fetchData}
          style={{
            backgroundColor: '#6c757d', 
            color: 'white', 
            padding: '10px 15px', 
            border: 'none', 
            borderRadius: '5px',
            marginRight: '10px',
            cursor: 'pointer'
          }}
        >
          🔄 Refresh
        </button>
        <Link href="/applications">
          <button style={{
            backgroundColor: '#007bff', 
            color: 'white', 
            padding: '10px 15px', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}>
            📋 Create from Applications
          </button>
        </Link>
      </div>
      
      {/* Expiring Leases - Priority Section */}
      {expiringLeases.length > 0 && (
        <div style={{marginBottom: '30px'}}>
          <h2 style={{color: '#f39c12'}}>⚠️ Leases Expiring Soon ({expiringLeases.length})</h2>
          <p style={{color: '#856404', backgroundColor: '#fff3cd', padding: '10px', borderRadius: '5px'}}>
            <strong>Action Required:</strong> These leases expire within 90 days. Contact tenants for renewal or move-out planning.
          </p>
          <table border={1} style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{backgroundColor: '#fff3cd'}}>
                <th style={{padding: '12px', textAlign: 'left'}}>Tenant</th>
                <th style={{padding: '12px', textAlign: 'left'}}>Property & Room</th>
                <th style={{padding: '12px', textAlign: 'center'}}>End Date</th>
                <th style={{padding: '12px', textAlign: 'center'}}>Days Left</th>
                <th style={{padding: '12px', textAlign: 'center'}}>Monthly Rent</th>
                <th style={{padding: '12px', textAlign: 'center'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expiringLeases.map(lease => {
                const daysLeft = getDaysUntilExpiry(lease.end_date);
                const contact = getTenantContact(lease.tenant);
                const isUrgent = daysLeft <= 30;
                
                return (
                  <tr key={lease.id} style={{backgroundColor: isUrgent ? '#ffebee' : '#fff3cd'}}>
                    <td style={{padding: '12px'}}>
                      <div>
                        <strong>{getTenantName(lease.tenant)}</strong>
                        <br />
                        <small style={{color: '#666'}}>{contact?.email}</small>
                        <br />
                        <small style={{color: '#666'}}>{contact?.phone}</small>
                      </div>
                    </td>
                    <td style={{padding: '12px'}}>
                      <div>
                        <strong>{getPropertyName(lease.property_ref)}</strong>
                        <br />
                        <small>{getRoomName(lease.room)}</small>
                      </div>
                    </td>
                    <td style={{padding: '12px', textAlign: 'center'}}>
                      <strong style={{color: isUrgent ? '#e74c3c' : '#f39c12'}}>{lease.end_date}</strong>
                    </td>
                    <td style={{padding: '12px', textAlign: 'center'}}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        backgroundColor: isUrgent ? '#ffebee' : '#fff3cd',
                        color: isUrgent ? '#e74c3c' : '#f39c12',
                        fontWeight: 'bold'
                      }}>
                        {daysLeft} days
                      </span>
                    </td>
                    <td style={{padding: '12px', textAlign: 'center'}}>
                      <strong>{formatCurrency(lease.monthly_rent)}</strong>
                    </td>
                    <td style={{padding: '12px', textAlign: 'center'}}>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center'}}>
                        <button 
                          onClick={() => handleRenewLease(lease.id)}
                          style={{
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          🔄 Renew Lease
                        </button>
                        <button 
                          onClick={() => handleMoveOut(lease.id)}
                          style={{
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          📦 Move Out
                        </button>
                        <Link href={{ pathname: '/tenants/[id]', query: { id: lease.tenant } }}>
                          <button style={{
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}>
                            👤 Contact
                          </button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Draft Leases - Need Activation */}
      {draftLeases.length > 0 && (
        <div style={{marginBottom: '30px'}}>
          <h2 style={{color: '#6c757d'}}>📝 Draft Leases ({draftLeases.length})</h2>
          <p style={{color: '#6c757d', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '5px'}}>
            <strong>Action Required:</strong> These leases have been created but need to be activated when tenants move in.
          </p>
          <table border={1} style={{width: '100%', borderCollapse: 'collapse'}}>
        <thead>
              <tr style={{backgroundColor: '#f8f9fa'}}>
                <th style={{padding: '12px', textAlign: 'left'}}>Tenant</th>
                <th style={{padding: '12px', textAlign: 'left'}}>Property & Room</th>
                <th style={{padding: '12px', textAlign: 'center'}}>Lease Period</th>
                <th style={{padding: '12px', textAlign: 'center'}}>Monthly Rent</th>
                <th style={{padding: '12px', textAlign: 'center'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
              {draftLeases.map(lease => (
                <tr key={lease.id} style={{backgroundColor: '#f8f9fa'}}>
                  <td style={{padding: '12px'}}>
                    <div>
                      <strong>{getTenantName(lease.tenant)}</strong>
                      <br />
                      <small style={{color: '#666'}}>{getTenantContact(lease.tenant)?.email}</small>
                    </div>
                  </td>
                  <td style={{padding: '12px'}}>
                    <div>
                      <strong>{getPropertyName(lease.property_ref)}</strong>
                      <br />
                      <small>{getRoomName(lease.room)}</small>
                    </div>
                  </td>
                  <td style={{padding: '12px', textAlign: 'center'}}>
                    <div>
                      <small>{lease.start_date}</small>
                      <br />
                      <strong>to</strong>
                      <br />
                      <small>{lease.end_date}</small>
                    </div>
                  </td>
                  <td style={{padding: '12px', textAlign: 'center'}}>
                    <strong>{formatCurrency(lease.monthly_rent)}</strong>
                    <br />
                    <small style={{color: '#666'}}>Deposit: {formatCurrency(lease.security_deposit)}</small>
                  </td>
                  <td style={{padding: '12px', textAlign: 'center'}}>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center'}}>
                      <button 
                        onClick={() => {
                          const confirmed = confirm(`Activate lease for ${getTenantName(lease.tenant)}?\n\nThis will mark the lease as active and the tenant as moved in.`);
                          if (confirmed) {
                            alert('Lease activation feature coming soon!');
                          }
                        }}
                        style={{
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✅ Activate Lease
                </button>
                      <Link href={{ pathname: '/tenants/[id]', query: { id: lease.tenant } }}>
                        <button style={{
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}>
                          👤 View Tenant
                </button>
                      </Link>
                    </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
        </div>
      )}

      {/* Active Leases */}
      <div style={{marginBottom: '30px'}}>
        <h2>✅ Active Leases ({activeLeases.filter(lease => !expiringLeases.includes(lease)).length})</h2>
        {activeLeases.filter(lease => !expiringLeases.includes(lease)).length > 0 ? (
          <table border={1} style={{width: '100%', borderCollapse: 'collapse'}}>
        <thead>
              <tr style={{backgroundColor: '#f8f9fa'}}>
                <th style={{padding: '12px', textAlign: 'left'}}>Tenant</th>
                <th style={{padding: '12px', textAlign: 'left'}}>Property & Room</th>
                <th style={{padding: '12px', textAlign: 'center'}}>Lease Period</th>
                <th style={{padding: '12px', textAlign: 'center'}}>Monthly Rent</th>
                <th style={{padding: '12px', textAlign: 'center'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
              {activeLeases.filter(lease => !expiringLeases.includes(lease)).map(lease => (
            <tr key={lease.id}>
                  <td style={{padding: '12px'}}>
                    <div>
                      <strong>{getTenantName(lease.tenant)}</strong>
                      <br />
                      <small style={{color: '#666'}}>{getTenantContact(lease.tenant)?.email}</small>
                    </div>
                  </td>
                  <td style={{padding: '12px'}}>
                    <div>
                      <strong>{getPropertyName(lease.property_ref)}</strong>
                      <br />
                      <small>{getRoomName(lease.room)}</small>
                    </div>
                  </td>
                  <td style={{padding: '12px', textAlign: 'center'}}>
                    <div>
                      <small>{lease.start_date}</small>
                      <br />
                      <strong>to</strong>
                      <br />
                      <small>{lease.end_date}</small>
                    </div>
                  </td>
                  <td style={{padding: '12px', textAlign: 'center'}}>
                    <strong>{formatCurrency(lease.monthly_rent)}</strong>
                    <br />
                    <small style={{color: '#666'}}>Deposit: {formatCurrency(lease.security_deposit)}</small>
                  </td>
                  <td style={{padding: '12px', textAlign: 'center'}}>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center'}}>
                      <Link href={{ pathname: '/tenants/[id]', query: { id: lease.tenant } }}>
                        <button style={{
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}>
                          👤 View Tenant
                </button>
                      </Link>
                      <Link href={`/inventory?room=${lease.room}`}>
                        <button style={{
                          backgroundColor: '#9b59b6',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}>
                          📦 Inventory
                </button>
                      </Link>
                    </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
        ) : (
          <p style={{color: '#666', fontStyle: 'italic'}}>All active leases are expiring soon. Check the section above.</p>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{marginTop: '30px'}}>
        <h2>⚡ Quick Actions</h2>
        <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
          <Link href="/applications">
            <button style={{
              backgroundColor: '#e74c3c', 
              color: 'white', 
              padding: '12px 20px', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              📋 Review Applications
            </button>
          </Link>
          <Link href="/tenants">
            <button style={{
              backgroundColor: '#3498db', 
              color: 'white', 
              padding: '12px 20px', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              👥 Manage Tenants
            </button>
          </Link>
          <Link href="/properties">
            <button style={{
              backgroundColor: '#27ae60', 
              color: 'white', 
              padding: '12px 20px', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              🏠 View Properties
            </button>
          </Link>
          <Link href="/inventory">
            <button style={{
              backgroundColor: '#9b59b6', 
              color: 'white', 
              padding: '12px 20px', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              📦 Manage Inventory
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
} 
export default withAuth(Leases, ['admin', 'owner', 'manager']); 
