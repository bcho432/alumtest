import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { EventCard } from './EventCard';
import { EventForm } from './EventForm';
import { LifeEvent, TimelineBuilderProps } from '@/types/profile';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useTimelineEvents } from '@/hooks/useTimelineEvents';
import { useTimelineAutoSave } from '@/hooks/useTimelineAutoSave';
import { Alert } from '@/components/ui/Alert';
import { LoadingState } from '@/components/ui/LoadingState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Tooltip } from '@/components/ui/Tooltip';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { format } from 'date-fns';
import { useTimeline } from '@/hooks/useTimeline';
import { TimelineEvent } from '@/types/profile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';

interface ExtendedTimelineBuilderProps extends TimelineBuilderProps {
  orgId: string;
  profileId: string;
  isEditMode?: boolean;
  isPreview?: boolean;
}

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
  const [selectedEvent, setSelectedEvent] = useState<LifeEvent | null>(null);
  const [localEvents, setLocalEvents] = useState<LifeEvent[]>(initialEvents);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const {
    events: fetchedEvents,
    isLoading,
    error,
    refetch
  } = useTimelineEvents({
    orgId,
    profileId,
  });

  const events = isEditMode ? fetchedEvents : localEvents;

  const { isSaving, lastSavedAt } = useTimelineAutoSave({
    orgId,
    profileId,
    events,
  });

  const handleDragEnd = useCallback(
    (result: any) => {
      if (!result.destination) return;

      const items = Array.from(events);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      setLocalEvents(items);
      onEventsChange?.(items);
    },
    [events, onEventsChange]
  );

  const handleAddEvent = useCallback(() => {
    setSelectedEvent(null);
    setIsFormOpen(true);
  }, []);

  const handleEditEvent = useCallback((event: LifeEvent) => {
    setSelectedEvent(event);
    setIsFormOpen(true);
  }, []);

  const handleDeleteEvent = useCallback(
    (eventId: string) => {
      setShowDeleteConfirm(eventId);
    },
    []
  );

  const confirmDelete = useCallback(
    (eventId: string) => {
      const updatedEvents = events.filter((event) => event.id !== eventId);
      setLocalEvents(updatedEvents);
      onEventsChange?.(updatedEvents);
      setShowDeleteConfirm(null);
    },
    [events, onEventsChange]
  );

  const handleFormSubmit = useCallback(
    (eventData: Omit<LifeEvent, 'id'>) => {
      if (selectedEvent) {
        const updatedEvents = events.map((event) =>
          event.id === selectedEvent.id ? { ...eventData, id: event.id } : event
        );
        setLocalEvents(updatedEvents);
        onEventsChange?.(updatedEvents);
      } else {
        const newEvent = {
          ...eventData,
          id: crypto.randomUUID(),
        };
        const updatedEvents = [...events, newEvent];
        setLocalEvents(updatedEvents);
        onEventsChange?.(updatedEvents);
      }
      setIsFormOpen(false);
      setSelectedEvent(null);
    },
    [events, onEventsChange, selectedEvent]
  );

  const handleFormCancel = useCallback(() => {
    setIsFormOpen(false);
    setSelectedEvent(null);
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      ctrlKey: true,
      action: handleAddEvent,
      description: 'Add new event',
    },
    {
      key: 's',
      ctrlKey: true,
      action: () => refetch(),
      description: 'Save changes',
    },
  ]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <LoadingState message="Loading timeline..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        title="Failed to load timeline"
        message={error.message}
        action={{
          label: 'Retry',
          onClick: refetch,
        }}
      />
    );
  }

  if (!events?.length) {
    return (
      <div className="text-center text-gray-500 py-8">
        No timeline events found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Timeline Builder</h2>
          {isEditMode && lastSavedAt && (
            <p className="text-sm text-gray-500 mt-1">
              Last saved {format(lastSavedAt, 'h:mm a')}
              {isSaving && ' (Saving...)'}
            </p>
          )}
        </div>
        <Tooltip content="Add new event (Ctrl+N)">
          <Button
            onClick={handleAddEvent}
            className="flex items-center space-x-2"
          >
            <Icon name="add" className="w-5 h-5" />
            <span>Add Event</span>
          </Button>
        </Tooltip>
      </div>

      {isSaving && (
        <LoadingState message="Saving changes..." />
      )}

      {isFormOpen && (
        <EventForm
          initialData={selectedEvent ?? undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}

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
                  isDragDisabled={!isEditMode}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <EventCard
                        event={event}
                        onEdit={isEditMode ? handleEditEvent : undefined}
                        onDelete={isEditMode ? handleDeleteEvent : undefined}
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

      <div className="flex justify-end pt-6">
        <Button onClick={onNext} disabled={events.length === 0}>
          Next Step
        </Button>
      </div>

      <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => showDeleteConfirm && confirmDelete(showDeleteConfirm)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface TimelineEventCardProps {
  event: TimelineEvent;
  isPreview?: boolean;
}

const TimelineEventCard: React.FC<TimelineEventCardProps> = ({ event, isPreview = false }) => {
  let title = '';
  let subtitle = '';
  let description = '';
  let colorClass = '';

  switch (event.type) {
    case 'education': {
      const degree = event.metadata?.degree ?? '';
      const institution = event.metadata?.institution ?? '';
      title = degree || institution ? `${degree}${institution ? ' at ' + institution : ''}` : ((event.title as string | undefined) ?? 'Education');
      subtitle = String((event.startDate as string | Date | undefined) ?? '');
      colorClass = 'bg-blue-100 text-blue-800';
      description = (event.description as string | undefined) ?? '';
      break;
    }
    case 'job': {
      const company = event.metadata?.company ?? '';
      title = ((event.title as string | undefined) ?? 'Job') + (company ? ' at ' + company : '');
      subtitle = String((event.startDate as string | Date | undefined) ?? '');
      colorClass = 'bg-green-100 text-green-800';
      description = (event.description as string | undefined) ?? '';
      break;
    }
    case 'event':
      title = (event.title as string | undefined) ?? 'Event';
      subtitle = String((event.startDate as string | Date | undefined) ?? '');
      description = (event.description as string | undefined) ?? '';
      colorClass = 'bg-purple-100 text-purple-800';
      break;
    default:
      title = (event.title as string | undefined) ?? 'Timeline Event';
      colorClass = 'bg-gray-100 text-gray-800';
      description = (event.description as string | undefined) ?? '';
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{title || 'Untitled'}</h3>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>{event.type}</span>
      </div>
    </div>
  );
}; 