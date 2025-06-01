'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { getFirebaseServices } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useToast } from '@/components/ui/toast';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import type { MemorialProfile } from '@/types/profile';

interface MemorialDetailClientProps {
  params: {
    universityId: string;
    id: string;
  };
}

function formatDate(date: Date | Timestamp | null | undefined): string {
  if (!date) return '';
  if (date instanceof Timestamp) {
    return date.toDate().toLocaleDateString();
  }
  return date.toLocaleDateString();
}

export default function MemorialDetailClient({ params }: MemorialDetailClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [memorial, setMemorial] = useState<MemorialProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMemorial = async () => {
      if (!params.universityId || !params.id) {
        setError('Invalid memorial parameters');
        setLoading(false);
        return;
      }

      try {
        const services = await getFirebaseServices();
        if (!services?.db) {
          throw new Error('Database not initialized');
        }

        const memorialRef = doc(services.db, `universities/${params.universityId}/profiles/${params.id}`);
        const memorialDoc = await getDoc(memorialRef);

        if (!memorialDoc.exists()) {
          setError('Memorial not found');
          toast({
            title: 'Error',
            description: 'Memorial not found',
            variant: 'destructive'
          });
          router.push(`/university/${params.universityId}`);
          return;
        }

        const memorialData = {
          id: memorialDoc.id,
          ...memorialDoc.data()
        } as MemorialProfile;

        // Validate required fields
        if (!memorialData.name) {
          throw new Error('Invalid memorial data: missing name');
        }

        setMemorial(memorialData);
      } catch (error) {
        console.error('Error fetching memorial:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch memorial data';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMemorial();
  }, [params.universityId, params.id, router, toast]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <div className="p-6 text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
            <p className="text-gray-600">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push(`/university/${params.universityId}`)}
            >
              Return to University
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!memorial) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'University', href: `/university/${params.universityId}` },
          { label: 'Memorials', href: `/university/${params.universityId}/memorials` },
          { label: memorial.name }
        ]}
      />

      <div className="mt-6">
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-semibold">{memorial.name}</h1>
                {memorial.basicInfo && (
                  <div className="mt-2 text-gray-600">
                    <p>
                      {memorial.basicInfo.dateOfBirth && (
                        <span>Born: {formatDate(memorial.basicInfo.dateOfBirth)}</span>
                      )}
                      {memorial.basicInfo.dateOfDeath && (
                        <span className="ml-4">Died: {formatDate(memorial.basicInfo.dateOfDeath)}</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
              {user && (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/university/${params.universityId}/memorials/${params.id}/edit`)}
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>

            <ProfileTabs profile={memorial} />
          </div>
        </Card>
      </div>
    </div>
  );
} 