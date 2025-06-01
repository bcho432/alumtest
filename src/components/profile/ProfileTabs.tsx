import React, { useState } from 'react';
import { TimelineView } from '@/components/timeline/TimelineView';
import { MediaGallery } from '@/components/media/MediaGallery';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { Icon } from '@/components/ui/Icon';
import type { BaseProfile, MemorialProfile, PersonalProfile, LifeEvent } from '@/types/profile';
import { Timestamp } from 'firebase/firestore';

interface ProfileTabsProps {
  profile: BaseProfile;
}

const TABS = [
  { key: 'about', label: 'About', icon: 'user' },
  { key: 'timeline', label: 'Timeline', icon: 'calendar' },
  { key: 'media', label: 'Media', icon: 'image' },
  { key: 'comments', label: 'Tributes', icon: 'message-circle' },
];

function formatDate(date: string | Date | Timestamp | null | undefined): string {
  if (!date) return 'N/A';
  if (typeof date === 'string') {
    const d = new Date(date);
    return isNaN(d.getTime()) ? date : d.toLocaleDateString();
  }
  if (date instanceof Timestamp) {
    return date.toDate().toLocaleDateString();
  }
  if (date instanceof Date) {
    return date.toLocaleDateString();
  }
  return 'N/A';
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ profile }) => {
  const [activeTab, setActiveTab] = useState('about');
  const isMemorial = profile.type === 'memorial';
  const isPersonal = profile.type === 'personal';
  const memorial = isMemorial ? (profile as MemorialProfile) : undefined;
  const personal = isPersonal ? (profile as PersonalProfile) : undefined;

  // Convert timeline events if needed (for TimelineView compatibility)
  const timelineEvents: LifeEvent[] = isMemorial && memorial?.timeline ? memorial.timeline.map(e => ({
    ...e,
    type: e.type === 'job' ? 'work' : e.type === 'event' ? 'other' : e.type
  })) as LifeEvent[] : [];

  return (
    <div className="w-full">
      {/* Tab Bar */}
      <div className="flex gap-2 md:gap-6 border-b border-gray-200 mb-8 overflow-x-auto" role="tablist">
        {TABS.map(tab => (
          <button
            key={tab.key}
            role="tab"
            className={`flex items-center gap-2 px-4 py-3 text-lg font-medium transition-colors rounded-t-lg focus:outline-none ${activeTab === tab.key ? 'bg-white text-indigo-600 shadow' : 'text-gray-500 hover:text-indigo-600'}`}
            onClick={() => setActiveTab(tab.key)}
            aria-selected={activeTab === tab.key}
            aria-controls={`${tab.key}-panel`}
            id={`${tab.key}-tab`}
          >
            <Icon name={tab.icon} className="h-5 w-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-2xl shadow-lg p-8 min-h-[300px]">
        {activeTab === 'about' && (
          <div className="space-y-6" role="tabpanel" id="about-panel" aria-labelledby="about-tab">
            <h2 className="text-2xl font-bold mb-4">About</h2>
            {isPersonal && personal && (
              <>
                {personal.bio && <p className="text-gray-700 whitespace-pre-wrap">{personal.bio}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {personal.department && <div><span className="font-semibold">Department:</span> {personal.department}</div>}
                  {personal.location && <div><span className="font-semibold">Location:</span> {personal.location}</div>}
                  {personal.graduationYear && <div><span className="font-semibold">Graduation Year:</span> {personal.graduationYear}</div>}
                  {personal.contact && (
                    <div>
                      <span className="font-semibold">Contact:</span>
                      <div className="text-sm text-gray-500">
                        {personal.contact.email && <div>Email: {personal.contact.email}</div>}
                        {personal.contact.phone && <div>Phone: {personal.contact.phone}</div>}
                        {personal.contact.website && <div>Website: {personal.contact.website}</div>}
                      </div>
                    </div>
                  )}
                </div>
                {personal.achievements && personal.achievements.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">Achievements</h3>
                    <ul className="list-disc list-inside text-gray-700">
                      {personal.achievements.map((a, i) => (
                        <li key={i}>{a.title} ({formatDate(a.date)})</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
            {isMemorial && memorial && (
              <>
                {memorial.basicInfo && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-4 text-gray-700">
                      <div><span className="font-semibold">Born:</span> {formatDate(memorial.basicInfo.dateOfBirth)}</div>
                      <div><span className="font-semibold">Died:</span> {formatDate(memorial.basicInfo.dateOfDeath)}</div>
                      <div><span className="font-semibold">Birthplace:</span> {memorial.basicInfo.birthLocation}</div>
                      <div><span className="font-semibold">Deathplace:</span> {memorial.basicInfo.deathLocation}</div>
                    </div>
                  </div>
                )}
                {memorial.basicInfo?.biography && <p className="text-gray-700 whitespace-pre-wrap mb-4">{memorial.basicInfo.biography}</p>}
                {memorial.lifeStory?.content && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">Life Story</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{memorial.lifeStory.content}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        {activeTab === 'timeline' && (
          <div role="tabpanel" id="timeline-panel" aria-labelledby="timeline-tab">
            <h2 className="text-2xl font-bold mb-4">Timeline</h2>
            {isMemorial && timelineEvents.length > 0 ? (
              <TimelineView events={timelineEvents} />
            ) : (
              <p className="text-gray-500">No timeline events available.</p>
            )}
          </div>
        )}
        {activeTab === 'media' && (
          <div role="tabpanel" id="media-panel" aria-labelledby="media-tab">
            <h2 className="text-2xl font-bold mb-4">Media Gallery</h2>
            {isMemorial && memorial && memorial.basicInfo?.photo ? (
              <MediaGallery profileId={profile.id} files={[memorial.basicInfo.photo]} onFileClick={file => window.open(file, '_blank')} />
            ) : (
              <p className="text-gray-500">No media available.</p>
            )}
          </div>
        )}
        {activeTab === 'comments' && (
          <div role="tabpanel" id="comments-panel" aria-labelledby="comments-tab">
            <h2 className="text-2xl font-bold mb-4">Tributes & Comments</h2>
            <CommentsSection profileId={profile.id} comments={[]} onAddComment={() => {}} />
          </div>
        )}
      </div>
    </div>
  );
}; 