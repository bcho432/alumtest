'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { getFirebaseServices } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, orderBy, limit, startAfter } from 'firebase/firestore';
import { useToast } from '@/components/ui/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UserManagementProps {
  universityId: string;
}

const ITEMS_PER_PAGE = 10;

export function UserManagement({ universityId }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [userToUpdate, setUserToUpdate] = useState<{ id: string; newRole: User['role'] } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, [universityId]);

  const fetchUsers = async (isLoadMore = false) => {
    try {
      const { db } = await getFirebaseServices();
      if (!db) return;

      let q = query(
        collection(db, `universities/${universityId}/users`),
        orderBy('createdAt', 'desc'),
        limit(ITEMS_PER_PAGE)
      );

      if (isLoadMore && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const usersSnapshot = await getDocs(q);
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];

      setLastDoc(usersSnapshot.docs[usersSnapshot.docs.length - 1]);
      setHasMore(usersSnapshot.docs.length === ITEMS_PER_PAGE);

      if (isLoadMore) {
        setUsers(prev => [...prev, ...usersData]);
      } else {
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: User['role']) => {
    try {
      setIsUpdating(true);
      const { db } = await getFirebaseServices();
      if (!db) return;

      const userRef = doc(db, `universities/${universityId}/users/${userId}`);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date()
      });

      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      setUserToUpdate(null);

      toast({
        title: 'Success',
        description: 'User role updated successfully'
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      setIsUpdating(true);
      const { db } = await getFirebaseServices();
      if (!db) return;

      const userRef = doc(db, `universities/${universityId}/users/${userId}`);
      await deleteDoc(userRef);

      setUsers(users.filter(user => user.id !== userId));

      toast({
        title: 'Success',
        description: 'User removed successfully'
      });
    } catch (error) {
      console.error('Error removing user:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove user. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading && !users.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <Icon name="user" className="h-6 w-6 text-gray-500" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || 'Unnamed User'}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => setUserToUpdate({ id: user.id, newRole: e.target.value as User['role'] })}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    >
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveUser(user.id)}
                      className="text-red-600 hover:text-red-900"
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        'Remove'
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={() => fetchUsers(true)}
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
              ) : (
                <Icon name="arrow-down" className="h-4 w-4 mr-2" />
              )}
              Load More
            </Button>
          </div>
        )}

        {users.length === 0 && !loading && (
          <div className="text-center py-12">
            <Icon name="users" className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No users have been added to this university yet.
            </p>
          </div>
        )}
      </Card>

      {/* Role Change Confirmation Dialog */}
      <Dialog open={!!userToUpdate} onOpenChange={(open) => !open && setUserToUpdate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to change this user's role to {userToUpdate?.newRole}? This will affect their permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setUserToUpdate(null)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => userToUpdate && handleRoleChange(userToUpdate.id, userToUpdate.newRole)}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Icon name="check" className="h-4 w-4 mr-2" />
              )}
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 