import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { apiClient } from '../../lib/api';
import { InventoryItem, Property, Room } from '../../lib/types';
import Navigation from '../../components/Navigation';
import DashboardLayout from '../../components/DashboardLayout';
import SectionCard from '../../components/SectionCard';
import MetricCard from '../../components/MetricCard';

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
      <>
        <Head>
          <title>Inventory Management - Tink</title>
        </Head>
        <Navigation />
        <DashboardLayout
          title="Property Inventory Management"
          subtitle="Loading inventory data..."
        >
          <div className="loading-indicator">
            <div className="loading-spinner" />
            <p>Fetching inventory data from the server...</p>
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
      <Navigation />
      
      <DashboardLayout
        title="📦 Property Inventory Management"
        subtitle="Track, maintain, and manage inventory across all properties"
      >
        {error && <div className="alert alert-error"><strong>Error:</strong> {error}</div>}
        
        <SectionCard>
          <div className="actions-container">
            <Link href="/inventory/add" className="btn btn-primary">
              ➕ Add Inventory
            </Link>
            <button className="btn btn-secondary" onClick={fetchData}>
              👁️ View Inventory
            </button>
            <button className="btn btn-secondary" onClick={() => alert('CSV download coming soon!')}>
              📊 Download CSV
            </button>
          </div>
        </SectionCard>
        
        <SectionCard title="🔍 Filter Inventory" subtitle="Search and filter inventory items">
          <div className="actions-container">
            <button className="btn btn-secondary" onClick={clearFilters}>Clear Filters</button>
            <button className="btn btn-primary" onClick={fetchData}>🔄 Refresh</button>
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
                {(selectedProperty ? rooms.filter(r => r.property === selectedProperty) : rooms).map(room => (
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
        </SectionCard>

        <SectionCard title={`📦 Complete Inventory (${filteredItems.length} items)`}>
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
                        <button className="btn btn-sm btn-secondary">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {getMaintenanceItems().length > 0 && (
          <SectionCard title={`🛠️ Bulk Purchase Planning`} subtitle={`Items commonly needed for co-living setups`}>
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
                    <td><button className="btn btn-sm btn-primary">🛒 Browse Sets</button></td>
                  </tr>
                  <tr>
                    <td>Kitchen Basics</td>
                    <td>Table, chairs, appliances</td>
                    <td>$400-800</td>
                    <td><button className="btn btn-sm btn-primary">🛒 Browse Kitchen</button></td>
                  </tr>
                  <tr>
                    <td>Storage Solutions</td>
                    <td>Wardrobes, shelving, storage bins</td>
                    <td>$200-500</td>
                    <td><button className="btn btn-sm btn-primary">🛒 Browse Storage</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}
      </DashboardLayout>
    </>
  );
}
 
 
 
 