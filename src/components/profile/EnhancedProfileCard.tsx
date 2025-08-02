import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { Badge } from '@/components/ui/Badge';
import { BaseProfile, PersonalProfile, MemorialProfile } from '@/types/profile';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Timestamp } from 'firebase/firestore';
import { TimelineView } from '@/components/timeline/TimelineView';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { MediaGallery } from '@/components/media/MediaGallery';
import { ShareButton } from '@/components/common/ShareButton';
import { PinButton } from '@/components/common/PinButton';
import { RoleBasedUI } from '@/components/common/RoleBasedUI';
import { EditorRequestButton } from '@/components/common/EditorRequestButton';

interface EnhancedProfileCardProps {
  profile: BaseProfile;
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

  const formatDate = (date: Date | Timestamp | null | undefined): string => {
    if (!date) return 'Not specified';
    try {
      if (date instanceof Timestamp) {
        return date.toDate().toLocaleDateString();
      }
      if (date instanceof Date) {
        return date.toLocaleDateString();
      }
      // Handle string dates
      if (typeof date === 'string') {
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toLocaleDateString();
        }
      }
      return 'Invalid date';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  if (variant === 'full') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Hero Section with Cover Photo */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Profile Photo */}
              <div className="w-40 h-40 flex-shrink-0 bg-white rounded-2xl p-4 shadow-xl">
                {profile.type === 'personal' && false ? (
                  <img
                    src=""
                    alt={profile.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : profile.type === 'memorial' && (profile as any).basicInfo?.photo ? (
                  <img
                    src={(profile as any).basicInfo.photo}
                    alt={profile.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Icon name="user" className="h-16 w-16 text-indigo-600" />
                  </div>
                )}
              </div>
              
              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-5xl font-bold mb-4">{profile.name}</h1>
                {profile.type === 'personal' ? (
                  <div className="space-y-2">
                    {(profile as any).department && (
                      <p className="text-xl text-indigo-100">{(profile as any).department}</p>
                    )}
                    {(profile as any).location && (
                      <p className="text-lg text-indigo-100 flex items-center justify-center md:justify-start gap-2">
                        <Icon name="map-pin" className="h-5 w-5" />
                        {(profile as any).location}
                      </p>
                    )}
                    {(profile as any).graduationYear && (
                      <p className="text-lg text-indigo-100">Class of {(profile as any).graduationYear}</p>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-100 text-xl space-y-2">
                    <p className="flex items-center justify-center md:justify-start gap-2">
                      <Icon name="calendar" className="h-5 w-5" />
                      Born: {formatDate((profile as any).basicInfo?.dateOfBirth)}
                    </p>
                    <p className="flex items-center justify-center md:justify-start gap-2">
                      <Icon name="calendar" className="h-5 w-5" />
                      Died: {formatDate((profile as any).basicInfo?.dateOfDeath)}
                    </p>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 justify-center md:justify-start mt-6">
                  <ShareButton url={`/profile/${profile.id}`} />
                  <PinButton profileId={profile.id} />
                  <RoleBasedUI allowedRoles={['admin', 'editor']}>
                    <button
                      onClick={onEdit}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full font-medium transition-colors"
                    >
                      <Icon name="edit" className="h-5 w-5" />
                      Edit Profile
                    </button>
                  </RoleBasedUI>
                  <EditorRequestButton profileId={profile.id} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* About Section */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">About</h2>
                <div className="prose max-w-none">
                  {profile.type === 'personal' ? (
                    <div className="space-y-6">
                      {(profile as any).bio && (
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">Biography</h3>
                          <p className="mt-2 text-gray-600 whitespace-pre-wrap">{(profile as any).bio}</p>
                        </div>
                      )}
                      {(profile as any).contact && (
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
                          <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                            {(profile as any).contact.email && (
                              <div>
                                <dt className="text-sm font-medium text-gray-500">Email</dt>
                                <dd className="mt-1 text-sm text-gray-900">{(profile as any).contact.email}</dd>
                              </div>
                            )}
                            {(profile as any).contact.phone && (
                              <div>
                                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                                <dd className="mt-1 text-sm text-gray-900">{(profile as any).contact.phone}</dd>
                              </div>
                            )}
                            {(profile as any).contact.website && (
                              <div>
                                <dt className="text-sm font-medium text-gray-500">Website</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                  <a href={(profile as any).contact.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500">
                                    {(profile as any).contact.website}
                                  </a>
                                </dd>
                              </div>
                            )}
                          </dl>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {profile.description && (
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">Description</h3>
                          <p className="mt-2 text-gray-600">{profile.description}</p>
                        </div>
                      )}
                      {(profile as any).lifeStory?.content && (
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">Life Story</h3>
                          <div className="mt-2 text-gray-600">
                            {(() => {
                              try {
                                const lifeStoryContent = JSON.parse((profile as any).lifeStory.content) as Record<string, string>;
                                return Object.entries(lifeStoryContent).map(([question, answer]) => (
                                  <div key={question} className="mb-4">
                                    <h4 className="font-medium text-gray-900">{question}</h4>
                                    <p className="mt-1 text-gray-600">{answer}</p>
                                  </div>
                                ));
                              } catch (error) {
                                console.error('Error parsing life story:', error);
                                return <p className="text-gray-600">{(profile as any).lifeStory.content}</p>;
                              }
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline Section */}
              {profile.type === 'memorial' && (profile as any).timeline && (profile as any).timeline.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Life Timeline</h2>
                  <TimelineView
                    orgId={profile.id}
                    profileId={profile.id}
                    onEventClick={(event) => {
                      console.log('Event clicked:', event);
                    }}
                  />
                </div>
              )}

              {/* Comments Section */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Comments & Memories</h2>
                <CommentsSection
                  profileId={profile.id}
                  comments={[]}
                  onAddComment={() => {}}
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Media Gallery */}
              {profile.type === 'memorial' && (
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Photo Gallery</h2>
                  <MediaGallery
                    profileId={profile.id}
                    files={[(profile as any).basicInfo?.photo]}
                    onFileClick={(file) => window.open(file, '_blank')}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For compact and detailed variants, use the original card layout
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
            {profile.type === 'personal' && false ? (
              <img
                src=""
                alt={profile.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : profile.type === 'memorial' && (profile as any).imageUrl ? (
              <img
                src={(profile as any).imageUrl}
                alt={profile.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                <Icon name="user" className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{profile.name}</h2>
              {profile.type === 'memorial' && (profile as any).basicInfo && (
                <div className="text-sm text-gray-500">
                  {formatDate((profile as any).basicInfo?.dateOfBirth)} - {formatDate((profile as any).basicInfo?.dateOfDeath)}
                </div>
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

        {(profile as any).bio && (
          <p className="text-gray-600 mb-4">{(profile as any).bio}</p>
        )}

        {profile.type === 'memorial' && (
          <div className="space-y-4">
            {profile.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">Description</h3>
                <p className="text-gray-600">{profile.description}</p>
              </div>
            )}
            {(profile as any).basicInfo?.biography && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">Biography</h3>
                <p className="text-gray-600">{(profile as any).basicInfo.biography}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}; 