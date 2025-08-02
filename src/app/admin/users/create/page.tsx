'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/use-toast';
import { getDb } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import type { User, UserRole } from '@/types/user';

export default function CreateUserPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userData, setUserData] = useState<Partial<User>>({
    profile: {
      displayName: '',
      email: '',
      phoneNumber: '',
      location: '',
      bio: ''
    },
    settings: {
      emailNotifications: true,
      pushNotifications: true,
      theme: 'system',
      language: 'en'
    },
    isActive: true,
    isBlocked: false,
    organizationRoles: {}
  });
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('viewer');

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    router.push('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const db = await getDb();
      if (!db) throw new Error('Database not initialized');

      const newUser = {
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'users'), newUser);
      toast('User created successfully', 'success');
      router.push('/admin/users');
    } catch (error) {
      console.error('Error creating user:', error);
      toast('Failed to create user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        [name]: value
      }
    }));
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setUserData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [name]: checked
      }
    }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleAddRole = () => {
    if (!selectedOrgId) return;

    setUserData(prev => ({
      ...prev,
      organizationRoles: {
        ...prev.organizationRoles,
        [selectedOrgId]: selectedRole
      }
    }));

    setSelectedOrgId('');
    setSelectedRole('viewer');
  };

  const handleRemoveRole = (orgId: string) => {
    const { [orgId]: removed, ...remainingRoles } = userData.organizationRoles || {};
    setUserData(prev => ({
      ...prev,
      organizationRoles: remainingRoles
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create User</h1>
        <p className="text-gray-600">Add a new user to the system</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Profile Information</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                name="displayName"
                value={userData.profile?.displayName || ''}
                onChange={handleProfileChange}
                placeholder="Enter display name"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={userData.profile?.email || ''}
                onChange={handleProfileChange}
                required
                placeholder="Enter email"
              />
            </div>

            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={userData.profile?.phoneNumber || ''}
                onChange={handleProfileChange}
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={userData.profile?.location || ''}
                onChange={handleProfileChange}
                placeholder="Enter location"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={userData.profile?.bio || ''}
                onChange={handleProfileChange}
                placeholder="Enter bio"
                rows={4}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Account Status</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={userData.isActive}
                onChange={handleStatusChange}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isActive">Active Account</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isBlocked"
                name="isBlocked"
                checked={userData.isBlocked}
                onChange={handleStatusChange}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isBlocked">Blocked Account</Label>
            </div>

            {userData.isBlocked && (
              <div>
                <Label htmlFor="blockedReason">Block Reason</Label>
                <Input
                  id="blockedReason"
                  name="blockedReason"
                  value={userData.blockedReason || ''}
                  onChange={e =>
                    setUserData(prev => ({
                      ...prev,
                      blockedReason: e.target.value
                    }))
                  }
                  placeholder="Enter reason for blocking"
                />
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Organization Roles</h2>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="orgId">Organization ID</Label>
                <Input
                  id="orgId"
                  value={selectedOrgId}
                  onChange={e => setSelectedOrgId(e.target.value)}
                  placeholder="Enter organization ID"
                />
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  id="role"
                  value={selectedRole}
                  onChange={value => setSelectedRole(value as UserRole)}
                  options={[
                    { value: 'admin', label: 'Admin' },
                    { value: 'editor', label: 'Editor' },
                    { value: 'viewer', label: 'Viewer' }
                  ]}
                />
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={handleAddRole}
                  disabled={!selectedOrgId}
                >
                  Add Role
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {Object.entries(userData.organizationRoles || {}).map(([orgId, role]) => (
                <div
                  key={orgId}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <span className="font-medium">{orgId}</span>
                    <span className="ml-2 text-sm text-gray-500">({role})</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveRole(orgId)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="emailNotifications"
                name="emailNotifications"
                checked={userData.settings?.emailNotifications}
                onChange={handleSettingsChange}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="emailNotifications">Email Notifications</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="pushNotifications"
                name="pushNotifications"
                checked={userData.settings?.pushNotifications}
                onChange={handleSettingsChange}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="pushNotifications">Push Notifications</Label>
            </div>

            <div>
              <Label htmlFor="theme">Theme</Label>
              <Select
                id="theme"
                value={userData.settings?.theme || 'system'}
                onChange={value =>
                  setUserData(prev => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      theme: value as 'light' | 'dark' | 'system'
                    }
                  }))
                }
                options={[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'system', label: 'System' }
                ]}
              />
            </div>

            <div>
              <Label htmlFor="language">Language</Label>
              <Select
                id="language"
                value={userData.settings?.language || 'en'}
                onChange={value =>
                  setUserData(prev => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      language: value
                    }
                  }))
                }
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Spanish' },
                  { value: 'fr', label: 'French' },
                  { value: 'de', label: 'German' }
                ]}
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/users')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
            Create User
          </Button>
        </div>
      </form>
    </div>
  );
} 