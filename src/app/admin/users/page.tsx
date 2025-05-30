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
import type { User } from '@/types/user';

const ITEMS_PER_PAGE = 10;

function assertDb() {
  throw new Error('Do not use assertDb. Use getDb() instead.');
}

export default function UsersPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [filterRole, setFilterRole] = useState('');

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAdmin) {
      router.push('/');
      return;
    }

    const fetchUsers = async () => {
      try {
        const db = await getDb();
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('profile.displayName'));
        const snapshot = await getDocs(q);
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as User[];
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isAdmin, router, authLoading]);

  const filteredUsers = users.filter(user => {
    const searchLower = debouncedSearchTerm.toLowerCase();
    const displayName = user.profile?.displayName?.toLowerCase() || '';
    const email = user.profile?.email?.toLowerCase() || '';
    return displayName.includes(searchLower) || email.includes(searchLower);
  });

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearch = (value: string) => {
    setSearchTerm(sanitizeString(value));
    setCurrentPage(1);
  };

  const handleDelete = async (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    // Implement delete logic here
    setShowDeleteDialog(false);
    setSelectedUser(null);
  };

  useKeyboardNavigation({
    '/': () => router.push('/'),
    'n': () => router.push('/admin/users/create'),
    'Escape': () => setShowDeleteDialog(false)
  });

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Users' }
        ]}
      />

      <Card className="mt-6">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold">Users</h1>
              <p className="mt-1 text-gray-600">Manage user accounts and permissions</p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => router.push('/admin')}
              >
                Back to Dashboard
              </Button>
              <Button
                variant="primary"
                onClick={() => router.push('/admin/users/create')}
              >
                Add User
              </Button>
            </div>
          </div>

          <div className="grid gap-4 mb-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <Input
                type="search"
                placeholder="Search users..."
                value={searchTerm}
                onChange={e => handleSearch(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <select
                value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="user">User</option>
              </select>
            </div>
          </div>

          <Table>
            <Header>
              <Row>
                <Head>Name</Head>
                <Head>Email</Head>
                <Head>Role</Head>
                <Head>Status</Head>
                <Head>Actions</Head>
              </Row>
            </Header>
            <Body>
              {paginatedUsers.map(user => (
                <Row key={user.id}>
                  <Cell>{user.profile?.displayName || 'N/A'}</Cell>
                  <Cell>{user.profile?.email || 'N/A'}</Cell>
                  <Cell>
                    {Object.entries(user.organizationRoles || {}).map(([orgId, role]) => (
                      <Badge key={orgId} variant="secondary" className="mr-2">
                        {role}
                      </Badge>
                    ))}
                  </Cell>
                  <Cell>
                    <Badge
                      variant={user.isActive ? 'success' : 'secondary'}
                    >
                      {user.isActive ? 'Active' : 'Blocked'}
                    </Badge>
                  </Cell>
                  <Cell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/users/${user.id}`)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/users/${user.id}/edit`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDelete(user)}
                      >
                        Delete
                      </Button>
                    </div>
                  </Cell>
                </Row>
              ))}
            </Body>
          </Table>

          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </Card>

      {showDeleteDialog && selectedUser && (
        <ConfirmDialog
          title="Delete User"
          message={`Are you sure you want to delete ${selectedUser.profile?.displayName || 'this user'}? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="primary"
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}
    </div>
  );
} 