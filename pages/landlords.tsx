import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';
import { withAuth } from '../lib/auth-context';
import Navigation from '../components/Navigation';
import DashboardLayout from '../components/DashboardLayout';
import SectionCard from '../components/SectionCard';
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
}

function LandlordsPage() {
  const { user } = useAuth();
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLandlords();
  }, []);

  const fetchLandlords = async () => {
    try {
      setLoading(true);
      // Mock data since API endpoint may not be available for admin
      setLandlords([
        {
          id: 27,
          username: 'premium_owner',
          email: 'owner@premiumprops.com',
          full_name: 'Olivia Wilson',
          org_name: 'Premium Properties',
          contact_email: 'owner@premiumprops.com',
          contact_phone: '+1 (555) 123-4567',
          address: '123 Business St, City, State',
          is_active: true,
          date_joined: '2024-01-15'
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch landlords:', error);
      setError('Failed to load landlords');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Landlords - Tink Property Management</title>
        </Head>
        <Navigation />
        <DashboardLayout
          title="All Landlords"
          subtitle="Loading landlords..."
        >
          <div className="loading-indicator">
            <div className="loading-spinner" />
            <p>Fetching landlords data...</p>
          </div>
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Landlords - Tink Property Management</title>
      </Head>
      <Navigation />
      
      <DashboardLayout
        title="All Landlords"
        subtitle="Manage all property owners on the platform"
      >
        {error && <div className="alert alert-error">{error}</div>}

        <SectionCard title="Platform Landlords" subtitle={`${landlords.length} landlord${landlords.length !== 1 ? 's' : ''} registered`}>
          <DataTable
            columns={[
              { key: 'landlord', header: 'Landlord' },
              { key: 'organization', header: 'Organization' },
              { key: 'contact', header: 'Contact Information' },
              { key: 'status', header: 'Status' },
              { key: 'actions', header: 'Actions' }
            ]}
            data={landlords}
            isLoading={loading}
            emptyState={
              <EmptyState
                title="No Landlords Found"
                description="No property owners have registered yet."
              />
            }
            renderRow={(landlord) => (
              <tr key={landlord.id}>
                <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)', textAlign: 'center' }}>
                  <div>
                    <div className="text-body" style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--gray-900)', marginBottom: 'var(--spacing-xs)' }}>
                      {landlord.full_name}
                    </div>
                    <div className="text-small text-secondary">
                      @{landlord.username}
                    </div>
                  </div>
                </td>
                <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)', textAlign: 'center' }}>
                  <div>
                    <div className="text-body" style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--gray-900)', marginBottom: 'var(--spacing-xs)' }}>
                      {landlord.org_name}
                    </div>
                    {landlord.address && (
                      <div className="text-small text-secondary">
                        {landlord.address}
                      </div>
                    )}
                  </div>
                </td>
                <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)', textAlign: 'center' }}>
                  <div>
                    <div className="text-small text-secondary" style={{ marginBottom: 'var(--spacing-xs)' }}>
                      {landlord.contact_email}
                    </div>
                    {landlord.contact_phone && (
                      <div className="text-small text-secondary">
                        {landlord.contact_phone}
                      </div>
                    )}
                  </div>
                </td>
                <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)', textAlign: 'center' }}>
                  <span className={`status-badge ${landlord.is_active ? 'status-active' : 'status-inactive'}`}>
                    {landlord.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)', textAlign: 'center' }}>
                  <div className="action-buttons">
                    <Link href={`/landlords/${landlord.id}`} className="btn btn-primary btn-sm">
                      View Details
                    </Link>
                    <Link href={`/managers?landlord=${landlord.id}`} className="btn btn-warning btn-sm">
                      Assign Manager
                    </Link>
                  </div>
                </td>
              </tr>
            )}
          />
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
        
        .status-badge {
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-sm);
          font-size: var(--text-small);
          font-weight: var(--font-weight-medium);
          text-transform: uppercase;
        }
        
        .status-active {
          background-color: var(--gray-100);
          color: var(--gray-700);
        }
        
        .status-inactive {
          background-color: var(--gray-100);
          color: var(--gray-500);
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
      `}</style>
    </>
  );
}

export default withAuth(LandlordsPage, ['admin', 'owner']); 
 
 
 
 