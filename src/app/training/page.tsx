'use client';

import { useState } from 'react';
import { usePublishedContent } from '@/hooks/usePublishedContent';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { Header } from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useDebounce } from '@/hooks/useDebounce';

const CATEGORIES = [
  'Platform Features',
  'Getting Started',
  'User Management',
  'Content Management',
  'Analytics',
  'Integrations',
  'Security',
  'Troubleshooting',
  'Best Practices',
  'Updates'
];

export default function TrainingPage() {
  const { data: trainingContent = [], isLoading } = usePublishedContent('training');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredContent = trainingContent.filter(content => {
    const matchesSearch = content.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                         content.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || content.category === selectedCategory;
    const matchesPriority = !selectedPriority || content.priority === selectedPriority;
    return matchesSearch && matchesCategory && matchesPriority;
  });

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
        <div className="container mx-auto px-4 py-12">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-4">
              Training Resources
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Access our comprehensive training materials to help you make the most of Storiats.
            </p>
          </div>

          {/* Filters */}
          <div className="grid gap-4 mb-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search training materials..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10"
                />
                <Icon name="search" className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
            <Select
              value={selectedCategory}
              onChange={setSelectedCategory}
              className="w-full"
              options={[
                { value: '', label: 'All Categories' },
                ...CATEGORIES.map(category => ({
                  value: category,
                  label: category
                }))
              ]}
            />
            <Select
              value={selectedPriority}
              onChange={setSelectedPriority}
              className="w-full"
              options={[
                { value: '', label: 'All Priorities' },
                { value: 'low', label: 'Low Priority' },
                { value: 'medium', label: 'Medium Priority' },
                { value: 'high', label: 'High Priority' }
              ]}
            />
          </div>

          {/* Content Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner size="lg" />
            </div>
          ) : filteredContent.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="document" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No training materials found</h3>
              <p className="text-gray-500">
                {searchTerm || selectedCategory || selectedPriority
                  ? 'Try adjusting your search or filters'
                  : 'No training materials available at the moment'}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredContent.map(content => (
                <Card key={content.id} className="h-full">
                  <div className="p-6">
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge
                        variant="secondary"
                        className="bg-purple-100 text-purple-800"
                      >
                        {content.category}
                      </Badge>
                      {content.priority && (
                        <Badge
                          variant="secondary"
                          className={
                            content.priority === 'high'
                              ? 'bg-red-100 text-red-800'
                              : content.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }
                        >
                          {content.priority} priority
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{content.title}</h3>
                    <p className="text-gray-600 mb-4">{content.description}</p>
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content.content }} />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
} 