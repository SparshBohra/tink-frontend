import { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '../components/DashboardLayout';
import { withAuth } from '../lib/auth-context';
import { useAuth } from '../lib/auth-context';

// Icon Components
const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3L9.27 9.27L3 12l6.27 2.73L12 21l2.73-6.27L21 12l-6.27-2.73z"></path></svg>
);
const BriefcaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
);
const HouseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
);
const LightningIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
);
const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10m12 20V4m6 20V14"></path></svg>
);
const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
);
const TrendingUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
);
const TargetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
);

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
  const [propertyFilter, setPropertyFilter] = useState('All');
  const [currentMessage, setCurrentMessage] = useState<{ text: string; icon: React.ReactElement | null }>({ text: '', icon: null });
  const [isFading, setIsFading] = useState(false);
  const [isTyping, setIsTyping] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);
  
  const welcomeMessage = `Welcome back, ${user?.full_name || 'User'}! Here's an overview of your property management operations.`;
  
  const notificationMessages = [
    { text: "Here's what's happening with your properties.", icon: <SparklesIcon /> },
    { text: "You have 3 pending applications to review.", icon: <BriefcaseIcon /> },
    { text: "Downtown Hub is at 86% occupancy.", icon: <HouseIcon /> },
    { text: "2 maintenance requests are overdue.", icon: <LightningIcon /> },
    { text: "Revenue is 5% above target this month.", icon: <ChartIcon /> },
    { text: "Lease renewals start next week.", icon: <BellIcon /> },
    { text: "Your portfolio performance is excellent.", icon: <TrendingUpIcon /> },
    { text: "All critical tasks are on track.", icon: <TargetIcon /> }
  ];

  useEffect(() => {
    let rotationTimeout;
    if (isTyping) {
      if (currentMessage.text.length < welcomeMessage.length) {
        const typingTimeout = setTimeout(() => {
          setCurrentMessage({ text: welcomeMessage.substring(0, currentMessage.text.length + 1), icon: null });
        }, 40);
        return () => clearTimeout(typingTimeout);
      } else {
        rotationTimeout = setTimeout(() => setIsTyping(false), 3000); // Pause after typing
      }
    } else {
      // Fade and rotate notifications
      rotationTimeout = setTimeout(() => {
        setIsFading(true);
        setTimeout(() => {
          const nextIndex = (messageIndex + 1) % notificationMessages.length;
          setMessageIndex(nextIndex);
          setCurrentMessage(notificationMessages[nextIndex]);
          setIsFading(false);
          if (nextIndex === notificationMessages.length - 1) {
            // Restart the whole cycle
            setTimeout(() => {
              setIsFading(true);
              setTimeout(() => {
                setCurrentMessage({ text: '', icon: null });
                setMessageIndex(0);
                setIsTyping(true);
                setIsFading(false);
              }, 500);
            }, 5000);
          }
        }, 500); // Fade animation duration
      }, 5000); // Time message is displayed
    }
    return () => clearTimeout(rotationTimeout);
  }, [currentMessage, isTyping, messageIndex, notificationMessages, welcomeMessage]);
  
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

  // Add dynamic date logic
  const today = new Date();
  const weekday = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateString = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const filteredProperties = propertyFilter === 'All'
    ? properties
    : properties.filter((p) => p.status === propertyFilter);

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
              <div className="subtitle-container">
                <p className={`welcome-message ${isFading ? 'fading' : ''} ${isTyping ? 'typing' : 'notification'}`}>
                  {currentMessage.icon && <span className="message-icon">{currentMessage.icon}</span>}
                  <span className="message-text">{currentMessage.text}</span>
                  {isTyping && <span className="typing-cursor"></span>}
                </p>
              </div>
            </div>
            <div className="header-right">
              {/* Weekday on first line, date on second line, right aligned */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', minWidth: 180 }}>
                <span style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: '#94a3b8', fontWeight: 500, letterSpacing: 0.2, marginBottom: 2 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                  {weekday}
                </span>
                <span style={{ fontSize: '17px', color: '#334155', fontWeight: 600, letterSpacing: 0.1, lineHeight: 1.3, textAlign: 'right', width: '100%' }}>
                  {dateString}
                </span>
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
                        <th className="table-left">Task</th>
                        <th className="table-left">Property</th>
                        <th className="table-center">Priority</th>
                        <th className="table-left">Due Date</th>
                        <th className="table-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td className="table-left">{task.task}</td>
                      <td className="table-left">{task.property}</td>
                      <td className="table-center">
                        <span className={`priority-badge ${task.priority.toLowerCase()}`}>
                          {task.priority}
                        </span>
                          </td>
                      <td className="table-left"><span className="due-date-cell"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>{task.dueDate}</span></td>
                      <td className="table-center">
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
            {/* Filter Dropdown */}
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <label htmlFor="property-filter" style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>Filter:</label>
              <select
                id="property-filter"
                value={propertyFilter}
                onChange={e => setPropertyFilter(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 14 }}
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
            {/* Remove tabs, keep table always visible */}
            <div className="properties-scroll-container">
              <div className="properties-table-container">
                <table className="properties-table">
                <thead>
                  <tr>
                    <th className="table-left">Property</th>
                    <th className="table-left">Status</th>
                    <th className="table-left">Occupancy</th>
                    <th className="table-right">Monthly Revenue</th>
                    <th className="table-left">Tasks</th>
                    <th className="table-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                    {filteredProperties.map((property) => (
                    <tr key={property.id}>
                      <td className="table-left">{property.name}</td>
                      <td className="table-left">
                        <span className={`status-badge ${property.status.toLowerCase()}`}>
                          {property.status}
                        </span>
                      </td>
                      <td className="table-left">
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
                      <td className="table-right">
                        <div className="revenue-cell">
                          <div className="revenue-amount">$ {property.revenue.toLocaleString()}</div>
                          <div className="revenue-change">{property.revenueChange} vs last month</div>
                        </div>
                      </td>
                      <td className="table-left">
                        <div className="tasks-cell">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                            <path d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          <span className="tasks-count">{property.tasks} pending</span>
                        </div>
                      </td>
                      <td className="table-center">
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
          width: 100%;
          padding: 16px 20px 20px 20px; /* Reduced padding */
          background: #f8fafc;
          min-height: calc(100vh - 72px); /* Updated for new topbar height */
          box-sizing: border-box;
        }

        /* Custom Header */
        .dashboard-header {
          margin-bottom: 24px; /* Reduced margin */
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px; /* Reduced gap */
        }

        .header-left {
          flex: 1;
        }

        .dashboard-title {
          font-size: 22px; /* Reduced from 28px */
          font-weight: 700; /* Reduced from 800 */
          color: #1e293b;
          margin: 0 0 4px 0; /* Reduced margin */
          line-height: 1.15;
        }

        .subtitle-container {
          min-height: 22px; /* Reduced height */
        }

        .welcome-message {
          font-size: 14px; /* Reduced from 16px */
          color: #4b5563;
          margin: 0;
          line-height: 1.45;
          display: inline-flex;
          align-items: center;
          gap: 8px; /* Reduced gap */
        }

        .welcome-message.notification {
          transition: opacity 0.5s ease-in-out;
        }

        .welcome-message.fading {
          opacity: 0;
        }

        .message-icon svg {
          width: 16px; /* Reduced from 18px */
          height: 16px;
          color: #64748b;
        }
        
        .typing-cursor {
          display: inline-block;
          width: 2px;
          height: 14px; /* Reduced height */
          background-color: #4b5563;
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
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
          gap: 12px; /* Reduced gap */
          margin-bottom: 20px; /* Reduced margin */
        }

        .metric-card {
          background: white;
          border-radius: 6px; /* Reduced radius */
          padding: 14px; /* Reduced padding */
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
          margin-bottom: 12px; /* Reduced margin */
        }

        .metric-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .metric-title {
          font-size: 11px; /* Reduced font size */
          font-weight: 600;
          color: #64748b;
          margin: 0;
        }

        .metric-icon {
          width: 20px; /* Reduced size */
          height: 20px;
          color: #64748b;
        }

        .metric-content {
          margin-top: 8px;
        }

        .metric-value {
          font-size: 20px; /* Reduced from 24px */
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 3px; /* Reduced margin */
          line-height: 1;
        }

        .metric-subtitle {
          font-size: 11px; /* Reduced font size */
          color: #64748b;
          margin-bottom: 10px; /* Reduced margin */
        }

        .metric-progress {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .metric-label {
          font-size: 12px; /* Reduced font size */
          color: #64748b;
        }

        .metric-change {
          font-size: 12px; /* Reduced font size */
          font-weight: 600;
        }

        .metric-change.positive {
          color: #10b981;
        }

        /* Main Content */
        .main-content {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px; /* Reduced gap */
        }

        /* Section Headers */
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px; /* Reduced margin */
        }

        .section-title {
          font-size: 14px; /* Reduced font size */
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 3px 0; /* Reduced margin */
        }

        .section-subtitle {
          font-size: 12px; /* Reduced font size */
          color: #64748b;
          margin: 0;
        }

        /* Tasks Section */
        .tasks-section {
          background: white;
          border-radius: 6px; /* Reduced radius */
          padding: 18px; /* Reduced padding */
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          height: 400px; /* Reduced height */
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
          padding: 10px 14px; /* Reduced padding */
          border-radius: 6px; /* Reduced radius */
          font-size: 12px; /* Reduced font size */
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px; /* Reduced gap */
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

        /* Center align all table headers and cell values for both tables */
        .tasks-table th, .tasks-table td, .properties-table th, .properties-table td {
          text-align: center !important;
          font-size: 15px;
          padding: 16px 16px;
          vertical-align: middle;
          height: 56px;
          box-sizing: border-box;
        }

        .tasks-table th, .properties-table th {
          font-weight: 700;
          color: #1e293b;
          background: #f8fafc;
        }

        .tasks-table td, .properties-table td {
          font-weight: 400;
          color: #1e293b;
          background: #fff;
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

        .due-date-cell {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-weight: 500;
          color: #1e293b;
        }

        .due-date-cell svg {
          stroke: #64748b;
          stroke-width: 1.5;
          flex-shrink: 0;
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
          border-radius: 6px; /* Reduced radius */
          padding: 18px; /* Reduced padding */
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          height: fit-content;
        }

        .actions-grid {
          display: flex;
          flex-direction: column;
          gap: 12px; /* Reduced gap */
        }

        .action-card {
          display: flex;
          align-items: center;
          gap: 12px; /* Reduced gap */
          padding: 12px; /* Reduced padding */
          border-radius: 5px; /* Reduced radius */
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
          font-size: 14px; /* Reduced font size */
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 3px 0; /* Reduced margin */
        }

        .action-subtitle {
          font-size: 12px; /* Reduced font size */
          color: #64748b;
          margin: 0;
        }

        /* View All Button */
        .view-all-btn {
          background: #6366f1;
          color: white;
          border: none;
          padding: 10px 14px; /* Reduced padding */
          border-radius: 6px; /* Reduced radius */
          font-size: 12px; /* Reduced font size */
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px; /* Reduced gap */
          transition: all 0.2s ease;
        }

        .view-all-btn:hover {
          background: #4f46e5;
          transform: translateY(-1px);
        }

        /* Properties Section */
        .properties-section {
          background: white;
          border-radius: 6px; /* Reduced radius */
          padding: 20px; /* Reduced padding */
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          margin-top: 32px; /* Reduced margin */
          margin-bottom: 20px; /* Reduced margin */
        }

        .properties-container {
          margin-top: 16px; /* Reduced margin */
          height: 420px; /* Reduced height */
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

        .properties-table-container {
          width: 100%;
          overflow-x: auto;
          max-height: 350px; /* Reduced height */
          border-radius: 8px; /* Reduced radius */
          background: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .properties-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }

        .properties-table th {
          position: sticky;
          top: 0;
          background: #f8fafc;
          z-index: 2;
          font-size: 13px; /* Reduced font size */
          font-weight: 700;
          color: #1e293b;
          padding: 12px 10px; /* Reduced padding */
          border-bottom: 2px solid #e2e8f0;
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

        .occupancy-cell, .revenue-cell, .tasks-cell {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .revenue-cell {
          flex-direction: column;
          text-align: right;
        }

        .manage-btn {
          margin: 0 auto;
        }

        /* Applications Section */
        .applications-section {
          background: white;
          border-radius: 6px; /* Reduced radius */
          padding: 20px; /* Reduced padding */
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        .applications-scroll-container {
          height: 320px; /* Reduced height */
          overflow-y: auto;
          margin-top: 16px; /* Reduced margin */
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
          gap: 16px; /* Reduced gap */
        }

        .application-card {
          background: white;
          border-radius: 6px; /* Reduced radius */
          padding: 16px; /* Reduced padding */
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
          margin-bottom: 14px; /* Reduced margin */
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

          .application-card {
            padding: 16px;
          }

          .applicant-name {
            font-size: 16px;
          }
        }

        @media (max-width: 1024px) {
          .dashboard-container {
            padding: 20px 12px 24px 12px;
          }
        }

        /* Add utility classes for alignment */
        .table-left { text-align: left !important; }
        .table-right { text-align: right !important; }
        .table-center { text-align: center !important; }
        .due-date-cell { display: flex; align-items: center; gap: 6px; justify-content: flex-start; }
        .occupancy-cell { display: flex; align-items: center; gap: 6px; }
        .tasks-cell { display: flex; align-items: center; gap: 6px; }
        .revenue-cell { text-align: right; }

        /* Dark Mode Styles */
        :global(.dark-mode) .dashboard-container { background: transparent; }
        :global(.dark-mode) .metric-card, 
        :global(.dark-mode) .tasks-section, 
        :global(.dark-mode) .quick-actions-section, 
        :global(.dark-mode) .properties-section, 
        :global(.dark-mode) .applications-section,
        :global(.dark-mode) .action-card,
        :global(.dark-mode) .application-card {
          background: #111111 !important;
          border: 1px solid #333333 !important;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4) !important;
        }
        :global(.dark-mode) .metric-card:hover,
        :global(.dark-mode) .action-card:hover,
        :global(.dark-mode) .application-card:hover {
          background: #222222 !important;
          border-color: #ffffff !important;
        }
        :global(.dark-mode) .tasks-table th, 
        :global(.dark-mode) .properties-table th {
          background-color: #1a1a1a !important;
          border-bottom: 1px solid #333333 !important;
        }
        :global(.dark-mode) .tasks-table td, 
        :global(.dark-mode) .properties-table td {
          background-color: #111111 !important;
          border-bottom: 1px solid #333333 !important;
        }
        :global(.dark-mode) .tasks-table tbody tr:hover, 
        :global(.dark-mode) .properties-table tbody tr:hover {
          background-color: #222222 !important;
        }
        :global(.dark-mode) .add-task-btn,
        :global(.dark-mode) .view-all-btn,
        :global(.dark-mode) .review-btn {
            background: #1a1a1a !important;
            border: 1px solid #333333 !important;
        }
        :global(.dark-mode) .add-task-btn:hover,
        :global(.dark-mode) .view-all-btn:hover,
        :global(.dark-mode) .review-btn:hover {
            background: #2a2a2a !important;
            border-color: #ffffff !important;
        }
        :global(.dark-mode) .priority-badge,
        :global(.dark-mode) .status-badge {
            color: #ffffff !important;
        }
        :global(.dark-mode) .priority-badge.high,
        :global(.dark-mode) .status-badge.maintenance { background: rgba(239, 68, 68, 0.3); }
        :global(.dark-mode) .priority-badge.medium,
        :global(.dark-mode) .status-badge.pending { background: rgba(249, 115, 22, 0.3); }
        :global(.dark-mode) .priority-badge.low,
        :global(.dark-mode) .status-badge.completed,
        :global(.dark-mode) .status-badge.active { background: rgba(34, 197, 94, 0.3); }
        :global(.dark-mode) .status-badge.in-progress { background: rgba(59, 130, 246, 0.3); }
        :global(.dark-mode) .action-card.blue .action-icon { background: rgba(59, 130, 246, 0.3); }
        :global(.dark-mode) .action-card.green .action-icon { background: rgba(34, 197, 94, 0.3); }
        :global(.dark-mode) .action-card.purple .action-icon { background: rgba(139, 92, 246, 0.3); }
        :global(.dark-mode) .tasks-cell .task-count { background: rgba(139, 92, 246, 0.3); }
        :global(.dark-mode) select {
          background-color: #111111 !important;
          border-color: #333333 !important;
        }
        :global(.dark-mode) .occupancy-cell .occupancy-progress { background: #333333; }
        :global(.dark-mode) .occupancy-cell .occupancy-bar { background: #3b82f6; }
        :global(.dark-mode) .properties-table .btn-outline {
            background-color: #1a1a1a !important;
            border-color: #333333 !important;
        }
        :global(.dark-mode) .properties-table .btn-outline:hover {
            background-color: #2a2a2a !important;
            border-color: #ffffff !important;
        }
        :global(.dark-mode) .occupancy-cell .occupancy-bar { background: #3b82f6; }
        
        /* Custom black text for specific light-bg buttons in dark mode */
        :global(.dark-mode) .properties-table .btn-outline,
        :global(.dark-mode) .properties-table .btn-outline svg {
            color: #000000 !important;
            stroke: #000000 !important;
        }

        :global(.dark-mode) .status-badge.pending-review {
            color: #000000 !important;
        }

        :global(.dark-mode) .occupancy-cell .occupancy-bar { background: #3b82f6; }
        
        /* Custom black text for specific light-bg buttons in dark mode */
        :global(.dark-mode) .manage-btn {
            background-color: #f0f0f0 !important;
            color: #000000 !important;
        }

        :global(.dark-mode) .manage-btn svg {
            stroke: #000000 !important;
        }

        :global(.dark-mode) .status-badge.pending-review {
            background-color: #fef9c3 !important;
            color: #000000 !important;
        }
      `}</style>
    </DashboardLayout>
  );
}

export default withAuth(Dashboard); 