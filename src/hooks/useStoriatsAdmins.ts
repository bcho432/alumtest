import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { getFirebaseServices } from '@/lib/firebase';
import { useToast } from '@/components/ui/use-toast';

interface StoriatsAdmin {
  id: string;
  email: string;
  name: string;
  addedBy: string;
  addedAt: Date;
}

interface AdminSettings {
  adminEmails: string[];
  lastUpdated: Date;
  updatedBy: string;
}

interface FirestoreAdminSettings {
  adminEmails: string[];
  lastUpdated: Timestamp;
  updatedBy: string;
}

// Cache for admins to prevent unnecessary fetches
let cachedSettings: AdminSettings | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export const useStoriatsAdmins = () => {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const fetchInProgress = useRef(false);

  const fetchSettings = useCallback(async (force = false) => {
    // Prevent multiple simultaneous fetches
    if (fetchInProgress.current) {
      console.log('Fetch already in progress, skipping...');
      return cachedSettings;
    }

    let retries = 0;
    fetchInProgress.current = true;
    
    try {
      // Use cache if available and not expired
      const now = Date.now();
      if (!force && cachedSettings && (now - lastFetchTime) < CACHE_DURATION) {
        console.log('Using cached admin settings:', cachedSettings);
        setSettings(cachedSettings);
        setLoading(false);
        setError(null);
        return cachedSettings;
      }

      setLoading(true);
      const { db } = await getFirebaseServices();
      if (!db) throw new Error('Firestore instance not available');

      console.log('Fetching admin settings...');
      const settingsRef = doc(db, 'adminSettings', 'storiatsAdmins');
      const docSnap = await getDoc(settingsRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as FirestoreAdminSettings;
        const settings: AdminSettings = {
          ...data,
          lastUpdated: data.lastUpdated.toDate()
        };
        
        // Update cache
        cachedSettings = settings;
        lastFetchTime = now;
        
        setSettings(settings);
        setError(null);
        console.log('Fetched admin settings:', settings);
        setLoading(false);
        return settings;
      } else {
        console.log('No admin settings found, initializing with defaults');
        // Initialize with default settings if document doesn't exist
        const defaultSettings: AdminSettings = {
          adminEmails: [],
          lastUpdated: new Date(),
          updatedBy: 'system'
        };
        await setDoc(settingsRef, {
          ...defaultSettings,
          lastUpdated: Timestamp.fromDate(defaultSettings.lastUpdated)
        });
        setSettings(defaultSettings);
        cachedSettings = defaultSettings;
        lastFetchTime = now;
        setError(null);
        setLoading(false);
        return defaultSettings;
      }
    } catch (error) {
      console.error(`Error fetching admin settings (attempt ${retries + 1}/${MAX_RETRIES}):`, error);
      retries++;
      
      if (retries === MAX_RETRIES) {
        const error = new Error('Failed to fetch admin settings');
        setError(error);
        setLoading(false);
        toast('Failed to fetch admin settings', 'error');
        throw error;
      } else {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    } finally {
      fetchInProgress.current = false;
    }
  }, [toast]);

  const addAdmin = async (email: string, name: string, addedBy: string) => {
    try {
      setLoading(true); // Set loading state before operation
      // Ensure settings are loaded
      if (!settings) {
        console.log('Settings not loaded, fetching...');
        await fetchSettings(true);
      }

      const { db } = await getFirebaseServices();
      if (!db) throw new Error('Firestore instance not available');

      const emailLower = email.toLowerCase();
      
      // Check if admin already exists
      if (settings?.adminEmails.includes(emailLower)) {
        toast('This email is already a Storiats admin', 'error');
        return;
      }

      const settingsRef = doc(db, 'adminSettings', 'storiatsAdmins');
      const newEmails = [...(settings?.adminEmails || []), emailLower];
      
      await setDoc(settingsRef, {
        adminEmails: newEmails,
        lastUpdated: Timestamp.now(),
        updatedBy: addedBy
      });

      // Invalidate cache
      cachedSettings = null;
      lastFetchTime = 0;
      
      await fetchSettings(true); // Force refresh
      toast('Storiats admin added successfully', 'success');
    } catch (error) {
      console.error('Error adding Storiats admin:', error);
      toast('Failed to add Storiats admin', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeAdmin = async (email: string, updatedBy: string) => {
    try {
      setLoading(true); // Set loading state before operation
      // Ensure settings are loaded
      if (!settings) {
        console.log('Settings not loaded, fetching...');
        await fetchSettings(true);
      }

      const { db } = await getFirebaseServices();
      if (!db) throw new Error('Firestore instance not available');

      const emailLower = email.toLowerCase();
      if (!settings?.adminEmails.includes(emailLower)) {
        toast('Email not in admin list', 'error');
        return;
      }

      // Prevent removing the last admin
      if (settings.adminEmails.length <= 1) {
        toast('Cannot remove the last admin', 'error');
        return;
      }

      const settingsRef = doc(db, 'adminSettings', 'storiatsAdmins');
      const newEmails = settings.adminEmails.filter(e => e !== emailLower);
      
      await setDoc(settingsRef, {
        adminEmails: newEmails,
        lastUpdated: Timestamp.now(),
        updatedBy
      });

      // Invalidate cache
      cachedSettings = null;
      lastFetchTime = 0;
      
      await fetchSettings(true); // Force refresh
      toast('Storiats admin removed successfully', 'success');
    } catch (error) {
      console.error('Error removing Storiats admin:', error);
      toast('Failed to remove Storiats admin', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const isStoriatsAdmin = useCallback((email: string) => {
    if (!email || !settings) return false;
    return settings.adminEmails.includes(email.toLowerCase());
  }, [settings]);

  // Initial fetch
  useEffect(() => {
    console.log('Initial fetch of admin settings');
    fetchSettings().catch(error => {
      console.error('Failed to fetch initial admin settings:', error);
    });
  }, [fetchSettings]);

  // Transform settings into the expected format for the admin management page
  const admins = settings?.adminEmails.map(email => ({
    id: email,
    email,
    name: email.split('@')[0], // Use part before @ as name
    addedBy: settings.updatedBy,
    addedAt: settings.lastUpdated
  })) || [];

  return {
    settings,
    admins,
    loading,
    error,
    addAdmin,
    removeAdmin,
    isStoriatsAdmin,
    refreshSettings: () => fetchSettings(true)
  };
}; 