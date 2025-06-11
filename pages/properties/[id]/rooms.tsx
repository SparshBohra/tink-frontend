import { useRouter } from 'next/router';
import Navigation from '../../../components/Navigation';
import { mockProperties, mockRooms, mockTenants, mockApplications } from '../../../lib/mockData';

export default function PropertyRooms() {
  const router = useRouter();
  const { id } = router.query;
  const propertyId = parseInt(id as string);

  const property = mockProperties.find(p => p.id === propertyId);
  const propertyRooms = mockRooms.filter(room => room.propertyId === propertyId);
  const pendingAppsForProperty = mockApplications.filter(app => 
    app.propertyId === propertyId && app.status === 'pending'
  );

  const getTenantName = (tenantId: number | null) => {
    if (!tenantId) return null;
    const tenant = mockTenants.find(t => t.id === tenantId);
    return tenant ? tenant : null;
  };

  const handleAssignTenant = (roomId: number) => {
    console.log(`Assign tenant to room ${roomId} - show pending applications for this property`);
  };

  const handleMoveOut = (roomId: number) => {
    console.log(`Process move-out for room ${roomId}`);
  };

  const handleQuickAssign = (roomId: number, applicationId: number) => {
    console.log(`Quick assign application ${applicationId} to room ${roomId}`);
  };

  if (!property) {
    return (
      <div>
        <Navigation />
        <h1>Property not found</h1>
      </div>
    );
  }

  const vacantRooms = propertyRooms.filter(room => !room.occupied);
  const occupiedRooms = propertyRooms.filter(room => room.occupied);
  const currentRevenue = occupiedRooms.reduce((sum, room) => sum + room.rent, 0);
  const potentialRevenue = propertyRooms.reduce((sum, room) => sum + room.rent, 0);

  return (
    <div>
      <Navigation />
      <h1>Rooms at {property.name}</h1>
      <p>{property.address}</p>
      
      <section>
        <h2>🏠 Property Overview</h2>
        <table border={1}>
          <tr>
            <td><strong>Property Type</strong></td>
            <td>{property.type}</td>
          </tr>
          <tr>
            <td><strong>Total Rooms</strong></td>
            <td>{propertyRooms.length}</td>
          </tr>
          <tr>
            <td><strong>Occupied</strong></td>
            <td>{occupiedRooms.length} ({Math.round((occupiedRooms.length / propertyRooms.length) * 100)}%)</td>
          </tr>
          <tr>
            <td><strong>Vacant</strong></td>
            <td style={{color: vacantRooms.length > 0 ? 'red' : 'green'}}>
              {vacantRooms.length} {vacantRooms.length > 0 && '⚠️'}
            </td>
          </tr>
          <tr>
            <td><strong>Monthly Revenue</strong></td>
            <td>${currentRevenue.toLocaleString()} of ${potentialRevenue.toLocaleString()} potential</td>
          </tr>
          <tr style={{backgroundColor: vacantRooms.length > 0 ? '#ffebee' : '#e8f5e8'}}>
            <td><strong>Lost Revenue</strong></td>
            <td style={{color: vacantRooms.length > 0 ? 'red' : 'green'}}>
              ${(potentialRevenue - currentRevenue).toLocaleString()}/month
            </td>
          </tr>
        </table>
      </section>

      {pendingAppsForProperty.length > 0 && (
        <section>
          <h2>🎯 Quick Assignment: Pending Applications</h2>
          <p><em>You have {pendingAppsForProperty.length} applications for this property. Assign them to vacant rooms:</em></p>
          <table border={1}>
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Applied Date</th>
                <th>Quick Assign to Vacant Room</th>
              </tr>
            </thead>
            <tbody>
              {pendingAppsForProperty.map(app => (
                <tr key={app.id} style={{backgroundColor: '#fff3cd'}}>
                  <td>
                    <strong>{app.applicantName}</strong>
                    <br />
                    <small>{app.email}</small>
                  </td>
                  <td>{app.appliedDate}</td>
                  <td>
                    {vacantRooms.length > 0 ? (
                      <select onChange={(e) => {
                        if (e.target.value) {
                          handleQuickAssign(parseInt(e.target.value), app.id);
                        }
                      }}>
                        <option value="">Choose room...</option>
                        {vacantRooms.map(room => (
                          <option key={room.id} value={room.id}>
                            {room.name} - ${room.rent}/month
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span style={{color: 'red'}}>No vacant rooms</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section>
        <h2>🏠 Room Details</h2>
        <table border={1}>
          <thead>
            <tr>
              <th>Room</th>
              <th>Monthly Rent</th>
              <th>Status</th>
              <th>Current Tenant</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {propertyRooms.map(room => {
              const tenant = getTenantName(room.tenantId);
              const isVacant = !room.occupied;
              
              return (
                <tr key={room.id} style={{backgroundColor: isVacant ? '#fff3cd' : '#e8f5e8'}}>
                  <td>
                    <strong>{room.name}</strong>
                    {isVacant && <br />}<small style={{color: 'red'}}>{isVacant && '⚠️ VACANT'}</small>
                  </td>
                  <td>${room.rent}/month</td>
                  <td>
                    {room.occupied ? (
                      <span style={{color: 'green'}}>✅ Occupied</span>
                    ) : (
                      <span style={{color: 'red'}}>❌ Vacant (-${room.rent}/mo)</span>
                    )}
                  </td>
                  <td>
                    {tenant ? (
                      <div>
                        <strong>{tenant.name}</strong>
                        <br />
                        <small>{tenant.phone}</small>
                      </div>
                    ) : (
                      <span style={{color: 'orange'}}>No tenant assigned</span>
                    )}
                  </td>
                  <td>
                    {room.occupied ? (
                      <button onClick={() => handleMoveOut(room.id)}>
                        📦 Move Out
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleAssignTenant(room.id)}
                          style={{backgroundColor: '#28a745', color: 'white'}}
                        >
                          👤 Assign Tenant
                        </button>
                        {pendingAppsForProperty.length > 0 && (
                          <>
                            <br />
                            <small style={{color: 'green'}}>
                              {pendingAppsForProperty.length} pending apps available
                            </small>
                          </>
                        )}
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
        <h2>📊 Room Performance</h2>
        <table border={1}>
          <tr>
            <td><strong>Highest Rent Room</strong></td>
            <td>
              {propertyRooms.reduce((max, room) => room.rent > max.rent ? room : max, propertyRooms[0]).name}
              (${Math.max(...propertyRooms.map(r => r.rent))}/month)
            </td>
          </tr>
          <tr>
            <td><strong>Lowest Rent Room</strong></td>
            <td>
              {propertyRooms.reduce((min, room) => room.rent < min.rent ? room : min, propertyRooms[0]).name}
              (${Math.min(...propertyRooms.map(r => r.rent))}/month)
            </td>
          </tr>
          <tr>
            <td><strong>Average Rent</strong></td>
            <td>${Math.round(propertyRooms.reduce((sum, r) => sum + r.rent, 0) / propertyRooms.length)}/month</td>
          </tr>
          <tr>
            <td><strong>If 100% Occupied</strong></td>
            <td>${potentialRevenue.toLocaleString()}/month revenue</td>
          </tr>
        </table>
      </section>

      <section>
        <h2>💡 Room Management Tips</h2>
        <ul>
          <li><strong>Yellow rows</strong> = vacant rooms losing money every day</li>
          <li><strong>Green rows</strong> = occupied and generating revenue</li>
          <li><strong>Quick assign</strong> pending applications to fill rooms faster</li>
          <li><strong>Each vacant room</strong> at this property costs ${vacantRooms.length > 0 ? vacantRooms[0].rent : 0}+ per month</li>
          <li><strong>Priority:</strong> Fill the highest-rent vacant rooms first</li>
        </ul>
      </section>
    </div>
  );
} 