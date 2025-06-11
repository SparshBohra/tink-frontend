import Navigation from '../components/Navigation';
import { mockInventory, mockProperties, mockRooms } from '../lib/mockData';

// Enhanced mock inventory with purchase links
const enhancedMockInventory = mockInventory.map(item => ({
  ...item,
  amazonLink: getAmazonLink(item.name),
  estimatedCost: getEstimatedCost(item.name),
  lastMaintenance: getRandomDate(),
  warrantyExpiry: getRandomWarrantyDate()
}));

function getAmazonLink(itemName: string): string {
  const searchTerm = itemName.replace(/\s+/g, '+');
  return `https://www.amazon.com/s?k=${searchTerm}&ref=tink_property_mgmt`;
}

function getEstimatedCost(itemName: string): number {
  const costs: Record<string, number> = {
    'Bed Frame': 299,
    'Desk': 159,
    'Chair': 89,
    'Mattress': 499,
    'Wardrobe': 349,
    'Bunk Bed': 399,
    'Storage Unit': 129,
    'Washing Machine': 699,
    'Kitchen Table': 249
  };
  return costs[itemName] || 99;
}

function getRandomDate(): string {
  const start = new Date(2024, 0, 1);
  const end = new Date();
  const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return randomDate.toISOString().split('T')[0];
}

