import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { apiClient } from '../../lib/api';
import { Tenant, Lease, Application } from '../../lib/types';
import Navigation from '../../components/Navigation';
import DashboardLayout from '../../components/DashboardLayout';
import SectionCard from '../../components/SectionCard';
import MetricCard from '../../components/MetricCard';
import StatusBadge from '../../components/StatusBadge';
import DataTable from '../../components/DataTable';
import EmptyState from '../../components/EmptyState';
import { formatCurrency } from '../../lib/utils';

export default function TenantDetails() {
  const router = useRouter();
  const { id } = router.query;
  const tenantId = typeof id === 'string' && !isNaN(Number(id)) ? Number(id) : null;
  
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [currentLease, setCurrentLease] = useState<Lease | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tenantId !== null) {
      fetchTenantData(tenantId);
    } else if (id) {
      setError('Invalid tenant ID.');
      setLoading(false);
    }
  }, [id]);

  const fetchTenantData = async (tid: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const tenantResponse = await apiClient.getTenant(tid);
      setTenant(tenantResponse);
      
      try {
        const leaseResponse = await apiClient.getTenantCurrentLease(tid);
        setCurrentLease(leaseResponse);
      } catch (e) {
        console.log('No active lease found for tenant');
      }
      
      try {
        const applicationsResponse = await apiClient.getTenantApplications(tid);
        setApplications(applicationsResponse || []);
      } catch (e) {
        console.log('No applications found for tenant');
      }
    } catch (error: any) {
      console.error('Failed to fetch tenant data:', error);
      setError(error?.message || 'Failed to load tenant data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Tenant - Tink Property Management</title>
        </Head>
        <Navigation />
        <DashboardLayout
          title="Tenant Details"
          subtitle="Loading tenant information..."
        >
          <div className="loading-indicator">
            <div className="loading-spinner" />
            <p>Fetching tenant information...</p>
          </div>
        </DashboardLayout>
      </>
    );
  }

  if (error || !tenant) {
    return (
      <>
        <Head>
          <title>Tenant Not Found - Tink Property Management</title>
        </Head>
        <Navigation />
        <DashboardLayout
          title="Tenant Not Found"
          subtitle="Unable to load tenant details"
        >
          <div className="alert alert-error">
            <strong>Error:</strong> {error || 'Tenant not found'}
          </div>
          <div className="actions-container">
            <button onClick={() => router.back()} className="btn btn-secondary">
              ← Back
            </button>
            <Link href="/tenants" className="btn btn-primary">
              All Tenants
            </Link>
          </div>
        </DashboardLayout>
      </>
    );
  }

  const applicationsTableData = applications.map(app => ({
    id: app.id,
    property: app.room ? `Property ${app.room}` : 'Unknown Property',
    room: app.room ? `Room ${app.room}` : 'Not specified',
    status: (
      <StatusBadge 
        status={app.status === 'approved' ? 'active' : app.status === 'pending' ? 'pending' : 'inactive'} 
        text={app.status.toUpperCase()}
      />
    ),
    date: app.created_at ? new Date(app.created_at).toLocaleDateString() : 'Unknown',
    actions: (
      <Link href={`/applications?tenant=${tenant.id}`} className="btn btn-primary btn-sm">
        View Details
      </Link>
    )
  }));

  const applicationsTableColumns = [
    { key: 'property', header: 'Property' },
    { key: 'room', header: 'Room' },
    { key: 'status', header: 'Status' },
    { key: 'date', header: 'Application Date' },
    { key: 'actions', header: 'Actions' }
  ];

  const renderApplicationRow = (rowData: any, index: number) => (
    <tr key={rowData.id}>
      <td style={{ textAlign: 'center' }}>{rowData.property}</td>
      <td style={{ textAlign: 'center' }}>{rowData.room}</td>
      <td style={{ textAlign: 'center' }}>{rowData.status}</td>
      <td style={{ textAlign: 'center' }}>{rowData.date}</td>
      <td style={{ textAlign: 'center' }}>{rowData.actions}</td>
    </tr>
  );

  return (
    <>
      <Head>
        <title>{tenant.full_name} - Tenant Details - Tink Property Management</title>
      </Head>
      <Navigation />
      
      <DashboardLayout
        title={`👤 ${tenant.full_name}`}
        subtitle={`Tenant ID: ${tenant.id} • Member since ${tenant.created_at ? new Date(tenant.created_at).toLocaleDateString() : 'Unknown'}`}
      >
        <div className="actions-container">
          <button onClick={() => router.back()} className="btn btn-secondary">
            ← Back
          </button>
          <Link href="/tenants" className="btn btn-secondary">
            All Tenants
          </Link>
        </div>

        {/* Tenant Overview Metrics */}
        <div className="metrics-grid">
          <MetricCard 
            title="Lease Status" 
            value={currentLease ? 'Active' : 'No Lease'}
            color={currentLease ? 'green' : 'amber'}
          />
          <MetricCard 
            title="Monthly Rent" 
            value={currentLease ? formatCurrency(currentLease.monthly_rent) : 'N/A'}
            color="blue"
            isMonetary={false}
          />
          <MetricCard 
            title="Applications" 
            value={applications.length}
            color="purple"
          />
          <MetricCard 
            title="Account Status" 
            value="Active"
            color="green"
          />
        </div>

        {/* Tenant Information */}
        <SectionCard title="Tenant Information" subtitle="Contact details and personal information">
          <div className="tenant-info-grid">
            <div className="info-item">
              <strong>Full Name:</strong><br />
              {tenant.full_name}
            </div>
            <div className="info-item">
              <strong>Email:</strong><br />
              <a href={`mailto:${tenant.email}`}>{tenant.email}</a>
            </div>
            <div className="info-item">
              <strong>Phone:</strong><br />
              <a href={`tel:${tenant.phone}`}>{tenant.phone}</a>
            </div>
            <div className="info-item">
              <strong>Emergency Contact:</strong><br />
              {tenant.emergency_contact_name ? (
                <>
                  {tenant.emergency_contact_name}
                  {tenant.emergency_contact_phone && (
                    <><br /><a href={`tel:${tenant.emergency_contact_phone}`}>{tenant.emergency_contact_phone}</a></>
                  )}
                </>
              ) : (
                'Not provided'
              )}
            </div>
            <div className="info-item">
              <strong>Current Address:</strong><br />
              {tenant.current_address || 'Not provided'}
            </div>
            <div className="info-item">
              <strong>Member Since:</strong><br />
              {tenant.created_at ? new Date(tenant.created_at).toLocaleDateString() : 'Unknown'}
            </div>
          </div>
          <div className="actions-grid" style={{ marginTop: 'var(--spacing-lg)' }}>
            <button
              onClick={() => alert('Edit feature coming soon')}
              className="btn btn-primary"
            >
              ✏️ Edit Details
            </button>
            <a href={`mailto:${tenant.email}`} className="btn btn-secondary">
              ✉️ Send Email
            </a>
          </div>
        </SectionCard>

        {/* Current Housing */}
        <SectionCard title="Current Housing" subtitle="Active lease and property information">
          {currentLease ? (
            <div className="lease-info-grid">
              <div className="info-item">
                <strong>Property:</strong><br />
                Property ID: {currentLease.property_ref || 'Unknown'}
                {currentLease.property_ref && (
                  <><br /><Link href={`/properties/${currentLease.property_ref}/rooms`}>View Property</Link></>
                )}
              </div>
              <div className="info-item">
                <strong>Room:</strong><br />
                Room ID: {currentLease.room}
              </div>
              <div className="info-item">
                <strong>Monthly Rent:</strong><br />
                {formatCurrency(currentLease.monthly_rent)}
              </div>
              <div className="info-item">
                <strong>Security Deposit:</strong><br />
                {formatCurrency(currentLease.security_deposit)}
              </div>
              <div className="info-item">
                <strong>Lease Period:</strong><br />
                {currentLease.start_date} to {currentLease.end_date}
              </div>
              <div className="info-item">
                <strong>Status:</strong><br />
                <StatusBadge status="active" text="Active Lease" />
              </div>
            </div>
          ) : (
            <EmptyState 
              title="No Active Lease"
              description="This tenant is not currently assigned to any property."
              action={
                <button
                  onClick={() => alert('Create lease feature coming soon')}
                  className="btn btn-primary"
                >
                  ➕ Create New Lease
                </button>
              }
            />
          )}
        </SectionCard>

        {/* Applications History */}
        <SectionCard title="Application History" subtitle={`${applications.length} application${applications.length !== 1 ? 's' : ''} on record`}>
          {applications.length > 0 ? (
            <DataTable 
              columns={applicationsTableColumns}
              data={applicationsTableData}
              renderRow={renderApplicationRow}
            />
          ) : (
            <EmptyState 
              title="No Applications Found"
              description="This tenant hasn't submitted any rental applications yet."
            />
          )}
        </SectionCard>

        {/* Quick Actions */}
        <SectionCard title="Quick Actions" subtitle="Common tenant management tasks">
          <div className="actions-grid">
            <Link href={`/applications?tenant=${tenant.id}`} className="btn btn-primary">
              View Applications
            </Link>
            <Link href="/leases" className="btn btn-secondary">
              All Leases
            </Link>
            <Link href="/tenants" className="btn btn-secondary">
              All Tenants
            </Link>
          </div>
        </SectionCard>
      </DashboardLayout>

      <style jsx>{`
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
        }
        
        .tenant-info-grid, .lease-info-grid {
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
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .btn-sm {
          padding: var(--spacing-xs) var(--spacing-sm);
          font-size: var(--text-small);
        }
      `}</style>
    </>
  );
} 