'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/hooks/useAuth';
import type { Profile, PersonalProfile, MemorialProfile } from '@/types/profile';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { MediaGallery } from '@/components/media/MediaGallery';
import { ShareButton } from '@/components/common/ShareButton';
import { PinButton } from '@/components/common/PinButton';
import { RoleBasedUI } from '@/components/common/RoleBasedUI';
import { EditorRequestButton } from '@/components/common/EditorRequestButton';
import type { University } from '@/types/university';
import { toast } from 'react-hot-toast';
import { TimelineView } from '@/components/timeline/TimelineView';
import Link from 'next/link';
import type { Memorial } from '@/types/memorial';
import type { MemorialPreview } from '@/types/memorial';
import { memorialToPreview } from '@/types/memorial';

interface Education {
  institution: string;
  degree?: string;
  years: string;
  description?: string;
  location?: string;
}

interface Experience {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface Achievement {
  title: string;
  date: string;
  description: string;
}

type ProfileData = Profile;

interface RequestToJoinButtonProps {
  universityId: string;
  onRequest: () => void;
}

const RequestToJoinButton: React.FC<RequestToJoinButtonProps> = ({ universityId, onRequest }) => {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleClick = () => {
    setIsRequesting(true);
    onRequest();
    setIsRequesting(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isRequesting}
      className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full font-medium transition-colors"
    >
      <Icon name="users" className="h-5 w-5" />
      {isRequesting ? 'Requesting...' : 'Request to Join'}
    </button>
  );
};

const formatDate = (date: string | Date | any | null | undefined): string => {
  if (!date) return 'N/A';
  try {
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    if (typeof date === 'object' && 'toDate' in date) {
      return date.toDate().toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
  } catch {
    return 'Invalid Date';
  }
};

export default function ProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [university, setUniversity] = useState<University | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAction, setAuthAction] = useState<'view' | 'edit' | 'comment'>('view');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (profileError) {
          throw profileError;
        }

        if (!profileData) {
          setError('Profile not found');
          return;
        }

        setProfile(profileData as ProfileData);

