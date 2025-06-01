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
import type { PersonalProfile } from '@/types/profile';

interface NewProfileClientProps {
  params: {
    universityId: string;
  };
}

export default function NewProfileClient({ params }: NewProfileClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<PersonalProfile>>({
    name: '',
    type: 'personal',
    status: 'draft',
    bio: '',
    department: '',
    location: '',
    graduationYear: '',
    contact: {
      email: '',
      phone: '',
      website: ''
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const services = await getFirebaseServices();
      const profilesRef = collection(services.db, `universities/${params.universityId}/profiles`);
      
      const profileData = {
        ...formData,
        createdBy: user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(profilesRef, profileData);
      
      toast({
        title: 'Success',
        description: 'Profile created successfully',
        variant: 'success'
      });

      router.push(`/university/${params.universityId}/profile/${docRef.id}`);
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to create profile',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    if (field.startsWith('contact.')) {
      const contactField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        contact: {
          ...prev.contact,
          [contactField]: value
        } as PersonalProfile['contact']
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
          { label: 'Profiles', href: `/university/${params.universityId}/profiles` },
          { label: 'New Profile' }
        ]}
      />

      <div className="mt-6">
        <Card>
          <div className="p-6">
            <h1 className="text-2xl font-semibold mb-6">Create New Profile</h1>

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

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <Input
                  value={formData.department}
                  onChange={e => handleChange('department', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <Input
                  value={formData.location}
                  onChange={e => handleChange('location', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Graduation Year
                </label>
                <Input
                  type="number"
                  value={formData.graduationYear}
                  onChange={e => handleChange('graduationYear', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Biography
                </label>
                <Textarea
                  value={formData.bio}
                  onChange={e => handleChange('bio', e.target.value)}
                  className="mt-1"
                  rows={6}
                />
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900">Contact Information</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.contact?.email}
                    onChange={e => handleChange('contact.email', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <Input
                    type="tel"
                    value={formData.contact?.phone}
                    onChange={e => handleChange('contact.phone', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Website
                  </label>
                  <Input
                    type="url"
                    value={formData.contact?.website}
                    onChange={e => handleChange('contact.website', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/university/${params.universityId}/profiles`)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? <Spinner className="mr-2" /> : null}
                  Create Profile
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
} 