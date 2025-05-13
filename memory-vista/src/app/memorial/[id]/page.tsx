'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getMemorial } from '@/services/memorials';
import { Memorial } from '@/services/memorials';
import { isMemorialPublished, canEditMemorial } from '@/lib/permissions';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { ErrorBoundary } from 'react-error-boundary';

interface Tab {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  {
    id: 'home',
    name: 'Home',
    icon: (
      <Icon name="timeline" className="h-6 w-6" />
    ),
  },
  {
    id: 'timeline',
    name: 'Timeline',
    icon: (
      <Icon name="familyTree" className="h-6 w-6" />
    ),
  },
  {
    id: 'family-tree',
    name: 'Family Tree',
    icon: (
      <Icon name="chat" className="h-6 w-6" />
    ),
  },
  {
    id: 'chat',
    name: 'Chat',
    icon: (
      <Icon name="candle" className="h-6 w-6" />
    ),
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: (
      <Icon name="share" className="h-6 w-6" />
    ),
  },
];

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Icon name="error" className="h-6 w-6 text-red-500 mx-auto" />
        <p className="text-red-600 mt-2">{error.message}</p>
        <button
          onClick={resetErrorBoundary}
          className="mt-4 text-indigo-600 hover:text-indigo-500"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Icon name="loading" className="h-12 w-12 animate-spin mx-auto" />
        <p className="mt-4 text-gray-600">Loading memorial...</p>
      </div>
    </div>
  );
}

