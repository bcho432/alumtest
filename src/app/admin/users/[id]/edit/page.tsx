'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useDebounce } from '@/hooks/useDebounce';
import { sanitizeString, validateRequiredFields } from '@/utils/security';
import { useToast } from '@/components/ui/toast';
import type { User, UserRole, UserProfile, UserSettings } from '@/types/user';

// Validation functions
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  return phoneRegex.test(phone);
};

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export default function EditUserPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({
    profile: {
      displayName: '',
      email: '',
      phoneNumber: '',
      bio: '',
      location: '',
      website: '',
      socialLinks: {
        twitter: '',
        linkedin: '',
        github: ''
      }
    },
    settings: {
      emailNotifications: false,
      pushNotifications: false,
      theme: 'system',
      language: 'en'
    },
    organizationRoles: {},
    isActive: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }

    const fetchUser = async () => {
      try {
        const db = await getDb();
        if (!db) {
          toast({
            title: 'Error',
            description: 'Firestore is not initialized',
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }
        const userDoc = await getDoc(doc(db, 'users', params.id));
        if (userDoc.exists()) {
          const userData = { id: userDoc.id, ...userDoc.data() } as User;
          setUser(userData);
          setFormData(userData);
        } else {
          router.push('/admin/users');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [isAdmin, router, params.id]);

  const handleProfileChange = (field: keyof UserProfile, value: string) => {
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value
      }
    }));
  };

  const handleSettingsChange = (field: keyof UserSettings, value: boolean | string) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }));
  };

  const handleRoleChange = (orgId: string, role: UserRole) => {
    setFormData(prev => ({
      ...prev,
      organizationRoles: {
        ...prev.organizationRoles,
        [orgId]: role
      }
    }));
  };

  const handleStatusChange = (isActive: boolean) => {
    setFormData(prev => ({
      ...prev,
      isActive,
      blockedReason: isActive ? undefined : prev.blockedReason,
      blockedAt: isActive ? undefined : prev.blockedAt,
      blockedBy: isActive ? undefined : prev.blockedBy
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate required fields
    if (!formData.profile?.email) {
      setErrors(prev => ({ ...prev, 'profile.email': 'Email is required' }));
      return;
    }

    // Validate email format
    if (!isValidEmail(formData.profile.email)) {
      setErrors(prev => ({ ...prev, 'profile.email': 'Invalid email format' }));
      return;
    }

    // Validate phone number if provided
    if (formData.profile.phoneNumber && !isValidPhoneNumber(formData.profile.phoneNumber)) {
      setErrors(prev => ({ ...prev, 'profile.phoneNumber': 'Invalid phone number format' }));
      return;
    }

    // Validate website if provided
    if (formData.profile.website && !isValidUrl(formData.profile.website)) {
      setErrors(prev => ({ ...prev, 'profile.website': 'Invalid website URL' }));
      return;
    }

    // Validate social links if provided
    if (formData.profile.socialLinks) {
      const { twitter, linkedin, github } = formData.profile.socialLinks;
      if (twitter && !isValidUrl(twitter)) {
        setErrors(prev => ({ ...prev, 'profile.socialLinks.twitter': 'Invalid Twitter URL' }));
        return;
      }
      if (linkedin && !isValidUrl(linkedin)) {
        setErrors(prev => ({ ...prev, 'profile.socialLinks.linkedin': 'Invalid LinkedIn URL' }));
        return;
      }
      if (github && !isValidUrl(github)) {
        setErrors(prev => ({ ...prev, 'profile.socialLinks.github': 'Invalid GitHub URL' }));
        return;
      }
    }

    setSaving(true);
    try {
      const db = await getDb();
      if (!db) {
        toast({
          title: 'Error',
          description: 'Firestore is not initialized',
          variant: 'destructive'
        });
        setSaving(false);
        return;
      }
      const userRef = doc(db, 'users', params.id);
      await updateDoc(userRef, {
        ...formData,
        updatedAt: new Date()
      });
      toast({
        title: 'Success',
        description: 'User updated successfully',
        variant: 'success'
      });
      router.push(`/admin/users/${params.id}`);
    } catch (error) {
      console.error('Error updating user:', error);
      setErrors({ submit: 'Failed to update user' });
      toast({
        title: 'Error',
        description: 'Failed to update user',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  useKeyboardNavigation({
    '/': () => router.push('/'),
    'Escape': () => router.push(`/admin/users/${params.id}`)
  });

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Users', href: '/admin/users' },
            { label: user?.profile?.displayName || 'User', href: `/admin/users/${params.id}` },
            { label: 'Edit' }
          ]}
        />

        <form onSubmit={handleSubmit}>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Display Name
                    </label>
                    <Input
                      value={formData.profile?.displayName || ''}
                      onChange={e => handleProfileChange('displayName', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={formData.profile?.email || ''}
                      onChange={e => handleProfileChange('email', e.target.value)}
                      className="mt-1"
                      error={errors['profile.email']}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <Input
                      type="tel"
                      value={formData.profile?.phoneNumber || ''}
                      onChange={e => handleProfileChange('phoneNumber', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Location
                    </label>
                    <Input
                      value={formData.profile?.location || ''}
                      onChange={e => handleProfileChange('location', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Bio
                    </label>
                    <Textarea
                      value={formData.profile?.bio || ''}
                      onChange={e => handleProfileChange('bio', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Website
                    </label>
                    <Input
                      type="url"
                      value={formData.profile?.website || ''}
                      onChange={e => handleProfileChange('website', e.target.value)}
                      className="mt-1"
                      error={errors['profile.website']}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Social Links
                    </label>
                    <div className="space-y-2">
                      <Input
                        type="url"
                        placeholder="Twitter URL"
                        value={formData.profile?.socialLinks?.twitter || ''}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              socialLinks: {
                                ...prev.profile?.socialLinks,
                                twitter: e.target.value
                              }
                            }
                          }))
                        }
                        className="mt-1"
                        error={errors['profile.socialLinks.twitter']}
                      />
                      <Input
                        type="url"
                        placeholder="LinkedIn URL"
                        value={formData.profile?.socialLinks?.linkedin || ''}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              socialLinks: {
                                ...prev.profile?.socialLinks,
                                linkedin: e.target.value
                              }
                            }
                          }))
                        }
                        className="mt-1"
                        error={errors['profile.socialLinks.linkedin']}
                      />
                      <Input
                        type="url"
                        placeholder="GitHub URL"
                        value={formData.profile?.socialLinks?.github || ''}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              socialLinks: {
                                ...prev.profile?.socialLinks,
                                github: e.target.value
                              }
                            }
                          }))
                        }
                        className="mt-1"
                        error={errors['profile.socialLinks.github']}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Account Status</h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Checkbox
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked: boolean) => handleStatusChange(checked)}
                    />
                    <label
                      htmlFor="isActive"
                      className="ml-2 text-sm font-medium text-gray-700"
                    >
                      Active Account
                    </label>
                  </div>
                  {!formData.isActive && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Blocked Reason
                      </label>
                      <Textarea
                        value={formData.blockedReason || ''}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            blockedReason: sanitizeString(e.target.value)
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Organization Roles</h2>
                <div className="space-y-4">
                  {Object.entries(formData.organizationRoles || {}).map(([orgId, role]) => (
                    <div key={orgId}>
                      <label className="block text-sm font-medium text-gray-700">
                        {orgId}
                      </label>
                      <Select
                        value={role}
                        onChange={value => handleRoleChange(orgId, value as UserRole)}
                        className="mt-1"
                        options={[
                          { value: 'admin', label: 'Admin' },
                          { value: 'editor', label: 'Editor' },
                          { value: 'viewer', label: 'Viewer' }
                        ]}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Checkbox
                      id="emailNotifications"
                      checked={formData.settings?.emailNotifications}
                      onCheckedChange={(checked: boolean) =>
                        handleSettingsChange('emailNotifications', checked)
                      }
                    />
                    <label
                      htmlFor="emailNotifications"
                      className="ml-2 text-sm font-medium text-gray-700"
                    >
                      Email Notifications
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Theme
                    </label>
                    <Select
                      value={formData.settings?.theme || ''}
                      onChange={value => handleSettingsChange('theme', value)}
                      className="mt-1"
                      options={[
                        { value: 'light', label: 'Light' },
                        { value: 'dark', label: 'Dark' },
                        { value: 'system', label: 'System' }
                      ]}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {errors.submit && (
            <div className="mt-4 text-sm text-red-600">{errors.submit}</div>
          )}

          <div className="mt-6 flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/admin/users/${params.id}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={saving}
            >
              {saving ? <Spinner className="mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </ErrorBoundary>
  );
} 