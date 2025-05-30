'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { MemorialProfileForm } from '@/components/profile/MemorialProfileForm';
import { Icon } from '@/components/ui/Icon';
import { toast } from 'react-hot-toast';
import { MemorialProfile } from '@/types/profile';
import { getFirebaseServices } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function EditMemorialPage() {
  const { org, id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [memorial, setMemorial] = useState<MemorialProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemorial = async () => {
      try {
        const { db } = await getFirebaseServices();
        const memorialRef = doc(db, `universities/${org}/profiles`, id as string);
        const memorialDoc = await getDoc(memorialRef);

        if (memorialDoc.exists()) {
          const data = memorialDoc.data() as MemorialProfile;
          setMemorial(data);
        } else {
          toast.error('Memorial not found');
          router.push(`/${org}/dashboard`);
        }
      } catch (error) {
        console.error('Error fetching memorial:', error);
        toast.error('Failed to load memorial');
      } finally {
        setLoading(false);
      }
    };

    fetchMemorial();
  }, [org, id, router]);

  const handleSubmit = async (data: Partial<MemorialProfile>) => {
    try {
      const { db } = await getFirebaseServices();
      const memorialRef = doc(db, `universities/${org}/profiles`, id as string);
      
      const updateData = {
        ...data,
        updatedBy: user?.uid,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(memorialRef, updateData);

      toast.success('Memorial updated successfully');
      router.push(`/${org}/memorials/${id}`);
    } catch (error) {
      console.error('Error updating memorial:', error);
      toast.error('Failed to update memorial');
    }
  };

  const handleCancel = () => {
    router.push(`/${org}/memorials/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Icon name="loading" className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  if (!memorial) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Memorial</h1>
        <p className="mt-2 text-sm text-gray-600">
          Update the memorial profile information.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <MemorialProfileForm
          profile={memorial}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
} 