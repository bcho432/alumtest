import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { Profile, MemorialProfile, PersonalProfile, TimelineEvent, LifeEvent } from '@/types/profile';
import { Timestamp } from 'firebase/firestore';
import { TimelineView } from '@/components/timeline/TimelineView';

interface ProfileShowcaseProps {
  profile: Profile;
}

function isMemorialProfile(profile: Profile): boolean {
  return profile.type === 'memorial';
}

function isPersonalProfile(profile: Profile): boolean {
  return profile.type === 'personal';
}

const formatDate = (date: Date | Timestamp | null | undefined): string => {
  if (!date) return 'Not specified';
  if (date instanceof Timestamp) {
    return date.toDate().toLocaleDateString();
  }
  if (date instanceof Date) {
    return date.toLocaleDateString();
  }
  return 'Invalid date';
};

// Add boolean guards for description and timelineEvents
function hasDescription(profile: Profile): boolean {
  return isMemorialProfile(profile) && 'description' in profile;
}

function hasTimelineEvents(profile: Profile): boolean {
  return isMemorialProfile(profile) && 'timelineEvents' in profile && Array.isArray((profile as any).timelineEvents);
}

const timelineEventToLifeEvent = (event: any) => ({
  ...event,
  type: event.type === 'job' ? 'work' : event.type === 'event' ? 'other' : event.type,
});

export const ProfileShowcase: React.FC<ProfileShowcaseProps> = ({ profile }) => {
  const getPhotoUrl = (profile: Profile): string | undefined => {
    if (profile.type === 'personal') {
      return undefined;
    }
    return undefined;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center space-x-4 mb-6"
      >
        {getPhotoUrl(profile) && (
          <motion.img
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            src={getPhotoUrl(profile)}
            alt={profile.name}
            className="w-24 h-24 rounded-full object-cover"
          />
        )}
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-bold"
          >
            {profile.name}
          </motion.h1>
          {isMemorialProfile(profile) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-gray-600"
            >
              <p>Born: {formatDate(((profile as unknown) as MemorialProfile).basicInfo?.dateOfBirth)}</p>
              <p>Died: {formatDate(((profile as unknown) as MemorialProfile).basicInfo?.dateOfDeath)}</p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Description */}
      {hasDescription(profile) && ((profile as unknown) as MemorialProfile).description && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-6"
        >
          <h2 className="text-xl font-semibold mb-2">Description</h2>
          <p className="text-gray-700">{((profile as unknown) as MemorialProfile).description}</p>
        </motion.div>
      )}

      {/* Life Story */}
      {isMemorialProfile(profile) && ((profile as unknown) as MemorialProfile).lifeStory?.content && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-6"
        >
          <h2 className="text-xl font-semibold mb-2">Life Story</h2>
          <p className="text-gray-700">{((profile as unknown) as MemorialProfile).lifeStory?.content}</p>
        </motion.div>
      )}

      {/* Timeline */}
      {hasTimelineEvents(profile) && ((profile as any).timelineEvents.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-6"
        >
          <h2 className="text-xl font-semibold mb-2">Timeline</h2>
          <TimelineView
            orgId={profile.universityId}
            profileId={profile.id}
            onEventClick={(event: LifeEvent) => {
              // Handle event click if needed
              console.log('Event clicked:', event);
            }}
            events={(((profile as unknown) as MemorialProfile).timeline || []).map(timelineEventToLifeEvent)}
          />
        </motion.div>
      )}

      {/* Tags */}
      {((profile as any).metadata?.tags && (profile as any).metadata.tags.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mb-6"
        >
          <h2 className="text-xl font-semibold mb-2">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {((profile as any).metadata.tags as string[]).map((tag: string) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </motion.div>
      )}

      {/* Privacy Status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="flex items-center space-x-2"
      >
        <Icon name={(profile as any).isPublic ? 'unlock' : 'lock'} className="w-4 h-4" />
        <span className="text-sm text-gray-600">
          {(profile as any).isPublic ? 'Public' : 'Private'}
        </span>
      </motion.div>
    </motion.div>
  );
}; 