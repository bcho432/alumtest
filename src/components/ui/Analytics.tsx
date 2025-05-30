import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { getFirebaseServices } from '@/lib/firebase';
import { Card } from './Card';
import { Icon } from './Icon';
import { Spinner } from './Spinner';
import { StatsCard } from './StatsCard';

interface AnalyticsData {
  totalProfiles: number;
  activeProfiles: number;
  totalMemorials: number;
  activeMemorials: number;
  totalUsers: number;
  activeUsers: number;
  totalViews: number;
  viewsLast30Days: number;
  engagementRate: number;
  profileCompletionRate: number;
}

interface AnalyticsProps {
  universityId: string;
}

export function Analytics({ universityId }: AnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [universityId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const { db } = await getFirebaseServices();
      if (!db) {
        throw new Error('Database is not initialized');
      }

      // Load profiles
      const profilesRef = collection(db, 'profiles');
      const profilesQuery = query(
        profilesRef,
        where('universityId', '==', universityId)
      );
      const profilesSnapshot = await getDocs(profilesQuery);
      const totalProfiles = profilesSnapshot.size;
      const activeProfiles = profilesSnapshot.docs.filter(
        doc => doc.data().status === 'active'
      ).length;

      // Load memorials
      const memorialsRef = collection(db, 'memorials');
      const memorialsQuery = query(
        memorialsRef,
        where('universityId', '==', universityId)
      );
      const memorialsSnapshot = await getDocs(memorialsQuery);
      const totalMemorials = memorialsSnapshot.size;
      const activeMemorials = memorialsSnapshot.docs.filter(
        doc => doc.data().status === 'active'
      ).length;

      // Load users
      const usersRef = collection(db, 'users');
      const usersQuery = query(
        usersRef,
        where('universityId', '==', universityId)
      );
      const usersSnapshot = await getDocs(usersQuery);
      const totalUsers = usersSnapshot.size;
      const activeUsers = usersSnapshot.docs.filter(
        doc => doc.data().status === 'active'
      ).length;

      // Calculate views and engagement
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const viewsRef = collection(db, 'views');
      const viewsQuery = query(
        viewsRef,
        where('universityId', '==', universityId),
        where('timestamp', '>=', thirtyDaysAgo)
      );
      const viewsSnapshot = await getDocs(viewsQuery);
      const viewsLast30Days = viewsSnapshot.size;

      // Calculate engagement rate (views per active profile)
      const engagementRate = activeProfiles > 0
        ? (viewsLast30Days / activeProfiles) * 100
        : 0;

      // Calculate profile completion rate
      const completedProfiles = profilesSnapshot.docs.filter(
        doc => {
          const data = doc.data();
          return data.status === 'active' && data.completionRate >= 80;
        }
      ).length;
      const profileCompletionRate = totalProfiles > 0
        ? (completedProfiles / totalProfiles) * 100
        : 0;

      setData({
        totalProfiles,
        activeProfiles,
        totalMemorials,
        activeMemorials,
        totalUsers,
        activeUsers,
        totalViews: viewsLast30Days,
        viewsLast30Days,
        engagementRate,
        profileCompletionRate
      });
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadAnalytics}
          className="text-indigo-600 hover:text-indigo-500"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Profiles"
          value={data.totalProfiles.toString()}
          icon="users"
          trend={data.activeProfiles > data.totalProfiles / 2 ? 'up' : 'down'}
        />
        <StatsCard
          title="Active Memorials"
          value={data.activeMemorials.toString()}
          icon="book"
          trend={data.activeMemorials > data.totalMemorials / 2 ? 'up' : 'down'}
        />
        <StatsCard
          title="Active Users"
          value={data.activeUsers.toString()}
          icon="user"
          trend={data.activeUsers > data.totalUsers / 2 ? 'up' : 'down'}
        />
        <StatsCard
          title="Views (30 days)"
          value={data.viewsLast30Days.toString()}
          icon="eye"
          trend="up"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Engagement Rate
            </h3>
            <div className="flex items-center">
              <div className="flex-1">
                <div className="text-3xl font-bold text-gray-900">
                  {data.engagementRate.toFixed(1)}%
                </div>
                <p className="text-sm text-gray-500">
                  Views per active profile
                </p>
              </div>
              <div className="ml-4">
                <Icon
                  name={data.engagementRate > 50 ? 'trending-up' : 'trending-down'}
                  className={`w-8 h-8 ${
                    data.engagementRate > 50 ? 'text-green-500' : 'text-red-500'
                  }`}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Profile Completion
            </h3>
            <div className="flex items-center">
              <div className="flex-1">
                <div className="text-3xl font-bold text-gray-900">
                  {data.profileCompletionRate.toFixed(1)}%
                </div>
                <p className="text-sm text-gray-500">
                  Completed profiles
                </p>
              </div>
              <div className="ml-4">
                <Icon
                  name={data.profileCompletionRate > 80 ? 'check-circle' : 'alert-circle'}
                  className={`w-8 h-8 ${
                    data.profileCompletionRate > 80 ? 'text-green-500' : 'text-yellow-500'
                  }`}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 