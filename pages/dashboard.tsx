import { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '../components/DashboardLayout';
import { withAuth } from '../lib/auth-context';
import { useAuth } from '../lib/auth-context';

// Custom hook for counter animation
const useCounterAnimation = (targetValue, duration = 2000, isRevenue = false) => {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    let startTime;
    let animationId;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Use easeOutQuart for smooth deceleration
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const value = Math.floor(easeOutQuart * targetValue);
      
      setCurrentValue(value);

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [targetValue, duration]);

  if (isRevenue) {
    return `$${currentValue.toLocaleString()}`;
  }
  
  return currentValue;
};

function Dashboard() {
  const { user, isLandlord, isManager, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);

  // Counter animations for metrics
  const propertiesCount = useCounterAnimation(5, 1500);
  const roomsCount = useCounterAnimation(87, 2000);
  const tenantsCount = useCounterAnimation(28, 1800);
  const revenueValue = useCounterAnimation(15400, 2200, true);
  
  // Demo data matching the screenshot design
  const metrics = {
    properties: { value: 5, subtitle: 'Active portfolio', change: '+2', changeType: 'positive' },
    rooms: { value: 87, subtitle: 'Across all properties', change: '+5', changeType: 'positive' },
    tenants: { value: 28, subtitle: 'Current residents', change: '+8%', changeType: 'positive' },
    revenue: { value: '$15,400', subtitle: 'From all properties', change: '+12%', changeType: 'positive' }
  };

  const tasks = [
    { 
      id: 1, 
      task: 'Room inspection', 
      property: 'Downtown Coliving Hub', 
      priority: 'High', 
      dueDate: '2024-01-15', 
      status: 'Pending' 
    },
    { 
      id: 2, 
      task: 'Maintenance request', 
      property: 'University District House', 
      priority: 'Medium', 
      dueDate: '2024-01-16', 
      status: 'In Progress' 
    },
    { 
      id: 3, 
      task: 'New tenant orientation', 
      property: 'Downtown Coliving Hub', 
      priority: 'High', 
      dueDate: '2024-01-15', 
      status: 'Pending' 
    },
    { 
      id: 4, 
      task: 'Inventory check', 
      property: 'University District House', 
      priority: 'Low', 
      dueDate: '2024-01-17', 
      status: 'Completed' 
    },
    { 
      id: 5, 
      task: 'Lease renewal discussion', 
      property: 'Downtown Coliving Hub', 
      priority: 'Medium', 
      dueDate: '2024-01-18', 
      status: 'Pending' 
    }
  ];

  const quickActions = [
    {
      title: 'Add Property',
      subtitle: 'Register New Property',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      ),
      color: 'blue'
    },
    {
      title: 'Review Applications',
      subtitle: 'Process Tenant Applications',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
      ),
      color: 'blue'
    },
    {
      title: 'Manage Tenants',
      subtitle: 'View and Manage Tenants',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
      color: 'green'
    },
    {
      title: 'Generate Reports',
      subtitle: 'Create Financial Reports',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      ),
      color: 'purple'
    }
  ];

  const properties = [
    {
      id: 1,
      name: 'University District House',
      location: 'Downtown District',
      status: 'Active',
      occupancy: '8/8',
      occupancyPercent: 100,
      revenue: 7000,
      revenueChange: '+5%',
      tasks: 2,
      initials: 'UD',
      color: '#10b981'
    },
    {
      id: 2,
      name: 'Sunset Boulevard Apartments',
      location: 'Downtown District',
      status: 'Active',
      occupancy: '15/16',
      occupancyPercent: 94,
      revenue: 12800,
      revenueChange: '+5%',
      tasks: 1,
      initials: 'SB',
      color: '#8b5cf6'
    },
    {
      id: 3,
      name: 'Riverside Student Housing',
      location: 'Downtown District',
      status: 'Active',
      occupancy: '20/22',
      occupancyPercent: 91,
      revenue: 18500,
      revenueChange: '+5%',
      tasks: 4,
      initials: 'RS',
      color: '#f97316'
    },
    {
      id: 4,
      name: 'Oak Street Residences',
      location: 'Downtown District',
      status: 'Maintenance',
      occupancy: '6/10',
      occupancyPercent: 60,
      revenue: 5200,
      revenueChange: '+5%',
      tasks: 8,
      initials: 'OS',
      color: '#dc2626'
    },
    {
      id: 5,
      name: 'Maple Street Commons',
      location: 'Downtown District',
      status: 'Active',
      occupancy: '18/20',
      occupancyPercent: 90,
      revenue: 16200,
      revenueChange: '+5%',
      tasks: 2,
      initials: 'MS',
      color: '#6366f1'
    }
  ];

  const recentApplications = [
    {
      id: 1,
      name: 'John Smith',
      initials: 'JS',
      appliedDate: '2 days ago',
      property: 'Downtown Coliving Hub',
      status: 'Pending Review'
    },
    {
      id: 2,
      name: 'Maria Johnson',
      initials: 'MJ',
      appliedDate: '1 day ago',
      property: 'University District House',
      status: 'Pending Review'
    },
    {
      id: 3,
      name: 'Robert Brown',
      initials: 'RB',
      appliedDate: 'today',
      property: 'Sunset Boulevard Apartments',
      status: 'Pending Review'
    },
    {
      id: 4,
      name: 'Alice Lee',
      initials: 'AL',
      appliedDate: '3 days ago',
      property: 'Oak Street Residences',
      status: 'Pending Review'
    },
    {
      id: 5,
      name: 'David Wilson',
      initials: 'DW',
      appliedDate: '1 week ago',
      property: 'Maple Street Commons',
      status: 'Pending Review'
    },
    {
      id: 6,
      name: 'Sarah Taylor',
      initials: 'ST',
      appliedDate: '2 weeks ago',
      property: 'Riverside Student Housing',
      status: 'Pending Review'
    }
  ];

  const userName = user?.full_name || user?.username || 'User';

  return (
    <DashboardLayout title="">
      <Head>
        <title>Dashboard - Tink Property Management</title>
      </Head>
      
      <div className="dashboard-container">
        {/* Custom Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="dashboard-title">Dashboard</h1>
              <p className="welcome-message">
                Welcome back, <span className="user-name">{userName}</span>! Here's an overview of your property management operations.
              </p>
            </div>
            <div className="header-right">
              <div className="date-display">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Sunday, June 29, 2025
              </div>
            </div>
          </div>
        </div>
        {/* Top Metrics Row */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-info">
                <h3 className="metric-title">My Properties</h3>
                <div className="metric-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 21h18"/>
                    <path d="M5 21V7l8-4v18"/>
                    <path d="M19 21V11l-6-4"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="metric-content">
              <div className="metric-value">{propertiesCount}</div>
              <div className="metric-subtitle">{metrics.properties.subtitle}</div>
              <div className="metric-progress">
                <span className="metric-label">85% capacity</span>
                <span className="metric-change positive">{metrics.properties.change}</span>
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-info">
                <h3 className="metric-title">Total Rooms</h3>
                <div className="metric-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 21h18"/>
                    <path d="M5 21V7l8-4v18"/>
                    <path d="M19 21V11l-6-4"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="metric-content">
              <div className="metric-value">{roomsCount}</div>
              <div className="metric-subtitle">{metrics.rooms.subtitle}</div>
              <div className="metric-progress">
                <span className="metric-label">92% occupied</span>
                <span className="metric-change positive">{metrics.rooms.change}</span>
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-info">
                <h3 className="metric-title">Active Tenants</h3>
                <div className="metric-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="metric-content">
              <div className="metric-value">{tenantsCount}</div>
              <div className="metric-subtitle">{metrics.tenants.subtitle}</div>
              <div className="metric-progress">
                <span className="metric-label">Great retention</span>
                <span className="metric-change positive">{metrics.tenants.change}</span>
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-info">
                <h3 className="metric-title">Monthly Revenue</h3>
                <div className="metric-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="metric-content">
              <div className="metric-value">{revenueValue}</div>
              <div className="metric-subtitle">{metrics.revenue.subtitle}</div>
              <div className="metric-progress">
                <span className="metric-label">95% of target</span>
                <span className="metric-change positive">{metrics.revenue.change}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* Pending Tasks Section */}
          <div className="tasks-section">
            <div className="section-header">
              <div>
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

            <div className="tasks-scroll-container">
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
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td>{task.task}</td>
                      <td>{task.property}</td>
                      <td>
                        <span className={`priority-badge ${task.priority.toLowerCase()}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td>
                        <div className="due-date">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          {task.dueDate}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${task.status.toLowerCase().replace(' ', '-')}`}>
                          {task.status === 'In Progress' ? 'In Progress' : task.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="quick-actions-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Quick Actions</h2>
                <p className="section-subtitle">Frequently used actions</p>
              </div>
            </div>

            <div className="actions-grid">
              {quickActions.map((action, index) => (
                <div key={index} className={`action-card ${action.color}`}>
                  <div className="action-icon">
                    {action.icon}
                  </div>
                  <div className="action-content">
                    <h3 className="action-title">{action.title}</h3>
                    <p className="action-subtitle">{action.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* My Properties Section */}
        <div className="properties-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">My Properties</h2>
              <p className="section-subtitle">Manage and monitor your property portfolio</p>
            </div>
            <button className="view-all-btn">View All</button>
          </div>

          <div className="properties-container">
            <div className="properties-tabs">
              <button className="tab active">All Properties</button>
              <button className="tab">Active</button>
              <button className="tab">Maintenance</button>
            </div>

            <div className="properties-scroll-container">
              <div className="properties-table-container">
                <table className="properties-table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Status</th>
                    <th>Occupancy</th>
                    <th>Monthly Revenue</th>
                    <th>Tasks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((property) => (
                    <tr key={property.id}>
                      <td>
                        <div className="property-info-cell">
                          <div className="property-avatar" style={{ backgroundColor: property.color }}>
                            {property.initials}
                          </div>
                          <div className="property-details">
                            <div className="property-name">{property.name}</div>
                            <div className="property-location">{property.location}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${property.status.toLowerCase()}`}>
                          {property.status}
                        </span>
                      </td>
                      <td>
                        <div className="occupancy-cell">
                          <div className="occupancy-info">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                              <circle cx="12" cy="7" r="4"/>
                            </svg>
                            <span className="occupancy-text">{property.occupancy}</span>
                            <span className="occupancy-percent">{property.occupancyPercent}%</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="revenue-cell">
                          <div className="revenue-amount">$ {property.revenue.toLocaleString()}</div>
                          <div className="revenue-change">{property.revenueChange} vs last month</div>
                        </div>
                      </td>
                      <td>
                        <div className="tasks-cell">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                            <path d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          <span className="tasks-count">{property.tasks} pending</span>
                        </div>
                      </td>
                      <td>
                        <button className="manage-btn">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 20h9"/>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                          </svg>
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Applications Section */}
        <div className="applications-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Recent Applications</h2>
              <p className="section-subtitle">Latest tenant applications requiring review</p>
            </div>
            <button className="view-all-btn">View All Applications</button>
          </div>

          <div className="applications-scroll-container">
            <div className="applications-grid">
              {recentApplications.map((application) => (
                <div key={application.id} className="application-card">
                  <div className="application-header">
                    <div className="applicant-avatar">{application.initials}</div>
                    <span className="status-badge pending-review">{application.status}</span>
                  </div>
                  
                  <div className="application-content">
                    <h3 className="applicant-name">{application.name}</h3>
                    <div className="application-time">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12,6 12,12 16,14"/>
                      </svg>
                      Applied {application.appliedDate}
                    </div>
                    <div className="application-property">
                      <strong>Property:</strong> {application.property}
                    </div>
                  </div>

                  <button className="review-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10,9 9,9 8,9"/>
                    </svg>
                    Review
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          padding: 32px 20px;
          background: #f8fafc;
          min-height: 100vh;
          max-width: 1600px;
          margin: 0 auto;
        }

        /* Custom Header */
        .dashboard-header {
          margin-bottom: 40px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
        }

        .header-left {
          flex: 1;
        }

        .dashboard-title {
          font-size: 36px;
          font-weight: 800;
          color: #1e293b;
          margin: 0 0 8px 0;
          line-height: 1.1;
        }

        .welcome-message {
          font-size: 16px;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }

        .user-name {
          color: #6366f1;
          font-weight: 600;
        }

        .header-right {
          flex-shrink: 0;
        }

        .date-display {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        /* Metrics Grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          margin-bottom: 32px;
        }

        .metric-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
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
          margin-bottom: 16px;
        }

        .metric-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .metric-title {
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
          margin: 0;
        }

        .metric-icon {
          width: 24px;
          height: 24px;
          color: #64748b;
        }

        .metric-content {
          margin-top: 8px;
        }

        .metric-value {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 4px;
          line-height: 1;
        }

        .metric-subtitle {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 12px;
        }

        .metric-progress {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .metric-label {
          font-size: 14px;
          color: #64748b;
        }

        .metric-change {
          font-size: 14px;
          font-weight: 600;
        }

        .metric-change.positive {
          color: #10b981;
        }

        /* Main Content */
        .main-content {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 32px;
        }

        /* Section Headers */
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .section-title {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .section-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        /* Tasks Section */
        .tasks-section {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          height: 480px;
          display: flex;
          flex-direction: column;
        }

        .tasks-scroll-container {
          flex: 1;
          overflow-y: auto;
          margin-top: 16px;
        }

        .tasks-scroll-container::-webkit-scrollbar {
          width: 6px;
        }

        .tasks-scroll-container::-webkit-scrollbar-track {
          background: rgba(226, 232, 240, 0.3);
          border-radius: 3px;
        }

        .tasks-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }

        .add-task-btn {
          background: #6366f1;
          color: white;
          border: none;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .add-task-btn:hover {
          background: #4f46e5;
          transform: translateY(-1px);
        }

        .tasks-table-container {
          overflow-x: auto;
        }

        .tasks-table {
          width: 100%;
          border-collapse: collapse;
        }

        .tasks-table th {
          text-align: left;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
          border-bottom: 1px solid #e2e8f0;
          background: #fafafa;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .tasks-table td {
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
          color: #1e293b;
        }

        .priority-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .priority-badge.high {
          background: #fef2f2;
          color: #dc2626;
        }

        .priority-badge.medium {
          background: #fffbeb;
          color: #d97706;
        }

        .priority-badge.low {
          background: #f0fdf4;
          color: #16a34a;
        }

        .due-date {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #64748b;
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-badge.pending {
          background: #fef3c7;
          color: #d97706;
        }

        .status-badge.in-progress {
          background: #dbeafe;
          color: #2563eb;
        }

        .status-badge.completed {
          background: #dcfce7;
          color: #16a34a;
        }

        .status-badge.active {
          background: #dcfce7;
          color: #059669;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .status-badge.maintenance {
          background: #fef3c7;
          color: #d97706;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          text-transform: capitalize;
        }

        /* Quick Actions Section */
        .quick-actions-section {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          height: fit-content;
        }

        .actions-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .action-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.2s ease;
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
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .action-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        /* View All Button */
        .view-all-btn {
          background: transparent;
          color: #6366f1;
          border: none;
          padding: 8px 0;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .view-all-btn:hover {
          color: #4f46e5;
        }

        /* Properties Section */
        .properties-section {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          margin-top: 48px;
          margin-bottom: 32px;
        }

        .properties-container {
          margin-top: 20px;
          height: 500px;
          display: flex;
          flex-direction: column;
        }

        .properties-scroll-container {
          flex: 1;
          overflow-y: auto;
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

        .properties-tabs {
          display: flex;
          gap: 48px;
          margin: 32px 0 40px 0;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 12px;
          padding: 8px;
        }

        .tab {
          background: transparent;
          border: none;
          padding: 16px 32px;
          font-size: 15px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s ease;
          flex: 1;
          text-align: center;
        }

        .tab.active {
          color: #1e293b;
          background: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .tab:hover {
          color: #1e293b;
          background: rgba(255, 255, 255, 0.7);
        }

        .properties-table-container {
          overflow-x: auto;
        }

        .properties-table {
          width: 100%;
          border-collapse: collapse;
        }

        .properties-table th {
          text-align: left;
          padding: 20px 16px;
          font-size: 15px;
          font-weight: 600;
          color: #64748b;
          border-bottom: 1px solid #e2e8f0;
          background: #fafafa;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .properties-table td {
          padding: 24px 16px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 15px;
          color: #1e293b;
          vertical-align: middle;
        }

        .property-info-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .property-avatar {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 14px;
        }

        .property-details {
          flex: 1;
        }

        .property-name {
          font-weight: 700;
          font-size: 16px;
          margin-bottom: 4px;
          color: #1e293b;
        }

        .property-location {
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }

        .occupancy-cell {
          display: flex;
          align-items: center;
        }

        .occupancy-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .occupancy-text {
          font-weight: 600;
        }

        .occupancy-percent {
          color: #64748b;
        }

        .revenue-cell {
          text-align: left;
        }

        .revenue-amount {
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 4px;
        }

        .revenue-change {
          font-size: 12px;
          color: #10b981;
        }

        .tasks-cell {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .tasks-count {
          color: #64748b;
        }

        .manage-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: 1px solid #e2e8f0;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .manage-btn:hover {
          background: #f8fafc;
          border-color: #d1d5db;
          color: #1e293b;
        }

        /* Applications Section */
        .applications-section {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        .applications-scroll-container {
          height: 400px;
          overflow-y: auto;
          margin-top: 24px;
        }

        .applications-scroll-container::-webkit-scrollbar {
          width: 6px;
        }

        .applications-scroll-container::-webkit-scrollbar-track {
          background: rgba(226, 232, 240, 0.3);
          border-radius: 3px;
        }

        .applications-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }

        .applications-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .application-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .application-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .application-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .applicant-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #64748b;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
        }

        .status-badge.pending-review {
          background: #fef3c7;
          color: #d97706;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 600;
        }

        .application-content {
          margin-bottom: 24px;
        }

        .applicant-name {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 16px 0;
        }

        .application-time {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #64748b;
          margin-bottom: 8px;
        }

        .application-property {
          font-size: 14px;
          color: #64748b;
          line-height: 1.5;
        }

        .review-btn {
          width: 100%;
          background: #6366f1;
          color: white;
          border: none;
          padding: 14px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .review-btn:hover {
          background: #4f46e5;
          transform: translateY(-1px);
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .main-content {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .applications-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }

          .dashboard-container {
            padding: 24px 16px;
          }

          .header-content {
            flex-direction: column;
            gap: 16px;
          }

          .dashboard-title {
            font-size: 28px;
          }

          .welcome-message {
            font-size: 14px;
          }

          .date-display {
            align-self: flex-start;
          }

          .metric-card {
            padding: 16px;
          }

          .metric-value {
            font-size: 24px;
          }

          .tasks-section,
          .quick-actions-section,
          .properties-section,
          .applications-section {
            padding: 16px;
          }

          .tasks-section {
            height: auto;
          }

          .properties-container {
            height: auto;
          }

          .applications-scroll-container {
            height: auto;
          }

          .applications-grid {
            grid-template-columns: 1fr;
          }

          .properties-table-container {
            overflow-x: scroll;
          }

          .properties-table th,
          .properties-table td {
            padding: 12px 8px;
            font-size: 12px;
          }

          .property-avatar {
            width: 32px;
            height: 32px;
            font-size: 12px;
          }

          .revenue-amount {
            font-size: 14px;
          }
        }

        @media (max-width: 480px) {
          .dashboard-container {
            padding: 16px;
          }

          .dashboard-title {
            font-size: 24px;
          }

          .welcome-message {
            font-size: 13px;
          }

          .date-display {
            padding: 8px 12px;
            font-size: 12px;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .section-header {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }

          .add-task-btn {
            align-self: flex-start;
          }

          .properties-tabs {
            gap: 16px;
          }

          .tab {
            font-size: 12px;
          }

          .application-card {
            padding: 16px;
          }

          .applicant-name {
            font-size: 16px;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}

export default withAuth(Dashboard);