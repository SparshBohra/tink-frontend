import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { apiClient } from '../../lib/api';
import { InventoryItem, Property, Room } from '../../lib/types';
import DashboardLayout from '../../components/DashboardLayout';

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

  const handleEditItem = (item: InventoryItem) => {
    router.push(`/inventory/edit/${item.id}`);
  };

  const handleDeleteItem = async (id: number) => {
    if (confirm('Are you sure you want to delete this inventory item?')) {
      try {
        await apiClient.deleteInventoryItem(id);
        fetchData(); // Refresh the list
      } catch (error: any) {
        setError(error.message || 'Failed to delete inventory item');
      }
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Inventory Management - Tink</title>
        </Head>
        <DashboardLayout title="">
          <div className="dashboard-container">
            {/* Custom Header */}
            <div className="dashboard-header">
              <div className="header-content">
                <div className="header-left">
                  <h1 className="dashboard-title">Property Inventory Management</h1>
                  <div className="subtitle-container">
                    <p className="welcome-message">
                      Loading inventory data...
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="loading-indicator">
              <div className="loading-spinner" />
              <p>Fetching inventory data from the server...</p>
            </div>
          </div>
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Inventory Management - Tink</title>
      </Head>
      <DashboardLayout title="">
        <div className="dashboard-container">
          {/* Custom Header */}
          <div className="dashboard-header">
            <div className="header-content">
              <div className="header-left">
                <h1 className="dashboard-title">Property Inventory Management</h1>
                <div className="subtitle-container">
                  <p className="welcome-message">
                    Track, maintain, and manage inventory across all properties
                  </p>
                </div>
              </div>
            </div>
          </div>

          {error && <div className="alert alert-error"><strong>Error:</strong> {error}</div>}
          
          {/* Quick Actions */}
          <div className="quick-actions-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Quick Actions</h2>
                <p className="section-subtitle">Manage your inventory efficiently</p>
              </div>
            </div>
            <div className="actions-container">
              <Link href="/inventory/add" className="btn btn-primary">
                Add Inventory
              </Link>
              <button className="btn btn-secondary" onClick={fetchData}>
                View Inventory
              </button>
              <button className="btn btn-secondary" onClick={downloadInventoryCSV}>
                Download CSV
              </button>
            </div>
          </div>
          
          {/* Filter Inventory */}
          <div className="filter-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Filter Inventory</h2>
                <p className="section-subtitle">Search and filter inventory items</p>
              </div>
              <div className="section-actions">
                <button className="btn btn-sm btn-secondary" onClick={clearFilters}>Clear Filters</button>
                <button className="btn btn-sm btn-primary" onClick={fetchData}>Refresh</button>
              </div>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Property</label>
                <select
                  value={selectedProperty || ''}
                  onChange={(e) => setSelectedProperty(e.target.value ? parseInt(e.target.value) : null)}
                  className="form-input"
                >
                  <option value="">All Properties</option>
                  {properties.map(property => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Room</label>
                <select
                  value={selectedRoom || ''}
                  onChange={(e) => setSelectedRoom(e.target.value ? parseInt(e.target.value) : null)}
                  className="form-input"
                >
                  <option value="">All Rooms</option>
                  {(selectedProperty ? rooms.filter(r => r.property_ref === selectedProperty) : rooms).map(room => (
                    <option key={room.id} value={room.id}>{room.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Condition</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-input"
                >
                  <option value="all">All Conditions</option>
                  <option value="new">New</option>
                  <option value="good">Good</option>
                  <option value="used">Used</option>
                  <option value="broken">Broken</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Search</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, property, etc."
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Complete Inventory */}
          <div className="inventory-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Complete Inventory ({filteredItems.length})</h2>
                <p className="section-subtitle">All inventory items across properties</p>
              </div>
            </div>
            {filteredItems.length === 0 ? (
              <div className="empty-state">
                <p>No inventory items found matching your filters. Try changing your filter criteria or add new items.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Property & Room</th>
                      <th>Condition</th>
                      <th>Quantity</th>
                      <th>Cost</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map(item => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.name}</strong>
                        </td>
                        <td>
                          <strong>{item.property_name || `Property ${item.property_ref}`}</strong>
                          <br />
                          <small>{item.room_name || 'Not assigned to a room'}</small>
                        </td>
                        <td>
                          <span className={`status-badge ${item.condition_status}`}>
                            {item.condition_status.toUpperCase()}
                          </span>
                        </td>
                        <td>{item.qty}</td>
                        <td>${item.cost || '0'}</td>
                        <td>
                          <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleEditItem(item)}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteItem(item.id)}
                            style={{ marginLeft: '8px' }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Bulk Purchase Planning */}
          {getMaintenanceItems().length > 0 && (
            <div className="bulk-purchase-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Bulk Purchase Planning</h2>
                  <p className="section-subtitle">Items commonly needed for co-living setups</p>
                </div>
              </div>
              <div className="table-container">
                <table className="data-table">
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
                      <td>Bedroom Essentials</td>
                      <td>Bed frame, mattress, desk, chair</td>
                      <td>$800-1,200</td>
                      <td><button className="btn btn-sm btn-primary">Browse Sets</button></td>
                    </tr>
                    <tr>
                      <td>Kitchen Basics</td>
                      <td>Table, chairs, appliances</td>
                      <td>$400-800</td>
                      <td><button className="btn btn-sm btn-primary">Browse Kitchen</button></td>
                    </tr>
                    <tr>
                      <td>Storage Solutions</td>
                      <td>Wardrobes, shelving, storage bins</td>
                      <td>$200-500</td>
                      <td><button className="btn btn-sm btn-primary">Browse Storage</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
      
      <style jsx>{`
        .dashboard-container {
          width: 100%;
          padding: 16px 20px 20px 20px;
          background: #f8fafc;
          min-height: calc(100vh - 72px);
          box-sizing: border-box;
        }

        /* Custom Header */
        .dashboard-header {
          margin-bottom: 24px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }

        .header-left {
          flex: 1;
        }

        .dashboard-title {
          font-size: 22px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
          line-height: 1.15;
        }

        .subtitle-container {
          min-height: 22px;
        }

        .welcome-message {
          font-size: 14px;
          color: #4b5563;
          margin: 0;
          line-height: 1.45;
        }

        /* Section Styling */
        .quick-actions-section,
        .filter-section,
        .inventory-section,
        .bulk-purchase-section {
          background: white;
          border-radius: 6px;
          padding: 18px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          margin-bottom: 20px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 3px 0;
        }

        .section-subtitle {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        .section-actions {
          display: flex;
          gap: 8px;
        }

        /* Actions Container */
        .actions-container {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        /* Form Styling */
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-top: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-input {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: all 0.2s ease;
          background: white;
        }

        .form-input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        /* Table Styling */
        .table-container {
          overflow-x: auto;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
        }

        .data-table th {
          background: #f8fafc;
          padding: 12px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #e2e8f0;
        }

        .data-table td {
          padding: 12px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
          color: #374151;
        }

        .data-table tr:hover {
          background: #f8fafc;
        }

        .data-table tr:last-child td {
          border-bottom: none;
        }

        /* Status Badge */
        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-badge.new {
          background: #dcfce7;
          color: #166534;
        }

        .status-badge.good {
          background: #dbeafe;
          color: #1e40af;
        }

        .status-badge.used {
          background: #fef3c7;
          color: #92400e;
        }

        .status-badge.broken {
          background: #fee2e2;
          color: #dc2626;
        }

        /* Button Styling */
        .btn {
          padding: 12px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          text-decoration: none;
          border: none;
        }

        .btn-primary {
          background: #6366f1;
          color: white;
        }

        .btn-primary:hover {
          background: #4f46e5;
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: #f8fafc;
          color: #1e293b;
          border: 1px solid #e2e8f0;
        }

        .btn-secondary:hover {
          background: #f1f5f9;
          transform: translateY(-1px);
        }

        .btn-danger {
          background: #dc2626;
          color: white;
        }

        .btn-danger:hover {
          background: #b91c1c;
          transform: translateY(-1px);
        }

        .btn-sm {
          padding: 8px 12px;
          font-size: 12px;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #6b7280;
          font-size: 14px;
        }

        /* Alert Styling */
        .alert {
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          font-size: 14px;
        }
        
        .alert-error {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
        }

        /* Loading Indicator */
        .loading-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          text-align: center;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 16px;
          }

          .header-content {
            flex-direction: column;
            gap: 16px;
          }

          .section-header {
            flex-direction: column;
            gap: 12px;
          }

          .section-actions {
            align-self: flex-start;
          }

          .form-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .actions-container {
            flex-direction: column;
          }

          .table-container {
            font-size: 12px;
          }

          .data-table th,
          .data-table td {
            padding: 8px;
          }
        }
      `}</style>
    </>
  );
}
 
 
 
 