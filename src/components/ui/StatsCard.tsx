import { Icon } from './Icon';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: string;
  trend?: 'up' | 'down';
  className?: string;
}

export function StatsCard({ title, value, icon, trend, className = '' }: StatsCardProps) {
  const getTrendColor = (trend: 'up' | 'down') => {
    return trend === 'up' ? 'text-green-500' : 'text-red-500';
  };

  const getTrendIcon = (trend: 'up' | 'down') => {
    return trend === 'up' ? 'trending-up' : 'trending-down';
  };

  return (
    <div className={`bg-white overflow-hidden shadow rounded-lg ${className}`}>
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon name={icon} className="h-6 w-6 text-gray-400" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">
                  {value}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      {trend && (
        <div className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <div className={`flex items-center ${getTrendColor(trend)}`}>
              <Icon name={getTrendIcon(trend)} className="h-4 w-4 mr-1" />
              <span>
                {trend === 'up' ? 'Increasing' : 'Decreasing'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 