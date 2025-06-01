'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFirebaseServices } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/contexts/AuthContext';
import type { Profile, PersonalProfile, MemorialProfile } from '@/types/profile';
import type { Comment } from '@/types/comments';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { MediaGallery } from '@/components/media/MediaGallery';
import { ShareButton } from '@/components/common/ShareButton';
import { PinButton } from '@/components/common/PinButton';
import { RoleBasedUI } from '@/components/common/RoleBasedUI';
import { EditorRequestButton } from '@/components/common/EditorRequestButton';
import type { University } from '@/types/university';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function UniversityProfilePage() {
  const { universityId, id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [university, setUniversity] = useState<University | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAction, setAuthAction] = useState<'view' | 'edit' | 'comment'>('view');
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        console.log('Loading profile data for:', id);
        const services = await getFirebaseServices();
        
        // Get the profile document from the university's profiles collection
        const profileRef = doc(services.db, `universities/${universityId}/profiles/${id}`);
        const profileDoc = await getDoc(profileRef);
        
        if (!profileDoc.exists()) {
          console.error('Profile not found:', id);
          setError('Profile not found');
          setLoading(false);
          return;
        }

        const profileData = {
          id: profileDoc.id,
          ...profileDoc.data()
        } as Profile;
        
        console.log('Found profile:', profileData);
        setProfile(profileData);

        // Load university data
        const universityDoc = await getDoc(doc(services.db, 'universities', universityId as string));
        if (universityDoc.exists()) {
          setUniversity({ id: universityDoc.id, ...universityDoc.data() } as University);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading profile data:', error);
        setError('Failed to load profile data');
        setLoading(false);
      }
    };

    if (id && universityId) {
      loadProfileData();
    } else {
      setError('No profile ID or university ID provided');
      setLoading(false);
    }
  }, [id, universityId]);

  const handleAuthRequired = (action: 'view' | 'edit' | 'comment') => {
    setAuthAction(action);
    setShowAuthModal(true);
  };

  const handleEdit = () => {
    if (!profile) return;
    
    if (profile.type === 'memorial') {
      const memorialProfile = profile as unknown as MemorialProfile;
      router.push(`/admin/universities/${memorialProfile.universityId}/profiles/${id}/edit`);
    } else {
      router.push(`/university/${universityId}/profile/${id}/edit`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
          <Link 
            href={`/university/${universityId}`}
            className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-700"
          >
            <Icon name="arrow-left" className="h-5 w-5 mr-2" />
            Back to University
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center">
              {profile.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <Icon name="user" className="h-16 w-16 text-indigo-600" />
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-5xl font-bold mb-4">{profile.name}</h1>
              {profile.department && (
                <p className="text-xl text-indigo-100 mb-6">{profile.department}</p>
              )}
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <ShareButton url={window.location.href} />
                <PinButton profileId={profile.id} />
                {user && (
                  <button
                    onClick={handleEdit}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-full font-medium hover:bg-indigo-50 transition-colors"
                  >
                    <Icon name="edit" className="h-5 w-5" />
                    Edit Profile
                  </button>
                )}
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
            {/* Basic Info */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>
              <div className="space-y-4">
                {profile.bio && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Biography</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{profile.bio}</p>
                  </div>
                )}
                {/* Add more basic info fields as needed */}
              </div>
            </div>

            {/* Comments */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Comments</h2>
              <CommentsSection
                profileId={profile.id}
                comments={comments}
                onAddComment={setComments}
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
            {profile.photos && profile.photos.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Media</h2>
                <MediaGallery
                  profileId={profile.id}
                  files={profile.photos}
                  onFileClick={(file) => window.open(file, '_blank')}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 