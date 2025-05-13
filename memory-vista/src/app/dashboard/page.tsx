'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { getUserUniversityAssociations } from '@/services/invitations';
import { getMemorial, Memorial } from '@/services/memorials';
import { UserUniversityAssociation } from '@/types';
import { doc, query, where, collection, getDocs, getDoc, DocumentData } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

export default function UserDashboardPage() {
  return (
    <ProtectedRoute>
      <UserDashboardContent />
    </ProtectedRoute>
  );
}

function UserDashboardContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [associations, setAssociations] = useState<UserUniversityAssociation[]>([]);
  const [memorialsByUniversity, setMemorialsByUniversity] = useState<{[key: string]: Memorial[]}>({});
  const [universities, setUniversities] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load user's university associations and memorials
  useEffect(() => {
    async function loadUserData() {
      if (!user) return;
      
      try {
        console.log('Loading data for user:', user.uid);
        
        // Get university associations
        const userAssociations = await getUserUniversityAssociations(user.uid);
        console.log('User associations loaded:', userAssociations);
        setAssociations(userAssociations);
        
        // Get university details
        const db = getDb();
        const universityData: {[key: string]: any} = {};
        
        for (const assoc of userAssociations) {
          const uniRef = doc(db, 'universities', assoc.universityId);
          const uniDoc = await getDoc(uniRef);
          if (uniDoc.exists()) {
            universityData[assoc.universityId] = uniDoc.data();
          }
        }
        
        setUniversities(universityData);
        console.log('Universities data loaded:', universityData);
        
        // Get memorials created by user
        const memorialsRef = collection(db, 'memorials');
        const q = query(memorialsRef, where('creatorId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        const memorialsData: {[key: string]: Memorial[]} = {};
        
        console.log('Memorials where user is creator:', querySnapshot.size);
        
        querySnapshot.forEach((doc) => {
          const memorial = {
            id: doc.id,
            ...doc.data()
          } as Memorial;
          
          const uniId = memorial.universityId;
          if (!memorialsData[uniId]) {
            memorialsData[uniId] = [];
          }
          
          memorialsData[uniId].push(memorial);
        });
        
        // Also get memorials where the user is listed as a collaborator
        const collaboratorQuery = query(
          collection(db, 'memorials'), 
          where('collaboratorIds', 'array-contains', user.uid)
        );
        
        const collaboratorSnapshot = await getDocs(collaboratorQuery);
        console.log('Memorials where user is collaborator:', collaboratorSnapshot.size);
        
        collaboratorSnapshot.forEach((doc) => {
          const memorial = {
            id: doc.id,
            ...doc.data()
          } as Memorial;
          
          const uniId = memorial.universityId;
          if (!memorialsData[uniId]) {
            memorialsData[uniId] = [];
          }
          
          // Check if we already added this memorial (shouldn't happen, but just in case)
          if (!memorialsData[uniId].some(m => m.id === memorial.id)) {
            memorialsData[uniId].push(memorial);
          }
        });
        
        // For each university association, also check if there are memorials linked to it
        for (const assoc of userAssociations) {
          // Look for memorials that don't have a creatorId but are associated with this university
          // This handles the case where a memorial was created via an invitation
          if (assoc.memorialIds && assoc.memorialIds.length > 0) {
            console.log(`Association ${assoc.id} has linked memorials:`, assoc.memorialIds);
            
            // Fetch each memorial by ID
            for (const memorialId of assoc.memorialIds) {
              try {
                const memorialDoc = await getDoc(doc(db, 'memorials', memorialId));
                if (memorialDoc.exists()) {
                  const memorial = {
                    id: memorialDoc.id,
                    ...memorialDoc.data()
                  } as Memorial;
                  
                  const uniId = memorial.universityId;
                  if (!memorialsData[uniId]) {
                    memorialsData[uniId] = [];
                  }
                  
                  // Check if we already added this memorial
                  if (!memorialsData[uniId].some(m => m.id === memorial.id)) {
                    memorialsData[uniId].push(memorial);
                  }
                }
              } catch (err) {
                console.error(`Error loading association memorial ${memorialId}:`, err);
              }
            }
          }
        }
        
        console.log('All memorials data:', memorialsData);
        setMemorialsByUniversity(memorialsData);
      } catch (err) {
        console.error('Error loading user data:', err);
        setError('Failed to load your memorials');
      } finally {
        setLoading(false);
      }
    }
    
    loadUserData();
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Dashboard</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        {error ? (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        ) : null}
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your memorials...</p>
          </div>
        ) : (
          <>
            {/* My Memorials Section */}
            <div className="bg-white shadow sm:rounded-lg mb-8">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-base font-semibold leading-6 text-gray-900">
                  My Memorials
                </h3>
                
                {Object.keys(memorialsByUniversity).length === 0 ? (
                  <div className="mt-4 text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No memorials created</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      You haven't created any memorials yet.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4">
                    {Object.entries(memorialsByUniversity).map(([universityId, memorials]) => (
                      <div key={universityId} className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          {universities[universityId]?.name || 'Unknown University'}
                        </h4>
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
                                    {memorial.universityApproved === false && (
                                      <span className="ml-2 inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-gray-100 text-gray-800">
                                        Needs Approval
                                      </span>
                                    )}
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
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* University Associations Section */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-base font-semibold leading-6 text-gray-900">
                  My University Associations
                </h3>
                
                {associations.length === 0 ? (
                  <div className="mt-4 text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No university associations</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      You are not associated with any universities yet.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4">
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                              University
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                              Role
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                              Association Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {associations.map((assoc) => (
                            <tr key={assoc.id}>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                {universities[assoc.universityId]?.name || 'Unknown University'}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                <span className="capitalize">{assoc.role}</span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {new Date(assoc.createdAt).toLocaleDateString()}
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
          </>
        )}
      </main>
    </div>
  );
} 