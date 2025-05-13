'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getInvitationByToken, acceptInvitation } from '@/services/invitations';
import { Button } from '@/components/ui/Button';

export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [accepting, setAccepting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const token = searchParams.get('token');

  // Load invitation details
  useEffect(() => {
    async function loadInvitation() {
      if (!token) {
        setError('Invalid invitation link. No token provided.');
        setLoading(false);
        return;
      }
      
      try {
        console.log('Loading invitation with token:', token);
        const invitation = await getInvitationByToken(token);
        console.log('Invitation data:', invitation);
        
        if (!invitation) {
          setError('Invitation not found or has expired.');
          setLoading(false);
          return;
        }
        
        if (invitation.status !== 'pending') {
          setError(`This invitation has already been ${invitation.status}.`);
          setLoading(false);
          return;
        }
        
        if (invitation.expiresAt < new Date()) {
          setError('This invitation has expired.');
          setLoading(false);
          return;
        }
        
        setInvitation(invitation);
        setLoading(false);
      } catch (err) {
        console.error('Error loading invitation:', err);
        let errorMessage = 'Error loading invitation. Please try again.';
        
        // Add more detailed error information for debugging
        if (err instanceof Error) {
          console.error('Error details:', err.message);
          errorMessage = `Memorial Invitation Error: ${err.message}`;
        }
        
        setError(errorMessage);
        setLoading(false);
      }
    }

    loadInvitation();
  }, [token]);

  // Handle accepting invitation
  const handleAcceptInvitation = async () => {
    if (!user || !token) return;
    
    setAccepting(true);
    setError('');
    
    try {
      const result = await acceptInvitation(token, user.uid);
      setSuccess(true);
      
      // After 2 seconds, redirect to memorial creation page
      setTimeout(() => {
        router.push('/university/memorials/create?external=true&universityId=' + result.invitation.universityId);
      }, 2000);
    } catch (err) {
      setError('Failed to accept invitation. Please try again.');
      console.error('Error accepting invitation:', err);
      setAccepting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Memorial Invitation
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Verifying invitation...</p>
            </div>
          ) : error ? (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                  <div className="mt-4">
                    <Link
                      href="/"
                      className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-sm font-medium text-red-700 hover:bg-red-100"
                    >
                      Return to homepage
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : success ? (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Success!</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>You've successfully accepted the invitation.</p>
                    <p className="mt-1">Redirecting you to create a memorial...</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <p className="text-sm text-gray-600">
                  You've been invited to create a memorial for a university. To proceed, please log in or create an account.
                </p>
              </div>

              {user ? (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-600">
                      Logged in as <span className="font-semibold">{user.email}</span>
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      Click the button below to accept this invitation and proceed to create a memorial.
                    </p>
                    <Button
                      onClick={handleAcceptInvitation}
                      disabled={accepting}
                      className="w-full"
                    >
                      {accepting ? 'Accepting...' : 'Accept Invitation'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      You need to sign in or create an account to accept this invitation.
                    </p>
                    <Link href={`/login?redirectUrl=${encodeURIComponent(`/invitation/accept?token=${token}`)}`}>
                      <Button className="w-full">
                        Sign In
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or</span>
                    </div>
                  </div>
                  
                  <div>
                    <Link href={`/signup?redirectUrl=${encodeURIComponent(`/invitation/accept?token=${token}`)}`}>
                      <Button variant="outline" className="w-full">
                        Create Account
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 