import { useState, useLayoutEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

interface StoriatsAdmin {
  id: string;
  email: string;
  name: string;
  added_by: string;
  added_at: string;
  is_email_recipient: boolean;
}

interface AdminSettings {
  admin_emails: string[];
  email_recipients: string[];
  last_updated: string;
  updated_by: string;
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

    // Prevent multiple simultaneous fetches
    if (fetchInProgress.current) {
      return cachedSettings;
    }

    let retries = 0;
    fetchInProgress.current = true;
    
    try {
      // Use cache if available and not expired
      const now = Date.now();
      if (!force && cachedSettings && (now - lastFetchTime) < CACHE_DURATION) {
        setSettings(cachedSettings);
        setLoading(false);
        setError(null);
        return cachedSettings;
      }

      setLoading(true);
      
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('id', 'storiats_admins')
        .single();
      
      if (error) throw error;
      
      if (data) {
        const settings: AdminSettings = {
          ...data,
          admin_emails: data.admin_emails?.map((e: string) => e.toLowerCase()) || [],
          email_recipients: data.email_recipients?.map((e: string) => e.toLowerCase()) || [],
          last_updated: data.last_updated,
          updated_by: data.updated_by
        };
        
        // Update cache
        cachedSettings = settings;
        lastFetchTime = now;
        
        setSettings(settings);
        setError(null);
        setLoading(false);
        return settings;
      } else {
        // Create default settings if none exist
        const defaultSettings: AdminSettings = {
          admin_emails: [],
          email_recipients: [],
          last_updated: new Date().toISOString(),
          updated_by: 'system'
        };
        
        const { error: insertError } = await supabase
          .from('admin_settings')
          .insert([{
            id: 'storiats_admins',
            ...defaultSettings
          }]);
        
        if (insertError) throw insertError;
        
        cachedSettings = defaultSettings;
        lastFetchTime = now;
        
        setSettings(defaultSettings);
        setError(null);
        setLoading(false);
        return defaultSettings;
      }
    } catch (error) {
      console.error(`[Fetch ${fetchId}] Error fetching admin settings (attempt ${retries + 1}/${MAX_RETRIES}):`, error);
      
      if (retries < MAX_RETRIES) {
        retries++;
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retries));
        return fetchSettings(force);
      }
      
      setError(error as Error);
      setLoading(false);
      toast({
        title: 'Error',
        description: 'Failed to fetch admin settings',
        variant: 'destructive'
      });
      return null;
    } finally {
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

      const emailLower = email.toLowerCase();
      
      if (settings?.admin_emails.includes(emailLower)) {
        toast({
          title: 'Error',
          description: 'This email is already a Storiats admin',
          variant: 'destructive'
        });
        return;
      }

      const { error } = await supabase
        .from('admin_settings')
        .update({
          admin_emails: [...(settings?.admin_emails || []), emailLower],
          email_recipients: settings?.email_recipients || [],
          last_updated: new Date().toISOString(),
          updated_by: addedBy
        })
        .eq('id', 'storiats_admins');

      if (error) throw error;

      cachedSettings = null;
      lastFetchTime = 0;
      
      await fetchSettings(true);
      toast({
        title: 'Success',
        description: 'Storiats admin added successfully'
      });
    } catch (error) {
      console.error('Error adding Storiats admin:', error);
      toast({
        title: 'Error',
        description: 'Failed to add Storiats admin',
        variant: 'destructive'
      });
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

      const emailLower = email.toLowerCase();
      if (!settings?.admin_emails.includes(emailLower)) {
        toast({
          title: 'Error',
          description: 'Email not in admin list',
          variant: 'destructive'
        });
        return;
      }

      if (settings.admin_emails.length <= 1) {
        toast({
          title: 'Error',
          description: 'Cannot remove the last admin',
          variant: 'destructive'
        });
        return;
      }

      const { error } = await supabase
        .from('admin_settings')
        .update({
          admin_emails: settings.admin_emails.filter(e => e !== emailLower),
          email_recipients: settings.email_recipients.filter(e => e !== emailLower),
          last_updated: new Date().toISOString(),
          updated_by: updatedBy
        })
        .eq('id', 'storiats_admins');

      if (error) throw error;

      cachedSettings = null;
      lastFetchTime = 0;
      
      await fetchSettings(true);
      toast({
        title: 'Success',
        description: 'Storiats admin removed successfully'
      });
    } catch (error) {
      console.error('Error removing Storiats admin:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove Storiats admin',
        variant: 'destructive'
      });
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

      const emailLower = email.toLowerCase();
      if (!settings?.admin_emails.includes(emailLower)) {
        toast({
          title: 'Error',
          description: 'Email not in admin list',
          variant: 'destructive'
        });
        return;
      }

      const isCurrentlyRecipient = settings.email_recipients.includes(emailLower);
      const { error } = await supabase
        .from('admin_settings')
        .update({
          admin_emails: settings.admin_emails,
          email_recipients: isCurrentlyRecipient
            ? settings.email_recipients.filter(e => e !== emailLower)
            : [...settings.email_recipients, emailLower],
          last_updated: new Date().toISOString(),
          updated_by: updatedBy
        })
        .eq('id', 'storiats_admins');

      if (error) throw error;

      cachedSettings = null;
      lastFetchTime = 0;
      
      await fetchSettings(true);
      toast({
        title: 'Success',
        description: `Email recipient ${isCurrentlyRecipient ? 'removed' : 'added'} successfully`
      });
    } catch (error) {
      console.error('Error toggling email recipient:', error);
      toast({
        title: 'Error',
        description: 'Failed to update email recipient status',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const isStoriatsAdmin = useCallback((email: string) => {
    return settings?.admin_emails.includes(email.toLowerCase()) || false;
  }, [settings]);

  const isEmailRecipient = useCallback((email: string) => {
    return settings?.email_recipients.includes(email.toLowerCase()) || false;
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