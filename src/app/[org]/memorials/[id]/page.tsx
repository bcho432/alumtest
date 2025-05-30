'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { MemorialProfile } from '@/types/profile';
import { getFirebaseServices } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { EnhancedProfileCard } from '@/components/profile/EnhancedProfileCard';

export default function MemorialPage() {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <EnhancedProfileCard
        profile={memorial}
        variant="full"
        showActions={true}
        showStats={true}
        onEdit={() => router.push(`/${org}/memorials/${id}/edit`)}
        onShare={() => {
          // TODO: Implement share functionality
          toast.success('Share functionality coming soon');
        }}
        onDelete={() => {
          // TODO: Implement delete functionality
          toast.success('Delete functionality coming soon');
        }}
      />
    </div>
  );
}
 