'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('memories');
  
  // Sample data - in a real app this would come from an API
  const userProfile = {
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    photoUrl: '',
    joinDate: 'May 2023',
    bio: 'Daughter, sister, and proud mother of two. I created this memorial to honor my father\'s memory and share his wonderful life with family and friends.',
  };
  
  const memorials = [
    {
      id: 'mem-1',
      name: 'Robert Johnson',
      relation: 'Father',
      dateCreated: 'June 15, 2023',
      visits: 245,
      tributes: 18,
      photos: 32,
      coverImage: '/memorial-cover.jpg',
    },
    {
      id: 'mem-2',
      name: 'Elizabeth Myers',
      relation: 'Grandmother',
      dateCreated: 'March 3, 2023',
      visits: 189,
      tributes: 12,
      photos: 24,
      coverImage: '/memorial-cover-2.jpg',
    }
  ];
  
  const recentActivity = [
    { id: 1, type: 'photo', memorial: 'Robert Johnson', date: '2 days ago', description: 'Added 3 new photos to the gallery' },
    { id: 2, type: 'tribute', memorial: 'Robert Johnson', date: '1 week ago', description: 'Received a new tribute from James Smith' },
    { id: 3, type: 'story', memorial: 'Elizabeth Myers', date: '2 weeks ago', description: 'Added a new story "Summer Vacations"' },
  ];
  
  const pinnedMemories = [
    { id: 'p1', title: 'Dad\'s 70th Birthday', date: 'June 12, 2020', description: 'The surprise party we threw at the lake house' },
    { id: 'p2', title: 'Fishing Trip', date: 'August 8, 2018', description: 'Our annual father-daughter fishing trip' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Profile Header */}
      <div className="bg-gradient-primary text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-12">
            {/* Profile Photo */}
            <div className="relative">
              {userProfile.photoUrl ? (
                <img
                  src={userProfile.photoUrl}
                  alt={userProfile.name}
                  className="h-32 w-32 rounded-full ring-4 ring-white object-cover"
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-indigo-800 ring-4 ring-white flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">{userProfile.name.charAt(0)}</span>
                </div>
              )}
              <button className="absolute bottom-0 right-0 bg-indigo-600 p-1.5 rounded-full ring-2 ring-white">
                <Icon name="image" className="h-4 w-4 text-white" />
              </button>
            </div>
            
            {/* Profile Info */}
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold">{userProfile.name}</h1>
              <p className="mt-1 text-indigo-200">{userProfile.email}</p>
              <p className="mt-2 text-indigo-100">Member since {userProfile.joinDate}</p>
              
              <div className="mt-6 flex flex-wrap items-center justify-center md:justify-start gap-4">
                <Link
                  href="/profile/edit"
                  className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  <Icon name="settings" className="mr-2 h-4 w-4" />
                  Edit Profile
                </Link>
                <Link
                  href="/new-memorial"
                  className="inline-flex items-center px-4 py-2 bg-white text-indigo-600 hover:bg-indigo-50 backdrop-blur-sm rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  <Icon name="plus" className="mr-2 h-4 w-4" />
                  New Memorial
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
            {['memories', 'memorials', 'activity', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab 
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'memories' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Pinned Memories</h2>
              <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                Manage Memories
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {pinnedMemories.map((memory) => (
                <div key={memory.id} className="profile-card bg-white p-6">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium text-gray-900">{memory.title}</h3>
                    <div className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {memory.date}
                    </div>
                  </div>
                  <p className="mt-3 text-gray-600">{memory.description}</p>
                  <div className="mt-4 flex space-x-3">
                    <button className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center">
                      <Icon name="image" className="mr-1 h-4 w-4" />
                      View
                    </button>
                    <button className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center">
                      <Icon name="share" className="mr-1 h-4 w-4" />
                      Share
                    </button>
                  </div>
                </div>
              ))}
              
              <div className="profile-card bg-gray-50 p-6 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-center">
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center mb-3">
                  <Icon name="plus" className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Add New Memory</h3>
                <p className="text-gray-500 text-sm mb-4">Preserve moments that matter</p>
                <button className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">
                  Create Memory
                </button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'memorials' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Your Memorials</h2>
              <Link href="/new-memorial" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center">
                <Icon name="plus" className="mr-1 h-4 w-4" />
                Create Memorial
              </Link>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {memorials.map((memorial) => (
                <div key={memorial.id} className="profile-card bg-white overflow-hidden flex flex-col sm:flex-row">
                  <div className="w-full sm:w-1/3 h-48 sm:h-auto bg-indigo-100 flex items-center justify-center">
                    {memorial.coverImage ? (
                      <img src={memorial.coverImage} alt={memorial.name} className="w-full h-full object-cover" />
                    ) : (
                      <Icon name="candle" className="h-12 w-12 text-indigo-300" />
                    )}
                  </div>
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{memorial.name}</h3>
                        <p className="text-sm text-gray-600">{memorial.relation}</p>
                      </div>
                      <div className="dropdown">
                        <button className="text-gray-400 hover:text-gray-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Visits</p>
                        <p className="text-lg font-bold text-indigo-600">{memorial.visits}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Tributes</p>
                        <p className="text-lg font-bold text-indigo-600">{memorial.tributes}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Photos</p>
                        <p className="text-lg font-bold text-indigo-600">{memorial.photos}</p>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-between items-center">
                      <span className="text-xs text-gray-500">Created {memorial.dateCreated}</span>
                      <Link 
                        href={`/memorial/${memorial.id}`}
                        className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md text-sm font-medium hover:bg-indigo-100"
                      >
                        View Memorial
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'activity' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
            
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul role="list" className="divide-y divide-gray-200">
                {recentActivity.map((activity) => (
                  <li key={activity.id}>
                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            {activity.type === 'photo' && (
                              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <Icon name="image" className="h-5 w-5 text-indigo-600" />
                              </div>
                            )}
                            {activity.type === 'tribute' && (
                              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <Icon name="heart" className="h-5 w-5 text-purple-600" />
                              </div>
                            )}
                            {activity.type === 'story' && (
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Icon name="document" className="h-5 w-5 text-blue-600" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-indigo-600">{activity.memorial}</p>
                            <p className="text-sm text-gray-900">{activity.description}</p>
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            {activity.date}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Account Settings</h2>
            
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and preferences.</p>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-gray-200">
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Full name</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{userProfile.name}</dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Email address</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{userProfile.email}</dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Bio</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{userProfile.bio}</dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Account created</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{userProfile.joinDate}</dd>
                  </div>
                </dl>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="button"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Edit
                </button>
              </div>
            </div>
            
            {/* Additional Settings Sections */}
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Privacy Settings</h3>
                </div>
                <div className="border-t border-gray-200 px-4 py-5">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="public-profile"
                          name="public-profile"
                          type="checkbox"
                          defaultChecked={true}
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="public-profile" className="font-medium text-gray-700">Public profile</label>
                        <p className="text-gray-500">Allow others to see your profile and created memorials</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="email-notifications"
                          name="email-notifications"
                          type="checkbox"
                          defaultChecked={true}
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="email-notifications" className="font-medium text-gray-700">Email notifications</label>
                        <p className="text-gray-500">Receive email updates about memorial activity</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Account Actions</h3>
                </div>
                <div className="border-t border-gray-200 px-4 py-5">
                  <div className="space-y-4">
                    <button className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">
                      Change Password
                    </button>
                    <button className="text-red-600 hover:text-red-800 font-medium text-sm">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 