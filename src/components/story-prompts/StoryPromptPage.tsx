'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { StoryAnswer, StoryPrompt } from '../../types/profile';
import { useToast } from '../../hooks/useToast';
import { useAnalytics } from '../../hooks/useAnalytics';
import { ErrorBoundary } from '../ErrorBoundary';

const answerSchema = z.object({
  answer: z.string().max(1000, 'Answer must be less than 1,000 characters'),
});

type AnswerFormData = z.infer<typeof answerSchema>;

interface StoryPromptPageProps {
  existingAnswers?: StoryAnswer[];
  onUpdate: (answers: StoryAnswer[]) => Promise<void>;
  isSubmitting?: boolean;
  searchTerm?: string;
  selectedCategory?: string;
}

export const StoryPromptPage: React.FC<StoryPromptPageProps> = ({
  existingAnswers = [],
  onUpdate,
  isSubmitting = false,
  searchTerm = '',
  selectedCategory = 'all',
}) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const { showToast } = useToast();
  const { trackEvent } = useAnalytics();
  const firstInputRef = useRef<HTMLTextAreaElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<Record<string, AnswerFormData>>({
    resolver: zodResolver(z.record(answerSchema)),
    defaultValues: Object.fromEntries(
      existingAnswers.map((answer) => [answer.questionId, { answer: answer.answer }])
    ),
  });

  // Focus first input when form opens
  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, []);

  // Handle escape key to close expanded categories
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && expandedCategories.length > 0) {
        setExpandedCategories([]);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [expandedCategories]);

  // Track page view
  useEffect(() => {
    trackEvent('story_prompt_viewed');
  }, [trackEvent]);

  const onSubmit = async (data: Record<string, AnswerFormData>) => {
    try {
      const answers = Object.entries(data)
        .filter(([_, formData]) => formData.answer.trim().length > 0)
        .map(([questionId, formData]) => {
          const question = QUESTIONS_BY_CATEGORY[getCategoryFromQuestionId(questionId)]
            .find(q => q.id === questionId);
          return {
            id: questionId,
            questionId,
            question: question?.question || '',
            answer: formData.answer.trim(),
          };
        });

      await onUpdate(answers);

      trackEvent('story_answer_submitted', {
        answerCount: answers.length,
        categories: [...new Set(answers.map((a) => getCategoryFromQuestionId(a.questionId)))],
      });

      showToast({
        title: 'Answers Saved',
        description: 'Your story prompt answers have been saved successfully.',
        status: 'success',
      });
    } catch (error) {
      console.error('Error saving story answers:', error);
      showToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save answers. Please try again.',
        status: 'error',
      });
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const getCategoryFromQuestionId = (questionId: string): string => {
    return Object.entries(QUESTIONS_BY_CATEGORY).find(([_, questions]) =>
      questions.some(q => q.id === questionId)
    )?.[0] || '';
  };

  const filteredQuestions = Object.entries(QUESTIONS_BY_CATEGORY)
    .filter(([category, _]) => selectedCategory === 'all' || category === selectedCategory)
    .flatMap(([_, questions]) =>
      questions.filter((q) =>
        q.question.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

  return (
    <ErrorBoundary>
      <div className="space-y-6" role="region" aria-label="Story Prompts">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {filteredQuestions.map((prompt, index) => (
            <motion.div
              key={prompt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <label
                htmlFor={`answer-${prompt.id}`}
                className="block text-lg font-medium text-gray-900 mb-2"
              >
                {prompt.question}
              </label>
              <div className="relative">
                <textarea
                  id={`answer-${prompt.id}`}
                  ref={index === 0 ? firstInputRef : undefined}
                  {...(index === 0 ? {} : register(`${prompt.id}.answer`))}
                  rows={4}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  aria-invalid={!!errors[prompt.id]?.answer}
                  aria-describedby={
                    errors[prompt.id]?.answer
                      ? `answer-${prompt.id}-error`
                      : undefined
                  }
                  placeholder="Type your answer here..."
                />
                <div 
                  className="absolute bottom-2 right-2 text-sm text-gray-500"
                  aria-live="polite"
                >
                  {watch(`${prompt.id}.answer`)?.length || 0}/1000
                </div>
              </div>
              {errors[prompt.id]?.answer && (
                <p
                  id={`answer-${prompt.id}-error`}
                  className="mt-1 text-sm text-red-600"
                  role="alert"
                >
                  {errors[prompt.id]?.answer?.message}
                </p>
              )}
            </motion.div>
          ))}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-indigo-600 text-white rounded-full text-lg font-semibold shadow hover:bg-indigo-700 transition-all disabled:bg-indigo-400"
            >
              {isSubmitting ? 'Saving...' : 'Save Answers'}
            </button>
          </div>
        </form>
      </div>
    </ErrorBoundary>
  );
};

// Sample questions - in a real app, these would come from Firestore
const QUESTIONS_BY_CATEGORY: Record<string, StoryPrompt[]> = {
  professional: [
    {
      id: 'prof-1',
      category: 'professional',
      question: 'What inspired you to pursue your current career path?',
    },
    {
      id: 'prof-2',
      category: 'professional',
      question: 'What has been your most significant professional achievement?',
    },
  ],
  academic: [
    {
      id: 'acad-1',
      category: 'academic',
      question: 'What was your favorite class and why?',
    },
    {
      id: 'acad-2',
      category: 'academic',
      question: 'How did your academic experience shape your future?',
    },
  ],
  philosophical: [
    {
      id: 'phil-1',
      category: 'philosophical',
      question: 'What life lesson has had the biggest impact on you?',
    },
    {
      id: 'phil-2',
      category: 'philosophical',
      question: 'What do you believe is the key to success?',
    },
  ],
  personal: [
    {
      id: 'pers-1',
      category: 'personal',
      question: 'What is your favorite memory from your time here?',
    },
    {
      id: 'pers-2',
      category: 'personal',
      question: 'How have you grown as a person since graduating?',
    },
  ],
  fun: [
    {
      id: 'fun-1',
      category: 'fun',
      question: 'What was your favorite spot on campus?',
    },
    {
      id: 'fun-2',
      category: 'fun',
      question: "What's the most interesting thing you've done since graduation?",
    },
  ],
}; 