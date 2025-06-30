import { useEffect, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '../components/DashboardLayout';
import MetricCard from '../components/MetricCard';
import SectionCard from '../components/SectionCard';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import Link from 'next/link';
import { useAuth, withAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';
import { useRouter } from 'next/router';

import { DashboardStats } from '../lib/types';

// SVG Icons
const BuildingIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 21V8L12 3L21 8V21H3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 21V12H15V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ApplicationIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 21V19C17 17.9 16.1 17 15 17H9C7.9 17 7 17.9 7 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
    <path d="M6 21V19C6 16.79 7.79 15 10 15L12 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="20" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const TeamIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 21V19C16 16.79 14.21 15 12 15H5C2.79 15 1 16.79 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
    <path d="M23 21V19C23 16.79 21.21 15 19 15C17.94 15 16.93 15.53 16.2 16.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="20" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function LandlordDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch real dashboard statistics
        const dashboardStats = await apiClient.getDashboardStats();
        setStats(dashboardStats);
        
        // Fetch real properties data
        const propertiesResponse = await apiClient.getProperties();
        setProperties(propertiesResponse.results || []);
        
        // Fetch recent applications
        const applicationsResponse = await apiClient.getApplications();
        const recentApps = (applicationsResponse.results || [])
          .filter(app => app.status === 'pending')
          .slice(0, 5); // Show only recent 5 applications
        setRecentApplications(recentApps);
        
      } catch (err: any) {
        console.error('Failed to fetch business data:', err);
        setError('Failed to load business data.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchBusinessData();
    }
  }, [user]);

  if (loading) {
    return (
        <DashboardLayout
          title="Business Dashboard"
          subtitle="Loading your business data..."
        >
          <div className="loading-indicator">
            <div className="loading-spinner" />
            <p>Fetching business data...</p>
        </div>
        </DashboardLayout>
    );
  }

  return (
      <DashboardLayout
        title="Business Dashboard"
        subtitle={`Managing properties for your organization.`}
      >
        {error && <div className="alert alert-error">{error}</div>}

        {/* Dashboard Grid Layout */}
        <div className="dashboard-grid">
          {/* Business Overview - Full Width */}
          <div className="grid-section overview-section">
        <SectionCard title="Business Overview">
          <div className="metrics-grid">
            <MetricCard title="My Properties" value={stats?.properties?.total || 0} subtitle={`${stats?.properties?.vacant || 0} vacant`} color="blue" />
            <MetricCard title="Total Rooms" value={stats?.rooms?.total || 0} subtitle={`${stats?.rooms?.occupancy_rate?.toFixed(1) || '0'}% occupancy`} color="purple" />
            <MetricCard title="Active Tenants" value={stats?.tenants?.active || 0} subtitle="Across all properties" color="green" />
            <MetricCard title="Monthly Revenue" value={stats?.revenue?.monthly || 0} isMonetary={true} subtitle={`Projected Annual: $${stats?.revenue?.projected_annual?.toLocaleString()}`} color="amber" />
          </div>
        </SectionCard>
          </div>

          {/* Left Column - Properties */}
          <div className="grid-section properties-section">
        <SectionCard 
          title="My Properties"
              action={
                <Link href="/properties/add" className="btn btn-primary light-btn btn-sm">
                  <PlusIcon />
                  Add Property
                </Link>
              }
            >
              <div className="properties-container">
                {properties.slice(0, 3).map(p => (
                  <div key={p.id} className="property-card-compact">
                    <div className="property-info">
                      <h4 className="property-name">{p.name}</h4>
                      <p className="property-location">{p.full_address}</p>
                    </div>
                    <div className="property-stats-compact">
                      <div className="stat-compact">
                        <span className="stat-value">{p.total_rooms}</span>
                        <span className="stat-label">Rooms</span>
                      </div>
                      <div className="stat-compact">
                        <span className="stat-value">{p.vacant_rooms}</span>
                        <span className="stat-label">Vacant</span>
                </div>
                      <div className="stat-compact">
                        <span className="stat-value">{Math.round((p.total_rooms - p.vacant_rooms) / p.total_rooms * 100) || 0}%</span>
                        <span className="stat-label">Occupied</span>
                </div>
                    </div>
                    <Link href={`/properties/${p.id}`} className="property-action">
                      <ArrowRightIcon />
                    </Link>
              </div>
            ))}
          {properties.length === 0 && (
            <EmptyState title="No properties found" description="Add your first property to get started." />
          )}
                {properties.length > 3 && (
                  <Link href="/properties" className="view-all-link">
                    View all {properties.length} properties <ArrowRightIcon />
                  </Link>
                )}
              </div>
            </SectionCard>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="grid-section actions-section">
            <SectionCard title="Quick Actions">
              <div className="quick-actions-compact">
                <Link href="/properties/add" className="action-card-compact">
                  <div className="action-icon-compact">
                    <BuildingIcon />
                  </div>
                  <div className="action-content-compact">
                    <div className="action-title-compact">Add Property</div>
                    <div className="action-description-compact">Register new property</div>
                  </div>
                </Link>
                <Link href="/applications" className="action-card-compact">
                  <div className="action-icon-compact">
                    <ApplicationIcon />
                  </div>
                  <div className="action-content-compact">
                    <div className="action-title-compact">Review Applications</div>
                    <div className="action-description-compact">Process applications</div>
                  </div>
                </Link>
                <Link href="/tenants" className="action-card-compact">
                  <div className="action-icon-compact">
                    <UsersIcon />
                  </div>
                  <div className="action-content-compact">
                    <div className="action-title-compact">Manage Tenants</div>
                    <div className="action-description-compact">View and manage</div>
                  </div>
                </Link>
                <Link href="/managers" className="action-card-compact">
                  <div className="action-icon-compact">
                    <TeamIcon />
                  </div>
                  <div className="action-content-compact">
                    <div className="action-title-compact">Manage Team</div>
                    <div className="action-description-compact">Add and manage staff</div>
                  </div>
                </Link>
              </div>
        </SectionCard>
          </div>

          {/* Bottom Section - Recent Applications */}
          <div className="grid-section applications-section">
        <SectionCard title="Recent Applications">
            {recentApplications.length > 0 ? (
            <DataTable
              columns={[
                { key: 'tenant', header: 'Applicant ID' },
                { key: 'room', header: 'Room ID' },
                { key: 'status', header: 'Status' },
                { key: 'actions', header: 'Actions' },
              ]}
              data={recentApplications}
              renderRow={(app) => (
                <tr key={app.id}>
                  <td style={{ textAlign: 'center' }}>Tenant {app.tenant}</td>
                  <td style={{ textAlign: 'center' }}>Room {app.room}</td>
                  <td style={{ textAlign: 'center' }}><span className="status-badge status-pending">{app.status}</span></td>
                  <td style={{ textAlign: 'center' }}>
                        <Link href="/applications" className="btn btn-primary btn-sm light-btn">Review</Link>
                      </td>
                    </tr>
              )}
            />
            ) : (
            <EmptyState title="No pending applications" description="All applications have been reviewed." />
            )}
        </SectionCard>
          </div>
        </div>
      
      <style jsx>{`
        /* Dashboard Grid Layout */
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          grid-template-rows: auto auto auto;
          gap: 24px;
          grid-template-areas:
            "overview overview"
            "properties actions"
            "applications applications";
        }

        .overview-section {
          grid-area: overview;
        }

        .properties-section {
          grid-area: properties;
        }

        .actions-section {
          grid-area: actions;
        }

        .applications-section {
          grid-area: applications;
        }

        /* Loading States */
        .loading-indicator { 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: center; 
          padding: 60px; 
          color: #6b7280;
        }
        .loading-spinner { 
          width: 48px; 
          height: 48px; 
          border: 4px solid #e5e7eb; 
          border-top-color: #3b82f6; 
          border-radius: 50%; 
          animation: spin 1s linear infinite; 
          margin-bottom: 20px; 
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Alert Styles */
        .alert {
          padding: 16px 20px;
          border-radius: 16px;
          margin-bottom: 24px;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(226, 232, 240, 0.8);
        }
        .alert-error {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
          border-color: rgba(239, 68, 68, 0.2);
        }

        /* Metrics Grid */
        .metrics-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
          gap: 20px; 
        }

        /* Properties Container */
        .properties-container {
          max-height: 400px;
          overflow-y: auto;
          padding-right: 8px;
        }

        .properties-container::-webkit-scrollbar {
          width: 6px;
        }

        .properties-container::-webkit-scrollbar-track {
          background: rgba(226, 232, 240, 0.3);
          border-radius: 3px;
        }

        .properties-container::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 3px;
        }

        .properties-container::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }

        .property-card-compact { 
          display: flex;
          align-items: center;
          padding: 16px;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(10px);
          border-radius: 12px; 
          border: 1px solid rgba(226, 232, 240, 0.5);
          margin-bottom: 12px;
          transition: all 0.2s ease;
          gap: 16px;
        }

        .property-card-compact:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          border-color: rgba(59, 130, 246, 0.3);
        }

        .property-info {
          flex: 1;
          min-width: 0;
        }

        .property-name {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 4px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .property-location {
          font-size: 12px;
          color: #6b7280;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .property-stats-compact { 
          display: flex; 
          gap: 12px;
          margin-right: 12px;
        }

        .stat-compact {
          text-align: center;
          min-width: 32px;
        }

        .stat-compact .stat-value {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          line-height: 1;
        }

        .stat-compact .stat-label {
          display: block;
          font-size: 10px;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 2px;
        }

        .property-action {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .property-action:hover {
          background: rgba(59, 130, 246, 0.2);
          transform: translateX(2px);
        }

        .view-all-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          color: #3b82f6;
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          border-radius: 8px;
          background: rgba(59, 130, 246, 0.05);
          transition: all 0.2s ease;
          margin-top: 8px;
        }

        .view-all-link:hover {
          background: rgba(59, 130, 246, 0.1);
          text-decoration: none;
        }

        /* Quick Actions Compact */
        .quick-actions-compact { 
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 400px;
          overflow-y: auto;
          padding-right: 8px;
        }

        .quick-actions-compact::-webkit-scrollbar {
          width: 6px;
        }

        .quick-actions-compact::-webkit-scrollbar-track {
          background: rgba(226, 232, 240, 0.3);
          border-radius: 3px;
        }

        .quick-actions-compact::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 3px;
        }

        .action-card-compact {
          display: flex;
          align-items: center;
          padding: 16px;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(226, 232, 240, 0.5);
          text-decoration: none;
          transition: all 0.2s ease;
          gap: 12px;
        }

        .action-card-compact:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.8);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          text-decoration: none;
          border-color: rgba(59, 130, 246, 0.3);
        }

        .action-icon-compact {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          flex-shrink: 0;
        }

        .action-content-compact {
          flex: 1;
          min-width: 0;
        }

        .action-title-compact {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .action-description-compact {
          font-size: 12px;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Light Button Style */
        :global(.light-btn) {
          background: rgba(59, 130, 246, 0.1) !important;
          backdrop-filter: blur(15px) !important;
          border: 1px solid rgba(59, 130, 246, 0.3) !important;
          color: #1d4ed8 !important;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1), 
                      inset 0 1px 0 rgba(255, 255, 255, 0.5) !important;
          transition: all 0.3s ease !important;
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
        }

        :global(.light-btn:hover) {
          background: rgba(59, 130, 246, 0.15) !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.15), 
                      inset 0 1px 0 rgba(255, 255, 255, 0.6) !important;
          color: #1e40af !important;
        }

        /* Status Badge */
        .status-badge { 
          padding: 6px 12px; 
          border-radius: 12px; 
          font-size: 12px; 
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .status-pending { 
          background: rgba(245, 158, 11, 0.1);
          color: #d97706;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }
        
        /* Table Styling */
        :global(.data-table .table-header) {
          text-align: center;
          color: #374151;
          font-weight: 600;
        }

        :global(.data-table td) {
          color: #4b5563;
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
            grid-template-areas:
              "overview"
              "properties"
              "actions"
              "applications";
          }

          .metrics-grid { 
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); 
            gap: 16px; 
          }
        }

        @media (max-width: 768px) {
          .dashboard-grid {
            gap: 16px;
          }

          .metrics-grid { 
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
            gap: 12px; 
          }

          .properties-container,
          .quick-actions-compact {
            max-height: 300px;
          }

          .property-card-compact,
          .action-card-compact {
            padding: 12px;
          }

          .property-stats-compact {
            gap: 8px;
          }

          .stat-compact .stat-value {
            font-size: 12px;
          }

          .stat-compact .stat-label {
            font-size: 9px;
          }
        }

        /* Dark Mode Styles */
        :global(.dark-mode) .property-card-compact {
          background: #374151;
          border: 1px solid #4b5563;
        }

        :global(.dark-mode) .property-card-compact:hover {
          background: #4b5563;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        :global(.dark-mode) .property-name {
          color: #f9fafb;
        }

        :global(.dark-mode) .property-location {
          color: #9ca3af;
        }

        :global(.dark-mode) .stat-value {
          color: #f9fafb;
        }

        :global(.dark-mode) .stat-label {
          color: #9ca3af;
        }

        :global(.dark-mode) .view-all-link {
          background: rgba(99, 102, 241, 0.2);
          color: #c4b5fd;
        }

        :global(.dark-mode) .view-all-link:hover {
          background: rgba(99, 102, 241, 0.3);
        }

        :global(.dark-mode) .action-card-compact {
          background: rgba(31, 41, 55, 0.8);
          border: 1px solid #4b5563;
        }

        :global(.dark-mode) .action-card-compact:hover {
          background: rgba(55, 65, 81, 0.9);
          border-color: rgba(99, 102, 241, 0.4);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }

        :global(.dark-mode) .action-icon-compact {
          background: rgba(99, 102, 241, 0.2);
          color: #c4b5fd;
        }

        :global(.dark-mode) .action-title-compact {
          color: #f9fafb;
        }

        :global(.dark-mode) .action-description-compact {
          color: #9ca3af;
        }

        :global(.dark-mode) .light-btn {
          background: rgba(99, 102, 241, 0.2) !important;
          border: 1px solid rgba(99, 102, 241, 0.4) !important;
          color: #c4b5fd !important;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2) !important;
        }

        :global(.dark-mode) .light-btn:hover {
          background: rgba(99, 102, 241, 0.3) !important;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3) !important;
          color: #e0e7ff !important;
        }

        :global(.dark-mode) .status-pending {
          background: rgba(245, 158, 11, 0.2);
          color: #fcd34d;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        :global(.dark-mode) .quick-actions-compact::-webkit-scrollbar-track {
          background: rgba(55, 65, 81, 0.3);
        }

        :global(.dark-mode) .quick-actions-compact::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.4);
        }
      `}</style>
    </DashboardLayout>
  );
}

export default withAuth(LandlordDashboard, ['owner']); 