function PhotoGallery({ photos, currentIndex, onIndexChange }: {
  photos: Memorial['photos'];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  if (!photos || photos.length === 0) {
    return (
      <div className="flex items-center justify-center bg-gray-100">
        <Icon name="image" className="h-12 w-12 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="relative aspect-w-16 aspect-h-9">
      {error ? (
        <div className="flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <Icon name="error" className="h-6 w-6 text-red-500 mx-auto" />
            <p className="text-red-600 mt-2">{error}</p>
          </div>
        </div>
      ) : (
        <>
          <img
            src={photos[currentIndex].url}
            alt={photos[currentIndex].caption || 'Memorial photo'}
            className="object-cover cursor-pointer"
            onError={() => setError('Failed to load image')}
          />
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {photos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => onIndexChange(index)}
                  className={`w-2 h-2 rounded-full ${
                    currentIndex === index ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function MemorialPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [memorial, setMemorial] = useState<Memorial | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isPublished, setIsPublished] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check if memorial is published
  useEffect(() => {
    async function checkPublishStatus() {
      if (!params.id) return;
      
      try {
        const published = await isMemorialPublished(params.id as string);
        setIsPublished(published);
      } catch (err) {
        console.error('Error checking published status:', err);
      }
    }
    
    checkPublishStatus();
  }, [params.id]);
  
  // Check if user can edit memorial
  useEffect(() => {
    async function checkEditPermission() {
      if (!params.id || !user) {
        setCanEdit(false);
        return;
      }
      
      try {
        const canEdit = await canEditMemorial(user.uid, params.id as string);
        setCanEdit(canEdit);
      } catch (err) {
        console.error('Error checking edit permission:', err);
        setCanEdit(false);
      }
    }
    
    checkEditPermission();
  }, [params.id, user]);

  const loadMemorial = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const data = await getMemorial(params.id as string);
      setMemorial(data);
      setIsPublished(data.status === 'published');
      setError('');
      setRetryCount(0);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError('Failed to load memorial data');
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, RETRY_DELAY);
      }
    } finally {
      setLoading(false);
    }
  }, [params.id, retryCount]);

  useEffect(() => {
    loadMemorial();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadMemorial]);

  // Handle unauthorized access - redirect to login if not published and not authorized
  useEffect(() => {
    if (!loading && !isPublished && !canEdit && !user) {
      router.push(`/login?redirectUrl=${encodeURIComponent(`/memorial/${params.id}`)}`);
    }
  }, [loading, isPublished, canEdit, user, router, params.id]);

  const handleLightCandle = useCallback(() => {
    // TODO: Implement candle lighting functionality
  }, []);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        // TODO: Show success message
      })
      .catch(() => {
        // TODO: Show error message
      });
  }, []);

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  const handlePhotoIndexChange = useCallback((index: number) => {
    setCurrentPhotoIndex(index);
  }, []);

  const handleFullscreenToggle = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !memorial) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Icon name="error" className="h-6 w-6 text-red-500" />
          <p className="text-red-600">{error || 'Memorial not found'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-indigo-600 hover:text-indigo-500"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={loadMemorial}>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="relative">
          {memorial.photos && memorial.photos.length > 0 ? (
            <div className="relative h-80 sm:h-96 md:h-112 lg:h-128 overflow-hidden">
              <div className="absolute inset-0">
                <img 
                  src={memorial.photos[currentPhotoIndex].url} 
                  alt={memorial.photos[currentPhotoIndex].caption || memorial.basicInfo.name} 
                  className="h-full w-full object-cover filter brightness-75"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-70"></div>
              </div>
              
              <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 text-white">
                <div className="max-w-7xl mx-auto">
                  <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
                    {memorial.basicInfo.name}
                  </h1>
                  <p className="mt-3 text-xl md:text-2xl font-light">
                    {memorial.basicInfo.dateOfBirth} — {memorial.basicInfo.dateOfDeath}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-4">
                    <button
                      onClick={handleLightCandle}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                    >
                      <Icon name="candle" className="h-6 w-6 mr-2" />
                      Light a Candle
                    </button>
                    <button
                      onClick={handleShare}
                      className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-white hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-white transition-all duration-200"
                    >
                      <Icon name="share" className="h-6 w-6 mr-2" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Navigation dots for photos */}
              {memorial.photos.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {memorial.photos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handlePhotoIndexChange(index)}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                        currentPhotoIndex === index ? 'bg-white' : 'bg-white bg-opacity-50 hover:bg-opacity-70'
                      }`}
                    >
                      <span className="sr-only">View photo {index + 1}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-indigo-800 h-64 flex items-center justify-center">
              <div className="text-center text-white">
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
                  {memorial.basicInfo.name}
                </h1>
                <p className="mt-3 text-xl md:text-2xl font-light">
                  {memorial.basicInfo.dateOfBirth} — {memorial.basicInfo.dateOfDeath}
                </p>
                <div className="mt-6 flex justify-center gap-4">
                  <button
                    onClick={handleLightCandle}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                  >
                    <Icon name="candle" className="h-6 w-6 mr-2" />
                    Light a Candle
                  </button>
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-white hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-white transition-all duration-200"
                  >
                    <Icon name="share" className="h-6 w-6 mr-2" />
                    Share
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8 overflow-x-auto hide-scrollbar" aria-label="Tabs">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center px-1 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span className="ml-2">{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'home' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left sidebar with basic info */}
                <div className="md:col-span-1">
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4">
                      <h2 className="text-xl font-semibold text-white">About</h2>
                    </div>
                    <div className="p-6">
                      <dl className="space-y-4">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                          <dd className="mt-1 text-base text-gray-900 font-medium">{memorial.basicInfo.name}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                          <dd className="mt-1 text-base text-gray-900">{memorial.basicInfo.dateOfBirth}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Birth Location</dt>
                          <dd className="mt-1 text-base text-gray-900">{memorial.basicInfo.birthLocation}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Date of Death</dt>
                          <dd className="mt-1 text-base text-gray-900">{memorial.basicInfo.dateOfDeath}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Death Location</dt>
                          <dd className="mt-1 text-base text-gray-900">{memorial.basicInfo.deathLocation}</dd>
                        </div>
                      </dl>
                      
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500">Share</h3>
                        <div className="mt-2 flex space-x-4">
                          <a 
                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-500"
                          >
                            <span className="sr-only">Facebook</span>
                            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                            </svg>
                          </a>
                          <a 
                            href={`https://twitter.com/intent/tweet?text=In%20memory%20of%20${encodeURIComponent(memorial.basicInfo.name)}&url=${encodeURIComponent(window.location.href)}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-500"
                          >
                            <span className="sr-only">Twitter</span>
                            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                            </svg>
                          </a>
                          <a 
                            href={`mailto:?subject=In%20memory%20of%20${encodeURIComponent(memorial.basicInfo.name)}&body=${encodeURIComponent(window.location.href)}`}
                            className="text-gray-400 hover:text-gray-500"
                          >
                            <span className="sr-only">Email</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Candle section */}
                  <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4">
                      <h2 className="text-xl font-semibold text-white">Light a Candle</h2>
                    </div>
                    <div className="p-6 text-center">
                      <div className="flex justify-center mb-4">
                        <Icon name="candle" className="h-16 w-16 text-amber-500" />
                      </div>
                      <p className="text-gray-600 mb-6">
                        Light a candle in memory of {memorial.basicInfo.name.split(' ')[0]} and share your thoughts.
                      </p>
                      <button
                        onClick={handleLightCandle}
                        className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-lg text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200 w-full"
                      >
                        Light a Candle
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Main content - life story and gallery */}
                <div className="md:col-span-2">
                  {/* Photo Carousel */}
                  {memorial.photos && memorial.photos.length > 1 && (
                    <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
                      <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                        <h2 className="text-xl font-semibold text-white">Photo Gallery</h2>
                      </div>
                      <div className="p-6">
                        <div className="relative aspect-w-16 aspect-h-9 rounded-lg overflow-hidden">
                          {memorial.photos && memorial.photos[currentPhotoIndex] && (
                            <img
                              src={memorial.photos[currentPhotoIndex].url}
                              alt={memorial.photos[currentPhotoIndex].caption || 'Memorial photo'}
                              className="object-cover w-full h-full cursor-pointer"
                              onClick={handleFullscreenToggle}
                            />
                          )}
                          
                          {/* Navigation arrows */}
                          {memorial.photos && memorial.photos.length > 1 && (
                            <>
                              <button
                                onClick={() => handlePhotoIndexChange((currentPhotoIndex - 1 + (memorial.photos?.length || 0)) % (memorial.photos?.length || 1))}
                                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-2 text-white hover:bg-opacity-70 focus:outline-none"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handlePhotoIndexChange((currentPhotoIndex + 1) % (memorial.photos?.length || 1))}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-2 text-white hover:bg-opacity-70 focus:outline-none"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                        
                        {memorial.photos && memorial.photos[currentPhotoIndex]?.caption && (
                          <p className="mt-2 text-center text-gray-600 italic">
                            {memorial.photos[currentPhotoIndex].caption}
                          </p>
                        )}
                        
                        {/* Thumbnail navigation */}
                        {memorial.photos && memorial.photos.length > 1 && (
                          <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
                            {memorial.photos?.map((photo, index) => (
                              <button
                                key={index}
                                onClick={() => handlePhotoIndexChange(index)}
                                className={`flex-shrink-0 h-16 w-16 rounded-md overflow-hidden focus:outline-none ${
                                  index === currentPhotoIndex ? 'ring-2 ring-indigo-500' : 'opacity-70 hover:opacity-100'
                                }`}
                              >
                                <img
                                  src={photo.url}
                                  alt={photo.caption || `Photo ${index + 1}`}
                                  className="h-full w-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Life Story */}
                  {memorial.lifeStory && (
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                        <h2 className="text-xl font-semibold text-white">Life Story</h2>
                      </div>
                      <div className="p-6">
                        <div className="prose max-w-none">
                          {memorial.lifeStory.education && (
                            <div className="mb-8">
                              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                                </svg>
                                Education
                              </h3>
                              <p className="text-gray-600">{memorial.lifeStory.education}</p>
                            </div>
                          )}
                          
                          {memorial.lifeStory.notableAchievements && (
                            <div className="mb-8">
                              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                                Notable Achievements
                              </h3>
                              <p className="text-gray-600">{memorial.lifeStory.notableAchievements}</p>
                            </div>
                          )}
                          
                          {memorial.lifeStory.jobs && (
                            <div className="mb-8">
                              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Career
                              </h3>
                              <p className="text-gray-600">{memorial.lifeStory.jobs}</p>
                            </div>
                          )}
                          
                          {memorial.lifeStory.majorLifeEvents && (
                            <div className="mb-8">
                              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Major Life Events
                              </h3>
                              <p className="text-gray-600">{memorial.lifeStory.majorLifeEvents}</p>
                            </div>
                          )}
                          
                          {memorial.lifeStory.hobbies && (
                            <div className="mb-8">
                              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Hobbies & Interests
                              </h3>
                              <p className="text-gray-600">{memorial.lifeStory.hobbies}</p>
                            </div>
                          )}
                          
                          {memorial.lifeStory.personalStories && (
                            <div className="mb-8">
                              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                Personal Stories
                              </h3>
                              <p className="text-gray-600">{memorial.lifeStory.personalStories}</p>
                            </div>
                          )}
                          
                          {memorial.lifeStory.memorableQuotes && (
                            <div className="mb-8">
                              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                                Memorable Quotes
                              </h3>
                              <div className="border-l-4 border-green-200 pl-4 py-2 italic text-gray-700">
                                {memorial.lifeStory.memorableQuotes}
                              </div>
                            </div>
                          )}
                          
                          {memorial.lifeStory.values && (
                            <div className="mb-8">
                              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                Values & Beliefs
                              </h3>
                              <p className="text-gray-600">{memorial.lifeStory.values}</p>
                            </div>
                          )}
                          
                          {memorial.lifeStory.communityInvolvement && (
                            <div className="mb-8">
                              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Community Involvement
                              </h3>
                              <p className="text-gray-600">{memorial.lifeStory.communityInvolvement}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'timeline' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Timeline</h2>
              <p className="text-gray-500 italic">Timeline feature coming soon...</p>
            </div>
          )}
          
          {activeTab === 'family-tree' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Family Tree</h2>
              <p className="text-gray-500 italic">Family tree feature coming soon...</p>
            </div>
          )}
          
          {activeTab === 'chat' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Memorial Chat</h2>
              <p className="text-gray-500 italic">Chat bot feature coming soon...</p>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Memorial Settings</h2>
              <p className="text-gray-500 italic">Settings feature coming soon...</p>
            </div>
          )}
        </main>

        {/* Fullscreen Photo Modal */}
        {isFullscreen && memorial.photos && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
            <button
              onClick={handleFullscreenToggle}
              className="absolute top-4 right-4 text-white hover:text-gray-300 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="relative">
              {memorial.photos[currentPhotoIndex] && (
                <img
                  src={memorial.photos[currentPhotoIndex].url}
                  alt={memorial.photos[currentPhotoIndex].caption || 'Memorial photo'}
                  className="max-h-[90vh] max-w-[90vw] object-contain"
                />
              )}
              
              {memorial.photos && memorial.photos.length > 1 && (
                <>
                  <button
                    onClick={() => handlePhotoIndexChange((currentPhotoIndex - 1 + (memorial.photos?.length || 0)) % (memorial.photos?.length || 1))}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-3 text-white hover:bg-opacity-70 focus:outline-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handlePhotoIndexChange((currentPhotoIndex + 1) % (memorial.photos?.length || 1))}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-3 text-white hover:bg-opacity-70 focus:outline-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>
            
            {memorial.photos && memorial.photos[currentPhotoIndex]?.caption && (
              <div className="absolute bottom-10 left-0 right-0 text-center">
                <p className="text-white text-lg px-4 py-2 bg-black bg-opacity-50 inline-block rounded-lg">
                  {memorial.photos[currentPhotoIndex].caption}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
} 