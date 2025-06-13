import { useState, useEffect } from 'react';
import Head from 'next/head';
import Navigation from '../components/Navigation';
import DashboardLayout from '../components/DashboardLayout';
import MetricCard from '../components/MetricCard';
import SectionCard from '../components/SectionCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import Link from 'next/link';
import { withAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';
import { Property, Room } from '../lib/types';

function Properties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [propertiesResponse, roomsResponse] = await Promise.all([
        apiClient.getProperties(),
        apiClient.getRooms()
      ]);

      setProperties(propertiesResponse.results || []);
      setRooms(roomsResponse.results || []);
    } catch (error: any) {
      console.error('Failed to fetch properties data:', error);
      setError(error?.message || 'Failed to load properties data');
    } finally {
      setLoading(false);
    }
  };

  const getPropertyStats = (propertyId: number) => {
    const propertyRooms = rooms.filter(room => room.property_ref === propertyId);
    const occupiedRooms = propertyRooms.filter(room => !room.is_vacant);
    const vacantRooms = propertyRooms.filter(room => room.is_vacant);
    const occupancyRate = propertyRooms.length > 0 ? 
      Math.round((occupiedRooms.length / propertyRooms.length) * 100) : 0;
    
    return {
      totalRooms: propertyRooms.length,
      occupiedRooms: occupiedRooms.length,
      vacantRooms: vacantRooms.length,
      occupancyRate
    };
  };

  const downloadPropertiesReport = () => {
    const csvData = [
      ['Property Name', 'Address', 'Total Rooms', 'Occupied', 'Vacant', 'Occupancy Rate'],
      ...properties.map(property => {
        const stats = getPropertyStats(property.id);
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
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(room => !room.is_vacant).length;
  const vacantRooms = rooms.filter(room => room.is_vacant).length;
  const overallOccupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  if (loading) {
    return (
      <>
        <Navigation />
        <DashboardLayout
          title="Properties Portfolio"
          subtitle="Loading property data..."
        >
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
            <p>Fetching property data...</p>
          </div>
        </DashboardLayout>
        
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
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Properties Portfolio - Tink Property Management</title>
      </Head>
      <Navigation />
      
      <DashboardLayout
        title="Properties Portfolio"
        subtitle="Manage your properties and track occupancy across your portfolio."
      >
        {error && <div className="alert alert-error">{error}</div>}
        
        {/* Metrics */}
        <div className="metrics-grid">
          <MetricCard 
            title="Total Properties" 
            value={properties.length}
            color="green"
          />
          
          <MetricCard 
            title="Total Rooms" 
            value={totalRooms}
            color="blue"
          />
        
          <MetricCard 
            title="Vacant Rooms" 
            value={vacantRooms}
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
            <Link href="/properties/add" className="btn btn-primary">
              Register New Property
        </Link>
            
        <button 
          onClick={downloadPropertiesReport}
              className="btn btn-secondary"
        >
              Download Report
          </button>
            
        <button 
          onClick={fetchData}
              className="btn btn-secondary"
        >
              Refresh
          </button>
        </div>
        </SectionCard>

        {/* Properties Overview */}
        <SectionCard
          title="Properties Overview"
          subtitle="Summary of your managed properties"
        >
          {properties.length === 0 ? (
            <EmptyState
              title="No Properties Found"
              description="Add your first property to get started with property management."
              action={
                <Link href="/properties/add" className="btn btn-primary">
                  Add Property
                </Link>
              }
            />
          ) : (
            <DataTable
              columns={[
                { key: 'property', header: 'Property', width: '30%' },
                { key: 'rooms', header: 'Rooms', width: '15%' },
                { key: 'occupancy', header: 'Occupancy', width: '25%' },
                { key: 'status', header: 'Status', width: '15%' },
                { key: 'actions', header: 'Actions', width: '15%' }
              ]}
              data={properties}
              renderRow={(property) => {
                const stats = getPropertyStats(property.id);
                const occupancyWarning = stats.occupancyRate < 80;
                
              return (
                  <tr key={property.id}>
                    <td>
                      <div className="property-name">{property.name}</div>
                      <div className="property-address">{property.full_address}</div>
                    </td>
                    
                    <td>
                      <div className="rooms-stats">
                        <div>{stats.totalRooms} total</div>
                        <div className="room-detail">
                          {stats.occupiedRooms} occupied, {stats.vacantRooms} vacant
                        </div>
                      </div>
                  </td>
                    
                    <td>
                      <div className="occupancy-container">
                        <div className="occupancy-bar">
                          <div 
                            className="occupancy-progress" 
                            style={{ width: `${stats.occupancyRate}%` }}
                          ></div>
                      </div>
                        <div className="occupancy-text">{stats.occupancyRate}%</div>
                      </div>
                    </td>
                    
                    <td>
                      {stats.occupancyRate < 70 ? (
                        <StatusBadge status="warning" text="Low Occupancy" />
                      ) : stats.occupancyRate < 90 ? (
                        <StatusBadge status="info" text="Good" />
                      ) : (
                        <StatusBadge status="success" text="Excellent" />
                    )}
                  </td>
                    
                    <td>
                      <div className="action-buttons">
                        <Link href={`/properties/${property.id}`} className="btn btn-secondary btn-sm">
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
            <Link href="/tenants" className="btn btn-secondary">
              Manage Tenants
          </Link>
            
            <Link href="/leases" className="btn btn-secondary">
              View Leases
          </Link>
            
            <Link href="/applications" className="btn btn-secondary">
              Review Applications
          </Link>
            
            <Link href="#" className="btn btn-secondary">
              Check Inventory
          </Link>
        </div>
        </SectionCard>
      </DashboardLayout>
      
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
          flex-wrap: wrap;
        }
        
        .property-name {
          font-weight: 500;
          color: var(--gray-900);
        }
        
        .property-address {
          font-size: var(--text-small);
          color: var(--gray-600);
        }
        
        .rooms-stats {
          font-size: var(--text-small);
        }
        
        .room-detail {
          color: var(--gray-600);
          margin-top: 4px;
        }
        
        .occupancy-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .occupancy-bar {
          height: 8px;
          background-color: var(--gray-200);
          border-radius: 4px;
          overflow: hidden;
        }
        
        .occupancy-progress {
          height: 100%;
          background-color: var(--primary-blue);
          border-radius: 4px;
        }
        
        .occupancy-text {
          font-size: var(--text-small);
          font-weight: 500;
        }
        
        .action-buttons {
          display: flex;
          gap: var(--spacing-xs);
        }
        
        .quick-actions {
          display: flex;
          gap: var(--spacing-md);
          flex-wrap: wrap;
        }
      `}</style>
    </>
  );
}

export default withAuth(Properties);