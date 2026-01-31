import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import DashboardLayout from '../components/DashboardLayout';
import { withAuth } from '../lib/auth-context';
import { useAuth } from '../lib/auth-context';
import { useTheme } from '../lib/theme-context';
import ApplicationDetailModal from '../components/ApplicationDetailModal';
import { Application, Property, Room, DashboardStats, Manager, PaymentSummaryResponse, PaymentHistoryResponse, Vendor } from '../lib/types';
import { apiClient, expenseApi } from '../lib/api';
import { 
  Home, 
  Building, 
  Users, 
  Wrench, 
  DollarSign, 
  Calendar,
  Sparkles,
  Briefcase,
  Zap,
  BarChart3,
  TrendingUp,
  Target
} from 'lucide-react';

// Icon Components (keeping for backward compatibility with existing code)

// Custom hook for counter animation
const useCounterAnimation = (targetValue: number, _duration = 0, isRevenue = false) => {
  // Animation removed: return the target value immediately and update on change
  const [currentValue, setCurrentValue] = useState<number>(targetValue);

  useEffect(() => {
    setCurrentValue(targetValue);
  }, [targetValue]);

  if (isRevenue) {
    return `$${(currentValue || 0).toLocaleString()}`;
  }
  
  return currentValue;
};

function LandlordDashboard() {
  const { user, isLandlord, isManager, isAdmin } = useAuth();
  const { isDarkMode } = useTheme();
  const router = useRouter();
  
  // Theme-aware color helpers
  const getCardBg = () => isDarkMode ? '#18181b' : 'white';
  const getCardBorder = () => isDarkMode ? '#3f3f46' : '#e5e7eb';
  const getTextPrimary = () => isDarkMode ? '#fafafa' : '#111827';
  const getTextSecondary = () => isDarkMode ? '#a1a1aa' : '#6b7280';
  const getTextMuted = () => isDarkMode ? '#a1a1aa' : '#94a3b8';
  const getTableHeaderBg = () => isDarkMode ? '#27272a' : '#f9fafb';
  const getTableHeaderText = () => isDarkMode ? '#a1a1aa' : '#374151';
  const getTableBorder = () => isDarkMode ? '#3f3f46' : '#e5e7eb';
  const getTableText = () => isDarkMode ? '#e4e4e7' : '#374151';
  const getIconBg = (color: string) => {
    if (!isDarkMode) return color;
    const bgMap: { [key: string]: string } = {
      '#dbeafe': 'rgba(59, 130, 246, 0.2)',
      '#d1fae5': 'rgba(34, 197, 94, 0.2)',
      '#e9d5ff': 'rgba(139, 92, 246, 0.2)',
      '#fed7aa': 'rgba(249, 115, 22, 0.2)'
    };
    return bgMap[color] || color;
  };
  
  const [loading, setLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [propertyFilter, setPropertyFilter] = useState('All');
  const [rentHistoryPropertyFilter, setRentHistoryPropertyFilter] = useState('all');
  const [rentHistoryStatusFilter, setRentHistoryStatusFilter] = useState('all');
  const [rentHistoryTimeFilter, setRentHistoryTimeFilter] = useState('all');
  // Typing/rotation disabled per request
  const [isTyping, setIsTyping] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<{ text: string; icon: React.ReactElement | null }>({ text: '', icon: null });
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  
  // Real data state
  const [properties, setProperties] = useState<Property[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  
  // Payment data state  
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummaryResponse | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryResponse | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(true);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  // Application modal state
  const [isApplicationDetailOpen, setIsApplicationDetailOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  
  // Fetch dashboard stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setStatsLoading(true);
        setStatsError(null);
        const stats = await apiClient.getDashboardStats();
        setDashboardStats(stats);
      } catch (error: any) {
        console.error('Failed to fetch dashboard stats:', error);
        setStatsError('Failed to load dashboard statistics');
        // Set fallback stats on error
        setDashboardStats({
          properties: { total: 0, occupied: 0, vacant: 0 },
          rooms: { total: 0, occupied: 0, vacant: 0, occupancy_rate: 0 },
          tenants: { total: 0, active: 0 },
          revenue: { monthly: 0, projected_annual: 0 },
          applications: { total: 0, pending: 0, approved: 0, rejected: 0 },
          leases: { total: 0, active: 0, draft: 0, expired: 0 },
          managers: { total: 0, active: 0 }
        });
      } finally {
        setStatsLoading(false);
      }
    };

    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  // Fetch real data
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        setDataLoading(true);
        setDataError(null);
        
        // Fetch all data in parallel
        const [propertiesResponse, applicationsResponse, managersResponse, vendorsResponse, roomsResponse, listingsResponse] = await Promise.all([
          apiClient.getProperties(),
          apiClient.getApplications({ status: 'pending' }), // Only get pending applications
          apiClient.getManagers(),
          expenseApi.getVendors().catch(() => []), // Get vendors, fallback to empty array on error
          apiClient.getRooms(),
          apiClient.getListings().catch(() => ({ results: [] })) // Get listings, fallback to empty array on error
        ]);
        
        setProperties(propertiesResponse.results || []);
        setApplications(applicationsResponse.results || []);
        setManagers(managersResponse.results || []);
        setVendors(vendorsResponse || []);
        setRooms(roomsResponse.results || []);
        setListings(listingsResponse.results || []);
        
      } catch (error: any) {
        console.error('Failed to fetch dashboard data:', error);
        setDataError('Failed to load dashboard data');
        // Set fallback empty arrays
        setProperties([]);
        setApplications([]);
        setManagers([]);
        setVendors([]);
        setRooms([]);
        setListings([]);
      } finally {
        setDataLoading(false);
      }
    };

    if (user) {
      fetchRealData();
    }
  }, [user]);

  // Fetch payment data
  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        setPaymentLoading(true);
        setPaymentError(null);
        
        // Fetch payment summary and history in parallel
        const [summaryData, historyData] = await Promise.all([
          apiClient.getLandlordPaymentSummary(),
          apiClient.getPaymentHistory({ page: 1, page_size: 10 })
        ]);
        
        setPaymentSummary(summaryData);
        setPaymentHistory(historyData);
        
      } catch (error: any) {
        console.error('Failed to fetch payment data:', error);
        setPaymentError('Failed to load payment data');
        // Set fallback empty data
        setPaymentSummary(null);
        setPaymentHistory(null);
      } finally {
        setPaymentLoading(false);
      }
    };

    if (user && (isLandlord() || isManager() || isAdmin())) {
      fetchPaymentData();
    }
  }, [user]);
  
  const welcomeMessage = `Welcome back, ${user?.full_name || 'User'}! Here's an overview of your business operations.`;
  
  // Memoize the welcome message component to prevent unnecessary re-renders
  // Static message only; typing animation removed
  const WelcomeMessageComponent = useMemo(() => (
    <p className="welcome-message notification">
      <span className="message-text">{welcomeMessage}</span>
    </p>
  ), [welcomeMessage]);

  // Update notification messages to use real data
  const notificationMessages = useMemo(() => {
    if (!dashboardStats) {
      return [
        { text: "Loading your business data...", icon: <Sparkles /> }
      ];
    }
    
    return [
      { text: "Here's what's happening with your properties.", icon: <Sparkles /> },
      { text: `You have ${dashboardStats.applications.pending} pending applications to review.`, icon: <Briefcase /> },
      { text: `Your portfolio has ${dashboardStats.rooms.occupancy_rate}% occupancy rate.`, icon: <Home /> },
      { text: `${dashboardStats.applications.total} total applications this period.`, icon: <Zap /> },
              { text: `Monthly revenue: $${paymentSummary?.summary.current_month_total_dollars?.toLocaleString() || '0'}.`, icon: <BarChart3 /> },
      { text: `${dashboardStats.leases.active} active leases across your properties.`, icon: <Building /> },
      { text: "Your portfolio performance is excellent.", icon: <TrendingUp /> },
      { text: "All business operations are on track.", icon: <Target /> }
    ];
  }, [dashboardStats]);

  // Add user interaction detection
  useEffect(() => {
    let interactionTimeout: NodeJS.Timeout;
    
    const handleUserInteraction = () => {
      setIsUserInteracting(true);
      clearTimeout(interactionTimeout);
      interactionTimeout = setTimeout(() => {
        setIsUserInteracting(false);
      }, 2000); // Resume animation 2 seconds after last interaction
    };

    // Listen for various user interactions
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { passive: true });
    });

    return () => {
      clearTimeout(interactionTimeout);
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, []);

  // Disable typing/rotation effects
  useEffect(() => {
    setIsTyping(false);
  }, []);
  
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

  // Counter animations for metrics - use real data or fallback to 0
  const propertiesCount = useCounterAnimation(dashboardStats?.properties.total || 0, 1500);
  const occupancyRate = useCounterAnimation(dashboardStats?.rooms.occupancy_rate || 0, 2000);
  const vendorsCount = useCounterAnimation(vendors.length || 0, 1900);
  const revenueValue = useCounterAnimation(paymentSummary?.summary.current_month_total_dollars || 0, 2200, true);
  
  // Dynamic metrics based on real data
  const metrics = useMemo(() => {
    if (!dashboardStats) {
      return {
        properties: { value: 0, subtitle: 'Loading...', change: '', changeType: 'neutral' },
        occupancy: { value: 0, subtitle: 'Loading...', change: '', changeType: 'neutral' },
        revenue: { value: '$0', subtitle: 'Loading...', change: '', changeType: 'neutral' }
      };
    }
    
    return {
      properties: { 
        value: dashboardStats.properties.total, 
        subtitle: 'Total Properties', 
        change: `${dashboardStats.properties.vacant} vacant`, 
        changeType: dashboardStats.properties.vacant > 0 ? 'warning' : 'positive' 
      },
      occupancy: { 
        value: Math.round(dashboardStats.rooms.occupancy_rate), 
        subtitle: 'Occupancy Rate', 
        change: `${dashboardStats.rooms.occupied}/${dashboardStats.rooms.total} rooms`, 
        changeType: dashboardStats.rooms.occupancy_rate > 80 ? 'positive' : 'warning' 
      },
      revenue: { 
        value: paymentLoading ? '$0' : `$${paymentSummary?.summary.current_month_total_dollars?.toLocaleString() || '0'}`, 
        subtitle: 'Monthly Revenue', 
        change: paymentLoading ? 'Loading...' : `${paymentSummary?.summary.total_successful_payments || 0} payments this month`, 
        changeType: 'positive' 
      }
    };
  }, [dashboardStats]);

  const tasks = [
    { 
      id: 1, 
      task: 'Finalize quarterly reports', 
      property: 'Business Operations', 
      priority: 'High', 
      dueDate: '2024-01-20', 
      status: 'Pending' 
    },
    { 
      id: 2, 
      task: 'Review property manager performance', 
      property: 'Team Management', 
      priority: 'Medium', 
      dueDate: '2024-01-22', 
      status: 'Pending' 
    },
    { 
      id: 3, 
      task: 'Approve marketing budget', 
      property: 'Financial Planning', 
      priority: 'High', 
      dueDate: '2024-01-18', 
      status: 'In Progress' 
    },
    { 
      id: 4, 
      task: 'Plan portfolio expansion', 
      property: 'Strategic Growth', 
      priority: 'Low', 
      dueDate: '2024-02-01', 
      status: 'Pending'
    }
  ];

  const quickActions = [
    { 
      title: 'View Properties',
      subtitle: 'Manage your property portfolio',
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
      title: 'Add Property',
      subtitle: 'Expand your portfolio',
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
  
  const userName = user?.full_name || user?.username || 'User';

  // Add dynamic date logic
  const today = new Date();
  const weekday = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateString = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Helper functions to calculate property metrics from real data
  const getPropertyOccupancy = (property: Property) => {
    const totalRooms = property.total_rooms || 0;
    const vacantRooms = property.vacant_rooms || 0;
    const occupiedRooms = totalRooms - vacantRooms;
    return {
      occupancy: `${occupiedRooms}/${totalRooms}`,
      occupancyPercent: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0
    };
  };

  const getPropertyRevenue = (property: Property) => {
    // Calculate estimated monthly revenue based on monthly rent and occupancy
    const monthlyRent = Number(property.monthly_rent) || Number(property.effective_rent) || 0;
    const { occupancyPercent } = getPropertyOccupancy(property);
    const estimatedRevenue = Math.round((monthlyRent * property.total_rooms * occupancyPercent) / 100);
    return {
      revenue: estimatedRevenue,
      revenueChange: '+5%' // Default placeholder - would need historical data for real calculation
    };
  };

  const getPropertyStatus = (property: Property) => {
    // Determine status based on vacancy rate
    const { occupancyPercent } = getPropertyOccupancy(property);
    if (occupancyPercent < 50) return 'Maintenance';
    return 'Active';
  };

  const getPropertyTasks = (property: Property) => {
    // Default task count - in real app would come from a tasks/maintenance system
    const { occupancyPercent } = getPropertyOccupancy(property);
    return occupancyPercent < 90 ? Math.floor(Math.random() * 5) + 1 : 0;
  };

  const getPropertyInitials = (property: Property) => {
    return property.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPropertyColor = (property: Property) => {
    // Generate consistent color based on property ID
    const colors = ['#10b981', '#8b5cf6', '#f97316', '#dc2626', '#6366f1', '#3b82f6', '#8b5cf6'];
    return colors[property.id % colors.length];
  };

  const filteredProperties = propertyFilter === 'All'
    ? properties
    : properties.filter((p) => getPropertyStatus(p) === propertyFilter);

  // Filter payment history based on selected filters
  const filteredPaymentHistory = useMemo(() => {
    if (!paymentHistory?.payments) return [];
    
    return paymentHistory.payments.filter((payment) => {
      // Property filter
      if (rentHistoryPropertyFilter !== 'all') {
        const selectedProperty = properties.find(p => p.id === parseInt(rentHistoryPropertyFilter));
        if (!selectedProperty || payment.property_name !== selectedProperty.address) {
          return false;
        }
      }
      
      // Status filter
      if (rentHistoryStatusFilter !== 'all') {
        const paymentStatus = payment.status === 'succeeded' ? 'collected' : 
                            payment.status === 'pending' ? 'pending' : 'overdue';
        if (paymentStatus !== rentHistoryStatusFilter) {
          return false;
        }
      }
      
      // Time period filter
      if (rentHistoryTimeFilter !== 'all') {
        const paymentDate = new Date(payment.payment_date);
        const now = new Date();
        
        switch (rentHistoryTimeFilter) {
          case 'this-month':
            if (paymentDate.getMonth() !== now.getMonth() || paymentDate.getFullYear() !== now.getFullYear()) {
              return false;
            }
            break;
          case 'last-month':
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
            if (paymentDate.getMonth() !== lastMonth.getMonth() || paymentDate.getFullYear() !== lastMonth.getFullYear()) {
              return false;
            }
            break;
          case 'last-3-months':
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            if (paymentDate < threeMonthsAgo) {
              return false;
            }
            break;
          case 'this-year':
            if (paymentDate.getFullYear() !== now.getFullYear()) {
              return false;
            }
            break;
        }
      }
      
      return true;
    });
  }, [paymentHistory?.payments, rentHistoryPropertyFilter, rentHistoryStatusFilter, rentHistoryTimeFilter]);

  // Helper functions for applications
  const getApplicantInitials = (application: Application) => {
    if (application.tenant_name) {
      return application.tenant_name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return 'N/A';
  };

  const getPropertyName = (application: Application) => {
    if (application.property_name) return application.property_name;
    const property = properties.find(p => p.id === application.property_ref);
    return property ? property.name : 'Unknown Property';
  };

  const getTimeSinceApplication = (application: Application) => {
    const daysAgo = application.days_pending || 0;
    if (daysAgo === 0) return 'today';
    if (daysAgo === 1) return '1 day ago';
    return `${daysAgo} days ago`;
  };

  // Helper functions for managers
  const getManagerInitials = (manager: Manager) => {
    if (manager.full_name) {
      return manager.full_name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return manager.username.slice(0, 2).toUpperCase();
  };

  const getManagerRole = (manager: Manager) => {
    // Map the role field or provide default
    return manager.role || 'Property Manager';
  };

  const getManagerStatus = (manager: Manager) => {
    return manager.is_active ? 'Active' : 'Inactive';
  };

  // Demo properties and rooms data for the modal (keeping these for the modal)
  const demoProperties: Property[] = properties.length > 0 ? properties.slice(0, 3) : [];
  const demoRooms: Room[] = rooms.length > 0 ? rooms.slice(0, 6) : [];

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

  return (
    <DashboardLayout title="">
      <Head>
        <title>Landlord Dashboard - SquareFt</title>
      </Head>
      
      <div className="dashboard-container">
        {/* Custom Header */}
        <div style={{
          backgroundColor: getCardBg(),
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '1.5rem',
          border: `1px solid ${getCardBorder()}`,
          boxShadow: isDarkMode ? '0 1px 3px 0 rgba(0, 0, 0, 0.3)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                backgroundColor: getIconBg('#dbeafe'),
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Home style={{ width: '1.5rem', height: '1.5rem', color: isDarkMode ? '#60a5fa' : '#2563eb' }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '1.875rem',
                  fontWeight: '700',
                  color: getTextPrimary(),
                  margin: '0 0 0.25rem 0'
                }}>
                  Landlord Dashboard
                </h1>
                                <div style={{
                   display: 'flex',
                   alignItems: 'center',
                   gap: '0.5rem',
                   fontSize: '1rem',
                   color: getTextSecondary(),
                   margin: 0
                 }}>
                   <span className="welcome-message">{welcomeMessage}</span>
            </div>
              </div>
            </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', minWidth: 180 }}>
                <span style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: getTextMuted(), fontWeight: 500, letterSpacing: 0.2, marginBottom: 2 }}>
                <Calendar style={{ width: '1rem', height: '1rem', marginRight: '0.375rem', color: getTextMuted() }} />
                  {weekday}
                </span>
                <span style={{ fontSize: '17px', color: isDarkMode ? '#e4e4e7' : '#334155', fontWeight: 600, letterSpacing: 0.1, lineHeight: 1.3, textAlign: 'right', width: '100%' }}>
                  {dateString}
                </span>
            </div>
          </div>
        </div>
        
        {/* Stats Error Display */}
        {statsError && (
          <div style={{ 
            backgroundColor: '#fee2e2', 
            border: '1px solid #fecaca', 
            borderRadius: '8px', 
            padding: '12px 16px', 
            marginBottom: '24px',
            color: '#dc2626'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <span>Unable to load dashboard statistics. Showing default values.</span>
            </div>
          </div>
        )}

        {/* Data Error Display */}
        {dataError && (
          <div style={{ 
            backgroundColor: '#fee2e2', 
            border: '1px solid #fecaca', 
            borderRadius: '8px', 
            padding: '12px 16px', 
            marginBottom: '24px',
            color: '#dc2626'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <span>Unable to load properties, applications, and team data. Please refresh the page.</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {(dataLoading || statsLoading) && (
          <div style={{ 
            backgroundColor: '#f0f9ff', 
            border: '1px solid #bae6fd', 
            borderRadius: '8px', 
            padding: '12px 16px', 
            marginBottom: '24px',
            color: '#0369a1'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
              <span>Loading dashboard data...</span>
            </div>
          </div>
        )}
        
        {/* Top Metrics Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {[
            {
              title: 'Total Properties',
              value: statsLoading ? '...' : propertiesCount,
              subtitle: metrics.properties.subtitle,
              label: statsLoading ? 'Loading...' : 
                     dashboardStats ? `${dashboardStats.properties.occupied} occupied` : 'N/A',
              change: metrics.properties.change,
              changeType: metrics.properties.changeType,
              icon: <Building style={{ width: '1.25rem', height: '1.25rem' }} />,
              color: '#2563eb',
              bgColor: '#dbeafe'
            },
            {
              title: 'Occupancy Rate',
              value: statsLoading ? '...' : `${occupancyRate}%`,
              subtitle: metrics.occupancy.subtitle,
              label: statsLoading ? 'Loading...' : 'across portfolio',
              change: metrics.occupancy.change,
              changeType: metrics.occupancy.changeType,
              icon: <Users style={{ width: '1.25rem', height: '1.25rem' }} />,
              color: '#059669',
              bgColor: '#d1fae5'
            },
            {
              title: 'Active Listings',
              value: statsLoading ? '...' : listings?.length || 0,
              subtitle: 'Published listings',
              label: statsLoading ? 'Loading...' : 'across properties',
              change: '+0',
              changeType: 'neutral',
              icon: <Briefcase style={{ width: '1.25rem', height: '1.25rem' }} />,
              color: '#7c3aed',
              bgColor: '#e9d5ff'
            },
            {
              title: 'Applications',
              value: statsLoading ? '...' : applications?.length || 0,
              subtitle: 'Pending review',
              label: statsLoading ? 'Loading...' : applications?.filter((app: any) => app.status === 'pending').length || 0,
              change: '+0',
              changeType: 'neutral',
              icon: <Zap style={{ width: '1.25rem', height: '1.25rem' }} />,
              color: '#ea580c',
              bgColor: '#fed7aa'
            }
          ].map((metric, index) => (
            <div key={index} style={{
              backgroundColor: getCardBg(),
              borderRadius: '12px',
              padding: '1.5rem',
              border: `1px solid ${getCardBorder()}`,
              boxShadow: isDarkMode ? '0 1px 3px 0 rgba(0, 0, 0, 0.3)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = isDarkMode ? '0 8px 25px rgba(0, 0, 0, 0.5)' : '0 8px 25px rgba(0, 0, 0, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = isDarkMode ? '0 1px 3px 0 rgba(0, 0, 0, 0.3)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: getTextSecondary(),
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.025em'
                }}>
                  {metric.title}
                </h3>
                <div style={{
                  backgroundColor: getIconBg(metric.bgColor),
                  borderRadius: '8px',
                  padding: '0.5rem',
                  color: metric.color
                }}>
                  {metric.icon}
                </div>
              </div>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: getTextPrimary(),
                marginBottom: '0.25rem',
                lineHeight: 1
              }}>
                {metric.value}
            </div>
              <div style={{ height: '0.25rem' }}></div>

                </div>
          ))}
          </div>
          
        {/* Properties & Quick Actions Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* My Properties Section - Takes 3 columns */}
          <div style={{
            backgroundColor: getCardBg(),
            borderRadius: '12px',
            padding: '1.5rem',
            border: `1px solid ${getCardBorder()}`,
            boxShadow: isDarkMode ? '0 1px 3px 0 rgba(0, 0, 0, 0.3)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            gridColumn: 'span 3',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1.5rem'
            }}>
              <div>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: getTextPrimary(),
                  margin: '0 0 0.25rem 0'
                }}>
                  My Properties
                </h2>
                <p style={{
                  fontSize: '0.875rem',
                  color: getTextSecondary(),
                  margin: 0
                }}>
                  Manage and monitor your property portfolio
                </p>
              </div>
              <Link href="/properties">
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                >
                  View All
                </button>
              </Link>
                </div>
                

            
            {/* Properties Table */}
            {properties.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3rem 1rem',
                textAlign: 'center',
                color: getTextSecondary()
              }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: getTextPrimary(), fontWeight: 700, fontSize: '1.125rem' }}>
                  Add your first property
                </h3>
                <p style={{ margin: '0 0 1rem 0', color: getTextSecondary() }}>Start by creating a property to manage rooms, leases, and payments.</p>
                <Link href="/properties/add">
                  <button
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
                  >
                    + Add Property
                </button>
                </Link>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.875rem'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: getTableHeaderBg() }}>
                      <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: getTableHeaderText(), borderBottom: `1px solid ${getTableBorder()}` }}>Property</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: getTableHeaderText(), borderBottom: `1px solid ${getTableBorder()}` }}>Status</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: getTableHeaderText(), borderBottom: `1px solid ${getTableBorder()}` }}>Occupancy</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: getTableHeaderText(), borderBottom: `1px solid ${getTableBorder()}` }}>Rent</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: getTableHeaderText(), borderBottom: `1px solid ${getTableBorder()}` }}>Tasks</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: getTableHeaderText(), borderBottom: `1px solid ${getTableBorder()}` }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                      {filteredProperties.map((property) => {
                        const occupancyData = getPropertyOccupancy(property);
                        const revenueData = getPropertyRevenue(property);
                        const status = getPropertyStatus(property);
                        const tasks = getPropertyTasks(property);
                        const isActive = status.toLowerCase() === 'active';
                        return (
                        <tr key={property.id} style={{ borderBottom: `1px solid ${getTableBorder()}` }}>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>
                            <div style={{ fontWeight: '600', color: isDarkMode ? '#60a5fa' : '#2563eb', cursor: 'pointer' }} onClick={() => router.push(`/properties/${property.id}`)}>
                            {property.name}
                          </div>
                        </td>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                              <span style={{ 
                                padding: '0.25rem 0.5rem', 
                                borderRadius: '4px', 
                                fontSize: '0.75rem', 
                                fontWeight: '600', 
                                backgroundColor: isActive 
                                  ? (isDarkMode ? 'rgba(34, 197, 94, 0.2)' : '#d1fae5')
                                  : (isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#fef2f2'), 
                                color: isActive 
                                  ? (isDarkMode ? '#4ade80' : '#065f46')
                                  : (isDarkMode ? '#f87171' : '#dc2626')
                              }}>{status}</span>
                            </div>
                        </td>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                              <Users style={{ width: '1rem', height: '1rem', color: getTextSecondary() }} />
                              <span style={{ fontWeight: '600', color: getTableText() }}>{occupancyData.occupancy}</span>
                              <span style={{ fontSize: '0.75rem', color: getTextSecondary() }}>({occupancyData.occupancyPercent}%)</span>
                          </div>
                        </td>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>
                            <div style={{ fontWeight: '600', color: getTableText() }}>
                              ${revenueData.revenue.toLocaleString()}
                          </div>
                        </td>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#a1a1aa' : '#f59e0b'} strokeWidth="2"><path d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                              <span style={{ fontWeight: '600', color: getTableText() }}>{tasks} pending</span>
                          </div>
                        </td>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                              <button style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.75rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s ease' }} onClick={() => router.push(`/properties/${property.id}`)} onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')} onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                            Manage
                          </button>
                            </div>
                        </td>
                      </tr>
                        );
                      })}
                  </tbody>
                </table>
                </div>
            )}
          </div>

           {/* Quick Actions Section - Takes 1 column */}
           <div style={{
             backgroundColor: getCardBg(),
             borderRadius: '12px',
             padding: '1.5rem',
             border: `1px solid ${getCardBorder()}`,
             boxShadow: isDarkMode ? '0 1px 3px 0 rgba(0, 0, 0, 0.3)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
             height: 'fit-content',
             gridColumn: 'span 1',
             transition: 'all 0.2s ease'
           }}
           onMouseOver={(e) => {
             e.currentTarget.style.transform = 'translateY(-2px)';
             e.currentTarget.style.boxShadow = isDarkMode ? '0 8px 25px rgba(0, 0, 0, 0.5)' : '0 8px 25px rgba(0, 0, 0, 0.1)';
           }}
           onMouseOut={(e) => {
             e.currentTarget.style.transform = 'translateY(0)';
             e.currentTarget.style.boxShadow = isDarkMode ? '0 1px 3px 0 rgba(0, 0, 0, 0.3)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
           }}>
             <div style={{
               marginBottom: '1.5rem'
             }}>
               <h2 style={{
                 fontSize: '1.25rem',
                 fontWeight: '700',
                 color: getTextPrimary(),
                 margin: '0 0 0.25rem 0'
               }}>
                 Quick Actions
               </h2>
               <p style={{
                 fontSize: '0.875rem',
                 color: getTextSecondary(),
                 margin: 0
               }}>
                 Frequently used actions
               </p>
            </div>
            
             <div style={{
               display: 'flex',
               flexDirection: 'column',
               gap: '0.75rem'
             }}>
              {quickActions.map((action, index) => {
                const getActionBg = () => {
                  if (isDarkMode) return '#27272a';
                  return action.color === 'blue' ? '#eff6ff' : 
                         action.color === 'green' ? '#f0fdf4' : 
                         action.color === 'orange' ? '#fff7ed' : '#faf5ff';
                };
                const getActionIconBg = () => {
                  if (isDarkMode) {
                    return action.color === 'blue' ? 'rgba(59, 130, 246, 0.2)' :
                           action.color === 'green' ? 'rgba(34, 197, 94, 0.2)' :
                           'rgba(249, 115, 22, 0.2)';
                  }
                  return action.color === 'blue' ? '#dbeafe' : 
                         action.color === 'green' ? '#d1fae5' : '#fed7aa';
                };
                return (
                <div 
                  key={index} 
                   style={{
                     display: 'flex',
                     alignItems: 'center',
                     gap: '0.75rem',
                     padding: '1rem',
                     backgroundColor: getActionBg(),
                     border: `1px solid ${getCardBorder()}`,
                     borderRadius: '8px',
                     cursor: 'pointer',
                     transition: 'all 0.2s ease'
                   }}
                  onClick={() => router.push(action.link)}
                   onMouseOver={(e) => {
                     if (!isDarkMode) {
                     e.currentTarget.style.backgroundColor = action.color === 'blue' ? '#dbeafe' : 
                                                            action.color === 'green' ? '#dcfce7' : 
                                                            action.color === 'orange' ? '#fed7aa' : '#e9d5ff';
                     e.currentTarget.style.borderColor = action.color === 'blue' ? '#2563eb' : 
                                                         action.color === 'green' ? '#059669' : 
                                                         action.color === 'orange' ? '#ea580c' : '#7c3aed';
                     } else {
                       e.currentTarget.style.backgroundColor = '#3f3f46';
                     }
                   }}
                   onMouseOut={(e) => {
                     e.currentTarget.style.backgroundColor = getActionBg();
                     e.currentTarget.style.borderColor = getCardBorder();
                   }}
                 >
                   <div style={{
                     width: '2.5rem',
                     height: '2.5rem',
                     backgroundColor: getActionIconBg(),
                     borderRadius: '8px',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     color: action.color === 'blue' ? (isDarkMode ? '#60a5fa' : '#2563eb') : 
                            action.color === 'green' ? (isDarkMode ? '#4ade80' : '#059669') : 
                            (isDarkMode ? '#fb923c' : '#ea580c')
                   }}>
                     {action.color === 'blue' ? <Home style={{ width: '1.25rem', height: '1.25rem' }} /> :
                      action.color === 'green' ? <DollarSign style={{ width: '1.25rem', height: '1.25rem' }} /> :
                      <Building style={{ width: '1.25rem', height: '1.25rem' }} />}
                  </div>
                   <div style={{ flex: 1 }}>
                     <h3 style={{
                       fontSize: '0.875rem',
                       fontWeight: '600',
                       color: getTextPrimary(),
                       margin: '0 0 0.125rem 0'
                     }}>
                       {action.title}
                     </h3>
                     <p style={{
                       fontSize: '0.75rem',
                       color: getTextSecondary(),
                       margin: 0
                     }}>
                       {action.subtitle}
                     </p>
                  </div>
                </div>
              )})}
            </div>
          </div>
        </div>
        
        {/* Applications and Vendors Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Recent Applications Section - Takes 3 columns */}
          <div style={{
            backgroundColor: getCardBg(),
            borderRadius: '12px',
            padding: '1.5rem',
            border: `1px solid ${getCardBorder()}`,
            boxShadow: isDarkMode ? '0 1px 3px 0 rgba(0, 0, 0, 0.3)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            gridColumn: 'span 3',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = isDarkMode ? '0 8px 25px rgba(0, 0, 0, 0.5)' : '0 8px 25px rgba(0, 0, 0, 0.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = isDarkMode ? '0 1px 3px 0 rgba(0, 0, 0, 0.3)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1.5rem'
            }}>
              <div>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: getTextPrimary(),
                  margin: '0 0 0.25rem 0'
                }}>
                  Recent Applications
                </h2>
                <p style={{
                  fontSize: '0.875rem',
                  color: getTextSecondary(),
                  margin: 0
                }}>
                  Latest tenant applications requiring review
                </p>
              </div>
              <button 
                onClick={() => router.push('/applications')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              >
                View All Applications
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem'
            }}>
              {applications.length === 0 ? (
                <div style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  color: getTextSecondary(),
                  padding: '2rem 1rem'
                }}>
                  No recent applications to display.
                </div>
              ) : (
                applications.slice(0, 3).map((application) => (
                  <div key={application.id} style={{
                    backgroundColor: isDarkMode ? '#27272a' : '#f8fafc',
                    border: `1px solid ${getCardBorder()}`,
                    borderRadius: '8px',
                    padding: '1rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#3f3f46' : '#f1f5f9';
                    e.currentTarget.style.borderColor = '#2563eb';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#27272a' : '#f8fafc';
                    e.currentTarget.style.borderColor = getCardBorder();
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        backgroundColor: '#2563eb',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}>
                        {getApplicantInitials(application)}
                      </div>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
                        color: isDarkMode ? '#f87171' : '#dc2626'
                      }}>
                        PENDING REVIEW
                      </span>
                    </div>
                    
                    <div style={{ marginBottom: '1rem' }}>
                      <h3 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: getTextPrimary(),
                        margin: '0 0 0.5rem 0'
                      }}>
                        {application.tenant_name}
                      </h3>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        fontSize: '0.75rem',
                        color: getTextSecondary(),
                        marginBottom: '0.25rem'
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={getTextSecondary()} strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12,6 12,12 16,14"/>
                        </svg>
                        Applied {getTimeSinceApplication(application)}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: getTableText()
                      }}>
                        <span style={{ fontWeight: '500' }}>Property:</span> {getPropertyName(application)}
                      </div>
                    </div>

                    <button 
                      onClick={() => handleViewApplication(application)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                    >
                      View Application
                    </button>
                  </div>
                ))
              )}
            </div>
            </div>
          </div>

        {/* MVP: My Vendors Section - Hidden for Phase 1 
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            height: 'fit-content',
            gridColumn: 'span 1',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
          }}>
            <div style={{
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#111827',
                margin: '0 0 0.25rem 0'
              }}>
                My Vendors
              </h2>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                margin: 0
              }}>
                Manage your service providers
              </p>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
                {vendors.length > 0 ? vendors.slice(0, 5).map((vendor) => (
                <div key={vendor.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                  e.currentTarget.style.borderColor = '#2563eb';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    backgroundColor: '#7c3aed',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                      </svg>
                    </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '0.125rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {vendor.name}
                      </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      marginBottom: '0.125rem'
                    }}>
                      {vendor.vendor_type_display}
                      </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#374151',
                      marginBottom: '0.125rem'
                    }}>
                      Total: ${vendor.total_expense_amount || 0}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{
                        padding: '0.125rem 0.375rem',
                        borderRadius: '4px',
                        fontSize: '0.625rem',
                        fontWeight: '600',
                        backgroundColor: vendor.is_active ? '#d1fae5' : '#fef2f2',
                        color: vendor.is_active ? '#065f46' : '#dc2626'
                      }}>
                        {vendor.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {vendor.contact_phone && (
                        <button
                          onClick={() => window.open(`tel:${vendor.contact_phone}`)}
                          style={{
                            padding: '0.25rem',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                    </button>
                      )}
                    </div>
                  </div>
                  </div>
                )) : (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem 1rem',
                  color: '#6b7280'
                }}>
                  <p style={{ margin: '0 0 1rem 0' }}>No vendors added yet</p>
                    <button 
                      onClick={() => router.push('/tenants')}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                    >
                      Add First Vendor
                    </button>
                  </div>
                )}
              </div>

            <button
              onClick={() => router.push('/vendors')}
              style={{
                width: '100%',
                marginTop: '1rem',
                padding: '0.5rem',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            >
              Manage All Vendors
            </button>
          </div>
        </div>
        */}
      </div>
      
      {/* Application Detail Modal */}
      <ApplicationDetailModal
        isOpen={isApplicationDetailOpen}
        application={selectedApplication}
        properties={demoProperties}
        rooms={demoRooms}
        onClose={handleCloseModal}
        onApprove={handleApprove}
        onReject={handleReject}
      />
      
      <style jsx>{`
        .dashboard-container {
          width: 100%;
          padding: 12px 16px 16px 16px; /* Further reduced padding */
          background: transparent;
          min-height: calc(100vh - 72px); /* Updated for new topbar height */
          box-sizing: border-box;
          position: relative;
          z-index: 1;
          /* Optimize for animations */
          contain: layout style paint;
        }

        /* Ensure sidebar remains interactive during typing animation */
        :global(.sidebar) {
          z-index: 1000 !important;
          pointer-events: all !important;
        }

        :global(.sidebar a) {
          pointer-events: all !important;
        }

        :global(.sidebar button) {
          pointer-events: all !important;
        }

        /* Custom Header */
        .dashboard-header {
          margin-bottom: 16px; /* Further reduced margin */
          position: relative;
          z-index: 1;
          pointer-events: auto;
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
          pointer-events: none; /* Prevents blocking user interactions */
          position: relative;
          z-index: 1;
          /* Optimize for performance during animation */
          will-change: transform, opacity;
          backface-visibility: hidden;
          transform: translateZ(0);
          /* Ensure animation doesn't block other elements */
          contain: layout style paint;
          /* Use GPU acceleration for smoother animation */
          transform: translate3d(0, 0, 0);
        }

        .welcome-message.notification {
          transition: opacity 0.3s ease-in-out; /* Reduced from 0.5s */
        }

        .welcome-message.fading {
          opacity: 0;
        }

        .message-icon {
          /* Optimize icon animations */
          will-change: transform;
          transform: translate3d(0, 0, 0);
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
          /* Optimize cursor animation */
          will-change: opacity;
          transform: translate3d(0, 0, 0);
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
          gap: 10px; /* Further reduced gap */
          margin-bottom: 16px; /* Further reduced margin */
        }

        .metric-card {
          background: white;
          border-radius: 6px; /* Reduced radius */
          padding: 12px; /* Further reduced padding */
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
          gap: 6px;
          transition: all 0.2s ease;
        }

        .add-task-btn:hover {
          background: #3730a3;
          transform: translateY(-1px);
        }

        .tasks-table-container {
          width: 100%;
          overflow-x: auto;
          border-radius: 8px;
          background: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .tasks-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          table-layout: fixed;
        }

        .tasks-table th {
          position: sticky;
          top: 0;
          background: white;
          z-index: 2;
          font-size: 11px;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 12px 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .tasks-table tbody tr {
          transition: background-color 0.15s ease;
        }

        .tasks-table tbody tr:hover {
          background-color: #f9fafb;
        }

        .tasks-table td {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          padding: 12px 16px;
          border-bottom: 1px solid #f3f4f6;
          background: white;
        }

        /* Column widths for tasks table */
        .tasks-table th:nth-child(1), .tasks-table td:nth-child(1) { width: 30%; text-align: left; }
        .tasks-table th:nth-child(2), .tasks-table td:nth-child(2) { width: 25%; text-align: left; }
        .tasks-table th:nth-child(3), .tasks-table td:nth-child(3) { width: 15%; text-align: center; }
        .tasks-table th:nth-child(4), .tasks-table td:nth-child(4) { width: 15%; text-align: left; }
        .tasks-table th:nth-child(5), .tasks-table td:nth-child(5) { width: 15%; text-align: center; }

        .priority-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
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
          gap: 6px;
          font-weight: 500;
          color: #1e293b;
        }

        .date-highlight {
          background-color: #f1f5f9;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
          color: #334155;
        }

        .due-date-cell svg {
          stroke: #64748b;
          stroke-width: 1.5;
          flex-shrink: 0;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
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
          color: #059669;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .status-badge.maintenance {
          background: #fef3c7;
          color: #d97706;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
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
          height: 500px; /* Match properties section height */
          display: flex;
          flex-direction: column;
        }

        .actions-grid {
          display: flex;
          flex-direction: column;
          gap: 12px; /* Reduced gap */
          flex: 1;
          justify-content: flex-start;
          min-height: 0; /* Allow shrinking */
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
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          text-decoration: none;
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
          height: 500px; /* Match quick actions height */
          display: flex;
          flex-direction: column;
        }
        
        /* Full-width properties section (when used as standalone) */
        .properties-section.full-width {
          margin-top: 32px; /* Reduced margin */
          margin-bottom: 20px; /* Reduced margin */
          height: auto; /* Auto height for full-width version */
        }

        .properties-container {
          margin-top: 16px; /* Reduced margin */
          flex: 1; /* Take remaining space in flex container */
          display: flex;
          flex-direction: column;
          min-height: 0; /* Allow shrinking */
        }

        /* Properties Filter Controls */
        .properties-filter-controls {
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
          background: #f8fafc;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          margin-bottom: 16px;
        }

        .properties-filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .properties-filter-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        .properties-filter-select {
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

        .properties-filter-select:hover {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .properties-filter-select:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .properties-filter-reset-btn {
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

        .properties-filter-reset-btn:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #475569;
        }

        .properties-filter-reset-btn:active {
          transform: translateY(1px);
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
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          padding: 16px 20px;
          font-weight: 600;
          font-size: 14px;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .property-name-link {
          color: #3b82f6;
          cursor: pointer;
          font-weight: 600;
          transition: color 0.2s ease, text-decoration 0.2s ease;
        }

        .property-name-link:hover {
          color: #1d4ed8;
          text-decoration: underline;
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

        /* Applications and Teams Section */
        .applications-teams-container {
          display: flex;
          gap: 20px;
          margin-top: 32px;
        }

        .applications-section, .vendors-section {
          background: white;
          border-radius: 6px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        .applications-section {
          flex: 2;
        }

        .vendors-section {
          flex: 1;
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

        .teams-scroll-container {
          height: 320px;
          overflow-y: auto;
          margin-top: 16px;
        }

        .teams-scroll-container::-webkit-scrollbar {
          width: 6px;
        }

        .teams-scroll-container::-webkit-scrollbar-track {
          background: rgba(226, 232, 240, 0.3);
          border-radius: 3px;
        }

        .teams-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }

        .teams-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .team-member-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px;
          border-radius: 6px;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }

        .team-member-row:hover {
          background-color: #f9fafb;
          border-color: #e2e8f0;
        }

        .member-avatar {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #eef2ff;
          color: #4f46e5;
          font-weight: 600;
          flex-shrink: 0;
        }

        .member-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .member-name {
          font-weight: 600;
          color: #1e293b;
          font-size: 14px;
        }

        .member-role {
          font-size: 13px;
          color: #64748b;
        }
        
        .member-properties {
          font-size: 12px;
          color: #64748b;
        }
        
        .member-joined {
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
        }

        .member-status {
          margin-left: auto;
          display: flex;
          align-items: center;
        }

        .status-badge-small {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }
        
        .status-badge-small.active {
          background-color: #dcfce7;
          color: #16a34a;
        }

        .contact-btn-small {
          background-color: #4f46e5;
          color: white;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-left: 8px;
        }

        .contact-btn-small:hover {
          background-color: #3730a3;
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
        .occupancy-cell { display: flex; align-items: center; justify-content: center; gap: 6px; }
        .tasks-cell { display: flex; align-items: center; gap: 6px; }
        .revenue-cell { }

        /* Dark Mode Styles */
        :global(.dark-mode) .dashboard-container { 
          background: transparent !important; 
        }
        
        /* Dark mode for tables */
        :global(.dark-mode) table thead tr {
          background-color: #27272a !important;
        }
        
        :global(.dark-mode) table thead th {
          background-color: #27272a !important;
          color: #a1a1aa !important;
          border-bottom-color: #3f3f46 !important;
        }
        
        :global(.dark-mode) table tbody td {
          color: #e4e4e7 !important;
          border-bottom-color: #3f3f46 !important;
        }
        
        :global(.dark-mode) table tbody tr:hover {
          background-color: #27272a !important;
        }
        
        :global(.dark-mode) .metric-card, 
        :global(.dark-mode) .tasks-section, 
        :global(.dark-mode) .quick-actions-section, 
        :global(.dark-mode) .properties-section, 
        :global(.dark-mode) .applications-section,
        :global(.dark-mode) .teams-section,
        :global(.dark-mode) .action-card,
        :global(.dark-mode) .application-card,
        :global(.dark-mode) .team-member-row {
          background: #18181b !important;
          border: 1px solid #3f3f46 !important;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4) !important;
        }
        
        /* Dark mode for h1, h2, h3, p elements */
        :global(.dark-mode) h1,
        :global(.dark-mode) h2,
        :global(.dark-mode) h3 {
          color: #fafafa !important;
        }
        
        :global(.dark-mode) p {
          color: #e4e4e7 !important;
        }
        
        :global(.dark-mode) span {
          color: inherit;
        }
        :global(.dark-mode) .metric-card:hover,
        :global(.dark-mode) .action-card:hover,
        :global(.dark-mode) .application-card:hover,
        :global(.dark-mode) .team-member-row:hover {
          background: #27272a !important;
          border-color: #3f3f46 !important;
        }
        :global(.dark-mode) .tasks-table th, 
        :global(.dark-mode) .properties-table th {
          background-color: #27272a !important;
          border-bottom: 1px solid #3f3f46 !important;
          color: #a1a1aa !important;
        }
        :global(.dark-mode) .tasks-table td, 
        :global(.dark-mode) .properties-table td {
          background-color: #18181b !important;
          border-bottom: 1px solid #3f3f46 !important;
          color: #e4e4e7 !important;
        }
        :global(.dark-mode) .tasks-table tbody tr:hover, 
        :global(.dark-mode) .properties-table tbody tr:hover {
          background-color: #27272a !important;
        }
        :global(.dark-mode) .tasks-table tbody tr:hover td {
          background-color: #27272a !important;
        }
        :global(.dark-mode) .add-task-btn,
        :global(.dark-mode) .view-all-btn,
        :global(.dark-mode) .review-btn,
        :global(.dark-mode) .contact-btn-small {
            background: #2563eb !important;
            border: 1px solid #2563eb !important;
            color: white !important;
        }
        :global(.dark-mode) .add-task-btn:hover,
        :global(.dark-mode) .view-all-btn:hover,
        :global(.dark-mode) .review-btn:hover,
        :global(.dark-mode) .contact-btn-small:hover {
            background: #1d4ed8 !important;
            border-color: #1d4ed8 !important;
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
        :global(.dark-mode) .action-card.orange .action-icon { background: rgba(249, 115, 22, 0.3); }
        :global(.dark-mode) .tasks-cell .task-count { background: rgba(139, 92, 246, 0.3); }
        :global(.dark-mode) select {
          background-color: #27272a !important;
          border-color: #3f3f46 !important;
          color: #e4e4e7 !important;
        }
        
        /* Professional Dark Mode - Comprehensive Coverage */
        
        /* Dashboard header card - first child */
        :global(.dark-mode) .dashboard-container > div:first-child {
          background-color: #18181b !important;
          border-color: #3f3f46 !important;
        }
        
        /* All cards with rounded corners */
        :global(.dark-mode) .dashboard-container > div,
        :global(.dark-mode) .dashboard-container > div > div > div {
          background-color: #18181b !important;
          border-color: #3f3f46 !important;
        }
        
        /* Typography - All headings */
        :global(.dark-mode) .dashboard-container h1,
        :global(.dark-mode) .dashboard-container h2,
        :global(.dark-mode) .dashboard-container h3 {
          color: #fafafa !important;
        }
        
        /* Large metric values (2rem font size) */
        :global(.dark-mode) .dashboard-container > div > div > div > div > div {
          color: #fafafa !important;
        }
        
        /* Metric titles */
        :global(.dark-mode) .dashboard-container h3 {
          color: #a1a1aa !important;
        }
        
        /* Paragraphs and subtitles */
        :global(.dark-mode) .dashboard-container p {
          color: #a1a1aa !important;
        }
        
        /* Table styling - comprehensive */
        :global(.dark-mode) .dashboard-container table thead tr {
          background-color: #27272a !important;
        }
        
        :global(.dark-mode) .dashboard-container table thead th {
          background-color: #27272a !important;
          color: #a1a1aa !important;
          border-bottom-color: #3f3f46 !important;
        }
        
        :global(.dark-mode) .dashboard-container table tbody tr {
          border-bottom-color: #3f3f46 !important;
        }
        
        :global(.dark-mode) .dashboard-container table tbody td {
          color: #e4e4e7 !important;
        }
        
        :global(.dark-mode) .dashboard-container table tbody tr:hover {
          background-color: #27272a !important;
        }
        
        :global(.dark-mode) .dashboard-container table tbody tr:hover td {
          background-color: #27272a !important;
        }
        
        /* Property name links (blue) */
        :global(.dark-mode) .dashboard-container table tbody td div[style*="fontWeight"] {
          color: #60a5fa !important;
        }
        
        /* Status badges */
        :global(.dark-mode) .dashboard-container table tbody td span {
          border: 1px solid transparent;
        }
        
        /* Rent values and other numbers */
        :global(.dark-mode) .dashboard-container table tbody td div[style*="fontWeight: '600'"] {
          color: #e4e4e7 !important;
        }
        
        /* Quick action cards - all variants */
        :global(.dark-mode) .dashboard-container > div > div > div:last-child > div > div {
          background-color: #27272a !important;
          border-color: #3f3f46 !important;
        }
        
        /* Quick action card headings */
        :global(.dark-mode) .dashboard-container > div > div > div:last-child h3 {
          color: #fafafa !important;
        }
        
        /* Quick action card paragraphs */
        :global(.dark-mode) .dashboard-container > div > div > div:last-child p {
          color: #a1a1aa !important;
        }
        
        /* Icon containers in quick actions */
        :global(.dark-mode) .dashboard-container > div > div > div:last-child > div > div > div:first-child {
          background-color: rgba(59, 130, 246, 0.2) !important;
        }
        
        /* All SVG icons - ensure visibility */
        :global(.dark-mode) .dashboard-container svg {
          opacity: 0.9;
        }
        
        /* Buttons - keep blue buttons visible */
        :global(.dark-mode) .dashboard-container button {
          color: inherit;
        }
        
        :global(.dark-mode) .dashboard-container button[style*="backgroundColor"] {
          background-color: #2563eb !important;
          color: white !important;
        }
        
        :global(.dark-mode) .dashboard-container button[style*="backgroundColor"]:hover {
          background-color: #1d4ed8 !important;
        }
        
        /* Date and time text */
        :global(.dark-mode) .dashboard-container > div:first-child span {
          color: #a1a1aa !important;
        }
        
        /* Welcome message */
        :global(.dark-mode) .dashboard-container .welcome-message {
          color: #a1a1aa !important;
        }
        
        /* Icon in header */
        :global(.dark-mode) .dashboard-container > div:first-child > div > div:first-child > div:first-child {
          background-color: rgba(59, 130, 246, 0.2) !important;
        }
        
        /* Error and loading alerts */
        :global(.dark-mode) .dashboard-container > div[style*="backgroundColor: '#fee2e2'"] {
          background-color: rgba(239, 68, 68, 0.15) !important;
          border-color: rgba(239, 68, 68, 0.3) !important;
          color: #fca5a5 !important;
        }
        
        :global(.dark-mode) .dashboard-container > div[style*="backgroundColor: '#f0f9ff'"] {
          background-color: rgba(59, 130, 246, 0.15) !important;
          border-color: rgba(59, 130, 246, 0.3) !important;
          color: #93c5fd !important;
        }
        
        /* Ensure notification badges stay red */
        :global(.dark-mode) .dashboard-container span[style*="PENDING"],
        :global(.dark-mode) .dashboard-container span[style*="pending"] {
          background-color: rgba(239, 68, 68, 0.2) !important;
          color: #f87171 !important;
        }
        
        /* Ensure no white borders on cards and containers */
        :global(.dark-mode) .dashboard-container > div,
        :global(.dark-mode) .dashboard-container > div > div > div {
          border-color: #3f3f46 !important;
        }
        
        /* Keep blue buttons blue with proper border */
        :global(.dark-mode) .dashboard-container button[style*="backgroundColor: '#2563eb'"],
        :global(.dark-mode) .dashboard-container button[style*="backgroundColor: #2563eb"] {
          border-color: #2563eb !important;
        }

        /* Dark mode styles for Properties Filter Controls */
        :global(.dark-mode) .properties-filter-controls {
          background: #1a1a1a !important;
          border-color: #333333 !important;
        }

        :global(.dark-mode) .properties-filter-label {
          color: #9ca3af !important;
        }

        :global(.dark-mode) .properties-filter-select {
          background: #111111 !important;
          border-color: #333333 !important;
          color: #e2e8f0 !important;
        }

        :global(.dark-mode) .properties-filter-select:hover {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2) !important;
        }

        :global(.dark-mode) .properties-filter-select:focus {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2) !important;
        }

        :global(.dark-mode) .properties-filter-reset-btn {
          background: #111111 !important;
          border-color: #333333 !important;
          color: #9ca3af !important;
        }

        :global(.dark-mode) .properties-filter-reset-btn:hover {
          background: #1f2937 !important;
          border-color: #4b5563 !important;
          color: #e2e8f0 !important;
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

        :global(.dark-mode) .status-badge-small.active {
            background: rgba(34, 197, 94, 0.3) !important;
            color: #ffffff !important;
        }

        :global(.dark-mode) .view-all-btn {
            background: #3b82f6 !important;
            border: none !important;
        }
        :global(.dark-mode) .date-highlight {
          background-color: #334155;
          color: #e2e8f0;
        }
        :global(.dark-mode) .priority-badge.high { background: rgba(239, 68, 68, 0.3); color: #fecaca !important; }
        :global(.dark-mode) .priority-badge.medium { background: rgba(245, 158, 11, 0.3); color: #fde68a !important; }
        :global(.dark-mode) .priority-badge.low { background: rgba(34, 197, 94, 0.3); color: #bbf7d0 !important; }
        
        :global(.dark-mode) .status-badge.pending { background: rgba(245, 158, 11, 0.3); color: #fde68a !important; }
        :global(.dark-mode) .contact-btn-small {
          background-color: #3b82f6;
        }
        :global(.dark-mode) .contact-btn-small:hover {
          background-color: #2563eb;
        }
        :global(.dark-mode) .status-badge-small.active {
          background: rgba(34, 197, 94, 0.3);
          color: #bbf7d0;
        }
        :global(.dark-mode) .member-avatar {
          background-color: rgba(99, 102, 241, 0.2);
          color: #a5b4fc;
        }
        :global(.dark-mode) .team-member-row:hover {
          background-color: #1a1a1a;
          border-color: #333333;
        }

        /* Accounting Section */
        /* Rent History Section */
        .rent-history-section {
          background: white;
          border-radius: 6px;
          padding: 18px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          height: 500px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        /* Full-width rent history section */
        .rent-history-section.full-width {
          margin-top: 32px;
          margin-bottom: 20px;
          height: auto; /* Auto height for full-width version */
        }

        .rent-history-content {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .rent-history-content::-webkit-scrollbar {
          width: 6px;
        }

        .rent-history-content::-webkit-scrollbar-track {
          background: rgba(226, 232, 240, 0.3);
          border-radius: 3px;
        }

        .rent-history-content::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }

        .rent-summary-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          flex-shrink: 0;
        }

        .summary-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s ease;
        }

        .summary-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .summary-icon {
          width: 36px;
          height: 36px;
          border-radius: 6px;
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
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 2px;
        }

        .summary-label {
          font-size: 11px;
          color: #64748b;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .rent-logs-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .rent-logs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .rent-logs-header h3 {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
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
          flex: 1;
          overflow-y: auto;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
        }

        .rent-logs-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        .rent-logs-table th {
          background: #f8fafc;
          color: #64748b;
          font-weight: 600;
          padding: 12px 8px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
          font-size: 11px;
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

        .loading-cell, .error-cell, .empty-cell {
          text-align: center;
          padding: 20px;
          color: #6b7280;
          font-style: italic;
        }

        .error-cell {
          color: #ef4444;
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
          font-size: 10px;
          font-weight: 600;
        }

        .amount-cell {
          font-weight: 600;
          color: #1e293b;
        }

        .status-badge.collected {
          background: #dcfce7;
          color: #16a34a;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-badge.pending {
          background: #fef3c7;
          color: #d97706;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-badge.overdue {
          background: #fee2e2;
          color: #dc2626;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Dark Mode Styles for Rent History Section */
        :global(.dark-mode) .rent-history-section {
          background: #111111 !important;
          border-color: #333333 !important;
        }

        :global(.dark-mode) .summary-card,
        :global(.dark-mode) .rent-logs-table-container {
          background: #1a1a1a !important;
          border-color: #333333 !important;
        }

        :global(.dark-mode) .summary-card:hover {
          background: #222222 !important;
        }

        :global(.dark-mode) .summary-value,
        :global(.dark-mode) .amount-cell {
          color: #ffffff !important;
        }

        :global(.dark-mode) .rent-logs-header h3 {
          color: #e2e8f0 !important;
        }

        :global(.dark-mode) .summary-label,
        :global(.dark-mode) .filter-select {
          color: #9ca3af !important;
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

        :global(.dark-mode) .summary-card.collected .summary-icon {
          background: rgba(34, 197, 94, 0.3) !important;
          color: #22c55e !important;
        }

        :global(.dark-mode) .summary-card.pending .summary-icon {
          background: rgba(245, 158, 11, 0.3) !important;
          color: #f59e0b !important;
        }

        :global(.dark-mode) .summary-card.overdue .summary-icon {
          background: rgba(239, 68, 68, 0.3) !important;
          color: #ef4444 !important;
        }

        :global(.dark-mode) .rent-history-content::-webkit-scrollbar-track {
          background: rgba(75, 85, 99, 0.3) !important;
        }

        :global(.dark-mode) .rent-history-content::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.8) !important;
        }

        :global(.dark-mode) .rent-logs-table th {
          background: #1a1a1a !important;
          border-color: #333333 !important;
          color: #9ca3af !important;
        }

        :global(.dark-mode) .rent-logs-table td {
          background: #111111 !important;
          border-color: #333333 !important;
          color: #e2e8f0 !important;
        }

        :global(.dark-mode) .rent-logs-table tbody tr:hover {
          background: #222222 !important;
        }

        :global(.dark-mode) .tenant-avatar {
          background: rgba(99, 102, 241, 0.3) !important;
          color: #a5b4fc !important;
        }

        :global(.dark-mode) .status-badge.collected {
          background: rgba(34, 197, 94, 0.3) !important;
          color: #22c55e !important;
        }

        :global(.dark-mode) .status-badge.pending {
          background: rgba(245, 158, 11, 0.3) !important;
          color: #f59e0b !important;
        }

        :global(.dark-mode) .status-badge.overdue {
          background: rgba(239, 68, 68, 0.3) !important;
          color: #ef4444 !important;
        }

        .vendors-scroll-container {
          height: 320px;
          overflow-y: auto;
          margin-top: 16px;
        }

        .vendors-scroll-container::-webkit-scrollbar {
          width: 6px;
        }

        .vendors-scroll-container::-webkit-scrollbar-track {
          background: rgba(226, 232, 240, 0.3);
          border-radius: 3px;
        }

        .vendors-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }

        .vendors-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .vendor-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px;
          border-radius: 6px;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }

        .vendor-row:hover {
          background-color: #f9fafb;
          border-color: #e2e8f0;
        }

        .vendor-avatar {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f0f9ff;
          color: #0284c7;
          font-weight: 600;
          flex-shrink: 0;
        }

        .vendor-info {
          flex: 1;
          min-width: 0;
        }

        .vendor-name {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 2px;
        }

        .vendor-type {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 3px;
        }

        .vendor-expenses {
          font-size: 11px;
          color: #059669;
          font-weight: 500;
          margin-bottom: 2px;
        }

        .vendor-contact {
          font-size: 11px;
          color: #64748b;
        }

        .vendor-status {
          flex-shrink: 0;
        }

        .empty-vendors {
          text-align: center;
          padding: 40px 20px;
          color: #64748b;
        }

        .empty-vendors p {
          margin: 0 0 16px 0;
          font-size: 14px;
        }

        .add-vendor-btn {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .add-vendor-btn:hover {
          background: #3730a3;
          transform: translateY(-1px);
        }
      `}</style>
    </DashboardLayout>
  );
}

export default withAuth(LandlordDashboard); 