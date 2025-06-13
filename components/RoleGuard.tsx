import React from 'react';
import { useAuth } from '../lib/auth-context';

interface RoleGuardProps {
  roles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean; // If true, user must have ALL roles, if false, user needs ANY role
}

const RoleGuard: React.FC<RoleGuardProps> = ({ 
  roles, 
  children, 
  fallback = null, 
  requireAll = false 
}) => {
  const { user } = useAuth();
  
  if (!user) {
    return <>{fallback}</>;
  }
  
  const hasAccess = requireAll 
    ? roles.every(role => user.role === role) // User must have all roles (unlikely scenario)
    : roles.includes(user.role); // User must have at least one of the roles
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

export default RoleGuard; 
 
 
 
 