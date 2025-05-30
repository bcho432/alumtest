'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useStoriatsAdmins } from '@/hooks/useStoriatsAdmins';
import { useContent } from '@/hooks/useContent';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, Header, Body, Row, Head, Cell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useToast } from '@/components/ui/toast';
import { Icon } from '@/components/ui/Icon';
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Select } from '@/components/ui/Select';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface Content {
  id: string;
  title: string;
  description: string;
  type: 'faq' | 'training' | 'announcement';
  status: 'draft' | 'published' | 'archived';
  category: string;
  tags: string[];
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  helpful: number;
  notHelpful: number;
  lastUpdatedBy?: string;
  lastUpdatedAt?: Date;
  relatedContent?: string[];
  priority?: 'low' | 'medium' | 'high';
  targetAudience?: ('admin' | 'user' | 'all')[];
  requiresAction?: boolean;
  actionDeadline?: Date;
}

interface ContentStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
  views: number;
  helpful: number;
  notHelpful: number;
  byType: {
    faq: number;
    training: number;
    announcement: number;
  };
  byCategory: { [key: string]: number };
}

const ITEMS_PER_PAGE = 10;

export default function ContentPage() {
  const router = useRouter();
  const { isAdmin: isGlobalAdmin, isEditor, loading: authLoading, user } = useAuth();
  const { isStoriatsAdmin, loading: storiatsAdminsLoading } = useStoriatsAdmins();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [sortField, setSortField] = useState<'title' | 'createdAt' | 'type' | 'status'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const {
    content,
    lastDoc,
    isLoading,
    error,
    deleteContent,
    isDeleting
  } = useContent({
    type: filterType || undefined,
    status: filterStatus || undefined,
    searchTerm: debouncedSearchTerm || undefined,
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    sortField,
    sortDirection
  });

  useEffect(() => {
    if (authLoading || storiatsAdminsLoading) return;
    
    const userEmail = user?.email?.toLowerCase() || '';
    const isAdmin = isGlobalAdmin || isStoriatsAdmin(userEmail);
    
    if (!isAdmin && !isEditor) {
      console.log('User is not authorized:', { isGlobalAdmin, isStoriatsAdmin: isStoriatsAdmin(userEmail), isEditor });
      router.push('/');
      return;
    }
  }, [isGlobalAdmin, isStoriatsAdmin, router, authLoading, storiatsAdminsLoading, user, isEditor]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleSort = (field: 'title' | 'createdAt' | 'type' | 'status') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDelete = async () => {
    if (!selectedContent) return;
    
    try {
      await deleteContent(selectedContent.id);
      setShowDeleteDialog(false);
      setSelectedContent(null);
    } catch (error) {
      console.error('Error deleting content:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'faq':
        return 'bg-blue-100 text-blue-800';
      case 'training':
        return 'bg-purple-100 text-purple-800';
      case 'announcement':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  useKeyboardNavigation({
    '/': () => router.push('/'),
    'n': () => router.push('/admin/content/create'),
    'Escape': () => setShowDeleteDialog(false)
  });

  if (authLoading || storiatsAdminsLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  const userEmail = user?.email?.toLowerCase() || '';
  const isAdmin = isGlobalAdmin || isStoriatsAdmin(userEmail);
  
  if (!isAdmin && !isEditor) {
    return null;
  }

  return (
    <ErrorBoundary>
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Content' }
        ]}
      />

      <Card className="mt-6">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold">Content Management</h1>
              <p className="mt-1 text-gray-600">Manage and organize your content</p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => router.push('/admin')}
              >
                <Icon name="arrow-left" className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <Button
                variant="primary"
                onClick={() => router.push('/admin/content/create')}
              >
                <Icon name="plus" className="w-4 h-4 mr-2" />
                Create Content
              </Button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="grid gap-4 mb-6 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={e => handleSearch(e.target.value)}
                  className="w-full pl-10"
                />
                <Icon name="search" className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
            <Select
              value={filterType}
              onChange={setFilterType}
              className="w-full"
              options={[
                { value: '', label: 'All Types' },
                { value: 'faq', label: 'FAQ' },
                { value: 'training', label: 'Training' },
                { value: 'announcement', label: 'Announcement' }
              ]}
            />
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              className="w-full"
              options={[
                { value: '', label: 'All Status' },
                { value: 'published', label: 'Published' },
                { value: 'draft', label: 'Draft' },
                { value: 'archived', label: 'Archived' }
              ]}
            />
          </div>

            {/* Content List */}
            <TabsRoot defaultValue="list" value={viewMode} onValueChange={(value) => setViewMode(value as 'list' | 'grid')}>
              <TabsList>
                <TabsTrigger value="list">
                  <Icon name="list" className="w-4 h-4 mr-2" />
                  List View
                </TabsTrigger>
                <TabsTrigger value="grid">
                  <Icon name="grid" className="w-4 h-4 mr-2" />
                  Grid View
                </TabsTrigger>
              </TabsList>

            <TabsContent value="list">
              <div className="overflow-x-auto">
                <Table>
                  <Header>
                    <Row>
                      <Head>
                        <input
                          type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={selectedItems.length === content.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                                setSelectedItems(content.map(item => item.id));
                            } else {
                              setSelectedItems([]);
                            }
                          }}
                        />
                      </Head>
                        <Head onClick={() => handleSort('title')}>
                        Title
                        {sortField === 'title' && (
                          <Icon
                            name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
                              className="w-4 h-4 ml-1"
                          />
                        )}
                      </Head>
                        <Head onClick={() => handleSort('type')}>
                        Type
                        {sortField === 'type' && (
                          <Icon
                            name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
                              className="w-4 h-4 ml-1"
                          />
                        )}
                      </Head>
                        <Head onClick={() => handleSort('status')}>
                        Status
                        {sortField === 'status' && (
                          <Icon
                            name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
                              className="w-4 h-4 ml-1"
                          />
                        )}
                      </Head>
                        <Head onClick={() => handleSort('createdAt')}>
                        Created
                        {sortField === 'createdAt' && (
                          <Icon
                            name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
                              className="w-4 h-4 ml-1"
                          />
                        )}
                      </Head>
                      <Head>Actions</Head>
                    </Row>
                  </Header>
                  <Body>
                    <AnimatePresence>
                        {content.map(item => (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                          <Cell>
                            <input
                              type="checkbox"
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={selectedItems.includes(item.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedItems([...selectedItems, item.id]);
                                } else {
                                  setSelectedItems(selectedItems.filter(id => id !== item.id));
                                }
                              }}
                            />
                          </Cell>
                          <Cell>
                              <div className="flex items-center">
                                <span className="font-medium">{item.title}</span>
                              </div>
                          </Cell>
                          <Cell>
                              <Badge
                                variant="secondary"
                                className={getTypeColor(item.type)}
                              >
                              {item.type}
                            </Badge>
                          </Cell>
                          <Cell>
                              <Badge
                                variant="secondary"
                                className={getStatusColor(item.status)}
                              >
                              {item.status}
                            </Badge>
                          </Cell>
                          <Cell>
                            {item.createdAt.toLocaleDateString()}
                          </Cell>
                          <Cell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/admin/content/${item.id}`)}
                                title="View Content"
                              >
                                <Icon name="eye" className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/admin/content/${item.id}/edit`)}
                                title="Edit Content"
                              >
                                <Icon name="pencil" className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedContent(item);
                                  setShowDeleteDialog(true);
                                }}
                                title="Delete Content"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Icon name="trash" className="w-4 h-4" />
                              </Button>
                            </div>
                          </Cell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </Body>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="grid">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {content.map(item => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                    >
                      <Card className="h-full">
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="font-medium">{item.title}</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                  {item.description}
                                </p>
                            </div>
                            <input
                              type="checkbox"
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={selectedItems.includes(item.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedItems([...selectedItems, item.id]);
                                } else {
                                  setSelectedItems(selectedItems.filter(id => id !== item.id));
                                }
                              }}
                            />
                          </div>
                          <div className="flex flex-wrap gap-2 mb-4">
                              <Badge
                                variant="secondary"
                                className={getTypeColor(item.type)}
                              >
                              {item.type}
                            </Badge>
                              <Badge
                                variant="secondary"
                                className={getStatusColor(item.status)}
                              >
                              {item.status}
                              </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">
                              {item.createdAt.toLocaleDateString()}
                            </span>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/admin/content/${item.id}`)}
                                title="View Content"
                              >
                                <Icon name="eye" className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/admin/content/${item.id}/edit`)}
                                title="Edit Content"
                              >
                                <Icon name="pencil" className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedContent(item);
                                  setShowDeleteDialog(true);
                                }}
                                title="Delete Content"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Icon name="trash" className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </TabsContent>
          </TabsRoot>

            {content.length === 0 && (
            <div className="text-center py-12">
              <Icon name="document" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
              <p className="text-gray-500">
                {searchTerm || filterType || filterStatus
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first content'}
              </p>
              {!searchTerm && !filterType && !filterStatus && (
                <Button
                  variant="primary"
                  className="mt-4"
                  onClick={() => router.push('/admin/content/create')}
                >
                  <Icon name="plus" className="w-4 h-4 mr-2" />
                  Create Content
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

        {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        title="Delete Content"
          message="Are you sure you want to delete this content? This action cannot be undone."
        confirmLabel="Delete"
          variant="primary"
          onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteDialog(false);
          setSelectedContent(null);
        }}
          isLoading={isDeleting}
          open={showDeleteDialog}
          className="[&>button:last-child]:bg-red-600 [&>button:last-child]:hover:bg-red-700"
      />
    </div>
    </ErrorBoundary>
  );
} 