import Navigation from '../components/Navigation';
import Link from 'next/link';
import { mockProperties, mockRooms, mockInventory } from '../lib/mockData';

export default function Properties() {
  const getPropertyMetrics = (propertyId: number) => {
    const propertyRooms = mockRooms.filter(room => room.propertyId === propertyId);
    const occupiedRooms = propertyRooms.filter(room => room.occupied);
    const monthlyRevenue = occupiedRooms.reduce((sum, room) => sum + room.rent, 0);
    const potentialRevenue = propertyRooms.reduce((sum, room) => sum + room.rent, 0);
    const maintenanceIssues = mockInventory.filter(item => 
      item.propertyId === propertyId && (item.condition === 'poor' || item.reportedIssues > 0)
    ).length;
    
    return {
      occupiedRooms: occupiedRooms.length,
      totalRooms: propertyRooms.length,
      monthlyRevenue,
      potentialRevenue,
      lostRevenue: potentialRevenue - monthlyRevenue,
      occupancyRate: Math.round((occupiedRooms.length / propertyRooms.length) * 100),
      maintenanceIssues
    };
  };

  return (
    <div>
      <Navigation />
      <h1>Properties Overview</h1>
      <p>Manage your co-living portfolio. Focus on filling vacant rooms and addressing maintenance issues.</p>
      
      <section>
        <h2>+ Add New Property</h2>
        <button onClick={() => console.log('Add new property')}>
          + Add Property
        </button>
        <p><em>Expand your portfolio by adding new co-living spaces</em></p>
      </section>

      <section>
        <h2>Your Properties</h2>
        <table border={1}>
          <thead>
            <tr>
              <th>Property</th>
              <th>Type & Address</th>
              <th>Occupancy</th>
              <th>Monthly Revenue</th>
              <th>Lost Revenue</th>
              <th>Issues</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockProperties.map(property => {
              const metrics = getPropertyMetrics(property.id);
              const hasProblems = metrics.occupancyRate < 100 || metrics.maintenanceIssues > 0;
              
              return (
                <tr key={property.id} style={{backgroundColor: hasProblems ? '#fff3cd' : '#d4edda'}}>
                  <td>
                    <strong>{property.name}</strong>
                    <br />
                    <small>{metrics.occupancyRate}% occupied</small>
                  </td>
                  <td>
                    {property.type}
                    <br />
                    <small>{property.address}</small>
                  </td>
                  <td>
                    {metrics.occupiedRooms}/{metrics.totalRooms} rooms
                    <br />
                    <small>{metrics.occupancyRate}%</small>
                  </td>
                  <td>
                    <strong>${metrics.monthlyRevenue.toLocaleString()}</strong>
                    <br />
                    <small>of ${metrics.potentialRevenue.toLocaleString()} potential</small>
                  </td>
                  <td>
                    {metrics.lostRevenue > 0 ? (
                      <span style={{color: 'red'}}>
                        -${metrics.lostRevenue.toLocaleString()}/mo
                      </span>
                    ) : (
                      <span style={{color: 'green'}}>$0</span>
                    )}
                  </td>
                  <td>
                    {metrics.maintenanceIssues > 0 ? (
                      <span style={{color: 'red'}}>
                        {metrics.maintenanceIssues} maintenance issues
                      </span>
                    ) : (
                      <span style={{color: 'green'}}>No issues</span>
                    )}
                  </td>
                  <td>
                    <Link href={`/properties/${property.id}/rooms`}>
                      <button>View Rooms</button>
                    </Link>
                    {metrics.lostRevenue > 0 && (
                      <>
                        <br />
                        <small style={{color: 'red'}}>⚠️ Fill vacant rooms!</small>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Portfolio Summary</h2>
        <table border={1}>
          <tr>
            <td><strong>Total Properties</strong></td>
            <td>{mockProperties.length}</td>
          </tr>
          <tr>
            <td><strong>Total Rooms</strong></td>
            <td>{mockRooms.length}</td>
          </tr>
          <tr>
            <td><strong>Occupied Rooms</strong></td>
            <td>{mockRooms.filter(r => r.occupied).length}</td>
          </tr>
          <tr>
            <td><strong>Current Monthly Revenue</strong></td>
            <td>${mockRooms.filter(r => r.occupied).reduce((sum, r) => sum + r.rent, 0).toLocaleString()}</td>
          </tr>
          <tr>
            <td><strong>Potential Monthly Revenue</strong></td>
            <td>${mockRooms.reduce((sum, r) => sum + r.rent, 0).toLocaleString()}</td>
          </tr>
          <tr style={{backgroundColor: '#ffebee'}}>
            <td><strong>Lost Revenue (Vacant Rooms)</strong></td>
            <td style={{color: 'red'}}>
              ${(mockRooms.reduce((sum, r) => sum + r.rent, 0) - mockRooms.filter(r => r.occupied).reduce((sum, r) => sum + r.rent, 0)).toLocaleString()}/month
            </td>
          </tr>
        </table>
      </section>

      <section>
        <h2>💡 Property Management Tips</h2>
        <ul>
          <li><strong>Red/Yellow rows</strong> need attention - vacant rooms or maintenance issues</li>
          <li><strong>Green rows</strong> are performing well - fully occupied with no issues</li>
          <li><strong>Each vacant room</strong> typically costs $1,000-1,500/month in lost revenue</li>
          <li><strong>Maintenance issues</strong> can lead to tenant complaints and turnover</li>
        </ul>
      </section>
    </div>
  );
} 