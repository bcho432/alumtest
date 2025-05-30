'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { EnhancedProfileForm } from '@/components/profile/EnhancedProfileForm';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

export default function NewProfilePage() {
  const params = useParams();
  const router = useRouter();
  const universityId = params.id as string;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Profile</h1>
              <p className="mt-1 text-sm text-gray-500">
                Create a new memorial or living profile for your university
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              <Icon name="arrow-left" className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </div>

        <Card className="p-6">
          <EnhancedProfileForm
            universityId={universityId}
            onSuccess={() => router.push(`/admin/universities/${universityId}/profiles`)}
          />
        </Card>
      </div>
    </div>
  );
} 