import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DragDropContext, Droppable, DropResult, DroppableProvided } from 'react-beautiful-dnd';
import { TimelineEvent, TimelineEntryType } from '../../types/profile';
import { useToast } from '../../hooks/useToast';
import { useAnalytics } from '../../hooks/useAnalytics';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { Icon } from '../ui/Icon';
import { TimelineMediaGallery } from '../media/TimelineMediaGallery';
import { Tooltip } from '../ui/Tooltip';
import { formatDistanceToNow } from 'date-fns';
import { TimelineEventCard } from './TimelineEventCard';
import { useInView } from 'react-intersection-observer';

const filterSchema = z.object({
  searchTerm: z.string().optional(),
  eventTypes: z.array(z.enum(['education', 'job', 'event'])).optional(),
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  importance: z.enum(['high', 'medium', 'low']).optional(),
});

type FilterFormData = z.infer<typeof filterSchema>;

interface TimelineViewProps {
  events: TimelineEvent[];
  onEventClick?: (event: TimelineEvent) => void;
  onEventEdit?: (event: TimelineEvent) => void;
  onEventDelete?: (eventId: string) => void;
  onEventReorder?: (events: TimelineEvent[]) => void;
  onMediaUpload?: (eventId: string, files: File[]) => Promise<void>;
  isLoading?: boolean;
  isEditable?: boolean;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  events,
  onEventClick,
  onEventEdit,
  onEventDelete,
  onEventReorder,
  onMediaUpload,
  isLoading = false,
  isEditable = false,
}) => {
  const [isFiltering, setIsFiltering] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const { showToast } = useToast();
  const { trackEvent } = useAnalytics();
  const { ref: timelineRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FilterFormData>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      eventTypes: ['education', 'job', 'event'],
    },
  });

  const filters = watch();

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Apply search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch =
          event.title.toLowerCase().includes(searchLower) ||
          event.description?.toLowerCase().includes(searchLower) ||
          event.location?.toLowerCase().includes(searchLower) ||
          (event.type === 'education' && event.metadata?.institution?.toLowerCase().includes(searchLower)) ||
          (event.type === 'job' && event.metadata?.company?.toLowerCase().includes(searchLower)) ||
          (event.metadata?.tags && event.metadata.tags.some((tag: string) => tag.toLowerCase().includes(searchLower)));
        if (!matchesSearch) return false;
      }

      // Apply event type filter
      if (filters.eventTypes?.length) {
        if (!filters.eventTypes.includes(event.type)) return false;
      }

      // Apply date range filter
      if (filters.dateRange?.start || filters.dateRange?.end) {
        const eventDate = new Date(event.startDate);
        if (filters.dateRange.start && eventDate < new Date(filters.dateRange.start)) return false;
        if (filters.dateRange.end && eventDate > new Date(filters.dateRange.end)) return false;
      }

      // Apply tags filter
      if (filters.tags?.length) {
        if (!event.metadata?.tags?.some((tag: string) => filters.tags?.includes(tag))) return false;
      }

      // Apply importance filter
      if (filters.importance) {
        if (event.metadata?.importance !== filters.importance) return false;
      }

      return true;
    });
  }, [events, filters]);

  const handleFilterSubmit = (data: FilterFormData) => {
    trackEvent('timeline_filter_applied', {
      filterCount: Object.keys(data).length,
      eventTypes: data.eventTypes,
      hasDateRange: !!(data.dateRange?.start || data.dateRange?.end),
      hasTags: !!data.tags?.length,
      hasImportance: !!data.importance,
    });
    setIsFiltering(false);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !onEventReorder) return;

    const reorderedEvents = Array.from(filteredEvents);
    const [removed] = reorderedEvents.splice(result.source.index, 1);
    reorderedEvents.splice(result.destination.index, 0, removed);

    onEventReorder(reorderedEvents);
    trackEvent('timeline_event_reordered', {
      eventId: result.draggableId,
      fromIndex: result.source.index,
      toIndex: result.destination.index,
    });
  };

  const getEventIcon = (type: TimelineEntryType) => {
    switch (type) {
      case 'education':
        return 'graduation-cap';
      case 'job':
        return 'briefcase';
      case 'event':
        return 'calendar';
      default:
        return 'circle';
    }
  };

  const getEventColor = (type: TimelineEntryType) => {
    switch (type) {
      case 'education':
        return 'blue';
      case 'job':
        return 'green';
      case 'event':
        return 'purple';
      default:
        return 'gray';
    }
  };

  const handleEventClick = (event: TimelineEvent) => {
    setExpandedEventId(expandedEventId === event.id ? null : event.id);
    onEventClick?.(event);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64" role="status" aria-label="Loading timeline">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <motion.div
      ref={timelineRef}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="space-y-6"
      role="region"
      aria-label="Timeline"
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Timeline
          </h2>
          <p className="text-gray-500 mt-1">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'} found
          </p>
        </div>
        <div className="flex space-x-2">
          <Tooltip content="Filter timeline events">
            <Button
              variant="outline"
              onClick={() => setIsFiltering(!isFiltering)}
              aria-expanded={isFiltering}
              aria-controls="timeline-filters"
              className="hover:bg-gray-50 transition-colors"
            >
              <Icon name="filter" className="mr-2" />
              Filter
            </Button>
          </Tooltip>
        </div>
      </div>

      <AnimatePresence>
        {isFiltering && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="bg-white rounded-lg shadow-lg p-6 border border-gray-100"
            id="timeline-filters"
            role="region"
            aria-label="Timeline filters"
          >
            <form onSubmit={handleSubmit(handleFilterSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="relative">
                    <Input
                      label="Search"
                      placeholder="Search events..."
                      {...register('searchTerm')}
                      error={errors.searchTerm?.message}
                      className="w-full pl-10"
                      aria-label="Search events"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Icon name="search" className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Types
                  </label>
                  <div className="flex flex-wrap gap-3" role="group" aria-label="Event type filters">
                    {(['education', 'job', 'event'] as const).map((type) => (
                      <label
                        key={type}
                        className="inline-flex items-center px-3 py-2 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          {...register('eventTypes')}
                          value={type}
                          className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                          aria-label={`Filter ${type} events`}
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <Input
                      label="Start Date"
                      type="date"
                      {...register('dateRange.start')}
                      error={errors.dateRange?.start?.message}
                      className="w-full pl-10"
                      aria-label="Filter events from date"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Icon name="calendar" className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  <div className="relative">
                    <Input
                      label="End Date"
                      type="date"
                      {...register('dateRange.end')}
                      error={errors.dateRange?.end?.message}
                      className="w-full pl-10"
                      aria-label="Filter events until date"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Icon name="calendar" className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Importance
                  </label>
                  <select
                    {...register('importance')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    aria-label="Filter by importance"
                  >
                    <option value="">All</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFiltering(false)}
                  className="hover:bg-gray-50"
                  aria-label="Cancel filtering"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  aria-label="Apply filters"
                >
                  Apply Filters
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="timeline">
          {(provided: DroppableProvided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="space-y-4"
              role="list"
              aria-label="Timeline events"
            >
              {filteredEvents.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100"
                  role="status"
                  aria-label="No events found"
                >
                  <Icon name="calendar" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    No events found. {isEditable && 'Try adding some events to your timeline.'}
                  </p>
                </motion.div>
              ) : (
                <AnimatePresence>
                  {filteredEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      role="listitem"
                    >
                      <TimelineEventCard
                        event={event}
                        index={index}
                        isEditable={isEditable}
                        isExpanded={expandedEventId === event.id}
                        onEventClick={handleEventClick}
                        onEventEdit={onEventEdit}
                        onEventDelete={onEventDelete}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </motion.div>
  );
}; 