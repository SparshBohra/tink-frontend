import Navigation from '../components/Navigation';
import { mockTenants } from '../lib/mockData';

// Mock reminder data
const mockUpcomingReminders = [
  { id: 1, type: 'rent_due', tenantId: 1, dueDate: '2025-01-15', message: 'Rent due in 3 days', automated: true },
  { id: 2, type: 'lease_expiry', tenantId: 4, dueDate: '2025-02-01', message: 'Lease expires in 3 weeks', automated: true },
  { id: 3, type: 'cleaning', tenantId: 2, dueDate: '2025-01-12', message: 'Kitchen cleaning duty this weekend', automated: false },
  { id: 4, type: 'rent_due', tenantId: 3, dueDate: '2025-01-15', message: 'Rent due in 3 days', automated: true },
  { id: 5, type: 'move_out', tenantId: 5, dueDate: '2025-01-20', message: 'Move-out inspection reminder', automated: true },
  { id: 6, type: 'custom', tenantId: 6, dueDate: '2025-01-13', message: 'Package delivery - please be home', automated: false },
];

export default function Reminders() {
  const getTenantName = (tenantId: number) => {
    const tenant = mockTenants.find(t => t.id === tenantId);
    return tenant ? tenant.name : 'Unknown Tenant';
  };

  const getTenantPhone = (tenantId: number) => {
    const tenant = mockTenants.find(t => t.id === tenantId);
    return tenant ? tenant.phone : '';
  };

  const handleSendNow = (reminderId: number) => {
    const reminder = mockUpcomingReminders.find(r => r.id === reminderId);
    if (reminder) {
      console.log(`Sending WhatsApp reminder to ${getTenantName(reminder.tenantId)}: "${reminder.message}"`);
    }
  };

  const handleSendBulkRentReminders = () => {
    console.log('Sending rent reminders to all tenants via WhatsApp');
  };

  const handleCreateCustomReminder = () => {
    console.log('Creating custom reminder');
  };

  const rentReminders = mockUpcomingReminders.filter(r => r.type === 'rent_due');
  const otherReminders = mockUpcomingReminders.filter(r => r.type !== 'rent_due');

  return (
    <div>
      <Navigation />
      <h1>Reminders & Communication</h1>
      <p>Automated reminders and custom messages to keep tenants informed via WhatsApp.</p>

      <section>
        <h2>🚨 Urgent: Rent Due Soon</h2>
        <table border={1}>
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Phone</th>
              <th>Due Date</th>
              <th>Message</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rentReminders.map(reminder => (
              <tr key={reminder.id} style={{backgroundColor: '#fff3cd'}}>
                <td><strong>{getTenantName(reminder.tenantId)}</strong></td>
                <td>{getTenantPhone(reminder.tenantId)}</td>
                <td>{reminder.dueDate}</td>
                <td>{reminder.message}</td>
                <td>
                  <button onClick={() => handleSendNow(reminder.id)}>
                    Send WhatsApp Now
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={handleSendBulkRentReminders}>
          📱 Send Rent Reminders to All ({rentReminders.length} tenants)
        </button>
      </section>

      <section>
        <h2>📅 Upcoming Reminders</h2>
        <table border={1}>
          <thead>
            <tr>
              <th>Type</th>
              <th>Tenant</th>
              <th>Phone</th>
              <th>Due Date</th>
              <th>Message</th>
              <th>Auto/Manual</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {otherReminders.map(reminder => (
              <tr key={reminder.id}>
                <td>
                  {reminder.type === 'lease_expiry' && '📄 Lease'}
                  {reminder.type === 'cleaning' && '🧹 Cleaning'}
                  {reminder.type === 'move_out' && '📦 Move-out'}
                  {reminder.type === 'custom' && '💬 Custom'}
                </td>
                <td>{getTenantName(reminder.tenantId)}</td>
                <td>{getTenantPhone(reminder.tenantId)}</td>
                <td>{reminder.dueDate}</td>
                <td>{reminder.message}</td>
                <td>{reminder.automated ? 'Auto' : 'Manual'}</td>
                <td>
                  <button onClick={() => handleSendNow(reminder.id)}>
                    Send Now
                  </button>
                  {' '}
                  <button onClick={() => console.log(`Edit reminder ${reminder.id}`)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>📝 Create Custom Reminder</h2>
        <form>
          <div>
            <label>Select Tenant:</label>
            <select>
              <option value="">Choose tenant...</option>
              {mockTenants.map(tenant => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name} - {tenant.phone}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Reminder Type:</label>
            <select>
              <option value="custom">Custom Message</option>
              <option value="cleaning">Cleaning Duty</option>
              <option value="maintenance">Maintenance Notice</option>
              <option value="event">House Event</option>
            </select>
          </div>
          <div>
            <label>Send Date:</label>
            <input type="date" />
          </div>
          <div>
            <label>Message:</label>
            <textarea placeholder="Type your message here..." rows={3} cols={50}></textarea>
          </div>
          <button type="button" onClick={handleCreateCustomReminder}>
            Create Reminder
          </button>
        </form>
        <p><em>Custom reminders let you send ad-hoc messages to any tenant via WhatsApp.</em></p>
      </section>

      <section>
        <h2>🤖 Automated Reminder Settings</h2>
        <table border={1}>
          <thead>
            <tr>
              <th>Reminder Type</th>
              <th>Timing</th>
              <th>Status</th>
              <th>Last Sent</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Rent Due</td>
              <td>3 days before due date</td>
              <td style={{color: 'green'}}>✅ Active</td>
              <td>Jan 10, 2025</td>
              <td><button>Edit Settings</button></td>
            </tr>
            <tr>
              <td>Lease Expiry</td>
              <td>30 days before expiry</td>
              <td style={{color: 'green'}}>✅ Active</td>
              <td>Dec 15, 2024</td>
              <td><button>Edit Settings</button></td>
            </tr>
            <tr>
              <td>Move-out Checklist</td>
              <td>7 days before move-out</td>
              <td style={{color: 'green'}}>✅ Active</td>
              <td>Jan 8, 2025</td>
              <td><button>Edit Settings</button></td>
            </tr>
            <tr style={{backgroundColor: '#ffeeee'}}>
              <td>Cleaning Rotation</td>
              <td>Weekly on Sundays</td>
              <td style={{color: 'red'}}>❌ Disabled</td>
              <td>Never</td>
              <td><button>Enable & Configure</button></td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>📊 Communication Stats</h2>
        <table border={1}>
          <tr>
            <td><strong>Messages sent this month</strong></td>
            <td>47</td>
          </tr>
          <tr>
            <td><strong>Response rate</strong></td>
            <td>89%</td>
          </tr>
          <tr>
            <td><strong>Most common reminder</strong></td>
            <td>Rent due (31 messages)</td>
          </tr>
          <tr>
            <td><strong>Tenants with WhatsApp</strong></td>
            <td>{mockTenants.length}/{mockTenants.length} (100%)</td>
          </tr>
        </table>
      </section>

      <section>
        <h2>💡 WhatsApp Integration Tips</h2>
        <ul>
          <li><strong>All reminders</strong> are sent via WhatsApp - no apps for tenants to download</li>
          <li><strong>Automated reminders</strong> reduce your daily management workload</li>
          <li><strong>Custom messages</strong> let you handle unique situations quickly</li>
          <li><strong>High response rates</strong> because people check WhatsApp constantly</li>
        </ul>
      </section>
    </div>
  );
} 