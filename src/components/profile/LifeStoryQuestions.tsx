import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface Question {
  id: string;
  text: string;
  category: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  questions: Question[];
}

const CATEGORIES: Category[] = [
  {
    id: 'early-life',
    name: 'Early Life',
    description: 'Share memories from childhood and formative years',
    questions: [
      { id: 'el-1', text: 'What are your earliest childhood memories?', category: 'early-life' },
      { id: 'el-2', text: 'How would you describe your family life growing up?', category: 'early-life' },
      { id: 'el-3', text: 'What were your favorite activities as a child?', category: 'early-life' },
    ],
  },
  {
    id: 'education',
    name: 'Education',
    description: 'Academic journey and learning experiences',
    questions: [
      { id: 'ed-1', text: 'What was your favorite subject in school and why?', category: 'education' },
      { id: 'ed-2', text: 'Who was your most influential teacher?', category: 'education' },
      { id: 'ed-3', text: 'What was your biggest academic achievement?', category: 'education' },
    ],
  },
  {
    id: 'career',
    name: 'Career',
    description: 'Professional life and achievements',
    questions: [
      { id: 'ca-1', text: 'What inspired you to choose your career path?', category: 'career' },
      { id: 'ca-2', text: 'What was your proudest professional moment?', category: 'career' },
      { id: 'ca-3', text: 'What challenges did you overcome in your career?', category: 'career' },
    ],
  },
  {
    id: 'family',
    name: 'Family',
    description: 'Family life and relationships',
    questions: [
      { id: 'fa-1', text: 'How has your family shaped who you are today?', category: 'family' },
      { id: 'fa-2', text: 'What family traditions are most meaningful to you?', category: 'family' },
      { id: 'fa-3', text: 'What advice would you give to future generations?', category: 'family' },
    ],
  },
  {
    id: 'life-lessons',
    name: 'Life Lessons',
    description: 'Wisdom gained through experience',
    questions: [
      { id: 'll-1', text: 'What is the most important lesson life has taught you?', category: 'life-lessons' },
      { id: 'll-2', text: 'What would you do differently if you could?', category: 'life-lessons' },
      { id: 'll-3', text: 'What advice would you give your younger self?', category: 'life-lessons' },
    ],
  },
];

interface LifeStoryQuestionsProps {
  onAnswersChange: (answers: Record<string, string>) => void;
  initialAnswers?: Record<string, string>;
}

export function LifeStoryQuestions({ onAnswersChange, initialAnswers = {} }: LifeStoryQuestionsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setIsDropdownOpen(false);
  };

  const handleQuestionSelect = (questionId: string) => {
    setSelectedQuestions(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      }
      return [...prev, questionId];
    });
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
    onAnswersChange(newAnswers);
  };

  const removeQuestion = (questionId: string) => {
    setSelectedQuestions(prev => prev.filter(id => id !== questionId));
    const newAnswers = { ...answers };
    delete newAnswers[questionId];
    setAnswers(newAnswers);
    onAnswersChange(newAnswers);
  };

  const selectedCategoryData = CATEGORIES.find(cat => cat.id === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Category Dropdown */}
      <div className="relative">
        <Button
          variant="outline"
          className="w-full justify-between text-left"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <span className="flex items-center gap-2">
            <Icon name="book" className="w-4 h-4" />
            {selectedCategoryData ? selectedCategoryData.name : 'Select a category'}
          </span>
          <Icon
            name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
            className="w-4 h-4"
          />
        </Button>

        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200"
            >
              <div className="py-2">
                {CATEGORIES.map(category => (
                  <button
                    key={category.id}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-start gap-3"
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{category.name}</div>
                      <div className="text-sm text-gray-500">{category.description}</div>
                    </div>
                    {selectedCategory === category.id && (
                      <Icon name="check" className="w-5 h-5 text-indigo-600" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected Category Questions */}
      {selectedCategoryData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex flex-wrap gap-2">
            {selectedCategoryData.questions.map(question => (
              <Badge
                key={question.id}
                variant={selectedQuestions.includes(question.id) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => handleQuestionSelect(question.id)}
              >
                {question.text}
                {selectedQuestions.includes(question.id) && (
                  <Icon name="check" className="w-3 h-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>
        </motion.div>
      )}

      {/* Selected Questions and Answers */}
      <div className="space-y-4">
        {selectedQuestions.map(questionId => {
          const question = CATEGORIES.flatMap(cat => cat.questions)
            .find(q => q.id === questionId);
          
          if (!question) return null;

          return (
            <motion.div
              key={questionId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{question.text}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(questionId)}
                  >
                    <Icon name="x" className="w-4 h-4" />
                  </Button>
                </div>
                <Textarea
                  value={answers[questionId] || ''}
                  onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                  placeholder="Write your answer here..."
                  rows={4}
                  className="w-full"
                />
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
} 