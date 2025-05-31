import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { z } from 'zod';

interface Question {
  id: string;
  text: string;
  category: string;
  placeholder?: string;
}

const QUESTIONS: Question[] = [
  // Career & Work
  {
    id: 'career-1',
    text: 'What was your first job and what did you learn from it?',
    category: 'Career & Work',
    placeholder: 'Share your early work experiences and the lessons they taught you...'
  },
  {
    id: 'career-2',
    text: 'What was your proudest professional achievement?',
    category: 'Career & Work',
    placeholder: 'Describe a moment in your career that made you feel proud...'
  },
  {
    id: 'career-3',
    text: 'How did you choose your career path?',
    category: 'Career & Work',
    placeholder: 'Share the story of how you found your calling...'
  },

  // Family & Relationships
  {
    id: 'family-1',
    text: 'What are your earliest memories of your family?',
    category: 'Family & Relationships',
    placeholder: 'Share your first memories of family life...'
  },
  {
    id: 'family-2',
    text: 'How did you meet your significant other?',
    category: 'Family & Relationships',
    placeholder: 'Tell the story of how you met...'
  },
  {
    id: 'family-3',
    text: 'What family traditions are most meaningful to you?',
    category: 'Family & Relationships',
    placeholder: 'Describe the traditions that bring your family together...'
  },

  // Life Lessons
  {
    id: 'lessons-1',
    text: 'What is the most important lesson life has taught you?',
    category: 'Life Lessons',
    placeholder: 'Share a valuable lesson you\'ve learned...'
  },
  {
    id: 'lessons-2',
    text: 'What advice would you give to your younger self?',
    category: 'Life Lessons',
    placeholder: 'What wisdom would you share with your past self?'
  },
  {
    id: 'lessons-3',
    text: 'What has been your biggest challenge and how did you overcome it?',
    category: 'Life Lessons',
    placeholder: 'Share a significant challenge and how you grew from it...'
  },

  // Personal Growth
  {
    id: 'growth-1',
    text: 'How have your values and beliefs evolved over time?',
    category: 'Personal Growth',
    placeholder: 'Describe how your perspective has changed...'
  },
  {
    id: 'growth-2',
    text: 'What are your hopes and dreams for the future?',
    category: 'Personal Growth',
    placeholder: 'Share your aspirations and goals...'
  },
  {
    id: 'growth-3',
    text: 'What makes you feel most fulfilled?',
    category: 'Personal Growth',
    placeholder: 'Describe what brings you joy and satisfaction...'
  }
];

const responseSchema = z.record(z.string());

interface LifeStoryPromptsProps {
  onResponsesChange: (responses: Record<string, string>) => void;
  initialResponses?: Record<string, string>;
}

