import { Timestamp } from 'firebase/firestore';

export type QuestionCategory = 
  | 'academic'
  | 'professional'
  | 'personal'
  | 'philosophical'
  | 'cultural'
  | 'social'
  | 'creative'
  | 'leadership';

export interface QuestionCategorySelection {
  categoryId: QuestionCategory;
  selectedAt: Timestamp;
}

export interface CategoryMetadata {
  id: QuestionCategory;
  label: string;
  description: string;
  icon: string;
}

export interface StoryQuestion {
  id: string;
  categoryId: QuestionCategory;
  text: string;
  placeholder?: string;
  maxLength?: number;
}

export interface StoryAnswer {
  questionId: string;
  response: string;
  savedAt: Timestamp;
}

export const CATEGORIES: CategoryMetadata[] = [
  {
    id: 'academic',
    label: 'Academic',
    description: 'Questions about educational experiences, learning, and academic achievements',
    icon: 'school',
  },
  {
    id: 'professional',
    label: 'Professional',
    description: 'Questions about career development, work experiences, and professional growth',
    icon: 'work',
  },
  {
    id: 'personal',
    label: 'Personal',
    description: 'Questions about personal growth, values, and life experiences',
    icon: 'person',
  },
  {
    id: 'philosophical',
    label: 'Philosophical',
    description: 'Questions about beliefs, perspectives, and thought processes',
    icon: 'psychology',
  },
  {
    id: 'cultural',
    label: 'Cultural',
    description: 'Questions about cultural experiences, diversity, and heritage',
    icon: 'public',
  },
  {
    id: 'social',
    label: 'Social',
    description: 'Questions about relationships, community, and social impact',
    icon: 'groups',
  },
  {
    id: 'creative',
    label: 'Creative',
    description: 'Questions about artistic expression, innovation, and creativity',
    icon: 'palette',
  },
  {
    id: 'leadership',
    label: 'Leadership',
    description: 'Questions about leadership experiences, decision-making, and influence',
    icon: 'star',
  },
];

export const STORY_QUESTIONS: Record<QuestionCategory, StoryQuestion[]> = {
  academic: [
    {
      id: 'academic-1',
      categoryId: 'academic',
      text: 'What was your most memorable learning experience during your academic journey?',
      placeholder: 'Share a specific moment that shaped your educational path...',
      maxLength: 2000,
    },
    {
      id: 'academic-2',
      categoryId: 'academic',
      text: 'How did your academic experiences influence your career choices?',
      placeholder: 'Describe the connection between your education and professional path...',
      maxLength: 2000,
    },
    {
      id: 'academic-3',
      categoryId: 'academic',
      text: 'What academic achievement are you most proud of and why?',
      placeholder: 'Share the story behind your proudest academic accomplishment...',
      maxLength: 2000,
    },
  ],
  professional: [
    {
      id: 'professional-1',
      categoryId: 'professional',
      text: 'What was the most significant challenge you faced in your career and how did you overcome it?',
      placeholder: 'Describe the challenge and your approach to solving it...',
      maxLength: 2000,
    },
    {
      id: 'professional-2',
      categoryId: 'professional',
      text: 'How has your professional journey evolved over time?',
      placeholder: 'Share the key milestones and turning points in your career...',
      maxLength: 2000,
    },
    {
      id: 'professional-3',
      categoryId: 'professional',
      text: 'What advice would you give to someone starting in your field?',
      placeholder: 'Share your insights and lessons learned...',
      maxLength: 2000,
    },
  ],
  personal: [
    {
      id: 'personal-1',
      categoryId: 'personal',
      text: 'What personal values have guided your life decisions?',
      placeholder: 'Share how your values have shaped your choices...',
      maxLength: 2000,
    },
    {
      id: 'personal-2',
      categoryId: 'personal',
      text: 'What has been your biggest personal growth experience?',
      placeholder: 'Describe the experience and what you learned from it...',
      maxLength: 2000,
    },
    {
      id: 'personal-3',
      categoryId: 'personal',
      text: 'How do you maintain work-life balance?',
      placeholder: 'Share your approach to managing different aspects of life...',
      maxLength: 2000,
    },
  ],
  philosophical: [
    {
      id: 'philosophical-1',
      categoryId: 'philosophical',
      text: 'What life philosophy guides your decisions?',
      placeholder: 'Share your core beliefs and how they influence your choices...',
      maxLength: 2000,
    },
    {
      id: 'philosophical-2',
      categoryId: 'philosophical',
      text: 'How has your perspective on life changed over time?',
      placeholder: 'Describe the evolution of your worldview...',
      maxLength: 2000,
    },
    {
      id: 'philosophical-3',
      categoryId: 'philosophical',
      text: 'What gives your life meaning and purpose?',
      placeholder: 'Share what drives and motivates you...',
      maxLength: 2000,
    },
  ],
  cultural: [
    {
      id: 'cultural-1',
      categoryId: 'cultural',
      text: 'How has your cultural background influenced your life?',
      placeholder: 'Share the impact of your cultural heritage...',
      maxLength: 2000,
    },
    {
      id: 'cultural-2',
      categoryId: 'cultural',
      text: 'What cultural experiences have shaped your worldview?',
      placeholder: 'Describe significant cultural encounters...',
      maxLength: 2000,
    },
    {
      id: 'cultural-3',
      categoryId: 'cultural',
      text: 'How do you celebrate and preserve your cultural heritage?',
      placeholder: 'Share your traditions and practices...',
      maxLength: 2000,
    },
  ],
  social: [
    {
      id: 'social-1',
      categoryId: 'social',
      text: 'How have your relationships influenced your personal growth?',
      placeholder: 'Share the impact of important relationships...',
      maxLength: 2000,
    },
    {
      id: 'social-2',
      categoryId: 'social',
      text: 'What role does community play in your life?',
      placeholder: 'Describe your community involvement...',
      maxLength: 2000,
    },
    {
      id: 'social-3',
      categoryId: 'social',
      text: 'How do you contribute to your community?',
      placeholder: 'Share your community service and impact...',
      maxLength: 2000,
    },
  ],
  creative: [
    {
      id: 'creative-1',
      categoryId: 'creative',
      text: 'How do you express your creativity?',
      placeholder: 'Share your creative outlets and expressions...',
      maxLength: 2000,
    },
    {
      id: 'creative-2',
      categoryId: 'creative',
      text: 'What inspires your creative work?',
      placeholder: 'Describe your sources of inspiration...',
      maxLength: 2000,
    },
    {
      id: 'creative-3',
      categoryId: 'creative',
      text: 'How has creativity influenced your problem-solving approach?',
      placeholder: 'Share how creativity shapes your solutions...',
      maxLength: 2000,
    },
  ],
  leadership: [
    {
      id: 'leadership-1',
      categoryId: 'leadership',
      text: 'What leadership challenges have you faced and how did you handle them?',
      placeholder: 'Share your leadership experiences and lessons...',
      maxLength: 2000,
    },
    {
      id: 'leadership-2',
      categoryId: 'leadership',
      text: 'How do you approach decision-making in leadership roles?',
      placeholder: 'Describe your leadership decision process...',
      maxLength: 2000,
    },
    {
      id: 'leadership-3',
      categoryId: 'leadership',
      text: 'What leadership qualities do you value most?',
      placeholder: 'Share your perspective on effective leadership...',
      maxLength: 2000,
    },
  ],
}; 