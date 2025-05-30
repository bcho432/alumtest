import { Suspense } from 'react';
import UniversityManagementClient from './UniversityManagementClient';
import { RootLayout } from '@/components/layout/RootLayout';

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
    <RootLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <UniversityManagementClient />
      </Suspense>
    </RootLayout>
  );
} 