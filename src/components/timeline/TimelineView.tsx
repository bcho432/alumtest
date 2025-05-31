import React from 'react';
import { format } from 'date-fns';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { LifeEvent } from '@/types/profile';

interface TimelineViewProps {
  orgId?: string;
  profileId?: string;
  events?: LifeEvent[];
  onEventClick?: (event: LifeEvent) => void;
}

export function TimelineView({ orgId, profileId, events, onEventClick }: TimelineViewProps) {
  // Group events by year
  const groupedEvents = React.useMemo(() => {
    if (!events) return {};
    
    return events.reduce((acc, event) => {
      const year = new Date(event.startDate).getFullYear();
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(event);
      return acc;
    }, {} as Record<number, LifeEvent[]>);
  }, [events]);

  // Sort years in descending order
  const sortedYears = React.useMemo(() => {
    return Object.keys(groupedEvents)
      .map(Number)
      .sort((a, b) => b - a);
  }, [groupedEvents]);

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No events to display
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {sortedYears.map((year) => (
        <div key={year} className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">{year}</h3>
          <div className="space-y-4">
            {groupedEvents[year].map((event) => (
              <Card
                key={event.id}
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => onEventClick?.(event)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
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
                  </div>
                  <div className="flex-grow">
                    <h4 className="text-lg font-semibold">{event.title}</h4>
                    <div className="mt-1 text-sm text-gray-500">
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
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 