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

  return (
    <div>
      <Navigation />
      <h1>Leases</h1>
      
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