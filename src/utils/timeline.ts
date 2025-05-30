import { TimelineEntry } from '@/types/profile';

/**
 * Sorts timeline entries chronologically by start date
 * Entries without dates are placed at the end
 */
export const sortTimelineEntries = (entries: TimelineEntry[]): TimelineEntry[] => {
  return [...entries].sort((a, b) => {
    // Get the relevant date for comparison based on entry type
    const getDate = (entry: TimelineEntry): Date | null => {
      switch (entry.type) {
        case 'education':
        case 'job':
          return entry.startDate;
        case 'event':
          return entry.date;
        default:
          return null;
      }
    };

    const dateA = getDate(a);
    const dateB = getDate(b);

    // If either entry has no date, place it at the end
    if (!dateA) return 1;
    if (!dateB) return -1;

    // Sort by date (ascending)
    return dateA.getTime() - dateB.getTime();
  });
}; 