'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Icon } from '@/components/ui/Icon';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getFirebaseServices } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, where, Timestamp, limit } from 'firebase/firestore';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalMemorials: number;
  totalMedia: number;
  recentActivity: {
    type: string;
    description: string;
    timestamp: string;
  }[];
  userGrowth: {
    date: string;
    count: number;
  }[];
  contentGrowth: {
    date: string;
    memorials: number;
    media: number;
  }[];
}

interface Activity {
  type: string;
  description: string;
  timestamp: string;
}

export default function AnalyticsDashboard() {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
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
      loadAnalytics();
    }
  }, [user, loading, isAdmin, router]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { db } = await getFirebaseServices();
      if (!db) throw new Error('Firestore instance not available');

      // Get total users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;

      // Get active users (users who have logged in within the last 30 days)
      const thirtyDaysAgo = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      const activeUsersSnapshot = await getDocs(
        query(collection(db, 'users'), where('lastLoginAt', '>=', thirtyDaysAgo))
      );
      const activeUsers = activeUsersSnapshot.size;

      // Get total memorials
      const memorialsSnapshot = await getDocs(collection(db, 'memorials'));
      const totalMemorials = memorialsSnapshot.size;

      // Get total media
      const mediaSnapshot = await getDocs(collection(db, 'media'));
      const totalMedia = mediaSnapshot.size;

      // Get recent activity
      const recentActivity: Activity[] = [];
      const recentUsers = await getDocs(
        query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(5))
      );
      recentUsers.forEach(doc => {
        recentActivity.push({
          type: 'user',
          description: 'New user registration',
          timestamp: doc.data().createdAt
        });
      });

      const recentMemorials = await getDocs(
        query(collection(db, 'memorials'), orderBy('createdAt', 'desc'), limit(5))
      );
      recentMemorials.forEach(doc => {
        recentActivity.push({
          type: 'memorial',
          description: 'New memorial created',
          timestamp: doc.data().createdAt
        });
      });

      // Sort recent activity by timestamp
      recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      recentActivity.splice(5); // Keep only the 5 most recent activities

      // Calculate user growth for the last 7 days
      const userGrowth = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const startOfDay = Timestamp.fromDate(new Date(date.setHours(0, 0, 0, 0)));
        const endOfDay = Timestamp.fromDate(new Date(date.setHours(23, 59, 59, 999)));

        const usersSnapshot = await getDocs(
          query(collection(db, 'users'), 
            where('createdAt', '>=', startOfDay),
            where('createdAt', '<=', endOfDay)
          )
        );
        userGrowth.push({
          date: date.toISOString().split('T')[0],
          count: usersSnapshot.size
        });
      }

      // Calculate content growth for the last 7 days
      const contentGrowth = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const startOfDay = Timestamp.fromDate(new Date(date.setHours(0, 0, 0, 0)));
        const endOfDay = Timestamp.fromDate(new Date(date.setHours(23, 59, 59, 999)));

        const memorialsSnapshot = await getDocs(
          query(collection(db, 'memorials'),
            where('createdAt', '>=', startOfDay),
            where('createdAt', '<=', endOfDay)
          )
        );
        const mediaSnapshot = await getDocs(
          query(collection(db, 'media'),
            where('createdAt', '>=', startOfDay),
            where('createdAt', '<=', endOfDay)
          )
        );

        contentGrowth.push({
          date: date.toISOString().split('T')[0],
          memorials: memorialsSnapshot.size,
          media: mediaSnapshot.size
        });
      }

      setData({
        totalUsers,
        activeUsers,
        totalMemorials,
        totalMedia,
        recentActivity,
        userGrowth,
        contentGrowth
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <div className="text-center">
          <Spinner className="w-8 h-8 text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadAnalytics} variant="primary">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Analytics', href: '/admin/analytics' }
          ]}
        />

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Analytics Dashboard
            </h1>
            <p className="mt-2 text-gray-600">Platform usage and engagement metrics</p>
          </div>
          <Button 
            onClick={loadAnalytics}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Icon name="refresh" className="w-5 h-5 mr-2" />
            Refresh Data
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-indigo-100 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Total Users</h3>
              <Icon name="users" className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="text-3xl font-bold text-indigo-600">{data.totalUsers.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-2">
              {data.activeUsers.toLocaleString()} active users
            </p>
          </Card>

          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-indigo-100 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Total Memorials</h3>
              <Icon name="lifeStory" className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="text-3xl font-bold text-indigo-600">{data.totalMemorials.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-2">
              {Math.round(data.totalMemorials / data.totalUsers * 100)}% of users have memorials
            </p>
          </Card>

          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-indigo-100 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Total Media</h3>
              <Icon name="photo" className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="text-3xl font-bold text-indigo-600">{data.totalMedia.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-2">
              {Math.round(data.totalMedia / data.totalMemorials)} media items per memorial
            </p>
          </Card>

          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-indigo-100 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Engagement Rate</h3>
              <Icon name="heart" className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="text-3xl font-bold text-indigo-600">
              {Math.round(data.activeUsers / data.totalUsers * 100)}%
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Active user engagement
            </p>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-indigo-100 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {data.recentActivity.map((activity, index) => (
                <div 
                  key={index}
                  className="flex items-start space-x-4 p-4 bg-white rounded-lg border border-gray-100"
                >
                  <Icon 
                    name={activity.type === 'user' ? 'users' : activity.type === 'memorial' ? 'lifeStory' : 'photo'} 
                    className="w-5 h-5 text-indigo-600 mt-1"
                  />
                  <div>
                    <p className="text-gray-900">{activity.description}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-indigo-100 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
            <div className="h-64 flex items-end space-x-2">
              {data.userGrowth.map((point, index) => (
                <div key={index} className="flex-1">
                  <div 
                    className="bg-indigo-600 rounded-t"
                    style={{ 
                      height: `${(point.count / Math.max(...data.userGrowth.map(p => p.count))) * 100}%`,
                      minHeight: '4px'
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-6 bg-white/80 backdrop-blur-sm border border-indigo-100 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Growth</h3>
          <div className="h-64 flex items-end space-x-2">
            {data.contentGrowth.map((point, index) => (
              <div key={index} className="flex-1">
                <div className="flex flex-col h-full justify-end space-y-1">
                  <div 
                    className="bg-purple-600 rounded-t"
                    style={{ 
                      height: `${(point.media / Math.max(...data.contentGrowth.map(p => p.media))) * 100}%`,
                      minHeight: '4px'
                    }}
                  />
                  <div 
                    className="bg-indigo-600 rounded-t"
                    style={{ 
                      height: `${(point.memorials / Math.max(...data.contentGrowth.map(p => p.memorials))) * 100}%`,
                      minHeight: '4px'
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
          <div className="flex justify-center space-x-4 mt-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-indigo-600 rounded-full mr-2" />
              <span className="text-sm text-gray-600">Memorials</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-600 rounded-full mr-2" />
              <span className="text-sm text-gray-600">Media</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 