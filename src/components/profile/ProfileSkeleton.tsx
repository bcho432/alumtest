import { cn } from '@/lib/utils';

interface ProfileSkeletonProps {
  className?: string;
}

export const ProfileSkeleton = ({ className }: ProfileSkeletonProps) => {
  return (
    <div className={cn('animate-pulse space-y-4', className)}>
      {/* Header */}
      <div className="h-8 w-1/3 bg-gray-200 rounded" />
      
      {/* Basic Info */}
      <div className="space-y-2">
        <div className="h-4 w-1/4 bg-gray-200 rounded" />
        <div className="h-4 w-1/2 bg-gray-200 rounded" />
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        <div className="h-4 w-1/3 bg-gray-200 rounded" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-2">
              <div className="h-3 w-3 bg-gray-200 rounded-full" />
              <div className="h-4 w-1/2 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Story Answers */}
      <div className="space-y-3">
        <div className="h-4 w-1/3 bg-gray-200 rounded" />
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-1">
              <div className="h-4 w-1/4 bg-gray-200 rounded" />
              <div className="h-16 w-full bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 