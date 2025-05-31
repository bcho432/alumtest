'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFirebaseServices } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/contexts/AuthContext';
import type { Profile, PersonalProfile, MemorialProfile } from '@/types/profile';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { MediaGallery } from '@/components/media/MediaGallery';
import { ShareButton } from '@/components/common/ShareButton';
import { PinButton } from '@/components/common/PinButton';
import { RoleBasedUI } from '@/components/common/RoleBasedUI';
import { EditorRequestButton } from '@/components/common/EditorRequestButton';
import type { University } from '@/types/university';
import { toast } from 'react-hot-toast';
import { Timestamp } from 'firebase/firestore';

interface Memorial {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByName: string;
  isPublic: boolean;
}

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
  const { user } = useAuth();
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const handleClick = () => {
    if (!user) {
      // TODO: handleAuthRequired('view');
      return;
    }

    // TODO: Add auth required and email verification logic if needed
    onRequest();
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
      >
        <Icon name="plus" className="h-5 w-5 mr-2" />
        Request to Join
      </button>

      {showVerificationModal && (
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
                      Email Verification Required
                    </h3>
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">
                        Please verify your email address before requesting to join this university.
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
                    // TODO: sendVerificationEmail();
                    setShowVerificationModal(false);
                  }}
                >
                  Send Verification Email
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowVerificationModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Add type guard functions at the top of the file
const isTimestamp = (value: unknown): value is Timestamp => {
  return value instanceof Timestamp;
};

const isDate = (value: unknown): value is Date => {
  return value instanceof Date;
};

const formatDate = (date: Timestamp | Date | null | undefined): string => {
  if (!date) return 'Not specified';
  try {
    const dateObj = date instanceof Timestamp ? date.toDate() : date;
    return dateObj instanceof Date ? dateObj.toLocaleDateString() : 'Invalid date';
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

export default function ProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [university, setUniversity] = useState<University | null>(null);
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAction, setAuthAction] = useState<'view' | 'edit' | 'comment'>('view');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { db } = await getFirebaseServices();
        const profileRef = doc(db, 'profiles', id as string);
        const profileDoc = await getDoc(profileRef);

        if (profileDoc.exists()) {
          const profileData = profileDoc.data() as Profile;
          setProfile(profileData);

          // Load university data if available
          if (profileData.type === 'memorial' && (profileData as MemorialProfile).universityId) {
            const universityDoc = await getDoc(doc(db, 'universities', (profileData as MemorialProfile).universityId));

            if (universityDoc.exists()) {
              setUniversity({ id: universityDoc.id, ...universityDoc.data() } as University);
            }
          }
        } else {
          toast.error('Profile not found');
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, router]);

  const handleAuthRequired = (action: 'view' | 'edit' | 'comment') => {
    setAuthAction(action);
    setShowAuthModal(true);
  };

  const handleEditorRequest = async (reason: string) => {
    try {
      // Show success message
    } catch (error) {
      console.error('Error requesting editor access:', error);
      // Show error message
    }
  };

  const handleApproveEditor = async (userId: string) => {
    try {
      // Show success message
    } catch (error) {
      console.error('Error approving editor access:', error);
      // Show error message
    }
  };

  const handleRejectEditor = async (userId: string) => {
    try {
      // Show success message
    } catch (error) {
      console.error('Error rejecting editor access:', error);
      // Show error message
    }
  };

  const handleEdit = () => {
    router.push(`/profile/${id}/edit`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="loading" className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Icon name="alert-circle" className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{error || 'Profile not found'}</p>
        </div>
      </div>
    );
  }

  const isPersonalProfile = profile.type === 'personal';
  const personal = isPersonalProfile ? (profile as PersonalProfile) : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-primary text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-12">
            {/* Profile Photo */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="relative mb-6">
                {profile.type === 'personal' && (profile as PersonalProfile).photoURL ? (
                  <img
                    src={(profile as PersonalProfile).photoURL}
                    alt={profile.name}
                    className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-white shadow"
                  />
                ) : profile.type === 'memorial' && (profile as MemorialProfile).imageUrl ? (
                  <img
                    src={(profile as MemorialProfile).imageUrl}
                    alt={profile.name}
                    className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-white shadow"
                  />
                ) : null}
              </div>
            </div>
            {/* Profile Info */}
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold">{profile.name}</h1>
              {/* Only render department and bio for PersonalProfile */}
              {isPersonalProfile && personal && personal.department && (
                <p className="mt-1 text-indigo-200">{personal.department}</p>
              )}
              {isPersonalProfile && personal && personal.bio && (
                <p className="mt-2 text-indigo-100">{personal.bio}</p>
              )}
              <div className="mt-6 flex flex-wrap items-center justify-center md:justify-start gap-4">
                <ShareButton profileId={profile.id} />
                <PinButton profileId={profile.id} />
                <RoleBasedUI allowedRoles={['admin', 'editor']}>
                  <button
                    onClick={handleEdit}
                    className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    <Icon name="edit" className="mr-2 h-4 w-4" />
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
              <div className="prose max-w-none">
                {isPersonalProfile ? (
                  <div className="space-y-6">
                    {personal?.location && (
                      <div>
                        <h2 className="text-lg font-medium text-gray-900">Location</h2>
                        <p className="mt-2 text-gray-600">{personal.location}</p>
                      </div>
                    )}
                    {personal?.contact?.email && (
                      <div>
                        <h2 className="text-lg font-medium text-gray-900">Contact</h2>
                        <p className="mt-2 text-gray-600">{personal.contact.email}</p>
                      </div>
                    )}
                    {personal?.graduationYear && (
                      <div>
                        <h2 className="text-lg font-medium text-gray-900">Graduation Year</h2>
                        <p className="mt-2 text-gray-600">{personal.graduationYear}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">Description</h2>
                      <p className="mt-2 text-gray-600">{(profile as MemorialProfile).description}</p>
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">Life Story</h2>
                      <p className="mt-2 text-gray-600">{(profile as MemorialProfile).lifeStory.content}</p>
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
                      <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {formatDate((profile as MemorialProfile).basicInfo?.dateOfBirth)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Date of Death</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {formatDate((profile as MemorialProfile).basicInfo?.dateOfDeath)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Birth Location</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {(profile as MemorialProfile).basicInfo.birthLocation}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Death Location</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {(profile as MemorialProfile).basicInfo.deathLocation}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Right Column (optional: university info, etc.) */}
          <div className="space-y-8">
            {university && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">University</h2>
                <div className="flex items-center space-x-4">
                  {university.logoUrl && (
                    <img
                      src={university.logoUrl}
                      alt={university.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{university.name}</h3>
                    <p className="text-sm text-gray-500">{university.location || university.name}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}