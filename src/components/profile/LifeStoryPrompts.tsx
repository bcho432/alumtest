"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/hooks/useToast';
import debounce from 'lodash/debounce';

interface Prompt {
  id: string;
  question: string;
  placeholder: string;
  maxLength?: number;
}

interface Category {
  id: string;
  title: string;
  icon: string;
  description: string;
  prompts: Prompt[];
}

const categories: Category[] = [
  {
    id: 'professional',
    title: 'Professional Journey',
    icon: 'briefcase',
    description: 'Share your career path, achievements, and work experiences',
    prompts: [
      {
        id: 'first-job',
        question: 'What was your first job and what did you learn from it?',
        placeholder: 'Share your early work experience and the lessons it taught you...',
        maxLength: 500,
      },
      {
        id: 'career-challenge',
        question: 'Describe a career challenge that shaped who you are today',
        placeholder: 'Tell us about a difficult situation at work and how it changed you...',
        maxLength: 500,
      },
      {
        id: 'proud-achievement',
        question: 'What professional achievement are you most proud of?',
        placeholder: 'Share the accomplishment that means the most to you...',
        maxLength: 500,
      },
    ],
  },
  {
    id: 'personal',
    title: 'Personal Growth',
    icon: 'user',
    description: 'Reflect on your personal development and life lessons',
    prompts: [
      {
        id: 'personal-challenge',
        question: 'What\'s a personal challenge you\'ve overcome?',
        placeholder: 'Share a difficult time in your life and how you grew from it...',
        maxLength: 500,
      },
      {
        id: 'changing-goals',
        question: 'How have your goals changed over the years?',
        placeholder: 'Describe how your aspirations have evolved...',
        maxLength: 500,
      },
      {
        id: 'self-discovery',
        question: 'What\'s something you\'ve learned about yourself recently?',
        placeholder: 'Share a recent insight or realization about yourself...',
        maxLength: 500,
      },
    ],
  },
  {
    id: 'family',
    title: 'Family & Relationships',
    icon: 'users',
    description: 'Share stories about your family and important relationships',
    prompts: [
      {
        id: 'family-tradition',
        question: 'What\'s a family tradition that\'s important to you?',
        placeholder: 'Describe a special custom or ritual in your family...',
        maxLength: 500,
      },
      {
        id: 'relationship-lesson',
        question: 'What\'s the most important lesson you\'ve learned about relationships?',
        placeholder: 'Share wisdom gained from your relationships...',
        maxLength: 500,
      },
      {
        id: 'family-moment',
        question: 'What\'s your favorite memory with your family?',
        placeholder: 'Describe a special moment you shared with your family...',
        maxLength: 500,
      },
    ],
  },
  {
    id: 'milestones',
    title: 'Life Milestones',
    icon: 'flag',
    description: 'Share significant moments and achievements in your life',
    prompts: [
      {
        id: 'biggest-change',
        question: 'What was the biggest change you\'ve experienced in life?',
        placeholder: 'Describe a major transition and how it affected you...',
        maxLength: 500,
      },
      {
        id: 'defining-moment',
        question: 'What moment defined who you are today?',
        placeholder: 'Share a pivotal experience that shaped your character...',
        maxLength: 500,
      },
      {
        id: 'future-goals',
        question: 'What are your hopes for the future?',
        placeholder: 'Share your dreams and aspirations...',
        maxLength: 500,
      },
    ],
  },
  {
    id: 'values',
    title: 'Values & Beliefs',
    icon: 'heart',
    description: 'Share what matters most to you and your core beliefs',
    prompts: [
      {
        id: 'core-values',
        question: 'What values are most important to you?',
        placeholder: 'Share the principles that guide your life...',
        maxLength: 500,
      },
      {
        id: 'life-philosophy',
        question: 'What\'s your personal philosophy on life?',
        placeholder: 'Describe your approach to living a meaningful life...',
        maxLength: 500,
      },
      {
        id: 'beliefs',
        question: 'What beliefs have shaped your worldview?',
        placeholder: 'Share the ideas and convictions that influence your perspective...',
        maxLength: 500,
      },
    ],
  },
  {
    id: 'hobbies',
    title: 'Hobbies & Passions',
    icon: 'star',
    description: 'Share what brings you joy and how you spend your free time',
    prompts: [
      {
        id: 'favorite-hobby',
        question: 'What\'s your favorite hobby and why do you love it?',
        placeholder: 'Describe what you enjoy doing in your free time...',
        maxLength: 500,
      },
      {
        id: 'passion-project',
        question: 'What project or activity are you most passionate about?',
        placeholder: 'Share what excites and motivates you...',
        maxLength: 500,
      },
      {
        id: 'skill-learning',
        question: 'What skill are you currently trying to learn?',
        placeholder: 'Tell us about something new you\'re working on...',
        maxLength: 500,
      },
    ],
  },
  {
    id: 'travel',
    title: 'Travel & Adventures',
    icon: 'map',
    description: 'Share your travel experiences and adventures',
    prompts: [
      {
        id: 'favorite-trip',
        question: 'What\'s your favorite travel memory?',
        placeholder: 'Share a special moment from your travels...',
        maxLength: 500,
      },
      {
        id: 'dream-destination',
        question: 'Where would you love to visit and why?',
        placeholder: 'Describe your dream destination...',
        maxLength: 500,
      },
      {
        id: 'travel-lesson',
        question: 'What\'s the most important lesson you\'ve learned while traveling?',
        placeholder: 'Share wisdom gained from your adventures...',
        maxLength: 500,
      },
    ],
  },
  {
    id: 'lessons',
    title: 'Life Lessons',
    icon: 'book',
    description: 'Share the wisdom you\'ve gained through experience',
    prompts: [
      {
        id: 'biggest-mistake',
        question: 'What\'s the biggest mistake you\'ve learned from?',
        placeholder: 'Share a lesson learned from a difficult experience...',
        maxLength: 500,
      },
      {
        id: 'advice',
        question: 'What advice would you give to your younger self?',
        placeholder: 'Share wisdom you wish you had known earlier...',
        maxLength: 500,
      },
      {
        id: 'life-changing',
        question: 'What\'s something that changed your perspective on life?',
        placeholder: 'Describe an experience that shifted your worldview...',
        maxLength: 500,
      },
    ],
  },
];

