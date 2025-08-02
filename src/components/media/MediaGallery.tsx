'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MediaService, UploadProgress } from '@/services/MediaService';
import { MediaFolder, Photo } from '@/types/profile';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';

interface MediaGalleryProps {
  profileId: string;
  className?: string;
  files: string[];
  onFileClick: (file: string) => void;
}

export function MediaGallery({ profileId, className, files, onFileClick }: MediaGalleryProps) {
  const { user } = useAuth();
  const { roles, isLoading: rolesLoading } = useUserRoles();
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Photo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFolderSettings, setShowFolderSettings] = useState<string | null>(null);
  const [isDraggingFolder, setIsDraggingFolder] = useState<string | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();

  const isAdmin = roles[profileId] === 'admin';
  const isEditor = roles[profileId] === 'editor';
  const isNewProfile = profileId === 'new';

  // Initialize temporary folder for new profiles
  useEffect(() => {
    if (isNewProfile && user) {
      setFolders([{
        id: 'temp',
        name: 'Temporary Uploads',
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        itemCount: 0
      }]);
      setCurrentFolder('temp');
      setIsLoading(false);
    }
  }, [isNewProfile, user]);

  useEffect(() => {
    if (!profileId || isNewProfile) return;

    const fetchFolders = async () => {
      try {
        const { data: foldersData, error: foldersError } = await supabase
          .from('media_folders')
          .select('*')
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false });

        if (foldersError) {
          console.error('Error fetching folders:', foldersError);
        } else {
          setFolders(foldersData || []);
        }
      } catch (error) {
        console.error('Error fetching folders:', error);
      }
    };

    const fetchPhotos = async () => {
      try {
        const { data: photosData, error: photosError } = await supabase
          .from('media')
          .select('*')
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false });

        if (photosError) {
          console.error('Error fetching photos:', photosError);
        } else {
          setPhotos(photosData || []);
        }
      } catch (error) {
        console.error('Error fetching photos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFolders();
    fetchPhotos();

    // Set up real-time subscriptions
    const foldersSubscription = supabase
      .channel('media_folders')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'media_folders', filter: `profile_id=eq.${profileId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setFolders(prev => [payload.new as MediaFolder, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setFolders(prev => prev.filter(f => f.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setFolders(prev => prev.map(f => f.id === payload.new.id ? payload.new as MediaFolder : f));
          }
        }
      )
      .subscribe();

    const photosSubscription = supabase
      .channel('media')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'media', filter: `profile_id=eq.${profileId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPhotos(prev => [payload.new as Photo, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setPhotos(prev => prev.filter(p => p.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setPhotos(prev => prev.map(p => p.id === payload.new.id ? payload.new as Photo : p));
          }
        }
      )
      .subscribe();

    return () => {
      foldersSubscription.unsubscribe();
      photosSubscription.unsubscribe();
    };
  }, [profileId, isNewProfile]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !user) return;

    setIsCreatingFolder(true);
    try {
      const { error } = await supabase
        .from('media_folders')
        .insert([{
          profile_id: profileId,
          name: newFolderName.trim(),
          created_by: user.id
        }]);

      if (error) throw error;

      setNewFolderName('');
      setShowFolderModal(false);
      toast.success('Folder created successfully');
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('media_folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;

      toast.success('Folder deleted successfully');
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error('Failed to delete folder');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!user) return;

    setIsDeleting(photoId);
    try {
      const { error } = await supabase
        .from('media')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      toast.success('Photo deleted successfully');
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Failed to delete photo');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleUploadPhoto = async (file: File) => {
    if (!user) return;

    setUploading(true);
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('media')
        .upload(`${profileId}/${fileName}`, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(`${profileId}/${fileName}`);

      // Save to database
      const { error: dbError } = await supabase
        .from('media')
        .insert([{
          profile_id: profileId,
          file_path: `${profileId}/${fileName}`,
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: user.id
        }]);

      if (dbError) throw dbError;

      toast.success('Photo uploaded successfully');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      if (!user || !currentFolder || (!isAdmin && !isEditor)) return;
      
      setIsUploading(true);
      try {
        const uploadPromises = acceptedFiles.map(file => 
          MediaService.uploadMedia(file, currentFolder, user.id, (progress) => {
            setUploadProgress(prev => {
              const newProgress = [...prev];
              const index = newProgress.findIndex(p => p.file === file);
              if (index >= 0) {
                newProgress[index] = { ...newProgress[index], progress };
              } else {
                newProgress.push({ file, progress, status: 'uploading' });
              }
              return newProgress;
            });
          })
        );

        const uploadedFiles = await Promise.all(uploadPromises);
        
        // For new profiles, just update the local state
        if (isNewProfile) {
          const newPhotos = uploadedFiles.map(url => ({
            id: Math.random().toString(36).substr(2, 9),
            url,
            uploadedBy: user.id,
            uploadedAt: new Date().toISOString(),
            tags: [],
            folderId: currentFolder
          }));
          setPhotos(prev => [...prev, ...newPhotos]);
          setFilteredPhotos(prev => [...prev, ...newPhotos]);
        } else {
          // For existing profiles, update Supabase
          if (!supabase) {
            toast.error('Database not initialized');
            return;
          }
          const dbInstance = supabase;
          await supabase.from('media').insert(uploadedFiles.map(url => ({
            profile_id: profileId,
            file_path: url,
            file_url: url,
            file_name: url.split('/').pop() || 'Untitled',
            file_size: 0, // Placeholder, will be updated by Supabase Storage
            file_type: url.split('.').pop() || 'unknown',
            uploaded_by: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })));
        }

        toast.success('Photos uploaded successfully');
      } catch (error) {
        console.error('Error uploading photos:', error);
        toast.error('Failed to upload photos');
      } finally {
        setIsUploading(false);
        setUploadProgress([]);
      }
    },
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.ogg']
    }
  });

  const renderMediaPreview = (item: Photo) => {
    const isVideo = item.fileType?.startsWith('video/');
    const aspectRatio = item.metadata?.width && item.metadata?.height
      ? item.metadata.width / item.metadata.height
      : 4/3;

    return (
      <div
        className={`relative group bg-white rounded-lg shadow hover:shadow-lg transition-all duration-200 ${
          selectedItems.has(item.id) ? 'ring-2 ring-indigo-500' : ''
        } ${viewMode === 'list' ? 'flex items-center p-4' : ''}`}
        style={{
          aspectRatio: viewMode === 'grid' ? aspectRatio : undefined
        }}
        role="article"
        aria-label={`Media item: ${item.caption || 'Untitled'}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setSelectedMedia(item);
          }
        }}
      >
        <div className={`${viewMode === 'list' ? 'w-24 h-24' : 'w-full h-full'} rounded-lg overflow-hidden`}>
          {isVideo ? (
            <div className="relative w-full h-full">
              <img
                src={item.metadata?.thumbnailUrl || item.url}
                alt={item.caption || 'Video thumbnail'}
                className="w-full h-full object-cover"
                loading="lazy"
                role="presentation"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon name="play" className="h-12 w-12 text-white opacity-80" aria-hidden="true" />
              </div>
            </div>
          ) : (
            <img
              src={item.url}
              alt={item.caption || 'Media'}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )}
        </div>
        <div className={`absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-200 rounded-lg ${
          viewMode === 'list' ? 'w-24 h-24' : ''
        }`}>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex space-x-2">
              <Tooltip content="Preview (Space)">
                <button
                  onClick={() => setSelectedMedia(item)}
                  className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Preview media"
                >
                  <Icon name="eye" className="h-5 w-5 text-gray-600" aria-hidden="true" />
                </button>
              </Tooltip>
              {isAdmin && (
                <>
                  <Tooltip content="Select (Click)">
                    <button
                      onClick={() => toggleSelection(item.id)}
                      className={`p-2 rounded-full transition-colors ${
                        selectedItems.has(item.id)
                          ? 'bg-indigo-100 text-indigo-600'
                          : 'bg-white hover:bg-gray-100 text-gray-600'
                      }`}
                      aria-label={selectedItems.has(item.id) ? 'Deselect media' : 'Select media'}
                      aria-pressed={selectedItems.has(item.id)}
                    >
                      <Icon name="check" className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </Tooltip>
                  <Tooltip content="Delete (Del)">
                    <button
                      onClick={() => handleDeletePhoto(item.id)}
                      disabled={isDeleting === item.id}
                      className="p-2 bg-white rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
                      aria-label="Delete media"
                    >
                      <Icon name="trash" className="h-5 w-5 text-red-600" aria-hidden="true" />
                    </button>
                  </Tooltip>
                </>
              )}
            </div>
          </div>
        </div>
        <div className={`p-3 ${viewMode === 'list' ? 'flex-1 ml-4' : ''}`}>
          <h3 className="text-sm font-medium text-gray-900 truncate">{item.caption}</h3>
          <div className="flex flex-wrap gap-1 mt-1" role="list" aria-label="Media tags">
            {(item.tags || []).map(tag => (
              <span
                key={tag}
                className="text-xs bg-indigo-50 text-indigo-700 rounded px-2 py-0.5"
                role="listitem"
              >
                #{tag}
              </span>
            ))}
          </div>
          {viewMode === 'list' && (
            <div className="mt-2 text-xs text-gray-500">
              <p>Uploaded by {item.uploadedBy}</p>
              <p>{new Date(item.uploadedAt).toLocaleString()}</p>
              {item.metadata?.width && item.metadata?.height && (
                <p>Dimensions: {item.metadata.width} × {item.metadata.height}</p>
              )}
              {item.metadata?.duration && (
                <p>Duration: {Math.round(item.metadata.duration)}s</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMediaPreviewModal = () => {
    if (!selectedMedia) return null;

    const isVideo = selectedMedia.fileType?.startsWith('video/');
    const aspectRatio = selectedMedia.metadata?.width && selectedMedia.metadata?.height
      ? selectedMedia.metadata.width / selectedMedia.metadata.height
      : 16/9;

    return (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-label="Media preview"
      >
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 relative">
          <button
            className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
            onClick={() => setSelectedMedia(null)}
            aria-label="Close preview"
          >
            <Icon name="x" className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="aspect-w-16 aspect-h-9 mb-4">
            {isVideo ? (
              <video
                src={selectedMedia.url}
                controls
                className="w-full h-full object-contain rounded"
                poster={selectedMedia.metadata?.thumbnailUrl}
                aria-label={selectedMedia.caption || 'Video content'}
              />
            ) : (
              <img
                src={selectedMedia.url}
                alt={selectedMedia.caption || 'Media'}
                className="w-full h-full object-contain rounded"
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{selectedMedia.caption}</h3>
              <div className="flex flex-wrap gap-2 mb-2" role="list" aria-label="Media tags">
                {(selectedMedia.tags || []).map(tag => (
                  <span
                    key={tag}
                    className="text-xs bg-indigo-50 text-indigo-700 rounded px-2 py-0.5"
                    role="listitem"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              <p>Uploaded by {selectedMedia.uploadedBy}</p>
              <p>{new Date(selectedMedia.uploadedAt).toLocaleString()}</p>
              {selectedMedia.metadata?.width && selectedMedia.metadata?.height && (
                <p>Dimensions: {selectedMedia.metadata.width} × {selectedMedia.metadata.height}</p>
              )}
              {selectedMedia.metadata?.duration && (
                <p>Duration: {Math.round(selectedMedia.metadata.duration)}s</p>
              )}
              {selectedMedia.fileSize && (
                <p>File size: {Math.round(selectedMedia.fileSize / 1024)}KB</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const toggleSelection = (mediaId: string) => {
    if (!user || !isAdmin) return;

    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(mediaId)) {
        next.delete(mediaId);
      } else {
        next.add(mediaId);
      }
      return next;
    });
  };

  const handleSearch = (value: string) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      setSearch(value);
      const searchTerm = value.toLowerCase();
      
      const filtered = photos.filter(photo => {
        const matchesFilename = photo.caption?.toLowerCase().includes(searchTerm);
        const matchesTags = photo.tags?.some(tag => tag.toLowerCase().includes(searchTerm));
        const matchesMetadata = Object.entries(photo.metadata || {}).some(([key, value]) => 
          String(value).toLowerCase().includes(searchTerm)
        );
        
        return matchesFilename || matchesTags || matchesMetadata;
      });
      
      setFilteredPhotos(filtered);
    }, 300);
  };

  // Add upload progress UI component
  const renderUploadProgress = () => {
    if (uploadProgress.length === 0) return null;

    return (
      <div className="fixed bottom-4 right-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 z-50">
        <h4 className="font-medium mb-2">Uploading {uploadProgress.length} file(s)</h4>
        <div className="space-y-2">
          {uploadProgress.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="truncate">{item.file.name}</span>
                <span>{Math.round(item.progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading || rolesLoading) {
    return <div className="animate-pulse">Loading media gallery...</div>;
  }

  return (
    <div className={`space-y-6 ${className}`} role="region" aria-label="Media gallery">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Media Gallery</h2>
        <div className="flex gap-4">
          <Input
            type="text"
            placeholder="Search media..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-64"
            aria-label="Search media"
          />
          {(isAdmin || isEditor) && (
            <div className="flex gap-4">
              <Input
                type="text"
                placeholder="New folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-48"
                aria-label="New folder name"
              />
              <Button
                onClick={handleCreateFolder}
                disabled={isCreatingFolder || !newFolderName.trim()}
                aria-label="Create new folder"
              >
                {isCreatingFolder ? 'Creating...' : 'Create Folder'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-sm" role="alert">
          {error}
        </div>
      )}

      {/* Folder List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="Media folders">
        {folders.map((folder) => (
          <div
            key={folder.id}
            className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setCurrentFolder(folder.id)}
            role="listitem"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setCurrentFolder(folder.id);
              }
            }}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{folder.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {folder.itemCount} items
                </p>
              </div>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFolder(folder.id);
                  }}
                  aria-label={`Delete folder ${folder.name}`}
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {currentFolder && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Photos</h3>
          {(isAdmin || isEditor) && (
            <div
              {...getRootProps()}
              className={`mb-4 p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700'}`}
              role="button"
              tabIndex={0}
              aria-label="Upload media"
            >
              <input {...getInputProps()} aria-label="Upload media files" />
              {isDragActive ? (
                <p className="text-blue-500">Drop the files here...</p>
              ) : (
                <div className="space-y-2">
                  <p>Drag and drop files here, or click to select files</p>
                  <p className="text-sm text-gray-500">
                    Supported formats: JPEG, PNG, GIF, WebP, MP4, WebM, OGG
                  </p>
                </div>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" role="list" aria-label="Media items">
            {filteredPhotos.map((photo) => renderMediaPreview(photo))}
          </div>
          {filteredPhotos.length === 0 && (
            <div className="text-center py-8 text-gray-500" role="status">
              {search ? 'No media found matching your search' : 'No media in this folder'}
            </div>
          )}
          {/* hasMore and loadMore logic removed as per new_code */}
        </div>
      )}

      {renderUploadProgress()}
      <AnimatePresence>
        {selectedMedia && renderMediaPreviewModal()}
      </AnimatePresence>
    </div>
  );
} 