import React from 'react';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { TimelineMediaGallery } from './TimelineMediaGallery';

interface TimelineMediaUploadProps {
  eventId: string;
  existingMedia: string[];
  onMediaChange: (urls: string[]) => void;
}

export const TimelineMediaUpload: React.FC<TimelineMediaUploadProps> = ({
  eventId,
  existingMedia,
  onMediaChange,
}) => {
  const handleFileChange = async (files: File[]) => {
    if (files.length === 0) return;

    // TODO: Implement actual file upload logic
    // For now, we'll just simulate it with placeholder URLs
    const newUrls = files.map((_, index) => `https://example.com/media/${eventId}/${index}`);
    onMediaChange([...existingMedia, ...newUrls]);
  };

  return (
    <div className="space-y-4">
      <TimelineMediaGallery
        mediaUrls={existingMedia}
        onUpload={handleFileChange}
        isEditable={true}
      />
    </div>
  );
}; 