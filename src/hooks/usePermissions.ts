import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

export const usePermissions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const isAdmin = useCallback(async (orgId?: string) => {
    if (!user) return false;

    try {
      setIsLoading(true);
      const dbInstance = await getDb();
      const userDoc = await getDoc(doc(dbInstance, 'users', user.id));
      const userData = userDoc.data();

      if (!userData) return false;

      // Check if user is a global admin
      if (userData.isAdmin) return true;

      // If orgId is provided, check if user is an admin for that organization
      if (orgId) {
        const orgDoc = await getDoc(doc(dbInstance, 'organizations', orgId));
        const orgData = orgDoc.data();
        return orgData?.admins?.includes(user.id) || false;
      }

      return false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const isEditor = useCallback(async (orgId: string, profileId: string) => {
    if (!user) return false;

    try {
      setIsLoading(true);
      const dbInstance = await getDb();
      const profileDoc = await getDoc(doc(dbInstance, 'profiles', profileId));
      const profileData = profileDoc.data();

      if (!profileData) return false;

      // Check if user is an admin (admins can edit any profile)
      const adminStatus = await isAdmin(orgId);
      if (adminStatus) return true;

      // Check if user is in the editors list
      return profileData.editors?.includes(user.id) || false;
    } catch (error) {
      console.error('Error checking editor status:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, isAdmin]);

  const canPublish = useCallback(async (orgId: string) => {
    if (!user) return false;
    return isAdmin(orgId);
  }, [user, isAdmin]);

  return {
    isAdmin,
    isEditor,
    canPublish,
    isLoading,
  };
}; 