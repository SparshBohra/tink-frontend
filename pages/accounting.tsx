import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '../components/DashboardLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth, withAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';
import { formatCurrency } from '../lib/utils';

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

  useEffect(() => {
    fetchData();
  }, [selectedPeriod, selectedProperty]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data for property managers
      const mockPropertyFinancials: PropertyFinancials[] = [
        {
          id: 1,
          name: 'Sunset Gardens Apartments',
          address: '123 Main St, Portland, OR',
          totalUnits: 24,
          occupiedUnits: 22,
          monthlyRent: 52800,
          actualRent: 48400,
          expenses: 18200,
          netIncome: 30200,
          occupancyRate: 91.7,
          avgRentPerUnit: 2200
        },
        {
          id: 2,
          name: 'Downtown Plaza',
          address: '456 Oak Ave, Portland, OR',
          totalUnits: 18,
          occupiedUnits: 16,
          monthlyRent: 41400,
          actualRent: 36800,
          expenses: 12300,
          netIncome: 24500,
          occupancyRate: 88.9,
          avgRentPerUnit: 2300
        },
        {
          id: 3,
          name: 'Riverside Townhomes',
          address: '789 River Dr, Portland, OR',
          totalUnits: 12,
          occupiedUnits: 11,
          monthlyRent: 31200,
          actualRent: 28600,
          expenses: 8900,
          netIncome: 19700,
          occupancyRate: 91.7,
          avgRentPerUnit: 2600
        }
      ];

      const mockRentRoll: RentRollItem[] = [
        { id: 1, propertyName: 'Sunset Gardens', unitNumber: 'A101', tenantName: 'John Smith', rentAmount: 2200, paidAmount: 2200, dueDate: '2024-01-01', status: 'paid' },
        { id: 2, propertyName: 'Sunset Gardens', unitNumber: 'A102', tenantName: 'Jane Doe', rentAmount: 2200, paidAmount: 1100, dueDate: '2024-01-01', status: 'partial' },
        { id: 3, propertyName: 'Downtown Plaza', unitNumber: 'B201', tenantName: 'Bob Johnson', rentAmount: 2300, paidAmount: 0, dueDate: '2023-12-15', status: 'overdue', daysOverdue: 17 },
        { id: 4, propertyName: 'Riverside Townhomes', unitNumber: 'C301', tenantName: '', rentAmount: 2600, paidAmount: 0, dueDate: '', status: 'vacant' },
        { id: 5, propertyName: 'Sunset Gardens', unitNumber: 'A103', tenantName: 'Alice Brown', rentAmount: 2200, paidAmount: 2200, dueDate: '2024-01-01', status: 'paid' },
        { id: 6, propertyName: 'Downtown Plaza', unitNumber: 'B202', tenantName: 'Charlie Wilson', rentAmount: 2300, paidAmount: 2300, dueDate: '2024-01-01', status: 'paid' }
      ];

      const mockExpenses: ExpenseItem[] = [
        { id: 1, date: '2024-01-15', propertyName: 'Sunset Gardens', category: 'Maintenance', description: 'HVAC repair - Unit A101', amount: 850, vendor: 'Cool Air Services', status: 'paid' },
        { id: 2, date: '2024-01-14', propertyName: 'Downtown Plaza', category: 'Utilities', description: 'Electricity - Common areas', amount: 420, vendor: 'Portland Electric', status: 'paid' },
        { id: 3, date: '2024-01-12', propertyName: 'Riverside Townhomes', category: 'Landscaping', description: 'Monthly lawn service', amount: 350, vendor: 'Green Thumb Landscaping', status: 'paid' },
        { id: 4, date: '2024-01-10', propertyName: 'Sunset Gardens', category: 'Supplies', description: 'Cleaning supplies and equipment', amount: 180, vendor: 'CleanCo Supply', status: 'approved' },
        { id: 5, date: '2024-01-08', propertyName: 'Downtown Plaza', category: 'Maintenance', description: 'Plumbing repair - B201', amount: 425, vendor: 'Fix-It Plumbing', status: 'pending' },
        { id: 6, propertyName: 'All Properties', date: '2024-01-05', category: 'Insurance', description: 'Property insurance premium', amount: 2200, vendor: 'SafeGuard Insurance', status: 'paid' }
      ];

      const totalGrossRent = mockPropertyFinancials.reduce((sum, p) => sum + p.monthlyRent, 0);
      const totalCollected = mockPropertyFinancials.reduce((sum, p) => sum + p.actualRent, 0);
      const totalExpenses = mockPropertyFinancials.reduce((sum, p) => sum + p.expenses, 0);
      const netCashFlow = totalCollected - totalExpenses;
      const collectionRate = (totalCollected / totalGrossRent) * 100;
      const vacancyLoss = totalGrossRent - totalCollected;
      const operatingExpenseRatio = (totalExpenses / totalGrossRent) * 100;

      setPropertyFinancials(mockPropertyFinancials);
      setRentRoll(mockRentRoll);
      setExpenses(mockExpenses);
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
                  <h2 className="section-title">Expense Tracking ({filteredData.expenses.length})</h2>
                  <p className="section-subtitle">Property expenses and vendor payments</p>
                </div>
                <div className="section-actions">
                  <button className="action-btn primary">
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
                    {filteredData.expenses.map((expense) => (
                      <tr key={expense.id}>
                        <td className="table-left">
                          <div className="expense-date">{formatDate(expense.date)}</div>
                        </td>
                        <td className="table-left">
                          <div className="expense-property">{expense.propertyName}</div>
                        </td>
                        <td className="table-left">
                          <span className="category-badge">{expense.category}</span>
                        </td>
                        <td className="table-left">
                          <div className="expense-description">{expense.description}</div>
                        </td>
                        <td className="table-left">
                          <div className="expense-vendor">{expense.vendor}</div>
                        </td>
                        <td className="table-right">
                          <div className="expense-amount">{formatCurrency(expense.amount)}</div>
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
                                <button className="expense-action-btn approve">Approve</button>
                                <button className="expense-action-btn reject">Reject</button>
                              </>
                            )}
                            {expense.status === 'approved' && (
                              <button className="expense-action-btn pay">Pay</button>
                            )}
                            {expense.status === 'paid' && (
                              <button className="expense-action-btn view">View</button>
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
                  <h3 className="analytics-title">Expense Breakdown</h3>
                  <div className="expense-breakdown">
                    <div className="expense-item">
                      <span className="expense-category">Maintenance</span>
                      <span className="expense-percentage">35%</span>
                      <div className="expense-bar">
                        <div className="expense-fill maintenance" style={{ width: '35%' }}></div>
                      </div>
                    </div>
                    <div className="expense-item">
                      <span className="expense-category">Utilities</span>
                      <span className="expense-percentage">25%</span>
                      <div className="expense-bar">
                        <div className="expense-fill utilities" style={{ width: '25%' }}></div>
                      </div>
                    </div>
                    <div className="expense-item">
                      <span className="expense-category">Insurance</span>
                      <span className="expense-percentage">20%</span>
                      <div className="expense-bar">
                        <div className="expense-fill insurance" style={{ width: '20%' }}></div>
                      </div>
                    </div>
                    <div className="expense-item">
                      <span className="expense-category">Other</span>
                      <span className="expense-percentage">20%</span>
                      <div className="expense-bar">
                        <div className="expense-fill other" style={{ width: '20%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="analytics-card">
                  <h3 className="analytics-title">Key Insights</h3>
                  <div className="insights-list">
                    <div className="insight-item positive">
                      <div className="insight-icon">↗</div>
                      <div className="insight-text">Collection rate improved by 2.1% this month</div>
                    </div>
                    <div className="insight-item warning">
                      <div className="insight-icon">⚠</div>
                      <div className="insight-text">Maintenance costs 15% above budget</div>
                    </div>
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
      `}</style>
    </DashboardLayout>
  );
}

export default withAuth(Accounting, ['manager', 'owner']);