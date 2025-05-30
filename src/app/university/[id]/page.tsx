'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFirebaseServices } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/contexts/AuthContext';
import type { UniversityProfile } from '@/types/university';
import type { UserProfile } from '@/types/profile';
import type { Memorial } from '@/types/memorial';
import type { MemorialPreview } from '@/types/memorial';
import { memorialToPreview } from '@/types/memorial';
import Link from 'next/link';

export default function UniversityPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, userRoles } = useAuth();
  const [university, setUniversity] = useState<UniversityProfile | null>(null);
  const [featuredProfiles, setFeaturedProfiles] = useState<UserProfile[]>([]);
  const [recentMemorials, setRecentMemorials] = useState<MemorialPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUniversityData = async () => {
      try {
        const services = await getFirebaseServices();
        
        // Load university data
        const universityRef = doc(services.db, 'universities', id as string);
        const universityDoc = await getDoc(universityRef);
        
        if (!universityDoc.exists()) {
          throw new Error('University not found');
        }
        
        setUniversity({
          id: universityDoc.id,
          ...universityDoc.data()
        } as UniversityProfile);

        // Load featured profiles
        const profilesRef = collection(services.db, 'profiles');
        const profilesQuery = query(
          profilesRef,
          where('universityId', '==', id),
          where('isFeatured', '==', true),
          limit(6)
        );
        const profilesSnapshot = await getDocs(profilesQuery);
        const profiles = profilesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UserProfile[];
        setFeaturedProfiles(profiles);

        // Load recent memorials
        const memorialsRef = collection(services.db, 'memorials');
        const memorialsQuery = query(
          memorialsRef,
          where('universityId', '==', id),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        const memorialsSnapshot = await getDocs(memorialsQuery);
        const memorials = memorialsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate()
        })) as Memorial[];
        setRecentMemorials(memorials.map(memorialToPreview));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load university data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadUniversityData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !university) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Icon name="alert-circle" className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{error || 'University not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 flex-shrink-0">
              {university.branding?.logoUrl ? (
                <img
                  src={university.branding.logoUrl}
                  alt={`${university.name} logo`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-4xl font-bold text-indigo-600">
                    {university.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{university.name}</h1>
              {university.description && (
                <p className="text-lg text-gray-600 mb-4">{university.description}</p>
              )}
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                {university.website && (
                  <a
                    href={university.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
                  >
                    <Icon name="globe" className="h-5 w-5" />
                    Visit Website
                  </a>
                )}
                {university.location && (
                  <span className="inline-flex items-center gap-2 text-gray-600">
                    <Icon name="map-pin" className="h-5 w-5" />
                    {university.location}
                  </span>
                )}
                {typeof id === 'string' && (userRoles?.profileRoles as Record<string, import('@/types/auth').ProfileRole>)?.[id]?.role === 'admin' && (
                  <button
                    onClick={() => router.push(`/admin/universities/${id}`)}
                    className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
                  >
                    <Icon name="settings" className="h-5 w-5" />
                    Manage University
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Profiles */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Featured Profiles</h2>
            <Link
              href={`/university/${id}/profiles`}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProfiles.map((profile) => (
              <Link
                key={profile.id}
                href={`/profile/${profile.id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                  {profile.coverImage ? (
                    <img
                      src={profile.coverImage}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-50">
                      <Icon name="user" className="h-12 w-12 text-indigo-300" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{profile.name}</h3>
                  {profile.department && (
                    <p className="text-sm text-gray-600">{profile.department}</p>
                  )}
                  {profile.graduationYear && (
                    <p className="text-sm text-gray-500">Class of {profile.graduationYear}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Memorials */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Recent Memorials</h2>
            <Link
              href={`/university/${id}/memorials`}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentMemorials.map((memorial) => (
              <Link
                key={memorial.id}
                href={`/memorial/${memorial.id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                  {memorial.coverImage ? (
                    <img
                      src={memorial.coverImage}
                      alt={memorial.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-50">
                      <Icon name="image" className="h-12 w-12 text-indigo-300" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{memorial.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {memorial.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    Created {new Date(memorial.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        {!user && (
          <div className="mt-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Join {university.name} on Memory Vista</h2>
            <p className="mb-6">Create your profile and start preserving memories with your university community.</p>
            <Link
              href={`/auth/signup?type=university&universityId=${id}`}
              className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-full font-semibold hover:bg-indigo-50 transition-colors"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}