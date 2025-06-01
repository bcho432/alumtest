'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MemorialProfileForm } from '@/components/profile/MemorialProfileForm';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { getFirebaseServices } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { MemorialProfile, MemorialProfileFormData, TimelineEvent } from '@/types/profile';
import { toast } from 'react-hot-toast';

export default function EditProfilePage() {
  const params = useParams();
  const router = useRouter();
  const universityId = params.id as string;
  const profileId = params.profileId as string;
  const [profile, setProfile] = useState<MemorialProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { db } = await getFirebaseServices();
        if (!db) return;

        const profileRef = doc(db, `universities/${universityId}/profiles/${profileId}`);
        const profileDoc = await getDoc(profileRef);
        
        if (profileDoc.exists()) {
          setProfile(profileDoc.data() as MemorialProfile);
        } else {
          console.error('Profile not found');
          router.push(`/admin/universities/${universityId}/profiles`);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [universityId, profileId, router]);

  const handleSubmit = async (formData: MemorialProfileFormData) => {
    try {
      const { db } = await getFirebaseServices();
      if (!db) return;

      const profileRef = doc(db, `universities/${universityId}/profiles/${profileId}`);
      
      // Convert form data to profile data
      const profileData: Partial<MemorialProfile> = {
        ...formData,
        timeline: formData.timeline.map(event => ({
          ...event,
          type: event.type === 'work' ? 'job' : event.type
        })) as TimelineEvent[],
        updatedAt: Timestamp.now()
      };

      await updateDoc(profileRef, profileData);

      toast.success('Profile updated successfully');
      router.push(`/admin/universities/${universityId}/profiles`);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
              <p className="mt-1 text-sm text-gray-500">
                Edit an existing memorial or living profile
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleCancel}
            >
              <Icon name="arrow-left" className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </div>

        <Card className="p-6">
          <MemorialProfileForm
            profile={profile}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </Card>
      </div>
    </div>
  );
} 