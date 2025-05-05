'use client';

export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getStorage, ref, uploadBytes, getDownloadURL, UploadTask, UploadTaskSnapshot } from 'firebase/storage';
import { updateMemorialPhotos, getMemorial, MemorialPhoto } from '@/services/memorials';
import { Icon } from '@/components/ui/Icon';
import { publishMemorial } from '@/services/memorials';

interface Photo {
  id: string;
  file: File;
  preview: string;
  caption: string;
  uploadDate?: Date;
  size?: number;
  uploadProgress?: number;
  uploadError?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PHOTOS = 20;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const TOTAL_STORAGE_LIMIT = 100 * 1024 * 1024; // 100MB

function PhotosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const memorialId = searchParams.get('memorialId');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [totalStorageUsed, setTotalStorageUsed] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTasksRef = useRef<Map<string, UploadTask>>(new Map());

  useEffect(() => {
    if (!memorialId) return;
    
    const loadMemorial = async () => {
      try {
        const memorial = await getMemorial(memorialId);
        if (memorial.photos) {
          const existingPhotos: Photo[] = memorial.photos.map((photo, index) => ({
            id: `existing-${index}`,
            file: new File([], photo.url),
            preview: photo.url,
            caption: photo.caption,
            uploadDate: new Date(),
          }));
          setPhotos(existingPhotos);
        }
      } catch (err) {
        setError('Failed to load memorial data. Please try again.');
      } finally {
        setInitialLoading(false);
      }
    };

    loadMemorial();
  }, [memorialId]);

  // Cleanup preview URLs and upload tasks
  useEffect(() => {
    return () => {
      photos.forEach(photo => {
        if (photo.preview && !photo.preview.startsWith('http')) {
          URL.revokeObjectURL(photo.preview);
        }
      });
      
      // Store the reference to upload tasks in a local variable
      const currentTasks = uploadTasksRef.current;
      currentTasks.forEach(task => task.cancel());
    };
  }, [photos]);

