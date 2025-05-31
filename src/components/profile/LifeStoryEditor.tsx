import React, { useState } from 'react';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { LifeStoryQuestions } from './LifeStoryQuestions';

interface LifeStoryEditorProps {
  value: string;
  onChange: (value: string) => void;
  onQuestionsChange?: (answers: Record<string, string>) => void;
  initialAnswers?: Record<string, string>;
}

export function LifeStoryEditor({
  value,
  onChange,
  onQuestionsChange,
  initialAnswers,
}: LifeStoryEditorProps) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Biography</h3>
        <RichTextEditor
          value={value}
          onChange={onChange}
          placeholder="Write a detailed biography..."
        />
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Life Story Questions</h3>
        <LifeStoryQuestions
          onAnswersChange={onQuestionsChange || (() => {})}
          initialAnswers={initialAnswers}
        />
      </div>
    </div>
  );
} 