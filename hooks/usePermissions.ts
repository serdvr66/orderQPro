// hooks/usePermissions.ts
import { useAuth } from '../context/AuthContext';

export const usePermissions = () => {
  const { user } = useAuth();
  
  /**
   * Prüft ob User eine bestimmte Permission hat
   */
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Super-Admin hat ALLES
    if (user.roles?.includes('super-admin')) return true;
    
    // Prüfe Permission
    return user.permissions?.includes(permission) || false;
  };
  
  /**
   * Prüft ob User eine bestimmte Rolle hat
   */
  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.roles?.includes(role) || false;
  };
  
  /**
   * Prüft ob User MINDESTENS EINE der Permissions hat
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    if (user.roles?.includes('super-admin')) return true;
    
    return permissions.some(permission => 
      user.permissions?.includes(permission)
    );
  };
  
  /**
   * Prüft ob User ALLE Permissions hat
   */
  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user) return false;
    if (user.roles?.includes('super-admin')) return true;
    
    return permissions.every(permission =>
      user.permissions?.includes(permission)
    );
  };
  
  return {
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions
  };
};