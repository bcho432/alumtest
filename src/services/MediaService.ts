import { getFirebaseServices } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, setDoc, writeBatch, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';
import { MediaFolder, Photo } from '@/types/profile';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/hooks/useAuth';

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
  error?: string;
}

export interface BulkUploadResult {
  success: boolean;
  mediaId?: string;
  error?: string;
  file: File;
}

export interface FolderOrder {
  folderId: string;
  order: number;
}

export class MediaService {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  private static readonly ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
  private static readonly ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  private static readonly MAX_CONCURRENT_UPLOADS = 3;
  private static readonly MAX_BULK_UPLOAD_SIZE = 50 * 1024 * 1024; // 50MB total
  private static readonly IMAGE_OPTIMIZATION_QUALITY = 0.8;
  private static readonly THUMBNAIL_SIZE = 300;

  /**
   * List all media folders with their subfolders and metadata
   */
  static async listFolders(parentId: string | null, userId: string): Promise<MediaFolder[]> {
    try {
      const { db } = await getFirebaseServices();
      
      // Get user's folder preferences
      const userPrefsRef = doc(db, 'userPreferences', userId);
      const userPrefsDoc = await getDoc(userPrefsRef);
      const userPrefs = userPrefsDoc.exists() ? userPrefsDoc.data() : { favoriteFolders: [], folderOrder: [] };
      
      // Get folders
      const foldersQuery = query(
        collection(db, 'mediaFolders'),
        where('parentId', '==', parentId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(foldersQuery);
      const folders = await Promise.all(
        snapshot.docs.map(async doc => {
          const data = doc.data();
          const subfolders = await this.listFolders(doc.id, userId);
          
          // Get folder metadata
          const mediaQuery = query(
            collection(db, 'media'),
            where('folderId', '==', doc.id)
          );
          const mediaSnapshot = await getDocs(mediaQuery);
          const mediaCount = mediaSnapshot.size;
          
          // Get folder order
          const folderOrder = userPrefs.folderOrder?.find((order: FolderOrder) => order.folderId === doc.id)?.order || 0;
          
          return {
            id: doc.id,
            ...data,
            subfolders,
            itemCount: mediaCount,
            isFavorite: userPrefs.favoriteFolders?.includes(doc.id) || false,
            order: folderOrder
          } as MediaFolder;
        })
      );
      
      // Sort folders by order and favorites
      return folders.sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
        return (a.order || 0) - (b.order || 0);
      });
    } catch (error) {
      console.error('Error listing folders:', error);
      throw new Error('Failed to list folders');
    }
  }

  /**
   * Create a new media folder with metadata
   */
  static async createFolder(name: string, parentId: string | null, userId: string): Promise<string> {
    try {
      const { db } = await getFirebaseServices();
      const folderRef = doc(collection(db, 'mediaFolders'));
      
      await setDoc(folderRef, {
        name,
        parentId,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        itemCount: 0,
        metadata: {
          color: this.generateFolderColor(),
          description: '',
          isPinned: false,
          lastAccessed: new Date().toISOString()
        }
      });
      
      return folderRef.id;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw new Error('Failed to create folder');
    }
  }

