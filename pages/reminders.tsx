import Navigation from '../components/Navigation';
import { mockTenants, mockRooms, mockProperties, mockLeases } from '../lib/mockData';

export default function Reminders() {
  // Calculate tenant and lease data for intelligent reminders
  const tenantsWithDetails = mockTenants.map(tenant => {
    const room = mockRooms.find(r => r.id === tenant.roomId);
    const property = room ? mockProperties.find(p => p.id === room.propertyId) : null;
    const lease = mockLeases.find(l => l.tenantId === tenant.id);
    return {
      ...tenant,
      room,
      property,
      lease,
      propertyName: property?.name || 'Unknown'
    };
  });

  const upcomingRentDue = tenantsWithDetails.filter(t => t.lease?.status === 'active');
  const expiringLeases = tenantsWithDetails.filter(t => t.lease?.status === 'expiring_soon');

  // Communication handlers
  const handleSendReminder = (type: string, channel: string, recipients: string[], message: string) => {
    console.log(`Sending ${type} reminder via ${channel} to ${recipients.length} recipients:`, message);
  };

  const handleScheduleReminder = (type: string, channel: string, date: string) => {
    console.log(`Scheduling ${type} reminder via ${channel} for ${date}`);
  };

  const handleSendAnnouncement = (channel: string, property: string, message: string) => {
    console.log(`Sending announcement via ${channel} to ${property}:`, message);
  };

  // CSV downloads for communication tracking
  const downloadCommunicationLog = () => {
    const csvData = [
      ['Date', 'Type', 'Channel', 'Recipients', 'Message', 'Status', 'Response Rate'],
      ['2025-01-10', 'Rent Reminder', 'WhatsApp', '8 tenants', 'Rent due in 3 days', 'Sent', '75%'],
      ['2025-01-08', 'Maintenance', 'Email', '4 tenants', 'Water shut off tomorrow', 'Sent', '100%'],
      ['2025-01-05', 'Lease Renewal', 'SMS', '2 tenants', 'Lease expires soon', 'Sent', '50%'],
      ['2025-01-03', 'Welcome', 'WhatsApp Group', 'New tenant', 'Welcome to Castro Commons!', 'Sent', '100%']
    ];
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date().toISOString().split('T')[0];
    a.download = `tink-communication-log-${today}.csv`;
    a.click();
  };

  const downloadReminderSchedule = () => {
    const csvData = [
      ['Date', 'Type', 'Channel', 'Recipients', 'Auto/Manual', 'Status'],
      ['2025-01-13', 'Rent Due', 'WhatsApp + Email', 'All active tenants', 'Automatic', 'Scheduled'],
      ['2025-01-15', 'Lease Renewal', 'SMS + WhatsApp', 'Expiring leases', 'Manual', 'Scheduled'],
      ['2025-01-20', 'Maintenance Notice', 'WhatsApp Group', 'Castro Commons', 'Manual', 'Draft'],
      ['2025-01-25', 'Rent Due', 'All channels', 'Late payments', 'Automatic', 'Scheduled']
    ];
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date().toISOString().split('T')[0];
    a.download = `tink-reminder-schedule-${today}.csv`;
    a.click();
  };

  return (
    <div>
      <Navigation />
      <h1>Communication Hub</h1>
      <p>Send reminders, announcements, and manage all tenant communication through email, SMS, and WhatsApp.</p>
      
      <div style={{backgroundColor: '#f0f8ff', padding: '15px', borderRadius: '5px', marginBottom: '20px'}}>
        <strong>💡 Quick Tip:</strong> WhatsApp gets 89% response rate vs 67% for email. Use WhatsApp for urgent messages.
      </div>

      <section>
        <h2>📊 Communication Overview & Reports</h2>
        <table border={1}>
          <tr>
            <td><strong>Active Communication Channels</strong></td>
            <td>✅ WhatsApp • ✅ Email • ✅ SMS • ✅ WhatsApp Groups</td>
          </tr>
          <tr>
            <td><strong>Tenants in System</strong></td>
            <td>{mockTenants.length} tenants across {mockProperties.length} properties</td>
          </tr>
          <tr>
            <td><strong>Scheduled Reminders</strong></td>
            <td>4 automatic, 2 manual (next: rent due in 3 days)</td>
          </tr>
          <tr>
            <td><strong>Response Rates (Last 30 days)</strong></td>
            <td>WhatsApp: 89% • Email: 67% • SMS: 45%</td>
          </tr>
          <tr>
            <td><strong>Property WhatsApp Groups</strong></td>
            <td>
              {mockProperties.map(p => (
                <span key={p.id} style={{marginRight: '10px'}}>
                  📱 {p.name} ({mockTenants.filter(t => {
                    const room = mockRooms.find(r => r.id === t.roomId);
                    return room?.propertyId === p.id;
                  }).length} members)
                </span>
              ))}
            </td>
          </tr>
        </table>

        <div style={{margin: '10px 0'}}>
          <button onClick={downloadCommunicationLog} style={{backgroundColor: '#28a745', color: 'white', margin: '5px'}}>
            📊 Download Communication Log (CSV)
          </button>
          <button onClick={downloadReminderSchedule} style={{backgroundColor: '#17a2b8', color: 'white', margin: '5px'}}>
            📅 Download Reminder Schedule (CSV)
          </button>
        </div>
      </section>

      <section>
        <h2>🚨 Urgent Reminders Needed</h2>
        <table border={1}>
          <thead>
            <tr>
              <th>Priority</th>
              <th>Type</th>
              <th>Recipients</th>
              <th>Recommended Channel</th>
              <th>Quick Send</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{backgroundColor: '#ffebee'}}>
              <td><strong style={{color: 'red'}}>HIGH</strong></td>
              <td>Rent Due Tomorrow</td>
              <td>3 tenants haven&apos;t paid</td>
              <td>WhatsApp + SMS (immediate)</td>
              <td>
                <button 
                  onClick={() => handleSendReminder('rent', 'whatsapp+sms', ['tenant1', 'tenant2'], 'URGENT: Rent due tomorrow')}
                  style={{backgroundColor: '#dc3545', color: 'white'}}
                >
                  🚨 Send Now
                </button>
              </td>
            </tr>
            <tr style={{backgroundColor: '#fff3cd'}}>
              <td><strong style={{color: 'orange'}}>MEDIUM</strong></td>
              <td>Lease Renewals</td>
              <td>{expiringLeases.length} expiring in 30 days</td>
              <td>Email + WhatsApp (personal)</td>
              <td>
                <button 
                  onClick={() => handleSendReminder('lease', 'email+whatsapp', ['expiring'], 'Time to discuss lease renewal')}
                  style={{backgroundColor: '#ffc107', color: 'black'}}
                >
                  📄 Send Renewal Notice
                </button>
              </td>
            </tr>
            <tr style={{backgroundColor: '#e8f5e8'}}>
              <td><strong style={{color: 'green'}}>LOW</strong></td>
              <td>Monthly Newsletter</td>
              <td>All tenants</td>
              <td>Email + WhatsApp Groups</td>
              <td>
                <button 
                  onClick={() => handleSendAnnouncement('email+groups', 'all', 'Monthly property updates')}
                  style={{backgroundColor: '#28a745', color: 'white'}}
                >
                  📨 Send Newsletter
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>📱 Quick Communication Actions</h2>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', margin: '15px 0'}}>
          
          <div style={{border: '1px solid #ccc', padding: '15px', borderRadius: '5px'}}>
            <h3>💰 Rent Reminders</h3>
            <p>Send rent due notices to tenants</p>
            <button 
              onClick={() => handleSendReminder('rent', 'whatsapp', upcomingRentDue.map(t => t.name), 'Rent due in 3 days - please pay via bank transfer')}
              style={{backgroundColor: '#25D366', color: 'white', width: '100%', margin: '5px 0'}}
            >
              📱 WhatsApp All Tenants
            </button>
            <button 
              onClick={() => handleSendReminder('rent', 'email', upcomingRentDue.map(t => t.email), 'Rent payment reminder with invoice attached')}
              style={{backgroundColor: '#0073e6', color: 'white', width: '100%', margin: '5px 0'}}
            >
              📧 Email with Invoice
            </button>
            <button 
              onClick={() => handleSendReminder('rent', 'sms', upcomingRentDue.map(t => t.phone), 'Quick SMS: Rent due soon')}
              style={{backgroundColor: '#ff6b35', color: 'white', width: '100%', margin: '5px 0'}}
            >
              📱 SMS Reminder
            </button>
          </div>

          <div style={{border: '1px solid #ccc', padding: '15px', borderRadius: '5px'}}>
            <h3>🏠 Property Announcements</h3>
            <p>Broadcast to all tenants in a property</p>
            {mockProperties.map(property => (
              <button 
                key={property.id}
                onClick={() => handleSendAnnouncement('whatsapp-group', property.name, 'Property announcement')}
                style={{backgroundColor: '#17a2b8', color: 'white', width: '100%', margin: '2px 0', fontSize: '12px'}}
              >
                📢 {property.name} Group
              </button>
            ))}
            <button 
              onClick={() => handleSendAnnouncement('email', 'all', 'Important announcement for all properties')}
              style={{backgroundColor: '#6f42c1', color: 'white', width: '100%', margin: '5px 0'}}
            >
              📧 Email All Properties
            </button>
          </div>

          <div style={{border: '1px solid #ccc', padding: '15px', borderRadius: '5px'}}>
            <h3>🔧 Maintenance Notices</h3>
            <p>Notify about maintenance work</p>
            <button 
              onClick={() => handleSendAnnouncement('whatsapp-group', 'maintenance', 'Water shut off tomorrow 9AM-2PM for repairs')}
              style={{backgroundColor: '#fd7e14', color: 'white', width: '100%', margin: '5px 0'}}
            >
              🚰 Water Shut-off Notice
            </button>
            <button 
              onClick={() => handleSendAnnouncement('email+whatsapp', 'maintenance', 'Internet maintenance scheduled')}
              style={{backgroundColor: '#20c997', color: 'white', width: '100%', margin: '5px 0'}}
            >
              📶 Internet Maintenance
            </button>
            <button 
              onClick={() => handleSendAnnouncement('sms', 'urgent', 'URGENT: Gas leak - evacuate immediately')}
              style={{backgroundColor: '#dc3545', color: 'white', width: '100%', margin: '5px 0'}}
            >
              🚨 Emergency Alert
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2>📅 Automated Reminder Schedule</h2>
        <table border={1}>
          <thead>
            <tr>
              <th>Trigger</th>
              <th>When</th>
              <th>Channel</th>
              <th>Message Template</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Rent Due</strong></td>
              <td>3 days before due date</td>
              <td>WhatsApp + Email</td>
              <td>&quot;Hi &#123;name&#125;, rent due in 3 days. Pay via: [bank details]&quot;</td>
              <td style={{color: 'green'}}>✅ Active</td>
              <td>
                <button onClick={() => console.log('Edit template')}>Edit</button>
                <button onClick={() => console.log('Test send')}>Test</button>
              </td>
            </tr>
            <tr>
              <td><strong>Lease Expiry</strong></td>
              <td>60 days before expiry</td>
              <td>Email + WhatsApp</td>
              <td>&quot;Your lease expires on &#123;date&#125;. Let&apos;s discuss renewal!&quot;</td>
              <td style={{color: 'green'}}>✅ Active</td>
              <td>
                <button onClick={() => console.log('Edit template')}>Edit</button>
                <button onClick={() => console.log('Test send')}>Test</button>
              </td>
            </tr>
            <tr>
              <td><strong>Late Payment</strong></td>
              <td>1 day after due date</td>
              <td>SMS + WhatsApp</td>
              <td>&quot;URGENT: Rent payment overdue. Please pay today to avoid fees.&quot;</td>
              <td style={{color: 'green'}}>✅ Active</td>
              <td>
                <button onClick={() => console.log('Edit template')}>Edit</button>
                <button onClick={() => console.log('Test send')}>Test</button>
              </td>
            </tr>
            <tr>
              <td><strong>Welcome New Tenant</strong></td>
              <td>On move-in day</td>
              <td>WhatsApp Group + Email</td>
              <td>&quot;Welcome to &#123;property&#125;! Here&apos;s everything you need to know...&quot;</td>
              <td style={{color: 'green'}}>✅ Active</td>
              <td>
                <button onClick={() => console.log('Edit template')}>Edit</button>
                <button onClick={() => console.log('Test send')}>Test</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>📱 WhatsApp Group Management</h2>
        <table border={1}>
          <thead>
            <tr>
              <th>Property</th>
              <th>Group Members</th>
              <th>Last Activity</th>
              <th>Bot Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockProperties.map(property => {
              const propertyTenants = tenantsWithDetails.filter(t => t.property?.id === property.id);
              return (
                <tr key={property.id}>
                  <td>
                    <strong>📱 {property.name}</strong>
                    <br />
                    <small>{property.address}</small>
                  </td>
                  <td>
                    {propertyTenants.length} tenants + 1 manager
                    <br />
                    <small>
                      {propertyTenants.slice(0, 3).map(t => t.name).join(', ')}
                      {propertyTenants.length > 3 && '...'}
                    </small>
                  </td>
                  <td>
                    <span style={{color: 'green'}}>2 hours ago</span>
                    <br />
                    <small>&quot;Thanks for fixing the WiFi!&quot;</small>
                  </td>
                  <td>
                    <span style={{color: 'green'}}>🤖 Active</span>
                    <br />
                    <small>Auto-responses ON</small>
                  </td>
                  <td>
                    <button 
                      onClick={() => handleSendAnnouncement('whatsapp-group', property.name, 'Quick message to group')}
                      style={{backgroundColor: '#25D366', color: 'white', margin: '2px'}}
                    >
                      💬 Send Message
                    </button>
                    <br />
                    <button onClick={() => console.log('Manage group')}>⚙️ Manage</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section>
        <h2>🤖 WhatsApp Bot Features</h2>
        <div style={{backgroundColor: '#f8f9fa', padding: '15px', border: '1px solid #ddd', borderRadius: '5px'}}>
          <h3>Automated Responses Available:</h3>
          <ul>
            <li><strong>&quot;rent&quot;</strong> → Shows rent amount, due date, and payment instructions</li>
            <li><strong>&quot;maintenance&quot;</strong> → Creates maintenance ticket and notifies manager</li>
            <li><strong>&quot;wifi&quot;</strong> → Provides WiFi password and troubleshooting steps</li>
            <li><strong>&quot;contact&quot;</strong> → Shows manager contact information</li>
            <li><strong>&quot;lease&quot;</strong> → Shows lease end date and renewal options</li>
            <li><strong>&quot;help&quot;</strong> → Shows all available commands</li>
          </ul>
          
          <h3>Bot Commands for Managers:</h3>
          <ul>
            <li><strong>/announce [message]</strong> → Broadcast to all property groups</li>
            <li><strong>/remind rent</strong> → Send rent reminders to overdue tenants</li>
            <li><strong>/status</strong> → Get bot health and usage statistics</li>
            <li><strong>/mute [tenant]</strong> → Temporarily disable bot for specific tenant</li>
          </ul>
        </div>
      </section>

      <section>
        <h2>📈 Communication Analytics</h2>
        <table border={1}>
          <tr>
            <td><strong>Messages Sent (Last 30 days)</strong></td>
            <td>247 total (WhatsApp: 156, Email: 67, SMS: 24)</td>
          </tr>
          <tr>
            <td><strong>Response Rate</strong></td>
            <td>WhatsApp: 89% • Email: 67% • SMS: 45%</td>
          </tr>
          <tr>
            <td><strong>Fastest Channel</strong></td>
            <td>WhatsApp (avg response: 12 minutes)</td>
          </tr>
          <tr>
            <td><strong>Best Time to Send</strong></td>
            <td>Weekdays 10AM-2PM (highest open rates)</td>
          </tr>
          <tr>
            <td><strong>Most Effective Message</strong></td>
            <td>Rent reminders with payment link (95% success rate)</td>
          </tr>
          <tr>
            <td><strong>Cost Savings</strong></td>
            <td>WhatsApp saves ~$45/month vs SMS for same volume</td>
          </tr>
        </table>
      </section>

      <section>
        <h2>💡 Communication Best Practices</h2>
        <ul>
          <li><strong>WhatsApp</strong> - Best for urgent messages, maintenance requests, and group announcements</li>
          <li><strong>Email</strong> - Perfect for lease agreements, invoices, and formal documentation</li>
          <li><strong>SMS</strong> - Use for critical alerts when WhatsApp might be missed</li>
          <li><strong>Multi-channel</strong> - Send important reminders via 2+ channels for higher response rates</li>
          <li><strong>Timing</strong> - Send rent reminders Tuesday-Thursday for best response</li>
          <li><strong>Personal touch</strong> - Use tenant names and property-specific details</li>
          <li><strong>Clear CTAs</strong> - Always include next steps (payment link, contact info, etc.)</li>
          <li><strong>Group management</strong> - Keep property groups focused on building matters only</li>
        </ul>
      </section>

      <section>
        <h2>⚙️ Communication Settings</h2>
        <ul>
          <li><button onClick={() => console.log('Setup WhatsApp API')}>📱 Configure WhatsApp Business API</button></li>
          <li><button onClick={() => console.log('Setup email templates')}>📧 Customize Email Templates</button></li>
          <li><button onClick={() => console.log('Setup SMS provider')}>📱 Configure SMS Provider</button></li>
          <li><button onClick={() => console.log('Setup bot responses')}>🤖 Configure Bot Auto-Responses</button></li>
          <li><button onClick={() => console.log('Manage groups')}>👥 Manage WhatsApp Groups</button></li>
          <li><button onClick={() => console.log('Communication preferences')}>⚙️ Set Communication Preferences by Tenant</button></li>
        </ul>
      </section>
    </div>
  );
} 