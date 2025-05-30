'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useToast } from '@/components/ui/toast';

interface Content {
  id: string;
  title: string;
  description: string;
  content: string;
  type: 'article' | 'document' | 'media';
  status: 'draft' | 'published';
  organizationId: string;
  organizationName: string;
  authorId: string;
  authorName: string;
  tags: string[];
  createdAt: Date | { toDate: () => Date };
  updatedAt: Date | { toDate: () => Date };
}

interface OrganizationData {
  name: string;
}

interface UserData {
  profile?: {
    displayName: string;
  };
}

interface ContentData {
  title: string;
  description: string;
  content: string;
  type: 'article' | 'document' | 'media';
  status: 'draft' | 'published';
  organizationId: string;
  authorId: string;
  tags: string[];
  createdAt: Date | { toDate: () => Date };
  updatedAt: Date | { toDate: () => Date };
}

export default function ContentViewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { isAdmin, isEditor } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (!isAdmin && !isEditor) {
      router.push('/');
      return;
    }

    const fetchContent = async () => {
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

        const data = contentDoc.data() as ContentData;
        const orgRef = doc(db, 'organizations', data.organizationId);
        const authorRef = doc(db, 'users', data.authorId);
        const [orgDoc, authorDoc] = await Promise.all([
          getDoc(orgRef),
          getDoc(authorRef)
        ]);

        setContent({
          id: contentDoc.id,
          ...data,
          organizationName: (orgDoc.data() as OrganizationData)?.name || 'Unknown Organization',
          authorName: (authorDoc.data() as UserData)?.profile?.displayName || 'Unknown Author'
        });
      } catch (error) {
        console.error('Error fetching content:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch content',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [isAdmin, isEditor, params.id, router, toast]);

  const handleDelete = async () => {
    if (!content) return;

    try {
      const db = await getDb();
      await deleteDoc(doc(db, 'content', content.id));
      toast({
        title: 'Success',
        description: 'Content deleted successfully',
        variant: 'success'
      });
      router.push('/admin/content');
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete content',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'article':
        return 'bg-blue-100 text-blue-800';
      case 'document':
        return 'bg-purple-100 text-purple-800';
      case 'media':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  useKeyboardNavigation({
    '/': () => router.push('/'),
    'e': () => router.push(`/admin/content/${params.id}/edit`),
    'Escape': () => router.push('/admin/content')
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
          { label: content.title }
        ]}
      />

      <Card className="mt-6">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-semibold mb-2">{content.title}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>By {content.authorName}</span>
                <span>•</span>
                <span>{content.organizationName}</span>
                <span>•</span>
                <span>
                  {content.createdAt instanceof Date
                    ? content.createdAt.toLocaleDateString()
                    : content.createdAt.toDate().toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/admin/content/${params.id}/edit`)}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
              >
                Delete
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <Badge
              variant="secondary"
              className={getTypeColor(content.type)}
            >
              {content.type}
            </Badge>
            <Badge
              variant="secondary"
              className={getStatusColor(content.status)}
            >
              {content.status}
            </Badge>
            {content.tags.map(tag => (
              <Badge
                key={tag}
                variant="secondary"
                className="bg-gray-100 text-gray-800"
              >
                {tag}
              </Badge>
            ))}
          </div>

          {content.description && (
            <div className="prose max-w-none mb-6">
              <p className="text-gray-600">{content.description}</p>
            </div>
          )}

          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: content.content }} />
          </div>
        </div>
      </Card>

      <ConfirmDialog
        title="Delete Content"
        message={`Are you sure you want to delete ${content.title}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="primary"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  );
} 