  /**
   * Update folder metadata
   */
  static async updateFolderMetadata(
    folderId: string,
    updates: {
      name?: string;
      description?: string;
      color?: string;
      isPinned?: boolean;
    }
  ): Promise<void> {
    try {
      const { db } = await getFirebaseServices();
      const folderRef = doc(db, 'mediaFolders', folderId);
      
      await updateDoc(folderRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
        'metadata.lastAccessed': new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating folder metadata:', error);
      throw new Error('Failed to update folder metadata');
    }
  }

  /**
   * Toggle folder favorite status
   */
  static async toggleFolderFavorite(folderId: string, userId: string): Promise<void> {
    try {
      const { db } = await getFirebaseServices();
      const userPrefsRef = doc(db, 'userPreferences', userId);
      const userPrefsDoc = await getDoc(userPrefsRef);
      
      if (!userPrefsDoc.exists()) {
        await setDoc(userPrefsRef, {
          favoriteFolders: [folderId],
          folderOrder: []
        });
        return;
      }
      
      const userPrefs = userPrefsDoc.data();
      const favoriteFolders = userPrefs.favoriteFolders || [];
      
      await updateDoc(userPrefsRef, {
        favoriteFolders: favoriteFolders.includes(folderId)
          ? arrayRemove(folderId)
          : arrayUnion(folderId)
      });
    } catch (error) {
      console.error('Error toggling folder favorite:', error);
      throw new Error('Failed to toggle folder favorite');
    }
  }

  /**
   * Update folder order
   */
  static async updateFolderOrder(folderOrders: FolderOrder[], userId: string): Promise<void> {
    try {
      const { db } = await getFirebaseServices();
      const userPrefsRef = doc(db, 'userPreferences', userId);
      
      await setDoc(userPrefsRef, {
        folderOrder: folderOrders
      }, { merge: true });
    } catch (error) {
      console.error('Error updating folder order:', error);
      throw new Error('Failed to update folder order');
    }
  }

  /**
   * Share folder with other users
   */
  static async shareFolder(folderId: string, userId: string, shareWith: string[]): Promise<void> {
    try {
      const { db } = await getFirebaseServices();
      const folderRef = doc(db, 'mediaFolders', folderId);
      
      await updateDoc(folderRef, {
        sharedWith: arrayUnion(...shareWith),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sharing folder:', error);
      throw new Error('Failed to share folder');
    }
  }

  /**
   * Process and optimize uploaded media
   */
  private static async processMedia(file: File): Promise<Blob> {
    try {
      if (file.type.startsWith('image/')) {
        return await this.optimizeImage(file);
      } else if (file.type.startsWith('video/')) {
        return await this.generateVideoThumbnail(file);
      }
      return file;
    } catch (error) {
      console.error('Error processing media:', error);
      throw new Error('Failed to process media');
    }
  }

  /**
   * Optimize image quality and size
   */
  private static async optimizeImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        // Only resize if image is larger than max dimensions
        if (width > this.THUMBNAIL_SIZE || height > this.THUMBNAIL_SIZE) {
          if (width > height) {
            height = (height * this.THUMBNAIL_SIZE) / width;
            width = this.THUMBNAIL_SIZE;
          } else {
            width = (width * this.THUMBNAIL_SIZE) / height;
            height = this.THUMBNAIL_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Apply high-quality image processing
        ctx!.imageSmoothingEnabled = true;
        ctx!.imageSmoothingQuality = 'high';
        ctx!.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to optimize image'));
          },
          file.type,
          this.IMAGE_OPTIMIZATION_QUALITY
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
    });
  }

  /**
   * Generate video thumbnail with high quality
   */
  private static async generateVideoThumbnail(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.preload = 'metadata';
      
      video.onloadeddata = () => {
        // Seek to 1 second or 10% of duration, whichever is shorter
        video.currentTime = Math.min(1, video.duration * 0.1);
      };
      
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        const aspectRatio = video.videoWidth / video.videoHeight;
        
        // Calculate dimensions maintaining aspect ratio
        let width = this.THUMBNAIL_SIZE;
        let height = this.THUMBNAIL_SIZE / aspectRatio;
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx!.imageSmoothingEnabled = true;
        ctx!.imageSmoothingQuality = 'high';
        ctx!.drawImage(video, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to generate thumbnail'));
          },
          'image/jpeg',
          0.9 // Higher quality for thumbnails
        );
      };
      
