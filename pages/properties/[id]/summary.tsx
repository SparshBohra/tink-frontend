import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { apiClient } from '../../../lib/api';
import { Property } from '../../../lib/types';
import DashboardLayout from '../../../components/DashboardLayout';
import Link from 'next/link';

export default function PropertySummary() {
  const router = useRouter();
  const { id } = router.query;
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      apiClient.getProperty(Number(id))
        .then(setProperty)
        .catch(() => setError('Failed to load property.'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><p>Loading property...</p></div>;
  }
  if (error || !property) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><p>{error || 'Property not found.'}</p></div>;
  }

  return (
    <DashboardLayout title="Property Summary">
      <div className="dashboard-container">
        <div className="property-header">
          <div className="header-content">
        <h1 className="dashboard-title">{property.name}</h1>
            <p className="property-address">{property.full_address}</p>
            <div className="property-badges">
              <span className="property-type-badge">{property.property_type}</span>
              <span className={`rent-type-badge ${property.rent_type === 'per_room' ? 'per-room' : 'per-property'}`}>
                {property.rent_type === 'per_room' ? 'Per Room' : 'Per Property'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="property-details">
          <div className="details-grid">
            <div className="detail-card">
              <div className="detail-icon">
                <div className="icon-background">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                </div>
              </div>
              <div className="detail-content">
                <h3>Rent Structure</h3>
                <div className="rent-structure">
                  {property.rent_type === 'per_room' ? 'Per Room' : 'Per Property'}
                </div>
                <p>Individual rent amounts set for each room</p>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-icon">
                <div className="icon-background">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6"/>
                    <path d="m4.2 4.2 4.9 4.9m5.8 5.8 4.9 4.9M1 12h6m6 0h6m-4.9-7.9 4.9 4.9M7.1 16.1l4.9 4.9"/>
                  </svg>
                </div>
              </div>
              <div className="detail-content">
                <h3>Effective Rent</h3>
                <div className="effective-rent">
                  ${property.base_rent ? Number(property.base_rent).toLocaleString() : '1350.00'}
                </div>
                <p>Total rent across all rooms</p>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-icon">
                <div className="icon-background">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="3" width="15" height="13"/>
                    <polygon points="16,8 20,8 20,21 7,21 7,16 16,16"/>
                  </svg>
                </div>
              </div>
              <div className="detail-content">
                <h3>Security Deposit</h3>
                <div className="security-deposit">
                  ${property.security_deposit ? Number(property.security_deposit).toLocaleString() : '0.00'}
                </div>
                <p>Total security deposit amount</p>
              </div>
            </div>
          </div>
        </div>

        <div className="property-actions">
          <Link href={`/properties/${id}`} className="action-button primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9,22 9,12 15,12 15,22"/>
            </svg>
            Manage Rooms
          </Link>
          
          <Link href={`/properties/${id}/edit`} className="action-button secondary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            Edit Property
          </Link>
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .property-header {
          margin-bottom: 32px;
        }

        .header-content {
          text-align: center;
        }

        .dashboard-title {
          font-size: 32px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 8px 0;
        }

        .property-address {
          font-size: 16px;
          color: #6b7280;
          margin: 0 0 16px 0;
        }

        .property-badges {
          display: flex;
          justify-content: center;
          gap: 12px;
        }

        .property-type-badge {
          background: #dbeafe;
          color: #1e40af;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 500;
        }

        .rent-type-badge {
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 500;
        }

        .rent-type-badge.per-room {
          background: #d1fae5;
          color: #065f46;
        }

        .rent-type-badge.per-property {
          background: #fef3c7;
          color: #92400e;
        }

        .property-details {
          margin-bottom: 32px;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .detail-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .detail-icon {
          margin-bottom: 16px;
        }

        .icon-background {
          width: 48px;
          height: 48px;
          background: #f3f4f6;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #374151;
        }

        .detail-content h3 {
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          margin: 0 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .rent-structure,
        .effective-rent,
        .security-deposit {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 4px 0;
        }

        .detail-content p {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .property-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
        }

        .action-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .action-button.primary {
          background: #3b82f6;
          color: white;
        }

        .action-button.primary:hover {
          background: #2563eb;
        }

        .action-button.secondary {
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .action-button.secondary:hover {
          background: #f9fafb;
        }
        
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 16px;
          }
          
          .dashboard-title {
            font-size: 24px;
          }
          
          .details-grid {
            grid-template-columns: 1fr;
          }
          
          .property-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </DashboardLayout>
  );
} 