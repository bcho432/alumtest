import React from 'react';
import { Card } from '@/components/ui/Card';
import { RichTextEditor } from '@/components/ui/RichTextEditor';

interface BiographyTabProps {
  formData: {
    basicInfo: {
      biography: string;
    };
  };
  onInputChange: (field: string, value: any) => void;
}

export function BiographyTab({ formData, onInputChange }: BiographyTabProps) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Biography</label>
        <RichTextEditor
          value={formData.basicInfo.biography}
          onChange={(value: string) => onInputChange('basicInfo', {
            ...formData.basicInfo,
            biography: value
          })}
          placeholder="Write a detailed biography..."
        />
      </div>
    </Card>
  );
} 