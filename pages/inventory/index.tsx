import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { apiClient } from '../../lib/api';
import { InventoryItem, Property, Room } from '../../lib/types';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth, withAuth } from '../../lib/auth-context';

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

  const getTotalValue = () => {
    return inventoryItems.reduce((total, item) => total + (item.cost ? Number(item.cost) : 0), 0);
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
          <title>Inventory - Tink</title>
        </Head>
        <DashboardLayout title="">
          <div className="dashboard-container">
            <div className="dashboard-header">
              <div className="header-content">
                <div className="header-left">
                  <h1 className="dashboard-title">Inventory</h1>
                  <div className="subtitle-container">
                    <p className="welcome-message">
                      Loading inventory data...
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <LoadingSpinner message="Loading inventory data..." />
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
                <h1 className="dashboard-title">Property Inventory</h1>
                <div className="subtitle-container">
                  <p className="welcome-message">
                    Track, maintain, and manage inventory across all properties
                  </p>
                </div>
              </div>
            </div>
          </div>

        {error && <div className="alert alert-error"><strong>Error:</strong> {error}</div>}
        
          <div className="main-content-grid">
            <div className="left-column">
              {/* Top Metrics Row */}
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-header">
                    <div className="metric-info">
                      <h3 className="metric-title">Total Items</h3>
                      <div className="metric-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                          <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                          <line x1="12" y1="22.08" x2="12" y2="12"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="metric-content">
                    <div className="metric-value">{inventoryItems.length}</div>
                    <div className="metric-subtitle">Total items tracked</div>
                    <div className="metric-progress">
                      <span className="metric-label">All properties</span>
                      <span className="metric-change positive">+{inventoryItems.length > 0 ? '1' : '0'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-header">
                    <div className="metric-info">
                      <h3 className="metric-title">Maintenance</h3>
                      <div className="metric-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="metric-content">
                    <div className="metric-value">{getMaintenanceItems().length}</div>
                    <div className="metric-subtitle">Items needing maintenance</div>
                    <div className="metric-progress">
                      <span className="metric-label">Needs review</span>
                      <span className="metric-change positive">+{getMaintenanceItems().length > 0 ? '1' : '0'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-header">
                    <div className="metric-info">
                      <h3 className="metric-title">Total Value</h3>
                      <div className="metric-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="1" x2="12" y2="23"/>
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="metric-content">
                    <div className="metric-value">${getTotalValue().toFixed(2)}</div>
                    <div className="metric-subtitle">Estimated total cost</div>
                    <div className="metric-progress">
                      <span className="metric-label">All items</span>
                      <span className="metric-change positive">+1</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inventory List Section */}
              <div className="inventory-section">
                <div className="section-header">
                  <div>
                    <h2 className="section-title">Inventory List ({filteredItems.length})</h2>
                    <p className="section-subtitle">All inventory items across properties</p>
                  </div>
                  <div className="section-actions">
                    <button onClick={fetchData} className="refresh-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23 4 23 10 17 10"/>
                        <polyline points="1 20 1 14 7 14"/>
                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                      </svg>
                      Refresh
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="filters-container">
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
                    
                    <div className="form-group">
                      <button className="btn btn-secondary" onClick={clearFilters} style={{ alignSelf: 'flex-end' }}>Clear Filters</button>
                    </div>
                  </div>
                </div>

                {filteredItems.length === 0 ? (
                  <div className="empty-state">
                    <h3>No Inventory Found</h3>
                    <p>No inventory items found matching your filters. Try changing your filter criteria or add new items.</p>
                  </div>
                ) : (
                  <div className="applications-table-container">
                    <table className="applications-table">
                      <thead>
                        <tr>
                          <th className="table-left">Item</th>
                          <th className="table-left">Property & Room</th>
                          <th className="table-center">Condition</th>
                          <th className="table-center">Quantity</th>
                          <th className="table-center">Cost</th>
                          <th className="table-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredItems.map(item => (
                          <tr key={item.id}>
                            <td className="table-left">
                              <div className="applicant-name">{item.name}</div>
                            </td>
                            <td className="table-left">
                              <div className="property-name">{item.property_name || `Property ${item.property_ref}`}</div>
                              <div className="property-vacancy">{item.room_name || 'Not assigned to a room'}</div>
                            </td>
                            <td className="table-center">
                              <span className={`status-badge ${item.condition_status}`}>
                                {item.condition_status}
                              </span>
                            </td>
                            <td className="table-center">{item.qty}</td>
                            <td className="table-center">${item.cost || '0'}</td>
                            <td className="table-center">
                              <div className="action-buttons">
                                <button 
                                  className="manage-btn view-btn"
                                  onClick={() => handleEditItem(item)}
                                >
                                  Edit
                                </button>
                                <button 
                                  className="manage-btn reject-btn"
                                  onClick={() => handleDeleteItem(item.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="right-column">
              {/* Quick Actions */}
              <div className="quick-actions-section">
                <div className="section-header">
                  <div>
                    <h2 className="section-title">Quick Actions</h2>
                    <p className="section-subtitle">Manage your inventory efficiently</p>
                  </div>
                </div>
                <div className="actions-grid">
                  <div className="action-card blue" onClick={() => router.push('/inventory/add')}>
                    <div className="action-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </div>
                    <div className="action-content">
                      <h3 className="action-title">Add Inventory</h3>
                      <p className="action-subtitle">Add a new item to the inventory</p>
                    </div>
                  </div>
                  
                  <div className="action-card green" onClick={downloadInventoryCSV}>
                    <div className="action-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </div>
                    <div className="action-content">
                      <h3 className="action-title">Download Report</h3>
                      <p className="action-subtitle">Export full inventory as CSV</p>
                    </div>
                  </div>

                  <div className="action-card purple" onClick={downloadMaintenanceCSV}>
                    <div className="action-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                    </div>
                    <div className="action-content">
                      <h3 className="action-title">Maintenance Report</h3>
                      <p className="action-subtitle">Export items needing maintenance</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bulk Purchase Planning */}
              <div className="bulk-purchase-section">
                <div className="section-header">
                  <div>
                    <h2 className="section-title">Bulk Purchase Planning</h2>
                    <p className="section-subtitle">Items commonly needed for co-living</p>
                  </div>
                </div>
                <div className="applications-table-container">
                  <table className="applications-table">
                    <thead>
                      <tr>
                        <th className="table-left">Category</th>
                        <th className="table-left">Common Items</th>
                        <th className="table-center">Estimated Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="table-left">Bedroom Essentials</td>
                        <td className="table-left">Bed frame, mattress, desk, chair</td>
                        <td className="table-center">$800-1,200</td>
                      </tr>
                      <tr>
                        <td className="table-left">Kitchen Basics</td>
                        <td className="table-left">Table, chairs, appliances</td>
                        <td className="table-center">$400-800</td>
                      </tr>
                      <tr>
                        <td className="table-left">Storage Solutions</td>
                        <td className="table-left">Wardrobes, shelving, storage bins</td>
                        <td className="table-center">$200-500</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
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
        
        /* Main Layout Grid */
        .main-content-grid {
          display: grid;
          grid-template-columns: 2.5fr 1fr;
          gap: 24px;
          align-items: flex-start;
        }

        .left-column, .right-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Metrics Grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .metric-card {
          background: white;
          border-radius: 6px;
          padding: 14px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .metric-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .metric-title {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          margin: 0;
        }

        .metric-icon {
          width: 20px;
          height: 20px;
          color: #64748b;
        }

        .metric-content {
          margin-top: 8px;
        }

        .metric-value {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 3px;
          line-height: 1;
        }

        .metric-subtitle {
          font-size: 11px;
          color: #64748b;
          margin-bottom: 10px;
        }

        .metric-progress {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .metric-label {
          font-size: 12px;
          color: #64748b;
        }

        .metric-change {
          font-size: 12px;
          font-weight: 600;
        }

        .metric-change.positive {
          color: #10b981;
        }

        /* Section Styling */
        .inventory-section,
        .quick-actions-section,
        .bulk-purchase-section {
          background: white;
          border-radius: 6px;
          padding: 18px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          height: fit-content;
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
          gap: 12px;
          align-items: center;
        }

        /* Refresh Button */
        .refresh-btn {
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
          padding: 10px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .refresh-btn:hover {
          background: #e2e8f0;
          transform: translateY(-1px);
        }

        /* Filters */
        .filters-container {
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f1f5f9;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
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
        .applications-table-container {
          overflow-x: auto;
        }

        .applications-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .applications-table tbody tr {
          transition: background-color 0.2s ease;
        }

        .applications-table tbody tr:hover {
          background-color: #f9fafb;
        }

        .applications-table th {
          position: sticky;
          top: 0;
          background: #ffffff;
          z-index: 2;
          font-size: 12px;
          font-weight: 600;
          color: #9ca3af;
          padding: 12px 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #e5e7eb;
          text-align: left;
        }

        .applications-table td {
          padding: 12px 16px;
          vertical-align: middle;
          height: 48px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
          color: #374151;
        }

        .applications-table th.table-center,
        .applications-table td.table-center {
          text-align: center !important;
        }

        .applications-table th.table-left,
        .applications-table td.table-left {
          text-align: left !important;
        }

        .applicant-name {
          color: #1e293b;
          margin-bottom: 4px;
        }

        .property-name {
          color: #1e293b;
          margin-bottom: 4px;
        }

        .property-vacancy {
          font-size: 12px;
          color: #64748b;
        }

        .action-buttons {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .manage-btn {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 5px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .manage-btn:hover {
          background: #3730a3;
          transform: translateY(-1px);
        }

        .manage-btn.view-btn {
          background: #4f46e5;
        }

        .manage-btn.view-btn:hover {
          background: #3730a3;
        }

        .manage-btn.reject-btn {
          background: #ef4444;
        }

        .manage-btn.reject-btn:hover {
          background: #dc2626;
        }
        
        /* Status Badge */
        .status-badge {
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
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

        /* Quick Actions Grid */
        .actions-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .action-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 5px;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .action-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .action-card.blue {
          background: #eff6ff;
          border-color: #dbeafe;
        }

        .action-card.green {
          background: #f0fdf4;
          border-color: #dcfce7;
        }

        .action-card.purple {
          background: #faf5ff;
          border-color: #e9d5ff;
        }

        .action-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .action-card.blue .action-icon {
          background: #3b82f6;
          color: white;
        }

        .action-card.green .action-icon {
          background: #10b981;
          color: white;
        }

        .action-card.purple .action-icon {
          background: #8b5cf6;
          color: white;
        }

        .action-content {
          flex: 1;
        }

        .action-title {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 3px 0;
        }

        .action-subtitle {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        /* General Button Styling */
        .btn {
          padding: 10px 16px;
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

        .btn-secondary {
          background: #f8fafc;
          color: #1e293b;
          border: 1px solid #e2e8f0;
        }

        .btn-secondary:hover {
          background: #f1f5f9;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #6b7280;
          font-size: 14px;
        }

        .empty-state h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        .empty-state p {
          font-size: 14px;
          margin: 0 0 20px 0;
        }

        /* Loading Indicator & Alerts */
        .alert { padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; }
        .alert-error { background-color: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
        .loading-indicator { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; text-align: center; }
        .loading-spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .main-content-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 768px) {
          .metrics-grid, .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
 
 
 
 