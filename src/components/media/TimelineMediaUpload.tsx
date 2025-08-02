import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { MediaService } from '@/services/MediaService';
import { TimelineMediaGallery } from './TimelineMediaGallery';

interface TimelineMediaUploadProps {
  eventId: string;
  existingMedia: string[];
  onMediaChange: (mediaUrls: string[]) => void;
}

export const TimelineMediaUpload: React.FC<TimelineMediaUploadProps> = ({
  eventId,
  existingMedia,
  onMediaChange
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ file: File; progress: number }[]>([]);

  const handleFileChange = async (files: File[]) => {
    if (!user) {
      showToast('Please sign in to upload media', 'error');
      return;
    }

    try {
      setIsUploading(true);
      const progress: { file: File; progress: number }[] = files.map(file => ({
        file,
        progress: 0
      }));
      setUploadProgress(progress);

      const results = await MediaService.bulkUploadMedia(
        files,
        eventId,
        user.uid,
        [],
        (uploadProgress) => {
          setUploadProgress(uploadProgress.map(up => ({
            file: up.file,
            progress: up.progress
          })));
        }
      );

      if (results.success.length > 0) {
        const newMediaUrls = [...existingMedia, ...results.success];
        onMediaChange(newMediaUrls);
        showToast('Media uploaded successfully', 'success');
      }

      if (results.failed.length > 0) {
        showToast(`${results.failed.length} file(s) failed to upload`, 'error');
      }
    } catch (error) {
      console.error('Error uploading media:', error);
      showToast('Failed to upload media', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress([]);
    }
  };

  return (
    <TimelineMediaGallery
      mediaUrls={existingMedia}
      onUpload={handleFileChange}
      isEditable={true}
      isUploading={isUploading}
      uploadProgress={uploadProgress}
    />
  );
}; 