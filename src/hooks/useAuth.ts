import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Interface to maintain backward compatibility
interface UserData {
  id: string;
  organizationRoles?: {
    admin?: boolean;
    editor?: boolean;
    viewer?: boolean;
  };
  universityAdmins?: string[];
  [key: string]: any;
}

interface User extends SupabaseUser {
  userData?: UserData;
  displayName?: string; // Add displayName property
}

export const useAuth = () => {
  const supabaseAuth = useSupabaseAuth();
  
  // Transform Supabase user to match the old interface
  const user: User | null = supabaseAuth.user ? {
    ...supabaseAuth.user,
    // Add displayName from user profile if available
    displayName: supabaseAuth.userProfile?.display_name || supabaseAuth.user.user_metadata?.full_name || '',
    userData: {
      id: supabaseAuth.user.id,
      organizationRoles: {
        admin: supabaseAuth.isAdmin,
        editor: false, // We'll implement this later
        viewer: false
      },
      universityAdmins: [], // We'll implement this later
    }
  } : null;



  const login = async (email: string, password: string) => {
    const result = await supabaseAuth.signIn({
      email,
      password
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Login failed');
    }
    
    // Don't return user immediately - the auth state will update asynchronously
    return { success: true };
  };

  const signup = async (email: string, password: string) => {
    const result = await supabaseAuth.signUp({
      email,
      password,
      name: email.split('@')[0] // Default name from email
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Signup failed');
    }
    
    // Don't return user immediately - the auth state will update asynchronously
    return { success: true };
  };

  const logout = async () => {
    await supabaseAuth.signOut();
  };

  // Admin role checks
  const isGlobalAdmin = supabaseAuth.isAdmin;
  const isEditor = false; // We'll implement this later
  const isViewer = false; // We'll implement this later

  const isUniversityAdmin = (universityId: string) => {
    // We'll implement university admin roles later
    return false;
  };

  const hasAnyUniversityAdminRole = false; // We'll implement this later

  // isAdmin is true if user is either a global admin or has any university admin role
  const isAdmin = isGlobalAdmin || hasAnyUniversityAdminRole;

  return {
    user,
    loading: supabaseAuth.loading,
    login,
    signup,
    logout,
    isAdmin,
    isGlobalAdmin,
    isEditor,
    isViewer,
    isUniversityAdmin,
    hasAnyUniversityAdminRole
  };
}; 