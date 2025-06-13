import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { apiClient } from '../../lib/api';
import { InventoryItem, Property, Room } from '../../lib/types';
import Navigation from '../../components/Navigation';

export default function Inventory() {
  const router = useRouter();
  const { property: propertyIdParam, room: roomIdParam } = router.query;
  
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [maintenanceFilter, setMaintenanceFilter] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);
  
  useEffect(() => {
    // Apply property filter from URL if present
    if (propertyIdParam && !selectedProperty) {
      const propertyId = parseInt(propertyIdParam as string);
      if (!isNaN(propertyId)) {
        setSelectedProperty(propertyId);
      }
    }
  }, [propertyIdParam, selectedProperty]);
  
  useEffect(() => {
    // Apply room filter from URL if present
    if (roomIdParam && !selectedRoom) {
      const roomId = parseInt(roomIdParam as string);
      if (!isNaN(roomId)) {
        setSelectedRoom(roomId);
      }
    }
  }, [roomIdParam, selectedRoom]);
  
  useEffect(() => {
    // Apply all filters
    let filtered = [...inventoryItems];
    
    // Property filter
    if (selectedProperty) {
      filtered = filtered.filter(item => item.property_ref === selectedProperty);
    }
    
    // Room filter
    if (selectedRoom) {
      filtered = filtered.filter(item => item.room === selectedRoom);
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.condition_status === statusFilter);
    }
    
    // Maintenance filter
    if (maintenanceFilter !== null) {
      filtered = filtered.filter(item => item.needs_maintenance === maintenanceFilter);
    }
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) || 
        (item.property_name && item.property_name.toLowerCase().includes(query)) ||
        (item.room_name && item.room_name.toLowerCase().includes(query))
      );
    }
    
    setFilteredItems(filtered);
  }, [inventoryItems, selectedProperty, selectedRoom, statusFilter, maintenanceFilter, searchQuery]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [inventoryResponse, propertiesResponse, roomsResponse] = await Promise.all([
        apiClient.getInventory(),
        apiClient.getProperties(),
        apiClient.getRooms()
      ]);

      setInventoryItems(inventoryResponse.results || []);
      setProperties(propertiesResponse.results || []);
      setRooms(roomsResponse.results || []);
    } catch (error: any) {
      console.error('Failed to fetch inventory data:', error);
      setError(error?.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };
  
  const getPropertyName = (propertyId: number) => {
    const property = properties.find(p => p.id === propertyId);
    return property ? property.name : 'Unknown Property';
  };
  
  const downloadInventoryCSV = () => {
    const csvData = [
      ['Item Name', 'Property', 'Room', 'Quantity', 'Condition', 'Needs Maintenance', 'Last Checked', 'Purchase Date', 'Cost'],
      ...inventoryItems.map(item => [
        item.name,
        item.property_name || `Property ${item.property_ref}`,
        item.room_name || 'N/A',
        item.qty.toString(),
        item.condition_status,
        item.needs_maintenance ? 'Yes' : 'No',
        item.last_checked || 'N/A',
        item.purchase_date || 'N/A',
        item.cost ? `$${item.cost}` : 'N/A'
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };
  
  const downloadMaintenanceCSV = () => {
    const maintenanceItems = inventoryItems.filter(item => item.needs_maintenance);
    
    const csvData = [
      ['Item Name', 'Property', 'Room', 'Condition', 'Last Checked', 'Replacement Cost'],
      ...maintenanceItems.map(item => [
        item.name,
        item.property_name || `Property ${item.property_ref}`,
        item.room_name || 'N/A',
        item.condition_status,
        item.last_checked || 'N/A',
        item.cost ? `$${item.cost}` : 'N/A'
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maintenance-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };
  
  const clearFilters = () => {
    setSelectedProperty(null);
    setSelectedRoom(null);
    setStatusFilter('all');
    setMaintenanceFilter(null);
    setSearchQuery('');
    router.push('/inventory', undefined, { shallow: true });
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return '#28a745';
      case 'good': return '#17a2b8';
      case 'used': return '#ffc107';
      case 'broken': return '#dc3545';
      default: return '#6c757d';
    }
  };
  
  const getMaintenanceItems = () => {
    return filteredItems.filter(item => item.needs_maintenance);
  };

  if (loading) {
    return (
      <div>
        <Navigation />
        <h1>Loading Inventory...</h1>
        <p>Fetching inventory data from the server...</p>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1>📦 Property Inventory Management</h1>
        <p>Track, maintain, and manage inventory across all properties.</p>
      </div>
      
      {/* Error Messages */}
      {error && (
        <div style={{ 
          color: 'red', 
          border: '1px solid red', 
          padding: '15px', 
          marginBottom: '20px',
          backgroundColor: '#ffebee'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {/* Filters Section */}
      <div style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>🔍 Filter Inventory</h2>
          <div>
            <button
              onClick={clearFilters}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Clear Filters
            </button>
            <button
              onClick={fetchData}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Property
            </label>
            <select
              value={selectedProperty || ''}
              onChange={(e) => setSelectedProperty(e.target.value ? parseInt(e.target.value) : null)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            >
              <option value="">All Properties</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Room
            </label>
            <select
              value={selectedRoom || ''}
              onChange={(e) => setSelectedRoom(e.target.value ? parseInt(e.target.value) : null)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            >
              <option value="">All Rooms</option>
              {(selectedProperty ? rooms.filter(r => r.property_ref === selectedProperty) : rooms).map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Condition
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            >
              <option value="all">All Conditions</option>
              <option value="new">New</option>
              <option value="good">Good</option>
              <option value="used">Used</option>
              <option value="broken">Broken</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Maintenance Status
            </label>
            <select
              value={maintenanceFilter === null ? 'all' : maintenanceFilter ? 'needs' : 'not_needed'}
              onChange={(e) => {
                const value = e.target.value;
                setMaintenanceFilter(
                  value === 'all' ? null : value === 'needs'
                );
              }}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            >
              <option value="all">All Items</option>
              <option value="needs">Needs Maintenance</option>
              <option value="not_needed">No Maintenance Required</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, property, etc."
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={downloadInventoryCSV}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          📊 Download Full Inventory (CSV)
        </button>
        <button
          onClick={downloadMaintenanceCSV}
          style={{
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔧 Download Maintenance Report (CSV)
        </button>
        <Link href="/inventory/add">
          <button
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ➕ Add New Inventory Item
          </button>
        </Link>
      </div>
      
      {/* Filter Summary */}
      {(selectedProperty || selectedRoom || statusFilter !== 'all' || maintenanceFilter !== null || searchQuery) && (
        <div style={{
          backgroundColor: '#e8f5e8',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <strong>🔍 Active Filters:</strong> Showing {filteredItems.length} of {inventoryItems.length} items
          {selectedProperty && (
            <span> | Property: <strong>{getPropertyName(selectedProperty)}</strong></span>
          )}
          {selectedRoom && (
            <span> | Room: <strong>#{selectedRoom}</strong></span>
          )}
          {statusFilter !== 'all' && (
            <span> | Condition: <strong style={{ color: getStatusColor(statusFilter) }}>{statusFilter.toUpperCase()}</strong></span>
          )}
          {maintenanceFilter !== null && (
            <span> | Maintenance: <strong>{maintenanceFilter ? 'NEEDED' : 'NOT NEEDED'}</strong></span>
          )}
          {searchQuery && (
            <span> | Search: <strong>"{searchQuery}"</strong></span>
          )}
        </div>
      )}
      
      {/* Maintenance Needed Items */}
      {maintenanceFilter !== false && getMaintenanceItems().length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h2>🛠️ Items Needing Attention ({getMaintenanceItems().length})</h2>
          <p><em>Items in poor condition or with reported issues. Click Amazon links to order replacements.</em></p>
          
          <table border={1} style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Item</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Property & Room</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Condition</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Issues</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Cost</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getMaintenanceItems().map(item => (
                <tr key={item.id}>
                  <td style={{ padding: '10px' }}>
                    <strong>{item.name}</strong>
                    <br />
                    <small>Qty: {item.qty}</small>
                  </td>
                  <td style={{ padding: '10px' }}>
                    <strong>{item.property_name || `Property ${item.property_ref}`}</strong>
                    <br />
                    <small>{item.room_name || 'Not assigned to a room'}</small>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      backgroundColor: item.condition_status === 'broken' ? '#ffebee' : '#fff3cd',
                      color: item.condition_status === 'broken' ? '#b71c1c' : '#856404',
                      fontWeight: 'bold'
                    }}>
                      {item.condition_status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    {item.needs_maintenance ? <strong>1 issue reported</strong> : 'No issues'}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    ${item.cost || '0'}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' }}>
                      <a 
                        href={`https://www.amazon.com/s?k=${encodeURIComponent(item.name)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{
                          backgroundColor: '#ff9900',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          textDecoration: 'none',
                          display: 'inline-block',
                          textAlign: 'center'
                        }}
                      >
                        🛒 Order on Amazon
                      </a>
                      <button
                        onClick={() => alert('Mark fixed feature coming soon!')}
                        style={{
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✅ Mark Fixed
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Complete Inventory */}
      <div>
        <h2>📋 Complete Inventory ({filteredItems.length} items)</h2>
        
        {filteredItems.length > 0 ? (
          <table border={1} style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Item</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Property</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Room</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Condition</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Issues</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Purchase Date</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={item.id} style={{ 
                  backgroundColor: item.needs_maintenance ? '#fff3cd' : 'transparent'
                }}>
                  <td style={{ padding: '10px' }}>
                    <strong>{item.name}</strong>
                    <br />
                    <small>Qty: {item.qty}</small>
                  </td>
                  <td style={{ padding: '10px' }}>
                    {item.property_name || `Property ${item.property_ref}`}
                  </td>
                  <td style={{ padding: '10px' }}>
                    {item.room_name || 'Not assigned to a room'}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      backgroundColor: getStatusColor(item.condition_status),
                      color: 'white',
                      fontWeight: 'bold'
                    }}>
                      {item.condition_status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    {item.needs_maintenance ? (
                      <span style={{ color: '#dc3545' }}>⚠️ Needs attention</span>
                    ) : (
                      <span style={{ color: '#28a745' }}>✓ No issues</span>
                    )}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    {item.purchase_date || 'Not recorded'}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                      <button
                        onClick={() => alert('Edit item feature coming soon!')}
                        style={{
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✏️ Edit
                      </button>
                      {item.needs_maintenance && (
                        <a 
                          href={`https://www.amazon.com/s?k=${encodeURIComponent(item.name)}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            backgroundColor: '#ff9900',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            textDecoration: 'none',
                            display: 'inline-block'
                          }}
                        >
                          🛒 Replace
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            No inventory items found matching your filters. Try changing your filter criteria or add new items.
          </p>
        )}
      </div>
      
      {/* Bulk Purchase Planning */}
      <div style={{
        marginTop: '30px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '20px',
        backgroundColor: '#f0f7ff'
      }}>
        <h2>🛒 Bulk Purchase Planning</h2>
        <p>Items commonly needed for co-living setups:</p>
        
        <table border={1} style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>Category</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Common Items</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Estimated Cost</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Quick Buy</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '10px' }}>Bedroom Essentials</td>
              <td style={{ padding: '10px' }}>Bed frame, mattress, desk, chair</td>
              <td style={{ padding: '10px', textAlign: 'center' }}>$800-1,200</td>
              <td style={{ padding: '10px', textAlign: 'center' }}>
                <a 
                  href="https://www.amazon.com/s?k=bedroom+furniture+set" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    textDecoration: 'none',
                    display: 'inline-block'
                  }}
                >
                  🔍 Browse Sets
                </a>
              </td>
            </tr>
            <tr>
              <td style={{ padding: '10px' }}>Kitchen Basics</td>
              <td style={{ padding: '10px' }}>Table, chairs, appliances</td>
              <td style={{ padding: '10px', textAlign: 'center' }}>$400-800</td>
              <td style={{ padding: '10px', textAlign: 'center' }}>
                <a 
                  href="https://www.amazon.com/s?k=kitchen+furniture+essentials" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    textDecoration: 'none',
                    display: 'inline-block'
                  }}
                >
                  🔍 Browse Kitchen
                </a>
              </td>
            </tr>
            <tr>
              <td style={{ padding: '10px' }}>Storage Solutions</td>
              <td style={{ padding: '10px' }}>Wardrobes, shelving, storage bins</td>
              <td style={{ padding: '10px', textAlign: 'center' }}>$200-500</td>
              <td style={{ padding: '10px', textAlign: 'center' }}>
                <a 
                  href="https://www.amazon.com/s?k=storage+furniture" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    textDecoration: 'none',
                    display: 'inline-block'
                  }}
                >
                  🔍 Browse Storage
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
 
 
 
 