  // Handle unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Redirect if not authenticated or no memorialId
  if (!user || !memorialId) {
    router.push('/university');
    return null;
  }

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Only JPG, PNG, GIF, and WebP images are allowed.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 5MB.';
    }
    if (totalStorageUsed + file.size > TOTAL_STORAGE_LIMIT) {
      return 'Total storage limit exceeded.';
    }
    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (photos.length + files.length > MAX_PHOTOS) {
      setError(`You can only upload up to ${MAX_PHOTOS} photos.`);
      return;
    }

    const newPhotos: Photo[] = [];
    const errors: string[] = [];

    Array.from(files).forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        newPhotos.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          preview: URL.createObjectURL(file),
          caption: '',
          uploadDate: new Date(),
          size: file.size,
        });
      }
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    if (newPhotos.length > 0) {
      setPhotos(prev => [...prev, ...newPhotos]);
      setTotalStorageUsed(prev => prev + newPhotos.reduce((sum, photo) => sum + (photo.size || 0), 0));
      setHasUnsavedChanges(true);
    }
  };

  const handleCaptionChange = (id: string, caption: string) => {
    setPhotos(prev =>
      prev.map(photo => (photo.id === id ? { ...photo, caption } : photo))
    );
    setHasUnsavedChanges(true);
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === id);
      if (photo) {
        if (photo.preview && !photo.preview.startsWith('http')) {
          URL.revokeObjectURL(photo.preview);
        }
        setTotalStorageUsed(prev => prev - (photo.size || 0));
      }
      return prev.filter(p => p.id !== id);
    });
    setHasUnsavedChanges(true);
  };

  const uploadPhoto = async (photo: Photo): Promise<MemorialPhoto> => {
    if (photo.id.startsWith('existing-')) {
      return {
        url: photo.preview,
        caption: photo.caption,
      };
    }

    const storage = getStorage();
    const storageRef = ref(storage, `memorials/${memorialId}/${photo.id}`);
    const uploadTask = uploadBytes(storageRef, photo.file) as unknown as UploadTask;
    uploadTasksRef.current.set(photo.id, uploadTask);

    try {
      const snapshot = await uploadTask;
      const downloadURL = await getDownloadURL(snapshot.ref);
      return {
        url: downloadURL,
        caption: photo.caption,
      };
    } catch (error) {
      throw new Error(`Failed to upload ${photo.file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      uploadTasksRef.current.delete(photo.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const uploadPromises = photos.map(async photo => {
        try {
          return await uploadPhoto(photo);
        } catch (error) {
          setPhotos(prev =>
            prev.map(p =>
              p.id === photo.id
                ? { ...p, uploadError: error instanceof Error ? error.message : 'Upload failed' }
                : p
            )
          );
          throw error;
        }
      });

      const uploadedPhotos = await Promise.all(uploadPromises);
      await updateMemorialPhotos(memorialId, uploadedPhotos);
      
      // Publish the memorial
      await publishMemorial(memorialId);
      
      setHasUnsavedChanges(false);
      
      // Redirect to the memorial page instead of the dashboard
      router.push(`/memorial/${memorialId}`);
    } catch (err) {
      setError('Failed to upload photos or publish memorial. Please try again.');
      console.error('Error in handleSubmit:', err);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto">
            <Icon name="loading" className="h-6 w-6" />
          </div>
          <p className="mt-4 text-gray-600">Loading memorial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-sm text-gray-500">Step 3 of 3</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-between max-w-3xl mx-auto">
            <div className="text-indigo-600">
              <div className="w-8 h-8 mx-auto rounded-full border-2 border-indigo-600 flex items-center justify-center">
                <Icon name="image" className="h-5 w-5" />
              </div>
              <p className="text-xs mt-1 text-center">Basic Info</p>
            </div>
            <div className="text-indigo-600">
              <div className="w-8 h-8 mx-auto rounded-full border-2 border-indigo-600 flex items-center justify-center">
                <Icon name="life-story" className="h-5 w-5" />
              </div>
              <p className="text-xs mt-1 text-center">Life Story</p>
            </div>
            <div className="text-indigo-600">
              <div className="w-8 h-8 mx-auto rounded-full border-2 border-indigo-600 flex items-center justify-center">
                <Icon name="photos" className="h-5 w-5" />
              </div>
              <p className="text-xs mt-1 text-center">Photos</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow sm:rounded-lg">
          <form onSubmit={handleSubmit}>
            <div className="px-4 py-5 sm:p-6">
              <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Add Photos</h3>
                  <div className="mt-2 max-w-xl text-sm text-gray-500">
                    <p>Upload photos to create a visual memorial. Add captions to provide context.</p>
                    <p className="mt-1">Storage used: {(totalStorageUsed / 1024 / 1024).toFixed(1)}MB / {(TOTAL_STORAGE_LIMIT / 1024 / 1024).toFixed(1)}MB</p>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photos.length >= MAX_PHOTOS || totalStorageUsed >= TOTAL_STORAGE_LIMIT}
                    className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon name="plus" className="h-5 w-5 mr-2 text-gray-400" />
                    Add Photos ({photos.length}/{MAX_PHOTOS})
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ALLOWED_TYPES.join(',')}
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Icon name="error" className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <div className="mt-2 text-sm text-red-700 whitespace-pre-line">{error}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {photos.map(photo => (
                  <div key={photo.id} className="relative group">
                    <div className="aspect-w-3 aspect-h-2 rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={photo.preview}
                        alt="Preview"
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-200"></div>
                      {photo.uploadProgress !== undefined && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                          <div className="text-white text-sm">
                            {photo.uploadProgress}%
                          </div>
                        </div>
                      )}
                      {photo.uploadError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-50">
                          <div className="text-white text-sm text-center px-2">
                            {photo.uploadError}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <input
                        type="text"
                        value={photo.caption}
                        onChange={e => handleCaptionChange(photo.id, e.target.value)}
                        placeholder="Add a caption..."
                        maxLength={200}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        {photo.size ? `${(photo.size / 1024 / 1024).toFixed(1)}MB` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="absolute top-2 right-2 rounded-full bg-red-600 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-500 focus:outline-none"
                    >
                      <Icon name="close" className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    if (hasUnsavedChanges) {
                      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
                        router.back();
                      }
                    } else {
                      router.back();
                    }
                  }}
                  className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || photos.length === 0}
                  className="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Icon name="loading" className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                      Uploading...
                    </>
                  ) : (
                    'Complete Memorial'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function PhotosPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <PhotosContent />
    </Suspense>
  );
} 