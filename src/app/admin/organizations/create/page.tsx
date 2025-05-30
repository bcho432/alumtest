'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { sanitizeString } from '@/utils/security';
import { useToast } from '@/components/ui/toast';

export default function CreateOrganizationPage() {
  const router = useRouter();
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    location: '',
    industry: '',
    size: '1-10'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate required fields
    if (!formData.name.trim()) {
      setErrors(prev => ({ ...prev, name: 'Name is required' }));
      return;
    }

    if (!formData.description.trim()) {
      setErrors(prev => ({ ...prev, description: 'Description is required' }));
      return;
    }

    setLoading(true);
    try {
      const db = await getDb();
      if (!db) {
        toast({
          title: 'Error',
          description: 'Firestore is not initialized',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      const orgRef = await addDoc(collection(db, 'organizations'), {
        ...formData,
        members: {
          [(user?.userData?.id || '') as string]: 'admin' // Set the creator as an admin
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      toast({
        title: 'Success',
        description: 'Organization created successfully',
        variant: 'success'
      });

      router.push(`/admin/organizations/${orgRef.id}`);
    } catch (error) {
      console.error('Error creating organization:', error);
      setErrors({ submit: 'Failed to create organization' });
      toast({
        title: 'Error',
        description: 'Failed to create organization',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: sanitizeString(value)
    }));
  };

  useKeyboardNavigation({
    '/': () => router.push('/'),
    'Escape': () => router.push('/admin/organizations')
  });

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Organizations', href: '/admin/organizations' },
          { label: 'Create Organization' }
        ]}
      />

      <Card className="mt-6">
        <div className="p-6">
          <h1 className="text-2xl font-semibold mb-6">Create Organization</h1>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <Input
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className="mt-1"
                  error={errors.name}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={e => handleChange('description', e.target.value)}
                  className="mt-1"
                  error={errors.description}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Website
                </label>
                <Input
                  type="url"
                  value={formData.website}
                  onChange={e => handleChange('website', e.target.value)}
                  className="mt-1"
                  error={errors.website}
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
                  error={errors.location}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Industry
                </label>
                <Input
                  value={formData.industry}
                  onChange={e => handleChange('industry', e.target.value)}
                  className="mt-1"
                  error={errors.industry}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Size
                </label>
                <select
                  value={formData.size}
                  onChange={e => handleChange('size', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1001+">1001+ employees</option>
                </select>
              </div>
            </div>

            {errors.submit && (
              <div className="mt-4 text-sm text-red-600">{errors.submit}</div>
            )}

            <div className="mt-6 flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/organizations')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
              >
                {loading ? <Spinner className="mr-2" /> : null}
                Create Organization
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
} 