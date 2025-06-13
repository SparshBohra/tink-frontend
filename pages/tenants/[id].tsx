import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { apiClient } from '../../lib/api';
import { Tenant, Lease, Application } from '../../lib/types';
import Navigation from '../../components/Navigation';

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
      <div>
        <Navigation />
        <h1>Loading Tenant Data...</h1>
        <p>Fetching tenant information from the server...</p>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div>
        <Navigation />
        <div style={{ marginBottom: '20px' }}>
          <Link href="/tenants">
            <button style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '15px'
            }}
            onClick={() => router.back()}
            >
              ← Back
            </button>
          </Link>
        </div>
        <h1>Error Loading Tenant</h1>
        <div style={{ 
          color: 'red', 
          border: '1px solid red', 
          padding: '15px', 
          marginBottom: '20px',
          backgroundColor: '#ffebee'
        }}>
          <strong>Error:</strong> {error || 'Tenant not found'}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      
      {/* Header & Navigation */}
      <div style={{ marginBottom: '20px' }}>
        <Link href="/tenants">
          <button style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '15px'
          }}
          onClick={() => router.back()}
          >
            ← Back
          </button>
        </Link>
        <h1>👤 {tenant.full_name}</h1>
        <p style={{ color: '#666' }}>Tenant ID: {tenant.id}</p>
      </div>
      
      {/* Tenant Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* Tenant Info Card */}
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '20px',
          backgroundColor: '#f8f9fa'
        }}>
          <h2>👤 Tenant Information</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Name:</td>
                <td style={{ padding: '8px 0' }}>{tenant.full_name}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Email:</td>
                <td style={{ padding: '8px 0' }}>
                  <a href={`mailto:${tenant.email}`} style={{ color: '#007bff', textDecoration: 'none' }}>
                    {tenant.email}
                  </a>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Phone:</td>
                <td style={{ padding: '8px 0' }}>
                  <a href={`tel:${tenant.phone}`} style={{ color: '#007bff', textDecoration: 'none' }}>
                    {tenant.phone}
                  </a>
                </td>
              </tr>
              {tenant.date_of_birth && (
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Date of Birth:</td>
                  <td style={{ padding: '8px 0' }}>{tenant.date_of_birth}</td>
                </tr>
              )}
              {tenant.emergency_contact_name && (
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Emergency Contact:</td>
                  <td style={{ padding: '8px 0' }}>
                    {tenant.emergency_contact_name}
                    {tenant.emergency_contact_phone && (
                      <> (<a href={`tel:${tenant.emergency_contact_phone}`} style={{ color: '#007bff', textDecoration: 'none' }}>
                        {tenant.emergency_contact_phone}
                      </a>)</>
                    )}
                  </td>
                </tr>
              )}
              <tr>
                <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Created:</td>
                <td style={{ padding: '8px 0' }}>
                  {tenant.created_at ? new Date(tenant.created_at).toLocaleDateString() : 'Unknown'}
                </td>
              </tr>
              {tenant.notes && (
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Notes:</td>
                  <td style={{ padding: '8px 0' }}>{tenant.notes}</td>
                </tr>
              )}
            </tbody>
          </table>
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button
              onClick={() => alert('Edit feature coming soon')}
              style={{
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ✏️ Edit Details
            </button>
            <a href={`mailto:${tenant.email}`}>
              <button style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                ✉️ Send Email
              </button>
            </a>
          </div>
        </div>
        
        {/* Current Housing Card */}
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '20px',
          backgroundColor: '#f8f9fa'
        }}>
          <h2>🏠 Current Housing</h2>
          {currentLease ? (
            <div>
              <div style={{
                padding: '10px',
                backgroundColor: '#e8f5e8',
                borderRadius: '4px',
                marginBottom: '15px'
              }}>
                <strong>Lease Status:</strong> 
                <span style={{ 
                  color: '#28a745', 
                  fontWeight: 'bold',
                  marginLeft: '5px'
                }}>
                  Active
                </span>
              </div>
              
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Property:</td>
                    <td style={{ padding: '8px 0' }}>
                      {currentLease.property_name || 'Unknown Property'}
                      {currentLease.property_ref && (
                        <span> (<Link href={`/properties/${currentLease.property_ref}/rooms`}>
                          View Property
                        </Link>)</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Room:</td>
                    <td style={{ padding: '8px 0' }}>{currentLease.room_name || 'Unknown Room'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Monthly Rent:</td>
                    <td style={{ padding: '8px 0' }}>${currentLease.monthly_rent}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Security Deposit:</td>
                    <td style={{ padding: '8px 0' }}>${currentLease.security_deposit}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Start Date:</td>
                    <td style={{ padding: '8px 0' }}>{currentLease.start_date}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>End Date:</td>
                    <td style={{ padding: '8px 0' }}>{currentLease.end_date}</td>
                  </tr>
                </tbody>
              </table>
              
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => alert('Edit lease feature coming soon')}
                  style={{
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  ✏️ Edit Lease
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{
                padding: '15px',
                backgroundColor: '#f8d7da',
                borderRadius: '4px',
                marginBottom: '15px',
                color: '#721c24'
              }}>
                <strong>No active lease found.</strong> This tenant is not currently assigned to any property.
              </div>
              
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => alert('Create lease feature coming soon')}
                  style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  ➕ Create New Lease
                </button>
                
                {applications.length > 0 && (
                  <Link href={`/applications?tenant=${tenant.id}`}>
                    <button style={{
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}>
                      📋 View Applications
                    </button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Applications History */}
      <div style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '30px',
        backgroundColor: '#f8f9fa'
      }}>
        <h2>📋 Application History</h2>
        {applications.length > 0 ? (
          <table border={1} style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#e9ecef' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Property</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Room</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Date</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map(app => (
                <tr key={app.id}>
                  <td style={{ padding: '10px' }}>{app.property_name || 'Unknown Property'}</td>
                  <td style={{ padding: '10px' }}>{app.room_name || 'Not specified'}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <span style={{
                      backgroundColor: 
                        app.status === 'approved' ? '#d4edda' :
                        app.status === 'pending' ? '#fff3cd' :
                        app.status === 'rejected' ? '#f8d7da' : '#e9ecef',
                      color: 
                        app.status === 'approved' ? '#155724' :
                        app.status === 'pending' ? '#856404' :
                        app.status === 'rejected' ? '#721c24' : '#6c757d',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold'
                    }}>
                      {app.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'Unknown'}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <Link href={`/applications/${app.id}`}>
                      <button style={{
                        backgroundColor: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}>
                        View Details
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{
            padding: '15px',
            backgroundColor: '#e9ecef',
            borderRadius: '4px'
          }}>
            <p style={{ margin: '0' }}>No application history found for this tenant.</p>
          </div>
        )}
        
        <div style={{ marginTop: '15px' }}>
          <button
            onClick={() => alert('Create application feature coming soon')}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ➕ Create New Application
          </button>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '20px',
        backgroundColor: '#f0f7ff'
      }}>
        <h2>⚡ Quick Actions</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a href={`tel:${tenant.phone}`}>
            <button style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              📞 Call Tenant
            </button>
          </a>
          <a href={`sms:${tenant.phone}`}>
            <button style={{
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              ✉️ Text Tenant
            </button>
          </a>
          <button 
            onClick={() => {
              const confirmed = window.confirm('Are you sure you want to delete this tenant? This action cannot be undone.');
              if (confirmed) {
                alert('Delete functionality coming soon!');
              }
            }}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🗑️ Delete Tenant
          </button>
        </div>
      </div>
    </div>
  );
}
 
 
 
 
 