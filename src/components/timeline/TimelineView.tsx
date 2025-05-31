import { useRef, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimeline } from '@/hooks/useTimeline';
import { TimelineEvent } from '@/types/profile';
import { formatDate } from '@/utils/date';

interface TimelineViewProps {
  orgId: string;
  profileId: string;
  onEventClick?: (event: TimelineEvent) => void;
}

export function TimelineView({ orgId, profileId, onEventClick }: TimelineViewProps) {
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  const {
    events,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
    isRefreshing,
  } = useTimeline({
    orgId,
    profileId,
  });

  // Load more when the user scrolls to the bottom
  const handleLoadMore = useCallback(() => {
    if (inView && hasMore && !isLoading) {
      loadMore();
    }
  }, [inView, hasMore, isLoading, loadMore]);

  // Group events by year
  const eventsByYear = events.reduce((acc, event) => {
    const year = new Date(event.startDate).getFullYear();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(event);
    return acc;
  }, {} as Record<number, TimelineEvent[]>);

  const years = Object.keys(eventsByYear).sort((a, b) => Number(b) - Number(a));

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h3 className="error-title">Error loading timeline</h3>
        <p className="error-message">{error.message}</p>
        <button
          className="retry-button"
          onClick={refresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Retrying...' : 'Try Again'}
        </button>
      </div>
    );
  }

  return (
    <div className="timeline-container">
      <AnimatePresence>
        {years.map((year) => (
          <motion.div
            key={year}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="year-section">
              <h2 className="year-header">{year}</h2>
              <div className="events-list">
                {eventsByYear[Number(year)].map((event) => (
                  <motion.div
                    key={event.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div
                      className="event-card"
                      onClick={() => onEventClick?.(event)}
                    >
                      <h3 className="event-title">{event.title}</h3>
                      <p className="event-date">
                        {formatDate(event.startDate)}
                        {event.endDate && ` - ${formatDate(event.endDate)}`}
                      </p>
                      {event.description && (
                        <p className="event-description">{event.description}</p>
                      )}
                      {event.location && (
                        <p className="event-location">📍 {event.location}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Loading indicator */}
      <div ref={loadMoreRef} className="loading-container">
        {isLoading && <div className="spinner" />}
        {!hasMore && events.length > 0 && (
          <p className="no-more-events">No more events to load</p>
        )}
        {!isLoading && events.length === 0 && (
          <p className="no-events">No events found</p>
        )}
      </div>

      <style jsx>{`
        .timeline-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          width: 100%;
        }

        .year-section {
          margin-bottom: 2rem;
        }

        .year-header {
          font-size: 1.5rem;
          font-weight: bold;
          color: #2d3748;
          margin-bottom: 1rem;
          position: sticky;
          top: 0;
          background: white;
          padding: 0.5rem 0;
          z-index: 1;
        }

        .events-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .event-card {
          padding: 1rem;
          background: white;
          border-radius: 0.375rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          cursor: ${onEventClick ? 'pointer' : 'default'};
        }

        .event-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1a202c;
        }

        .event-date {
          font-size: 0.875rem;
          color: #4a5568;
        }

        .event-description {
          margin-top: 0.5rem;
          color: #2d3748;
        }

        .event-location {
          margin-top: 0.25rem;
          font-size: 0.875rem;
          color: #4a5568;
        }

        .loading-container {
          padding: 1rem;
          text-align: center;
        }

        .spinner {
          width: 2rem;
          height: 2rem;
          border: 3px solid #e2e8f0;
          border-top-color: #4299e1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }

        .no-more-events,
        .no-events {
          color: #718096;
        }

        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          height: 200px;
          padding: 1rem;
        }

        .error-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .error-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #e53e3e;
          margin-bottom: 0.5rem;
        }

        .error-message {
          color: #4a5568;
          margin-bottom: 1rem;
        }

        .retry-button {
          padding: 0.5rem 1rem;
          background-color: #4299e1;
          color: white;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .retry-button:hover {
          background-color: #3182ce;
        }

        .retry-button:disabled {
          background-color: #a0aec0;
          cursor: not-allowed;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
} 