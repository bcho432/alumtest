import { generateDiff, formatTimelineEvent, formatStoryAnswer, generateProfileDiffs } from '../diff';
import { Profile, TimelineEvent, StoryAnswer } from '@/types/profile';

describe('Diff Utils', () => {
  describe('generateDiff', () => {
    it('should generate diff for identical texts', () => {
      const result = generateDiff('hello', 'hello');
      expect(result.changes).toHaveLength(1);
      expect(result.changes[0]).toEqual({
        type: 'unchanged',
        text: 'hello',
      });
    });

    it('should generate diff for different texts', () => {
      const result = generateDiff('hello', 'world');
      expect(result.changes).toHaveLength(2);
      expect(result.changes[0]).toEqual({
        type: 'deletion',
        text: 'hello',
      });
      expect(result.changes[1]).toEqual({
        type: 'addition',
        text: 'world',
      });
    });

    it('should handle partial changes', () => {
      const result = generateDiff('hello world', 'hello there');
      expect(result.changes).toHaveLength(3);
      expect(result.changes[0]).toEqual({
        type: 'unchanged',
        text: 'hello ',
      });
      expect(result.changes[1]).toEqual({
        type: 'deletion',
        text: 'world',
      });
      expect(result.changes[2]).toEqual({
        type: 'addition',
        text: 'there',
      });
    });
  });

  describe('formatTimelineEvent', () => {
    it('should format timeline event correctly', () => {
      const event: TimelineEvent = {
        id: '1',
        title: 'Graduation',
        date: '2020-05-15',
      };
      expect(formatTimelineEvent(event)).toBe('Graduation (2020-05-15)');
    });
  });

  describe('formatStoryAnswer', () => {
    it('should format story answer correctly', () => {
      const answer: StoryAnswer = {
        id: '1',
        questionId: 'q1',
        question: 'What was your favorite class?',
        answer: 'Computer Science',
      };
      expect(formatStoryAnswer(answer)).toBe('Q: What was your favorite class?\nA: Computer Science');
    });
  });

  describe('generateProfileDiffs', () => {
    const mockPublishedProfile: Profile = {
      id: '1',
      name: 'John Doe',
      status: 'published',
      orgId: 'org1',
      createdBy: 'user1',
      editors: ['user1'],
      createdAt: new Date('2020-01-01'),
      updatedAt: new Date('2020-01-01'),
      timeline: [
        { id: '1', title: 'Graduation', date: '2020-05-15' },
      ],
      storyAnswers: [
        {
          id: '1',
          questionId: 'q1',
          question: 'What was your favorite class?',
          answer: 'Computer Science',
        },
      ],
    };

    const mockDraftProfile: Profile = {
      ...mockPublishedProfile,
      name: 'John A. Doe',
      status: 'draft',
      timeline: [
        { id: '1', title: 'Graduation', date: '2020-05-15' },
        { id: '2', title: 'First Job', date: '2020-06-01' },
      ],
      storyAnswers: [
        {
          id: '1',
          questionId: 'q1',
          question: 'What was your favorite class?',
          answer: 'Advanced Computer Science',
        },
      ],
    };

    it('should generate diffs for all sections', () => {
      const result = generateProfileDiffs(mockPublishedProfile, mockDraftProfile);

      // Check metadata diff
      expect(result.metadata.changes).toContainEqual({
        type: 'deletion',
        text: '"name":"John Doe"',
      });
      expect(result.metadata.changes).toContainEqual({
        type: 'addition',
        text: '"name":"John A. Doe"',
      });

      // Check timeline diff
      expect(result.timeline.changes).toContainEqual({
        type: 'addition',
        text: 'First Job (2020-06-01)',
      });

      // Check story answers diff
      expect(result.storyAnswers.changes).toContainEqual({
        type: 'deletion',
        text: 'Computer Science',
      });
      expect(result.storyAnswers.changes).toContainEqual({
        type: 'addition',
        text: 'Advanced Computer Science',
      });
    });

    it('should handle identical profiles', () => {
      const result = generateProfileDiffs(mockPublishedProfile, mockPublishedProfile);

      // All sections should have only unchanged changes
      expect(result.metadata.changes.every(change => change.type === 'unchanged')).toBe(true);
      expect(result.timeline.changes.every(change => change.type === 'unchanged')).toBe(true);
      expect(result.storyAnswers.changes.every(change => change.type === 'unchanged')).toBe(true);
    });
  });
}); 