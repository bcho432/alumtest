'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createMemorial, MemorialBasicInfo } from '@/services/memorials';
import { collection, addDoc, getFirestore } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

export default function CreateMemorialPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState<MemorialBasicInfo>({
    name: '',
    dateOfBirth: '',
    birthLocation: '',
    dateOfDeath: '',
    deathLocation: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Log authentication state for debugging
  useEffect(() => {
    console.log("Memorial create page - Auth state:", { 
      authenticated: !!user, 
      loading: authLoading,
      userId: user?.uid
    });
  }, [user, authLoading]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      console.log("Not authenticated, redirecting to university page");
      router.push('/university');
    }
  }, [user, authLoading, router]);

  // Add a useEffect to test Firestore permissions
  useEffect(() => {
    if (user) {
      console.log("Testing Firestore permissions...");
      const testFirestore = async () => {
        try {
          // Try to write to a test collection (should have no restrictions)
          const db = getDb();
          const testDoc = await addDoc(collection(db, 'testCollection'), {
            test: true,
            userId: user.uid,
            timestamp: new Date().toISOString()
          });
          console.log("Test document created successfully:", testDoc.id);
        } catch (error) {
          console.error("Failed to create test document:", error);
        }
      };
      
      testFirestore();
    }
  }, [user]);

  if (authLoading || !user) {
    console.log("Loading or no user, rendering nothing");
    return null;
  }

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

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    console.log("Submitting memorial form with userId:", user.uid);

    try {
      const memorial = await createMemorial(user.uid, formData);
      console.log("Memorial created successfully:", memorial);
      router.push(`/university/memorials/create/life-story?memorialId=${memorial.id}`);
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

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Continue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 