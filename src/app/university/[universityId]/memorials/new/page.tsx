import { Suspense } from 'react';
import NewMemorialClient from './NewMemorialClient';

interface NewMemorialPageProps {
  params: {
    universityId: string;
  };
}

export default function NewMemorialPage({ params }: NewMemorialPageProps) {
  if (!params.universityId) {
    return <div>Invalid university ID</div>;
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewMemorialClient params={params} />
    </Suspense>
  );
} 