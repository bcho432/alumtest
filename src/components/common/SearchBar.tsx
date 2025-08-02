'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';

interface SearchResult {
  id: string;
  name: string;
  type: 'profile' | 'university';
  universityName?: string;
  graduationYear?: string;
  department?: string;
}

export function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchProfiles = async () => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        // Search profiles
        const { data: profileResults, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, university_name, graduation_year, department')
          .ilike('full_name', `%${searchQuery}%`)
          .limit(5);

        if (profileError) {
          console.error('Error searching profiles:', profileError);
        }

        // Search universities
        const { data: universityResults, error: universityError } = await supabase
          .from('universities')
          .select('id, name')
          .ilike('name', `%${searchQuery}%`)
          .limit(5);

        if (universityError) {
          console.error('Error searching universities:', universityError);
        }

        const formattedProfileResults = (profileResults || []).map((profile: any) => ({
          id: profile.id,
          name: profile.full_name,
          type: 'profile' as const,
          universityName: profile.university_name,
          graduationYear: profile.graduation_year,
          department: profile.department
        }));

        const formattedUniversityResults = (universityResults || []).map((university: any) => ({
          id: university.id,
          name: university.name,
          type: 'university' as const
        }));

        setResults([...formattedProfileResults, ...formattedUniversityResults]);
      } catch (error) {
        console.error('Error searching:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchProfiles, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    if (result.type === 'profile') {
      router.push(`/profile/${result.id}`);
    } else {
      router.push(`/university/${result.name.toLowerCase().replace(/\s+/g, '-')}`);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Input
          type="text"
          placeholder="Search by name, department, year..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowResults(true);
          }}
          className="w-full pl-10"
        />
        <Icon
          name="search"
          className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
        />
      </div>

      {showResults && (searchQuery.trim() || isLoading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-2"></div>
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                >
                  <Icon
                    name={result.type === 'profile' ? 'user' : 'building'}
                    className="h-5 w-5 text-gray-400"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{result.name}</div>
                    {result.type === 'profile' && (
                      <div className="text-sm text-gray-500">
                        {result.universityName}
                        {result.graduationYear && ` • ${result.graduationYear}`}
                        {result.department && ` • ${result.department}`}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
} 