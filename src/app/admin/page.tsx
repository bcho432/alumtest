'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Icon } from '@/components/ui/Icon';
import { universitiesService } from '@/services/universities';
import type { University } from '@/types';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    if (!loading && !isAdmin) {
      router.push('/');
      return;
    }

    if (user && isAdmin) {
      loadUniversities();
    }
  }, [user, loading, isAdmin, router]);

  const loadUniversities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const unis = await universitiesService.listUniversities();
      setUniversities(unis);
    } catch (error) {
      console.error('Error loading universities:', error);
      setError('Failed to load universities. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <div className="text-center">
          <Spinner className="w-8 h-8 text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadUniversities} variant="primary">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Storiats Admin Dashboard
            </h1>
            <p className="mt-2 text-gray-600">Manage universities, users, and platform settings</p>
          </div>
          <Button 
            onClick={() => handleNavigation('/admin/universities/new')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Icon name="plus" className="w-5 h-5 mr-2" />
            Create University
          </Button>
        </div>

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
              <h2 className="text-xl font-semibold text-gray-900">Content</h2>
              <Icon name="lifeStory" className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="mb-4 text-gray-600">Manage memorials and media content</p>
            <Button 
              onClick={() => handleNavigation('/admin/content')}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Manage Content
            </Button>
          </Card>

          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-indigo-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Analytics</h2>
              <Icon name="timeline" className="w-6 h-6 text-indigo-600" />
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
              <Icon name="support" className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="mb-4 text-gray-600">View and manage support requests</p>
            <Button 
              onClick={() => handleNavigation('/admin/support')}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Support Dashboard
            </Button>
          </Card>

          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-indigo-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
              <Icon name="cog" className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="mb-4 text-gray-600">Configure platform settings and features</p>
            <Button 
              onClick={() => handleNavigation('/admin/settings')}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Platform Settings
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
} 