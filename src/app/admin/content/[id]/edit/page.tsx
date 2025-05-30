'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useToast } from '@/components/ui/toast';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor').then(mod => mod.RichTextEditor), {
  ssr: false
});

interface Content {
  id: string;
  title: string;
  description: string;
  content: string;
  type: 'article' | 'document' | 'media';
  status: 'draft' | 'published';
  organizationId: string;
  tags: string[];
}

interface Organization {
  id: string;
  name: string;
}

interface FormData {
  title: string;
  description: string;
  content: string;
  type: 'article' | 'document' | 'media';
  status: 'draft' | 'published';
  organizationId: string;
  tags: string[];
}

export default function ContentEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { isAdmin, isEditor } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState<Content | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    content: '',
    type: 'article',
    status: 'draft',
    organizationId: '',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (!isAdmin && !isEditor) {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      try {
        const db = await getDb();
        const contentRef = doc(db, 'content', params.id);
        const contentDoc = await getDoc(contentRef);
        
        if (!contentDoc.exists()) {
          toast({
            title: 'Error',
            description: 'Content not found',
            variant: 'destructive'
          });
          router.push('/admin/content');
          return;
        }

        const data = contentDoc.data() as Content;
        setContent(data);
        setFormData({
          title: data.title,
          description: data.description,
          content: data.content,
          type: data.type,
          status: data.status,
          organizationId: data.organizationId,
          tags: data.tags
        });

        // Fetch organizations
        const orgsRef = collection(db, 'organizations');
        const orgsSnapshot = await getDocs(orgsRef);
        const orgs = orgsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        setOrganizations(orgs);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch content data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin, isEditor, params.id, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;

    setSaving(true);
    try {
      const db = await getDb();
      const contentRef = doc(db, 'content', content.id);
      await updateDoc(contentRef, {
        ...formData,
        updatedAt: new Date()
      });

      toast({
        title: 'Success',
        description: 'Content updated successfully',
        variant: 'success'
      });
      router.push(`/admin/content/${content.id}`);
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: 'Error',
        description: 'Failed to update content',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()]
        }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  useKeyboardNavigation({
    '/': () => router.push('/'),
    'Escape': () => router.push(`/admin/content/${params.id}`)
  });

  if (!isAdmin && !isEditor) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!content) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Content', href: '/admin/content' },
          { label: content.title, href: `/admin/content/${content.id}` },
          { label: 'Edit' }
        ]}
      />

      <form onSubmit={handleSubmit}>
        <Card className="mt-6">
          <div className="p-6 space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <Input
                id="title"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                Content
              </label>
              <div className="mt-1">
                <RichTextEditor
                  value={formData.content}
                  onChange={(content: string) => setFormData(prev => ({ ...prev, content }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Type
                </label>
                <Select
                  value={formData.type}
                  onChange={(value) => setFormData(prev => ({ ...prev, type: value as 'article' | 'document' | 'media' }))}
                  options={[
                    { value: 'article', label: 'Article' },
                    { value: 'document', label: 'Document' },
                    { value: 'media', label: 'Media' }
                  ]}
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <Select
                  value={formData.status}
                  onChange={(value) => setFormData(prev => ({ ...prev, status: value as 'draft' | 'published' }))}
                  options={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'published', label: 'Published' }
                  ]}
                />
              </div>
            </div>

            <div>
              <label htmlFor="organization" className="block text-sm font-medium text-gray-700">
                Organization
              </label>
              <Select
                value={formData.organizationId}
                onChange={(value) => setFormData(prev => ({ ...prev, organizationId: value }))}
                options={organizations.map(org => ({ value: org.id, label: org.name }))}
              />
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                Tags
              </label>
              <div className="mt-1">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="Press Enter to add a tag"
                  className="mb-2"
                />
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <div
                      key={tag}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-gray-200"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/admin/content/${content.id}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
} 