import React, { useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { LifeStoryQuestions } from '../LifeStoryQuestions';
import { Timestamp } from 'firebase/firestore';

interface LifeStoryTabProps {
  formData: {
    lifeStory: {
      content: string;
      updatedAt: Date | Timestamp;
    };
  };
  onInputChange: (field: string, value: any) => void;
}

export function LifeStoryTab({ formData, onInputChange }: LifeStoryTabProps) {
  const handleQuestionsChange = (answers: Record<string, string>) => {
    onInputChange('lifeStory', {
      ...formData.lifeStory,
      content: JSON.stringify(answers),
      updatedAt: new Date()
    });
  };

  // Parse the content safely
  const getInitialAnswers = () => {
    try {
      if (!formData.lifeStory?.content) return {};
      const parsed = JSON.parse(formData.lifeStory.content);
      return typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">Life Story Questions</label>
          <LifeStoryQuestions
            onAnswersChange={handleQuestionsChange}
            initialAnswers={getInitialAnswers()}
          />
        </div>
      </div>
    </Card>
  );
} 