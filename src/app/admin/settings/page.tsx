'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStoriatsAdmins } from '@/hooks/useStoriatsAdmins';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Icon } from '@/components/ui/Icon';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { validateEmail } from '@/lib/validation';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/Switch';

export default function StoriatsAdminSettingsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const {
    settings,
    loading: storiatsAdminsLoading,
    addAdmin,
    removeAdmin,
    toggleEmailRecipient,
    isStoriatsAdmin,
    isEmailRecipient,
    refreshSettings,
    error: storiatsAdminsError
  } = useStoriatsAdmins();
  const router = useRouter();

  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  // Track auth state changes
  useEffect(() => {
    if (user?.email) {
      console.log('[Auth State] Changed:', {
        userId: user?.uid,
        email: user?.email,
        isAdmin: isStoriatsAdmin(user.email.toLowerCase())
      });
    }
  }, [user, isStoriatsAdmin]);

  // Fetch settings only once on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        await refreshSettings();
      } catch (error) {
        console.error('[Settings] Error fetching settings:', error);
      }
    };

    fetchSettings();
  }, []); // Empty dependency array to run only once

  // Handle access control and redirects
  useEffect(() => {
    if (authLoading || storiatsAdminsLoading) {
      setIsCheckingAccess(true);
      return;
    }

    if (storiatsAdminsError) {
      console.error('[Admin Check] Error loading admin settings:', storiatsAdminsError);
      setIsCheckingAccess(false);
      return;
    }

    if (!user?.email) {
      console.log('[Admin Check] No user email, redirecting to landing');
      router.push('/');
      return;
    }

    const userEmail = user.email.toLowerCase();
    const isUserAdmin = isStoriatsAdmin(userEmail);

    console.log('[Admin Check] Access check:', {
      email: userEmail,
      isAdmin: isUserAdmin,
      settingsLoaded: !!settings
    });

    setIsCheckingAccess(false);

    if (!isUserAdmin) {
      console.log('[Admin Check] Access denied, redirecting to landing');
      router.push('/');
    }
  }, [user?.email, isStoriatsAdmin, authLoading, storiatsAdminsLoading, storiatsAdminsError, router, settings]);

  const handleAddAdmin = async () => {
    if (!user?.email) return;

    try {
      const emailError = validateEmail(newAdminEmail);
      if (emailError) {
        toast(emailError);
        return;
      }

      setIsAdding(true);
      await addAdmin(newAdminEmail.toLowerCase(), newAdminEmail.split('@')[0], user.email.toLowerCase());
      setNewAdminEmail('');
      toast('Admin email added successfully');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Failed to add admin email');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (!user?.email) return;

    try {
      setIsRemoving(email);
      await removeAdmin(email.toLowerCase(), user.email.toLowerCase());
      toast('Admin email removed successfully');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Failed to remove admin email');
    } finally {
      setIsRemoving(null);
      setShowRemoveConfirm(null);
    }
  };

  const handleToggleEmailRecipient = async (email: string) => {
    if (!user?.email) return;

    try {
      await toggleEmailRecipient(email.toLowerCase(), user.email.toLowerCase());
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Failed to update email recipient status');
    }
  };

  if (isCheckingAccess || authLoading || storiatsAdminsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <Spinner className="w-8 h-8 text-indigo-600" />
      </div>
    );
  }

  if (!user?.email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <Card className="max-w-md w-full p-6">
          <div className="text-center">
            <Icon name="lock" className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">Please log in to access this page</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!isStoriatsAdmin(user.email.toLowerCase())) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <Card className="max-w-md w-full p-6">
          <div className="text-center">
            <Icon name="alert-circle" className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You do not have permission to access this page</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <Breadcrumbs
            items={[
              { label: 'Admin', href: '/admin' },
              { label: 'Settings' }
            ]}
          />

          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-indigo-100 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Storiats Admin Settings</h1>
                <p className="mt-1 text-gray-600">Manage Storiats admin access and email notifications</p>
              </div>
              <Button
                onClick={() => refreshSettings()}
                disabled={storiatsAdminsLoading}
                className="flex items-center gap-2"
              >
                {storiatsAdminsLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Icon name="sync" />
                )}
                Refresh
              </Button>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <Input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="Enter admin email"
                  className="flex-1"
                />
                <Button
                  onClick={handleAddAdmin}
                  disabled={isAdding || !newAdminEmail}
                  className="whitespace-nowrap"
                >
                  {isAdding ? (
                    <>
                      <Spinner className="w-4 h-4 mr-2" />
                      Adding...
                    </>
                  ) : (
                    'Add Admin'
                  )}
                </Button>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900">Current Admins</h2>
                <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
                  {settings?.adminEmails.map((email) => (
                    <div key={email} className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{email}</p>
                        <p className="text-sm text-gray-500">Added by {settings.updatedBy}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={isEmailRecipient(email)}
                            onChange={() => handleToggleEmailRecipient(email)}
                            className="data-[state=checked]:bg-indigo-600"
                          />
                          <span className="text-sm text-gray-600">Email Recipient</span>
                        </div>
                        {showRemoveConfirm === email ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleRemoveAdmin(email)}
                              disabled={isRemoving === email}
                            >
                              {isRemoving === email ? (
                                <Spinner className="w-4 h-4" />
                              ) : (
                                'Confirm'
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowRemoveConfirm(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowRemoveConfirm(email)}
                            disabled={isRemoving === email}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
} 