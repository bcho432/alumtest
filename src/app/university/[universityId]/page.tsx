'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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

export default function UniversityPage({ params }: { params: { universityId: string } }) {
  console.log('=== PAGE COMPONENT START ===');
  console.log('Page component rendered with params:', params);
  
  const [university, setUniversity] = useState<UniversityProfile | null>(null);
  const [featuredProfiles, setFeaturedProfiles] = useState<UserProfile[]>([]);
  const [recentMemorials, setRecentMemorials] = useState<MemorialPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'featured' | 'recent' | 'all'>('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [totalProfiles, setTotalProfiles] = useState(0);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const department = searchParams.get('department') || '';
  const itemsPerPage = 12;

  // Memoized displayed profiles
  const displayedProfiles = useMemo(() => {
    let profiles = [...featuredProfiles];
    if (activeTab === 'all') {
      profiles = allProfiles;
    }
    return profiles.filter(profile => {
      const matchesSearch = !searchQuery || 
        profile.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.department?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment = !selectedDepartment || 
        profile.department === selectedDepartment;
      return matchesSearch && matchesDepartment;
    });
  }, [featuredProfiles, activeTab, searchQuery, selectedDepartment, allProfiles]);

  useEffect(() => {
    const loadUniversityData = async () => {
      try {
        console.log('Loading university data for:', params.universityId);
        const services = await getFirebaseServices();
        const universitiesRef = collection(services.db, 'universities');
        const decodedName = decodeURIComponent(params.universityId).replace(/-/g, ' ');
        console.log('Decoded name:', decodedName);
        
        // Try exact match first
        const q = query(universitiesRef, where('name', '==', decodedName));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          console.error('University not found:', decodedName);
          setError('University not found');
          setLoading(false);
          return;
        }

        const universityDoc = querySnapshot.docs[0];
        const universityData = {
          id: universityDoc.id,
          ...universityDoc.data()
        } as UniversityProfile;
        console.log('Found university:', universityData);
        setUniversity(universityData);

        // Load profiles and memorials in parallel
        const [profilesSnapshot, featuredSnapshot, memorialsSnapshot] = await Promise.all([
          getDocs(collection(services.db, `universities/${universityData.id}/profiles`)),
          getDocs(query(
            collection(services.db, `universities/${universityData.id}/profiles`),
            where('isFeatured', '==', true),
            limit(6)
          )),
          getDocs(query(
            collection(services.db, `universities/${universityData.id}/profiles`),
            where('type', '==', 'memorial'),
            where('status', '==', 'published'),
            orderBy('createdAt', 'desc'),
            limit(3)
          ))
        ]);

        // Process profiles
        const loadedProfiles = profilesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UserProfile[];
        setTotalProfiles(loadedProfiles.length);
        setAllProfiles(loadedProfiles);

        // Extract unique departments
        const uniqueDepartments = Array.from(new Set(
          loadedProfiles
            .filter(profile => profile.department)
            .map(profile => profile.department as string)
        )).sort();
        setDepartments(uniqueDepartments);

        // Process featured profiles
        const featured = featuredSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UserProfile[];
        setFeaturedProfiles(featured);

        // Process memorials
        const memorials = memorialsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date()
        })) as Memorial[];
        setRecentMemorials(memorials.map(memorialToPreview));

        // Check admin status
        if (user) {
          const userDoc = await getDoc(doc(services.db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const orgRoles = userData.orgRoles || {};
            setIsAdmin(orgRoles[universityData.id] === 'admin');
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading university data:', error);
        setError('Failed to load university data');
        setLoading(false);
      }
    };

    if (params.universityId) {
      loadUniversityData();
    } else {
      setError('No university ID provided');
      setLoading(false);
    }
  }, [params.universityId, user]);

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
          <Icon name="exclamation-circle" className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{error || 'University not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 flex-shrink-0 bg-white rounded-2xl p-4 shadow-xl">
              {university.branding?.logoUrl ? (
                <img
                  src={university.branding.logoUrl}
                  alt={`${university.name} logo`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full bg-indigo-100 rounded-xl flex items-center justify-center">
                  <span className="text-4xl font-bold text-indigo-600">
                    {university.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-5xl font-bold mb-4">{university.name}</h1>
              {university.description && (
                <p className="text-xl text-indigo-100 mb-6">{university.description}</p>
              )}
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                {university.website && (
                  <a
                    href={university.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-full font-medium hover:bg-indigo-50 transition-colors"
                  >
                    <Icon name="globe" className="h-5 w-5" />
                    Visit Website
                  </a>
                )}
                {university.location && (
                  <span className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-full">
                    <Icon name="map-pin" className="h-5 w-5" />
                    {university.location}
                  </span>
                )}
                {user && isAdmin && (
                  <button
                    onClick={() => router.push(`/admin/universities/${university.id}`)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-full font-medium hover:bg-indigo-400 transition-colors"
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
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <Icon name="users" className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Profiles</p>
                <p className="text-2xl font-bold text-gray-900">{totalProfiles}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Icon name="star" className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Featured Profiles</p>
                <p className="text-2xl font-bold text-gray-900">{featuredProfiles.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-pink-100 rounded-xl">
                <Icon name="heart" className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Recent Memorials</p>
                <p className="text-2xl font-bold text-gray-900">{recentMemorials.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-12">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search profiles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <Icon
                    name="search"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                  />
                </div>
              </div>
              <div className="w-full md:w-64">
                <select
                  value={selectedDepartment || ''}
                  onChange={(e) => setSelectedDepartment(e.target.value || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {displayedProfiles.map((profile) => (
            <Link
              key={profile.id}
              href={`/university/${university.id}/profile/${profile.id}`}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                {profile.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-100">
                    <Icon name="user" className="h-12 w-12 text-indigo-600" />
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{profile.name}</h3>
                {profile.department && (
                  <p className="text-sm text-gray-600 mb-4">{profile.department}</p>
                )}
                {profile.bio && (
                  <p className="text-gray-600 line-clamp-3">{profile.bio}</p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Memorials Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Recent Memorials</h2>
            <Link
              href={`/${university.id}/memorials`}
              className="text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-2"
            >
              View All
              <Icon name="arrow-right" className="h-5 w-5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentMemorials.map((memorial) => (
              <Link
                key={memorial.id}
                href={`/${university.id}/memorials/${memorial.id}`}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
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
      </div>
    </div>
  );
} 