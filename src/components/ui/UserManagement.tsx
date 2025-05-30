import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { getFirebaseServices } from '@/lib/firebase';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { Icon } from './Icon';
import { Spinner } from './Spinner';
import { Badge } from './Badge';
import { useToast } from './toast';
import { Select } from './Select';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  lastActive?: Date;
  createdAt: Date;
  permissions: {
    canManageProfiles: boolean;
    canManageMemorials: boolean;
    canManageUsers: boolean;
    canManageSettings: boolean;
  };
}

interface UserManagementProps {
  universityId: string;
  onUpdate: () => void;
}

export function UserManagement({ universityId, onUpdate }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, [universityId]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { db } = await getFirebaseServices();
      if (!db) {
        throw new Error('Database is not initialized');
      }

      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('universityId', '==', universityId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(q);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        lastActive: doc.data().lastActive?.toDate()
      })) as User[];

      setUsers(usersData);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    setSelectedUsers(prev =>
      prev.length === filteredUsers.length
        ? []
        : filteredUsers.map(user => user.id)
    );
  };

  const handleRoleChange = async (userId: string, newRole: User['role']) => {
    try {
      const { db } = await getFirebaseServices();
      if (!db) {
        throw new Error('Database is not initialized');
      }

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole,
        permissions: getDefaultPermissions(newRole)
      });

      toast({
        title: 'Role updated',
        description: 'User role has been updated successfully.',
        variant: 'success'
      });

      await loadUsers();
    } catch (err) {
      console.error('Error updating user role:', err);
      toast({
        title: 'Error',
        description: 'Failed to update user role. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleStatusChange = async (userId: string, newStatus: User['status']) => {
    try {
      const { db } = await getFirebaseServices();
      if (!db) {
        throw new Error('Database is not initialized');
      }

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { status: newStatus });

      toast({
        title: 'Status updated',
        description: 'User status has been updated successfully.',
        variant: 'success'
      });

      await loadUsers();
    } catch (err) {
      console.error('Error updating user status:', err);
      toast({
        title: 'Error',
        description: 'Failed to update user status. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const getDefaultPermissions = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return {
          canManageProfiles: true,
          canManageMemorials: true,
          canManageUsers: true,
          canManageSettings: true
        };
      case 'editor':
        return {
          canManageProfiles: true,
          canManageMemorials: true,
          canManageUsers: false,
          canManageSettings: false
        };
      case 'viewer':
        return {
          canManageProfiles: false,
          canManageMemorials: false,
          canManageUsers: false,
          canManageSettings: false
        };
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadUsers}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-sm">
          <Input
            type="search"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <Icon name="user" className="w-6 h-6 text-gray-500" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Select
                      value={user.role}
                      onChange={(value: string) => handleRoleChange(user.id, value as User['role'])}
                      options={[
                        { value: 'admin', label: 'Admin' },
                        { value: 'editor', label: 'Editor' },
                        { value: 'viewer', label: 'Viewer' }
                      ]}
                      className="w-32"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Select
                      value={user.status}
                      onChange={(value: string) => handleStatusChange(user.id, value as User['status'])}
                      options={[
                        { value: 'active', label: 'Active' },
                        { value: 'pending', label: 'Pending' },
                        { value: 'inactive', label: 'Inactive' }
                      ]}
                      className="w-32"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.lastActive
                        ? new Date(user.lastActive).toLocaleDateString()
                        : 'Never'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {user.permissions.canManageProfiles && (
                        <Badge variant="secondary">Profiles</Badge>
                      )}
                      {user.permissions.canManageMemorials && (
                        <Badge variant="secondary">Memorials</Badge>
                      )}
                      {user.permissions.canManageUsers && (
                        <Badge variant="secondary">Users</Badge>
                      )}
                      {user.permissions.canManageSettings && (
                        <Badge variant="secondary">Settings</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {/* Implement edit action */}}
                    >
                      <Icon name="edit" className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
} 