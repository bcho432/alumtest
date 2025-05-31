import React from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Timestamp } from 'firebase/firestore';

interface BasicInfoTabProps {
  formData: {
    name: string;
    type: 'personal' | 'memorial';
    basicInfo: {
      dateOfBirth: Date | Timestamp | null;
      dateOfDeath: Date | Timestamp | null;
      birthLocation: string;
      deathLocation: string;
      photo: string;
    };
  };
  onInputChange: (field: string, value: any) => void;
  onDateChange: (field: 'dateOfBirth' | 'dateOfDeath', value: Date | undefined) => void;
  onFileUpload: (file: File) => Promise<void>;
  fieldErrors: {
    dateOfBirth?: string;
    dateOfDeath?: string;
  };
  uploading: boolean;
}

export function BasicInfoTab({
  formData,
  onInputChange,
  onDateChange,
  onFileUpload,
  fieldErrors,
  uploading
}: BasicInfoTabProps) {
  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <Input
            value={formData.name}
            onChange={(e) => onInputChange('name', e.target.value)}
            placeholder="Enter name"
            className="mt-1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <Select
            value={formData.type}
            onChange={(value) => onInputChange('type', value)}
            options={[
              { value: 'memorial', label: 'Memorial' },
              { value: 'personal', label: 'Personal' }
            ]}
            className="mt-1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
          <Input
            type="date"
            value={formData.basicInfo.dateOfBirth instanceof Date 
              ? formData.basicInfo.dateOfBirth.toISOString().split('T')[0]
              : formData.basicInfo.dateOfBirth instanceof Timestamp
                ? formData.basicInfo.dateOfBirth.toDate().toISOString().split('T')[0]
                : ''}
            onChange={(e) => {
              const newDate = e.target.value ? new Date(e.target.value) : undefined;
              onDateChange('dateOfBirth', newDate);
            }}
            max={new Date().toISOString().split('T')[0]}
            className={`mt-1 ${fieldErrors.dateOfBirth ? 'border-red-500' : ''}`}
          />
          {fieldErrors.dateOfBirth && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.dateOfBirth}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date of Death</label>
          <Input
            type="date"
            value={formData.basicInfo.dateOfDeath instanceof Date 
              ? formData.basicInfo.dateOfDeath.toISOString().split('T')[0]
              : formData.basicInfo.dateOfDeath instanceof Timestamp
                ? formData.basicInfo.dateOfDeath.toDate().toISOString().split('T')[0]
                : ''}
            onChange={(e) => {
              const newDate = e.target.value ? new Date(e.target.value) : undefined;
              onDateChange('dateOfDeath', newDate);
            }}
            min={formData.basicInfo.dateOfBirth 
              ? (formData.basicInfo.dateOfBirth instanceof Date 
                ? formData.basicInfo.dateOfBirth.toISOString().split('T')[0]
                : formData.basicInfo.dateOfBirth instanceof Timestamp
                  ? formData.basicInfo.dateOfBirth.toDate().toISOString().split('T')[0]
                  : undefined)
              : undefined}
            max={new Date().toISOString().split('T')[0]}
            className={`mt-1 ${fieldErrors.dateOfDeath ? 'border-red-500' : ''}`}
          />
          {fieldErrors.dateOfDeath && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.dateOfDeath}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Birth Location</label>
          <Input
            value={formData.basicInfo.birthLocation}
            onChange={(e) => onInputChange('basicInfo', {
              ...formData.basicInfo,
              birthLocation: e.target.value
            })}
            placeholder="Enter birth location"
            className="mt-1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Death Location</label>
          <Input
            value={formData.basicInfo.deathLocation}
            onChange={(e) => onInputChange('basicInfo', {
              ...formData.basicInfo,
              deathLocation: e.target.value
            })}
            placeholder="Enter death location"
            className="mt-1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Profile Photo</label>
          <div className="mt-1 flex items-center space-x-4">
            {formData.basicInfo.photo && (
              <img
                src={formData.basicInfo.photo}
                alt="Profile"
                className="h-20 w-20 rounded-full object-cover"
              />
            )}
            <Button
              variant="outline"
              onClick={() => document.getElementById('photo-upload')?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              ) : (
                <Icon name="upload" className="h-4 w-4 mr-2" />
              )}
              Upload Photo
            </Button>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFileUpload(e.target.files[0])}
            />
          </div>
        </div>
      </div>
    </Card>
  );
} 