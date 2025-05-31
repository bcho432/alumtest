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

export default function StoriatsAdminSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    settings,
    loading,
    addAdmin,
    removeAdmin,
    isStoriatsAdmin,
    refreshSettings
  } = useStoriatsAdmins();

  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user?.email) {
        setIsCheckingAccess(false);
        setIsAdmin(false);
        return;
      }

      try {
        const adminStatus = isStoriatsAdmin(user.email);
        setIsAdmin(adminStatus);
        if (adminStatus) {
          await refreshSettings();
        }
      } catch (error) {
        console.error('Error checking admin access:', error);
        toast('Error checking admin access', 'error');
        setIsAdmin(false);
      } finally {
        setIsCheckingAccess(false);
      }
    };

    checkAccess();
  }, [user?.email, isStoriatsAdmin, refreshSettings, toast]);

  const handleAddAdmin = async () => {
    if (!user?.email) return;

    try {
      const emailError = validateEmail(newAdminEmail);
      if (emailError) {
        toast(emailError);
        return;
      }

      setIsAdding(true);
      await addAdmin(newAdminEmail, newAdminEmail.split('@')[0], user.email);
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
      await removeAdmin(email, user.email);
      toast('Admin email removed successfully');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Failed to remove admin email');
    } finally {
      setIsRemoving(null);
      setShowRemoveConfirm(null);
    }
  };

  if (isCheckingAccess || isAdmin === null) {
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

  if (!isAdmin) {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <Spinner className="w-8 h-8 text-indigo-600" />
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
                <p className="mt-1 text-gray-600">Manage Storiats admin access</p>
              </div>
              <Button
                variant="outline"
                onClick={() => refreshSettings()}
              >
                <Icon name="refresh" className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Admin</h2>
                <div className="flex gap-4">
                  <Input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="Enter admin email"
                    className="flex-1"
                    disabled={isAdding}
                  />
                  <Button
                    onClick={handleAddAdmin}
                    disabled={isAdding || !newAdminEmail}
                  >
                    {isAdding ? (
                      <Spinner className="w-4 h-4 mr-2" />
                    ) : (
                      <Icon name="plus" className="w-4 h-4 mr-2" />
                    )}
                    Add Admin
                  </Button>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Current Admins</h2>
                <div className="space-y-3">
                  {settings?.adminEmails.length === 0 ? (
                    <p className="text-gray-500 italic">No admins found</p>
                  ) : (
                    settings?.adminEmails.map((email: string) => (
                      <div
                        key={email}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{email}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Last updated: {settings.lastUpdated.toLocaleString()}
                          </p>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setShowRemoveConfirm(email)}
                          disabled={isRemoving === email || settings.adminEmails.length <= 1}
                        >
                          {isRemoving === email ? (
                            <Spinner className="w-4 h-4" />
                          ) : (
                            'Remove'
                          )}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <Card className="max-w-md w-full p-6">
            <div className="text-center">
              <Icon name="exclamation-triangle" className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Remove Admin</h2>
              <p className="text-gray-600 mb-4">
                Are you sure you want to remove {showRemoveConfirm} from the admin list?
              </p>
              <div className="flex justify-center gap-4">
                <Button
                  variant="secondary"
                  onClick={() => setShowRemoveConfirm(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleRemoveAdmin(showRemoveConfirm)}
                >
                  Remove
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </ErrorBoundary>
  );
} 