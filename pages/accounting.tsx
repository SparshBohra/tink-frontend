import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '../components/DashboardLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth, withAuth } from '../lib/auth-context';
import { apiClient, expenseApi } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { Expense, Vendor, ExpenseFormData, VendorFormData } from '../lib/types';

interface PropertyFinancials {
  id: number;
  name: string;
  address: string;
  totalUnits: number;
  occupiedUnits: number;
  monthlyRent: number;
  actualRent: number;
  expenses: number;
  netIncome: number;
  occupancyRate: number;
  avgRentPerUnit: number;
}

interface RentRollItem {
  id: number;
  propertyName: string;
  unitNumber: string;
  tenantName: string;
  rentAmount: number;
  paidAmount: number;
  dueDate: string;
  status: 'paid' | 'partial' | 'overdue' | 'vacant';
  daysOverdue?: number;
}

interface ExpenseItem {
  id: number;
  date: string;
  propertyName: string;
  category: string;
  description: string;
  amount: number;
  vendor: string;
  status: 'pending' | 'paid' | 'approved';
}

interface CashFlowSummary {
  totalGrossRent: number;
  totalCollected: number;
  totalExpenses: number;
  netCashFlow: number;
  collectionRate: number;
  vacancyLoss: number;
  operatingExpenseRatio: number;
}

