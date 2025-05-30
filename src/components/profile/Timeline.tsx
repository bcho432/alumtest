import React, { useState } from 'react';
import { format } from 'date-fns';
import { TimelineEntry, EducationEntry, JobEntry, EventEntry } from '@/types/profile';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { Spinner } from '@/components/ui/Spinner';
import { showToast } from '@/components/common/Toast';
import { TimelineService } from '@/services/TimelineService';

interface TimelineProps {
  entries: TimelineEntry[];
  profileId: string;
  isEditor?: boolean;
  onEntryDeleted?: (entryId: string) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  entries,
  profileId,
  isEditor = false,
  onEntryDeleted,
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const timelineService = new TimelineService();

  const handleDeleteClick = (entryId: string) => {
    setSelectedEntryId(entryId);
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedEntryId) return;

    setDeletingId(selectedEntryId);
    try {
      await timelineService.deleteTimelineEvent(profileId, selectedEntryId);
      onEntryDeleted?.(selectedEntryId);
      showToast({
        message: 'Entry deleted successfully',
        type: 'success',
        position: 'bottom-left',
      });
    } catch (error) {
      showToast({
        message: 'Failed to delete entry. Please try again.',
        type: 'error',
        position: 'bottom-left',
      });
    } finally {
      setDeletingId(null);
      setSelectedEntryId(null);
      setShowConfirmDialog(false);
    }
  };

  const formatDate = (date: Date) => {
    return format(date, 'MMM d, yyyy');
  };

  const getEntryTitle = (entry: TimelineEntry): string => {
    switch (entry.type) {
      case 'education':
        return `${entry.degree} at ${entry.institution}`;
      case 'job':
        return `${entry.title} at ${entry.company}`;
      case 'event':
        return entry.title;
      default:
        return 'Untitled';
    }
  };

  const getEntryDates = (entry: TimelineEntry): { start: Date; end?: Date } => {
    switch (entry.type) {
      case 'education':
      case 'job':
        return {
          start: entry.startDate,
          end: entry.endDate,
        };
      case 'event':
        return {
          start: entry.date,
        };
      default:
        return { start: new Date() };
    }
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No timeline entries yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => {
        const dates = getEntryDates(entry);
        return (
          <div
            key={entry.id}
            className="flex items-start justify-between p-4 bg-white rounded-lg shadow"
          >
            <div className="flex-1">
              <h3 className="font-semibold">{getEntryTitle(entry)}</h3>
              <p className="text-gray-600">
                {formatDate(dates.start)}
                {dates.end && ` - ${formatDate(dates.end)}`}
              </p>
            </div>
            {isEditor && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteClick(entry.id)}
                disabled={deletingId === entry.id}
              >
                {deletingId === entry.id ? (
                  <Spinner size="sm" />
                ) : (
                  'Delete'
                )}
              </Button>
            )}
          </div>
        );
      })}

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={handleConfirmDelete}
              disabled={deletingId !== null}
            >
              {deletingId ? <Spinner size="sm" /> : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Timeline; 