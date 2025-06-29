import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/router';
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

// Mock user data for demo
const mockUsers = {
  'admin': {
    id: 1,
    username: 'admin',
    email: 'admin@tink.com',
    full_name: 'Platform Admin',
    role: 'admin',
    is_active: true
  },
  'premium_owner': {
    id: 27,
    username: 'premium_owner',
    email: 'owner@premiumprops.com',
    full_name: 'Olivia Wilson',
    role: 'owner',
    is_active: true
  },
  'sarah_manager': {
    id: 45,
    username: 'sarah_manager',
    email: 'sarah@premiumprops.com',
    full_name: 'Sarah Manager',
    role: 'manager',
    is_active: true
  }
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check if user is authenticated on app load
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedUser = localStorage.getItem('mockUser');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          console.log('Mock user loaded from localStorage:', userData);
        }
      } catch (error) {
        console.error('Failed to load stored user:', error);
        localStorage.removeItem('mockUser');
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
      
      console.log('Mock login attempt with:', credentials.username);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check mock users
      const mockUser = mockUsers[credentials.username as keyof typeof mockUsers];
      
      if (!mockUser) {
        throw new Error('Invalid username or password');
      }
      
      // For demo, accept any password for valid usernames
      if (!credentials.password) {
        throw new Error('Password is required');
      }
      
      console.log('Mock login successful for:', mockUser.full_name);
      
      // Store user data
      setUser(mockUser);
      localStorage.setItem('mockUser', JSON.stringify(mockUser));
      localStorage.setItem('userRole', mockUser.role);
      localStorage.setItem('userId', mockUser.id.toString());
      localStorage.setItem('userName', mockUser.full_name);
      localStorage.setItem('userEmail', mockUser.email);
      
      // Navigate based on role
      redirectBasedOnRole(mockUser.role);
      
    } catch (error) {
      console.error('Mock login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please check your credentials.';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      // Clear all user data
      setUser(null);
      setError(null);
      
      // Clear localStorage
      localStorage.removeItem('mockUser');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      
      console.log('Mock logout successful');
      router.push('/login');
    } catch (error) {
      console.error('Mock logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Mock signup successful');
      router.push('/login');
    } catch (error) {
      const errorMessage = 'Signup failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signupLandlord = async (userData: LandlordSignupData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Mock landlord signup successful');
      router.push('/login');
    } catch (error) {
      const errorMessage = 'Landlord registration failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      setError(null);
      
      if (user) {
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
        localStorage.setItem('mockUser', JSON.stringify(updatedUser));
        console.log('Mock profile update successful');
      }
    } catch (error) {
      const errorMessage = 'Profile update failed.';
      setError(errorMessage);
      throw new Error(errorMessage);
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