function Accounting() {
  const router = useRouter();
  const [propertyFinancials, setPropertyFinancials] = useState<PropertyFinancials[]>([]);
  const [rentRoll, setRentRoll] = useState<RentRollItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [cashFlowSummary, setCashFlowSummary] = useState<CashFlowSummary>({
    totalGrossRent: 0,
    totalCollected: 0,
    totalExpenses: 0,
    netCashFlow: 0,
    collectionRate: 0,
    vacancyLoss: 0,
    operatingExpenseRatio: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'rentroll' | 'expenses' | 'analytics'>('overview');

  // Expense management state
  const [realExpenses, setRealExpenses] = useState<Expense[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseFormData, setExpenseFormData] = useState<ExpenseFormData>({
    title: '',
    description: '',
    amount: '',
    vendor: undefined,
    vendor_name_override: '',
    property_ref: 0,
    expense_date: new Date().toISOString().split('T')[0],
    due_date: '',
    is_recurring: false,
    recurrence_type: 'monthly',
    recurrence_end_date: '',
    receipt_file: null,
    status: 'pending',
    tags: '',
    notes: ''
  });
  const [expenseLoading, setExpenseLoading] = useState(false);
  
  // Vendor creation from expense modal
  const [showCreateVendorModal, setShowCreateVendorModal] = useState(false);
  const [vendorInputType, setVendorInputType] = useState<'quick' | 'existing'>('quick');
  const [vendorFormData, setVendorFormData] = useState<VendorFormData>({
    name: '',
    vendor_type: 'utility',
    contact_email: '',
    contact_phone: '',
    contact_person: '',
    address: '',
    tax_id: '',
    website: '',
    notes: '',
    landlord: 0,
    is_active: true
  });
  const [vendorLoading, setVendorLoading] = useState(false);

  // Analytics filtering state
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState<'all' | 'month' | 'year'>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchData();
  }, [selectedPeriod, selectedProperty]);

  useEffect(() => {
    fetchExpenseData();
  }, []);

  const fetchExpenseData = async () => {
    try {
      const [expensesResponse, vendorsResponse, propertiesResponse] = await Promise.all([
        expenseApi.getExpenses(),
        expenseApi.getVendors(),
        apiClient.getProperties()
      ]);
      
      setRealExpenses(expensesResponse);
      setVendors(vendorsResponse);
      setProperties(propertiesResponse.results || []);
    } catch (error) {
      console.error('Error fetching expense data:', error);
      setError('Failed to load expense data');
    }
  };

  const handleCreateExpense = () => {
    setEditingExpense(null);
    setExpenseFormData({
      title: '',
      description: '',
      amount: '',
      vendor: undefined,
      vendor_name_override: '',
      property_ref: 0,
      expense_date: new Date().toISOString().split('T')[0],
      due_date: '',
      is_recurring: false,
      recurrence_type: 'monthly',
      recurrence_end_date: '',
      receipt_file: null,
      status: 'pending',
      tags: '',
      notes: ''
    });
    setShowExpenseModal(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseFormData({
      title: expense.title,
      description: expense.description || '',
      amount: expense.amount.toString(),
      vendor: expense.vendor,
      vendor_name_override: expense.vendor_name || '',
      property_ref: expense.property_ref,
      expense_date: expense.expense_date,
      due_date: expense.due_date || '',
      is_recurring: expense.is_recurring,
      recurrence_type: expense.recurrence_type || 'monthly',
      recurrence_end_date: expense.recurrence_end_date || '',
      receipt_file: null,
      status: expense.status,
      tags: expense.tags || '',
      notes: expense.notes || ''
    });
    setShowExpenseModal(true);
  };

  const createExpenseFormData = (data: ExpenseFormData): FormData => {
    const formData = new FormData();
    
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('amount', data.amount);
    formData.append('expense_date', data.expense_date);
    formData.append('due_date', data.due_date);
    formData.append('is_recurring', data.is_recurring.toString());
    formData.append('recurrence_type', data.recurrence_type);
    formData.append('recurrence_end_date', data.recurrence_end_date);
    formData.append('status', data.status);
    formData.append('tags', data.tags);
    formData.append('notes', data.notes);
    formData.append('property_ref', data.property_ref.toString());
    formData.append('vendor_name_override', data.vendor_name_override);
    
    if (data.vendor) {
      formData.append('vendor', data.vendor.toString());
    }
    
    if (data.receipt_file) {
      formData.append('receipt_file', data.receipt_file);
    }
    
    return formData;
  };

  const handleSubmitExpense = async () => {
    try {
      setExpenseLoading(true);
      setError(null);

      const formData = createExpenseFormData(expenseFormData);

      if (editingExpense) {
        await expenseApi.updateExpense(editingExpense.id, formData);
      } else {
        await expenseApi.createExpense(formData);
      }

      setShowExpenseModal(false);
      await fetchExpenseData();
    } catch (error: any) {
      console.error('Error saving expense:', error);
      setError(error.message || 'Failed to save expense');
    } finally {
      setExpenseLoading(false);
    }
  };

  const handleExpenseAction = async (expense: Expense, action: 'approve' | 'reject' | 'pay') => {
    try {
      setExpenseLoading(true);
      
      if (action === 'approve') {
        await expenseApi.approveExpense(expense.id);
      } else if (action === 'pay') {
        await expenseApi.markExpensePaid(expense.id);
      }
      // Note: reject functionality would need to be added to backend if needed
      
      await fetchExpenseData();
    } catch (error: any) {
      console.error(`Error ${action}ing expense:`, error);
      setError(error.message || `Failed to ${action} expense`);
    } finally {
      setExpenseLoading(false);
    }
  };

  const handleExpenseFormChange = (field: keyof ExpenseFormData, value: any) => {
    setExpenseFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const cancelExpenseForm = () => {
    setShowExpenseModal(false);
    setEditingExpense(null);
  };

  const handleCreateVendorFromExpense = () => {
    setVendorFormData({
      name: expenseFormData.vendor_name_override || '',
      vendor_type: 'utility',
      contact_email: '',
      contact_phone: '',
      contact_person: '',
      address: '',
      tax_id: '',
      website: '',
      notes: '',
      landlord: properties.length > 0 ? properties[0].landlord : 0,
      is_active: true
    });
    setShowCreateVendorModal(true);
  };

  const handleVendorFormChange = (field: keyof VendorFormData, value: any) => {
    setVendorFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitVendor = async () => {
    try {
      setVendorLoading(true);
      
      const newVendor = await expenseApi.createVendor(vendorFormData);
      
      // Update vendors list
      await fetchExpenseData();
      
      // Select the new vendor in expense form
      handleExpenseFormChange('vendor', newVendor.id);
      handleExpenseFormChange('vendor_name_override', newVendor.name);
      
      setShowCreateVendorModal(false);
    } catch (error: any) {
      console.error('Error creating vendor:', error);
      setError(error.message || 'Failed to create vendor');
    } finally {
      setVendorLoading(false);
    }
  };

  const cancelVendorForm = () => {
    setShowCreateVendorModal(false);
  };

  // Expense Analytics Calculations
  const calculateExpenseAnalytics = () => {
    // Filter expenses based on selected time range
    let filteredExpenses = realExpenses;
    
    if (analyticsTimeRange === 'month') {
      filteredExpenses = realExpenses.filter(expense => {
        const expenseDate = new Date(expense.expense_date);
        return expenseDate.getMonth() === selectedMonth && 
               expenseDate.getFullYear() === selectedYear;
      });
    } else if (analyticsTimeRange === 'year') {
      filteredExpenses = realExpenses.filter(expense => {
        const expenseDate = new Date(expense.expense_date);
        return expenseDate.getFullYear() === selectedYear;
      });
    }

    if (!filteredExpenses.length) {
      const periodLabel = analyticsTimeRange === 'month' 
        ? `${new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
        : analyticsTimeRange === 'year' 
        ? `${selectedYear}`
        : 'selected period';
        
      return {
        totalExpenses: 0,
        expensesByCategory: {},
        expensesByStatus: {},
        topVendors: [],
        insights: [],
        periodLabel,
        expenseCount: 0,
        averageExpense: 0,
        categoryCounts: {}
      };
    }

    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    const expenseCount = filteredExpenses.length;
    const averageExpense = totalExpenses / expenseCount;

    // Group by category (vendor type) with better labeling
    const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
      const category = expense.vendor_type || 'Other';
      acc[category] = (acc[category] || 0) + parseFloat(expense.amount);
      return acc;
    }, {} as Record<string, number>);

    // Add category counts for better context
    const categoryCounts = filteredExpenses.reduce((acc, expense) => {
      const category = expense.vendor_type || 'Other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by status
    const expensesByStatus = filteredExpenses.reduce((acc, expense) => {
      acc[expense.status] = (acc[expense.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top vendors by spending
    const vendorTotals = filteredExpenses.reduce((acc, expense) => {
      const vendor = expense.effective_vendor_name;
      acc[vendor] = (acc[vendor] || 0) + parseFloat(expense.amount);
      return acc;
    }, {} as Record<string, number>);

    const vendorCounts = filteredExpenses.reduce((acc, expense) => {
      const vendor = expense.effective_vendor_name;
      acc[vendor] = (acc[vendor] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topVendors = Object.entries(vendorTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([vendor, amount]) => ({ 
        vendor, 
        amount, 
        count: vendorCounts[vendor] || 0,
        percentage: ((amount / totalExpenses) * 100).toFixed(1)
      }));

    // Enhanced insights with period context
    const insights = [];
    const overdueExpenses = filteredExpenses.filter(expense => expense.is_overdue).length;
    const recurringExpenses = filteredExpenses.filter(expense => expense.is_recurring).length;
    const pendingCount = expensesByStatus['pending'] || 0;
    
    const periodLabel = analyticsTimeRange === 'month' 
      ? `${new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
      : analyticsTimeRange === 'year' 
      ? `${selectedYear}`
      : 'all time';

    // Time-specific insights
    if (analyticsTimeRange !== 'all') {
      insights.push({
        type: 'neutral',
        icon: '📅',
        text: `Showing data for ${periodLabel} (${expenseCount} expenses)`
      });
    }
    
    if (overdueExpenses > 0) {
      insights.push({
        type: 'warning',
        icon: '⚠',
        text: `${overdueExpenses} expense${overdueExpenses > 1 ? 's' : ''} overdue for payment in ${periodLabel}`
      });
    }
    
    if (recurringExpenses > 0) {
      insights.push({
        type: 'neutral',
        icon: '🔄',
        text: `${recurringExpenses} recurring expense${recurringExpenses > 1 ? 's' : ''} scheduled`
      });
    }

    if (pendingCount > 0) {
      insights.push({
        type: 'warning',
        icon: '⏳',
        text: `${pendingCount} expense${pendingCount > 1 ? 's' : ''} awaiting approval`
      });
    }

    // Average expense insight
    if (averageExpense > 0) {
      insights.push({
        type: 'neutral',
        icon: '📊',
        text: `Average expense: ${formatCurrency(averageExpense)} across ${expenseCount} transactions`
      });
    }

    return {
      totalExpenses,
      expensesByCategory,
      expensesByStatus,
      topVendors,
      insights,
      periodLabel,
      expenseCount,
      averageExpense,
      categoryCounts
    };
  };

  const expenseAnalytics = calculateExpenseAnalytics();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch real data from backend APIs
      const [propertiesResponse, paymentSummary, paymentHistory] = await Promise.all([
        apiClient.getProperties(),
        apiClient.getLandlordPaymentSummary(),
        apiClient.getPaymentHistory({ page_size: 50 })
      ]);

      const properties = propertiesResponse.results || [];
      
      // Transform real data into PropertyFinancials format
      const realPropertyFinancials: PropertyFinancials[] = properties.map(property => {
        // Calculate property metrics from real data
        const propertyPayments = paymentHistory.payments?.filter(p => p.property_name === property.name) || [];
        const totalCollected = propertyPayments.reduce((sum, p) => sum + (p.amount_dollars || 0), 0);
        
        // Ensure monthly_rent is a number
        const monthlyRentValue = typeof property.monthly_rent === 'string' ? 
          parseFloat(property.monthly_rent) || 0 : property.monthly_rent || 0;
        
        const avgRentPerUnit = monthlyRentValue && property.total_rooms ? 
          monthlyRentValue / property.total_rooms : monthlyRentValue;
        
        // Calculate occupancy rate with estimation (we don't have current_occupancy in the Property type)
        // Assume 90% occupancy as default
        const occupancyRate = property.total_rooms > 0 ? 
          ((property.total_rooms * 0.9) / property.total_rooms) * 100 : 0;
        const occupiedUnits = Math.round((occupancyRate / 100) * property.total_rooms);
        
        // Estimate expenses as 30% of gross rent (common property management ratio)
        const estimatedExpenses = monthlyRentValue * 0.3;
        const netIncome = totalCollected - estimatedExpenses;

        return {
          id: property.id,
          name: property.name,
          address: `${property.address_line1}${property.address_line2 ? ', ' + property.address_line2 : ''}, ${property.city}, ${property.state}`,
          totalUnits: property.total_rooms || 1,
          occupiedUnits: occupiedUnits,
          monthlyRent: monthlyRentValue,
          actualRent: totalCollected,
          expenses: estimatedExpenses,
          netIncome: netIncome,
          occupancyRate: Math.round(occupancyRate * 10) / 10,
          avgRentPerUnit: Math.round(avgRentPerUnit)
        };
      });

      // Transform payment history into rent roll format
      const realRentRoll: RentRollItem[] = (paymentHistory.payments || []).map(payment => {
        // Determine status based on payment status and amount
        let status: 'paid' | 'partial' | 'overdue' | 'vacant' = 'paid';
        let daysOverdue: number | undefined;
        
        if (payment.status === 'succeeded') {
          status = 'paid';
        } else if (payment.status === 'pending') {
          status = 'partial'; // Show pending as partial
        } else if (payment.status === 'failed') {
          status = 'overdue';
          // Calculate days overdue based on rent period
          if (payment.rent_period_start) {
            const rentDate = new Date(payment.rent_period_start);
            const today = new Date();
            daysOverdue = Math.max(0, Math.floor((today.getTime() - rentDate.getTime()) / (1000 * 60 * 60 * 24)));
          }
        }

        return {
          id: payment.id,
          propertyName: payment.property_name || 'Unknown Property',
          unitNumber: 'Unit', // We don't have unit numbers in payment data, using generic
          tenantName: payment.tenant_name || 'Unknown Tenant',
          rentAmount: payment.amount_dollars || 0,
          paidAmount: payment.status === 'succeeded' ? (payment.amount_dollars || 0) : 0,
          dueDate: payment.rent_period_start || payment.payment_date || '',
          status: status,
          daysOverdue: daysOverdue
        };
      });

      // For expenses, we'll use a simplified approach since we don't have expense tracking yet
      // Show some estimated common expenses based on payment data
      const realExpenses: ExpenseItem[] = realPropertyFinancials.flatMap(property => [
        {
          id: property.id * 100 + 1,
          date: new Date().toISOString().split('T')[0],
          propertyName: property.name,
          category: 'Maintenance',
          description: 'Property maintenance and repairs',
          amount: Math.round(property.expenses * 0.4), // 40% of estimated expenses
          vendor: 'Various Vendors',
          status: 'paid' as const
        },
        {
          id: property.id * 100 + 2,
          date: new Date().toISOString().split('T')[0],
          propertyName: property.name,
          category: 'Insurance',
          description: 'Property insurance',
          amount: Math.round(property.expenses * 0.3), // 30% of estimated expenses
          vendor: 'Insurance Provider',
          status: 'paid' as const
        },
        {
          id: property.id * 100 + 3,
          date: new Date().toISOString().split('T')[0],
          propertyName: property.name,
          category: 'Management',
          description: 'Property management fees',
          amount: Math.round(property.expenses * 0.3), // 30% of estimated expenses
          vendor: 'Property Manager',
          status: 'paid' as const
        }
      ]);

      // Calculate totals from real data  
      const totalGrossRent = realPropertyFinancials.reduce((sum, p) => sum + p.monthlyRent, 0);
      const totalCollected = realPropertyFinancials.reduce((sum, p) => sum + p.actualRent, 0);
      const totalExpenses = realPropertyFinancials.reduce((sum, p) => sum + p.expenses, 0);
      const netCashFlow = totalCollected - totalExpenses;
      const collectionRate = (totalCollected / totalGrossRent) * 100;
      const vacancyLoss = totalGrossRent - totalCollected;
      const operatingExpenseRatio = (totalExpenses / totalGrossRent) * 100;

      setPropertyFinancials(realPropertyFinancials);
      setRentRoll(realRentRoll);
      setExpenses(realExpenses);
      setCashFlowSummary({
        totalGrossRent,
        totalCollected,
        totalExpenses,
        netCashFlow,
        collectionRate,
        vacancyLoss,
        operatingExpenseRatio
      });
    } catch (error: any) {
      console.error('Failed to fetch accounting data:', error);
      setError(error?.message || 'Failed to load accounting data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const downloadFinancialReport = () => {
    const csvData = [
      ['Property', 'Total Units', 'Occupied', 'Gross Rent', 'Actual Rent', 'Expenses', 'Net Income', 'Occupancy Rate'],
      ...propertyFinancials.map(property => [
        property.name,
        property.totalUnits.toString(),
        property.occupiedUnits.toString(),
        formatCurrency(property.monthlyRent),
        formatCurrency(property.actualRent),
        formatCurrency(property.expenses),
        formatCurrency(property.netIncome),
        `${property.occupancyRate}%`
      ])
    ];
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `property-financial-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getUniqueProperties = () => {
    const properties = propertyFinancials.map(p => ({ id: p.id.toString(), name: p.name }));
    return [{ id: 'all', name: 'All Properties' }, ...properties];
  };

  const filteredData = selectedProperty === 'all' 
    ? { propertyFinancials, rentRoll, expenses }
    : {
        propertyFinancials: propertyFinancials.filter(p => p.id.toString() === selectedProperty),
        rentRoll: rentRoll.filter(r => {
          const property = propertyFinancials.find(p => p.id.toString() === selectedProperty);
          return property && r.propertyName.includes(property.name.split(' ')[0]);
        }),
        expenses: expenses.filter(e => {
          const property = propertyFinancials.find(p => p.id.toString() === selectedProperty);
          return property && (e.propertyName.includes(property.name.split(' ')[0]) || e.propertyName === 'All Properties');
        })
      };

  if (loading) {
    return (
      <DashboardLayout
        title="Property Accounting"
        subtitle="Loading financial data..."
      >
        <LoadingSpinner />
        
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
    <DashboardLayout title="">
      <Head>
        <title>Property Accounting - Tink Property Management</title>
      </Head>
      
      <div className="dashboard-container">
        {/* Custom Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="dashboard-title">Property Accounting</h1>
              <div className="subtitle-container">
                <p className="welcome-message">
                  Financial overview and rent management across your property portfolio
                </p>
              </div>
            </div>
            <div className="header-right">
              <select 
                value={selectedProperty} 
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="property-selector"
              >
                {getUniqueProperties().map(property => (
                  <option key={property.id} value={property.id}>{property.name}</option>
                ))}
              </select>
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="period-selector"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {error}
          </div>
        )}
        
        {/* Key Performance Indicators */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-info">
                <h3 className="metric-title">Net Cash Flow</h3>
                <div className="metric-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="metric-content">
              <div className="metric-value">{formatCurrency(cashFlowSummary.netCashFlow)}</div>
              <div className="metric-subtitle">Monthly net income</div>
              <div className="metric-progress">
                <span className="metric-label">vs last month</span>
                <span className="metric-change positive">+8.2%</span>
              </div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-info">
                <h3 className="metric-title">Collection Rate</h3>
                <div className="metric-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="metric-content">
              <div className="metric-value">{cashFlowSummary.collectionRate.toFixed(1)}%</div>
              <div className="metric-subtitle">Of gross potential rent</div>
              <div className="metric-progress">
                <span className="metric-label">{formatCurrency(cashFlowSummary.totalCollected)} collected</span>
                <span className="metric-change positive">+2.1%</span>
              </div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-info">
                <h3 className="metric-title">Avg Occupancy</h3>
                <div className="metric-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 21V8L12 3L21 8V21H3Z"/>
                    <path d="M9 21V12H15V21"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="metric-content">
              <div className="metric-value">
                {(propertyFinancials.reduce((sum, p) => sum + p.occupancyRate, 0) / propertyFinancials.length).toFixed(1)}%
              </div>
              <div className="metric-subtitle">Across all properties</div>
              <div className="metric-progress">
                <span className="metric-label">
                  {propertyFinancials.reduce((sum, p) => sum + p.occupiedUnits, 0)} / {propertyFinancials.reduce((sum, p) => sum + p.totalUnits, 0)} units
                </span>
                <span className="metric-change positive">+1.3%</span>
              </div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-info">
                <h3 className="metric-title">Expense Ratio</h3>
                <div className="metric-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="metric-content">
              <div className="metric-value">{cashFlowSummary.operatingExpenseRatio.toFixed(1)}%</div>
              <div className="metric-subtitle">Of gross potential rent</div>
              <div className="metric-progress">
                <span className="metric-label">{formatCurrency(cashFlowSummary.totalExpenses)} total</span>
                <span className="metric-change warning">+5.2%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            Property Overview
          </button>
          <button 
            className={`tab-button ${activeTab === 'rentroll' ? 'active' : ''}`}
            onClick={() => setActiveTab('rentroll')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Rent Roll
          </button>
          <button 
            className={`tab-button ${activeTab === 'expenses' ? 'active' : ''}`}
            onClick={() => setActiveTab('expenses')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
            </svg>
            Expenses
          </button>
          <button 
            className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 21H3V3"/>
              <path d="M7 14L12 9L16 13L21 8"/>
            </svg>
            Analytics
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="tab-content">
            <div className="properties-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Property Performance ({filteredData.propertyFinancials.length})</h2>
                  <p className="section-subtitle">Financial overview by property</p>
                </div>
                <div className="section-actions">
                  <button onClick={() => fetchData()} className="refresh-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 4 23 10 17 10"/>
                      <polyline points="1 20 1 14 7 14"/>
                      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                    </svg>
                    Refresh
                  </button>
                  <button onClick={downloadFinancialReport} className="download-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7,10 12,15 17,10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Export Report
                  </button>
                </div>
              </div>

              <div className="properties-table-container">
                <table className="properties-table">
                  <thead>
                    <tr>
                      <th className="table-left">Property</th>
                      <th className="table-center">Occupancy</th>
                      <th className="table-right">Gross Rent</th>
                      <th className="table-right">Actual Rent</th>
                      <th className="table-right">Expenses</th>
                      <th className="table-right">Net Income</th>
                      <th className="table-center">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.propertyFinancials.map((property) => (
                      <tr key={property.id}>
                        <td className="table-left">
                          <div className="property-info">
                            <div className="property-name">{property.name}</div>
                            <div className="property-address">{property.address}</div>
                          </div>
                        </td>
                        <td className="table-center">
                          <div className="occupancy-info">
                            <div className="occupancy-rate">{property.occupancyRate}%</div>
                            <div className="occupancy-units">{property.occupiedUnits}/{property.totalUnits} units</div>
                          </div>
                        </td>
                        <td className="table-right">
                          <div className="amount-info">
                            <div className="amount-primary">{formatCurrency(property.monthlyRent)}</div>
                            <div className="amount-secondary">{formatCurrency(property.avgRentPerUnit)}/unit</div>
                          </div>
                        </td>
                        <td className="table-right">
                          <div className="amount-info">
                            <div className="amount-primary">{formatCurrency(property.actualRent)}</div>
                            <div className="amount-secondary">
                              {((property.actualRent / property.monthlyRent) * 100).toFixed(1)}% collected
                            </div>
                          </div>
                        </td>
                        <td className="table-right">
                          <div className="amount-info">
                            <div className="amount-primary expense">{formatCurrency(property.expenses)}</div>
                            <div className="amount-secondary">
                              {((property.expenses / property.monthlyRent) * 100).toFixed(1)}% of gross
                            </div>
                          </div>
                        </td>
                        <td className="table-right">
                          <div className="amount-info">
                            <div className="amount-primary income">{formatCurrency(property.netIncome)}</div>
                            <div className="amount-secondary">
                              {((property.netIncome / property.actualRent) * 100).toFixed(1)}% margin
                            </div>
                          </div>
                        </td>
                        <td className="table-center">
                          <div className="performance-indicator">
                            <div className={`performance-badge ${
                              property.occupancyRate >= 95 && (property.netIncome / property.actualRent) >= 0.6 ? 'excellent' :
                              property.occupancyRate >= 90 && (property.netIncome / property.actualRent) >= 0.5 ? 'good' :
                              property.occupancyRate >= 85 ? 'average' : 'poor'
                            }`}>
                              {property.occupancyRate >= 95 && (property.netIncome / property.actualRent) >= 0.6 ? 'Excellent' :
                               property.occupancyRate >= 90 && (property.netIncome / property.actualRent) >= 0.5 ? 'Good' :
                               property.occupancyRate >= 85 ? 'Average' : 'Needs Attention'}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rentroll' && (
          <div className="tab-content">
            <div className="rentroll-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Rent Roll ({filteredData.rentRoll.length} units)</h2>
                  <p className="section-subtitle">Current month rent collection status</p>
                </div>
                <div className="section-actions">
                  <button className="action-btn primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    Collect Rent
                  </button>
                  <button className="action-btn secondary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 16l4 4 4-4"/>
                      <path d="M7 20V4"/>
                      <path d="M11 4L21 4"/>
                    </svg>
                    Send Reminders
                  </button>
                </div>
              </div>

              <div className="rentroll-table-container">
                <table className="rentroll-table">
                  <thead>
                    <tr>
                      <th className="table-left">Unit Details</th>
                      <th className="table-left">Tenant</th>
                      <th className="table-right">Rent Amount</th>
                      <th className="table-right">Paid Amount</th>
                      <th className="table-center">Due Date</th>
                      <th className="table-center">Status</th>
                      <th className="table-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.rentRoll.map((item) => (
                      <tr key={item.id}>
                        <td className="table-left">
                          <div className="unit-info">
                            <div className="unit-number">{item.unitNumber}</div>
                            <div className="property-name">{item.propertyName}</div>
                          </div>
                        </td>
                        <td className="table-left">
                          <div className="tenant-info">
                            {item.tenantName || 'Vacant'}
                          </div>
                        </td>
                        <td className="table-right">
                          <div className="amount">{formatCurrency(item.rentAmount)}</div>
                        </td>
                        <td className="table-right">
                          <div className="amount">
                            {formatCurrency(item.paidAmount)}
                            {item.paidAmount < item.rentAmount && item.status !== 'vacant' && (
                              <div className="amount-shortage">
                                -{formatCurrency(item.rentAmount - item.paidAmount)} remaining
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="table-center">
                          <div className="due-date">
                            {formatDate(item.dueDate)}
                            {item.daysOverdue && item.daysOverdue > 0 && (
                              <div className="overdue-indicator">
                                {item.daysOverdue} days overdue
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="table-center">
                          <span className={`rent-status-badge ${item.status}`}>
                            {item.status === 'paid' && '✓ Paid'}
                            {item.status === 'partial' && '⚠ Partial'}
                            {item.status === 'overdue' && '⚠ Overdue'}
                            {item.status === 'vacant' && '○ Vacant'}
                          </span>
                        </td>
                        <td className="table-center">
                          <div className="rent-actions">
                            {item.status === 'partial' || item.status === 'overdue' ? (
                              <>
                                <button className="rent-action-btn collect">Collect</button>
                                <button className="rent-action-btn remind">Remind</button>
                              </>
                            ) : item.status === 'vacant' ? (
                              <button className="rent-action-btn market">Market</button>
                            ) : (
                              <button className="rent-action-btn view">View</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="tab-content">
            <div className="expenses-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Expense Tracking ({realExpenses.length})</h2>
                  <p className="section-subtitle">Property expenses and vendor payments</p>
                </div>
                <div className="section-actions">
                  <button className="action-btn primary" onClick={handleCreateExpense}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add Expense
                  </button>
                  <button className="action-btn secondary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7,10 12,15 17,10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Export
                  </button>
                </div>
              </div>

              <div className="expenses-table-container">
                <table className="expenses-table">
                  <thead>
                    <tr>
                      <th className="table-left">Date</th>
                      <th className="table-left">Property</th>
                      <th className="table-left">Category</th>
                      <th className="table-left">Description</th>
                      <th className="table-left">Vendor</th>
                      <th className="table-right">Amount</th>
                      <th className="table-center">Status</th>
                      <th className="table-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {realExpenses.map((expense) => (
                      <tr key={expense.id}>
                        <td className="table-left">
                          <div className="expense-date">{formatDate(expense.expense_date)}</div>
                        </td>
                        <td className="table-left">
                          <div className="expense-property">{expense.property_name}</div>
                        </td>
                        <td className="table-left">
                          <span className="category-badge">{expense.vendor_type || 'General'}</span>
                        </td>
                        <td className="table-left">
                          <div className="expense-description">{expense.title}</div>
                        </td>
                        <td className="table-left">
                          <div className="expense-vendor">{expense.effective_vendor_name}</div>
                        </td>
                        <td className="table-right">
                          <div className="expense-amount">{formatCurrency(parseFloat(expense.amount))}</div>
                        </td>
                        <td className="table-center">
                          <span className={`expense-status-badge ${expense.status}`}>
                            {expense.status === 'paid' && '✓ Paid'}
                            {expense.status === 'approved' && '○ Approved'}
                            {expense.status === 'pending' && '⚠ Pending'}
                          </span>
                        </td>
                        <td className="table-center">
                          <div className="expense-actions">
                            {expense.status === 'pending' && (
                              <>
                                <button 
                                  className="expense-action-btn approve"
                                  onClick={() => handleExpenseAction(expense, 'approve')}
                                  disabled={expenseLoading}
                                >
                                  Approve
                                </button>
                                <button 
                                  className="expense-action-btn edit"
                                  onClick={() => handleEditExpense(expense)}
                                >
                                  Edit
                                </button>
                              </>
                            )}
                            {expense.status === 'approved' && (
                              <>
                                <button 
                                  className="expense-action-btn pay"
                                  onClick={() => handleExpenseAction(expense, 'pay')}
                                  disabled={expenseLoading}
                                >
                                  Pay
                                </button>
                                <button 
                                  className="expense-action-btn edit"
                                  onClick={() => handleEditExpense(expense)}
                                >
                                  Edit
                                </button>
                              </>
                            )}
                            {expense.status === 'paid' && (
                              <button 
                                className="expense-action-btn view"
                                onClick={() => handleEditExpense(expense)}
                              >
                                View
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="tab-content">
            <div className="analytics-section">
              {/* Analytics Time Filter */}
              <div className="analytics-filters">
                <div className="filter-group">
                  <h3 className="analytics-section-title">
                    Financial Analytics
                    <span className="analytics-subtitle">
                      {expenseAnalytics.periodLabel === 'all time' 
                        ? `All expense data (${expenseAnalytics.expenseCount} total expenses)`
                        : `Data for ${expenseAnalytics.periodLabel} (${expenseAnalytics.expenseCount} expenses)`
                      }
                    </span>
                  </h3>
                </div>
                
                <div className="filter-controls">
                  <div className="filter-item">
                    <label>Time Period:</label>
                    <select 
                      value={analyticsTimeRange} 
                      onChange={(e) => setAnalyticsTimeRange(e.target.value as 'all' | 'month' | 'year')}
                      className="filter-select"
                    >
                      <option value="all">All Time</option>
                      <option value="month">Monthly View</option>
                      <option value="year">Yearly View</option>
                    </select>
                  </div>

                  {analyticsTimeRange === 'month' && (
                    <>
                      <div className="filter-item">
                        <label>Month:</label>
                        <select 
                          value={selectedMonth} 
                          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                          className="filter-select"
                        >
                          {Array.from({length: 12}, (_, i) => (
                            <option key={i} value={i}>
                              {new Date(2024, i).toLocaleDateString('en-US', { month: 'long' })}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="filter-item">
                        <label>Year:</label>
                        <select 
                          value={selectedYear} 
                          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                          className="filter-select"
                        >
                          {Array.from({length: 5}, (_, i) => {
                            const year = new Date().getFullYear() - 2 + i;
                            return <option key={year} value={year}>{year}</option>
                          })}
                        </select>
                      </div>
                    </>
                  )}

                  {analyticsTimeRange === 'year' && (
                    <div className="filter-item">
                      <label>Year:</label>
                      <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="filter-select"
                      >
                        {Array.from({length: 5}, (_, i) => {
                          const year = new Date().getFullYear() - 2 + i;
                          return <option key={year} value={year}>{year}</option>
                        })}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="analytics-grid">
                <div className="analytics-card">
                  <h3 className="analytics-title">Cash Flow Trend</h3>
                  <div className="analytics-placeholder">
                    <svg width="100%" height="200" viewBox="0 0 400 200">
                      <path d="M20,180 L80,120 L140,100 L200,80 L260,60 L320,40 L380,20" 
                            stroke="#4f46e5" strokeWidth="3" fill="none"/>
                      <circle cx="380" cy="20" r="4" fill="#4f46e5"/>
                    </svg>
                    <p>Net cash flow trending upward over the last 6 months</p>
                  </div>
                </div>

                <div className="analytics-card">
                  <h3 className="analytics-title">Property Performance</h3>
                  <div className="performance-comparison">
                    {filteredData.propertyFinancials.map((property, index) => (
                      <div key={property.id} className="performance-item">
                        <div className="performance-name">{property.name.split(' ')[0]}</div>
                        <div className="performance-bar">
                          <div 
                            className="performance-fill" 
                            style={{ width: `${property.occupancyRate}%` }}
                          ></div>
                        </div>
                        <div className="performance-value">{property.occupancyRate}%</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="analytics-card">
                  <h3 className="analytics-title">
                    Expense Breakdown by Category
                    <span className="card-subtitle">Percentage of total spending: {formatCurrency(expenseAnalytics.totalExpenses)}</span>
                  </h3>
                  <div className="expense-breakdown">
                    {Object.entries(expenseAnalytics.expensesByCategory).length > 0 ? (
                      Object.entries(expenseAnalytics.expensesByCategory)
                        .sort(([,a], [,b]) => b - a)
                        .map(([category, amount]) => {
                          const percentage = ((amount / expenseAnalytics.totalExpenses) * 100).toFixed(1);
                          const categoryClass = category.toLowerCase().replace(/[^a-z]/g, '');
                          const count = expenseAnalytics.categoryCounts[category] || 0;
                          const avgPerExpense = amount / count;
                          
                          return (
                            <div key={category} className="expense-item" title={`${count} expense${count !== 1 ? 's' : ''} • Average: ${formatCurrency(avgPerExpense)}`}>
                              <div className="expense-category-info">
                                <span className="expense-category">{category}</span>
                                <span className="expense-details">{count} expense{count !== 1 ? 's' : ''}</span>
                              </div>
                              <div className="expense-amounts">
                                <span className="expense-amount">{formatCurrency(amount)}</span>
                                <span className="expense-percentage">{percentage}%</span>
                              </div>
                              <div className="expense-bar">
                                <div 
                                  className={`expense-fill ${categoryClass}`} 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <div className="no-data">
                        <p>No expense data available</p>
                        <small>Add some expenses to see category breakdown</small>
                      </div>
                    )}
                  </div>
                </div>

                <div className="analytics-card">
                  <h3 className="analytics-title">
                    Top Vendors by Spending
                    <span className="card-subtitle">Ranked by total amount spent • {expenseAnalytics.topVendors.length} vendors</span>
                  </h3>
                  <div className="top-vendors">
                    {expenseAnalytics.topVendors.length > 0 ? (
                      expenseAnalytics.topVendors.map((vendor, index) => {
                        return (
                          <div key={vendor.vendor} className="vendor-item" title={`${vendor.count} transaction${vendor.count !== 1 ? 's' : ''} • Average: ${formatCurrency(vendor.amount / vendor.count)}`}>
                            <div className="vendor-rank">#{index + 1}</div>
                            <div className="vendor-info">
                              <div className="vendor-name">{vendor.vendor}</div>
                              <div className="vendor-amount">
                                {formatCurrency(vendor.amount)} • {vendor.count} transaction{vendor.count !== 1 ? 's' : ''}
                              </div>
                            </div>
                            <div className="vendor-percentage">{vendor.percentage}%</div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="no-data">
                        <p>No vendor data available</p>
                        <small>Add expenses to see top vendors</small>
                      </div>
                    )}
                  </div>
                </div>

                <div className="analytics-card">
                  <h3 className="analytics-title">Expense Status Overview</h3>
                  <div className="status-overview">
                    {Object.entries(expenseAnalytics.expensesByStatus).length > 0 ? (
                      Object.entries(expenseAnalytics.expensesByStatus).map(([status, count]) => {
                        const statusColors = {
                          pending: '#f59e0b',
                          approved: '#3b82f6', 
                          paid: '#10b981',
                          draft: '#6b7280',
                          cancelled: '#ef4444'
                        };
                        const statusLabels = {
                          pending: 'Pending Approval',
                          approved: 'Approved',
                          paid: 'Paid',
                          draft: 'Draft',
                          cancelled: 'Cancelled'
                        };
                        
                        return (
                          <div key={status} className="status-item">
                            <div 
                              className="status-dot" 
                              style={{ backgroundColor: statusColors[status as keyof typeof statusColors] || '#6b7280' }}
                            ></div>
                            <div className="status-info">
                              <div className="status-label">{statusLabels[status as keyof typeof statusLabels] || status}</div>
                              <div className="status-count">{count} expense{count !== 1 ? 's' : ''}</div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="no-data">
                        <p>No expense status data</p>
                        <small>Add expenses to see status breakdown</small>
                      </div>
                    )}
                  </div>
                </div>

                <div className="analytics-card">
                  <h3 className="analytics-title">Key Insights</h3>
                  <div className="insights-list">
                    <div className="insight-item positive">
                      <div className="insight-icon">↗</div>
                      <div className="insight-text">Collection rate improved by 2.1% this month</div>
                    </div>
                    
                    {expenseAnalytics.insights.map((insight, index) => (
                      <div key={index} className={`insight-item ${insight.type}`}>
                        <div className="insight-icon">{insight.icon}</div>
                        <div className="insight-text">{insight.text}</div>
                      </div>
                    ))}
                    
                    {expenseAnalytics.totalExpenses > 0 && (
                      <div className="insight-item neutral">
                        <div className="insight-icon">💰</div>
                        <div className="insight-text">
                          Total expenses: {formatCurrency(expenseAnalytics.totalExpenses)} across {Object.keys(expenseAnalytics.expensesByCategory).length} categories
                        </div>
                      </div>
                    )}
                    
                    <div className="insight-item positive">
                      <div className="insight-icon">✓</div>
                      <div className="insight-text">Sunset Gardens has highest profitability</div>
                    </div>
                    <div className="insight-item neutral">
                      <div className="insight-icon">○</div>
                      <div className="insight-text">Average rent increase opportunity: 3-5%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .dashboard-container {
          width: 100%;
          padding: 16px 20px 20px 20px;
          background: #f8fafc;
          min-height: calc(100vh - 72px);
          box-sizing: border-box;
        }

        /* Header Styles */
        .dashboard-header {
          margin-bottom: 24px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }

        .header-left {
          flex: 1;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dashboard-title {
          font-size: 22px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
          line-height: 1.15;
        }

        .subtitle-container {
          min-height: 22px;
        }

        .welcome-message {
          font-size: 14px;
          color: #4b5563;
          margin: 0;
          line-height: 1.45;
        }

        .property-selector,
        .period-selector {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 14px;
          font-weight: 500;
          color: #1e293b;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .property-selector:hover,
        .period-selector:hover {
          border-color: #4f46e5;
        }

        .property-selector:focus,
        .period-selector:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        /* Error Banner */
        .error-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
        }

        /* Metrics Grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .metric-card {
          background: white;
          border-radius: 8px;
          padding: 16px;
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
          margin-bottom: 12px;
        }

        .metric-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .metric-title {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .metric-icon {
          width: 20px;
          height: 20px;
          color: #64748b;
        }

        .metric-content {
          margin-top: 8px;
        }

        .metric-value {
          font-size: 22px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 4px;
          line-height: 1;
        }

        .metric-subtitle {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 12px;
        }

        .metric-progress {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .metric-label {
          font-size: 12px;
          color: #64748b;
        }

        .metric-change {
          font-size: 12px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .metric-change.positive {
          color: #059669;
          background: #dcfce7;
        }

        .metric-change.warning {
          color: #d97706;
          background: #fef3c7;
        }

        /* Tab Navigation */
        .tab-navigation {
          display: flex;
          background: white;
          border-radius: 8px;
          padding: 4px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        .tab-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          border: none;
          background: transparent;
          color: #64748b;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .tab-button.active {
          background: #4f46e5;
          color: white;
          box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
        }

        .tab-button:not(.active):hover {
          background: #f1f5f9;
          color: #1e293b;
        }

        /* Section Headers */
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .section-subtitle {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }

        .section-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        /* Action Buttons */
        .refresh-btn,
        .download-btn,
        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .refresh-btn {
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }

        .refresh-btn:hover {
          background: #e2e8f0;
          transform: translateY(-1px);
        }

        .download-btn {
          background: #4f46e5;
          color: white;
        }
        
        .download-btn:hover {
          background: #3730a3;
          transform: translateY(-1px);
        }

        .action-btn.primary {
          background: #4f46e5;
          color: white;
        }

        .action-btn.primary:hover {
          background: #3730a3;
        }

        .action-btn.secondary {
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }

        .action-btn.secondary:hover {
          background: #e2e8f0;
        }

        /* Tab Content */
        .tab-content {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        /* Property Overview Table */
        .properties-table-container {
          overflow-x: auto;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .properties-table {
          width: 100%;
          border-collapse: collapse;
        }

        .properties-table th {
          background: #f8fafc;
          padding: 12px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #e2e8f0;
        }

        .properties-table td {
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        .properties-table tbody tr:hover {
          background: #f9fafb;
        }

        .property-info .property-name {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 2px;
        }

        .property-info .property-address {
          font-size: 12px;
          color: #64748b;
        }

        .occupancy-info .occupancy-rate {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 2px;
        }

        .occupancy-info .occupancy-units {
          font-size: 12px;
          color: #64748b;
        }

        .amount-info .amount-primary {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 2px;
        }

        .amount-info .amount-primary.expense {
          color: #dc2626;
        }

        .amount-info .amount-primary.income {
          color: #059669;
        }

        .amount-info .amount-secondary {
          font-size: 12px;
          color: #64748b;
        }

        .performance-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .performance-badge.excellent {
          background: #dcfce7;
          color: #166534;
        }

        .performance-badge.good {
          background: #dbeafe;
          color: #1e40af;
        }

        .performance-badge.average {
          background: #fef3c7;
          color: #92400e;
        }

        .performance-badge.poor {
          background: #fee2e2;
          color: #991b1b;
        }

        /* Rent Roll Table */
        .rentroll-table-container,
        .expenses-table-container {
          overflow-x: auto;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          max-height: 500px;
          overflow-y: auto;
        }

        .rentroll-table,
        .expenses-table {
          width: 100%;
          border-collapse: collapse;
        }

        .rentroll-table th,
        .expenses-table th {
          background: #f8fafc;
          padding: 12px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .rentroll-table td,
        .expenses-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        .rentroll-table tbody tr:hover,
        .expenses-table tbody tr:hover {
          background: #f9fafb;
        }

        .unit-info .unit-number {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 2px;
        }

        .unit-info .property-name {
          font-size: 12px;
          color: #64748b;
        }

        .tenant-info {
          font-weight: 500;
          color: #1e293b;
        }

        .amount {
          font-weight: 600;
          color: #1e293b;
        }

        .amount-shortage {
          font-size: 11px;
          color: #dc2626;
          margin-top: 2px;
        }

        .due-date {
          font-weight: 500;
          color: #1e293b;
        }

        .overdue-indicator {
          font-size: 11px;
          color: #dc2626;
          margin-top: 2px;
          font-weight: 600;
        }

        .rent-status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .rent-status-badge.paid {
          background: #dcfce7;
          color: #166534;
        }

        .rent-status-badge.partial {
          background: #fef3c7;
          color: #92400e;
        }

        .rent-status-badge.overdue {
          background: #fee2e2;
          color: #991b1b;
        }

        .rent-status-badge.vacant {
          background: #f3f4f6;
          color: #374151;
        }

        .rent-actions {
          display: flex;
          gap: 6px;
        }

        .rent-action-btn {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .rent-action-btn.collect {
          background: #4f46e5;
          color: white;
        }

        .rent-action-btn.remind {
          background: #f59e0b;
          color: white;
        }

        .rent-action-btn.market {
          background: #10b981;
          color: white;
        }

        .rent-action-btn.view {
          background: #6b7280;
          color: white;
        }

        /* Expense Table Specific */
        .category-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          background: #f3f4f6;
          color: #374151;
        }

        .expense-status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .expense-status-badge.paid {
          background: #dcfce7;
          color: #166534;
        }

        .expense-status-badge.approved {
          background: #dbeafe;
          color: #1e40af;
        }

        .expense-status-badge.pending {
          background: #fef3c7;
          color: #92400e;
        }

        .expense-actions {
          display: flex;
          gap: 6px;
        }

        .expense-action-btn {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .expense-action-btn.approve {
          background: #10b981;
          color: white;
        }

        .expense-action-btn.reject {
          background: #ef4444;
          color: white;
        }

        .expense-action-btn.pay {
          background: #4f46e5;
          color: white;
        }

        .expense-action-btn.view {
          background: #6b7280;
          color: white;
        }

        /* Analytics Section */
        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .analytics-card {
          background: #f9fafb;
          border-radius: 8px;
          padding: 20px;
          border: 1px solid #e2e8f0;
        }

        .analytics-title {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 16px 0;
        }

        .analytics-placeholder {
          text-align: center;
          color: #64748b;
        }

        .analytics-placeholder p {
          margin: 16px 0 0 0;
          font-size: 14px;
        }

        .performance-comparison {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .performance-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .performance-name {
          min-width: 80px;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
        }

        .performance-bar {
          flex: 1;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .performance-fill {
          height: 100%;
          background: #4f46e5;
          transition: width 0.3s ease;
        }

        .performance-value {
          min-width: 40px;
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
          text-align: right;
        }

        .expense-breakdown {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .expense-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .expense-category {
          min-width: 80px;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
        }

        .expense-percentage {
          min-width: 40px;
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
        }

        .expense-bar {
          flex: 1;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .expense-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .expense-fill.maintenance { background: #ef4444; }
        .expense-fill.utilities { background: #f59e0b; }
        .expense-fill.insurance { background: #3b82f6; }
        .expense-fill.other { background: #6b7280; }

        .insights-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .insight-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }

        .insight-item.positive {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }

        .insight-item.warning {
          background: #fffbeb;
          border-color: #fed7aa;
        }

        .insight-item.neutral {
          background: #f8fafc;
          border-color: #e2e8f0;
        }

        .insight-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .insight-item.positive .insight-icon {
          background: #dcfce7;
          color: #166534;
        }

        .insight-item.warning .insight-icon {
          background: #fef3c7;
          color: #92400e;
        }

        .insight-item.neutral .insight-icon {
          background: #f1f5f9;
          color: #64748b;
        }

        .insight-text {
          font-size: 14px;
          color: #374151;
        }

        /* Utility classes */
        .table-left { text-align: left !important; }
        .table-right { text-align: right !important; }
        .table-center { text-align: center !important; }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .analytics-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .dashboard-container {
            padding: 16px 12px;
          }

          .header-content {
            flex-direction: column;
            gap: 12px;
          }

          .tab-navigation {
            flex-wrap: wrap;
          }

          .tab-button {
            font-size: 12px;
            padding: 10px 12px;
          }
        }

        @media (max-width: 480px) {
          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .section-header {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }

          .section-actions {
            flex-direction: column;
            gap: 8px;
          }
        }

        /* Dark Mode Support */
        :global(.dark-mode) .dashboard-container { background: transparent; }
        :global(.dark-mode) .metric-card,
        :global(.dark-mode) .tab-navigation,
        :global(.dark-mode) .tab-content,
        :global(.dark-mode) .analytics-card {
          background: #111111 !important;
          border: 1px solid #333333 !important;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4) !important;
        }
        :global(.dark-mode) .properties-table th,
        :global(.dark-mode) .rentroll-table th,
        :global(.dark-mode) .expenses-table th {
          background: #1a1a1a !important;
          border-bottom: 1px solid #333333 !important;
        }
        :global(.dark-mode) .properties-table td,
        :global(.dark-mode) .rentroll-table td,
        :global(.dark-mode) .expenses-table td {
          border-bottom: 1px solid #333333 !important;
        }
        :global(.dark-mode) .properties-table tbody tr:hover,
        :global(.dark-mode) .rentroll-table tbody tr:hover,
        :global(.dark-mode) .expenses-table tbody tr:hover {
          background: #1a1a1a !important;
        }
        :global(.dark-mode) .tab-button.active {
          background: #4f46e5 !important;
          color: white !important;
        }
        :global(.dark-mode) .property-selector,
        :global(.dark-mode) .period-selector {
          background: #1a1a1a !important;
          border-color: #333333 !important;
          color: #ffffff !important;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-container {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px 16px;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h2 {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          color: #64748b;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .modal-close:hover {
          background: #f1f5f9;
          color: #1e293b;
        }

        .modal-body {
          padding: 24px 32px 32px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s ease;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .form-group input[type="checkbox"] {
          width: auto;
          margin-right: 8px;
        }

        .form-group label:has(input[type="checkbox"]) {
          flex-direction: row;
          align-items: center;
          font-weight: 400;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
        }

        .btn-primary,
        .btn-secondary {
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .btn-primary {
          background: #4f46e5;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #4338ca;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }

        .btn-secondary:hover {
          background: #f1f5f9;
          color: #475569;
        }

        /* Vendor Selection Styles */
        .vendor-selection {
          display: flex;
          gap: 8px;
          align-items: stretch;
        }

        .vendor-selection select {
          flex: 1;
        }

        .create-vendor-btn {
          background: #10b981;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .create-vendor-btn:hover {
          background: #059669;
        }

        /* Vendor Option Group Styles */
        .vendor-option-group {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 8px;
        }

        .vendor-option {
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #f8fafc;
        }

        .vendor-option:has(input:checked) {
          border-color: #4f46e5;
          background: #f0f4ff;
        }

        .radio-label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
        }

        .radio-label input[type="radio"] {
          margin: 0;
          width: 16px;
          height: 16px;
        }

        .quick-vendor-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          margin-top: 8px;
        }

        .quick-vendor-input:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        /* File Upload Styles */
        .file-upload-container {
          position: relative;
        }

        .file-input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
          width: 100%;
          height: 100%;
        }

        .file-upload-label {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          background: #f9fafb;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 48px;
        }

        .file-upload-label:hover {
          border-color: #4f46e5;
          background: #f8fafc;
        }

        .file-upload-label svg {
          color: #6b7280;
          flex-shrink: 0;
        }

        .file-upload-label span {
          color: #374151;
          font-size: 14px;
        }

        .file-info {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }

        .file-upload-label:hover svg {
          color: #4f46e5;
        }

        /* Drag and drop states */
        .file-upload-label.dragover {
          border-color: #4f46e5;
          background: #f0f4ff;
        }

        /* Dark Mode Styles */
        .expense-fill.other {
          background: #6b7280;
        }

        /* New Analytics Styles */
        .no-data {
          text-align: center;
          padding: 40px 20px;
          color: #6b7280;
        }

        .no-data p {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 500;
        }

        .no-data small {
          font-size: 14px;
          color: #9ca3af;
        }

        /* Expense Item Updates */
        .expense-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .expense-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .expense-category {
          font-weight: 500;
          color: #374151;
          flex: 1;
        }

        .expense-amount {
          font-weight: 600;
          color: #1f2937;
          margin: 0 12px;
          min-width: 80px;
          text-align: right;
        }

        .expense-percentage {
          font-weight: 500;
          color: #6b7280;
          min-width: 40px;
          text-align: right;
          margin-right: 12px;
        }

        .expense-bar {
          flex: 2;
          height: 8px;
          background: #f1f5f9;
          border-radius: 4px;
          overflow: hidden;
        }

        .expense-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        /* Dynamic category colors */
        .expense-fill.utility { background: #3b82f6; }
        .expense-fill.maintenance { background: #ef4444; }
        .expense-fill.insurance { background: #10b981; }
        .expense-fill.professional { background: #8b5cf6; }
        .expense-fill.supplier { background: #f59e0b; }
        .expense-fill.other { background: #6b7280; }

        /* Top Vendors Styles */
        .top-vendors {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .vendor-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .vendor-rank {
          width: 32px;
          height: 32px;
          background: #4f46e5;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          flex-shrink: 0;
        }

        .vendor-info {
          flex: 1;
        }

        .vendor-name {
          font-weight: 500;
          color: #374151;
          margin-bottom: 2px;
        }

        .vendor-amount {
          font-size: 14px;
          color: #6b7280;
        }

        .vendor-percentage {
          font-weight: 600;
          color: #4f46e5;
          font-size: 16px;
        }

        /* Status Overview Styles */
        .status-overview {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
        }

        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .status-info {
          flex: 1;
        }

        .status-label {
          font-weight: 500;
          color: #374151;
          margin-bottom: 2px;
        }

        .status-count {
          font-size: 14px;
          color: #6b7280;
        }

        /* Analytics Filters */
        .analytics-filters {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 24px;
          padding: 20px;
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .analytics-section-title {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .analytics-subtitle {
          font-size: 14px;
          font-weight: 400;
          color: #64748b;
        }

        .filter-controls {
          display: flex;
          gap: 16px;
          align-items: flex-end;
        }

        .filter-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .filter-item label {
          font-size: 12px;
          font-weight: 500;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .filter-select {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          background: white;
          min-width: 120px;
          cursor: pointer;
        }

        .filter-select:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        /* Enhanced Card Styles */
        .card-subtitle {
          display: block;
          font-size: 13px;
          font-weight: 400;
          color: #64748b;
          margin-top: 4px;
        }

        .analytics-title {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        /* Enhanced Expense Item Styles */
        .expense-category-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .expense-details {
          font-size: 12px;
          color: #6b7280;
        }

        .expense-amounts {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          margin-right: 12px;
        }

        .expense-item:hover {
          background: #f8fafc;
          border-radius: 6px;
          padding: 12px;
          margin: -12px 0;
        }

        /* Enhanced Vendor Item Styles */
        .vendor-item:hover {
          background: #f0f4ff;
          border-color: #4f46e5;
        }

        /* Dark Mode Styles */
      `}</style>

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="modal-overlay" onClick={cancelExpenseForm}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingExpense ? 'Edit Expense' : 'Add Expense'}</h2>
              <button onClick={cancelExpenseForm} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={(e) => { e.preventDefault(); handleSubmitExpense(); }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="title">Expense Title *</label>
                    <input
                      type="text"
                      id="title"
                      value={expenseFormData.title}
                      onChange={(e) => handleExpenseFormChange('title', e.target.value)}
                      placeholder="Enter expense title"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="amount">Amount *</label>
                    <input
                      type="number"
                      id="amount"
                      step="0.01"
                      value={expenseFormData.amount}
                      onChange={(e) => handleExpenseFormChange('amount', e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="property_ref">Property *</label>
                    <select
                      id="property_ref"
                      value={expenseFormData.property_ref || ''}
                      onChange={(e) => handleExpenseFormChange('property_ref', parseInt(e.target.value))}
                      required
                    >
                      <option value="">Select Property</option>
                      {properties.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Vendor Selection</label>
                    <div className="vendor-option-group">
                      <div className="vendor-option">
                        <label className="radio-label">
                          <input
                            type="radio"
                            name="vendorOption"
                            value="existing"
                            checked={vendorInputType === 'existing'}
                            onChange={() => {
                              setVendorInputType('existing');
                              handleExpenseFormChange('vendor_name_override', '');
                            }}
                          />
                          <span>Select Existing Vendor</span>
                        </label>
                        {vendorInputType === 'existing' && (
                          <div className="vendor-selection">
                            <select
                              value={expenseFormData.vendor || ''}
                              onChange={(e) => {
                                const vendorId = e.target.value ? parseInt(e.target.value) : undefined;
                                handleExpenseFormChange('vendor', vendorId);
                                if (vendorId) {
                                  const selectedVendor = vendors.find(v => v.id === vendorId);
                                  if (selectedVendor) {
                                    handleExpenseFormChange('vendor_name_override', selectedVendor.name);
                                  }
                                } else {
                                  handleExpenseFormChange('vendor_name_override', '');
                                }
                              }}
                            >
                              <option value="">Choose from saved vendors...</option>
                              {vendors.map((vendor) => (
                                <option key={vendor.id} value={vendor.id}>
                                  {vendor.name} - {vendor.vendor_type}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={handleCreateVendorFromExpense}
                              className="create-vendor-btn"
                            >
                              + Add New Vendor
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="vendor-option">
                        <label className="radio-label">
                          <input
                            type="radio"
                            name="vendorOption"
                            value="quick"
                            checked={vendorInputType === 'quick'}
                            onChange={() => {
                              setVendorInputType('quick');
                              handleExpenseFormChange('vendor', undefined);
                            }}
                          />
                          <span>Quick Entry (No need to save vendor)</span>
                        </label>
                        {vendorInputType === 'quick' && (
                          <input
                            type="text"
                            value={expenseFormData.vendor_name_override}
                            onChange={(e) => handleExpenseFormChange('vendor_name_override', e.target.value)}
                            placeholder="e.g., Home Depot, Local Plumber, Amazon..."
                            className="quick-vendor-input"
                          />
                        )}
                      </div>
                    </div>
                  </div>



                  <div className="form-group">
                    <label htmlFor="expense_date">Expense Date *</label>
                    <input
                      type="date"
                      id="expense_date"
                      value={expenseFormData.expense_date}
                      onChange={(e) => handleExpenseFormChange('expense_date', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="due_date">Due Date</label>
                    <input
                      type="date"
                      id="due_date"
                      value={expenseFormData.due_date}
                      onChange={(e) => handleExpenseFormChange('due_date', e.target.value)}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      value={expenseFormData.description}
                      onChange={(e) => handleExpenseFormChange('description', e.target.value)}
                      placeholder="Enter expense description"
                      rows={3}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="receipt_file">Receipt Upload</label>
                    <div className="file-upload-container">
                      <input
                        type="file"
                        id="receipt_file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleExpenseFormChange('receipt_file', e.target.files?.[0] || null)}
                        className="file-input"
                      />
                      <label htmlFor="receipt_file" className="file-upload-label">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17,8 12,3 7,8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        <span>{expenseFormData.receipt_file ? expenseFormData.receipt_file.name : 'Choose file or drag here'}</span>
                      </label>
                      <div className="file-info">
                        Supports: Images (JPG, PNG) and PDF files
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="tags">Tags</label>
                    <input
                      type="text"
                      id="tags"
                      value={expenseFormData.tags}
                      onChange={(e) => handleExpenseFormChange('tags', e.target.value)}
                      placeholder="e.g., maintenance, utilities"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>
                      <input
                        type="checkbox"
                        checked={expenseFormData.is_recurring}
                        onChange={(e) => handleExpenseFormChange('is_recurring', e.target.checked)}
                      />
                      <span>Recurring Expense</span>
                    </label>
                  </div>

                  {expenseFormData.is_recurring && (
                    <>
                      <div className="form-group">
                        <label htmlFor="recurrence_type">Recurrence Type</label>
                        <select
                          id="recurrence_type"
                          value={expenseFormData.recurrence_type}
                          onChange={(e) => handleExpenseFormChange('recurrence_type', e.target.value as any)}
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="biweekly">Bi-weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="semi_annual">Semi-Annual</option>
                          <option value="annual">Annual</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="recurrence_end_date">End Date</label>
                        <input
                          type="date"
                          id="recurrence_end_date"
                          value={expenseFormData.recurrence_end_date}
                          onChange={(e) => handleExpenseFormChange('recurrence_end_date', e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  <div className="form-group full-width">
                    <label htmlFor="notes">Notes</label>
                    <textarea
                      id="notes"
                      value={expenseFormData.notes}
                      onChange={(e) => handleExpenseFormChange('notes', e.target.value)}
                      placeholder="Additional notes"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={cancelExpenseForm} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={expenseLoading} className="btn-primary">
                    {expenseLoading ? 'Saving...' : (editingExpense ? 'Update Expense' : 'Add Expense')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Vendor Modal */}
      {showCreateVendorModal && (
        <div className="modal-overlay" onClick={cancelVendorForm}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Vendor</h2>
              <button onClick={cancelVendorForm} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={(e) => { e.preventDefault(); handleSubmitVendor(); }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="vendor_name">Vendor Name *</label>
                    <input
                      type="text"
                      id="vendor_name"
                      value={vendorFormData.name}
                      onChange={(e) => handleVendorFormChange('name', e.target.value)}
                      placeholder="Enter vendor name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="vendor_type">Vendor Type *</label>
                    <select
                      id="vendor_type"
                      value={vendorFormData.vendor_type}
                      onChange={(e) => handleVendorFormChange('vendor_type', e.target.value)}
                      required
                    >
                      <option value="utility">Utility Company</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="insurance">Insurance</option>
                      <option value="professional">Professional Services</option>
                      <option value="supplier">Supplier</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact_email">Contact Email</label>
                    <input
                      type="email"
                      id="contact_email"
                      value={vendorFormData.contact_email}
                      onChange={(e) => handleVendorFormChange('contact_email', e.target.value)}
                      placeholder="vendor@company.com"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact_phone">Contact Phone</label>
                    <input
                      type="tel"
                      id="contact_phone"
                      value={vendorFormData.contact_phone}
                      onChange={(e) => handleVendorFormChange('contact_phone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact_person">Contact Person</label>
                    <input
                      type="text"
                      id="contact_person"
                      value={vendorFormData.contact_person}
                      onChange={(e) => handleVendorFormChange('contact_person', e.target.value)}
                      placeholder="Contact person name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="website">Website</label>
                    <input
                      type="url"
                      id="website"
                      value={vendorFormData.website}
                      onChange={(e) => handleVendorFormChange('website', e.target.value)}
                      placeholder="https://vendor-website.com"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="address">Address</label>
                    <textarea
                      id="address"
                      value={vendorFormData.address}
                      onChange={(e) => handleVendorFormChange('address', e.target.value)}
                      placeholder="Enter vendor address"
                      rows={2}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="notes">Notes</label>
                    <textarea
                      id="notes"
                      value={vendorFormData.notes}
                      onChange={(e) => handleVendorFormChange('notes', e.target.value)}
                      placeholder="Additional notes about this vendor"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={cancelVendorForm} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={vendorLoading} className="btn-primary">
                    {vendorLoading ? 'Creating...' : 'Create Vendor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default withAuth(Accounting, ['manager', 'owner']);