import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { getFirebaseServices } from '@/lib/firebase';
import { Card } from './Card';
import { Switch } from './Switch';
import { Input } from './Input';
import { useToast } from './toast';

interface UniversitySettings {
  allowPublicProfiles: boolean;
  requireApproval: boolean;
  allowComments: boolean;
  allowSharing: boolean;
  allowMemorials: boolean;
  allowDonations: boolean;
  maxProfilesPerUser: number;
  maxMemorialsPerUser: number;
  notificationEmail: string;
  customDomain?: string;
}

interface SettingsProps {
  universityId: string;
  initialSettings: UniversitySettings;
  onUpdate: () => void;
}

export function Settings({ universityId, initialSettings, onUpdate }: SettingsProps) {
  const [settings, setSettings] = useState<UniversitySettings>(initialSettings);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleToggle = async (key: keyof UniversitySettings) => {
    if (loading) return;
    
    try {
      setLoading(true);
      const { db } = await getFirebaseServices();
      if (!db) {
        throw new Error('Database is not initialized');
      }

      const newValue = !settings[key];
      const universityRef = doc(db, 'universities', universityId);
      await updateDoc(universityRef, {
        [`settings.${key}`]: newValue
      });

      setSettings(prev => ({
        ...prev,
        [key]: newValue
      }));

      toast({
        title: 'Settings updated',
        description: 'University settings have been updated successfully.',
        variant: 'success'
      });

      onUpdate();
    } catch (err) {
      console.error('Error updating settings:', err);
      toast({
        title: 'Error',
        description: 'Failed to update settings. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNumberChange = async (key: keyof UniversitySettings, value: string) => {
    if (loading) return;
    
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) return;

    try {
      setLoading(true);
      const { db } = await getFirebaseServices();
      if (!db) {
        throw new Error('Database is not initialized');
      }

      const universityRef = doc(db, 'universities', universityId);
      await updateDoc(universityRef, {
        [`settings.${key}`]: numValue
      });

      setSettings(prev => ({
        ...prev,
        [key]: numValue
      }));

      toast({
        title: 'Settings updated',
        description: 'University settings have been updated successfully.',
        variant: 'success'
      });

      onUpdate();
    } catch (err) {
      console.error('Error updating settings:', err);
      toast({
        title: 'Error',
        description: 'Failed to update settings. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = async (value: string) => {
    if (loading) return;
    
    try {
      setLoading(true);
      const { db } = await getFirebaseServices();
      if (!db) {
        throw new Error('Database is not initialized');
      }

      const universityRef = doc(db, 'universities', universityId);
      await updateDoc(universityRef, {
        'settings.notificationEmail': value
      });

      setSettings(prev => ({
        ...prev,
        notificationEmail: value
      }));

      toast({
        title: 'Settings updated',
        description: 'Notification email has been updated successfully.',
        variant: 'success'
      });

      onUpdate();
    } catch (err) {
      console.error('Error updating notification email:', err);
      toast({
        title: 'Error',
        description: 'Failed to update notification email. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Profile Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Allow Public Profiles
                </label>
                <p className="text-sm text-gray-500">
                  Allow profiles to be visible to the public
                </p>
              </div>
              <Switch
                checked={settings.allowPublicProfiles}
                onChange={() => handleToggle('allowPublicProfiles')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Require Approval
                </label>
                <p className="text-sm text-gray-500">
                  Require admin approval for new profiles
                </p>
              </div>
              <Switch
                checked={settings.requireApproval}
                onChange={() => handleToggle('requireApproval')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Allow Comments
                </label>
                <p className="text-sm text-gray-500">
                  Allow users to comment on profiles
                </p>
              </div>
              <Switch
                checked={settings.allowComments}
                onChange={() => handleToggle('allowComments')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Allow Sharing
                </label>
                <p className="text-sm text-gray-500">
                  Allow users to share profiles
                </p>
              </div>
              <Switch
                checked={settings.allowSharing}
                onChange={() => handleToggle('allowSharing')}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Memorial Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Allow Memorials
                </label>
                <p className="text-sm text-gray-500">
                  Allow users to create memorials
                </p>
              </div>
              <Switch
                checked={settings.allowMemorials}
                onChange={() => handleToggle('allowMemorials')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Allow Donations
                </label>
                <p className="text-sm text-gray-500">
                  Allow donations to memorials
                </p>
              </div>
              <Switch
                checked={settings.allowDonations}
                onChange={() => handleToggle('allowDonations')}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Limits</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Max Profiles Per User
              </label>
              <Input
                type="number"
                value={settings.maxProfilesPerUser}
                onChange={(e) => handleNumberChange('maxProfilesPerUser', e.target.value)}
                className="mt-1 w-32"
                min="0"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Max Memorials Per User
              </label>
              <Input
                type="number"
                value={settings.maxMemorialsPerUser}
                onChange={(e) => handleNumberChange('maxMemorialsPerUser', e.target.value)}
                className="mt-1 w-32"
                min="0"
                disabled={loading}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Notifications</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Notification Email
              </label>
              <Input
                type="email"
                value={settings.notificationEmail}
                onChange={(e) => handleEmailChange(e.target.value)}
                className="mt-1"
                placeholder="notifications@university.edu"
                disabled={loading}
              />
              <p className="mt-1 text-sm text-gray-500">
                Email address for receiving notifications
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 