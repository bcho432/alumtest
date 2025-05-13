'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createMemorial, MemorialBasicInfo } from '@/services/memorials';
import { collection, addDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function CreateMemorialPage() {
  return (
    <ProtectedRoute>
      <CreateMemorialContent />
    </ProtectedRoute>
  );
}

function CreateMemorialContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [formData, setFormData] = useState<MemorialBasicInfo>({
    name: '',
    dateOfBirth: '',
    birthLocation: '',
    dateOfDeath: '',
    deathLocation: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Check if this is an external user (with university invitation)
  const isExternal = searchParams.get('external') === 'true';
  const universityId = searchParams.get('universityId');

  // Log parameters for debugging
  useEffect(() => {
    console.log("Memorial create page - Parameters:", { 
      isExternal, 
      universityId,
      userId: user?.uid
    });
  }, [isExternal, universityId, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name) {
      setError('Name is required');
      return false;
    }
    if (formData.name.length > 100) {
      setError('Name must be less than 100 characters');
      return false;
    }
    if (formData.birthLocation && formData.birthLocation.length > 200) {
      setError('Birth location must be less than 200 characters');
      return false;
    }
    if (formData.deathLocation && formData.deathLocation.length > 200) {
      setError('Death location must be less than 200 characters');
      return false;
    }
    if (formData.dateOfBirth && formData.dateOfDeath) {
      const birthDate = new Date(formData.dateOfBirth);
      const deathDate = new Date(formData.dateOfDeath);
      if (deathDate < birthDate) {
        setError('Date of death cannot be before date of birth');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm() || !user) {
      return;
    }

    // If external, we need a universityId
    if (isExternal && !universityId) {
      setError('Missing university information');
      return;
    }

    setLoading(true);
    console.log("Submitting memorial form with:", { 
      userId: user.uid, 
      isExternal, 
      universityId: isExternal ? universityId : user.uid 
    });

    try {
      // If external, use the universityId from the search params and set creatorId to the current user
      // Otherwise, the current user's ID is both the universityId and creatorId
      const uniId = isExternal ? universityId! : user.uid;
      const creatorId = user.uid;

      const memorial = await createMemorial(uniId, formData, isExternal ? creatorId : undefined);
      console.log("Memorial created successfully:", memorial);
      
      // Add the appropriate parameters to the next page
      let nextPageUrl = `/university/memorials/create/life-story?memorialId=${memorial.id}`;
      if (isExternal) {
        nextPageUrl += `&external=true&universityId=${uniId}`;
      }
      
      router.push(nextPageUrl);
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      setError('Failed to create memorial. Please try again.');
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
            <div className="text-gray-400">
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

        {isExternal && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1 md:flex md:justify-between">
                <p className="text-sm text-blue-700">
                  You're creating a memorial on behalf of a university. Your memorial will need to be approved by the university administrator before it's published.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              Basic Information
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Enter the essential information for the memorial page.</p>
            </div>

            {error && (
              <div className="mt-4 rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    maxLength={100}
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                    Date of Birth
                  </label>
                  <div className="mt-1">
                    <input
                      type="date"
                      name="dateOfBirth"
                      id="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="birthLocation" className="block text-sm font-medium text-gray-700">
                    Birth Location
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="birthLocation"
                      id="birthLocation"
                      maxLength={200}
                      value={formData.birthLocation}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="dateOfDeath" className="block text-sm font-medium text-gray-700">
                    Date of Death
                  </label>
                  <div className="mt-1">
                    <input
                      type="date"
                      name="dateOfDeath"
                      id="dateOfDeath"
                      value={formData.dateOfDeath}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="deathLocation" className="block text-sm font-medium text-gray-700">
                    Death Location
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="deathLocation"
                      id="deathLocation"
                      maxLength={200}
                      value={formData.deathLocation}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Continue to Life Story'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 