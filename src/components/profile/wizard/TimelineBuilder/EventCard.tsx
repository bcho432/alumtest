import React from 'react';
import { format } from 'date-fns';
import { LifeEvent } from '@/types/profile';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Tooltip } from '@/components/ui/Tooltip';

export interface EventCardProps {
  event: LifeEvent;
  onEdit?: (event: LifeEvent) => void;
  onDelete?: (eventId: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onEdit, onDelete }) => {
  const formatDate = (date: string | undefined) => {
    if (!date) return 'Present';
    return format(new Date(date), 'MMM yyyy');
  };

  const dateRange = event.endDate
    ? `${formatDate(event.startDate)} - ${formatDate(event.endDate)}`
    : `${formatDate(event.startDate)} - Present`;

  return (
    <Card variant="bordered">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <Icon
            name={event.type === 'education' ? 'school' : 'work'}
            className="text-gray-400"
          />
          <div>
            <h3 className="text-lg font-semibold">{event.title}</h3>
            {event.description && (
              <p className="mt-1 text-sm text-gray-600">{event.description}</p>
            )}
            {event.location && (
              <p className="mt-1 text-sm text-gray-500">{event.location}</p>
            )}
            <p className="mt-2 text-sm text-gray-500">{dateRange}</p>
          </div>
        </div>
        {(onEdit || onDelete) && (
          <div className="flex space-x-2">
            {onEdit && (
              <Tooltip content="Edit event">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(event)}
                >
                  <Icon name="edit" className="mr-1" />
                  Edit
                </Button>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip content="Delete event">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(event.id)}
                >
                  <Icon name="delete" className="mr-1" />
                  Delete
                </Button>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}; 