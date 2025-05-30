'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import { StoryPromptPage } from '../../../components/story-prompts/StoryPromptPage';
import { useStoryPrompts } from '../../../hooks/useStoryPrompts';

export default function Page() {
  const params = useParams() || {};
  const { orgId, profileId } = params as { orgId?: string; profileId?: string };
  const { updateStoryAnswers, isSubmitting } = useStoryPrompts({
    orgId: orgId as string,
    profileId: profileId as string,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Story Prompts</h1>
      <StoryPromptPage
        onUpdate={updateStoryAnswers}
        isSubmitting={isSubmitting}
      />
    </div>
  );
} 