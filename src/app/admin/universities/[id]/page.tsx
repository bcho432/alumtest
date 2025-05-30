import { Suspense } from 'react';
import UniversityManagementClient from './UniversityManagementClient';

interface UniversityPageProps {
  params: {
    id: string;
  };
}

export default function UniversityPage({ params }: UniversityPageProps) {
  if (!params.id) {
    return <div>Invalid university ID</div>;
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UniversityManagementClient />
    </Suspense>
  );
} 