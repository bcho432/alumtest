import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDb } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export function useUserRoles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchRoles() {
      if (!user) {
        setRoles({});
        setLoading(false);
        return;
      }

      try {
        const db = await getDb();
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setRoles(userData.orgRoles || {});
        } else {
          setRoles({});
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch user roles'));
      } finally {
        setLoading(false);
      }
    }

    fetchRoles();
  }, [user]);

  // Compute isAdmin: true if any role is 'admin'
  const isAdmin = Object.values(roles).includes('admin');
  const isLoading = loading;

  // Compute universityAdminFor: list of universities where the user is an admin
  const universityAdminFor = Object.entries(roles)
    .filter(([_, role]) => role === 'admin')
    .map(([id]) => ({ id }));

  return { roles, loading, error, isAdmin, isLoading, universityAdminFor };
} 