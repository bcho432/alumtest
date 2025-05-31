import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TimelineEvent } from '@/types/profile';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';

const timelineEventSchema = z.object({
  type: z.enum(['education', 'job', 'event']),
  title: z.string().min(1, 'Title is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  institution: z.string().optional(),
  degree: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
});

type TimelineEventFormData = z.infer<typeof timelineEventSchema>;

interface SimpleTimelineBuilderProps {
  existingEvents?: TimelineEvent[];
  onUpdate: (events: TimelineEvent[]) => Promise<void>;
  isSubmitting?: boolean;
}

export const SimpleTimelineBuilder: React.FC<SimpleTimelineBuilderProps> = ({
  existingEvents = [],
  onUpdate,
  isSubmitting = false,
}) => {
  const [events, setEvents] = useState<TimelineEvent[]>(existingEvents);
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting: isFormSubmitting },
  } = useForm<TimelineEventFormData>({
    resolver: zodResolver(timelineEventSchema),
    defaultValues: {
      type: 'event',
    },
  });

  const eventType = watch('type');

  const handleCreateEvent = async (data: TimelineEventFormData) => {
    try {
      const newEvent: TimelineEvent = {
        id: crypto.randomUUID(),
        type: data.type,
        title: data.title,
        startDate: data.startDate,
        endDate: data.endDate || undefined,
        location: data.location,
        description: data.description,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          ...(data.type === 'education' && {
            institution: data.institution,
            degree: data.degree,
          }),
          ...(data.type === 'job' && {
            company: data.company,
            position: data.position,
          }),
        },
      };

      const updatedEvents = [...events, newEvent];
      setEvents(updatedEvents);
      await onUpdate(updatedEvents);
      reset();
      showToast({
        title: 'Event added',
        description: `Successfully added ${data.title}`,
        status: 'success',
      });
    } catch (error) {
      console.error('Error saving event:', error);
      showToast({
        title: 'Error',
        description: 'Failed to save event. Please try again.',
        status: 'error',
      });
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      const updatedEvents = events.filter((e) => e.id !== id);
      setEvents(updatedEvents);
      await onUpdate(updatedEvents);
      showToast({
        title: 'Event deleted',
        description: 'Successfully removed event from timeline',
        status: 'success',
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      showToast({
        title: 'Error',
        description: 'Failed to delete event. Please try again.',
        status: 'error',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Timeline</h2>
      </div>

      <form onSubmit={handleSubmit(handleCreateEvent)} className="space-y-4 bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Type
            </label>
            <select
              {...register('type')}
              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              <option value="education">Education</option>
              <option value="job">Job</option>
              <option value="event">Event</option>
            </select>
            {errors.type && (
              <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <Input
              {...register('title')}
              error={errors.title?.message}
              placeholder="Enter event title"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <Input
              type="date"
              {...register('startDate')}
              error={errors.startDate?.message}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date (Optional)
            </label>
            <Input
              type="date"
              {...register('endDate')}
              error={errors.endDate?.message}
            />
          </div>
        </div>

        {eventType === 'education' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Institution
              </label>
              <Input
                {...register('institution')}
                error={errors.institution?.message}
                placeholder="Enter institution name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Degree
              </label>
              <Input
                {...register('degree')}
                error={errors.degree?.message}
                placeholder="Enter degree"
              />
            </div>
          </div>
        )}

        {eventType === 'job' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company
              </label>
              <Input
                {...register('company')}
                error={errors.company?.message}
                placeholder="Enter company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <Input
                {...register('position')}
                error={errors.position?.message}
                placeholder="Enter position"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <Input
            {...register('location')}
            error={errors.location?.message}
            placeholder="Enter location"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <Textarea
            {...register('description')}
            error={errors.description?.message}
            placeholder="Enter event description"
            rows={3}
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting || isFormSubmitting}
          >
            {isFormSubmitting ? (
              <>
                <Icon name="spinner" className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Add Event'
            )}
          </Button>
        </div>
      </form>

      {events.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Icon name="calendar" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
          <p className="text-gray-500">
            Start building your timeline by adding your first event
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Icon
                        name={
                          event.type === 'education'
                            ? 'graduation-cap'
                            : event.type === 'job'
                            ? 'briefcase'
                            : 'calendar'
                        }
                        className="w-5 h-5 text-gray-500"
                      />
                      <h3 className="text-lg font-medium">{event.title}</h3>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(event.startDate).toLocaleDateString()}
                      {event.endDate && ` - ${new Date(event.endDate).toLocaleDateString()}`}
                    </div>
                    {event.location && (
                      <div className="text-sm text-gray-500">
                        <Icon name="map-pin" className="w-4 h-4 inline mr-1" />
                        {event.location}
                      </div>
                    )}
                    {event.description && (
                      <p className="text-sm text-gray-700 mt-2">{event.description}</p>
                    )}
                    {event.metadata?.institution && (
                      <div className="text-sm text-gray-500">
                        <Icon name="building" className="w-4 h-4 inline mr-1" />
                        {event.metadata.institution}
                      </div>
                    )}
                    {event.metadata?.company && (
                      <div className="text-sm text-gray-500">
                        <Icon name="building" className="w-4 h-4 inline mr-1" />
                        {event.metadata.company}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteEvent(event.id)}
                  >
                    <Icon name="trash" className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}; 