import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getFirebaseServices } from '@/lib/firebase';

export interface Announcement {
  enabled: boolean;
  text: string;
}

export interface Branding {
  siteName: string;
  logoUrl: string;
}

export interface FeatureToggles {
  betaFeatures: boolean;
  chatSupport: boolean;
}

export interface SiteSettings {
  announcement: Announcement;
  supportEmail: string;
  defaultUserRole: 'viewer' | 'editor' | 'admin';
  maintenanceMode: boolean;
  branding: Branding;
  contactPhone: string;
  googleAnalyticsId: string;
  featureToggles: FeatureToggles;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { db } = await getFirebaseServices();
      const ref = doc(db, 'site_settings', 'global');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setSettings(snap.data() as SiteSettings);
      } else {
        // Initialize with defaults if not present
        const defaultSettings: SiteSettings = {
          announcement: { enabled: false, text: '' },
          supportEmail: '',
          defaultUserRole: 'viewer',
          maintenanceMode: false,
          branding: { siteName: 'Storiats', logoUrl: '' },
          contactPhone: '',
          googleAnalyticsId: '',
          featureToggles: { betaFeatures: false, chatSupport: false },
        };
        await setDoc(ref, defaultSettings);
        setSettings(defaultSettings);
      }
    } catch (err) {
      setError('Failed to load site settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (updates: Partial<SiteSettings>) => {
    setSaving(true);
    setError(null);
    try {
      const { db } = await getFirebaseServices();
      const ref = doc(db, 'site_settings', 'global');
      await updateDoc(ref, updates);
      setSettings(prev => prev ? { ...prev, ...updates } : prev);
    } catch (err) {
      setError('Failed to update site settings');
    } finally {
      setSaving(false);
    }
  };

  // Individual update helpers
  const setAnnouncement = (announcement: Announcement) => updateSettings({ announcement });
  const setSupportEmail = (supportEmail: string) => updateSettings({ supportEmail });
  const setDefaultUserRole = (defaultUserRole: 'viewer' | 'editor' | 'admin') => updateSettings({ defaultUserRole });
  const setMaintenanceMode = (maintenanceMode: boolean) => updateSettings({ maintenanceMode });
  const setBranding = (branding: Branding) => updateSettings({ branding });
  const setContactPhone = (contactPhone: string) => updateSettings({ contactPhone });
  const setGoogleAnalyticsId = (googleAnalyticsId: string) => updateSettings({ googleAnalyticsId });
  const setFeatureToggles = (featureToggles: FeatureToggles) => updateSettings({ featureToggles });

  return {
    settings,
    loading,
    error,
    saving,
    refetch: fetchSettings,
    setAnnouncement,
    setSupportEmail,
    setDefaultUserRole,
    setMaintenanceMode,
    setBranding,
    setContactPhone,
    setGoogleAnalyticsId,
    setFeatureToggles,
  };
} 