import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { apiClient } from './api';
import { User, LoginCredentials, ApiError, LandlordSignupData } from './types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  signup: (userData: any) => Promise<void>;
  signupLandlord: (userData: LandlordSignupData) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
  error: string | null;
  clearError: () => void;
  // Role helper functions
  isAdmin: () => boolean;
  isLandlord: () => boolean;
  isManager: () => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check if user is authenticated on app load
  useEffect(() => {
    const initAuth = async () => {
      if (apiClient.isAuthenticated()) {
        try {
          const profile = await apiClient.getProfile();
          setUser(profile);
          console.log('User profile loaded:', profile);
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          apiClient.logout();
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const clearError = () => setError(null);

  // Role-based routing function
  const redirectBasedOnRole = (role: string) => {
    switch (role) {
      case 'admin':
        router.push('/admin-dashboard');
        break;
      case 'owner':
        router.push('/landlord-dashboard');
        break;
      case 'manager':
        router.push('/manager-dashboard');
        break;
      default:
        router.push('/dashboard');
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.login(credentials);
      
      // Check if we have user data in the response
      if (!response || !response.user) {
        console.error('No user data in response:', response);
        throw new Error('Invalid response from server - no user data');
      }
      
      // The API now returns the correct role directly
      const actualRole = response.user.role as 'admin' | 'owner' | 'manager';
      
      // Create enhanced user object with correct role
      const enhancedUser: User = {
        ...response.user,
        role: actualRole
      };
      
      setUser(enhancedUser);
      
      // Store user data in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('userRole', actualRole);
        localStorage.setItem('userId', response.user.id?.toString() || '');
        localStorage.setItem('userName', response.user.full_name || response.user.username || '');
        localStorage.setItem('userEmail', response.user.email || '');
      }
      
      // Navigate based on role
      redirectBasedOnRole(actualRole);
      
    } catch (error) {
      console.error('Login error:', error);
      const apiError = error as ApiError;
      
      // Provide more specific error messages
      let errorMessage = 'Login failed. Please check your credentials.';
      if (apiError.message) {
        errorMessage = apiError.message;
      } else if (apiError.status === 400) {
        errorMessage = 'Invalid username or password.';
      } else if (apiError.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await apiClient.logout_api();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all user data
      setUser(null);
      setError(null);
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
      }
      
      setLoading(false);
      router.push('/login');
    }
  };

  const signup = async (userData: any) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.signup(userData);
      router.push('/login');
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.message || 'Signup failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signupLandlord = async (userData: LandlordSignupData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Call landlord signup endpoint
      const response = await apiClient.signupLandlord(userData);
      
      // If signup includes auto-login, set user and redirect
      if (response.tokens && response.user) {
        const enhancedUser: User = {
          ...response.user,
          role: 'owner'
        };
        setUser(enhancedUser);
        
        // Store user data
        if (typeof window !== 'undefined') {
          localStorage.setItem('userRole', 'owner');
          localStorage.setItem('userId', response.user.id.toString());
          localStorage.setItem('userName', response.user.full_name || response.user.username);
          localStorage.setItem('userEmail', response.user.email || '');
        }
        
        router.push('/landlord-dashboard');
      } else {
        // Redirect to login if no auto-login
        router.push('/login');
      }
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.message || 'Landlord registration failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      setError(null);
      const updatedUser = await apiClient.updateProfile(userData);
      setUser(updatedUser);
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.message || 'Profile update failed.');
      throw error;
    }
  };

  // Role helper functions
  const isAdmin = () => user?.role === 'admin';
  const isLandlord = () => user?.role === 'owner';
  const isManager = () => user?.role === 'manager';
  const hasRole = (role: string) => user?.role === role;
  const hasAnyRole = (roles: string[]) => user ? roles.includes(user.role) : false;

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    signup,
    signupLandlord,
    updateProfile,
    isAuthenticated: !!user,
    error,
    clearError,
    isAdmin,
    isLandlord,
    isManager,
    hasRole,
    hasAnyRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protected routes with role-based access
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredRoles?: string[]
) {
  const AuthenticatedComponent = (props: P) => {
    const { isAuthenticated, loading, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (!isAuthenticated) {
          router.push('/login');
          return;
        }
        
        // Check role-based access
        if (requiredRoles && requiredRoles.length > 0 && user) {
          if (!requiredRoles.includes(user.role)) {
            router.push('/unauthorized');
            return;
          }
        }
      }
    }, [isAuthenticated, loading, router, user]);

    if (loading) {
      return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>🔄 Loading...</h2>
          <p>Please wait while we verify your access.</p>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>🔐 Redirecting to login...</h2>
        </div>
      );
    }

    if (requiredRoles && requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
      return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>🚫 Access Denied</h2>
          <p>You don't have permission to access this page.</p>
          <p>Required roles: {requiredRoles.join(', ')}</p>
          <p>Your role: {user.role}</p>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };

  AuthenticatedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return AuthenticatedComponent;
} 
 