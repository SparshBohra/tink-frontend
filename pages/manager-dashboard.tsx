import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import DashboardLayout from '../components/DashboardLayout';
import { withAuth } from '../lib/auth-context';
import { useAuth } from '../lib/auth-context';
import ApplicationDetailModal from '../components/ApplicationDetailModal';
import { Application, Property, Room } from '../lib/types';

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
const useCounterAnimation = (targetValue: number, duration: number = 2000, isRevenue: boolean = false) => {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    let startTime: number | undefined;
    let animationId: number | undefined;

    const animate = (timestamp: number) => {
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
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [propertyFilter, setPropertyFilter] = useState('All');
  const [currentMessage, setCurrentMessage] = useState<{ text: string; icon: React.ReactElement | null }>({ text: '', icon: null });
  const [isFading, setIsFading] = useState(false);
  const [isTyping, setIsTyping] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    task: '',
    property: '',
    priority: 'Medium',
    dueDate: '',
    status: 'Pending'
  });
  
  // Application modal state
  const [isApplicationDetailOpen, setIsApplicationDetailOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  
  const [tasks, setTasks] = useState([
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
  ]);
  
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
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  };
  
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

  const quickActions = [
    { 
      title: 'View Properties',
      subtitle: 'Manage your assigned properties',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9,22 9,12 15,12 15,22"/>
        </svg>
      ), 
      color: 'blue',
      link: '/properties'
    },
    { 
      title: 'Review Applications',
      subtitle: 'Process tenant applications',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
      ), 
      color: 'purple',
      link: '/applications'
    },
    { 
      title: 'Manage Tenants',
      subtitle: 'View and manage tenants',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ), 
      color: 'green',
      link: '/tenants'
    },
    { 
      title: 'Add Property',
      subtitle: 'Register new property',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      ), 
      color: 'orange',
      link: '/properties/add'
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

  const recentApplications: Application[] = [
    {
      id: 1,
      tenant_name: 'John Smith',
      tenant_email: 'john.smith@email.com',
      tenant_phone: '+1-555-0101',
      property_ref: 1,
      desired_move_in_date: '2024-01-15',
      rent_budget: 1200,
      status: 'pending',
      priority_score: 85,
      days_pending: 2,
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-10T10:00:00Z',
      decision_date: null,
      decision_notes: null,
      start_date: null,
      end_date: null,
      monthly_rent: null,
      security_deposit: null,
      has_conflicts: false,
      conflicting_applications: [],
      recommended_rooms: [1, 2],
      applicant_initials: 'JS',
      appliedDate: '2 days ago',
      property_name: 'Downtown Coliving Hub'
    },
    {
      id: 2,
      tenant_name: 'Maria Johnson',
      tenant_email: 'maria.johnson@email.com',
      tenant_phone: '+1-555-0102',
      property_ref: 2,
      desired_move_in_date: '2024-01-16',
      rent_budget: 1100,
      status: 'pending',
      priority_score: 92,
      days_pending: 1,
      created_at: '2024-01-11T14:30:00Z',
      updated_at: '2024-01-11T14:30:00Z',
      decision_date: null,
      decision_notes: null,
      start_date: null,
      end_date: null,
      monthly_rent: null,
      security_deposit: null,
      has_conflicts: false,
      conflicting_applications: [],
      recommended_rooms: [3, 4],
      applicant_initials: 'MJ',
      appliedDate: '1 day ago',
      property_name: 'University District House'
    },
    {
      id: 3,
      tenant_name: 'Robert Brown',
      tenant_email: 'robert.brown@email.com',
      tenant_phone: '+1-555-0103',
      property_ref: 3,
      desired_move_in_date: '2024-01-12',
      rent_budget: 1300,
      status: 'pending',
      priority_score: 78,
      days_pending: 0,
      created_at: '2024-01-12T09:15:00Z',
      updated_at: '2024-01-12T09:15:00Z',
      decision_date: null,
      decision_notes: null,
      start_date: null,
      end_date: null,
      monthly_rent: null,
      security_deposit: null,
      has_conflicts: false,
      conflicting_applications: [],
      recommended_rooms: [5, 6],
      applicant_initials: 'RB',
      appliedDate: 'today',
      property_name: 'Sunset Boulevard Apartments'
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

  const handleAddTask = () => {
    setShowTaskModal(true);
  };

  const handleTaskFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTaskForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.task || !taskForm.property || !taskForm.dueDate) {
      return;
    }

    const newTask = {
      id: tasks.length + 1,
      task: taskForm.task,
      property: taskForm.property,
      priority: taskForm.priority,
      dueDate: taskForm.dueDate,
      status: taskForm.status
    };

    setTasks(prev => [...prev, newTask]);
    setTaskForm({
      task: '',
      property: '',
      priority: 'Medium',
      dueDate: '',
      status: 'Pending'
    });
    setShowTaskModal(false);
  };

  const handleCancelTask = () => {
    setTaskForm({
      task: '',
      property: '',
      priority: 'Medium',
      dueDate: '',
      status: 'Pending'
    });
    setShowTaskModal(false);
  };

  // Demo properties and rooms data for the modal
  const demoProperties: Property[] = [
    { 
      id: 1, 
      landlord: 1,
      name: 'Downtown Coliving Hub', 
      address: '123 Main St',
      address_line1: '123 Main St',
      city: 'Downtown', 
      state: 'CA', 
      postal_code: '90210',
      country: 'USA',
      full_address: '123 Main St, Downtown, CA 90210',
      property_type: 'Apartment',
      timezone: 'America/Los_Angeles',
      timezone_display: 'Pacific Time',
      total_rooms: 2,
      vacant_rooms: 2,
      rent_type: 'per_room', 
      monthly_rent: 1200, 
      created_at: '2024-01-01T00:00:00Z'
    },
    { 
      id: 2, 
      landlord: 1,
      name: 'University District House', 
      address: '456 College Ave',
      address_line1: '456 College Ave',
      city: 'University District', 
      state: 'CA', 
      postal_code: '90211',
      country: 'USA',
      full_address: '456 College Ave, University District, CA 90211',
      property_type: 'House',
      timezone: 'America/Los_Angeles',
      timezone_display: 'Pacific Time',
      total_rooms: 2,
      vacant_rooms: 1,
      rent_type: 'per_room', 
      monthly_rent: 1100, 
      created_at: '2024-01-01T00:00:00Z'
    },
    { 
      id: 3, 
      landlord: 1,
      name: 'Sunset Boulevard Apartments', 
      address: '789 Sunset Blvd',
      address_line1: '789 Sunset Blvd',
      city: 'West Hollywood', 
      state: 'CA', 
      postal_code: '90212',
      country: 'USA',
      full_address: '789 Sunset Blvd, West Hollywood, CA 90212',
      property_type: 'Apartment',
      timezone: 'America/Los_Angeles',
      timezone_display: 'Pacific Time',
      total_rooms: 2,
      vacant_rooms: 2,
      rent_type: 'per_room', 
      monthly_rent: 1300, 
      created_at: '2024-01-01T00:00:00Z'
    }
  ];

  const demoRooms: Room[] = [
    { 
      id: 1, 
      property_ref: 1, 
      name: 'Room A1', 
      room_type: 'standard', 
      max_capacity: 1,
      current_occupancy: 0,
      monthly_rent: 1200, 
      is_vacant: true, 
      occupancy_rate: 0,
      property_name: 'Downtown Coliving Hub',
      can_add_tenant: true,
      created_at: '2024-01-01T00:00:00Z'
    },
    { 
      id: 2, 
      property_ref: 1, 
      name: 'Room A2', 
      room_type: 'standard', 
      max_capacity: 1,
      current_occupancy: 0,
      monthly_rent: 1200, 
      is_vacant: true, 
      occupancy_rate: 0,
      property_name: 'Downtown Coliving Hub',
      can_add_tenant: true,
      created_at: '2024-01-01T00:00:00Z'
    },
    { 
      id: 3, 
      property_ref: 2, 
      name: 'Room B1', 
      room_type: 'suite', 
      max_capacity: 1,
      current_occupancy: 0,
      monthly_rent: 1100, 
      is_vacant: true, 
      occupancy_rate: 0,
      property_name: 'University District House',
      can_add_tenant: true,
      created_at: '2024-01-01T00:00:00Z'
    },
    { 
      id: 4, 
      property_ref: 2, 
      name: 'Room B2', 
      room_type: 'standard', 
      max_capacity: 1,
      current_occupancy: 1,
      monthly_rent: 1100, 
      is_vacant: false, 
      occupancy_rate: 100,
      property_name: 'University District House',
      can_add_tenant: false,
      created_at: '2024-01-01T00:00:00Z'
    },
    { 
      id: 5, 
      property_ref: 3, 
      name: 'Room C1', 
      room_type: 'studio', 
      max_capacity: 1,
      current_occupancy: 0,
      monthly_rent: 1300, 
      is_vacant: true, 
      occupancy_rate: 0,
      property_name: 'Sunset Boulevard Apartments',
      can_add_tenant: true,
      created_at: '2024-01-01T00:00:00Z'
    },
    { 
      id: 6, 
      property_ref: 3, 
      name: 'Room C2', 
      room_type: 'standard', 
      max_capacity: 1,
      current_occupancy: 0,
      monthly_rent: 1300, 
      is_vacant: true, 
      occupancy_rate: 0,
      property_name: 'Sunset Boulevard Apartments',
      can_add_tenant: true,
      created_at: '2024-01-01T00:00:00Z'
    }
  ];

  // Handler functions for the modal
  const handleViewApplication = (application: Application) => {
    setSelectedApplication(application);
    setIsApplicationDetailOpen(true);
  };

  const handleCloseModal = () => {
    setIsApplicationDetailOpen(false);
    setSelectedApplication(null);
  };

  const handleApprove = (applicationId: number, propertyId: number) => {
    console.log('Approve application:', applicationId, propertyId);
    // Here you would normally call the API
    alert(`Application ${applicationId} approved!`);
    handleCloseModal();
  };

  const handleReject = (applicationId: number) => {
    console.log('Reject application:', applicationId);
    // Here you would normally call the API
    alert(`Application ${applicationId} rejected!`);
    handleCloseModal();
  };

  const handleAssignRoom = (application: Application) => {
    console.log('Assign room for application:', application.id);
    // Here you would normally open room assignment modal
    alert(`Opening room assignment for ${application.tenant_name}`);
  };

  // Helper functions for display
  const getApplicantInitials = (application: Application) => {
    if (application.tenant_name) {
      return application.tenant_name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return 'N/A';
  };

  const getPropertyName = (application: Application) => {
    const property = demoProperties.find(p => p.id === application.property_ref);
    return property ? property.name : 'Unknown Property';
  };

  const getTimeSinceApplication = (application: Application) => {
    const daysAgo = application.days_pending || 0;
    if (daysAgo === 0) return 'today';
    if (daysAgo === 1) return '1 day ago';
    return `${daysAgo} days ago`;
  };

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
                <button className="add-task-btn" onClick={handleAddTask}>
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
                      <td className="table-left">
                        <span className="date-highlight">
                          {formatDate(task.dueDate)}
                        </span>
                      </td>
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
                    <div 
                      key={index} 
                      className={`action-card ${action.color}`}
                      onClick={() => router.push(action.link)}
                      style={{ cursor: 'pointer' }}
                    >
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

        {/* Rent History Section */}
        <div className="rent-history-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Rent History</h2>
              <p className="section-subtitle">Recent rent collection logs and payment history</p>
            </div>
            <Link href="/accounting">
              <button className="view-all-btn">View All</button>
            </Link>
          </div>
          
          <div className="rent-history-content">
            <div className="rent-summary-cards">
              <div className="summary-card collected">
                <div className="summary-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div className="summary-content">
                  <div className="summary-value">$38,400</div>
                  <div className="summary-label">Collected This Month</div>
                </div>
              </div>

              <div className="summary-card pending">
                <div className="summary-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                </div>
                <div className="summary-content">
                  <div className="summary-value">$7,200</div>
                  <div className="summary-label">Pending Collection</div>
                </div>
              </div>

              <div className="summary-card overdue">
                <div className="summary-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                </div>
                <div className="summary-content">
                  <div className="summary-value">$2,800</div>
                  <div className="summary-label">Overdue</div>
                </div>
              </div>
            </div>

            <div className="rent-logs-container">
              <div className="rent-logs-header">
                <h3>Recent Rent Collections</h3>
                <div className="filter-controls">
                  <div className="filter-group">
                    <label className="filter-label">Property:</label>
                    <select className="filter-select">
                      <option value="all">All Properties</option>
                      <option value="sunset-apartments">Sunset Apartments</option>
                      <option value="oak-street">Oak Street Complex</option>
                      <option value="downtown-lofts">Downtown Lofts</option>
                    </select>
                  </div>
                  
                  <div className="filter-group">
                    <label className="filter-label">Status:</label>
                    <select className="filter-select">
                      <option value="all">All Status</option>
                      <option value="collected">Collected</option>
                      <option value="pending">Pending</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                  
                  <div className="filter-group">
                    <label className="filter-label">Time Period:</label>
                    <select className="filter-select">
                      <option value="all">All Time</option>
                      <option value="this-month">This Month</option>
                      <option value="last-month">Last Month</option>
                      <option value="last-3-months">Last 3 Months</option>
                      <option value="this-year">This Year</option>
                    </select>
                  </div>
                  
                  <button className="filter-reset-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                      <path d="M3 3v5h5"/>
                    </svg>
                    Reset
                  </button>
                </div>
              </div>

              <div className="rent-logs-table-container">
                <table className="rent-logs-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Tenant</th>
                      <th>Property</th>
                      <th>Unit</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Dec 15, 2024</td>
                      <td>
                        <div className="tenant-info">
                          <div className="tenant-avatar">JS</div>
                          <span>John Smith</span>
                        </div>
                      </td>
                      <td>Sunset Apartments</td>
                      <td>Unit 2A</td>
                      <td className="amount-cell">$1,200</td>
                      <td><span className="status-badge collected">Collected</span></td>
                      <td>Bank Transfer</td>
                    </tr>
                    <tr>
                      <td>Dec 14, 2024</td>
                      <td>
                        <div className="tenant-info">
                          <div className="tenant-avatar">MJ</div>
                          <span>Maria Johnson</span>
                        </div>
                      </td>
                      <td>Oak Street Complex</td>
                      <td>Unit 5B</td>
                      <td className="amount-cell">$1,450</td>
                      <td><span className="status-badge collected">Collected</span></td>
                      <td>Credit Card</td>
                    </tr>
                    <tr>
                      <td>Dec 13, 2024</td>
                      <td>
                        <div className="tenant-info">
                          <div className="tenant-avatar">RW</div>
                          <span>Robert Wilson</span>
                        </div>
                      </td>
                      <td>Downtown Lofts</td>
                      <td>Unit 12</td>
                      <td className="amount-cell">$1,800</td>
                      <td><span className="status-badge collected">Collected</span></td>
                      <td>ACH</td>
                    </tr>
                    <tr>
                      <td>Dec 12, 2024</td>
                      <td>
                        <div className="tenant-info">
                          <div className="tenant-avatar">LB</div>
                          <span>Lisa Brown</span>
                        </div>
                      </td>
                      <td>Sunset Apartments</td>
                      <td>Unit 1C</td>
                      <td className="amount-cell">$1,100</td>
                      <td><span className="status-badge pending">Pending</span></td>
                      <td>Bank Transfer</td>
                    </tr>
                    <tr>
                      <td>Dec 10, 2024</td>
                      <td>
                        <div className="tenant-info">
                          <div className="tenant-avatar">DM</div>
                          <span>David Miller</span>
                        </div>
                      </td>
                      <td>Oak Street Complex</td>
                      <td>Unit 3A</td>
                      <td className="amount-cell">$1,350</td>
                      <td><span className="status-badge overdue">Overdue</span></td>
                      <td>-</td>
                    </tr>
                    <tr>
                      <td>Dec 8, 2024</td>
                      <td>
                        <div className="tenant-info">
                          <div className="tenant-avatar">ST</div>
                          <span>Sarah Taylor</span>
                        </div>
                      </td>
                      <td>Downtown Lofts</td>
                      <td>Unit 8</td>
                      <td className="amount-cell">$1,650</td>
                      <td><span className="status-badge collected">Collected</span></td>
                      <td>Credit Card</td>
                    </tr>
                    <tr>
                      <td>Dec 5, 2024</td>
                      <td>
                        <div className="tenant-info">
                          <div className="tenant-avatar">KA</div>
                          <span>Kevin Anderson</span>
                        </div>
                      </td>
                      <td>Sunset Apartments</td>
                      <td>Unit 4B</td>
                      <td className="amount-cell">$1,250</td>
                      <td><span className="status-badge collected">Collected</span></td>
                      <td>ACH</td>
                    </tr>
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
            <button 
              className="view-all-btn"
              onClick={() => router.push('/applications')}
            >
              View All Applications
            </button>
                </div>

          <div className="applications-scroll-container">
            <div className="applications-grid">
              {recentApplications.map((application) => (
                <div key={application.id} className="application-card">
                  <div className="application-header">
                    <div className="applicant-avatar">{getApplicantInitials(application)}</div>
                    <span className="status-badge pending-review">PENDING REVIEW</span>
                </div>
                  
                  <div className="application-content">
                    <h3 className="applicant-name">{application.tenant_name}</h3>
                    <div className="application-time">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12,6 12,12 16,14"/>
                      </svg>
                      Applied {getTimeSinceApplication(application)}
              </div>
                    <div className="application-property">
                      <span className="detail-label">Property:</span> {getPropertyName(application)}
                  </div>
              </div>

                  <button 
                    className="review-btn"
                    onClick={() => handleViewApplication(application)}
                  >
                    View Application
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Task Modal */}
      {showTaskModal && (
        <div className="task-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Task</h2>
              <button 
                className="modal-close"
                onClick={handleCancelTask}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitTask}>
              <div className="modal-section">
                <label className="form-label">Task Description*</label>
                <input
                  type="text"
                  name="task"
                  value={taskForm.task}
                  onChange={handleTaskFormChange}
                  className="form-input"
                  placeholder="Enter task description"
                  required
                />
              </div>

              <div className="modal-section">
                <label className="form-label">Property*</label>
                <select
                  name="property"
                  value={taskForm.property}
                  onChange={handleTaskFormChange}
                  className="form-input"
                  required
                >
                  <option value="">Select a property</option>
                  {properties.map(property => (
                    <option key={property.id} value={property.name}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-section">
                <label className="form-label">Priority</label>
                <select
                  name="priority"
                  value={taskForm.priority}
                  onChange={handleTaskFormChange}
                  className="form-input"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="modal-section">
                <label className="form-label">Due Date*</label>
                <input
                  type="date"
                  name="dueDate"
                  value={taskForm.dueDate}
                  onChange={handleTaskFormChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button"
                  onClick={handleCancelTask}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="submit-btn"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Application Detail Modal */}
      <ApplicationDetailModal
        isOpen={isApplicationDetailOpen}
        application={selectedApplication}
        properties={demoProperties}
        rooms={demoRooms}
        onClose={handleCloseModal}
        onApprove={handleApprove}
        onReject={handleReject}
        onAssignRoom={handleAssignRoom}
      />
      
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

        .date-highlight {
          background-color: #f1f5f9;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
          color: #334155;
        }

        /* Main Content */
        .main-content {
          display: grid;
          grid-template-columns: 3fr 1fr;
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
          margin-top: 0;
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
          background: #4f46e5;
          color: white;
          border: none;
          padding: 10px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          margin-right: 4px;
          margin-top: 2px;
        }

        .add-task-btn:hover {
          background: #3730a3;
          transform: translateY(-1px);
        }

        .tasks-table-container {
          overflow: hidden;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .tasks-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .tasks-table thead {
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .tasks-table tbody {
          overflow-y: auto;
          display: block;
          height: calc(100% - 57px); /* Adjust based on header height */
        }

        .tasks-table tbody::-webkit-scrollbar {
          width: 6px;
        }

        .tasks-table tbody::-webkit-scrollbar-track {
          background: rgba(226, 232, 240, 0.3);
          border-radius: 3px;
        }

        .tasks-table tbody::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }

        .tasks-table tr {
          display: table;
          width: 100%;
          table-layout: fixed;
        }

        /* Add hover effect for table rows */
        .tasks-table tbody tr {
          transition: background-color 0.2s ease;
        }

        .tasks-table tbody tr:hover {
          background-color: #f9fafb;
        }

        /* Set column widths for proper spacing */
        .tasks-table th:nth-child(1), .tasks-table td:nth-child(1) { width: 30%; }
        .tasks-table th:nth-child(2), .tasks-table td:nth-child(2) { width: 25%; }
        .tasks-table th:nth-child(3), .tasks-table td:nth-child(3) { width: 15%; }
        .tasks-table th:nth-child(4), .tasks-table td:nth-child(4) { width: 15%; }
        .tasks-table th:nth-child(5), .tasks-table td:nth-child(5) { width: 15%; }

        /* Table header and cell styling for both tables */
        .tasks-table th, .tasks-table td {
          text-align: left !important;
          font-size: 14px;
          padding: 12px 16px;
          vertical-align: middle;
          height: 48px;
          box-sizing: border-box;
          border-bottom: 1px solid #f1f5f9;
        }

        .tasks-table th {
          font-weight: 600;
          color: #9ca3af;
          background: #ffffff;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #e5e7eb;
        }

        .tasks-table td {
          font-weight: 400;
          color: #374151;
          background: #fff;
        }

        /* Center align priority and status columns */
        .tasks-table th:nth-child(3), 
        .tasks-table th:nth-child(5),
        .tasks-table td:nth-child(3), 
        .tasks-table td:nth-child(5) {
          text-align: center !important;
        }

        .priority-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          text-transform: capitalize;
          display: inline-block;
        }

        .priority-badge.high {
          background: #fee2e2;
          color: #dc2626;
        }

        .priority-badge.medium {
          background: #fef3c7;
          color: #d97706;
        }

        .priority-badge.low {
          background: #dcfce7;
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
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          display: inline-block;
        }

        .status-badge.pending {
          background: #fed7aa;
          color: #ea580c;
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
          color: #16a34a;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          text-transform: capitalize;
          display: inline-block;
        }

        .status-badge.maintenance {
          background: #fef3c7;
          color: #d97706;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          text-transform: capitalize;
          display: inline-block;
        }

        /* Quick Actions Section */
        .quick-actions-section {
          background: white;
          border-radius: 6px; /* Reduced radius */
          padding: 18px; /* Reduced padding */
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          height: 400px; /* Match tasks section height */
          display: flex;
          flex-direction: column;
        }

        .actions-grid {
          display: flex;
          flex-direction: column;
          gap: 12px; /* Reduced gap */
          flex: 1;
          justify-content: flex-start;
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

        .action-card.orange {
          background: #fff7ed;
          border-color: #fed7aa;
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

        .action-card.orange .action-icon {
          background: #f97316;
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
          background: #4f46e5;
          color: white;
          border: none;
          padding: 12px 18px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          margin-top: 4px;
          margin-right: 4px;
        }

        .view-all-btn:hover {
          background: #3730a3;
          transform: translateY(-1px);
        }

        /* Properties Section */
        .properties-section {
          background: white;
          border-radius: 6px; /* Reduced radius */
          padding: 18px; /* Reduced padding */
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
          border-collapse: collapse;
          table-layout: fixed;
        }

        /* Add hover effect for properties table rows */
        .properties-table tbody tr {
          transition: background-color 0.2s ease;
        }

        .properties-table tbody tr:hover {
          background-color: #f9fafb;
        }

        /* Set column widths for properties table */
        .properties-table th:nth-child(1), .properties-table td:nth-child(1) { width: 25%; }
        .properties-table th:nth-child(2), .properties-table td:nth-child(2) { width: 15%; }
        .properties-table th:nth-child(3), .properties-table td:nth-child(3) { width: 20%; }
        .properties-table th:nth-child(4), .properties-table td:nth-child(4) { width: 20%; }
        .properties-table th:nth-child(5), .properties-table td:nth-child(5) { width: 15%; }
        .properties-table th:nth-child(6), .properties-table td:nth-child(6) { width: 15%; }

        /* Center align specific columns for properties table */
        .properties-table th:nth-child(2),
        .properties-table th:nth-child(3), 
        .properties-table th:nth-child(4),
        .properties-table th:nth-child(5),
        .properties-table th:nth-child(6),
        .properties-table td:nth-child(2),
        .properties-table td:nth-child(3), 
        .properties-table td:nth-child(4),
        .properties-table td:nth-child(5),
        .properties-table td:nth-child(6) {
          text-align: center !important;
        }

        /* Fix actions column cell positioning */
        .properties-table td:nth-child(6) {
          position: relative;
          overflow: hidden;
        }

        /* Properties table header and cell styling */
        .properties-table th {
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

        .properties-table td {
          padding: 12px 16px;
          vertical-align: middle;
          height: 48px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
          color: #374151;
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
          gap: 6px;
        }

        .occupancy-info {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .occupancy-text {
          font-weight: 500;
          color: #374151;
        }

        .occupancy-percent {
          color: #6b7280;
          font-size: 13px;
        }

        .revenue-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .revenue-amount {
          font-weight: 600;
          color: #111827;
          font-size: 14px;
        }

        .revenue-change {
          color: #16a34a;
          font-size: 12px;
          font-weight: 500;
        }

        .tasks-cell {
          display: flex;
          align-items: center;
          gap: 6px;
          justify-content: center;
        }

        .tasks-count {
          color: #6b7280;
          font-size: 13px;
        }

        .manage-btn {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s ease;
          margin: 0 auto;
        }

        .manage-btn:hover {
          background: #3730a3;
        }

        /* Applications Section */
        .applications-section {
          background: white;
          border-radius: 6px; /* Reduced radius */
          padding: 18px; /* Reduced padding */
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        .applications-scroll-container {
          flex: 1;
          overflow-y: auto;
          margin-top: 0;
        }

        .applications-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .application-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          background: white;
          transition: all 0.2s ease;
        }

        .application-card:hover {
          background: #f9fafb;
          border-color: #cbd5e1;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .application-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .applicant-avatar {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: #eef2ff;
          color: #4f46e5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 12px;
        }

        .status-badge.pending-review {
          background: #fef3c7;
          color: #d97706;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .application-content {
          flex: 1;
        }

        .applicant-name {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 8px;
        }
        
        .application-time {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #64748b;
          margin-bottom: 4px;
        }
        
        .application-property {
          font-size: 12px;
          color: #64748b;
        }
        
        .detail-label {
          font-weight: 600;
          color: #374151;
        }

        .review-btn {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;
          width: 100%;
          margin-top: auto;
        }

        .review-btn:hover {
          background: #3730a3;
          transform: translateY(-1px);
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .main-content {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          
          .applications-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 900px) {
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
        .occupancy-cell { display: flex; align-items: center; justify-content: center; gap: 6px; }
        .tasks-cell { display: flex; align-items: center; gap: 6px; }
        .revenue-cell { }

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
        :global(.dark-mode) .status-badge.pending { background: rgba(245, 158, 11, 0.3); }
        :global(.dark-mode) .priority-badge.low,
        :global(.dark-mode) .status-badge.completed,
        :global(.dark-mode) .status-badge.active { background: rgba(34, 197, 94, 0.3); }
        :global(.dark-mode) .status-badge.in-progress { background: rgba(59, 130, 246, 0.3); }
        :global(.dark-mode) .action-card.blue .action-icon { background: rgba(59, 130, 246, 0.3); }
        :global(.dark-mode) .action-card.green .action-icon { background: rgba(34, 197, 94, 0.3); }
        :global(.dark-mode) .action-card.purple .action-icon { background: rgba(139, 92, 246, 0.3); }
        :global(.dark-mode) .action-card.orange .action-icon { background: rgba(249, 115, 22, 0.3); }
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

        :global(.dark-mode) .date-highlight {
          background-color: #334155;
          color: #e2e8f0;
        }

        /* Task Modal */
        .task-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          padding: 24px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .modal-header h2 {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close:hover {
          color: #374151;
        }

        .modal-section {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 6px;
        }

        .form-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          color: #374151;
          background: white;
          box-sizing: border-box;
        }

        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }

        .cancel-btn {
          background: #f9fafb;
          color: #374151;
          border: 1px solid #d1d5db;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cancel-btn:hover {
          background: #f3f4f6;
        }

        .submit-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .submit-btn:hover {
          background: #2563eb;
        }

        /* Dark mode modal styles */
        :global(.dark-mode) .modal-content {
          background: #1a1a1a !important;
          color: #ffffff !important;
        }

        :global(.dark-mode) .modal-header h2 {
          color: #ffffff !important;
        }

        :global(.dark-mode) .form-label {
          color: #e5e7eb !important;
        }

        :global(.dark-mode) .form-input {
          background: #111111 !important;
          border-color: #374151 !important;
          color: #ffffff !important;
        }

        :global(.dark-mode) .form-input:focus {
          border-color: #3b82f6 !important;
        }

        :global(.dark-mode) .cancel-btn {
          background: #374151 !important;
          color: #e5e7eb !important;
          border-color: #4b5563 !important;
        }

        :global(.dark-mode) .cancel-btn:hover {
          background: #4b5563 !important;
        }

        /* Rent History Section */
        .rent-history-section {
          background: white;
          border-radius: 6px;
          padding: 18px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          margin-top: 24px;
          margin-bottom: 24px;
        }

        .rent-history-content {
          margin-top: 16px;
        }

        .rent-summary-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .summary-card {
          background: white;
          border-radius: 6px;
          padding: 16px;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .summary-card.collected {
          border-color: #16a34a;
          background: #f0fdf4;
        }

        .summary-card.pending {
          border-color: #d97706;
          background: #fffbeb;
        }

        .summary-card.overdue {
          border-color: #dc2626;
          background: #fef2f2;
        }

        .summary-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .summary-card.collected .summary-icon {
          background: #dcfce7;
          color: #16a34a;
        }

        .summary-card.pending .summary-icon {
          background: #fef3c7;
          color: #d97706;
        }

        .summary-card.overdue .summary-icon {
          background: #fee2e2;
          color: #dc2626;
        }

        .summary-content {
          flex: 1;
        }

        .summary-value {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 4px 0;
        }

        .summary-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
          margin: 0;
        }

        .rent-logs-container {
          margin-top: 20px;
        }

        .rent-logs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .rent-logs-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .filter-controls {
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
          background: #f8fafc;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        .filter-select {
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 13px;
          color: #374151;
          background: white;
          min-width: 140px;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .filter-select:hover {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .filter-select:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .filter-reset-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: white;
          color: #64748b;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-reset-btn:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #475569;
        }

        .filter-reset-btn:active {
          transform: translateY(1px);
        }

        .rent-logs-table-container {
          overflow-x: auto;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
        }

        .rent-logs-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .rent-logs-table th {
          background: #f8fafc;
          color: #64748b;
          font-weight: 600;
          padding: 12px 8px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .rent-logs-table td {
          padding: 12px 8px;
          border-bottom: 1px solid #f1f5f9;
          color: #374151;
        }

        .rent-logs-table tbody tr:hover {
          background: #f8fafc;
        }

        .tenant-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tenant-avatar {
          width: 28px;
          height: 28px;
          border-radius: 4px;
          background: #e0e7ff;
          color: #6366f1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .amount-cell {
          font-weight: 600;
          color: #1f2937;
        }

        .status-badge.collected {
          background: #dcfce7;
          color: #16a34a;
        }

        .status-badge.pending {
          background: #fef3c7;
          color: #d97706;
        }

        .status-badge.overdue {
          background: #fee2e2;
          color: #dc2626;
        }

        /* Dark mode styles for rent history */
        :global(.dark-mode) .rent-history-section {
          background: #111111 !important;
          border: 1px solid #333333 !important;
        }

        :global(.dark-mode) .summary-card {
          background: #1a1a1a !important;
          border-color: #333333 !important;
        }

        :global(.dark-mode) .summary-value {
          color: #ffffff !important;
        }

        :global(.dark-mode) .summary-label {
          color: #94a3b8 !important;
        }

        :global(.dark-mode) .rent-logs-header h3 {
          color: #ffffff !important;
        }

        :global(.dark-mode) .filter-controls {
          background: #1a1a1a !important;
          border-color: #333333 !important;
        }

        :global(.dark-mode) .filter-label {
          color: #9ca3af !important;
        }

        :global(.dark-mode) .filter-select {
          background: #111111 !important;
          border-color: #333333 !important;
          color: #e2e8f0 !important;
        }

        :global(.dark-mode) .filter-select:hover {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2) !important;
        }

        :global(.dark-mode) .filter-select:focus {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2) !important;
        }

        :global(.dark-mode) .filter-reset-btn {
          background: #111111 !important;
          border-color: #333333 !important;
          color: #9ca3af !important;
        }

        :global(.dark-mode) .filter-reset-btn:hover {
          background: #222222 !important;
          border-color: #4b5563 !important;
          color: #e2e8f0 !important;
        }

        :global(.dark-mode) .rent-logs-table th {
          background: #1a1a1a !important;
          color: #94a3b8 !important;
          border-bottom: 1px solid #333333 !important;
        }

        :global(.dark-mode) .rent-logs-table td {
          color: #e2e8f0 !important;
          border-bottom: 1px solid #333333 !important;
        }

        :global(.dark-mode) .rent-logs-table tbody tr:hover {
          background: #222222 !important;
        }

        :global(.dark-mode) .amount-cell {
          color: #ffffff !important;
        }
      `}</style>
    </DashboardLayout>
  );
}

export default withAuth(Dashboard); 