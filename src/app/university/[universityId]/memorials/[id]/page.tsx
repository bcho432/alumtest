import { Suspense } from 'react';
import MemorialDetailClient from '@/components/memorial/MemorialDetailClient';
import { notFound } from 'next/navigation';

interface MemorialPageProps {
  params: {
    universityId: string;
    id: string;
  };
}

export default function MemorialPage({ params }: MemorialPageProps) {
  // Validate required parameters
  if (!params.id || !params.universityId) {
    notFound();
  }

  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <MemorialDetailClient params={params} />
    </Suspense>
  );
} 