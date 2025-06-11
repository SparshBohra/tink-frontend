import { useEffect, useState } from 'react';
import Navigation from '../components/Navigation';
import Link from 'next/link';
import { mockProperties, mockApplications, mockLeases, mockInventory } from '../lib/mockData';

export default function Dashboard() {
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    // Get role from localStorage (set during login)
    const role = localStorage.getItem('userRole') || 'manager';
    setUserRole(role);
  }, []);

  // Calculate key metrics
  const totalRooms = mockProperties.reduce((sum, p) => sum + p.totalRooms, 0);
  const occupiedRooms = mockProperties.reduce((sum, p) => sum + p.occupiedRooms, 0);
  const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);
  const pendingApps = mockApplications.filter(app => app.status === 'pending').length;
  const expiringLeases = mockLeases.filter(lease => lease.status === 'expiring_soon').length;
  const maintenanceIssues = mockInventory.filter(item => item.condition === 'poor' || item.reportedIssues > 0).length;
  const monthlyRevenue = mockLeases.filter(l => l.status === 'active').reduce((sum, l) => sum + l.rent, 0);

  if (userRole === 'landlord') {
    return (
      <div>
        <Navigation />
        <h1>Landlord Dashboard</h1>
        <p>Welcome back! Here&apos;s how your properties are performing.</p>

        <section>
          <h2>🏠 Portfolio Performance</h2>
          <table border={1}>
            <tr>
              <td><strong>Total Properties</strong></td>
              <td>{mockProperties.length}</td>
            </tr>
            <tr>
              <td><strong>Occupancy Rate</strong></td>
              <td>{occupancyRate}% ({occupiedRooms}/{totalRooms} rooms)</td>
            </tr>
            <tr>
              <td><strong>Monthly Revenue</strong></td>
              <td>${monthlyRevenue.toLocaleString()}</td>
            </tr>
            <tr>
              <td><strong>Vacant Rooms</strong></td>
              <td>{totalRooms - occupiedRooms} (potential: ${(totalRooms - occupiedRooms) * 1100}/month)</td>
            </tr>
          </table>
        </section>

        <section>
          <h2>🚨 Needs Attention</h2>
          <ul>
            <li><strong>{expiringLeases} leases expiring soon</strong> - Revenue at risk!</li>
            <li><strong>{pendingApps} applications pending</strong> - Fill vacant rooms faster</li>
            <li><strong>{maintenanceIssues} maintenance issues</strong> - May affect tenant satisfaction</li>
          </ul>
        </section>

        <section>
          <h2>🎯 Quick Actions (Landlord)</h2>
          <ul>
            <li><Link href="/properties"><button>Manage Properties</button></Link> - View all your assets</li>
            <li><Link href="/tenants"><button>View Tenants</button></Link> - See who&apos;s living where</li>
            <li><Link href="/leases"><button>Review Leases</button></Link> - Check expiring agreements</li>
            <li><button onClick={() => console.log('Add new property')}>+ Add New Property</button></li>
          </ul>
        </section>

        <section>
          <h2>📊 Property Breakdown</h2>
          <table border={1}>
            <thead>
              <tr>
                <th>Property</th>
                <th>Occupancy</th>
                <th>Monthly Revenue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {mockProperties.map(property => (
                <tr key={property.id}>
                  <td>{property.name}</td>
                  <td>{property.occupiedRooms}/{property.totalRooms}</td>
                  <td>${property.occupiedRooms * 1100}</td>
                  <td>{property.occupiedRooms === property.totalRooms ? '✅ Full' : '⚠️ Has Vacancies'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    );
  }

  // Manager Dashboard
  return (
    <div>
      <Navigation />
      <h1>Manager Dashboard</h1>
      <p>Your daily operations hub. Here&apos;s what needs your attention today.</p>

      <section>
        <h2>🔥 Today&apos;s Priorities</h2>
        <ul>
          <li><strong>{pendingApps} applications waiting</strong> - Review and approve to fill rooms</li>
          <li><strong>{expiringLeases} leases expiring</strong> - Contact tenants about renewal</li>
          <li><strong>{maintenanceIssues} maintenance items</strong> - Schedule repairs</li>
          <li><strong>Rent reminders</strong> - Due in 3 days (send WhatsApp reminders)</li>
        </ul>
      </section>

      <section>
        <h2>📋 Quick Actions (Manager)</h2>
        <ul>
          <li><Link href="/applications"><button>Review Applications ({pendingApps})</button></Link></li>
          <li><Link href="/tenants"><button>Assign Tenants to Rooms</button></Link></li>
          <li><Link href="/inventory"><button>Manage Inventory ({maintenanceIssues} issues)</button></Link></li>
          <li><Link href="/reminders"><button>Send Reminders</button></Link></li>
        </ul>
      </section>

      <section>
        <h2>🏠 Property Status</h2>
        <table border={1}>
          <thead>
            <tr>
              <th>Property</th>
              <th>Vacant Rooms</th>
              <th>Pending Apps</th>
              <th>Issues</th>
              <th>Action Needed</th>
            </tr>
          </thead>
          <tbody>
            {mockProperties.map(property => {
              const vacantRooms = property.totalRooms - property.occupiedRooms;
              const propertyApps = mockApplications.filter(app => app.propertyId === property.id && app.status === 'pending').length;
              const propertyIssues = mockInventory.filter(item => item.propertyId === property.id && (item.condition === 'poor' || item.reportedIssues > 0)).length;
              
              return (
                <tr key={property.id}>
                  <td>{property.name}</td>
                  <td>{vacantRooms}</td>
                  <td>{propertyApps}</td>
                  <td>{propertyIssues}</td>
                  <td>
                    {vacantRooms > 0 && propertyApps > 0 && 'Match apps to rooms'}
                    {vacantRooms > 0 && propertyApps === 0 && 'Need more applications'}
                    {propertyIssues > 0 && 'Fix maintenance issues'}
                    {vacantRooms === 0 && propertyIssues === 0 && '✅ All good'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section>
        <h2>💡 Pro Tip</h2>
        <p><em>Focus on filling vacant rooms first - each empty room costs ${1100}/month in lost revenue!</em></p>
      </section>
    </div>
  );
} 