'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useStoriatsAdmins } from '@/hooks/useStoriatsAdmins';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Spinner } from '@/components/ui/Spinner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isStoriatsAdmin, loading: storiatsAdminsLoading } = useStoriatsAdmins();
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  // Handle access control and redirects
  useEffect(() => {
    if (authLoading || storiatsAdminsLoading) {
      setIsCheckingAccess(true);
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
      isAdmin: isUserAdmin
    });

    setIsCheckingAccess(false);

    if (!isUserAdmin) {
      console.log('[Admin Check] Access denied, redirecting to landing');
      router.push('/');
    }
  }, [user?.email, isStoriatsAdmin, authLoading, storiatsAdminsLoading, router]);

  const handleNavigation = (path: string) => {
    router.push(path);
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
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Admin' }
        ]}
      />

      <div className="mt-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 mb-8">Manage your platform settings and users</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-indigo-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Universities</h2>
              <Icon name="university" className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="mb-4 text-gray-600">Manage university profiles and settings</p>
            <Button 
              onClick={() => handleNavigation('/admin/universities/manage')}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Manage Universities
            </Button>
          </Card>

          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-indigo-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Users</h2>
              <Icon name="users" className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="mb-4 text-gray-600">Manage user accounts and permissions</p>
            <Button 
              onClick={() => handleNavigation('/admin/users')}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Manage Users
            </Button>
          </Card>

          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-indigo-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Platform Settings</h2>
              <Icon name="settings" className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="mb-4 text-gray-600">Configure platform-wide settings and admin access</p>
            <Button 
              onClick={() => handleNavigation('/admin/settings')}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Manage Settings
            </Button>
          </Card>

          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-indigo-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Analytics</h2>
              <Icon name="chart-bar" className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="mb-4 text-gray-600">View platform usage and engagement metrics</p>
            <Button 
              onClick={() => handleNavigation('/admin/analytics')}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              View Analytics
            </Button>
          </Card>

          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-indigo-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Support</h2>
              <Icon name="ticket" className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="mb-4 text-gray-600">Manage support tickets and user assistance</p>
            <Button 
              onClick={() => handleNavigation('/admin/support')}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Manage Support
            </Button>
          </Card>

          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-indigo-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Content</h2>
              <Icon name="document" className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="mb-4 text-gray-600">Manage platform content and resources</p>
            <Button 
              onClick={() => handleNavigation('/admin/content')}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Manage Content
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
} 