export const LifeStoryPrompts: React.FC<LifeStoryPromptsProps> = ({ 
  onResponsesChange,
  initialResponses = {}
}) => {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [responses, setResponses] = useState<Record<string, string>>(initialResponses);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastSavedRef = useRef<Record<string, string>>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

  // Memoize categories to prevent unnecessary recalculations
  const categories = useMemo(() => 
    Array.from(new Set(QUESTIONS.map(q => q.category))),
    []
  );

  // Validate responses before saving
  const validateResponses = useCallback((newResponses: Record<string, string>) => {
    try {
      responseSchema.parse(newResponses);
      return true;
    } catch (err) {
      console.error('Invalid response format:', err);
      return false;
    }
  }, []);

  // Debounced auto-save with retry mechanism
  const debouncedSave = useDebounce(async (newResponses: Record<string, string>) => {
    if (!validateResponses(newResponses)) {
      setError('Invalid response format. Please try again.');
      return;
    }

    if (JSON.stringify(newResponses) === JSON.stringify(lastSavedRef.current)) {
      return;
    }

    setIsSaving(true);
    try {
      await onResponsesChange(newResponses);
      lastSavedRef.current = newResponses;
      setIsDirty(false);
      retryCountRef.current = 0;
    } catch (err) {
      console.error('Auto-save failed:', err);
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current += 1;
        saveTimeoutRef.current = setTimeout(() => {
          debouncedSave(newResponses);
        }, 1000 * retryCountRef.current);
      } else {
        setError('Failed to auto-save. Please try saving manually.');
        showToast({
          title: 'Error',
          description: 'Failed to auto-save. Please try saving manually.',
          status: 'error',
        });
      }
    } finally {
      setIsSaving(false);
    }
  }, 1000);

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Navigation guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleQuestionSelect = useCallback((questionId: string) => {
    try {
      const newSelectedQuestions = new Set(selectedQuestions);
      if (newSelectedQuestions.has(questionId)) {
        newSelectedQuestions.delete(questionId);
        const newResponses = { ...responses };
        delete newResponses[questionId];
        setResponses(newResponses);
        setIsDirty(true);
        debouncedSave(newResponses);
      } else {
        newSelectedQuestions.add(questionId);
      }
      setSelectedQuestions(newSelectedQuestions);
      setError(null);
    } catch (err) {
      setError('Failed to update question selection. Please try again.');
      showToast({
        title: 'Error',
        description: 'Failed to update question selection. Please try again.',
        status: 'error',
      });
    }
  }, [selectedQuestions, responses, debouncedSave, showToast]);

  const handleResponseChange = useCallback((questionId: string, response: string) => {
    try {
      const newResponses = { ...responses, [questionId]: response };
      setResponses(newResponses);
      setIsDirty(true);
      debouncedSave(newResponses);
      setError(null);
    } catch (err) {
      setError('Failed to save your response. Please try again.');
      showToast({
        title: 'Error',
        description: 'Failed to save your response. Please try again.',
        status: 'error',
      });
    }
  }, [responses, debouncedSave, showToast]);

  const selectedQuestionsList = useMemo(() => 
    QUESTIONS.filter(q => selectedQuestions.has(q.id)),
    [selectedQuestions]
  );

  return (
    <div className="space-y-6" role="region" aria-label="Life Story Prompts">
      {error && (
        <div 
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" 
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Dropdown Button */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label="Select a category"
        >
          <span className="text-gray-700">
            {selectedCategory || 'Select a category'}
          </span>
          <ChevronDownIcon 
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200"
              role="listbox"
            >
              <div className="p-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-indigo-50 rounded-md transition-colors duration-200"
                    role="option"
                    aria-selected={selectedCategory === category}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Questions List */}
      {selectedCategory && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
          role="list"
          aria-label={`Questions for ${selectedCategory}`}
        >
          {QUESTIONS.filter(q => q.category === selectedCategory).map(question => (
            <div
              key={question.id}
              className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors duration-200"
              role="listitem"
            >
              <input
                type="checkbox"
                checked={selectedQuestions.has(question.id)}
                onChange={() => handleQuestionSelect(question.id)}
                className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                aria-label={`Select ${question.text}`}
              />
              <div className="flex-1">
                <p className="text-gray-900 font-medium">{question.text}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Selected Questions and Responses */}
      <div className="space-y-6" role="list" aria-label="Selected questions and responses">
        {selectedQuestionsList.map(question => (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg border border-gray-200 p-4"
            role="listitem"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">{question.text}</h3>
              <button
                onClick={() => handleQuestionSelect(question.id)}
                className="text-gray-400 hover:text-gray-500"
                aria-label={`Remove ${question.text}`}
              >
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <textarea
              value={responses[question.id] || ''}
              onChange={(e) => handleResponseChange(question.id, e.target.value)}
              placeholder={question.placeholder}
              className="w-full h-32 px-3 py-2 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              aria-label={`Response for ${question.text}`}
            />
          </motion.div>
        ))}
      </div>

      {/* Auto-save indicator */}
      {isSaving && (
        <div className="text-sm text-gray-500 text-right">
          Saving...
        </div>
      )}
    </div>
  );
}; 