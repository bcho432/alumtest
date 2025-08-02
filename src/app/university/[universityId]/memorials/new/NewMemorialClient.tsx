'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { getFirebaseServices } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useToast } from '@/components/ui/toast';
import { DatePicker } from '@/components/ui/DatePicker';
import type { MemorialProfile } from '@/types/profile';

interface NewMemorialClientProps {
  params: {
    universityId: string;
  };
}

export default function NewMemorialClient({ params }: NewMemorialClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<MemorialProfile>>({
    name: '',
    type: 'memorial',
    status: 'draft',
    basicInfo: {
      dateOfBirth: null,
      dateOfDeath: null,
      birthLocation: '',
      deathLocation: '',
      biography: '',
      photo: ''
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const services = await getFirebaseServices();
      const profilesRef = collection(services.db, `universities/${params.universityId}/profiles`);
      
      const memorialData = {
        ...formData,
        createdBy: user.id,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(profilesRef, memorialData);
      
      toast({
        title: 'Success',
        description: 'Memorial created successfully',
        variant: 'success'
      });

      router.push(`/university/${params.universityId}/memorials/${docRef.id}`);
    } catch (error) {
      console.error('Error creating memorial:', error);
      toast({
        title: 'Error',
        description: 'Failed to create memorial',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    if (field.startsWith('basicInfo.')) {
      const basicInfoField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        basicInfo: {
          ...prev.basicInfo,
          [basicInfoField]: value
        } as MemorialProfile['basicInfo']
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'University', href: `/university/${params.universityId}` },
          { label: 'Memorials', href: `/university/${params.universityId}/memorials` },
          { label: 'New Memorial' }
        ]}
      />

      <div className="mt-6">
        <Card>
          <div className="p-6">
            <h1 className="text-2xl font-semibold mb-6">Create New Memorial</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <Input
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date of Birth
                  </label>
                  <div className="mt-1">
                    <DatePicker
                      value={formData.basicInfo?.dateOfBirth as Date | null}
                      onChange={date => handleChange('basicInfo.dateOfBirth', date)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date of Death
                  </label>
                  <div className="mt-1">
                    <DatePicker
                      value={formData.basicInfo?.dateOfDeath as Date | null}
                      onChange={date => handleChange('basicInfo.dateOfDeath', date)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Birth Location
                  </label>
                  <Input
                    value={formData.basicInfo?.birthLocation}
                    onChange={e => handleChange('basicInfo.birthLocation', e.target.value)}
                    className="mt-1"
                    placeholder="Enter birth location"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Death Location
                  </label>
                  <Input
                    value={formData.basicInfo?.deathLocation}
                    onChange={e => handleChange('basicInfo.deathLocation', e.target.value)}
                    className="mt-1"
                    placeholder="Enter death location"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Biography
                </label>
                <Textarea
                  value={formData.basicInfo?.biography}
                  onChange={e => handleChange('basicInfo.biography', e.target.value)}
                  className="mt-1"
                  rows={6}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/university/${params.universityId}/memorials`)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? <Spinner className="mr-2" /> : null}
                  Create Memorial
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
} 