import { useEffect, useState } from 'react';
import Navigation from '../components/Navigation';
import Link from 'next/link';
import { mockProperties, mockApplications, mockLeases, mockInventory, mockRooms } from '../lib/mockData';

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
  const potentialMonthlyRevenue = mockRooms.reduce((sum, room) => sum + room.rent, 0);
  const lostRevenue = potentialMonthlyRevenue - monthlyRevenue;

  const downloadReport = () => {
    const csvData = [
      ['Metric', 'Value'],
      ['Total Properties', mockProperties.length.toString()],
      ['Monthly Revenue', `$${monthlyRevenue}`],
      ['Potential Revenue', `$${potentialMonthlyRevenue}`],
      ['Lost Revenue', `$${lostRevenue}`],
      ['Occupancy Rate', `${occupancyRate}%`],
      ['Pending Applications', pendingApps.toString()],
      ['Expiring Leases', expiringLeases.toString()],
      ['Maintenance Issues', maintenanceIssues.toString()]
    ];
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tink-dashboard-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (userRole === 'landlord') {
    return (
      <div>
        <Navigation />
        
        <h1>💰 Revenue Dashboard</h1>
        <p>Track your property portfolio performance and revenue opportunities.</p>

        {/* Key Metrics - Simple Cards */}
        <div style={{display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap'}}>
          <div style={{border: '1px solid #ddd', padding: '15px', borderRadius: '5px', minWidth: '200px'}}>
            <h3 style={{margin: '0 0 10px 0', color: '#27ae60'}}>Monthly Revenue</h3>
            <div style={{fontSize: '24px', fontWeight: 'bold'}}>${monthlyRevenue.toLocaleString()}</div>
            <small style={{color: '#666'}}>of ${potentialMonthlyRevenue.toLocaleString()} potential</small>
          </div>
          
          <div style={{border: '1px solid #ddd', padding: '15px', borderRadius: '5px', minWidth: '200px'}}>
            <h3 style={{margin: '0 0 10px 0', color: '#e74c3c'}}>Lost Revenue</h3>
            <div style={{fontSize: '24px', fontWeight: 'bold', color: '#e74c3c'}}>-${lostRevenue.toLocaleString()}</div>
            <small style={{color: '#666'}}>per month from vacant rooms</small>
          </div>
          
          <div style={{border: '1px solid #ddd', padding: '15px', borderRadius: '5px', minWidth: '200px'}}>
            <h3 style={{margin: '0 0 10px 0', color: '#3498db'}}>Occupancy Rate</h3>
            <div style={{fontSize: '24px', fontWeight: 'bold'}}>{occupancyRate}%</div>
            <small style={{color: '#666'}}>{occupiedRooms} of {totalRooms} rooms filled</small>
          </div>
        </div>

        {/* Action Items */}
        <div style={{backgroundColor: '#fff3cd', padding: '15px', borderRadius: '5px', marginBottom: '20px'}}>
          <h3 style={{margin: '0 0 10px 0'}}>🚨 Immediate Actions Needed</h3>
          <ul style={{margin: '0', paddingLeft: '20px'}}>
            <li><strong>{pendingApps} applications pending</strong> - <Link href="/applications">Review now</Link> to fill vacant rooms</li>
            <li><strong>{expiringLeases} leases expiring soon</strong> - <Link href="/leases">Contact tenants</Link> about renewal</li>
            <li><strong>{maintenanceIssues} maintenance issues</strong> - <Link href="/inventory">Fix immediately</Link> to keep tenants happy</li>
          </ul>
        </div>

        {/* Property Performance */}
        <h2>🏠 Property Performance</h2>
        <table border={1} style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead>
            <tr style={{backgroundColor: '#f8f9fa'}}>
              <th style={{padding: '10px', textAlign: 'left'}}>Property</th>
              <th style={{padding: '10px', textAlign: 'center'}}>Occupancy</th>
              <th style={{padding: '10px', textAlign: 'center'}}>Monthly Revenue</th>
              <th style={{padding: '10px', textAlign: 'center'}}>Status</th>
            </tr>
          </thead>
          <tbody>
            {mockProperties.map(property => {
              const occupancyPercent = Math.round((property.occupiedRooms / property.totalRooms) * 100);
              const propertyRevenue = property.occupiedRooms * 1100; // approximate
              return (
                <tr key={property.id}>
                  <td style={{padding: '10px'}}>
                    <strong>{property.name}</strong><br/>
                    <small>{property.address}</small>
                  </td>
                  <td style={{padding: '10px', textAlign: 'center'}}>
                    {occupancyPercent}%<br/>
                    <small>({property.occupiedRooms}/{property.totalRooms})</small>
                  </td>
                  <td style={{padding: '10px', textAlign: 'center'}}>
                    ${propertyRevenue.toLocaleString()}
                  </td>
                  <td style={{padding: '10px', textAlign: 'center'}}>
                    {occupancyPercent === 100 ? 
                      <span style={{color: '#27ae60'}}>✅ Full</span> : 
                      <span style={{color: '#e74c3c'}}>⚠️ Has Vacancies</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Quick Actions */}
        <div style={{marginTop: '30px'}}>
          <h3>⚡ Quick Actions</h3>
          <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
            <Link href="/properties">
              <button style={{backgroundColor: '#27ae60', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '5px'}}>
                📊 View Properties
              </button>
            </Link>
            <Link href="/applications">
              <button style={{backgroundColor: '#e74c3c', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '5px'}}>
                📋 Review Applications
              </button>
            </Link>
            <button onClick={downloadReport} style={{backgroundColor: '#3498db', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '5px'}}>
              📥 Download Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Manager Dashboard - Simplified
  return (
    <div>
      <Navigation />
      
      <h1>⚙️ Operations Dashboard</h1>
      <p>Your daily task center. Focus on the most important items first.</p>

      {/* Priority Tasks */}
      <div style={{backgroundColor: '#ffebee', padding: '15px', borderRadius: '5px', marginBottom: '20px'}}>
        <h3 style={{margin: '0 0 10px 0', color: '#e74c3c'}}>🔥 Priority Tasks</h3>
        <ul style={{margin: '0', paddingLeft: '20px'}}>
          <li><strong>{pendingApps} applications waiting</strong> - <Link href="/applications">Review & approve</Link></li>
          <li><strong>{expiringLeases} leases expiring</strong> - <Link href="/leases">Send renewal notices</Link></li>
          <li><strong>{maintenanceIssues} maintenance items</strong> - <Link href="/inventory">Schedule repairs</Link></li>
        </ul>
      </div>

      {/* Quick Stats */}
      <div style={{display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap'}}>
        <div style={{border: '1px solid #ddd', padding: '15px', borderRadius: '5px', minWidth: '150px'}}>
          <h4 style={{margin: '0 0 5px 0'}}>Occupancy</h4>
          <div style={{fontSize: '20px', fontWeight: 'bold'}}>{occupancyRate}%</div>
        </div>
        <div style={{border: '1px solid #ddd', padding: '15px', borderRadius: '5px', minWidth: '150px'}}>
          <h4 style={{margin: '0 0 5px 0'}}>Revenue</h4>
          <div style={{fontSize: '20px', fontWeight: 'bold'}}>${monthlyRevenue.toLocaleString()}</div>
        </div>
        <div style={{border: '1px solid #ddd', padding: '15px', borderRadius: '5px', minWidth: '150px'}}>
          <h4 style={{margin: '0 0 5px 0'}}>Vacant Rooms</h4>
          <div style={{fontSize: '20px', fontWeight: 'bold'}}>{totalRooms - occupiedRooms}</div>
        </div>
      </div>

      {/* Property Status */}
      <h2>🏠 Property Status</h2>
      <table border={1} style={{width: '100%', borderCollapse: 'collapse'}}>
        <thead>
          <tr style={{backgroundColor: '#f8f9fa'}}>
            <th style={{padding: '10px', textAlign: 'left'}}>Property</th>
            <th style={{padding: '10px', textAlign: 'center'}}>Vacant Rooms</th>
            <th style={{padding: '10px', textAlign: 'center'}}>Pending Apps</th>
            <th style={{padding: '10px', textAlign: 'center'}}>Action Needed</th>
          </tr>
        </thead>
        <tbody>
          {mockProperties.map(property => {
            const vacantRooms = property.totalRooms - property.occupiedRooms;
            const propertyApps = mockApplications.filter(app => app.propertyId === property.id && app.status === 'pending').length;
            
            return (
              <tr key={property.id}>
                <td style={{padding: '10px'}}>{property.name}</td>
                <td style={{padding: '10px', textAlign: 'center'}}>{vacantRooms}</td>
                <td style={{padding: '10px', textAlign: 'center'}}>{propertyApps}</td>
                <td style={{padding: '10px', textAlign: 'center'}}>
                  {vacantRooms > 0 && propertyApps > 0 && <span style={{color: '#27ae60'}}>✅ Can fill rooms</span>}
                  {vacantRooms > 0 && propertyApps === 0 && <span style={{color: '#e74c3c'}}>📢 Need applications</span>}
                  {vacantRooms === 0 && <span style={{color: '#27ae60'}}>✅ Full</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Quick Actions */}
      <div style={{marginTop: '30px'}}>
        <h3>⚡ Quick Actions</h3>
        <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
          <Link href="/applications">
            <button style={{backgroundColor: '#e74c3c', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '5px'}}>
              📋 Review Applications
            </button>
          </Link>
          <Link href="/reminders">
            <button style={{backgroundColor: '#9b59b6', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '5px'}}>
              📱 Send Reminders
            </button>
          </Link>
          <Link href="/inventory">
            <button style={{backgroundColor: '#17a2b8', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '5px'}}>
              🔧 Fix Issues
            </button>
          </Link>
          <button onClick={downloadReport} style={{backgroundColor: '#3498db', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '5px'}}>
            📥 Download Report
          </button>
        </div>
      </div>
    </div>
  );
} 