import React, { useState } from 'react';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Select } from '@/components/ui/Select';

const LIFE_STORY_QUESTIONS = [
  {
    value: 'early-life',
    label: 'Early Life',
    placeholder: 'Share memories from your childhood and early years...',
  },
  {
    value: 'education',
    label: 'Education',
    placeholder: 'Describe your educational journey and significant academic experiences...',
  },
  {
    value: 'career',
    label: 'Career',
    placeholder: 'Tell us about your professional life and career achievements...',
  },
  {
    value: 'family',
    label: 'Family',
    placeholder: 'Share stories about your family life and relationships...',
  },
  {
    value: 'hobbies',
    label: 'Hobbies & Interests',
    placeholder: 'What are your passions and interests? What brings you joy?',
  },
  {
    value: 'life-lessons',
    label: 'Life Lessons',
    placeholder: 'What wisdom have you gained throughout your life? What advice would you share?',
  },
  {
    value: 'memories',
    label: 'Memorable Moments',
    placeholder: 'Share your most cherished memories and significant life events...',
  },
  {
    value: 'legacy',
    label: 'Legacy',
    placeholder: 'What would you like to be remembered for? What impact do you hope to leave?',
  },
];

interface LifeStoryEditorProps {
  value: string;
  onChange: (value: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
}

export function LifeStoryEditor({ value, onChange, onImageUpload }: LifeStoryEditorProps) {
  const [selectedQuestion, setSelectedQuestion] = useState(LIFE_STORY_QUESTIONS[0].value);

  const handleQuestionChange = (newQuestion: string) => {
    setSelectedQuestion(newQuestion);
    // You might want to handle saving the current content before switching questions
    // This would require additional state management in the parent component
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select a Topic
        </label>
        <Select
          value={selectedQuestion}
          onChange={handleQuestionChange}
          options={LIFE_STORY_QUESTIONS}
          className="w-full"
        />
      </div>
      <RichTextEditor
        value={value}
        onChange={onChange}
        placeholder={LIFE_STORY_QUESTIONS.find(q => q.value === selectedQuestion)?.placeholder}
        onImageUpload={onImageUpload}
      />
    </div>
  );
} 