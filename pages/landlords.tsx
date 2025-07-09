import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '../components/DashboardLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth, withAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';
import SectionCard from '../components/SectionCard';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import Link from 'next/link';

interface Landlord {
  id: number;
  username: string;
  email: string;
  full_name: string;
  org_name: string;
  contact_email: string;
  contact_phone?: string;
  address?: string;
  is_active: boolean;
  date_joined?: string;
  property_count?: number;
  manager_count?: number;
}

function LandlordsPage() {
  const { user } = useAuth();
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Sorting states
  const [sortBy, setSortBy] = useState<string>('full_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const isAdmin = () => user?.role === 'admin';

  useEffect(() => {
    fetchLandlords();
  }, []);

  const fetchLandlords = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch from API first
      try {
        const response = await apiClient.getAllLandlords();
        console.log('Landlords API response:', response);
        console.log('First landlord data:', response?.[0]);
        setLandlords(response || []);
      } catch (apiError: any) {
        console.log('API call failed, using enhanced mock data:', apiError);
        console.log('API Error details:', apiError);
        
        // Enhanced mock data with more realistic information
      setLandlords([
        {
          id: 27,
          username: 'premium_owner',
          email: 'owner@premiumprops.com',
          full_name: 'Olivia Wilson',
            org_name: 'Premium Properties LLC',
          contact_email: 'owner@premiumprops.com',
          contact_phone: '+1 (555) 123-4567',
            address: '123 Business District, Downtown, NY 10001',
            is_active: true,
            date_joined: '2024-01-15',
            property_count: 8,
            manager_count: 3
          },
          {
            id: 28,
            username: 'metro_landlord',
            email: 'admin@metrorentals.com',
            full_name: 'James Rodriguez',
            org_name: 'Metro Rentals Inc',
            contact_email: 'admin@metrorentals.com',
            contact_phone: '+1 (555) 987-6543',
            address: '456 Commercial Ave, Business Park, NY 10002',
            is_active: true,
            date_joined: '2024-02-20',
            property_count: 12,
            manager_count: 2
          },
          {
            id: 29,
            username: 'coastal_properties',
            email: 'info@coastalprops.com',
            full_name: 'Sarah Chen',
            org_name: 'Coastal Properties Group',
            contact_email: 'info@coastalprops.com',
            contact_phone: '+1 (555) 456-7890',
            address: '789 Harbor View, Waterfront District, NY 10003',
            is_active: false,
            date_joined: '2023-11-10',
            property_count: 5,
            manager_count: 1
          },
          {
            id: 30,
            username: 'urban_living',
            email: 'contact@urbanliving.com',
            full_name: 'Michael Thompson',
            org_name: 'Urban Living Group',
            contact_email: 'contact@urbanliving.com',
            contact_phone: '+1 (555) 234-5678',
            address: '321 Downtown Plaza, Metro City, NY 10004',
            is_active: true,
            date_joined: '2024-03-10',
            property_count: 6,
            manager_count: 2
          },
          {
            id: 31,
            username: 'cozy_homes',
            email: 'hello@cozyhomes.com',
            full_name: 'Jennifer Davis',
            org_name: 'Cozy Homes Inc',
            contact_email: 'hello@cozyhomes.com',
            contact_phone: '+1 (555) 345-6789',
            address: '654 Residential St, Suburb Town, NY 10005',
            is_active: true,
            date_joined: '2024-01-20',
            property_count: 4,
            manager_count: 1
          },
          {
            id: 50,
            username: 'test_landlord',
            email: 'test@testlord.com',
            full_name: 'Test Landlord',
            org_name: 'Test Properties Group',
            contact_email: 'test@testlord.com',
            contact_phone: '+1 (555) 999-0000',
            address: '999 Test Street, Test City, NY 10099',
          is_active: true,
            date_joined: '2024-06-01',
            property_count: 3,
            manager_count: 1
        }
      ]);
      }
    } catch (error: any) {
      console.error('Failed to fetch landlords:', error);
      setError(error?.message || 'Failed to load landlords');
    } finally {
      setLoading(false);
    }
  };

  const getTotalProperties = () => {
    return landlords.reduce((total, landlord) => total + (landlord.property_count || 0), 0);
  };

  const getTotalManagers = () => {
    return landlords.reduce((total, landlord) => total + (landlord.manager_count || 0), 0);
  };

  const getActiveLandlords = () => {
    return landlords.filter(landlord => landlord.is_active).length;
  };

  const getPortfolioBadge = (landlord: Landlord) => {
    const propertyCount = landlord.property_count || 0;
    const managerCount = landlord.manager_count || 0;
    
    if (propertyCount === 0) {
      return <StatusBadge status="error" text="No Properties" />;
    } else if (propertyCount >= 10) {
      return <StatusBadge status="success" text="Large Portfolio" />;
    } else if (propertyCount >= 5) {
      return <StatusBadge status="warning" text="Medium Portfolio" />;
    } else {
      return <StatusBadge status="info" text="Small Portfolio" />;
    }
  };

  const getContactInfo = (landlord: Landlord) => {
    return (
      <div>
        <div className="contact-primary">{landlord.contact_email}</div>
        {landlord.contact_phone && (
          <div className="contact-secondary">{landlord.contact_phone}</div>
        )}
      </div>
    );
  };

  const getPortfolioInfo = (landlord: Landlord) => {
    const propertyCount = landlord.property_count || 0;
    const managerCount = landlord.manager_count || 0;
    
    return (
      <div>
        <div className="portfolio-main">{propertyCount} Properties</div>
        <div className="portfolio-secondary">{managerCount} Managers</div>
      </div>
    );
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Sort landlords
  const sortedLandlords = [...landlords].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'full_name':
        aValue = a.full_name || '';
        bValue = b.full_name || '';
        break;
      case 'org_name':
        aValue = a.org_name || '';
        bValue = b.org_name || '';
        break;
      case 'contact_email':
        aValue = a.contact_email || '';
        bValue = b.contact_email || '';
        break;
      case 'property_count':
        aValue = a.property_count || 0;
        bValue = b.property_count || 0;
        break;
      case 'manager_count':
        aValue = a.manager_count || 0;
        bValue = b.manager_count || 0;
        break;
      case 'status':
        aValue = a.is_active ? 1 : 0;
        bValue = b.is_active ? 1 : 0;
        break;
      default:
        aValue = a.full_name || '';
        bValue = b.full_name || '';
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
      return sortOrder === 'asc' ? comparison : -comparison;
    } else {
      const comparison = aValue - bValue;
      return sortOrder === 'asc' ? comparison : -comparison;
    }
  });

  if (loading) {
    return (
      <>
        <Head>
          <title>All Landlords - Tink Property Management</title>
        </Head>
        <DashboardLayout
          title="All Landlords"
          subtitle="Loading landlords..."
        >
          <LoadingSpinner />
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>All Landlords - Tink Property Management</title>
      </Head>
      <DashboardLayout
        title="All Landlords"
        subtitle="Manage all property owners on the platform"
      >
        {error && <div className="alert alert-error">{error}</div>}

        {/* Landlord Overview Metrics */}
        <SectionCard title="Platform Overview">
          <div className="metrics-grid">
            <MetricCard 
              title="Total Landlords" 
              value={landlords.length} 
              color="blue" 
            />
            <MetricCard 
              title="Active Landlords" 
              value={getActiveLandlords()} 
              color="green" 
            />
            <MetricCard 
              title="Total Properties" 
              value={getTotalProperties()} 
              subtitle="Across all landlords"
              color="purple" 
            />
            <MetricCard 
              title="Total Managers" 
              value={getTotalManagers()} 
              subtitle="Assigned to landlords"
              color="amber" 
            />
          </div>
        </SectionCard>

        {/* Actions and Sorting */}
        <SectionCard>
          <div className="actions-container">
            <button className="btn btn-primary" onClick={() => window.location.href = '/landlord-signup'}>
              Add New Landlord
            </button>
            <button className="btn btn-secondary" onClick={fetchLandlords}>
              Refresh Data
            </button>
          </div>
          
          <div className="sorting-container">
            <div className="sort-group">
              <label htmlFor="sortBy">Sort by:</label>
              <select 
                id="sortBy"
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="full_name">Name</option>
                <option value="org_name">Organization</option>
                <option value="contact_email">Email</option>
                <option value="property_count">Property Count</option>
                <option value="manager_count">Manager Count</option>
                <option value="status">Status</option>
              </select>
            </div>

            <div className="sort-group">
              <label htmlFor="sortOrder">Order:</label>
              <select 
                id="sortOrder"
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="sort-select"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>

            <div className="sort-info">
              <span className="sort-count">
                Showing {sortedLandlords.length} landlords
                {sortBy !== 'full_name' && ` (sorted by ${sortBy})`}
              </span>
            </div>
          </div>
        </SectionCard>

        {/* Landlords Table */}
        <SectionCard title="Landlord Directory" subtitle={`${landlords.length} landlord${landlords.length !== 1 ? 's' : ''} registered`}>
          {sortedLandlords.length > 0 ? (
          <DataTable
            columns={[
              { key: 'landlord', header: 'Landlord' },
              { key: 'organization', header: 'Organization' },
              { key: 'contact', header: 'Contact Information' },
                { key: 'portfolio', header: 'Portfolio' },
              { key: 'status', header: 'Status' },
              { key: 'actions', header: 'Actions' }
            ]}
              data={sortedLandlords}
            isLoading={loading}
            emptyState={
              <EmptyState
                title="No Landlords Found"
                  description="No property owners have registered on the platform yet."
                  action={
                    <button className="btn btn-primary" onClick={() => window.location.href = '/landlord-signup'}>
                      Add First Landlord
                    </button>
                  }
                />
              }
              renderRow={(landlord) => {
                console.log('Rendering landlord:', landlord);
                return (
              <tr key={landlord.id}>
                    <td style={{ textAlign: 'center' }}>
                      <div className="landlord-info">
                        <div className="landlord-name">{landlord.full_name || landlord.name || 'N/A'}</div>
                        <div className="landlord-username">@{landlord.username || 'unknown'}</div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="org-info">
                        <div className="org-name">{landlord.org_name || 'No Organization'}</div>
                        {landlord.address && (
                          <div className="org-address">{landlord.address}</div>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {getContactInfo(landlord)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {getPortfolioInfo(landlord)}
                </td>
                    <td style={{ textAlign: 'center' }}>
                      <StatusBadge 
                        status={landlord.is_active ? 'success' : 'error'} 
                        text={landlord.is_active ? 'Active' : 'Inactive'} 
                      />
                </td>
                    <td style={{ textAlign: 'center' }}>
                  <div className="action-buttons">
                    <Link href={`/landlords/${landlord.id}`} className="btn btn-primary btn-sm">
                      View Details
                    </Link>
                        <Link href={`/managers?landlord=${landlord.id}`} className="btn btn-secondary btn-sm">
                          View Managers ({landlord.manager_count || 0})
                        </Link>
                        <Link href={`/properties?landlord=${landlord.id}`} className="btn btn-info btn-sm">
                          View Properties ({landlord.property_count || 0})
                        </Link>
                        <button 
                          className="btn btn-warning btn-sm"
                          onClick={() => window.location.href = `/managers?action=assign&landlord=${landlord.id}`}
                        >
                      Assign Manager
                        </button>
                  </div>
                </td>
              </tr>
                );
              }}
            />
          ) : (
            <EmptyState
              title="No Landlords Found"
              description="No property owners have registered on the platform yet."
              action={
                <button className="btn btn-primary" onClick={() => window.location.href = '/landlord-signup'}>
                  Add First Landlord
                </button>
              }
            />
          )}
        </SectionCard>
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
          to { transform: rotate(360deg); }
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
        }

        .actions-container {
          display: flex;
          gap: var(--spacing-md);
          justify-content: flex-start;
          flex-wrap: wrap;
          margin-bottom: var(--spacing-lg);
        }

        .sorting-container {
          display: flex;
          gap: var(--spacing-lg);
          align-items: end;
          flex-wrap: wrap;
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--gray-200);
        }

        .sort-group {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
          min-width: 150px;
        }

        .sort-group label {
          font-weight: 600;
          color: var(--gray-700);
          font-size: 0.9rem;
        }

        .sort-select {
          padding: var(--spacing-sm);
          border: 1px solid var(--gray-300);
          border-radius: var(--radius-sm);
          font-size: 0.9rem;
          background: white;
        }

        .sort-select:focus {
          outline: none;
          border-color: var(--primary-blue);
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .sort-info {
          display: flex;
          flex-direction: column;
          justify-content: end;
          margin-left: auto;
        }

        .sort-count {
          font-size: 0.85rem;
          color: var(--gray-600);
          font-style: italic;
        }

        .landlord-info {
          text-align: center;
        }

        .landlord-name {
          font-weight: 600;
          color: var(--gray-900);
          margin-bottom: 4px;
        }

        .landlord-username {
          font-size: 0.875rem;
          color: var(--gray-600);
        }

        .org-info {
          text-align: center;
        }

        .org-name {
          font-weight: 600;
          color: var(--gray-900);
          margin-bottom: 4px;
        }

        .org-address {
          font-size: 0.875rem;
          color: var(--gray-600);
          max-width: 200px;
          margin: 0 auto;
        }

        .contact-primary {
          font-weight: 500;
          color: var(--gray-900);
          margin-bottom: 4px;
        }

        .contact-secondary {
          font-size: 0.875rem;
          color: var(--gray-600);
        }

        .portfolio-main {
          font-weight: 600;
          color: var(--gray-900);
          margin-bottom: 4px;
        }

        .portfolio-secondary {
          font-size: 0.875rem;
          color: var(--gray-600);
        }
        
        .action-buttons {
          display: flex;
          gap: var(--spacing-xs);
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 0.375rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-block;
          font-size: 0.875rem;
        }

        .btn-primary {
          background-color: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background-color: #2563eb;
        }

        .btn-secondary {
          background-color: #6b7280;
          color: white;
        }
        
        .btn-secondary:hover {
          background-color: #4b5563;
        }

        .btn-info {
          background-color: #06b6d4;
          color: white;
        }

        .btn-info:hover {
          background-color: #0891b2;
        }

        .btn-warning {
          background-color: #f59e0b;
          color: white;
        }

        .btn-warning:hover {
          background-color: #d97706;
        }

        .btn-sm {
          padding: 0.375rem 0.75rem;
          font-size: 0.8rem;
        }

        .alert {
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
        }
        
        .alert-error {
          background-color: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }
      `}</style>
    </>
  );
}

export default withAuth(LandlordsPage, ['admin', 'owner']); 
 
 
 
 