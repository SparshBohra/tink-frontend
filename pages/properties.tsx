import Navigation from '../components/Navigation';
import Link from 'next/link';
import { mockProperties, mockRooms, mockLeases, mockApplications, mockInventory } from '../lib/mockData';

export default function Properties() {
  // Calculate enhanced property analytics
  const propertiesWithAnalytics = mockProperties.map(property => {
    const propertyRooms = mockRooms.filter(r => r.propertyId === property.id);
    const occupiedRooms = propertyRooms.filter(r => r.occupied);
    const vacantRooms = propertyRooms.filter(r => !r.occupied);
    const monthlyRevenue = occupiedRooms.reduce((sum, r) => sum + r.rent, 0);
    const potentialRevenue = propertyRooms.reduce((sum, r) => sum + r.rent, 0);
    const lostRevenue = potentialRevenue - monthlyRevenue;
    const occupancyRate = propertyRooms.length > 0 ? Math.round((occupiedRooms.length / propertyRooms.length) * 100) : 0;
    const averageRent = propertyRooms.length > 0 ? Math.round(potentialRevenue / propertyRooms.length) : 0;
    const pendingApps = mockApplications.filter(app => app.propertyId === property.id && app.status === 'pending').length;
    const maintenanceIssues = mockInventory.filter(item => item.propertyId === property.id && (item.condition === 'poor' || item.reportedIssues > 0)).length;
         const expiringLeases = mockLeases.filter(lease => {
       const room = mockRooms.find(r => r.id === lease.roomId);
       return room?.propertyId === property.id && lease.status === 'expiring_soon';
     }).length;
    
    return {
      ...property,
      propertyRooms,
      occupiedRooms: occupiedRooms.length,
      vacantRooms: vacantRooms.length,
      monthlyRevenue,
      potentialRevenue,
      lostRevenue,
      occupancyRate,
      averageRent,
      annualRevenue: monthlyRevenue * 12,
      potentialAnnualRevenue: potentialRevenue * 12,
      pendingApps,
      maintenanceIssues,
      expiringLeases,
      revenueEfficiency: potentialRevenue > 0 ? Math.round((monthlyRevenue / potentialRevenue) * 100) : 0
    };
  });

  const downloadPropertiesReport = () => {
    const csvData = [
      [
        'Property Name', 'Address', 'Total Rooms', 'Occupied Rooms', 'Vacant Rooms', 
        'Occupancy Rate', 'Monthly Revenue', 'Potential Revenue', 'Lost Revenue', 
        'Annual Revenue', 'Average Rent', 'Revenue Efficiency', 'Pending Applications',
        'Maintenance Issues', 'Expiring Leases'
      ],
      ...propertiesWithAnalytics.map(p => [
        p.name,
        p.address,
        p.totalRooms.toString(),
        p.occupiedRooms.toString(),
        p.vacantRooms.toString(),
        `${p.occupancyRate}%`,
        `$${p.monthlyRevenue}`,
        `$${p.potentialRevenue}`,
        `$${p.lostRevenue}`,
        `$${p.annualRevenue}`,
        `$${p.averageRent}`,
        `${p.revenueEfficiency}%`,
        p.pendingApps.toString(),
        p.maintenanceIssues.toString(),
        p.expiringLeases.toString()
      ])
    ];
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tink-properties-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const downloadVacancyReport = () => {
    const vacantProperties = propertiesWithAnalytics.filter(p => p.vacantRooms > 0);
    const csvData = [
      ['Property', 'Vacant Rooms', 'Lost Monthly Revenue', 'Lost Annual Revenue', 'Pending Applications', 'Days to Fill (Est)', 'Revenue Recovery Priority'],
      ...vacantProperties.map(p => [
        p.name,
        p.vacantRooms.toString(),
        `$${p.lostRevenue}`,
        `$${p.lostRevenue * 12}`,
        p.pendingApps.toString(),
        p.pendingApps >= p.vacantRooms ? '7-14' : '30-45',
        p.lostRevenue > 2000 ? 'HIGH' : p.lostRevenue > 1000 ? 'MEDIUM' : 'LOW'
      ])
    ];
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tink-vacancy-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const totalMonthlyRevenue = propertiesWithAnalytics.reduce((sum, p) => sum + p.monthlyRevenue, 0);
  const totalPotentialRevenue = propertiesWithAnalytics.reduce((sum, p) => sum + p.potentialRevenue, 0);
  const totalLostRevenue = totalPotentialRevenue - totalMonthlyRevenue;
  const overallOccupancyRate = Math.round((totalMonthlyRevenue / totalPotentialRevenue) * 100);
  const totalVacantRooms = propertiesWithAnalytics.reduce((sum, p) => sum + p.vacantRooms, 0);
  const topPerformingProperty = propertiesWithAnalytics.reduce((prev, current) => 
    current.revenueEfficiency > prev.revenueEfficiency ? current : prev
  );
  const underperformingProperties = propertiesWithAnalytics.filter(p => p.occupancyRate < 90);

  return (
    <div>
      <Navigation />
      <h1>Properties Portfolio</h1>
      <p>Revenue analytics, occupancy tracking, and performance optimization for your property portfolio.</p>
      
      <div style={{backgroundColor: '#f0f8ff', padding: '15px', borderRadius: '5px', marginBottom: '20px'}}>
        <strong>💡 Quick Tip:</strong> Focus on properties with vacant rooms first - each empty room costs ~$40/day in lost revenue.
        <Link href="/applications" style={{marginLeft: '10px', color: '#3498db'}}>Review Applications →</Link>
      </div>

      <section>
        <h2>💰 Portfolio Financial Summary</h2>
        <table border={1}>
          <tr>
            <td><strong>Total Properties</strong></td>
            <td>{propertiesWithAnalytics.length}</td>
          </tr>
          <tr>
            <td><strong>Monthly Revenue</strong></td>
            <td style={{color: 'green'}}>${totalMonthlyRevenue.toLocaleString()}</td>
          </tr>
          <tr>
            <td><strong>Annual Revenue (Current)</strong></td>
            <td style={{color: 'green'}}>${(totalMonthlyRevenue * 12).toLocaleString()}</td>
          </tr>
          <tr style={{backgroundColor: '#fff3cd'}}>
            <td><strong>Potential Annual Revenue</strong></td>
            <td>${(totalPotentialRevenue * 12).toLocaleString()}</td>
          </tr>
          <tr style={{backgroundColor: '#ffebee'}}>
            <td><strong>Lost Revenue (Annual)</strong></td>
            <td style={{color: 'red'}}>-${(totalLostRevenue * 12).toLocaleString()}</td>
          </tr>
          <tr>
            <td><strong>Overall Occupancy Rate</strong></td>
            <td style={{color: overallOccupancyRate >= 90 ? 'green' : overallOccupancyRate >= 80 ? 'orange' : 'red'}}>
              {overallOccupancyRate}%
            </td>
          </tr>
          <tr>
            <td><strong>Vacant Rooms</strong></td>
            <td style={{color: 'red'}}>{totalVacantRooms} rooms = ${totalLostRevenue.toLocaleString()}/month lost</td>
          </tr>
          <tr>
            <td><strong>Top Performing Property</strong></td>
            <td style={{color: 'green'}}>{topPerformingProperty.name} ({topPerformingProperty.revenueEfficiency}% efficiency)</td>
          </tr>
        </table>

        <div style={{margin: '10px 0'}}>
          <button onClick={downloadPropertiesReport} style={{backgroundColor: '#28a745', color: 'white', margin: '5px'}}>
            📊 Download Properties Analytics (CSV)
          </button>
          <button onClick={downloadVacancyReport} style={{backgroundColor: '#dc3545', color: 'white', margin: '5px'}}>
            🏠 Download Vacancy Report (CSV)
          </button>
        </div>
      </section>

      {underperformingProperties.length > 0 && (
        <section>
          <h2>🚨 Properties Needing Attention ({underperformingProperties.length})</h2>
          <p><em>Properties with less than 90% occupancy - focus here for revenue recovery</em></p>
          <table border={1}>
            <thead>
              <tr>
                <th>Property</th>
                <th>Occupancy</th>
                <th>Lost Revenue/Month</th>
                <th>Pending Apps</th>
                <th>Priority Action</th>
              </tr>
            </thead>
            <tbody>
              {underperformingProperties.map(property => (
                <tr key={property.id} style={{backgroundColor: '#fff3cd'}}>
                  <td><strong>{property.name}</strong></td>
                  <td style={{color: 'red'}}>{property.occupancyRate}%</td>
                  <td style={{color: 'red'}}>-${property.lostRevenue.toLocaleString()}</td>
                  <td>{property.pendingApps}</td>
                  <td>
                    {property.pendingApps >= property.vacantRooms ? 
                      '✅ Review & approve applications' : 
                      '📢 Need more marketing/applications'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section>
        <h2>🏠 Properties Overview</h2>
        <table border={1}>
          <thead>
            <tr>
              <th>Property</th>
              <th>Location</th>
              <th>Occupancy</th>
              <th>Monthly Revenue</th>
              <th>Revenue Efficiency</th>
              <th>Issues</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {propertiesWithAnalytics.map(property => {
              const hasIssues = property.vacantRooms > 0 || property.maintenanceIssues > 0 || property.expiringLeases > 0;
              return (
                <tr key={property.id} style={{backgroundColor: hasIssues ? '#fff3cd' : '#f8f9fa'}}>
                  <td>
                    <strong>{property.name}</strong>
                    <br />
                    <small>{property.totalRooms} total rooms</small>
                  </td>
                  <td>{property.address}</td>
                  <td style={{color: property.occupancyRate >= 90 ? 'green' : property.occupancyRate >= 80 ? 'orange' : 'red'}}>
                    {property.occupancyRate}%
                    <br />
                    <small>({property.occupiedRooms}/{property.totalRooms} occupied)</small>
                  </td>
                  <td>
                    <strong style={{color: 'green'}}>${property.monthlyRevenue.toLocaleString()}</strong>
                    <br />
                    <small>Potential: ${property.potentialRevenue.toLocaleString()}</small>
                    {property.lostRevenue > 0 && (
                      <div style={{color: 'red', fontSize: '12px'}}>
                        Lost: ${property.lostRevenue.toLocaleString()}/mo
                      </div>
                    )}
                  </td>
                  <td style={{color: property.revenueEfficiency >= 95 ? 'green' : property.revenueEfficiency >= 85 ? 'orange' : 'red'}}>
                    {property.revenueEfficiency}%
                  </td>
                  <td>
                    {property.vacantRooms > 0 && <div>🏠 {property.vacantRooms} vacant</div>}
                    {property.pendingApps > 0 && <div>📋 {property.pendingApps} pending apps</div>}
                    {property.maintenanceIssues > 0 && <div>🔧 {property.maintenanceIssues} maintenance</div>}
                    {property.expiringLeases > 0 && <div>📄 {property.expiringLeases} expiring leases</div>}
                    {!hasIssues && <div style={{color: 'green'}}>✅ All good</div>}
                  </td>
                  <td>
                    <Link href={`/properties/${property.id}/rooms`}>
                      <button>Manage Rooms</button>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section>
        <h2>📈 Revenue Performance Analysis</h2>
        <table border={1}>
          <thead>
            <tr>
              <th>Property</th>
              <th>Monthly Revenue</th>
              <th>Annual Projection</th>
              <th>Avg Rent/Room</th>
              <th>Revenue Lost</th>
              <th>Recovery Potential</th>
            </tr>
          </thead>
          <tbody>
            {propertiesWithAnalytics.map(property => (
              <tr key={property.id}>
                <td><strong>{property.name}</strong></td>
                <td style={{color: 'green'}}>${property.monthlyRevenue.toLocaleString()}</td>
                <td style={{color: 'green'}}>${property.annualRevenue.toLocaleString()}</td>
                <td>${property.averageRent}</td>
                <td style={{color: property.lostRevenue > 0 ? 'red' : 'green'}}>
                  {property.lostRevenue > 0 ? `-$${property.lostRevenue.toLocaleString()}` : '$0'}
                </td>
                <td>
                  {property.vacantRooms > 0 ? (
                    <span style={{color: 'orange'}}>
                      +${(property.lostRevenue * 12).toLocaleString()}/year
                    </span>
                  ) : (
                    <span style={{color: 'green'}}>Optimized ✅</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>💡 Revenue Optimization Recommendations</h2>
        <ul>
          <li><strong>Fill {totalVacantRooms} vacant rooms</strong> - Could add ${(totalLostRevenue * 12).toLocaleString()}/year to revenue</li>
          <li><strong>Focus on underperforming properties</strong> - {underperformingProperties.length} properties below 90% occupancy</li>
          <li><strong>Process pending applications faster</strong> - Each day of vacancy costs ${Math.round(totalLostRevenue / 30)}</li>
          <li><strong>Address maintenance issues</strong> - Happy tenants = better retention and referrals</li>
          <li><strong>Market rate analysis</strong> - Review rent prices quarterly to maximize revenue</li>
          <li><strong>Lease renewal strategy</strong> - Start conversations 60 days before expiry</li>
        </ul>
      </section>

      <section>
        <h2>⚙️ Property Management Actions</h2>
        <ul>
          <li><button onClick={() => console.log('Add new property')}>+ Add New Property</button></li>
          <li><button onClick={() => console.log('Bulk update rents')}>📈 Update Market Rents</button></li>
          <li><button onClick={() => console.log('Schedule inspections')}>🔍 Schedule Property Inspections</button></li>
          <li><button onClick={() => console.log('Marketing campaign')}>📢 Launch Marketing Campaign</button></li>
          <li><button onClick={() => console.log('Financial analysis')}>💰 Deep Financial Analysis</button></li>
        </ul>
      </section>
    </div>
  );
} 