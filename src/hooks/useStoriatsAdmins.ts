import { useState, useLayoutEffect, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { getFirebaseServices } from '@/lib/firebase';
import { useToast } from '@/components/ui/use-toast';

interface StoriatsAdmin {
  id: string;
  email: string;
  name: string;
  addedBy: string;
  addedAt: Date;
  isEmailRecipient: boolean;
}

interface AdminSettings {
  adminEmails: string[];
  emailRecipients: string[];
  lastUpdated: Date;
  updatedBy: string;
}

interface FirestoreAdminSettings {
  adminEmails: string[];
  emailRecipients: string[];
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
  const fetchCount = useRef(0);

  const fetchSettings = useCallback(async (force = false) => {
    const fetchId = ++fetchCount.current;
    console.log(`[Fetch ${fetchId}] Starting fetch, force: ${force}, inProgress: ${fetchInProgress.current}`);

    // Prevent multiple simultaneous fetches
    if (fetchInProgress.current) {
      console.log(`[Fetch ${fetchId}] Fetch already in progress, returning cached settings`);
      return cachedSettings;
    }

    let retries = 0;
    fetchInProgress.current = true;
    
    try {
      // Use cache if available and not expired
      const now = Date.now();
      if (!force && cachedSettings && (now - lastFetchTime) < CACHE_DURATION) {
        console.log(`[Fetch ${fetchId}] Using cached settings, age: ${(now - lastFetchTime) / 1000}s`);
        setSettings(cachedSettings);
        setLoading(false);
        setError(null);
        return cachedSettings;
      }

      setLoading(true);
      console.log(`[Fetch ${fetchId}] Getting Firebase services`);
      const { db } = await getFirebaseServices();
      if (!db) throw new Error('Firestore instance not available');

      console.log(`[Fetch ${fetchId}] Fetching from Firestore`);
      const settingsRef = doc(db, 'adminSettings', 'storiatsAdmins');
      const docSnap = await getDoc(settingsRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as FirestoreAdminSettings;
        const settings: AdminSettings = {
          ...data,
          adminEmails: data.adminEmails.map(e => e.toLowerCase()),
          emailRecipients: data.emailRecipients?.map(e => e.toLowerCase()) || [],
          lastUpdated: data.lastUpdated.toDate()
        };
        
        // Update cache
        cachedSettings = settings;
        lastFetchTime = now;
        
        console.log(`[Fetch ${fetchId}] Successfully fetched settings:`, {
          adminCount: settings.adminEmails.length,
          recipientCount: settings.emailRecipients.length,
          lastUpdated: settings.lastUpdated,
          updatedBy: settings.updatedBy
        });
        
        setSettings(settings);
        setError(null);
        setLoading(false);
        return settings;
      } else {
        console.log(`[Fetch ${fetchId}] No settings found, initializing defaults`);
        // Initialize with default settings if document doesn't exist
        const defaultSettings: AdminSettings = {
          adminEmails: [],
          emailRecipients: [],
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
      console.error(`[Fetch ${fetchId}] Error fetching admin settings (attempt ${retries + 1}/${MAX_RETRIES}):`, error);
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
        // Retry the fetch
        return fetchSettings(force);
      }
    } finally {
      console.log(`[Fetch ${fetchId}] Fetch completed, resetting inProgress flag`);
      fetchInProgress.current = false;
    }
  }, [toast]);

  // Add useLayoutEffect to fetch settings on mount
  useLayoutEffect(() => {
    console.log('[useStoriatsAdmins] Initializing settings fetch');
    fetchSettings().catch(error => {
      console.error('[useStoriatsAdmins] Error during initial fetch:', error);
      setError(error);
      setLoading(false);
    });
  }, [fetchSettings]);

  const addAdmin = async (email: string, name: string, addedBy: string) => {
    try {
      setLoading(true);
      if (!settings) {
        console.log('Settings not loaded, fetching...');
        await fetchSettings(true);
      }

      const { db } = await getFirebaseServices();
      if (!db) throw new Error('Firestore instance not available');

      const emailLower = email.toLowerCase();
      
      if (settings?.adminEmails.includes(emailLower)) {
        toast('This email is already a Storiats admin', 'error');
        return;
      }

      const settingsRef = doc(db, 'adminSettings', 'storiatsAdmins');
      const newEmails = [...(settings?.adminEmails || []), emailLower];
      
      await setDoc(settingsRef, {
        adminEmails: newEmails,
        emailRecipients: settings?.emailRecipients || [],
        lastUpdated: Timestamp.now(),
        updatedBy: addedBy
      });

      cachedSettings = null;
      lastFetchTime = 0;
      
      await fetchSettings(true);
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
      setLoading(true);
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

      if (settings.adminEmails.length <= 1) {
        toast('Cannot remove the last admin', 'error');
        return;
      }

      const settingsRef = doc(db, 'adminSettings', 'storiatsAdmins');
      const newEmails = settings.adminEmails.filter(e => e !== emailLower);
      const newRecipients = settings.emailRecipients.filter(e => e !== emailLower);
      
      await setDoc(settingsRef, {
        adminEmails: newEmails,
        emailRecipients: newRecipients,
        lastUpdated: Timestamp.now(),
        updatedBy
      });

      cachedSettings = null;
      lastFetchTime = 0;
      
      await fetchSettings(true);
      toast('Storiats admin removed successfully', 'success');
    } catch (error) {
      console.error('Error removing Storiats admin:', error);
      toast('Failed to remove Storiats admin', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const toggleEmailRecipient = async (email: string, updatedBy: string) => {
    try {
      setLoading(true);
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

      const settingsRef = doc(db, 'adminSettings', 'storiatsAdmins');
      const isCurrentlyRecipient = settings.emailRecipients.includes(emailLower);
      const newRecipients = isCurrentlyRecipient
        ? settings.emailRecipients.filter(e => e !== emailLower)
        : [...settings.emailRecipients, emailLower];
      
      await setDoc(settingsRef, {
        adminEmails: settings.adminEmails,
        emailRecipients: newRecipients,
        lastUpdated: Timestamp.now(),
        updatedBy
      });

      cachedSettings = null;
      lastFetchTime = 0;
      
      await fetchSettings(true);
      toast(
        isCurrentlyRecipient
          ? 'Admin removed from email recipients'
          : 'Admin added to email recipients',
        'success'
      );
    } catch (error) {
      console.error('Error updating email recipient status:', error);
      toast('Failed to update email recipient status', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const isStoriatsAdmin = useCallback((email: string) => {
    return settings?.adminEmails.includes(email.toLowerCase()) || false;
  }, [settings]);

  const isEmailRecipient = useCallback((email: string) => {
    return settings?.emailRecipients.includes(email.toLowerCase()) || false;
  }, [settings]);

  return {
    settings,
    loading,
    error,
    addAdmin,
    removeAdmin,
    toggleEmailRecipient,
    isStoriatsAdmin,
    isEmailRecipient,
    refreshSettings: () => fetchSettings(true)
  };
}; 