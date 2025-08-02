'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Icon } from '@/components/ui/Icon';
import { universitiesService } from '@/services/universities';
import { useToast } from '@/components/ui/use-toast';
import { getFirebaseServices } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function NewUniversityPage() {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    adminEmail: ''
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <Spinner className="w-8 h-8 text-indigo-600" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    router.push('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { db } = await getFirebaseServices();
      if (!db) {
        toast('Database is not initialized');
        return;
      }

      // Get user by email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', formData.adminEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast('Admin user not found. They must have an account first.');
        return;
      }

      const adminId = querySnapshot.docs[0].id;

      const universityId = await universitiesService.createUniversity({
        name: formData.name,
        createdBy: user.id,
        admins: [adminId],
        isActive: true
      });

      toast('University created successfully');
      router.push('/admin/universities');
    } catch (error) {
      console.error('Error creating university:', error);
      toast('Failed to create university');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                Create New University
              </h1>
              <p className="mt-2 text-gray-600">Set up a new university and assign an admin</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => router.push('/admin')}
              className="text-gray-600 hover:text-gray-900"
            >
              <Icon name="arrow-left" className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          
          <Card className="p-8 bg-white/80 backdrop-blur-sm border border-indigo-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Icon name="academic-cap" className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-xl font-semibold text-gray-900">University Details</h2>
                </div>
                <Input
                  id="name"
                  name="name"
                  label="University Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter university name"
                  className="bg-white/50 backdrop-blur-sm"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Icon name="user" className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Admin Assignment</h2>
                </div>
                <Input
                  id="adminEmail"
                  name="adminEmail"
                  type="email"
                  label="Admin Email"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  required
                  placeholder="Email of the university admin"
                  className="bg-white/50 backdrop-blur-sm"
                />
                <p className="text-sm text-gray-500">
                  This user will have full administrative access to manage the university's profiles and settings.
                </p>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin')}
                  className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Icon name="plus" className="w-5 h-5 mr-2" />
                  Create University
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
} 