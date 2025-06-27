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
                const stats = getPropertyStats(property);
                const occupancyWarning = stats.occupancyRate < 80;
                
              return (
                  <tr key={property.id}>
                    <td style={{ textAlign: 'center' }}>
                      <div className="property-name">{property.name}</div>
                      <div className="property-address">{property.full_address}</div>
                    </td>
                    
                    <td style={{ textAlign: 'center' }}>
                      <div className="rooms-stats">
                        <div>{stats.totalRooms} total</div>
                        <div className="room-detail">
                          {stats.occupiedRooms} occupied, {stats.vacantRooms} vacant
                        </div>
                      </div>
                  </td>
                    
                    <td style={{ textAlign: 'center' }}>
                      <div className="occupancy-container">
                        <div className={`occupancy-bar ${stats.occupancyRate < 50 ? 'low' : stats.occupancyRate < 80 ? 'medium' : 'high'}`}>
                          <div 
                            className="occupancy-progress" 
                            style={{ width: `${stats.occupancyRate}%` }}
                          ></div>
                        </div>
                        <div className="occupancy-text">
                          <span className="occupancy-percent">{stats.occupancyRate}%</span>
                          <span className="occupancy-detail">
                            {stats.occupiedRooms} of {stats.totalRooms} occupied
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    <td style={{ textAlign: 'center' }}>
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
          font-weight: 600;
          color: var(--gray-900);
          font-size: var(--text-base);
          margin-bottom: 4px;
        }
        
        .property-address {
          font-size: var(--text-small);
          color: var(--gray-600);
          line-height: 1.4;
        }
        
        .rooms-stats {
          font-size: var(--text-small);
        }
        
        .room-detail {
          color: var(--gray-600);
          margin-top: 4px;
          font-size: 11px;
        }
        
        .occupancy-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
        }
        
        .occupancy-bar {
          width: 120px;
          height: 12px;
          background-color: var(--gray-200);
          border-radius: 8px;
          overflow: hidden;
          position: relative;
        }
        
        .occupancy-bar.low {
          background-color: #fee2e2;
        }
        
        .occupancy-bar.medium {
          background-color: #fef3c7;
        }
        
        .occupancy-bar.high {
          background-color: #dcfce7;
        }
        
        .occupancy-progress {
          height: 100%;
          border-radius: 8px;
          transition: width 0.3s ease;
        }
        
        .occupancy-bar.low .occupancy-progress {
          background: linear-gradient(90deg, #ef4444, #dc2626);
        }
        
        .occupancy-bar.medium .occupancy-progress {
          background: linear-gradient(90deg, #f59e0b, #d97706);
        }
        
        .occupancy-bar.high .occupancy-progress {
          background: linear-gradient(90deg, #22c55e, #16a34a);
        }
        
        .occupancy-text {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        
        .occupancy-percent {
          font-size: var(--text-small);
          font-weight: 600;
          color: var(--gray-900);
        }
        
        .occupancy-detail {
          font-size: 11px;
          color: var(--gray-600);
          font-weight: 400;
        }
        
        .action-buttons {
          display: flex;
          gap: var(--spacing-xs);
          justify-content: center;
        }
        
        /* Center align table headers */
        :global(.data-table .table-header) {
          text-align: center;
        }
        
        .quick-actions {
          display: flex;
          gap: var(--spacing-md);
          flex-wrap: wrap;
        }
        
        /* Table row hover effect */
        :global(.data-table tbody tr:hover) {
          background-color: var(--gray-50);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        /* Occupancy bar hover effect */
        .occupancy-bar:hover {
          transform: scale(1.05);
          transition: transform 0.2s ease;
        }
      `}</style>
    </>
  );
}

export default withAuth(Properties);