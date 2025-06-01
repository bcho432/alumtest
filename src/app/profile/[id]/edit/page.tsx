'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Icon } from '@/components/ui/Icon';
import { toast } from 'react-hot-toast';
import { PersonalProfile, MemorialProfile } from '@/types/profile';
import { getFirebaseServices } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';

export default function EditProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<PersonalProfile | MemorialProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    location: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { db } = await getFirebaseServices();
        const profileRef = doc(db, 'profiles', id as string);
        const profileDoc = await getDoc(profileRef);

        if (profileDoc.exists()) {
          // Assume Firestore returns the correct type
          const profileData = profileDoc.data() as PersonalProfile | MemorialProfile;
          setProfile(profileData);
          setFormData({
            name: profileData.name || '',
            email: profileData.type === 'personal' ? profileData.contact?.email || '' : '',
            bio: profileData.type === 'personal' ? profileData.bio || '' : profileData.type === 'memorial' ? profileData.description || '' : '',
            location: profileData.type === 'personal' ? profileData.location || '' : profileData.type === 'memorial' ? profileData.basicInfo?.birthLocation || '' : ''
          });
        } else {
          toast.error('Profile not found');
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      const { db } = await getFirebaseServices();
      const profileRef = doc(db, 'profiles', id as string);
      
      const updateData: Partial<PersonalProfile | MemorialProfile> = {
        name: formData.name,
        updatedBy: user?.uid,
        updatedAt: Timestamp.fromDate(new Date()),
      };

      if (profile.type === 'personal') {
        (updateData as Partial<PersonalProfile>).contact = {
          ...profile.contact,
          email: formData.email
        };
        (updateData as Partial<PersonalProfile>).bio = formData.bio;
        (updateData as Partial<PersonalProfile>).location = formData.location;
      } else if (profile.type === 'memorial') {
        (updateData as Partial<MemorialProfile>).description = formData.bio;
        if (profile.basicInfo) {
          (updateData as Partial<MemorialProfile>).basicInfo = {
            ...profile.basicInfo,
            birthLocation: formData.location
          };
        }
      }

      await updateDoc(profileRef, updateData);
      toast.success('Profile updated successfully');
      router.push(`/profile/${id}`);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleCancel = () => {
    router.push(`/profile/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Icon name="loading" className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
        <p className="mt-2 text-sm text-gray-600">
          Update your profile information.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>

          {profile.type === 'personal' && (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          )}

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
              {profile.type === 'personal' ? 'Bio' : 'Description'}
            </label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              {profile.type === 'personal' ? 'Location' : 'Birth Location'}
            </label>
            <input
              type="text"
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 