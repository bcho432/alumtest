import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { Badge } from '@/components/ui/Badge';
import { Profile } from '@/types/profile';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useUserRoles } from '@/hooks/useUserRoles';

interface EnhancedProfileCardProps {
  profile: Profile;
  variant?: 'compact' | 'detailed' | 'full';
  onEdit?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  showStats?: boolean;
  className?: string;
}

export const EnhancedProfileCard: React.FC<EnhancedProfileCardProps> = ({
  profile,
  variant = 'detailed',
  onEdit,
  onShare,
  onDelete,
  showActions = true,
  showStats = true,
  className
}) => {
  const { user } = useAuth();
  const { roles } = useUserRoles();
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Determine the correct org/university ID for role lookup
  const orgOrUniversityId =
    profile.type === 'memorial'
      ? (profile as any).universityId || ''
      : (profile as any).orgId || '';

  const isAdmin = roles?.[orgOrUniversityId] === 'admin';
  const isEditor = roles?.[orgOrUniversityId] === 'editor';

  const cardVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.98 }
  };

  const menuVariants = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  // Cover image
  let coverImage = '';
  if (profile.type === 'personal' && (profile as any).coverImage) {
    coverImage = (profile as any).coverImage;
  }
  // For memorials, you may want to use imageUrl or skip
  // let coverImage = profile.type === 'memorial' ? (profile as any).imageUrl || '' : (profile as any).coverImage || '';

  // Photo
  let photoUrl = '';
  if (profile.type === 'personal' && (profile as any).photoURL) {
    photoUrl = (profile as any).photoURL;
  } else if (profile.type === 'memorial' && (profile as any).imageUrl) {
    photoUrl = (profile as any).imageUrl;
  }

  // Department and bio (only for personal)
  const department = profile.type === 'personal' ? (profile as any).department : undefined;
  const bio = profile.type === 'personal' ? (profile as any).bio : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        'relative bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300',
        'hover:shadow-xl border border-gray-100',
        className
      )}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            {profile.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                <span className="text-2xl font-semibold">
                  {profile.name.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{profile.name}</h2>
              {profile.type === 'memorial' && (
                <p className="text-sm text-gray-600">
                  {profile.basicInfo?.dateOfBirth ? new Date(profile.basicInfo.dateOfBirth).toLocaleDateString() : ''}
                  {' - '}
                  {profile.basicInfo?.dateOfDeath ? new Date(profile.basicInfo.dateOfDeath).toLocaleDateString() : ''}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="text-gray-600 hover:text-indigo-600"
              >
                <Icon name="edit" className="w-4 h-4" />
              </Button>
            )}
            {onShare && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onShare}
                className="text-gray-600 hover:text-indigo-600"
              >
                <Icon name="share" className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="text-red-600 hover:text-red-700"
              >
                <Icon name="trash" className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {bio && (
          <p className="text-gray-600 mb-4">{bio}</p>
        )}

        {profile.type === 'memorial' && (
          <div className="space-y-4">
            {profile.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">Description</h3>
                <p className="text-gray-600">{profile.description}</p>
              </div>
            )}
            {profile.basicInfo?.biography && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">Biography</h3>
                <p className="text-gray-600">{profile.basicInfo.biography}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}; 