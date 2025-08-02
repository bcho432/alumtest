'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/hooks/useAuth';
import type { UniversityProfile } from '@/types/university';

export function FeaturedUniversities() {
  const [universities, setUniversities] = useState<UniversityProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const loadUniversities = async () => {
      try {
        const { data: universitiesList, error } = await supabase
          .from('universities')
          .select('*')
          .limit(5); // Show first 5 universities instead of filtering by is_featured

        if (error) {
          console.error('Error loading featured universities:', error);
          return;
        }

        setUniversities(universitiesList || []);
      } catch (error) {
        console.error('Error loading featured universities:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUniversities();
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % universities.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + universities.length) % universities.length);
  };

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (universities.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Featured Universities</h2>
        <div className="flex gap-4">
          <button
            onClick={prevSlide}
            className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors"
            aria-label="Previous university"
          >
            <Icon name="chevron-left" className="h-6 w-6 text-gray-600" />
          </button>
          <button
            onClick={nextSlide}
            className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors"
            aria-label="Next university"
          >
            <Icon name="chevron-right" className="h-6 w-6 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {universities.map((university) => (
            <div
              key={university.id}
              className="w-full flex-shrink-0 p-8"
            >
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-32 h-32 flex-shrink-0">
                  {university.logo ? (
                    <img
                      src={university.logo}
                      alt={`${university.name} logo`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-4xl font-bold text-indigo-600">
                        {university.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {university.name}
                  </h3>
                  {university.description && (
                    <p className="text-gray-600 mb-4">{university.description}</p>
                  )}
                  <button
                    onClick={() => router.push(`/university/${university.name.toLowerCase().replace(/\s+/g, '-')}`)}
                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    View Community
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {universities.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 