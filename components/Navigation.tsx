import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function Navigation() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'manager';
    setUserRole(role);
  }, []);

  const isActive = (path: string) => router.pathname === path;

  return (
    <nav style={{
      backgroundColor: '#2c3e50', 
      padding: '15px', 
      marginBottom: '20px',
      color: 'white'
    }}>
      {/* Simple Header */}
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
            {userRole === 'landlord' ? '💰 Landlord Dashboard' : '⚙️ Manager Dashboard'}
          </small>
        </div>
        <div style={{fontSize: '14px', textAlign: 'right'}}>
          <div>📊 72% Occupied | 💵 $12,350/month</div>
          <div style={{color: '#e74c3c'}}>🚨 3 urgent items</div>
        </div>
      </div>

      {/* Clean Navigation Links */}
      <div style={{
        display: 'flex',
        gap: '20px',
        borderTop: '1px solid #34495e',
        paddingTop: '10px'
      }}>
        <Link href="/dashboard" style={{
          color: isActive('/dashboard') ? '#3498db' : 'white',
          textDecoration: 'none',
          fontWeight: isActive('/dashboard') ? 'bold' : 'normal'
        }}>
          📊 Dashboard
        </Link>
        
        <Link href="/properties" style={{
          color: isActive('/properties') ? '#27ae60' : 'white',
          textDecoration: 'none',
          fontWeight: isActive('/properties') ? 'bold' : 'normal'
        }}>
          🏠 Properties
        </Link>
        
        <Link href="/applications" style={{
          color: isActive('/applications') ? '#e74c3c' : 'white',
          textDecoration: 'none',
          fontWeight: isActive('/applications') ? 'bold' : 'normal'
        }}>
          📋 Applications (3)
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
        
        <Link href="/inventory" style={{
          color: isActive('/inventory') ? '#17a2b8' : 'white',
          textDecoration: 'none',
          fontWeight: isActive('/inventory') ? 'bold' : 'normal'
        }}>
          📦 Inventory
        </Link>
        
        {userRole === 'manager' && (
          <Link href="/reminders" style={{
            color: isActive('/reminders') ? '#6f42c1' : 'white',
            textDecoration: 'none',
            fontWeight: isActive('/reminders') ? 'bold' : 'normal'
          }}>
            📱 Communication
          </Link>
        )}
        
        <button 
          onClick={() => {
            localStorage.removeItem('userRole');
            window.location.href='/login';
          }} 
          style={{
            backgroundColor: 'transparent', 
            color: '#bdc3c7', 
            border: '1px solid #bdc3c7', 
            padding: '5px 10px', 
            borderRadius: '3px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          🔄 Switch Role
        </button>
      </div>
    </nav>
  );
} 