function getRandomWarrantyDate(): string {
  const start = new Date();
  const end = new Date(2026, 11, 31);
  const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return randomDate.toISOString().split('T')[0];
}

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

  const handleOrderReplacement = (item: { name: string; amazonLink: string }) => {
    console.log(`Opening Amazon to order replacement for ${item.name}`);
    window.open(item.amazonLink, '_blank');
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'good': return 'green';
      case 'fair': return 'orange';
      case 'poor': return 'red';
      default: return 'black';
    }
  };

  const downloadInventoryReport = () => {
    const csvData = [
      ['Item', 'Property', 'Room', 'Condition', 'Issues', 'Last Maintenance', 'Warranty Expiry', 'Estimated Cost', 'Amazon Link'],
      ...enhancedMockInventory.map(item => [
        item.name,
        getPropertyName(item.propertyId),
        getRoomName(item.roomId),
        item.condition,
        item.reportedIssues.toString(),
        item.lastMaintenance,
        item.warrantyExpiry,
        `$${item.estimatedCost}`,
        item.amazonLink
      ])
    ];
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date().toISOString().split('T')[0];
    a.download = `tink-inventory-report-${today}.csv`;
    a.click();
  };

  const downloadMaintenanceReport = () => {
    const maintenanceItems = enhancedMockInventory.filter(item => 
      item.condition === 'poor' || item.reportedIssues > 0
    );
    
    const csvData = [
      ['Item', 'Property', 'Room', 'Issue Type', 'Priority', 'Estimated Cost', 'Action Required'],
      ...maintenanceItems.map(item => [
        item.name,
        getPropertyName(item.propertyId),
        getRoomName(item.roomId),
        item.condition === 'poor' ? 'Poor Condition' : 'Reported Issues',
        item.condition === 'poor' ? 'High' : 'Medium',
        `$${item.estimatedCost}`,
        item.condition === 'poor' ? 'Replace' : 'Repair'
      ])
    ];
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date().toISOString().split('T')[0];
    a.download = `tink-maintenance-report-${today}.csv`;
    a.click();
  };

  const needsAttention = enhancedMockInventory.filter(item => item.condition === 'poor' || item.reportedIssues > 0);
  const allItems = enhancedMockInventory;
  const totalReplacementCost = needsAttention.reduce((sum, item) => sum + item.estimatedCost, 0);

  return (
    <div>
      <Navigation />
      <h1>Inventory Management</h1>
      <p>Track assets, schedule maintenance, and order replacements. Click Amazon links to purchase items directly.</p>
      
      <div style={{backgroundColor: '#fff3cd', padding: '15px', borderRadius: '5px', marginBottom: '20px'}}>
        <strong>💡 Quick Tip:</strong> Click Amazon links for instant ordering. Red items need immediate replacement.
      </div>
      
      <section>
        <h2>📊 Inventory Summary & Reports</h2>
        <table border={1}>
          <tr>
            <td><strong>Total Items</strong></td>
            <td>{allItems.length}</td>
          </tr>
          <tr>
            <td><strong>Items Needing Attention</strong></td>
            <td style={{color: needsAttention.length > 0 ? 'red' : 'green'}}>{needsAttention.length}</td>
          </tr>
          <tr>
            <td><strong>Estimated Replacement Cost</strong></td>
            <td style={{color: 'red'}}>${totalReplacementCost.toLocaleString()}</td>
          </tr>
          <tr>
            <td><strong>Good Condition</strong></td>
            <td style={{color: 'green'}}>{allItems.filter(i => i.condition === 'good').length}</td>
          </tr>
          <tr>
            <td><strong>Poor Condition (Replace)</strong></td>
            <td style={{color: 'red'}}>{allItems.filter(i => i.condition === 'poor').length}</td>
          </tr>
        </table>
        
        <div style={{margin: '10px 0'}}>
          <button onClick={downloadInventoryReport} style={{backgroundColor: '#28a745', color: 'white', margin: '5px'}}>
            📊 Download Full Inventory (CSV)
          </button>
          <button onClick={downloadMaintenanceReport} style={{backgroundColor: '#dc3545', color: 'white', margin: '5px'}}>
            🔧 Download Maintenance Report (CSV)
          </button>
        </div>
      </section>

      <section>
        <h2>🚨 Items Needing Attention ({needsAttention.length})</h2>
        <p><em>Items in poor condition or with reported issues. Click Amazon links to order replacements.</em></p>
        <table border={1}>
          <thead>
            <tr>
              <th>Item</th>
              <th>Property & Room</th>
              <th>Condition</th>
              <th>Issues</th>
              <th>Replacement Cost</th>
              <th>Quick Purchase</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {needsAttention.map(item => (
              <tr key={item.id} style={{backgroundColor: '#ffffcc'}}>
                <td><strong>{item.name}</strong></td>
                <td>
                  {getPropertyName(item.propertyId)}
                  <br />
                  <small>{getRoomName(item.roomId)}</small>
                </td>
                <td style={{color: getConditionColor(item.condition)}}>
                  {item.condition.toUpperCase()}
                </td>
                <td>{item.reportedIssues} issues reported</td>
                <td style={{color: 'red'}}>${item.estimatedCost}</td>
                <td>
                  <button 
                    onClick={() => handleOrderReplacement(item)}
                    style={{backgroundColor: '#ff9500', color: 'white'}}
                  >
                    🛒 Order on Amazon
                  </button>
                </td>
                <td>
                  <button onClick={() => handleMarkFixed(item.id)}>
                    ✅ Mark Fixed
                  </button>
                  <br />
                  <button onClick={() => handleReportIssue(item.id)}>
                    ⚠️ Report Issue
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>📋 Complete Inventory ({allItems.length} items)</h2>
        <table border={1}>
          <thead>
            <tr>
              <th>Item</th>
              <th>Property</th>
              <th>Room</th>
              <th>Condition</th>
              <th>Issues</th>
              <th>Warranty</th>
              <th>Est. Cost</th>
              <th>Purchase Link</th>
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
                  <small>Until {item.warrantyExpiry}</small>
                </td>
                <td>${item.estimatedCost}</td>
                <td>
                  <a href={item.amazonLink} target="_blank" rel="noopener noreferrer">
                    🛒 Amazon
                  </a>
                </td>
                <td>
                  <button onClick={() => handleReportIssue(item.id)}>
                    Report Issue
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>🛒 Bulk Purchase Planning</h2>
        <p>Items commonly needed for co-living setups:</p>
        <table border={1}>
          <thead>
            <tr>
              <th>Category</th>
              <th>Common Items</th>
              <th>Estimated Cost</th>
              <th>Quick Buy</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Bedroom Essentials</strong></td>
              <td>Bed frame, mattress, desk, chair</td>
              <td>$800-1,200</td>
              <td>
                <a href="https://www.amazon.com/s?k=bedroom+furniture+set&ref=tink_bulk" target="_blank" rel="noopener noreferrer">
                  🛒 Browse Sets
                </a>
              </td>
            </tr>
            <tr>
              <td><strong>Kitchen Basics</strong></td>
              <td>Table, chairs, appliances</td>
              <td>$400-800</td>
              <td>
                <a href="https://www.amazon.com/s?k=kitchen+essentials+apartment&ref=tink_bulk" target="_blank" rel="noopener noreferrer">
                  🛒 Browse Kitchen
                </a>
              </td>
            </tr>
            <tr>
              <td><strong>Storage Solutions</strong></td>
              <td>Wardrobes, shelving, storage bins</td>
              <td>$200-500</td>
              <td>
                <a href="https://www.amazon.com/s?k=apartment+storage+solutions&ref=tink_bulk" target="_blank" rel="noopener noreferrer">
                  🛒 Browse Storage
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>⚙️ Inventory Management</h2>
        <ul>
          <li><button onClick={handleAddItem}>+ Add New Item</button></li>
          <li><button onClick={() => console.log('Schedule maintenance')}>📅 Schedule Maintenance</button></li>
          <li><button onClick={() => console.log('Send maintenance reminders')}>📱 Send Maintenance Reminders</button></li>
          <li><button onClick={() => console.log('Generate purchase order')}>📝 Generate Purchase Order</button></li>
        </ul>
      </section>

      <section>
        <h2>💡 Inventory Management Tips</h2>
        <ul>
          <li><strong>Amazon links</strong> make replacement ordering quick and easy</li>
          <li><strong>Track warranty dates</strong> to avoid unnecessary purchases</li>
          <li><strong>Bulk purchase planning</strong> can save 15-30% on furniture costs</li>
          <li><strong>Regular maintenance</strong> extends item lifespan by 2-3x</li>
          <li><strong>Download reports</strong> for tax deductions and insurance claims</li>
        </ul>
      </section>
    </div>
  );
} 