"use client";

import React, { useState, useCallback, useEffect, memo, useRef } from 'react';
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
import { useVirtualizer } from '@tanstack/react-virtual';

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

// Add icon type safety
type IconName = 'briefcase' | 'graduation-cap' | 'calendar' | 'spinner' | 'x' | 'edit' | 'trash' | 'map-pin' | 'building' | 'add';

// Update template type with strict icon typing
type EventTemplate = {
  type: 'education' | 'job' | 'event';
  icon: IconName;
  label: string;
  color: string;
  defaultFields: Partial<TimelineEventFormData>;
};

// Fix date validation schema
const timelineEventSchema = z.object({
  type: z.enum(['education', 'job', 'event']),
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional()
    .superRefine((endDate, ctx) => {
      if (!endDate) return;
      const formData = ctx.path[0] === 'endDate' ? ctx.path[0] : 'startDate';
      const startDate = (ctx as unknown as { parent: { startDate: string } }).parent.startDate;
      if (!startDate) return;
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

const EVENT_TEMPLATES: EventTemplate[] = [
  {
    type: 'job',
    icon: 'briefcase',
    label: 'Add Job',
    color: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
    defaultFields: {
      type: 'job',
      title: '',
      startDate: new Date().toISOString().split('T')[0],
    }
  },
  {
    type: 'education',
    icon: 'graduation-cap',
    label: 'Add Education',
    color: 'bg-green-50 text-green-700 hover:bg-green-100',
    defaultFields: {
      type: 'education',
      title: '',
      startDate: new Date().toISOString().split('T')[0],
    }
  },
  {
    type: 'event',
    icon: 'calendar',
    label: 'Add Event',
    color: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
    defaultFields: {
      type: 'event',
      title: '',
      startDate: new Date().toISOString().split('T')[0],
    }
  }
];

export const TimelineBuilder: React.FC<TimelineBuilderProps> = ({
  existingEvents = [],
  onUpdate,
  isSubmitting = false,
}): React.ReactElement => {
  const [events, setEvents] = useState<TimelineEvent[]>(existingEvents);
  const eventsRef = useRef(events);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EventTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const { trackEvent } = useAnalytics();
  const parentRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting: isFormSubmitting, isDirty },
  } = useForm<TimelineEventFormData>({
    resolver: zodResolver(timelineEventSchema),
    mode: 'onChange',
  });

  const eventType = watch('type');

  // Setup virtualizer
  const rowVirtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  });

  // Update ref when events change
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  // Memoize template selection handler
  const handleTemplateSelect = useCallback((template: EventTemplate) => {
    setIsLoading(true);
    setSelectedTemplate(template);
    setIsFormExpanded(true);
    reset(template.defaultFields);
    // Simulate a small delay for smooth animation
    setTimeout(() => {
      setIsLoading(false);
    }, 100);
  }, [reset]);

  // Improved keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle keyboard shortcuts when form is not expanded
      if (isFormExpanded) return;

      if (e.key === 'n' && e.ctrlKey) {
        e.preventDefault();
        // Select the first template by default
        handleTemplateSelect(EVENT_TEMPLATES[0]);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFormExpanded, handleTemplateSelect]);

  // Reset form when it collapses
  useEffect(() => {
    if (!isFormExpanded) {
      reset();
      setEditingEvent(null);
      setSelectedTemplate(null);
    }
  }, [isFormExpanded, reset]);

  // Handle form cancel with confirmation if dirty
  const handleCancel = useCallback(() => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        setIsFormExpanded(false);
      }
    } else {
      setIsFormExpanded(false);
    }
  }, [isDirty]);

  const handleCreateEvent = useCallback(async (data: TimelineEventFormData) => {
    const originalEvents = eventsRef.current;
    try {
      setIsLoading(true);
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

      // Optimistically update UI
      const updatedEvents = editingEvent
        ? originalEvents.map((e) => (e.id === editingEvent.id ? newEvent : e))
        : [...originalEvents, newEvent];

      // Sort events by date
      updatedEvents.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

      // Update UI first
      setEvents(updatedEvents);
      
      // Then update backend
      await onUpdate(updatedEvents);
      
      setIsFormExpanded(false);
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
      // Revert UI on error using the ref
      setEvents(originalEvents);
      console.error('Error saving event:', error);
      showToast({
        title: 'Error',
        description: 'Failed to save event. Please try again.',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [editingEvent, onUpdate, showToast, trackEvent]);

  const handleDeleteEvent = useCallback(async (id: string) => {
    const originalEvents = eventsRef.current;
    try {
      setIsDeleting(id);
      // Store the event being deleted for potential restoration
      const eventToDelete = originalEvents.find(e => e.id === id);
      if (!eventToDelete) return;

      // Optimistically update UI
      const updatedEvents = originalEvents.filter((e) => e.id !== id);
      setEvents(updatedEvents);

      // Update backend
      await onUpdate(updatedEvents);
      
      showToast({
        title: 'Event deleted',
        description: 'Successfully removed event from timeline',
        status: 'success',
      });
      trackEvent('timeline_event_deleted');
    } catch (error) {
      // Revert UI on error using the ref
      setEvents(originalEvents);
      console.error('Error deleting event:', error);
      showToast({
        title: 'Error',
        description: 'Failed to delete event. Please try again.',
        status: 'error',
      });
    } finally {
      setIsDeleting(null);
    }
  }, [onUpdate, showToast, trackEvent]);

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
    setIsFormExpanded(true);
  }, [setValue]);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination || result.destination.index === result.source.index) {
      return;
    }

    const originalEvents = eventsRef.current;
    try {
      setIsReordering(true);
      const items = Array.from(originalEvents);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      // Update UI first
      setEvents(items);

      // Then update backend
      await onUpdate(items);
      
      showToast({
        title: 'Timeline updated',
        description: 'Successfully reordered events',
        status: 'success',
      });
      trackEvent('timeline_reordered');
    } catch (error) {
      // Revert UI on error using the ref
      setEvents(originalEvents);
      console.error('Error reordering events:', error);
      showToast({
        title: 'Error',
        description: 'Failed to reorder events. Please try again.',
        status: 'error',
      });
    } finally {
      setIsReordering(false);
    }
  }, [onUpdate, showToast, trackEvent]);

  return (
    <TimelineErrorBoundary>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Timeline</h2>
          <div className="text-sm text-gray-500">
            Press <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-100 rounded">N</kbd> to add an event
          </div>
        </div>

        {/* Quick Templates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {EVENT_TEMPLATES.map((template) => (
            <motion.button
              key={template.type}
              onClick={() => handleTemplateSelect(template)}
              className={`p-4 rounded-lg ${template.color} transition-all duration-200 flex items-center space-x-3 relative`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
            >
              {isLoading && selectedTemplate?.type === template.type && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 rounded-lg">
                  <Icon name="spinner" className="w-6 h-6 animate-spin" />
                </div>
              )}
              <Icon name={template.icon} className="w-6 h-6" />
              <span className="font-medium">{template.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Quick Add Form */}
        <AnimatePresence>
          {isFormExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
              transition={{ duration: 0.2 }}
            >
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {selectedTemplate && (
                      <>
                        <Icon name={selectedTemplate.icon} className={`w-5 h-5 ${selectedTemplate.color.split(' ')[1]}`} />
                        <h3 className="font-medium">{selectedTemplate.label}</h3>
                      </>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    <Icon name="x" className="w-4 h-4" />
                  </Button>
                </div>

                <form onSubmit={handleSubmit(handleCreateEvent)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <Input
                        {...register('title')}
                        error={errors.title?.message}
                        placeholder={selectedTemplate?.type === 'job' ? 'e.g., Software Engineer' : 
                                  selectedTemplate?.type === 'education' ? 'e.g., Bachelor of Science' :
                                  'e.g., Conference Presentation'}
                        autoFocus
                      />
                    </div>
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
                  </div>

                  {selectedTemplate?.type === 'job' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company
                        </label>
                        <Input
                          {...register('company')}
                          error={errors.company?.message}
                          placeholder="e.g., Google"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Position
                        </label>
                        <Input
                          {...register('position')}
                          error={errors.position?.message}
                          placeholder="e.g., Senior Engineer"
                        />
                      </div>
                    </div>
                  )}

                  {selectedTemplate?.type === 'education' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Institution
                        </label>
                        <Input
                          {...register('institution')}
                          error={errors.institution?.message}
                          placeholder="e.g., Stanford University"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Degree
                        </label>
                        <Input
                          {...register('degree')}
                          error={errors.degree?.message}
                          placeholder="e.g., Bachelor of Science"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSubmitting || isFormSubmitting || isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || isFormSubmitting || isLoading}
                      className={selectedTemplate?.color.split(' ')[1]}
                    >
                      {isFormSubmitting || isLoading ? (
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
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Events List */}
        {events.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Icon name="calendar" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
            <p className="text-gray-500 mb-4">
              Choose a template above to add your first event
            </p>
            <div className="text-sm text-gray-400">
              Or press <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-100 rounded">N</kbd>
            </div>
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
                  <div
                    ref={parentRef}
                    className="h-[600px] overflow-auto"
                    style={{
                      contain: 'strict',
                    }}
                  >
                    <div
                      style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                      }}
                    >
                      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const event = events[virtualRow.index];
                        return (
                          <div
                            key={event.id}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: `${virtualRow.size}px`,
                              transform: `translateY(${virtualRow.start}px)`,
                            }}
                          >
                            <Draggable
                              draggableId={event.id}
                              index={virtualRow.index}
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
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </TimelineErrorBoundary>
  );
}; 