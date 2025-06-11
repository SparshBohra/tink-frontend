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

  const downloadTenantsReport = () => {
    const csvData = [
      ['Tenant Name', 'Email', 'Phone', 'Property', 'Room', 'Monthly Rent', 'Move-in Date', 'Status', 'Contact Preference'],
      ...mockTenants.map(tenant => {
        const room = mockRooms.find(r => r.id === tenant.roomId);
        const property = room ? mockProperties.find(p => p.id === room.propertyId) : null;
        return [
          tenant.name,
          tenant.email,
          tenant.phone,
          property?.name || 'Unknown',
          room?.name || 'Unknown',
          `$${room?.rent || 0}`,
          '2024-12-01', // Mock move-in date
          'Active',
          'WhatsApp' // Mock preference
        ];
      })
    ];
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tink-tenants-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const downloadContactList = () => {
    const csvData = [
      ['Name', 'WhatsApp', 'Email', 'Property', 'Room', 'Emergency Contact'],
      ...mockTenants.map(tenant => {
        const room = mockRooms.find(r => r.id === tenant.roomId);
        const property = room ? mockProperties.find(p => p.id === room.propertyId) : null;
        return [
          tenant.name,
          tenant.phone,
          tenant.email,
          property?.name || 'Unknown',
          room?.name || 'Unknown',
          '(555) 000-0000' // Mock emergency contact
        ];
      })
    ];
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tink-tenant-contacts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div>
      <Navigation />
      <h1>Tenants</h1>
      
      <h2>All Tenants</h2>
      <div style={{margin: '10px 0'}}>
        <button onClick={downloadTenantsReport} style={{backgroundColor: '#28a745', color: 'white', margin: '5px'}}>
          📊 Download Tenants Report (CSV)
        </button>
        <button onClick={downloadContactList} style={{backgroundColor: '#17a2b8', color: 'white', margin: '5px'}}>
          📞 Download Contact List (CSV)
        </button>
      </div>
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