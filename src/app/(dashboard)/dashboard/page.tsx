'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getFirebaseServices } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, DocumentData } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import dynamic from 'next/dynamic';
import { Icon } from '@/components/ui/Icon';

interface University {
  id: string;
  name: string;
  logo?: string;
  role?: string;
}

interface PermissionData {
  role: string;
  [key: string]: any;
}

// Create a client-side only component for the dashboard content
const DashboardContent = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [adminUniversities, setAdminUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleNavigation = (path: string) => {
    try {
      if (typeof window !== 'undefined') {
        window.location.href = path;
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  useEffect(() => {
    console.log('Dashboard mounted, user:', user?.uid);
    if (user) {
      fetchData();
    } else {
      console.log('No user found');
      setLoading(false);
    }
  }, [user]);

  const fetchData = async () => {
    try {
      console.log('Fetching data for user:', user?.uid);
      const { db } = await getFirebaseServices();
      if (!db || !user) {
        console.error('Database not initialized or user not authenticated');
        setError('Database not initialized or user not authenticated');
        return;
      }

      // Get all universities
      const universitiesRef = collection(db, 'universities');
      const universitiesSnapshot = await getDocs(universitiesRef);
      console.log('Found', universitiesSnapshot.docs.length, 'universities');

      const adminUnis: University[] = [];

      // Check each university for admin status
      for (const universityDoc of universitiesSnapshot.docs) {
        const data = universityDoc.data();
        console.log('Checking university:', universityDoc.id);
        console.log('University data:', JSON.stringify(data, null, 2));

        // Check both admins and adminIds arrays
        const admins = data.admins || [];
        const adminIds = data.adminIds || [];
        console.log('Admins array:', admins);
        console.log('AdminIds array:', adminIds);
        console.log('Is user in admins array?', admins.includes(user.uid));
        console.log('Is user in adminIds array?', adminIds.includes(user.uid));
        
        if (admins.includes(user.uid) || adminIds.includes(user.uid)) {
          console.log('Found admin in arrays for:', universityDoc.id);
          adminUnis.push({
            id: universityDoc.id,
            name: data.name,
            logo: data.logo,
            role: 'Admin'
          });
          continue;
        }

        // Check permissions subcollection
        const permissionRef = doc(db, 'universities', universityDoc.id, 'permissions', user.uid);
        const permissionDoc = await getDoc(permissionRef);
        console.log('Permission doc exists?', permissionDoc.exists());
        
        if (permissionDoc.exists()) {
          const permissionData = permissionDoc.data() as PermissionData;
          console.log('Permission data:', JSON.stringify(permissionData, null, 2));
          if (permissionData.role === 'admin') {
            console.log('Found admin in permissions for:', universityDoc.id);
            adminUnis.push({
              id: universityDoc.id,
              name: data.name,
              logo: data.logo,
              role: 'Admin'
            });
          }
        }
      }

      console.log('Found', adminUnis.length, 'universities where user is admin');
      setAdminUniversities(adminUnis);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-gray-600">Loading your universities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
          <div className="flex items-center space-x-3 mb-3">
            <Icon name="alert-circle" className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-semibold text-red-800">Error Loading Dashboard</h3>
          </div>
          <p className="text-red-600">{error}</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()} 
            className="mt-4 text-red-600 border-red-200 hover:bg-red-50"
          >
            <Icon name="refresh" className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">University Management</h2>
                <p className="mt-1 text-gray-600">Manage your university profiles and settings</p>
              </div>
              <Button
                onClick={() => handleNavigation('/admin/universities/new')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Icon name="plus" className="w-4 h-4 mr-2" />
                Add University
              </Button>
            </div>
          </div>
          
          {adminUniversities.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Icon name="university" className="w-10 h-10 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No Universities Found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                You are not an admin of any universities yet. Add a university to get started.
              </p>
              <Button
                onClick={() => handleNavigation('/admin/universities/new')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Icon name="plus" className="w-4 h-4 mr-2" />
                Add University
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminUniversities.map(university => (
                <Card 
                  key={university.id} 
                  className="group p-6 bg-white/80 backdrop-blur-sm border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-indigo-200"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      {university.logo ? (
                        <img 
                          src={university.logo} 
                          alt={university.name} 
                          className="w-14 h-14 rounded-xl object-cover mr-4 shadow-md"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mr-4 shadow-md">
                          <span className="text-2xl font-semibold text-white">
                            {university.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {university.name}
                        </h3>
                        <div className="flex items-center mt-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            <Icon name="shield" className="w-3 h-3 mr-1" />
                            {university.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      onClick={() => handleNavigation(`/university/${university.id}`)}
                      className="w-full group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-colors"
                    >
                      <Icon name="eye" className="w-4 h-4 mr-2" />
                      View Public Page
                    </Button>
                    <Button 
                      onClick={() => handleNavigation(`/admin/universities/${university.id}`)}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Icon name="settings" className="w-4 h-4 mr-2" />
                      Manage University
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Create a dynamic import for the dashboard content with SSR disabled
const DashboardContentWithNoSSR = dynamic(() => Promise.resolve(DashboardContent), {
  ssr: false
});

// Main dashboard page component
const Dashboard: React.FC = () => {
  return (
    <DashboardContentWithNoSSR />
  );
};

export default Dashboard; 