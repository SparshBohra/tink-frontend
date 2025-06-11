import Navigation from '../components/Navigation';
import { mockTenants, mockRooms, mockProperties } from '../lib/mockData';

export default function Tenants() {
  const getRoomInfo = (roomId: number) => {
    const room = mockRooms.find(r => r.id === roomId);
    const property = room ? mockProperties.find(p => p.id === room.propertyId) : null;
    return room && property ? `${room.name} at ${property.name}` : 'No room assigned';
  };

  const handleViewApplications = (tenantId: number) => {
    console.log(`View applications for tenant ${tenantId}`);
  };

  const handleAssignRoom = (tenantId: number) => {
    console.log(`Assign room to tenant ${tenantId}`);
  };

  const handleSendReminder = (tenantId: number) => {
    console.log(`Send WhatsApp reminder to tenant ${tenantId}`);
  };

  return (
    <div>
      <Navigation />
      <h1>Tenants</h1>
      
      <h2>All Tenants</h2>
      <table border={1}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Current Room</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {mockTenants.map(tenant => (
            <tr key={tenant.id}>
              <td>{tenant.name}</td>
              <td>{tenant.email}</td>
              <td>{tenant.phone}</td>
              <td>{getRoomInfo(tenant.roomId)}</td>
              <td>
                <button onClick={() => handleViewApplications(tenant.id)}>
                  View Applications
                </button>
                {' '}
                <button onClick={() => handleAssignRoom(tenant.id)}>
                  Assign Room
                </button>
                {' '}
                <button onClick={() => handleSendReminder(tenant.id)}>
                  Send Reminder
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Quick Actions</h2>
      <ul>
        <li><button onClick={() => console.log('Send rent reminders to all')}>Send Rent Reminders (WhatsApp)</button></li>
        <li><button onClick={() => console.log('Send move-out notifications')}>Send Move-out Notifications</button></li>
        <li><button onClick={() => console.log('Add new tenant')}>+ Add New Tenant</button></li>
      </ul>
    </div>
  );
} 