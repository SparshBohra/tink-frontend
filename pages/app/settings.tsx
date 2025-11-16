import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth, withAuth } from '../../lib/auth-context';
import { apiClient } from '../../lib/api';
import { Settings, User, LogOut, Save, X } from 'lucide-react';

function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingFullName, setIsEditingFullName] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [fullName, setFullName] = useState(user?.full_name || '');

  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    }
    if (user?.full_name) {
      setFullName(user.full_name);
    }
  }, [user]);

  const handleSaveUsername = async () => {
    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }

    if (username === user?.username) {
      setIsEditingUsername(false);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await apiClient.updateProfile({ username });
      setSuccess('Username updated successfully!');
      setIsEditingUsername(false);
      // Refresh user data
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Failed to update username');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFullName = async () => {
    if (!fullName.trim()) {
      setError('Full name cannot be empty');
      return;
    }

    if (fullName === user?.full_name) {
      setIsEditingFullName(false);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await apiClient.updateProfile({ full_name: fullName });
      setSuccess('Full name updated successfully!');
      setIsEditingFullName(false);
      // Refresh user data
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Failed to update full name');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await logout();
        router.push('/login');
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Settings - SquareFt</title>
      </Head>
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: '700', 
            color: '#111827', 
            margin: '0 0 0.5rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Settings size={28} />
            Settings
          </h1>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Manage your account settings and preferences
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            color: '#dc2626'
          }}>
            {error}
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            color: '#166534'
          }}>
            {success}
          </div>
        )}

        {/* Account Settings */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 1.5rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <User size={20} />
            Account Settings
          </h2>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Full Name
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {isEditingFullName ? (
                <>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={saving}
                    style={{
                      flex: 1,
                      padding: '0.625rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                  <button
                    onClick={handleSaveFullName}
                    disabled={saving}
                    style={{
                      padding: '0.625rem 1rem',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      opacity: saving ? 0.6 : 1
                    }}
                  >
                    <Save size={14} />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingFullName(false);
                      setFullName(user?.full_name || '');
                      setError(null);
                    }}
                    disabled={saving}
                    style={{
                      padding: '0.625rem 1rem',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: saving ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <div style={{
                    flex: 1,
                    padding: '0.625rem 0.75rem',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    color: '#111827'
                  }}>
                    {user?.full_name || 'Not set'}
                  </div>
                  <button
                    onClick={() => setIsEditingFullName(true)}
                    style={{
                      padding: '0.625rem 1rem',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Username
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {isEditingUsername ? (
                <>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={saving}
                    style={{
                      flex: 1,
                      padding: '0.625rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                  <button
                    onClick={handleSaveUsername}
                    disabled={saving}
                    style={{
                      padding: '0.625rem 1rem',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      opacity: saving ? 0.6 : 1
                    }}
                  >
                    <Save size={14} />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingUsername(false);
                      setUsername(user?.username || '');
                      setError(null);
                    }}
                    disabled={saving}
                    style={{
                      padding: '0.625rem 1rem',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: saving ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <div style={{
                    flex: 1,
                    padding: '0.625rem 0.75rem',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    color: '#111827'
                  }}>
                    {user?.username || 'Not set'}
                  </div>
                  <button
                    onClick={() => setIsEditingUsername(true)}
                    style={{
                      padding: '0.625rem 1rem',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Email
            </label>
            <div style={{
              padding: '0.625rem 0.75rem',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: '#6b7280'
            }}>
              {user?.email || 'Not set'}
            </div>
          </div>
        </div>


        {/* Logout */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 1rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <LogOut size={20} />
            Account Actions
          </h2>

          <button
            onClick={handleLogout}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(SettingsPage);

