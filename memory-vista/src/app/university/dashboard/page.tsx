'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getUniversityMemorials } from '@/services/memorials';
import { Memorial } from '@/services/memorials';
import { Icon } from '@/components/ui/Icon';
import { createInvitation } from '@/services/invitations';

export default function UniversityDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [showInviteUI, setShowInviteUI] = useState(false);
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [newInvitation, setNewInvitation] = useState<any>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/university');
    }
  }, [user, router]);

  // Fetch memorials
  useEffect(() => {
    async function fetchMemorials() {
      if (!user) return;
      
      try {
        const data = await getUniversityMemorials(user.uid);
        setMemorials(data);
      } catch (err) {
        setError('Failed to load memorials');
        console.error('Error fetching memorials:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMemorials();
  }, [user]);

  // Add the handleCreateInvitation function
  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setCreatingInvite(true);
    setInviteError('');
    
    try {
      const invitation = await createInvitation(user.uid, inviteEmail);
      setNewInvitation(invitation);
      setInviteSuccess(true);
      setInviteEmail('');
    } catch (err) {
      setInviteError('Failed to create invitation. Please try again.');
      console.error('Error creating invitation:', err);
    } finally {
      setCreatingInvite(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Create Memorial
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">Total Memorials</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{memorials.length}</dd>
          </div>
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">Published Memorials</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
              {memorials.filter(m => m.status === 'published').length}
            </dd>
          </div>
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">Draft Memorials</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
              {memorials.filter(m => m.status === 'draft').length}
            </dd>
          </div>
        </div>

        {/* Memorial List */}
        <div className="mt-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h2 className="text-base font-semibold leading-6 text-gray-900">Memorials</h2>
              <p className="mt-2 text-sm text-gray-700">
                A list of all memorials in your institution.
              </p>
            </div>
            <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Add Memorial
              </button>
            </div>
          </div>

          {loading ? (
            <div className="mt-8 text-center">
              <Icon name="loading" className="h-12 w-12 animate-spin mx-auto text-indigo-600" />
              <p className="mt-4 text-gray-600">Loading memorials...</p>
            </div>
          ) : error ? (
            <div className="mt-8 text-center">
              <Icon name="error" className="h-12 w-12 mx-auto text-red-500" />
              <p className="mt-4 text-red-600">{error}</p>
            </div>
          ) : memorials.length === 0 ? (
            <div className="mt-8 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No memorials</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new memorial.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  <svg
                    className="-ml-0.5 mr-1.5 h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"
                    />
                  </svg>
                  New Memorial
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-8 flow-root">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                            Name
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Status
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Created
                          </th>
                          <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {memorials.map((memorial) => (
                          <tr key={memorial.id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                              {memorial.basicInfo.name}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                memorial.status === 'published' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {memorial.status === 'published' ? 'Published' : 'Draft'}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {new Date(memorial.createdAt).toLocaleDateString()}
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              <Link
                                href={`/memorial/${memorial.id}`}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                View<span className="sr-only">, {memorial.basicInfo.name}</span>
                              </Link>
                              <Link
                                href={`/university/memorials/edit/${memorial.id}`}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Edit<span className="sr-only">, {memorial.basicInfo.name}</span>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Memorial Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity">
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">
                      Create New Memorial
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Choose how you would like to create a new memorial.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  <button
                    type="button"
                    onClick={() => router.push('/university/memorials/create')}
                    className="inline-flex w-full justify-center items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"></path>
                    </svg>
                    Create Memorial Yourself
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Showing invitation UI');
                      setIsCreating(false);
                      setShowInviteUI(true);
                    }}
                    className="inline-flex w-full justify-center items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    <svg className="mr-2 h-5 w-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"></path>
                    </svg>
                    Invite Someone to Create Memorial
                  </button>
                </div>
                <div className="mt-5 sm:mt-6">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="inline-flex w-full justify-center rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add the new Invite UI section */}
      {showInviteUI && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity">
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">
                      Invite Someone to Create a Memorial
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Send an invitation link to someone outside your university to create a memorial.
                      </p>
                    </div>
                  </div>
                </div>
                
                {inviteError && (
                  <div className="mt-4 rounded-md bg-red-50 p-4">
                    <div className="text-sm text-red-700">{inviteError}</div>
                  </div>
                )}
                
                {inviteSuccess && newInvitation && (
                  <div className="mt-4 rounded-md bg-green-50 p-4">
                    <div className="text-sm text-green-700">
                      <p>Invitation created successfully!</p>
                      <p className="mt-2">Share this link with the invitee:</p>
                      <div className="flex mt-2">
                        <input
                          type="text"
                          readOnly
                          value={`${typeof window !== 'undefined' ? window.location.origin : ''}/invitation/accept?token=${newInvitation.token}`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-l-md text-sm"
                          onClick={(e) => e.currentTarget.select()}
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${typeof window !== 'undefined' ? window.location.origin : ''}/invitation/accept?token=${newInvitation.token}`);
                            setInviteCopied(true);
                            setTimeout(() => setInviteCopied(false), 2000);
                          }}
                          className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-r-md hover:bg-indigo-500"
                        >
                          {inviteCopied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <p className="mt-3 text-sm">
                        <strong>Note:</strong> The invitee will need to create an account or sign in to accept this invitation.
                        They will then be able to create a memorial that will be linked to your university.
                      </p>
                    </div>
                  </div>
                )}
                
                <form className="mt-5" onSubmit={handleCreateInvitation}>
                  <div className="mb-4">
                    <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      id="invite-email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Email of the person you're inviting"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={creatingInvite}
                      className="flex-1 inline-flex justify-center items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      {creatingInvite ? 'Creating...' : 'Create Invitation'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowInviteUI(false)}
                      className="flex-1 inline-flex justify-center rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 