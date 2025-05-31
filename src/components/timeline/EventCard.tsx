import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { format } from 'date-fns';
import { LifeEvent } from '@/types/profile';

interface EventCardProps {
  event: LifeEvent;
  onEdit?: (event: LifeEvent) => void;
  onDelete?: (event: LifeEvent) => void;
}

export function EventCard({ event, onEdit, onDelete }: EventCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Icon
            name={
              event.type === 'education'
                ? 'graduation-cap'
                : event.type === 'work'
                ? 'briefcase'
                : 'calendar'
            }
            className="text-gray-500"
          />
          <h3 className="text-lg font-semibold">{event.title}</h3>
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(event)}
            >
              <Icon name="pencil" className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(event)}
            >
              <Icon name="trash" className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="mt-2 text-sm text-gray-500">
        {format(new Date(event.startDate), 'MMM yyyy')}
        {event.endDate && ` - ${format(new Date(event.endDate), 'MMM yyyy')}`}
      </div>
      {event.location && (
        <div className="mt-1 text-sm text-gray-500">
          📍 {event.location}
        </div>
      )}
      {event.description && (
        <p className="mt-2 text-sm text-gray-600">{event.description}</p>
      )}
      {event.metadata && (
        <div className="mt-2 text-sm text-gray-500">
          {event.metadata.institution && (
            <div>🏫 {event.metadata.institution}</div>
          )}
          {event.metadata.degree && (
            <div>🎓 {event.metadata.degree}</div>
          )}
          {event.metadata.company && (
            <div>🏢 {event.metadata.company}</div>
          )}
          {event.metadata.position && (
            <div>👔 {event.metadata.position}</div>
          )}
        </div>
      )}
    </Card>
  );
} 