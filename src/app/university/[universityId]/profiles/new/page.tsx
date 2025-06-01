import { Suspense } from 'react';
import NewProfileClient from './NewProfileClient';

interface NewProfilePageProps {
  params: {
    universityId: string;
  };
}

export default function NewProfilePage({ params }: NewProfilePageProps) {
  if (!params.universityId) {
    return <div>Invalid university ID</div>;
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewProfileClient params={params} />
    </Suspense>
  );
} 