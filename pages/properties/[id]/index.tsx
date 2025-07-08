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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <div className="detail-content">
                <h3 className="detail-title">Rent Structure</h3>
                <div className="detail-value">
                  {property.rent_type === 'per_room' ? 'Per Room' : 'Per Property'}
                </div>
                <p className="detail-description">
                  {property.rent_type === 'per_room' 
                    ? 'Individual rent amounts set for each room'
                    : 'Single rent amount for the entire property'
                  }
                </p>
              </div>
            </div>
            
            <div className="detail-card">
              <div className="detail-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <div className="detail-content">
                <h3 className="detail-title">Effective Rent</h3>
                <div className="detail-value">
                  {property.effective_rent !== undefined && property.effective_rent !== null 
                    ? `$${property.effective_rent}` 
                    : '-'
                  }
                </div>
                <p className="detail-description">
                  {property.rent_type === 'per_room' 
                    ? 'Total rent across all rooms'
                    : 'Monthly rent for the property'
                  }
                </p>
              </div>
            </div>
            
            <div className="detail-card">
              <div className="detail-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              </div>
              <div className="detail-content">
                <h3 className="detail-title">Security Deposit</h3>
                <div className="detail-value">
                  {property.effective_security_deposit !== undefined && property.effective_security_deposit !== null 
                    ? `$${property.effective_security_deposit}` 
                    : '-'
                  }
                </div>
                <p className="detail-description">
                  Total security deposit amount
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="property-actions">
          <Link href={`/properties/${property.id}/rooms`} className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18"/>
              <path d="M5 21V7l8-4v18"/>
              <path d="M19 21V11l-6-4"/>
            </svg>
            Manage Rooms
          </Link>
          <Link href={`/properties/${property.id}/edit`} className="btn btn-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            Edit Property
          </Link>
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
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
          color: #1e293b;
          margin: 0 0 8px 0;
        }
        
        .property-address {
          font-size: 16px;
          color: #64748b;
          margin: 0 0 16px 0;
        }
        
        .property-badges {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .property-type-badge {
          background: #f1f5f9;
          color: #475569;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }
        
        .rent-type-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .rent-type-badge.per-property {
          background: #dbeafe;
          color: #1e40af;
        }
        
        .rent-type-badge.per-room {
          background: #dcfce7;
          color: #16a34a;
        }
        
        .property-details {
          margin-bottom: 32px;
        }
        
        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }
        
        .detail-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }
        
        .detail-icon {
          width: 48px;
          height: 48px;
          background: #eff6ff;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3b82f6;
          flex-shrink: 0;
        }
        
        .detail-content {
          flex: 1;
        }
        
        .detail-title {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .detail-value {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 8px 0;
        }
        
        .detail-description {
          font-size: 14px;
          color: #64748b;
          margin: 0;
          line-height: 1.4;
        }
        
        .property-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
        }
        
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
          border: none;
          cursor: pointer;
        }
        
        .btn-primary {
          background: #4f46e5;
          color: white;
        }
        
        .btn-primary:hover {
          background: #3730a3;
          transform: translateY(-1px);
        }
        
        .btn-secondary {
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }
        
        .btn-secondary:hover {
          background: #e2e8f0;
          transform: translateY(-1px);
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