'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminSettings } from '@/stores/adminSettings';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/use-toast';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Icon } from '@/components/ui/Icon';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { validateEmail } from '@/lib/validation';
import { Header } from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function StoriatsAdminSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    settings,
    loading,
    error,
    isStoriatsAdmin,
    addAdminEmail,
    removeAdminEmail,
    refreshSettings
  } = useAdminSettings();

  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email && isStoriatsAdmin(user.email)) {
      refreshSettings();
    }
  }, [user?.email, isStoriatsAdmin, refreshSettings]);

  useEffect(() => {
    const initializeAdmins = async () => {
      if (!settings?.adminEmails?.length) {
        const newAdmins = [
          'matthew.bo@storiats.com',
          'justin.lontoh@storiats.com',
          'derek.lee@storiats.com'
        ];
        
        for (const email of newAdmins) {
          try {
            await addAdminEmail(email, 'system');
          } catch (error) {
            console.error(`Error adding admin ${email}:`, error);
          }
        }
      }
    };

    initializeAdmins();
  }, [settings, addAdminEmail]);

  const handleAddAdmin = async () => {
    if (!user?.email) return;

    try {
      const emailError = validateEmail(newAdminEmail);
      if (emailError) {
        toast(emailError);
        return;
      }

      setIsAdding(true);
      await addAdminEmail(newAdminEmail, user.email);
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
      await removeAdminEmail(email, user.email);
      toast('Admin email removed successfully');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Failed to remove admin email');
    } finally {
      setIsRemoving(null);
      setShowRemoveConfirm(null);
    }
  };

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

  if (!isStoriatsAdmin(user.email)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <Card className="max-w-md w-full p-6">
          <div className="text-center">
            <Icon name="shield-exclamation" className="w-12 h-12 text-red-500 mx-auto mb-4" />
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <Card className="max-w-md w-full p-6">
          <div className="text-center">
            <Icon name="exclamation-circle" className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Settings</h2>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <Button onClick={refreshSettings} variant="primary">
              Retry
            </Button>
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

          <div className="mt-6">
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
      </div>

      <ConfirmDialog
        open={!!showRemoveConfirm}
        title="Remove Admin"
        message={`Are you sure you want to remove ${showRemoveConfirm} from the admin list?`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="primary"
        onConfirm={() => showRemoveConfirm && handleRemoveAdmin(showRemoveConfirm)}
        onCancel={() => setShowRemoveConfirm(null)}
      />
    </ErrorBoundary>
  );
} 