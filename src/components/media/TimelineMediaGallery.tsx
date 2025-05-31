import React from 'react';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';

interface TimelineMediaGalleryProps {
  mediaUrls: string[];
  onUpload?: (files: File[]) => Promise<void>;
  isEditable?: boolean;
  isUploading?: boolean;
  uploadProgress?: { file: File; progress: number }[];
}

export const TimelineMediaGallery: React.FC<TimelineMediaGalleryProps> = ({
  mediaUrls,
  onUpload,
  isEditable = false,
  isUploading = false,
  uploadProgress = [],
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

      {isEditable && (
        <div className="flex justify-center">
          <Tooltip content="Upload media">
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <Button variant="outline" size="sm" disabled={isUploading}>
                <Icon name="upload" className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload Media'}
              </Button>
            </label>
          </Tooltip>
        </div>
      )}

      {uploadProgress.length > 0 && (
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
      )}
    </div>
  );
}; 