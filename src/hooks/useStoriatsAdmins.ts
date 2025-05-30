import { useState, useEffect, useCallback } from 'react';
import { collection, doc, getDocs, addDoc, deleteDoc, query, where } from 'firebase/firestore';
import { getFirebaseServices } from '@/lib/firebase';
import { useToast } from '@/components/ui/use-toast';

interface StoriatsAdmin {
  id: string;
  email: string;
  name: string;
  addedBy: string;
  addedAt: Date;
}

// Cache for admins to prevent unnecessary fetches
let cachedAdmins: StoriatsAdmin[] | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useStoriatsAdmins = () => {
  const [admins, setAdmins] = useState<StoriatsAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAdmins = useCallback(async (force = false) => {
    try {
      // Use cache if available and not expired
      const now = Date.now();
      if (!force && cachedAdmins && (now - lastFetchTime) < CACHE_DURATION) {
        console.log('Using cached admins');
        setAdmins(cachedAdmins);
        setLoading(false);
        return;
      }

      const { db } = await getFirebaseServices();
      if (!db) throw new Error('Firestore instance not available');

      console.log('Fetching Storiats admins...');
      const adminsRef = collection(db, 'storiatsAdmins');
      const snapshot = await getDocs(adminsRef);
      const adminList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        addedAt: doc.data().addedAt.toDate()
      })) as StoriatsAdmin[];

      // Update cache
      cachedAdmins = adminList;
      lastFetchTime = now;
      
      setAdmins(adminList);
      console.log('Fetched admins:', adminList.map(a => a.email));
    } catch (error) {
      console.error('Error fetching Storiats admins:', error);
      toast('Failed to fetch Storiats admins', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const addAdmin = async (email: string, name: string, addedBy: string) => {
    try {
      const { db } = await getFirebaseServices();
      if (!db) throw new Error('Firestore instance not available');

      // Check if admin already exists
      const existingAdmin = admins.find(admin => admin.email === email);
      if (existingAdmin) {
        toast('This email is already a Storiats admin', 'error');
        return;
      }

      const adminsRef = collection(db, 'storiatsAdmins');
      const newAdmin = {
        email,
        name,
        addedBy,
        addedAt: new Date()
      };

      await addDoc(adminsRef, newAdmin);
      await fetchAdmins(true); // Force refresh the list

      toast('Storiats admin added successfully', 'success');
    } catch (error) {
      console.error('Error adding Storiats admin:', error);
      toast('Failed to add Storiats admin', 'error');
    }
  };

  const removeAdmin = async (adminId: string) => {
    try {
      const { db } = await getFirebaseServices();
      if (!db) throw new Error('Firestore instance not available');

      await deleteDoc(doc(db, 'storiatsAdmins', adminId));
      await fetchAdmins(true); // Force refresh the list

      toast('Storiats admin removed successfully', 'success');
    } catch (error) {
      console.error('Error removing Storiats admin:', error);
      toast('Failed to remove Storiats admin', 'error');
    }
  };

  const isStoriatsAdmin = useCallback((email: string) => {
    if (!email) {
      console.log('No email provided for admin check');
      return false;
    }
    const normalizedEmail = email.toLowerCase();
    console.log('Checking admin status for:', normalizedEmail);
    console.log('Available admins:', admins.map(a => a.email.toLowerCase()));
    const isAdmin = admins.some(admin => admin.email.toLowerCase() === normalizedEmail);
    console.log('Admin check result:', isAdmin);
    return isAdmin;
  }, [admins]);

  // Initial fetch
  useEffect(() => {
    console.log('Initial fetch of Storiats admins');
    fetchAdmins();
  }, [fetchAdmins]);

  return {
    admins,
    loading,
    addAdmin,
    removeAdmin,
    isStoriatsAdmin,
    refreshAdmins: () => fetchAdmins(true)
  };
}; 