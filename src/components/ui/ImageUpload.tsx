import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from './Button';
import { Icon } from './Icon';
import { Spinner } from './Spinner';

interface ImageUploadProps {
  currentImage?: string;
  onUpload: (url: string) => void;
  aspectRatio?: number;
  className?: string;
}

export function ImageUpload({ currentImage, onUpload, aspectRatio = 1, className = '' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      onUpload(publicUrl);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {currentImage ? (
        <div className="relative group">
          <img
            src={currentImage}
            alt="Uploaded"
            className="w-full h-full object-cover rounded-lg"
            style={{ aspectRatio }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
              <Button
                variant="secondary"
                size="sm"
                disabled={uploading}
              >
                {uploading ? (
                  <Spinner size="sm" />
                ) : (
                  <Icon name="upload" className="w-4 h-4" />
                )}
              </Button>
            </label>
          </div>
        </div>
      ) : (
        <label className="block w-full">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
          <div
            className={`
              border-2 border-dashed border-gray-300 rounded-lg p-6
              flex flex-col items-center justify-center cursor-pointer
              hover:border-gray-400 transition-colors
              ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            style={{ aspectRatio }}
          >
            {uploading ? (
              <Spinner size="lg" />
            ) : (
              <>
                <Icon name="upload" className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">
                  Click to upload image
                </span>
              </>
            )}
          </div>
        </label>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
} 