import React from 'react';
import { Draggable, DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Tooltip } from '../ui/Tooltip';
import { TimelineEvent } from '../../types/profile';
import { formatDistanceToNow } from 'date-fns';
import { TimelineMediaGallery } from '../media/TimelineMediaGallery';

interface TimelineEventCardProps {
  event: TimelineEvent;
  index: number;
  isEditable?: boolean;
  isExpanded?: boolean;
  onEventClick?: (event: TimelineEvent) => void;
  onEventEdit?: (event: TimelineEvent) => void;
  onEventDelete?: (eventId: string) => void;
}

export const TimelineEventCard: React.FC<TimelineEventCardProps> = ({
  event,
  index,
  isEditable = false,
  isExpanded = false,
  onEventClick,
  onEventEdit,
  onEventDelete,
}) => {
  const getEventIcon = (type: TimelineEvent['type']) => {
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

  const getEventColor = (type: TimelineEvent['type']) => {
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

  const getImportanceColor = (importance?: string) => {
    switch (importance) {
      case 'high':
        return 'red';
      case 'medium':
        return 'yellow';
      case 'low':
        return 'green';
      default:
        return 'gray';
    }
  };

  return (
    <Draggable draggableId={event.id} index={index} isDragDisabled={!isEditable}>
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            relative bg-white rounded-lg shadow-sm border border-gray-100
            ${snapshot.isDragging ? 'shadow-lg ring-2 ring-indigo-500' : ''}
            ${isExpanded ? 'ring-2 ring-indigo-500' : ''}
            hover:shadow-md transition-all duration-200
            cursor-pointer
            group
          `}
          onClick={() => onEventClick?.(event)}
          role="button"
          aria-expanded={isExpanded}
          aria-label={`${event.title} event details`}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="p-6"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    bg-${getEventColor(event.type)}-50 text-${getEventColor(event.type)}-600
                    shadow-sm
                    transition-colors duration-200
                    group-hover:bg-${getEventColor(event.type)}-100
                  `}
                  role="img"
                  aria-label={`${event.type} event icon`}
                >
                  <Icon name={getEventIcon(event.type)} className="w-6 h-6" />
                </motion.div>
              </div>

              <div className="flex-grow min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                      {event.title}
                    </h3>
                    {event.type === 'education' && event.metadata?.institution && (
                      <p className="text-sm text-gray-600 mt-1 group-hover:text-gray-700 transition-colors">
                        {event.metadata.institution}
                      </p>
                    )}
                    {event.type === 'job' && event.metadata?.company && (
                      <p className="text-sm text-gray-600 mt-1 group-hover:text-gray-700 transition-colors">
                        {event.metadata.company}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {event.metadata?.importance && (
                      <Badge
                        color={getImportanceColor(event.metadata.importance)}
                        className="capitalize"
                        aria-label={`Importance: ${event.metadata.importance}`}
                      >
                        {event.metadata.importance}
                      </Badge>
                    )}
                    {isEditable && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Tooltip content="Edit event">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventEdit?.(event);
                            }}
                            className="text-gray-500 hover:text-gray-700"
                            aria-label="Edit event"
                          >
                            <Icon name="pencil" className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Delete event">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventDelete?.(event.id);
                            }}
                            className="text-gray-500 hover:text-red-600"
                            aria-label="Delete event"
                          >
                            <Icon name="trash" className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Icon name="calendar" className="w-4 h-4" aria-hidden="true" />
                    <span>
                      {new Date(event.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-1">
                      <Icon name="map-pin" className="w-4 h-4" aria-hidden="true" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>

                {event.description && (
                  <p className="mt-3 text-gray-600 line-clamp-2 group-hover:text-gray-700 transition-colors">
                    {event.description}
                  </p>
                )}

                {event.metadata?.tags && event.metadata.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2" role="list" aria-label="Event tags">
                    {event.metadata.tags.map((tag: string) => (
                      <Badge key={tag} color="gray" className="text-xs" role="listitem">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <AnimatePresence>
                  {isExpanded && event.mediaUrls && event.mediaUrls.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-4"
                      role="region"
                      aria-label="Event media gallery"
                    >
                      <TimelineMediaGallery
                        mediaUrls={event.mediaUrls}
                        onUpload={undefined}
                        isEditable={false}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </Draggable>
  );
}; 