import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { apiClient } from './api';
import { TenantProfile, Tenant } from './types';

interface TenantAuthContextType {
  isAuthenticated: boolean;
  tenant: Tenant | null;
  profile: TenantProfile | null;
  loading: boolean;
  login: (accessToken: string, refreshToken: string, tenantData: Tenant) => void;
  logout: () => void;
  reloadProfile: () => Promise<void>;
}

const TenantAuthContext = createContext<TenantAuthContextType | undefined>(undefined);

export const TenantAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  const reloadProfile = async () => {
    console.log('reloadProfile called, isAuthenticated:', isAuthenticated);
    const accessToken = localStorage.getItem('tenant_access_token');
    if (isAuthenticated && accessToken) {
      try {
        console.log('Starting profile reload...');
        setLoading(true);
        const tenantProfile = await apiClient.getTenantProfile();
        console.log('Profile loaded successfully:', tenantProfile);
        setProfile(tenantProfile);
      } catch (error) {
        console.error('Failed to reload profile, logging out:', error);
        await logout();
      } finally {
        setLoading(false);
      }
    } else {
      console.log('Not authenticated or no token, skipping profile reload');
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('Initializing tenant auth...');
      const accessToken = localStorage.getItem('tenant_access_token');
      const tenantDataStr = localStorage.getItem('tenant_user');
      console.log('Stored tokens:', { accessToken: !!accessToken, tenantData: !!tenantDataStr });

      if (accessToken && tenantDataStr) {
        try {
          const tenantData = JSON.parse(tenantDataStr);
          console.log('Parsed tenant data:', tenantData);
          setTenant(tenantData);
          apiClient.setAccessToken(accessToken, 'tenant');
          setIsAuthenticated(true);
          
          // Load profile data after setting authenticated state
          console.log('Loading tenant profile...');
          const tenantProfile = await apiClient.getTenantProfile();
          console.log('Profile loaded successfully:', tenantProfile);
          setProfile(tenantProfile);
        } catch (error) {
          console.error('Failed to initialize tenant auth:', error);
          await logout();
        }
      } else {
        console.log('No stored tokens found');
      }
      setLoading(false);
      console.log('Auth initialization complete');
    };

    initializeAuth();
  }, []);

  const login = (accessToken: string, refreshToken: string, tenantData: Tenant) => {
    localStorage.setItem('tenant_access_token', accessToken);
    localStorage.setItem('tenant_refresh_token', refreshToken);
    localStorage.setItem('tenant_user', JSON.stringify(tenantData));
    apiClient.setAccessToken(accessToken, 'tenant');
    setTenant(tenantData);
    setIsAuthenticated(true);
    router.push('/tenant-dashboard');
  };

  const logout = async () => {
    setLoading(true);
    try {
      // Call the API to invalidate the token on the server
      await apiClient.tenantLogout();
    } catch (error) {
      console.error('Tenant logout API call failed:', error);
    } finally {
      // Always clear local state and storage
      localStorage.removeItem('tenant_access_token');
      localStorage.removeItem('tenant_refresh_token');
      localStorage.removeItem('tenant_user');
      // Clear tenant token - no need to call setAccessToken with null
      setIsAuthenticated(false);
      setTenant(null);
      setProfile(null);
      setLoading(false);
      router.push('/tenant-login');
    }
  };

  const value = {
    isAuthenticated,
    tenant,
    profile,
    loading,
    login,
    logout,
    reloadProfile,
  };

  return (
    <TenantAuthContext.Provider value={value}>
      {children}
    </TenantAuthContext.Provider>
  );
};

export const useTenantAuth = () => {
  const context = useContext(TenantAuthContext);
  if (context === undefined) {
    throw new Error('useTenantAuth must be used within a TenantAuthProvider');
  }
  return context;
}; 