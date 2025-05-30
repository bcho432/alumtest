'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFirebaseServices } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/contexts/AuthContext';
import type { UniversityProfile } from '@/types/university';
import type { UserProfile } from '@/types/profile';

const ITEMS_PER_PAGE = 12;

type SortOption = 'name' | 'department' | 'graduationYear';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  department?: string;
  graduationYear?: string;
  searchQuery: string;
}

export default function UniversityProfilesPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, userRoles } = useAuth();
  const [university, setUniversity] = useState<UniversityProfile | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    department: undefined,
    graduationYear: undefined
  });
  const [departments, setDepartments] = useState<string[]>([]);
  const [graduationYears, setGraduationYears] = useState<string[]>([]);

  useEffect(() => {
    const loadUniversityData = async () => {
      try {
        const { db } = await getFirebaseServices();
        
        // Load university data
        const universityDoc = await getDoc(doc(db, 'universities', id as string));
        if (!universityDoc.exists()) {
          setError('University not found');
          return;
        }
        setUniversity({ id: universityDoc.id, ...universityDoc.data() } as UniversityProfile);

        // Load unique departments and graduation years
        const profilesRef = collection(db, 'profiles');
        const profilesSnapshot = await getDocs(query(profilesRef, where('universityId', '==', id)));
        
        const departmentsSet = new Set<string>();
        const yearsSet = new Set<string>();
        
        profilesSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.department) departmentsSet.add(data.department);
          if (data.graduationYear) yearsSet.add(data.graduationYear);
        });
        
        setDepartments(Array.from(departmentsSet).sort());
        setGraduationYears(Array.from(yearsSet).sort((a, b) => b.localeCompare(a))); // Most recent first

      } catch (err) {
        console.error('Error loading university data:', err);
        setError('Failed to load university data');
      } finally {
        setLoading(false);
      }
    };

    loadUniversityData();
  }, [id]);

  useEffect(() => {
    loadProfiles();
  }, [id, sortBy, sortDirection, filters]);

  const loadProfiles = async (loadMore: boolean = false) => {
    try {
      const { db } = await getFirebaseServices();
      const profilesRef = collection(db, 'profiles');
      
      // Build query
      let q = query(
        profilesRef,
        where('universityId', '==', id),
        orderBy(sortBy, sortDirection),
        limit(ITEMS_PER_PAGE)
      );

      // Apply filters
      if (filters.department) {
        q = query(q, where('department', '==', filters.department));
      }
      if (filters.graduationYear) {
        q = query(q, where('graduationYear', '==', filters.graduationYear));
      }
      if (filters.searchQuery) {
        q = query(q, where('name', '>=', filters.searchQuery), where('name', '<=', filters.searchQuery + '\uf8ff'));
      }

      // Apply pagination
      if (loadMore && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const newProfiles = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserProfile[];

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);
      
      if (loadMore) {
        setProfiles(prev => [...prev, ...newProfiles]);
      } else {
        setProfiles(newProfiles);
      }
    } catch (err) {
      console.error('Error loading profiles:', err);
      setError('Failed to load profiles');
    }
  };

  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setLastDoc(null);
  };

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{university.name} Profiles</h1>
              <p className="mt-1 text-sm text-gray-500">
                Browse and connect with alumni and community members
              </p>
              <p className="text-sm text-gray-500">
                {university.location}
              </p>
            </div>
            {userRoles?.profileRoles?.[id as string]?.role === 'admin' && (
              <button
                onClick={() => router.push(`/admin/universities/${id}/profiles`)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Icon name="settings" className="h-5 w-5 mr-2" />
                Manage Profiles
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                id="search"
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                placeholder="Search by name..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                id="department"
                value={filters.department || ''}
                onChange={(e) => handleFilterChange('department', e.target.value || undefined)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="graduationYear" className="block text-sm font-medium text-gray-700 mb-1">
                Graduation Year
              </label>
              <select
                id="graduationYear"
                value={filters.graduationYear || ''}
                onChange={(e) => handleFilterChange('graduationYear', e.target.value || undefined)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">All Years</option>
                {graduationYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSort('name')}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${
                    sortBy === 'name'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Name {sortBy === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSort('department')}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${
                    sortBy === 'department'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Department {sortBy === 'department' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSort('graduationYear')}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${
                    sortBy === 'graduationYear'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Year {sortBy === 'graduationYear' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {profiles.map((profile) => (
            <a
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
            </a>
          ))}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="mt-8 text-center">
            <button
              onClick={() => loadProfiles(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
            >
              Load More
              <Icon name="chevron-down" className="ml-2 h-5 w-5" />
            </button>
          </div>
        )}

        {/* No Results */}
        {profiles.length === 0 && !loading && (
          <div className="text-center py-12">
            <Icon name="search" className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No profiles found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 