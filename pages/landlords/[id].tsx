import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { apiClient } from '../../lib/api';
import { withAuth } from '../../lib/auth-context';
import DashboardLayout from '../../components/DashboardLayout';
import SectionCard from '../../components/SectionCard';
import MetricCard from '../../components/MetricCard';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

interface LandlordDetails {
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

function LandlordDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [landlord, setLandlord] = useState<LandlordDetails | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchLandlordDetails();
    }
  }, [id]);

  const fetchLandlordDetails = async () => {
    try {
      setLoading(true);
      const landlordId = parseInt(id as string);

      // Mock data for demonstration - replace with actual API call
      const mockLandlord: LandlordDetails = {
        id: landlordId,
        username: 'premium_owner',
        email: 'owner@premiumprops.com',
        full_name: 'Olivia Wilson',
        org_name: 'Premium Properties',
        contact_email: 'owner@premiumprops.com',
        contact_phone: '+1 (555) 123-4567',
        address: '123 Business St, City, State',
        is_active: true,
        date_joined: '2024-01-15'
      };

      setLandlord(mockLandlord);

      // Fetch properties and managers
      try {
        const propertiesResponse = await apiClient.getProperties();
        setProperties(propertiesResponse.results || []);
      } catch (err) {
        setProperties([]);
      }

      try {
        const managersResponse = await apiClient.getManagersForLandlord(landlordId);
        setManagers(managersResponse || []);
      } catch (err) {
        setManagers([]);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to fetch landlord details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Landlord Details - Tink Property Management</title>
        </Head>
        <DashboardLayout
          title="Landlord Details"
          subtitle="Loading landlord information..."
        >
          <div className="loading-indicator">
            <div className="loading-spinner" />
            <p>Fetching landlord details...</p>
          </div>
        </DashboardLayout>
      </>
    );
  }

  if (error || !landlord) {
    return (
      <>
        <Head>
          <title>Landlord Not Found - Tink Property Management</title>
        </Head>
        <DashboardLayout
          title="Landlord Not Found"
          subtitle="Unable to load landlord details"
        >
          <div className="alert alert-error">
            <strong>Error:</strong> {error || 'Landlord not found'}
          </div>
          <div className="actions-container">
            <Link href="/landlords" className="btn btn-secondary">
              Back to Landlords
            </Link>
          </div>
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{landlord.org_name} - Landlord Details</title>
      </Head>
      <DashboardLayout
        title={landlord.org_name}
        subtitle={`Landlord Details - ${landlord.full_name}`}
      >
        <div className="actions-container" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <button onClick={() => router.back()} className="btn btn-secondary">
            Back
          </button>
        </div>

        <div className="metrics-grid">
          <MetricCard title="Total Properties" value={properties.length} color="blue" />
          <MetricCard title="Active Managers" value={managers.length} color="green" />
          <MetricCard 
            title="Account Status" 
            value={landlord.is_active ? 'Active' : 'Inactive'}
            color={landlord.is_active ? 'green' : 'amber'}
          />
          <MetricCard 
            title="Member Since" 
            value={landlord.date_joined ? new Date(landlord.date_joined).getFullYear().toString() : 'N/A'}
            color="purple"
          />
        </div>

        <SectionCard title="Landlord Information" subtitle="Contact details and account information">
          <div className="landlord-info-grid">
            <div className="info-item">
              <strong>Organization:</strong><br />{landlord.org_name}
            </div>
            <div className="info-item">
              <strong>Owner:</strong><br />{landlord.full_name}
            </div>
            <div className="info-item">
              <strong>Email:</strong><br />
              <a href={`mailto:${landlord.contact_email}`}>{landlord.contact_email}</a>
            </div>
            <div className="info-item">
              <strong>Phone:</strong><br />
              {landlord.contact_phone || 'Not provided'}
            </div>
            <div className="info-item">
              <strong>Address:</strong><br />
              {landlord.address || 'Not provided'}
            </div>
            <div className="info-item">
              <strong>Status:</strong><br />
              <StatusBadge 
                status={landlord.is_active ? 'active' : 'inactive'} 
                text={landlord.is_active ? 'Active' : 'Inactive'}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Properties" subtitle={`${properties.length} properties managed`}>
          {properties.length > 0 ? (
            <DataTable 
              columns={[
                { key: 'name', header: 'Property Name' },
                { key: 'address', header: 'Address' },
                { key: 'rooms', header: 'Rooms' },
                { key: 'actions', header: 'Actions' }
              ]}
              data={properties}
              renderRow={(property) => (
                <tr key={property.id}>
                  <td style={{ textAlign: 'center' }}><strong>{property.name}</strong></td>
                  <td style={{ textAlign: 'center' }}>{property.full_address}</td>
                  <td style={{ textAlign: 'center' }}>{property.total_rooms || 'N/A'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <Link href={`/properties/${property.id}/rooms`} className="btn btn-primary btn-sm">
                      View Property
                    </Link>
                  </td>
                </tr>
              )}
            />
          ) : (
            <EmptyState title="No Properties" description="This landlord hasn't added any properties yet." />
          )}
        </SectionCard>

        <SectionCard title="Quick Actions">
          <div className="actions-grid">
            <Link href={`/managers?landlord=${landlord.id}`} className="btn btn-primary">
              Manage Team
            </Link>
            <Link href="/landlords" className="btn btn-secondary">
              All Landlords
            </Link>
          </div>
        </SectionCard>
      </DashboardLayout>

      <style jsx>{`
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
        }
        
        .landlord-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--spacing-lg);
        }
        
        .info-item {
          padding: var(--spacing-md);
          background: var(--gray-50);
          border-radius: var(--radius-md);
          border: 1px solid var(--gray-200);
          box-shadow: var(--shadow-sm);
        }
        
        .info-item a {
          color: var(--primary-blue);
          text-decoration: none;
        }
        
        .info-item a:hover {
          text-decoration: underline;
        }
        
        .actions-grid {
          display: flex;
          gap: var(--spacing-md);
          flex-wrap: wrap;
        }
        
        .actions-container {
          margin-bottom: var(--spacing-lg);
        }
        
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
        
        .btn-sm {
          padding: var(--spacing-xs) var(--spacing-sm);
          font-size: var(--text-small);
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

export default withAuth(LandlordDetailsPage, ['admin']); 