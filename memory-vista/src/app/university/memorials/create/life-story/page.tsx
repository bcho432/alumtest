'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { updateMemorialLifeStory, getMemorial, MemorialLifeStory } from '@/services/memorials';

export default function LifeStoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const memorialId = searchParams.get('memorialId');
  const [formData, setFormData] = useState<MemorialLifeStory>({
    education: '',
    notableAchievements: '',
    jobs: '',
    majorLifeEvents: '',
    hobbies: '',
    personalStories: '',
    memorableQuotes: '',
    values: '',
    communityInvolvement: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if not authenticated or no memorialId
  if (!user || !memorialId) {
    router.push('/university');
    return null;
  }

  useEffect(() => {
    const loadMemorial = async () => {
      try {
        const memorial = await getMemorial(memorialId);
        if (memorial.lifeStory) {
          setFormData(memorial.lifeStory);
        }
      } catch (err) {
        setError('Failed to load memorial data');
      }
    };

    loadMemorial();
  }, [memorialId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await updateMemorialLifeStory(memorialId, formData);
      router.push(`/university/memorials/create/photos?memorialId=${memorialId}`);
    } catch (err) {
      setError('Failed to save life story. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="text-indigo-600">
              <div className="w-8 h-8 mx-auto rounded-full border-2 flex items-center justify-center">
                1
              </div>
              <p className="text-xs mt-1 text-center">Basic Info</p>
            </div>
            <div className="text-indigo-600">
              <div className="w-8 h-8 mx-auto rounded-full border-2 flex items-center justify-center">
                2
              </div>
              <p className="text-xs mt-1 text-center">Life Story</p>
            </div>
            <div className="text-gray-400">
              <div className="w-8 h-8 mx-auto rounded-full border-2 flex items-center justify-center">
                3
              </div>
              <p className="text-xs mt-1 text-center">Photos</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              Life Story
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Share the story of their life. All fields are optional.</p>
            </div>

            {error && (
              <div className="mt-4 rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-6">
              <div>
                <label htmlFor="education" className="block text-sm font-medium text-gray-700">
                  Education
                </label>
                <div className="mt-1">
                  <textarea
                    name="education"
                    id="education"
                    rows={3}
                    value={formData.education}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Share their educational journey..."
                  />
                </div>
              </div>

              <div>
                <label htmlFor="notableAchievements" className="block text-sm font-medium text-gray-700">
                  Notable Achievements
                </label>
                <div className="mt-1">
                  <textarea
                    name="notableAchievements"
                    id="notableAchievements"
                    rows={3}
                    value={formData.notableAchievements}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Share their significant accomplishments..."
                  />
                </div>
              </div>

              <div>
                <label htmlFor="jobs" className="block text-sm font-medium text-gray-700">
                  Professional Life
                </label>
                <div className="mt-1">
                  <textarea
                    name="jobs"
                    id="jobs"
                    rows={3}
                    value={formData.jobs}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Share their career and work history..."
                  />
                </div>
              </div>

              <div>
                <label htmlFor="majorLifeEvents" className="block text-sm font-medium text-gray-700">
                  Major Life Events
                </label>
                <div className="mt-1">
                  <textarea
                    name="majorLifeEvents"
                    id="majorLifeEvents"
                    rows={3}
                    value={formData.majorLifeEvents}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Share significant moments in their life..."
                  />
                </div>
              </div>

              <div>
                <label htmlFor="hobbies" className="block text-sm font-medium text-gray-700">
                  Hobbies & Interests
                </label>
                <div className="mt-1">
                  <textarea
                    name="hobbies"
                    id="hobbies"
                    rows={3}
                    value={formData.hobbies}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Share their passions and interests..."
                  />
                </div>
              </div>

              <div>
                <label htmlFor="personalStories" className="block text-sm font-medium text-gray-700">
                  Personal Stories
                </label>
                <div className="mt-1">
                  <textarea
                    name="personalStories"
                    id="personalStories"
                    rows={3}
                    value={formData.personalStories}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Share memorable stories and anecdotes..."
                  />
                </div>
              </div>

              <div>
                <label htmlFor="memorableQuotes" className="block text-sm font-medium text-gray-700">
                  Memorable Quotes
                </label>
                <div className="mt-1">
                  <textarea
                    name="memorableQuotes"
                    id="memorableQuotes"
                    rows={3}
                    value={formData.memorableQuotes}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Share their favorite sayings or quotes..."
                  />
                </div>
              </div>

              <div>
                <label htmlFor="values" className="block text-sm font-medium text-gray-700">
                  Values & Beliefs
                </label>
                <div className="mt-1">
                  <textarea
                    name="values"
                    id="values"
                    rows={3}
                    value={formData.values}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Share what was important to them..."
                  />
                </div>
              </div>

              <div>
                <label htmlFor="communityInvolvement" className="block text-sm font-medium text-gray-700">
                  Community Involvement
                </label>
                <div className="mt-1">
                  <textarea
                    name="communityInvolvement"
                    id="communityInvolvement"
                    rows={3}
                    value={formData.communityInvolvement}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Share their impact on the community..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Continue to Photos'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 