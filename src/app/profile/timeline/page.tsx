'use client';
import React from 'react';
import { TimelineBuilder } from '../../../components/timeline/TimelineBuilder';
import { useTimeline } from '../../../hooks/useTimeline';
import { useParams } from 'next/navigation';
import { TimelineEvent } from '../../../types/profile';

export default function TimelinePage() {
  const params = useParams() || {};
  const { orgId, profileId } = params as { orgId?: string; profileId?: string };
  const { reorderEvents, isLoading } = useTimeline();

  // Handler to update the entire timeline
  const handleUpdateTimeline = async (events: TimelineEvent[]) => {
    await reorderEvents(events);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Timeline Builder</h1>
        <TimelineBuilder
          onUpdate={handleUpdateTimeline}
          isSubmitting={isLoading}
        />
      </div>
    </div>
  );
} 