"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TimelineEvent } from '@/types/profile';
import { useToast } from '../../hooks/useToast';
import { useAnalytics } from '../../hooks/useAnalytics';

const timelineEventSchema = z.object({
  type: z.enum(['education', 'job', 'event']),
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  startDate: z.string().min(1, 'Date is required'),
  location: z.string().optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  institution: z.string().optional(),
  company: z.string().optional(),
  skills: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

type TimelineEventFormData = z.infer<typeof timelineEventSchema>;

interface TimelineBuilderProps {
  existingEvents?: TimelineEvent[];
  onUpdate: (events: TimelineEvent[]) => Promise<void>;
  isSubmitting?: boolean;
}

export const TimelineBuilder: React.FC<TimelineBuilderProps> = ({
  existingEvents = [],
  onUpdate,
  isSubmitting = false,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const { showToast } = useToast();
  const { trackEvent } = useAnalytics();
  const formRef = useRef<HTMLFormElement>(null);
  const firstInputRef = useRef<HTMLSelectElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<TimelineEventFormData>({
    resolver: zodResolver(timelineEventSchema),
    defaultValues: {
      type: 'education',
    },
  });

  const eventType = watch('type');

  // Focus first input when form opens
  useEffect(() => {
    if (isAdding && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [isAdding]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAdding) {
        setIsAdding(false);
        reset();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isAdding, reset]);

  const onSubmit = async (data: TimelineEventFormData) => {
    try {
      const newEvent: TimelineEvent = {
        id: crypto.randomUUID(),
        type: data.type,
        title: data.title,
        description: data.description || '',
        startDate: data.startDate,
        location: data.location,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          institution: data.institution,
          company: data.company,
        }
      };

      const updatedEvents = [...existingEvents, newEvent];
      await onUpdate(updatedEvents);

      trackEvent('timeline_event_added', {
        eventType: data.type,
        hasLocation: !!data.location,
        hasDescription: !!data.description,
      });

      showToast({
        title: 'Timeline Updated',
        description: 'Your timeline has been saved successfully.',
        status: 'success',
      });

      reset();
      setIsAdding(false);
    } catch (error) {
      console.error('Error saving timeline event:', error);
      showToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save timeline event. Please try again.',
        status: 'error',
      });
    }
  };

  return (
    <div className="space-y-6" role="region" aria-label="Timeline Builder">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold" id="timeline-heading">Timeline</h2>
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="btn btn-primary"
          disabled={isAdding || isSubmitting}
          aria-expanded={isAdding}
          aria-controls="timeline-form"
        >
          Add Event
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-lg shadow p-6"
            role="dialog"
            aria-labelledby="timeline-form-heading"
            aria-modal="true"
          >
            <form
              ref={formRef}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
              id="timeline-form"
              noValidate
            >
              <h3 id="timeline-form-heading" className="sr-only">Add Timeline Event</h3>

              <div>
                <label htmlFor="event-type" className="block text-sm font-medium text-gray-700">
                  Event Type
                </label>
                <select
                  id="event-type"
                  {...register('type')}
                  ref={firstInputRef}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  aria-invalid={!!errors.type}
                  aria-describedby={errors.type ? 'event-type-error' : undefined}
                >
                  <option value="education">Education</option>
                  <option value="job">Job</option>
                  <option value="event">Event</option>
                </select>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600" id="event-type-error">
                    {errors.type.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="event-title" className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  id="event-title"
                  {...register('title')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  aria-invalid={!!errors.title}
                  aria-describedby={errors.title ? 'event-title-error' : undefined}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600" id="event-title-error">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {eventType === 'education' && (
                <div>
                  <label htmlFor="event-institution" className="block text-sm font-medium text-gray-700">
                    Institution
                  </label>
                  <input
                    type="text"
                    id="event-institution"
                    {...register('institution')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    aria-invalid={!!errors.institution}
                    aria-describedby={errors.institution ? 'event-institution-error' : undefined}
                  />
                  {errors.institution && (
                    <p className="mt-1 text-sm text-red-600" id="event-institution-error">
                      {errors.institution.message}
                    </p>
                  )}
                </div>
              )}

              {eventType === 'job' && (
                <div>
                  <label htmlFor="event-company" className="block text-sm font-medium text-gray-700">
                    Company
                  </label>
                  <input
                    type="text"
                    id="event-company"
                    {...register('company')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    aria-invalid={!!errors.company}
                    aria-describedby={errors.company ? 'event-company-error' : undefined}
                  />
                  {errors.company && (
                    <p className="mt-1 text-sm text-red-600" id="event-company-error">
                      {errors.company.message}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="event-date" className="block text-sm font-medium text-gray-700">
                  Date
                </label>
                <input
                  type="date"
                  id="event-date"
                  {...register('startDate')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  aria-invalid={!!errors.startDate}
                  aria-describedby={errors.startDate ? 'event-date-error' : undefined}
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600" id="event-date-error">
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="event-location" className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  id="event-location"
                  {...register('location')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  aria-invalid={!!errors.location}
                  aria-describedby={errors.location ? 'event-location-error' : undefined}
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600" id="event-location-error">
                    {errors.location.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="event-description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="event-description"
                  {...register('description')}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  aria-invalid={!!errors.description}
                  aria-describedby={errors.description ? 'event-description-error' : undefined}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600" id="event-description-error">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    reset();
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Event'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {existingEvents.map((event) => (
          <div
            key={event.id}
            className="bg-white rounded-lg shadow p-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">{event.title}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(event.startDate).toLocaleDateString()}
                </p>
                {event.location && (
                  <p className="text-sm text-gray-500">{event.location}</p>
                )}
                {event.description && (
                  <p className="mt-2 text-sm text-gray-700">{event.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  const updatedEvents = existingEvents.filter((e) => e.id !== event.id);
                  onUpdate(updatedEvents);
                }}
                className="text-red-600 hover:text-red-800"
                aria-label={`Remove ${event.title}`}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 