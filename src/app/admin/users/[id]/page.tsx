'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import type { User } from '@/types/user';

export default function ViewUserPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }

    const fetchUser = async () => {
      try {
        const db = await getDb();
        if (!db) {
          console.error('Firestore is not initialized');
          setLoading(false);
          return;
        }
        const userDoc = await getDoc(doc(db, 'users', params.id));
        if (userDoc.exists()) {
          setUser({ id: userDoc.id, ...userDoc.data() } as User);
        } else {
          router.push('/admin/users');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [isAdmin, router, params.id]);

  useKeyboardNavigation({
    '/': () => router.push('/'),
    'e': () => router.push(`/admin/users/${params.id}/edit`),
    'Escape': () => router.push('/admin/users')
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

  if (!user) {
    return null;
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Users', href: '/admin/users' },
            { label: user.profile?.displayName || 'User Details' }
          ]}
        />

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Display Name</dt>
                  <dd className="mt-1">{user.profile?.displayName || 'Not set'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1">{user.profile?.email || 'Not set'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
                  <dd className="mt-1">{user.profile?.phoneNumber || 'Not set'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="mt-1">{user.profile?.location || 'Not set'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Bio</dt>
                  <dd className="mt-1">{user.profile?.bio || 'Not set'}</dd>
                </div>
              </dl>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Account Status</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <Badge
                      variant={user.isActive ? 'success' : 'destructive'}
                    >
                      {user.isActive ? 'Active' : 'Blocked'}
                    </Badge>
                  </dd>
                </div>
                {user.blockedReason && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Blocked Reason</dt>
                    <dd className="mt-1">{user.blockedReason}</dd>
                  </div>
                )}
                {user.blockedAt && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Blocked At</dt>
                    <dd className="mt-1">
                      {user.blockedAt instanceof Date
                        ? user.blockedAt.toLocaleDateString()
                        : user.blockedAt.toDate().toLocaleDateString()}
                    </dd>
                  </div>
                )}
                {user.blockedBy && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Blocked By</dt>
                    <dd className="mt-1">{user.blockedBy}</dd>
                  </div>
                )}
              </dl>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Organization Roles</h2>
              <div className="space-y-2">
                {Object.entries(user.organizationRoles ?? {}).map(([orgId, role]) => (
                  <div key={orgId} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{orgId}</span>
                    <Badge variant="secondary">{role}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Settings</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email Notifications</dt>
                  <dd className="mt-1">
                    <Badge
                      variant={user.settings?.emailNotifications ? 'success' : 'secondary'}
                    >
                      {user.settings?.emailNotifications ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Theme</dt>
                  <dd className="mt-1">
                    <Badge variant="secondary">
                      {user.settings?.theme || 'Not set'}
                    </Badge>
                  </dd>
                </div>
              </dl>
            </div>
          </Card>
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/users')}
          >
            Back to Users
          </Button>
          <Button
            variant="primary"
            onClick={() => router.push(`/admin/users/${params.id}/edit`)}
          >
            Edit User
          </Button>
        </div>
      </div>
    </ErrorBoundary>
  );
} 