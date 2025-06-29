import { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '../components/DashboardLayout';
import MetricCard from '../components/MetricCard';
import SectionCard from '../components/SectionCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import Link from 'next/link';
import { withAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';
import { Property } from '../lib/types';

function Properties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const propertiesResponse = await apiClient.getProperties();
      setProperties(propertiesResponse.results || []);
    } catch (error: any) {
      console.error('Failed to fetch properties data:', error);
      setError(error?.message || 'Failed to load properties data');
    } finally {
      setLoading(false);
    }
  };

  const getPropertyStats = (property: Property) => {
    const totalRooms = property.total_rooms || 0;
    const vacantRooms = property.vacant_rooms || 0;
    const occupiedRooms = totalRooms - vacantRooms;
    const occupancyRate = totalRooms > 0 ? 
      Math.round((occupiedRooms / totalRooms) * 100) : 0;
    
    return {
      totalRooms,
      occupiedRooms,
      vacantRooms,
      occupancyRate
    };
  };

  const downloadPropertiesReport = () => {
    const csvData = [
      ['Property Name', 'Address', 'Total Rooms', 'Occupied', 'Vacant', 'Occupancy Rate'],
      ...properties.map(property => {
        const stats = getPropertyStats(property);
        return [
          property.name,
          property.full_address,
          stats.totalRooms.toString(),
          stats.occupiedRooms.toString(),
          stats.vacantRooms.toString(),
          `${stats.occupancyRate}%`
        ];
      })
    ];
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tink-properties-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Calculate portfolio summary
  const totalRooms = properties.reduce((sum, property) => sum + (property.total_rooms || 0), 0);
  const totalVacantRooms = properties.reduce((sum, property) => sum + (property.vacant_rooms || 0), 0);
  const occupiedRooms = totalRooms - totalVacantRooms;
  const overallOccupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  if (loading) {
    return (
      <DashboardLayout
        title="Property Management"
        subtitle="Loading property data..."
      >
        <div className="loading-indicator">
          <div className="loading-spinner"></div>
          <p>Fetching property data...</p>
        </div>
        
        <style jsx>{`
          .loading-indicator {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-xl);
          }
          
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid var(--gray-200);
            border-top-color: var(--primary-blue);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: var(--spacing-md);
          }
          
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Property Management"
      subtitle="Manage all properties, rooms, and occupancy across your portfolio"
    >
        {error && <div className="alert alert-error">{error}</div>}
        
        {/* Metrics */}
        <div className="metrics-grid">
          <MetricCard 
            title="Total Properties" 
            value={properties.length}
            color="blue"
          />
          
          <MetricCard 
            title="Total Rooms" 
            value={totalRooms}
            subtitle={`${occupiedRooms} occupied`}
            color="purple"
          />
          
          <MetricCard 
            title="Vacant Rooms" 
            value={totalVacantRooms}
            color="amber"
          />
          
          <MetricCard 
            title="Occupancy Rate" 
            value={`${overallOccupancyRate}%`}
            color="purple"
          />
        </div>
        
        {/* Actions */}
        <SectionCard>
          <div className="actions-container">
            <button 
              onClick={() => fetchData()} 
              className="btn btn-secondary"
            >
              Refresh
            </button>
            
            <Link href="/properties/add" className="btn btn-primary">
              Add New Property
            </Link>
          </div>
        </SectionCard>
        
        {/* Properties List */}
        <SectionCard
          title={`Properties (${properties.length})`}
          subtitle="Manage property details, rooms, and occupancy status"
        >
          {properties.length === 0 ? (
            <EmptyState
              title="No properties found"
              description="Start by adding your first property to manage tenants and rooms."
              action={
                <Link href="/properties/add" className="btn btn-primary">
                  Add Your First Property
        </Link>
              }
            />
          ) : (
            <DataTable
              columns={[
                { key: 'name', header: 'Property Name', width: '25%' },
                { key: 'address', header: 'Address', width: '30%' },
                { key: 'rooms', header: 'Rooms', width: '15%' },
                { key: 'occupancy', header: 'Occupancy', width: '15%' },
                { key: 'actions', header: 'Actions', width: '15%' }
              ]}
              data={properties}
              renderRow={(property) => {
                const stats = getPropertyStats(property);
                return (
                <tr key={property.id}>
                  <td>
                    <div className="property-name">{property.name}</div>
                    <div className="property-type">{property.property_type}</div>
                  </td>
                  
                  <td className="property-address">
                    {property.full_address}
                  </td>
                  
                  <td className="property-stats">
                    <div>Total: {stats.totalRooms}</div>
                    <div>Vacant: {stats.vacantRooms}</div>
                  </td>
                  
                  <td>
                    {stats.occupancyRate < 50 ? (
                      <StatusBadge status="error" text="Low Occupancy" />
                    ) : stats.occupancyRate < 80 ? (
                      <StatusBadge status="warning" text="Good" />
                    ) : (
                      <StatusBadge status="success" text="Excellent" />
                  )}
                </td>
                  
                  <td style={{ textAlign: 'center' }}>
                    <div className="action-buttons">
                      <Link href={`/properties/${property.id}`} className="btn btn-primary btn-sm">
                        Details
                      </Link>
                    </div>
                </td>
              </tr>
            );
            }}
          />
        )}
      </SectionCard>

    {/* Quick Actions */}
      <SectionCard 
        title="Quick Actions"
        subtitle="Common property management tasks"
      >
        <div className="quick-actions">
          <Link href="/tenants" className="btn btn-primary">
            Manage Tenants
        </Link>
          
          <Link href="/leases" className="btn btn-primary">
            View Leases
        </Link>
          
          <Link href="/applications" className="btn btn-primary">
            Review Applications
        </Link>
          
          <Link href="/inventory" className="btn btn-primary">
            Check Inventory
        </Link>
      </div>
      </SectionCard>

      <style jsx>{`
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
        }
        
        .actions-container {
          display: flex;
          gap: var(--spacing-md);
          justify-content: flex-end;
        }
        
        .property-name {
          font-weight: 600;
          color: var(--gray-900);
          text-align: center;
        }
        
        .property-type {
          font-size: var(--text-small);
          color: var(--gray-600);
          text-transform: capitalize;
          text-align: center;
        }
        
        .property-address {
          color: var(--gray-700);
          text-align: center;
        }
        
        .property-stats {
          text-align: center;
          font-size: var(--text-small);
        }
        
        .action-buttons {
          display: flex;
          gap: var(--spacing-xs);
          justify-content: center;
        }
        
        .quick-actions {
          display: flex;
          gap: var(--spacing-md);
          flex-wrap: wrap;
        }
        
        /* Center align table headers */
        :global(.data-table .table-header) {
          text-align: center;
        }
      `}</style>
    </DashboardLayout>
  );
}

export default withAuth(Properties);