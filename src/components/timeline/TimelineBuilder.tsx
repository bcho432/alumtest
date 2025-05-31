"use client";

import React, { useState, useCallback, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TimelineEvent } from '@/types/profile';
import { useToast } from '@/hooks/useToast';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { format } from 'date-fns';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

// Error Boundary Component
class TimelineErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-8">
          <p className="text-red-500">Something went wrong with the timeline.</p>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Updated schema with better validation
const timelineEventSchema = z.object({
  type: z.enum(['education', 'job', 'event']),
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional()
    .superRefine((endDate, ctx) => {
      if (!endDate) return;
      const startDate = (ctx.path[0] === 'endDate' ? ctx.path[0] : 'startDate') as string;
      if (new Date(endDate) < new Date(startDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'End date must be after start date',
        });
      }
    }),
  location: z.string().optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  institution: z.string().optional(),
  company: z.string().optional(),
  degree: z.string().optional(),
  position: z.string().optional(),
});

type TimelineEventFormData = z.infer<typeof timelineEventSchema>;

interface TimelineBuilderProps {
  existingEvents?: TimelineEvent[];
  onUpdate: (events: TimelineEvent[]) => Promise<void>;
  isSubmitting?: boolean;
}

// Memoized Event Card Component
const EventCard = memo(({ 
  event, 
  onEdit, 
  onDelete, 
  isDeleting 
}: { 
  event: TimelineEvent; 
  onEdit: (event: TimelineEvent) => void; 
  onDelete: (id: string) => void;
  isDeleting: string | null;
}) => (
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
          {(() => {
            try {
              return format(new Date(event.startDate), 'MMM d, yyyy');
            } catch (error) {
              return 'Invalid date';
            }
          })()}
          {event.endDate && (() => {
            try {
              return ` - ${format(new Date(event.endDate), 'MMM d, yyyy')}`;
            } catch (error) {
              return ' - Invalid date';
            }
          })()}
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
      <div className="flex space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(event)}
        >
          <Icon name="edit" className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(event.id)}
          disabled={isDeleting === event.id}
        >
          {isDeleting === event.id ? (
            <Icon name="spinner" className="w-4 h-4 animate-spin" />
          ) : (
            <Icon name="trash" className="w-4 h-4 text-red-500" />
          )}
        </Button>
      </div>
    </div>
  </Card>
));

EventCard.displayName = 'EventCard';

export const TimelineBuilder: React.FC<TimelineBuilderProps> = ({
  existingEvents = [],
  onUpdate,
  isSubmitting = false,
}): React.ReactElement => {
  const [events, setEvents] = useState<TimelineEvent[]>(existingEvents);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const { showToast } = useToast();
  const { trackEvent } = useAnalytics();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting: isFormSubmitting },
  } = useForm<TimelineEventFormData>({
    resolver: zodResolver(timelineEventSchema),
  });

  const eventType = watch('type');

  // Reset form when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      reset();
      setEditingEvent(null);
    }
  }, [isDialogOpen, reset]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDialogOpen) {
        setIsDialogOpen(false);
      }
      if (e.key === 'n' && e.ctrlKey) {
        e.preventDefault();
        setIsDialogOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isDialogOpen]);

  const handleCreateEvent = useCallback(async (data: TimelineEventFormData) => {
    try {
      const newEvent: TimelineEvent = {
        id: editingEvent?.id || crypto.randomUUID(),
        type: data.type,
        title: data.title,
        startDate: data.startDate,
        endDate: data.endDate || undefined,
        location: data.location,
        description: data.description,
        createdAt: editingEvent?.createdAt || new Date(),
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

      const updatedEvents = editingEvent
        ? events.map((e) => (e.id === editingEvent.id ? newEvent : e))
        : [...events, newEvent];

      // Sort events by date
      updatedEvents.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

      setEvents(updatedEvents);
      await onUpdate(updatedEvents);
      setIsDialogOpen(false);
      showToast({
        title: editingEvent ? 'Event updated' : 'Event added',
        description: `Successfully ${editingEvent ? 'updated' : 'added'} ${data.title}`,
        status: 'success',
      });
      trackEvent('timeline_event_updated', {
        event_type: data.type,
        action: editingEvent ? 'update' : 'create',
      });
    } catch (error) {
      console.error('Error saving event:', error);
      showToast({
        title: 'Error',
        description: 'Failed to save event. Please try again.',
        status: 'error',
      });
    }
  }, [editingEvent, events, onUpdate, showToast, trackEvent]);

  const handleDeleteEvent = useCallback(async (id: string) => {
    try {
      setIsDeleting(id);
      const updatedEvents = events.filter((e) => e.id !== id);
      setEvents(updatedEvents);
      await onUpdate(updatedEvents);
      showToast({
        title: 'Event deleted',
        description: 'Successfully removed event from timeline',
        status: 'success',
      });
      trackEvent('timeline_event_deleted');
    } catch (error) {
      console.error('Error deleting event:', error);
      showToast({
        title: 'Error',
        description: 'Failed to delete event. Please try again.',
        status: 'error',
      });
    } finally {
      setIsDeleting(null);
    }
  }, [events, onUpdate, showToast, trackEvent]);

  const handleEditEvent = useCallback((event: TimelineEvent) => {
    setEditingEvent(event);
    setValue('type', event.type);
    setValue('title', event.title);
    setValue('startDate', event.startDate);
    setValue('endDate', event.endDate || '');
    setValue('location', event.location || '');
    setValue('description', event.description || '');
    if (event.type === 'education') {
      setValue('institution', event.metadata?.institution || '');
      setValue('degree', event.metadata?.degree || '');
    } else if (event.type === 'job') {
      setValue('company', event.metadata?.company || '');
      setValue('position', event.metadata?.position || '');
    }
    setIsDialogOpen(true);
  }, [setValue]);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination || result.destination.index === result.source.index) {
      return;
    }

    try {
      setIsReordering(true);
      const items = Array.from(events);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      setEvents(items);
      await onUpdate(items);
      showToast({
        title: 'Timeline updated',
        description: 'Successfully reordered events',
        status: 'success',
      });
      trackEvent('timeline_reordered');
    } catch (error) {
      console.error('Error reordering events:', error);
      showToast({
        title: 'Error',
        description: 'Failed to reorder events. Please try again.',
        status: 'error',
      });
    } finally {
      setIsReordering(false);
    }
  }, [events, onUpdate, showToast, trackEvent]);

  return (
    <TimelineErrorBoundary>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Timeline</h2>
          <Button
            onClick={() => setIsDialogOpen(true)}
            disabled={isSubmitting || isFormSubmitting}
          >
            <Icon name="plus" className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Icon name="calendar" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
            <p className="text-gray-500 mb-4">
              Start building your timeline by adding your first event
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              Add First Event
            </Button>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="timeline">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-4"
                >
                  {events.map((event, index) => (
                    <Draggable
                      key={event.id}
                      draggableId={event.id}
                      index={index}
                      isDragDisabled={isReordering}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <EventCard
                            event={event}
                            onEdit={handleEditEvent}
                            onDelete={handleDeleteEvent}
                            isDeleting={isDeleting}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? 'Edit Event' : 'Add New Event'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(handleCreateEvent)} className="space-y-4">
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

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting || isFormSubmitting}
                >
                  Cancel
                </Button>
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
                    'Save Event'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </TimelineErrorBoundary>
  );
}; 