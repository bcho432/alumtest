'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getUniversityInvitations, createInvitation, deleteInvitation } from '@/services/invitations';
import { MemorialInvitation } from '@/types';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function InvitationsPage() {
  return (
    <ProtectedRoute>
      <InvitationsContent />
    </ProtectedRoute>
  );
}

function InvitationsContent() {
  const router = useRouter();
  const { user, userRoles } = useAuth();
  const [invitations, setInvitations] = useState<MemorialInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newInvitation, setNewInvitation] = useState<MemorialInvitation | null>(null);

  // Redirect if not a university admin
  useEffect(() => {
    if (user && userRoles && !userRoles.isUniversityAdmin) {
      router.push('/dashboard');
    }
  }, [user, userRoles, router]);

  // Load invitations
  useEffect(() => {
    async function loadInvitations() {
      if (!user || !userRoles?.isUniversityAdmin) return;
      
      try {
        const data = await getUniversityInvitations(user.uid);
        setInvitations(data);
      } catch (err) {
        setError('Failed to load invitations');
        console.error('Error loading invitations:', err);
      } finally {
        setLoading(false);
      }
    }

    loadInvitations();
  }, [user, userRoles]);

  // Handle invitation creation
  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setCreating(true);
    setError('');
    
    try {
      const invitation = await createInvitation(user.uid, email);
      setInvitations(prev => [...prev, invitation]);
      setNewInvitation(invitation);
      setShowSuccess(true);
      setEmail('');
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err) {
      setError('Failed to create invitation');
      console.error('Error creating invitation:', err);
    } finally {
      setCreating(false);
    }
  };

  // Handle invitation deletion
  const handleDeleteInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to delete this invitation?')) return;
    
    try {
      await deleteInvitation(invitationId);
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (err) {
      setError('Failed to delete invitation');
      console.error('Error deleting invitation:', err);
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
    });
  };

  if (!user || !userRoles?.isUniversityAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Invitations</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Create Invitation Form */}
        <div className="bg-white shadow sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              Invite someone to create a memorial
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>
                Send an invitation link to someone outside your university to create a memorial.
                You'll be able to review and publish their memorial once it's complete.
              </p>
            </div>
            
            {error && (
              <div className="mt-4 rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}
            
            {showSuccess && newInvitation && (
              <div className="mt-4 rounded-md bg-green-50 p-4">
                <div className="text-sm text-green-700">
                  <p>Invitation created successfully!</p>
                  <p className="mt-2">Share this link with the invitee:</p>
                  <code className="block mt-2 p-2 bg-gray-100 rounded">
                    {window.location.origin}/invitation/accept?token={newInvitation.token}
                  </code>
                </div>
              </div>
            )}
            
            <form onSubmit={handleCreateInvitation} className="mt-5">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="w-full sm:w-96">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address (optional)"
                    disabled={creating}
                  />
                </div>
                <Button type="submit" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Invitation'}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Invitations List */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              Active Invitations
            </h3>
            
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading invitations...</p>
              </div>
            ) : invitations.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No invitations yet.</p>
              </div>
            ) : (
              <div className="mt-4">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          Email
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Status
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Created
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Expires
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {invitations.map((invitation) => (
                        <tr key={invitation.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {invitation.email || <span className="text-gray-400">No email</span>}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              invitation.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : invitation.status === 'accepted'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                            }`}>
                              {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {formatDate(invitation.createdAt)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {formatDate(invitation.expiresAt)}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            {invitation.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/invitation/accept?token=${invitation.token}`);
                                    alert('Invitation link copied to clipboard!');
                                  }}
                                  className="text-indigo-600 hover:text-indigo-900 mr-4"
                                >
                                  Copy Link
                                </button>
                                <button
                                  onClick={() => handleDeleteInvitation(invitation.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 