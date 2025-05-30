import React from 'react';
import { useStoryAnswers } from '@/hooks/useStoryAnswers';
import { LoadingState } from '@/components/ui/LoadingState';
import { Alert } from '@/components/ui/Alert';
import { StoryAnswer } from '@/types/profile';
import { STORY_QUESTIONS, StoryQuestion } from '@/types/questions';

interface StoryPromptsProps {
  orgId: string;
  profileId: string;
  isPreview?: boolean;
}

export const StoryPrompts: React.FC<StoryPromptsProps> = ({
  orgId,
  profileId,
  isPreview = false,
}) => {
  const { answers, isLoading, error } = useStoryAnswers({ orgId, profileId });

  if (isLoading) {
    return <LoadingState size="lg" />;
  }

  if (error) {
    return (
      <Alert type="error" title="Error" message={error.message} />
    );
  }

  if (!answers || Object.keys(answers).length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No story prompts answered yet.
      </div>
    );
  }

  const allQuestions = Object.values(STORY_QUESTIONS).flat();

  return (
    <div className="space-y-6">
      {allQuestions.map((question) => {
        const answer = answers[question.id];
        if (!answer) return null;

        return (
          <StoryPromptCard
            key={question.id}
            question={question}
            answer={answer}
            isPreview={isPreview}
          />
        );
      })}
    </div>
  );
};

interface StoryPromptCardProps {
  question: StoryQuestion;
  answer: string;
  isPreview?: boolean;
}

const StoryPromptCard: React.FC<StoryPromptCardProps> = ({
  question,
  answer,
  isPreview = false,
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-2">{question.text}</h3>
      <p className="text-gray-700 whitespace-pre-wrap">{answer}</p>
    </div>
  );
}; 