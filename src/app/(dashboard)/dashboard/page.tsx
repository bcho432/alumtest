'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import dynamic from 'next/dynamic';
import { Icon } from '@/components/ui/Icon';

interface University {
  id: string;
  name: string;
  logo?: string;
  role?: string;
}

// Create a client-side only component for the dashboard content
const DashboardContent = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [adminUniversities, setAdminUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleNavigation = (path: string) => {
    if (path.startsWith('/university/')) {
      const universityId = path.split('/').pop();
      const university = adminUniversities.find(u => u.id === universityId);
      if (university) {
        const urlName = university.name.toLowerCase().replace(/\s+/g, '-');
        router.push(`/university/${urlName}`);
      }
    } else {
      router.push(path);
    }
  };

  useEffect(() => {
    if (user && user.id) {
      fetchData();
    } else if (user === null) {
      // User is explicitly null (not authenticated)
      setLoading(false);
    }
    // If user is undefined, keep loading (waiting for auth to load)
  }, [user?.id]); // Only depend on user.id, not the entire user object

  const fetchData = async () => {
    try {
      if (!user) {
        setError('User not authenticated');
        return;
      }

      // Get all universities
      const { data: universities, error: universitiesError } = await supabase
        .from('universities')
        .select('*');
      
      if (universitiesError) {
        console.error('Universities error:', universitiesError);
        setError('Error fetching universities');
        return;
      }
      
      // For now, show all universities as admin (since university_admins table doesn't exist)
      // TODO: Implement proper admin checking when university_admins table is created
      const adminUnis: University[] = (universities || [])
        .map(uni => ({
          id: uni.id,
          name: uni.name,
          logo: uni.logo_url,
          role: 'Admin' // Temporary - all users see all universities as admin
        }));

      setAdminUniversities(adminUnis);
      setLoading(false);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
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