'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useStoriatsAdmins } from '@/hooks/useStoriatsAdmins';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useToast } from '@/components/ui/toast';
import { Icon } from '@/components/ui/Icon';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { TagInput } from '@/components/ui/TagInput';
import { DatePicker } from '@/components/ui/DatePicker';
import { Checkbox } from '@/components/ui/Checkbox';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

const CATEGORIES = [
  'Platform Features',
  'Getting Started',
  'User Management',
  'Content Management',
  'Analytics',
  'Integrations',
  'Security',
  'Troubleshooting',
  'Best Practices',
  'Updates'
];

interface ContentFormData {
  title: string;
  description: string;
  type: 'faq' | 'training' | 'announcement';
  status: 'draft' | 'published' | 'archived';
  category: string;
  tags: string[];
  content: string;
  priority: 'low' | 'medium' | 'high';
  targetAudience: ('admin' | 'user' | 'all')[];
  requiresAction: boolean;
  actionDeadline: Date | null;
}

export default function CreateContentPage() {
  const router = useRouter();
  const { isAdmin: isGlobalAdmin, isEditor, loading: authLoading, user } = useAuth();
  const { isStoriatsAdmin, loading: storiatsAdminsLoading } = useStoriatsAdmins();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ContentFormData>({
    title: '',
    description: '',
    type: 'faq',
    status: 'draft',
    category: '',
    tags: [],
    content: '',
    priority: 'low',
    targetAudience: ['all'],
    requiresAction: false,
    actionDeadline: null
  });

  if (authLoading || storiatsAdminsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  const userEmail = user?.email?.toLowerCase() || '';
  const isAdmin = isGlobalAdmin || isStoriatsAdmin(userEmail);
  
  if (!isAdmin && !isEditor) {
    router.push('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const db = await getDb();
      const contentRef = collection(db, 'content');
      const now = Timestamp.now();
      
      const newContent = {
        ...formData,
        authorId: user?.uid,
        createdAt: now,
        updatedAt: now,
        views: 0,
        helpful: 0,
        notHelpful: 0
      };
      
      await addDoc(contentRef, newContent);
      
      toast({
        title: 'Success',
        description: 'Content created successfully'
      });
      
      router.push('/admin/content');
    } catch (error) {
      console.error('Error creating content:', error);
      toast({
        title: 'Error',
        description: 'Failed to create content',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Content', href: '/admin/content' },
          { label: 'Create Content' }
        ]}
      />

      <Card className="mt-6">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold">Create Content</h1>
              <p className="mt-1 text-gray-600">Create new platform documentation, FAQ, or announcement</p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/content')}
            >
              <Icon name="arrow-left" className="w-4 h-4 mr-2" />
              Back to Content
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <Input
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter content title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter content description"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <Select
                    value={formData.type}
                    onChange={(value) => setFormData(prev => ({ ...prev, type: value as 'faq' | 'training' | 'announcement' }))}
                    options={[
                      { value: 'faq', label: 'FAQ' },
                      { value: 'training', label: 'Training' },
                      { value: 'announcement', label: 'Announcement' }
                    ]}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <Select
                    value={formData.status}
                    onChange={(value) => setFormData(prev => ({ ...prev, status: value as 'draft' | 'published' | 'archived' }))}
                    options={[
                      { value: 'draft', label: 'Draft' },
                      { value: 'published', label: 'Published' },
                      { value: 'archived', label: 'Archived' }
                    ]}
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <Select
                    value={formData.category}
                    onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    options={[
                      { value: '', label: 'Select a category' },
                      ...CATEGORIES.map(category => ({ value: category, label: category }))
                    ]}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Tags</label>
                  <TagInput
                    value={formData.tags}
                    onChange={(tags: string[]) => setFormData({ ...formData, tags })}
                    placeholder="Add tags..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <Select
                    value={formData.priority}
                    onChange={(value) => setFormData(prev => ({ ...prev, priority: value as 'high' | 'medium' | 'low' }))}
                    options={[
                      { value: 'high', label: 'High' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'low', label: 'Low' }
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Target Audience</label>
                  <div className="space-y-2">
                    <Checkbox
                      label="All Users"
                      checked={formData.targetAudience.includes('all')}
                      onChange={e => {
                        const newAudience = e.target.checked ? ['all' as const] : [];
                        setFormData({ ...formData, targetAudience: newAudience });
                      }}
                    />
                    <Checkbox
                      label="Admins Only"
                      checked={formData.targetAudience.includes('admin')}
                      onChange={e => {
                        const newAudience = e.target.checked
                          ? [...formData.targetAudience.filter(a => a !== 'all'), 'admin' as const]
                          : formData.targetAudience.filter(a => a !== 'admin');
                        setFormData({ ...formData, targetAudience: newAudience });
                      }}
                      disabled={formData.targetAudience.includes('all')}
                    />
                    <Checkbox
                      label="Regular Users"
                      checked={formData.targetAudience.includes('user')}
                      onChange={e => {
                        const newAudience = e.target.checked
                          ? [...formData.targetAudience.filter(a => a !== 'all'), 'user' as const]
                          : formData.targetAudience.filter(a => a !== 'user');
                        setFormData({ ...formData, targetAudience: newAudience });
                      }}
                      disabled={formData.targetAudience.includes('all')}
                    />
                  </div>
                </div>

                <div>
                  <Checkbox
                    label="Requires Action"
                    checked={formData.requiresAction}
                    onChange={e => setFormData({ ...formData, requiresAction: e.target.checked })}
                  />
                </div>

                {formData.requiresAction && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Action Deadline</label>
                    <DatePicker
                      value={formData.actionDeadline}
                      onChange={date => setFormData({ ...formData, actionDeadline: date })}
                      minDate={new Date()}
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Content</label>
              <RichTextEditor
                value={formData.content}
                onChange={content => setFormData({ ...formData, content })}
                placeholder="Enter content..."
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/content')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Icon name="plus" className="w-4 h-4 mr-2" />
                    Create Content
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
} 