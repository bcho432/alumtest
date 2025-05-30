'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Table,
  Header,
  Body,
  Row,
  Head,
  Cell
} from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { sanitizeString } from '@/utils/security';
import { useToast } from '@/components/ui/toast';

interface Organization {
  id: string;
  name: string;
  description: string;
  members: Record<string, string>;
  createdAt: Date | { toDate: () => Date };
  updatedAt: Date | { toDate: () => Date };
  industry: string;
  size: string;
}

const ITEMS_PER_PAGE = 10;

export default function OrganizationsPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [sortField, setSortField] = useState<'name' | 'createdAt' | 'memberCount'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterIndustry, setFilterIndustry] = useState<string>('');
  const [filterSize, setFilterSize] = useState<string>('');

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }

    const fetchOrganizations = async () => {
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

        const orgsRef = collection(db, 'organizations');
        const q = query(orgsRef, orderBy('name'));
        const snapshot = await getDocs(q);
        const orgsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Organization[];
        setOrganizations(orgsData);
      } catch (error) {
        console.error('Error fetching organizations:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch organizations',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, [isAdmin, router, toast]);

  const filteredOrgs = organizations.filter(org => {
    const searchLower = debouncedSearchTerm.toLowerCase();
    const matchesSearch = 
      org.name.toLowerCase().includes(searchLower) ||
      org.description.toLowerCase().includes(searchLower);
    
    const matchesIndustry = !filterIndustry || org.industry === filterIndustry;
    const matchesSize = !filterSize || org.size === filterSize;

    return matchesSearch && matchesIndustry && matchesSize;
  }).sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'createdAt':
        const dateA = a.createdAt instanceof Date ? a.createdAt : a.createdAt.toDate();
        const dateB = b.createdAt instanceof Date ? b.createdAt : b.createdAt.toDate();
        comparison = dateA.getTime() - dateB.getTime();
        break;
      case 'memberCount':
        comparison = Object.keys(a.members).length - Object.keys(b.members).length;
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const totalPages = Math.ceil(filteredOrgs.length / ITEMS_PER_PAGE);
  const paginatedOrgs = filteredOrgs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearch = (value: string) => {
    setSearchTerm(sanitizeString(value));
    setCurrentPage(1);
  };

  const handleDelete = async (org: Organization) => {
    setSelectedOrg(org);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedOrg) return;
    // Implement delete logic here
    setShowDeleteDialog(false);
    setSelectedOrg(null);
  };

  useKeyboardNavigation({
    '/': () => router.push('/'),
    'n': () => router.push('/admin/organizations/create'),
    'Escape': () => setShowDeleteDialog(false)
  });

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Organizations' }
        ]}
      />

      <Card className="mt-6">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">Organizations</h1>
            <Button
              variant="primary"
              onClick={() => router.push('/admin/organizations/create')}
            >
              Add Organization
            </Button>
          </div>

          <div className="grid gap-4 mb-6 md:grid-cols-4">
            <div className="md:col-span-2">
              <Input
                type="search"
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={e => handleSearch(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <select
                value={filterIndustry}
                onChange={e => setFilterIndustry(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="">All Industries</option>
                <option value="Technology">Technology</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Finance">Finance</option>
                <option value="Education">Education</option>
                <option value="Retail">Retail</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <select
                value={filterSize}
                onChange={e => setFilterSize(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="">All Sizes</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="501-1000">501-1000 employees</option>
                <option value="1001+">1001+ employees</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <Header>
                    <Row>
                      <Head 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          setSortField('name');
                          setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                        }}
                      >
                        Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </Head>
                      <Head>Description</Head>
                      <Head 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          setSortField('memberCount');
                          setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                        }}
                      >
                        Members {sortField === 'memberCount' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </Head>
                      <Head 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          setSortField('createdAt');
                          setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                        }}
                      >
                        Created {sortField === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </Head>
                      <Head>Actions</Head>
                    </Row>
                  </Header>
                  <Body>
                    {paginatedOrgs.map(org => (
                      <Row key={org.id} className="hover:bg-gray-50">
                        <Cell className="font-medium">{org.name}</Cell>
                        <Cell className="max-w-md truncate">{org.description}</Cell>
                        <Cell>
                          <Badge variant="secondary">
                            {Object.keys(org.members).length} members
                          </Badge>
                        </Cell>
                        <Cell>
                          {org.createdAt instanceof Date
                            ? org.createdAt.toLocaleDateString()
                            : org.createdAt.toDate().toLocaleDateString()}
                        </Cell>
                        <Cell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/organizations/${org.id}`)}
                              title="View Details"
                            >
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/organizations/${org.id}/edit`)}
                              title="Edit Organization"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/organizations/${org.id}/members`)}
                              title="Manage Members"
                            >
                              Members
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(org)}
                              title="Delete Organization"
                            >
                              Delete
                            </Button>
                          </div>
                        </Cell>
                      </Row>
                    ))}
                  </Body>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}

              {filteredOrgs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No organizations found matching your criteria
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      <ConfirmDialog
        title="Delete Organization"
        message={`Are you sure you want to delete ${selectedOrg?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="primary"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  );
} 