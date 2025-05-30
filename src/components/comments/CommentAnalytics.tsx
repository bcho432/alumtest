import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { CommentService } from '@/services/CommentService';
import { Comment } from '@/types/comments';
import { formatDistanceToNow, subDays, startOfDay, endOfDay, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageSquare, FiHeart, FiFlag, FiTrendingUp, FiTrendingDown, FiDownload, FiFilter, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface CommentAnalyticsProps {
  mediaId?: string;
  timeRange?: 'day' | 'week' | 'month' | 'year' | 'custom';
  customDateRange?: {
    start: Date;
    end: Date;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const CommentAnalytics: React.FC<CommentAnalyticsProps> = ({
  mediaId,
  timeRange = 'week',
  customDateRange
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [metrics, setMetrics] = useState({
    totalComments: 0,
    totalReplies: 0,
    totalLikes: 0,
    totalFlagged: 0,
    averageResponseTime: 0,
    engagementRate: 0,
    topCommenters: [] as { name: string; count: number; avatar?: string }[],
    commentTrend: [] as { date: string; count: number }[],
    hourlyDistribution: [] as { hour: number; count: number }[],
    sentimentDistribution: [] as { type: string; value: number }[],
    userRetention: {
      day1: 0,
      day7: 0,
      day30: 0
    },
    peakActivityHours: [] as { hour: number; count: number }[],
    moderationMetrics: {
      flaggedCount: 0,
      resolvedCount: 0,
      pendingCount: 0
    }
  });

  // Memoize data processing to improve performance
  const processedData = useMemo(() => {
    if (!metrics.commentTrend) return null;
    
    return {
      commentTrend: metrics.commentTrend.map(item => ({
        ...item,
        formattedDate: format(new Date(item.date), 'MMM dd'),
        tooltipLabel: format(new Date(item.date), 'MMMM dd, yyyy')
      })),
      hourlyDistribution: metrics.hourlyDistribution.map(item => ({
        ...item,
        formattedHour: `${item.hour}:00`,
        tooltipLabel: `${item.hour}:00 - ${item.hour + 1}:00`
      }))
    };
  }, [metrics.commentTrend, metrics.hourlyDistribution]);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, mediaId, timeRange, customDateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const endDate = customDateRange?.end || new Date();
      const startDate = customDateRange?.start || subDays(endDate, getDaysForTimeRange(timeRange));
      const resultRaw = await CommentService.getComments(mediaId || '');
      const result: Comment[] = Array.isArray(resultRaw)
        ? resultRaw
        : (resultRaw && typeof resultRaw === 'object' && 'comments' in (resultRaw as any) && Array.isArray((resultRaw as any).comments)
            ? (resultRaw as { comments: Comment[] }).comments
            : []);
      const comments = result.filter((comment: Comment) => {
        const commentDate = new Date(comment.createdAt);
        return commentDate >= startDate && commentDate <= endDate;
      });

      // Calculate metrics
      const totalComments = comments.length;
      const totalReplies = comments.filter(c => c.parentId).length;
      const totalLikes = comments.reduce((sum: number, c: Comment) => sum + (c.likes?.length || 0), 0);
      const totalFlagged = comments.filter(c => c.isFlagged).length;

      // Calculate average response time
      const responseTimes = comments
        .filter(c => c.parentId)
        .map((c: Comment) => {
          const parentComment = comments.find((p: Comment) => p.id === c.parentId);
          if (!parentComment) return 0;
          return new Date(c.createdAt).getTime() - new Date(parentComment.createdAt).getTime();
        })
        .filter((time: number) => time > 0);

      const averageResponseTime = responseTimes.length
        ? responseTimes.reduce((sum: number, time: number) => sum + time, 0) / responseTimes.length
        : 0;

      // Calculate engagement rate
      const uniqueCommenters = new Set(comments.map((c: Comment) => c.authorId)).size;
      const engagementRate = totalComments > 0 ? (uniqueCommenters / totalComments) * 100 : 0;

      // Get top commenters with avatars
      const commenterCounts = comments.reduce((acc: Record<string, { count: number; name: string; avatar?: string }>, comment: Comment) => {
        acc[comment.authorId] = {
          count: (acc[comment.authorId]?.count || 0) + 1,
          name: comment.authorName || 'Unknown',
          avatar: comment.authorAvatar
        };
        return acc;
      }, {} as Record<string, { count: number; name: string; avatar?: string }>);

      const topCommenters = Object.entries(commenterCounts)
        .map(([authorId, data]) => ({
          name: data.name,
          count: data.count,
          avatar: data.avatar
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate comment trend
      const commentTrend = Array.from({ length: getDaysForTimeRange(timeRange) }, (_, i) => {
        const date = subDays(endDate, i);
        const count = comments.filter((c: Comment) => {
          const commentDate = new Date(c.createdAt);
          return commentDate >= startOfDay(date) && commentDate <= endOfDay(date);
        }).length;
        return {
          date: format(date, 'MMM dd'),
          count
        };
      }).reverse();

      // Calculate hourly distribution
      const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => {
        const count = comments.filter((c: Comment) => {
          const commentHour = new Date(c.createdAt).getHours();
          return commentHour === hour;
        }).length;
        return { hour, count };
      });

      // Calculate sentiment distribution (placeholder - replace with actual sentiment analysis)
      const sentimentDistribution = [
        { type: 'Positive', value: 65 },
        { type: 'Neutral', value: 25 },
        { type: 'Negative', value: 10 }
      ];

      // Calculate user retention (placeholder - replace with actual retention data)
      const userRetention = {
        day1: 85,
        day7: 65,
        day30: 45
      };

      // Calculate peak activity hours
      const peakActivityHours = hourlyDistribution
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate moderation metrics
      const moderationMetrics = {
        flaggedCount: totalFlagged,
        resolvedCount: comments.filter((c: Comment) => c.isFlagged && !c.isDeleted).length,
        pendingCount: comments.filter((c: Comment) => c.isFlagged && c.isDeleted).length
      };

      setMetrics({
        totalComments,
        totalReplies,
        totalLikes,
        totalFlagged,
        averageResponseTime,
        engagementRate,
        topCommenters,
        commentTrend,
        hourlyDistribution,
        sentimentDistribution,
        userRetention,
        peakActivityHours,
        moderationMetrics
      });
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const getDaysForTimeRange = (range: string): number => {
    switch (range) {
      case 'day':
        return 1;
      case 'week':
        return 7;
      case 'month':
        return 30;
      case 'year':
        return 365;
      default:
        return 7;
    }
  };

  const formatResponseTime = (ms: number): string => {
    const minutes = Math.round(ms / (1000 * 60));
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.round(minutes / 60);
    if (hours < 24) {
      return `${hours}h`;
    }
    const days = Math.round(hours / 24);
    return `${days}d`;
  };

  const exportAnalytics = () => {
    try {
      const data = {
        metrics,
        exportDate: new Date().toISOString(),
        timeRange,
        mediaId
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comment-analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Analytics exported successfully');
    } catch (error) {
      toast.error('Failed to export analytics');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
    toast.success('Analytics refreshed');
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <FiAlertCircle />
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Failed to load analytics</p>
        <button
          onClick={loadAnalytics}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="comment-analytics space-y-6" role="region" aria-label="Comment Analytics Dashboard">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Comment Analytics</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                refreshing ? 'animate-spin' : ''
              }`}
              disabled={refreshing}
              aria-label="Refresh analytics"
            >
              <FiRefreshCw size={20} />
            </button>
            <button
              onClick={exportAnalytics}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Export analytics data"
            >
              <FiDownload size={20} />
              <span>Export Data</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow"
          role="article"
          aria-label="Total Comments"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Comments</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{metrics.totalComments}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {metrics.totalReplies} replies
              </p>
            </div>
            <FiMessageSquare className="text-blue-500" size={24} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow"
          role="article"
          aria-label="Total Likes"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Likes</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{metrics.totalLikes}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {((metrics.totalLikes / metrics.totalComments) * 100).toFixed(1)}% engagement
              </p>
            </div>
            <FiHeart className="text-red-500" size={24} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow"
          role="article"
          aria-label="Flagged Comments"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Flagged Comments</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{metrics.totalFlagged}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {((metrics.totalFlagged / metrics.totalComments) * 100).toFixed(1)}% flagged
              </p>
            </div>
            <FiFlag className="text-yellow-500" size={24} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow"
          role="article"
          aria-label="Engagement Rate"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Engagement Rate</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{metrics.engagementRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {metrics.topCommenters.length} active users
              </p>
            </div>
            <FiTrendingUp className="text-green-500" size={24} />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow"
          role="article"
          aria-label="Comment Trend"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Comment Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processedData?.commentTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                <XAxis 
                  dataKey="formattedDate" 
                  stroke="var(--gray-500)"
                  tick={{ fill: 'var(--gray-500)' }}
                />
                <YAxis 
                  stroke="var(--gray-500)"
                  tick={{ fill: 'var(--gray-500)' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--surface-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="var(--primary-color)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: 'var(--primary-color)' }}
                  activeDot={{ r: 6, fill: 'var(--primary-color)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow"
          role="article"
          aria-label="Hourly Distribution"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Hourly Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedData?.hourlyDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="formattedHour" 
                  stroke="var(--gray-500)"
                  tick={{ fill: 'var(--gray-500)' }}
                />
                <YAxis 
                  stroke="var(--gray-500)"
                  tick={{ fill: 'var(--gray-500)' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--surface-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow"
          role="article"
          aria-label="Sentiment Distribution"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Sentiment Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.sentimentDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {metrics.sentimentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow"
          role="article"
          aria-label="User Retention"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">User Retention</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Day 1</span>
              <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-500 h-2.5 rounded-full"
                  style={{ width: `${metrics.userRetention.day1}%` }}
                />
              </div>
              <span className="text-gray-500 dark:text-gray-400">{metrics.userRetention.day1}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Day 7</span>
              <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-500 h-2.5 rounded-full"
                  style={{ width: `${metrics.userRetention.day7}%` }}
                />
              </div>
              <span className="text-gray-500 dark:text-gray-400">{metrics.userRetention.day7}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Day 30</span>
              <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-500 h-2.5 rounded-full"
                  style={{ width: `${metrics.userRetention.day30}%` }}
                />
              </div>
              <span className="text-gray-500 dark:text-gray-400">{metrics.userRetention.day30}%</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow"
          role="article"
          aria-label="Top Commenters"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Top Commenters</h3>
          <div className="space-y-4">
            {metrics.topCommenters.map((commenter, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {commenter.avatar ? (
                    <img
                      src={commenter.avatar}
                      alt={commenter.name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">
                        {commenter.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="font-medium">{commenter.name}</span>
                </div>
                <span className="text-gray-500 dark:text-gray-400">
                  {commenter.count} comments
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow"
          role="article"
          aria-label="Moderation Overview"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Moderation Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Flagged Comments</span>
              <span className="font-medium">{metrics.moderationMetrics.flaggedCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Resolved Cases</span>
              <span className="font-medium">{metrics.moderationMetrics.resolvedCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Pending Cases</span>
              <span className="font-medium">{metrics.moderationMetrics.pendingCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Resolution Rate</span>
              <span className="font-medium">
                {metrics.moderationMetrics.flaggedCount > 0
                  ? ((metrics.moderationMetrics.resolvedCount / metrics.moderationMetrics.flaggedCount) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}; 