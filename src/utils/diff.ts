import { diff_match_patch } from 'diff-match-patch';
import { Profile, TimelineEvent, Story } from '@/types/profile';

export interface DiffResult {
  oldText: string;
  newText: string;
  changes: Array<{
    type: 'deletion' | 'addition' | 'unchanged';
    text: string;
  }>;
}

export const generateDiff = (oldText: string, newText: string): DiffResult => {
  const dmp = new diff_match_patch();
  const diffs = dmp.diff_main(oldText, newText);
  dmp.diff_cleanupSemantic(diffs);

  const changes = diffs.map(([type, text]) => {
    if (type === -1) return { type: 'deletion' as const, text };
    if (type === 1) return { type: 'addition' as const, text };
    return { type: 'unchanged' as const, text };
  });

  return {
    oldText,
    newText,
    changes,
  };
};

export const formatTimelineEvent = (event: TimelineEvent): string => {
  return `${event.title} (${event.startDate})`;
};

export const formatStoryAnswer = (story: Story): string => {
  return `Q: ${story.question}\nA: ${story.answer}`;
};

export const generateProfileDiffs = (
  publishedProfile: Profile,
  draftProfile: Profile
): {
  metadata: DiffResult;
  timeline: DiffResult;
  storyAnswers: DiffResult;
} => {
  // Generate metadata diff
  const metadataDiff = generateDiff(
    JSON.stringify({
      name: publishedProfile.name,
      status: publishedProfile.status,
    }),
    JSON.stringify({
      name: draftProfile.name,
      status: draftProfile.status,
    })
  );

  // Generate timeline diff
  const timelineDiff = generateDiff(
    (publishedProfile.type === 'memorial' && (publishedProfile as any).timeline ? (publishedProfile as any).timeline : []).map(formatTimelineEvent).join('\n'),
    (draftProfile.type === 'memorial' && (draftProfile as any).timeline ? (draftProfile as any).timeline : []).map(formatTimelineEvent).join('\n')
  );

  // Generate story answers diff
  const storyAnswersDiff = generateDiff(
    ('stories' in publishedProfile && Array.isArray((publishedProfile as any).stories)
      ? (publishedProfile as any).stories
      : []
    ).map(formatStoryAnswer).join('\n\n'),
    ('stories' in draftProfile && Array.isArray((draftProfile as any).stories)
      ? (draftProfile as any).stories
      : []
    ).map(formatStoryAnswer).join('\n\n')
  );

  return {
    metadata: metadataDiff,
    timeline: timelineDiff,
    storyAnswers: storyAnswersDiff,
  };
}; 