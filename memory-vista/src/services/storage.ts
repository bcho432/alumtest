import { getStorage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export interface UploadResult {
  url: string;
  size: number;
  type: string;
}

export const validateFile = (file: File): string | null => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'File type not supported. Please upload a JPEG, PNG, GIF, or WebP image.';
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return 'File size too large. Maximum size is 5MB.';
  }
  
  return null;
};

export const uploadPhoto = async (
  file: File,
  memorialId: string,
  userId: string
): Promise<UploadResult> => {
  const error = validateFile(file);
  if (error) {
    throw new Error(error);
  }

  const storage = getStorage();
  const timestamp = Date.now();
  const fileName = `${memorialId}/${userId}_${timestamp}_${file.name}`;
  const storageRef = ref(storage, `memorials/${fileName}`);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);

    return {
      url,
      size: file.size,
      type: file.type,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file. Please try again.');
  }
};

export const deletePhoto = async (url: string): Promise<void> => {
  try {
    const storage = getStorage();
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file. Please try again.');
  }
};

export const generateThumbnail = async (
  file: File,
  maxWidth: number = 300,
  maxHeight: number = 300
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to create canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create thumbnail'));
            return;
          }
          
          const thumbnailFile = new File([blob], `thumb_${file.name}`, {
            type: file.type,
          });
          resolve(thumbnailFile);
        },
        file.type,
        0.8
      );
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
  });
}; 