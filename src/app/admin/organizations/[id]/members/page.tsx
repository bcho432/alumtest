'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
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
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useToast } from '@/components/ui/toast';
import type { User } from '@/types/user';

interface OrganizationMember {
  id: string;
  role: 'admin' | 'editor' | 'viewer';
  user: User;
}

export default function OrganizationMembersPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [organization, setOrganization] = useState<any>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');
  const [filterRole, setFilterRole] = useState<string>('');
  const [sortField, setSortField] = useState<'name' | 'email' | 'role'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }

    const fetchData = async () => {
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
        // Fetch organization
        const orgDoc = await getDoc(doc(db, 'organizations', params.id));
        if (!orgDoc.exists()) {
          router.push('/admin/organizations');
          return;
        }
        setOrganization({ id: orgDoc.id, ...orgDoc.data() });

        // Fetch all users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const users = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as User[];
        setAvailableUsers(users);

        // Map members with user data
        const membersData = Object.entries(orgDoc.data().members || {})
          .map(([userId, role]) => {
            const user = users.find(u => u.id === userId);
            if (!user) return null;
            return {
              id: userId,
              role: role as 'admin' | 'editor' | 'viewer',
              user
            };
          })
          .filter((member): member is OrganizationMember => member !== null);
        setMembers(membersData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch organization data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin, router, params.id, toast]);

  const handleRemoveMember = async (member: OrganizationMember) => {
    setSelectedMember(member);
    setShowRemoveDialog(true);
  };

  const confirmRemoveMember = async () => {
    if (!selectedMember || !organization) return;

    if (!db) {
      toast({
        title: 'Error',
        description: 'Firestore is not initialized',
        variant: 'destructive'
      });
      return;
    }

    try {
      const orgRef = doc(db, 'organizations', params.id);
      const updatedMembers = { ...organization.members };
      delete updatedMembers[selectedMember.id];

      await updateDoc(orgRef, {
        members: updatedMembers
      });

      setMembers(members.filter(m => m.id !== selectedMember.id));
      toast({
        title: 'Success',
        description: 'Member removed successfully',
        variant: 'success'
      });
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive'
      });
    } finally {
      setShowRemoveDialog(false);
      setSelectedMember(null);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUser || !selectedRole || !organization) return;

    if (!db) {
      toast({
        title: 'Error',
        description: 'Firestore is not initialized',
        variant: 'destructive'
      });
      return;
    }

    try {
      const orgRef = doc(db, 'organizations', params.id);
      const updatedMembers = {
        ...organization.members,
        [selectedUser]: selectedRole
      };

      await updateDoc(orgRef, {
        members: updatedMembers
      });

      const newUser = availableUsers.find(u => u.id === selectedUser);
      if (newUser) {
        setMembers([
          ...members,
          {
            id: selectedUser,
            role: selectedRole,
            user: newUser
          }
        ]);
      }

      toast({
        title: 'Success',
        description: 'Member added successfully',
        variant: 'success'
      });
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: 'Error',
        description: 'Failed to add member',
        variant: 'destructive'
      });
    } finally {
      setShowAddMemberDialog(false);
      setSelectedUser('');
      setSelectedRole('viewer');
    }
  };

  const filteredMembers = members
    .filter(member => {
      const matchesSearch = 
        member.user.profile?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.user.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = !filterRole || member.role === filterRole;
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = (a.user.profile?.displayName || '').localeCompare(b.user.profile?.displayName || '');
          break;
        case 'email':
          comparison = (a.user.profile?.email || '').localeCompare(b.user.profile?.email || '');
          break;
        case 'role':
          comparison = a.role.localeCompare(b.role);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const roleColors = {
    admin: 'bg-red-100 text-red-800',
    editor: 'bg-blue-100 text-blue-800',
    viewer: 'bg-gray-100 text-gray-800'
  };

  useKeyboardNavigation({
    '/': () => router.push('/'),
    'Escape': () => {
      setShowRemoveDialog(false);
      setShowAddMemberDialog(false);
    }
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

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Organizations', href: '/admin/organizations' },
          { label: 'Organization', href: `/admin/organizations/${params.id}` },
          { label: 'Members' }
        ]}
      />

      <Card className="mt-6">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">Organization Members</h1>
            <Button
              variant="primary"
              onClick={() => setShowAddMemberDialog(true)}
            >
              Add Member
            </Button>
          </div>

          <div className="grid gap-4 mb-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <Input
                type="search"
                placeholder="Search members..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
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
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>

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
                  <Head 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      setSortField('email');
                      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    Email {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </Head>
                  <Head 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      setSortField('role');
                      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    Role {sortField === 'role' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </Head>
                  <Head>Actions</Head>
                </Row>
              </Header>
              <Body>
                {filteredMembers.map(member => (
                  <Row key={member.id} className="hover:bg-gray-50">
                    <Cell className="font-medium">
                      {member.user.profile?.displayName || 'N/A'}
                    </Cell>
                    <Cell>{member.user.profile?.email || 'N/A'}</Cell>
                    <Cell>
                      <Badge
                        variant="secondary"
                        className={roleColors[member.role]}
                      >
                        {member.role}
                      </Badge>
                    </Cell>
                    <Cell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveMember(member)}
                          title="Remove Member"
                        >
                          Remove
                        </Button>
                      </div>
                    </Cell>
                  </Row>
                ))}
              </Body>
            </Table>
          </div>

          {filteredMembers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No members found matching your criteria
            </div>
          )}
        </div>
      </Card>

      <ConfirmDialog
        title="Remove Member"
        message={`Are you sure you want to remove ${selectedMember?.user.profile?.displayName} from the organization?`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="primary"
        onConfirm={confirmRemoveMember}
        onCancel={() => setShowRemoveDialog(false)}
      />

      {showAddMemberDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Add Member</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  User
                </label>
                <Select
                  value={selectedUser}
                  onChange={setSelectedUser}
                  className="mt-1"
                  options={[
                    { value: '', label: 'Select a user' },
                    ...availableUsers
                      .filter(user => !members.find(m => m.id === user.id))
                      .map(user => ({
                        value: user.id,
                        label: user.profile?.displayName || user.profile?.email || user.id
                      }))
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <Select
                  value={selectedRole}
                  onChange={value => setSelectedRole(value as 'admin' | 'editor' | 'viewer')}
                  className="mt-1"
                  options={[
                    { value: 'admin', label: 'Admin' },
                    { value: 'editor', label: 'Editor' },
                    { value: 'viewer', label: 'Viewer' }
                  ]}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowAddMemberDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAddMember}
                disabled={!selectedUser || !selectedRole}
              >
                Add Member
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
} 