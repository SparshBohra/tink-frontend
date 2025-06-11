import Navigation from '../components/Navigation';
import { mockInventory, mockProperties, mockRooms } from '../lib/mockData';

export default function Inventory() {
  const getPropertyName = (propertyId: number) => {
    const property = mockProperties.find(p => p.id === propertyId);
    return property ? property.name : 'Unknown Property';
  };

  const getRoomName = (roomId: number | null) => {
    if (!roomId) return 'Common Area';
    const room = mockRooms.find(r => r.id === roomId);
    return room ? room.name : 'Unknown Room';
  };

  const handleReportIssue = (itemId: number) => {
    console.log(`Report issue for inventory item ${itemId}`);
  };

  const handleMarkFixed = (itemId: number) => {
    console.log(`Mark item ${itemId} as fixed`);
  };

  const handleAddItem = () => {
    console.log('Add new inventory item');
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'good': return 'green';
      case 'fair': return 'orange';
      case 'poor': return 'red';
      default: return 'black';
    }
  };

  const needsAttention = mockInventory.filter(item => item.condition === 'poor' || item.reportedIssues > 0);
  const allItems = mockInventory;

  return (
    <div>
      <Navigation />
      <h1>Inventory</h1>
      
      <h2>Items Needing Attention ({needsAttention.length})</h2>
      <table border={1}>
        <thead>
          <tr>
            <th>Item</th>
            <th>Property</th>
            <th>Room</th>
            <th>Condition</th>
            <th>Issues</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {needsAttention.map(item => (
            <tr key={item.id} style={{backgroundColor: '#ffffcc'}}>
              <td><strong>{item.name}</strong></td>
              <td>{getPropertyName(item.propertyId)}</td>
              <td>{getRoomName(item.roomId)}</td>
              <td style={{color: getConditionColor(item.condition)}}>
                {item.condition.toUpperCase()}
              </td>
              <td>{item.reportedIssues} issues</td>
              <td>
                <button onClick={() => handleMarkFixed(item.id)}>
                  Mark Fixed
                </button>
                {' '}
                <button onClick={() => handleReportIssue(item.id)}>
                  Report Issue
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>All Inventory ({allItems.length} items)</h2>
      <table border={1}>
        <thead>
          <tr>
            <th>Item</th>
            <th>Property</th>
            <th>Room</th>
            <th>Condition</th>
            <th>Issues</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {allItems.map(item => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{getPropertyName(item.propertyId)}</td>
              <td>{getRoomName(item.roomId)}</td>
              <td style={{color: getConditionColor(item.condition)}}>
                {item.condition}
              </td>
              <td>{item.reportedIssues}</td>
              <td>
                <button onClick={() => handleReportIssue(item.id)}>
                  Report Issue
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Inventory Management</h2>
      <ul>
        <li><button onClick={handleAddItem}>+ Add New Item</button></li>
        <li><button onClick={() => console.log('Generate inventory report')}>Generate Report</button></li>
        <li><button onClick={() => console.log('Schedule maintenance')}>Schedule Maintenance</button></li>
        <li><button onClick={() => console.log('Send maintenance reminders')}>Send Maintenance Reminders</button></li>
      </ul>

      <h2>Summary</h2>
      <ul>
        <li>Total Items: {allItems.length}</li>
        <li>Good Condition: {allItems.filter(i => i.condition === 'good').length}</li>
        <li>Fair Condition: {allItems.filter(i => i.condition === 'fair').length}</li>
        <li>Poor Condition: {allItems.filter(i => i.condition === 'poor').length}</li>
        <li>Items with Issues: {allItems.filter(i => i.reportedIssues > 0).length}</li>
      </ul>
    </div>
  );
} 