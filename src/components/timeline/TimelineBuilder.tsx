"use client";

import React, { useState, useCallback, useEffect, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TimelineEvent } from '@/types/profile';
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
import { EventCard } from './EventCard';
import { EventForm } from './EventForm';
import { LifeEvent, TimelineBuilderProps } from '@/types/profile';
import { useTimelineEvents } from '@/hooks/useTimelineEvents';
import { useTimelineAutoSave } from '@/hooks/useTimelineAutoSave';
import { Alert } from '@/components/ui/Alert';
import { LoadingState } from '@/components/ui/LoadingState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Tooltip } from '@/components/ui/Tooltip';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { TimelineView } from './TimelineView';
import { DatePicker } from '@/components/ui/DatePicker';

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
  type: 'education' | 'work' | 'other';
  icon: IconName;
  label: string;
  color: string;
  defaultFields: Partial<TimelineEventFormData>;
};

// Fix date validation schema
const timelineEventSchema = z.object({
  type: z.enum(['education', 'work', 'other']),
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

interface ExtendedTimelineBuilderProps extends TimelineBuilderProps {
  orgId: string;
  profileId: string;
  isEditMode?: boolean;
  isPreview?: boolean;
}

const EVENT_TEMPLATES: EventTemplate[] = [
  {
    type: 'work',
    icon: 'briefcase',
    label: 'Add Job',
    color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200',
    defaultFields: {
      type: 'work',
      title: '',
      startDate: new Date().toISOString().split('T')[0],
    }
  },
  {
    type: 'education',
    icon: 'graduation-cap',
    label: 'Add Education',
    color: 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200',
    defaultFields: {
      type: 'education',
      title: '',
      startDate: new Date().toISOString().split('T')[0],
    }
  },
  {
    type: 'other',
    icon: 'calendar',
    label: 'Add Event',
    color: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200',
    defaultFields: {
      type: 'other',
      title: '',
      startDate: new Date().toISOString().split('T')[0],
    }
  }
];

export const TimelineBuilder: React.FC<ExtendedTimelineBuilderProps> = ({
  initialEvents = [],
  onEventsChange,
  onNext,
  orgId,
  profileId,
  isEditMode = false,
  isPreview = false,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<LifeEvent | undefined>();
  const [events, setEvents] = useState<LifeEvent[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<'education' | 'work' | 'other' | undefined>();
  const [formData, setFormData] = useState<Partial<LifeEvent>>({});

  const {
    events: fetchedEvents,
    isLoading,
    refetch
  } = useTimelineEvents({
    orgId,
    profileId,
  });

  // Use local events for preview, fetched events for edit mode
  const eventsToUse = isEditMode ? fetchedEvents : events;

  const { isSaving, lastSavedAt } = useTimelineAutoSave({
    orgId,
    profileId,
    events: eventsToUse,
  });

  // Update parent component when events change, but don't trigger validation
  useEffect(() => {
    if (onEventsChange) {
      onEventsChange(events);
    }
  }, [events, onEventsChange]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(eventsToUse);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setEvents(items);
  };

  const handleAddEvent = (type: 'education' | 'work' | 'other') => {
    setSelectedEvent(undefined);
    setSelectedEventType(type);
    setFormData({
      type,
      title: '',
      startDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleEditEvent = (event: LifeEvent) => {
    setSelectedEvent(event);
    setSelectedEventType(event.type);
    setFormData(event);
  };

  const handleDeleteEvent = (event: LifeEvent) => {
    setEvents(events.filter((e) => e.id !== event.id));
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.startDate) {
      return;
    }

    const newEvent: LifeEvent = {
      id: selectedEvent?.id || crypto.randomUUID(),
      type: formData.type!,
      title: formData.title,
      startDate: formData.startDate,
      endDate: formData.endDate,
      location: formData.location,
      description: formData.description,
      createdAt: selectedEvent?.createdAt || new Date(),
      updatedAt: new Date(),
      metadata: {
        ...(formData.type === 'education' && {
          institution: formData.metadata?.institution,
          degree: formData.metadata?.degree,
        }),
        ...(formData.type === 'work' && {
          company: formData.metadata?.company,
          position: formData.metadata?.position,
        }),
      },
    };

    if (selectedEvent) {
      setEvents(events.map((e) => (e.id === selectedEvent.id ? newEvent : e)));
    } else {
      setEvents([...events, newEvent]);
    }

    // Reset form
    setFormData({});
    setSelectedEventType(undefined);
    setSelectedEvent(undefined);
  };

  return (
    <div className="space-y-8">
      {/* Timeline Builder Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Timeline Events</h2>
          <div className="flex gap-2">
            {EVENT_TEMPLATES.map((template) => (
              <Button
                key={template.type}
                onClick={() => handleAddEvent(template.type)}
                className={`${template.color} border`}
                variant="outline"
              >
                <Icon name={template.icon} className="w-4 h-4 mr-2" />
                {template.label}
              </Button>
            ))}
          </div>
        </div>

        {error && (
          <Alert
            type="error"
            title="Error loading timeline"
            message={error.message}
          />
        )}

        {/* Inline Form */}
        {selectedEventType && (
          <Card className="p-4 border-2 border-dashed">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Title"
                  value={formData.title || ''}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  required
                  placeholder="Enter event title"
                  error={!formData.title ? 'Title is required' : undefined}
                />
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    value={formData.startDate ? new Date(formData.startDate) : null}
                    onChange={(date) => handleFormChange('startDate', date?.toISOString().split('T')[0] || '')}
                    maxDate={new Date()}
                    required
                  />
                  {!formData.startDate && (
                    <p className="text-sm text-red-500">Start date is required</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <DatePicker
                    value={formData.endDate ? new Date(formData.endDate) : null}
                    onChange={(date) => handleFormChange('endDate', date?.toISOString().split('T')[0] || '')}
                    minDate={formData.startDate ? new Date(formData.startDate) : undefined}
                    maxDate={new Date()}
                  />
                </div>
                <Input
                  label="Location"
                  value={formData.location || ''}
                  onChange={(e) => handleFormChange('location', e.target.value)}
                  placeholder="City, Country"
                />
              </div>

              {selectedEventType === 'education' && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Institution"
                    value={formData.metadata?.institution || ''}
                    onChange={(e) => handleFormChange('metadata.institution', e.target.value)}
                    placeholder="School, University, etc."
                  />
                  <Input
                    label="Degree"
                    value={formData.metadata?.degree || ''}
                    onChange={(e) => handleFormChange('metadata.degree', e.target.value)}
                    placeholder="Bachelor's, Master's, etc."
                  />
                </div>
              )}

              {selectedEventType === 'work' && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Company"
                    value={formData.metadata?.company || ''}
                    onChange={(e) => handleFormChange('metadata.company', e.target.value)}
                    placeholder="Company or Organization"
                  />
                  <Input
                    label="Position"
                    value={formData.metadata?.position || ''}
                    onChange={(e) => handleFormChange('metadata.position', e.target.value)}
                    placeholder="Job Title or Role"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Add a brief description..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setFormData({});
                    setSelectedEventType(undefined);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="button"
                  onClick={handleFormSubmit}
                >
                  {selectedEvent ? 'Update' : 'Add'} Event
                </Button>
              </div>
            </div>
          </Card>
        )}

        {isLoading ? (
          <LoadingState />
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
      </div>

      {/* Timeline Preview Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Timeline Preview</h2>
        <TimelineView
          orgId={orgId}
          profileId={profileId}
          events={events}
          onEventClick={(event) => {
            // Handle event click if needed
            console.log('Event clicked:', event);
          }}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(null)}
        onConfirm={() => showDeleteConfirm && handleDeleteEvent(selectedEvent!)}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
      />
    </div>
  );
}; 