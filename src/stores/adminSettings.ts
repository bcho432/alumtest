import { create } from 'zustand';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

interface AdminSettings {
  adminEmails: string[];
  lastUpdated: Date;
  updatedBy: string;
}

interface AdminSettingsStore {
  settings: AdminSettings | null;
  loading: boolean;
  error: Error | null;
  isStoriatsAdmin: (email: string) => boolean;
  addAdminEmail: (email: string, updatedBy: string) => Promise<void>;
  removeAdminEmail: (email: string, updatedBy: string) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

export const useAdminSettings = create<AdminSettingsStore>((set, get) => ({
  settings: null,
  loading: true,
  error: null,

  isStoriatsAdmin: (email: string) => {
    const { settings } = get();
    return settings?.adminEmails.includes(email.toLowerCase()) ?? false;
  },

  addAdminEmail: async (email: string, updatedBy: string) => {
    try {
      const { settings } = get();
      if (!settings) throw new Error('Settings not loaded');
      
      const emailLower = email.toLowerCase();
      if (settings.adminEmails.includes(emailLower)) {
        throw new Error('Email already in admin list');
      }

      const db = await getDb();
      const newEmails = [...settings.adminEmails, emailLower];
      
      await setDoc(doc(db, 'adminSettings', 'storiatsAdmins'), {
        adminEmails: newEmails,
        lastUpdated: new Date(),
        updatedBy
      });
    } catch (error) {
      console.error('Error adding admin email:', error);
      throw error;
    }
  },

  removeAdminEmail: async (email: string, updatedBy: string) => {
    try {
      const { settings } = get();
      if (!settings) throw new Error('Settings not loaded');
      
      const emailLower = email.toLowerCase();
      if (!settings.adminEmails.includes(emailLower)) {
        throw new Error('Email not in admin list');
      }

      const db = await getDb();
      const newEmails = settings.adminEmails.filter(e => e !== emailLower);
      
      await setDoc(doc(db, 'adminSettings', 'storiatsAdmins'), {
        adminEmails: newEmails,
        lastUpdated: new Date(),
        updatedBy
      });
    } catch (error) {
      console.error('Error removing admin email:', error);
      throw error;
    }
  },

  refreshSettings: async () => {
    try {
      set({ loading: true, error: null });
      const db = await getDb();
      const docRef = doc(db, 'adminSettings', 'storiatsAdmins');
      
      // Set up real-time listener
      const unsubscribe = onSnapshot(docRef, 
        (doc) => {
          if (doc.exists()) {
            set({ 
              settings: {
                ...doc.data() as AdminSettings,
                lastUpdated: doc.data().lastUpdated.toDate()
              },
              loading: false 
            });
          } else {
            // Initialize with default settings if document doesn't exist
            const defaultSettings: AdminSettings = {
              adminEmails: [],
              lastUpdated: new Date(),
              updatedBy: 'system'
            };
            setDoc(docRef, defaultSettings);
            set({ settings: defaultSettings, loading: false });
          }
        },
        (error) => {
          console.error('Error fetching admin settings:', error);
          set({ error, loading: false });
        }
      );
    } catch (error) {
      console.error('Error in refreshSettings:', error);
      set({ error: error as Error, loading: false });
    }
  }
})); 