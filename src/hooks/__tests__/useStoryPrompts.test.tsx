import { renderHook, act } from '@testing-library/react';
import { useStoryPrompts } from '../useStoryPrompts';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '../useToast';
import { useAnalytics } from '../useAnalytics';
import { StoryAnswer } from '../../types/profile';

// Mock Firebase
jest.mock('firebase/firestore');

// Mock hooks
jest.mock('../useToast', () => ({
  useToast: jest.fn(),
}));

jest.mock('../useAnalytics', () => ({
  useAnalytics: jest.fn(),
}));

describe('useStoryPrompts', () => {
  const mockShowToast = jest.fn();
  const mockTrackEvent = jest.fn();
  const mockUpdateDoc = updateDoc as jest.Mock;
  const mockDoc = doc as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ showToast: mockShowToast });
    (useAnalytics as jest.Mock).mockReturnValue({ trackEvent: mockTrackEvent });
    mockDoc.mockReturnValue('mock-doc-ref');
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('updates story answers successfully and tracks analytics', async () => {
    const { result } = renderHook(() =>
      useStoryPrompts({ orgId: 'org1', profileId: 'profile1' })
    );

    const answers: StoryAnswer[] = [
      {
        id: 'prof-1',
        questionId: 'prof-1',
        question: 'What inspired you to pursue your current career path?',
        answer: 'My passion for technology',
      },
      {
        id: 'acad-1',
        questionId: 'acad-1',
        question: 'What was your favorite class and why?',
        answer: 'Computer Science was my favorite class',
      },
    ];

    await act(async () => {
      await result.current.updateStoryAnswers(answers);
    });

    expect(mockDoc).toHaveBeenCalledWith(
      expect.anything(),
      'organizations',
      'org1',
      'profiles',
      'profile1'
    );
    expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc-ref', {
      storyAnswers: answers,
      updatedAt: expect.any(String),
    });
    expect(mockShowToast).toHaveBeenCalledWith({
      title: 'Answers Saved',
      description: 'Your story prompt answers have been saved successfully.',
      status: 'success',
    });
    expect(mockTrackEvent).toHaveBeenCalledWith('story_answers_updated', {
      answerCount: 2,
      categories: ['professional', 'academic'],
    });
  });

  it('retries failed updates and succeeds on second attempt', async () => {
    const error = new Error('Network error');
    mockUpdateDoc
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(undefined);

    const { result } = renderHook(() =>
      useStoryPrompts({ orgId: 'org1', profileId: 'profile1' })
    );

    const answers: StoryAnswer[] = [
      {
        id: 'prof-1',
        questionId: 'prof-1',
        question: 'What inspired you to pursue your current career path?',
        answer: 'Test answer',
      },
    ];

    const updatePromise = act(async () => {
      await result.current.updateStoryAnswers(answers);
    });

    // First attempt fails
    expect(mockShowToast).toHaveBeenCalledWith({
      title: 'Retrying...',
      description: 'Attempt 1 of 3. Please wait.',
      status: 'info',
      duration: 1000,
    });

    // Wait for retry delay
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    // Second attempt succeeds
    await updatePromise;

    expect(mockUpdateDoc).toHaveBeenCalledTimes(2);
    expect(mockShowToast).toHaveBeenCalledWith({
      title: 'Answers Saved',
      description: 'Your story prompt answers have been saved successfully.',
      status: 'success',
    });
  });

  it('fails after maximum retries', async () => {
    const error = new Error('Network error');
    mockUpdateDoc.mockRejectedValue(error);

    const { result } = renderHook(() =>
      useStoryPrompts({ orgId: 'org1', profileId: 'profile1' })
    );

    const answers: StoryAnswer[] = [
      {
        id: 'prof-1',
        questionId: 'prof-1',
        question: 'What inspired you to pursue your current career path?',
        answer: 'Test answer',
      },
    ];

    await act(async () => {
      await expect(result.current.updateStoryAnswers(answers)).rejects.toThrow('Network error');
    });

    // Should have tried 3 times
    expect(mockUpdateDoc).toHaveBeenCalledTimes(3);
    expect(mockShowToast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Failed to save answers: Network error',
      status: 'error',
    });
  });

  it('manages isSubmitting state correctly', async () => {
    const { result } = renderHook(() =>
      useStoryPrompts({ orgId: 'org1', profileId: 'profile1' })
    );

    expect(result.current.isSubmitting).toBe(false);

    const updatePromise = act(async () => {
      await result.current.updateStoryAnswers([
        {
          id: 'prof-1',
          questionId: 'prof-1',
          question: 'What inspired you to pursue your current career path?',
          answer: 'Test answer',
        },
      ]);
    });

    expect(result.current.isSubmitting).toBe(true);
    await updatePromise;
    expect(result.current.isSubmitting).toBe(false);
  });

  it('handles empty answers array', async () => {
    const { result } = renderHook(() =>
      useStoryPrompts({ orgId: 'org1', profileId: 'profile1' })
    );

    await act(async () => {
      await result.current.updateStoryAnswers([]);
    });

    expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc-ref', {
      storyAnswers: [],
      updatedAt: expect.any(String),
    });
    expect(mockTrackEvent).toHaveBeenCalledWith('story_answers_updated', {
      answerCount: 0,
      categories: [],
    });
  });
}); 