'use client';

import { useState } from 'react';
import { Select } from '@/components/ui/Select';

interface University {
  id: string;
  name: string;
}

export default function UniversityManagementPage() {
  const [selectedUniversity, setSelectedUniversity] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  
  // Mock data - replace with actual data fetching
  const universities: University[] = [
    { id: '1', name: 'University A' },
    { id: '2', name: 'University B' },
  ];
  
  const years = ['2024', '2023', '2022', '2021'];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-4 md:grid-cols-2">
        <Select
          value={selectedUniversity}
          onChange={setSelectedUniversity}
          options={[
            { value: '', label: 'Select a university' },
            ...universities.map(university => ({
              value: university.id,
              label: university.name
            }))
          ]}
        />

        <Select
          value={selectedYear}
          onChange={setSelectedYear}
          options={[
            { value: '', label: 'Select a year' },
            ...years.map(year => ({
              value: year,
              label: year
            }))
          ]}
        />
      </div>
    </div>
  );
} 