        // Fetch university data if profile has universityId
        if (profileData.universityId) {
          const { data: universityData, error: universityError } = await supabase
            .from('universities')
            .select('*')
            .eq('id', profileData.universityId)
            .single();

          if (!universityError && universityData) {
            setUniversity(universityData as University);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProfile();
    }
  }, [id]);

  const handleAuthRequired = (action: 'view' | 'edit' | 'comment') => {
    toast.error(`Please sign in to ${action} this profile`);
    router.push('/auth/login');
  };

  const handleEditorRequest = async (reason: string) => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase
        .from('editor_requests')
        .insert([{
          profileId: profile.id,
          userId: user.id,
          reason: reason,
          status: 'pending'
        }]);

      if (error) throw error;
      toast.success('Editor request submitted successfully');
    } catch (error) {
      console.error('Error submitting editor request:', error);
      toast.error('Failed to submit editor request');
    }
  };

  const handleApproveEditor = async (userId: string) => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('profile_collaborators')
        .insert([{
          profileId: profile.id,
          userId: userId,
          role: 'editor',
          grantedAt: new Date().toISOString()
        }]);

      if (error) throw error;
      toast.success('Editor approved successfully');
    } catch (error) {
      console.error('Error approving editor:', error);
      toast.error('Failed to approve editor');
    }
  };

  const handleRejectEditor = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('editor_requests')
        .update({ status: 'rejected' })
        .eq('userId', userId);

      if (error) throw error;
      toast.success('Editor request rejected');
    } catch (error) {
      console.error('Error rejecting editor:', error);
      toast.error('Failed to reject editor request');
    }
  };

  const handleEdit = () => {
    if (!user) {
      handleAuthRequired('edit');
      return;
    }
    router.push(`/profile/${id}/edit`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Icon name="exclamation-circle" className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{error || 'Profile not found'}</p>
        </div>
      </div>
    );
  }

  const isPersonalProfile = profile.type === 'personal';
  const personal = isPersonalProfile ? {
    ...profile,
    type: 'personal' as const,
    bio: profile.bio || '',
    photoURL: '',
    location: (profile as any).location || '',
    department: (profile as any).department || '',
    graduationYear: (profile as any).graduationYear || '',
    contact: (profile as any).contact || { email: '', phone: '', website: '' },
    education: (profile as any).education || [],
    experience: (profile as any).experience || [],
    achievements: (profile as any).achievements || []
  } as unknown as PersonalProfile : undefined;
  const memorial = !isPersonalProfile ? {
    ...profile,
    type: 'memorial' as const,
    basicInfo: (profile as any).basicInfo || {
      dateOfBirth: null,
      dateOfDeath: null,
      biography: '',
      photo: '',
      birthLocation: '',
      deathLocation: ''
    },
    lifeStory: (profile as any).lifeStory || { content: '', updatedAt: new Date() },
    timeline: (profile as any).timeline || []
  } as unknown as MemorialProfile : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section with Cover Photo */}
      <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Profile Photo */}
            <div className="w-40 h-40 flex-shrink-0 bg-white rounded-2xl p-4 shadow-xl">
              {isPersonalProfile ? (
                <img
                  src={personal?.photoURL || '/default-avatar.png'}
                  alt={profile?.name || 'Profile'}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : memorial?.basicInfo?.photo ? (
                <img
                  src={memorial.basicInfo.photo}
                  alt={profile?.name || 'Profile'}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="w-full h-full bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Icon name="user" className="h-16 w-16 text-indigo-600" />
                </div>
              )}
            </div>
            
            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-5xl font-bold mb-4">{profile?.name || 'Profile'}</h1>
              {isPersonalProfile ? (
                <div className="space-y-2">
                  {personal?.department && (
                    <p className="text-xl text-indigo-100">{personal.department}</p>
                  )}
                  {personal?.location && (
                    <p className="text-lg text-indigo-100 flex items-center justify-center md:justify-start gap-2">
                      <Icon name="map-pin" className="h-5 w-5" />
                      {personal.location}
                    </p>
                  )}
                  {personal?.graduationYear && (
                    <p className="text-lg text-indigo-100">Class of {personal.graduationYear}</p>
                  )}
                </div>
              ) : (
                <div className="text-gray-100 text-xl space-y-2">
                  <p className="flex items-center justify-center md:justify-start gap-2">
                    <Icon name="calendar" className="h-5 w-5" />
                    Born: {formatDate(memorial?.basicInfo?.dateOfBirth)}
                  </p>
                  <p className="flex items-center justify-center md:justify-start gap-2">
                    <Icon name="calendar" className="h-5 w-5" />
                    Died: {formatDate(memorial?.basicInfo?.dateOfDeath)}
                  </p>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 justify-center md:justify-start mt-6">
                <ShareButton url={`/profile/${id}`} />
                <PinButton profileId={id as string} />
                <RoleBasedUI allowedRoles={['admin', 'editor']}>
                  <button
                    onClick={handleEdit}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full font-medium transition-colors"
                  >
                    <Icon name="edit" className="h-5 w-5" />
                    Edit Profile
                  </button>
                </RoleBasedUI>
                <EditorRequestButton profileId={id as string} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">About</h2>
              <div className="prose max-w-none">
                {isPersonalProfile ? (
                  <div className="space-y-6">
                    {personal?.bio && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Biography</h3>
                        <p className="mt-2 text-gray-600 whitespace-pre-wrap">{personal.bio}</p>
                      </div>
                    )}
                    {personal?.contact && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
                        <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                          {personal.contact.email && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Email</dt>
                              <dd className="mt-1 text-sm text-gray-900">{personal.contact.email}</dd>
                            </div>
                          )}
                          {personal.contact.phone && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Phone</dt>
                              <dd className="mt-1 text-sm text-gray-900">{personal.contact.phone}</dd>
                            </div>
                          )}
                          {personal.contact.website && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Website</dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                <a href={personal.contact.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500">
                                  {personal.contact.website}
                                </a>
                              </dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {memorial?.description && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Description</h3>
                        <p className="mt-2 text-gray-600">{memorial.description}</p>
                      </div>
                    )}
                    {memorial?.lifeStory?.content && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Life Story</h3>
                        <div className="mt-2 text-gray-600">
                          {(() => {
                            try {
                              const lifeStoryContent = JSON.parse(memorial.lifeStory.content) as Record<string, string>;
                              return Object.entries(lifeStoryContent).map(([question, answer]) => (
                                <div key={question} className="mb-4">
                                  <h4 className="font-medium text-gray-900">{question}</h4>
                                  <p className="mt-1 text-gray-600">{answer}</p>
                                </div>
                              ));
                            } catch (error) {
                              console.error('Error parsing life story:', error);
                              return <p className="text-gray-600">{memorial.lifeStory.content}</p>;
                            }
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Timeline Section */}
            {!isPersonalProfile && memorial?.timeline && memorial.timeline.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Life Timeline</h2>
                <TimelineView
                  orgId={profile.id}
                  profileId={profile.id}
                  onEventClick={(event) => {
                    console.log('Event clicked:', event);
                  }}
                />
              </div>
            )}

            {/* Memorials Section - TODO: Implement related memorials feature */}
            {/* {memorials.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Memorials</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {memorials.map((memorial) => (
                    <Link
                      key={memorial.id}
                      href={`/${memorial.universityId}/memorials/${memorial.id}`}
                      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow border border-gray-100"
                    >
                      <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                        {memorial.coverImage ? (
                          <img
                            src={memorial.coverImage}
                            alt={memorial.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-indigo-100">
                            <Icon name="heart" className="h-12 w-12 text-indigo-600" />
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{memorial.title}</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Created {memorial.createdAt instanceof Date ? memorial.createdAt.toLocaleDateString() : new Date(memorial.createdAt.seconds * 1000).toLocaleDateString()}
                        </p>
                        {memorial.description && (
                          <p className="text-gray-600 line-clamp-3">{memorial.description}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )} */}

            {/* Comments Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Comments & Memories</h2>
              <CommentsSection
                profileId={profile.id}
                comments={[]}
                onAddComment={() => {}}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* University Info */}
            {university && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">University</h2>
                <div className="flex items-center gap-4">
                  {university.logoUrl && (
                    <img
                      src={university.logoUrl}
                      alt={university.name}
                      className="h-16 w-16 rounded-xl object-cover"
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{university.name}</h3>
                    <p className="text-sm text-gray-500">{university.location || university.name}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Media Gallery */}
            {profile.type === 'memorial' && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Photo Gallery</h2>
                <MediaGallery
                  profileId={id as string}
                  files={[(profile as any).basicInfo?.photo || '']}
                  onFileClick={(file) => window.open(file, '_blank')}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {authAction === 'comment' ? 'Sign in to Comment' : 'Authentication Required'}
                    </h3>
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">
                        {authAction === 'comment'
                          ? 'Please sign in to leave a comment.'
                          : 'Please sign in to access this feature.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => {
                    router.push('/auth/signin');
                    setShowAuthModal(false);
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowAuthModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}