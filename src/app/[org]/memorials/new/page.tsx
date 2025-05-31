'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { MemorialProfileForm } from '@/components/profile/MemorialProfileForm';
import { useCreateProfile } from '@/hooks/useCreateProfile';
import { toast } from 'react-hot-toast';
import { MemorialProfile, MemorialProfileFormData } from '@/types/profile';
import { Timestamp } from 'firebase/firestore';

export default function NewMemorialPage() {
  const { org } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { createProfile } = useCreateProfile();

  const handleSubmit = async (data: MemorialProfileFormData) => {
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
        basicInfo: {
          dateOfBirth: data.basicInfo.dateOfBirth instanceof Timestamp ? data.basicInfo.dateOfBirth : Timestamp.fromDate(new Date(data.basicInfo.dateOfBirth)),
          dateOfDeath: data.basicInfo.dateOfDeath instanceof Timestamp ? data.basicInfo.dateOfDeath : Timestamp.fromDate(new Date(data.basicInfo.dateOfDeath)),
          biography: data.basicInfo.biography,
          photo: data.basicInfo.photo,
          birthLocation: data.basicInfo.birthLocation,
          deathLocation: data.basicInfo.deathLocation,
        } as {
          dateOfBirth?: Date | Timestamp;
          dateOfDeath?: Date | Timestamp;
          biography?: string;
          photo?: string;
          birthLocation?: string;
          deathLocation?: string;
        },
        lifeStory: data.lifeStory ? {
          content: data.lifeStory.content,
          updatedAt: data.lifeStory.updatedAt instanceof Timestamp ? data.lifeStory.updatedAt : Timestamp.fromDate(new Date(data.lifeStory.updatedAt)),
        } as {
          content?: string;
          updatedAt?: Date | Timestamp;
        } : undefined,
        isPublic: false,
        metadata: {
          tags: [],
          categories: [],
          lastModifiedBy: user?.uid || '',
          lastModifiedAt: Timestamp.fromDate(new Date()),
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