import { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '../components/DashboardLayout';
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
    { id: 1, title: 'Room inspection', property: 'Downtown Coliving Hub', priority: 'high', status: 'pending', due: '2024-01-15' },
    { id: 2, title: 'Maintenance request', property: 'University District House', priority: 'medium', status: 'in-progress', due: '2024-01-16' },
    { id: 3, title: 'New tenant orientation', property: 'Downtown Coliving Hub', priority: 'high', status: 'pending', due: '2024-01-15' },
    { id: 4, title: 'Inventory check', property: 'University District House', priority: 'low', status: 'completed', due: '2024-01-17' },
    { id: 5, title: 'Lease renewal discussion', property: 'Downtown Coliving Hub', priority: 'medium', status: 'pending', due: '2024-01-18' },
    { id: 6, title: 'Property inspection', property: 'Sunset Boulevard Apartments', priority: 'high', status: 'in-progress', due: '2024-01-19' },
    { id: 7, title: 'Rent collection follow-up', property: 'Riverside Student Housing', priority: 'medium', status: 'pending', due: '2024-01-20' },
    { id: 8, title: 'HVAC maintenance', property: 'Oak Street Residences', priority: 'low', status: 'completed', due: '2024-01-21' }
  ];

  const quickActions = [
    { 
      title: 'Add Property',
      subtitle: 'Register New Property',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 21h18"/>
          <path d="M5 21V7l8-4v18"/>
          <path d="M19 21V11l-6-4"/>
          <line x1="12" y1="11" x2="12" y2="17"/>
          <line x1="9" y1="14" x2="15" y2="14"/>
        </svg>
      ), 
      color: 'blue' 
    },
    { 
      title: 'Review Applications',
      subtitle: 'Process Tenant Applications',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 6L9 17l-5-5"/>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
        </svg>
      ), 
      color: 'blue' 
    },
    { 
      title: 'Manage Tenants',
      subtitle: 'View and Manage Tenants',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ), 
      color: 'blue' 
    },
    { 
      title: 'Generate Reports',
      subtitle: 'Create Financial Reports',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="9" y1="9" x2="15" y2="9"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
          <line x1="9" y1="12" x2="15" y2="12"/>
        </svg>
      ), 
      color: 'blue' 
    }
  ];

  // Demo properties data
  const demoProperties = [
    {
      id: 1,
      name: 'Downtown Coliving Hub',
      status: 'Active',
      occupied: '12/14',
      revenue: '$8,400',
      tasks: 3
    },
    {
      id: 2,
      name: 'University District House',
      status: 'Active',
      occupied: '8/8',
      revenue: '$7,000',
      tasks: 2
    },
    {
      id: 3,
      name: 'Sunset Boulevard Apartments',
      status: 'Active',
      occupied: '15/16',
      revenue: '$12,800',
      tasks: 1
    },
    {
      id: 4,
      name: 'Riverside Student Housing',
      status: 'Active',
      occupied: '20/22',
      revenue: '$18,500',
      tasks: 4
    },
    {
      id: 5,
      name: 'Oak Street Residences',
      status: 'Maintenance',
      occupied: '6/10',
      revenue: '$5,200',
      tasks: 8
    },
    {
      id: 6,
      name: 'Maple Street Commons',
      status: 'Active',
      occupied: '18/20',
      revenue: '$16,200',
      tasks: 2
    }
  ];
  
  const userName = user?.full_name || user?.username || 'User';

  return (
    <DashboardLayout title="Dashboard" subtitle={`Welcome back, ${userName}! Here's an overview of your property management operations.`}>
      <Head>
        <title>Dashboard - Tink Property Management</title>
      </Head>
      
      <div className="creative-dashboard">
        {/* Creative Grid Layout */}
        <div className="dashboard-layout">
          {/* Top Metrics Row */}
          <div className="metrics-row">
            <div className="metric-card blue">
              <div className="metric-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 21h18"/>
                  <path d="M5 21V7l8-4v18"/>
                  <path d="M19 21V11l-6-4"/>
                </svg>
              </div>
              <div className="metric-content">
                <div className="metric-value">{demoMetrics.properties}</div>
                <div className="metric-label">Properties</div>
              </div>
            </div>
            
            <div className="metric-card purple">
              <div className="metric-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div className="metric-content">
                <div className="metric-value">{demoMetrics.tenants}</div>
                <div className="metric-label">Total Tenants</div>
              </div>
            </div>
            
            <div className="metric-card green">
              <div className="metric-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
                </svg>
              </div>
              <div className="metric-content">
                <div className="metric-value">{demoMetrics.occupancy}%</div>
                <div className="metric-label">Occupancy Rate</div>
              </div>
            </div>
            
            <div className="metric-card amber">
              <div className="metric-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <div className="metric-content">
                <div className="metric-value">${demoMetrics.revenue.toLocaleString()}</div>
                <div className="metric-label">Monthly Revenue</div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="main-content">
            {/* Left Side - Tasks */}
            <div className="tasks-section">
              <div className="section-header">
                <div className="section-title-group">
                  <h2 className="section-title">Pending Tasks</h2>
                  <p className="section-subtitle">Tasks requiring your attention</p>
                </div>
                <button className="add-task-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add Task
                </button>
        </div>
        
              <div className="tasks-card">
                <div className="tasks-table-container">
                  <table className="tasks-table">
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Property</th>
                        <th>Priority</th>
                        <th>Due Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {demoTasks.map((task, index) => (
                        <tr key={task.id} style={{ animationDelay: `${index * 0.1}s` }}>
                          <td className="task-cell">
                            <div className="task-title">{task.title}</div>
                          </td>
                          <td className="property-cell">
                            <div className="task-property">{task.property}</div>
                          </td>
                          <td className="priority-cell">
                            <span className={`priority-badge ${task.priority}`}>
                              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </span>
                          </td>
                          <td className="due-cell">
                            <div className="task-due">{task.due}</div>
                </td>
                          <td className="status-cell">
                            <select className="status-dropdown" defaultValue={task.status}>
                              <option value="pending">Pending</option>
                              <option value="in-progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                </td>
              </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Side - Quick Actions */}
            <div className="actions-section">
              <div className="section-header">
                <div className="section-title-group">
                  <h2 className="section-title">Quick Actions</h2>
                  <p className="section-subtitle">Frequently used actions</p>
                </div>
              </div>
              
              <div className="actions-container">
                <div className="actions-grid">
                  {quickActions.map((action, index) => (
                    <button key={index} className={`action-card ${action.color}`}>
                      <div className="action-icon">{action.icon}</div>
                      <div className="action-content">
                        <h3 className="action-title">{action.title} <span className="action-subtitle">({action.subtitle})</span></h3>
                </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section - Properties */}
          <div className="properties-section">
            <div className="properties-header">
              <div className="section-title-group">
                <h2 className="section-title">Property Overview</h2>
                <p className="section-subtitle">Summary of your managed properties</p>
              </div>
              <button className="view-all-btn">
                View All Properties
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
            
            <div className="properties-scroll-container">
              <div className="properties-grid">
                {demoProperties.map((property) => (
                  <div key={property.id} className="property-card">
              <div className="property-header">
                      <div className="property-info">
                        <h3 className="property-name">{property.name}</h3>
                        <span className={`status-badge ${property.status.toLowerCase()}`}>
                          {property.status}
                        </span>
                      </div>
                      <div className="property-actions">
                        <button className="btn-primary">Manage</button>
                        <button className="btn-secondary">Details</button>
                      </div>
              </div>
                    
              <div className="property-stats">
                <div className="stat-item">
                        <div className="stat-value">{property.occupied}</div>
                  <div className="stat-label">Rooms Occupied</div>
                </div>
                <div className="stat-item">
                        <div className="stat-value">{property.revenue}</div>
                  <div className="stat-label">Monthly Revenue</div>
                </div>
                <div className="stat-item">
                        <div className="stat-value">{property.tasks}</div>
                  <div className="stat-label">Pending Tasks</div>
                </div>
              </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .creative-dashboard {
          width: 100%;
          max-width: 100%;
          padding: 32px;
          overflow-x: hidden;
        }

        /* Hero Section */
        .hero-section {
          margin-bottom: 48px;
        }

        .hero-title {
          font-size: 36px;
          font-weight: 800;
          color: #1f2937;
          margin: 0 0 12px 0;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .hero-subtitle {
          font-size: 18px;
          color: #6b7280;
          margin: 0;
          line-height: 1.6;
          max-width: 600px;
        }

        /* Dashboard Layout - Better margins */
        .dashboard-layout {
          display: flex;
          flex-direction: column;
          gap: 48px;
          width: 100%;
        }

        /* Metrics Row */
        .metrics-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 24px;
          width: 100%;
        }

        .metric-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 24px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          display: flex;
          align-items: center;
          gap: 20px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .metric-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .metric-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
          border-color: var(--primary-color);
        }

        .metric-card:hover::before {
          opacity: 1;
        }

        .metric-card.blue {
          --primary-color: #3b82f6;
          --secondary-color: #1d4ed8;
        }

        .metric-card.purple {
          --primary-color: #8b5cf6;
          --secondary-color: #7c3aed;
        }

        .metric-card.green {
          --primary-color: #10b981;
          --secondary-color: #059669;
        }

        .metric-card.amber {
          --primary-color: #f59e0b;
          --secondary-color: #d97706;
        }

        .metric-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
        }

        .metric-content {
          flex: 1;
        }

        .metric-value {
          font-size: 28px;
          font-weight: 800;
          color: #1f2937;
          margin: 0 0 4px 0;
          line-height: 1;
        }

        .metric-label {
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Main Content - Give more width to tasks */
        .main-content {
          display: grid;
          grid-template-columns: 3fr 1fr;
          gap: 48px;
          width: 100%;
          align-items: start;
        }

        /* Section Headers */
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .section-title-group {
          flex: 1;
        }

        .section-title {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 4px 0;
          line-height: 1.2;
        }

        .section-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
          line-height: 1.5;
        }

        /* Tasks Section - Fixed height with scrolling */
        .tasks-section {
          min-width: 0;
          height: 500px;
          display: flex;
          flex-direction: column;
        }

        .add-task-btn {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border: none;
          padding: 14px 20px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          flex-shrink: 0;
        }

        .add-task-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }

        .tasks-card {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          border: 1px solid rgba(226, 232, 240, 0.6);
          overflow: hidden;
          flex: 1;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        }

        .tasks-table-container {
          flex: 1;
          overflow-y: auto;
          max-height: 100%;
        }

        .tasks-table-container::-webkit-scrollbar {
          width: 6px;
        }

        .tasks-table-container::-webkit-scrollbar-track {
          background: rgba(226, 232, 240, 0.3);
          border-radius: 3px;
        }

        .tasks-table-container::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }

        .tasks-table-container::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.7);
        }

        .tasks-table {
          width: 100%;
          border-collapse: collapse;
        }

        .tasks-table thead {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .tasks-table th {
          padding: 20px 16px;
          text-align: center;
          font-size: 14px;
          font-weight: 700;
          color: #1f2937;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 2px solid rgba(59, 130, 246, 0.15);
          position: relative;
        }

        .tasks-table th::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.4), transparent);
        }

        .tasks-table tbody tr {
          transition: all 0.3s ease;
          animation: fadeInUp 0.6s ease forwards;
          opacity: 0;
          transform: translateY(20px);
          border-bottom: 1px solid rgba(226, 232, 240, 0.3);
        }

        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .tasks-table tbody tr:hover {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(139, 92, 246, 0.03) 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
        }

        .tasks-table td {
          padding: 22px 16px;
          text-align: center;
          vertical-align: middle;
          border-bottom: 1px solid rgba(226, 232, 240, 0.2);
        }

        .task-cell {
          width: 28%;
        }

        .property-cell {
          width: 28%;
        }

        .priority-cell {
          width: 8%;
        }
        
        .due-cell {
          width: 8%;
        }
        
        .status-cell {
          width: 28%;
        }
        
        .task-title {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
          line-height: 1.4;
        }

        .task-property {
          font-size: 14px;
          color: #4b5563;
          font-weight: 500;
        }

        .status-dropdown {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
          border: 2px solid rgba(59, 130, 246, 0.4);
          border-radius: 14px;
          padding: 16px 20px;
          font-size: 15px;
          font-weight: 700;
          color: #1f2937;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
          max-width: 150px;
          text-align: center;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
          backdrop-filter: blur(12px);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-dropdown:hover {
          border-color: #3b82f6;
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
          transform: translateY(-3px);
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          scale: 1.05;
        }

        .status-dropdown:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 5px rgba(59, 130, 246, 0.25);
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          scale: 1.05;
        }

        .priority-badge {
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          display: inline-block;
          transition: all 0.2s ease;
          min-width: 60px;
        }

        .priority-badge:hover {
          transform: translateY(-1px);
          box-shadow: 0 3px 12px rgba(0, 0, 0, 0.15);
        }

        .priority-badge.high {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%);
          color: #dc2626;
          border: 1px solid rgba(239, 68, 68, 0.4);
        }

        .priority-badge.medium {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%);
          color: #d97706;
          border: 1px solid rgba(245, 158, 11, 0.4);
        }

        .priority-badge.low {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%);
          color: #059669;
          border: 1px solid rgba(16, 185, 129, 0.4);
        }

        .task-due {
          font-size: 13px;
          color: #4b5563;
          font-weight: 500;
        }

        /* Actions Section - Auto height */
        .actions-section {
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .actions-container {
          flex: 1;
        }

        .actions-grid {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .action-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 14px;
          padding: 20px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          display: inline-flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s ease;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          text-align: left;
          width: fit-content;
          --primary-color: #3b82f6;
          --secondary-color: #1d4ed8;
        }

        .action-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .action-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
          border-color: var(--primary-color);
        }

        .action-card:hover::before {
          opacity: 1;
        }

        .action-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .action-icon svg {
          width: 22px;
          height: 22px;
          stroke: white;
          stroke-width: 2.5;
        }

        .action-content {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
        }

        .action-title {
          font-size: 17px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
          line-height: 1.3;
          letter-spacing: -0.01em;
        }

        .action-subtitle {
          font-size: 14px;
          font-weight: 400;
          color: #9ca3af;
          margin-left: 4px;
        }

        /* Properties Section - Fixed height */
        .properties-section {
          width: 100%;
        }

        .properties-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .view-all-btn {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.2);
          padding: 14px 20px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .view-all-btn:hover {
          background: rgba(59, 130, 246, 0.15);
          transform: translateY(-1px);
        }

        .properties-scroll-container {
          height: 400px;
          overflow-y: auto;
          padding-right: 8px;
        }

        .properties-scroll-container::-webkit-scrollbar {
          width: 6px;
        }

        .properties-scroll-container::-webkit-scrollbar-track {
          background: rgba(226, 232, 240, 0.3);
          border-radius: 3px;
        }

        .properties-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }

        .properties-scroll-container::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.7);
        }

        .properties-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          min-width: 100%;
        }
        
        .property-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 24px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          transition: all 0.3s ease;
          min-width: 280px;
        }

        .property-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          border-color: rgba(59, 130, 246, 0.3);
        }
        
        .property-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .property-info {
          flex: 1;
          min-width: 0;
        }
        
        .property-name {
          font-size: 17px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 6px 0;
          line-height: 1.3;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-badge.active {
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .status-badge.maintenance {
          background: rgba(245, 158, 11, 0.1);
          color: #d97706;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }

        .property-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }

        .btn-primary, .btn-secondary {
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }

        .btn-primary {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        .btn-secondary {
          background: rgba(107, 114, 128, 0.1);
          color: #374151;
          border-color: rgba(107, 114, 128, 0.2);
        }

        .btn-secondary:hover {
          background: rgba(107, 114, 128, 0.15);
          transform: translateY(-1px);
        }
        
        .property-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          padding: 20px 0;
          border-top: 1px solid rgba(226, 232, 240, 0.6);
        }
        
        .stat-item {
          text-align: center;
        }
        
        .stat-value {
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 4px 0;
          line-height: 1;
        }
        
        .stat-label {
          font-size: 11px;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 500;
        }

        /* Responsive Design */
        @media (max-width: 1400px) {
          .main-content {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          
          .actions-section {
            order: -1;
            height: auto;
          }

          .tasks-section {
            height: 600px;
          }
          
          .actions-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .properties-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 1024px) {
          .creative-dashboard {
            padding: 24px;
          }

          .dashboard-layout {
            gap: 40px;
          }

          .properties-grid {
            grid-template-columns: 1fr;
          }
          
          .metrics-row {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
        }

        @media (max-width: 768px) {
          .creative-dashboard {
            padding: 20px;
          }

          .dashboard-layout {
            gap: 32px;
          }

          .hero-title {
            font-size: 28px;
          }
          
          .hero-subtitle {
            font-size: 16px;
          }
          
          .section-title {
            font-size: 20px;
          }
          
          .metrics-row {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          
          .metric-card {
            padding: 20px;
          }
          
          .metric-icon {
            width: 48px;
            height: 48px;
          }
          
          .metric-value {
            font-size: 24px;
          }
          
          .actions-grid {
            grid-template-columns: 1fr;
          }

          .section-header {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }
          
          .property-header {
            flex-direction: column;
            gap: 12px;
          }
          
          .property-actions {
            width: 100%;
            justify-content: flex-start;
          }
          
          .property-stats {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .properties-header {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }

          .tasks-section, .actions-section {
            height: auto;
          }

          .tasks-table th, .tasks-table td {
            padding: 12px 16px;
          }
        }

        @media (max-width: 480px) {
          .creative-dashboard {
            padding: 16px;
          }

          .creative-dashboard {
            padding: 16px;
          }
          
          .metric-card {
            padding: 16px;
            gap: 12px;
          }
          
          .metric-icon {
            width: 40px;
            height: 40px;
          }
          
          .metric-value {
            font-size: 20px;
          }
          
          .action-card {
            padding: 16px;
            gap: 12px;
          }
          
          .action-icon {
            width: 36px;
            height: 36px;
          }
          
          .property-card {
            padding: 20px;
            min-width: 260px;
          }

          .tasks-table th, .tasks-table td {
            padding: 10px 12px;
            font-size: 12px;
          }

          .task-title {
            font-size: 13px;
          }

          .task-property {
            font-size: 11px;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}

export default withAuth(Dashboard); 
 
 
 
 