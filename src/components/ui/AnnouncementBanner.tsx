'use client';

import React, { useState, useEffect } from 'react';
import { usePublishedContent } from '@/hooks/usePublishedContent';
import { Alert } from './Alert';
import { Icon } from './Icon';
import { motion, AnimatePresence } from 'framer-motion';

export function AnnouncementBanner() {
  const { data: announcements = [], isLoading } = usePublishedContent('announcement');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (announcements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 10000); // Rotate every 10 seconds

    return () => clearInterval(interval);
  }, [announcements.length]);

  if (isLoading || announcements.length === 0) {
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];

  return (
    <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
      <div className="container mx-auto px-4 py-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentAnnouncement.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Alert
              type="info"
              message={currentAnnouncement.content}
              showIcon={true}
              className="!bg-transparent !border-0 !p-0"
            />
          </motion.div>
        </AnimatePresence>
        {announcements.length > 1 && (
          <div className="flex justify-center space-x-1 mt-1">
            {announcements.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-blue-600' : 'bg-blue-200'
                }`}
                aria-label={`Go to announcement ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 