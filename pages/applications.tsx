import Navigation from '../components/Navigation';
import { mockApplications, mockProperties, mockRooms } from '../lib/mockData';

export default function Applications() {
  const getPropertyName = (propertyId: number) => {
    const property = mockProperties.find(p => p.id === propertyId);
    return property ? property.name : 'Unknown Property';
  };

  const getVacantRoomsForProperty = (propertyId: number) => {
    return mockRooms.filter(room => room.propertyId === propertyId && !room.occupied);
  };

  const handleQuickApprove = (applicationId: number, propertyId: number) => {
    const vacantRooms = getVacantRoomsForProperty(propertyId);
    if (vacantRooms.length > 0) {
      console.log(`Quick approve application ${applicationId} - assign to room ${vacantRooms[0].id}`);
    } else {
      console.log(`Cannot approve ${applicationId} - no vacant rooms in this property`);
    }
  };

  const handleViewDetails = (applicationId: number) => {
    console.log(`View full application details for ${applicationId}`);
  };

  const handleReject = (applicationId: number) => {
    console.log(`Reject application ${applicationId}`);
  };

  const pendingApplications = mockApplications.filter(app => app.status === 'pending');
  const reviewedApplications = mockApplications.filter(app => app.status !== 'pending');

  const downloadApplicationsReport = () => {
    const csvData = [
      ['Applicant Name', 'Email', 'Phone', 'Property', 'Status', 'Applied Date', 'Days Pending', 'Available Rooms', 'Priority'],
      ...mockApplications.map(app => {
        const availableRooms = getVacantRoomsForProperty(app.propertyId);
        const daysPending = Math.floor((new Date().getTime() - new Date(app.appliedDate).getTime()) / (1000 * 60 * 60 * 24));
        const priority = app.status === 'pending' && availableRooms.length > 0 ? 'HIGH' : 
                        app.status === 'pending' ? 'MEDIUM' : 'LOW';
        return [
          app.applicantName,
          app.email,
          app.phone,
          getPropertyName(app.propertyId),
          app.status.toUpperCase(),
          app.appliedDate,
          daysPending.toString(),
          availableRooms.length.toString(),
          priority
        ];
      })
    ];
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date().toISOString().split('T')[0];
    a.download = `tink-applications-report-${today}.csv`;
    a.click();
  };

  const downloadPendingAppsReport = () => {
    const csvData = [
      ['Applicant', 'Contact', 'Property', 'Days Waiting', 'Available Rooms', 'Recommended Action'],
      ...pendingApplications.map(app => {
        const availableRooms = getVacantRoomsForProperty(app.propertyId);
        const daysPending = Math.floor((new Date().getTime() - new Date(app.appliedDate).getTime()) / (1000 * 60 * 60 * 24));
        const action = availableRooms.length > 0 ? 'APPROVE & ASSIGN' : 'WAITLIST';
        return [
          app.applicantName,
          `${app.email} / ${app.phone}`,
          getPropertyName(app.propertyId),
          daysPending.toString(),
          availableRooms.length.toString(),
          action
        ];
      })
    ];
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date().toISOString().split('T')[0];
    a.download = `tink-pending-applications-${today}.csv`;
    a.click();
  };

  return (
    <div>
      <Navigation />
      <h1>Applications Review</h1>
      <p>Review and decide on rental applications. Approved tenants must be assigned to rooms and moved in.</p>
      
      <div style={{backgroundColor: '#e8f5e8', padding: '15px', borderRadius: '5px', marginBottom: '20px'}}>
        <strong>💡 Quick Tip:</strong> Green rows mean you can approve and assign rooms immediately. Each approval adds ~$1,200/month revenue.
      </div>

      <section>
        <h2>⏰ Pending Applications ({pendingApplications.length})</h2>
        <p><em>These applications are waiting for your decision. Quick decisions help fill vacant rooms faster.</em></p>
        
        <table border={1}>
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Contact</th>
              <th>Property Applied</th>
              <th>Vacant Rooms</th>
              <th>Applied Date</th>
              <th>Quick Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingApplications.map(application => {
              const vacantRooms = getVacantRoomsForProperty(application.propertyId);
              const canQuickApprove = vacantRooms.length > 0;
              
              return (
                <tr key={application.id} style={{backgroundColor: canQuickApprove ? '#e8f5e8' : '#fff3cd'}}>
                  <td>
                    <strong>{application.applicantName}</strong>
                    <br />
                    <small>Applied {application.appliedDate}</small>
                  </td>
                  <td>
                    {application.email}
                    <br />
                    <small>{application.phone}</small>
                  </td>
                  <td>
                    {getPropertyName(application.propertyId)}
                    <br />
                    <small>{canQuickApprove ? `${vacantRooms.length} rooms available` : 'No vacant rooms'}</small>
                  </td>
                  <td>
                    {canQuickApprove ? (
                      <span style={{color: 'green'}}>
                        ✅ {vacantRooms.length} available
                        <br />
                        <small>
                          {vacantRooms.slice(0, 2).map(room => room.name).join(', ')}
                          {vacantRooms.length > 2 && '...'}
                        </small>
                      </span>
                    ) : (
                      <span style={{color: 'red'}}>❌ None available</span>
                    )}
                  </td>
                  <td>{application.appliedDate}</td>
                  <td>
                    {canQuickApprove ? (
                      <>
                        <button 
                          onClick={() => handleQuickApprove(application.id, application.propertyId)}
                          style={{backgroundColor: '#28a745', color: 'white'}}
                        >
                          ✅ Quick Approve & Assign
                        </button>
                        <br />
                      </>
                    ) : (
                      <p style={{color: 'orange', fontSize: '12px'}}>⚠️ Wait for room or transfer</p>
                    )}
                    <button onClick={() => handleViewDetails(application.id)}>
                      📄 View Details
                    </button>
                    {' '}
                    <button 
                      onClick={() => handleReject(application.id)}
                      style={{backgroundColor: '#dc3545', color: 'white'}}
                    >
                      ❌ Reject
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {pendingApplications.length === 0 && (
          <p><em>🎉 No pending applications! All caught up.</em></p>
        )}
      </section>

      <section>
        <h2>📊 Quick Summary</h2>
        <div style={{display: 'flex', gap: '10px', marginBottom: '10px'}}>
          <button onClick={downloadApplicationsReport} style={{backgroundColor: '#28a745', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '3px'}}>
            📥 Download All Applications Report
          </button>
          <button onClick={downloadPendingAppsReport} style={{backgroundColor: '#17a2b8', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '3px'}}>
            📥 Download Pending Apps Report
          </button>
        </div>
        <table border={1}>
          <tr>
            <td><strong>Pending Applications</strong></td>
            <td>{pendingApplications.length}</td>
          </tr>
          <tr>
            <td><strong>Can Be Quick-Approved</strong></td>
            <td>
              {pendingApplications.filter(app => getVacantRoomsForProperty(app.propertyId).length > 0).length}
              <small> (have vacant rooms)</small>
            </td>
          </tr>
          <tr>
            <td><strong>Need Room Assignment</strong></td>
            <td>
              {pendingApplications.filter(app => getVacantRoomsForProperty(app.propertyId).length === 0).length}
              <small> (no vacant rooms)</small>
            </td>
          </tr>
          <tr>
            <td><strong>Approved This Month</strong></td>
            <td>{reviewedApplications.filter(app => app.status === 'approved').length}</td>
          </tr>
          <tr>
            <td><strong>Rejected This Month</strong></td>
            <td>{reviewedApplications.filter(app => app.status === 'rejected').length}</td>
          </tr>
        </table>
      </section>

      <section>
        <h2>✅ Recent Decisions</h2>
        <table border={1}>
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Property</th>
              <th>Decision</th>
              <th>Date Applied</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {reviewedApplications.map(application => (
              <tr key={application.id}>
                <td>{application.applicantName}</td>
                <td>{getPropertyName(application.propertyId)}</td>
                <td>
                  <span style={{color: application.status === 'approved' ? 'green' : 'red'}}>
                    {application.status === 'approved' ? '✅ APPROVED' : '❌ REJECTED'}
                  </span>
                </td>
                <td>{application.appliedDate}</td>
                <td>
                  {application.status === 'approved' ? (
                    <small style={{color: 'orange'}}>⏳ Needs room assignment</small>
                  ) : (
                    <small style={{color: 'gray'}}>Closed</small>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>🔗 Application Form (Share with Prospects)</h2>
        <p>Share this link with potential tenants to apply:</p>
        <div style={{backgroundColor: '#f8f9fa', padding: '10px', border: '1px solid #ccc'}}>
          <code>https://tink.app/apply</code>
          <button onClick={() => console.log('Copy application link')}>📋 Copy Link</button>
        </div>
        <p><em>The application form collects: contact info, employment, references, preferred move-in date.</em></p>
      </section>

      <section>
        <h2>💡 Application Management Tips</h2>
        <ul>
          <li><strong>Green rows</strong> = can be quick-approved (vacant rooms available)</li>
          <li><strong>Yellow rows</strong> = need room to become available first</li>
          <li><strong>Quick approval</strong> gets tenants into rooms faster, reducing vacancy</li>
          <li><strong>View details</strong> when you need more info before deciding</li>
          <li><strong>Fast decisions</strong> = better applicant experience = higher acceptance rate</li>
        </ul>
      </section>
    </div>
  );
} 