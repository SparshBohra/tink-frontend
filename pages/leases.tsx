import Navigation from '../components/Navigation';
import { mockLeases, mockTenants, mockRooms, mockProperties } from '../lib/mockData';

export default function Leases() {
  const getTenantName = (tenantId: number) => {
    const tenant = mockTenants.find(t => t.id === tenantId);
    return tenant ? tenant.name : 'Unknown Tenant';
  };

  const getRoomInfo = (roomId: number) => {
    const room = mockRooms.find(r => r.id === roomId);
    const property = room ? mockProperties.find(p => p.id === room.propertyId) : null;
    return room && property ? `${room.name} at ${property.name}` : 'Unknown Room';
  };

  const handleMoveOut = (leaseId: number) => {
    console.log(`Process move-out for lease ${leaseId}`);
  };

  const handleRenewLease = (leaseId: number) => {
    console.log(`Renew lease ${leaseId}`);
  };

  const handleUploadLease = (leaseId: number) => {
    console.log(`Upload lease document for ${leaseId}`);
  };

  const activeLeases = mockLeases.filter(lease => lease.status === 'active');
  const expiringLeases = mockLeases.filter(lease => lease.status === 'expiring_soon');

  const downloadLeasesReport = () => {
    const csvData = [
      ['Tenant Name', 'Property', 'Room', 'Start Date', 'End Date', 'Monthly Rent', 'Status', 'Days to Expiry', 'Annual Revenue'],
      ...mockLeases.map(lease => {
        const tenant = mockTenants.find(t => t.id === lease.tenantId);
        const room = mockRooms.find(r => r.id === lease.roomId);
        const property = room ? mockProperties.find(p => p.id === room.propertyId) : null;
        const daysToExpiry = Math.floor((new Date(lease.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return [
          tenant?.name || 'Unknown',
          property?.name || 'Unknown',
          room?.name || 'Unknown',
          lease.startDate,
          lease.endDate,
          `$${lease.rent}`,
          lease.status.toUpperCase(),
          daysToExpiry.toString(),
          `$${lease.rent * 12}`
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

  const downloadExpiringLeasesReport = () => {
    const csvData = [
      ['Tenant', 'Contact', 'Property', 'Room', 'End Date', 'Monthly Rent', 'Days Left', 'Renewal Action'],
      ...expiringLeases.map(lease => {
        const tenant = mockTenants.find(t => t.id === lease.tenantId);
        const room = mockRooms.find(r => r.id === lease.roomId);
        const property = room ? mockProperties.find(p => p.id === room.propertyId) : null;
        const daysLeft = Math.floor((new Date(lease.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return [
          tenant?.name || 'Unknown',
          tenant?.phone || 'Unknown',
          property?.name || 'Unknown',
          room?.name || 'Unknown',
          lease.endDate,
          `$${lease.rent}`,
          daysLeft.toString(),
          daysLeft > 30 ? 'Send renewal notice' : 'URGENT: Follow up immediately'
        ];
      })
    ];
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tink-expiring-leases-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div>
      <Navigation />
      <h1>Leases</h1>
      
      <div style={{margin: '10px 0'}}>
        <button onClick={downloadLeasesReport} style={{backgroundColor: '#28a745', color: 'white', margin: '5px'}}>
          📊 Download All Leases (CSV)
        </button>
        <button onClick={downloadExpiringLeasesReport} style={{backgroundColor: '#dc3545', color: 'white', margin: '5px'}}>
          ⚠️ Download Expiring Leases (CSV)
        </button>
      </div>
      
      <h2>Expiring Soon ({expiringLeases.length})</h2>
      <table border={1}>
        <thead>
          <tr>
            <th>Tenant</th>
            <th>Room</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Rent</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {expiringLeases.map(lease => (
            <tr key={lease.id} style={{backgroundColor: '#ffeeee'}}>
              <td><strong>{getTenantName(lease.tenantId)}</strong></td>
              <td>{getRoomInfo(lease.roomId)}</td>
              <td>{lease.startDate}</td>
              <td><strong>{lease.endDate}</strong></td>
              <td>${lease.rent}/month</td>
              <td>
                <button onClick={() => handleRenewLease(lease.id)}>
                  Renew Lease
                </button>
                {' '}
                <button onClick={() => handleMoveOut(lease.id)}>
                  Move Out
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Active Leases ({activeLeases.length})</h2>
      <table border={1}>
        <thead>
          <tr>
            <th>Tenant</th>
            <th>Room</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Rent</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {activeLeases.map(lease => (
            <tr key={lease.id}>
              <td>{getTenantName(lease.tenantId)}</td>
              <td>{getRoomInfo(lease.roomId)}</td>
              <td>{lease.startDate}</td>
              <td>{lease.endDate}</td>
              <td>${lease.rent}/month</td>
              <td>
                <button onClick={() => handleUploadLease(lease.id)}>
                  Upload Document
                </button>
                {' '}
                <button onClick={() => handleMoveOut(lease.id)}>
                  Move Out
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Lease Operations</h2>
      <ul>
        <li><button onClick={() => console.log('Create new lease')}>+ Create New Lease</button></li>
        <li><button onClick={() => console.log('Send lease renewal reminders')}>Send Renewal Reminders (WhatsApp)</button></li>
        <li><button onClick={() => console.log('Generate lease report')}>Generate Monthly Report</button></li>
      </ul>
    </div>
  );
} 