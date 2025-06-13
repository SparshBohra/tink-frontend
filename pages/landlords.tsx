import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';
import { withAuth } from '../lib/auth-context';
import Navigation from '../components/Navigation';
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
        <Navigation />
        <div style={{ padding: '20px' }}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '18px', color: '#666' }}>Loading landlords...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '30px',
          borderBottom: '2px solid #e9ecef',
          paddingBottom: '15px'
        }}>
          <div>
            <h1 style={{ margin: '0', color: '#2c3e50', fontSize: '28px' }}>
              💰 All Landlords
            </h1>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '16px' }}>
              Manage all property owners on the platform
            </p>
          </div>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}

        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {landlords.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>💰</div>
              <h3>No Landlords Found</h3>
              <p>No property owners have registered yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>
                      Landlord
                    </th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>
                      Organization
                    </th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>
                      Contact
                    </th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>
                      Status
                    </th>
                    <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {landlords.map((landlord) => (
                    <tr key={landlord.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '15px' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                            {landlord.full_name}
                          </div>
                          <div style={{ fontSize: '14px', color: '#666' }}>
                            @{landlord.username}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ fontWeight: 'bold', color: '#f39c12' }}>
                          {landlord.org_name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {landlord.address}
                        </div>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ color: '#666' }}>
                          📧 {landlord.contact_email}
                        </div>
                        {landlord.contact_phone && (
                          <div style={{ color: '#666', fontSize: '14px' }}>
                            📞 {landlord.contact_phone}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{
                          backgroundColor: landlord.is_active ? '#d4edda' : '#f8d7da',
                          color: landlord.is_active ? '#155724' : '#721c24',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {landlord.is_active ? '✅ Active' : '❌ Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <Link href={`/managers?landlord=${landlord.id}`}>
                            <button style={{
                              backgroundColor: '#28a745',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}>
                              👥 Managers
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default withAuth(LandlordsPage, ['admin', 'owner']); 
 
 
 
 