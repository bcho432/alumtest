'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { profilesService } from '@/services/profiles';
import { getAuth } from '@/lib/firebase';
import { Profile } from '@/types';
import type { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

interface PageProps {
  params: { org: string };
}

export default function NewProfilePage({ params }: PageProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { org } = params;

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initAuth = async () => {
      try {
        const auth = await getAuth();
        unsubscribe = auth.onAuthStateChanged((user: User | null) => {
          if (user) {
            setUserId(user.uid);
          } else {
            router.push('/login');
          }
        });
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError('Failed to initialize authentication');
      }
    };

    initAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) {
      setError('You must be logged in to create a profile');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const dob = formData.get('dob') as string;
    const dod = formData.get('dod') as string;

    // Validate dates
    if (!dob) {
      setError('Date of birth is required');
      setIsSubmitting(false);
      return;
    }

    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime())) {
      setError('Invalid date of birth');
      setIsSubmitting(false);
      return;
    }

    let dodDate: Date | undefined;
    if (dod) {
      dodDate = new Date(dod);
      if (isNaN(dodDate.getTime())) {
        setError('Invalid date of death');
        setIsSubmitting(false);
        return;
      }
      if (dodDate < dobDate) {
        setError('Date of death must be after date of birth');
        setIsSubmitting(false);
        return;
      }
    }

    const profileData: Omit<Profile, 'id'> = {
      name: formData.get('name') as string,
      isDeceased: formData.get('isDeceased') === 'true',
      createdBy: userId,
      status: 'draft',
      universityId: org,
      createdAt: Timestamp.now(),
      basicInfo: {
        dateOfBirth: Timestamp.fromDate(dobDate),
        dateOfDeath: dodDate ? Timestamp.fromDate(dodDate) : undefined,
        biography: formData.get('bio') as string,
        photo: '',
        birthLocation: formData.get('birthLocation') as string,
        deathLocation: formData.get('deathLocation') as string
      },
      lifeStory: {
        content: formData.get('lifeStory') as string,
        updatedAt: Timestamp.now()
      }
    };

    try {
      await profilesService.createProfile(profileData);
      router.push(`/${org}/dashboard`);
    } catch (err) {
      setError('Failed to create profile. Please try again.');
      console.error('Error creating profile:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Create New Profile</h1>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <div className="px-4 sm:px-0">
            <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200">
              <div className="space-y-8 divide-y divide-gray-200">
                <div>
                  <div>
                    <h3 className="text-base font-semibold leading-6 text-gray-900">Profile Information</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      This information will be displayed publicly so be careful what you share.
                    </p>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-4">
                      <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                        Full Name
                      </label>
                      <div className="mt-2">
                        <input
                          type="text"
                          name="name"
                          id="name"
                          required
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="isDeceased" className="block text-sm font-medium leading-6 text-gray-900">
                        Status
                      </label>
                      <div className="mt-2">
                        <select
                          id="isDeceased"
                          name="isDeceased"
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        >
                          <option value="false">Living</option>
                          <option value="true">Deceased</option>
                        </select>
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="dob" className="block text-sm font-medium leading-6 text-gray-900">
                        Date of Birth
                      </label>
                      <div className="mt-2">
                        <input
                          type="date"
                          name="dob"
                          id="dob"
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="birthLocation" className="block text-sm font-medium leading-6 text-gray-900">
                        Birth Location
                      </label>
                      <div className="mt-2">
                        <input
                          type="text"
                          name="birthLocation"
                          id="birthLocation"
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="dod" className="block text-sm font-medium leading-6 text-gray-900">
                        Date of Death
                      </label>
                      <div className="mt-2">
                        <input
                          type="date"
                          name="dod"
                          id="dod"
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="deathLocation" className="block text-sm font-medium leading-6 text-gray-900">
                        Death Location
                      </label>
                      <div className="mt-2">
                        <input
                          type="text"
                          name="deathLocation"
                          id="deathLocation"
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor="bio" className="block text-sm font-medium leading-6 text-gray-900">
                        Biography
                      </label>
                      <div className="mt-2">
                        <textarea
                          id="bio"
                          name="bio"
                          rows={3}
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500">Write a brief biography.</p>
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor="lifeStory" className="block text-sm font-medium leading-6 text-gray-900">
                        Life Story
                      </label>
                      <div className="mt-2">
                        <textarea
                          id="lifeStory"
                          name="lifeStory"
                          rows={6}
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500">Write a detailed life story.</p>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4 mt-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{error}</h3>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-5">
                <div className="flex justify-end gap-x-3">
                  <Link 
                    href={`/${org}/dashboard`}
                    className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Profile'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
} 