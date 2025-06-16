import { useState, useEffect } from 'react';
import Head from 'next/head';
import Navigation from '../components/Navigation';
import DashboardLayout from '../components/DashboardLayout';
import SectionCard from '../components/SectionCard';
import DataTable from '../components/DataTable';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { withAuth } from '../lib/auth-context';
import { useAuth } from '../lib/auth-context';

function Dashboard() {
  const { user, isLandlord, isManager, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Demo data
  const demoMetrics = {
    properties: 5,
    tenants: 28,
    occupancy: 92,
    revenue: 15400
  };
  
  const demoTasks = [
    { id: 1, title: 'Room inspection', property: 'Downtown Coliving Hub', priority: 'high', due: '2024-01-15' },
    { id: 2, title: 'Maintenance request', property: 'University District House', priority: 'medium', due: '2024-01-16' },
    { id: 3, title: 'New tenant orientation', property: 'Downtown Coliving Hub', priority: 'high', due: '2024-01-15' },
    { id: 4, title: 'Inventory check', property: 'University District House', priority: 'low', due: '2024-01-17' },
    { id: 5, title: 'Lease renewal discussion', property: 'Downtown Coliving Hub', priority: 'medium', due: '2024-01-18' }
  ];
  
  const userName = user?.full_name || user?.username || 'User';
  const roleName = isAdmin() ? 'Admin' : isLandlord() ? 'Property Owner' : isManager() ? 'Property Manager' : 'User';

  return (
    <>
      <Head>
        <title>Dashboard - Tink Property Management</title>
      </Head>
      
      <Navigation />
      
      <DashboardLayout
        title={`Dashboard`}
        subtitle={`Welcome back, ${userName}! Here's an overview of your property management operations.`}
      >
        {/* Key Performance Metrics */}
        <div className="metrics-grid">
          <MetricCard 
            title="Properties" 
            value={demoMetrics.properties}
            color="blue"
          />
          
          <MetricCard 
            title="Total Tenants" 
            value={demoMetrics.tenants}
            color="purple"
          />
          
          <MetricCard 
            title="Occupancy Rate" 
            value={`${demoMetrics.occupancy}%`}
            color="green"
          />
          
          <MetricCard 
            title="Monthly Revenue" 
            value={demoMetrics.revenue}
            color="amber"
            isMonetary={true}
          />
        </div>
        
        {/* Recent Activity */}
        <SectionCard
          title="Pending Tasks"
          subtitle="Tasks requiring your attention"
          action={<button className="btn btn-primary">+ Add Task</button>}
        >
          <DataTable
            columns={[
              { key: 'task', header: 'Task', width: '30%' },
              { key: 'property', header: 'Property', width: '25%' },
              { key: 'priority', header: 'Priority', width: '15%' },
              { key: 'due', header: 'Due Date', width: '15%' },
              { key: 'actions', header: 'Actions', width: '15%' }
            ]}
            data={demoTasks}
            renderRow={(task) => (
              <tr key={task.id}>
                <td className="task-title" style={{ textAlign: 'center' }}>{task.title}</td>
                <td style={{ textAlign: 'center' }}>{task.property}</td>
                <td style={{ textAlign: 'center' }}>
                  <StatusBadge 
                    status={task.priority} 
                    text={task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  />
                </td>
                <td style={{ textAlign: 'center' }}>{task.due}</td>
                <td style={{ textAlign: 'center' }}>
                  <div className="action-buttons">
                    <button className="btn btn-success">Complete</button>
                    <button className="btn btn-primary">Details</button>
                  </div>
                </td>
              </tr>
            )}
          />
        </SectionCard>
        
        {/* Property Overview */}
        <SectionCard
          title="Property Overview"
          subtitle="Summary of your managed properties"
        >
          <div className="property-cards">
            <div className="property-card">
              <div className="property-header">
                <h3 className="property-name">Downtown Coliving Hub</h3>
                <StatusBadge status="success" text="Active" />
              </div>
              <div className="property-stats">
                <div className="stat-item">
                  <div className="stat-value">12/14</div>
                  <div className="stat-label">Rooms Occupied</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">$8,400</div>
                  <div className="stat-label">Monthly Revenue</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">3</div>
                  <div className="stat-label">Pending Tasks</div>
                </div>
              </div>
              <div className="property-footer">
                <button className="btn btn-primary">Manage Property</button>
                <button className="btn btn-primary">View Tasks</button>
              </div>
            </div>
            
            <div className="property-card">
              <div className="property-header">
                <h3 className="property-name">University District House</h3>
                <StatusBadge status="success" text="Active" />
              </div>
              <div className="property-stats">
                <div className="stat-item">
                  <div className="stat-value">8/8</div>
                  <div className="stat-label">Rooms Occupied</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">$7,000</div>
                  <div className="stat-label">Monthly Revenue</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">2</div>
                  <div className="stat-label">Pending Tasks</div>
                </div>
              </div>
              <div className="property-footer">
                <button className="btn btn-primary">Manage Property</button>
                <button className="btn btn-primary">View Tasks</button>
              </div>
            </div>
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
        
        .task-title {
          font-weight: 500;
          color: var(--gray-900);
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
        
        .property-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: var(--spacing-xl);
        }
        
        .property-card {
          background-color: white;
          border-radius: var(--radius-md);
          border: 1px solid var(--gray-200);
          padding: var(--spacing-lg);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }
        
        .property-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .property-name {
          font-size: var(--text-h4);
          font-weight: 600;
          margin: 0;
          color: var(--gray-900);
        }
        
        .property-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--spacing-md);
          padding: var(--spacing-md) 0;
          border-top: 1px solid var(--gray-100);
          border-bottom: 1px solid var(--gray-100);
        }
        
        .stat-item {
          text-align: center;
        }
        
        .stat-value {
          font-size: var(--text-h4);
          font-weight: 600;
          color: var(--gray-900);
        }
        
        .stat-label {
          font-size: var(--text-small);
          color: var(--gray-600);
          margin-top: 4px;
        }
        
        .property-footer {
          display: flex;
          gap: var(--spacing-sm);
          margin-top: var(--spacing-sm);
        }
      `}</style>
    </>
  );
}

export default withAuth(Dashboard); 
 
 
 
 