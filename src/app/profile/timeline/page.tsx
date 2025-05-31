'use client';
import React from 'react';
import { TimelineBuilder } from '@/components/timeline/TimelineBuilder';
import { TimelineView } from '@/components/timeline/TimelineView';
import { useTimeline } from '@/hooks/useTimeline';
import { useParams } from 'next/navigation';
import { TimelineEvent } from '@/types/profile';

export default function TimelinePage() {
  const params = useParams() || {};
  const { orgId, profileId } = params as { orgId?: string; profileId?: string };
  
  const {
    events,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
    isRefreshing
  } = useTimeline({
    orgId: orgId || '',
    profileId: profileId || '',
  });

  // Handler to update the entire timeline
  const handleUpdateTimeline = async (events: TimelineEvent[]) => {
    // Update the events in the cache
    await refresh();
  };

  if (!orgId || !profileId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center text-red-500">
            Missing organization or profile ID
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left side - Timeline Builder */}
        <div>
          <h1 className="text-2xl font-bold mb-8">Timeline Builder</h1>
          <TimelineBuilder
            existingEvents={events}
            onUpdate={handleUpdateTimeline}
            isSubmitting={isLoading || isRefreshing}
          />
        </div>

        {/* Right side - Timeline View */}
        <div>
          <h1 className="text-2xl font-bold mb-8">Timeline Preview</h1>
          <TimelineView
            orgId={orgId}
            profileId={profileId}
            onEventClick={(event) => {
              // Handle event click if needed
              console.log('Event clicked:', event);
            }}
          />
        </div>
      </div>
    </div>
  );
} 