'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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

interface Organization {
  id: string;
  name: string;
  description: string;
  website: string;
  location: string;
  industry: string;
  size: string;
  members: Record<string, string>;
  createdAt: Date | { toDate: () => Date };
  updatedAt: Date | { toDate: () => Date };
}

export default function EditOrganizationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Organization>>({
    name: '',
    description: '',
    website: '',
    location: '',
    industry: '',
    size: '1-10'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }

    const fetchOrganization = async () => {
      if (!db) {
        toast({
          title: 'Error',
          description: 'Firestore is not initialized',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      try {
        const orgDoc = await getDoc(doc(db, 'organizations', params.id));
        if (orgDoc.exists()) {
          const orgData = { id: orgDoc.id, ...orgDoc.data() } as Organization;
          setOrganization(orgData);
          setFormData(orgData);
        } else {
          router.push('/admin/organizations');
        }
      } catch (error) {
        console.error('Error fetching organization:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch organization data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [isAdmin, router, params.id, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate required fields
    if (!formData.name?.trim()) {
      setErrors(prev => ({ ...prev, name: 'Name is required' }));
      return;
    }

    if (!formData.description?.trim()) {
      setErrors(prev => ({ ...prev, description: 'Description is required' }));
      return;
    }

    if (!db) {
      toast({
        title: 'Error',
        description: 'Firestore is not initialized',
        variant: 'destructive'
      });
      setSaving(false);
      return;
    }

    setSaving(true);
    try {
      const orgRef = doc(db, 'organizations', params.id);
      await updateDoc(orgRef, {
        ...formData,
        updatedAt: new Date()
      });

      toast({
        title: 'Success',
        description: 'Organization updated successfully',
        variant: 'success'
      });

      router.push(`/admin/organizations/${params.id}`);
    } catch (error) {
      console.error('Error updating organization:', error);
      setErrors({ submit: 'Failed to update organization' });
      toast({
        title: 'Error',
        description: 'Failed to update organization',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
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
    'Escape': () => router.push(`/admin/organizations/${params.id}`)
  });

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!organization) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Organizations', href: '/admin/organizations' },
          { label: organization.name, href: `/admin/organizations/${params.id}` },
          { label: 'Edit' }
        ]}
      />

      <Card className="mt-6">
        <div className="p-6">
          <h1 className="text-2xl font-semibold mb-6">Edit Organization</h1>

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
                onClick={() => router.push(`/admin/organizations/${params.id}`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={saving}
              >
                {saving ? <Spinner className="mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
} 