'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { getFirebaseServices } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

interface AnalyticsProps {
  universityId: string;
}

interface ProfileStats {
  total: number;
  published: number;
  draft: number;
  pending: number;
  byType: {
    memorial: number;
    living: number;
  };
}

interface UserStats {
  total: number;
  byRole: {
    admin: number;
    editor: number;
    viewer: number;
  };
}

interface ActivityStats {
  totalViews: number;
  totalComments: number;
  totalShares: number;
}

export function Analytics({ universityId }: AnalyticsProps) {
  const [profileStats, setProfileStats] = useState<ProfileStats>({
    total: 0,
    published: 0,
    draft: 0,
    pending: 0,
    byType: {
      memorial: 0,
      living: 0
    }
  });
  const [userStats, setUserStats] = useState<UserStats>({
    total: 0,
    byRole: {
      admin: 0,
      editor: 0,
      viewer: 0
    }
  });
  const [activityStats, setActivityStats] = useState<ActivityStats>({
    totalViews: 0,
    totalComments: 0,
    totalShares: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { db } = await getFirebaseServices();
        if (!db) return;

        // Fetch profiles
        const profilesRef = collection(db, `universities/${universityId}/profiles`);
        const profilesSnapshot = await getDocs(profilesRef);
        const profiles = profilesSnapshot.docs.map(doc => doc.data());

        // Calculate profile stats
        const stats: ProfileStats = {
          total: profiles.length,
          published: profiles.filter(p => p.status === 'published').length,
          draft: profiles.filter(p => p.status === 'draft').length,
          pending: profiles.filter(p => p.status === 'pending_review').length,
          byType: {
            memorial: profiles.filter(p => p.type === 'memorial').length,
            living: profiles.filter(p => p.type === 'living').length
          }
        };

        setProfileStats(stats);

        // Fetch users
        const usersRef = collection(db, `universities/${universityId}/users`);
        const usersSnapshot = await getDocs(usersRef);
        const users = usersSnapshot.docs.map(doc => doc.data());

        // Calculate user stats
        const userStats: UserStats = {
          total: users.length,
          byRole: {
            admin: users.filter(u => u.role === 'admin').length,
            editor: users.filter(u => u.role === 'editor').length,
            viewer: users.filter(u => u.role === 'viewer').length
          }
        };

        setUserStats(userStats);

        // TODO: Implement activity stats tracking
        setActivityStats({
          totalViews: 0,
          totalComments: 0,
          totalShares: 0
        });

      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [universityId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Statistics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Total Profiles</p>
            <p className="text-2xl font-semibold text-gray-900">{profileStats.total}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Published</p>
            <p className="text-2xl font-semibold text-gray-900">{profileStats.published}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Drafts</p>
            <p className="text-2xl font-semibold text-gray-900">{profileStats.draft}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Pending Review</p>
            <p className="text-2xl font-semibold text-gray-900">{profileStats.pending}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Memorial Profiles</p>
            <p className="text-2xl font-semibold text-gray-900">{profileStats.byType.memorial}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Living Profiles</p>
            <p className="text-2xl font-semibold text-gray-900">{profileStats.byType.living}</p>
          </div>
        </div>
      </Card>

      {/* User Statistics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Total Users</p>
            <p className="text-2xl font-semibold text-gray-900">{userStats.total}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Admins</p>
            <p className="text-2xl font-semibold text-gray-900">{userStats.byRole.admin}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Editors</p>
            <p className="text-2xl font-semibold text-gray-900">{userStats.byRole.editor}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Viewers</p>
            <p className="text-2xl font-semibold text-gray-900">{userStats.byRole.viewer}</p>
          </div>
        </div>
      </Card>

      {/* Activity Statistics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Total Views</p>
            <p className="text-2xl font-semibold text-gray-900">{activityStats.totalViews}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Total Comments</p>
            <p className="text-2xl font-semibold text-gray-900">{activityStats.totalComments}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Total Shares</p>
            <p className="text-2xl font-semibold text-gray-900">{activityStats.totalShares}</p>
          </div>
        </div>
      </Card>
    </div>
  );
} 