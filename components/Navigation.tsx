import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';

export default function Navigation() {
  const router = useRouter();
  const { user, logout, isAdmin, isLandlord, isManager } = useAuth();
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState<number>(0);

  useEffect(() => {
    const fetchPendingApplications = async () => {
      try {
        const applications = await apiClient.getPendingApplications();
        setPendingApplicationsCount(Array.isArray(applications) ? applications.length : 0);
      } catch (error) {
        console.warn('Failed to fetch pending applications count:', error);
        setPendingApplicationsCount(0);
      }
    };

    if (user) {
      fetchPendingApplications();
      
      // Refresh count every 30 seconds
      const interval = setInterval(fetchPendingApplications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const isActive = (path: string) => router.pathname === path;

  // Get display name with fallbacks
  const getDisplayName = () => {
    if (user?.full_name) return user.full_name;
    if (user?.username) return user.username;
    return 'User';
  };

  // Get dashboard title based on role
  const getDashboardTitle = () => {
    if (isAdmin()) return 'Platform Admin';
    if (isLandlord()) return 'Business Owner';
    if (isManager()) return 'Property Manager';
    return 'User';
  };

  // Get role badge
  const getRoleBadge = () => {
    if (isAdmin()) return { text: 'ADMIN', color: '#dc3545' };
    if (isLandlord()) return { text: 'OWNER', color: '#f39c12' };
    if (isManager()) return { text: 'MANAGER', color: '#28a745' };
    return { text: 'USER', color: '#6c757d' };
  };

  const roleBadge = getRoleBadge();

  return (
    <nav style={{
      backgroundColor: '#2c3e50', 
      padding: '15px', 
      marginBottom: '20px',
      color: 'white'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <div>
          <h2 style={{margin: '0', fontSize: '20px'}}>
            🏠 Tink Property Management
          </h2>
          <small style={{color: '#bdc3c7'}}>
            {getDashboardTitle()}
          </small>
        </div>
        <div style={{fontSize: '14px', textAlign: 'right'}}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>👤 {getDisplayName()}</span>
            <span style={{
              backgroundColor: roleBadge.color,
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: 'bold'
            }}>
              {roleBadge.text}
            </span>
          </div>
          <div style={{color: '#bdc3c7', fontSize: '12px'}}>
            {user?.email || 'No email'}
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div style={{
        display: 'flex',
        gap: '20px',
        borderTop: '1px solid #34495e',
        paddingTop: '10px',
        flexWrap: 'wrap'
      }}>
        {/* Role-specific main dashboard */}
        {isAdmin() && (
          <>
            <Link href="/admin-dashboard" style={{
              color: isActive('/admin-dashboard') ? '#dc3545' : 'white',
              textDecoration: 'none',
              fontWeight: isActive('/admin-dashboard') ? 'bold' : 'normal'
            }}>
              🛡️ Dashboard
            </Link>
            <Link href="/managers" style={{
              color: isActive('/managers') ? '#20c997' : 'white',
              textDecoration: 'none',
              fontWeight: isActive('/managers') ? 'bold' : 'normal'
            }}>
              👥 Managers
            </Link>
            <Link href="/landlords" style={{
              color: isActive('/landlords') ? '#f39c12' : 'white',
              textDecoration: 'none',
              fontWeight: isActive('/landlords') ? 'bold' : 'normal'
            }}>
              💰 Landlords
            </Link>
          </>
        )}
        
        {isLandlord() && (
          <>
            <Link href="/landlord-dashboard" style={{
              color: isActive('/landlord-dashboard') ? '#f39c12' : 'white',
              textDecoration: 'none',
              fontWeight: isActive('/landlord-dashboard') ? 'bold' : 'normal'
            }}>
              💰 Dashboard
            </Link>
            <Link href="/managers" style={{
              color: isActive('/managers') ? '#20c997' : 'white',
              textDecoration: 'none',
              fontWeight: isActive('/managers') ? 'bold' : 'normal'
            }}>
              👥 My Team
            </Link>
          </>
        )}
        
        {isManager() && (
          <Link href="/manager-dashboard" style={{
            color: isActive('/manager-dashboard') ? '#28a745' : 'white',
          textDecoration: 'none',
            fontWeight: isActive('/manager-dashboard') ? 'bold' : 'normal'
        }}>
            ⚙️ Dashboard
        </Link>
        )}
        
        {/* Shared operational links */}
        <Link href="/properties" style={{
          color: isActive('/properties') ? '#27ae60' : 'white',
          textDecoration: 'none',
          fontWeight: isActive('/properties') ? 'bold' : 'normal'
        }}>
          🏠 Properties
        </Link>
        
        {/* Landlord and Manager operational links */}
        {(isLandlord() || isManager()) && (
          <>
        <Link href="/applications" style={{
          color: isActive('/applications') ? '#e74c3c' : 'white',
          textDecoration: 'none',
          fontWeight: isActive('/applications') ? 'bold' : 'normal'
        }}>
              📋 Applications {pendingApplicationsCount > 0 && `(${pendingApplicationsCount})`}
        </Link>
        <Link href="/tenants" style={{
          color: isActive('/tenants') ? '#9b59b6' : 'white',
          textDecoration: 'none',
          fontWeight: isActive('/tenants') ? 'bold' : 'normal'
        }}>
          👥 Tenants
        </Link>
        <Link href="/leases" style={{
          color: isActive('/leases') ? '#f39c12' : 'white',
          textDecoration: 'none',
          fontWeight: isActive('/leases') ? 'bold' : 'normal'
        }}>
          📄 Leases
        </Link>
          </>
        )}
        
        {/* Manager-specific operational links */}
        {isManager() && (
          <Link href="/reminders" style={{
            color: isActive('/reminders') ? '#6f42c1' : 'white',
            textDecoration: 'none',
            fontWeight: isActive('/reminders') ? 'bold' : 'normal'
          }}>
            📱 Tasks
          </Link>
        )}
        
        <button 
          onClick={() => {
            logout();
          }} 
          style={{
            backgroundColor: 'transparent', 
            color: '#e74c3c', 
            border: '1px solid #e74c3c', 
            padding: '5px 10px', 
            borderRadius: '3px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          🚪 Logout
        </button>
      </div>
    </nav>
  );
} 