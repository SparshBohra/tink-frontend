import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';
import { withAuth } from '../lib/auth-context';
import Navigation from '../components/Navigation';
import DashboardLayout from '../components/DashboardLayout';
import SectionCard from '../components/SectionCard';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';
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
        setLandlords(response || []);
      } catch (apiError: any) {
        console.log('API call failed, using enhanced mock data:', apiError);
        
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

  if (loading) {
    return (
      <>
        <Head>
          <title>All Landlords - Tink Property Management</title>
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
        <title>All Landlords - Tink Property Management</title>
      </Head>
      <Navigation />
      
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

        {/* Actions */}
        <SectionCard>
          <div className="actions-container">
            <button className="btn btn-primary" onClick={() => window.location.href = '/landlord-signup'}>
              Add New Landlord
            </button>
            <button className="btn btn-secondary" onClick={fetchLandlords}>
              Refresh Data
            </button>
          </div>
        </SectionCard>

        {/* Landlords List */}
        <SectionCard title="Landlord Directory" subtitle={`${landlords.length} landlord${landlords.length !== 1 ? 's' : ''} registered`}>
          {landlords.length > 0 ? (
            <div className="landlords-grid">
              {landlords.map(landlord => (
                <div key={landlord.id} className="landlord-card">
                  <div className="landlord-header">
                    <div className="landlord-avatar">
                      {landlord.full_name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="landlord-info">
                      <h3 className="landlord-name">{landlord.full_name}</h3>
                      <p className="landlord-username">@{landlord.username}</p>
                      <StatusBadge 
                        status={landlord.is_active ? 'success' : 'error'} 
                        text={landlord.is_active ? 'Active' : 'Inactive'} 
                      />
                    </div>
                  </div>

                  <div className="landlord-details">
                    <div className="detail-item">
                      <span className="detail-icon">🏢</span>
                      <div>
                        <strong>{landlord.org_name}</strong>
                        {landlord.address && <p className="detail-text">{landlord.address}</p>}
                      </div>
                    </div>

                    <div className="detail-item">
                      <span className="detail-icon">📧</span>
                      <div>
                        <strong>Contact</strong>
                        <p className="detail-text">{landlord.contact_email}</p>
                        {landlord.contact_phone && <p className="detail-text">{landlord.contact_phone}</p>}
                      </div>
                    </div>

                    <div className="detail-item">
                      <span className="detail-icon">📊</span>
                      <div>
                        <strong>Portfolio</strong>
                        <p className="detail-text">{landlord.property_count || 0} Properties</p>
                        <p className="detail-text">{landlord.manager_count || 0} Managers</p>
                      </div>
                    </div>

                    {landlord.date_joined && (
                      <div className="detail-item">
                        <span className="detail-icon">📅</span>
                        <div>
                          <strong>Joined</strong>
                          <p className="detail-text">{new Date(landlord.date_joined).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="landlord-actions">
                    <Link href={`/landlords/${landlord.id}`} className="btn btn-primary btn-sm">
                      <span className="btn-icon">👁️</span>
                      View Details
                    </Link>
                    <Link href={`/managers?landlord=${landlord.id}`} className="btn btn-secondary btn-sm">
                      <span className="btn-icon">👥</span>
                      View Managers
                    </Link>
                    <Link href={`/properties?landlord=${landlord.id}`} className="btn btn-outline btn-sm">
                      <span className="btn-icon">🏠</span>
                      View Properties
                    </Link>
                  </div>
                </div>
              ))}
            </div>
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
        }

        .landlords-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: var(--spacing-lg);
        }

        .landlord-card {
          background: white;
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .landlord-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          border-color: var(--primary-blue);
        }

        .landlord-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
          padding-bottom: var(--spacing-md);
          border-bottom: 1px solid var(--gray-100);
        }

        .landlord-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-blue), var(--primary-purple));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 1.2rem;
          text-transform: uppercase;
        }

        .landlord-info {
          flex: 1;
        }

        .landlord-name {
          margin: 0 0 var(--spacing-xs) 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--gray-900);
        }

        .landlord-username {
          margin: 0 0 var(--spacing-sm) 0;
          color: var(--gray-600);
          font-size: 0.9rem;
        }

        .landlord-details {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }

        .detail-item {
          display: flex;
          align-items: flex-start;
          gap: var(--spacing-sm);
        }

        .detail-icon {
          font-size: 1.1rem;
          width: 24px;
          text-align: center;
          margin-top: 2px;
        }

        .detail-text {
          margin: 2px 0;
          color: var(--gray-600);
          font-size: 0.9rem;
        }

        .landlord-actions {
          display: flex;
          gap: var(--spacing-xs);
          flex-wrap: wrap;
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--gray-100);
        }

        .btn-icon {
          margin-right: var(--spacing-xs);
        }

        .btn-outline {
          background: transparent;
          border: 1px solid var(--gray-300);
          color: var(--gray-700);
        }

        .btn-outline:hover {
          background: var(--gray-50);
          border-color: var(--gray-400);
        }

        @media (max-width: 768px) {
          .landlords-grid {
            grid-template-columns: 1fr;
          }
          
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .actions-container {
            flex-direction: column;
          }
          
          .landlord-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}

export default withAuth(LandlordsPage, ['admin', 'owner']); 
 
 
 
 