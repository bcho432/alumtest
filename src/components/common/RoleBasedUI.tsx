'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';

interface RoleBasedUIProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export const RoleBasedUI: React.FC<RoleBasedUIProps> = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  const { isAdmin, isLoading } = useUserRoles();
  
  // If no user is logged in or roles are still loading, don't render the content
  if (!user || isLoading) {
    return null;
  }

  // Check if user has any of the allowed roles
  const hasRequiredRole = allowedRoles.some(role => {
    if (role === 'admin' && isAdmin) return true;
    return false;
  });

  if (!hasRequiredRole) {
    return null;
  }

  return <>{children}</>;
}; 