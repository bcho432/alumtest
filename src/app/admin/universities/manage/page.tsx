'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Icon } from '@/components/ui/Icon';
import { universitiesService } from '@/services/universities';
import { useToast } from '@/components/ui/use-toast';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getFirebaseServices } from '@/lib/firebase';
import { Badge } from '@/components/ui/Badge';

interface University {
  id: string;
  name: string;
  createdAt: Date;
  createdBy: string;
  admins: string[];
  isActive: boolean;
}

interface User {
  id: string;
  profile: {
    displayName: string;
    email: string;
  };
}

export default function ManageUniversitiesPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const { toast } = useToast();
  const [universities, setUniversities] = useState<University[]>([]);
  const [admins, setAdmins] = useState<Record<string, User[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (!authLoading && !isAdmin) {
      router.push('/');
      return;
    }

    if (user && isAdmin) {
      loadUniversities();
    }
  }, [user, authLoading, isAdmin, router]);

  const loadUniversities = async () => {
    try {
      setLoading(true);
      const unis = await universitiesService.listUniversities();
      setUniversities(unis);

      // Load admins for each university
      const { db } = await getFirebaseServices();
      if (!db) throw new Error('Firestore instance not available');

      const adminMap: Record<string, User[]> = {};
      for (const uni of unis) {
        if (uni.admins.length > 0) {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('id', 'in', uni.admins));
          const snapshot = await getDocs(q);
          const adminUsers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as User[];
          adminMap[uni.id] = adminUsers;
        } else {
          adminMap[uni.id] = [];
        }
      }
      setAdmins(adminMap);
    } catch (error) {
      console.error('Error loading universities:', error);
      toast({
        title: 'Error',
        description: 'Failed to load universities',
        variant: 'destructive'
      } as any);
    } finally {
      setLoading(false);
    }
  };

  const filteredUniversities = universities.filter(uni =>
    uni.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <div className="text-center">
          <Spinner className="w-8 h-8 text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading universities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                Manage Universities
              </h1>
              <p className="mt-2 text-gray-600">View and manage all universities and their admins</p>
            </div>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => router.push('/admin')}
                className="text-gray-600 hover:text-gray-900 border-gray-200 hover:border-gray-300"
              >
                <Icon name="arrow-left" className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Button>
              <Button
                variant="primary"
                onClick={() => router.push('/admin/universities/new')}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Icon name="plus" className="w-5 h-5 mr-2" />
                Create University
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Stats Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search universities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-50 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-indigo-50 rounded-xl px-4 py-2">
                <p className="text-sm text-gray-600">Total Universities</p>
                <p className="text-2xl font-bold text-indigo-600">{universities.length}</p>
              </div>
              <div className="bg-purple-50 rounded-xl px-4 py-2">
                <p className="text-sm text-gray-600">Active Universities</p>
                <p className="text-2xl font-bold text-purple-600">
                  {universities.filter(u => u.isActive).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Universities Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredUniversities.map(university => (
            <Card 
              key={university.id} 
              className="group p-6 bg-white/80 backdrop-blur-sm border border-indigo-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-indigo-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-50 p-2 rounded-lg">
                    <Icon name="university" className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {university.name}
                  </h2>
                </div>
                <Badge variant={university.isActive ? "success" : "secondary"}>
                  {university.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                    <Icon name="users" className="w-4 h-4" />
                    Admins
                  </h3>
                  {admins[university.id]?.length > 0 ? (
                    <div className="space-y-2">
                      {admins[university.id].map(admin => (
                        <div 
                          key={admin.id} 
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{admin.profile.displayName}</p>
                            <p className="text-sm text-gray-500">{admin.profile.email}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/universities/${university.id}`)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Icon name="pencil" className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-gray-50 rounded-lg">
                      <Icon name="user-plus" className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No admins assigned</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <Icon name="calendar" className="w-4 h-4" />
                    Created {university.createdAt.toLocaleDateString()}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/universities/${university.id}`)}
                    className="group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-colors"
                  >
                    Manage
                    <Icon name="arrow-right" className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredUniversities.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-indigo-100">
            <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="university" className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No universities found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? 'Try adjusting your search query' : 'Create your first university to get started'}
            </p>
            {!searchQuery && (
              <Button
                variant="primary"
                onClick={() => router.push('/admin/universities/new')}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Icon name="plus" className="w-5 h-5 mr-2" />
                Create University
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 