interface LifeStoryPromptsProps {
  onSave: (responses: Record<string, string>) => Promise<void>;
  initialResponses?: Record<string, string>;
  isSubmitting?: boolean;
}

export const LifeStoryPrompts: React.FC<LifeStoryPromptsProps> = ({
  onSave,
  initialResponses = {},
  isSubmitting = false,
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { showToast } = useToast();

  // Initialize responses from props
  useEffect(() => {
    if (initialResponses) {
      setResponses(initialResponses);
    }
  }, [initialResponses]);

  // Validate responses
  const validateResponses = useCallback((responses: Record<string, string>) => {
    const newErrors: Record<string, string> = {};
    
    categories.forEach(category => {
      category.prompts.forEach(prompt => {
        const response = responses[prompt.id];
        if (prompt.maxLength && response?.length > prompt.maxLength) {
          newErrors[prompt.id] = `Response exceeds maximum length of ${prompt.maxLength} characters`;
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, []);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (responses: Record<string, string>) => {
      if (!validateResponses(responses)) {
        return;
      }

      try {
        setIsSaving(true);
        await onSave(responses);
        setHasUnsavedChanges(false);
        showToast({
          title: 'Success',
          description: 'Your responses have been saved',
          status: 'success',
        });
      } catch (error) {
        showToast({
          title: 'Error',
          description: 'Failed to save responses. Please try again.',
          status: 'error',
        });
      } finally {
        setIsSaving(false);
      }
    }, 1000),
    [onSave, validateResponses, showToast]
  );

  const handleResponseChange = (promptId: string, value: string) => {
    setResponses(prev => {
      const newResponses = {
        ...prev,
        [promptId]: value,
      };
      setHasUnsavedChanges(true);
      debouncedSave(newResponses);
      return newResponses;
    });
  };

  const handleSave = async () => {
    if (!validateResponses(responses)) {
      showToast({
        title: 'Validation Error',
        description: 'Please fix the errors before saving',
        status: 'error',
      });
      return;
    }

    try {
      setIsSaving(true);
      await onSave(responses);
      setHasUnsavedChanges(false);
      showToast({
        title: 'Success',
        description: 'Your responses have been saved',
        status: 'success',
      });
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to save responses. Please try again.',
        status: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Life Story</h2>
        <Button
          onClick={handleSave}
          disabled={isSubmitting || isSaving || !hasUnsavedChanges}
        >
          {isSaving ? (
            <>
              <Icon name="spinner" className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Responses'
          )}
        </Button>
      </div>

      <div className="space-y-4">
        {categories.map((category) => (
          <Card key={category.id} className="overflow-hidden">
            <button
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedCategory(
                expandedCategory === category.id ? null : category.id
              )}
            >
              <div className="flex items-center space-x-3">
                <Icon name={category.icon} className="w-5 h-5 text-gray-500" />
                <div className="text-left">
                  <h3 className="text-lg font-medium">{category.title}</h3>
                  <p className="text-sm text-gray-500">{category.description}</p>
                </div>
              </div>
              <Icon
                name={expandedCategory === category.id ? 'chevron-up' : 'chevron-down'}
                className="w-5 h-5 text-gray-500"
              />
            </button>

            <AnimatePresence>
              {expandedCategory === category.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 space-y-4 border-t">
                    {category.prompts.map((prompt) => {
                      const response = responses[prompt.id] || '';
                      const isNearLimit = prompt.maxLength && response.length > prompt.maxLength * 0.9;
                      const isOverLimit = prompt.maxLength && response.length > prompt.maxLength;
                      
                      return (
                        <div key={prompt.id} className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {prompt.question}
                          </label>
                          <Textarea
                            value={response}
                            onChange={(e) => handleResponseChange(prompt.id, e.target.value)}
                            placeholder={prompt.placeholder}
                            rows={3}
                            maxLength={prompt.maxLength}
                            className={isOverLimit ? 'border-red-500' : isNearLimit ? 'border-yellow-500' : ''}
                          />
                          {prompt.maxLength && (
                            <p className={`text-sm text-right ${
                              isOverLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-500' : 'text-gray-500'
                            }`}>
                              {response.length}/{prompt.maxLength} characters
                            </p>
                          )}
                          {errors[prompt.id] && (
                            <p className="text-sm text-red-500">{errors[prompt.id]}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        ))}
      </div>
    </div>
  );
}; 