'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { StoryPromptPage } from '../../components/story-prompts/StoryPromptPage';
import { RootLayout } from '@/components/layout/RootLayout';

export default function YourStory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', 'personal', 'family', 'career', 'hobbies'];

  return (
    <RootLayout>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search questions..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex space-x-2 mb-6">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-4 py-2 rounded-full ${
                  selectedCategory === category
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          <StoryPromptPage
            onUpdate={async (answers) => {
              // This is a placeholder - in a real app, this would be connected to your data store
              console.log('Answers updated:', answers);
            }}
          />
        </div>
      </div>
    </RootLayout>
  );
} 