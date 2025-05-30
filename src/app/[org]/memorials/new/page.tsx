'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { MemorialProfileForm } from '@/components/profile/MemorialProfileForm';
import { useCreateProfile } from '@/hooks/useCreateProfile';
import { toast } from 'react-hot-toast';
import { MemorialProfile } from '@/types/profile';

export default function NewMemorialPage() {
  const { org } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { createProfile } = useCreateProfile();

  const handleSubmit = async (data: Partial<MemorialProfile>) => {
    try {
      console.log('Creating new memorial profile:', data);
      const profileId = await createProfile({
        universityId: org as string,
        type: 'memorial',
        status: 'draft',
        createdBy: user?.uid || '',
        updatedBy: user?.uid || '',
        name: data.name || '',
        description: data.description || '',
        imageUrl: data.imageUrl || '',
        basicInfo: data.basicInfo || {
          dateOfBirth: new Date(),
          dateOfDeath: new Date(),
          biography: '',
          photo: '',
          birthLocation: '',
          deathLocation: ''
        },
        lifeStory: data.lifeStory || {
          content: '',
          updatedAt: new Date()
        },
        isPublic: false,
        metadata: {
          tags: [],
          categories: [],
          lastModifiedBy: user?.uid || '',
          lastModifiedAt: new Date().toISOString(),
          version: 1
        }
      });
      
      toast.success('Memorial profile created successfully');
      router.push(`/${org}/memorials/${profileId}/edit`);
    } catch (error) {
      console.error('Error creating memorial profile:', error);
      toast.error('Failed to create memorial profile');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Memorial</h1>
        <p className="mt-2 text-sm text-gray-600">
          Create a memorial profile to honor and remember someone special.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <MemorialProfileForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
} 