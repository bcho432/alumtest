'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { CreateProfileButton } from '@/components/profile/CreateProfileButton';
import { ProfileList } from '@/components/university/ProfileList';
import { UserManagement } from '@/components/university/UserManagement';
import { Analytics } from '@/components/university/Analytics';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { getFirebaseServices } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/components/ui/toast';

const tabs = [
  { id: 'overview', label: 'Overview', icon: 'home' },
  { id: 'profiles', label: 'Profiles', icon: 'users' },
  { id: 'users', label: 'Users', icon: 'user' },
  { id: 'analytics', label: 'Analytics', icon: 'bar-chart' },
  { id: 'settings', label: 'Settings', icon: 'cog' }
] as const;

type TabId = typeof tabs[number]['id'];

interface DashboardStats {
  totalProfiles: number;
  publishedProfiles: number;
  draftProfiles: number;
  totalUsers: number;
  pendingApprovals: number;
}

export default function UniversityManagementClient() {
  const params = useParams();
  const universityId = params.id as string;
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [stats, setStats] = useState<DashboardStats>({
    totalProfiles: 0,
    publishedProfiles: 0,
    draftProfiles: 0,
    totalUsers: 0,
    pendingApprovals: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { db } = await getFirebaseServices();
        if (!db) {
          throw new Error('Failed to initialize Firebase');
        }

        // Fetch profiles
        const profilesRef = collection(db, `universities/${universityId}/profiles`);
        const profilesSnapshot = await getDocs(profilesRef);
        const profiles = profilesSnapshot.docs.map(doc => doc.data());

        // Fetch users
        const usersRef = collection(db, `universities/${universityId}/users`);
        const usersSnapshot = await getDocs(usersRef);

        setStats({
          totalProfiles: profiles.length,
          publishedProfiles: profiles.filter(p => p.status === 'published').length,
          draftProfiles: profiles.filter(p => p.status === 'draft').length,
          totalUsers: usersSnapshot.size,
          pendingApprovals: profiles.filter(p => p.status === 'pending_review').length
        });
        setError(null);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setError('Failed to load university data. Please try again.');
        toast({
          title: 'Error',
          description: 'Failed to load university data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    if (universityId) {
      fetchStats();
    }
  }, [universityId, toast]);

  if (!universityId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="mt-2 text-gray-600">Invalid university ID</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="mt-2 text-gray-600">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">University Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage profiles, users, and settings for your university
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {/* TODO: Implement export */}}
              >
                <Icon name="download" className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button
                onClick={() => {/* TODO: Implement settings */}}
              >
                <Icon name="cog" className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as TabId)}
          className="mb-8"
        />

        {/* Content */}
        <div className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="p-6">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-indigo-100">
                          <Icon name="users" className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Profiles</p>
                          <p className="text-2xl font-semibold text-gray-900">{stats.totalProfiles}</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-6">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100">
                          <Icon name="check-circle" className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Published</p>
                          <p className="text-2xl font-semibold text-gray-900">{stats.publishedProfiles}</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-6">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-yellow-100">
                          <Icon name="clock" className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Drafts</p>
                          <p className="text-2xl font-semibold text-gray-900">{stats.draftProfiles}</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-6">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-purple-100">
                          <Icon name="user-group" className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Users</p>
                          <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Quick Actions */}
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button
                        variant="outline"
                        className="justify-start"
                        onClick={() => setActiveTab('profiles')}
                      >
                        <Icon name="plus" className="w-4 h-4 mr-2" />
                        Create New Profile
                      </Button>
                      <Button
                        variant="outline"
                        className="justify-start"
                        onClick={() => setActiveTab('users')}
                      >
                        <Icon name="user-plus" className="w-4 h-4 mr-2" />
                        Add New User
                      </Button>
                      <Button
                        variant="outline"
                        className="justify-start"
                        onClick={() => {/* TODO: Implement bulk actions */}}
                      >
                        <Icon name="document-duplicate" className="w-4 h-4 mr-2" />
                        Bulk Actions
                      </Button>
                    </div>
                  </Card>

                  {/* Recent Activity */}
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                      <Button variant="ghost" size="sm">
                        View All
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {/* TODO: Implement activity feed */}
                      <p className="text-gray-500 text-sm">Activity feed coming soon...</p>
                    </div>
                  </Card>
                </div>
              )}

              {activeTab === 'profiles' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Profiles</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Manage and create profiles for your university
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => {/* TODO: Implement bulk actions */}}
                      >
                        <Icon name="document-duplicate" className="w-4 h-4 mr-2" />
                        Bulk Actions
                      </Button>
                      <CreateProfileButton universityId={universityId} profileType="memorial" />
                    </div>
                  </div>
                  <ProfileList universityId={universityId} />
                </div>
              )}

              {activeTab === 'users' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Users</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Manage user access and permissions
                      </p>
                    </div>
                    <Button
                      onClick={() => {/* TODO: Implement add user */}}
                    >
                      <Icon name="user-plus" className="w-4 h-4 mr-2" />
                      Add User
                    </Button>
                  </div>
                  <UserManagement universityId={universityId} />
                </div>
              )}

              {activeTab === 'analytics' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Analytics</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        View insights and statistics
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {/* TODO: Implement export analytics */}}
                    >
                      <Icon name="download" className="w-4 h-4 mr-2" />
                      Export Report
                    </Button>
                  </div>
                  <Analytics universityId={universityId} />
                </div>
              )}

              {activeTab === 'settings' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Configure university settings and preferences
                      </p>
                    </div>
                  </div>
                  {/* TODO: Implement settings form */}
                  <Card className="p-6">
                    <p className="text-gray-500">Settings form coming soon...</p>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 