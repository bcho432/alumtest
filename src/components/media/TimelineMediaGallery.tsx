import React from 'react';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';

interface TimelineMediaGalleryProps {
  mediaUrls: string[];
  onUpload?: (files: File[]) => Promise<void>;
  isEditable?: boolean;
}

export const TimelineMediaGallery: React.FC<TimelineMediaGalleryProps> = ({
  mediaUrls,
  onUpload,
  isEditable = false,
}) => {
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0 && onUpload) {
      await onUpload(files);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {mediaUrls.map((url, index) => (
          <div key={index} className="relative group aspect-square">
            <img
              src={url}
              alt={`Media ${index + 1}`}
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-200 rounded-lg">
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-white hover:bg-white/20"
                  onClick={() => window.open(url, '_blank')}
                >
                  <Icon name="eye" className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isEditable && onUpload && (
        <div className="flex justify-center">
          <Tooltip content="Upload media">
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button variant="outline" size="sm">
                <Icon name="upload" className="h-4 w-4 mr-2" />
                Upload Media
              </Button>
            </label>
          </Tooltip>
        </div>
      )}
    </div>
  );
}; 