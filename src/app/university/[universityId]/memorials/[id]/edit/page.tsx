"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MemorialProfileForm } from '@/components/memorial/MemorialProfileForm';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

export default function EditMemorialPage() {
  const params = useParams();
  const router = useRouter();
  const universityId = params.universityId as string;
  const memorialId = params.id as string;

  console.log('EditMemorialPage rendered with universityId:', universityId, 'memorialId:', memorialId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Memorial</h1>
              <p className="mt-1 text-sm text-gray-500">
                Update the details of the memorial
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
          <MemorialProfileForm
            universityId={universityId}
            memorialId={memorialId}
            onSuccess={() => router.push(`/university/${universityId}/memorials/${memorialId}`)}
          />
        </Card>
      </div>
    </div>
  );
} 