'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { toast } from 'react-hot-toast';
import { getFirebaseServices } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { RootLayout } from '@/components/layout/RootLayout';

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [displayName, setDisplayName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
    if (user) {
      setDisplayName(user.displayName || '');
    }
  }, [user, loading, router]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { db } = await getFirebaseServices();
      if (!db) throw new Error('Firestore instance not available');

      await updateDoc(doc(db, 'users', user.uid), {
        displayName: displayName,
        updatedAt: new Date().toISOString()
      });

      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <RootLayout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </RootLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <RootLayout>
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <TabsRoot value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white shadow-sm">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card className="p-6 bg-white shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
                  {!isEditing && (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Profile
                    </Button>
                  )}
                </div>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="mt-1 text-sm text-gray-900">{user.email}</div>
                  </div>

                  <div>
                    <Label htmlFor="displayName">Display Name</Label>
                    {isEditing ? (
                      <div className="mt-1 flex items-center gap-4">
                        <Input
                          id="displayName"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="max-w-md"
                        />
                        <Button
                          onClick={handleUpdateProfile}
                          disabled={isSaving}
                        >
                          {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            setDisplayName(user.displayName || '');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-1 text-sm text-gray-900">{user.displayName || 'Not set'}</div>
                    )}
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card className="p-6 bg-white shadow-sm">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
                
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h2>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="notifications">Email Notifications</Label>
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="notifyComments"
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="notifyComments" className="ml-2 block text-sm text-gray-900">
                              Notify me about new comments
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="notifyUpdates"
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="notifyUpdates" className="ml-2 block text-sm text-gray-900">
                              Notify me about profile updates
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Danger Zone</h2>
                    <div className="space-y-4">
                      <div>
                        <Button
                          variant="primary"
                          onClick={() => signOut()}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Sign Out
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </TabsRoot>
        </div>
      </div>
    </RootLayout>
  );
} 