      video.onerror = () => reject(new Error('Failed to load video'));
    });
  }

  /**
   * Generate a random folder color
   */
  private static generateFolderColor(): string {
    const colors = [
      '#E3F2FD', '#E8F5E9', '#FFF3E0', '#F3E5F5',
      '#E0F7FA', '#FCE4EC', '#F1F8E9', '#FFF8E1'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * List media items in a folder
   */
  static async listMedia(folderId: string | null, tags: string[] = []): Promise<Photo[]> {
    try {
      const { db } = await getFirebaseServices();
      let mediaQuery = query(
        collection(db, 'media'),
        where('folderId', '==', folderId),
        orderBy('createdAt', 'desc')
      );

      if (tags.length > 0) {
        mediaQuery = query(mediaQuery, where('tags', 'array-contains-any', tags));
      }
      
      const snapshot = await getDocs(mediaQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Photo));
    } catch (error) {
      console.error('Error listing media:', error);
      throw new Error('Failed to list media');
    }
  }

  /**
   * Upload media file with progress tracking and optimization
   */
  static async uploadMedia(
    file: File,
    folderId: string | null,
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      const { storage, db } = await getFirebaseServices();
      
      // Process and optimize media before upload
      const processedFile = await this.processMedia(file);
      
      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
      const path = `media/${userId}/${folderId || 'root'}/${fileName}`;
      const storageRef = ref(storage, path);

      const uploadTask = uploadBytesResumable(storageRef, processedFile);
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress?.(progress);
          },
          (error) => {
            console.error('Error uploading file:', error);
            reject(new Error('Failed to upload file'));
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              const mediaRef = await addDoc(collection(db, 'media'), {
                url: downloadURL,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                folderId,
                uploadedBy: userId,
                uploadedAt: serverTimestamp(),
                tags: [],
                metadata: {
                  width: file.type.startsWith('image/') ? (file as any).width : undefined,
                  height: file.type.startsWith('image/') ? (file as any).height : undefined,
                  duration: file.type.startsWith('video/') ? (file as any).duration : undefined,
                  thumbnailUrl: file.type.startsWith('video/') ? downloadURL : undefined
                }
              });
              resolve(mediaRef.id);
            } catch (error) {
              console.error('Error saving media metadata:', error);
              reject(new Error('Failed to save media metadata'));
            }
          }
        );
      });
    } catch (error) {
      console.error('Error in uploadMedia:', error);
      throw new Error('Failed to upload media');
    }
  }

  /**
   * Delete media item
   */
  static async deleteMedia(mediaId: string): Promise<void> {
    try {
      const { storage, db } = await getFirebaseServices();
      
      // Get media document
      const mediaRef = doc(db, 'media', mediaId);
      const mediaDoc = await getDoc(mediaRef);
      
      if (!mediaDoc.exists()) {
        throw new Error('Media not found');
      }
      
      const mediaData = mediaDoc.data();
      
      // Delete from storage
      const storageRef = ref(storage, mediaData.url);
      await deleteObject(storageRef);
      
      // Delete document
      await deleteDoc(mediaRef);
    } catch (error) {
      console.error('Error deleting media:', error);
      throw new Error('Failed to delete media');
    }
  }

  /**
   * Update media metadata
   */
  static async updateMedia(
    mediaId: string,
    updates: Partial<{
      caption: string;
      tags: string[];
      folderId: string | null;
    }>
  ): Promise<void> {
    try {
      const { db } = await getFirebaseServices();
      const mediaRef = doc(db, 'media', mediaId);
      
      await updateDoc(mediaRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating media:', error);
      throw new Error('Failed to update media');
    }
  }

  /**
   * Validate file type and size
   */
  private static isValidFile(file: File): boolean {
    const isValidType = [
      ...this.ALLOWED_IMAGE_TYPES,
      ...this.ALLOWED_VIDEO_TYPES,
      ...this.ALLOWED_DOCUMENT_TYPES
    ].includes(file.type);
    const isValidSize = file.size <= this.MAX_FILE_SIZE;
    return isValidType && isValidSize;
  }

  static async bulkUploadMedia(
    files: File[],
    folderId: string | null,
    userId: string,
    tags: string[] = [],
    onProgress?: (progress: UploadProgress[]) => void
  ): Promise<{ success: string[]; failed: Array<{ fileName: string; error: string }> }> {
    const results = {
      success: [] as string[],
      failed: [] as Array<{ fileName: string; error: string }>
    };

    const progress: UploadProgress[] = files.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));

    onProgress?.(progress);

    const uploadPromises = files.map(async (file, index) => {
      try {
        if (!this.isValidFile(file)) {
          throw new Error(`Invalid file type or size: ${file.name}`);
        }

        const mediaId = await this.uploadMedia(file, folderId, userId, (p: number) => {
          progress[index].progress = p;
          onProgress?.(progress);
        });

        progress[index].status = 'complete';
        onProgress?.(progress);
        results.success.push(mediaId);

        return mediaId;
      } catch (error) {
        progress[index].status = 'error';
        progress[index].error = error instanceof Error ? error.message : 'Upload failed';
        onProgress?.(progress);
        results.failed.push({
          fileName: file.name,
          error: error instanceof Error ? error.message : 'Upload failed'
        });

        return null;
      }
    });

    await Promise.all(uploadPromises);
    return results;
  }

  static async moveMediaToFolder(mediaIds: string[], targetFolderId: string | null): Promise<void> {
    try {
      const { db } = await getFirebaseServices();
      const batch = writeBatch(db);

      mediaIds.forEach(mediaId => {
        const mediaRef = doc(db, 'media', mediaId);
        batch.update(mediaRef, {
          folderId: targetFolderId,
          updatedAt: new Date().toISOString()
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error moving media:', error);
      throw new Error('Failed to move media');
    }
  }

  static async updateMediaTags(mediaIds: string[], tags: string[]): Promise<void> {
    try {
      const { db } = await getFirebaseServices();
      const batch = writeBatch(db);

      mediaIds.forEach(mediaId => {
        const mediaRef = doc(db, 'media', mediaId);
        batch.update(mediaRef, {
          tags,
          updatedAt: new Date().toISOString()
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error updating media tags:', error);
      throw new Error('Failed to update media tags');
    }
  }
} 